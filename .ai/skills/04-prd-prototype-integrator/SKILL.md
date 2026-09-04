---
name: prd-prototype-integrator
description: 当需要在已经生成需求注册表，并且页面角标/锚点已完成或已确认后，实现右侧 PRD 阅读面板与平板端 OCR 原型页面联动时使用；用于创建可开关可拖拽的右侧 PRD 面板、点击 PRD 卡片定位页面锚点、高亮对象、执行 activate 路径，并与已有角标/悬浮面板同步选中状态。当前保守方案下，业务逻辑详情展示现有 display / operation。不负责分批添加初始页面角标，也不生成 Markdown PRD。
---

# 右侧 PRD 面板联动 Skill

## 目标

基于 `src/requirements` 与页面已有锚点，打通右侧 PRD 阅读面板与平板端 OCR 页面。

最终效果：

- 默认关闭右侧面板，原型页面占满。
- 小 icon 开关面板；打开后挤压原型，可拖拽宽度。
- 点击需求卡片执行 `activate`，定位并高亮锚点。
- 与角标/悬浮面板尽量同步选中。
- 详情区按当前项目现有 `display` / `operation` 展示。

执行前必须先读：

```txt
.ai/skills/shared/project-context.md
.ai/skills/shared/logic-writing-spec.md
.ai/skills/04-prd-prototype-integrator/references/layout-and-activation.md
src/requirements/index.ts
src/requirements/schema.ts
src/components/prd/RequirementReaderShell.tsx
src/components/prd/RequirementPanel.tsx
src/components/prd/RequirementMarker.tsx
src/components/prd/RequirementFloatingCard.tsx
src/components/prd/requirement-utils.ts
```

若指定页面，还要读对应 `*.registry.ts`。

若注册表不存在，提示先跑 Skill2。  
若无稳定锚点且用户未明确要求本次补锚点，提示先跑 Skill3。

## 执行边界

可以：

- 复用或最小调整 `RequirementReaderShell.tsx`、`RequirementPanel.tsx`、`requirement-utils.ts`。
- 包装布局、开关、拖拽宽度、列表、详情、`activate`。

不可以：

- 负责逐个补初始角标，除非用户明确要求最小补齐。
- 生成 Markdown PRD。
- 改写 registry 正文。
- 强行迁移到 `logicSections`。

## 业务逻辑详情渲染

当前保守方案下，右侧详情必须读取现有字段：

1. `requirement.display`
2. `requirement.operation`
3. `acceptance`

右侧详情禁止：

- 自动补空栏目。
- 双编号。
- 展示空兜底说明。
- 读取未迁移的 `logicSections` 作为主正文。

## 布局与激活

布局、拖拽、浮层避让、`activate` 执行方式见：

```txt
.ai/skills/04-prd-prototype-integrator/references/layout-and-activation.md
```

支持动作：`navigate`、`openPanel`、`openDialog`、`setStep`、`setTab`、`scrollTo`、`highlight`。  
优先显式控制器，不要文案模拟点击。

## 注册表使用

从 `src/requirements/index.ts` 读取 registries。列表可用：

- `pageName`、`module`、`requirements`
- `id`、`title`、`sourceType`、`anchorId`、`activate`
- 详情正文：`display`、`operation`

`excludedDecisions` 不作为普通需求卡片。

## 样式

遵循当前 Next.js / React / Tailwind / shadcn/ui 结构。不要新增静态 `js/prd/*.js` 或 `css/prd.css`。

## 验证

```txt
pnpm ts-check
```

检查：默认关闭、可开关、可拖拽、`activate` 有效、详情按 `display` / `operation` 展示、角标独立可用。

## 完成摘要

```md
一、实现结果
- 新增/更新文件：...

二、已支持能力
- 右侧 PRD 面板开关
- 拖拽调整宽度
- 点击定位和高亮
- activate 路径执行
- display / operation 展示：是/否
- 与角标/悬浮面板同步：支持/不支持/部分支持

三、验证结果
- pnpm ts-check：通过/失败/未运行（说明原因）
- 页面检查：...
```
