/**
 * API Services Index
 * 
 * Central export for all API services.
 * Provides unified initialization and status checking.
 */

import chatwork from './chatwork'
import sheets from './sheets'

/**
 * Initialize all services by loading saved configurations
 */
export function initializeServices() {
    chatwork.loadConfig()
    sheets.loadConfig()
}

/**
 * Get status of all services
 */
export function getServicesStatus() {
    return {
        chatwork: {
            configured: chatwork.isConfigured(),
            name: 'Chatwork'
        },
        sheets: {
            configured: sheets.isConfigured(),
            name: 'Google Sheets'
        }
    }
}

/**
 * Test Chatwork connection
 */
export async function testChatworkConnection() {
    try {
        const me = await chatwork.getMe()
        return { success: true, data: me }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Test Google Sheets connection
 */
export async function testSheetsConnection() {
    try {
        const spreadsheet = await sheets.getSpreadsheet()
        return { success: true, data: spreadsheet }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export { chatwork, sheets }

export default {
    chatwork,
    sheets,
    initializeServices,
    getServicesStatus,
    testChatworkConnection,
    testSheetsConnection
}
