# Just Say No To Stateless Agents

A side-by-side comparison of what AI agents build **without** vs **with** a knowledge base.

Same prompt. Same model. No internet. Radically different output.

> "Build a browser extension that themes websites and learns user preferences."

## `/stateless/` — Round 1: No KB, No Memory

Built with zero context. No internet, no knowledge base, no memory.

- 6 files, flat structure
- CSS `filter: invert()` theming (breaks images)
- No site-specific awareness
- Visit counter instead of preference learning
- No privacy controls
- No layout options

## `/memstalker/` — Round 2: KB-Informed + Multi-Agent Review

Built after searching the Memstalker knowledge base. Codex and Gemini reviewed with KB access.

- 12+ files across organized directories
- CSS custom properties theming (preserves media)
- Site-specific adapters (Reddit, HN, generic fallback)
- 3-tier taste graph (hot/warm/long-term memory)
- 4-level trust system (view/suggest/assist/action)
- Card/list/magazine/minimal layout modes
- GDPR-ready export/delete
- Accessibility: ARIA roles, labels, contrast-safe
- [`SECURITY-REVIEW.md`](memstalker/SECURITY-REVIEW.md) — written by Codex (GPT-5.4) with KB access
- [`UX-REVIEW.md`](memstalker/UX-REVIEW.md) — written by Gemini (2.5 Pro) with KB access

## Architecture Comparison

| | Stateless | Memstalker |
|---|---|---|
| Structure | Flat | Layered (adapters, core, models, themes) |
| Theming | CSS filters | CSS custom properties |
| Site awareness | None | Per-site adapters |
| Preference learning | Visit counter | 3-tier taste graph |
| Privacy | None | Trust levels + GDPR export/delete |
| Layout control | None | 4 layout modes |
| Accessibility | None | ARIA roles, labels, contrast |
| Security | No validation | Sender validation, input whitelisting, CSP |
| Agent reviews | None | Codex security + Gemini UX (both with KB) |

## 3 Agents, 1 Brain

- **Claude (Opus 4.6)** — Built the extension using KB architecture docs
- **Codex (GPT-5.4)** — Security reviewed with KB context, wrote SECURITY-REVIEW.md
- **Gemini (2.5 Pro)** — UX reviewed with KB context, wrote UX-REVIEW.md

All three agents accessed the same Memstalker knowledge base. No internet was used.

---

**memstalker.com** — give your agents a memory.

Built with [Claude Code](https://claude.ai/claude-code) + [Memstalker KB](https://memstalker.com)
