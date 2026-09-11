# Reference and capability inventory

Original MIT source: https://github.com/Maureen-11/investing-clarity-lab/tree/0d07e0dd212bcd942de366e9650d05042bf0099e
Copied presentation: homepage, layout, globals, public overrides, plan page, capability presentation and TypeScript data types. Original author attribution remains in LICENSE. No market history files are copied.

| Module | Original behavior | MoonBit integration |
| --- | --- | --- |
| Home | Hero, explanation card, steps, lessons, footer | Presentation reuse |
| Search | Securities, markets, related index ETFs | Metadata loading/filtering |
| Plan | Future calendar, frequency, principal | MoonBit `ui_json` projected-plan API |
| History | Specific and rolling paths | Existing analyze API |
| Risk | Growth, annual return, drawdown, recovery | MoonBit metrics with short-history annualization guard |
| Comparison | Common calendar interval | MoonBit metrics-only shared interval API |
| Fees | Product counterfactual and channel fee paths | MoonBit feeDrag and channel analysis |
| Sources | Provenance, dates, licensing, macro data | Preserve loaded metadata |
| Proxy | VOO/SPY synthetic extension | Disabled by accepted actual-history-only constraint |

Reference and replica screenshots are stored locally under ignored `artifacts/replica/` for 1440, 1280, 1024, 768 and 390px. The local browser check reported no horizontal overflow and exercised ten representative securities. Original Chinese interface has no verified language switch. Production publication remains a later, separately approved action.
