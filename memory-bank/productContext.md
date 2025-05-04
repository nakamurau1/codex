# Product Context: OpenAI Codex CLI

**Target Audience:** Developers who primarily work within the terminal environment.

**Problem Solved:** Bridges the gap between conversational AI capabilities (like ChatGPT) and practical development workflows. Allows developers to leverage AI for reasoning *and* direct action (code execution, file manipulation) within their existing terminal setup, without needing to switch contexts frequently.

**Core Value Proposition:** Enables "chat-driven development" by providing an AI agent that understands the repository context and can execute tasks under version control.

**Key Features (as described in README):**
*   Zero setup (requires only an API key).
*   Secure execution via sandboxing (network-disabled by default, directory-restricted).
*   Multiple approval modes (`Suggest`, `Auto Edit`, `Full Auto`) for varying levels of autonomy.
*   Multimodal input capabilities (accepts screenshots/diagrams - though implementation details TBD).
*   Support for various AI providers (OpenAI, Gemini, Ollama, etc.).
*   Project-specific context via `codex.md` files.
*   Non-interactive mode for CI/CD integration.
*   Open-source development model.