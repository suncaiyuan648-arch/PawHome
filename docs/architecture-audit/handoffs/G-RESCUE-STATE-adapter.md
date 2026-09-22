# G-RESCUE-STATE 只读 adapter 交接

taskId: `G-RESCUE-STATE-adapter`  
owner: 总工程师（C0 收口）  
范围：A05 的救助状态读取接入；本批不开放状态迁移、投票、打款或任何写操作。

## 交付

- 新增 `packages/rescue/services/stateAdapter.js`。
- 新增 `tests/governance/rescue-state-adapter.test.cjs`，覆盖 6 项反例。
- adapter 只调用既有 `utils/rescueStorage.js#getRescueById`，状态解释统一交给 `stateContract.js#normalizeRescueState`。
- 默认 `includeDemo: false`，公开演示只能显式传 `includeDemo: true`；缺失、非法或跨形态 ID 不回落到首条演示记录。
- 返回固定 `{ success, source, data, error, readOnly: true, canWrite: false }`；状态三轴的未知/冲突结果仍由合同返回，不被 adapter 改写成成功。
- 提供同步 `readRescueStateWithResolver` seam，拒绝异步 resolver，供后续云端读取替换而不把页面参数当状态。

## 验收

```text
node --check packages/rescue/services/stateAdapter.js   PASS
node --test tests/governance/rescue-state-adapter.test.cjs   6/6 PASS
```

测试通过临时 ESM 根注入 `uni` storage，验证只读取 `PAWHOME_RESCUES`、不创建第二个 key；同时覆盖缺 ID/非法 ID、缺少 demo 显式开关、三轴状态、付费前置冲突、resolver error/Promise、只读冻结结果。

## 未完成边界

- 尚未接入救助进度、基金、评审详情页面或任务聚合入口。
- 未实现任何审核/投票/资金状态写入；普通 actor 仍不能获得资金写能力。
- C1 adapter、页面交互、返回刷新以及 DevTools 六项运行/几何/视觉证据仍待后续批次。
