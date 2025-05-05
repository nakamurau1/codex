# アクティブコンテキスト

**現在の目標:** Codex CLI 内での Model Context Protocol (MCP) サーバーとの対話サポートを実装する。

**目的:** Codex CLI が MCP サーバー経由で公開される外部ツールやデータソースを活用できるようにし、基本的なファイル操作やコード実行を超える能力に拡張する。

**最近のアクティビティ:**

- MCP クライアント統合設計書 (`docs/mcp_client_integration_design.md`) を作成・更新した。
- `McpConfigLoader` クラス (`codex-cli/src/mcp/config.ts`) を実装し、設定ファイルの読み込み、バリデーション、マージ機能を追加した。
- `McpConfigLoader` の単体テスト (`codex-cli/tests/mcp/config.test.ts`) を作成し、パスすることを確認した。
- `@modelcontextprotocol/sdk` パッケージを `codex-cli` にインストールした。
- `McpClientInstance` クラス (`codex-cli/src/mcp/instance.ts`) の基本的な骨組み（コンストラクタ、状態変数）を実装した。

**次のステップ:**

1.  **実装フェーズ:**
    - `McpClientInstance` クラス (`codex-cli/src/mcp/instance.ts`) の実装を進める:
      - サーバープロセス起動ロジック (`startServerProcess` メソッド) を実装する。
      - 接続 (`connect`) および切断 (`disconnect`) メソッドを実装する。
      - ツール/リソース対話メソッド (`listTools`, `callTool` など) を実装する。
    - `McpClientManager` クラス (`codex-cli/src/mcp/manager.ts`) を実装し、`McpConfigLoader` と `McpClientInstance` を利用して複数サーバーを管理する。
    - `AgentLoop` との連携部分を実装する。
    - 必要なテストを追加する。
2.  **設計の継続:** 実装を進めながら、必要に応じて設計書を更新する。
