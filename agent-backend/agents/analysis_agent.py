# -*- coding: utf-8 -*-
"""Background analysis agent — AgentScope Agent + LocalSkillLoader pattern.

One instance is spawned per session. It wraps a proper AgentScope Agent that:
  - Loads skills via LocalSkillLoader (demand-classify, intent-scoring)
  - Uses FunctionTools (classify_demand, score_intent, suggest_replies)
  - Reads all classification / scoring config from analysis_config.json at
    call time — no categories, dimensions, or thresholds are hardcoded here.

The tools are session-scoped closures so they can read from and write to the
session directly, just like analyze_visitor_intent in main_agent.py.
"""
from __future__ import annotations

import asyncio
import json
import os
import traceback
from typing import Any, TYPE_CHECKING

from agentscope.agent import Agent
from agentscope.credential import OpenAICredential, DashScopeCredential
from agentscope.model import OpenAIChatModel, DashScopeChatModel
from agentscope.tool import Toolkit, FunctionTool
from agentscope.skill import LocalSkillLoader
from agentscope.message import UserMsg
from agentscope.formatter import OpenAIChatFormatter
from agentscope.state import AgentState
from agentscope.permission import PermissionContext
from agentscope.permission._types import PermissionMode
from agentscope.event import ReplyEndEvent

from log_config import get_logger
from config import settings
from tools import classify_demand, score_intent, suggest_replies
from langfuse_tracing import (
    get_langfuse,
    redact_payload,
    score_trace,
    trace_id_from_observation,
)

if TYPE_CHECKING:
    from session_store import Session

logger = get_logger(__name__)

_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "analysis_config.json")
_SKILLS_DIR  = os.path.join(os.path.dirname(__file__), "..", "skills")

SYSTEM_PROMPT = """\
你是后台对话分析助手，专门分析访客对话的需求类型与购买意向，不参与用户对话。

收到分析请求时：
1. 按照技能说明，调用 classify_demand 识别需求类型。
2. 调用 score_intent 评估意向等级与分数。
3. 如请求中包含"生成回复建议"，则追加调用 suggest_replies。
4. 所有分类标签、评分维度、阈值均来自运行时配置，技能说明中不会列出具体值。
5. 完成工具调用后，只输出"分析完成"，不需要额外解释。
"""


# ── Config loader ─────────────────────────────────────────────────────────────

def load_config() -> dict:
    """Load analysis_config.json (mock for N3 config; live-reloaded each run)."""
    with open(_CONFIG_PATH, encoding="utf-8") as f:
        return json.load(f)


# ── Model ─────────────────────────────────────────────────────────────────────

class _ProxyCompatFormatter(OpenAIChatFormatter):
    """Flatten system content array → plain string for proxy compatibility."""

    async def format(self, msgs: list) -> list[dict[str, Any]]:
        formatted = await super().format(msgs)
        for msg in formatted:
            if msg.get("role") == "system" and isinstance(msg.get("content"), list):
                parts = [b.get("text", "") for b in msg["content"] if b.get("type") == "text"]
                msg["content"] = "\n".join(parts)
                msg.pop("name", None)
        return formatted


def _build_model() -> OpenAIChatModel | DashScopeChatModel:
    if settings.LLM_BASE_URL and "dashscope.aliyuncs.com" in settings.LLM_BASE_URL:
        cred = DashScopeCredential(
            api_key=settings.LLM_API_KEY,
            base_url=settings.LLM_BASE_URL,
        )
        return DashScopeChatModel(credential=cred, model=settings.LLM_MODEL, stream=False)

    cred = OpenAICredential(
        api_key=settings.LLM_API_KEY,
        base_url=settings.LLM_BASE_URL,
    )
    return OpenAIChatModel(
        credential=cred,
        model=settings.LLM_MODEL,
        stream=False,
        formatter=_ProxyCompatFormatter(),
    )


# ── History formatter ─────────────────────────────────────────────────────────

def _format_history(session: "Session") -> str:
    role_map = {"user": "访客", "operator": "人工客服", "agent": "AI客服"}
    lines = [f"[{role_map.get(m.role, m.role)}]: {m.content}" for m in session.chat_log]
    return "\n".join(lines) if lines else "(暂无对话记录)"


