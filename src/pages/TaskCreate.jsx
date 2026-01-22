import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProject } from '../contexts/ProjectContext'

export default function TaskCreate() {
    const navigate = useNavigate()
    const { projects, addTask } = useProject()

    const [formData, setFormData] = useState({
        project: '広告運用',
        title: '',
        description: '',
        user: '田中',
        date: ''
    })

    const handleSubmit = (e) => {
        e.preventDefault()

        if (!formData.title.trim()) {
            alert('タスク名を入力してください')
            return
        }

        // Determine tag based on project
        const tag = formData.project === '広告運用' ? '広告' : '施策'
        const tagColor = tag === '広告' ? 'blue' : 'emerald'

        // Format date
        const dateStr = formData.date
            ? new Date(formData.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }).replace('/', '/')
            : new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }).replace('/', '/')

        addTask({
            tag,
            tagColor,
            title: formData.title,
            date: dateStr,
            user: formData.user,
            hasChatwork: Math.random() > 0.5, // Random for demo purposes
        })

        navigate('/')
    }

    return (
        <div className="min-h-screen bg-background-light font-public pb-32">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center bg-white/80 backdrop-blur-md px-4 py-4 justify-between border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-[#1b0e0e] flex size-10 items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
                    >
                        <span className="material-symbols-outlined">arrow_back_ios_new</span>
                    </button>
                    <h2 className="text-[#1b0e0e] text-xl font-bold">新規タスク作成</h2>
                </div>
                <div className="size-10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-gray-400">more_vert</span>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="max-w-[600px] mx-auto w-full p-4 space-y-6">
                {/* Project Select */}
                <div className="space-y-2">
                    <label className="flex flex-col w-full">
                        <p className="text-[#1b0e0e] text-sm font-semibold px-1 pb-1">プロジェクト名</p>
                        <select
                            value={formData.project}
                            onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                            className="form-select rounded-full border border-gray-300 h-14 px-5 text-base"
                        >
                            {projects.map((p) => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                    </label>
                </div>

                {/* Task Name */}
                <div className="space-y-2">
                    <label className="flex flex-col w-full">
                        <p className="text-[#1b0e0e] text-sm font-semibold px-1 pb-1">タスク名</p>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="form-input rounded-full border border-gray-300 h-14 px-5"
                            placeholder="例：スーパーSALE用バナー入稿"
                        />
                    </label>
                </div>

                {/* Task Description */}
                <div className="space-y-2">
                    <label className="flex flex-col w-full">
                        <p className="text-[#1b0e0e] text-sm font-semibold px-1 pb-1">タスク詳細</p>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="form-textarea rounded-xl border border-gray-300 min-h-32 p-5"
                            placeholder="具体的な指示を入力してください"
                        />
                    </label>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                    <label className="flex flex-col w-full">
                        <p className="text-[#1b0e0e] text-sm font-semibold px-1 pb-1">期限</p>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="form-input rounded-full border border-gray-300 h-14 px-5"
                        />
                    </label>
                </div>

                {/* Assignee */}
                <div className="space-y-3">
                    <h3 className="text-[#1b0e0e] text-sm font-semibold px-1">担当者</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {['田中', '佐藤', '鈴木'].map((name) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => setFormData({ ...formData, user: name })}
                                className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
                            >
                                <div className={`relative size-14 rounded-full border-2 ${formData.user === name ? 'border-rakuten-red' : 'border-gray-200'} p-0.5`}>
                                    <div className="size-full rounded-full bg-gray-200 flex items-center justify-center font-bold">
                                        {name[0]}
                                    </div>
                                    {formData.user === name && (
                                        <div className="absolute -bottom-1 -right-1 bg-rakuten-red text-white rounded-full size-5 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                                        </div>
                                    )}
                                </div>
                                <span className={`text-xs font-medium ${formData.user === name ? 'text-rakuten-red' : 'text-gray-600'}`}>
                                    {name}
                                </span>
                            </button>
                        ))}
                        <div className="size-14 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0">
                            <span className="material-symbols-outlined">person_add</span>
                        </div>
                    </div>
                </div>
            </form>

            {/* Fixed Footer Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 border-t border-gray-200 z-20">
                <button
                    onClick={handleSubmit}
                    className="w-full max-w-[568px] mx-auto block bg-primary text-white font-bold h-14 rounded-full shadow-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                >
                    <span className="material-symbols-outlined">rocket_launch</span>
                    タスクを作成する
                </button>
            </div>
        </div>
    )
}
