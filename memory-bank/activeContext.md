# アクティブコンテキスト

**現在の目標:** Codex CLI 内での Model Context Protocol (MCP) サーバーとの対話サポートを実装する。

**目的:** Codex CLI が MCP サーバー経由で公開される外部ツールやデータソースを活用できるようにし、基本的なファイル操作やコード実行を超える能力に拡張する。

**最近のアクティビティ:**

- 初期の MCP クライアント統合設計書 (`docs/mcp_client_integration_design.md`) を作成し、「目的」「サーバー設定方法」「クライアント実装詳細（クラス構造、AgentLoop連携）」セクションを日本語で記述した。
- `AgentLoop` 内で `McpClientManager` を呼び出す具体的な箇所（コンストラクタ、run、handleFunctionCall、terminate/cancel）を特定した。

**次のステップ:**

1.  **設計フェーズ:** 設計書 (`docs/mcp_client_integration_design.md`) に、エラーハンドリング、セキュリティ、テスト計画などの残りの項目を記述し続ける。
2.  **実装フェーズ:** 設計に基づき:
    - `codex-cli` (TypeScript) コードベース内の適切なモジュール/ファイルを特定する。
    - TypeScript で主要な MCP クライアント機能を実装する (`@modelcontextprotocol/ts-client` を使用)。
    - MCP ツール呼び出しをエージェントの推論および実行ループに統合する。
    - 新機能のテストを追加する。
3.  (任意) 既存の `mcp-server` Rust クレートをクライアント開発中のローカルテストハーネスとして使用することを検討する。
