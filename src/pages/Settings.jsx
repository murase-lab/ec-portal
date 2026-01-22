import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { chatwork, sheets, testChatworkConnection, testSheetsConnection, initializeServices } from '../services'

export default function Settings() {
    // Chatwork settings
    const [chatworkToken, setChatworkToken] = useState('')
    const [chatworkRoomId, setChatworkRoomId] = useState('')
    const [chatworkStatus, setChatworkStatus] = useState('disconnected') // 'disconnected', 'testing', 'connected', 'error'
    const [chatworkUser, setChatworkUser] = useState(null)
    const [chatworkError, setChatworkError] = useState('')

    // Sheets settings
    const [sheetsApiKey, setSheetsApiKey] = useState('')
    const [sheetsSpreadsheetId, setSheetsSpreadsheetId] = useState('')
    const [sheetsStatus, setSheetsStatus] = useState('disconnected')
    const [sheetsInfo, setSheetsInfo] = useState(null)
    const [sheetsError, setSheetsError] = useState('')

    // Notification settings
    const [notifyOnAssign, setNotifyOnAssign] = useState(true)
    const [notifyOnDeadline, setNotifyOnDeadline] = useState(true)

    // Load saved settings on mount
    useEffect(() => {
        initializeServices()

        const cwConfig = chatwork.loadConfig()
        if (cwConfig.apiToken) {
            setChatworkToken(cwConfig.apiToken)
            setChatworkRoomId(cwConfig.roomId || '')
            setChatworkStatus('connected')
        }

        const shConfig = sheets.loadConfig()
        if (shConfig.apiKey) {
            setSheetsApiKey(shConfig.apiKey)
            setSheetsSpreadsheetId(shConfig.spreadsheetId || '')
            setSheetsStatus('connected')
        }

        // Load notification settings
        const notifSettings = localStorage.getItem('notification_settings')
        if (notifSettings) {
            const parsed = JSON.parse(notifSettings)
            setNotifyOnAssign(parsed.onAssign ?? true)
            setNotifyOnDeadline(parsed.onDeadline ?? true)
        }
    }, [])

    // Test Chatwork connection
    const handleTestChatwork = async () => {
        if (!chatworkToken) {
            setChatworkError('APIトークンを入力してください')
            return
        }

        setChatworkStatus('testing')
        setChatworkError('')

        chatwork.configure(chatworkToken, chatworkRoomId)

        const result = await testChatworkConnection()
        if (result.success) {
            setChatworkStatus('connected')
            setChatworkUser(result.data)
        } else {
            setChatworkStatus('error')
            setChatworkError(result.error)
        }
    }

    // Test Sheets connection
    const handleTestSheets = async () => {
        if (!sheetsApiKey || !sheetsSpreadsheetId) {
            setSheetsError('APIキーとスプレッドシートIDを入力してください')
            return
        }

        setSheetsStatus('testing')
        setSheetsError('')

        sheets.configure(sheetsApiKey, sheetsSpreadsheetId)

        const result = await testSheetsConnection()
        if (result.success) {
            setSheetsStatus('connected')
            setSheetsInfo(result.data)
        } else {
            setSheetsStatus('error')
            setSheetsError(result.error)
        }
    }

    // Save all settings
    const handleSave = () => {
        // Save Chatwork
        if (chatworkToken) {
            chatwork.configure(chatworkToken, chatworkRoomId)
        }

        // Save Sheets
        if (sheetsApiKey) {
            sheets.configure(sheetsApiKey, sheetsSpreadsheetId)
        }

        // Save notification settings
        localStorage.setItem('notification_settings', JSON.stringify({
            onAssign: notifyOnAssign,
            onDeadline: notifyOnDeadline
        }))

        alert('設定を保存しました')
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'connected':
                return <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Connected</span>
            case 'testing':
                return <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Testing...</span>
            case 'error':
                return <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Error</span>
            default:
                return <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Not Connected</span>
        }
    }

    return (
        <MainLayout title="設定・連携管理">
            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                {/* Chatwork Integration */}
                <div className="flex items-center gap-2 mb-2 ml-1">
                    <span className="material-symbols-outlined text-chatwork-blue">hub</span>
                    <h2 className="text-lg font-bold">Chatwork連携設定</h2>
                </div>

                <section className="bg-white rounded-2xl border border-[#dbe4e6] p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-chatwork-blue">person</span>
                            </div>
                            <h3 className="text-sm font-bold">
                                {chatworkUser ? `${chatworkUser.name} (連携中)` : 'Chatwork連携'}
                            </h3>
                        </div>
                        {getStatusBadge(chatworkStatus)}
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">APIトークン</label>
                            <input
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm"
                                type="password"
                                value={chatworkToken}
                                onChange={(e) => setChatworkToken(e.target.value)}
                                placeholder="Chatwork APIトークンを入力"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">ルームID (タスク同期用)</label>
                            <input
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm"
                                type="text"
                                value={chatworkRoomId}
                                onChange={(e) => setChatworkRoomId(e.target.value)}
                                placeholder="例: 123456789"
                            />
                        </div>
                        {chatworkError && (
                            <p className="text-xs text-red-500">{chatworkError}</p>
                        )}
                        <button
                            onClick={handleTestChatwork}
                            disabled={chatworkStatus === 'testing'}
                            className="w-full bg-chatwork-blue text-white py-2 rounded-lg text-sm font-bold hover:bg-chatwork-blue/90 transition-colors disabled:opacity-50"
                        >
                            {chatworkStatus === 'testing' ? '接続テスト中...' : '接続テスト'}
                        </button>
                    </div>
                </section>

                {/* Google Sheets Integration */}
                <div className="flex items-center gap-2 mb-2 ml-1 mt-8">
                    <span className="material-symbols-outlined text-green-600">table_chart</span>
                    <h2 className="text-lg font-bold">スプレッドシート連携設定</h2>
                </div>

                <section className="bg-white rounded-2xl border border-[#dbe4e6] p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-green-600">description</span>
                            </div>
                            <h3 className="text-sm font-bold">
                                {sheetsInfo ? sheetsInfo.properties?.title : 'Google Sheets連携'}
                            </h3>
                        </div>
                        {getStatusBadge(sheetsStatus)}
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">Google Sheets APIキー</label>
                            <input
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm"
                                type="password"
                                value={sheetsApiKey}
                                onChange={(e) => setSheetsApiKey(e.target.value)}
                                placeholder="Google Cloud Console APIキーを入力"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">スプレッドシートID</label>
                            <input
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm"
                                type="text"
                                value={sheetsSpreadsheetId}
                                onChange={(e) => setSheetsSpreadsheetId(e.target.value)}
                                placeholder="URLから取得: docs.google.com/spreadsheets/d/[ID]/edit"
                            />
                        </div>
                        {sheetsError && (
                            <p className="text-xs text-red-500">{sheetsError}</p>
                        )}
                        <button
                            onClick={handleTestSheets}
                            disabled={sheetsStatus === 'testing'}
                            className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            {sheetsStatus === 'testing' ? '接続テスト中...' : '接続テスト'}
                        </button>
                    </div>
                </section>

                {/* Notification Settings */}
                <section className="bg-white rounded-2xl border border-[#dbe4e6] p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-sm">通知設定</h3>
                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-sm">担当者のアサイン</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={notifyOnAssign}
                                onChange={(e) => setNotifyOnAssign(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-sm">期限の接近 (24時間前)</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={notifyOnDeadline}
                                onChange={(e) => setNotifyOnDeadline(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </section>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    className="w-full bg-rakuten-red text-white py-4 rounded-xl font-bold shadow-lg mt-6 hover:bg-rakuten-red/90 transition-colors"
                >
                    設定を保存する
                </button>

                {/* Help section */}
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <h4 className="text-sm font-bold text-blue-900 mb-2">APIキーの取得方法</h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                        <li>• <strong>Chatwork:</strong> 設定 → API設定 → APIトークン</li>
                        <li>• <strong>Google Sheets:</strong> Google Cloud Console → APIとサービス → 認証情報</li>
                    </ul>
                </div>
            </div>
        </MainLayout>
    )
}
