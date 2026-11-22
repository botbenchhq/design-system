# Agent activity UI: patterns dossier (research date 2026-11-22)

Method: public docs and component source read via fetch. Items marked [UNVERIFIED] could not be confirmed from a public page in this session. Sources are cited inline. Where a page summary came through a summarising fetcher, quoted strings are as reported by it; re-check before shipping copy verbatim.

## 1. Per-product findings

### 1.1 Vercel AI SDK UI and AI Elements (licences: AI SDK Apache-2.0 [from memory, unverified this session]; AI Elements components are copied into your repo via the shadcn registry, check repo licence)
Sources: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage ; https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat ; https://elements.ai-sdk.dev/components/tool ; source at https://github.com/vercel/ai-elements/tree/main/packages/elements/src (tool.tsx, reasoning.tsx, confirmation.tsx, conversation.tsx, shimmer.tsx, chain-of-thought.tsx, task.tsx, queue.tsx, plan.tsx, sources.tsx).
Note: Kibo UI's AI components URL now redirects to AI Elements, so Kibo AI is effectively folded in.

Tool part states (current AI SDK, 7 states): `input-streaming`, `input-available`, `approval-requested`, `approval-responded`, `output-available`, `output-error`, `output-denied`. Docs say to handle approval and denial states exhaustively even for tools without approval. Approval: server `toolApproval` maps tool name to `'user-approval'` (`needsApproval` deprecated); `part.approval = {id, approved?, reason?, isAutomatic?}`; client calls `addToolApprovalResponse({id, approved})`; automatic decisions also pass through `approval-requested` with `isAutomatic === true`.

Chat status (separate from tool state): `submitted`, `streaming`, `ready`, `error`. Functions: `stop`, `regenerate`, `resumeStream` (resume after network error, optionally on mount / page visible again).

Tool component anatomy (tool.tsx): Collapsible card (`border rounded-md`), `ToolHeader` is the trigger: wrench icon, tool name (derived from type, or `toolName` for dynamic tools), a pill Badge with status text and icon, chevron rotating 180 degrees via `data-state=open`. `ToolContent` has `ToolInput` ("Parameters" heading, JSON code block) and `ToolOutput` ("Result", or "Error" when errorText; error text above output; null when neither). Default closed (Collapsible default; caller passes `defaultOpen`). Always visible: icon, name, status badge. Behind disclosure: input JSON and output.

Status label / icon / colour table (verbatim from source):
- input-streaming: "Pending", circle icon, no colour
- input-available: "Running", clock icon, `animate-pulse`
- approval-requested: "Awaiting Approval", clock, yellow-600
- approval-responded: "Responded", check-circle, blue-600
- output-available: "Completed", check-circle, green-600
- output-denied: "Denied", x-circle, orange-600
- output-error: "Error", x-circle, red-600
Observation: state is conveyed by icon + colour + word, and the word is always present (good). Source has no ARIA beyond what Radix Collapsible gives (aria-expanded on trigger). No reduced-motion handling for `animate-pulse` in the file.

Confirmation (confirmation.tsx): an Alert, rendered only for `approval-requested`, `approval-responded`, `output-denied`, `output-available` (hidden while streaming input). Slots: Request (shown only while requested), Actions (only while requested), Accepted / Rejected (shown after response, by `approval.approved`). No built-in text; consumer supplies copy. No ARIA added.

Reasoning (reasoning.tsx): auto-opens when `isStreaming` becomes true (unless `defaultOpen={false}`); auto-closes once, 1000 ms (`AUTO_CLOSE_DELAY`) after streaming ends, only if it auto-opened and only once (`hasAutoClosed`), so a user who reopens it is not fought. Duration = `Math.ceil` seconds from stream start. Labels: "Thinking..." (with Shimmer, duration 1s) while streaming or duration 0; "Thought for a few seconds" if duration undefined; "Thought for {n} seconds" otherwise.

Shimmer: motion-based text with a moving gradient highlight (background-position 100% to 0%, linear, infinite, default 2s). No `prefers-reduced-motion` handling in source. Loader file path 404 (not read).

Conversation (conversation.tsx): wraps `use-stick-to-bottom`; container has `role="log"`; `initial` and `resize` default "smooth"; ScrollButton is rendered only when `!isAtBottom`, icon-only outline button bottom centre; empty state "No messages yet" / "Start a conversation to see messages here".

