import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import { HEATMAP_API_BASE as API_BASE } from '../config'

const MODEL_PRICING = {
    'claude-sonnet': { inputPer1M: 3.0, outputPer1M: 15.0 },
    'gemini-flash': { inputPer1M: 0.10, outputPer1M: 0.40 },
    'gemini-pro': { inputPer1M: 1.25, outputPer1M: 10.0 },
}

function estimateCost(modelKey, thumbCount) {
    const pricing = MODEL_PRICING[modelKey]
    if (!pricing) return null
    const imageTokensPerThumb = 1600 * 2 // 元画像 + ヒートマップ
    const totalImageTokens = imageTokensPerThumb * thumbCount
    const textInputTokens = 2000
    const outputTokens = 5000
    const totalInput = totalImageTokens + textInputTokens
    const cost = (totalInput / 1_000_000) * pricing.inputPer1M + (outputTokens / 1_000_000) * pricing.outputPer1M
    const yen = cost * 150
    return Math.round(yen * 10) / 10
}

const CATEGORIES = [
    '', 'ファッション', 'バッグ・小物', 'インテリア・収納', 'キッチン・日用品',
    '食品・ドリンク', '美容・コスメ', '健康・ダイエット', 'ベビー・キッズ',
    'スポーツ・アウトドア', '家電・PC', 'ペット用品', 'その他',
]

