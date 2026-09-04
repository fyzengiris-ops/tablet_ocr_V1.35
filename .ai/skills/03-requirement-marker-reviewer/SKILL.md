---
name: requirement-marker-reviewer
description: 当需要在 src/requirements 需求注册表基础上，为平板端 OCR 页面或页面局部添加需求编号角标、稳定 data-req-anchor、点击悬浮业务逻辑面板时使用；用于让用户在具体组件、按钮、字段、文案旁边分批核对业务逻辑。当前保守方案下，悬浮面板展示现有 display / operation，不创建右侧 PRD 阅读面板、不执行 activate 联动，也不生成 Markdown PRD。
---

# 页面逻辑角标核对 Skill

## 目标

基于 `src/requirements` 中的需求注册表，把页面里需要核对业务逻辑的对象标出来。

最终效果：

- 页面对象附近展示需求编号角标。
- 点击角标后打开悬浮业务逻辑面板。
- 面板按当前项目现有 `display` / `operation` 展示业务逻辑。
- 可分批完成核对。
- 不接入右侧 PRD 面板，不执行 `activate`，不生成 Markdown PRD。

执行前必须先读：

```txt
.ai/skills/shared/project-context.md
.ai/skills/shared/logic-writing-spec.md
src/requirements/index.ts
src/requirements/schema.ts
src/components/prd/RequirementMarker.tsx
src/components/prd/RequirementFloatingCard.tsx
src/components/prd/requirement-utils.ts
```

若指定页面，还要读：

```txt
src/requirements/<页面或流程>.registry.ts
```

若 `src/requirements` 不存在，停止并提示先运行 `requirement-registry-writer`。

## 执行边界

可以：

- 复用或最小调整 `src/components/prd/RequirementMarker.tsx`、`RequirementFloatingCard.tsx`、`requirement-utils.ts`。
- 在目标 React 组件加 `data-req-anchor` 与 `RequirementMarker`。
- 做不影响视觉主交互的最小包裹。

不可以：

- 创建右侧 PRD Reader Shell。
- 实现拖拽分栏。
- 执行 `activate`。
- 生成 Markdown PRD。
- 改写、重分类、扩写 registry 正文；发现正文问题时提示先回 Skill2 或 Skill6。
- 新增 `logicSections` 作为渲染依赖。

## 悬浮面板渲染

当前保守方案下，悬浮面板必须读取现有字段：

1. `requirement.display`
2. `requirement.operation`
3. `acceptance` 可按现有组件规则展示

分组标题必须读取注册表中根据实际业务逻辑生成的标题，或依据非空正文做语义归类后生成；不得在展示组件中把所有需求统一写死为“显示说明”“操作说明”“权限规则”“数据流转”“异常”等固定栏目。示例标题只表示推荐的简短风格，不是固定集合。

悬浮面板禁止：

- 展示空兜底说明。
- 展示技术字段名、大段路径、`excludedDecisions`。
- 因 skill 迁移强行改成未被当前 schema 支持的 `logicSections`。
- 对已有条目再套多层编号造成双编号。
- 忽略 registry 中的实际标题，使用展示层硬编码标题覆盖。

## 页面锚点与角标

```tsx
data-req-anchor="<anchorId>"
```

锚点必须来自注册表 `anchorId`。

贴准规则：

1. 角标必须贴在本条需求对应的具体对象上，例如按钮、步骤、Tab、文件列表、题干框、答案框。
2. 禁止把字段级需求的锚点只挂在无关父级大容器上。
3. 无独立 UI 的口径规则，挂在注册表指定的最强关联落点旁。
4. 小尺寸对象优先使用紧邻或行内贴标，避免绝对定位漂到远处角落。
5. 页面角标显示本批连续短号；悬浮面板内仍显示完整需求编号。
6. 角标可靠近对象、不遮挡主操作、可点击、选中态清晰。

## 分批核对

优先顺序：

```txt
主流程 -> 关键入口 -> 字段/步骤/Tab -> 弹窗/空态/异常
```

每批说明：已加角标编号、对应对象、未处理范围、是否改了公共 PRD 组件。

## 验证

```txt
pnpm ts-check
```

并检查：

- `/tablet-ai-entry` 可打开。
- 角标可点击。
- 悬浮面板显示 `display` / `operation` 内容。
- 无空栏目、无双编号、无遮挡。

## 完成摘要

```md
一、实现结果
- 新增/更新文件：...

二、本批已支持核对
- 已加角标需求：...
- 对应页面对象：...

三、未处理范围
- ...

四、验证结果
- pnpm ts-check：通过/失败/未运行（说明原因）
- 页面检查：...
```
