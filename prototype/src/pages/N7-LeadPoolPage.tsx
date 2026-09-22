import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

// ── 类型定义 ───────────────────────────────────────────────────────
type IntentLevel = 'high' | 'medium' | 'low';
type LeadStatus = 'pending' | 'following' | 'converted' | 'invalid';
type DemandType = 'info' | 'product_select' | 'inquiry' | 'after_sale' | 'faq' | 'unclear';
type CrmSyncStatus = 'not_synced' | 'syncing' | 'synced' | 'error';
type LeadGrade = 'A' | 'B' | 'C' | 'D';

interface FollowUpRecord {
  time: string;
  method: '电话' | '邮件' | '短信' | '备注';
  content: string;
  nextContact?: string;
}

interface SessionAiSummary {
  updatedAt: string;
  overall: string;
  leadInfo: { email: string; phone: string; company: string; contactName: string };
  timeline: { date: string; text: string }[];
}

interface LeadItem {
  leadId: string;
  // 身份
  customerName: string;
  companyName: string | null;
  contactName?: string;        // 联系人姓名
  address?: string;            // 企业地址
  phone: string | null;
  email: string | null;
  visitorId: string;
  unifiedId: string | null;
  ip: string;
  region: string;
  regionFlag: string;
  memberId: string | null;
  // 来源
  sourceForm: string;
  source: string;
  lang: string | null;
  channel?: string;            // 渠道（腾讯广告 / 百度 / 官网 …）
  submitDevice?: string;       // 提交设备+IP
  leadSourceId?: string;       // ID
  remark?: string;             // 备注
  sourceUrl?: string;          // 来源地址
  detailRegion?: string;       // 所属地区（省市区）
  // 需求 / 意向
  demandType: DemandType;
  intentLevel: IntentLevel;
  painPoints: string[];
  aiDemandType?: string;        // 智能客服AI总结需求类型
  visitedDigitalCard?: boolean;
  retentionContent?: string;   // 留资内容描述
  // 分级评分
  grade?: LeadGrade;
  totalScore?: number;
  profileScore?: number;       // 画像匹配
  behaviorScore?: number;      // 行为信号
  tradeScore?: number;         // 交易信号
  contactScore?: number;       // 联系方式
  // 生命周期
  status: LeadStatus;
  submittedAt: string;
  lastActiveAt: string;
  // 跟进记录
  followUpRecords?: FollowUpRecord[];
  // CRM
  crmSyncStatus: CrmSyncStatus;
  crmRef: string | null;
  // 详情扩展
  sessionSummary: string | null;
  customFields: Record<string, string>;
  mergedVisitorIds: string[];
  // 智能客服来源专属
  sessionId?: string | null;
  sessionAiSummary?: SessionAiSummary;
  sessionDuration?: string;
  sessionMessageCount?: number;
  sessionStartTime?: string;
  intentSignals?: string[];
  // 意向详情
  consultProduct?: string;
  intentFeatures?: string[];
  interestedTier?: string;
  confirmSteps?: { question: string; answer: string }[];
}

// 线索字段设置（与 N3 渐进式留资可配置表单同源）
interface LeadField { key: string; label: string; enabled: boolean; required: boolean; system: boolean; }

// ── DataSlot: 线索字段设置（留资表单字段口径，与 N3 同源）──────────────
const mockLeadFields: LeadField[] = [
  { key: 'customerName', label: '客户名称', enabled: true, required: true, system: true },
  { key: 'phone', label: '手机号', enabled: true, required: false, system: false },
  { key: 'email', label: '邮箱', enabled: true, required: true, system: false },
  { key: 'company', label: '公司名称', enabled: true, required: false, system: false },
  { key: 'country', label: '国家/地区', enabled: true, required: false, system: false },
  { key: 'demand', label: '需求描述', enabled: false, required: false, system: false },
];

