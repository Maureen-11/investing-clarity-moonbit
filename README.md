# 简投学堂 MoonBit / Investing Clarity MoonBit

[English](README.en.md) · [前期网站与数据仓库](https://github.com/Maureen-11/investing-clarity-lab) · [接口](docs/api.md) · [验证报告](docs/verification.md)

面向金融初学者的长期投资计算引擎。用真实历史理解投入、波动、汇率、费用和购买力；不提供证券买卖建议或未来收益承诺。

这是独立的 MoonBit 仓库。前期 TypeScript 网站提供产品验证、历史数据和回归对照；本项目用 MoonBit 实现计算，通过 WebAssembly 接入轻量网页。算法参考关系和差异见 [方法说明](docs/methodology.md)。

## 当前功能

- 每日、每月、每年投入；月末和闰年处理；按实际历史交易日期顺延。
- 初始资金、理论碎股、整手和报价货币现金余额。
- 历史回放、滚动路径、年度表现、回撤和恢复时间。
- 历史汇率、历史CPI与固定情景；独立费用反事实估算，不重复扣费。
- 历史不足时显示实际可用区间；不足一年保留事实统计并关闭年化。
- 指数只提供市场统计；两只标的按共同日历区间比较的 API。
- 浏览器按需加载原项目数据，人工离线示例须由用户主动选择。
- 工具页提供“人工教学示例”，无需外部行情即可复核 MoonBit 的 JSON 输入、投入次数和期末价值。

本地已验证原数据包300只ETF及15个指数。数据文件仍在原仓库，本仓库不复制完整市场历史。当前为公开的 `0.1.0-candidate`；[GitHub Actions CI](https://github.com/Maureen-11/investing-clarity-moonbit/actions) 和 [Pages 演示](https://maureen-11.github.io/investing-clarity-moonbit/) 已部署，正式 release 与原站接入状态见 [进度](docs/progress.md)。

## 安装与运行

需要 Node.js 24+、pnpm 9.15.4 和 MoonBit 工具链。已测试编译器 `v0.10.12+1634b282e`、moon `0.1.20260904`。安装方法见 [官方文档](https://www.moonbitlang.com/download)。可设置 `MOON_HOME` 指向独立安装目录。

```sh
git clone https://github.com/Maureen-11/investing-clarity-moonbit.git
cd investing-clarity-moonbit
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm install --frozen-lockfile
node scripts/moon.mjs check
node scripts/moon.mjs test
node scripts/build.mjs
node --test tests/*.test.mjs
pnpm run dev
```

也可以直接打开 [Pages 演示](https://maureen-11.github.io/investing-clarity-moonbit/)。本地运行时打开 `http://127.0.0.1:4188/`，然后访问 `/plan/`；网页预览需要 Next/React 依赖，MoonBit 单元测试仍可独立运行。浏览器需支持 Wasm GC、JS String Builtins及模块Worker，已验证本机 Chrome；其他浏览器尚未逐一验证。静态导出使用 `pnpm run build:web`，输出在 `out/`。

网页中先选择标的或人工教学示例，再设置日期、投入频率、金额和期限。离线教学示例来自仓库内的人工三点数据，只用于复核，不代表任何真实证券。高级设置可调整汇率、CPI、费率情景及交易单位。期末价值包含本金；购买力金额使用起始日的人民币价值尺度。

## 输入输出示例

以下数据完全人工构造，不代表任何ETF：

```json
{
  "schemaVersion": 1,
  "instrumentKind": "etf",
  "requestedYears": 20,
  "history": {"points": [["2020-01-01",10],["2020-01-02",10],["2020-01-03",15]]},
  "options": {"frequency":"daily","payment":100,"initial":0,"inflation":0,"fxRate":1,"feeRate":0}
}
```

实际引擎测试确认：投入2次、总投入200元、期末价值300元、期末购买力300元。最后一个观察日只估值，不再投入；实际只覆盖2个日历日，不生成20年年化结论。

## 数据、许可与限制

- 历史来自原项目的最近已保存快照，不是实时行情；页面分别展示历史末日与抓取日期。
- 供应商调整价格不等同于基金公司官方总回报。价格序列、总收益和指数不可混称。
- 原市场历史的公开展示和再分发许可尚未确认。本仓库MIT仅覆盖软件，不授予第三方数据权利。告知风险不能替代授权。
- 佣金、税费、买卖价差和真实成交约束未完整建模；费用拖累只是反事实情景。
- 图表为抽样路径；完整序列用于计算。相邻滚动窗口重叠，不代表独立样本或未来概率。
- 网页不保存用户计划；外部数据请求仍会向数据托管方发送正常网络请求。详见 [安全说明](SECURITY.md)。

## 开发与参赛

先读 [AGENTS.md](AGENTS.md)、[任务包](docs/implementation-plan.md) 和 [进度](docs/progress.md)。AI辅助编写代码、测试和文档；项目负责人需要能够解释算法、验证和设计取舍。现有网站及其300只ETF不是本期从零新增的参赛成果。

未来扩展为教育性计划引导、后端接口和PDF报告，目前不宣称已经完成。MIT许可及原项目算法署名见 [LICENSE](LICENSE)。
