# -*- coding: utf-8 -*-
"""Langfuse tracing — singleton client initialised from .env.

Import after config (which calls load_dotenv) so env vars are already set.
If LANGFUSE_SECRET_KEY is absent the client operates in a no-op mode.
"""
from __future__ import annotations

import os
import re
from typing import Any

from log_config import get_logger

logger = get_logger(__name__)

_client = None
_initialised = False

_PHONE_RE = re.compile(r"(?<!\d)(?:\+?86[- ]?)?1[3-9]\d{9}(?!\d)")
_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
_NAME_KEYS = {"name", "姓名", "contact_name"}
_PHONE_KEYS = {"phone", "mobile", "tel", "手机号", "电话"}
_EMAIL_KEYS = {"email", "邮箱"}


def get_langfuse():
    """Return the Langfuse client singleton, or None if not configured."""
    global _client, _initialised
    if _initialised:
        return _client

    _initialised = True
    secret_key = os.getenv("LANGFUSE_SECRET_KEY", "")
    if not secret_key:
        logger.info("langfuse.disabled  (LANGFUSE_SECRET_KEY not set)")
        return None

    try:
        # Import here so the module loads even when langfuse is not installed
        from langfuse import Langfuse  # noqa: PLC0415

        _client = Langfuse(
            secret_key=secret_key,
            public_key=os.getenv("LANGFUSE_PUBLIC_KEY", ""),
            host=os.getenv("LANGFUSE_BASE_URL", "https://cloud.langfuse.com"),
        )
        logger.info("langfuse.enabled  host=%s", os.getenv("LANGFUSE_BASE_URL"))
    except Exception as exc:
        logger.warning("langfuse.init_failed  %s", exc)
        _client = None

    return _client


def pii_enabled() -> bool:
    """Whether to redact PII before sending payloads to Langfuse."""
    return os.getenv("LANGFUSE_REDACT_PII", "true").lower() not in {"0", "false", "no"}


def redact_text(text: str) -> str:
    """Mask common phone and email patterns before observability export."""
    if not pii_enabled() or not text:
        return text
    text = _PHONE_RE.sub("[phone]", text)
    return _EMAIL_RE.sub("[email]", text)


def redact_payload(payload: Any) -> Any:
    """Recursively redact user payloads while keeping analytics structure."""
    if not pii_enabled():
        return payload
    if isinstance(payload, str):
        return redact_text(payload)
    if isinstance(payload, list):
        return [redact_payload(i) for i in payload]
    if isinstance(payload, tuple):
        return tuple(redact_payload(i) for i in payload)
    if isinstance(payload, dict):
        out = {}
        for key, value in payload.items():
            k = str(key)
            if k in _PHONE_KEYS:
                out[key] = "[phone]" if value else value
            elif k in _EMAIL_KEYS:
                out[key] = "[email]" if value else value
            elif k in _NAME_KEYS:
                out[key] = "[name]" if value else value
            else:
                out[key] = redact_payload(value)
        return out
    return payload


def trace_id_from_observation(observation: object | None) -> str | None:
    """Best-effort extraction of trace_id across Langfuse SDK versions."""
    if observation is None:
        return None
    for attr in ("trace_id", "traceId", "id"):
        value = getattr(observation, attr, None)
        if value:
            return str(value)
    return None


def trace_url(trace_id: str | None) -> str | None:
    """Build a Langfuse trace URL for business-side detail pages."""
    if not trace_id:
        return None
    host = os.getenv("LANGFUSE_BASE_URL", "https://cloud.langfuse.com").rstrip("/")
    project_id = os.getenv("LANGFUSE_PROJECT_ID", "")
    if project_id:
        return f"{host}/project/{project_id}/traces/{trace_id}"
    return f"{host}/trace/{trace_id}"


def score_trace(
    trace_id: str | None,
    name: str,
    value: float | int | str,
    *,
    comment: str | None = None,
    metadata: dict | None = None,
) -> None:
    """Create a Langfuse score without coupling business code to SDK details."""
    lf = get_langfuse()
    if not lf or not trace_id:
        return

    payload = {
        "trace_id": trace_id,
        "name": name,
        "value": value,
    }
    if comment:
        payload["comment"] = redact_text(comment)
    if metadata:
        payload["metadata"] = redact_payload(metadata)

    for method_name in ("create_score", "score"):
        method = getattr(lf, method_name, None)
        if not method:
            continue
        try:
            method(**payload)
            return
        except TypeError:
            try:
                camel_payload = {
                    "traceId": payload["trace_id"],
                    "name": payload["name"],
                    "value": payload["value"],
                }
                if comment:
                    camel_payload["comment"] = payload["comment"]
                if metadata:
                    camel_payload["metadata"] = payload["metadata"]
                method(**camel_payload)
                return
            except Exception as exc:
                logger.debug("langfuse.score_failed name=%s method=%s err=%s", name, method_name, exc)
        except Exception as exc:
            logger.debug("langfuse.score_failed name=%s method=%s err=%s", name, method_name, exc)


def start_observation_safe(
    name: str,
    *,
    as_type: str = "span",
    input: Any = None,
    metadata: dict | None = None,
):
    """Open a Langfuse observation, returning None on any SDK/runtime issue."""
    lf = get_langfuse()
    if not lf:
        return None
    try:
        return lf.start_observation(
            name=name,
            as_type=as_type,
            input=redact_payload(input),
            metadata=redact_payload(metadata or {}),
        )
    except Exception as exc:
        logger.debug("langfuse.observation_start_failed name=%s err=%s", name, exc)
        return None


def update_observation_safe(
    observation: object | None,
    *,
    output: Any = None,
    metadata: dict | None = None,
    level: str | None = None,
    status_message: str | None = None,
    end: bool = False,
) -> None:
    """Update/end an observation without letting observability break chat."""
    if not observation:
        return
    try:
        kwargs: dict[str, Any] = {}
        if output is not None:
            kwargs["output"] = redact_payload(output)
        if metadata is not None:
            kwargs["metadata"] = redact_payload(metadata)
        if level:
            kwargs["level"] = level
        if status_message:
            kwargs["status_message"] = redact_text(status_message)
        if kwargs:
            observation.update(**kwargs)
        if end:
            observation.end()
    except Exception as exc:
        logger.debug("langfuse.observation_update_failed err=%s", exc)


def flush() -> None:
    """Flush pending events — call on server shutdown."""
    lf = get_langfuse()
    if lf:
        try:
            lf.flush()
        except Exception:
            pass
