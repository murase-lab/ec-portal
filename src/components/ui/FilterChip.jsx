export default function FilterChip({ label, count, isActive, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex-shrink-0 bg-white px-4 py-2 rounded-full border border-[#dbe4e6] text-sm font-medium flex items-center gap-2 transition-colors ${isActive ? 'text-primary' : 'text-gray-600 hover:text-primary'
                }`}
        >
            <span>{label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-primary/10' : 'bg-gray-100'}`}>
                {count}
            </span>
        </button>
    )
}
