# -*- coding: utf-8 -*-
"""Reply suggestion tool for the analysis agent.

When human_serving=True, generates 3 suggested replies for the operator
(信息/答疑型, 引导推进型, 情感共鸣型) based on the current conversation.
"""
from __future__ import annotations

from pydantic import BaseModel

from agentscope.message import UserMsg, SystemMsg


class _SuggestionsResult(BaseModel):
    reply_1: str   # 信息/答疑型
    reply_2: str   # 引导推进型
    reply_3: str   # 情感共鸣型


_SYSTEM_PROMPT = (
    "你是坐席辅助助手，根据对话历史为人工客服生成 3 条回复建议：\n"
    "reply_1（信息/答疑型）：直接准确地回答访客提出的问题。\n"
    "reply_2（引导推进型）：引导访客进入下一步（留资/预约 demo/联系顾问）。\n"
    "reply_3（情感共鸣型）：表达理解和关心，建立信任感。\n"
    "语气自然、口语化，每条建议不超过 60 字，贴合当前对话上下文。"
)


async def suggest_replies(model, history: str) -> list[str]:
    """Generate 3 reply suggestions for the human operator.

    Args:
        model: AgentScope non-streaming model instance.
        history: Formatted conversation string (role: content lines).

    Returns:
        List of 3 suggestion strings [info_type, lead_type, empathy_type].
        Returns empty list on error.
    """
    msgs = [
        SystemMsg(name="system", content=_SYSTEM_PROMPT),
        UserMsg(name="input", content=f"对话记录：\n\n{history}"),
    ]
    resp = await model.generate_structured_output(msgs, _SuggestionsResult)
    c = resp.content
    return [c.get("reply_1", ""), c.get("reply_2", ""), c.get("reply_3", "")]
