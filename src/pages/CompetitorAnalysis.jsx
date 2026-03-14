import { useState, useEffect, useRef, useMemo } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { HEATMAP_API_BASE as API_BASE } from '../config'

// タイムアウト付きfetch
function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timer))
}

const MODEL_PRICING = {
    'claude-sonnet': { inputPer1M: 3.0, outputPer1M: 15.0 },
    'gemini-flash': { inputPer1M: 0.10, outputPer1M: 0.40 },
    'gemini-pro': { inputPer1M: 1.25, outputPer1M: 10.0 },
}

function estimateCompetitorCost(modelKey, competitorCount) {
    const pricing = MODEL_PRICING[modelKey]
    if (!pricing) return null
    const ownImageTokens = 1600 * 2 // 元画像 + ヒートマップ
    const competitorImageTokens = 1000 * competitorCount
    const textTokens = 3000
    const outputTokens = 6000
    const totalInput = ownImageTokens + competitorImageTokens + textTokens
    const cost = (totalInput / 1_000_000) * pricing.inputPer1M + (outputTokens / 1_000_000) * pricing.outputPer1M
    const yen = cost * 150
    return Math.round(yen * 10) / 10
}

export default function CompetitorAnalysis() {
    // セクション1: 自社商品入力
    const [inputMode, setInputMode] = useState('manual') // 'manual' | 'url'
    const [ownThumbnail, setOwnThumbnail] = useState(null) // {file, preview}
    const [ownName, setOwnName] = useState('')
    const [ownPrice, setOwnPrice] = useState('')
    const [rakutenUrl, setRakutenUrl] = useState('')
    const [fetchingProduct, setFetchingProduct] = useState(false)
    const [fetchedImageUrl, setFetchedImageUrl] = useState('') // APIから取得したサムネURL
    const fileInputRef = useRef(null)

    // ヒートマップ
    const [ownHeatmapResult, setOwnHeatmapResult] = useState(null) // {original, heatmap, original_path, heatmap_path}
    const [showOwnHeatmap, setShowOwnHeatmap] = useState(false)
    const [generatingHeatmap, setGeneratingHeatmap] = useState(false)

    // セクション2: キーワード検索
    const [keywords, setKeywords] = useState('')
    const [hits, setHits] = useState(20)
    const [searching, setSearching] = useState(false)
    const [competitors, setCompetitors] = useState([])

    // セクション3: シミュレーション
    const [position, setPosition] = useState('random')

    // セクション4: AI分析
    const [models, setModels] = useState([])
    const [selectedModel, setSelectedModel] = useState('gemini-flash')
    const [advising, setAdvising] = useState(false)
    const [advice, setAdvice] = useState('')

    // 共通
    const [error, setError] = useState('')

    useEffect(() => {
        loadModels()
        // ABテストからの引継ぎチェック
        const saved = localStorage.getItem('competitorAnalysis_thumbnail')
        if (saved) {
            try {
                const data = JSON.parse(saved)
                setOwnHeatmapResult(data)
                setFetchedImageUrl(data.original) // プレビュー用
            } catch { /* ignore */ }
            localStorage.removeItem('competitorAnalysis_thumbnail')
        }
    }, [])

    async function loadModels() {
        try {
            const res = await fetch(`${API_BASE}/api/models`)
            if (res.ok) setModels(await res.json())
        } catch { /* ignore */ }
    }

    // ファイル選択
    function handleFileSelect(e) {
        const file = e.target.files?.[0]
        if (!file) return
        if (ownThumbnail?.preview) URL.revokeObjectURL(ownThumbnail.preview)
        setOwnThumbnail({ file, preview: URL.createObjectURL(file) })
        setOwnHeatmapResult(null)
        setAdvice('')
        e.target.value = ''
    }

    // 楽天URLから商品取得
    async function fetchProduct() {
        if (!rakutenUrl.trim()) {
            setError('楽天商品URLを入力してください')
            return
        }
        setFetchingProduct(true)
        setError('')
        try {
            const res = await fetchWithTimeout(`${API_BASE}/competitor-analysis/fetch-product`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: rakutenUrl }),
            }, 30000)
            const text = await res.text()
            if (!text) { setError('サーバーが応答しません'); return }
            let data
            try { data = JSON.parse(text) } catch { setError('サーバーからの応答が不正です'); return }
            if (!res.ok) { setError(data.error || '商品情報の取得に失敗しました'); return }

            setOwnName(data.itemName || '')
            setOwnPrice(String(data.itemPrice || ''))
            if (data.imageUrl) setFetchedImageUrl(data.imageUrl)
        } catch (e) {
            setError(e.name === 'AbortError' ? 'タイムアウトしました。再度お試しください。' : `通信エラー: ${e.message}`)
        } finally {
            setFetchingProduct(false)
        }
    }

    // ヒートマップ生成
    async function generateHeatmap() {
        // アップロード画像かURL取得画像のどちらかが必要
        if (!ownThumbnail && !fetchedImageUrl) {
            setError('サムネイル画像をアップロードしてください')
            return
        }

        setGeneratingHeatmap(true)
        setError('')
        setOwnHeatmapResult(null)
        setAdvice('')

        try {
            let res
            if (ownThumbnail) {
                // ファイルアップロード
                const formData = new FormData()
                formData.append('image', ownThumbnail.file)
                res = await fetchWithTimeout(`${API_BASE}/competitor-analysis/analyze`, {
                    method: 'POST',
                    body: formData,
                }, 60000)
            } else if (fetchedImageUrl) {
                // 画像URLをバックエンドに渡してDL+ヒートマップ生成
                res = await fetchWithTimeout(`${API_BASE}/competitor-analysis/analyze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image_url: fetchedImageUrl }),
                }, 60000)
            }
            const text = await res.text()
            if (!text) { setError('サーバーが応答しません。lp-heatmapサーバーを起動してください。'); return }
            let data
            try { data = JSON.parse(text) } catch { setError('サーバーからの応答が不正です'); return }
            if (!res.ok) { setError(data.error || 'ヒートマップ生成に失敗しました'); return }

            setOwnHeatmapResult(data)
            setShowOwnHeatmap(false)
        } catch (e) {
            setError(e.name === 'AbortError' ? 'タイムアウトしました。再度お試しください。' : `通信エラー: ${e.message}`)
        } finally {
            setGeneratingHeatmap(false)
        }
    }

    // 楽天検索
    async function searchCompetitors() {
        const kwList = keywords.split(/[,、\s]+/).filter(k => k.trim())
        if (kwList.length === 0) {
            setError('検索キーワードを入力してください')
            return
        }

        setSearching(true)
        setError('')
        setCompetitors([])
        setAdvice('')

        try {
            const res = await fetchWithTimeout(`${API_BASE}/competitor-analysis/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword: kwList.join(' '), hits }),
            }, 30000)
            const text = await res.text()
            if (!text) { setError('サーバーが応答しません'); return }
            let data
            try { data = JSON.parse(text) } catch { setError('サーバーからの応答が不正です'); return }
            if (!res.ok) { setError(data.error || '検索に失敗しました'); return }

            setCompetitors(data.items || [])
        } catch (e) {
            setError(e.name === 'AbortError' ? 'タイムアウトしました。再度お試しください。' : `通信エラー: ${e.message}`)
        } finally {
            setSearching(false)
        }
    }

    // シミュレーション用の並び順
    const simulationItems = useMemo(() => {
        if (competitors.length === 0) return []

        const ownItem = {
            isOwn: true,
            itemName: ownName || '（自社商品）',
            itemPrice: Number(ownPrice) || 0,
            imageUrl: ownThumbnail?.preview || fetchedImageUrl || ownHeatmapResult?.original || '',
            shopName: '自社ショップ',
            postageFlag: 0,
            pointRate: 1,
        }

        const items = [...competitors]
        let insertIndex
        if (position === 'random') {
            insertIndex = Math.floor(Math.random() * (items.length + 1))
        } else {
            insertIndex = Math.max(0, Math.min(Number(position) - 1, items.length))
        }
        items.splice(insertIndex, 0, ownItem)
        return items
    }, [competitors, position, ownName, ownPrice, ownThumbnail, fetchedImageUrl, ownHeatmapResult])

    // AI競合分析
    async function runAdvise() {
        if (!ownHeatmapResult || competitors.length === 0) return

        setAdvising(true)
        setError('')
        setAdvice('')

        try {
            const kwList = keywords.split(/[,、\s]+/).filter(k => k.trim())
            const res = await fetchWithTimeout(`${API_BASE}/competitor-analysis/advise`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    own_product: {
                        name: ownName,
                        price: Number(ownPrice) || 0,
                        thumbnail_path: ownHeatmapResult.original_path,
                        heatmap_path: ownHeatmapResult.heatmap_path,
                    },
                    competitors,
                    keywords: kwList,
                    model: selectedModel,
                }),
            }, 180000)
            const text = await res.text()
            if (!text) { setError('サーバーが応答しません'); return }
            let data
            try { data = JSON.parse(text) } catch { setError('サーバーからの応答が不正です'); return }
            if (!res.ok) { setError(data.error || 'AI分析エラー'); return }

            setAdvice(data.advice)
        } catch (e) {
            setError(e.name === 'AbortError' ? 'タイムアウトしました。再度お試しください。' : `通信エラー: ${e.message}`)
        } finally {
            setAdvising(false)
        }
    }

    const costEstimate = competitors.length > 0 ? estimateCompetitorCost(selectedModel, competitors.length) : null
    const ownPreviewSrc = ownThumbnail?.preview || fetchedImageUrl || ''
    const hasOwnImage = !!(ownThumbnail || fetchedImageUrl || ownHeatmapResult)

    return (
        <MainLayout title="競合分析">
            <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">

                {/* セクション1: 自社商品入力 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">storefront</span>
                        自社商品情報
                    </h2>

                    {/* 入力モード切替タブ */}
                    <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
                        <button
                            onClick={() => setInputMode('manual')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${inputMode === 'manual' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                        >
                            手動入力
                        </button>
                        <button
                            onClick={() => setInputMode('url')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${inputMode === 'url' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                        >
                            楽天URLから取得
                        </button>
                    </div>

                    {inputMode === 'url' && (
                        <div className="mb-4">
                            <label className="text-xs font-bold text-gray-500 mb-1 block">楽天商品URL</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={rakutenUrl}
                                    onChange={(e) => setRakutenUrl(e.target.value)}
                                    placeholder="https://item.rakuten.co.jp/shopname/itemid/"
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                <button
                                    onClick={fetchProduct}
                                    disabled={fetchingProduct}
                                    className="px-4 py-3 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
                                >
                                    {fetchingProduct ? '取得中...' : '取得'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* サムネイル画像 */}
                    <div className="mb-4">
                        <label className="text-xs font-bold text-gray-500 mb-1 block">サムネイル画像</label>
                        <div className="flex items-start gap-4">
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-primary hover:bg-primary/5 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-2xl text-gray-400 block">add_photo_alternate</span>
                                    <p className="text-xs text-gray-500 mt-1">画像をアップロード</p>
                                </button>
                            </div>
                            {(ownPreviewSrc || ownHeatmapResult) && (
                                <div
                                    className="cursor-pointer"
                                    onClick={() => ownHeatmapResult && setShowOwnHeatmap(!showOwnHeatmap)}
                                >
                                    <img
                                        src={ownHeatmapResult ? (showOwnHeatmap ? ownHeatmapResult.heatmap : ownHeatmapResult.original) : ownPreviewSrc}
                                        alt="自社サムネイル"
                                        className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                                    />
                                    {ownHeatmapResult && (
                                        <p className="text-[10px] text-primary text-center mt-1">
                                            {showOwnHeatmap ? 'ヒートマップ' : '元画像'}（クリックで切替）
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 商品名・価格 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">商品名</label>
                            <input
                                type="text"
                                value={ownName}
                                onChange={(e) => setOwnName(e.target.value)}
                                placeholder="【送料無料】本革 トートバッグ レディース..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">価格（税込）</label>
                            <input
                                type="number"
                                value={ownPrice}
                                onChange={(e) => setOwnPrice(e.target.value)}
                                placeholder="3980"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </div>

                    {/* ヒートマップ生成ボタン */}
                    <button
                        onClick={generateHeatmap}
                        disabled={generatingHeatmap || !hasOwnImage}
                        className="px-6 py-3 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 disabled:opacity-50"
                    >
                        {generatingHeatmap ? '生成中...' : 'ヒートマップ生成（無料）'}
                    </button>

                    {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}

                    {generatingHeatmap && (
                        <div className="mt-4">
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">ヒートマップを生成中...</p>
                        </div>
                    )}
                </div>

                {/* セクション2: キーワード検索 */}
                {ownHeatmapResult && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">search</span>
                            競合商品を検索
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                            <div className="sm:col-span-2">
                                <label className="text-xs font-bold text-gray-500 mb-1 block">検索キーワード（カンマ区切り）</label>
                                <input
                                    type="text"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    placeholder="トートバッグ, レディース, 通勤"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">取得件数</label>
                                <div className="flex gap-2">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input type="radio" value={10} checked={hits === 10} onChange={() => setHits(10)} className="accent-primary" />
                                        <span className="text-sm">10件</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input type="radio" value={20} checked={hits === 20} onChange={() => setHits(20)} className="accent-primary" />
                                        <span className="text-sm">20件</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={searchCompetitors}
                            disabled={searching}
                            className="px-6 py-3 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 disabled:opacity-50"
                        >
                            {searching ? '検索中...' : '楽天で検索'}
                        </button>

                        {searching && (
                            <div className="mt-4">
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '50%' }} />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">楽天商品検索APIで競合商品を取得中...</p>
                            </div>
                        )}

                        {competitors.length > 0 && (
                            <p className="mt-3 text-sm text-gray-600">
                                <span className="font-bold text-primary">{competitors.length}件</span>の競合商品が見つかりました
                            </p>
                        )}
                    </div>
                )}

                {/* セクション3: スマホ検索結果シミュレーション */}
                {competitors.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">smartphone</span>
                            検索結果シミュレーション
                        </h2>

                        <div className="flex items-center gap-3 mb-4">
                            <label className="text-xs font-bold text-gray-500">自社商品の表示位置:</label>
                            <select
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                            >
                                <option value="random">ランダム</option>
                                {Array.from({ length: competitors.length + 1 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}番目</option>
                                ))}
                            </select>
                        </div>

                        {/* スマホ風フレーム */}
                        <div className="mx-auto" style={{ maxWidth: '375px' }}>
                            <div className="bg-gray-100 rounded-2xl p-2 border border-gray-300">
                                {/* ヘッダー */}
                                <div className="bg-red-600 text-white text-center py-2 rounded-t-xl mb-2">
                                    <p className="text-xs font-bold">楽天市場 検索結果</p>
                                    <p className="text-[10px] opacity-80">「{keywords || 'キーワード'}」の検索結果</p>
                                </div>

                                {/* 2列グリッド */}
                                <div className="grid grid-cols-2 gap-1.5">
                                    {simulationItems.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={`bg-white rounded-lg overflow-hidden ${item.isOwn ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                                        >
                                            <div className="relative">
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.itemName}
                                                    className="w-full aspect-square object-cover"
                                                    onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23eee" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23999" font-size="10">No Image</text></svg>' }}
                                                />
                                                {item.isOwn && (
                                                    <span className="absolute top-1 left-1 bg-blue-500 text-white text-[8px] px-1.5 py-0.5 rounded font-bold">
                                                        あなたの商品
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-1.5">
                                                <p className="text-[10px] leading-tight line-clamp-2 h-[28px]">{item.itemName}</p>
                                                <p className="text-red-600 font-bold text-xs mt-0.5">¥{Number(item.itemPrice).toLocaleString()}</p>
                                                <div className="flex gap-0.5 mt-0.5 flex-wrap">
                                                    {item.postageFlag === 1 && (
                                                        <span className="text-[8px] bg-green-100 text-green-700 px-1 rounded">送料無料</span>
                                                    )}
                                                    {item.pointRate > 1 && (
                                                        <span className="text-[8px] bg-orange-100 text-orange-700 px-1 rounded">ポイント{item.pointRate}倍</span>
                                                    )}
                                                </div>
                                                <p className="text-[8px] text-gray-400 mt-0.5 truncate">{item.shopName}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* セクション4: AI競合分析 */}
                {competitors.length > 0 && ownHeatmapResult && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">smart_toy</span>
                            AI 競合分析
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
                                        <span className="text-gray-400 ml-1">(競合{competitors.length}件)</span>
                                    </p>
                                )}
                                <button
                                    onClick={runAdvise}
                                    disabled={advising}
                                    className="px-6 py-3 bg-gradient-to-r from-primary to-teal-500 text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
                                >
                                    {advising ? '分析中...' : 'AI競合分析を実行'}
                                </button>
                            </div>
                        </div>

                        {advising && (
                            <div className="mt-4">
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-primary to-teal-500 rounded-full animate-pulse" style={{ width: '70%' }} />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">AIが競合サムネイルを比較分析中です（1〜2分程度）...</p>
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
            const tag = cells.some(c => /^\s*(順位|商品|CTR|スコア|サムネ|価格|商品名)/.test(c)) ? 'th' : 'td'
            const row = cells.map(c => `<${tag} class="border border-gray-300 px-3 py-1.5 text-xs">${c.trim()}</${tag}>`).join('')
            return `<tr>${row}</tr>`
        })
        .replace(/(<tr>.*<\/tr>\n?)+/g, (match) => `<table class="w-full border-collapse border border-gray-300 my-3">${match}</table>`)
        .replace(/\n\n/g, '<br/><br/>')
}
