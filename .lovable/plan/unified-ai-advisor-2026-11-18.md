# Unified AI Advisor

## Goal
Make `/chat` the single AI Advisor experience: natural-language requests, guided full-market analysis, trading research, and result artifacts all live in one conversation workspace.

## User experience
- Replace the separate Agent/Markets/Strategy workspace tabs with one Advisor surface alongside the conversation.
- Add a compact advisor toolbar for asset selection, full analysis, conversation history, and supporting market/strategy tools that open without leaving the advisor.
- Route both ordinary research prompts and trading workflows through the existing agent capabilities; keep streamed progress, clarifying questions, and structured artifacts in the same conversation.
- Preserve desktop/mobile layouts, deep links to market/strategy tools, and existing conversation history.
- Persist completed full-analysis output and actionable tool results in the current conversation so reloads do not split the workflow.

## Technical approach
- Consolidate the chat and full-analysis entry points at the `/chat` page while retaining the existing analyst and trading tools; do not merge billing behavior or remove working tools.
- Use the AI Gateway SDK for server-side model calls in the unified agent path, following its model/surface contracts, streaming events, error handling, and workspace defaults.
- Keep authentication, per-tool credit checks, and server-side authorization in their current trusted boundaries; do not move AI calls or privileged logic into browser code.
- Keep user input and partial results visible after recoverable errors; maintain compatibility with prior stored chat artifacts.

## Validation
- Verify ordinary market research, a full-analysis action, and a trading workflow all appear in the same chat with progress and readable artifacts.
- Verify first-message conversation creation, history reload, and desktop/mobile navigation.
- Run edge-function tests and check app/edge-function diagnostics; authenticated end-to-end checks depend on the project's external Supabase auth availability.
