# -*- coding: utf-8 -*-
"""多步骤确认工具（仿 Claude Desktop 对话式选择）。

当 agent 需要用户做出选择或确认时（信息模糊、有多个方向），
使用此工具生成选项卡片，前端渲染为可点击 chip + "其他"输入框。
最多支持连续多步确认（通过 step_id 追踪进度）。
"""
import json


def confirm_dialog(
    question: str,
    options: list,
    step_id: str = "default",
    allow_other: bool = True,
    context: str = "",
) -> str:
    """Show the user a confirmation dialog with clickable options.

    Use this when you need the user to choose between specific options
    instead of typing freely. This creates a better UX than asking
    open-ended questions for structured choices.

    Use cases:
    - Clarifying which product category they're interested in
    - Confirming their industry / company size for better recommendations
    - Multi-step qualification (budget range, timeline, team size)
    - Confirming before sensitive actions (transfer to human, submit lead)

    Args:
        question: The question to display to the user.
        options: List of option strings (2-4 items recommended, max 6).
        step_id: Unique identifier for this step in a multi-step flow.
        allow_other: Whether to show an "其他" text input option.
        context: Optional context shown above the question.

    Returns:
        A JSON spec starting with __CONFIRM__: for frontend rendering.
    """
    spec = {
        "type": "confirm_dialog",
        "step_id": step_id,
        "context": context,
        "question": question,
        "options": options[:6],  # 最多 6 个选项
        "allow_other": allow_other,
    }
    return f"__CONFIRM__:{json.dumps(spec, ensure_ascii=False)}"
