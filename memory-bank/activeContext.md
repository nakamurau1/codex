# アクティブコンテキスト

**現在の目標:** Codex CLI 内での Model Context Protocol (MCP) サーバーとの対話サポートを実装する。

**目的:** Codex CLI が MCP サーバー経由で公開される外部ツールやデータソースを活用できるようにし、基本的なファイル操作やコード実行を超える能力に拡張する。

**最近のアクティビティ:**

- MCP クライアント統合設計書 (`docs/mcp_client_integration_design.md`) を作成・更新した。
  - サーバー実行ファイルの変更監視と自動再起動、およびタイムアウト設定に関する記述を追加。
- `McpConfigLoader` クラス (`codex-cli/src/mcp/config.ts`) を実装・テストし、設定ファイルの読み込み、バリデーション（`timeoutSeconds` 含む）、マージ機能を追加した。
- `@modelcontextprotocol/sdk` パッケージを `codex-cli` にインストール済み。
- `McpClientInstance` クラス (`codex-cli/src/mcp/instance.ts`) の実装を進めた:
  - `startServerProcess` メソッドを堅牢化（エラーハンドリング、状態遷移の改善、STDERRやエラーメッセージの内部記録）。
  - `chokidar` を利用したファイル監視機能の基本的な仕組みを導入（監視対象ファイルの特定、変更検知時のログ出力）。
  - ファイル変更検知時の自動再起動ロジックを `_handleRestart` メソッドとして実装（デバウンス処理含む）。
  - 自動再起動に必要な `connect()` および `disconnect()` メソッドのプレースホルダー（ログ出力と状態遷移のみ）を実装。
  - インスタンス破棄のための `dispose()` メソッドを追加（ファイルウォッチャーとプロセスのクリーンアップ）。

**次のステップ:**

1.  **実装フェーズ:**
    - `McpClientInstance` クラス (`codex-cli/src/mcp/instance.ts`) の実装を継続:
      - `connect()` メソッドを本格実装: `@modelcontextprotocol/sdk` の `Client` と `StdioClientTransport` を使用し、サーバープロセスとのMCP接続確立、ハンドシェイク処理（capabilityネゴシエーション含む）、設定された `timeoutSeconds` を考慮したタイムアウト処理を実装する。
      - `disconnect()` メソッドを本格実装: MCP接続の切断、トランスポートのクローズ、関連リソース（クライアント、トランスポート、サーバープロセス、ファイルウォッチャー）の完全なクリーンアップを実装する。
      - ツール/リソース対話メソッド (`listTools`, `callTool` など) を実装する。ここでも `timeoutSeconds` を考慮する。
    - `McpClientManager` クラス (`codex-cli/src/mcp/manager.ts`) を実装し、`McpConfigLoader` と `McpClientInstance` を利用して複数サーバーを管理する。
    - `AgentLoop` との連携部分を実装する。
    - 必要なテスト（特に `McpClientInstance` の接続・切断・再起動フロー）を追加する。
2.  **設計の継続:** 実装を進めながら、必要に応じて設計書を更新する。
