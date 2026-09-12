# Progress

Status: MVP candidate prepared locally on `codex/mvp-local-candidate`. Twelve local commits now sit on top of the two existing remote commits (14 total in this candidate); eleven carry substantive engine, web, test, build, CI, review-documentation or clean-checkout verification work and one records inventory plus the public-status clarification. None have been pushed. Public release remains pending owner approval and organizer qualification confirmation.

## Verified environment

- Existing source checkout: sibling `maintenance-investing-clarity-lab`.
- Original engine reference commit: `0d07e0dd212bcd942de366e9650d05042bf0099e`.
- Node.js: v24.19.0.
- MoonBit was absent from PATH at intake. A pinned official toolchain is available in the ignored sibling `work/moonbit-toolchain` directory.
- The local bundled pnpm runtime used for verification is 11.19.0; the repository declares and CI installs pnpm 9.15.4. The README uses an npm global-install command because this Node distribution does not include `corepack`.
- GitHub CLI was authorized with a project-local configuration directory; the credential directory is outside this repository and is not committed.
- Native PowerShell/curl TLS failed; Node fetch successfully retrieved the official installer over verified HTTPS.

## Completed verification

- MoonBit: 27/27 tests passed.
- Node bridge and golden/UI tests: 27/27 passed.
- Upstream local batch: 300 ETF histories, 900 replay modes, 300 rolling modes and 15 index contexts passed with no failures.
- Browser: 1440, 1280, 1024, 768 and 390px had no horizontal overflow; 159919, 510300, 510880, 512890, VOO, QQQ, SCHX, BND, 02800 and 03033 loaded and calculated; index investment form was hidden.
- Local source boundary scan: no credentials, private keys, local user paths, internal brand assets or build outputs in the publication file set.
- Generated screenshots and batch reports are ignored under `artifacts/` and are local evidence only.
- A repository-local artificial teaching fixture is now available for offline review; it is not a real security or market result.
- CI and Pages workflow files now target the Next static build in `out/`; this change has not been run remotely or deployed from this local turn.

## Methodology findings to resolve explicitly

1. Upstream computeProductMetrics suppresses metrics below 252 points, rather than checking one calendar year. New API must retain short-history factual statistics and suppress only annualization.
2. Upstream estimatedDirectFee adds one day's fee per observation, even when observations are separated by weekends/holidays. Preserve the separately specified exponential counterfactual feeDrag; do not claim this direct-fee number is exact.
3. Upstream commonSeries can include the first point after the common end. New comparison must never select observations beyond the shared interval.
4. Upstream replay recoveryDays measures time between product highs, while product metrics recoveryDays measures trough-to-recovery. Return explicitly named definitions.

## Local replica update

- Added Next static export routes `/` and `/plan/`, shared reference presentation CSS, and a module Worker loading `public/wasm/engine.wasm`.
- Added MoonBit `ui_json` actions for calendar summaries, enriched metrics, fee channels and metrics-only ETF comparison. ETF comparison keeps the ETF kind instead of masquerading as index context.
- Added controlled request cancellation, stale-response protection, keyboard/ARIA search behavior, and macro-series sanitization for one legacy zero HKD/CNY quote.
- `node node_modules/typescript/bin/tsc --noEmit` passed as the local `lint` check.
- `pnpm run build:web` (MoonBit build plus Next webpack static build) passed; static `/` and `/plan/` were generated locally.
- Replica browser report passed keyboard selection and common-history ETF comparison; target runtime errors were empty. The five React 418 messages belong to the original reference bundle only.
- Static browser smoke passed against `out/`: `/`, `/plan/`, `worker.mjs`, `engine.wasm` and the offline teaching result loaded without page errors.
- A fresh temporary clone installed with pnpm 9.15.4 using `--frozen-lockfile`; MoonBit check, lint, tests and static build passed.
- The same clone passed browser smoke under `/investing-clarity-moonbit/`, including `/plan/`, Worker, Wasm and the offline teaching result.
- Reference-versus-replica browser comparison passed at 1440, 1280, 1024, 768 and 390px; the target had no page errors, and the 10 ETF cases plus keyboard/common-history comparison passed. The reference bundle alone emitted React warning 418.
- Screenshots and reports are under ignored `artifacts/replica/` and are local evidence only.

## Findings and limits

1. The reference production bundle reports a React hydration warning 418 in the comparison script; it has not reproduced as a local-replica runtime exception.
2. Upstream history is not real-time and public display/re-distribution permission is not confirmed; the UI keeps both warnings visible.
3. Full human review of every chart and comparison state remains outstanding.

## Local commit series

The candidate keeps the existing two remote commits unchanged and adds these eleven substantive local commits: engine contract (`235c126`), web replica (`6e64d85`), browser checks (`d582d1a`), offline teaching fixture (`7915602`), pinned build (`06fb439`), CI (`0a7ffe1`), Pages build (`e126ee7`), review documentation (`c122919`), verification record (`73cc918`), portable Windows setup notes (`5926090`) and clean-checkout/subpath verification (current docs update). The preceding HEAD commit (`211a713`) records the final inventory and clarifies which Pages state is remote versus local. This is a local review artifact, not yet a public development record.

## Next

1. Owner reviews the local MVP and the short review guide in `docs/review-package.md`.
2. Confirm the organizer's minimum effective commit requirement and project classification in writing.
3. If approved, push this branch, open a PR, wait for CI, deploy the new `out/` Pages artifact and submit the re-review message.
