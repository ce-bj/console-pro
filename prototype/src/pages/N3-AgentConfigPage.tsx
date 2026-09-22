import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AIQualityDashboard from './agent-quality/AIQualityDashboard';

// ── 类型定义 ───────────────────────────────────────────────────────
type AgentRole = 'pre_sale' | 'after_sale' | 'tech_support' | 'sales_consultant' | 'marketing';
type ResponseStyle = 'instant' | 'professional' | 'warm' | 'collaborative';
type AgentLang = 'detect' | 'site' | 'fixed';
type OpeningMode = 'ai_dynamic' | 'custom';

interface SkillConfig {
  key: string;
  label: string;
  sub: string;            // 副标题（与现状技能卡一致）
  icon: string;
  desc: string;
  enabled: boolean;
  /** 归属 Agent：conversation=主对话 Agent / analysis=后台分析 Agent */
  agentType: 'conversation' | 'analysis';
  /** 该技能适用的客服人设 */
  applicableRoles: AgentRole[];
  /** 绑定的 AgentScope 工具 */
  tool?: string;
  /** 「配置」入口指向 */
  configTarget?: 'lead' | 'routing' | 'trigger' | 'demand_type' | 'pre_sales' | 'sales_progress';
}

interface TriggerRule {
  key: string;
  label: string;
  desc: string;
  enabled: boolean;
  threshold?: string;
}

interface AgentConfig {
  name: string;
  description: string;
  companyName: string;
  industryName: string;
  mainProducts: string;
  industryKeywords: string[];
  role: AgentRole;
  responseStyle: ResponseStyle;
  language: AgentLang;
  openingMode: OpeningMode;
  openingText: string;
  openingQuestions: string[];
}

interface KnowledgeDirectory {
  directoryId: string;
  directoryName: string;
  description: string;
  documentCount: number;
  enabled: boolean;
}

interface StageCriterion {
  key: string;
  label: string;
  weight: number;
  required: boolean;
}

interface SalesStage {
  key: string;
  name: string;
  goal: string;
  enabled: boolean;
  threshold: number | null;
  criteria: StageCriterion[];
  style: string;
  hook: string;
  actions: string[];
}

// 客服话术统一在 N3 页面维护，并同步保存至企业业务知识库 / 业务与服务 / 营销话术。
// 系统预设仅可启停或复制为企业话术；企业新增话术可编辑、删除。
interface TalkScenario {
  key: string;
  stageKeys: string[];
  title: string;
  useWhen: string;
  replyText: string;
  nextQuestion: string;
  source: 'platform' | 'company';
  enabled: boolean;
  syncStatus?: 'built_in' | 'synced' | 'pending';
  updatedAt?: string;
  kbAssetPath?: string;
}

interface GlossaryTranslation {
  language: string;
  languageLabel: string;
  text: string;
}

// 多语言词条没有平台预置。页面新增与知识库文件同步最终进入同一列表，知识库是唯一存储。
interface IndustryGlossaryTerm {
  termId: string;
  sourceLanguage: string;
  sourceLanguageLabel: string;
  standardTerm: string;
  usageNote?: string;
  translations: GlossaryTranslation[];
  source: 'page' | 'knowledge';
  sourceFileName: string;
  enabled: boolean;
  syncStatus: 'synced' | 'pending';
  updatedAt?: string;
  kbAssetPath: string;
}

interface SalesEvent {
  key: string;
  name: string;
  source: 'platform' | 'company';
  situation: string;
  resolution: string;
  returnMode: 'previous' | 'stage' | 'reassess' | 'end' | 'handoff';
  returnStageKey?: string;
  guidanceResume: 'immediate' | 'on_new_signal' | 'none';
  waitMinutes?: number;
  timeoutAction?: 'return_ai' | 'leave_contact' | 'end';
  enabled: boolean;
}

// ── DataSlot: 智能体基础配置 ───────────────────────────────────────
// DataSlot: 智能体配置
const mockAgentConfig: AgentConfig = {
  name: 'Anvil 智能销售助手',
  description: '面向门户访客的 AI 售前顾问，负责答疑、渐进式留资与意向识别，必要时转人工。',
  companyName: '邢台互诚水利机械有限公司',
  industryName: '机械五金',
  mainProducts: '铸铁闸门、钢制闸门、螺杆启闭机、卷扬启闭机',
  industryKeywords: ['企业SaaS', 'AI Agent', '外贸营销', '多租户'],
  role: 'pre_sale',
  responseStyle: 'instant',
  language: 'detect',
  openingMode: 'ai_dynamic',
  openingText: '你好！我是 Anvil 智能助手，可以帮您了解产品功能、价格方案与对接方式 👋',
  openingQuestions: ['请问您主要关注哪方面？', '您所在的行业是？', '需要我帮您预约一次演示吗？'],
};

// DataSlot: 可供当前智能体绑定的知识目录（与全门户知识目录同源）
const mockKnowledgeDirectoriesData: KnowledgeDirectory[] = [
  { directoryId: 'brand', directoryName: '品牌知识', description: '品牌介绍、企业背景与品牌口径', documentCount: 18, enabled: true },
  { directoryId: 'product', directoryName: '产品知识', description: '产品功能、规格、方案与选型资料', documentCount: 46, enabled: true },
  { directoryId: 'policy', directoryName: '政策制度', description: '服务规则、交付政策与合规说明', documentCount: 12, enabled: false },
  { directoryId: 'faq', directoryName: '常见问题', description: '高频咨询、标准问答与问题处理口径', documentCount: 31, enabled: true },
  { directoryId: 'other', directoryName: '其它知识', description: '尚未归入业务目录的通用资料', documentCount: 7, enabled: false },
];

// DataSlot: 技能开关（对齐线上现状「技能设置」8 项 + 本次新增：意向收集「配置」=渐进式留资）
const mockSkills: SkillConfig[] = [
  { key: 'product_rec', label: '产品推荐', sub: '个性化产品推荐', icon: '📦',
    desc: '用户主动咨询产品/服务或表达模糊需求（如"预算3000选手机"），意图命中"产品咨询/选型"，结合用户画像（预算、场景、偏好）与知识库匹配推荐。',
    enabled: true, agentType: 'conversation', applicableRoles: ['pre_sale', 'sales_consultant', 'marketing'], tool: 'push_ui_component' },
  { key: 'ai_search', label: 'AI搜索', sub: '自然语言搜索引擎', icon: '🔍',
    desc: '用户发起相关产品咨询请求时，系统自动触发智能搜索业务流程，AI 基于用户需求完成内容匹配并返回对应搜索结果。关联应用：AI搜索。',
    enabled: true, agentType: 'conversation', applicableRoles: ['pre_sale', 'after_sale', 'tech_support', 'sales_consultant', 'marketing'], tool: 'rag_search' },
  { key: 'handoff', label: '转人工', sub: '转人工客服', icon: '🎧',
    desc: 'AI 识别到用户有情绪时优先安抚，情绪过激或识别到转人工意图时触发人工转接流程；人工忙线 30 秒内未回复，则自动触发线索留资技能引导留资。',
    enabled: true, agentType: 'conversation', applicableRoles: ['pre_sale', 'after_sale', 'tech_support', 'sales_consultant', 'marketing'], tool: 'handoff_human', configTarget: 'routing' },
  { key: 'inquiry', label: '产品询价', sub: '产品价格查询', icon: '💰',
    desc: '当用户发起产品询价时，智能体基于站内知识库输出标准化答复，同时以"提供更精准详细报价"为切入点，自然引导用户留存联系方式。',
    enabled: true, agentType: 'conversation', applicableRoles: ['pre_sale', 'sales_consultant'], tool: 'push_ui_component' },
  { key: 'after_sale', label: '售后服务', sub: '售后服务咨询', icon: '🛎️',
    desc: '用户触发售后问题处理意向后，智能体先执行情绪安抚动作，再引导用户完成售后工单提交，同时传递"诉求将被快速响应处理"的正向反馈。关联能力：会员中心。',
    enabled: true, agentType: 'conversation', applicableRoles: ['after_sale'], tool: 'create_ticket' },
  { key: 'lead_collect', label: '意向收集', sub: '意向线索收集', icon: '📝',
    desc: '用户表达产品兴趣但需求模糊，或主动咨询后未明确下一步行动，命中"产品咨询/选型"但未触发询价/购买：解答基础疑问 → 主动引导留资 → 收集核心信息 → 同步 CRM。',
    enabled: true, agentType: 'conversation', applicableRoles: ['pre_sale', 'sales_consultant'], tool: 'create_lead', configTarget: 'lead' },
  { key: 'pre_sales', label: '售前处理', sub: '根据需求、售前成熟度和当前事件持续推进客户对话', icon: '🧭',
    desc: '根据客户当前问题、需求类型和售前进度，先完成答疑，再自然推进一个合适的下一步。平台已预置完整配置，可直接启用。',
    enabled: true, agentType: 'conversation', applicableRoles: ['pre_sale'], tool: 'sales_progress_context', configTarget: 'pre_sales' },
  { key: 'proactive', label: '主动交流', sub: '主动发起会话邀请', icon: '💬',
    desc: '根据用户来源、访问行为及停留时间深度分析识别意图，结合公司业务信息主动发起会话邀请。触发策略：停留 60s 未互动、单产品详情停留 30s、访问 3 个以上产品详情页等。',
    enabled: true, agentType: 'conversation', applicableRoles: ['pre_sale', 'marketing'], tool: 'push_ui_component', configTarget: 'trigger' },
  { key: 'survey', label: '回复调研', sub: '知识库回复内容调研', icon: '📋',
    desc: '针对知识库回复的内容进行用户调研，是否解决用户提出的问题；当用户选择"未解决"时，将问题自动收集到"未回答"库内。',
    enabled: true, agentType: 'conversation', applicableRoles: ['after_sale', 'tech_support'], tool: 'push_ui_component' },
  { key: 'demand_classify', label: '需求类型识别', sub: '对话需求分类与总结', icon: '🏷️',
    desc: '在对话过程中自动识别并标注用户需求类型，支持预设分类（如价格咨询、案例索取、功能咨询等）和大模型自动总结两种模式，结果同步至线索池需求类型字段，在对话工作台右侧实时展示。',
    enabled: true, agentType: 'analysis', applicableRoles: ['pre_sale', 'after_sale', 'tech_support', 'sales_consultant', 'marketing'], tool: 'classify_demand', configTarget: 'demand_type' },
  { key: 'sales_stage_analysis', label: '客户进度识别', sub: '自动识别客户当前所处的售前阶段', icon: '📶',
    desc: '根据对话中已确认的信息和实际完成结果，识别客户当前进度、仍缺少的信息，以及报价、Demo、人工等临时请求。',
    enabled: true, agentType: 'analysis', applicableRoles: ['pre_sale'], tool: 'score_sales_progress', configTarget: 'sales_progress' },
];

// DataSlot: 触发器规则
const mockTriggers: TriggerRule[] = [
  { key: 'proactive_greet', label: '主动招呼', desc: '进站 N 秒后或滚动达阈值时主动发起对话', enabled: true, threshold: '停留 8s' },
  { key: 'churn_intercept', label: '流失拦截', desc: '检测到移向关闭/切 Tab 时低摩擦挽回', enabled: false, threshold: 'move_to_close' },
  { key: 'handoff_trigger', label: '转人工触发', desc: '意向分≥阈值 / 情绪转负 / 用户明确要求', enabled: true, threshold: '意向≥80 或 情绪<-0.5' },
  { key: 'lead_form', label: '留资弹窗', desc: '对话推进到 N 轮且命中意向关键词时弹出留资表单', enabled: true, threshold: '≥4 轮 + 意向命中' },
];

// DataSlot: 售前处理 6 阶段平台默认值
const mockSalesStagesData: SalesStage[] = [
  { key: 'S0', name: '接待与建立信任', goal: '让用户愿意说明问题', enabled: true, threshold: null, criteria: [{ key: 'conversation_started', label: '客户已进入会话，但需求还不明确', weight: 100, required: true }], style: '亲切、简短、低压力', hook: '您更关注产品、选型、案例，还是报价？', actions: ['answer', 'rag_search', 'confirm_dialog', 'request_human_handoff'] },
  { key: 'S1', name: '需求发现', goal: '明确核心问题和使用场景', enabled: true, threshold: 65, criteria: [{ key: 'core_problem', label: '明确客户想解决的核心问题', weight: 40, required: true }, { key: 'usage_scene', label: '明确产品使用场景', weight: 35, required: false }, { key: 'continue_signal', label: '客户愿意继续沟通', weight: 25, required: false }], style: '顾问式澄清', hook: '方便说说您准备把它用在哪个场景吗？', actions: ['answer', 'rag_search', 'confirm_dialog', 'request_human_handoff'] },
  { key: 'S2', name: '条件澄清', goal: '获得影响判断的关键条件', enabled: true, threshold: 65, criteria: [{ key: 'usage_scene', label: '明确使用场景', weight: 25, required: true }, { key: 'key_constraint', label: '明确至少一个关键限制条件', weight: 25, required: true }, { key: 'project_context', label: '了解项目背景', weight: 20, required: false }, { key: 'time_quantity', label: '了解时间或数量', weight: 20, required: false }, { key: 'other_condition', label: '了解其它决策条件', weight: 10, required: false }], style: '专业、结构化', hook: '目前最需要确认的是数量、时间还是现场条件？', actions: ['answer', 'rag_search', 'confirm_dialog', 'request_human_handoff'] },
  { key: 'S3', name: '方案匹配', goal: '给出有依据的方案方向', enabled: true, threshold: 70, criteria: [{ key: 'recommendation_set', label: '推荐所需信息已基本完整', weight: 40, required: true }, { key: 'knowledge_match', label: '知识库中存在可匹配方案', weight: 30, required: true }, { key: 'evidence', label: '存在案例、价值或差异证据', weight: 15, required: false }, { key: 'continue_solution', label: '客户愿意继续讨论方案', weight: 15, required: false }], style: '专业推荐、价值证明', hook: '接下来您想先看相似案例、配置差异，还是报价准备项？', actions: ['answer', 'rag_search', 'confirm_dialog', 'request_human_handoff'] },
  { key: 'S4', name: '行动确认', goal: '确认报价、演示或销售联系等下一步', enabled: true, threshold: 70, criteria: [{ key: 'next_action', label: '客户明确选择下一步', weight: 40, required: true }, { key: 'action_fields', label: '办理下一步所需信息完整', weight: 30, required: true }, { key: 'contact_consent', label: '客户同意联系或执行安排', weight: 30, required: false }], style: '清晰、行动导向', hook: '您希望预约演示、申请报价，还是让销售直接联系？', actions: ['answer', 'rag_search', 'confirm_dialog', 'lead_capture_form', 'request_human_handoff'] },
  { key: 'S5', name: '留资与交接', goal: '形成可跟进结果', enabled: true, threshold: 100, criteria: [{ key: 'business_result', label: '留资、预约、报价申请或人工接待已完成', weight: 70, required: true }, { key: 'summary_saved', label: '客户需求和沟通摘要已保存', weight: 30, required: true }], style: '准确复述、确认安排', hook: '如有图纸或现场照片，可继续补充给顾问。', actions: ['answer', 'rag_search', 'request_human_handoff'] },
];

