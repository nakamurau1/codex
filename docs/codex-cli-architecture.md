# Codex CLI アーキテクチャ概要

このドキュメントでは、`codex-cli` アプリケーションアーキテクチャの概要、主要コンポーネント、それらの相互作用、および主要な操作フローについて説明します。

## 主要コンポーネント

`codex-cli` は、インタラクティブなターミナルインターフェースに Ink を使用して構築された Node.js/TypeScript アプリケーションです。主要なコンポーネントは次のとおりです。

- **`cli.tsx` (エントリーポイント):**
  - `meow` を使用してコマンドライン引数を解析します。
  - インタラクティブモード (`App` コンポーネント経由) または非インタラクティブモード (`runQuietMode`, `runSinglePass`) でアプリケーションを起動します。
  - `utils/config.ts` 経由で初期設定を読み込みます。
- **`app.tsx` (コアUI & 状態管理):**
  - Ink ベースのTUIのメインReactコンポーネントです。
  - ライブ対話用の `TerminalChat` または以前のセッションを表示するための `TerminalChatPastRollout` をレンダリングします。
  - トップレベルのアプリケーション状態と `TerminalChat` に渡されるpropsを管理します。
  - Gitリポジトリ外で実行する際にユーザーに警告するロジックが含まれています。
- **`components/chat/terminal-chat.tsx` (インタラクティブチャットUI):**
  - ユーザーのチャット体験を担当するコアコンポーネントです。
  - 会話履歴 (ユーザープロンプト、AI応答、ツール呼び出し) の表示を管理します。
  - `AgentLoop` と統合して、ユーザー入力をAIに送信し、AI応答を処理します。
  - AIが提案したアクションを承認または拒否するためのユーザー入力を処理します。
- **`utils/agent/agent-loop.ts` (エージェントロジック):**
  - AIモデル (例: OpenAI) との会話ライフサイクルを管理します。
  - プロンプトを構築し、AIにリクエストを送信し、応答 (テキスト、ツール呼び出し) を処理します。
  - AIリクエストに基づいてツール実行 (例: シェルコマンド、ファイルパッチ) を調整します。
  - アクションが自動承認可能か、ユーザーの確認が必要かを判断するために `approvals.ts` と連携します。
  - MCP対応ツールと対話するために `McpClientManager` (または直接 `McpClientInstance`) と連携します。
- **`approvals.ts` (承認 & 安全性ロジック):**
  - AIが提案したコマンドとファイルパッチの安全性を評価する `canAutoApprove` 関数を提供します。
  - さまざまな承認ポリシー (`suggest`, `auto-edit`, `full-auto`) を実装します。
  - シェルコマンドを解析し、ファイル変更が許可された書き込み可能パス内にあるかどうかを確認するロジックが含まれています。
- **`mcp/config.ts` (`McpConfigLoader`):**
  - MCP (Model Context Protocol) サーバー設定をロード、マージ、検証します。
  - グローバル (`~/.codex/mcp_config.json`) およびプロジェクト (`./.codex/mcp_config.json`) の場所からJSON設定ファイルを読み込みます。
  - スキーマ検証に `zod` を使用し、設定の結合に `deepmerge` を使用します。
- **`mcp/instance.ts` (`McpClientInstance`):**
  - 単一のMCPサーバープロセスのライフサイクルを管理します。
  - ロードされた設定に基づいてサーバープロセスを起動します。
  - `@modelcontextprotocol/sdk` (`Client` および `StdioClientTransport`) を使用してサーバーへの接続を確立します。
  - サーバープロセスのイベント (stderr、exit、エラー) を監視します。
  - スクリプトファイルが変更された場合にサーバーを自動的に再起動するための `chokidar` ベースのファイル監視が含まれています。
  - MCPサーバーによって公開されるツールに接続、切断、および (最終的には) 呼び出すためのメソッドを提供します。
- **`utils/config.ts` (CLI設定):**
  - APIキー、デフォルトAIモデル、プロバイダーなどのグローバルCLI設定のロードとアクセスを処理します。
  - 環境変数や、場合によってはCLI固有の設定ファイルから読み込む可能性があります。

## クラス図

