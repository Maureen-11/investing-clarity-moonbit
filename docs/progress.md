# Progress

Status: public v0.1.0 candidate published; GitHub repository and Pages demo are live. A version tag/release and integration with the original site remain separate decisions.

## Verified environment

- Existing source checkout: sibling `maintenance-investing-clarity-lab`.
- Original engine reference commit: `0d07e0dd212bcd942de366e9650d05042bf0099e`.
- Node.js: v24.19.0.
- MoonBit was absent from PATH at intake. A pinned official toolchain is available in the ignored sibling `work/moonbit-toolchain` directory.
- GitHub CLI was authorized with a project-local configuration directory; the credential directory is outside this repository and is not committed.
- Native PowerShell/curl TLS failed; Node fetch successfully retrieved the official installer over verified HTTPS.

## Completed verification

- MoonBit: 27/27 tests passed.
- Node bridge and golden tests: 26/26 passed.
- Upstream local batch: 300 ETF histories, 900 replay modes, 300 rolling modes and 15 index contexts passed with no failures.
- Browser: 1440, 1280, 1024, 768 and 390px had no horizontal overflow; synthetic demo and 159919, VOO and 02800 loaded and calculated; index investment form was hidden.
- Source boundary scan: no credentials, private keys, local user paths, internal brand assets or build outputs in the publication file set.
- Generated screenshots and batch reports are ignored under `artifacts/` and are local evidence only.
- Remote GitHub Actions CI run `34432373709`: Windows and Ubuntu jobs passed.
- GitHub Pages workflow run `34432456093`: build and deployment passed. Demo URL: https://maureen-11.github.io/investing-clarity-moonbit/

## Methodology findings to resolve explicitly

1. Upstream computeProductMetrics suppresses metrics below 252 points, rather than checking one calendar year. New API must retain short-history factual statistics and suppress only annualization.
2. Upstream estimatedDirectFee adds one day's fee per observation, even when observations are separated by weekends/holidays. Preserve the separately specified exponential counterfactual feeDrag; do not claim this direct-fee number is exact.
3. Upstream commonSeries can include the first point after the common end. New comparison must never select observations beyond the shared interval.
4. Upstream replay recoveryDays measures time between product highs, while product metrics recoveryDays measures trough-to-recovery. Return explicitly named definitions.

## Next

1. Review the public repository and Pages demo with representative browsers.
2. Decide whether to tag `v0.1.0` and create a GitHub release.
3. Only after review, discuss integration with the original site.
