# 右侧 PRD 面板布局与激活实现参考

## 与页面角标 Skill 的关系

`requirement-marker-reviewer` 负责把页面组件、按钮、字段和文案旁边的需求编号角标、`data-req-anchor`、悬浮业务逻辑面板先做出来。

本参考文件只服务于右侧 PRD 面板联动：

- 复用已经存在的 `data-req-anchor`。
- 复用当前 `src/components/prd` 组件。
- 不重复创建第二套页面编号角标。
- 不把 Markdown PRD 生成混入前端联动实现。

如果目标页面缺少锚点，默认先回到 `requirement-marker-reviewer` 补齐。只有用户明确要求时，才在本阶段补最小必要锚点。

## 总体布局

推荐复用现有 React Shell：

```txt
src/components/prd/RequirementReaderShell.tsx
src/components/prd/RequirementPanel.tsx
```

Shell 内部负责：

- PRD 面板开关状态。
- PRD 面板宽度状态。
- 当前选中需求。
- 当前高亮锚点。
- 页面锚点查找与滚动。
- 和已有页面角标/悬浮面板同步选中需求。

打开面板时，原型区域应被挤压或使用现有布局规则避让右侧面板；不要让右侧面板覆盖核心操作。

## 拖拽宽度

PRD 面板宽度建议：

- 默认：360px 或浏览器宽度 25%。
- 最小：280px。
- 最大：浏览器宽度 50%。

拖拽时监听 Pointer Events，更新组件状态或 CSS 变量。

不要在渲染逻辑中直接使用 `Date.now()`、`Math.random()` 或 `typeof window` 造成 hydration 风险；动态数据应放在客户端挂载后的 state/effect 中处理。

## 页面浮层定位

如果原型页面内部有贴右侧的浮层，打开 PRD 面板后可能与右侧面板重叠。

处理策略：

1. 优先复用现有布局容器。
2. 对需要在原型区域内定位的浮层，基于原型容器定位。
3. 如果必须使用 fixed，则在 PRD 面板打开时用 CSS 变量补偿右侧面板宽度。
4. 对上传弹窗、选择框、Popover 等浮层，优先保证可读、可点、不遮挡主流程。

## activateRequirement 建议流程

```ts
async function activateRequirement(requirement: RequirementItem) {
  setSelectedRequirement(requirement.id);

  for (const step of requirement.activate) {
    switch (step.type) {
      case "navigate":
        // 跳转到 /tablet-ai-entry；已在目标页则不重复跳转。
        break;
      case "openDialog":
        // 调用页面提供的显式控制器，例如打开上传资料弹窗。
        break;
      case "setTab":
      case "setStep":
        // 设置平板端 OCR 流程步骤或 Tab。
        break;
      case "scrollTo":
        // 等待 React 更新后 querySelector(`[data-req-anchor="${step.anchorId}"]`)。
        break;
      case "highlight":
        // 设置当前高亮 anchorId。
        break;
    }
  }
}
```

关键要求：

- 优先使用显式状态控制器。
- 不要依赖按钮文案模拟点击。
- 需要等待弹窗、步骤或 Tab 挂载后，再滚动和高亮。
- 如果某个激活动作暂时无法执行，要降级为滚动/高亮已存在锚点，并在摘要中说明。

## 业务逻辑详情渲染

当前保守方案下，右侧面板详情区读取：

```txt
requirement.display
requirement.operation
requirement.acceptance
```

禁止：

- 自动补空栏目。
- 展示空兜底说明。
- 双编号。
- 把未迁移的 `logicSections` 当成主正文。

## 过滤空兜底说明

若正文中出现下列空兜底，默认不展示：

```ts
const emptyFallbacks = new Set([
  "无额外权限限制",
  "无额外数据流转",
  "无异常场景",
  "本对象无操作入口",
  "本对象仅展示",
  "沿用页面权限",
  "暂无",
  "无",
]);
```

空字符串、空数组不输出。
