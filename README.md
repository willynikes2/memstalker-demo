# This Is Your Agent On Memstalker

A side-by-side comparison of what AI agents build **without** vs **with** a knowledge base.

Both rounds received the same prompt:
> "Build a browser extension that themes websites and learns user preferences."

## Round 1: Stateless (No KB)
**`/round1-stateless/`** — Built with zero context. No internet, no knowledge base.

- 6 files, flat structure
- CSS `filter: invert()` theming (breaks images)
- No site-specific awareness
- Visit counter instead of preference learning
- No privacy controls
- No layout options

## Round 2: KB-Informed + Multi-Agent Review
**`/round2-kb-informed/`** — Built after searching the Memstalker knowledge base for architecture docs.

- 12 files across organized directories
- CSS custom properties theming (preserves media)
- Site-specific adapters (Reddit, HN, generic fallback)
- 3-tier taste graph (hot/warm/long-term memory)
- 4-level trust system (view/suggest/assist/action)
- Card/list/magazine/minimal layout modes
- Compact/comfortable/spacious density
- GDPR-ready export/delete
- Accessibility: aria-pressed, radiogroups, contrast-safe

### Multi-Agent Reviews Applied
- **Codex (GPT-5.4)**: Security audit — found 4 HIGH, 3 MEDIUM issues. All fixed.
- **Gemini (2.5 Pro)**: UX audit — found 7 CRITICAL, 8 IMPORTANT issues. All fixed.

## Architecture Comparison

| | Round 1 | Round 2 |
|---|---|---|
| Structure | Flat | Layered (adapters, core, models, themes) |
| Theming | CSS filters | CSS custom properties |
| Site awareness | None | Per-site adapters |
| Preference learning | Visit counter | 3-tier taste graph |
| Privacy | None | Trust levels + GDPR export/delete |
| Layout control | None | 4 layout modes |
| Accessibility | None | ARIA roles, labels, contrast |
| Security | No validation | Sender validation, input whitelisting, CSP |

## The Point

The knowledge base gave the agent:
1. **Architecture** — site adapter layer, normalized page model, taste graph concept
2. **Product context** — why trust matters, what the moat is, build order priorities
3. **Multi-agent review** — real Codex and Gemini CLIs caught issues Claude missed

Same prompt. Same model. Radically different output.

---

Built with [Claude Code](https://claude.ai/claude-code) + [Memstalker KB](https://memstalker.com)
