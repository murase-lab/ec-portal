import { Link } from 'react-router-dom'

export default function Sidebar({ activePath }) {
    const menuItems = [
        { path: '/', icon: 'grid_view', label: 'タスク管理' },
        { path: '/html-generator', icon: 'html', label: 'HTML生成' },
        { path: '/badge-tool', icon: 'image', label: '画像バッジ加工' },
        { path: '/url-generator', icon: 'link', label: 'URL生成' },
    ]

    return (
        <aside className="fixed inset-y-0 left-0 z-50 w-72 glass-sidebar transform -translate-x-full transition-transform duration-300 lg:translate-x-0">
            <div className="flex flex-col h-full p-6 text-white">
                {/* Logo */}
                <div className="mb-10 flex items-center gap-2 px-2">
                    <div className="w-8 h-8 bg-rakuten-red rounded flex items-center justify-center font-bold text-white text-xl">
                        R
                    </div>
                    <span className="text-xl font-bold tracking-tight">EC管理ポータル</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1">
                    <ul className="space-y-2">
                        {menuItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${activePath === item.path
                                            ? 'bg-primary text-white'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <span className="material-symbols-outlined">{item.icon}</span>
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Footer - User Info */}
                <div className="mt-auto pt-6 border-t border-white/10">
                    <Link
                        to="/settings"
                        className={`flex items-center gap-3 px-2 py-3 rounded-xl transition-colors ${activePath === '/settings' ? 'text-white' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">株式会社サンプル商事</p>
                            <p className="text-xs">ID: 123456</p>
                        </div>
                        <span className="material-symbols-outlined">settings</span>
                    </Link>
                </div>
            </div>
        </aside>
    )
}