// DataSlot: 按售前阶段提供的可编辑话术
const mockTalkScenariosData: TalkScenario[] = [
  { key: 's0_welcome', stageKeys: ['S0'], title: '欢迎并说明可以提供的帮助', useWhen: '客户首次进入或打招呼', replyText: '您好，我可以帮您了解产品、选型、案例和报价，也可以安排销售顾问进一步沟通。', nextQuestion: '您这次更想先了解哪一方面？', source: 'platform', enabled: true },
  { key: 's0_product', stageKeys: ['S0', 'S1'], title: '客户直接询问产品', useWhen: '客户直接询问某个产品', replyText: '可以的，我先为您介绍这款产品的主要用途和适用范围。为了避免推荐偏差，我也会根据您的实际场景补充说明。', nextQuestion: '您准备把它用在什么场景？', source: 'platform', enabled: true },
  { key: 's0_unclear', stageKeys: ['S0', 'S1'], title: '客户需求还比较模糊', useWhen: '客户只说“了解一下”或“有什么推荐”', replyText: '没问题，我可以根据使用场景帮您缩小范围，不需要您一次提供很多信息。', nextQuestion: '您目前更关注解决什么问题？', source: 'platform', enabled: true },
  { key: 's1_scene', stageKeys: ['S1', 'S2'], title: '了解使用场景', useWhen: '已经知道客户关注的产品或问题', replyText: '了解了。不同使用场景对产品规格和方案选择会有影响，我先帮您把范围理清。', nextQuestion: '这个产品主要会用在什么项目或现场？', source: 'platform', enabled: true },
  { key: 's1_pain', stageKeys: ['S1'], title: '确认核心问题', useWhen: '客户描述了现状但目标不明确', replyText: '我理解您当前的情况。为了给出更贴合的建议，我需要先确认这次最希望改善的问题。', nextQuestion: '您现在最想优先解决的是哪一个问题？', source: 'platform', enabled: true },
  { key: 's1_term', stageKeys: ['S1', 'S2', 'S3'], title: '解释行业术语', useWhen: '客户使用简称、别名或专业术语', replyText: '您提到的这个说法在不同地区可能对应不同规格，我会按您所在行业的常用定义来理解。', nextQuestion: '您说的是哪种用途或结构形式？', source: 'platform', enabled: true },
  { key: 's2_parameter', stageKeys: ['S2'], title: '补充关键参数', useWhen: '方案判断还缺少规格参数', replyText: '目前的场景已经比较清楚，还需要一个关键参数才能进一步判断适合的规格。', nextQuestion: '方便确认一下主要尺寸或承受条件吗？', source: 'platform', enabled: true },
  { key: 's2_quantity', stageKeys: ['S2', 'S4'], title: '确认数量和时间', useWhen: '客户准备采购或询价', replyText: '数量和期望时间会影响备货、交付和报价方式，我可以先按大致范围为您判断。', nextQuestion: '预计需要多少套，计划什么时候使用？', source: 'platform', enabled: true },
  { key: 's2_unknown', stageKeys: ['S1', 'S2'], title: '客户暂时不知道参数', useWhen: '客户无法提供专业参数', replyText: '没关系，参数暂时不清楚也可以继续。您可以提供现场情况、图纸或照片，我们再协助确认。', nextQuestion: '您现在方便描述现场情况，还是稍后补充资料？', source: 'platform', enabled: true },
  { key: 's3_recommend', stageKeys: ['S3'], title: '给出方案方向', useWhen: '信息足够，可以推荐方向', replyText: '结合您目前的使用场景和条件，更适合优先考虑这一方案。它的优势是匹配当前需求，同时保留后续调整空间。', nextQuestion: '您想先看配置差异，还是相似项目案例？', source: 'platform', enabled: true },
  { key: 's3_case', stageKeys: ['S1', 'S2', 'S3'], title: '用案例帮助客户判断', useWhen: '客户希望了解案例或实际效果', replyText: '我们有相近场景的应用案例，可以重点参考使用条件、配置方式和最终效果。', nextQuestion: '您更想看同行业案例，还是相近参数的案例？', source: 'platform', enabled: true },
  { key: 's3_compare', stageKeys: ['S3'], title: '说明方案差异', useWhen: '客户在多个方案之间比较', replyText: '这几个方案都可以使用，主要区别在适用条件、投入和后续维护方式，我可以按您的优先级做取舍。', nextQuestion: '您更看重价格、交付时间还是长期使用成本？', source: 'platform', enabled: true },
  { key: 's4_quote', stageKeys: ['S2', 'S3', 'S4'], title: '承接报价申请', useWhen: '客户明确要求报价', replyText: '可以为您准备报价。为了让报价可直接参考，需要先确认产品、数量和主要规格。', nextQuestion: '我先帮您核对数量和规格，可以吗？', source: 'platform', enabled: true },
  { key: 's4_demo', stageKeys: ['S3', 'S4'], title: '预约演示或方案沟通', useWhen: '客户希望进一步演示或沟通', replyText: '可以安排顾问结合您的场景做一次针对性介绍，并提前准备相关产品和案例。', nextQuestion: '您希望哪一天、哪个时间段沟通？', source: 'platform', enabled: true },
  { key: 's4_contact', stageKeys: ['S4'], title: '确认联系安排', useWhen: '客户同意后续联系', replyText: '好的，我们会按您确认的方式安排专人联系，并同步您已经说明的需求，避免重复沟通。', nextQuestion: '请问用电话还是微信联系更方便？', source: 'platform', enabled: true },
  { key: 's5_confirm', stageKeys: ['S5'], title: '确认已经完成的安排', useWhen: '留资、预约或报价申请已完成', replyText: '已经为您记录完成，我再确认一下：我们将根据当前需求准备资料，并按约定方式与您联系。', nextQuestion: '目前还有哪项信息需要一起补充？', source: 'platform', enabled: true },
  { key: 's5_handoff', stageKeys: ['S4', 'S5'], title: '说明后续交接', useWhen: '已经转交销售或人工客服', replyText: '您的需求和已确认信息已经同步给负责同事，对方可以在此基础上继续沟通。', nextQuestion: '需要我再补充备注什么重点吗？', source: 'platform', enabled: true },
  { key: 's5_material', stageKeys: ['S3', 'S4', 'S5'], title: '邀请补充资料', useWhen: '客户可能还有图纸、照片或清单', replyText: '如果后续方便，您可以继续补充图纸、现场照片或采购清单，顾问会结合资料进一步确认。', nextQuestion: '您更方便补充哪一类资料？', source: 'platform', enabled: true },
  { key: 'company_case', stageKeys: ['S2', 'S3'], title: '水利项目案例说明', useWhen: '客户希望了解相近水利项目的应用情况', replyText: '我们可以结合您的使用场景提供相近项目的配置和应用说明，帮助您判断是否适用。', nextQuestion: '您更关注项目规模、现场条件，还是配置方式？', source: 'company', enabled: true, syncStatus: 'synced', updatedAt: '2026-09-03 11:20', kbAssetPath: '企业业务知识库/业务与服务/营销话术' },
  { key: 'company_delivery', stageKeys: ['S2', 'S4'], title: '确认交付周期', useWhen: '客户询问交期或项目时间紧张', replyText: '交付时间会受规格、数量和排产安排影响，我可以先根据您的项目计划为您核对可行的时间范围。', nextQuestion: '您的项目最晚需要在什么时间前到货？', source: 'company', enabled: true, syncStatus: 'synced', updatedAt: '2026-09-02 15:10', kbAssetPath: '企业业务知识库/业务与服务/营销话术' },
];

// DataSlot: 企业多语言词条。产品规则：新企业默认为空；以下为原型演示企业的已维护样例。
// 页面新增和知识库同步后均进入同一列表，不存在平台预置词条。
const mockIndustryGlossaryData: IndustryGlossaryTerm[] = [
  {
    termId: 'glossary-001', sourceLanguage: 'zh-CN', sourceLanguageLabel: '简体中文', standardTerm: '螺杆启闭机',
    usageNote: '用于闸门启闭的常用设备名称；对外英文资料统一使用 Screw Hoist。',
    translations: [
      { language: 'en-US', languageLabel: 'English', text: 'Screw Hoist' },
      { language: 'ru-RU', languageLabel: 'Русский', text: 'Винтовой подъёмник' },
    ],
    source: 'page', sourceFileName: '多语言配置（页面维护）.xlsx', enabled: true, syncStatus: 'synced', updatedAt: '2026-09-03 10:15',
    kbAssetPath: '企业公共知识库/多语言与版本/多语言配置',
  },
  {
    termId: 'glossary-002', sourceLanguage: 'zh-CN', sourceLanguageLabel: '简体中文', standardTerm: '铸铁闸门',
    usageNote: '适用于水利工程中的止水与流量控制；避免与钢制闸门混用。',
    translations: [
      { language: 'en-US', languageLabel: 'English', text: 'Cast Iron Sluice Gate' },
      { language: 'es-ES', languageLabel: 'Español', text: 'Compuerta de hierro fundido' },
    ],
    source: 'page', sourceFileName: '多语言配置（页面维护）.xlsx', enabled: true, syncStatus: 'synced', updatedAt: '2026-09-02 16:40',
    kbAssetPath: '企业公共知识库/多语言与版本/多语言配置',
  },
  {
    termId: 'glossary-003', sourceLanguage: 'zh-CN', sourceLanguageLabel: '简体中文', standardTerm: '止水橡皮',
    usageNote: '用于闸门密封的橡胶止水部件；客户使用“橡胶止水带”时可按上下文确认。',
    translations: [
      { language: 'en-US', languageLabel: 'English', text: 'Rubber Waterstop Seal' },
      { language: 'ar-SA', languageLabel: 'العربية', text: 'مانع تسرب مطاطي للمياه' },
    ],
    source: 'page', sourceFileName: '多语言配置（页面维护）.xlsx', enabled: false, syncStatus: 'synced', updatedAt: '2026-08-28 09:30',
    kbAssetPath: '企业公共知识库/多语言与版本/多语言配置',
  },
];

const EMPTY_GLOSSARY_DRAFT: IndustryGlossaryTerm = {
  termId: '', sourceLanguage: 'zh-CN', sourceLanguageLabel: '简体中文', standardTerm: '', usageNote: '',
  translations: [{ language: '', languageLabel: '', text: '' }], source: 'page', sourceFileName: '多语言配置（页面维护）.xlsx',
  enabled: true, syncStatus: 'pending', kbAssetPath: '企业公共知识库/多语言与版本/多语言配置',
};

// DataSlot: 客户可能临时提出的特殊情况
const mockSalesEventsData: SalesEvent[] = [
  { key: 'complaint', name: '投诉或情绪激动', source: 'platform', situation: '客户表达不满、投诉，或要求无法确认的承诺。', resolution: '暂停售前推进，优先转人工处理；AI 只说明可处理范围，不继续追问。', returnMode: 'handoff', guidanceResume: 'none', waitMinutes: 1, timeoutAction: 'leave_contact', enabled: true },
  { key: 'human', name: '要求人工或联系方式', source: 'platform', situation: '客户说“找人工”“给我电话”或希望销售联系。', resolution: '立即转人工或提供已公开的联系方式，暂停 AI 售前推进。', returnMode: 'handoff', guidanceResume: 'none', waitMinutes: 1, timeoutAction: 'leave_contact', enabled: true },
  { key: 'quote', name: '直接询价或索要报价单', source: 'platform', situation: '客户直接问价格、项目预算、含税价，或要求报价单。', resolution: '先说明可公开的价格口径；只补问一项当前最缺的报价条件，不在一轮内连续追问。', returnMode: 'stage', returnStageKey: 'S2', guidanceResume: 'immediate', enabled: true },
  { key: 'demo', name: '要求演示、方案或现场沟通', source: 'platform', situation: '客户希望看演示、要方案、预约沟通或安排现场勘查。', resolution: '进入预约或方案申请流程，收集预约所需信息后提交，不再要求按原阶段继续回答。', returnMode: 'end', guidanceResume: 'none', enabled: true },
  { key: 'reject', name: '拒绝留资或继续追问', source: 'platform', situation: '客户表示暂时不留联系方式，或不希望继续回答。', resolution: '停止索取信息，继续正常答疑；客户主动表达继续了解或补充信息后，再恢复售前推进。', returnMode: 'previous', guidanceResume: 'on_new_signal', enabled: true },
  { key: 'material', name: '缺少参数、图纸或需要技术确认', source: 'platform', situation: '客户无法确认规格参数，或表示需要先找图纸、现场照片、技术人员确认。', resolution: '保留已确认信息，说明可以补充的资料类型；客户提交资料后，再继续澄清需求。', returnMode: 'stage', returnStageKey: 'S2', guidanceResume: 'on_new_signal', enabled: true },
  { key: 'switch', name: '中途更换产品或需求', source: 'platform', situation: '客户改变产品、使用场景或项目目标。', resolution: '以新需求为准重新识别，保留仍然有效的信息。', returnMode: 'reassess', guidanceResume: 'immediate', enabled: true },
  { key: 'postpone', name: '项目暂缓或需要内部确认', source: 'platform', situation: '客户表示近期不采购、项目未立项，或需要内部讨论后再联系。', resolution: '停止催促成交或留资，保留当前沟通摘要；客户再次咨询时按新消息重新判断。', returnMode: 'end', guidanceResume: 'none', enabled: true },
  { key: 'question', name: '中途询问产品、参数或案例', source: 'platform', situation: '客户临时询问产品、参数、案例或交期。', resolution: '优先回答当前问题，回答后恢复原来的售前进度。', returnMode: 'previous', guidanceResume: 'immediate', enabled: true },
];

// ── ActionSlot ────────────────────────────────────────────────────

// ACTION: 保存智能体配置 [PUT] /api/agents/{agent_id}/config
function handleSaveConfig(config: Partial<AgentConfig>): void {
  console.log('save agent config', config);
  alert('智能体配置已保存');
}

// ACTION: 切换技能开关 [PATCH] /api/agents/{agent_id}/skills/{skill_key}
function handleToggleSkill(skillKey: string, enabled: boolean): void {
  console.log('toggle skill', skillKey, enabled);
}

// ACTION: 切换触发器 [PATCH] /api/agents/{agent_id}/triggers/{trigger_key}
function handleToggleTrigger(triggerKey: string, enabled: boolean): void {
  console.log('toggle trigger', triggerKey, enabled);
}

// ACTION: 获取智能体可绑定的知识目录 [GET] /api/agents/{agent_id}/knowledge-directories
function handleFetchKnowledgeDirectories(): void {
  console.log('fetch agent knowledge directories');
}

// ACTION: 切换智能体知识目录绑定 [PATCH] /api/agents/{agent_id}/knowledge-directories/{directory_id}
function handleToggleKnowledgeDirectory(directoryId: string, enabled: boolean): void {
  console.log('toggle agent knowledge directory', directoryId, enabled);
}

// ACTION: 获取售前处理配置 [GET] /api/agents/{agent_id}/skills/pre-sales/config
function handleFetchPreSalesConfig(): void {
  console.log('fetch pre-sales config');
}

// ACTION: 保存售前处理配置 [PUT] /api/agents/{agent_id}/skills/pre-sales/config
function handleSavePreSalesConfig(): void {
  console.log('save pre-sales config');
  alert('售前处理配置已保存，将从新会话开始生效');
}

// ACTION: 恢复售前处理平台默认值 [POST] /api/agents/{agent_id}/skills/pre-sales/config/defaults
function handleRestorePreSalesDefaults(): void {
  console.log('restore pre-sales defaults');
}

// ACTION: 保存售前阶段设置 [PUT] /api/agents/{agent_id}/skills/pre-sales/stages/{stage_key}
function handleSaveSalesStage(stage: SalesStage): void {
  console.log('save sales stage', stage);
}

// ACTION: 启用或关闭售前阶段 [PATCH] /api/agents/{agent_id}/skills/pre-sales/stages/{stage_key}
function handleToggleSalesStage(stageKey: string, enabled: boolean): void {
  console.log('toggle sales stage', stageKey, enabled);
}

// ACTION: 保存客户进度识别评分规则 [PUT] /api/agents/{agent_id}/skills/sales-progress/scoring
function handleSaveSalesProgressScoring(stages: SalesStage[]): void {
  console.log('save sales progress scoring', stages);
  alert('客户进度识别评分规则已保存，将从新会话开始生效');
}

// ACTION: 保存特殊情况处理方式 [PUT] /api/agents/{agent_id}/skills/pre-sales/events/{event_key}
function handleSaveSalesEvent(event: SalesEvent): void {
  console.log('save sales event', event);
}

// ACTION: 新增特殊情况处理方式 [POST] /api/agents/{agent_id}/skills/pre-sales/events
function handleCreateSalesEvent(event: SalesEvent): void {
  console.log('create sales event', event);
}

// ACTION: 删除企业特殊情况 [DELETE] /api/agents/{agent_id}/skills/pre-sales/events/{event_key}
function handleDeleteSalesEvent(eventKey: string): void {
  console.log('delete sales event', eventKey);
}

// ACTION: 切换特殊情况处理方式 [PATCH] /api/agents/{agent_id}/skills/pre-sales/events/{event_key}
function handleToggleSalesEvent(eventKey: string, enabled: boolean): void {
  console.log('toggle sales event', eventKey, enabled);
}

// ACTION: 保存并发布客服话术，同步写入企业业务知识库/业务与服务/营销话术（Excel）[PUT] /api/agents/{agent_id}/skills/pre-sales/talk-scenarios/{talk_key}
function handleSaveTalkTrack(talkTrack: TalkScenario): void {
  console.log('save & publish talk scenario, sync to knowledge base excel', talkTrack);
}