// ── DataSlot: 线索列表（仅留资后产生）──────────────────────────────
const mockLeadsData: LeadItem[] = [
  // ── 待处理 ──────────────────────────────────────────────────────
  {
    leadId: 'L-2001', customerName: 'PacifiCap Properties Group', companyName: 'PacifiCap Properties Group',
    contactName: 'David Smith', address: '350 Fifth Ave, New York, NY',
    phone: '+1 212-5550199', email: 'dsmith@pmiforward.com', visitorId: 'v-66301', unifiedId: null,
    ip: '203.0.113.21', region: '北美', regionFlag: '🇺🇸', memberId: null,
    sourceForm: '外贸客户洞察', source: '外贸客户洞察', lang: null,
    channel: '海关数据', submitDevice: 'PC端 203.0.113.21', leadSourceId: 'anony5501234',
    remark: '通过海关数据触达', sourceUrl: 'https://example.com/customs', detailRegion: '美国-纽约州-曼哈顿',
    demandType: 'inquiry', intentLevel: 'medium', painPoints: ['采购周期', '报价比价'],
    grade: 'B', totalScore: 62, profileScore: 72, behaviorScore: 48, tradeScore: 68, contactScore: 60,
    visitedDigitalCard: false, retentionContent: '询价：需要光伏逆变器报价，计划Q4采购',
    consultProduct: '光伏逆变器',
    status: 'pending', submittedAt: '2026-06-08 16:21:00', lastActiveAt: '2026-06-08 16:21:00',
    followUpRecords: [],
    crmSyncStatus: 'not_synced', crmRef: null,
    sessionSummary: '通过外贸客户洞察工具提交留资，关注大宗采购报价。',
    customFields: { 采购计划: 'Q4 批量采购', 关注认证: 'CE / UL', 行业: '地产/物业' }, mergedVisitorIds: ['v-66301'],
  },
  {
    leadId: 'L-2002', customerName: 'ENERGIETECH INDUSTRIAL CORP', companyName: 'ENERGIETECH INDUSTRIAL CORP',
    contactName: 'Alondra Tenorio', address: 'Berliner Str. 45, Frankfurt',
    phone: '+49 69 5550188', email: 'alondra.tenorio@martingmbh.de', visitorId: 'v-99014', unifiedId: null,
    ip: '198.51.100.7', region: '欧洲', regionFlag: '🇩🇪', memberId: null,
    sourceForm: '外贸客户洞察', source: '外贸客户洞察', lang: null,
    channel: '广交会数据', submitDevice: 'PC端 198.51.100.7', leadSourceId: 'anony5599014',
    remark: '广交会展商数据导入', sourceUrl: 'https://example.com/canton-fair', detailRegion: '德国-黑森州-法兰克福',
    demandType: 'product_select', intentLevel: 'high', painPoints: ['设备选型', '交期'],
    grade: 'A', totalScore: 81, profileScore: 85, behaviorScore: 74, tradeScore: 82, contactScore: 90,
    visitedDigitalCard: true, retentionContent: '询价：工业物联网平台，需求多条产线配套，计划Q3采购',
    consultProduct: '工业物联网平台',
    status: 'pending', submittedAt: '2026-06-12 11:05:48', lastActiveAt: '2026-06-12 11:05:48',
    followUpRecords: [],
    crmSyncStatus: 'not_synced', crmRef: null,
    sessionSummary: '工业设备采购意向，需求多条产线配套。',
    customFields: { 采购计划: 'Q3 整批', 产线数量: '4 条', 行业: '工业制造' }, mergedVisitorIds: ['v-99014'],
  },
  {
    leadId: 'L-2007', customerName: 'NexGen Solutions GmbH', companyName: 'NexGen Solutions GmbH',
    contactName: '王强', address: '天河路228号 81室',
    phone: '+86 138-1002-5932', email: 'contact@nexgen.de', visitorId: 'v-52059', unifiedId: null,
    ip: '53.155.114.38', region: '北京', regionFlag: '🇨🇳', memberId: null,
    sourceForm: '智能客服', source: 'cn001.xuoumaill.cn', lang: '中文',
    channel: '腾讯广告', submitDevice: 'PC端 53.155.114.38', leadSourceId: 'anony5205932',
    remark: 'anony5205922', sourceUrl: 'https://example.com/腾讯广告', detailRegion: '中国-北京市-朝阳区',
    demandType: 'product_select', intentLevel: 'high', painPoints: ['选型对比', '实施周期'],
    aiDemandType: '购买意向',
    grade: 'A', totalScore: 74, profileScore: 81, behaviorScore: 61, tradeScore: 74, contactScore: 86,
    visitedDigitalCard: true, retentionContent: '询价: 需要产品目录及报价, 计划Q3采购',
    consultProduct: '光伏逆变器',
    status: 'pending', submittedAt: '2026-06-16 05:35:20', lastActiveAt: '2026-06-17 05:35:20',
    followUpRecords: [
      { time: '2026-06-07 05:35', method: '电话', content: '初步沟通，客户了解产品功能，计划下周提供方案。', nextContact: '2026-06-15T05:35' },
      { time: '2026-06-13 05:35', method: '邮件', content: '发送产品资料和报价单，客户已读未回复。' },
      { time: '2026-06-15 05:35', method: '短信', content: '客户表示需要内部讨论，约定下周三再次联系。', nextContact: '2026-06-18T05:35' },
    ],
    crmSyncStatus: 'not_synced', crmRef: null,
    sessionSummary: '用户通过腾讯广告落地页进入智能客服，询问光伏逆变器选型建议，关注对比高功率与标准型号差异，表达明确采购意向。',
    customFields: { 岗位: '采购经理', 团队规模: '20–50 人', 需求描述: '需要产品目录及报价，计划Q3采购', 预算区间: '50–100 万' },
    mergedVisitorIds: ['v-52059'],
    sessionId: 'chat-20260616-5e2a',
    sessionAiSummary: {
      updatedAt: '2026-06-16 05:42:00',
      overall: '用户通过腾讯广告落地页进入智能客服，主动询问光伏逆变器选型建议，重点关注高功率型号与标准型号的差异及并网认证要求，明确表达 Q3 采购意向并主动提交联系方式申请报价，意向判定为高意向。建议优先跟进，提供定制报价方案。',
      leadInfo: { email: 'contact@nexgen.de', phone: '+86 138-1002-5932', company: 'NexGen Solutions GmbH', contactName: '王强' },
      timeline: [
        { date: '2026-06-16 05:30', text: '用户通过腾讯广告点击进入落地页，触发主动招呼。' },
        { date: '2026-06-16 05:32', text: '询问光伏逆变器选型，AI 推送高功率/标准两档对比卡片。' },
        { date: '2026-06-16 05:36', text: '用户追问并网认证与售后响应速度，AI 提供知识库答复。' },
        { date: '2026-06-16 05:39', text: 'AI 引导确认采购规模（500kW以上）及采购方式（直采+长期服务合同）。' },
        { date: '2026-06-16 05:41', text: '用户主动提交联系方式，线索写入线索池，意向等级标记为高意向。' },
      ],
    },
    sessionDuration: '5 分 12 秒', sessionMessageCount: 8, sessionStartTime: '2026-06-16 05:30',
    intentSignals: ['腾讯广告点击', '访问数字名片', '主动询价', '计划Q3采购'],
    intentFeatures: ['高功率型号', '并网认证', '售后响应'],
    interestedTier: '标准版 / 年度服务',
    confirmSteps: [
      { question: '您的项目装机规模大概是多少千瓦？', answer: '500kW 以上' },
      { question: '您倾向哪种采购方式？', answer: '直采 + 长期服务合同' },
    ],
  },
  {
    leadId: 'L-2008', customerName: 'Stellar Logistics Ltd', companyName: 'Stellar Logistics Ltd',
    contactName: '李华', address: '科技南路18号 22室',
    phone: '+86 139-6688-0012', email: 'lihua@stellar-log.com', visitorId: 'v-44201', unifiedId: null,
    ip: '120.55.88.3', region: '深圳', regionFlag: '🇨🇳', memberId: null,
    sourceForm: '表单留资', source: 'cn002.xuoumaill.cn', lang: '中文',
    channel: '百度搜索', submitDevice: '移动端 120.55.88.3', leadSourceId: 'anony4420112',
    remark: '百度关键词：智能仓储系统', sourceUrl: 'https://example.com/baidu', detailRegion: '中国-广东省-深圳市',
    demandType: 'product_select', intentLevel: 'medium', painPoints: ['库存准确率', '分拣效率'],
    grade: 'B', totalScore: 58, profileScore: 65, behaviorScore: 52, tradeScore: 45, contactScore: 78,
    visitedDigitalCard: false, retentionContent: '了解智能仓储机器人，希望预约产品演示',
    consultProduct: '智能仓储机器人',
    status: 'pending', submittedAt: '2026-06-14 09:20:11', lastActiveAt: '2026-06-14 09:20:11',
    followUpRecords: [],
    crmSyncStatus: 'not_synced', crmRef: null,
    sessionSummary: null,
    customFields: { 岗位: '仓储运营总监', 仓库面积: '约 8000㎡', 需求描述: '希望预约智能仓储机器人产品演示', 期望交付: '3 个月内' }, mergedVisitorIds: ['v-44201'],
  },
  {
    leadId: 'L-2009', customerName: 'Apex Global Trading', companyName: 'Apex Global Trading',
    contactName: 'Sarah Kim', address: '123 Harbor Blvd, Seoul',
    phone: '+82 2-5550-3399', email: 's.kim@apexglobal.kr', visitorId: 'v-30812', unifiedId: null,
    ip: '210.89.128.4', region: '亚太', regionFlag: '🇰🇷', memberId: null,
    sourceForm: '外贸客户洞察', source: 'ko001.xuoumaill.cn', lang: '韩语',
    channel: '全球企业库', submitDevice: 'PC端 210.89.128.4', leadSourceId: 'anony3081299',
    remark: '韩国主动询盘', sourceUrl: 'https://ko001.xuoumaill.cn', detailRegion: '韩国-首尔',
    demandType: 'inquiry', intentLevel: 'medium', painPoints: ['价格竞争力', '认证资质'],
    grade: 'C', totalScore: 41, profileScore: 48, behaviorScore: 35, tradeScore: 22, contactScore: 70,
    visitedDigitalCard: false, retentionContent: '询价：精密轴承，关注韩国本地化服务',
    consultProduct: '精密轴承',
    status: 'pending', submittedAt: '2026-06-11 07:44:00', lastActiveAt: '2026-06-11 07:44:00',
    followUpRecords: [],
    crmSyncStatus: 'not_synced', crmRef: null,
    sessionSummary: null,
    customFields: { industry: '商贸流通', region: '亚太' }, mergedVisitorIds: ['v-30812'],
  },
  {
    leadId: 'L-2010', customerName: 'BlueOcean Trading Co.', companyName: 'BlueOcean Trading Co.',
    contactName: '张明', address: '文三路90号 5室',
    phone: '+86 137-5523-8801', email: 'zhangming@blueocean.cn', visitorId: 'v-71155', unifiedId: null,
    ip: '114.212.3.88', region: '杭州', regionFlag: '🇨🇳', memberId: null,
    sourceForm: '智能客服', source: 'cn002.xuoumaill.cn', lang: '中文',
    channel: '官网自然流量', submitDevice: 'PC端 114.212.3.88', leadSourceId: 'anony7115501',
    remark: '官网自然访问留资', sourceUrl: 'https://cn002.xuoumaill.cn', detailRegion: '中国-浙江省-杭州市',
    demandType: 'info', intentLevel: 'low', painPoints: ['了解产品线'],
    aiDemandType: '信息披露',
    grade: 'C', totalScore: 35, profileScore: 38, behaviorScore: 30, tradeScore: 18, contactScore: 68,
    visitedDigitalCard: false, retentionContent: '了解锂电池组产品线，暂无明确采购计划',
    consultProduct: '锂电池组',
    status: 'pending', submittedAt: '2026-06-10 15:02:30', lastActiveAt: '2026-06-10 15:02:30',
    followUpRecords: [],
    crmSyncStatus: 'not_synced', crmRef: null,
    sessionSummary: '用户询问锂电池组产品规格，暂无明确采购意向，纳入培育序列。',
    customFields: {}, mergedVisitorIds: ['v-71155'],
  },

  // ── 跟进中 ──────────────────────────────────────────────────────
  {
    leadId: 'L-2003', customerName: 'EnergiTech Industrial', companyName: 'EnergiTech Industrial',
    contactName: '王强', address: '天河路228号 81室',
    phone: '138-8888-6666', email: 'zhangwei@energitech.com', visitorId: 'v-12088', unifiedId: null,
    ip: '124.78.9.5', region: '上海', regionFlag: '🇨🇳', memberId: null,
    sourceForm: '智能客服', source: 'cn001.xuoumaill.cn', lang: '中文',
    channel: '腾讯广告', submitDevice: 'PC端 124.78.9.5', leadSourceId: 'anony1208801',
    remark: '高意向AI对话线索', sourceUrl: 'https://cn001.xuoumaill.cn', detailRegion: '中国-上海市-浦东新区',
    demandType: 'product_select', intentLevel: 'high', painPoints: ['私有化部署', '数据安全合规', 'API 集成'],
    aiDemandType: '购买意向',
    grade: 'A', totalScore: 88, profileScore: 90, behaviorScore: 82, tradeScore: 85, contactScore: 95,
    visitedDigitalCard: true, retentionContent: '询价：工业物联网平台企业版，50人团队，需私有化部署',
    consultProduct: '工业物联网平台',
    status: 'following', submittedAt: '2026-06-16 14:26:33', lastActiveAt: '2026-06-17 10:00:00',
    followUpRecords: [
      { time: '2026-06-16 16:00', method: '电话', content: '初次电话沟通，确认需求：50人团队，私有化部署，数据安全合规。客户表示本周内提供演示时间窗口。', nextContact: '2026-06-19T10:00' },
      { time: '2026-06-17 10:00', method: '邮件', content: '发送企业版产品资料和私有化部署方案文档，客户已读。' },
    ],
    crmSyncStatus: 'not_synced', crmRef: null,
    sessionSummary: '用户主动询问价格方案，了解四档方案后确认团队 50 人规模，重点关注私有化部署可行性及数据安全合规需求。通过两轮确认选项明确演示重点（数据安全与权限管控），AI 判断意向强烈，用户最终主动提交联系方式申请专属演示。',
    customFields: { 岗位: '技术总监', 团队规模: '50 人', 预算区间: '100–200 万', 主要痛点: '私有化部署与数据安全合规', 需求描述: '需了解私有化部署方案，希望安排专属演示', 期望演示时间: '本周内' },
    mergedVisitorIds: ['v-12088'],
    sessionId: 'chat-20260616-8a3f',
    sessionAiSummary: {
      updatedAt: '2026-06-16 14:38:00',
      overall: '用户主动询问工业物联网平台企业版价格方案，了解四档方案后确认团队 50 人规模，重点关注私有化部署可行性及数据安全合规需求。通过两轮确认选项明确演示重点（数据安全与权限管控），AI 判断意向强烈，用户最终主动提交联系方式申请专属演示。高优先级跟进，建议本周内安排专属演示。',
      leadInfo: { email: 'zhangwei@energitech.com', phone: '138-8888-6666', company: 'EnergiTech Industrial', contactName: '王强' },
      timeline: [
        { date: '2026-06-16 14:15', text: '用户进入官网，触发主动招呼，询问产品定价方案。' },
        { date: '2026-06-16 14:18', text: 'AI 介绍四档方案，用户确认团队 50 人规模，聚焦企业版。' },
        { date: '2026-06-16 14:22', text: '用户提出私有化部署需求，AI 解答私有化可行性与合规认证细节。' },
        { date: '2026-06-16 14:28', text: 'AI 推送确认选项：演示重点选择"数据安全与权限管控"。' },
        { date: '2026-06-16 14:33', text: '用户主动填写联系方式申请专属演示，线索写入线索池，意向标记为高意向。' },
      ],
    },
    sessionDuration: '8 分 23 秒', sessionMessageCount: 12, sessionStartTime: '2026-06-16 14:15',
    intentSignals: ['主动询价', '明确团队规模（50人）', '询问私有化部署', '数据安全合规需求', '主动提交留资'],
    intentFeatures: ['私有化部署', '数据安全合规', 'API 集成', '权限管控'],
    interestedTier: '企业版 / 私有化报价',
    confirmSteps: [
      { question: '您团队目前主要想用私有化部署解决哪类业务需求？', answer: '内部数据合规 / 安全要求' },
      { question: '您希望演示重点覆盖哪些方面？', answer: '数据安全与权限管控机制' },
    ],
  },
  {
    leadId: 'L-2011', customerName: 'FusionTech Systems', companyName: 'FusionTech Systems',
    contactName: '刘子轩', address: '建国路88号 12室',
    phone: '+86 132-7788-9900', email: 'liuzixuan@fusiontech.cn', visitorId: 'v-88234', unifiedId: null,
    ip: '180.97.32.11', region: '成都', regionFlag: '🇨🇳', memberId: null,
    sourceForm: '表单留资', source: 'cn001.xuoumaill.cn', lang: '中文',
    channel: '百度搜索', submitDevice: 'PC端 180.97.32.11', leadSourceId: 'anony8823401',
    remark: '百度竞价关键词：工业物联网', sourceUrl: 'https://example.com/baidu-sem', detailRegion: '中国-四川省-成都市-高新区',
    demandType: 'product_select', intentLevel: 'high', painPoints: ['设备联网', '远程监控', '数据分析'],
    grade: 'A', totalScore: 79, profileScore: 82, behaviorScore: 75, tradeScore: 70, contactScore: 88,
    visitedDigitalCard: true, retentionContent: '询价：工业物联网平台，20台设备联网需求，希望安排演示',
    consultProduct: '工业物联网平台',
    status: 'following', submittedAt: '2026-06-13 14:10:00', lastActiveAt: '2026-06-16 09:00:00',
    followUpRecords: [
      { time: '2026-06-14 10:00', method: '电话', content: '确认需求：20台工业设备需要联网监控，预算约20万/年。安排下周演示。', nextContact: '2026-06-20T14:00' },
    ],
    crmSyncStatus: 'not_synced', crmRef: null,
    sessionSummary: null,
    customFields: { 岗位: '生产信息化主管', 设备数量: '20 台', 需求描述: '20台设备联网，远程监控，希望演示', 预算区间: '20–50 万' }, mergedVisitorIds: ['v-88234'],
    intentFeatures: ['设备接入', '实时监控大屏', '告警推送'],
    interestedTier: '专业版',
  },

  // ── 已转化 ──────────────────────────────────────────────────────
  {
    leadId: 'L-2004', customerName: 'ENERGIETECH INDUSTRIAL CORP', companyName: 'ENERGIETECH INDUSTRIAL CORP',
    contactName: 'Marcelo Farah', address: 'Berliner Str. 47, Frankfurt',
    phone: '+49 69 5550191', email: 'marcelo.farah@martingmbh.de', visitorId: 'v-99016', unifiedId: 'u-99014',
    ip: '198.51.100.11', region: '欧洲', regionFlag: '🇩🇪', memberId: 'M-77120',
    sourceForm: '外贸客户洞察', source: '外贸客户洞察', lang: null,
    channel: '广交会数据', submitDevice: 'PC端 198.51.100.11', leadSourceId: 'anony9901601',
    remark: '已成交客户', sourceUrl: 'https://example.com/canton-fair', detailRegion: '德国-黑森州-法兰克福',
    demandType: 'inquiry', intentLevel: 'high', painPoints: ['整体方案', '长期服务'],
    grade: 'A', totalScore: 92, profileScore: 95, behaviorScore: 88, tradeScore: 90, contactScore: 96,
    visitedDigitalCard: true, retentionContent: '已签约工业物联网平台年度服务合同',
    consultProduct: '工业物联网平台',
    status: 'converted', submittedAt: '2026-06-03 11:05:48', lastActiveAt: '2026-06-10 14:00:00',
    followUpRecords: [
      { time: '2026-06-04 10:00', method: '电话', content: '初步沟通，确认采购需求和预算范围。' },
      { time: '2026-06-06 14:00', method: '邮件', content: '发送定制方案和报价单，客户表示满意。' },
      { time: '2026-06-10 11:00', method: '电话', content: '签约确认，客户已完成付款，进入实施阶段。' },
    ],
    crmSyncStatus: 'synced', crmRef: 'crm-person-9916',
    sessionSummary: '已转为客户，进入商务跟进。',
    customFields: { industry: '工业制造' }, mergedVisitorIds: ['v-99016', 'v-99016-mobile'],
  },
  {
    leadId: 'L-2012', customerName: 'Polaris Medical', companyName: 'Polaris Medical',
    contactName: '陈雅婷', address: '南京东路128号 8室',
    phone: '+86 136-2233-5500', email: 'chenyating@polaris-med.com', visitorId: 'v-33401', unifiedId: 'u-33401',
    ip: '61.135.169.22', region: '北京', regionFlag: '🇨🇳', memberId: 'M-55889',
    sourceForm: '智能客服', source: 'cn001.xuoumaill.cn', lang: '中文',
    channel: '腾讯广告', submitDevice: 'PC端 61.135.169.22', leadSourceId: 'anony3340112',
    remark: '医疗行业高价值客户', sourceUrl: 'https://cn001.xuoumaill.cn', detailRegion: '中国-北京市-西城区',
    demandType: 'product_select', intentLevel: 'high', painPoints: ['医疗设备管理', '合规追溯'],
    aiDemandType: '购买意向',
    grade: 'A', totalScore: 85, profileScore: 88, behaviorScore: 80, tradeScore: 82, contactScore: 92,
    visitedDigitalCard: true, retentionContent: '采购工业物联网平台用于医疗设备远程监控与维保管理',
    consultProduct: '工业物联网平台',
    status: 'converted', submittedAt: '2026-06-05 10:30:00', lastActiveAt: '2026-06-12 16:00:00',
    followUpRecords: [
      { time: '2026-06-06 09:00', method: '电话', content: '了解医疗设备管理需求，确认合规要求。' },
      { time: '2026-06-09 14:00', method: '邮件', content: '提供医疗行业专属解决方案文档。' },
      { time: '2026-06-12 11:00', method: '电话', content: '合同签订，启动实施流程。' },
    ],
    crmSyncStatus: 'synced', crmRef: 'crm-person-3340',
    sessionSummary: '通过智能客服咨询医疗设备远程监控方案，意向明确，快速推进至签约。',
    customFields: { 岗位: '运维主管', 设备数量: '50–100 台', 合规要求: '医疗器械管理条例', 需求描述: '医疗设备远程监控与合规追溯', 预算区间: '50–100 万' }, mergedVisitorIds: ['v-33401'],
    sessionId: 'chat-20260605-4c1b',
    sessionAiSummary: {
      updatedAt: '2026-06-05 10:40:00',
      overall: '用户通过智能客服咨询工业物联网平台在医疗设备远程监控场景的适用性，询问合规追溯能力及医疗器械管理条例符合性。用户提供 50–100 台设备规模，AI 明确演示重点后用户主动提交留资，快速推进至商务跟进并最终签约。',
      leadInfo: { email: 'chenyating@polaris-med.com', phone: '+86 136-2233-5500', company: 'Polaris Medical', contactName: '陈雅婷' },
      timeline: [
        { date: '2026-06-05 10:24', text: '用户进入智能客服，询问医疗设备远程监控解决方案。' },
        { date: '2026-06-05 10:27', text: 'AI 介绍平台医疗行业案例，用户追问合规追溯能力。' },
        { date: '2026-06-05 10:31', text: 'AI 确认平台符合医疗器械管理条例，用户提供设备规模（50–100台）。' },
        { date: '2026-06-05 10:36', text: '用户主动提交联系方式，线索写入线索池，标记高意向。' },
      ],
    },
    sessionDuration: '6 分 45 秒', sessionMessageCount: 10, sessionStartTime: '2026-06-05 10:24',
    intentSignals: ['主动询价', '明确场景（医疗设备）', '询问合规认证', '主动提交留资'],
    intentFeatures: ['设备远程监控', '维保管理', '合规追溯'],
    interestedTier: '企业版',
    confirmSteps: [
      { question: '您需要管理多少台医疗设备？', answer: '50-100台' },
      { question: '是否有合规追溯的监管要求？', answer: '是，需符合医疗器械管理条例' },
    ],
  },

  // ── 无效 ──────────────────────────────────────────────────────
  {
    leadId: 'L-2005', customerName: 'Globex Trading Co.', companyName: 'Globex Trading Co.',
    contactName: 'Bot User', address: '未知',
    phone: '+1 415****0099', email: 'sales@globex.com', visitorId: 'v-bot-2201', unifiedId: null,
    ip: '45.140.0.3', region: '未知', regionFlag: '🏴', memberId: null,
    sourceForm: '智能客服', source: 'en001.xuoumaill.cn', lang: '英语',
    channel: '未知流量', submitDevice: 'PC端 45.140.0.3', leadSourceId: 'anony2201bot',
    remark: '疑似机器人刷量', sourceUrl: 'https://en001.xuoumaill.cn', detailRegion: '未知',
    demandType: 'after_sale', intentLevel: 'low', painPoints: ['数据导出报错'],
    aiDemandType: '功能咨询',
    grade: 'D', totalScore: 12, profileScore: 10, behaviorScore: 8, tradeScore: 0, contactScore: 30,
    visitedDigitalCard: false,
    status: 'invalid', submittedAt: '2026-05-30 14:21:55', lastActiveAt: '2026-05-30 14:22:30',
    followUpRecords: [],
    crmSyncStatus: 'not_synced', crmRef: null,
    sessionSummary: '疑似无效/重复留资，已标记无效。',
    customFields: {}, mergedVisitorIds: ['v-bot-2201'],
  },
  {
    leadId: 'L-2006', customerName: '匿名访客 v-55109', companyName: null,
    phone: null, email: null, visitorId: 'v-55109', unifiedId: null,
    ip: '1.2.3.4', region: '未知', regionFlag: '🏴', memberId: null,
    sourceForm: '表单留资', source: 'cn001.xuoumaill.cn', lang: '中文',
    channel: '未知', submitDevice: 'PC端 1.2.3.4', leadSourceId: 'anony5510901',
    demandType: 'unclear', intentLevel: 'low', painPoints: [],
    grade: 'D', totalScore: 8, profileScore: 5, behaviorScore: 5, tradeScore: 0, contactScore: 20,
    status: 'invalid', submittedAt: '2026-05-28 09:11:00', lastActiveAt: '2026-05-28 09:11:00',
    followUpRecords: [],
    crmSyncStatus: 'not_synced', crmRef: null,
    sessionSummary: null,
    customFields: {}, mergedVisitorIds: ['v-55109'],
  },
];

