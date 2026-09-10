# Local verification record

Recorded 2026-09-10 for the local `0.1.0-candidate`.

| Check | Result |
| --- | --- |
| MoonBit check | Passed; 11 compiler warnings about reserved/deprecated/unused values, no errors |
| MoonBit tests | 27 passed |
| Node integration and golden tests | 26 passed |
| 300 ETF batch | 300 histories, 900 replay calculations, 300 rolling calculations; 0 failures |
| 15 index contexts | 15 passed; ETF investment options rejected |
| Browser layout | 1440/1280/1024/768/390px; no horizontal overflow |
| Browser data flows | synthetic teaching fixture plus 159919, VOO and 02800; all calculated |
| Source scan | no credentials, private keys, local user paths, internal watermark assets or build outputs |

The batch compares the new MoonBit output with the original TypeScript engine at commit `0d07e0dd212bcd942de366e9650d05042bf0099e`. The original engine is a regression reference; matching it does not prove its methodology is correct. Deliberate semantic differences are recorded in `docs/methodology.md`.

The browser check used the saved original GitHub Pages data endpoint for the three real ETF examples. No live market claim is made; the data remains a saved snapshot and its display/re-distribution permission is not confirmed.

Remote GitHub CI, repository creation, release tags and original-site integration are pending. They must not be reported as complete until their actual status is recorded here.
