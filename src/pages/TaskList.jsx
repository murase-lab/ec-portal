import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import TaskCard from '../components/ui/TaskCard'
import FilterChip from '../components/ui/FilterChip'
import { useProject } from '../contexts/ProjectContext'

export default function TaskList() {
    const navigate = useNavigate()
    const {
        tasks,
        deleteTask,
        isLoading,
        lastSyncTime,
        syncError,
        syncFromSheets,
        syncFromChatwork,
        isSheetsConfigured,
        isChatworkConfigured
    } = useProject()
    const [filter, setFilter] = useState('all')
    const [showSyncMenu, setShowSyncMenu] = useState(false)

    const filteredTasks = filter === 'all'
        ? tasks
        : tasks.filter(t => t.tag === (filter === 'ad' ? '広告' : '施策'))

    const counts = {
        all: tasks.length,
        ad: tasks.filter(t => t.tag === '広告').length,
        campaign: tasks.filter(t => t.tag === '施策').length
    }

    const handleSync = async (source) => {
        setShowSyncMenu(false)
        if (source === 'sheets') {
            const result = await syncFromSheets()
            if (result.success) {
                alert(`スプレッドシートから ${result.count} 件のタスクを同期しました`)
            } else {
                alert(`同期エラー: ${result.error}`)
            }
        } else if (source === 'chatwork') {
            const result = await syncFromChatwork()
            if (result.success) {
                alert(`Chatworkから ${result.count} 件のタスクを同期しました`)
            } else {
                alert(`同期エラー: ${result.error}`)
            }
        }
    }

    return (
        <MainLayout title="タスク管理">
            <div className="px-6 pt-8 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-[#111718]">タスク管理</h2>
                    <p className="text-gray-500 mt-1 text-sm">プロジェクト進行状況の確認</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Sync Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSyncMenu(!showSyncMenu)}
                            disabled={isLoading}
                            className={`bg-white border border-gray-200 text-gray-600 p-2 rounded-full shadow hover:bg-gray-50 transition-colors ${isLoading ? 'animate-spin' : ''}`}
                            title="外部サービスと同期"
                        >
                            <span className="material-symbols-outlined">sync</span>
                        </button>

                        {/* Sync Dropdown Menu */}
                        {showSyncMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                                <button
                                    onClick={() => handleSync('sheets')}
                                    disabled={!isSheetsConfigured}
                                    className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-gray-50 ${!isSheetsConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="material-symbols-outlined text-green-600">table_chart</span>
                                    <div>
                                        <p className="font-medium">スプレッドシートから同期</p>
                                        <p className="text-xs text-gray-400">
                                            {isSheetsConfigured ? 'タスクシートを読み込み' : '設定が必要です'}
                                        </p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleSync('chatwork')}
                                    disabled={!isChatworkConfigured}
                                    className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-gray-50 ${!isChatworkConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="material-symbols-outlined text-blue-600">chat</span>
                                    <div>
                                        <p className="font-medium">Chatworkから同期</p>
                                        <p className="text-xs text-gray-400">
                                            {isChatworkConfigured ? 'タスクを読み込み' : '設定が必要です'}
                                        </p>
                                    </div>
                                </button>
                                <hr className="my-2" />
                                <button
                                    onClick={() => { setShowSyncMenu(false); navigate('/settings') }}
                                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 text-gray-500 hover:bg-gray-50"
                                >
                                    <span className="material-symbols-outlined text-sm">settings</span>
                                    連携設定を開く
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Add Task Button */}
                    <button
                        onClick={() => navigate('/task-create')}
                        className="bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                    >
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </div>
            </div>

            {/* Last Sync Info */}
            {lastSyncTime && (
                <div className="px-6 mt-2">
                    <p className="text-xs text-gray-400">
                        最終同期: {lastSyncTime.toLocaleString('ja-JP')}
                    </p>
                </div>
            )}

            {/* Sync Error */}
            {syncError && (
                <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">error</span>
                        {syncError}
                    </p>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-3 px-6 py-6 overflow-x-auto no-scrollbar">
                <FilterChip label="すべて" count={counts.all} isActive={filter === 'all'} onClick={() => setFilter('all')} />
                <FilterChip label="広告" count={counts.ad} isActive={filter === 'ad'} onClick={() => setFilter('ad')} />
                <FilterChip label="施策" count={counts.campaign} isActive={filter === 'campaign'} onClick={() => setFilter('campaign')} />
            </div>

            {/* Loading Indicator */}
            {isLoading && (
                <div className="px-6 py-4 text-center">
                    <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                    <p className="text-sm text-gray-500 mt-1">同期中...</p>
                </div>
            )}

            {/* Task List */}
            <section className="px-4 space-y-4">
                {filteredTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onDelete={deleteTask} />
                ))}
                {filteredTasks.length === 0 && !isLoading && (
                    <div className="text-center py-12 text-gray-400">
                        <span className="material-symbols-outlined text-4xl mb-2">task</span>
                        <p>タスクがありません</p>
                    </div>
                )}
            </section>

            {/* External Tool Integration Banner */}
            {(!isSheetsConfigured || !isChatworkConfigured) && (
                <div
                    className="mx-4 mt-8 p-5 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-4 cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => navigate('/settings')}
                >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                        <span className="material-symbols-outlined text-blue-600">hub</span>
                    </div>
                    <div>
                        <h5 className="text-sm font-bold text-blue-900 leading-tight">外部ツール連携</h5>
                        <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                            {!isChatworkConfigured && !isSheetsConfigured
                                ? 'ChatworkとスプレッドシートのAPIを設定して、タスクを同期できます。'
                                : !isChatworkConfigured
                                    ? 'Chatwork APIを設定して通知機能を有効にできます。'
                                    : 'スプレッドシートAPIを設定してタスクを同期できます。'
                            }
                        </p>
                    </div>
                    <span className="material-symbols-outlined text-blue-400 ml-auto">arrow_forward</span>
                </div>
            )}
        </MainLayout>
    )
}
