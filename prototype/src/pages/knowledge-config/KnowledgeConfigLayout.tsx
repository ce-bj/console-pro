// 知识库配置模块外壳：顶部标题 + 二级左侧栏导航 + <Outlet/>
import { NavLink, Outlet } from 'react-router-dom';
import { KB_TOTALS } from './data';

// 二级导航分组（每个栏目独立路由 + tsx 文件）
const subNav: { group: string; items: { to: string; label: string; emoji: string; end?: boolean }[] }[] = [
  {
    group: '总览',
    items: [{ to: '', label: '概览', emoji: '📊', end: true }],
  },
  {
    group: '知识内容',
    items: [
      { to: 'sections', label: '知识板块', emoji: '🧩' },
      { to: 'catalog', label: '知识资产目录', emoji: '🗂️' },
      { to: 'metadata', label: '知识库配置', emoji: '🏷️' },
    ],
  },
  {
    group: '数据接入',
    items: [
      { to: 'sync', label: '同步状态', emoji: '🔄' },
    ],
  },
  {
    group: '检索与运营',
    items: [
      { to: 'retrieval', label: '问答测试', emoji: '🔍' },
      { to: 'quality', label: '对话质量运营', emoji: '✅' },
    ],
  },
];

export default function KnowledgeConfigLayout() {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 模块标题条 */}
      <div className="px-6 pt-5 pb-3 border-b bg-white">
        <h1 className="text-xl font-semibold text-gray-900">知识库配置</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          管理网站知识库：组织与录入知识、选择网站内容入库、测试问答效果、分析调用质量
        </p>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* 二级左侧栏 */}
        <nav className="w-44 shrink-0 border-r bg-white overflow-y-auto py-3">
          {subNav.map((g) => (
            <div key={g.group} className="mb-2">
              <div className="px-4 py-1 text-[11px] text-gray-400 uppercase tracking-wider">{g.group}</div>
              {g.items.map((it) => (
                <NavLink
                  key={it.to || 'index'}
                  to={it.to}
                  end={it.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <span className="text-base leading-none">{it.emoji}</span>
                  <span className="leading-tight">{it.label}</span>
                </NavLink>
              ))}
            </div>
          ))}

          {/* 底部统计 */}
          <div className="px-4 pt-3 mt-2 border-t text-xs text-gray-400 space-y-1">
            <div>知识资产 <span className="text-gray-700 font-medium">{KB_TOTALS.totalDocs}</span></div>
            <div>平均健康度 <span className="text-blue-600 font-medium">{KB_TOTALS.avgHealth}</span></div>
          </div>
        </nav>

        {/* 栏目内容 */}
        <main className="flex-1 min-w-0 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
