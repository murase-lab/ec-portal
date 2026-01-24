---
description: 本番環境へのデプロイ方法
---

# 本番環境へのデプロイ

このプロジェクトはCloudflare Pagesで自動デプロイされています。

## デプロイ手順

1. 変更をステージングに追加
```bash
git add .
```

2. 変更をコミット（適切なコミットメッセージを記載）
```bash
git commit -m "feat: 機能の説明"
```

// turbo
3. GitHubにプッシュ
```bash
git push origin main
```

4. Cloudflare Pagesが自動的にビルドとデプロイを実行します（通常2-3分で完了）

## デプロイ設定

- **リポジトリ**: `murase-lab/ec-portal`
- **ブランチ**: `main`
- **ビルドコマンド**: `npm run build`
- **出力ディレクトリ**: `dist`
- **デプロイサービス**: Cloudflare Pages

## デプロイ確認

Cloudflare Pagesのダッシュボードでデプロイの進捗状況を確認できます:
https://dash.cloudflare.com/

## ローカル確認

デプロイ前にローカルでビルドを確認する場合:

```bash
npm run build
npm run preview
```
