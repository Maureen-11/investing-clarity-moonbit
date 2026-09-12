# Progress

Status: MVP candidate is publicly deployed on `main` at [GitHub Pages](https://maureen-11.github.io/investing-clarity-moonbit/). PR #1 published the local MVP and PR #2 fixed slow public directory loading; both were merged with required checks passing. The original local candidate history remains available on `codex/mvp-local-candidate`, while the public `main` now includes the merged release and its deployment records.

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
- CI and Pages workflow files target the Next static build in `out/`; the merged `main` workflows completed successfully for the public release, including the project-path browser smoke and deployment.

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
- L1 offline failure handling passed: three external requests were blocked, a delayed directory failure did not clear the 300-yuan teaching result, and a blocked Wasm request surfaced an engine error.
- Reference-versus-replica browser comparison passed at 1440, 1280, 1024, 768 and 390px; the target had no page errors, and the 10 ETF cases plus keyboard/common-history comparison passed. The reference bundle alone emitted React warning 418.
- Screenshots and reports are under ignored `artifacts/replica/` and are local evidence only.

## Findings and limits

1. The reference production bundle reports a React hydration warning 418 in the comparison script; it has not reproduced as a local-replica runtime exception.
2. Upstream history is not real-time and public display/re-distribution permission is not confirmed; the UI keeps both warnings visible.
3. Full human review of every chart and comparison state remains outstanding.

## Local commit series

The candidate keeps the original two remote commits and its 15-commit local development series. PR #1 merged the MVP as `be78b0d`; PR #2 merged the slow-directory fix as `426507c`. The local branch also retains the original verification and documentation chronology; the remote `main` is the public source of truth after those merges.

## Next

1. Owner reviews the live MVP and the short review guide in `docs/review-package.md`.
2. Submit the re-review message with the public repository, Pages URL, PR links and verification evidence.
3. Confirm the organizer's project classification and any minimum effective commit requirement in writing; these are not stated as guaranteed by the public competition page.
