# -*- coding: utf-8 -*-
"""agent-backend · FastAPI 入口"""
import json
import asyncio
import time
from typing import AsyncGenerator

import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from log_config import get_logger, UVICORN_LOG_CONFIG
from config import settings
from session_store import store
from agent_runner import stream_turn
from langfuse_tracing import get_langfuse, flush as langfuse_flush, score_trace

logger = get_logger(__name__)

app = FastAPI(title="Console-CRM Agent Backend", version="0.1.0")


@app.on_event("startup")
async def _startup() -> None:
    lf = get_langfuse()
    if lf:
        logger.info("langfuse.ready")


@app.on_event("shutdown")
async def _shutdown() -> None:
    langfuse_flush()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── 请求 Schema ──────────────────────────────────────────────────────

class NewSessionReq(BaseModel):
    visitor_id: str | None = None
    user_type: str = "anonymous"
    member_id: str | None = None


class ChatReq(BaseModel):
    message: str


class OperatorMsgReq(BaseModel):
    content: str


class QualityReviewReq(BaseModel):
    score: int
    issue_type: str | None = None
    root_cause: str | None = None
    tags: list[str] = []
    comment: str | None = None
    add_to_dataset: bool = False


# ── 会话管理 ─────────────────────────────────────────────────────────

@app.post("/api/sessions")
def create_session(req: NewSessionReq):
    session = store.create(
        visitor_id=req.visitor_id,
        user_type=req.user_type,
        member_id=req.member_id,
    )
    logger.info("session.create sid=%s user_type=%s visitor=%s",
                session.session_id[:8], session.user_type, session.visitor_id)
    return {"session_id": session.session_id, "user_type": session.user_type}


@app.get("/api/sessions/{session_id}")
def get_session(session_id: str):
    s = store.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    return {
        "session_id": s.session_id,
        "user_type": s.user_type,
        "visitor_id": s.visitor_id,
        "started_at": s.started_at,
        "human_serving": s.human_serving,
        "lead_submitted": s.lead_submitted,
        "lead_draft": s.lead_draft,
        "final_intent_level": (s.analysis or {}).get("intent_level"),
        "quality_reviews": s.quality_reviews,
    }


# ── 对话接口（SSE 流式）──────────────────────────────────────────────

@app.post("/api/chat/{session_id}")
async def chat(session_id: str, req: ChatReq):
    s = store.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found")

    async def event_generator() -> AsyncGenerator[str, None]:
        logger.info("chat.start sid=%s msg_len=%d human_serving=%s",
                    session_id[:8], len(req.message), s.human_serving)
        event_count = 0
        async for evt in stream_turn(s, req.message):
            event_count += 1
            t = evt.get("type")
            if t == "tool_call":
                logger.info("chat.tool_call sid=%s tool=%s", session_id[:8], evt.get("tool"))
            elif t == "handoff":
                logger.info("chat.handoff sid=%s", session_id[:8])
            elif t == "lead_captured":
                logger.info("chat.lead_captured sid=%s data=%s", session_id[:8], evt.get("data"))
            elif t == "error":
                logger.error("chat.error sid=%s msg=%s", session_id[:8], evt.get("message"))
            elif t == "done":
                logger.info("chat.done sid=%s events=%d", session_id[:8], event_count)
            yield f"data: {json.dumps(evt, ensure_ascii=False)}\n\n"
            await asyncio.sleep(0)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── 消息轮询（用户侧在人工服务期间轮询坐席回复）────────────────────

@app.get("/api/sessions/{session_id}/messages")
def get_messages(
    session_id: str,
    after: int = Query(default=-1, description="返回 idx > after 的消息"),
):
    """用户侧轮询接口，获取人工坐席的回复消息。"""
    s = store.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    msgs = s.messages_after(after)
    return {
        "messages": msgs,
        "human_serving": s.human_serving,
        "total": len(s.chat_log),
    }


# ── 坐席发送消息（Demo：由 N2 或直接调用）────────────────────────────

@app.post("/api/sessions/{session_id}/operator_message")
def operator_message(session_id: str, req: OperatorMsgReq):
    """坐席（人工）向用户发送一条消息，同时写入 agent 历史。"""
    s = store.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    msg = s.add_message("operator", req.content)
    logger.info("operator.msg sid=%s idx=%d", session_id[:8], msg.idx)
    return {"ok": True, "idx": msg.idx}


# ── 人工接手控制 ──────────────────────────────────────────────────────

@app.post("/api/sessions/{session_id}/handoff")
def human_handoff(session_id: str):
    """坐席接手：通知 agent 停止自动回复，并触发分析 agent 生成建议。"""
    s = store.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    s.human_serving = True
    # Trigger suggestions generation immediately
    if s.analysis_agent:
        s.analysis_agent.notify()
    logger.info("handoff.take sid=%s", session_id[:8])
    return {"ok": True, "human_serving": True}


