# -*- coding: utf-8 -*-
"""Demand-type classification tool for the analysis agent.

Reads demand_type config (mode + categories) from the caller-supplied config
dict and calls the LLM to classify the conversation into a demand type.

Config schema (analysis_config.json → demand_type):
  mode: "preset"  — pick from categories list; null if not enough context
  mode: "llm"     — LLM freely summarises in ≤10 chars; null if not enough
  categories: list[str]  — only used in preset mode
"""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel

from agentscope.message import UserMsg, SystemMsg


class _ClassifyResult(BaseModel):
    demand_type: Optional[str] = None


def build_classify_prompt(config: dict) -> str:
    """Build the system prompt for demand-type classification from config."""
    dt = config.get("demand_type", {})
    mode = dt.get("mode", "preset")
    if mode == "preset":
        cats = "、".join(f'"{c}"' for c in dt.get("categories", []))
        return (
            "你是对话分析助手，分析以下客服对话，识别访客的核心需求类型。\n"
            f"需求类型（demand_type）：从以下类别中选最匹配的一项：{cats}。\n"
            "如对话内容不足以判断，输出 null。"
        )
    else:
        return (
            "你是对话分析助手，分析以下客服对话，识别访客的核心需求类型。\n"
            "需求类型（demand_type）：用 ≤10 字自由描述访客的核心需求。\n"
            "如对话内容不足以判断，输出 null。"
        )


async def classify_demand(model, history: str, config: dict) -> Optional[str]:
    """Classify the visitor's demand type from conversation history string.

    Args:
        model: AgentScope non-streaming model instance.
        history: Formatted conversation string (role: content lines).
        config: Loaded analysis_config dict.

    Returns:
        Demand type string, or None if conversation is too short to classify.
    """
    msgs = [
        SystemMsg(name="system", content=build_classify_prompt(config)),
        UserMsg(name="input", content=f"请分析以下对话：\n\n{history}"),
    ]
    resp = await model.generate_structured_output(msgs, _ClassifyResult)
    return resp.content.get("demand_type")