// ACTION: 新增并发布客服话术 [POST] /api/agents/{agent_id}/skills/pre-sales/talk-scenarios
function handleCreateTalkTrack(talkTrack: TalkScenario): void {
  console.log('create & publish talk scenario', talkTrack);
}

// ACTION: 上传话术 Excel 并保存至知识库 [POST] /api/agents/{agent_id}/skills/pre-sales/talk-scenarios/import
function handleImportTalkTracks(): void {
  console.log('import talk tracks and save to knowledge base');
  alert('已导入话术并同步到「企业业务知识库 / 业务与服务 / 营销话术」。请在列表中补充适用阶段后启用。');
}

// ACTION: 删除企业话术 [DELETE] /api/agents/{agent_id}/skills/pre-sales/talk-scenarios/{talk_key}
function handleDeleteTalkTrack(talkKey: string): void {
  console.log('delete company talk track', talkKey);
}

// ACTION: 保存页面维护的多语言词条并同步知识库 [PUT] /api/agents/{agent_id}/skills/pre-sales/industry-glossary/{term_id}
function handleSaveGlossaryTerm(term: IndustryGlossaryTerm): void {
  console.log('save & publish glossary term, sync to knowledge base excel', term);
}

// ACTION: 新增多语言词条并同步知识库 [POST] /api/agents/{agent_id}/skills/pre-sales/industry-glossary
function handleCreateGlossaryTerm(term: IndustryGlossaryTerm): void {
  console.log('create & publish glossary term', term);
}

// ACTION: 上传多语言词条并保存至知识库 [POST] /api/agents/{agent_id}/skills/pre-sales/industry-glossary/import
function handleImportGlossaryTerms(): void {
  console.log('import glossary terms and save to knowledge base');
  alert('已导入多语言词条并同步保存至知识库。');
}

// ACTION: 删除多语言词条 [DELETE] /api/agents/{agent_id}/skills/pre-sales/industry-glossary/{term_id}
function handleDeleteGlossaryTerm(termId: string): void {
  console.log('delete glossary term', termId);
}

// ── 辅助常量 ──────────────────────────────────────────────────────
const ROLE_OPTIONS: { value: AgentRole; label: string; desc: string }[] = [
  { value: 'pre_sale', label: '售前客服', desc: '产品咨询、需求澄清、方案推荐与商机转化' },
  { value: 'after_sale', label: '售后客服', desc: '服务受理、进度查询、问题分流与工单协同' },
  { value: 'tech_support', label: '技术支持', desc: '技术诊断、知识解答、排障指导与升级处理' },
  { value: 'sales_consultant', label: '销售顾问', desc: '商机跟进、方案沟通、报价推进与成交协同' },
  { value: 'marketing', label: '市场营销', desc: '品牌咨询、活动承接、内容分发与线索转化' },
];

const LANGUAGE_OPTIONS = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁体中文' },
  { value: 'en-US', label: '英语' },
  { value: 'es-ES', label: '西班牙语' },
  { value: 'fr-FR', label: '法语' },
  { value: 'de-DE', label: '德语' },
  { value: 'ja-JP', label: '日语' },
] as const;

const STYLE_OPTIONS: { value: ResponseStyle; label: string }[] = [
  { value: 'instant', label: '即时指令型' },
  { value: 'professional', label: '专业严谨型' },
  { value: 'warm', label: '温暖亲和型' },
  { value: 'collaborative', label: '协作统筹型' },
];

type SkillAgentFilter = 'all' | 'conversation' | 'analysis';
type SkillRoleFilter = 'all' | AgentRole;
type GoalCompletionMode = 'any' | 'all';

const SALES_GOAL_COMPLETION_OPTIONS = ['获取有效客户信息', '完成演示或沟通预约', '提交报价或方案需求', '成功转接销售人员'];
const DEFAULT_SALES_BUSINESS_GOAL = '识别客户需求，提供匹配的产品或方案，并推动形成明确的后续业务安排。';

const INTERNAL_COMMUNICATION_OPTIONS = [
  '人情化亲和人设：拉近距离 + 快速建立信任',
  '高效直给人设：直击需求 + 减少沟通成本',
  '专业顾问人设：懂产品 + 懂行业 + 提供解决方案',
  '问题兜底人设：主动担责 + 快速解决售后',
  '灵活促单人设：兼顾服务 + 推动转化',
];

const EXTERNAL_COMMUNICATION_OPTIONS = [
  '文化适配型人设：本土化表达 + 礼仪合规',
  '时差友好型人设：异步沟通 + 即时响应预案',
  '多语言专业型人设：精准翻译 + 术语统一',
  '风险预判型人设：主动提示 + 问题前置',
  '转化导向型人设：灵活议价 + 跟进促单',
];

const ROLE_OBJECTIVE_CONFIG: Record<Exclude<AgentRole, 'pre_sale'>, { name: string; desc: string; completion: string }> = {
  after_sale: { name: '完成一次明确的售后受理', desc: '准确识别售后问题，完成可直接解决的答疑，或形成工单 / 人工接管结果。', completion: '问题解决、工单创建或人工接管任一成功' },
  tech_support: { name: '给出可验证的技术处理下一步', desc: '收集必要环境和故障信息，提供知识库支持的排查步骤，必要时升级技术人员。', completion: '方案确认、问题定位或技术升级任一完成' },
  sales_consultant: { name: '形成可持续跟进的销售机会', desc: '围绕明确商机提供方案建议，并确认报价、演示或后续跟进安排。', completion: '报价、演示、跟进安排或线索形成任一成功' },
  marketing: { name: '完成一次有效的营销承接', desc: '传递品牌与活动信息，并引导用户完成内容获取、活动报名或后续触达授权。', completion: '内容领取、活动报名或触达授权任一成功' },
};

// ── 渐进式留资：可配置留资表单（由「意向线索收集」技能的「配置」打开）──────
type FieldType = 'text' | 'email' | 'phone' | 'select' | 'multiselect' | 'textarea' | 'number';

interface FormField {
  fieldKey: string;
  label: string;
  type: FieldType;
  required: boolean;
  crmField: string;
  enabled: boolean;
  order: number;
}

// DataSlot: 可配置留资表单字段
const mockFormFields: FormField[] = [
  { fieldKey: 'name', label: '姓名', type: 'text', required: true, crmField: 'Person.name', enabled: true, order: 1 },
  { fieldKey: 'company', label: '公司名称', type: 'text', required: false, crmField: 'Company.name', enabled: true, order: 2 },
  { fieldKey: 'email', label: '邮箱', type: 'email', required: true, crmField: 'Person.emails.primaryEmail', enabled: true, order: 3 },
  { fieldKey: 'phone', label: '手机号', type: 'phone', required: false, crmField: 'Person.phones.primaryPhoneNumber', enabled: true, order: 4 },
  { fieldKey: 'job_title', label: '岗位', type: 'text', required: false, crmField: 'Person.jobTitle', enabled: true, order: 5 },
  { fieldKey: 'budget', label: '预算区间', type: 'select', required: false, crmField: 'custom_fields.budget', enabled: false, order: 6 },
  { fieldKey: 'pain_point', label: '主要痛点', type: 'textarea', required: false, crmField: 'custom_fields.pain_point', enabled: false, order: 7 },
];

const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  text: '文本', email: '邮箱', phone: '电话', select: '单选',
  multiselect: '多选', textarea: '多行', number: '数字',
};

// ACTION: 切换留资字段必填/启用 [PATCH] /api/forms/fields/{field_key}
function handleUpdateField(fieldKey: string, patch: Partial<FormField>): void {
  console.log('update lead field', fieldKey, patch);
}

// ACTION: 新增留资字段 [POST] /api/forms/fields
function handleAddField(): void {
  console.log('add lead field');
  alert('新增字段：标准字段入固定列，其它字段进 custom_fields(JSONB)');
}

// ACTION: 保存渐进式留资策略 [PUT] /api/agents/{agent_id}/lead-capture
function handleSaveLeadCapture(): void {
  console.log('save lead capture config');
  alert('渐进式留资配置已保存');
}

