# Security Review

Date: 2026-03-25

Scope reviewed:
- `manifest.json`
- `background.js`
- `popup.js`
- `core/controller.js`
- `core/trust.js`
- `core/transformer.js`
- `core/taste.js`
- `models/page-model.js`
- `adapters/*.js`

Note on "knowledge base":
- No MCP/local knowledge-base resource was attached in this session, so this review is based on the repository code and the architecture comments embedded in it.

## Architecture summary

This is a Manifest V3 browser extension that injects content scripts into Reddit, Hacker News, and a generic fallback on `<all_urls>`. The content script parses the page into a normalized `PageModel`, applies theme/layout changes directly in the page DOM, and stores long-lived preference/trust state in `chrome.storage.local`. The popup talks directly to the content script with `chrome.tabs.sendMessage(...)`; sensitive operations are intended to be gated to extension pages.

## Findings

### High: Overbroad page access and injection scope on `<all_urls>`

Files:
- `manifest.json:18`
- `manifest.json:32`
- `adapters/generic.js:11`

The extension injects its generic content script and CSS on `<all_urls>`, not just on supported sites. That means the extension executes on essentially every web page the user visits, including sensitive application surfaces such as banking, webmail, admin consoles, internal tools, and SSO pages.

Why this matters:
- It substantially expands the attack surface of the content script.
- It causes the extension to read and model arbitrary page content by default.
- Any future bug in parsing, messaging, or DOM mutation becomes reachable from nearly every site.
- The current implementation does not need broad ambient host access to deliver its stated value on the explicitly supported sites.

Impact:
- Privacy risk from broad DOM access.
- Higher likelihood that a future content-script bug becomes exploitable in a sensitive context.
- Poor least-privilege posture for an extension that claims a trust-based model.

Recommendation:
- Remove the generic `<all_urls>` content script unless there is a hard product requirement for always-on injection.
- Prefer explicit host allowlists for supported sites.
- If generic support is required, switch to on-demand injection via `activeTab` and `chrome.scripting` after an explicit user action, instead of persistent ambient injection.
- Add an explicit denylist for high-sensitivity origins if broad matching remains.

### Medium: "Per-site trust" mutates global collection state

Files:
- `core/trust.js:23`
- `core/trust.js:86`
- `core/controller.js:38`
- `core/controller.js:93`

The trust model is described as site-specific, but `setSiteLevel()` enables `dataCollection` and `memoryEnabled` globally whenever any single site is moved above `view_only`:

- `core/trust.js:89-94` sets `this.siteOverrides[hostname] = level`
- then also sets `this.dataCollection = true` and `this.memoryEnabled = true`

Separately, the popup message `setMemoryEnabled` also toggles `trust.memoryEnabled` as a single global flag (`core/controller.js:93-97`).

Why this matters:
- The user-facing model implies site-level consent, but the stored flags are global.
- A user enabling learning on one site silently changes extension-wide state.
- Even if capture still checks site trust level, global state increases the chance of future regressions and makes the privacy boundary harder to reason about.

Impact:
- Trust boundary is weaker than the UI suggests.
- Future features can accidentally treat global `memoryEnabled` / `dataCollection` as blanket consent.
- Auditing and compliance are harder because consent is not modeled at the same granularity as the UI.

Recommendation:
- Move `dataCollection` and `memoryEnabled` into per-site state, or derive them strictly from per-site trust level.
- Keep global defaults separate from site overrides.
- Ensure popup copy matches actual semantics if any setting remains global.

### Medium: Sensitive data deletion is global, but the UI is scoped to the current site

Files:
- `popup.js:170`
- `core/controller.js:70`
- `core/trust.js:116`

The popup is presented as operating on the current site, but `deleteData` calls `chrome.storage.local.clear()` through `TrustManager.deleteAllData()`. That removes all extension data for all sites, not just the current hostname.

Why this matters:
- This is primarily a trust-model issue, but it also affects safety of destructive operations.
- The user can reasonably infer from the popup context that deletion is site-scoped.

Impact:
- Unexpected destruction of all stored extension state.
- Increased chance of accidental data loss.

Recommendation:
- Rename the action to make the global effect explicit, or
- implement site-scoped deletion for preferences and trust overrides tied to the active hostname.

## XSS review

I did not find an obvious DOM XSS sink in the current content-script code.

Positive observations:
- No use of `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval`, `Function`, or `document.write` was found in the repository.
- DOM writes in the transformer are constrained to:
  - CSS custom properties via `style.setProperty(...)`
  - fixed `data-*` attributes with allowlisted values in `core/transformer.js:27-32` and `core/transformer.js:54-57`
  - `classList.add(...)` using an allowlisted layout suffix in `core/transformer.js:120-125`
- Adapters read from page DOM using `textContent`, attributes, and element references, which is much safer than re-inserting HTML.

Residual XSS considerations:
- Because the extension runs on arbitrary pages, any future addition of HTML-based rendering in content scripts would immediately become high risk.
- The generic adapter reads attacker-controlled DOM on every matched origin, so the current absence of an HTML sink is important and should be preserved with linting/review guardrails.

Recommendation:
- Add a static lint/review rule forbidding HTML sinks in content scripts unless there is a documented sanitizer.

## Trust and message-boundary review

Positive observations:
- Message handling validates `sender.id === chrome.runtime.id` in `core/controller.js:44-47`, so regular web pages cannot directly invoke privileged message handlers.
- More sensitive operations additionally require `sender.url` to start with `chrome-extension://` in `core/controller.js:49-50`, which is an appropriate second gate for popup-originated actions.
- Extension page CSP is reasonably strict for this codebase: `script-src 'self'; object-src 'none';` in `manifest.json:7-9`.

Concerns:
- The trust model is partly declarative/UI-level only. `action` trust is defined, but no actual privileged action path exists today. That is not a vulnerability by itself, but it increases the risk of future feature creep landing into an already overbroad host-permission model.
- The extension stores all preference/trust state in `chrome.storage.local` without partitioning by sensitivity. That is acceptable for this small codebase, but it will become harder to reason about if agent capabilities expand.

## Permission-scope assessment

Current permissions:
- `storage`
- `activeTab`
- implicit broad host access through persistent `content_scripts` matches, including `<all_urls>`

Assessment:
- `storage` is justified by the current design.
- `activeTab` is currently underused; it would be a better fit if injection were moved to user-triggered activation.
- The broad content-script match pattern is the main permission-scope problem in this repository.

## Overall assessment

No immediate content-script XSS issue is visible in the current code. The primary security concerns are architectural:

1. The extension runs on far too many pages by default.
2. The trust model is not aligned with storage semantics, especially around collection/memory flags.
3. A destructive action is broader than the UI context suggests.

If this extension is intended to evolve toward real browser-agent behavior, the first change should be to tighten host access. The second should be to make trust and consent state genuinely per-site and auditable.
