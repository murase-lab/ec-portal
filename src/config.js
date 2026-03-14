/**
 * API設定
 * - ローカル開発: Viteプロキシ経由 → /api/heatmap
 * - 本番: 環境変数 VITE_HEATMAP_API_URL → Railway等のURL
 */
export const HEATMAP_API_BASE = import.meta.env.VITE_HEATMAP_API_URL || '/api/heatmap'