@app.post("/api/sessions/{session_id}/ai_resume")
def ai_resume(session_id: str):
    """坐席归还：agent 恢复自动回复，下次调用时会注入人工期间的对话历史。"""
    s = store.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    s.human_serving = False
    s.suggested_replies = []
    logger.info("handoff.resume sid=%s", session_id[:8])
    return {"ok": True, "human_serving": False}


# ── 分析结果（需求类型 + 意向打分）────────────────────────────────────

@app.get("/api/sessions/{session_id}/analysis")
def get_analysis(session_id: str):
    """获取最新一次分析 Agent 的结构化输出（需求类型 + 意向打分）。"""
    s = store.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    return {
        "has_analysis": s.analysis is not None,
        "analysis": s.analysis,
        "human_serving": s.human_serving,
    }


# ── 回复建议（人工接管期间）────────────────────────────────────────────

@app.get("/api/sessions/{session_id}/reply-suggestions")
def get_reply_suggestions(session_id: str):
    """获取分析 Agent 为人工坐席生成的 3 条回复建议。"""
    s = store.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    return {
        "suggestions": s.suggested_replies,
        "human_serving": s.human_serving,
        "has_suggestions": len(s.suggested_replies) > 0,
    }


@app.post("/api/sessions/{session_id}/reply-suggestions/refresh")
def refresh_reply_suggestions(session_id: str):
    """手动触发分析 Agent 重新生成回复建议（对应 N2 ↻ 刷新按钮）。"""
    s = store.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    # Clear so run_loop sees suggested_replies=[] and regenerates unconditionally
    s.suggested_replies = []
    if s.analysis_agent:
        s.analysis_agent.notify()
    logger.info("suggestions.refresh sid=%s", session_id[:8])
    return {"ok": True}


# ── 会话列表（N2 坐席工作台用）────────────────────────────────────────

@app.get("/api/sessions")
def list_sessions():
    """列出所有活跃会话（N2 坐席工作台轮询用）。"""
    sessions = [
        {
            "session_id": s.session_id,
            "visitor_id": s.visitor_id,
            "user_type": s.user_type,
            "started_at": s.started_at,
            "human_serving": s.human_serving,
            "lead_submitted": s.lead_submitted,
            "msg_count": len(s.chat_log),
            "analysis": s.analysis,
            "has_suggestions": len(s.suggested_replies) > 0,
            "last_trace_url": next((t.get("trace_url") for t in reversed(s.turn_log) if t.get("trace_url")), None),
        }
        for s in store.all_sessions()
    ]
    return {"sessions": sessions, "total": len(sessions)}


# ── 富对话回放（operator 面板用）────────────────────────────────────────

@app.get("/api/sessions/{session_id}/turns")
def get_turns(
    session_id: str,
    after: int = Query(default=-1, description="返回 seq > after 的 turn"),
):
    """返回 AI 对话回合的完整事件数据（含 thinking / tool calls），供 operator 面板富渲染。"""
    s = store.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    turns = [t for t in s.turn_log if t["seq"] > after]
    return {"turns": turns, "total": len(s.turn_log)}


@app.post("/api/sessions/{session_id}/turns/{seq}/quality-review")
def submit_quality_review(session_id: str, seq: int, req: QualityReviewReq):
    """人工质检：保存业务评分，并回写 Langfuse score。"""
    s = store.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    turn = next((t for t in s.turn_log if t["seq"] == seq), None)
    if not turn:
        raise HTTPException(404, "Turn not found")
    normalized_score = max(0, min(req.score, 5)) / 5
    review = {
        "session_id": session_id,
        "turn_seq": seq,
        "score": req.score,
        "normalized_score": normalized_score,
        "issue_type": req.issue_type,
        "root_cause": req.root_cause,
        "tags": req.tags,
        "comment": req.comment,
        "add_to_dataset": req.add_to_dataset,
        "trace_id": turn.get("trace_id"),
        "trace_url": turn.get("trace_url"),
        "created_at": time.time(),
    }
    s.quality_reviews.append(review)
    turn.setdefault("manual_reviews", []).append(review)
    score_trace(
        turn.get("trace_id"),
        "manual_quality_score",
        normalized_score,
        comment=req.comment,
        metadata={
            "session_id": session_id,
            "turn_seq": seq,
            "issue_type": req.issue_type,
            "root_cause": req.root_cause,
            "tags": req.tags,
            "add_to_dataset": req.add_to_dataset,
        },
    )
    if req.root_cause:
        score_trace(
            turn.get("trace_id"),
            f"root_cause_{req.root_cause}",
            1,
            metadata={"session_id": session_id, "turn_seq": seq},
        )
    logger.info("quality.review sid=%s seq=%s score=%s", session_id[:8], seq, req.score)
    return {"ok": True, "review": review}


