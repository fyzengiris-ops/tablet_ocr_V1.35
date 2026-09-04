---
name: requirement-registry-writer
description: 当需要把平板端 OCR 页面代码、PC 端对应业务逻辑、Skill1 已确认决策，以及合理延伸的业务边界，合并成完整结构化需求注册表时使用；用于生成或更新 src/requirements/schema.ts、页面 registry.ts 和统一导出 index.ts。当前保守方案下，用户可见业务逻辑写入现有 display / operation 字段，供页面角标、悬浮面板、右侧 PRD 面板、Markdown PRD 同源读取。
---

# 需求注册表生成 Skill

## 目标

为当前页面或流程生成完整业务逻辑注册表。

注册表不是“只记录被用户确认过的问题”，也不是“只描述当前前端已经实现了什么”。它是该页面对象应有的完整业务规则源数据，供 Skill3 / Skill4 / Skill5 同源使用。

本 Skill 不负责重新向用户做全量审核，也不负责实现角标或右侧面板。它负责：收集平板代码事实、PC 对应逻辑、Skill1 决策和合理延伸，写入现有 `display` / `operation` 结构、编号并结构化落盘。

执行前必须先读：

```txt
.ai/skills/shared/project-context.md
.ai/skills/shared/logic-writing-spec.md
.ai/skills/02-requirement-registry-writer/references/registry-field-spec.md
src/requirements/schema.ts
src/requirements/index.ts
```

## 输入来源（四来源）

1. **A. Pad 页面代码已体现**  
   识别平板端对象是什么、页面露出了什么交互与文案。必要，但通常不够。

2. **B. PC 端对应业务逻辑**  
   默认作为业务口径基线。若 PC 已明确且 Pad 只是交互适配，需求正文应沿用 PC 口径，并在 `source.relatedFiles` 追溯 PC 对应文件。

3. **C. Skill1 已确认决策**  
   默认读取：

```txt
产品文档/prd-workflow/decisions/*.decision.md
```

   已确认口径是硬约束。

4. **D. 合理延伸**  
   基于 A+B+C，补齐该类对象通常必须定清、且与已确认口径一致的边界场景。  
   例如：上传失败、识别失败、部分成功、重复提交、关闭弹窗、重新上传、答案匹配失败、加入试卷前校验等。

如果用户没有指定具体决策文件：

1. 若目录下只有一个 `.decision.md`，直接使用。
2. 若有多个，先列出并询问。
3. 若没有决策文件，仍可基于 Pad 代码 + PC 对应逻辑 + 合理延伸生成，但必须说明“本次无 Skill1 决策补充”；拿不准且影响验收的点应提示回到 Skill1。

## 输出文件

```txt
src/requirements/schema.ts
src/requirements/<页面或流程>.registry.ts
src/requirements/index.ts
```

- `schema.ts`：只在确有必要且用户同意时调整类型。
- `*.registry.ts`：页面注册表。
- `index.ts`：统一导出。

当前保守方案下，默认不新增 `logicSections` 字段，不创建 `js/requirements/*.js`。

## 用户可见正文：display / operation

每条需求必须按现有 schema 写入 `display` 和 `operation`。

生成顺序必须是：

```txt
收集规则素材（A+B+C+D）
-> 整理成原子业务规则
-> 判断展示逻辑或操作逻辑
-> 写入 display / operation
-> 根据最终正文归类并动态生成短标题
-> 去除空兜底与重复规则
```

详细写作规范见：

```txt
.ai/skills/shared/logic-writing-spec.md
```

### 禁止

- 只写当前前端已实现内容。
- 固定塞满所有字段。
- 跨 `display` / `operation` 重复同一规则。
- 为凑结构写空兜底句。
- 把 `logicSections` 写成当前项目必填字段。
- 创建 `js/requirements/schema.js`、`js/requirements/index.js`。
- 把“显示说明”“操作说明”“数据流转”“异常”等示例词固定套用到所有需求。

