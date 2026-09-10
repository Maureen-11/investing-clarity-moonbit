# Working agreement

Read this file, docs/implementation-plan.md, docs/progress.md, and git status before work.
This is a standalone MoonBit calculation repository. Do not edit the sibling original website.
Do not copy the 300 ETF histories, credentials, private contact information, or machine configuration here.
MoonBit performs financial calculations; JavaScript loads data, invokes Wasm, tests results and renders UI.
Work in small numbered tasks. Luna: one interface/behavior per task. Terra: related tasks may be grouped, with separate verification.
Record changed files, commands actually run, results and the next task in docs/progress.md.
Never mark unexecuted checks as passed. Never remove tests, relax tolerances or rewrite expected numbers to hide errors.
After two failed attempts without locating a cause, record a minimal reproduction and pause dependent work; continue independent tasks.
History date/type/provenance must survive analysis. No index DCA, invented years, silent synthetic fallback or double fee deduction.
JSON numbers cannot represent NaN: absent fee rates are null, never fabricated zero fees.
Do not publish a release or change the original website integration before the owner reviews the local candidate.
Repository creation and source publication are authorized; use exact file staging and PRs after initialization.