Chain of Thought: collapsible, default closed, header "Chain of Thought" with brain icon; steps have `status` complete (muted) / active (full foreground) / pending (50% muted), optional description, vertical connector line, search-result badges. Task: collapsible, default OPEN, title + search icon, items with file badges. Queue: sections "{count} {label}" (e.g. "3 Queued"), default open, list capped about 10rem with scroll, items pending/completed (strikethrough + faded), hover-revealed actions. Plan: collapsible Card, `isStreaming` shimmers title and description, toggle button has sr-only "Toggle plan". Sources: closed by default, label "Used {count} sources", links `target=_blank rel=noreferrer`.

### 1.2 assistant-ui (MIT, https://github.com/assistant-ui/assistant-ui/blob/main/LICENSE)
Sources: https://www.assistant-ui.com/docs/ui/tool-fallback ; https://www.assistant-ui.com/docs/ui/tool-group ; https://www.assistant-ui.com/docs/tools/tool-ui ; https://www.assistant-ui.com/docs/ui/thread
- Status model: `status.type` = `running` | `requires-action` (with `reason`) | `incomplete` (reason `cancelled` | `error` | others; `status.error`) | `complete`. Tool result may also have `isError`. Human tools (`type: "human"`) have no executor; `render` collects input and calls `addResult` exactly once; `human()`/`resume()` pauses `execute` mid-run; `interrupt = {type:"human", payload}` is set while waiting.
- Approval gates: `approval.approved` is `undefined` (open, user should decide), `true`, `false` (runtime records error result, `reason`); `approval.resolution` `"cancelled"` | `"expired"` closes a gate without a deny. Sending another message cancels a pending gate in LocalRuntime. Good model for "approval superseded".
- ToolFallback: Root collapsible; Trigger is a button with `aria-expanded` containing status icon, one-line label, elapsed duration (ticks per second while running, freezes at total on completion), chevron. Content order: Error, Args (pre), Approval (buttons while action required, then a receipt of the decision), Result (pre). Auto-opens only when status is `requires-action`; otherwise keeps the user's last state.
- Labels verbatim: "Running tool: <name>", "Waiting on tool: <name>", "Failed tool: <name>", "Cancelled tool: <name>", "Used tool: <name>".
- ToolGroup: Thread groups adjacent tool calls automatically; trigger "N tool calls" / "1 tool call"; default collapsed (`defaultOpen=false`), no documented auto-collapse; while any call running, trigger shows spinner + shimmering label; group status running if any running, else mirrors last. Static summary: `done/total` + spinner while running; `n failed` red X; `n done` green check. Expand/collapse briefly locks scroll position so the viewport does not shift.
- Thread: `autoFocus` (default true) focuses composer on mount, run start, thread switch, scroll-to-bottom. "Load earlier messages" button becomes "Loading earlier messages" with a status region announcing it; focus stays on the button during load. Viewport preserves position when pages land above. Viewport autoScroll options not documented on the pages I could read [UNVERIFIED].

### 1.3 CopilotKit (MIT [unverified this session])
Sources: https://docs.copilotkit.ai/generative-ui/tool-rendering ; https://docs.copilotkit.ai/human-in-the-loop
- Tool renderer `status`: `inProgress` (labelled "streaming", warning badge), `executing` ("running", secondary badge), `complete` ("done", success badge). Cards treat "not complete" as loading.
- Human-in-the-loop: `useHumanInTheLoop` (react-core/v2) registers a client tool; `render` gets `status`, `args`, `respond`; `respond(result)` becomes the tool result and the agent continues. Demo gate offers fixed options plus an explicit escape "None of these work" which returns `{cancelled: true}`. Pattern: approval is a tool result, and a decline path is mandatory. Status value list for HITL not confirmed [UNVERIFIED].

