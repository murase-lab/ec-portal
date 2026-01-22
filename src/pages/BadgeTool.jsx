import { useState, useRef, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'

// Default badges with images
const defaultBadges = [
    { id: 1, name: '送料無料', type: 'text', color: '#BF0000', textColor: '#fff' },
    { id: 2, name: 'ポイント10倍', type: 'text', color: '#FFD700', textColor: '#000' },
    { id: 3, name: 'あす楽', type: 'text', color: '#00A0E9', textColor: '#fff' },
    { id: 4, name: 'SALE', type: 'text', color: '#BF0000', textColor: '#fff' },
    { id: 5, name: 'NEW', type: 'text', color: '#4CAF50', textColor: '#fff' },
    { id: 6, name: '限定', type: 'text', color: '#9C27B0', textColor: '#fff' },
]

export default function BadgeTool() {
    const [uploadedImage, setUploadedImage] = useState(null)
    const [badges, setBadges] = useState(() => {
        // Load badges from localStorage on initial mount
        const saved = localStorage.getItem('badgeTool_badges')
        if (saved) {
            try {
                return JSON.parse(saved)
            } catch (e) {
                console.error('Failed to parse saved badges:', e)
                return defaultBadges
            }
        }
        return defaultBadges
    })
    const [selectedBadge, setSelectedBadge] = useState(null)
    const [badgePosition, setBadgePosition] = useState('top-right')
    const [badgeScale, setBadgeScale] = useState(30)

    // Badge creation mode: 'text' or 'image'
    const [createMode, setCreateMode] = useState('text')
    const [showAddBadge, setShowAddBadge] = useState(false)

    // Text badge creation
    const [newBadgeName, setNewBadgeName] = useState('')
    const [newBadgeColor, setNewBadgeColor] = useState('#BF0000')
    const [newBadgeTextColor, setNewBadgeTextColor] = useState('#FFFFFF')

    // Image badge upload
    const [newBadgeImage, setNewBadgeImage] = useState(null)
    const [newBadgeImageName, setNewBadgeImageName] = useState('')

    // Text badge advanced settings
    const [numberScale, setNumberScale] = useState(2) // 1-5x scale for numbers
    const [verticalAlign, setVerticalAlign] = useState(0) // -1 (top) to 1 (bottom), 0 is middle
    const [lineSpacing, setLineSpacing] = useState(1.2) // 1.0-2.0x line spacing

    const canvasRef = useRef(null)
    const badgeCanvasRef = useRef(null)

    // Save badges to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('badgeTool_badges', JSON.stringify(badges))
    }, [badges])
    const fileInputRef = useRef(null)
    const badgeFileInputRef = useRef(null)

    const positions = [
        { id: 'top-left', label: '左上' },
        { id: 'top-right', label: '右上' },
        { id: 'bottom-left', label: '左下' },
        { id: 'bottom-right', label: '右下' },
    ]

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                setUploadedImage(event.target?.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleBadgeImageUpload = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                setNewBadgeImage(event.target?.result)
                setNewBadgeImageName(file.name.split('.')[0])
            }
            reader.readAsDataURL(file)
        }
    }

    // Generate text badge as image data URL
    const generateTextBadge = (text, bgColor, txtColor, numScale = 2, vAlign = 0, lSpacing = 1.2) => {
        const canvas = badgeCanvasRef.current
        const ctx = canvas.getContext('2d')
        const size = 200
        canvas.width = size
        canvas.height = size

        // Background
        ctx.fillStyle = bgColor
        ctx.beginPath()
        ctx.rect(0, 0, size, size)
        ctx.fill()

        // Split text into lines (max 5 lines)
        const lines = text.split('\n').slice(0, 5)

        // Base font size
        const baseFontSize = lines.length === 1 ? 40 :
            lines.length === 2 ? 32 :
                lines.length === 3 ? 26 :
                    lines.length === 4 ? 22 : 18

        // Helper: Check if character is a number
        const isNumber = (char) => /[0-9]/.test(char)

        // Helper: Measure text with mixed sizes
        const measureText = (line, fontSize) => {
            const chars = line.split('')
            let totalWidth = 0

            chars.forEach(char => {
                if (isNumber(char)) {
                    ctx.font = `bold ${fontSize * numScale}px "Noto Sans JP", sans-serif`
                } else {
                    ctx.font = `${fontSize}px "Noto Sans JP", sans-serif`
                }
                totalWidth += ctx.measureText(char).width
            })

            return totalWidth
        }

        // Calculate max width among all lines
        let maxWidth = 0
        lines.forEach(line => {
            const width = measureText(line, baseFontSize)
            if (width > maxWidth) maxWidth = width
        })

        // Adjust font size if text is too wide (prevent horizontal overflow)
        const availableSpace = size * 0.9 // 90% of canvas width
        let adjustedFontSize = baseFontSize
        if (maxWidth > availableSpace) {
            adjustedFontSize = baseFontSize * (availableSpace / maxWidth)
        }

        // Calculate line height considering number scale to prevent overlap
        const maxFontSize = adjustedFontSize * numScale
        const lineHeight = maxFontSize * lSpacing // User-adjustable line spacing

        // Calculate total height of all lines and center vertically
        const totalHeight = lineHeight * lines.length
        const startY = (size - totalHeight) / 2 + lineHeight / 2

        lines.forEach((line, lineIndex) => {
            const chars = line.split('')
            const actualWidth = measureText(line, adjustedFontSize)

            // Center horizontally
            let currentX = (size - actualWidth) / 2
            const baseY = startY + lineHeight * lineIndex

            chars.forEach(char => {
                const isNum = isNumber(char)
                const charFontSize = isNum ? adjustedFontSize * numScale : adjustedFontSize

                ctx.fillStyle = txtColor
                ctx.font = isNum
                    ? `bold ${charFontSize}px "Noto Sans JP", sans-serif`
                    : `${charFontSize}px "Noto Sans JP", sans-serif`

                ctx.textAlign = 'left'

                // Vertical alignment with slider control (-1 to 1)
                let yOffset = 0
                if (isNum) {
                    const heightDiff = charFontSize - adjustedFontSize
                    // vAlign: -1 = top aligned, 0 = middle, 1 = bottom aligned
                    yOffset = -heightDiff * ((1 - vAlign) / 2)
                }

                ctx.textBaseline = 'middle'
                ctx.fillText(char, currentX, baseY + yOffset)

                // Move to next character position
                currentX += ctx.measureText(char).width
            })
        })

        return canvas.toDataURL('image/png')
    }

    const handleAddTextBadge = () => {
        if (newBadgeName.trim()) {
            const imageUrl = generateTextBadge(newBadgeName, newBadgeColor, newBadgeTextColor, numberScale, verticalAlign, lineSpacing)
            const newBadge = {
                id: Date.now(),
                name: newBadgeName,
                type: 'image',
                imageUrl,
                color: newBadgeColor,
                textColor: newBadgeTextColor,
                numberScale,
                verticalAlign,
                lineSpacing,
            }
            setBadges([...badges, newBadge])
            setNewBadgeName('')
            setShowAddBadge(false)
        }
    }

    const handleAddImageBadge = () => {
        if (newBadgeImage) {
            const newBadge = {
                id: Date.now(),
                name: newBadgeImageName || 'カスタム',
                type: 'image',
                imageUrl: newBadgeImage,
            }
            setBadges([...badges, newBadge])
            setNewBadgeImage(null)
            setNewBadgeImageName('')
            setShowAddBadge(false)
        }
    }

    const handleDeleteBadge = (id) => {
        setBadges(badges.filter(b => b.id !== id))
        if (selectedBadge?.id === id) {
            setSelectedBadge(null)
        }
    }

    const renderBadgePreview = (badge, size = 'normal') => {
        const sizeClass = size === 'small' ? 'w-full h-full' : 'px-3 py-2'

        if (badge.type === 'image' && badge.imageUrl) {
            return (
                <img
                    src={badge.imageUrl}
                    alt={badge.name}
                    className="w-full h-full object-contain"
                />
            )
        }

        // Text badge fallback
        return (
            <div
                className={`${sizeClass} rounded-lg text-center font-bold text-xs`}
                style={{
                    backgroundColor: badge.color,
                    color: badge.textColor
                }}
            >
                {badge.name}
            </div>
        )
    }

    const generateAndDownload = () => {
        if (!uploadedImage || !selectedBadge) {
            alert('画像とバッジを選択してください')
            return
        }

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height
            ctx.drawImage(img, 0, 0)

            const badgeSize = Math.min(img.width, img.height) * (badgeScale / 100)
            const padding = 0 // 余白なしで四隅に配置

            let x, y
            switch (badgePosition) {
                case 'top-left':
                    x = 0
                    y = 0
                    break
                case 'top-right':
                    x = img.width - badgeSize
                    y = 0
                    break
                case 'bottom-left':
                    x = 0
                    y = img.height - badgeSize
                    break
                case 'bottom-right':
                    x = img.width - badgeSize
                    y = img.height - badgeSize
                    break
                default:
                    x = img.width - badgeSize
                    y = 0
            }

            // Draw badge
            if (selectedBadge.type === 'image' && selectedBadge.imageUrl) {
                const badgeImg = new Image()
                badgeImg.onload = () => {
                    ctx.drawImage(badgeImg, x, y, badgeSize, badgeSize)
                    downloadCanvas()
                }
                badgeImg.src = selectedBadge.imageUrl
            } else {
                // Draw text badge
                ctx.fillStyle = selectedBadge.color
                ctx.beginPath()
                ctx.roundRect(x, y, badgeSize, badgeSize * 0.4, 8)
                ctx.fill()

                ctx.fillStyle = selectedBadge.textColor
                ctx.font = `bold ${badgeSize * 0.2}px "Noto Sans JP", sans-serif`
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(selectedBadge.name, x + badgeSize / 2, y + badgeSize * 0.2)
                downloadCanvas()
            }
        }

        img.src = uploadedImage

        function downloadCanvas() {
            const link = document.createElement('a')
            link.download = 'badge-image.jpg'
            link.href = canvas.toDataURL('image/jpeg', 0.95)
            link.click()
        }
    }

    return (
        <MainLayout title="バッジ表示ツール">
            <div className="min-h-screen bg-slate-100">
                {/* Header */}
                <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
                            <span className="bg-rakuten-red px-2 py-0.5 rounded text-sm italic">PRO</span>
                            バッジ表示ツール
                        </h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                            Badge Overlay Processor v2.0
                        </p>
                    </div>
                </div>

                <div className="p-4 lg:p-6 max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Left Panel - Image Upload & Preview */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <span className="text-rakuten-red">01.</span> 画像アップロード
                                </h2>
                            </div>

                            {/* Upload Area */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-square bg-white rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-rakuten-red hover:bg-rakuten-red/5 transition-all overflow-hidden relative"
                            >
                                {uploadedImage ? (
                                    <>
                                        <img
                                            src={uploadedImage}
                                            alt="Uploaded"
                                            className="w-full h-full object-contain"
                                        />
                                        {/* Badge Preview Overlay */}
                                        {selectedBadge && (
                                            <div
                                                className={`absolute ${badgePosition === 'top-left' ? 'top-0 left-0' :
                                                    badgePosition === 'top-right' ? 'top-0 right-0' :
                                                        badgePosition === 'bottom-left' ? 'bottom-0 left-0' :
                                                            'bottom-0 right-0'
                                                    }`}
                                                style={{
                                                    width: `${badgeScale}%`,
                                                    maxWidth: '150px'
                                                }}
                                            >
                                                {selectedBadge.type === 'image' && selectedBadge.imageUrl ? (
                                                    <img
                                                        src={selectedBadge.imageUrl}
                                                        alt={selectedBadge.name}
                                                        className="w-full h-full object-contain drop-shadow-lg"
                                                    />
                                                ) : (
                                                    <div
                                                        className="px-3 py-2 rounded-lg text-center font-bold text-sm shadow-lg"
                                                        style={{
                                                            backgroundColor: selectedBadge.color,
                                                            color: selectedBadge.textColor
                                                        }}
                                                    >
                                                        {selectedBadge.name}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">
                                            add_photo_alternate
                                        </span>
                                        <p className="text-slate-500 font-medium">クリックして画像をアップロード</p>
                                        <p className="text-slate-400 text-sm mt-1">PNG, JPG対応</p>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* Right Panel - Controls */}
                        <div className="space-y-6">
                            {/* Badge Selection */}
                            <section className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                        <span className="text-rakuten-red">02.</span> バッジ選択
                                    </h2>
                                    <button
                                        onClick={() => setShowAddBadge(!showAddBadge)}
                                        className="text-[10px] font-bold text-blue-400 border border-blue-400/30 px-2 py-0.5 rounded hover:bg-blue-400/10 transition-colors"
                                    >
                                        {showAddBadge ? 'キャンセル' : '+ バッジ追加'}
                                    </button>
                                </div>

                                {/* Add Badge Form */}
                                {showAddBadge && (
                                    <div className="bg-slate-800 rounded-xl p-4 space-y-4">
                                        {/* Mode Tabs */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCreateMode('text')}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${createMode === 'text'
                                                    ? 'bg-rakuten-red text-white'
                                                    : 'bg-slate-700 text-slate-400 hover:text-white'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-sm align-middle mr-1">text_fields</span>
                                                テキストで作成
                                            </button>
                                            <button
                                                onClick={() => setCreateMode('image')}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${createMode === 'image'
                                                    ? 'bg-rakuten-red text-white'
                                                    : 'bg-slate-700 text-slate-400 hover:text-white'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-sm align-middle mr-1">image</span>
                                                画像アップロード
                                            </button>
                                        </div>

                                        {createMode === 'text' ? (
                                            /* Text Badge Creation */
                                            <div className="space-y-3">
                                                <textarea
                                                    value={newBadgeName}
                                                    onChange={(e) => {
                                                        const lines = e.target.value.split('\n')
                                                        if (lines.length <= 5) {
                                                            setNewBadgeName(e.target.value)
                                                        }
                                                    }}
                                                    placeholder="バッジテキストを入力（改行可能、最大5行）&#10;例: ポイント&#10;10倍"
                                                    rows={3}
                                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 resize-none"
                                                />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-[10px] text-slate-500">背景色</label>
                                                        <input
                                                            type="color"
                                                            value={newBadgeColor}
                                                            onChange={(e) => setNewBadgeColor(e.target.value)}
                                                            className="w-8 h-8 rounded cursor-pointer border-0"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-[10px] text-slate-500">文字色</label>
                                                        <input
                                                            type="color"
                                                            value={newBadgeTextColor}
                                                            onChange={(e) => setNewBadgeTextColor(e.target.value)}
                                                            className="w-8 h-8 rounded cursor-pointer border-0"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Number Scale Slider */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                            数字の倍率
                                                        </label>
                                                        <span className="text-xs font-bold text-blue-400">{numberScale}x</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="5"
                                                        step="0.5"
                                                        value={numberScale}
                                                        onChange={(e) => setNumberScale(Number(e.target.value))}
                                                        className="w-full accent-blue-400 bg-slate-700 h-1.5 rounded-full appearance-none cursor-pointer"
                                                    />
                                                    <div className="flex justify-between text-[8px] text-slate-600 font-bold">
                                                        <span>1x</span>
                                                        <span>5x</span>
                                                    </div>
                                                </div>

                                                {/* Vertical Alignment */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                            数字の縦位置
                                                        </label>
                                                        <span className="text-xs font-bold text-blue-400">
                                                            {verticalAlign === -1 ? '上' : verticalAlign === 0 ? '中央' : verticalAlign === 1 ? '下' : verticalAlign > 0 ? '下寄り' : '上寄り'}
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="-1"
                                                        max="1"
                                                        step="0.1"
                                                        value={verticalAlign}
                                                        onChange={(e) => setVerticalAlign(Number(e.target.value))}
                                                        className="w-full accent-blue-400 bg-slate-700 h-1.5 rounded-full appearance-none cursor-pointer"
                                                    />
                                                    <div className="flex justify-between text-[8px] text-slate-600 font-bold">
                                                        <span>上</span>
                                                        <span>中央</span>
                                                        <span>下</span>
                                                    </div>
                                                </div>

                                                {/* Line Spacing Slider */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                            行間
                                                        </label>
                                                        <span className="text-xs font-bold text-blue-400">{lineSpacing.toFixed(1)}x</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="1.0"
                                                        max="2.0"
                                                        step="0.1"
                                                        value={lineSpacing}
                                                        onChange={(e) => setLineSpacing(Number(e.target.value))}
                                                        className="w-full accent-blue-400 bg-slate-700 h-1.5 rounded-full appearance-none cursor-pointer"
                                                    />
                                                    <div className="flex justify-between text-[8px] text-slate-600 font-bold">
                                                        <span>狭い</span>
                                                        <span>標準</span>
                                                        <span>広い</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={handleAddTextBadge}
                                                    disabled={!newBadgeName.trim()}
                                                    className="w-full bg-rakuten-red text-white py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    生成して追加
                                                </button>

                                                {/* Preview */}
                                                {newBadgeName && (
                                                    <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                                                        <span className="text-[10px] text-slate-500">プレビュー:</span>
                                                        <div className="w-20 h-20 bg-white rounded-lg overflow-hidden">
                                                            <img
                                                                src={generateTextBadge(newBadgeName, newBadgeColor, newBadgeTextColor, numberScale, verticalAlign, lineSpacing)}
                                                                alt="Preview"
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            /* Image Badge Upload */
                                            <div className="space-y-3">
                                                <div
                                                    onClick={() => badgeFileInputRef.current?.click()}
                                                    className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center cursor-pointer hover:border-rakuten-red transition-colors"
                                                >
                                                    {newBadgeImage ? (
                                                        <div className="flex items-center gap-3 justify-center">
                                                            <img src={newBadgeImage} alt="Badge" className="w-16 h-16 object-contain" />
                                                            <div className="text-left">
                                                                <p className="text-sm font-bold">{newBadgeImageName}</p>
                                                                <p className="text-[10px] text-slate-500">クリックで変更</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="material-symbols-outlined text-3xl text-slate-500">upload_file</span>
                                                            <p className="text-sm text-slate-400 mt-1">バッジ画像をアップロード</p>
                                                            <p className="text-[10px] text-slate-500">正方形推奨 (PNG, JPG)</p>
                                                        </>
                                                    )}
                                                </div>
                                                <input
                                                    ref={badgeFileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleBadgeImageUpload}
                                                    className="hidden"
                                                />
                                                {newBadgeImage && (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={newBadgeImageName}
                                                            onChange={(e) => setNewBadgeImageName(e.target.value)}
                                                            placeholder="バッジ名"
                                                            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400"
                                                        />
                                                        <button
                                                            onClick={handleAddImageBadge}
                                                            className="bg-rakuten-red text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition-colors"
                                                        >
                                                            追加
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Badge Grid */}
                                <div className="grid grid-cols-3 gap-3">
                                    {badges.map((badge) => (
                                        <div key={badge.id} className="relative group">
                                            <button
                                                onClick={() => setSelectedBadge(badge)}
                                                className={`w-full aspect-square rounded-xl p-2 flex items-center justify-center transition-all overflow-hidden ${selectedBadge?.id === badge.id
                                                    ? 'ring-4 ring-rakuten-red ring-offset-2 ring-offset-slate-900 bg-white'
                                                    : 'bg-slate-800 border border-slate-700 hover:border-slate-500'
                                                    }`}
                                            >
                                                {badge.type === 'image' && badge.imageUrl ? (
                                                    <img
                                                        src={badge.imageUrl}
                                                        alt={badge.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                ) : (
                                                    <div
                                                        className="px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap"
                                                        style={{
                                                            backgroundColor: badge.color,
                                                            color: badge.textColor
                                                        }}
                                                    >
                                                        {badge.name}
                                                    </div>
                                                )}
                                            </button>
                                            {/* Delete Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteBadge(badge.id)
                                                }}
                                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                            >
                                                <span className="material-symbols-outlined text-[12px]">close</span>
                                            </button>
                                            {selectedBadge?.id === badge.id && (
                                                <p className="text-[9px] text-center mt-1 font-bold text-rakuten-red truncate">{badge.name}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Position & Scale Controls */}
                                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-700">
                                    {/* Position Grid */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                            配置位置
                                        </label>
                                        <div className="grid grid-cols-2 gap-2 w-24">
                                            {positions.map((pos) => (
                                                <button
                                                    key={pos.id}
                                                    onClick={() => setBadgePosition(pos.id)}
                                                    className={`aspect-square rounded transition-all flex items-center justify-center ${badgePosition === pos.id
                                                        ? 'bg-rakuten-red shadow-[0_0_10px_rgba(191,0,0,0.5)]'
                                                        : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                                                        }`}
                                                >
                                                    {badgePosition === pos.id && (
                                                        <span className="w-2 h-2 bg-white rounded-full"></span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 w-24 text-[8px] text-slate-500 font-bold">
                                            <span>左上</span>
                                            <span>右上</span>
                                            <span>左下</span>
                                            <span>右下</span>
                                        </div>
                                    </div>

                                    {/* Scale Slider */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                                サイズ
                                            </label>
                                            <span className="text-xs font-black text-rakuten-red">{badgeScale}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="10"
                                            max="50"
                                            value={badgeScale}
                                            onChange={(e) => setBadgeScale(Number(e.target.value))}
                                            className="w-full accent-rakuten-red bg-slate-800 h-1.5 rounded-full appearance-none cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[8px] text-slate-600 font-bold">
                                            <span>MIN</span>
                                            <span>MAX</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Preview Info */}
                            {uploadedImage && selectedBadge && (
                                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                                            {selectedBadge.type === 'image' && selectedBadge.imageUrl ? (
                                                <img src={selectedBadge.imageUrl} alt="" className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="material-symbols-outlined text-slate-600">image</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-900">プレビュー準備完了</p>
                                            <p className="text-xs text-slate-500">
                                                バッジ: {selectedBadge.name} / 位置: {positions.find(p => p.id === badgePosition)?.label}
                                            </p>
                                        </div>
                                        <span className="text-[8px] px-2 py-1 rounded-full bg-green-100 text-green-700 font-bold uppercase">
                                            Ready
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Hidden Canvas for Image Processing */}
                <canvas ref={canvasRef} className="hidden" />
                <canvas ref={badgeCanvasRef} className="hidden" />

                {/* Fixed Footer Download Button */}
                <div className="fixed bottom-0 left-0 right-0 lg:left-72 p-6 bg-white/80 backdrop-blur-md border-t-2 border-slate-200 z-50 rounded-t-[32px]">
                    <div className="max-w-xl mx-auto space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${uploadedImage && selectedBadge ? 'bg-rakuten-red' : 'bg-slate-400'}`}></span>
                                    <span className={`relative inline-flex rounded-full h-3 w-3 ${uploadedImage && selectedBadge ? 'bg-rakuten-red' : 'bg-slate-400'}`}></span>
                                </span>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                    {uploadedImage && selectedBadge ? 'エクスポート準備完了' : '画像とバッジを選択してください'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={generateAndDownload}
                            disabled={!uploadedImage || !selectedBadge}
                            className={`w-full h-16 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${uploadedImage && selectedBadge
                                ? 'bg-rakuten-red hover:bg-red-700 text-white shadow-[0_20px_40px_-10px_rgba(191,0,0,0.4)]'
                                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            <span className="material-symbols-outlined text-2xl">download_done</span>
                            画像を生成してダウンロード
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}