export default function ThumbnailABTest() {
    // 入力
    const [thumbnails, setThumbnails] = useState([]) // {id, file, preview, label}
    const [keywords, setKeywords] = useState('')
    const [category, setCategory] = useState('')
    const fileInputRef = useRef(null)

    // 処理状態
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [progress, setProgress] = useState('')

    // ヒートマップ結果
    const [heatmapResult, setHeatmapResult] = useState(null)
    const [showHeatmap, setShowHeatmap] = useState({})

    // AI診断
    const [models, setModels] = useState([])
    const [selectedModel, setSelectedModel] = useState('gemini-flash')
    const [advising, setAdvising] = useState(false)
    const [advice, setAdvice] = useState('')
    const [adviceError, setAdviceError] = useState('')

    useEffect(() => {
        loadModels()
    }, [])

    async function loadModels() {
        try {
            const res = await fetch(`${API_BASE}/api/models`)
            if (res.ok) {
                const data = await res.json()
                setModels(data)
            }
        } catch (e) {
            console.error('Failed to load models:', e)
        }
    }

    // ファイル選択
    function handleFileSelect(e) {
        const files = Array.from(e.target.files)
        const total = thumbnails.length + files.length
        if (total > 5) {
            setError('サムネイルは最大5枚までです')
            return
        }

        const newThumbs = files.map((file, i) => ({
            id: Date.now() + i,
            file,
            preview: URL.createObjectURL(file),
            label: file.name,
        }))
        setThumbnails(prev => [...prev, ...newThumbs])
        setError('')
        setHeatmapResult(null)
        setAdvice('')
        e.target.value = ''
    }

    // サムネ削除
    function removeThumbnail(id) {
        setThumbnails(prev => {
            const t = prev.find(x => x.id === id)
            if (t?.preview) URL.revokeObjectURL(t.preview)
            return prev.filter(x => x.id !== id)
        })
        setHeatmapResult(null)
        setAdvice('')
    }

    // ヒートマップ生成
    async function generateHeatmaps() {
        if (thumbnails.length < 2) {
            setError('2枚以上のサムネイルを追加してください')
            return
        }

        setLoading(true)
        setError('')
        setProgress('ヒートマップを生成中...')
        setHeatmapResult(null)
        setAdvice('')
        setAdviceError('')

        try {
            const formData = new FormData()
            for (const thumb of thumbnails) {
                formData.append('images', thumb.file)
            }

            const res = await fetch(`${API_BASE}/thumbnail-ab/analyze`, {
                method: 'POST',
                body: formData,
            })
            const text = await res.text()
            if (!text) {
                setError('バックエンドサーバー（ポート8085）が応答しません。lp-heatmapサーバーを起動してください。')
                return
            }
            let data
            try { data = JSON.parse(text) } catch { setError('サーバーからの応答が不正です'); return }
            if (!res.ok) {
                setError(data.error || 'ヒートマップ生成に失敗しました')
                return
            }

            setHeatmapResult(data.thumbnails)
            const initShow = {}
            data.thumbnails.forEach(t => { initShow[t.id] = false })
            setShowHeatmap(initShow)
        } catch (e) {
            setError(`通信エラー: ${e.message}`)
        } finally {
            setLoading(false)
            setProgress('')
        }
    }

    // AI診断実行
    async function runAdvise() {
        if (!heatmapResult) return

        setAdvising(true)
        setAdviceError('')
        setAdvice('')

        try {
            const keywordList = keywords.split(/[,、\s]+/).filter(k => k.trim())
            const res = await fetch(`${API_BASE}/thumbnail-ab/advise`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    thumbnails: heatmapResult,
                    keywords: keywordList,
                    category,
                    model: selectedModel,
                }),
            })
            const text = await res.text()
            if (!text) {
                setAdviceError('バックエンドサーバー（ポート8085）が応答しません。')
                return
            }
            let data
            try { data = JSON.parse(text) } catch { setAdviceError('サーバーからの応答が不正です'); return }
            if (!res.ok) {
                setAdviceError(data.error || 'AI診断エラー')
                return
            }
            setAdvice(data.advice)
        } catch (e) {
            setAdviceError(`通信エラー: ${e.message}`)
        } finally {
            setAdvising(false)
        }
    }

    const costEstimate = heatmapResult ? estimateCost(selectedModel, heatmapResult.length) : null

    return (
        <MainLayout title="サムネイルABテスト">
            <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">

                {/* セクション1: 画像入力 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">compare</span>
                        サムネイル画像を追加
                    </h2>

                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={thumbnails.length >= 5}
                            className="w-full border-2 border-dashed border-gray-300 rounded-xl py-8 text-center hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-4xl text-gray-400 mb-2 block">add_photo_alternate</span>
                            <p className="text-sm text-gray-500">
                                クリックして画像を選択（JPG / PNG / WebP）
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                2〜5枚のサムネイル候補をアップロード（{thumbnails.length}/5枚）
                            </p>
                        </button>
                    </div>

                    {/* サムネイルプレビュー */}
                    {thumbnails.length > 0 && (
                        <div className="mt-4">
                            <p className="text-xs font-bold text-gray-500 mb-2">アップロード済み ({thumbnails.length}/5)</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                {thumbnails.map((thumb) => (
                                    <div key={thumb.id} className="relative group">
                                        <img
                                            src={thumb.preview}
                                            alt={thumb.label}
                                            className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                                        />
                                        <button
                                            onClick={() => removeThumbnail(thumb.id)}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                        >
                                            ×
                                        </button>
                                        <p className="text-[10px] text-gray-500 mt-1 truncate">{thumb.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* キーワード・カテゴリ */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">検索キーワード（カンマ区切り）</label>
                            <input
                                type="text"
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                                placeholder="トートバッグ, レディース, 通勤"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">商品カテゴリ（任意）</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white"
                            >
                                <option value="">選択しない</option>
                                {CATEGORIES.filter(c => c).map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ヒートマップ生成ボタン */}
                    <div className="mt-4">
                        <button
                            onClick={generateHeatmaps}
                            disabled={loading || thumbnails.length < 2}
                            className="w-full sm:w-auto px-6 py-3 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {loading ? '処理中...' : 'ヒートマップ生成（無料）'}
                        </button>
                    </div>

                    {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
                    {loading && progress && (
                        <div className="mt-4">
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{progress}</p>
                        </div>
                    )}
                </div>

                {/* セクション2: ヒートマップ結果 */}
                {heatmapResult && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">local_fire_department</span>
                            ヒートマップ解析結果
                        </h3>

                        <p className="text-xs text-gray-500 mb-3">各サムネイルをクリックしてヒートマップ表示を切り替えられます</p>

                        {/* 検索結果シミュレーション（小サムネ） */}
                        <div className="mb-4">
                            <p className="text-xs font-bold text-gray-500 mb-2">検索結果一覧での見え方（~240px）</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 bg-gray-50 rounded-lg p-3">
                                {heatmapResult.map((t) => (
                                    <div
                                        key={t.id}
                                        className="cursor-pointer transition-transform hover:scale-105"
                                        onClick={() => setShowHeatmap(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                                    >
                                        <img
                                            src={showHeatmap[t.id] ? t.heatmap : t.original}
                                            alt={t.label}
                                            className="w-full aspect-square object-cover rounded-lg border-2 border-gray-200"
                                            style={{ maxWidth: '240px' }}
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1 truncate text-center">
                                            {t.label}
                                            <span className="ml-1 text-primary">{showHeatmap[t.id] ? '(HM)' : ''}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ファーストビュー表示（大サムネ） */}
                        <div>
                            <p className="text-xs font-bold text-gray-500 mb-2">スマホ ファーストビュー（大表示）</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {heatmapResult.map((t) => (
                                    <div
                                        key={t.id}
                                        className="cursor-pointer"
                                        onClick={() => setShowHeatmap(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                                    >
                                        <img
                                            src={showHeatmap[t.id] ? t.heatmap : t.original}
                                            alt={t.label}
                                            className="w-full rounded-lg border border-gray-200"
                                        />
                                        <p className="text-xs text-gray-500 mt-1 text-center">
                                            {t.label}
                                            <span className="ml-1 text-primary font-bold">{showHeatmap[t.id] ? '(ヒートマップ)' : '(元画像)'}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* セクション3: AI診断 */}
                {heatmapResult && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">smart_toy</span>
                            AI サムネイル診断
                        </h3>

                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500 mb-1 block">使用モデル</label>
                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white"
                                >
                                    {models.map((m) => (
                                        <option key={m.key} value={m.key} disabled={!m.has_api_key}>
                                            {m.label} ({m.cost_note}){!m.has_api_key ? ' - APIキー未設定' : ''}
                                        </option>
                                    ))}
                                    {models.length === 0 && (
                                        <>
                                            <option value="claude-sonnet">Claude Sonnet 4.6 (~31円/回)</option>
                                            <option value="gemini-flash">Gemini 3 Flash (~3〜5円/回)</option>
                                            <option value="gemini-pro">Gemini 3.1 Pro (~20〜30円/回)</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="text-center">
                                {costEstimate !== null && (
                                    <p className="text-xs text-gray-500 mb-1">
                                        予測コスト: <span className="font-bold text-primary">約{costEstimate}円</span>
                                        <span className="text-gray-400 ml-1">({heatmapResult.length}枚)</span>
                                    </p>
                                )}
                                <button
                                    onClick={runAdvise}
                                    disabled={advising}
                                    className="px-6 py-3 bg-gradient-to-r from-primary to-teal-500 text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
                                >
                                    {advising ? '診断中...' : 'AI診断を実行'}
                                </button>
                            </div>
                        </div>

                        {adviceError && (
                            <p className="mt-3 text-red-500 text-sm">{adviceError}</p>
                        )}

                        {advising && (
                            <div className="mt-4">
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-primary to-teal-500 rounded-full animate-pulse" style={{ width: '70%' }} />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">AIがサムネイルを比較分析中です（30秒〜1分程度）...</p>
                            </div>
                        )}

                        {advice && (
                            <div className="mt-6 prose prose-sm max-w-none">
                                <div
                                    className="bg-gray-50 rounded-lg p-6 text-sm leading-relaxed whitespace-pre-wrap"
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(advice) }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* 競合比較への導線 */}
                {heatmapResult && (
                    <div className="text-center mb-6">
                        <Link
                            to="/competitor-analysis"
                            onClick={() => {
                                // 最初のサムネのヒートマップデータを渡す
                                localStorage.setItem('competitorAnalysis_thumbnail', JSON.stringify({
                                    original: heatmapResult[0].original,
                                    heatmap: heatmapResult[0].heatmap,
                                    original_path: heatmapResult[0].original_path,
                                    heatmap_path: heatmapResult[0].heatmap_path,
                                }))
                            }}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-primary text-primary rounded-lg font-bold text-sm hover:bg-primary/5 transition-colors"
                        >
                            <span className="material-symbols-outlined">analytics</span>
                            このサムネで競合比較へ
                        </Link>
                    </div>
                )}
            </div>
        </MainLayout>
    )
}

function renderMarkdown(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-4 mb-2">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-6 mb-3 text-primary">$1</h2>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
        .replace(/\|(.+)\|/g, (match) => {
            const cells = match.split('|').filter(c => c.trim())
            if (cells.every(c => /^[-:\s]+$/.test(c.trim()))) return ''
            const tag = cells.some(c => /^\s*順位|サムネ|スコア/.test(c)) ? 'th' : 'td'
            const row = cells.map(c => `<${tag} class="border border-gray-300 px-3 py-1.5 text-xs">${c.trim()}</${tag}>`).join('')
            return `<tr>${row}</tr>`
        })
        .replace(/(<tr>.*<\/tr>\n?)+/g, (match) => `<table class="w-full border-collapse border border-gray-300 my-3">${match}</table>`)
        .replace(/\n\n/g, '<br/><br/>')
}