// ── 主组件 ────────────────────────────────────────────────────────
export default function AgentConfigPage() {
  const [cfg, setCfg] = useState<AgentConfig>(mockAgentConfig);
  const [tab, setTab] = useState('basic');
  const [skills, setSkills] = useState<SkillConfig[]>(mockSkills);
  const [triggers, setTriggers] = useState<TriggerRule[]>(mockTriggers);
  const [knowledgeDirectories, setKnowledgeDirectories] = useState<KnowledgeDirectory[]>(mockKnowledgeDirectoriesData);
  const [intentEnabled, setIntentEnabled] = useState(true);
  const [sentimentEnabled, setSentimentEnabled] = useState(false);
  const [skillAgentFilter, setSkillAgentFilter] = useState<SkillAgentFilter>('all');
  const [skillRoleFilter, setSkillRoleFilter] = useState<SkillRoleFilter>('all');
  const [internalCommunication, setInternalCommunication] = useState<string[]>(INTERNAL_COMMUNICATION_OPTIONS);
  const [externalCommunication, setExternalCommunication] = useState<string[]>(EXTERNAL_COMMUNICATION_OPTIONS);
  // 渐进式留资配置弹窗
  const [leadCfgOpen, setLeadCfgOpen] = useState(false);
  // 售前处理配置弹窗
  const [preSalesCfgOpen, setPreSalesCfgOpen] = useState(false);
  // 客户进度识别评分配置弹窗：评分项只读取售前阶段的达成条件
  const [salesProgressCfgOpen, setSalesProgressCfgOpen] = useState(false);
  const [preSalesSection, setPreSalesSection] = useState<'goal' | 'stages' | 'talk' | 'glossary' | 'events'>('goal');
  const [salesStages, setSalesStages] = useState<SalesStage[]>(mockSalesStagesData);
  const [talkScenarios, setTalkScenarios] = useState<TalkScenario[]>(mockTalkScenariosData);
  const [talkSourceFilter, setTalkSourceFilter] = useState<'all' | 'platform' | 'company'>('all');
  const [talkStageFilter, setTalkStageFilter] = useState('all');
  const [talkKeyword, setTalkKeyword] = useState('');
  const [talkEditorOpen, setTalkEditorOpen] = useState(false);
  const [talkEditorMode, setTalkEditorMode] = useState<'create' | 'edit'>('edit');
  const [talkEditorDraft, setTalkEditorDraft] = useState<TalkScenario>({ ...mockTalkScenariosData[0], stageKeys: [...mockTalkScenariosData[0].stageKeys] });
  const [talkViewerOpen, setTalkViewerOpen] = useState(false);
  const [talkViewerItem, setTalkViewerItem] = useState<TalkScenario | null>(null);
  const [glossaryTerms, setGlossaryTerms] = useState<IndustryGlossaryTerm[]>(mockIndustryGlossaryData);
  const [glossaryKeyword, setGlossaryKeyword] = useState('');
  const [glossaryEditorOpen, setGlossaryEditorOpen] = useState(false);
  const [glossaryEditorMode, setGlossaryEditorMode] = useState<'create' | 'edit'>('edit');
  const [glossaryEditorDraft, setGlossaryEditorDraft] = useState<IndustryGlossaryTerm>({ ...EMPTY_GLOSSARY_DRAFT, translations: EMPTY_GLOSSARY_DRAFT.translations.map((translation) => ({ ...translation })) });
  const [salesEvents, setSalesEvents] = useState<SalesEvent[]>(mockSalesEventsData);
  const [stageEditorOpen, setStageEditorOpen] = useState(false);
  const [stageEditorDraft, setStageEditorDraft] = useState<SalesStage>({ ...mockSalesStagesData[0], criteria: mockSalesStagesData[0].criteria.map((criterion) => ({ ...criterion })) });
  const [eventEditorOpen, setEventEditorOpen] = useState(false);
  const [eventEditorMode, setEventEditorMode] = useState<'create' | 'edit'>('edit');
  const [eventEditorDraft, setEventEditorDraft] = useState<SalesEvent>({ ...mockSalesEventsData[0] });
  const [eventViewerOpen, setEventViewerOpen] = useState(false);
  const [eventViewerItem, setEventViewerItem] = useState<SalesEvent | null>(null);
  const [salesBusinessGoal, setSalesBusinessGoal] = useState(DEFAULT_SALES_BUSINESS_GOAL);
  const [salesGoalCompletionMode, setSalesGoalCompletionMode] = useState<GoalCompletionMode>('any');
  const [salesGoalCompletionItems, setSalesGoalCompletionItems] = useState<string[]>(SALES_GOAL_COMPLETION_OPTIONS);
  // 需求类型识别配置弹窗
  const [demandCfgOpen, setDemandCfgOpen] = useState(false);
  const [demandMode, setDemandMode] = useState<'preset' | 'llm'>('preset');
  const [demandTags, setDemandTags] = useState<string[]>(['价格咨询', '案例索取', '功能咨询', '信息披露', '购买意向']);
  const [demandTagInput, setDemandTagInput] = useState('');
  // 意向打分配置弹窗
  const [intentCfgOpen, setIntentCfgOpen] = useState(false);
  const [intentScoringMode, setIntentScoringMode] = useState<'preset' | 'llm'>('preset');
  const [intentDimensions, setIntentDimensions] = useState([
    { key: 'pricing_visit', label: '定价页重复访问', weight: 30, enabled: true },
    { key: 'cta_click', label: 'CTA 点击次数', weight: 25, enabled: true },
    { key: 'explicit_intent', label: '对话明确购买意图', weight: 30, enabled: true },
    { key: 'lead_completeness', label: '留资字段完整度', weight: 15, enabled: true },
  ]);
  const [intentDimInput, setIntentDimInput] = useState('');
  const [intentHighThreshold, setIntentHighThreshold] = useState(75);
  const [intentMedThreshold, setIntentMedThreshold] = useState(45);
  const [fields, setFields] = useState<FormField[]>(mockFormFields);
  const [leadTiming, setLeadTiming] = useState<'progressive' | 'form_fallback'>('progressive');
  const [leadTriggerRounds, setLeadTriggerRounds] = useState(4);

  function toggleField(key: string, prop: 'required' | 'enabled') {
    setFields((prev) => prev.map((f) => {
      if (f.fieldKey !== key) return f;
      const next = { ...f, [prop]: !f[prop] };
      handleUpdateField(key, { [prop]: next[prop] });
      return next;
    }));
  }
  const enabledFields = fields.filter((f) => f.enabled).sort((a, b) => a.order - b.order);
  const filteredTalkTracks = talkScenarios.filter((talkTrack) => {
    const matchesSource = talkSourceFilter === 'all' || talkTrack.source === talkSourceFilter;
    const matchesStage = talkStageFilter === 'all' || talkTrack.stageKeys.includes(talkStageFilter);
    const normalizedKeyword = talkKeyword.trim().toLowerCase();
    const matchesKeyword = !normalizedKeyword || `${talkTrack.title}${talkTrack.useWhen}${talkTrack.replyText}`.toLowerCase().includes(normalizedKeyword);
    return matchesSource && matchesStage && matchesKeyword;
  });
  const filteredGlossaryTerms = glossaryTerms.filter((term) => {
    const normalizedKeyword = glossaryKeyword.trim().toLowerCase();
    const translationText = term.translations.map((translation) => translation.text).join('');
    const matchesKeyword = !normalizedKeyword || `${term.standardTerm}${term.usageNote || ''}${translationText}`.toLowerCase().includes(normalizedKeyword);
    return matchesKeyword;
  });
  const currentRole = ROLE_OPTIONS.find((role) => role.value === cfg.role) || ROLE_OPTIONS[0];
  const visibleSkills = skills.filter((skill) => {
    const matchesAgent = skillAgentFilter === 'all' || skill.agentType === skillAgentFilter;
    const matchesRole = skillRoleFilter === 'all' || skill.applicableRoles.includes(skillRoleFilter);
    return matchesAgent && matchesRole;
  });
  const currentRoleObjective = cfg.role === 'pre_sale'
    ? { name: salesBusinessGoal, desc: '完成需求确认并形成明确的后续安排。', completion: `${salesGoalCompletionItems.join('、')}；${salesGoalCompletionMode === 'any' ? '满足任一标准' : '满足全部标准'}` }
    : ROLE_OBJECTIVE_CONFIG[cfg.role];

  function togglePersonaOption(value: string, selected: string[], setSelected: React.Dispatch<React.SetStateAction<string[]>>) {
    setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  }

  function toggleSalesGoalCompletion(item: string) {
    setSalesGoalCompletionItems((items) => {
      if (items.includes(item) && items.length === 1) {
        alert('至少保留一个目标完成条件');
        return items;
      }
      return items.includes(item) ? items.filter((value) => value !== item) : [...items, item];
    });
  }

  function openCreateTalkEditor() {
    const defaultStages = talkStageFilter === 'all' ? ['S0'] : [talkStageFilter];
    setTalkEditorMode('create');
    setTalkEditorDraft({ key: `new_${Date.now()}`, stageKeys: defaultStages, title: '', useWhen: '', replyText: '', nextQuestion: '', source: 'company', enabled: true, syncStatus: 'pending' });
    setTalkEditorOpen(true);
  }

  function openEditTalkEditor(talkTrack: TalkScenario) {
    setTalkEditorMode('edit');
    setTalkEditorDraft({ ...talkTrack, stageKeys: [...talkTrack.stageKeys] });
    setTalkEditorOpen(true);
  }

  function openTalkViewer(talkTrack: TalkScenario) {
    setTalkViewerItem(talkTrack);
    setTalkViewerOpen(true);
  }

  function copyTalkToCompany(talkTrack: TalkScenario) {
    setTalkEditorMode('create');
    setTalkEditorDraft({ ...talkTrack, key: `copy_${Date.now()}`, title: `${talkTrack.title}（副本）`, stageKeys: [...talkTrack.stageKeys], source: 'company', syncStatus: 'pending' });
    setTalkEditorOpen(true);
  }

  function deleteCompanyTalk(talkTrack: TalkScenario) {
    if (!window.confirm(`确认删除“${talkTrack.title}”？删除后将同步更新知识库中的营销话术。`)) return;
    handleDeleteTalkTrack(talkTrack.key);
    setTalkScenarios((items) => items.filter((item) => item.key !== talkTrack.key));
  }

  function toggleTalkEditorStage(stageKey: string) {
    setTalkEditorDraft((draft) => ({ ...draft, stageKeys: draft.stageKeys.includes(stageKey) ? draft.stageKeys.filter((key) => key !== stageKey) : [...draft.stageKeys, stageKey], syncStatus: 'pending' }));
  }

  function saveTalkEditor() {
    if (!talkEditorDraft.title.trim() || !talkEditorDraft.replyText.trim() || talkEditorDraft.stageKeys.length === 0) {
      alert('请填写话术名称、客服回复，并至少选择一个适用阶段');
      return;
    }
    const kbAssetPath = '企业业务知识库/业务与服务/营销话术';
    if (talkEditorMode === 'create') {
      handleCreateTalkTrack(talkEditorDraft);
      setTalkScenarios((items) => [...items, { ...talkEditorDraft, source: 'company', syncStatus: 'synced', updatedAt: '2026-09-03 10:15', kbAssetPath }]);
    } else {
      handleSaveTalkTrack(talkEditorDraft);
      setTalkScenarios((items) => items.map((item) => item.key === talkEditorDraft.key ? { ...talkEditorDraft, source: item.source, syncStatus: 'synced', updatedAt: '2026-09-03 10:15', kbAssetPath } : item));
    }
    setTalkEditorOpen(false);
  }

  function openCreateGlossaryEditor() {
    setGlossaryEditorMode('create');
    setGlossaryEditorDraft({ ...EMPTY_GLOSSARY_DRAFT, termId: `new_${Date.now()}`, translations: EMPTY_GLOSSARY_DRAFT.translations.map((translation) => ({ ...translation })) });
    setGlossaryEditorOpen(true);
  }

  function openEditGlossaryEditor(term: IndustryGlossaryTerm) {
    setGlossaryEditorMode('edit');
    setGlossaryEditorDraft({ ...term, translations: [...term.translations.map((translation) => ({ ...translation })), { language: '', languageLabel: '', text: '' }] });
    setGlossaryEditorOpen(true);
  }

  function deleteGlossaryTerm(term: IndustryGlossaryTerm) {
    if (!window.confirm(`确认删除“${term.standardTerm}”？删除后将同步更新知识库中的多语言配置。`)) return;
    handleDeleteGlossaryTerm(term.termId);
    setGlossaryTerms((items) => items.filter((item) => item.termId !== term.termId));
  }

  function addGlossaryEditorTranslation() {
    setGlossaryEditorDraft((draft) => ({ ...draft, translations: [...draft.translations, { language: '', languageLabel: '', text: '' }], syncStatus: 'pending' }));
  }

  function updateGlossaryEditorTranslation(index: number, patch: Partial<GlossaryTranslation>) {
    setGlossaryEditorDraft((draft) => ({ ...draft, translations: draft.translations.map((translation, i) => i === index ? { ...translation, ...patch } : translation), syncStatus: 'pending' }));
  }

  function removeGlossaryEditorTranslation(index: number) {
    setGlossaryEditorDraft((draft) => ({ ...draft, translations: draft.translations.filter((_, i) => i !== index), syncStatus: 'pending' }));
  }

  function saveGlossaryEditor() {
    const completedTranslations = glossaryEditorDraft.translations.filter((translation) => translation.language || translation.text.trim());
    if (!glossaryEditorDraft.sourceLanguage || !glossaryEditorDraft.standardTerm.trim() || completedTranslations.some((translation) => !translation.language || !translation.text.trim())) {
      alert('请选择主语言并填写标准词；已选择的翻译语言需要填写译文');
      return;
    }
    const normalizedTerm = { ...glossaryEditorDraft, translations: completedTranslations, source: 'page' as const, sourceFileName: '多语言配置（页面维护）.xlsx' };
    const kbAssetPath = '企业公共知识库/多语言与版本/多语言配置';
    if (glossaryEditorMode === 'create') {
      handleCreateGlossaryTerm(normalizedTerm);
      setGlossaryTerms((items) => [...items, { ...normalizedTerm, syncStatus: 'synced', updatedAt: '2026-09-03 10:15', kbAssetPath }]);
    } else {
      handleSaveGlossaryTerm(normalizedTerm);
      setGlossaryTerms((items) => items.map((item) => item.termId === glossaryEditorDraft.termId ? { ...normalizedTerm, syncStatus: 'synced', updatedAt: '2026-09-03 10:15', kbAssetPath } : item));
    }
    setGlossaryEditorOpen(false);
  }

  function openStageEditor(stage: SalesStage) {
    setStageEditorDraft({ ...stage, criteria: stage.criteria.map((criterion) => ({ ...criterion })) });
    setStageEditorOpen(true);
  }

  function updateStageCriterion(criterionKey: string, patch: Partial<StageCriterion>) {
    setStageEditorDraft((stage) => ({ ...stage, criteria: stage.criteria.map((criterion) => criterion.key === criterionKey ? { ...criterion, ...patch } : criterion) }));
  }

  function addStageCriterion() {
    setStageEditorDraft((stage) => ({ ...stage, criteria: [...stage.criteria, { key: `custom_${Date.now()}`, label: '', weight: 0, required: false }] }));
  }

  function removeStageCriterion(criterionKey: string) {
    if (stageEditorDraft.criteria.length === 1) {
      alert('每个阶段至少保留一个达成条件');
      return;
    }
    setStageEditorDraft((stage) => ({ ...stage, criteria: stage.criteria.filter((criterion) => criterion.key !== criterionKey) }));
  }

  function saveStageEditor() {
    if (!stageEditorDraft.name.trim() || !stageEditorDraft.goal.trim()) {
      alert('请填写阶段名称和阶段目标');
      return;
    }
    if (stageEditorDraft.criteria.some((criterion) => !criterion.label.trim())) {
      alert('请完整填写阶段达成条件');
      return;
    }
    handleSaveSalesStage(stageEditorDraft);
    setSalesStages((stages) => stages.map((stage) => stage.key === stageEditorDraft.key ? stageEditorDraft : stage));
    setStageEditorOpen(false);
  }

  function toggleSalesStage(stage: SalesStage) {
    const enabledCount = salesStages.filter((item) => item.enabled).length;
    if (stage.enabled && enabledCount === 1) {
      alert('至少保留一个启用阶段');
      return;
    }
    handleToggleSalesStage(stage.key, !stage.enabled);
    setSalesStages((stages) => stages.map((item) => item.key === stage.key ? { ...item, enabled: !item.enabled } : item));
  }

  function updateSalesProgressCriterionScore(stageKey: string, criterionKey: string, weight: number) {
    setSalesStages((stages) => stages.map((stage) => stage.key !== stageKey ? stage : {
      ...stage,
      criteria: stage.criteria.map((criterion) => criterion.key === criterionKey ? { ...criterion, weight: Math.min(100, Math.max(0, weight || 0)) } : criterion),
    }));
  }

  function updateSalesProgressCriterionRequired(stageKey: string, criterionKey: string, required: boolean) {
    setSalesStages((stages) => stages.map((stage) => stage.key !== stageKey ? stage : {
      ...stage,
      criteria: stage.criteria.map((criterion) => criterion.key === criterionKey ? { ...criterion, required } : criterion),
    }));
  }

  function updateSalesProgressThreshold(stageKey: string, threshold: number) {
    setSalesStages((stages) => stages.map((stage) => {
      if (stage.key !== stageKey) return stage;
      const total = stage.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
      return { ...stage, threshold: Math.min(total, Math.max(0, threshold || 0)) };
    }));
  }

  function openStageSettingsFromProgress() {
    setSalesProgressCfgOpen(false);
    setPreSalesSection('stages');
    setTab('persona');
    handleFetchPreSalesConfig();
    setPreSalesCfgOpen(true);
  }

  function openEventEditor(salesEvent: SalesEvent) {
    setEventEditorMode('edit');
    setEventEditorDraft({ ...salesEvent });
    setEventEditorOpen(true);
  }

  function openEventViewer(salesEvent: SalesEvent) {
    setEventViewerItem(salesEvent);
    setEventViewerOpen(true);
  }

  function openCreateEventEditor() {
    setEventEditorMode('create');
    setEventEditorDraft({ key: `custom_${Date.now()}`, name: '', source: 'company', situation: '', resolution: '', returnMode: 'previous', guidanceResume: 'immediate', enabled: true });
    setEventEditorOpen(true);
  }

  function copyEventToCompany(salesEvent: SalesEvent) {
    setEventEditorMode('create');
    setEventEditorDraft({ ...salesEvent, key: `copy_${Date.now()}`, name: `${salesEvent.name}（副本）`, source: 'company' });
    setEventEditorOpen(true);
  }

  function updateEventReturnMode(returnMode: SalesEvent['returnMode']) {
    setEventEditorDraft((item) => {
      const canResumeGuidance = returnMode === 'previous' || returnMode === 'stage' || returnMode === 'reassess';
      return {
        ...item,
        returnMode,
        returnStageKey: returnMode === 'stage' ? item.returnStageKey : undefined,
        guidanceResume: canResumeGuidance
          ? (returnMode === 'reassess' ? 'immediate' : item.guidanceResume === 'none' ? 'immediate' : item.guidanceResume)
          : 'none',
        waitMinutes: returnMode === 'handoff' ? item.waitMinutes || 1 : undefined,
        timeoutAction: returnMode === 'handoff' ? item.timeoutAction || 'leave_contact' : undefined,
      };
    });
  }

  function deleteCompanyEvent(salesEvent: SalesEvent) {
    if (!window.confirm(`确认删除“${salesEvent.name}”？`)) return;
    handleDeleteSalesEvent(salesEvent.key);
    setSalesEvents((items) => items.filter((item) => item.key !== salesEvent.key));
  }

  function saveEventEditor() {
    if (!eventEditorDraft.name.trim() || !eventEditorDraft.situation.trim() || !eventEditorDraft.resolution.trim()) {
      alert('请填写场景、客户表现和解决措施');
      return;
    }
    if (eventEditorDraft.returnMode === 'stage' && !eventEditorDraft.returnStageKey) {
      alert('请选择处理后转到的售前阶段');
      return;
    }
    if (eventEditorDraft.returnMode === 'handoff' && (!eventEditorDraft.waitMinutes || eventEditorDraft.waitMinutes < 1 || !eventEditorDraft.timeoutAction)) {
      alert('交给人工处理时，请设置至少 1 分钟的最长等待时间和超时处理方式');
      return;
    }
    const normalizedEvent: SalesEvent = {
      ...eventEditorDraft,
      returnStageKey: eventEditorDraft.returnMode === 'stage' ? eventEditorDraft.returnStageKey : undefined,
      guidanceResume: eventEditorDraft.returnMode === 'handoff' || eventEditorDraft.returnMode === 'end' ? 'none' : eventEditorDraft.guidanceResume,
      waitMinutes: eventEditorDraft.returnMode === 'handoff' ? eventEditorDraft.waitMinutes : undefined,
      timeoutAction: eventEditorDraft.returnMode === 'handoff' ? eventEditorDraft.timeoutAction : undefined,
    };
    if (eventEditorMode === 'create') {
      handleCreateSalesEvent(normalizedEvent);
      setSalesEvents((events) => [...events, normalizedEvent]);
    } else {
      handleSaveSalesEvent(normalizedEvent);
      setSalesEvents((events) => events.map((salesEvent) => salesEvent.key === normalizedEvent.key ? normalizedEvent : salesEvent));
    }
    setEventEditorOpen(false);
  }

  function renderSkillCard(skill: SkillConfig) {
    return (
      <Card key={skill.key} className={skill.enabled ? 'border-blue-200' : ''}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 flex-1">
              <span className="text-xl leading-none mt-0.5">{skill.icon}</span>
              <div>
                <div className="flex items-center gap-1.5"><span className="text-sm font-semibold text-gray-800">{skill.label}</span><Badge className={`text-[10px] ${skill.agentType === 'analysis' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{skill.agentType === 'analysis' ? '分析 Agent' : '主 Agent'}</Badge>{skill.enabled && <Badge className="text-[10px] bg-green-50 text-green-600 border-green-200">已启用</Badge>}</div>
                <div className="text-xs text-gray-400">{skill.sub}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {skill.configTarget && <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600 px-2" disabled={!skill.enabled} onClick={() => openSkillConfig(skill)}>配置</Button>}
              <Switch checked={skill.enabled} onCheckedChange={() => toggleSkill(skill.key)} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed border-t pt-2">{skill.desc}</p>
          <div className="mt-2 pt-2 border-t border-dashed flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-gray-400">适用人设</span>
            {skill.applicableRoles.map((roleValue) => <Badge key={roleValue} className={`text-[10px] ${roleValue === cfg.role ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{ROLE_OPTIONS.find((role) => role.value === roleValue)?.label}</Badge>)}
            {skill.configTarget === 'lead' && <Badge className="text-[10px] bg-green-50 text-green-600 border-green-200">可配置留资表单</Badge>}
            {(skill.key === 'pre_sales' || skill.key === 'sales_stage_analysis') && <Badge className="text-[10px] bg-blue-50 text-blue-600 border-blue-200">随售前目标与阶段统一配置</Badge>}
          </div>
        </CardContent>
      </Card>
    );
  }

  function toggleSkill(key: string) {
    setSkills((prev) => prev.map((s) => {
      if (s.key !== key) return s;
      handleToggleSkill(key, !s.enabled);
      return { ...s, enabled: !s.enabled };
    }));
  }

  function toggleTrigger(key: string) {
    setTriggers((prev) => prev.map((t) => {
      if (t.key !== key) return t;
      handleToggleTrigger(key, !t.enabled);
      return { ...t, enabled: !t.enabled };
    }));
  }

  function toggleKnowledgeDirectory(directoryId: string) {
    setKnowledgeDirectories((prev) => prev.map((directory) => {
      if (directory.directoryId !== directoryId) return directory;
      const enabled = !directory.enabled;
      handleToggleKnowledgeDirectory(directoryId, enabled);
      return { ...directory, enabled };
    }));
  }

  // 技能「配置」入口分发
  function openSkillConfig(s: SkillConfig) {
    if (s.configTarget === 'lead') setLeadCfgOpen(true);
    else if (s.configTarget === 'demand_type') setDemandCfgOpen(true);
    else if (s.configTarget === 'pre_sales') { handleFetchPreSalesConfig(); setPreSalesCfgOpen(true); }
    else if (s.configTarget === 'sales_progress') { handleFetchPreSalesConfig(); setSalesProgressCfgOpen(true); }
    else if (s.configTarget === 'trigger') setTab('triggers');
    else if (s.configTarget === 'routing') window.location.href = '/routing';
  }

  return (
    <div className="p-6 space-y-5 bg-gray-50 min-h-screen">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">智能体配置</h1>
          <p className="text-sm text-gray-500 mt-0.5">配置智能客服的人设、业务能力与接待规则</p>
        </div>
        <Button className="bg-blue-600" size="sm" onClick={() => handleSaveConfig(cfg)}>保存配置</Button>
      </div>

      <Tabs value={tab} onValueChange={(value) => {
        setTab(value);
        if (value === 'knowledge') handleFetchKnowledgeDirectories();
      }}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="persona">人设设置</TabsTrigger>
          <TabsTrigger value="skills">技能设置</TabsTrigger>
          <TabsTrigger value="triggers">触发器</TabsTrigger>
          <TabsTrigger value="intelligence">意向与情绪</TabsTrigger>
          <TabsTrigger value="knowledge">知识库绑定</TabsTrigger>
          <TabsTrigger value="quality">AI 质量监控</TabsTrigger>
        </TabsList>

        {/* ── 基本信息 ── */}
        <TabsContent value="basic">
          <Card>
            <CardContent className="pt-5 space-y-4 max-w-2xl">
              <div>
                <label className="text-sm font-medium text-gray-700">智能体名称</label>
                <Input className="mt-1" value={cfg.name}
                  onChange={(e) => setCfg({ ...cfg, name: e.target.value })} />
                <p className="text-xs text-gray-400 mt-1">2–20 字</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">简要描述</label>
                <Textarea className="mt-1" value={cfg.description}
                  onChange={(e) => setCfg({ ...cfg, description: e.target.value })} />
                <p className="text-xs text-gray-400 mt-1">5–200 字</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">开场白方式</label>
                <div className="flex gap-2 mt-1">
                  {(['ai_dynamic', 'custom'] as OpeningMode[]).map((m) => (
                    <Button key={m} size="sm"
                      variant={cfg.openingMode === m ? 'default' : 'outline'}
                      className={cfg.openingMode === m ? 'bg-blue-600' : ''}
                      onClick={() => setCfg({ ...cfg, openingMode: m })}>
                      {m === 'ai_dynamic' ? 'AI 动态生成（识别新老用户）' : '自定义固定话术'}
                    </Button>
                  ))}
                </div>
                <Textarea className="mt-2" value={cfg.openingText}
                  onChange={(e) => setCfg({ ...cfg, openingText: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">开场白问题（快捷选项）</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {cfg.openingQuestions.map((q, i) => (
                    <Badge key={i} className="bg-blue-50 text-blue-700 border-blue-200">{q} ✕</Badge>
                  ))}
                  <Button size="sm" variant="outline" className="h-6 text-xs">+ 添加</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 人设设置 ── */}
        <TabsContent value="persona">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm border-l-2 border-blue-600 pl-2">公司信息</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-gray-500">公司名称</label><Input className="mt-1 bg-gray-50" value={cfg.companyName} onChange={(e) => setCfg({ ...cfg, companyName: e.target.value })} /></div>
                <div><label className="text-xs text-gray-500">所属行业</label><Input className="mt-1 bg-gray-50" value={cfg.industryName} onChange={(e) => setCfg({ ...cfg, industryName: e.target.value })} /></div>
                <div><label className="text-xs text-gray-500">主营产品</label><Input className="mt-1 bg-gray-50" value={cfg.mainProducts} onChange={(e) => setCfg({ ...cfg, mainProducts: e.target.value })} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm border-l-2 border-blue-600 pl-2">智能体语言</CardTitle></CardHeader>
              <CardContent className="flex gap-3">
                {([['detect', '识别用户提问语言回复'], ['site', '网站语言回复'], ['fixed', '指定语言回复']] as const).map(([value, label]) => (
                  <Button key={value} size="sm" variant="outline" onClick={() => setCfg({ ...cfg, language: value })}
                    className={`justify-start min-w-52 ${cfg.language === value ? 'border-blue-500 text-blue-600 bg-blue-50' : 'text-gray-600'}`}>
                    <span className={`w-3 h-3 rounded-full border mr-2 flex items-center justify-center ${cfg.language === value ? 'border-blue-500' : 'border-gray-300'}`}>{cfg.language === value && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}</span>{label}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between"><CardTitle className="text-sm border-l-2 border-blue-600 pl-2">智能体角色</CardTitle><span className="text-xs text-gray-400">角色决定职责范围与默认技能</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {ROLE_OPTIONS.map((role) => (
                    <button key={role.value} onClick={() => setCfg({ ...cfg, role: role.value })}
                      className={`text-left border rounded-lg px-3 py-2.5 transition-all ${cfg.role === role.value ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full border flex items-center justify-center ${cfg.role === role.value ? 'border-blue-500' : 'border-gray-300'}`}>{cfg.role === role.value && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}</span><span className={`text-sm font-medium ${cfg.role === role.value ? 'text-blue-700' : 'text-gray-700'}`}>{role.label}</span></div>
                      <p className="text-xs text-gray-400 mt-1 ml-5">{role.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                  <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className="text-sm font-semibold text-gray-900">{currentRole.label}</span><Badge className="bg-blue-100 text-blue-700 border-blue-200">当前角色</Badge></div><p className="text-xs text-gray-600 mt-2">职责范围：{currentRole.desc}</p></div>{cfg.role === 'pre_sale' && <Button size="sm" className="bg-blue-600 shrink-0" onClick={() => { handleFetchPreSalesConfig(); setPreSalesCfgOpen(true); }}>售前设置</Button>}</div>
                  <div className="grid grid-cols-2 gap-3 mt-3"><div className="bg-white border border-blue-100 rounded-lg p-3"><div className="text-[10px] text-gray-400">业务目标</div><div className="text-xs font-medium text-gray-700 mt-1">{currentRoleObjective.name}</div></div><div className="bg-white border border-blue-100 rounded-lg p-3"><div className="text-[10px] text-gray-400">完成标准</div><div className="text-xs font-medium text-gray-700 mt-1 line-clamp-2">{currentRoleObjective.completion}</div></div></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm border-l-2 border-blue-600 pl-2">响应风格</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {STYLE_OPTIONS.map((style) => (
                  <button key={style.value} onClick={() => setCfg({ ...cfg, responseStyle: style.value })}
                    className={`text-left border rounded-md px-3 py-2 text-sm ${cfg.responseStyle === style.value ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-600'}`}>
                    <span className="mr-2">{cfg.responseStyle === style.value ? '●' : '○'}</span>{style.label}
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm border-l-2 border-blue-600 pl-2">内贸沟通技巧</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {INTERNAL_COMMUNICATION_OPTIONS.map((item) => <button key={item} onClick={() => togglePersonaOption(item, internalCommunication, setInternalCommunication)} className={`text-left border rounded-md px-3 py-2 text-xs ${internalCommunication.includes(item) ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-500'}`}><span className="mr-2">{internalCommunication.includes(item) ? '☑' : '☐'}</span>{item}</button>)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm border-l-2 border-blue-600 pl-2">外贸沟通技巧</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {EXTERNAL_COMMUNICATION_OPTIONS.map((item) => <button key={item} onClick={() => togglePersonaOption(item, externalCommunication, setExternalCommunication)} className={`text-left border rounded-md px-3 py-2 text-xs ${externalCommunication.includes(item) ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-500'}`}><span className="mr-2">{externalCommunication.includes(item) ? '☑' : '☐'}</span>{item}</button>)}
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ── 技能设置 ── */}
        <TabsContent value="skills">
          <Card className="mb-4 border-blue-100 bg-blue-50/40">
            <CardContent className="py-3">
              <div>
                <div className="flex items-center gap-2"><span className="text-sm font-semibold text-gray-800">技能配置</span><Badge className="bg-blue-100 text-blue-700 border-blue-200">共 {skills.length} 项</Badge></div>
                <p className="text-xs text-gray-500 mt-1">每项技能标明执行 Agent 与适用客服人设，可按业务需要启用和配置。</p>
              </div>
            </CardContent>
          </Card>

          <div className="border rounded-lg bg-white p-3 mb-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 w-20">Agent 类型</span>
              {([['all', '全部'], ['conversation', '主 Agent'], ['analysis', '分析 Agent']] as const).map(([value, label]) => {
                const count = value === 'all' ? skills.length : skills.filter((skill) => skill.agentType === value).length;
                return <button key={value} onClick={() => setSkillAgentFilter(value)} className={`px-3 py-1.5 rounded-full text-xs border ${skillAgentFilter === value ? value === 'analysis' ? 'bg-violet-600 text-white border-violet-600' : 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>{label} <span className="opacity-70">{count}</span></button>;
              })}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 w-20">适用人设</span>
              <button onClick={() => setSkillRoleFilter('all')} className={`px-3 py-1.5 rounded-full text-xs border ${skillRoleFilter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'}`}>全部人设</button>
              {ROLE_OPTIONS.map((role) => <button key={role.value} onClick={() => setSkillRoleFilter(role.value)} className={`px-3 py-1.5 rounded-full text-xs border ${skillRoleFilter === role.value ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'}`}>{role.label}</button>)}
            </div>
          </div>

          <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-700">技能列表</span><span className="text-xs text-gray-400">显示 {visibleSkills.length} / {skills.length} 项</span></div>
          <div className="grid grid-cols-2 gap-3">{visibleSkills.map(renderSkillCard)}</div>
          {visibleSkills.length === 0 && <div className="border border-dashed rounded-lg p-10 text-center text-sm text-gray-400">没有符合当前筛选条件的技能</div>}
          <div className="mt-3 rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-500">主 Agent 技能负责回复客户和执行服务；分析 Agent 技能在后台识别需求、客户进度等信息，并把结果提供给主 Agent。</div>
        </TabsContent>

        {/* ── 触发器 ── */}
        <TabsContent value="triggers">
          <Card>
            <CardContent className="pt-4 divide-y">
              {triggers.map((t) => (
                <div key={t.key} className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{t.label}</span>
                      {t.threshold && <Badge className="text-[10px] bg-purple-50 text-purple-600 border-purple-200">{t.threshold}</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                  </div>
                  <Switch checked={t.enabled} onCheckedChange={() => toggleTrigger(t.key)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 意向与情绪 ── */}
        <TabsContent value="intelligence">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  意向打分
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600 hover:text-blue-700 px-2"
                      disabled={!intentEnabled} onClick={() => setIntentCfgOpen(true)}>配置</Button>
                    <Switch checked={intentEnabled} onCheckedChange={setIntentEnabled} />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {intentScoringMode === 'llm' ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">大模型自动评估模式：AI 根据对话内容综合判断意向强度，无需预设维度。</p>
                    <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs">大模型自动评估</Badge>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500">基于行为信号 + 对话内容给访客打意向等级（high/medium/low），可解释加权。</p>
                    <div className="space-y-2 text-sm">
                      {intentDimensions.filter(d => d.enabled).map((d) => (
                        <div key={d.key} className="flex items-center justify-between">
                          <span className="text-gray-600 truncate flex-1">{d.label}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="w-20 bg-gray-100 rounded-full h-1.5">
                              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${d.weight}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 w-8 text-right">{d.weight}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-gray-400 pt-1">
                      阈值：≥{intentHighThreshold} high · {intentMedThreshold}–{intentHighThreshold - 1} medium · &lt;{intentMedThreshold} low
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  情绪识别
                  <Switch checked={sentimentEnabled} onCheckedChange={setSentimentEnabled} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-gray-500">对话情绪单点打分（阶段二）+ 情绪弧度监控（阶段三），结尾为负自动提醒坐席。</p>
                <div className="bg-gray-50 rounded p-3 text-xs text-gray-500">
                  情绪识别作为 <span className="text-blue-600">转人工触发</span> 与
                  <span className="text-blue-600"> 工单优先级</span> 的输入信号。
                </div>
                <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">阶段二 / 三 能力</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── 知识库绑定 ── */}
        <TabsContent value="knowledge">
          <div className="space-y-3 max-w-4xl">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">选择该智能体可使用的知识目录</CardTitle>
                    <p className="text-xs text-gray-500 mt-1">仅列出由用户规划的知识目录；知识板块、来源方式和文档分类不作为智能体绑定维度。</p>
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 shrink-0">
                    已启用 {knowledgeDirectories.filter((directory) => directory.enabled).length} / {knowledgeDirectories.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>知识目录</TableHead>
                      <TableHead>目录用途</TableHead>
                      <TableHead className="w-24 text-right">内容量</TableHead>
                      <TableHead className="w-28 text-right">允许使用</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {knowledgeDirectories.map((directory) => (
                      <TableRow key={directory.directoryId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span aria-hidden>📁</span>
                            <span className="text-sm font-medium text-gray-800">{directory.directoryName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">{directory.description}</TableCell>
                        <TableCell className="text-right text-sm text-gray-600">{directory.documentCount} 条</TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={directory.enabled}
                            onCheckedChange={() => toggleKnowledgeDirectory(directory.directoryId)}
                            aria-label={`${directory.directoryName}${directory.enabled ? '停止使用' : '允许使用'}`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t">
                  <p className="text-xs text-gray-500">关闭后，该目录不再参与此智能体的检索；不影响目录中的原始文档。</p>
                  <a href="/knowledge-config/catalog" className="text-sm text-blue-600 hover:underline shrink-0">管理知识目录 ↗</a>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── AI 质量监控 ── */}
        <TabsContent value="quality">
          <AIQualityDashboard />
        </TabsContent>
      </Tabs>

      {/* 售前处理设置：主目标、阶段、话术与快捷路径统一配置 */}
      <Dialog open={preSalesCfgOpen} onOpenChange={setPreSalesCfgOpen}>
        <DialogContent className="max-w-6xl h-[88vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-5 pb-4 border-b">
            <div className="flex items-center justify-between pr-8">
              <div>
                <DialogTitle>售前处理设置</DialogTitle>
                <p className="text-xs text-gray-500 mt-1">平台已提供完整推荐配置，可直接启用，也可以按企业业务调整。</p>
              </div>
              <Badge className="bg-green-50 text-green-700 border-green-200">新会话生效</Badge>
            </div>
          </DialogHeader>

          <div className="flex flex-1 min-h-0">
            <aside className="w-56 shrink-0 bg-gray-50 border-r p-3 space-y-1">
              {([
                ['goal', '🎯', '目标设置', '业务目标与完成标准'],
                ['stages', '📶', '阶段设置', 'S0–S5 目标与达成条件'],
                ['talk', '💬', '话术设置', '平台预置与知识库话术'],
                ['glossary', '📖', '多语言配置', '标准词与多语言翻译'],
                ['events', '⚡', '特殊情况处理', '报价、人工与临时提问'],
              ] as const).map(([key, icon, title, desc]) => (
                <button key={key} onClick={() => setPreSalesSection(key)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${preSalesSection === key ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <div className="text-sm font-medium">{icon} {title}</div>
                  <div className={`text-[11px] mt-0.5 ${preSalesSection === key ? 'text-blue-100' : 'text-gray-400'}`}>{desc}</div>
                </button>
              ))}
              <div className="mt-4 p-3 bg-white border rounded-lg text-[11px] text-gray-500 leading-relaxed">
                <div className="font-medium text-gray-700 mb-1">配置说明</div>
                系统会根据客户问题、已确认信息和办理结果自动判断进度，并选择合适的回复和下一步。
              </div>
            </aside>

            <main className="flex-1 overflow-y-auto p-5 bg-white">
              {preSalesSection === 'goal' && (
                <div className="max-w-3xl space-y-4">
                  <div><h3 className="text-base font-semibold text-gray-900">目标设置</h3><p className="text-xs text-gray-500 mt-1">明确售前客服的业务职责，以及哪些结果代表本次服务完成。</p></div>
                  <div><label className="text-sm font-medium text-gray-700">业务目标</label><Textarea className="mt-1 min-h-20" value={salesBusinessGoal} onChange={(event) => setSalesBusinessGoal(event.target.value)} /><p className="text-[11px] text-gray-400 mt-1">用于指导客服持续理解需求、提供建议并推动后续安排。</p></div>
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between"><div><div className="text-sm font-medium text-gray-700">完成标准</div><div className="text-[11px] text-gray-400 mt-0.5">选择可作为售前服务完成依据的业务结果。</div></div><div className="flex gap-2"><Button size="sm" variant={salesGoalCompletionMode === 'any' ? 'default' : 'outline'} className={salesGoalCompletionMode === 'any' ? 'bg-blue-600' : ''} onClick={() => setSalesGoalCompletionMode('any')}>满足任一标准</Button><Button size="sm" variant={salesGoalCompletionMode === 'all' ? 'default' : 'outline'} className={salesGoalCompletionMode === 'all' ? 'bg-blue-600' : ''} onClick={() => setSalesGoalCompletionMode('all')}>满足全部标准</Button></div></div>
                    <div className="grid grid-cols-2 gap-2">{SALES_GOAL_COMPLETION_OPTIONS.map((item) => { const selected = salesGoalCompletionItems.includes(item); return <Button key={item} type="button" variant={selected ? 'default' : 'outline'} className={selected ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 justify-start' : 'justify-start'} onClick={() => toggleSalesGoalCompletion(item)}>{selected ? '✓ ' : ''}{item}</Button>; })}</div>
                  </div>
                </div>
              )}

              {preSalesSection === 'stages' && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div><h3 className="text-base font-semibold text-gray-900">阶段设置</h3><p className="text-xs text-gray-500 mt-1">平台预置 6 个阶段，可按实际流程启用、关闭或编辑。</p></div>
                    <Badge className="bg-green-50 text-green-700 border-green-200">默认配置可直接使用</Badge>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">客户达到阶段条件后，系统会自动更新进度；阶段对应的话术请统一在“话术设置”中维护。</div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader><TableRow><TableHead className="w-36">阶段</TableHead><TableHead className="w-56">阶段目标</TableHead><TableHead>达成条件</TableHead><TableHead className="w-24">使用</TableHead><TableHead className="w-20 text-right">操作</TableHead></TableRow></TableHeader>
                      <TableBody>{salesStages.map((stage) => {
                        const requiredCriteria = stage.criteria.filter((criterion) => criterion.required).map((criterion) => criterion.label);
                        const optionalCriteria = stage.criteria.filter((criterion) => !criterion.required).map((criterion) => criterion.label);
                        return <TableRow key={stage.key} className={stage.enabled ? '' : 'opacity-55'}><TableCell><div className="flex items-center gap-2"><Badge className="bg-blue-50 text-blue-700 border-blue-200">{stage.key}</Badge><span className="text-xs font-medium text-gray-800">{stage.name}</span></div></TableCell><TableCell className="text-xs text-gray-600">{stage.goal}</TableCell><TableCell><div className="text-xs text-gray-700">{requiredCriteria.length > 0 ? requiredCriteria.join('；') : '进入会话后自动开始'}</div>{optionalCriteria.length > 0 && <div className="text-[11px] text-gray-400 mt-1">同时参考：{optionalCriteria.join('、')}</div>}</TableCell><TableCell><Switch checked={stage.enabled} onCheckedChange={() => toggleSalesStage(stage)} /></TableCell><TableCell className="text-right"><Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600" onClick={() => openStageEditor(stage)}>编辑</Button></TableCell></TableRow>;
                      })}</TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {preSalesSection === 'talk' && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div><h3 className="text-base font-semibold text-gray-900">话术设置</h3><p className="text-xs text-gray-500 mt-1">用于配置智能体在不同客户阶段和场景下使用的话术。</p></div>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-center justify-between gap-4">
                      <div><div className="text-xs font-medium text-blue-800">话术保存到知识库位置</div><div className="mt-1 flex items-center gap-1.5 text-xs text-blue-700"><Badge className="bg-white text-blue-700 border-blue-200">企业业务知识库</Badge><span>›</span><Badge className="bg-white text-blue-700 border-blue-200">业务与服务</Badge><span>›</span><Badge className="bg-white text-blue-700 border-blue-200">营销话术</Badge></div></div>
                      <div className="flex gap-2"><a href="/knowledge-config"><Button size="sm" variant="outline">打开知识库</Button></a><Button size="sm" variant="outline" onClick={() => alert('已开始下载话术模板：话术名称、使用场景、客服回复、追问话术。上传后请在本页补充适用阶段。')}>下载话术</Button></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={talkSourceFilter} onValueChange={(value) => setTalkSourceFilter(value as 'all' | 'platform' | 'company')}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部来源</SelectItem><SelectItem value="platform">系统预设</SelectItem><SelectItem value="company">用户新增</SelectItem></SelectContent></Select>
                    <Select value={talkStageFilter} onValueChange={setTalkStageFilter}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部阶段</SelectItem>{salesStages.map((stage) => <SelectItem key={stage.key} value={stage.key}>{stage.key} · {stage.name}</SelectItem>)}</SelectContent></Select>
                    <Input className="h-8 flex-1 max-w-sm text-xs" value={talkKeyword} onChange={(event) => setTalkKeyword(event.target.value)} placeholder="搜索话术..." />
                    <Button size="sm" variant="outline" onClick={handleImportTalkTracks}>上传话术</Button><Button size="sm" className="bg-blue-600" onClick={openCreateTalkEditor}>+ 新增话术</Button>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">上传模板列：话术名称、使用场景、客服回复、追问话术。上传后请在列表中编辑并补充适用阶段；新增话术时可直接选择适用阶段。</div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader><TableRow><TableHead className="w-44">话术名称</TableHead><TableHead className="w-24">分类</TableHead><TableHead className="w-28">适用阶段</TableHead><TableHead className="w-44">使用场景</TableHead><TableHead>客服回复</TableHead><TableHead className="w-20">使用</TableHead><TableHead className="w-28 text-right">操作</TableHead></TableRow></TableHeader>
                      <TableBody>{filteredTalkTracks.map((talkTrack) => <TableRow key={talkTrack.key}><TableCell className="text-xs font-medium text-gray-800">{talkTrack.title}</TableCell><TableCell><Badge className={`text-[10px] ${talkTrack.source === 'platform' ? 'bg-gray-50 text-gray-600 border-gray-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>{talkTrack.source === 'platform' ? '系统预设' : '用户新增'}</Badge></TableCell><TableCell><div className="flex flex-wrap gap-1">{talkTrack.stageKeys.map((stageKey) => <Badge key={stageKey} className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">{stageKey}</Badge>)}</div></TableCell><TableCell className="text-xs text-gray-600">{talkTrack.useWhen}</TableCell><TableCell><p className="text-xs text-gray-600 line-clamp-2">{talkTrack.replyText}</p></TableCell><TableCell><Switch checked={talkTrack.enabled} onCheckedChange={(enabled) => setTalkScenarios((items) => items.map((item) => item.key === talkTrack.key ? { ...item, enabled } : item))} /></TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button size="sm" variant="ghost" className="h-7 text-xs text-gray-600" onClick={() => openTalkViewer(talkTrack)}>查看</Button>{talkTrack.source === 'platform' ? <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600" onClick={() => copyTalkToCompany(talkTrack)}>复制新增</Button> : <><Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600" onClick={() => openEditTalkEditor(talkTrack)}>编辑</Button><Button size="sm" variant="ghost" className="h-7 text-xs text-red-500" onClick={() => deleteCompanyTalk(talkTrack)}>删除</Button></>}</div></TableCell></TableRow>)}</TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {preSalesSection === 'glossary' && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div><h3 className="text-base font-semibold text-gray-900">多语言配置</h3><p className="text-xs text-gray-500 mt-1">没有系统预设词条，企业在此新增、上传和维护。</p></div>
                    <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => alert('已开始下载多语言词条模板。')}>下载模板</Button><Button size="sm" variant="outline" onClick={handleImportGlossaryTerms}>上传词条</Button><Button size="sm" className="bg-blue-600" onClick={openCreateGlossaryEditor}>+ 新增词条</Button></div>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-center justify-between gap-4">
                      <div><div className="text-xs font-medium text-blue-800">保存到知识库位置</div><div className="mt-1 flex items-center gap-1.5 text-xs text-blue-700"><Badge className="bg-white text-blue-700 border-blue-200">企业公共知识库</Badge><span>›</span><Badge className="bg-white text-blue-700 border-blue-200">多语言与版本</Badge><span>›</span><Badge className="bg-white text-blue-700 border-blue-200">多语言配置</Badge></div></div>
                      <a href="/knowledge-config"><Button size="sm" variant="outline">打开知识库</Button></a>
                    </div>
                  </div>
                  <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Input className="h-8 w-80 text-xs" value={glossaryKeyword} onChange={(event) => setGlossaryKeyword(event.target.value)} placeholder="搜索标准词、译文或备注" /><span className="text-xs text-gray-400">共 {filteredGlossaryTerms.length} 条</span></div><span className="text-[11px] text-gray-400">页面修改会同步保存到知识库</span></div>
                  {filteredGlossaryTerms.length === 0 ? (
                    <div className="rounded-lg border border-dashed py-12 text-center"><div className="text-sm font-medium text-gray-700">暂无多语言词条</div><p className="text-xs text-gray-400 mt-1">可在当前页面新增，或从知识库上传规范文件后同步。</p><Button size="sm" className="bg-blue-600 mt-4" onClick={openCreateGlossaryEditor}>新增第一个词条</Button></div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden"><Table><TableHeader><TableRow><TableHead className="w-52">主语言 / 标准词</TableHead><TableHead>其他语言</TableHead><TableHead className="w-48">备注</TableHead><TableHead className="w-24">使用</TableHead><TableHead className="w-28 text-right">操作</TableHead></TableRow></TableHeader><TableBody>{filteredGlossaryTerms.map((term) => <TableRow key={term.termId}><TableCell><div className="text-[10px] text-blue-600">{term.sourceLanguageLabel}</div><div className="text-xs font-medium text-gray-800 mt-0.5">{term.standardTerm}</div></TableCell><TableCell><div className="flex flex-wrap gap-1">{term.translations.length > 0 ? term.translations.map((translation, index) => <Badge key={`${term.termId}-${index}`} className="text-[10px] bg-gray-50 text-gray-700 border-gray-200">{translation.languageLabel}：{translation.text}</Badge>) : <span className="text-xs text-gray-400">暂未添加翻译</span>}</div></TableCell><TableCell><p className="text-xs text-gray-600 line-clamp-2">{term.usageNote || '—'}</p></TableCell><TableCell><Switch checked={term.enabled} onCheckedChange={(enabled) => setGlossaryTerms((items) => items.map((item) => item.termId === term.termId ? { ...item, enabled } : item))} /></TableCell><TableCell className="text-right"><Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600" onClick={() => openEditGlossaryEditor(term)}>编辑</Button><Button size="sm" variant="ghost" className="h-7 text-xs text-red-500" onClick={() => deleteGlossaryTerm(term)}>删除</Button></TableCell></TableRow>)}</TableBody></Table></div>
                  )}
                </div>
              )}


              {preSalesSection === 'events' && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between"><div><h3 className="text-base font-semibold text-gray-900">特殊情况处理</h3><p className="text-xs text-gray-500 mt-1">客户偏离正常售前推进时，决定当前问题处理后如何恢复、转向或结束。</p></div><div className="flex items-center gap-2"><Badge className="bg-green-50 text-green-700 border-green-200">已预置 9 种常见情况</Badge><Button size="sm" className="bg-blue-600" onClick={openCreateEventEditor}>+ 新增特殊情况</Button></div></div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">只有“交给人工处理”需要配置最长等待时间和超时动作，默认等待 1 分钟。其它情况在处理后立即继续，或等客户主动提供新信息后再继续，不按对话轮数等待。</div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader><TableRow><TableHead className="w-44">场景</TableHead><TableHead className="w-56">客户表现</TableHead><TableHead>解决措施</TableHead><TableHead className="w-32">处理后</TableHead><TableHead className="w-16">使用</TableHead><TableHead className="w-28 text-right">操作</TableHead></TableRow></TableHeader>
                      <TableBody>{salesEvents.map((salesEvent) => <TableRow key={salesEvent.key}><TableCell><div className="flex items-center gap-1.5"><span className="text-xs font-medium text-gray-800">{salesEvent.name}</span><Badge className={`text-[10px] ${salesEvent.source === 'platform' ? 'bg-gray-50 text-gray-600 border-gray-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>{salesEvent.source === 'platform' ? '系统预设' : '企业新增'}</Badge></div></TableCell><TableCell className="text-xs text-gray-600">{salesEvent.situation}</TableCell><TableCell><div className="text-xs text-gray-600 line-clamp-2">{salesEvent.resolution}</div><div className="text-[10px] text-amber-700 mt-1">{salesEvent.returnMode === 'handoff' ? `等待人工 ${salesEvent.waitMinutes || 1} 分钟，超时${salesEvent.timeoutAction === 'leave_contact' ? '引导留联系方式' : salesEvent.timeoutAction === 'return_ai' ? '由 AI 继续答复' : '结束处理'}` : salesEvent.guidanceResume === 'on_new_signal' ? '客户提供新信息后恢复售前引导' : salesEvent.guidanceResume === 'none' ? '不再主动进行售前引导' : '立即恢复售前引导'}</div></TableCell><TableCell><Badge className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">{{ previous: '回到原进度', stage: `转到 ${salesEvent.returnStageKey}`, reassess: '按新需求重判', end: '结束售前推进', handoff: '交由人工处理' }[salesEvent.returnMode]}</Badge></TableCell><TableCell><Switch checked={salesEvent.enabled} onCheckedChange={(enabled) => { handleToggleSalesEvent(salesEvent.key, enabled); setSalesEvents((items) => items.map((item) => item.key === salesEvent.key ? { ...item, enabled } : item)); }} /></TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button size="sm" variant="ghost" className="h-7 text-xs text-gray-600" onClick={() => openEventViewer(salesEvent)}>查看</Button>{salesEvent.source === 'company' ? <><Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600" onClick={() => openEventEditor(salesEvent)}>编辑</Button><Button size="sm" variant="ghost" className="h-7 text-xs text-red-500" onClick={() => deleteCompanyEvent(salesEvent)}>删除</Button></> : <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600" onClick={() => copyEventToCompany(salesEvent)}>复制新增</Button>}</div></TableCell></TableRow>)}</TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </main>
          </div>

          <div className="px-5 py-3 border-t bg-gray-50 flex items-center justify-between">
            <Button size="sm" variant="ghost" className="text-gray-600" onClick={() => { if (window.confirm('确认恢复平台默认配置？当前修改将被覆盖。')) handleRestorePreSalesDefaults(); }}>恢复平台默认值</Button>
            <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setPreSalesCfgOpen(false)}>取消</Button><Button size="sm" className="bg-blue-600" onClick={() => { handleSavePreSalesConfig(); setPreSalesCfgOpen(false); }}>保存配置</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 客户进度识别：评分项由人设中的阶段达成条件提供 */}
      <Dialog open={salesProgressCfgOpen} onOpenChange={setSalesProgressCfgOpen}>
        <DialogContent className="max-w-5xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>客户进度识别</DialogTitle>
            <p className="text-xs text-gray-500 mt-1">为各阶段的达成条件设置得分，并设置进入该阶段所需的达成分数。</p>
          </DialogHeader>
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            评分项来自“人设设置 ＞ 售前设置 ＞ 阶段设置”的达成条件；如需新增、删除或修改条件，请前往阶段设置维护。
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead className="w-40">阶段</TableHead><TableHead>达成条件与得分</TableHead><TableHead className="w-24 text-center">必须满足</TableHead><TableHead className="w-36">进入阶段的达成分数</TableHead></TableRow></TableHeader>
              <TableBody>{salesStages.map((stage) => {
                const total = stage.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
                return <TableRow key={stage.key} className={stage.enabled ? '' : 'opacity-55'}>
                  <TableCell><div className="flex items-center gap-2"><Badge className="bg-blue-50 text-blue-700 border-blue-200">{stage.key}</Badge><span className="text-xs font-medium text-gray-800">{stage.name}</span></div>{!stage.enabled && <div className="text-[11px] text-gray-400 mt-1">阶段已关闭</div>}</TableCell>
                  {stage.key === 'S0' ? <><TableCell className="text-xs text-gray-500">客户进入会话后自动进入接待阶段。</TableCell><TableCell className="text-center text-xs text-gray-400">—</TableCell><TableCell className="text-xs text-gray-400">无需设置</TableCell></> : <><TableCell><div className="space-y-2">{stage.criteria.map((criterion) => <div key={criterion.key} className="flex items-center gap-2 h-7"><span className="flex-1 text-xs text-gray-700">{criterion.label}</span><Input className="w-16 h-7 text-xs text-center" type="number" min="0" max="100" value={criterion.weight} onChange={(event) => updateSalesProgressCriterionScore(stage.key, criterion.key, Number(event.target.value))} /><span className="text-xs text-gray-400">分</span></div>)}</div></TableCell><TableCell><div className="space-y-2">{stage.criteria.map((criterion) => <div key={criterion.key} className="h-7 flex items-center justify-center"><Switch checked={criterion.required} onCheckedChange={(required) => updateSalesProgressCriterionRequired(stage.key, criterion.key, required)} /></div>)}</div></TableCell><TableCell><div className="flex items-center gap-1"><Input className="w-16 h-7 text-xs text-center" type="number" min="0" max={total} value={stage.threshold ?? total} onChange={(event) => updateSalesProgressThreshold(stage.key, Number(event.target.value))} /><span className="text-xs text-gray-400">分及以上</span></div><div className="text-[11px] text-gray-400 mt-1">达到该分数后，再校验必需条件</div></TableCell></>}
                </TableRow>;
              })}</TableBody>
            </Table>
          </div>
          <p className="text-[11px] text-gray-400">打开“必须满足”后，该条件未满足时，即使总分达到阶段达成分数也不会进入该阶段。</p>
          <div className="flex items-center justify-between pt-2 border-t"><Button size="sm" variant="outline" onClick={openStageSettingsFromProgress}>前往阶段设置</Button><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setSalesProgressCfgOpen(false)}>取消</Button><Button size="sm" className="bg-blue-600" onClick={() => { handleSaveSalesProgressScoring(salesStages); setSalesProgressCfgOpen(false); }}>保存评分规则</Button></div></div>
        </DialogContent>
      </Dialog>

      {/* 阶段列表编辑弹窗 */}
      <Dialog open={stageEditorOpen} onOpenChange={setStageEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader><DialogTitle>编辑阶段 · {stageEditorDraft.key}</DialogTitle></DialogHeader>
          <p className="text-xs text-gray-500">设置本阶段的目标与达成条件，系统将结合对话内容自动判断。</p>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-gray-700">阶段名称</label><Input className="mt-1" value={stageEditorDraft.name} onChange={(event) => setStageEditorDraft((stage) => ({ ...stage, name: event.target.value }))} /></div>
              <div><label className="text-sm font-medium text-gray-700">阶段目标</label><Input className="mt-1" value={stageEditorDraft.goal} onChange={(event) => setStageEditorDraft((stage) => ({ ...stage, goal: event.target.value }))} /></div>
            </div>
            <div className="flex items-center justify-between"><div><div className="text-sm font-medium text-gray-700">阶段达成条件</div><div className="text-[11px] text-gray-400 mt-0.5">使用明确、可从客户表达或业务结果中确认的条件。</div></div><Button type="button" size="sm" variant="outline" onClick={addStageCriterion}>+ 新增条件</Button></div>
            <div className="border rounded-lg divide-y">
              {stageEditorDraft.criteria.map((criterion, index) => <div key={criterion.key} className="flex items-center gap-3 p-3"><Badge className="bg-gray-50 text-gray-500 border-gray-200">条件 {index + 1}</Badge><Input className="flex-1" value={criterion.label} onChange={(event) => updateStageCriterion(criterion.key, { label: event.target.value })} /><Button type="button" size="sm" variant="ghost" className="text-red-500" onClick={() => removeStageCriterion(criterion.key)}>删除</Button></div>)}
            </div>
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">系统会根据对话内容和业务结果自动判断客户进度。</div>
          </div>
          <div className="flex justify-end gap-2 mt-5"><Button variant="outline" onClick={() => setStageEditorOpen(false)}>取消</Button><Button className="bg-blue-600" onClick={saveStageEditor}>保存阶段</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={eventViewerOpen} onOpenChange={setEventViewerOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>查看特殊情况</DialogTitle></DialogHeader>
          {eventViewerItem && <div className="space-y-4 mt-2 text-sm"><div><div className="text-xs text-gray-400">场景</div><div className="font-medium text-gray-800 mt-1">{eventViewerItem.name}</div></div><div><div className="text-xs text-gray-400">客户表现</div><p className="text-gray-700 mt-1">{eventViewerItem.situation}</p></div><div><div className="text-xs text-gray-400">解决措施</div><p className="text-gray-700 mt-1 whitespace-pre-wrap">{eventViewerItem.resolution}</p></div><div className="grid grid-cols-2 gap-3"><div><div className="text-xs text-gray-400">处理后</div><div className="text-gray-700 mt-1">{{ previous: '回到原进度', stage: `转到 ${eventViewerItem.returnStageKey}`, reassess: '按新需求重新判断', end: '结束售前推进', handoff: '交由人工处理' }[eventViewerItem.returnMode]}</div></div><div><div className="text-xs text-gray-400">后续策略</div><div className="text-gray-700 mt-1">{eventViewerItem.returnMode === 'handoff' ? `等待人工 ${eventViewerItem.waitMinutes || 1} 分钟` : eventViewerItem.returnMode === 'end' || eventViewerItem.guidanceResume === 'none' ? '不再主动进行售前引导' : eventViewerItem.guidanceResume === 'on_new_signal' ? '客户提供新信息后恢复售前引导' : '立即恢复售前引导'}</div></div></div>{eventViewerItem.returnMode === 'handoff' && <div><div className="text-xs text-gray-400">人工超时后</div><div className="text-gray-700 mt-1">{{ leave_contact: '提示客户留下联系方式', return_ai: '由 AI 继续答复', end: '结束本次处理' }[eventViewerItem.timeoutAction || 'leave_contact']}</div></div>}<div className="flex justify-end pt-3 border-t"><Button variant="outline" onClick={() => setEventViewerOpen(false)}>关闭</Button></div></div>}
        </DialogContent>
      </Dialog>

      {/* 特殊情况列表编辑弹窗 */}
      <Dialog open={eventEditorOpen} onOpenChange={setEventEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{eventEditorMode === 'create' ? '新增特殊情况' : '编辑特殊情况'}</DialogTitle></DialogHeader>
          <p className="text-xs text-gray-500">配置客户偏离正常售前推进时的处理路线。客服回复仍由主 Agent 根据当前问题、知识库和话术设置生成。</p>
          <div className="space-y-4 mt-2">
            <div><label className="text-sm font-medium text-gray-700">场景</label><Input className="mt-1" value={eventEditorDraft.name} onChange={(event) => setEventEditorDraft((item) => ({ ...item, name: event.target.value }))} /></div>
            <div><label className="text-sm font-medium text-gray-700">客户表现</label><Textarea className="mt-1 min-h-16" value={eventEditorDraft.situation} onChange={(event) => setEventEditorDraft((item) => ({ ...item, situation: event.target.value }))} /></div>
            <div><label className="text-sm font-medium text-gray-700">解决措施</label><Textarea className="mt-1 min-h-20" value={eventEditorDraft.resolution} onChange={(event) => setEventEditorDraft((item) => ({ ...item, resolution: event.target.value }))} placeholder="例如：暂停售前推进，转人工处理；AI 不再继续追问" /></div>
            <div><label className="text-sm font-medium text-gray-700">处理后</label><Select value={eventEditorDraft.returnMode} onValueChange={(value) => updateEventReturnMode(value as SalesEvent['returnMode'])}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="previous">回到原来的售前进度</SelectItem><SelectItem value="stage">转到指定售前阶段</SelectItem><SelectItem value="reassess">按新需求重新判断</SelectItem><SelectItem value="handoff">交由人工处理</SelectItem><SelectItem value="end">结束本次售前推进</SelectItem></SelectContent></Select></div>
            {eventEditorDraft.returnMode === 'stage' && <div><label className="text-sm font-medium text-gray-700">转到阶段</label><Select value={eventEditorDraft.returnStageKey} onValueChange={(value) => setEventEditorDraft((item) => ({ ...item, returnStageKey: value }))}><SelectTrigger className="mt-1"><SelectValue placeholder="选择阶段" /></SelectTrigger><SelectContent>{salesStages.map((stage) => <SelectItem key={stage.key} value={stage.key}>{stage.key} · {stage.name}</SelectItem>)}</SelectContent></Select></div>}
            {eventEditorDraft.returnMode === 'handoff' && <div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium text-gray-700">最长等待（分钟）</label><Input className="mt-1" type="number" min="1" max="10" value={eventEditorDraft.waitMinutes || 1} onChange={(event) => setEventEditorDraft((item) => ({ ...item, waitMinutes: Number(event.target.value) }))} /><p className="text-[11px] text-gray-400 mt-1">默认 1 分钟，仅等待人工接待时生效。</p></div><div><label className="text-sm font-medium text-gray-700">等待超时后</label><Select value={eventEditorDraft.timeoutAction || 'leave_contact'} onValueChange={(value) => setEventEditorDraft((item) => ({ ...item, timeoutAction: value as SalesEvent['timeoutAction'] }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="leave_contact">提示客户留下联系方式</SelectItem><SelectItem value="return_ai">由 AI 继续答复</SelectItem><SelectItem value="end">结束本次处理</SelectItem></SelectContent></Select></div></div>}
            {(eventEditorDraft.returnMode === 'previous' || eventEditorDraft.returnMode === 'stage' || eventEditorDraft.returnMode === 'reassess') && <div><label className="text-sm font-medium text-gray-700">何时继续售前引导</label><Select value={eventEditorDraft.guidanceResume} onValueChange={(value) => setEventEditorDraft((item) => ({ ...item, guidanceResume: value as SalesEvent['guidanceResume'] }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="immediate">当前问题处理后立即继续</SelectItem><SelectItem value="on_new_signal">客户主动提供新信息后继续</SelectItem><SelectItem value="none">本次对话不再主动推进</SelectItem></SelectContent></Select><p className="text-[11px] text-gray-400 mt-1">选择“客户主动提供新信息后继续”时，由分析 Agent 根据客户的新需求、资料或继续了解意愿自动判断，无需设置等待轮数。</p></div>}
            {eventEditorDraft.returnMode === 'end' && <div className="rounded-lg bg-gray-50 border px-3 py-2 text-xs text-gray-600">处理完成后结束本次售前推进，不再配置等待或恢复引导。</div>}
            <div className="flex items-center justify-between border rounded-lg p-3"><div><div className="text-sm font-medium text-gray-700">启用这种处理方式</div><div className="text-[11px] text-gray-400 mt-0.5">关闭后，该场景不会中断正常售前推进。</div></div><Switch checked={eventEditorDraft.enabled} onCheckedChange={(enabled) => setEventEditorDraft((item) => ({ ...item, enabled }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-5"><Button variant="outline" onClick={() => setEventEditorOpen(false)}>取消</Button><Button className="bg-blue-600" onClick={saveEventEditor}>保存处理方式</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={talkViewerOpen} onOpenChange={setTalkViewerOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>查看话术</DialogTitle></DialogHeader>
          {talkViewerItem && <div className="space-y-4 mt-2 text-sm"><div className="flex items-center gap-2"><div className="font-medium text-gray-800">{talkViewerItem.title}</div><Badge className={talkViewerItem.source === 'platform' ? 'bg-gray-50 text-gray-600 border-gray-200' : 'bg-blue-50 text-blue-600 border-blue-200'}>{talkViewerItem.source === 'platform' ? '系统预设' : '用户新增'}</Badge></div><div><div className="text-xs text-gray-400">适用阶段</div><div className="flex flex-wrap gap-1 mt-1">{talkViewerItem.stageKeys.map((stageKey) => <Badge key={stageKey} className="bg-blue-50 text-blue-700 border-blue-200">{stageKey}</Badge>)}</div></div><div><div className="text-xs text-gray-400">使用场景</div><p className="text-gray-700 mt-1">{talkViewerItem.useWhen || '—'}</p></div><div><div className="text-xs text-gray-400">客服回复</div><p className="text-gray-700 mt-1 whitespace-pre-wrap">{talkViewerItem.replyText}</p></div><div><div className="text-xs text-gray-400">追问话术</div><p className="text-gray-700 mt-1">{talkViewerItem.nextQuestion || '—'}</p></div><div className="flex justify-end pt-3 border-t"><Button variant="outline" onClick={() => setTalkViewerOpen(false)}>关闭</Button></div></div>}
        </DialogContent>
      </Dialog>

      {/* 平台话术新增与编辑共用弹窗 */}
      <Dialog open={talkEditorOpen} onOpenChange={setTalkEditorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{talkEditorMode === 'create' ? '新增话术' : '编辑话术'}</DialogTitle></DialogHeader>
          <p className="text-xs text-gray-500">保存后写入“企业业务知识库 / 业务与服务 / 营销话术”。调整平台预置话术后，列表状态显示为“已调整”。</p>
          <div className="space-y-4 mt-2">
            <div><label className="text-sm font-medium text-gray-700">话术名称 <span className="text-red-500">*</span></label><Input className="mt-1" value={talkEditorDraft.title} onChange={(event) => setTalkEditorDraft((draft) => ({ ...draft, title: event.target.value, syncStatus: 'pending' }))} placeholder="例如：客户询价时先确认规格" /></div>
            <div><label className="text-sm font-medium text-gray-700">适用阶段 <span className="text-red-500">*</span> <span className="text-xs font-normal text-gray-400">（可多选）</span></label><div className="grid grid-cols-3 gap-2 mt-2">{salesStages.map((stage) => { const selected = talkEditorDraft.stageKeys.includes(stage.key); return <Button key={stage.key} type="button" size="sm" variant={selected ? 'default' : 'outline'} className={selected ? 'bg-blue-600 justify-start' : 'justify-start'} onClick={() => toggleTalkEditorStage(stage.key)}>{selected ? '✓ ' : ''}{stage.key} · {stage.name}</Button>; })}</div><p className="text-[11px] text-gray-400 mt-1.5">同一句话术可用于多个阶段；主 Agent 会结合当前阶段和客户问题决定是否采用。</p></div>
            <div><label className="text-sm font-medium text-gray-700">适用场景</label><Input className="mt-1" value={talkEditorDraft.useWhen} onChange={(event) => setTalkEditorDraft((draft) => ({ ...draft, useWhen: event.target.value, syncStatus: 'pending' }))} placeholder="例如：客户明确询问报价，但产品规格还不完整" /></div>
            <div><label className="text-sm font-medium text-gray-700">客服回复 <span className="text-red-500">*</span></label><Textarea className="mt-1 min-h-24" value={talkEditorDraft.replyText} onChange={(event) => setTalkEditorDraft((draft) => ({ ...draft, replyText: event.target.value, syncStatus: 'pending' }))} placeholder="填写可以直接对客户表达的内容" /></div>
            <div><label className="text-sm font-medium text-gray-700">追问话术</label><Input className="mt-1" value={talkEditorDraft.nextQuestion} onChange={(event) => setTalkEditorDraft((draft) => ({ ...draft, nextQuestion: event.target.value, syncStatus: 'pending' }))} placeholder="例如：方便确认一下数量和主要规格吗？" /></div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 border p-3"><div><div className="text-xs font-medium text-gray-700">启用该话术</div><div className="text-[11px] text-gray-400 mt-0.5">关闭后仍保留在列表和 Excel 中，但客服不会使用。</div></div><Switch checked={talkEditorDraft.enabled} onCheckedChange={(enabled) => setTalkEditorDraft((draft) => ({ ...draft, enabled }))} /></div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t"><span className="text-[11px] text-gray-400">适用阶段支持多选</span><div className="flex gap-2"><Button variant="outline" onClick={() => setTalkEditorOpen(false)}>取消</Button><Button className="bg-blue-600" onClick={saveTalkEditor}>{talkEditorMode === 'create' ? '新增并保存知识库' : '保存到知识库'}</Button></div></div>
        </DialogContent>
      </Dialog>

      {/* 行业词条新增与编辑共用弹窗 */}
      <Dialog open={glossaryEditorOpen} onOpenChange={setGlossaryEditorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{glossaryEditorMode === 'create' ? '新增行业词条' : '编辑行业词条'}</DialogTitle></DialogHeader>
          <p className="text-xs text-gray-500">选择标准词的主语言，并按需补充其他语言；保存后写入“企业公共知识库 / 多语言与版本 / 多语言配置”。</p>
          <div className="space-y-4 mt-2">
            <div><label className="text-sm font-medium text-gray-700">主语言与标准词 <span className="text-red-500">*</span></label><div className="flex gap-2 mt-1"><Select value={glossaryEditorDraft.sourceLanguage} onValueChange={(value) => { const language = LANGUAGE_OPTIONS.find((option) => option.value === value); setGlossaryEditorDraft((draft) => ({ ...draft, sourceLanguage: value, sourceLanguageLabel: language?.label || value, syncStatus: 'pending' })); }}><SelectTrigger className="w-40"><SelectValue placeholder="选择主语言" /></SelectTrigger><SelectContent>{LANGUAGE_OPTIONS.map((language) => <SelectItem key={language.value} value={language.value}>{language.label}</SelectItem>)}</SelectContent></Select><Input className="flex-1" value={glossaryEditorDraft.standardTerm} onChange={(event) => setGlossaryEditorDraft((draft) => ({ ...draft, standardTerm: event.target.value, syncStatus: 'pending' }))} placeholder="输入该语言下的标准词" /></div></div>
            <div>
              <div className="flex items-center justify-between"><div><label className="text-sm font-medium text-gray-700">其他语言</label><div className="text-[11px] text-gray-400 mt-0.5">暂不需要的语言可以留空。</div></div><Button type="button" size="sm" variant="outline" onClick={addGlossaryEditorTranslation}>+ 添加语言</Button></div>
              <div className="space-y-2 mt-2">
                {glossaryEditorDraft.translations.map((translation, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select value={translation.language || undefined} onValueChange={(value) => { const language = LANGUAGE_OPTIONS.find((option) => option.value === value); updateGlossaryEditorTranslation(index, { language: value, languageLabel: language?.label || value }); }}><SelectTrigger className="w-40"><SelectValue placeholder="选择语言" /></SelectTrigger><SelectContent>{LANGUAGE_OPTIONS.filter((language) => language.value !== glossaryEditorDraft.sourceLanguage).map((language) => <SelectItem key={language.value} value={language.value}>{language.label}</SelectItem>)}</SelectContent></Select>
                    <Input className="flex-1" value={translation.text} onChange={(event) => updateGlossaryEditorTranslation(index, { text: event.target.value })} placeholder="对应译文" />
                    <Button type="button" size="sm" variant="ghost" className="text-gray-400 hover:text-red-600" onClick={() => removeGlossaryEditorTranslation(index)}>删除</Button>
                  </div>
                ))}
                {glossaryEditorDraft.translations.length === 0 && <Button type="button" variant="outline" className="w-full border-dashed text-gray-500" onClick={addGlossaryEditorTranslation}>选择一种语言并填写译文</Button>}
              </div>
            </div>
            <div><label className="text-sm font-medium text-gray-700">备注</label><Textarea className="mt-1 min-h-16" value={glossaryEditorDraft.usageNote || ''} onChange={(event) => setGlossaryEditorDraft((draft) => ({ ...draft, usageNote: event.target.value, syncStatus: 'pending' }))} placeholder="可填写术语使用范围、容易混淆的说法等" /></div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 border p-3"><div><div className="text-xs font-medium text-gray-700">启用该词条</div><div className="text-[11px] text-gray-400 mt-0.5">关闭后仍保留在列表中，但不会用于翻译与识别。</div></div><Switch checked={glossaryEditorDraft.enabled} onCheckedChange={(enabled) => setGlossaryEditorDraft((draft) => ({ ...draft, enabled }))} /></div>
          </div>
          <div className="flex items-center justify-end mt-4 pt-3 border-t"><div className="flex gap-2"><Button variant="outline" onClick={() => setGlossaryEditorOpen(false)}>取消</Button><Button className="bg-blue-600" onClick={saveGlossaryEditor}>{glossaryEditorMode === 'create' ? '新增并保存知识库' : '保存到知识库'}</Button></div></div>
        </DialogContent>
      </Dialog>


      {/* 渐进式留资配置弹窗（由「意向线索收集」技能的「配置」打开）*/}
      <Dialog open={leadCfgOpen} onOpenChange={setLeadCfgOpen}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
          <DialogHeader><DialogTitle>渐进式留资 · 配置</DialogTitle></DialogHeader>
          <p className="text-xs text-gray-500 mt-1">配置留资时机与可配置表单字段。标准字段入固定列，其它字段进 <span className="font-mono text-gray-700">custom_fields(JSONB)</span>，新增字段无需改表结构。</p>

          {/* 留资时机 */}
          <div className="border rounded-lg p-3 mt-3 space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-800">留资时机</span>
              <div className="flex gap-2 mt-2">
                {([['progressive', '渐进式（多轮逐步收集）'], ['form_fallback', '表单兜底（一次性弹表单）']] as const).map(([v, label]) => (
                  <Button key={v} size="sm"
                    variant={leadTiming === v ? 'default' : 'outline'}
                    className={leadTiming === v ? 'bg-blue-600' : ''}
                    onClick={() => setLeadTiming(v)}>
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">对话推进至</span>
              <Input className="w-16 h-7" type="number" value={leadTriggerRounds}
                onChange={(e) => setLeadTriggerRounds(+e.target.value)} />
              <span className="text-gray-600">轮且命中意向关键词时，引导留资</span>
            </div>
          </div>

          {/* 可配置表单字段 */}
          <div className="flex items-center justify-between mt-4 mb-2">
            <span className="text-sm font-medium text-gray-800">可配置留资表单字段</span>
            <Button size="sm" className="bg-blue-600 h-7 text-xs" onClick={handleAddField}>+ 新增字段</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>字段标识</TableHead>
                <TableHead>显示名</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>必填</TableHead>
                <TableHead>映射 CRM 字段</TableHead>
                <TableHead>启用</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.slice().sort((a, b) => a.order - b.order).map((f) => (
                <TableRow key={f.fieldKey}>
                  <TableCell className="font-mono text-xs text-gray-600">{f.fieldKey}</TableCell>
                  <TableCell className="text-sm">{f.label}</TableCell>
                  <TableCell><Badge className="text-xs bg-gray-100 text-gray-600">{FIELD_TYPE_LABEL[f.type]}</Badge></TableCell>
                  <TableCell><Switch checked={f.required} onCheckedChange={() => toggleField(f.fieldKey, 'required')} /></TableCell>
                  <TableCell className="font-mono text-[11px] text-blue-500">{f.crmField}</TableCell>
                  <TableCell><Switch checked={f.enabled} onCheckedChange={() => toggleField(f.fieldKey, 'enabled')} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* 预览 + 提交流程 */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-xs text-gray-500 mb-2">访客侧预览（已启用字段）</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                <p className="text-sm text-green-700 font-medium">📋 填写信息，专属顾问会联系您</p>
                {enabledFields.map((f) => (
                  <div key={f.fieldKey}>
                    <label className="text-xs text-gray-500">{f.label}{f.required && <span className="text-red-500"> *</span>}</label>
                    <div className="bg-white border border-green-200 rounded px-2 py-1.5 text-sm text-gray-400">
                      {f.type === 'textarea' ? '请输入…' : f.type === 'select' ? '请选择 ▾' : `请输入${f.label}`}
                    </div>
                  </div>
                ))}
                <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 mt-1">✅ 提交留资</Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">提交流程</p>
              <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed space-y-1">
                <p>1. 配置驱动表单 → 用户填写</p>
                <p>2. 后端校验必填 / 类型</p>
                <p>3. 标准字段入固定列 / 其它入 <span className="font-mono">JSONB</span></p>
                <p>4. 身份归并 → 映射写 TwentyCRM</p>
                <p>5. <a href="/leads" className="text-blue-600 hover:underline">落到线索池 N7 ↗</a></p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button size="sm" variant="outline" onClick={() => setLeadCfgOpen(false)}>取消</Button>
            <Button size="sm" className="bg-blue-600" onClick={() => { handleSaveLeadCapture(); setLeadCfgOpen(false); }}>保存留资配置</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ 意向打分配置弹窗 ══ */}
      <Dialog open={intentCfgOpen} onOpenChange={setIntentCfgOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>意向打分配置</DialogTitle>
          </DialogHeader>

          {/* 评分模式 */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">评分模式</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                ['preset', '预设维度权重', '自定义评分维度及权重，AI 按规则计算得分'],
                ['llm', '大模型自动评估', '由大模型根据对话内容综合判断，无需配置维度'],
              ] as const).map(([val, title, desc]) => (
                <div key={val} onClick={() => setIntentScoringMode(val)}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${intentScoringMode === val ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${intentScoringMode === val ? 'border-blue-500' : 'border-gray-300'}`}>
                      {intentScoringMode === val && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{title}</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-5">{desc}</p>
                </div>
              ))}
            </div>

            {/* 预设维度编辑 */}
            {intentScoringMode === 'preset' && (() => {
              const total = intentDimensions.filter(d => d.enabled).reduce((s, d) => s + d.weight, 0);
              return (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">评分维度</p>
                    <span className={`text-xs font-mono ${total === 100 ? 'text-green-600' : 'text-red-500'}`}>
                      权重合计 {total}%{total !== 100 && ' ≠ 100'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {intentDimensions.map((d, i) => (
                      <div key={d.key} className={`flex items-center gap-2 p-2 rounded-lg border ${d.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-dashed border-gray-200 opacity-60'}`}>
                        <Switch checked={d.enabled} onCheckedChange={(v) =>
                          setIntentDimensions(prev => prev.map((x, j) => j === i ? { ...x, enabled: v } : x))
                        } />
                        <span className="text-sm text-gray-700 flex-1 truncate">{d.label}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number" min={0} max={100} disabled={!d.enabled}
                            className="w-14 h-7 text-xs border border-gray-200 rounded px-2 text-center focus:outline-none focus:border-blue-400 disabled:bg-gray-50"
                            value={d.weight}
                            onChange={(e) => setIntentDimensions(prev => prev.map((x, j) => j === i ? { ...x, weight: Math.min(100, Math.max(0, +e.target.value || 0)) } : x))}
                          />
                          <span className="text-xs text-gray-400">%</span>
                        </div>
                        <button className="text-gray-300 hover:text-red-400 text-sm shrink-0"
                          onClick={() => setIntentDimensions(prev => prev.filter((_, j) => j !== i))}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 h-8 text-xs border border-gray-200 rounded-md px-2.5 focus:outline-none focus:border-blue-400"
                      placeholder="输入维度名称，如：重复访问产品页"
                      value={intentDimInput}
                      onChange={(e) => setIntentDimInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && intentDimInput.trim()) {
                          setIntentDimensions(prev => [...prev, { key: `custom_${Date.now()}`, label: intentDimInput.trim(), weight: 0, enabled: true }]);
                          setIntentDimInput('');
                        }
                      }}
                    />
                    <Button size="sm" variant="outline" className="h-8 text-xs shrink-0"
                      onClick={() => {
                        if (intentDimInput.trim()) {
                          setIntentDimensions(prev => [...prev, { key: `custom_${Date.now()}`, label: intentDimInput.trim(), weight: 0, enabled: true }]);
                          setIntentDimInput('');
                        }
                      }}>+ 添加维度</Button>
                  </div>
                  <p className="text-xs text-gray-400">各启用维度权重之和需为 100%。AI 对每个维度单独打分后加权求和得到最终分数。</p>

                  {/* 意向阈值 */}
                  <div className="border-t pt-3 mt-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">意向等级阈值</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">高意向（high）≥</label>
                        <div className="flex items-center gap-1.5">
                          <input type="number" min={1} max={100}
                            className="w-16 h-7 text-xs border border-gray-200 rounded px-2 text-center focus:outline-none focus:border-blue-400"
                            value={intentHighThreshold}
                            onChange={(e) => setIntentHighThreshold(Math.min(100, Math.max(intentMedThreshold + 1, +e.target.value || 0)))}
                          />
                          <span className="text-xs text-gray-400">分</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">中意向（medium）≥</label>
                        <div className="flex items-center gap-1.5">
                          <input type="number" min={1} max={100}
                            className="w-16 h-7 text-xs border border-gray-200 rounded px-2 text-center focus:outline-none focus:border-blue-400"
                            value={intentMedThreshold}
                            onChange={(e) => setIntentMedThreshold(Math.min(intentHighThreshold - 1, Math.max(1, +e.target.value || 0)))}
                          />
                          <span className="text-xs text-gray-400">分</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-400 bg-gray-50 rounded p-2">
                      ≥{intentHighThreshold} → 高意向 &nbsp;·&nbsp; {intentMedThreshold}–{intentHighThreshold - 1} → 中意向 &nbsp;·&nbsp; &lt;{intentMedThreshold} → 低意向
                    </div>
                  </div>
                </div>
              );
            })()}

            {intentScoringMode === 'llm' && (
              <div className="mt-3 space-y-3">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-700">
                  <p className="font-medium mb-1">大模型自动评估模式</p>
                  <p>AI 将综合分析对话内容、用户行为和留资信息，自动输出 high / medium / low 三档意向等级，并附带简短评估理由。无需配置维度权重。</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">评估提示（可选）— 告诉 AI 你的业务关注点</p>
                  <Textarea
                    className="text-xs h-20 resize-none"
                    placeholder="例如：我们主要关注 B2B 大客户，团队规模 ≥50 人且有明确预算的为高意向；只是了解产品的为低意向。"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button size="sm" variant="outline" onClick={() => setIntentCfgOpen(false)}>取消</Button>
            <Button size="sm" className="bg-blue-600" onClick={() => { alert('意向打分配置已保存'); setIntentCfgOpen(false); }}>保存配置</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ 需求类型识别配置弹窗 ══ */}
      <Dialog open={demandCfgOpen} onOpenChange={setDemandCfgOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>需求类型识别配置</DialogTitle>
          </DialogHeader>

          {/* 识别模式 */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">识别模式</p>
            <div className="grid grid-cols-2 gap-3">
              {([['preset', '预设分类', '从配置的分类标签中选取最匹配的一个'], ['llm', '大模型自动总结', '由大模型根据对话内容自由生成需求描述']] as const).map(([val, title, desc]) => (
                <div key={val} onClick={() => setDemandMode(val)}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${demandMode === val ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${demandMode === val ? 'border-blue-500' : 'border-gray-300'}`}>
                      {demandMode === val && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{title}</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-5">{desc}</p>
                </div>
              ))}
            </div>

            {/* 预设分类标签编辑 */}
            {demandMode === 'preset' && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">分类标签</p>
                <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-lg min-h-[52px]">
                  {demandTags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 rounded-full px-2.5 py-1 text-gray-700">
                      {tag}
                      <button className="text-gray-400 hover:text-red-500 ml-0.5 leading-none"
                        onClick={() => setDemandTags((prev) => prev.filter((t) => t !== tag))}>×</button>
                    </span>
                  ))}
                  {demandTags.length === 0 && <span className="text-xs text-gray-400">暂无标签，请在下方添加</span>}
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 h-8 text-xs border border-gray-200 rounded-md px-2.5 focus:outline-none focus:border-blue-400"
                    placeholder="输入分类名称，回车添加"
                    value={demandTagInput}
                    onChange={(e) => setDemandTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && demandTagInput.trim() && !demandTags.includes(demandTagInput.trim())) {
                        setDemandTags((prev) => [...prev, demandTagInput.trim()]);
                        setDemandTagInput('');
                      }
                    }}
                  />
                  <Button size="sm" variant="outline" className="h-8 text-xs"
                    onClick={() => {
                      if (demandTagInput.trim() && !demandTags.includes(demandTagInput.trim())) {
                        setDemandTags((prev) => [...prev, demandTagInput.trim()]);
                        setDemandTagInput('');
                      }
                    }}>+ 添加</Button>
                </div>
                <p className="text-xs text-gray-400 mt-2">AI 会从以上标签中选择最匹配的一个写入线索池和对话工作台。</p>
              </div>
            )}

            {demandMode === 'llm' && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                <p className="font-medium mb-1">大模型总结模式</p>
                <p>AI 将在每轮对话后自动总结用户需求，以简短语言（≤10字）写入需求类型字段。无需预设分类，但结果可能更多样，不利于统计分析。</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => setDemandCfgOpen(false)}>取消</Button>
            <Button size="sm" className="bg-blue-600" onClick={() => { alert('需求类型识别配置已保存'); setDemandCfgOpen(false); }}>保存配置</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
