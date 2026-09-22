# G-RESCUE-STATE：救助审核/基金页面与审核动作

日期：2026-09-19  
范围：`packages/rescue` 审核列表、审核详情、救助基金分包注册与审核动作边界  
状态：**PAGE_AND_ACTION_SUB_BATCH_COMPLETE**；未提交；未上传；未发布

## 交付内容

本批在既有 `packages/rescue` 分包中登记并实现：

- `pages/review/index.vue`：按可信评审人展示待审核/已处理列表。
- `pages/review/detail/index.vue`：显示单项材料，并提供一次性“通过救助/否决救助”动作。
- `services/reviewActionAdapter.js`：本地读写边界与审核动作合同；`reviewAdapter.js` 仅提供分包入口。
- `tests/review-action.test.cjs`：可信会话、明确评审关系、状态跃迁、幂等和资金隔离测试。

已有 `rescue.fund`、`rescue.detail` 路由合同保持不变；新审核页在既有救助分包内直接登记，避免为审核列表增加主包路由依赖。

## 治理边界

动作适配器每次从会话提供器读取 `sessionId` 与 `actor.id/roles`，要求 `reviewer` 角色，并要求记录或嵌套 `review` 中存在与当前 actor 一致的 `reviewerId`/`reviewerIds`。申请人、owner、展示角色、query 参数和证实关系都不能授权审核。

唯一允许的写跃迁是 `pending -> approved` 或 `pending -> rejected`。已处理记录不接受新的动作；重复使用同一 `idempotencyKey` 和同一结果会返回 `duplicate` 且不再写入。审核动作只更新 review 状态和审核元数据，资金状态、打款状态与支付动作全部拒绝。补材料和重审入口未开放。

生产默认边界只读取/写入既有 `PAWHOME_RESCUES`，没有新增 root navigation/storage import、storage key 或支付 API。读写器与写入器可注入，供测试和未来服务端适配使用；页面只使用分包服务入口。

## 验证

本批已执行：

- `node --test packages/rescue/tests/review-action.test.cjs packages/rescue/tests/proof-flow.test.cjs`：10/10 PASS。
- `npm run test:governance`：315/315 PASS。
- `npm run check:routes`：PASS（当前共享工作树为 73 registered/source pages）。
- `npm run check:native-ui`：PASS（当前共享工作树扫描 268 files，35 historical violations frozen）。
- `npm run build:mp-weixin`：PASS；`packages/rescue=84,528 bytes / 82.5 KiB`。最终合并产物 main 为 `1,572,700 bytes`，全量为 `4,092,290 bytes`。
- `npm run check:package:final`：PASS；未放宽预算或冻结新增例外。

## 2026-09-19 总工复验补充

审核列表/详情已在 `packages/rescue` 分包可编译、可达；动作仍要求可信 `sessionId + reviewer actor + explicit reviewer relation`，只允许 `pending -> approved/rejected`，重复动作幂等，资金/支付与补材料/重审均未开放。基金页继续保持公开只读展示，基金状态不由审核结果推断。当前窗口未注入真实 reviewer fixture，因此只完成静态/构建与页面入口验收，未执行真实审核写入。

如果最终包体门禁仍受工作树其他批次影响，应报告 `main` 字节数和既有超限来源；不得通过新增主包依赖或放宽预算绕过门禁。

## 回滚

回滚单位为 `packages/rescue/pages/review/**`、`packages/rescue/services/reviewActionAdapter.js`、`packages/rescue/services/reviewAdapter.js`、对应测试、handoff 和 `pages.json` 中两条审核页登记。既有救助记录、基金页、证实流程、路由合同和 storage key 不需要数据迁移。


## 2026-09-19 最新总工复验

审核列表/详情和基金页已在当前 dev 产物可达；个人页“求助评审”已切换到 `/packages/rescue/pages/fund/index`，画面显示基金统计/待投票列表，未执行任何审核、投票、打款或支付动作。审核写动作 focused **7/7**、审核/证实页面 focused **10/10**，联合 `npm run test:governance` **318/318**；`check:routes` **73/73**、`check:figma-map` **45 states**、UI/native、构建和 `check:package:final` 均通过。

最新 final 主包 **1,572,707 bytes / 1535.8KiB**，距 1.5MiB 目标余 **157 bytes**；`packages/rescue` **84,528 bytes / 82.5KiB**。基金仍只读，资金状态不由审核结果推断；补材料/重审保持关闭。当前窗口没有可信 reviewer fixture，因此不宣称真实审核写入已运行验收。
