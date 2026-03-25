# UX Review: Memstalker Browser Extension (March 25, 2026)

## Overview
The Memstalker extension successfully implements a high-quality "theming wedge" to capture user taste signals. It balances immediate utility (visual customization) with a long-term strategy (taste graph acquisition).

## 1. Popup Design & Interactions
- **Visual Aesthetic:** Excellent use of a dark, modern palette (`#0f0f23`, `#e94560`). The interface feels professional and "high-end," which is critical for a product that asks for trust.
- **Hierarchy:** Controls are grouped logically. Placing "Trust Level" prominently acknowledges the privacy-sensitive nature of a tool that reads page content.
- **Accessibility:** 
    - Strong use of ARIA roles (`radiogroup`, `radio`) and states (`aria-pressed`).
    - Color-coded "Site Badge" provides immediate context on extension status.
- **Micro-copy:** Clear, human-readable labels for page types ("News feed" instead of `feed`) and trust levels ("Theme only. No data collected") lower the cognitive load for new users.
- **Safety:** The inline "Delete All Data" confirmation is superior to browser `confirm()` dialogs, providing a less jarring and more integrated experience.

## 2. Theme Implementation
- **Non-Destructive Transformation:** Using CSS custom properties (`--ms-bg`, `--ms-accent`) and attribute selectors on `<html>` is a robust approach. It avoids the common "broken media" issues seen in extensions that use global `filter: invert()`.
- **Media Preservation:** Explicitly ensuring images, videos, and SVGs are not filtered preserves the original content's integrity while the surrounding UI is transformed.
- **Visual Polish:** Smooth CSS transitions for theme switching make the experience feel fluid rather than "stuttery."

## 3. Preference Capture & "Invisible Learning"
- **Tiered Memory:** Implementation of Hot/Warm/Long memory tiers follows the product strategy perfectly. It separates immediate session intent from durable preferences.
- **Passive Signals:** Capturing dwell time and scroll depth (only when trusted) allows the taste graph to build without constant user input.
- **Active Signals:** Promoting manual choices (e.g., "Dark" theme) to the long-term taste graph after 5 repetitions is a clever way to "learn" without being intrusive.
- **Trust-First Defaults:** Starting at `VIEW_ONLY` (theme-only, no capture) is the correct privacy posture for building initial user trust.

## 4. Strategy Alignment
- **The "Wedge":** The extension effectively delivers immediate "dopamine" (making sites pretty) as a hook for the Memstalker backend.
- **Portability:** The Export/Delete functions reinforce that the user owns their "Taste Graph," aligning with the competitive moat of "portable user experience."

## 5. Areas for Improvement
- **Preference Memory Redundancy:** The `memoryToggle` in the UI is currently overridden by `setSiteLevel` (which enables memory if level > View Only). The relationship between Trust and Memory should be clearer in the UI.
- **Onboarding:** While the code tracks `onboarded: false`, no explicit first-run experience was found. A product this powerful needs a guided "first theme" moment.
- **Technical Jargon:** The footer "X items detected" is a bit technical. Consider humanizing this based on the page type (e.g., "32 articles found" or "12 products identified").
- **Generic Adapter Strength:** The fallback parser is decent but could benefit from more robust heuristics (e.g., detecting "clutter" to hide noise automatically in `ASSIST` mode).

## Conclusion
The Memstalker UX is a benchmark for "AI-adjacent" tools: it provides immediate value, respects privacy with transparent controls, and builds a powerful data asset invisibly. 

**Verdict: Ready for Phase 1 Beta.**
