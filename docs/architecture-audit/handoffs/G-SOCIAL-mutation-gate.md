# G-SOCIAL / 社交删除与更正意图交接

日期：2026-09-19  
范围：动态评论/社交对象删除、更正的 fail-closed 意图边界  
状态：**CONTRACT_SUB_BATCH_COMPLETE / PERSISTENCE_POLICY_PENDING**

## 交付范围

新增 [`navigation/socialMutationContracts.js`](../../../navigation/socialMutationContracts.js)
与 [`tests/governance/social-mutation-contract.test.cjs`](../../../tests/governance/social-mutation-contract.test.cjs)。

`evaluateSocialMutation` 只接受 `delete`、`correct` 两类意图，以及精确
`dynamicId + commentId`、当前对象快照和可信 actor provider。对象关系必须由当前记录的
`authorId`/`authorUserId`/`userId`/`ownerId` 之一与可信 actor 匹配；query、role、展示状态
和任意额外字段不能提权。对象 ID 不匹配、ID 不透明、缺 actor、关系不成立和未知意图均
明确失败。

当前仓库没有批准的社交持久 writer、删除策略、纠正审核策略或 moderation backend，
因此即使作者关系成立，结果仍固定为 `SOCIAL_MUTATION_UNAVAILABLE`，并返回
`readOnly:true/canWrite:false`。本批不修改评论/动态 storage，也不从页面 mock 产生
删除成功提示；补材料/重审状态保持关闭。

## 验证

```text
node --check navigation/socialMutationContracts.js                 # PASS
node --test tests/governance/social-mutation-contract.test.cjs      # 3/3 PASS
npm run check:boundaries                                            # PASS
```

后续必须先批准社交对象持久 reader、作者/版主策略、纠正版本模型和审计日志，再由独立
批次接入页面按钮与真实写动作。不能因为当前 actor 是作者或带有 moderator 文案就直接
调用 storage 删除。
