# -*- coding: utf-8 -*-
"""Agent orchestrator — spawns and wires the two agents, drives the SSE stream.

Responsibilities:
  1. Spawn AnalysisAgent (background asyncio Task) for each new session
  2. Spawn MainAgent (Anvil助手) after AnalysisAgent is ready
  3. Route each user turn: AI path vs. human-serving path
  4. Inject operator-side history back into the main agent on AI resume
  5. Convert AgentScope reply_stream events → SSE-ready dicts

Special tool-result prefixes that become typed SSE events:
  __FORM__:{...}      → form_show
  __CONFIRM__:{...}   → confirm_show
  __HANDOFF__:{...}   → handoff
"""
from __future__ import annotations

import asyncio
import json
import random
import time
import traceback
from typing import AsyncGenerator

from agentscope.message import UserMsg, AssistantMsg
from agentscope.event import (
    TextBlockDeltaEvent,
    TextBlockEndEvent,
    ToolCallStartEvent,
    ToolCallDeltaEvent,
    ToolCallEndEvent,
    ToolResultTextDeltaEvent,
    ToolResultEndEvent,
    ReplyEndEvent,
    ThinkingBlockDeltaEvent,
)

from log_config import get_logger
from config import settings
from session_store import Session
from agents import create_main_agent, AnalysisAgent
from langfuse_tracing import (
    get_langfuse,
    redact_payload,
    score_trace,
    trace_id_from_observation,
    trace_url,
)

logger = get_logger(__name__)


# ── Agent bootstrap ───────────────────────────────────────────────────────────

def get_or_create_agents(session: Session) -> None:
    """Spawn AnalysisAgent then MainAgent for a session (idempotent)."""
    if session.agent is not None:
        return

    # AnalysisAgent must be spawned first: MainAgent's toolkit closure references it
    analysis_ag = AnalysisAgent(session)
    session.analysis_agent = analysis_ag
    session.analysis_task = asyncio.create_task(analysis_ag.run_loop())
    logger.info("analysis_agent.spawned sid=%s", session.session_id[:8])

    create_main_agent(session)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_special_event(text: str) -> dict | None:
    for prefix, sse_type in [
        ("__FORM__:", "form_show"),
        ("__CONFIRM__:", "confirm_show"),
        ("__HANDOFF__:", "handoff"),
    ]:
        if text.startswith(prefix):
            try:
                data = json.loads(text[len(prefix):])
                return {"type": sse_type, "data": data}
            except json.JSONDecodeError:
                pass
    return None


def _needs_rag(message: str) -> bool:
    """Heuristic for product/facts questions that should be grounded in KB."""
    if message.startswith("__"):
        return False
    keywords = [
        "价格", "多少钱", "费用", "套餐", "版本", "功能", "支持", "部署",
        "api", "API", "集成", "对接", "产品", "方案", "限制", "规格",
        "pricing", "price", "feature", "plan",
    ]
    return any(k in message for k in keywords)


async def _inject_operator_history(session: Session) -> None:
    """Inject operator-side messages into the main agent context on AI resume."""
    agent = session.agent
    if agent is None:
        return
    pending = [m for m in session.chat_log if m.idx >= session._injected_up_to]
    if not pending:
        return

    msgs_to_inject = []
    for m in pending:
        if m.role == "user":
            msgs_to_inject.append(UserMsg(name="user", content=m.content))
        elif m.role == "operator":
            msgs_to_inject.append(AssistantMsg(name="人工客服", content=m.content))

    if msgs_to_inject:
        await agent.observe(msgs_to_inject)

    session._injected_up_to = pending[-1].idx + 1


# ── Main turn stream ──────────────────────────────────────────────────────────