# ── Toolkit factory ───────────────────────────────────────────────────────────

def _build_toolkit(session: "Session", model) -> Toolkit:
    """Build analysis toolkit with session-scoped tool closures.

    Each tool captures `session` and `model` via closure so the Agent can call
    them without passing those as arguments — same pattern as
    analyze_visitor_intent in main_agent.py.

    Config (categories, dimensions, thresholds) is loaded from
    analysis_config.json at call time; nothing is hardcoded here.
    """

    async def classify_demand_tool() -> str:
        """识别访客的需求类型。从运行时配置中读取分类标签，选出最匹配的一项。
        若对话不足以判断则返回"暂不明确"。结果写入 session.analysis。"""
        config = load_config()
        history = _format_history(session)
        demand_type = await classify_demand(model, history, config)
        if session.analysis is None:
            session.analysis = {}
        session.analysis["demand_type"] = demand_type
        logger.info("classify_demand.ok sid=%s type=%r",
                    session.session_id[:8], demand_type)
        return f"需求类型：{demand_type or '暂不明确'}"

    async def score_intent_tool() -> str:
        """评估访客购买意向，输出 0–100 分数和 high/medium/low 等级及依据。
        评分维度和阈值来自运行时配置，不使用硬编码值。结果写入 session.analysis。"""
        config = load_config()
        history = _format_history(session)
        int_score, int_level, int_reason = await score_intent(model, history, config)
        if session.analysis is None:
            session.analysis = {}
        session.analysis.update({
            "intent_score": int_score,
            "intent_level": int_level,
            "intent_reason": int_reason,
        })
        logger.info("score_intent.ok sid=%s level=%s score=%s",
                    session.session_id[:8], int_level, int_score)
        return f"意向：{int_level}（{int_score}/100），依据：{int_reason}"

    async def suggest_replies_tool() -> str:
        """为人工坐席生成 3 条回复建议（信息型/引导型/情感共鸣型）。
        仅在 human_serving=True 时调用。结果写入 session.suggested_replies。"""
        history = _format_history(session)
        replies = await suggest_replies(model, history)
        session.suggested_replies = replies
        logger.info("suggest_replies.ok sid=%s", session.session_id[:8])
        return "回复建议已生成：" + " | ".join(replies)

    skill_loader = LocalSkillLoader(directory=_SKILLS_DIR, scan_subdir=True)
    return Toolkit(
        tools=[
            FunctionTool(classify_demand_tool, is_read_only=True,  is_concurrency_safe=True),
            FunctionTool(score_intent_tool,    is_read_only=True,  is_concurrency_safe=True),
            FunctionTool(suggest_replies_tool, is_read_only=False, is_concurrency_safe=True),
        ],
        skills_or_loaders=[skill_loader],
    )


# ── AnalysisAgent ─────────────────────────────────────────────────────────────

