/**
 * Google Sheets API Service
 * 
 * Handles all Google Sheets API interactions for data synchronization.
 * Uses direct fetch with API key for public/shared sheets.
 * For private sheets, OAuth2 would be needed (not implemented here).
 * 
 * Documentation: https://developers.google.com/sheets/api/reference/rest
 */

// Configuration
let config = {
    apiKey: '',
    spreadsheetId: '',
    baseUrl: 'https://sheets.googleapis.com/v4/spreadsheets'
}

/**
 * Configure the Sheets service with API credentials
 */
export function configure(apiKey, spreadsheetId) {
    config.apiKey = apiKey
    config.spreadsheetId = spreadsheetId
    // Persist to localStorage
    localStorage.setItem('sheets_config', JSON.stringify({ apiKey, spreadsheetId }))
}

/**
 * Load configuration from localStorage
 */
export function loadConfig() {
    const saved = localStorage.getItem('sheets_config')
    if (saved) {
        const parsed = JSON.parse(saved)
        config.apiKey = parsed.apiKey || ''
        config.spreadsheetId = parsed.spreadsheetId || ''
    }
    return config
}

/**
 * Check if the service is configured
 */
export function isConfigured() {
    return Boolean(config.apiKey && config.spreadsheetId)
}

/**
 * Make a request to Google Sheets API
 */
async function apiRequest(endpoint, options = {}) {
    if (!config.apiKey) {
        throw new Error('Google Sheets API key not configured')
    }

    const separator = endpoint.includes('?') ? '&' : '?'
    const url = `${config.baseUrl}${endpoint}${separator}key=${config.apiKey}`

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`Google Sheets API error: ${response.status} - ${error.error?.message || response.statusText}`)
    }

    return response.json()
}

/**
 * Get spreadsheet metadata
 */
export async function getSpreadsheet(spreadsheetId = config.spreadsheetId) {
    if (!spreadsheetId) {
        throw new Error('Spreadsheet ID not configured')
    }
    return apiRequest(`/${spreadsheetId}`)
}

/**
 * Get values from a specific range
 */
export async function getRange(range, spreadsheetId = config.spreadsheetId) {
    if (!spreadsheetId) {
        throw new Error('Spreadsheet ID not configured')
    }
    return apiRequest(`/${spreadsheetId}/values/${encodeURIComponent(range)}`)
}

/**
 * Get all values from a sheet
 */
export async function getSheet(sheetName, spreadsheetId = config.spreadsheetId) {
    return getRange(sheetName, spreadsheetId)
}

/**
 * Parse sheet data into objects using first row as headers
 */
export function parseSheetData(data) {
    if (!data.values || data.values.length < 2) {
        return []
    }

    const [headers, ...rows] = data.values

    return rows.map(row => {
        const obj = {}
        headers.forEach((header, index) => {
            obj[header] = row[index] || ''
        })
        return obj
    })
}

/**
 * Get tasks from a "タスク" or "Tasks" sheet
 */
export async function getTasks(sheetName = 'タスク', spreadsheetId = config.spreadsheetId) {
    const data = await getRange(sheetName, spreadsheetId)
    return parseSheetData(data)
}

/**
 * Get product data from a sheet
 */
export async function getProducts(sheetName = '商品', spreadsheetId = config.spreadsheetId) {
    const data = await getRange(sheetName, spreadsheetId)
    return parseSheetData(data)
}

/**
 * Batch get multiple ranges
 */
export async function batchGet(ranges, spreadsheetId = config.spreadsheetId) {
    if (!spreadsheetId) {
        throw new Error('Spreadsheet ID not configured')
    }

    const rangesParam = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&')
    return apiRequest(`/${spreadsheetId}/values:batchGet?${rangesParam}`)
}

/**
 * For write operations, you need OAuth2 authentication.
 * Since this is a client-side app, we provide a stub that returns an error.
 * For production, you would need:
 * 1. A backend proxy that handles OAuth2
 * 2. Or use Google Identity Services for client-side OAuth2
 */
export async function appendRow(sheetName, values, spreadsheetId = config.spreadsheetId) {
    // Note: This requires OAuth2 authentication, not just API key
    // API key only allows read access to public/shared sheets
    throw new Error(
        'Write operations require OAuth2 authentication. ' +
        'Please use a backend proxy or implement Google Identity Services.'
    )
}

/**
 * Update a specific range (requires OAuth2)
 */
export async function updateRange(range, values, spreadsheetId = config.spreadsheetId) {
    throw new Error(
        'Write operations require OAuth2 authentication. ' +
        'Please use a backend proxy or implement Google Identity Services.'
    )
}

// Export service object
export default {
    configure,
    loadConfig,
    isConfigured,
    getSpreadsheet,
    getRange,
    getSheet,
    parseSheetData,
    getTasks,
    getProducts,
    batchGet,
    appendRow,
    updateRange
}