async def stream_turn(
    session: Session,
    user_message: str,
) -> AsyncGenerator[dict, None]:
    """Process one conversation turn, yielding SSE-ready event dicts."""

    # ── Langfuse: open root trace span ───────────────────────────────────────
    lf = get_langfuse()
    root_span = None
    trace_id = None
    trace_link = None
    _trace_ended = False
    should_trace = bool(lf) and random.random() <= max(0.0, min(1.0, settings.LANGFUSE_TRACE_SAMPLE_RATE))
    turn_started_at = time.time()
    if should_trace:
        try:
            from langfuse import propagate_attributes  # noqa: PLC0415
            _visible_input = user_message if not user_message.startswith("__") else "[internal-event]"
            with propagate_attributes(
                session_id=session.session_id,
                user_id=session.visitor_id or "anonymous",
                tags=[session.user_type, "agent-backend"],
                trace_name="chat-turn",
            ):
                root_span = lf.start_observation(
                    name="chat-turn",
                    as_type="span",
                    input=redact_payload({"message": _visible_input}),
                    metadata=redact_payload({
                        "model": settings.LLM_MODEL,
                        "session_id": session.session_id,
                        "visitor_id": session.visitor_id,
                        "user_type": session.user_type,
                        "member_id_present": bool(session.member_id),
                        "turn_seq": len(session.turn_log),
                        "message_count": len(session.chat_log),
                        "human_serving": session.human_serving,
                        "lead_submitted": session.lead_submitted,
                        "final_intent_level": (session.analysis or {}).get("intent_level"),
                        "trace_sample_rate": settings.LANGFUSE_TRACE_SAMPLE_RATE,
                    }),
                )
                trace_id = trace_id_from_observation(root_span)
                trace_link = trace_url(trace_id)
        except Exception as _lf_err:
            logger.debug("langfuse.span_open_failed %s", _lf_err)
            root_span = None

    def _end_trace(output: dict | None = None, error: str | None = None) -> None:
        nonlocal _trace_ended
        if root_span and not _trace_ended:
            _trace_ended = True
            try:
                root_span.update(
                    output=redact_payload(output),
                    level="ERROR" if error else "DEFAULT",
                    status_message=error,
                )
                root_span.end()
            except Exception:
                pass

    tool_spans: dict[str, object] = {}

    # Human-serving path: store message, notify analysis agent, done
    if session.human_serving:
        if not user_message.startswith("__"):
            session.add_message("user", user_message)
            if session.analysis_agent:
                session.analysis_agent.notify()
        score_trace(trace_id, "answer_success", 1, metadata={"path": "human_serving"})
        score_trace(trace_id, "handoff_quality", 1, metadata={"path": "human_serving"})
        _end_trace(output={"path": "human_serving"})
        yield {"type": "message_stored"}
        yield {"type": "done"}
        return

    # AI path: ensure both agents exist, then inject any operator-period history
    get_or_create_agents(session)
    await _inject_operator_history(session)

    # Decode special-prefix messages from the frontend
    message_text = user_message
    if user_message.startswith("__FORM_DATA__:"):
        try:
            form_data = json.loads(user_message[len("__FORM_DATA__:"):])
            session.lead_draft.update(form_data)
            if {"name", "phone"}.issubset(k for k, v in form_data.items() if v):
                session.lead_submitted = True
                yield {"type": "lead_captured", "data": form_data}
                message_text = (
                    f"用户已提交联系信息：姓名={form_data.get('name')}，"
                    f"手机={form_data.get('phone')}，"
                    f"邮箱={form_data.get('email', '')}，"
                    f"公司={form_data.get('company', '')}。"
                    "请确认信息已收到，并告知后续步骤。"
                )
            else:
                message_text = (
                    f"用户提交了部分联系信息：{form_data}，"
                    "必填项（姓名、手机）未完整，请继续引导。"
                )
        except Exception:
            message_text = user_message

    elif user_message.startswith("__CONFIRM_CHOICE__:"):
        try:
            choice = json.loads(user_message[len("__CONFIRM_CHOICE__:"):])
            message_text = (
                f"[确认选择·{choice.get('step_id', '')}] "
                f"用户选择了：{choice.get('selected', '')}"
            )
        except Exception:
            message_text = user_message

    else:
        session.add_message("user", user_message)
        if session.analysis_agent:
            session.analysis_agent.notify()

    msg = UserMsg(name="user", content=message_text)

    tool_result_buffers: dict[str, str] = {}
    tool_args_buffers: dict[str, str] = {}
    agent_text_buf: list[str] = []
    thinking_active = False
    tool_stats = {"total": 0, "success": 0, "failed": 0}
    rag_stats = {"called": False, "hit": None, "query": None}

    # Per-turn rich log for operator panel
    current_turn: dict = {
        "seq": len(session.turn_log),
        "trace_id": trace_id,
        "trace_url": trace_link,
        "user_msg": user_message if not user_message.startswith("__") else "",
        "user_msg_idx": None,
        "thinking": "",
        "tool_calls": [],
        "agent_reply": "",
        "special_events": [],
        "quality_scores": {},
        "latency_ms": None,
    }
    for m in reversed(session.chat_log):
        if m.role == "user":
            current_turn["user_msg_idx"] = m.idx
            break
    _turn_tools: dict[str, dict] = {}

    def _save_turn(reply: str = "") -> None:
        current_turn["agent_reply"] = reply
        current_turn["latency_ms"] = int((time.time() - turn_started_at) * 1000)
        session.turn_log.append(current_turn)

    def _emit_quality_scores(reply: str = "", exit_via: str | None = None, error: str | None = None) -> None:
        rag_needed = _needs_rag(user_message)
        tool_success_rate = (
            tool_stats["success"] / tool_stats["total"]
            if tool_stats["total"] else 1.0
        )
        scores = {
            "answer_success": 0 if error else int(bool(reply or exit_via == "human_serving")),
            "tool_success": round(tool_success_rate, 4),
            "rag_called_when_needed": 1 if (not rag_needed or rag_stats["called"]) else 0,
        }
        if rag_stats["called"]:
            scores["rag_has_hit"] = 1 if rag_stats["hit"] else 0
        if exit_via == "form_show":
            scores["lead_progression"] = 1
        if exit_via == "handoff":
            scores["handoff_quality"] = 1
        current_turn["quality_scores"] = scores

        for name, value in scores.items():
            score_trace(
                trace_id,
                name,
                value,
                metadata={
                    "turn_seq": current_turn["seq"],
                    "rag_needed": rag_needed,
                    "rag_called": rag_stats["called"],
                    "rag_hit": rag_stats["hit"],
                    "tool_total": tool_stats["total"],
                    "exit_via": exit_via,
                },
            )

    try:
        async for event in session.agent.reply_stream(msg):
            if isinstance(event, ThinkingBlockDeltaEvent):
                thinking_active = True
                current_turn["thinking"] += event.delta
                yield {"type": "thinking_delta", "delta": event.delta}

            elif isinstance(event, TextBlockDeltaEvent):
                if thinking_active:
                    thinking_active = False
                    yield {"type": "thinking_end"}
                agent_text_buf.append(event.delta)
                yield {"type": "text_delta", "delta": event.delta}

            elif isinstance(event, TextBlockEndEvent):
                yield {"type": "text_end"}

            elif isinstance(event, ToolCallStartEvent):
                if thinking_active:
                    thinking_active = False
                    yield {"type": "thinking_end"}
                tool_args_buffers[event.tool_call_id] = ""
                tool_stats["total"] += 1
                tc = {"id": event.tool_call_id, "tool": event.tool_call_name,
                      "args": "", "result": "", "type": "normal", "data": None}
                current_turn["tool_calls"].append(tc)
                _turn_tools[event.tool_call_id] = tc
                # Langfuse: open a child span for this tool call
                if root_span:
                    try:
                        tool_spans[event.tool_call_id] = root_span.start_observation(
                            name=f"tool/{event.tool_call_name}",
                            as_type="tool",
                            input=redact_payload({"tool": event.tool_call_name}),
                            metadata={"turn_seq": current_turn["seq"]},
                        )
                    except Exception:
                        pass
                yield {"type": "tool_start", "tool": event.tool_call_name, "id": event.tool_call_id}

            elif isinstance(event, ToolCallDeltaEvent):
                tool_args_buffers[event.tool_call_id] = (
                    tool_args_buffers.get(event.tool_call_id, "") + event.delta
                )

            elif isinstance(event, ToolCallEndEvent):
                tid = event.tool_call_id
                args_str = tool_args_buffers.pop(tid, "")
                if args_str and tid in _turn_tools:
                    _turn_tools[tid]["args"] = args_str
                    # Langfuse: update tool span with parsed args
                    if tid in tool_spans:
                        try:
                            tool_spans[tid].update(input=redact_payload({"tool": _turn_tools[tid]["tool"], "args": args_str[:500]}))
                        except Exception:
                            pass
                if args_str:
                    yield {"type": "tool_args", "args": args_str, "id": tid}

            elif isinstance(event, ToolResultTextDeltaEvent):
                tid = event.tool_call_id
                tool_result_buffers[tid] = tool_result_buffers.get(tid, "") + event.delta

            elif isinstance(event, ToolResultEndEvent):
                tid = event.tool_call_id
                result_text = tool_result_buffers.pop(tid, "").strip()
                tool_name = _turn_tools.get(tid, {}).get("tool", "")
                is_tool_success = bool(result_text) and "出错" not in result_text and "error" not in result_text.lower()
                if is_tool_success:
                    tool_stats["success"] += 1
                else:
                    tool_stats["failed"] += 1
                if tool_name == "rag_search":
                    rag_stats["called"] = True
                    rag_stats["hit"] = bool(result_text) and "未找到" not in result_text and "暂无内容" not in result_text
                    rag_stats["query"] = _turn_tools.get(tid, {}).get("args")
                score_trace(
                    trace_id,
                    "tool_success",
                    1 if is_tool_success else 0,
                    metadata={"tool": tool_name, "turn_seq": current_turn["seq"]},
                )
                # Langfuse: close the tool span with its result
                _ts = tool_spans.pop(tid, None)
                if _ts:
                    try:
                        _ts.update(output=redact_payload({"result": result_text[:500] if result_text else None}))
                        _ts.end()
                    except Exception:
                        pass
                special = _parse_special_event(result_text)
                if special:
                    if special["type"] == "handoff":
                        session.human_serving = True
                        if session.analysis_agent:
                            session.analysis_agent.notify()
                        score_trace(trace_id, "handoff_quality", 1, metadata={"turn_seq": current_turn["seq"]})
                    if tid in _turn_tools:
                        _turn_tools[tid]["type"] = special["type"]
                        _turn_tools[tid]["data"] = special.get("data")
                    current_turn["special_events"].append(special)
                    yield special
                    if special["type"] in ("confirm_show", "form_show"):
                        full_reply = "".join(agent_text_buf).strip()
                        _emit_quality_scores(full_reply, exit_via=special["type"])
                        _save_turn(full_reply)
                        if full_reply:
                            session.add_message("agent", full_reply)
                            session._injected_up_to = session._msg_idx
                        _end_trace(output={"reply": full_reply, "exit_via": special["type"], "quality_scores": current_turn["quality_scores"]})
                        yield {"type": "done"}
                        return
                elif result_text:
                    if tid in _turn_tools:
                        _turn_tools[tid]["result"] = result_text
                    yield {"type": "tool_result", "text": result_text, "id": tid}

            elif isinstance(event, ReplyEndEvent):
                full_reply = "".join(agent_text_buf).strip()
                exit_via = "handoff" if any(e.get("type") == "handoff" for e in current_turn["special_events"]) else None
                _emit_quality_scores(full_reply, exit_via=exit_via)
                _save_turn(full_reply)
                if full_reply:
                    session.add_message("agent", full_reply)
                    session._injected_up_to = session._msg_idx
                _end_trace(output={"reply": full_reply[:2000], "quality_scores": current_turn["quality_scores"]})
                yield {"type": "done"}
                return

    except Exception:
        logger.error("stream_turn exception\n%s", traceback.format_exc())
        _emit_quality_scores(error=traceback.format_exc()[-300:])
        _end_trace(error=traceback.format_exc()[-300:])
        yield {"type": "error", "message": "Agent 处理出错，请稍后重试。"}
        yield {"type": "done"}
    finally:
        # Clean up any tool spans that were never closed (e.g. generator abandoned mid-stream)
        for _ts in tool_spans.values():
            try:
                _ts.end()
            except Exception:
                pass
        _end_trace()  # no-op if already ended
