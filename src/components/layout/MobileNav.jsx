import { Link } from 'react-router-dom'

export default function MobileNav({ activePath }) {
    const navItems = [
        { path: '/', icon: 'task_alt', label: 'タスク' },
        {
            path: '/html-generator',
            icon: 'auto_fix_high',
            label: 'ツール',
            activePaths: ['/html-generator', '/badge-tool', '/url-generator']
        },
        { path: '/settings', icon: 'settings', label: '設定' },
    ]

    const isActive = (item) => {
        if (item.activePaths) {
            return item.activePaths.includes(activePath)
        }
        return activePath === item.path
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white/95 backdrop-blur-md border-t border-[#dbe4e6] flex justify-around items-center py-2 px-6 z-40">
            {navItems.map((item) => (
                <Link
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center gap-1 ${isActive(item) ? 'text-primary' : 'text-gray-400'
                        }`}
                >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span className="text-[10px] font-bold">{item.label}</span>
                </Link>
            ))}
        </nav>
    )
}
