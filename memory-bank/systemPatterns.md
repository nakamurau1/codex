# System Patterns: codex-rs

## プロジェクト構造

`codex-rs` は、RustのCargoワークスペースとして構成されています。
ルートディレクトリ (`codex-rs/`) にワークスペース全体の `Cargo.toml` があり、複数のクレート (サブプロジェクト) を含んでいます。

## 主要クレート

`codex-rs/README.md` によると、主要なクレートとその役割は以下の通りです。

- **`core/`**: Codexの主要なビジネスロジックを格納。将来的には汎用ライブラリとしての利用も視野。
- **`cli/`**: メインとなるCLIツール。他のCLI (`exec`, `tui`) をサブコマンドとして提供するマルチツール。
- **`exec/`**: 自動化用途向けの「ヘッドレス」なCLI。
- **`tui/`**: [Ratatui](https://ratatui.rs/) を使用して構築された、フルスクリーンのTUI (Text User Interface) を提供するCLI。
- **`common/`**: 複数のクレートで共有される共通の機能や型定義など。
- **`mcp-client/`, `mcp-server/`, `mcp-types/`**: MCP (Multi-Capability Protocol) サーバー/クライアント通信に関連するクレート群。
- **`apply-patch/`**: パッチ適用に関連する機能。
- **`ansi-escape/`**: ANSIエスケープシーケンスの処理に関連する機能。
- **`execpolicy/`**: コマンド実行ポリシーに関連する機能。

## 設定

CLIの動作は `~/.codex/config.toml` ファイルを通じて設定可能です。
これには、使用モデル、コマンド実行承認ポリシー、サンドボックス権限、MCPサーバーリストなどが含まれます。
