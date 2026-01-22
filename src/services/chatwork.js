/**
 * Chatwork API Service
 * 
 * Handles all Chatwork API interactions for task management.
 * Documentation: https://developer.chatwork.com/reference
 */

// Configuration - These should be set via environment variables or Settings page
let config = {
    apiToken: '',
    roomId: '',
    baseUrl: 'https://api.chatwork.com/v2'
}

/**
 * Configure the Chatwork service with API credentials
 */
export function configure(apiToken, roomId) {
    config.apiToken = apiToken
    config.roomId = roomId
    // Persist to localStorage
    localStorage.setItem('chatwork_config', JSON.stringify({ apiToken, roomId }))
}

/**
 * Load configuration from localStorage
 */
export function loadConfig() {
    const saved = localStorage.getItem('chatwork_config')
    if (saved) {
        const parsed = JSON.parse(saved)
        config.apiToken = parsed.apiToken || ''
        config.roomId = parsed.roomId || ''
    }
    return config
}

/**
 * Check if the service is configured
 */
export function isConfigured() {
    return Boolean(config.apiToken && config.roomId)
}

/**
 * Make an authenticated request to Chatwork API
 */
async function apiRequest(endpoint, options = {}) {
    if (!config.apiToken) {
        throw new Error('Chatwork API token not configured')
    }

    const response = await fetch(`${config.baseUrl}${endpoint}`, {
        ...options,
        headers: {
            'X-ChatWorkToken': config.apiToken,
            'Content-Type': 'application/x-www-form-urlencoded',
            ...options.headers
        }
    })

    if (!response.ok) {
        throw new Error(`Chatwork API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
}

/**
 * Get rooms list
 */
export async function getRooms() {
    return apiRequest('/rooms')
}

/**
 * Get tasks from a room
 */
export async function getTasks(roomId = config.roomId) {
    if (!roomId) {
        throw new Error('Room ID not configured')
    }
    return apiRequest(`/rooms/${roomId}/tasks`)
}

/**
 * Create a new task in a room
 */
export async function createTask(roomId = config.roomId, data) {
    if (!roomId) {
        throw new Error('Room ID not configured')
    }

    const body = new URLSearchParams({
        body: data.body,
        to_ids: data.toIds.join(','),
        limit_type: data.limitType || 'none'
    })

    if (data.limitDate) {
        body.append('limit', Math.floor(new Date(data.limitDate).getTime() / 1000))
    }

    return apiRequest(`/rooms/${roomId}/tasks`, {
        method: 'POST',
        body: body.toString()
    })
}

/**
 * Update task status (open/done)
 */
export async function updateTaskStatus(roomId = config.roomId, taskId, status) {
    if (!roomId) {
        throw new Error('Room ID not configured')
    }

    const body = new URLSearchParams({
        body: status // 'open' or 'done'
    })

    return apiRequest(`/rooms/${roomId}/tasks/${taskId}/status`, {
        method: 'PUT',
        body: body.toString()
    })
}

/**
 * Send a message to a room (for notifications)
 */
export async function sendMessage(roomId = config.roomId, message) {
    if (!roomId) {
        throw new Error('Room ID not configured')
    }

    const body = new URLSearchParams({
        body: message,
        self_unread: 0
    })

    return apiRequest(`/rooms/${roomId}/messages`, {
        method: 'POST',
        body: body.toString()
    })
}

/**
 * Get my account info (for testing connection)
 */
export async function getMe() {
    return apiRequest('/me')
}

/**
 * Get room members
 */
export async function getRoomMembers(roomId = config.roomId) {
    if (!roomId) {
        throw new Error('Room ID not configured')
    }
    return apiRequest(`/rooms/${roomId}/members`)
}

// Export service object
export default {
    configure,
    loadConfig,
    isConfigured,
    getRooms,
    getTasks,
    createTask,
    updateTaskStatus,
    sendMessage,
    getMe,
    getRoomMembers
}