### 1.4 prompt-kit (shadcn registry, https://www.prompt-kit.com/docs)
Inventory: Chain of Thought, Chat Container, Code Block, Feedback Bar, File Upload, Image, Loader, Markdown, Message, Prompt Input, Prompt Suggestion, Reasoning, Scroll Button, Source, Steps, System Message, Text Shimmer, Thinking Bar, Tool.
- Tool: `toolPart {type,state,input,output,toolCallId,errorText}`; states `input-streaming`, `input-available`, `output-available`, `output-error` (docs demo labels them pending, running, completed, error); `defaultOpen` false.
- Chat Container: use-stick-to-bottom; pinned when at bottom; scrolling up pauses and preserves position; scrolling back resumes; handles content added above viewport; ScrollButton appears only when scrolled up.
- Reasoning: Root/Trigger/Content, `isStreaming` auto-closes on stream end, optional markdown.
- Steps: collapsible sequence, `defaultOpen` true, trigger with leftIcon (swapped for chevron on hover), vertical bar, items; example uses a shimmer Loader for in-progress. Loader has 12 variants (circular, classic, pulse, pulse-dot, dots, typing, wave, bars, terminal, text-blink, text-shimmer, loading-dots), optional text. Reduced-motion handling not documented [UNVERIFIED].
- Licence not checked [UNVERIFIED].

### 1.5 use-stick-to-bottom (StackBlitz Labs)
https://github.com/stackblitz-labs/use-stick-to-bottom : ResizeObserver based, no reliance on `overflow-anchor` (Safari lacks it), user scroll up cancels the stick, content shrink also handled, spring (velocity) smooth scroll, `isAtBottom` / `scrollToBottom`. Licence and reduced-motion behaviour not read [UNVERIFIED]. Both AI Elements and prompt-kit build on it, so this is the de facto reference behaviour.

### 1.6 LibreChat (MIT [unverified]) and Open WebUI (BSD-3-style with branding clause since 2025 [from memory, unverified])
- Page https://www.librechat.ai/docs/features/agents (fetcher summary; confirm by reading page directly): tool cards show "Preparing" while a call waits (for example for approval), then "Calling" until the result returns; shell output terminal style collapsed to last 15 lines with "Show more"; failed command shows exit code, signal or timeout; optional intent labels give each MCP call a one-line live description; background task results are a collapsible task card; "activity groups" collapse each stretch of reasoning plus tool calls under a generated one-line header, long runs split into phases with summaries, final answer stays outside the fold, files produced shown in a row beneath; "live reasoning labels" replace generic "Thinking" with updating summary; "Smooth Streaming" animates the fold unless reduced motion requested; code-interpreter inner-call trace is live and not kept after reload; "Workspace changes" lists files per message.
- Open WebUI https://docs.openwebui.com/features/chat-conversations/chat-features/reasoning-models : reasoning tags parsed into a collapsible block labelled "Thought" or "Thinking"; late-arriving reasoning folded into the block above the answer; exports as `<details type="reasoning">` (native details confirms the plain-HTML approach is viable). "Thought for N seconds" wording [UNVERIFIED from docs].

