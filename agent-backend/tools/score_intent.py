# -*- coding: utf-8 -*-
"""Intent scoring tool for the analysis agent.

Reads intent_scoring config (mode + dimensions + thresholds) from the
caller-supplied config dict and calls the LLM to score visitor intent.

Config schema (analysis_config.json → intent_scoring):
  mode: "preset"  — weighted dimensions, each scored 0-100 then summed
    dimensions: [{key, label, weight}]
    thresholds: {high: int, medium: int}
  mode: "llm"     — LLM directly outputs score + level; llm_hint optional
    llm_hint: str
"""
from __future__ import annotations

from typing import Literal
from pydantic import BaseModel

from agentscope.message import UserMsg, SystemMsg


class _ScoreResult(BaseModel):
    intent_score: int
    intent_level: Literal["high", "medium", "low"]
    intent_reason: str


def build_score_prompt(config: dict) -> str:
    """Build the system prompt for intent scoring from config."""
    is_ = config.get("intent_scoring", {})
    mode = is_.get("mode", "preset")
    lines = ["你是对话分析助手，分析以下客服对话，评估访客的购买意向强度。"]

    if mode == "preset":
        dims = is_.get("dimensions", [])
        thresholds = is_.get("thresholds", {"high": 75, "medium": 45})
        dim_lines = "; ".join(f'{d["label"]}（权重 {d["weight"]}%）' for d in dims)
        lines.append(
            f"意向打分（intent_score）：对以下维度各打 0–100 分，再按权重加权求和得 0–100 总分：{dim_lines}。"
        )
        lines.append(
            f"意向等级（intent_level）：总分 ≥ {thresholds['high']} → high，"
            f"≥ {thresholds['medium']} → medium，否则 → low。"
        )
    else:
        hint = is_.get("llm_hint", "")
        lines.append(
            "意向打分（intent_score）：综合对话内容直接给出 0–100 总分和 high/medium/low 等级。"
            + (f"参考方向：{hint}" if hint else "")
        )

    lines.append("intent_reason：一句话说明意向等级判断依据（≤30 字）。")
    return "\n".join(lines)


async def score_intent(
    model, history: str, config: dict
) -> tuple[int, Literal["high", "medium", "low"], str]:
    """Score visitor intent from conversation history string.

    Args:
        model: AgentScope non-streaming model instance.
        history: Formatted conversation string (role: content lines).
        config: Loaded analysis_config dict.

    Returns:
        (intent_score, intent_level, intent_reason)
    """
    msgs = [
        SystemMsg(name="system", content=build_score_prompt(config)),
        UserMsg(name="input", content=f"请分析以下对话：\n\n{history}"),
    ]
    resp = await model.generate_structured_output(msgs, _ScoreResult)
    c = resp.content
    return c.get("intent_score", 0), c.get("intent_level", "low"), c.get("intent_reason", "")
