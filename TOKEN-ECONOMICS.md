# Token Economics: KB vs Googling Everything

Real numbers from this demo session. Same task, two approaches.

## What the agent needed to build the extension

| Context needed | KB route | Google route (hypothetical) |
|---|---|---|
| MVP architecture (site adapters, taste graph, build order) | `kb_read` doc #602 — **~8k tokens** | 5-10 blog posts + synthesize — **60-100k tokens** |
| Product strategy (funnel, moat, pricing) | `kb_read` doc #606 — **~2k tokens** | Can't Google proprietary decisions — **unavailable** |
| CLI dispatch flags (Codex/Gemini syntax) | Memory file — **~500 tokens** | `--help` + trial/error — **3-5k tokens** |
| Demo runsheet and recording plan | `kb_read` doc #608 — **~7k tokens** | Doesn't exist outside the KB — **unavailable** |
| **Total context loaded** | **~18k tokens** | **70-110k+ tokens** |

## The noise problem

Google results include:
- Ads, SEO spam, irrelevant results (~60% noise tokens)
- Multiple round-trips to find the right page
- Full articles read to extract 2-3 useful paragraphs
- No guarantee the info matches your specific architecture

The KB returns **pre-synthesized, AI-summarized, directly actionable** context. Zero noise.

## Cost comparison

At Claude Opus pricing (~$15/M input, ~$75/M output):

| | KB route | Google route |
|---|---|---|
| Input tokens | ~18k | ~90k (conservative) |
| Input cost | **$0.27** | **$1.35** |
| Output quality | Correct architecture first try | Generic output, multiple retries |
| Multiplier | **1x** | **5x more expensive** |

## What you can't Google

Half of what the KB provided **doesn't exist on the internet:**

- "The moat is the taste graph" — a proprietary product decision
- "Extension first, browser later" — your build order strategy
- "3 tiers of memory: hot/warm/long" — your architectural choice
- "Trust is explicit from day 1" — your privacy posture
- The demo recording script and agent dispatch patterns
- Codex/Gemini CLI flags tuned to your workflow

An agent Googling this would either **ask you to re-explain** (wasting your time) or **guess wrong** (wasting tokens on rework).

## The compounding effect

| Sessions | KB cost | Google cost | Savings |
|---|---|---|---|
| 1 session | $0.27 | $1.35 | $1.08 |
| 10 sessions | $2.70 | $13.50 | $10.80 |
| 50 sessions | $13.50 | $67.50 | $54.00 |
| 100 sessions | $27.00 | $135.00 | $108.00 |

And the KB version gets **better** each session as you capture more decisions. The Google version starts from zero every time.

## This demo proved it

| | Round 1 (no KB) | Round 2 (with KB) |
|---|---|---|
| Files produced | 6 | 18 |
| Architecture | Flat, generic | Layered, site-aware, taste graph |
| Privacy controls | None | 4-level trust system |
| Agent reviews | None | Codex security + Gemini UX |
| Context tokens used | 0 | ~18k |
| Could have been Googled? | N/A | Less than half |

**Same prompt. Same model. Same session. 5x cheaper context. Radically better output.**

---

**memstalker.com** — give your agents a memory.
