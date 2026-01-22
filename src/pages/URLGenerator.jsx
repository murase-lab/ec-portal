import { useState } from 'react'
import MainLayout from '../components/layout/MainLayout'

export default function URLGenerator() {
    // Tool mode: 'bookmark' or 'coupon'
    const [toolMode, setToolMode] = useState('bookmark')

    // ===== Bookmark URL State =====
    const [productUrl, setProductUrl] = useState('')
    const [pageSource, setPageSource] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [shopId, setShopId] = useState('')
    const [itemId, setItemId] = useState('')
    const [generatedUrl, setGeneratedUrl] = useState('')
    const [generatedHtml, setGeneratedHtml] = useState('')
    const [copied, setCopied] = useState(false)
    const [copiedHtml, setCopiedHtml] = useState(false)
    const [error, setError] = useState('')
    const [inputMode, setInputMode] = useState('source')

    // ===== Coupon URL State =====
    const [couponUrl, setCouponUrl] = useState('')
    const [redirectUrl, setRedirectUrl] = useState('')
    const [couponImageUrl, setCouponImageUrl] = useState('')
    const [couponImageWidth, setCouponImageWidth] = useState('188')
    const [couponWidthUnit, setCouponWidthUnit] = useState('px')
    const [generatedCouponUrl, setGeneratedCouponUrl] = useState('')
    const [generatedCouponHtml, setGeneratedCouponHtml] = useState('')
    const [couponCopied, setCouponCopied] = useState(false)
    const [couponHtmlCopied, setCouponHtmlCopied] = useState(false)
    const [couponError, setCouponError] = useState('')

    // ===== Bookmark URL Functions =====
    const parseFromSource = () => {
        setError('')
        if (!pageSource.trim()) {
            setError('ページソースを入力してください')
            return
        }

        // Multiple regex patterns to match different formats
        // Pattern 1: "itemId": 12345 or "itemId":12345
        // Pattern 2: 'itemId': 12345 or 'itemId':12345
        // Pattern 3: itemId: 12345 or itemId:12345
        // Pattern 4: &quot;itemId&quot;: 12345 (HTML encoded quotes)
        const itemIdPatterns = [
            /"itemId"\s*:\s*(\d+)/,
            /'itemId'\s*:\s*(\d+)/,
            /itemId\s*:\s*(\d+)/,
            /&quot;itemId&quot;\s*:\s*(\d+)/,
            /"item_id"\s*:\s*(\d+)/i,
        ]

        const shopIdPatterns = [
            /"shopId"\s*:\s*(\d+)/,
            /'shopId'\s*:\s*(\d+)/,
            /shopId\s*:\s*(\d+)/,
            /&quot;shopId&quot;\s*:\s*(\d+)/,
            /"shop_id"\s*:\s*(\d+)/i,
            /shop_bid=(\d+)/,  // From URL parameters
        ]

        let extractedItemId = null
        let extractedShopId = null

        // Try each pattern for itemId
        for (const pattern of itemIdPatterns) {
            const match = pageSource.match(pattern)
            if (match) {
                extractedItemId = match[1]
                break
            }
        }

        // Try each pattern for shopId
        for (const pattern of shopIdPatterns) {
            const match = pageSource.match(pattern)
            if (match) {
                extractedShopId = match[1]
                break
            }
        }

        if (!extractedItemId) {
            setError('itemIdが見つかりませんでした。ソースコードに "itemId": 数字 の形式が含まれているか確認してください。')
            return
        }
        if (!extractedShopId) {
            setError('shopIdが見つかりませんでした。ソースコードに "shopId": 数字 の形式が含まれているか確認してください。')
            return
        }

        setItemId(extractedItemId)
        setShopId(extractedShopId)
        generateUrls(extractedShopId, extractedItemId)
    }

    const generateFromManual = () => {
        setError('')
        if (!shopId.trim() || !itemId.trim()) {
            setError('shopIdとitemIdを入力してください')
            return
        }
        generateUrls(shopId, itemId)
    }

    const generateUrls = (shop, item) => {
        const bookmarkUrl = `https://my.bookmark.rakuten.co.jp/?func=reg&svid=106&shop_bid=${shop}&iid=${item}&itype=1`
        setGeneratedUrl(bookmarkUrl)
        if (imageUrl.trim()) {
            const html = `<a href="${bookmarkUrl}"><img src="${imageUrl}" alt="お気に入り商品URL"></a>`
            setGeneratedHtml(html)
        } else {
            setGeneratedHtml('')
        }
    }

    const handleImageUrlChange = (url) => {
        setImageUrl(url)
        if (generatedUrl && url.trim()) {
            const html = `<a href="${generatedUrl}"><img src="${url}" alt="お気に入り商品URL"></a>`
            setGeneratedHtml(html)
        } else {
            setGeneratedHtml('')
        }
    }

    const copyUrl = () => {
        navigator.clipboard.writeText(generatedUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const copyHtml = () => {
        navigator.clipboard.writeText(generatedHtml)
        setCopiedHtml(true)
        setTimeout(() => setCopiedHtml(false), 2000)
    }

    const resetBookmarkForm = () => {
        setProductUrl('')
        setPageSource('')
        setImageUrl('')
        setShopId('')
        setItemId('')
        setGeneratedUrl('')
        setGeneratedHtml('')
        setError('')
    }

    // ===== Coupon URL Functions =====
    const generateCouponUrl = () => {
        setCouponError('')

        if (!couponUrl.trim()) {
            setCouponError('クーポンURLを入力してください')
            return
        }
        if (!redirectUrl.trim()) {
            setCouponError('リンク先URLを入力してください')
            return
        }

        // Parse coupon URL and ensure it ends with &rt=
        let baseUrl = couponUrl.trim()

        // Remove trailing & or &rt if present to normalize
        baseUrl = baseUrl.replace(/&rt=?$/, '').replace(/&$/, '')

        // Add &rt=&rd= with redirect URL
        const finalUrl = `${baseUrl}&rt=&rd=${redirectUrl.trim()}`
        setGeneratedCouponUrl(finalUrl)

        // Generate HTML if image URL is provided
        if (couponImageUrl.trim()) {
            const widthValue = `${couponImageWidth}${couponWidthUnit}`
            const html = `<a href="${finalUrl}" target="_blank">
    <img src="${couponImageUrl.trim()}" alt="楽天クーポン画像" width="${widthValue}">
</a>`
            setGeneratedCouponHtml(html)
        } else {
            setGeneratedCouponHtml('')
        }
    }

    const copyCouponUrl = () => {
        navigator.clipboard.writeText(generatedCouponUrl)
        setCouponCopied(true)
        setTimeout(() => setCouponCopied(false), 2000)
    }

    const copyCouponHtml = () => {
        navigator.clipboard.writeText(generatedCouponHtml)
        setCouponHtmlCopied(true)
        setTimeout(() => setCouponHtmlCopied(false), 2000)
    }

    const resetCouponForm = () => {
        setCouponUrl('')
        setRedirectUrl('')
        setCouponImageUrl('')
        setCouponImageWidth('188')
        setGeneratedCouponUrl('')
        setGeneratedCouponHtml('')
        setCouponError('')
    }

    return (
        <MainLayout title="URL生成ツール">
            <div className="min-h-screen bg-slate-100 pb-32">
                {/* Header */}
                <div className="bg-slate-900 text-white p-4">
                    <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
                        <span className="bg-rakuten-red px-2 py-0.5 rounded text-sm italic">PRO</span>
                        URL生成ツール
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        Rakuten URL Generator v3.0
                    </p>
                </div>

                <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
                    {/* Tool Mode Toggle */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setToolMode('bookmark')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${toolMode === 'bookmark'
                                ? 'bg-rakuten-red text-white'
                                : 'bg-white text-slate-600 border border-slate-300'
                                }`}
                        >
                            <span className="material-symbols-outlined text-sm align-middle mr-1">bookmark</span>
                            お気に入りURL生成
                        </button>
                        <button
                            onClick={() => setToolMode('coupon')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${toolMode === 'coupon'
                                ? 'bg-rakuten-red text-white'
                                : 'bg-white text-slate-600 border border-slate-300'
                                }`}
                        >
                            <span className="material-symbols-outlined text-sm align-middle mr-1">confirmation_number</span>
                            クーポンURL生成
                        </button>
                    </div>

                    {/* ===== BOOKMARK URL TOOL ===== */}
                    {toolMode === 'bookmark' && (
                        <>
                            {/* Input Mode Toggle */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setInputMode('source')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${inputMode === 'source'
                                        ? 'bg-primary text-white'
                                        : 'bg-white text-slate-600 border border-slate-300'
                                        }`}
                                >
                                    ソースコードから抽出
                                </button>
                                <button
                                    onClick={() => setInputMode('manual')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${inputMode === 'manual'
                                        ? 'bg-primary text-white'
                                        : 'bg-white text-slate-600 border border-slate-300'
                                        }`}
                                >
                                    ID直接入力
                                </button>
                            </div>

                            {/* Input Section */}
                            <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <span className="text-rakuten-red">01.</span> 商品情報入力
                                </h2>

                                {inputMode === 'source' ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-600 mb-1 block">商品ページURL（参考用）</label>
                                            <input
                                                type="text"
                                                value={productUrl}
                                                onChange={(e) => setProductUrl(e.target.value)}
                                                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm"
                                                placeholder="https://item.rakuten.co.jp/kinoco/wallet-11/"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-600 mb-1 block">ページソースコード</label>
                                            <textarea
                                                value={pageSource}
                                                onChange={(e) => setPageSource(e.target.value)}
                                                className="w-full h-32 border border-slate-300 rounded-lg p-3 text-xs font-mono"
                                                placeholder="ページソースをここに貼り付け..."
                                            />
                                        </div>
                                        <button
                                            onClick={parseFromSource}
                                            className="w-full bg-primary text-white py-3 rounded-lg font-bold text-sm"
                                        >
                                            ソースからIDを抽出
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-600 mb-1 block">shopId</label>
                                                <input
                                                    type="text"
                                                    value={shopId}
                                                    onChange={(e) => setShopId(e.target.value)}
                                                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm"
                                                    placeholder="298734"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-600 mb-1 block">itemId</label>
                                                <input
                                                    type="text"
                                                    value={itemId}
                                                    onChange={(e) => setItemId(e.target.value)}
                                                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm"
                                                    placeholder="10293035"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={generateFromManual}
                                            className="w-full bg-primary text-white py-3 rounded-lg font-bold text-sm"
                                        >
                                            URLを生成
                                        </button>
                                    </div>
                                )}

                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-xs font-bold text-red-700">{error}</p>
                                    </div>
                                )}

                                {(shopId || itemId) && (
                                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-xs font-bold text-green-700 mb-2">抽出されたID</p>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div><span className="text-slate-500">shopId:</span> <span className="font-mono font-bold">{shopId}</span></div>
                                            <div><span className="text-slate-500">itemId:</span> <span className="font-mono font-bold">{itemId}</span></div>
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Image URL */}
                            <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <span className="text-rakuten-red">02.</span> 画像URL（任意）
                                </h2>
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={(e) => handleImageUrlChange(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </section>

                            {/* Generated URL */}
                            {generatedUrl && (
                                <section className="bg-slate-900 rounded-2xl p-5 shadow-2xl">
                                    <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4 text-white">
                                        <span className="text-rakuten-red">03.</span> 生成されたURL
                                    </h2>
                                    <div className="bg-slate-800 rounded-xl p-4 mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">お気に入り登録URL</span>
                                            <button onClick={copyUrl} className={`text-xs px-3 py-1 rounded font-bold ${copied ? 'bg-green-500' : 'bg-rakuten-red'} text-white`}>
                                                {copied ? '✓ コピー済み' : 'コピー'}
                                            </button>
                                        </div>
                                        <p className="text-sm text-blue-400 font-mono break-all">{generatedUrl}</p>
                                    </div>
                                    {generatedHtml && (
                                        <div className="bg-slate-800 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">画像リンク付きHTML</span>
                                                <button onClick={copyHtml} className={`text-xs px-3 py-1 rounded font-bold ${copiedHtml ? 'bg-green-500' : 'bg-rakuten-red'} text-white`}>
                                                    {copiedHtml ? '✓ コピー済み' : 'コピー'}
                                                </button>
                                            </div>
                                            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{generatedHtml}</pre>
                                        </div>
                                    )}
                                </section>
                            )}

                            {generatedUrl && (
                                <button onClick={resetBookmarkForm} className="w-full h-12 rounded-xl font-bold text-sm bg-slate-200 text-slate-700">
                                    <span className="material-symbols-outlined text-lg align-middle mr-1">refresh</span>
                                    リセット
                                </button>
                            )}
                        </>
                    )}

                    {/* ===== COUPON URL TOOL ===== */}
                    {toolMode === 'coupon' && (
                        <>
                            {/* Coupon Input */}
                            <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <span className="text-rakuten-red">01.</span> クーポン情報入力
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 mb-1 block">クーポンURL</label>
                                        <input
                                            type="text"
                                            value={couponUrl}
                                            onChange={(e) => setCouponUrl(e.target.value)}
                                            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm font-mono"
                                            placeholder="https://coupon.rakuten.co.jp/getCoupon?getkey=XXXXX&rt"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">楽天で発行されたクーポンURLを入力</p>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-600 mb-1 block">リンク先URL（リダイレクト先）</label>
                                        <input
                                            type="text"
                                            value={redirectUrl}
                                            onChange={(e) => setRedirectUrl(e.target.value)}
                                            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm font-mono"
                                            placeholder="https://www.rakuten.ne.jp/gold/kinoco/wintersale.html"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">クーポン取得後に遷移するページURL</p>
                                    </div>

                                    <button
                                        onClick={generateCouponUrl}
                                        className="w-full bg-primary text-white py-3 rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm align-middle mr-1">link</span>
                                        クーポンURLを生成
                                    </button>

                                    {couponError && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-xs font-bold text-red-700">{couponError}</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Coupon Image (Optional) */}
                            <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <span className="text-rakuten-red">02.</span> 画像リンク設定（任意）
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 mb-1 block">画像URL</label>
                                        <input
                                            type="text"
                                            value={couponImageUrl}
                                            onChange={(e) => setCouponImageUrl(e.target.value)}
                                            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm font-mono"
                                            placeholder="https://image.rakuten.co.jp/kinoco/cabinet/coupon/2412cp2000.jpg"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-600 mb-1 block">画像サイズ（width）</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={couponImageWidth}
                                                onChange={(e) => setCouponImageWidth(e.target.value)}
                                                className="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm"
                                                placeholder="188"
                                            />
                                            <select
                                                value={couponWidthUnit}
                                                onChange={(e) => setCouponWidthUnit(e.target.value)}
                                                className="border border-slate-300 rounded-lg px-3 py-3 text-sm bg-white"
                                            >
                                                <option value="px">px</option>
                                                <option value="%">%</option>
                                            </select>
                                        </div>
                                    </div>

                                    {couponImageUrl && (
                                        <button
                                            onClick={generateCouponUrl}
                                            className="w-full bg-slate-700 text-white py-2 rounded-lg font-bold text-sm"
                                        >
                                            HTMLを再生成
                                        </button>
                                    )}
                                </div>
                            </section>

                            {/* Generated Coupon URL */}
                            {generatedCouponUrl && (
                                <section className="bg-slate-900 rounded-2xl p-5 shadow-2xl">
                                    <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4 text-white">
                                        <span className="text-rakuten-red">03.</span> 生成されたURL
                                    </h2>

                                    {/* URL Only */}
                                    <div className="bg-slate-800 rounded-xl p-4 mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">クーポンURL（リダイレクト付き）</span>
                                            <button
                                                onClick={copyCouponUrl}
                                                className={`text-xs px-3 py-1 rounded font-bold transition-colors ${couponCopied ? 'bg-green-500' : 'bg-rakuten-red'} text-white`}
                                            >
                                                {couponCopied ? '✓ コピー済み' : 'コピー'}
                                            </button>
                                        </div>
                                        <p className="text-sm text-blue-400 font-mono break-all select-all">{generatedCouponUrl}</p>
                                    </div>

                                    {/* HTML with Image */}
                                    {generatedCouponHtml && (
                                        <div className="bg-slate-800 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">画像リンク付きHTML</span>
                                                <button
                                                    onClick={copyCouponHtml}
                                                    className={`text-xs px-3 py-1 rounded font-bold transition-colors ${couponHtmlCopied ? 'bg-green-500' : 'bg-rakuten-red'} text-white`}
                                                >
                                                    {couponHtmlCopied ? '✓ コピー済み' : 'コピー'}
                                                </button>
                                            </div>
                                            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap select-all">{generatedCouponHtml}</pre>
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* Preview */}
                            {generatedCouponHtml && couponImageUrl && (
                                <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                                    <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                                        <span className="text-rakuten-red">04.</span> プレビュー
                                    </h2>
                                    <div className="bg-slate-50 rounded-xl p-4 flex justify-center">
                                        <a href={generatedCouponUrl} target="_blank" rel="noopener noreferrer">
                                            <img
                                                src={couponImageUrl}
                                                alt="楽天クーポン画像"
                                                style={{ width: `${couponImageWidth}${couponWidthUnit}` }}
                                                className="border border-slate-200 rounded"
                                                onError={(e) => {
                                                    e.target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect fill="#f1f5f9" width="200" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="12">画像読み込みエラー</text></svg>')
                                                }}
                                            />
                                        </a>
                                    </div>
                                </section>
                            )}

                            {/* How it works */}
                            <section className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                                <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-lg">info</span>
                                    仕組み
                                </h3>
                                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                                    <li>クーポンURLの<code className="bg-blue-100 px-1 rounded">getkey</code>部分をそのまま保持</li>
                                    <li><code className="bg-blue-100 px-1 rounded">&rt=</code>の後ろに<code className="bg-blue-100 px-1 rounded">&rd=</code>を追加</li>
                                    <li><code className="bg-blue-100 px-1 rounded">&rd=</code>の後ろにリダイレクト先URLを設定</li>
                                    <li>画像URLを指定すると、画像リンク付きHTMLも生成</li>
                                </ul>
                            </section>

                            {generatedCouponUrl && (
                                <button onClick={resetCouponForm} className="w-full h-12 rounded-xl font-bold text-sm bg-slate-200 text-slate-700">
                                    <span className="material-symbols-outlined text-lg align-middle mr-1">refresh</span>
                                    リセット
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </MainLayout>
    )
}
