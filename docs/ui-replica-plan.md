# UI replica execution plan

Reference: maintenance-investing-clarity-lab at 0d07e0dd212bcd942de366e9650d05042bf0099e.
Target: this independent repository. Local review only: no commits, push or deployment.

| Task | Scope | Acceptance |
| --- | --- | --- |
| L0 | Pin original source and screenshots | Reproducible source and viewport evidence |
| L1 | Map every UI computation to MoonBit | Calendar, fees, metrics and comparison accounted for |
| L2 | React/Next static export | Routes / and /plan/; Wasm stays functional |
| L3 | Original homepage | Original hierarchy and responsive layout |
| L4 | Original inputs/search | Keyboard/touch; stale state prevention |
| L5 | Worker and primary replay | Date, currency, principal and counts verified |
| L6 | All result modules | No TypeScript financial fallback |
| L7 | Visual and numerical comparison | 1440/1280/1024/768/390; differences documented |
| L8 | Local review evidence | Tests, batch, screenshots and contribution record |

Read AGENTS.md and progress.md at every task boundary. Record actual commands/results and open issues. Never erase failing tests or loosen tolerances. Monetary tolerance max(0.01, abs(expected)*1e-9); ratios 1e-8; dates/counts exact.

Chinese UI and bilingual READMEs. Historical data remains upstream, on-demand; no new acquisition. Actual ETF history only, index statistics only. Proxy controls explain unavailability instead of synthesizing extended ETF history. Known original computation errors stay corrected and documented.

MoonBit owns financial calculations; React owns rendering, interaction and loading. Preserve schema v1 and add optional interfaces compatibly. No silent synthetic fallback.

Competition: official September page https://moonbitlang.github.io/Hackathon2026/ requires MoonBit as primary implementation, substantive new work, open development record, runnable examples/tests, licensing/attribution and explainable AI use. Existing UI/data are prior work. Classification as non-port is applicant-provided and must be reconciled with organizer guidance; full separate charter has not been verified. Recheck before submission; do not claim guaranteed eligibility. After owner reviews, future commits/PRs preserve real chronology.
