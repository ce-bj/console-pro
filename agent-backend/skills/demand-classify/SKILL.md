---
name: 需求类型识别
description: 从对话历史中识别访客的核心需求类型，结果写入线索池和对话工作台
agent: analysis
tool: classify_demand
---

# 需求类型识别技能

## 工具说明

调用 `classify_demand_tool` 对当前对话进行需求类型识别。
具体的分类标签、识别模式（preset / llm）均从运行时配置（N3 技能设置）中读取，此处不列出具体值。

## 两种识别模式（由配置决定，不在此硬编码）

**preset 模式**：从配置提供的分类标签列表中选择最匹配的一项。对话信息不足时输出 null。

**llm 模式**：由大模型根据对话内容自由生成 ≤10 字的需求描述。对话信息不足时输出 null。

## 调用时机

每条用户消息后自动触发。主 Agent 调用 `analyze_visitor_intent` 时也会触发。

## 输出

- 写入 `session.analysis.demand_type`
- 推送到 N2 对话工作台「AI 副驾·需求类型」区
- 留资时快照写入 N7 线索池「需求类型」字段
