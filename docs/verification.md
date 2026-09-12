# Local verification record

Recorded 2026-09-11 for the local `0.1.0-candidate`.

| Check | Result |
| --- | --- |
| MoonBit check | Passed; 11 compiler warnings about reserved/deprecated/unused values, no errors |
| MoonBit tests | 27 passed |
| Node integration and golden/UI tests | 27 passed |
| 300 ETF batch | 300 histories, 900 replay calculations, 300 rolling calculations; 0 failures |
| 15 index contexts | 15 passed; ETF investment options rejected |
| Browser layout | 1440/1280/1024/768/390px; no horizontal overflow |
| Browser data flows | 159919, 510300, 510880, 512890, VOO, QQQ, SCHX, BND, 02800 and 03033; all calculated |
| Offline teaching example | Artificial 3-point fixture produces 2 contributions, 200 yuan principal and 300 yuan ending value |
| Clean checkout install | Fresh clone installed with pnpm 9.15.4 and `--frozen-lockfile`; check, lint, tests and build passed |
| Project subpath smoke | `/investing-clarity-moonbit/` and `/investing-clarity-moonbit/plan/` loaded with Worker, Wasm and offline teaching result |
| External failure handling | Three market-data requests were blocked; the teaching result stayed at 300 yuan after a delayed failure, and a blocked Wasm request surfaced an engine error |
| Source scan | no credentials, private keys, local user paths, internal watermark assets or build outputs |

The batch compares the new MoonBit output with the original TypeScript engine at commit `0d07e0dd212bcd942de366e9650d05042bf0099e`. The original engine is a regression reference; matching it does not prove its methodology is correct. Deliberate semantic differences are recorded in `docs/methodology.md`.

The browser check used the saved original GitHub Pages data endpoint for the three real ETF examples. No live market claim is made; the data remains a saved snapshot and its display/re-distribution permission is not confirmed.

The clean-checkout and project-subpath checks ran locally against a fresh temporary clone. The browser smoke also covered delayed external failure, teaching-state preservation and blocked-Wasm error handling. This local-replica turn did not run remote CI, publish a release or change the original site. Those actions remain pending owner review.