// ── ActionSlot ────────────────────────────────────────────────────

// ACTION: 标记跟进 [PATCH] /api/leads/{lead_id} {status:"following"}
function handleMarkFollowing(leadId: string): void { console.log('mark following', leadId); }

// ACTION: 标记无效 [PATCH] /api/leads/{lead_id} {status:"invalid"}
function handleMarkInvalid(leadId: string): void { console.log('mark invalid', leadId); }

// ACTION: 售后类转工单 [POST] /api/tickets/from-lead
function handleConvertToTicket(leadId: string): void {
  console.log('convert lead to ticket', leadId);
  alert(`线索 ${leadId} 为售后诉求，已转工单（N8）走解决流程`);
}

// ACTION: 删除线索 [DELETE] /api/leads/{lead_id}
function handleDelete(leadId: string): void { console.log('delete lead', leadId); }

// ACTION: 跳转至对话页 [GET] /api/sessions/{session_id}
function handleJumpToSession(sessionId: string): void {
  console.log('navigate to session', sessionId);
  alert(`跳转至对话页：sessionId=${sessionId}`);
}

// ACTION: 转为客户 [POST] /api/leads/{lead_id}/convert
function handleConvertToCustomer(leadId: string): void {
  console.log('convert lead to customer', leadId);
  alert(`线索 ${leadId} 已转为客户，进入客户管理（N6）持续经营`);
}

