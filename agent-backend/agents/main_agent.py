# -*- coding: utf-8 -*-
"""Main Anvil agent — model, toolkit (tools + skills), middleware configuration.

Responsibilities:
  - Define the system prompt and user-identity middleware
  - Assemble the toolkit from common tools/ and skills/
  - Include the session-scoped analyze_visitor_intent tool (closure over Session)
  - Expose create_main_agent(session) for the orchestrator to call

The orchestrator (agent_runner.py) is responsible for spawning AnalysisAgent
*before* calling create_main_agent, because the toolkit closure references
session.analysis_agent.
"""
from __future__ import annotations

import os
from typing import Any, TYPE_CHECKING

from agentscope.agent import Agent
from agentscope.credential import OpenAICredential, DashScopeCredential
from agentscope.model import OpenAIChatModel, DashScopeChatModel
from agentscope.tool import Toolkit, FunctionTool
from agentscope.skill import LocalSkillLoader
from agentscope.middleware import MiddlewareBase
from agentscope.state import AgentState
from agentscope.permission import PermissionContext
from agentscope.permission._types import PermissionMode
from agentscope.formatter import OpenAIChatFormatter

from log_config import get_logger
from config import settings
from tools import (
    rag_search,
    web_search,
    lead_capture_form,
    confirm_dialog,
    request_human_handoff,
)

if TYPE_CHECKING:
    from session_store import Session

logger = get_logger(__name__)

# Skills directory is one level up from agents/
_SKILLS_DIR = os.path.join(os.path.dirname(__file__), "..", "skills")

SYSTEM_PROMPT = """\
你是 Anvil 企业服务平台的专属 AI 客服助手（非通用 AI）。
职责：帮助网站访客了解产品功能、价格方案，并在合适时机引导留资。
语气：专业、亲切、简洁；中文回复控制在 120 字以内，英文按需切换。
绝不虚构产品参数或价格；未知信息先用 rag_search 查询，再回答。
如果系统告知"人工已接入"，立即停止回复，等待坐席处理。

留资节奏（判断后执行）：首次询价只需专注回答，不要立刻推留资表单。\
当访客展现出真实购买意向（主动追问细节、对比版本差异、提及公司/团队/预算/决策场景）时，\
才调用「渐进式留资」技能，用 confirm_dialog 自然询问背景，再适时引出 lead_capture_form。\
节奏要像真实销售顾问：先建立信任，再顺势引导，不强推。
"""


# ── Middleware ────────────────────────────────────────────────────────────────

class _SessionContextMiddleware(MiddlewareBase):
    """Append user-identity context to the system prompt via on_system_prompt hook."""

    def __init__(self, context_note: str) -> None:
        self._note = context_note

    async def on_system_prompt(self, agent: Agent, prompt: str) -> str:
        if self._note:
            return prompt + "\n\n" + self._note
        return prompt


# ── Formatter ─────────────────────────────────────────────────────────────────

class _ProxyCompatFormatter(OpenAIChatFormatter):
    """Flatten system content array → plain string for proxy compatibility.

    Some proxies (e.g. vveai.com) silently drop array-format system content,
    causing the system prompt to be lost.
    """

    async def format(self, msgs: list) -> list[dict[str, Any]]:
        formatted = await super().format(msgs)
        for msg in formatted:
            if msg.get("role") == "system" and isinstance(msg.get("content"), list):
                parts = [b.get("text", "") for b in msg["content"] if b.get("type") == "text"]
                msg["content"] = "\n".join(parts)
                msg.pop("name", None)
        return formatted


# ── Model ─────────────────────────────────────────────────────────────────────

def _build_model() -> OpenAIChatModel | DashScopeChatModel:
    if settings.LLM_BASE_URL and "dashscope.aliyuncs.com" in settings.LLM_BASE_URL:
        cred = DashScopeCredential(
            api_key=settings.LLM_API_KEY,
            base_url=settings.LLM_BASE_URL,
        )
        return DashScopeChatModel(credential=cred, model=settings.LLM_MODEL, stream=True)

    cred = OpenAICredential(
        api_key=settings.LLM_API_KEY,
        base_url=settings.LLM_BASE_URL,
    )
    return OpenAIChatModel(
        credential=cred,
        model=settings.LLM_MODEL,
        stream=True,
        formatter=_ProxyCompatFormatter(),
    )


# ── Toolkit ───────────────────────────────────────────────────────────────────

def _build_toolkit(session: "Session") -> Toolkit:
    """Assemble toolkit from common tools + skills, plus one session-scoped tool.

    analyze_visitor_intent is a closure over `session` so it can delegate to
    the already-spawned AnalysisAgent without needing to pass the session
    through AgentScope's tool interface.
    """
    tools = [
        FunctionTool(rag_search,              is_read_only=True,  is_concurrency_safe=True),
        FunctionTool(web_search,              is_read_only=True,  is_concurrency_safe=True),
        FunctionTool(lead_capture_form,       is_read_only=False, is_concurrency_safe=True),
        FunctionTool(confirm_dialog,          is_read_only=True,  is_concurrency_safe=True),
        FunctionTool(request_human_handoff,   is_read_only=False, is_concurrency_safe=True),
    ]

    async def analyze_visitor_intent() -> str:
        """分析当前访客的需求类型和购买意向，返回结构化分析结果。

        **调用时机（自行判断，不是每轮都调）：**
        - 访客主动询问价格、版本差异或采购预算时
        - 对话进行了 3 轮以上，需要判断是否推进留资或转接顾问时
        - 访客提到公司名、团队规模、决策场景等背景信息时

        **不需要调用的情况：**
        - 首轮打招呼或基础功能询问
        - 已完成留资，进入售后/技术支持阶段
        """
        if session.analysis_agent is None:
            return "分析 Agent 尚未就绪，请稍后再试。"
        return await session.analysis_agent.analyze_now()

    tools.append(
        FunctionTool(analyze_visitor_intent, is_read_only=True, is_concurrency_safe=True)
    )

    skill_loader = LocalSkillLoader(directory=_SKILLS_DIR, scan_subdir=True)
    return Toolkit(tools=tools, skills_or_loaders=[skill_loader])


# ── Factory ───────────────────────────────────────────────────────────────────

def create_main_agent(session: "Session") -> Agent:
    """Create and store the main Anvil agent on the session.

    Assumes session.analysis_agent is already set by the orchestrator.
    """
    context_note = ""
    if session.user_type == "member":
        context_note = f"[当前访客是已登录会员，member_id={session.member_id}，优先提供会员专属服务。]"
    elif session.user_type == "lead":
        context_note = "[当前访客已曾留资（线索用户），直接进入产品深度介绍阶段，无需基础介绍。]"
    elif session.user_type == "same_ip":
        context_note = "[当前访客 IP 与已知访客相同，可能是回访用户，保持连续性。]"

    middlewares = [_SessionContextMiddleware(context_note)] if context_note else []

    perm_ctx = PermissionContext(mode=PermissionMode.BYPASS)
    session.agent = Agent(
        name="Anvil助手",
        system_prompt=SYSTEM_PROMPT,
        model=_build_model(),
        toolkit=_build_toolkit(session),
        middlewares=middlewares,
        state=AgentState(permission_context=perm_ctx),
    )
    logger.info("main_agent.created sid=%s user_type=%s", session.session_id[:8], session.user_type)
    return session.agent
