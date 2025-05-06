# 進捗状況

**現在のステータス:** 実験的、活発な開発中。

**動作するもの (README に基づく):**

- `npm install -g @openai/codex` によるインストール。
- 基本的な CLI 実行（対話モード `codex`、プロンプトモード `codex "..."`）。
- API キー設定（環境変数、`.env` ファイル）。
- `--provider` フラグまたは設定による複数 AI プロバイダーのサポート。
- セキュリティサンドボックス化（macOS Seatbelt、Linux は Docker 推奨）。
- 承認モード（`Suggest`, `Auto Edit`, `Full Auto`）。
- `codex.md` からの指示読み込み。
- 非対話モード (`--quiet`)。
- 内部 MCP インフラストラクチャ (Rust): プロトコル型のための `mcp-types` クレートと基本的なテストサーバーのための `mcp-server` が存在する。
- Codex は自身の開発に貢献するために成功裏に使用されている（例: `mcp-types` の生成）。
- MCPクライアント設定ローダー (`McpConfigLoader`) の実装とテスト。`timeoutSeconds` 設定も含む。

**構築が必要なもの / 次のステップ:**

- **Model Context Protocol (MCP) クライアント統合 (TypeScript):**
  - **完了:** 設計書 (`docs/mcp_client_integration_design.md`) の主要部分作成と更新 (`timeoutSeconds`、ファイル監視の設計追加)、`McpConfigLoader` の実装とテスト (`timeoutSeconds` 対応済み)。`@modelcontextprotocol/sdk` インストール済み。
  - **現在のフェーズ:** `McpClientInstance` の実装中。
    - `startServerProcess` メソッドの堅牢化（エラーハンドリング、状態遷移改善、エラー/STDERR記録）。
    - `chokidar` を利用したファイル監視機能の基本的な仕組みと、ファイル変更検知時の自動再起動ロジック（デバウンス処理含む `_handleRestart` メソッド）を実装。
    - 自動再起動に必要な `connect()` および `disconnect()` メソッドのプレースホルダー（ログ出力と状態遷移のみ）を実装。
    - インスタンス破棄のための `dispose()` メソッドを追加（ファイルウォッチャーとプロセスのクリーンアップ）。
  - **残タスク:**
    - `McpClientInstance`:
      - `connect()` メソッドの本格実装: `@modelcontextprotocol/sdk` の `Client` と `StdioClientTransport` を使用し、サーバープロセスとのMCP接続確立、ハンドシェイク処理（capabilityネゴシエーション含む）、設定された `timeoutSeconds` を考慮したタイムアウト処理を実装する。
      - `disconnect()` メソッドの本格実装: MCP接続の切断、トランスポートのクローズ、関連リソース（クライアント、トランスポート、サーバープロセス、ファイルウォッチャー）の完全なクリーンアップを実装する。
      - ツール/リソース対話メソッド (`listTools`, `callTool` など) を実装する。ここでも `timeoutSeconds` を考慮する。
    - `McpClientManager` の実装。
    - `AgentLoop` との連携。
    - 関連テスト（特に `McpClientInstance` の接続・切断・再起動フロー）。
    - エラーハンドリング/セキュリティの詳細実装。
- **マルチモーダル入力処理:** README でサポートが言及されているが、設計/実装は未着手。
- **機能改善/バグ修正:** README の TODO や Issue Tracker に記載されている可能性のある項目。
- **ドキュメント:** MCP 機能に関するユーザー向けドキュメントの作成。
- **テストカバレッジ:** 全体的なテストカバレッジの向上、特にサンドボックスや OS 固有の動作に関する部分。
- **洗練と安定化:** 実験的なプロジェクトとして、バグ修正、機能完成、安定化のための継続的な作業が必要。
- **サンドボックス化の強化 (Linux):** Docker が推奨されているが、組み込みのサンドボックス化が検討される可能性あり。
- **ネットワークホワイトリスト化:** README で将来的に特定のネットワーク対応コマンドを許可する計画が言及されている。

**既知の問題/課題:**

- 実験的であるため、バグや未完成の機能が予想される。
- サンドボックス化の有効性やクロスプラットフォームの一貫性には継続的な注意が必要な場合がある。