// ACTION: 手动合并多线索到同一客户 [POST] /api/leads/merge
function handleMergeLeads(primaryLeadId: string, mergeLeadIds: string[]): void {
  console.log('merge leads', { primaryLeadId, mergeLeadIds });
  alert(`已将 ${mergeLeadIds.length} 条线索合并到主记录 ${primaryLeadId}（历史回溯挂载，可审计）`);
}

// ACTION: 写入 TwentyCRM [POST] /api/leads/crm-sync
function handleSyncToCRM(leadIds: string[]): void {
  console.log('sync to CRM', leadIds);
  alert(`正在写入 ${leadIds.length} 条线索到 TwentyCRM...`);
}

// ACTION: 保存线索字段设置 [PUT] /api/lead-fields
function handleSaveLeadFields(fields: LeadField[]): void {
  console.log('save lead fields', fields);
  alert('线索字段设置已保存（与渐进式留资表单同源）');
}

// ── 辅助常量 ──────────────────────────────────────────────────────
const INTENT: Record<IntentLevel, { label: string; cls: string }> = {
  high: { label: '高意向', cls: 'bg-red-100 text-red-700 border-red-200' },
  medium: { label: '中意向', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  low: { label: '低意向', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
};
const STATUS: Record<LeadStatus, { label: string; cls: string }> = {
  pending: { label: '待处理', cls: 'bg-blue-50 text-blue-600' },
  following: { label: '跟进中', cls: 'bg-green-50 text-green-600' },
  converted: { label: '已转化', cls: 'bg-purple-50 text-purple-600' },
  invalid: { label: '无效', cls: 'bg-gray-100 text-gray-400' },
};
const DEMAND: Record<DemandType, string> = {
  info: '信息查询', product_select: '产品选型', inquiry: '产品询价',
  after_sale: '售后问题', faq: '常见问题', unclear: '意图模糊',
};
const CRM_SYNC: Record<CrmSyncStatus, { label: string; cls: string }> = {
  not_synced: { label: '未同步', cls: 'bg-gray-100 text-gray-500' },
  syncing: { label: '同步中', cls: 'bg-blue-100 text-blue-600' },
  synced: { label: '已同步', cls: 'bg-green-100 text-green-600' },
  error: { label: '同步失败', cls: 'bg-red-100 text-red-600' },
};

const STATUS_TABS: { key: LeadStatus; label: string }[] = [
  { key: 'pending', label: '待处理' },
  { key: 'following', label: '跟进中' },
  { key: 'converted', label: '已转化' },
  { key: 'invalid', label: '无效' },
];

// ── 主组件 ────────────────────────────────────────────────────────
export default function LeadPoolPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [intentFilter, setIntentFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusTab, setStatusTab] = useState<LeadStatus>('pending');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [fields, setFields] = useState<LeadField[]>(mockLeadFields);
  const [moreOpenId, setMoreOpenId] = useState<string | null>(null);
  const [extraFollowUps, setExtraFollowUps] = useState<Record<string, FollowUpRecord[]>>({});
  const [customFieldsOpen, setCustomFieldsOpen] = useState(false);
  const [sessionSummaryOpen, setSessionSummaryOpen] = useState(false);
  const [followUpMethod, setFollowUpMethod] = useState<FollowUpRecord['method']>('电话');
  const [followUpContent, setFollowUpContent] = useState('');
  const [followUpNext, setFollowUpNext] = useState('');

  const sources = Array.from(new Set(mockLeadsData.map((l) => l.source)));

  const filtered = mockLeadsData.filter((l) => {
    if (l.status !== statusTab) return false;
    if (sourceFilter !== 'all' && l.source !== sourceFilter) return false;
    if (intentFilter !== 'all' && l.intentLevel !== intentFilter) return false;
    if (dateFrom && l.submittedAt < dateFrom) return false;
    if (dateTo && l.submittedAt > dateTo + ' 23:59:59') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const hay = [l.customerName, l.email, l.phone, l.sourceForm, l.visitorId, l.ip].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  function toggleSelect(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  function openDetail(id: string) {
    setActiveLeadId(id);
    setDetailOpen(true);
    setFollowUpContent('');
    setFollowUpNext('');
    setFollowUpMethod('电话');
    setCustomFieldsOpen(false);
    setSessionSummaryOpen(false);
  }
  function saveFollowUp(leadId: string) {
    if (!followUpContent.trim()) return;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const rec: FollowUpRecord = { time: now, method: followUpMethod, content: followUpContent.trim(), nextContact: followUpNext || undefined };
    setExtraFollowUps((prev) => ({ ...prev, [leadId]: [rec, ...(prev[leadId] ?? [])] }));
    setFollowUpContent('');
    setFollowUpNext('');
  }

  // 贴近线上真实量级展示
  const displayCounts: Record<string, number> = { pending: 265, following: 40, converted: 49, invalid: 22 };

  const activeLead = mockLeadsData.find((l) => l.leadId === activeLeadId);
  const selectedLeads = mockLeadsData.filter((l) => selectedIds.includes(l.leadId));

  return (
    <div className="p-6 space-y-4 bg-gray-50 min-h-screen" onClick={() => setMoreOpenId(null)}>
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">线索池</h1>
          <p className="text-sm text-gray-500 mt-0.5">N7 · 筛查跟进视角 — <strong>留资后才成线索</strong>，人工筛查真伪并跟进，决定 转客户 / 无效</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length >= 2 && (
            <Button size="sm" variant="outline" onClick={() => setMergeOpen(true)}>合并到客户（{selectedIds.length}）</Button>
          )}
          {selectedIds.length > 0 && (
            <Button size="sm" className="bg-blue-600" onClick={() => handleSyncToCRM(selectedIds)}>写入 CRM（{selectedIds.length}）</Button>
          )}
          <Button size="sm" variant="outline">导出</Button>
        </div>
      </div>

      {/* 工具栏：线索字段设置 + 检索 */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Button size="sm" variant="outline" onClick={() => setFieldsOpen(true)}>线索字段设置</Button>
            <Select value={intentFilter} onValueChange={setIntentFilter}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="意向" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部意向</SelectItem>
                <SelectItem value="high">高意向</SelectItem>
                <SelectItem value="medium">中意向</SelectItem>
                <SelectItem value="low">低意向</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">线索信息</span>
              <Input className="w-44 h-8 text-xs" placeholder="请输入关键词" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">来源</span>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="请选择来源" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部来源</SelectItem>
                  {sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">提交时间</span>
              <Input className="w-32 h-8 text-xs" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <span className="text-gray-300 text-xs">至</span>
              <Input className="w-32 h-8 text-xs" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 状态 Tab */}
      <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as LeadStatus)}>
        <TabsList className="bg-gray-100">
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>{t.label}（{displayCounts[t.key]}）</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={statusTab}>
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>客户名称</TableHead>
                    <TableHead>手机号/邮箱</TableHead>
                    <TableHead>来源表单</TableHead>
                    <TableHead>来源</TableHead>
                    <TableHead>需求类型</TableHead>
                    <TableHead>意向</TableHead>
                    <TableHead>提交时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead) => (
                    <TableRow key={lead.leadId} className="hover:bg-gray-50">
                      <TableCell>
                        <input type="checkbox" className="rounded" checked={selectedIds.includes(lead.leadId)} onChange={() => toggleSelect(lead.leadId)} />
                      </TableCell>
                      <TableCell>
                        {lead.unifiedId ? (
                          <a href={`/customers/${lead.unifiedId}`} className="text-sm font-medium text-blue-600 hover:underline">{lead.customerName}</a>
                        ) : (
                          <span className="text-sm text-gray-800">{lead.customerName}</span>
                        )}
                        <div className="text-[11px] text-gray-400 font-mono">{lead.visitorId}</div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">{lead.phone ?? lead.email ?? '—'}</TableCell>
                      <TableCell className="text-sm text-gray-600">{lead.sourceForm}</TableCell>
                      <TableCell className="text-xs">
                        {lead.source.includes('.') ? <span className="text-blue-600">{lead.source}</span> : <span className="text-gray-600">{lead.source}</span>}
                        {lead.lang && <Badge className="text-[10px] bg-gray-100 text-gray-500 ml-1">{lead.lang}</Badge>}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {lead.aiDemandType ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[10px] text-purple-500">✦</span>
                            {lead.aiDemandType}
                          </span>
                        ) : DEMAND[lead.demandType]}
                      </TableCell>
                      <TableCell><Badge className={`text-xs ${INTENT[lead.intentLevel].cls}`}>{INTENT[lead.intentLevel].label}</Badge></TableCell>
                      <TableCell className="text-xs text-gray-500 whitespace-nowrap">{lead.submittedAt}</TableCell>
                      <TableCell className="text-right whitespace-nowrap text-xs">
                        <button className="text-blue-600 hover:underline" onClick={() => openDetail(lead.leadId)}>查看</button>
                        <span className="text-gray-300 mx-1">|</span>
                        {lead.status !== 'converted' ? (
                          <button className="text-blue-600 hover:underline" onClick={() => handleConvertToCustomer(lead.leadId)}>转为客户</button>
                        ) : (
                          <span className="text-gray-300">已转客户</span>
                        )}
                        <span className="text-gray-300 mx-1">|</span>
                        <span className="relative inline-block">
                          <button className="text-blue-600 hover:underline" onClick={(e) => { e.stopPropagation(); setMoreOpenId(moreOpenId === lead.leadId ? null : lead.leadId); }}>更多 ▾</button>
                          {moreOpenId === lead.leadId && (
                            <div className="absolute right-0 mt-1 w-28 bg-white border rounded-md shadow-lg z-10 py-1 text-left" onClick={(e) => e.stopPropagation()}>
                              <button className="block w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 text-left" onClick={() => { handleMarkFollowing(lead.leadId); setMoreOpenId(null); }}>标记跟进</button>
                              <button className="block w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 text-left" onClick={() => { handleMarkInvalid(lead.leadId); setMoreOpenId(null); }}>标记无效</button>
                              {lead.demandType === 'after_sale' && (
                                <button className="block w-full px-3 py-1.5 text-xs text-orange-600 hover:bg-gray-50 text-left" onClick={() => { handleConvertToTicket(lead.leadId); setMoreOpenId(null); }}>转工单</button>
                              )}
                              {lead.crmSyncStatus !== 'synced' && (
                                <button className="block w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 text-left" onClick={() => { handleSyncToCRM([lead.leadId]); setMoreOpenId(null); }}>写入 CRM</button>
                              )}
                              <button className="block w-full px-3 py-1.5 text-xs text-red-500 hover:bg-gray-50 text-left" onClick={() => { handleDelete(lead.leadId); setMoreOpenId(null); }}>删除</button>
                            </div>
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={10} className="text-center text-gray-400 py-8">暂无数据</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="mt-3 text-xs text-gray-400">
                共 {displayCounts[statusTab]} 条{selectedIds.length > 0 && ` · 已选 ${selectedIds.length} 条`}
                {selectedIds.length >= 2 && '（≥2 条可合并到同一客户）'}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 线索详情 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              线索详情 · {activeLead?.customerName}
              {activeLead?.grade && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${
                  activeLead.grade === 'A' ? 'bg-red-500' : activeLead.grade === 'B' ? 'bg-amber-500' :
                  activeLead.grade === 'C' ? 'bg-blue-500' : 'bg-gray-400'}`}>
                  {activeLead.grade}类
                </span>
              )}
              {activeLead && <Badge className={`text-xs ${STATUS[activeLead.status].cls}`}>{STATUS[activeLead.status].label}</Badge>}
              {activeLead && <Badge className={`text-xs ${INTENT[activeLead.intentLevel].cls}`}>{INTENT[activeLead.intentLevel].label}</Badge>}
            </DialogTitle>
          </DialogHeader>

          {activeLead && (() => {
            const allFollowUps = [...(extraFollowUps[activeLead.leadId] ?? []), ...(activeLead.followUpRecords ?? [])];
            return (
            <div className="space-y-5 mt-1">

              {/* ── 📋 线索信息 ── */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 border-l-4 border-blue-500 pl-2">📋 线索信息</p>
                <div className="space-y-1.5 text-sm">
                  {[
                    { label: '线索状态', value: STATUS[activeLead.status].label },
                    { label: '企业名称', value: activeLead.companyName ?? '—' },
                    { label: '联系人姓名', value: activeLead.contactName ?? '—' },
                    { label: '联系人手机', value: activeLead.phone ?? '—' },
                    { label: '邮箱', value: activeLead.email ?? '—' },
                    { label: '企业地址', value: activeLead.address ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex border-b border-gray-50 pb-1.5">
                      <span className="w-28 text-gray-500 text-xs shrink-0">{label}</span>
                      <span className="text-gray-900 text-xs font-medium">{value}</span>
                    </div>
                  ))}
                </div>

                {/* 表单自定义字段（可展开） */}
                {Object.keys(activeLead.customFields).length > 0 && (
                  <div className="mt-2">
                    <button
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 mt-1 group"
                      onClick={() => setCustomFieldsOpen(o => !o)}>
                      <span className={`transition-transform duration-150 ${customFieldsOpen ? 'rotate-90' : ''}`}>▶</span>
                      {customFieldsOpen ? '收起' : `展开 ${Object.keys(activeLead.customFields).length} 个表单字段`}
                      {!customFieldsOpen && (
                        <span className="text-[10px] text-gray-400 font-normal ml-0.5">
                          · {Object.keys(activeLead.customFields).slice(0, 2).join('、')}{Object.keys(activeLead.customFields).length > 2 ? '…' : ''}
                        </span>
                      )}
                    </button>
                    {customFieldsOpen && (
                      <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2 space-y-1.5">
                        <p className="text-[10px] text-blue-400 mb-1.5 font-medium tracking-wide uppercase">留资表单收集字段</p>
                        {Object.entries(activeLead.customFields).map(([key, val]) => (
                          <div key={key} className="flex border-b border-blue-100/60 pb-1.5 last:border-0 last:pb-0">
                            <span className="w-28 text-blue-500/80 text-xs shrink-0">{key}</span>
                            <span className="text-gray-800 text-xs font-medium">{val}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── ⭐ 分级与评分 ── */}
              {activeLead.grade && activeLead.totalScore !== undefined && (
                <>
                  <div className="border-t border-gray-100" />
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 border-l-4 border-yellow-400 pl-2">⭐ 分级与评分</p>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-5 mb-4">
                        <div className={`text-2xl font-bold px-5 py-2 rounded-xl text-white text-center min-w-[72px] ${
                          activeLead.grade === 'A' ? 'bg-red-500' : activeLead.grade === 'B' ? 'bg-amber-500' :
                          activeLead.grade === 'C' ? 'bg-blue-500' : 'bg-gray-400'}`}>
                          {activeLead.grade}类
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-gray-900">{activeLead.totalScore}分</div>
                          <div className="text-xs text-gray-400 mt-0.5">综合评分（权重：画像40% · 行为30% · 交易20% · 联系方式10%）</div>
                        </div>
                      </div>
                      {[
                        { label: '画像匹配', score: activeLead.profileScore ?? 0, color: 'bg-blue-500' },
                        { label: '行为信号', score: activeLead.behaviorScore ?? 0, color: 'bg-amber-500' },
                        { label: '交易信号', score: activeLead.tradeScore ?? 0, color: 'bg-violet-500' },
                        { label: '联系方式', score: activeLead.contactScore ?? 0, color: 'bg-green-500' },
                      ].map(({ label, score, color }) => (
                        <div key={label} className="flex items-center gap-2 mb-2">
                          <span className="w-16 text-xs text-gray-600 shrink-0">{label}</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 w-6 text-right">{score}</span>
                        </div>
                      ))}
                      <p className="text-xs text-gray-400 mt-2 text-right cursor-pointer hover:text-blue-600"
                        onClick={() => alert('评分细则：画像匹配=目标行业/规模/地区；行为信号=表单提交/访问频次/浏览深度；交易信号=海关数据/历史采购；联系方式=手机+邮箱完整性')}>
                        📊 查看评分细则
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* ── 📌 渠道与来源信息 ── */}
              <div className="border-t border-gray-100" />
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 border-l-4 border-green-500 pl-2">📌 渠道与来源信息</p>
                <div className="space-y-1.5 text-sm">
                  {[
                    { label: '渠道', value: activeLead.channel ?? activeLead.sourceForm },
                    { label: '线索来源', value: activeLead.sourceForm },
                    { label: 'ID', value: activeLead.leadSourceId ?? activeLead.visitorId },
                    { label: '提交地址', value: activeLead.submitDevice ?? `PC端 ${activeLead.ip}` },
                    { label: '提交时间', value: activeLead.submittedAt },
                    { label: '备注', value: activeLead.remark ?? '—' },
                    { label: '来源地址', value: activeLead.sourceUrl ?? activeLead.source },
                    { label: '所属地区', value: activeLead.detailRegion ?? activeLead.region },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex border-b border-gray-50 pb-1.5">
                      <span className="w-28 text-gray-500 text-xs shrink-0">{label}</span>
                      <span className="text-gray-900 text-xs font-medium break-all">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 🔄 行为轨迹 ── */}
              <div className="border-t border-gray-100" />
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 border-l-4 border-purple-500 pl-2">🔄 行为轨迹</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="text-gray-400 shrink-0">{activeLead.lastActiveAt}</span>
                    <span>最后活跃</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="w-2 h-2 rounded-full bg-gray-300 mt-1 shrink-0" />
                    <span>渠道: {activeLead.channel ?? activeLead.sourceForm} | 来源: {activeLead.sourceForm}</span>
                  </div>
                  {activeLead.visitedDigitalCard && (
                    <div className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="w-2 h-2 rounded-full bg-blue-400 mt-1 shrink-0" />
                      <span>已访问数字名片</span>
                    </div>
                  )}
                  {activeLead.retentionContent && (
                    <div className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="w-2 h-2 rounded-full bg-green-400 mt-1 shrink-0" />
                      <span>留资内容: {activeLead.retentionContent}</span>
                    </div>
                  )}
                  {activeLead.consultProduct && (
                    <div className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
                      <span>咨询产品: {activeLead.consultProduct}</span>
                    </div>
                  )}
                  {activeLead.painPoints.length > 0 && (
                    <div className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="w-2 h-2 rounded-full bg-orange-400 mt-1 shrink-0" />
                      <span>关注痛点: {activeLead.painPoints.join('、')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── 意向详情（AI对话专属）── */}
              {(activeLead.intentFeatures?.length || activeLead.interestedTier || activeLead.confirmSteps?.length) && (
                <>
                  <div className="border-t border-gray-100" />
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 border-l-4 border-indigo-500 pl-2">🎯 意向详情</p>
                    <div className="space-y-2">
                      {(activeLead.consultProduct || activeLead.interestedTier) && (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {activeLead.consultProduct && <div><span className="text-xs text-gray-400">咨询产品</span><p className="font-medium">{activeLead.consultProduct}</p></div>}
                          {activeLead.interestedTier && <div><span className="text-xs text-gray-400">关注价格段</span><p className="font-medium">{activeLead.interestedTier}</p></div>}
                        </div>
                      )}
                      {activeLead.intentFeatures && activeLead.intentFeatures.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">关注功能点</p>
                          <div className="flex flex-wrap gap-1.5">
                            {activeLead.intentFeatures.map((f) => <span key={f} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium">{f}</span>)}
                          </div>
                        </div>
                      )}
                      {activeLead.confirmSteps && activeLead.confirmSteps.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-400 mb-2">AI 对话确认步骤</p>
                          <div className="space-y-2">
                            {activeLead.confirmSteps.map((step, i) => (
                              <div key={i} className="flex gap-2.5 items-start">
                                <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-semibold">{i + 1}</div>
                                <div><p className="text-xs text-gray-400 mb-0.5">{step.question}</p><span className="text-xs bg-gray-100 text-gray-700 font-semibold px-2.5 py-1 rounded-md">{step.answer}</span></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ── 来源会话摘要（智能客服专属）── */}
              {activeLead.sessionSummary && (
                <>
                  <div className="border-t border-gray-100" />
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide border-l-4 border-purple-500 pl-2">来源会话摘要</p>
                        {activeLead.sourceForm === '智能客服' && <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200">智能客服</Badge>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {activeLead.sessionAiSummary && (
                          <Button size="sm" variant="outline" className="text-xs h-7 text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => setSessionSummaryOpen(true)}>
                            💡 AI 总结
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="text-xs h-7 text-purple-700 border-purple-300 hover:bg-purple-50"
                          onClick={() => handleJumpToSession(activeLead.sessionId ?? activeLead.leadId)}>
                          跳转对话 ↗
                        </Button>
                      </div>
                    </div>
                    {activeLead.sessionDuration && (
                      <div className="flex gap-4 text-xs text-gray-400 mb-2">
                        <span>⏱ {activeLead.sessionDuration}</span>
                        <span>💬 {activeLead.sessionMessageCount} 条</span>
                        {activeLead.sessionStartTime && <span>🕐 {activeLead.sessionStartTime}</span>}
                      </div>
                    )}
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{activeLead.sessionSummary}</p>
                    {activeLead.intentSignals && activeLead.intentSignals.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-400 mb-1.5">需求类型</p>
                        <div className="flex flex-wrap gap-1.5">
                          {activeLead.intentSignals.map((s) => <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">{s}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── 跟进记录 ── */}
              <div className="border-t border-gray-100" />
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 border-l-4 border-teal-500 pl-2">跟进记录</p>
                {allFollowUps.length === 0 ? (
                  <p className="text-xs text-gray-400 mb-3">暂无跟进记录</p>
                ) : (
                  <div className="space-y-2 mb-3">
                    {allFollowUps.map((rec, i) => (
                      <div key={i} className="border-l-2 border-gray-200 pl-3">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-gray-700">{rec.time}</span>
                          <Badge className="text-[10px] bg-gray-100 text-gray-500">[{rec.method}]</Badge>
                        </div>
                        <p className="text-xs text-gray-600">{rec.content}</p>
                        {rec.nextContact && <p className="text-[10px] text-gray-400 mt-0.5">下次联系: {rec.nextContact}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {/* 添加跟进记录表单 */}
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-medium text-gray-600">+ 添加跟进记录</p>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-gray-500 shrink-0">方式</span>
                    <select className="flex-1 text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
                      value={followUpMethod} onChange={(e) => setFollowUpMethod(e.target.value as FollowUpRecord['method'])}>
                      {(['电话', '邮件', '短信', '备注'] as const).map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="text-xs text-gray-500 shrink-0 mt-1">内容</span>
                    <Textarea className="flex-1 text-xs min-h-[56px] resize-none" placeholder="请输入跟进内容..."
                      value={followUpContent} onChange={(e) => setFollowUpContent(e.target.value)} />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-gray-500 shrink-0">下次联系</span>
                    <Input type="datetime-local" className="flex-1 text-xs h-7"
                      value={followUpNext} onChange={(e) => setFollowUpNext(e.target.value)} />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setFollowUpContent(''); setFollowUpNext(''); }}>取消</Button>
                    <Button size="sm" className="bg-blue-600 text-xs h-7" onClick={() => saveFollowUp(activeLead.leadId)}>保存跟进</Button>
                  </div>
                </div>
              </div>

              {/* ── CRM 同步 ── */}
              <div className="border-t border-gray-100" />
              <div className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">TwentyCRM 同步</p>
                  <Badge className={`text-xs mt-1 ${CRM_SYNC[activeLead.crmSyncStatus].cls}`}>{CRM_SYNC[activeLead.crmSyncStatus].label}</Badge>
                  {activeLead.crmRef && <p className="text-xs text-gray-400 mt-0.5">ref: {activeLead.crmRef}</p>}
                </div>
                {activeLead.crmSyncStatus !== 'synced' && (
                  <Button size="sm" className="bg-blue-600 text-xs" onClick={() => handleSyncToCRM([activeLead.leadId])}>立即同步</Button>
                )}
              </div>

              <DialogFooter>
                {activeLead.status !== 'converted' && (
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => { handleConvertToCustomer(activeLead.leadId); setDetailOpen(false); }}>转为客户</Button>
                )}
              </DialogFooter>
            </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── AI 总结弹窗（来源会话）── */}
      {activeLead?.sessionAiSummary && (
        <Dialog open={sessionSummaryOpen} onOpenChange={setSessionSummaryOpen}>
          <DialogContent className="max-w-xl max-h-[88vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <span>💡 AI 总结</span>
                <span className="text-sm font-normal text-gray-500">· {activeLead.customerName}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="flex items-center gap-3 -mt-1">
              <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                onClick={() => alert('已触发 AI 重新总结，稍后刷新查看')}>
                AI 重新总结
              </Button>
              <span className="text-xs text-gray-400">更新于：{activeLead.sessionAiSummary.updatedAt}</span>
            </div>

            {/* 整体总结 + 线索信息提取 */}
            <div className="bg-blue-50/60 rounded-lg p-3 space-y-3">
              <p className="text-xs font-semibold text-gray-700">整体总结</p>
              <p className="text-sm text-gray-700 leading-relaxed">{activeLead.sessionAiSummary.overall}</p>
              <div className="bg-white border border-blue-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">线索信息提取</p>
                <div className="space-y-1.5">
                  {[
                    { label: '联系人姓名', value: activeLead.sessionAiSummary.leadInfo.contactName },
                    { label: '手机', value: activeLead.sessionAiSummary.leadInfo.phone },
                    { label: '邮箱', value: activeLead.sessionAiSummary.leadInfo.email },
                    { label: '访客公司名称', value: activeLead.sessionAiSummary.leadInfo.company },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex text-xs">
                      <span className="w-24 text-gray-400 shrink-0">{label}</span>
                      <span className="text-gray-800 font-medium">{value || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 时间轴总结 */}
            <div className="bg-blue-50/40 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-700 mb-3">时间轴总结</p>
              {activeLead.sessionAiSummary.timeline.length === 0 ? (
                <p className="text-sm text-gray-400">暂无</p>
              ) : (
                <div className="border-l-2 border-blue-200 ml-1 pl-4 space-y-3">
                  {activeLead.sessionAiSummary.timeline.map((t, i) => (
                    <div key={i} className="relative">
                      <span className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-blue-500" />
                      <p className="text-[11px] text-gray-400">{t.date}</p>
                      <p className="text-sm text-gray-700">{t.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button variant="outline" size="sm" onClick={() => setSessionSummaryOpen(false)}>关闭</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 手动合并弹窗 */}
      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>合并到同一客户</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-sm text-gray-600">选择主记录，其余线索的留资/会话历史将回溯挂到主客户名下（统一 unified_id）。</p>
            <div className="space-y-2">
              {selectedLeads.map((l, i) => (
                <label key={l.leadId} className="flex items-center gap-2 border rounded p-2 cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="primary" defaultChecked={i === 0} />
                  <div className="flex-1">
                    <span className="text-sm">{l.customerName} <span className="font-mono text-xs text-gray-400">{l.visitorId}</span></span>
                    <div className="text-xs text-gray-400">{l.email ?? l.phone ?? '—'} · {l.ip} · {l.submittedAt}</div>
                  </div>
                  {i === 0 && <Badge className="text-[10px] bg-blue-50 text-blue-600">主记录</Badge>}
                </label>
              ))}
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-700">⚠️ 合并不可自动撤销，请确认确为同一人。同 IP 不等于同一人。</div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setMergeOpen(false)}>取消</Button>
              <Button size="sm" className="bg-blue-600" onClick={() => { handleMergeLeads(selectedIds[0], selectedIds.slice(1)); setMergeOpen(false); setSelectedIds([]); }}>确认合并</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 线索字段设置（与 N3 渐进式留资可配置表单同源）*/}
      <Dialog open={fieldsOpen} onOpenChange={setFieldsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>线索字段设置</DialogTitle></DialogHeader>
          <p className="text-xs text-gray-500">配置留资表单收集的字段与必填规则；与 N3「意向收集」技能的<strong>渐进式留资可配置表单同源</strong>。</p>
          <Table>
            <TableHeader>
              <TableRow><TableHead>字段</TableHead><TableHead className="text-center">启用</TableHead><TableHead className="text-center">必填</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((f, idx) => (
                <TableRow key={f.key}>
                  <TableCell className="text-sm">{f.label}{f.system && <Badge className="text-[10px] bg-gray-100 text-gray-500 ml-1">系统</Badge>}</TableCell>
                  <TableCell className="text-center">
                    <Switch checked={f.enabled} disabled={f.system}
                      onCheckedChange={(v) => setFields(fields.map((x, i) => i === idx ? { ...x, enabled: v } : x))} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={f.required} disabled={!f.enabled}
                      onCheckedChange={(v) => setFields(fields.map((x, i) => i === idx ? { ...x, required: v } : x))} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setFieldsOpen(false)}>取消</Button>
            <Button size="sm" className="bg-blue-600" onClick={() => { handleSaveLeadFields(fields); setFieldsOpen(false); }}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
