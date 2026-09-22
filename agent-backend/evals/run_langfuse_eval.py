#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Replay local evaluation samples against agent-backend and score results.

This is the first production-friendly evaluation loop:
  1. Create a backend session.
  2. Stream one chat turn.
  3. Inspect emitted SSE events and stored turn logs.
  4. Compute simple rule scores for P0 gates.
  5. Optionally write scores to Langfuse when trace_id is available.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from langfuse_tracing import score_trace  # noqa: E402


def _parse_sse_line(line: str) -> dict[str, Any] | None:
    if not line.startswith("data: "):
        return None
    try:
        return json.loads(line[len("data: "):])
    except json.JSONDecodeError:
        return None


def _score_sample(sample: dict[str, Any], events: list[dict[str, Any]], turn: dict[str, Any] | None) -> dict[str, float]:
    reply = "".join(e.get("delta", "") for e in events if e.get("type") == "text_delta")
    tool_names = [tc.get("tool") for tc in (turn or {}).get("tool_calls", [])]
    expected_tools = sample.get("expected_tools", [])
    expected_keywords = sample.get("expected_keywords", [])
    tool_score = 1.0 if all(tool in tool_names for tool in expected_tools) else 0.0
    keyword_score = (
        1.0
        if not expected_keywords
        else sum(1 for kw in expected_keywords if kw.lower() in reply.lower()) / len(expected_keywords)
    )
    rag_called = 1.0 if "rag_search" in tool_names else 0.0
    answer_success = 1.0 if reply.strip() else 0.0
    return {
        "answer_success": answer_success,
        "expected_tool_coverage": round(tool_score, 4),
        "expected_keyword_coverage": round(keyword_score, 4),
        "rag_called": rag_called,
        "overall": round((answer_success + tool_score + keyword_score) / 3, 4),
    }


def run_sample(client: httpx.Client, base_url: str, sample: dict[str, Any]) -> dict[str, Any]:
    session_resp = client.post(
        f"{base_url}/api/sessions",
        json={"visitor_id": f"eval-{sample['id']}", "user_type": "anonymous"},
    )
    session_resp.raise_for_status()
    session_id = session_resp.json()["session_id"]

    events: list[dict[str, Any]] = []
    started = time.time()
    with client.stream("POST", f"{base_url}/api/chat/{session_id}", json={"message": sample["input"]}) as resp:
        resp.raise_for_status()
        for line in resp.iter_lines():
            evt = _parse_sse_line(line)
            if evt:
                events.append(evt)
                if evt.get("type") == "done":
                    break

    turns_resp = client.get(f"{base_url}/api/sessions/{session_id}/turns")
    turns_resp.raise_for_status()
    turns = turns_resp.json().get("turns", [])
    turn = turns[-1] if turns else None
    scores = _score_sample(sample, events, turn)
    trace_id = (turn or {}).get("trace_id")

    for name, value in scores.items():
        score_trace(
            trace_id,
            f"eval_{name}",
            value,
            metadata={"sample_id": sample["id"], "category": sample.get("category")},
        )

    return {
        "sample_id": sample["id"],
        "session_id": session_id,
        "trace_id": trace_id,
        "trace_url": (turn or {}).get("trace_url"),
        "latency_ms": int((time.time() - started) * 1000),
        "scores": scores,
        "tool_calls": [tc.get("tool") for tc in (turn or {}).get("tool_calls", [])],
        "reply": (turn or {}).get("agent_reply", ""),
    }


def main() -> int:
    load_dotenv(ROOT / ".env")
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=os.getenv("AGENT_EVAL_BASE_URL", "http://localhost:8002"))
    parser.add_argument("--samples", default=str(Path(__file__).with_name("langfuse_eval_samples.json")))
    parser.add_argument("--output", default="")
    args = parser.parse_args()

    samples = json.loads(Path(args.samples).read_text(encoding="utf-8"))
    results = []
    with httpx.Client(timeout=None) as client:
        for sample in samples:
            results.append(run_sample(client, args.base_url.rstrip("/"), sample))

    report = {
        "base_url": args.base_url,
        "sample_count": len(results),
        "average_overall": round(sum(r["scores"]["overall"] for r in results) / len(results), 4) if results else 0,
        "results": results,
    }
    text = json.dumps(report, ensure_ascii=False, indent=2)
    if args.output:
        Path(args.output).write_text(text + "\n", encoding="utf-8")
    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
