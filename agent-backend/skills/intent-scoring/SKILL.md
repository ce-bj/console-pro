---
name: 意向打分
description: 综合对话内容评估访客购买意向，输出分数（0-100）+ 等级 + 依据
agent: analysis
tool: score_intent
---

# 意向打分技能

## 工具说明

调用 `score_intent_tool` 对当前对话进行意向评估。
评分维度、权重、阈值（high / medium 分界线）均从运行时配置（N3 意向与情绪设置）中读取，此处不列出具体值。

## 两种打分模式（由配置决定，不在此硬编码）

**preset 模式**：对配置中的各维度分别打 0–100 分，按权重加权求和得总分，再按配置的阈值划分等级。

**llm 模式**：大模型综合对话内容直接输出总分和等级，可附业务提示（llm_hint）。

## 调用时机

每条用户消息后与 `classify_demand_tool` 并行触发。主 Agent 调用 `analyze_visitor_intent` 时也会触发。

## 输出

- `intent_score`：0–100 整数
- `intent_level`：high / medium / low
- `intent_reason`：≤30 字的依据说明
- 写入 `session.analysis`，推送到 N2 对话工作台「AI 副驾·意向打分」区

## 主 Agent 联动策略（参见 intent-analysis 技能说明）

| 等级 | 推荐操作 |
|---|---|
| high | 推留资表单 或 转接销售顾问 |
| medium | 引导 Demo / 深入介绍 |
| low | 专注答疑，建立信任 |