```mermaid
classDiagram
    direction LR

    Cli --> App
    Cli --> SinglePassRunner
    App --> TerminalChat
    App --> TerminalChatPastRollout
    TerminalChat --> AgentLoop
    TerminalChat --> ApprovalPolicy
    AgentLoop --> OpenAIClient
    AgentLoop --> McpClientManager
    AgentLoop --> ApprovalPolicy
    ApprovalPolicy ..> ApprovalsModule : uses
    McpClientManager o-- "*" McpClientInstance
    McpClientInstance --> McpServerProcess
    McpClientManager --> McpConfigLoader
    McpConfigLoader ..> McpConfigSchema : validates
    OpenAIClient ..> ConfigModule : uses

    class Cli {
        +main(args)
        -parseArguments(args)
        -runInteractiveMode()
        -runQuietMode()
        -runSinglePassMode()
    }

    class App {
        +render()
        -props: AppProps
        -state: AppState
    }

    class TerminalChat {
        +render()
        -props: TerminalChatProps
        -handleUserInput(input)
        -displayAiResponse(response)
    }

    class AgentLoop {
        +run(prompt, images)
        -sendRequestToAI(prompt, context)
        -processToolCalls(toolCalls)
        -executeCommand(commandConfirmation)
        -applyPatch(patch)
    }

    class ApprovalPolicy {
        +policyType: "suggest" | "auto-edit" | "full-auto"
    }

    class ApprovalsModule {
        +canAutoApprove(command, workdir, policy, writableRoots): SafetyAssessment
        +isSafeCommand(command): SafeCommandReason | null
    }

    class McpClientManager {
        +startAllServers()
        +stopAllServers()
        +getClient(serverName): McpClientInstance | undefined
        -instances: Map<string, McpClientInstance>
        -configLoader: McpConfigLoader
    }

    class McpClientInstance {
        +serverName: string
        +config: McpServerConfig
        +status: McpClientStatus
        +startServerProcess()
        +connect()
        +disconnect()
        +callTool(toolName, params)
        +dispose()
        -serverProcess: ChildProcess
        -client: McpSdkClient
        -fileWatcher: FSWatcher
        -_handleRestart()
    }

    class McpConfigLoader {
        +loadConfig(): McpConfig
        -_loadAndValidateConfigFile(filePath): McpConfig | null
    }

    class SinglePassRunner {
        +run(prompt, config)
    }

    class TerminalChatPastRollout {
        +render()
    }
    class OpenAIClient {
        +sendMessage(prompt, context)
    }
    class McpServerProcess {
        +stdin
        +stdout
        +stderr
    }
    class McpConfigSchema {
        +validate(data)
    }
    class ConfigModule {
        +getApiKey()
        +loadConfig()
    }
```

_注意: `McpClientManager` は、複数の `McpClientInstance` を管理するために `activeContext.md` に基づいて仮定されたクラスであり、まだ完全には実装されていない可能性があります。_

## シーケンス図

### 1. CLI起動と初期プロンプト (インタラクティブモード)

この図は、ユーザーがプロンプト付きで `codex` を実行してから、最初のAI応答が表示されるまでのフローを示しています。

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Cli_tsx as "cli.tsx"
    participant Config_ts as "utils/config.ts"
    participant App_tsx as "App (app.tsx)"
    participant TerminalChat_tsx as "TerminalChat"
    participant AgentLoop_ts as "AgentLoop"
    participant OpenAI_API as "OpenAI API"

    User->>Cli_tsx: $ codex "この関数をリファクタリングして"
    Cli_tsx->>Config_ts: loadConfig()
    Config_ts-->>Cli_tsx: appConfig
    Cli_tsx->>App_tsx: "render(<App config={appConfig} prompt=\\"リファクタリング...\\" />)"
    App_tsx->>TerminalChat_tsx: "render(<TerminalChat config prompt />)"
    TerminalChat_tsx->>AgentLoop_ts: loop = new AgentLoop(config)
    TerminalChat_tsx->>AgentLoop_ts: loop.run("この関数をリファクタリングして", [])
    AgentLoop_ts->>OpenAI_API: sendMessage("この関数をリファクタリングして", context)
    OpenAI_API-->>AgentLoop_ts: AI応答 (例: テキスト, tool_calls)
    AgentLoop_ts-->>TerminalChat_tsx: displayResponse(aiResponse)
    TerminalChat_tsx-->>User: (AI応答を表示)
