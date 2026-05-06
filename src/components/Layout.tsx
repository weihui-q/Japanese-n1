import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { path: '/', label: 'ホーム', icon: '🏠' },
    { path: '/words', label: '単語', icon: '📚' },
    { path: '/grammar', label: '文法', icon: '📝' },
    { path: '/flashcard', label: 'フラッシュカード', icon: '🎴' },
    { path: '/quiz', label: 'テスト', icon: '✅' },
    { path: '/favorites', label: 'お気に入り', icon: '⭐' },
    { path: '/progress', label: '進捗', icon: '📈' },
    { path: '/import', label: 'インポート', icon: '⬇️' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-white">
      {/* 左侧边栏 */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white/10 backdrop-blur-md border-r border-white/20 transition-all duration-300 z-50 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo和折叠按钮 */}
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center justify-between gap-2">
            {!isCollapsed && (
              <Link to="/" className="text-white text-xl font-bold">
                JLPT N1
              </Link>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-all ml-auto"
            >
              {isCollapsed ? '→' : '←'}
            </button>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                location.pathname === item.path
                  ? 'bg-white/20 text-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
              {isCollapsed && (
                <div className="absolute left-20 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* 主内容区域 */}
      <main
        className={`flex-1 transition-all duration-300 flex flex-col overflow-hidden ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
        style={{ height: '100vh' }}
      >
        {/* 顶部栏 */}
        <header className="bg-white/10 backdrop-blur-md border-b border-white/20 flex-shrink-0">
          <div className="px-6 py-4">
            <h1 className="text-white text-2xl font-bold">
              {navItems.find(item => item.path === location.pathname)?.label || 'JLPT N1 学習アプリ'}
            </h1>
          </div>
        </header>

        {/* 页面内容 - 默认隐藏滚动条 */}
        <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
          {children}
        </div>
      </main>
    </div>
  );
}
