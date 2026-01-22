import { createContext, useContext, useState, useCallback } from 'react'
import { sheets, chatwork, initializeServices } from '../services'

const ProjectContext = createContext(null)

const initialTasks = [
    {
        id: 1,
        tag: '広告',
        title: 'お買い物マラソン用バナー入稿',
        date: '10/24',
        user: '佐藤 健太',
        tagColor: 'blue',
        hasChatwork: false
    },
    {
        id: 2,
        tag: '施策',
        title: 'レビューキャンペーンLP修正',
        date: '10/28',
        user: '田中 舞',
        tagColor: 'emerald',
        hasChatwork: true
    },
    {
        id: 3,
        tag: '広告',
        title: 'RPP広告 キーワード単価調整',
        date: '11/02',
        user: '鈴木 一郎',
        tagColor: 'blue',
        hasChatwork: false
    },
    {
        id: 4,
        tag: '施策',
        title: '冬ギフト特集 ページ構成案作成',
        date: '11/05',
        user: '佐藤 健太',
        tagColor: 'emerald',
        hasChatwork: true
    }
]

const projects = [
    { id: 1, name: '広告運用' },
    { id: 2, name: '施策管理' },
    { id: 3, name: '在庫調整' }
]

export function ProjectProvider({ children }) {
    const [tasks, setTasks] = useState(initialTasks)
    const [isLoading, setIsLoading] = useState(false)
    const [lastSyncTime, setLastSyncTime] = useState(null)
    const [syncError, setSyncError] = useState(null)

    // Initialize services on mount
    useState(() => {
        initializeServices()
    }, [])

    // Add a new task
    const addTask = useCallback((task) => {
        const newTask = {
            ...task,
            id: Date.now(),
        }
        setTasks(prev => [...prev, newTask])

        // Optionally notify via Chatwork
        if (chatwork.isConfigured() && task.notifyChatwork) {
            chatwork.sendMessage(
                undefined, // use configured room
                `[info][title]新規タスク[/title]${task.title}\n担当: ${task.user}\n期限: ${task.date}[/info]`
            ).catch(console.error)
        }

        return newTask
    }, [])

    // Delete a task
    const deleteTask = useCallback((id) => {
        setTasks(prev => prev.filter(task => task.id !== id))
    }, [])

    // Update a task
    const updateTask = useCallback((id, updates) => {
        setTasks(prev => prev.map(task =>
            task.id === id ? { ...task, ...updates } : task
        ))
    }, [])

    // Sync tasks from Google Sheets
    const syncFromSheets = useCallback(async (sheetName = 'タスク') => {
        if (!sheets.isConfigured()) {
            setSyncError('Google Sheetsが設定されていません')
            return { success: false, error: 'Not configured' }
        }

        setIsLoading(true)
        setSyncError(null)

        try {
            const sheetTasks = await sheets.getTasks(sheetName)

            // Map sheet data to task format
            // Expected columns: タイトル, カテゴリ, 担当者, 期限, ステータス
            const mappedTasks = sheetTasks.map((row, index) => ({
                id: `sheet_${index}_${Date.now()}`,
                title: row['タイトル'] || row['タスク名'] || 'No title',
                tag: row['カテゴリ'] || row['種類'] || '施策',
                user: row['担当者'] || '未割当',
                date: row['期限'] || '',
                tagColor: (row['カテゴリ'] || row['種類'] || '').includes('広告') ? 'blue' : 'emerald',
                hasChatwork: false,
                fromSheet: true
            }))

            // Merge with existing tasks (keep local tasks, add new from sheet)
            setTasks(prev => {
                const localTasks = prev.filter(t => !t.fromSheet)
                return [...localTasks, ...mappedTasks]
            })

            setLastSyncTime(new Date())
            return { success: true, count: mappedTasks.length }
        } catch (error) {
            console.error('Sheets sync error:', error)
            setSyncError(error.message)
            return { success: false, error: error.message }
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Sync tasks from Chatwork
    const syncFromChatwork = useCallback(async () => {
        if (!chatwork.isConfigured()) {
            setSyncError('Chatworkが設定されていません')
            return { success: false, error: 'Not configured' }
        }

        setIsLoading(true)
        setSyncError(null)

        try {
            const cwTasks = await chatwork.getTasks()

            // Map Chatwork tasks to our format
            const mappedTasks = cwTasks.map((task, index) => ({
                id: `cw_${task.task_id}`,
                title: task.body.split('\n')[0].slice(0, 50), // First line, max 50 chars
                tag: '施策', // Default category
                user: task.account?.name || '未割当',
                date: task.limit_time
                    ? new Date(task.limit_time * 1000).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
                    : '',
                tagColor: 'emerald',
                hasChatwork: true,
                chatworkTaskId: task.task_id,
                status: task.status // 'open' or 'done'
            }))

            // Merge with existing tasks
            setTasks(prev => {
                const nonCwTasks = prev.filter(t => !t.chatworkTaskId)
                return [...nonCwTasks, ...mappedTasks.filter(t => t.status === 'open')]
            })

            setLastSyncTime(new Date())
            return { success: true, count: mappedTasks.length }
        } catch (error) {
            console.error('Chatwork sync error:', error)
            setSyncError(error.message)
            return { success: false, error: error.message }
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Send notification to Chatwork
    const notifyChatwork = useCallback(async (message) => {
        if (!chatwork.isConfigured()) {
            return { success: false, error: 'Chatwork not configured' }
        }

        try {
            await chatwork.sendMessage(undefined, message)
            return { success: true }
        } catch (error) {
            console.error('Chatwork notification error:', error)
            return { success: false, error: error.message }
        }
    }, [])

    const value = {
        // Data
        tasks,
        projects,
        isLoading,
        lastSyncTime,
        syncError,

        // Task operations
        addTask,
        deleteTask,
        updateTask,

        // Sync operations
        syncFromSheets,
        syncFromChatwork,
        notifyChatwork,

        // Service status
        isSheetsConfigured: sheets.isConfigured(),
        isChatworkConfigured: chatwork.isConfigured()
    }

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    )
}

export function useProject() {
    const context = useContext(ProjectContext)
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider')
    }
    return context
}