```

### 2. AIによるコマンド提案とユーザー承認 (インタラクティブモード)

この図は、AIがシェルコマンドを提案し、ユーザーに承認を求めるプロセスを示しています。

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant TerminalChat_tsx as "TerminalChat"
    participant AgentLoop_ts as "AgentLoop"
    participant Approvals_ts as "approvals.ts"
    participant OS as "オペレーティングシステム"
    participant OpenAI_API as "OpenAI API"

    Note over AgentLoop_ts, OpenAI_API: 前のAI応答にはtool_call (例: run_shell_command) が含まれていた
    AgentLoop_ts->>Approvals_ts: canAutoApprove(commandDetails, workdir, policy, writableRoots)
    Approvals_ts-->>AgentLoop_ts: { type: "ask-user" } ('suggest' または 'auto-edit' ポリシーで、コマンドが自明に安全でない場合を想定)
    AgentLoop_ts-->>TerminalChat_tsx: requestUserConfirmation(commandDetails)
    TerminalChat_tsx-->>User: (提案されたコマンドを表示し、承認を求める [y/n/edit/details])
    User->>TerminalChat_tsx: y (承認)
    TerminalChat_tsx->>AgentLoop_ts: userApprovedCommand()
    AgentLoop_ts->>OS: spawn(command)
    OS-->>AgentLoop_ts: commandOutput (stdout, stderr, exitCode)
    AgentLoop_ts->>OpenAI_API: sendToolResult(toolCallId, commandOutput)
    OpenAI_API-->>AgentLoop_ts: 新しいAI応答 (コマンド結果に基づく)
    AgentLoop_ts-->>TerminalChat_tsx: displayResponse(newAiResponse)
    TerminalChat_tsx-->>User: (新しいAI応答を表示)
```

### 3. MCPサーバーとの対話 (MCP経由のツール呼び出し)

この図は、`codex-cli` がModel Context Protocolを介して外部ツールと対話する方法を示しています。

```mermaid
sequenceDiagram
    participant TerminalChat_tsx as "TerminalChat"
    participant AgentLoop_ts as "AgentLoop"
    participant McpClientManager_ts as "McpClientManager (仮)"
    participant McpConfigLoader_ts as "McpConfigLoader (mcp/config.ts)"
    participant McpClientInstance_ts as "McpClientInstance (mcp/instance.ts)"
    participant McpServerProcess_js as "MCPサーバープロセス (例: my_tool_server.js)"
    participant McpSdkClient as "@modelcontextprotocol/sdk Client"
    participant OpenAI_API as "OpenAI API"


    %% AgentLoopがMCPツールと対話する必要がある %%
    Note over AgentLoop_ts, OpenAI_API: AI応答には "my_mcp_server.some_tool" のtool_callが含まれている

    AgentLoop_ts->>McpClientManager_ts: getClient("my_mcp_server")
    alt "my_mcp_server" インスタンスがまだ作成されていないか、接続されていない場合
        McpClientManager_ts->>McpConfigLoader_ts: loadConfig()
        McpConfigLoader_ts-->>McpClientManager_ts: mcpConfig
        McpClientManager_ts->>McpClientInstance_ts: createInstance("my_mcp_server", serverConfigFromMcpConfig)
        McpClientManager_ts->>McpClientInstance_ts: instance.startServerProcess()
        McpClientInstance_ts->>McpServerProcess_js: spawn(serverConfig.command)
        McpClientInstance_ts->>McpClientInstance_ts: instance.connect()
        McpClientInstance_ts->>McpSdkClient: transport = new StdioClientTransport(serverProcess)
        McpClientInstance_ts->>McpSdkClient: client = new Client(transport)
        McpSdkClient->>McpServerProcess_js: (STDIN/STDOUT経由のMCPハンドシェイク)
        McpServerProcess_js-->>McpSdkClient: (MCPハンドシェイク応答)
        McpSdkClient-->>McpClientInstance_ts: 接続Promiseが解決
        McpClientInstance_ts-->>McpClientManager_ts: instance (接続済み)
    end
    McpClientManager_ts-->>AgentLoop_ts: mcpClientInstance (接続済み)

    AgentLoop_ts->>McpClientInstance_ts: callTool("some_tool", paramsFromAi)
    McpClientInstance_ts->>McpSdkClient: client.call("some_tool", paramsFromAi)
    McpSdkClient->>McpServerProcess_js: (STDIN経由のMCPツール呼び出しリクエスト)
    McpServerProcess_js-->>McpSdkClient: (STDOUT経由のMCPツール呼び出し応答)
    McpSdkClient-->>McpClientInstance_ts: toolResponse
    McpClientInstance_ts-->>AgentLoop_ts: toolResponse
    AgentLoop_ts->>OpenAI_API: sendToolResult(toolCallId, toolResponse)
    OpenAI_API-->>AgentLoop_ts: 新しいAI応答
    AgentLoop_ts-->>TerminalChat_tsx: displayResponse(newAiResponse)
```

この概要は、`codex-cli` のアーキテクチャを理解するための良い出発点となるはずです。詳細については、それぞれのソースファイルを確認してください。