class AnalysisAgent:
    """Background analysis agent, one per session.

    Wraps a proper AgentScope Agent that uses LocalSkillLoader + FunctionTools.
    Lifecycle:
        session starts  → spawned as asyncio.Task via asyncio.create_task()
        user message    → notify() wakes the loop → agent runs classify + score
        human_serving   → agent also runs suggest_replies
        session ends    → _terminated=True stops the loop
    """

    def __init__(self, session: "Session") -> None:
        self.session = session
        self._model = _build_model()
        self._agent = self._create_agent()
        self._event: asyncio.Event = asyncio.Event()
        self._last_processed_idx: int = -1

    def _create_agent(self) -> Agent:
        perm_ctx = PermissionContext(mode=PermissionMode.BYPASS)
        return Agent(
            name="分析助手",
            system_prompt=SYSTEM_PROMPT,
            model=self._model,
            toolkit=_build_toolkit(self.session, self._model),
            state=AgentState(permission_context=perm_ctx),
        )

    def notify(self) -> None:
        """Wake up the run_loop to process new messages."""
        self._event.set()

    async def _run(self, include_suggestions: bool = False) -> None:
        """Send one analysis request to the Agent and consume the reply stream.

        Tools store their results directly on session as side effects.
        """
        request = "请调用 classify_demand 和 score_intent 工具分析当前对话。"
        if include_suggestions:
            request += "同时调用 suggest_replies 工具生成坐席回复建议。"
        msg = UserMsg(name="trigger", content=request)

        # Langfuse: span for background analysis run
        lf = get_langfuse()
        span = None
        trace_id = None
        if lf:
            try:
                from langfuse import propagate_attributes  # noqa: PLC0415
                with propagate_attributes(session_id=self.session.session_id):
                    span = lf.start_observation(
                        name="analysis-run",
                        as_type="span",
                        input=redact_payload({"include_suggestions": include_suggestions,
                               "turns": len(self.session.chat_log)}),
                        metadata=redact_payload({
                            "model": settings.LLM_MODEL,
                            "session_id": self.session.session_id,
                            "visitor_id": self.session.visitor_id,
                            "user_type": self.session.user_type,
                            "human_serving": self.session.human_serving,
                        }),
                    )
                    trace_id = trace_id_from_observation(span)
            except Exception:
                span = None

        try:
            async for event in self._agent.reply_stream(msg):
                if isinstance(event, ReplyEndEvent):
                    break
            analysis = self.session.analysis or {}
            score_trace(
                trace_id,
                "intent_score",
                int(analysis.get("intent_score", 0)),
                metadata={
                    "intent_level": analysis.get("intent_level"),
                    "demand_type": analysis.get("demand_type"),
                    "include_suggestions": include_suggestions,
                },
            )
            score_trace(
                trace_id,
                "suggested_replies_generated",
                1 if self.session.suggested_replies else 0,
                metadata={"include_suggestions": include_suggestions},
            )
            if span:
                try:
                    span.update(output=redact_payload({
                        "analysis": self.session.analysis,
                        "suggested_replies": self.session.suggested_replies,
                    }))
                    span.end()
                except Exception:
                    pass
        except Exception:
            logger.error("analysis_agent.run_error sid=%s\n%s",
                         self.session.session_id[:8], traceback.format_exc())
            if span:
                try:
                    span.update(level="ERROR", status_message=traceback.format_exc()[-200:])
                    span.end()
                except Exception:
                    pass

    async def analyze_now(self) -> str:
        """Run analysis immediately; return readable result for the main agent.

        Called by the main agent's analyze_visitor_intent tool. Also advances
        _last_processed_idx so the background loop won't duplicate this batch.
        """
        if not self.session.chat_log:
            return "对话记录为空，无法分析。"

        await self._run(include_suggestions=False)

        if self.session.chat_log:
            self._last_processed_idx = self.session.chat_log[-1].idx

        if not self.session.analysis:
            return "分析未返回结果（对话可能过短）。"

        a = self.session.analysis
        level_labels = {"high": "高意向", "medium": "中意向", "low": "低意向"}
        return (
            "访客意图分析：\n"
            f"• 需求类型：{a.get('demand_type') or '暂不明确'}\n"
            f"• 意向等级：{level_labels.get(a.get('intent_level', 'low'), '—')}"
            f"（{a.get('intent_score', 0)}/100）\n"
            f"• 依据：{a.get('intent_reason', '')}\n"
            "\n请根据意向等级调整策略（参见意向分析技能说明）。"
        )

    async def run_loop(self) -> None:
        """Background loop: wake on notify(), run analysis, suggest if needed."""
        logger.info("analysis_agent.start sid=%s", self.session.session_id[:8])
        try:
            while not self.session._terminated:
                try:
                    await asyncio.wait_for(self._event.wait(), timeout=300)
                except asyncio.TimeoutError:
                    if self.session._terminated:
                        break
                    continue

                self._event.clear()

                new_user = [
                    m for m in self.session.chat_log
                    if m.idx > self._last_processed_idx and m.role == "user"
                ]
                if not new_user:
                    # No new user messages, but a handoff just happened:
                    # generate suggestions from existing history.
                    if self.session.human_serving and not self.session.suggested_replies:
                        await self._run(include_suggestions=True)
                    continue

                self._last_processed_idx = self.session.chat_log[-1].idx

                await self._run(include_suggestions=self.session.human_serving)

        except asyncio.CancelledError:
            pass
        finally:
            logger.info("analysis_agent.stop sid=%s", self.session.session_id[:8])