@app.get("/api/agent-observability/monitoring-summary")
def get_monitoring_summary():
    """监控中心：基于当前内存会话聚合 P0 运营指标。"""
    sessions = store.all_sessions()
    turns = [t for s in sessions for t in s.turn_log]
    tool_calls = [tc for t in turns for tc in t.get("tool_calls", [])]
    rag_calls = [tc for tc in tool_calls if tc.get("tool") == "rag_search"]
    rag_hits = [
        tc for tc in rag_calls
        if tc.get("result") and "未找到" not in tc.get("result", "") and "暂无内容" not in tc.get("result", "")
    ]
    quality_scores = [t.get("quality_scores", {}) for t in turns]
    error_turns = [t for t in turns if t.get("quality_scores", {}).get("answer_success") == 0]
    latencies = sorted(t.get("latency_ms") or 0 for t in turns if t.get("latency_ms"))

    def percentile(values: list[int], pct: float) -> int:
        if not values:
            return 0
        idx = min(len(values) - 1, int(round((len(values) - 1) * pct)))
        return values[idx]

    high_intent_sessions = [
        s for s in sessions if (s.analysis or {}).get("intent_level") == "high"
    ]
    return {
        "sessions": {
            "total": len(sessions),
            "active": len([s for s in sessions if not s._terminated]),
            "human_serving": len([s for s in sessions if s.human_serving]),
            "lead_submitted": len([s for s in sessions if s.lead_submitted]),
            "high_intent": len(high_intent_sessions),
        },
        "turns": {
            "total": len(turns),
            "success_rate": 0 if not turns else round(1 - len(error_turns) / len(turns), 4),
            "error_count": len(error_turns),
            "p50_latency_ms": percentile(latencies, 0.5),
            "p95_latency_ms": percentile(latencies, 0.95),
        },
        "tools": {
            "total_calls": len(tool_calls),
            "rag_calls": len(rag_calls),
            "tool_success_avg": round(
                sum(q.get("tool_success", 1) for q in quality_scores) / len(quality_scores),
                4,
            ) if quality_scores else 1,
        },
        "rag": {
            "call_rate": 0 if not turns else round(len(rag_calls) / len(turns), 4),
            "hit_rate": 0 if not rag_calls else round(len(rag_hits) / len(rag_calls), 4),
            "no_hit_count": len(rag_calls) - len(rag_hits),
            "should_call_missed": len([q for q in quality_scores if q.get("rag_called_when_needed") == 0]),
        },
        "business": {
            "handoff_count": len([s for s in sessions if s.human_serving]),
            "lead_capture_count": len([s for s in sessions if s.lead_submitted]),
            "suggestions_generated": len([s for s in sessions if s.suggested_replies]),
            "high_intent_without_lead": len([s for s in high_intent_sessions if not s.lead_submitted]),
        },
    }


@app.get("/api/agent-observability/knowledge-quality")
def get_knowledge_quality():
    """知识库质量中心：汇总 RAG query、命中文档热度和知识缺口。"""
    sessions = store.all_sessions()
    turns = [t for s in sessions for t in s.turn_log]
    rag_calls = [
        {"session_id": s.session_id, "turn": t, "tool": tc}
        for s in sessions
        for t in s.turn_log
        for tc in t.get("tool_calls", [])
        if tc.get("tool") == "rag_search"
    ]
    no_hit = [
        item for item in rag_calls
        if not item["tool"].get("result")
        or "未找到" in item["tool"].get("result", "")
        or "暂无内容" in item["tool"].get("result", "")
    ]
    doc_hot: dict[str, int] = {}
    for item in rag_calls:
        result = item["tool"].get("result", "")
        for marker in ["[products]", "[pricing]"]:
            if marker in result:
                doc_hot[marker.strip("[]")] = doc_hot.get(marker.strip("[]"), 0) + 1
    return {
        "summary": {
            "rag_call_count": len(rag_calls),
            "hit_count": len(rag_calls) - len(no_hit),
            "no_hit_count": len(no_hit),
            "hit_rate": 0 if not rag_calls else round((len(rag_calls) - len(no_hit)) / len(rag_calls), 4),
            "doc_coverage_count": len(doc_hot),
        },
        "doc_hotspots": [
            {"doc_id": doc_id, "hit_count": count}
            for doc_id, count in sorted(doc_hot.items(), key=lambda x: x[1], reverse=True)
        ],
        "knowledge_gaps": [
            {
                "session_id": item["session_id"],
                "turn_seq": item["turn"].get("seq"),
                "query": item["tool"].get("args"),
                "trace_url": item["turn"].get("trace_url"),
            }
            for item in no_hit[:50]
        ],
    }


# ── 线索查询 ──────────────────────────────────────────────────────────

@app.get("/api/leads")
def list_leads():
    leads = [
        {"session_id": s.session_id, "visitor_id": s.visitor_id,
         "user_type": s.user_type, "lead": s.lead_draft}
        for s in store.all_sessions() if s.lead_submitted
    ]
    return {"leads": leads, "total": len(leads)}


# ── 健康检查 ──────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "sessions": len(store._store)}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.AGENT_PORT,
        reload=True,
        log_config=UVICORN_LOG_CONFIG,
    )
