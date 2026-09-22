import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import VisitorInsightsPage from './pages/N1-VisitorInsightsPage'
import AgentDeskPage from './pages/N2-AgentDeskPage'
import AgentConfigPage from './pages/N3-AgentConfigPage'
import KnowledgeConfigLayout from './pages/knowledge-config/KnowledgeConfigLayout'
import OverviewPage from './pages/knowledge-config/OverviewPage'
import SectionsPage from './pages/knowledge-config/SectionsPage'
import SectionDetailPage from './pages/knowledge-config/SectionDetailPage'
import CatalogPage from './pages/knowledge-config/CatalogPage'
import KnowledgeCreatePage from './pages/knowledge-config/KnowledgeCreatePage'
import AssetDetailPage from './pages/knowledge-config/AssetDetailPage'
import MetadataPage from './pages/knowledge-config/MetadataPage'
import RetrievalPage from './pages/knowledge-config/RetrievalPage'
import SyncPage from './pages/knowledge-config/SyncPage'
import QualityPage from './pages/knowledge-config/QualityPage'
import Customer360Page from './pages/N6-Customer360Page'
import LeadPoolPage from './pages/N7-LeadPoolPage'
import TicketWorkbenchPage from './pages/N8-TicketWorkbenchPage'
import SatisfactionPage from './pages/N9-SatisfactionPage'
import ConversionDashboardPage from './pages/N10-ConversionDashboardPage'
import RoutingRulesPage from './pages/N11-RoutingRulesPage'
import PlatformDashboardPage from './pages/N12-PlatformDashboardPage'
import IndustryKnowledgePlatformPage from './pages/N14-IndustryKnowledgePlatformPage'
import AgentObservabilityPage from './pages/agent-observability/AgentObservabilityPage'
import TenantObservabilityPage from './pages/agent-observability/TenantObservabilityPage'
import AgentObservabilityDetailPage from './pages/agent-observability/AgentObservabilityDetailPage'
import AgentObservabilitySessionDetailPage from './pages/agent-observability/AgentObservabilitySessionDetailPage'
import AgentObservabilityTraceDetailPage from './pages/agent-observability/AgentObservabilityTraceDetailPage'
import ToolQualityCenterPage from './pages/agent-observability/ToolQualityCenterPage'
import ToolObservabilityDetailPage from './pages/agent-observability/ToolObservabilityDetailPage'
import QualityReviewPage from './pages/agent-observability/QualityReviewPage'
import AlertGovernancePage from './pages/agent-observability/AlertGovernancePage'

