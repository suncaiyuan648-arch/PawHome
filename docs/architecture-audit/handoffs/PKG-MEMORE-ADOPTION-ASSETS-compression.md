# PKG-MEMORE-ADOPTION-ASSETS 压缩专项交接

taskId: `PKG-MEMORE-ADOPTION-ASSETS-compression`  
owner: 总工程师（C0 收口）  
前置：`PKG-MEMORE-ADOPTION-ASSETS` 已验收；本批只处理其记录的分包原图压缩尾项。

## 交付

`pages/meMore/static/figma/adoption-flow/` 下三个只由 `PawAdoptionFlowFigma` 使用的 PNG 已转为**无损 WebP**，组件引用同步改为 `.webp`：

| 文件 | 原字节 | 新字节 | 节省 | 尺寸 | 渲染像素 SHA-256（RGBA） |
|---|---:|---:|---:|---:|---|
| `06034d7f1be7897c6f56e74b047d3499044297a1` | 297,723 | 179,320 | 118,403 | 480×723 | `44b63bebbe14d27121a9fa61041926f7b0169e0c916a58f6d86a195db76cf0d6` |
| `07acee523d24ba7ebaf21ec60dee542f1e3fdcd4` | 562,636 | 363,058 | 199,578 | 474×842 | `996c5ee2deca06c242e16a629510e3ac1332fab330b345259da5a8c5c0a6a889` |
| `e435a06f02d1fc46102464a34d8d58adf66e97bb` | 223,189 | 139,982 | 83,207 | 410×410 | `632afb488f3ed5839e00acee5f2e40f20366fae6e3abe8943423ef4663564636` |

合计节省 **401,188 bytes**。压缩通过解码后的像素哈希复验，未改变宽高、透明度或渲染像素；没有使用有损质量参数，也没有把共享主包资源误删。

## 验收

```text
node --test tests/governance/memore-adoption-assets.test.cjs   PASS
```

构建后必须重新执行 `check:assets`、`check:package:final`，确认 WebP 引用被正确复制到 `pages/meMore` 分包，且不存在旧 PNG 重复产物。运行验收只需复核领养流程页面的图片显示，无业务写入。

## 总工复验结果

2026-09-16 在用户已手动打开的 DevTools `unpackage/dist/dev/mp-weixin` 窗口中只读进入 `pages/meMore/adoptionFlow?frame=44&id=demo-pending`：领养申请标题、说明、两张申请图片和两只申请领养的猫咪均正常显示；清空 Console 后调试器显示 `Errors: 0 / Warnings: 0`。未执行领养确认、投喂、上传或其他业务写入；本批未做 Figma 像素级几何/视觉验收。

## 边界

本批不改变页面布局、路由、状态或主包共享资源；其余 `pages/meMore` 文件仍可能超过 1.5MiB 质量建议，需以构建后的最新包体报告为准。
