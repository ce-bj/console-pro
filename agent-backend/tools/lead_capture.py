# -*- coding: utf-8 -*-
"""渐进式留资工具。

当对话中识别到用户有留资意愿时，agent 调用此工具生成留资表单配置。
工具返回 JSON 规格，前端根据此渲染表单组件（内联在对话中）。
当必填项完成后，记录写入线索池（N7）。

表单字段来源：analysis_config.json → lead_capture.fields（mock N3 智能体配置），
后续改为从 prototype 真实配置读取，此处只需替换 analysis_config.json。
"""
import json
import os

_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "analysis_config.json")


def _load_lead_fields() -> tuple[list[dict], dict]:
    """Load enabled fields (sorted by order) and top-level capture config.

    Returns (fields, capture_cfg) where fields only contains enabled entries.
    """
    with open(_CONFIG_PATH, encoding="utf-8") as f:
        cfg = json.load(f)
    capture = cfg.get("lead_capture", {})
    fields = [
        field for field in capture.get("fields", [])
        if field.get("enabled", True)
    ]
    fields.sort(key=lambda x: x.get("order", 99))
    return fields, capture


def lead_capture_form(
    context: str = "",
    prefilled_name: str = "",
    prefilled_phone: str = "",
    prefilled_email: str = "",
    prefilled_company: str = "",
) -> str:
    """Display a lead capture form to collect visitor contact information.

    Call this tool when the conversation naturally reaches a point where
    the visitor shows interest and it's appropriate to collect their contact
    info. Do NOT call this immediately at the start of conversation.

    Good timing indicators:
    - User asked about pricing or specific product details
    - User expressed purchase intent or wants a demo
    - User asked about contacting sales / account manager
    - 3+ turns of engaged conversation with clear interest

    Args:
        context: Brief context why we're asking (shown to user as intro text).
        prefilled_name: Pre-fill name if already known from conversation.
        prefilled_phone: Pre-fill phone if already known.
        prefilled_email: Pre-fill email if already known.
        prefilled_company: Pre-fill company if already known.

    Returns:
        A JSON spec that the frontend renders as an inline form.
        The string starts with __FORM__: to signal the frontend.
    """
    config_fields, capture_cfg = _load_lead_fields()

    prefills = {
        "name":    prefilled_name,
        "phone":   prefilled_phone,
        "email":   prefilled_email,
        "company": prefilled_company,
    }

    fields = []
    for f in config_fields:
        key = f.get("field_key", "")
        fields.append({
            "id":          key,
            "label":       f.get("label", ""),
            "type":        f.get("type", "text"),
            "required":    f.get("required", False),
            "placeholder": f.get("placeholder", ""),
            "options":     f.get("options", []),
            "crm_field":   f.get("crm_field", ""),
            "value":       prefills.get(key, ""),
        })

    spec = {
        "type":            "lead_form",
        "intro":           context or capture_cfg.get("intro", "为了让我们的顾问为您提供更精准的方案，请留下联系方式："),
        "fields":          fields,
        "submit_label":    capture_cfg.get("submit_label", "提交信息"),
        "required_fields": [f["id"] for f in fields if f["required"]],
    }
    return f"__FORM__:{json.dumps(spec, ensure_ascii=False)}"
