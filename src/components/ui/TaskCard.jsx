export default function TaskCard({ task, onDelete }) {
    const tagColorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    }

    return (
        <div className="bg-white rounded-xl border border-[#dbe4e6] shadow-sm p-4">
            <div className="flex justify-between items-start mb-3">
                <span className={`px-2 py-1 ${tagColorClasses[task.tagColor] || 'bg-gray-50 text-gray-600'} text-[10px] font-bold rounded uppercase tracking-wider`}>
                    {task.tag}
                </span>
                <div className="flex items-center gap-2">
                    {task.hasChatwork && (
                        <div className="flex items-center gap-0.5 bg-blue-50 px-1.5 py-0.5 rounded">
                            <span className="material-symbols-outlined text-blue-500 text-[12px]" style={{ fontVariationSettings: '"FILL" 1' }}>chat</span>
                            <span className="text-[9px] text-blue-500 font-bold">CW</span>
                        </div>
                    )}
                    {!task.hasChatwork && (
                        <span className="material-symbols-outlined text-gray-300 text-sm">sync</span>
                    )}
                    <button
                        onClick={() => onDelete(task.id)}
                        className="material-symbols-outlined text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                        delete
                    </button>
                </div>
            </div>
            <h4 className="text-base font-bold text-[#111718] mb-4">{task.title}</h4>
            <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden border border-white shrink-0">
                        <div className="bg-gray-300 w-full h-full flex items-center justify-center text-[10px] font-bold">
                            {task.user[0]}
                        </div>
                    </div>
                    <span className="text-xs text-gray-600 font-medium">{task.user}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-1 rounded">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    <span className="text-[11px] font-bold">{task.date}</span>
                </div>
            </div>
        </div>
    )
}
