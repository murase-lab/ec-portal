import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { HEATMAP_API_BASE as API_BASE } from '../config'

const MODEL_PRICING = {
    'claude-sonnet': { inputPer1M: 3.0, outputPer1M: 15.0 },
    'gemini-flash': { inputPer1M: 0.10, outputPer1M: 0.40 },
    'gemini-pro': { inputPer1M: 1.25, outputPer1M: 10.0 },
}

function estimateCost(modelKey, blockCount) {
    const pricing = MODEL_PRICING[modelKey]
    if (!pricing) return null
    const imageTokensPerBlock = 1600 * 2
    const totalImageTokens = imageTokensPerBlock * blockCount
    const textInputTokens = 1500
    const outputTokens = 4000
    const totalInput = totalImageTokens + textInputTokens
    const cost = (totalInput / 1_000_000) * pricing.inputPer1M + (outputTokens / 1_000_000) * pricing.outputPer1M
    const yen = cost * 150
    return Math.round(yen * 10) / 10
}

export default function LPHeatmap() {
    const [url, setUrl] = useState('')
    const [device, setDevice] = useState('mobile')
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState('')
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')

    // AI diagnosis
    const [models, setModels] = useState([])
    const [selectedModel, setSelectedModel] = useState('gemini-flash')
    const [advising, setAdvising] = useState(false)
    const [advice, setAdvice] = useState('')
    const [adviceError, setAdviceError] = useState('')

    // View mode
    const [viewMode, setViewMode] = useState('full') // full | blocks
    const [imageTab, setImageTab] = useState('heatmap') // original | heatmap

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

    async function startAnalysis() {
        if (!url.trim()) {
            setError('URLを入力してください')
            return
        }
        setError('')
        setLoading(true)
        setProgress('スクリーンショットを撮影中...')
        setResult(null)
        setAdvice('')
        setAdviceError('')

        try {
            const res = await fetch(`${API_BASE}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url.trim(), device, run_ai: false }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || 'エラーが発生しました')
                return
            }
            setResult(data)
            setProgress('')
        } catch (e) {
            setError(`通信エラー: ${e.message}`)
        } finally {
            setLoading(false)
        }
    }

    async function runAdvise() {
        if (!result) return
        setAdvising(true)
        setAdviceError('')
        setAdvice('')

        try {
            const res = await fetch(`${API_BASE}/advise`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    screenshot_path: result.screenshot_path,
                    heatmap_path: result.heatmap_path,
                    model: selectedModel,
                }),
            })
            const data = await res.json()
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

    const costEstimate = result ? estimateCost(selectedModel, result.block_count) : null

    return (
        <MainLayout title="LPヒートマップ診断">
            <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
                {/* Input Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">local_fire_department</span>
                        LP ヒートマップ解析
                    </h2>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://item.rakuten.co.jp/..."
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && !loading && startAnalysis()}
                        />
                        <select
                            value={device}
                            onChange={(e) => setDevice(e.target.value)}
                            className="px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white"
                        >
                            <option value="mobile">スマホ</option>
                            <option value="pc">PC</option>
                        </select>
                        <button
                            onClick={startAnalysis}
                            disabled={loading}
                            className="px-6 py-3 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                            {loading ? '処理中...' : '診断開始'}
                        </button>
                    </div>

                    {error && (
                        <p className="mt-3 text-red-500 text-sm">{error}</p>
                    )}
                    {loading && progress && (
                        <div className="mt-4">
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{progress}</p>
                        </div>
                    )}
                </div>

                {/* Results */}
                {result && (
                    <>
                        {/* Image View */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">image</span>
                                    解析結果
                                </h3>
                                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('full')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${viewMode === 'full' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                                    >
                                        全体表示
                                    </button>
                                    <button
                                        onClick={() => setViewMode('blocks')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${viewMode === 'blocks' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                                    >
                                        ブロック表示
                                    </button>
                                </div>
                            </div>

                            {/* Image Tab */}
                            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
                                <button
                                    onClick={() => setImageTab('original')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${imageTab === 'original' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
                                >
                                    元画像
                                </button>
                                <button
                                    onClick={() => setImageTab('heatmap')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${imageTab === 'heatmap' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                                >
                                    ヒートマップ
                                </button>
                            </div>

                            {viewMode === 'full' ? (
                                <div className="flex justify-center">
                                    <img
                                        src={imageTab === 'original' ? result.screenshot : result.heatmap}
                                        alt={imageTab === 'original' ? '元画像' : 'ヒートマップ'}
                                        className="max-w-full max-h-[600px] object-contain rounded-lg border border-gray-200"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {result.blocks.map((block) => (
                                        <div key={block.block} className="border border-gray-200 rounded-lg p-3">
                                            <p className="text-xs font-bold text-gray-500 mb-2">ブロック {block.block}</p>
                                            <img
                                                src={imageTab === 'original' ? block.original : block.heatmap}
                                                alt={`ブロック${block.block}`}
                                                className="w-full rounded-lg"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* AI Diagnosis */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">smart_toy</span>
                                AI フルファネル診断
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
                                            <span className="text-gray-400 ml-1">({result.block_count}ブロック)</span>
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
                                    <p className="text-xs text-gray-500 mt-2">AIが画像を分析中です（30秒〜1分程度）...</p>
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
                    </>
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
        .replace(/\n\n/g, '<br/><br/>')
}