### 1.7 Coding agents
- Claude Code (https://code.claude.com/docs/en/interactive-mode): Ctrl+O transcript viewer "shows detailed tool usage and execution, with a timestamp and the model used on each assistant message" and expands lines that collapse by default, for example MCP calls shown as a single "Called slack 3 times" line and "Message from @<sender>"; Esc interrupts ("Claude keeps the work done so far"), Esc on a permission prompt declines; messages typed while working are queued and passed in after the current tool calls; task list can be collapsed/expanded and expanded state restored on resume. Footer panel list of background subagents. "Ran N commands" style grouping: only the MCP "Called X N times" line is confirmed; the exact "Ran N commands" wording is [UNVERIFIED]. claude.ai thinking summary UI [UNVERIFIED].
- Cursor (https://cursor.com/docs/agent/overview): checkpoints are automatic snapshots before significant changes, previewed/restored from the chat timeline, restore reverts files only, messages stay; queue (Enter queues, drag to reorder, Cmd+Enter sends immediately, "Send now" steers at next tool call). Tool chips and collapsed terminal output [UNVERIFIED, docs page silent].
- GitHub Copilot coding agent (https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/track-copilot-sessions): session log shows reasoning and tools used; progress, token usage, session length in an overview; steering message applied "after finishing its current tool call"; "Stop session" button keeps pushed commits. Timeline/step structure [UNVERIFIED].
- Cline (https://docs.cline.bot/features/auto-approve): per-category auto-approve (read project files, read all files, edit project files, edit all files, execute safe commands, execute all commands, use browser, use MCP), per-call `requires_approval` flag set by the model, notification when approval needed or when auto-approved command runs 30 s, YOLO mode. Approve/Reject button UI and checkpoint UI [UNVERIFIED].
- OpenHands (https://docs.openhands.dev/openhands/usage/key-features): panel set only: Chat, Changes, VS Code, Terminal, App, Browser. Action/observation row anatomy and confirmation mode [UNVERIFIED].
- ChatGPT agent (https://help.openai.com/en/articles/11752874-chatgpt-agent): help page says agent pauses for clarification/confirmation, "user confirmations for high-impact actions", take-over of the browser (screenshots not captured during takeover), "watch mode" on certain sites; page says the feature is no longer available, replaced by ChatGPT Work. Activity panel structure [UNVERIFIED].

### 1.8 Streaming and API semantics
Anthropic streaming (https://platform.claude.com/docs/en/build-with-claude/streaming) supplies text deltas, thinking deltas, `input_json_delta` for tool input, pings and mid-stream error events. These map to AI SDK states (`input-streaming` is the partial JSON phase). Details not re-read here.

## 2. Accessibility sources
- MDN log role https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/log_role : implicit `aria-live=polite`, `aria-atomic=false`, must have an accessible name, new info appended only at the end; use for chat logs.
- MDN status role https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role : implicit polite + atomic true; do not move focus to it; keep it in the DOM before content changes (general live-region practice).
- MDN aria-busy https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-busy : set true while several parts update, then false so AT announces once; support is optional/inconsistent.
- Streaming-chat write-ups (individual blogs, not standards): https://azukiazusa.dev/en/blog/accessible-streaming-chat-ui (history `role="log" aria-live="off" aria-label tabindex=0`; separate always-present visually hidden `role="status"`; announce only start, complete, cancel, error; clear-then-set after about 100 ms to re-trigger identical text; sr-only heading per message; focus stays in composer; Stop is a real button and focus returns to input when it disappears; do not rely on aria-busy or aria-relevant); https://dev.to/babycat/cancel-retry-announce-a-typed-state-machine-for-accessible-streaming-chat-6h0 (states idle, connecting, streaming, cancelling, done, cancelled, error; wording below); https://smashingmagazine.com/2026/05/designing-stable-interfaces-streaming-content/ (60 px at-bottom threshold, rAF-batched flush, extend text node instead of rebuilding, cursor `aria-hidden`, reduced motion shows full response, `display:none` for hidden controls); https://smashingmagazine.com/2026/11/making-immersive-llm-chat-experiences-more-accessible/ and https://tianpan.co/blog/2026/06/29/streaming-tokens-meet-the-screen-reader (found in search, not read in full; claim that aria-atomic=true on a streaming container re-reads the whole reply per token is plausible and consistent with MDN). A dev.to analysis of claude.ai reports live regions that re-read partial text with NVDA/JAWS [UNVERIFIED, search snippet only]. WCAG 2.2 has no streaming-specific criterion (per those posts).
- WAI-ARIA APG: not fetched this session; APG disclosure pattern (button with `aria-expanded` controlling a region) and feed pattern are the relevant ones, cited from knowledge not verified here.

## 3. Cross-cutting findings
(1) Row anatomy: header always shows icon, tool name (or intent sentence), status word, optional duration, chevron. Input JSON, output, errors behind disclosure. Approval controls are the exception: they render inline and force-open (assistant-ui auto-opens on requires-action; AI Elements shows Alert only on approval-requested).
(3) Long output: LibreChat tails 15 lines with "Show more"; AI Elements Queue caps height about 10rem with scroll; code blocks scroll.
(4) Grouping: assistant-ui "N tool calls" collapsed by default with running spinner/shimmer and `done/total`, `n failed`, `n done`; LibreChat generated one-line headers with phases and answer left outside; Claude Code "Called slack 3 times".
(5) Stick-to-bottom: at-bottom test with threshold, pause on user scroll up, button only when not at bottom, reset on new stream, preserve position when content above changes, lock scroll while toggling a disclosure.
(6) Stop/error/retry: AI SDK `stop`/`regenerate`/`resumeStream`; babycat states; Claude Code Esc keeps work done so far; Copilot "Stop session" keeps commits; assistant-ui gate resolution `cancelled`/`expired`.
(7) Shimmer used for "in progress" text (Thinking..., plan title, group label); none of the inspected sources handle reduced motion in code, only LibreChat docs mention it.

## 4. Needs JS vs markup and CSS only
CSS/HTML alone: native `<details>`/`<summary>` disclosure (open attribute, `[open]` chevron rotation, `::details-content` transitions), state styling via `[data-state]`, status icons and colour via data attributes, shimmer via `@keyframes` guarded by `@media (prefers-reduced-motion: reduce)`, connector line in step lists, `max-height` plus `overflow:auto` for output, `:has()` to style a group when it contains `[data-state=running]` or `[data-state=awaiting-approval]`, `overflow-anchor` for scroll anchoring in Chromium/Firefox, `flex-direction: column-reverse` trick as a no-JS bottom-pinning fallback (note: breaks reading order/tab order, so avoid or test).
Requires JS: stick-to-bottom pause/resume and the jump-to-latest button, elapsed-time ticking and "Thought for N seconds" computation, auto-open on stream start and auto-close after delay, auto-open on approval-requested, counting/summarising group contents ("Ran 4 commands, edited 2 files"), announcement batching and the status live region text, frame-batched streaming render, focus return after Stop/Approve, truncation of output to last N lines with Show more (CSS line-clamp only approximates).

## A. Consolidated tool-call state model
Recommended `data-state` values (superset of AI SDK, assistant-ui, CopilotKit):
1. `streaming-input` (AI SDK input-streaming; CopilotKit inProgress; word "Preparing"): row visible, name known maybe, args partial in disclosure; closed.
2. `awaiting-approval` (approval-requested; requires-action; word "Awaiting approval"): row force-open, shows the proposed action in human words, Approve and Deny buttons (real `<button>`s), amber, static icon, no motion needed; optional "Always allow" only if you have an auto-approve concept. If `isAutomatic`, show "Checking approval" without buttons. 
3. `approved`/`responded` (approval-responded, "Approved"): transient, receipt line.
4. `running` (input-available; executing; "Running"): spinner or pulse plus word, elapsed timer, live output region tail-following if output streams; closed by default unless output is streaming and user opened it.
5. Terminal: `done` ("Completed"/"Used tool"), `error` ("Failed", error text visible without opening the first line), `denied` (output-denied, "Denied", include reason), `cancelled` (assistant-ui incomplete/cancelled, "Cancelled"), `expired` (approval resolution expired or superseded by a new user message).
Transitions: streaming-input -> (awaiting-approval | running | error); awaiting-approval -> (approved -> running | denied | cancelled | expired); running -> (done | error | cancelled); error -> retry creates a NEW row linked to the old one (do not mutate history). Terminal states are final. Visible in every state: icon, name or intent sentence, status word, duration once known. Elapsed time freezes at completion.

## B. Consolidated streaming-message model
States: `idle` -> `submitted/connecting` ("Sending") -> `streaming` -> `done`; branches: `cancelling` -> `cancelled` (keep partial text, mark "Stopped", show character/word count optionally), `error` (keep partial text, show retry), `reconnecting` (resumeStream; show "Reconnecting" and do not duplicate text; if resume fails, move to error). Markup: message container `data-state`, `aria-busy="true"` only while streaming, text appended into one growing text node (no rebuild), cursor element `aria-hidden`, Stop button visible only in submitted/streaming, Retry/Regenerate in error/cancelled/done. Partial output retained on stop and error, labelled as incomplete. New stream resets scroll-stick flag.

## C. Grouping and summary rules
- Group consecutive tool rows (and interleaved short reasoning) into one disclosure; header shows count by kind, for example "Ran 4 commands, edited 2 files, read 6 files" (kind counts derived by JS, not authored), plus status suffix: `done/total` with spinner while running, "n failed" if any failed (and keep failed rows discoverable), otherwise "n done".
- Collapsed by default when settled (assistant-ui default is collapsed always; LibreChat collapses under generated header). Open or keep open while any child is running or awaiting approval, and always surface approval requests outside the fold or force the group open. Reasoning: AI Elements rule (open during stream, close once 1 s after, never re-close after the user touched it).
- Final answer stays outside any fold. Files produced appear in a row beneath the group.
- Long runs: split into phases with one-line summaries (LibreChat), plus a full "transcript" view with timestamps (Claude Code Ctrl+O). Failed or denied items never hidden in a summary without count.
- Timeline: keep a vertical connector with per-step state (AI Elements Chain of Thought: complete muted, active foreground, pending faded), timestamps in the expanded transcript.
- Long output: cap to last 15 lines (LibreChat) or fixed max-height, tail-follow only while the user is at its bottom, "Show more" or "Show all N lines", and failed commands show exit code.

## D. Announcement strategy for assistive technology
- One persistent, visually hidden `role="status"` (polite, atomic) present at page load, never `display:none`. Use it for coarse milestones: run started, approval needed (text: "Approval needed: <tool>"), tool finished with failure, run complete with the summary line ("Finished: ran 4 commands, edited 2 files"), stopped, error. Cap rate (for example one message per 2 to 3 seconds, coalesce counts), clear then set text after a short delay to re-announce repeats.
- Transcript container: `role="log"` with accessible name; set `aria-live="off"` while streaming so token streams are silent, or keep implicit polite with `aria-atomic="false"` only for completed, appended rows (rows inserted whole, not growing). Do not put `aria-live` on the growing message; do not use `aria-atomic=true` on it.
- Approval requests are the one case that deserves prompt attention: announce via the status region and, if the user is in the composer, do NOT steal focus; instead provide a visible button and a keyboard shortcut or skip link; move focus only when the user triggers it. (Judgement; sources say keep focus in composer.) Use `role="alert"` only for failures that block the run.
- `aria-busy`: set on the growing message while streaming as a hint, but never as the only mechanism (inconsistent support).
- Disclosures: `<details>`/`<summary>` or button `aria-expanded` + `aria-controls`; keep state words as real text, not icon-only; icons `aria-hidden`. Timers: do not live-announce elapsed seconds; render the duration as text updated visually only (`aria-hidden` ticking value, static text on completion).
- Headings or `aria-label` per message for sender identity; scroll container focusable (`tabindex=0`) if it scrolls; jump-to-latest is a real button with label "Jump to latest"; return focus to composer when Stop disappears.
- Respect `prefers-reduced-motion`: no shimmer or pulse sweep, static text plus icon; cursor no blink.

## E. Anti-patterns observed or implied by sources
- Hidden activity: tool use only in a collapsed card with no running word or count, so users cannot tell the agent is working (mitigate with a persistent "now doing" line).
- Spinner with no text; colour-only status (AI Elements always pairs a word, good).
- Layout jumping: rebuilding message DOM per token, removing and re-adding cursor, expanding a disclosure above the viewport without locking scroll (assistant-ui locks).
- Auto-scroll fighting the reader: not pausing on user scroll up, not resetting between streams, using a tight at-bottom test (use about 60 px).
- Decorative "thinking" animations (looping shimmer/pulse with no information, ignoring reduced motion; AI Elements shimmer and `animate-pulse` do not check it).
- Live region on a growing message (`aria-atomic=true` re-reads entire reply per token; claude.ai reportedly suffers partial re-reading per the dev.to snippet, unverified).
- Dynamically inserted live regions that are never announced; hiding the status region with `display:none`.
- Mutating a failed tool row into a retry (loses history); auto-closing reasoning the user has reopened; hiding failures inside a "N done" summary; approval controls rendered inside a collapsed, closed group; `opacity:0` hidden controls that stay focusable.
- Licence note: AI Elements, prompt-kit, assistant-ui (MIT confirmed), CopilotKit, LibreChat, Open WebUI, OpenHands, Cline: borrow patterns, not code; confirm each licence before copying anything.

## Gaps (not verified)
Exact claude.ai thinking summary and Claude Code "Ran N commands" grouping text; ChatGPT agent activity panel; Cursor tool chips/terminal collapse; Copilot coding agent timeline; Cline approval buttons; OpenHands action/observation rows; CopilotKit HITL status values; assistant-ui viewport autoScroll options; WAI-ARIA APG pages; reduced-motion in use-stick-to-bottom; Open WebUI "Thought for N seconds" wording; licences other than assistant-ui.
