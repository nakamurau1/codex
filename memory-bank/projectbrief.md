# Project Brief: openai/codex と codex-rs

## プロジェクト全体 (openai/codex)

`openai/codex` は、ターミナルで動作する軽量なコーディングエージェントのプロジェクトです。
AIを活用して開発者のコーディング作業を支援することを目的としています。

## codex-rs (Rust実装)

`codex-rs` は、`openai/codex` プロジェクト内で開発されている、Codex CLIのRustによる再実装です。
現在のTypeScriptベースのCLIが持つNode.jsランタイムへの依存をなくし、よりポータブルで効率的なネイティブ実行ファイルの提供を目指しています。