## 执行流程

1. 确认页面或流程范围。
2. 读取 `project-context.md`、`logic-writing-spec.md`、`registry-field-spec.md`。
3. 读取目标页面相关代码，例如 `src/app/tablet-ai-entry/tablet-ai-entry-preview.tsx`、`src/components/UploadQuestionDialog.tsx`。
4. 查找并读取 PC 端对应页面、组件、registry 或历史决策；找不到时记录为“未确认 PC 对应项”，不要硬套。
5. 读取现有 `src/requirements/*.registry.ts`，复用命名、编号、锚点和导出模式。
6. 读取目标 `.decision.md`（如有）并合并到对应对象。
7. 对每条进入 `requirements` 的需求：
   - 收集 A/B/C/D 规则素材。
   - 写成原子业务规则。
   - 分配到 `display` 或 `operation`。
   - 在正文完成后按实际业务维度归类，为非空内容动态生成简短标题；标题示例不是固定枚举。
   - 生成或复用编号、锚点、`activate`、验收标准、来源信息。
   - 若沿用 PC 业务逻辑，在来源中包含 PC 对应文件；若 Pad 与 PC 不一致，在正文或来源说明中写清差异原因。
8. 范围外决策写入 `excludedDecisions`。
9. 创建或更新页面 `registry.ts`、必要时更新 `index.ts`。
10. 输出生成摘要。

## 哪些内容进入 requirements

满足任一即可：

- 页面上有业务含义的可见对象。
- 用户可执行或不可执行的操作。
- 需要定清的数据来源、状态、排序、异常、识别结果、流转边界。
- 需要角标核对、右侧 PRD 展示或进入 Markdown PRD。

注意：即使 Skill1 未提问，只要对象需要完整业务规则，也要进入注册表；正文不得只停留在 UI 表象。

## 需求拆分粒度

按“一个核对入口 = 一个可独立拍板的业务决策”拆条，不按像素拆，也不按整页大框糊成一条。

应拆开：

1. 决策对象不同，例如上传资料 vs 智能切题。
2. 页面落点不同，例如文件列表 vs 学段学科选择。
3. 验收点不同，例如下一步禁用规则 vs 识别失败重试。
4. 有无独立 UI 不同；无独立 UI 的口径规则仍可成条，但要指定最强关联落点。

不应拆开：

1. 同一字段下的枚举选项。
2. 同一操作的连续步骤，若只描述同一入口怎么用。
3. 拆开后大量重复、只是换了选项名。
4. 拆开后仍只能挂在同一落点，无法让人从位置区分在说谁。

## 锚点选择规则

1. 有明确字段、文案、按钮时，`anchorId` 必须对应那个具体对象。
2. 无独立 UI 的口径规则，锚到与该逻辑关联性最强的可见对象旁。
3. `objectName` 与锚点对象名称应一致，便于 Skill3 贴准角标。
4. 已有编号不要重排；删除编号不复用。

## 运行后摘要格式

```md
一、生成结果
- 已生成/更新注册表：src/requirements/<页面或流程>.registry.ts
- 已更新统一出口：src/requirements/index.ts（如有）

二、进入注册表的需求
1. <需求编号>：<需求标题>（来源：code/code+decision/decision）

三、未纳入需求卡片的决策
- <对象>：<原因>

四、验证结果
- pnpm ts-check：通过/失败/未运行（说明原因）

五、需要后续处理
- <例如：需要 Skill3 为 anchorId 增加 data-req-anchor>
```

## 输出约束

- 除必要路径与字段名外，尽量中文。
- 不要把未确认审核建议写进 registry。
- 不要把“本次不改”伪装成需求卡片。
- 不要只输出代码表面实现。
- 不要与 Skill1 已确认口径矛盾。
- 不要忽略 PC 端已确认业务口径；Pad 与 PC 不一致时必须说明原因。
- 需求 id / 锚点不使用运行时随机值。
