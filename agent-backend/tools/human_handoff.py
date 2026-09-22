# -*- coding: utf-8 -*-
"""转人工工具。

当 agent 判断需要转接人工客服时调用此工具。
触发条件（agent 自主判断）：
- 用户明确要求人工
- 问题超出 AI 能力范围（合同、法律、紧急投诉）
- 用户情绪激动、重复表达不满
- 涉及大额商务谈判

调用后：
1. 在中台 N2 对话工作台会出现该会话的「待接手」状态
2. agent 停止自动回复，直到坐席在 N2 点击「AI客服」归还
"""
import json


def request_human_handoff(
    reason: str,
    urgency: str = "normal",
    summary: str = "",
) -> str:
    """Request transfer to a human agent (转人工).

    Call this when:
    - The user explicitly requests a human agent
    - The issue requires human judgment (contracts, complaints, large deals)
    - The user shows signs of frustration after 2+ AI responses
    - The query is outside AI capabilities

    After calling this tool, do NOT send any more responses.
    The system will notify the human agent automatically.

    Args:
        reason: Why you're transferring (shown to the human agent).
        urgency: One of 'low', 'normal', 'high', 'urgent'.
        summary: Brief summary of the conversation for the handoff agent.

    Returns:
        A JSON spec starting with __HANDOFF__: to trigger the handoff.
    """
    valid_urgency = {"low", "normal", "high", "urgent"}
    if urgency not in valid_urgency:
        urgency = "normal"

    spec = {
        "type": "human_handoff",
        "reason": reason,
        "urgency": urgency,
        "summary": summary or reason,
    }
    return f"__HANDOFF__:{json.dumps(spec, ensure_ascii=False)}"
