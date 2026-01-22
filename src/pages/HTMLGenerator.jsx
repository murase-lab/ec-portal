import { useState, useMemo } from 'react'
import MainLayout from '../components/layout/MainLayout'

// Default fields for product info
const defaultFields = [
  { key: '商品名', value: '', required: true },
  { key: '型番', value: '', required: false },
  { key: 'カラー', value: '', required: false },
  { key: 'サイズ', value: '', required: false },
  { key: '素材', value: '', required: false },
  { key: '収納', value: '', required: false },
  { key: '重量', value: '', required: false },
  { key: '付属品', value: '', required: false },
  { key: '商品説明', value: '', required: true },
  { key: 'ご注意', value: '', required: false },
  { key: 'シーン・関連ワード', value: '', required: false },
]

export default function HTMLGenerator() {
  const [fields, setFields] = useState(defaultFields)
  const [tableTitle, setTableTitle] = useState('商品説明')
  const [tableWidth, setTableWidth] = useState('400')
  const [widthUnit, setWidthUnit] = useState('px') // 'px' or '%'
  const [headerWidth, setHeaderWidth] = useState('94')
  const [contentWidth, setContentWidth] = useState('291')
  const [bgColor, setBgColor] = useState('#cccccc')
  const [headerBgColor, setHeaderBgColor] = useState('#f0f0f0')
  const [contentBgColor, setContentBgColor] = useState('#ffffff')
  const [textColor, setTextColor] = useState('#000000')
  const [copied, setCopied] = useState(false)

  // Check for missing required fields
  const missingFields = useMemo(() => {
    return fields.filter(f => f.required && !f.value.trim())
  }, [fields])

  // Update field value
  const updateField = (index, value) => {
    const newFields = [...fields]
    newFields[index].value = value
    setFields(newFields)
  }

  // Add new field
  const addField = () => {
    setFields([...fields, { key: '', value: '', required: false }])
  }

  // Update field key
  const updateFieldKey = (index, key) => {
    const newFields = [...fields]
    newFields[index].key = key
    setFields(newFields)
  }

  // Remove field
  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  // Get width string for HTML
  const getWidthString = () => {
    if (widthUnit === '%') {
      return tableWidth + '%'
    }
    return tableWidth
  }

  // Generate HTML
  const generatedHTML = useMemo(() => {
    const filledFields = fields.filter(f => f.key.trim() && f.value.trim())
    
    if (filledFields.length === 0) {
      return ''
    }

    const rows = filledFields.map(field => {
      // Convert newlines to <br>
      const valueWithBr = field.value.replace(/\n/g, '<br>\n')
      return `<tr>
<th width="${headerWidth}" align="center" bgcolor="${headerBgColor}"><font size="2" color="${textColor}">${field.key}</font></th>
<td width="${contentWidth}" bgcolor="${contentBgColor}"><font size="2" color="${textColor}">
${valueWithBr}<br>
</font></td>
</tr>`
    }).join('\n')

    return `<table width="${getWidthString()}" bgcolor="${bgColor}" cellspacing="1" cellpadding="3">
<tr>
<th colspan="2" align="center" bgcolor="${headerBgColor}"><b><font color="${textColor}">${tableTitle}</font></b></th>
</tr>
${rows}
</table>`
  }, [fields, tableTitle, tableWidth, widthUnit, headerWidth, contentWidth, bgColor, headerBgColor, contentBgColor, textColor])

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedHTML)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Parse text input (key/value format)
  const parseTextInput = (text) => {
    const lines = text.split('\n').filter(line => line.trim())
    const parsed = lines.map(line => {
      const separatorIndex = line.indexOf('/')
      if (separatorIndex > -1) {
        return {
          key: line.slice(0, separatorIndex).trim(),
          value: line.slice(separatorIndex + 1).trim(),
          required: false
        }
      }
      return null
    }).filter(Boolean)
    
    if (parsed.length > 0) {
      setFields(parsed)
    }
  }

  const [textInputMode, setTextInputMode] = useState(false)
  const [textInput, setTextInput] = useState('')

  return (
    <MainLayout title="HTML生成ツール">
      <div className="min-h-screen bg-slate-100 pb-32">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4">
          <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
            <span className="bg-rakuten-red px-2 py-0.5 rounded text-sm italic">PRO</span>
            HTML生成ツール
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Product Table Generator v2.0
          </p>
        </div>

        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Panel - Input */}
            <div className="space-y-6">
              {/* Table Settings */}
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                  <span className="text-rakuten-red">01.</span> テーブル設定
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Table Width */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">テーブル幅</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tableWidth}
                        onChange={(e) => setTableWidth(e.target.value)}
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="400"
                      />
                      <select
                        value={widthUnit}
                        onChange={(e) => setWidthUnit(e.target.value)}
                        className="border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white"
                      >
                        <option value="px">px</option>
                        <option value="%">%</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">PC: 400px / スマホ: 100%</p>
                  </div>

                  {/* Table Title */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">タイトル</label>
                    <input
                      type="text"
                      value={tableTitle}
                      onChange={(e) => setTableTitle(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="商品説明"
                    />
                  </div>

                  {/* Header Width */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">項目名の幅</label>
                    <input
                      type="text"
                      value={headerWidth}
                      onChange={(e) => setHeaderWidth(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="94"
                    />
                  </div>

                  {/* Content Width */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">内容の幅</label>
                    <input
                      type="text"
                      value={contentWidth}
                      onChange={(e) => setContentWidth(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="291"
                    />
                  </div>
                </div>

                {/* Color Settings */}
                <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">枠線色</label>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">ヘッダー背景</label>
                    <input
                      type="color"
                      value={headerBgColor}
                      onChange={(e) => setHeaderBgColor(e.target.value)}
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">内容背景</label>
                    <input
                      type="color"
                      value={contentBgColor}
                      onChange={(e) => setContentBgColor(e.target.value)}
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">文字色</label>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </section>

              {/* Input Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setTextInputMode(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                    !textInputMode 
                      ? 'bg-rakuten-red text-white' 
                      : 'bg-white text-slate-600 border border-slate-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm align-middle mr-1">edit_note</span>
                  フォーム入力
                </button>
                <button
                  onClick={() => setTextInputMode(true)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                    textInputMode 
                      ? 'bg-rakuten-red text-white' 
                      : 'bg-white text-slate-600 border border-slate-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm align-middle mr-1">text_snippet</span>
                  テキスト入力
                </button>
              </div>

              {/* Product Info Input */}
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                  <span className="text-rakuten-red">02.</span> 商品情報入力
                </h2>

                {textInputMode ? (
                  /* Text Input Mode */
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">
                      「項目名/内容」の形式で1行ずつ入力してください
                    </p>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className="w-full h-64 border border-slate-300 rounded-lg p-3 text-sm font-mono"
                      placeholder={`商品名/【MURA】リサイクルPUレザー 二つ折り財布
型番/w8724
カラー/チャコールグレー / グリーン / ピンク
サイズ/横幅：約11.5cm / 高さ：約8.5cm
素材/合成皮革(リサイクルPUレザー)
商品説明/お札が折れない二つ折り財布`}
                    />
                    <button
                      onClick={() => parseTextInput(textInput)}
                      className="w-full bg-primary text-white py-3 rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm align-middle mr-1">transform</span>
                      テキストを変換
                    </button>
                  </div>
                ) : (
                  /* Form Input Mode */
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <input
                          type="text"
                          value={field.key}
                          onChange={(e) => updateFieldKey(index, e.target.value)}
                          className={`w-28 shrink-0 border rounded-lg px-3 py-2 text-sm font-medium ${
                            field.required && !field.value.trim() 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-slate-300'
                          }`}
                          placeholder="項目名"
                        />
                        <textarea
                          value={field.value}
                          onChange={(e) => updateField(index, e.target.value)}
                          className={`flex-1 border rounded-lg px-3 py-2 text-sm min-h-[40px] resize-y ${
                            field.required && !field.value.trim() 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-slate-300'
                          }`}
                          placeholder="内容を入力"
                          rows={1}
                        />
                        <button
                          onClick={() => removeField(index)}
                          className="shrink-0 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addField}
                      className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-sm font-medium hover:border-primary hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm align-middle mr-1">add</span>
                      項目を追加
                    </button>
                  </div>
                )}

                {/* Missing Fields Warning */}
                {missingFields.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-bold text-amber-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      必須項目が未入力です
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      {missingFields.map(f => f.key).join('、')}
                    </p>
                  </div>
                )}
              </section>
            </div>

            {/* Right Panel - Preview & Output */}
            <div className="space-y-6">
              {/* Live Preview */}
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                  <span className="text-rakuten-red">03.</span> ライブプレビュー
                </h2>
                
                <div className="bg-slate-50 rounded-xl p-4 overflow-auto max-h-[500px]">
                  {generatedHTML ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: generatedHTML }}
                      className="html-preview"
                    />
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <span className="material-symbols-outlined text-4xl mb-2">table_chart</span>
                      <p>商品情報を入力するとプレビューが表示されます</p>
                    </div>
                  )}
                </div>
              </section>

              {/* HTML Output */}
              <section className="bg-slate-900 rounded-2xl p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white">
                    <span className="text-rakuten-red">04.</span> 生成HTML
                  </h2>
                  <span className="text-[10px] font-bold text-slate-500">
                    {generatedHTML.length} 文字
                  </span>
                </div>
                
                <div className="bg-slate-800 rounded-xl p-4 overflow-auto max-h-[300px]">
                  <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                    {generatedHTML || '// 商品情報を入力してください'}
                  </pre>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-72 p-4 bg-white/90 backdrop-blur-md border-t-2 border-slate-200 z-50">
          <div className="max-w-xl mx-auto flex gap-3">
            <button
              onClick={copyToClipboard}
              disabled={!generatedHTML}
              className={`flex-1 h-14 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                generatedHTML
                  ? 'bg-rakuten-red hover:bg-red-700 text-white shadow-lg'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined">
                {copied ? 'check' : 'content_copy'}
              </span>
              {copied ? 'コピーしました！' : 'HTMLをコピー'}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
