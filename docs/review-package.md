# MVP review package

This page is the short, reproducible review guide for the MoonBit September Hackathon submission. It describes the current candidate; it is not a claim that the organizer has accepted the project.

## Project direction

The project belongs to the site's fourth direction, “应用与内容工具” (application and content tools). It is a financial education and long-term investment visualization tool for beginners. The browser keeps the interaction and rendering, while MoonBit performs the financial calculations and is compiled to WebAssembly.

## What was reused and what was added

The earlier `investing-clarity-lab` supplied the product prototype, React presentation, securities directory, saved market data and regression reference. This repository keeps that relationship explicit and does not copy the complete market history.

The current iteration adds a MoonBit implementation of the version 1 calculation contract, including schedules, contribution and cash handling, historical replay, rolling paths, annual metrics, drawdown and recovery, historical FX/CPI, fee counterfactuals and common-history ETF comparison. It adds a Worker/Wasm browser bridge, an independent offline teaching fixture, responsive page integration, failure handling and regression tests. The algorithms are described as a reimplementation informed by the prior project, not as a claim of inventing a new financial method.

## Five-minute demonstration

1. Open the plan page and click “使用人工教学示例”. The result should show 2 contributions, 200 yuan of principal and 300 yuan of ending value. This fixture is artificial and is only for checking the engine without network data.
2. Choose an ETF such as VOO, set a frequency, amount, start date and duration, then wait for the saved history to load. Explain the separation between total contributions, ending account value, purchasing power and drawdown.
3. Change the inflation setting. The nominal account value stays tied to the historical path; the purchasing-power figure changes. Turning on contribution growth changes future nominal contributions as a separate assumption.
4. Select a second ETF in the comparison area. The comparison uses only the shared historical interval and keeps each product's original type and source metadata.
5. Show the repository README, `docs/api.md`, tests and CI. Explain that React formats and renders the returned data; MoonBit owns the financial result.

## Reproduction commands

```sh
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm install --frozen-lockfile
node scripts/moon.mjs check
node scripts/moon.mjs test
pnpm run lint
pnpm run build:web
node --test tests/*.test.mjs
```

The current local verification recorded 27 MoonBit tests, 27 Node/bridge tests, a 300-ETF and 15-index compatibility run, five viewport checks without horizontal overflow, and a static browser smoke that loaded `/`, `/plan/`, the Worker, Wasm and the offline teaching result.

## Known limits to state during review

- Historical data is a saved snapshot, not live market data. The original data's public display and redistribution permission remains unconfirmed.
- The vendor-adjusted price series is not presented as an issuer's official total-return series.
- The application is educational research, not individualized investment advice or an order-execution service.
- The September page requires a public repository, traceable development records, a runnable example, tests, substantive work and explainable AI assistance. The current page does not publish a verified minimum commit count; any “ten commits” requirement should be confirmed with the organizer.

## Re-review message template

> 我的项目“简投学堂 MoonBit 版”已补充可运行 MVP：MoonBit 负责定投日程、投入、历史回放、风险、费用、汇率和通胀计算，并通过 WebAssembly 接入网页；仓库提供离线教学示例、README、测试、CI 和可复现命令。前期 React/TypeScript 网站、证券目录和历史资料作为既有基础已在文档中披露。本次新增工作的提交、PR 和演示链接如下：
> 
> 仓库：https://github.com/Maureen-11/investing-clarity-moonbit
> 
> 请问当前版本是否可以按“应用与内容工具”方向重新审核？另外，赛期提交数量是否存在必须达到的最低值（例如十个有实质内容的 commits），以及是否需要补充项目分类说明或其他验收材料？