// 导航分组：客户漏斗（线索管理→客户管理）按业务模块分组，其余按链路环节分组
const navGroups: { stage: string; items: { path: string; label: string; emoji: string }[] }[] = [
  {
    stage: '线索管理（访客 · 线索）',
    items: [
      { path: '/visitors', label: 'N1 访客洞察', emoji: '👁️' },
      { path: '/leads', label: 'N7 线索池', emoji: '🎯' },
    ],
  },
  {
    stage: '客户管理',
    items: [
      { path: '/customers', label: 'N6 客户管理', emoji: '👤' },
    ],
  },
  {
    stage: '②③ 主动对话 · 交互留资',
    items: [
      { path: '/agent', label: 'N3 智能体配置', emoji: '🤖' },
      { path: '/knowledge-config', label: '知识库配置（全门户）', emoji: '🗂️' },
    ],
  },
  {
    stage: '⑤ 转人工 · 路由',
    items: [
      { path: '/desk', label: 'N2 对话工作台', emoji: '🎧' },
      { path: '/routing', label: 'N11 接待规则与路由', emoji: '🔀' },
    ],
  },
  {
    stage: '⑥⑦ 工单 · 满意度',
    items: [
      { path: '/tickets', label: 'N8 工单工作台', emoji: '🎫' },
      { path: '/satisfaction', label: 'N9 满意度中心', emoji: '⭐' },
    ],
  },
  {
    stage: '评估',
    items: [{ path: '/analytics', label: 'N10 转化看板', emoji: '📊' }],
  },
  {
    stage: '产品后台（内部）',
    items: [
      { path: '/platform', label: 'N12 平台运营看板', emoji: '🎛️' },
      { path: '/platform/agent-observability', label: 'N13 智能体运营', emoji: '🔎' },
      { path: '/platform/industry-knowledge', label: 'N14 行业知识运营', emoji: '📚' },
    ],
  },
]

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-gray-100">
        {/* ── 左侧导航 ── */}
        <nav className="w-56 bg-gray-900 text-white flex flex-col shrink-0">
          {/* Logo区 */}
          <div className="px-4 py-5 border-b border-gray-700">
            <div className="text-base font-bold text-white tracking-tight">console-crm</div>
            <div className="text-xs text-blue-400 mt-0.5">中台原型 · v1.0 · 全链路</div>
          </div>

          {/* 导航项（按链路环节分组） */}
          <div className="flex-1 py-2 overflow-y-auto">
            {navGroups.map((group) => (
              <div key={group.stage} className="mb-1">
                <div className="px-4 py-1.5 text-[11px] text-gray-500 uppercase tracking-wider">{group.stage}</div>
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/platform'}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-4 py-2 text-sm transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`
                    }
                  >
                    <span className="text-base leading-none">{item.emoji}</span>
                    <span className="font-medium leading-tight">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </div>

          {/* 底部信息 */}
          <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-500 space-y-1">
            <div>AgentScope: <span className="text-yellow-400">172.25.171.180:8000</span></div>
            <div>TwentyCRM: <span className="text-yellow-400">172.25.171.180:8006</span></div>
          </div>
        </nav>

        {/* ── 主内容区 ── */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/visitors" replace />} />
            <Route path="/visitors" element={<VisitorInsightsPage />} />
            <Route path="/agent" element={<AgentConfigPage />} />
            <Route path="/knowledge-config" element={<KnowledgeConfigLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="sections" element={<SectionsPage />} />
              <Route path="sections/:sectionKey" element={<SectionDetailPage />} />
              <Route path="catalog" element={<CatalogPage />} />
              <Route path="catalog/new" element={<KnowledgeCreatePage />} />
              <Route path="catalog/:assetId" element={<AssetDetailPage />} />
              <Route path="metadata" element={<MetadataPage />} />
              <Route path="retrieval" element={<RetrievalPage />} />
              <Route path="sync" element={<SyncPage />} />
              <Route path="quality" element={<QualityPage />} />
            </Route>
            <Route path="/customers" element={<Customer360Page />} />
            <Route path="/customers/:unified_id" element={<Customer360Page />} />
            <Route path="/leads" element={<LeadPoolPage />} />
            <Route path="/desk" element={<AgentDeskPage />} />
            <Route path="/routing" element={<RoutingRulesPage />} />
            <Route path="/tickets" element={<TicketWorkbenchPage />} />
            <Route path="/satisfaction" element={<SatisfactionPage />} />
            <Route path="/analytics" element={<ConversionDashboardPage />} />
            <Route path="/agent-observability" element={<Navigate to="/platform/agent-observability" replace />} />
            <Route path="/platform/agent-observability" element={<AgentObservabilityPage />} />
            <Route path="/platform/agent-observability/:agentId" element={<Navigate to="/platform/agent-observability" replace />} />
            <Route path="/platform/agent-observability/tools" element={<ToolQualityCenterPage />} />
            <Route path="/platform/agent-observability/tools/:toolType" element={<ToolObservabilityDetailPage />} />
            <Route path="/platform/agent-observability/tenants/:tenantId" element={<TenantObservabilityPage />} />
            <Route path="/platform/agent-observability/tenants/:tenantId/agents/:agentId" element={<AgentObservabilityDetailPage />} />
            <Route path="/platform/agent-observability/tenants/:tenantId/agents/:agentId/sessions/:sessionId" element={<AgentObservabilitySessionDetailPage />} />
            <Route path="/platform/agent-observability/tenants/:tenantId/agents/:agentId/sessions/:sessionId/traces/:traceId" element={<AgentObservabilityTraceDetailPage />} />
            <Route path="/platform/agent-observability/tenants/:tenantId/agents/:agentId/quality-reviews" element={<QualityReviewPage />} />
            <Route path="/platform/agent-observability/tenants/:tenantId/agents/:agentId/alerts" element={<AlertGovernancePage />} />
            <Route path="/platform" element={<PlatformDashboardPage />} />
            <Route path="/platform/industry-knowledge" element={<IndustryKnowledgePlatformPage />} />
            <Route path="/platform/industry-knowledge/new" element={<KnowledgeCreatePage />} />
            <Route path="/platform/industry-knowledge/:assetId" element={<AssetDetailPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
