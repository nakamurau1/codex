# 技術コンテキスト

**主要言語:**

- Rust (`codex-rs`)
- TypeScript/JavaScript (Node.js for `codex-cli`)

**パッケージ/依存関係管理:**

- PNPM (Node.js/TypeScript ワークスペース用)
- Cargo (Rust 用)
- Nix (`flake.nix` による開発環境プロビジョニング用)

**主要なフレームワーク/ライブラリ (推測):**

- Node.js (CLI のランタイム)
- `codex-cli` 内で引数解析、API リクエスト、ターミナル対話のためのライブラリの可能性。
- `codex-rs` 内で OS 対話、プロセス管理、サンドボックス化のための Rust 標準ライブラリおよびクレート。
- `mcp-types` (MCP プロトコル型のための内部 Rust クレート)。
- `mcp-server` (基本的な MCP サーバーのための内部 Rust クレート)。
- Serde (シリアライズ/デシリアライズのための Rust ライブラリ、`mcp-types` および `mcp-server` で多用)。

**開発環境:**

- **OS:** macOS 12+, Ubuntu 20.04+/Debian 10+, Windows 11 (WSL2 経由)。
- **Node.js:** バージョン 22 以降が必要。
- **Git:** バージョン 2.23+ 推奨。
- **Nix:** `flake.nix` 開発環境を使用するために必要。

**外部依存関係/API:**

- OpenAI API (または互換プロバイダー: OpenRouter, Gemini, Ollama, Mistral など) - API キーが必要。
- Model Context Protocol (MCP) サーバー (統合予定)。

**ツール:**

- Prettier (コードフォーマット)
- Husky (Git フック)
- git-cliff (変更履歴生成)
- Python (`generate_mcp_types.py` スクリプトで使用)。
