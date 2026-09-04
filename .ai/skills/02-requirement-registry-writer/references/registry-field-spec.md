# 需求注册表字段规范

本文件定义当前项目 `src/requirements/schema.ts` 和各页面 `*.registry.ts` 的使用规则。除代码字段名外，说明文字优先使用中文。

落地前先读：

```txt
.ai/skills/shared/project-context.md
.ai/skills/shared/logic-writing-spec.md
src/requirements/schema.ts
src/requirements/index.ts
```

本项目用 **TypeScript** 描述结构，不生成 JavaScript registry。

需求注册表记录的是“完整页面业务逻辑”，不是“已确认问题列表”，也不是“当前前端实现说明书”。当前保守方案下，用户可见业务逻辑正文继续使用 `display` + `operation`。平板端需求默认要对照 PC 端对应业务能力；PC 已明确且 Pad 只是交互适配时，业务口径优先沿用 PC。

## 总体结构

每个页面或流程生成一个 `RequirementRegistry`，以当前 `src/requirements/schema.ts` 为准。常用字段包括：

| 字段名 | 中文名称 | 用途 |
| --- | --- | --- |
| `registryId` | 注册表编号 | 标识当前页面或流程的需求注册表 |
| `pageName` | 页面名称 | 页面、组件或流程的人类可读名称 |
| `route` | 页面路由/视图标识 | 例如 `/tablet-ai-entry` |
| `module` | 所属业务模块 | 用于右侧 PRD 面板和 Markdown PRD 分组 |
| `description` | 注册表说明 | 简述覆盖范围和业务边界 |
| `sourceDecisionFile` | 来源决策文件 | 追溯 `.decision.md` |
| `relatedFiles` | 相关代码文件 | 标识与页面逻辑相关的 Pad 文件和 PC 对照文件 |
| `requirements` | 需求项列表 | 进入页面角标、右侧 PRD 面板、Markdown PRD 的需求项 |
| `excludedDecisions` | 未纳入需求卡片的决策 | 记录范围外或本次不处理的决策 |

## RequirementItem 使用规则

以 `src/requirements/schema.ts` 中 `RequirementItem` 为唯一准绳。不要在 Skill 内另造一套 schema。

常用字段含义：

| 字段名 | 中文名称 | 用途 |
| --- | --- | --- |
| `id` | 需求编号 | 稳定引用编号，例如 `UPLOAD_FILES-001` |
| `title` | 需求标题 | 右侧 PRD 列表和 Markdown PRD 标题 |
| `sourceType` | 来源类型 | 区分需求主要来自代码、决策或二者合并 |
| `objectType` | 对象类型 | 标识需求对应对象 |
| `objectName` | 对象名称 | 页面上的具体对象名称 |
| `module` | 所属模块 | 用于分组展示 |
| `pageName` | 页面名称 | 所属页面/流程名称 |
| `route` | 页面路由/视图标识 | 页面跳转或视图定位依据 |
| `anchorId` | 页面锚点编号 | 对应 `data-req-anchor` |
| `anchorStatus` | 锚点状态 | 使用现有枚举 |
| `activate` | 激活路径 | 点击右侧需求时打开正确页面状态 |
| `display` | 展示逻辑 | 用户可见正文的一部分 |
| `operation` | 操作逻辑 | 用户可见正文的一部分 |
| `acceptance` | 验收标准 | 用于验证需求是否实现 |
| `source` | 来源信息 | 追溯决策、Pad 代码文件和 PC 对照文件 |

## `display` / `operation` 正文规则

当前仓库不使用 `logicSections` 作为落地字段。写作时先按 `.ai/skills/shared/logic-writing-spec.md` 收集规则，再映射到：

- `display`：展示说明、状态展示、空状态、禁用态、数据展示规则。
- `operation`：操作说明、前置条件、结果流转、权限、异常处理。

`display.title` 与 `operation.title` 不是固定栏目名。必须先完成当前对象的全部业务逻辑，再依据各自正文生成简短标题。例如“状态规则”“入口操作”“学科流转”“数据规则”“异常处理”均只是可能结果，不得把任何一组示例当成全项目统一模板。展示层应优先读取注册表中的实际标题。

禁止：

- 为凑结构写“无额外权限限制”“无异常场景”等空兜底。
- 在 `display` 和 `operation` 中重复同一条规则。
- 只写 UI 表象，不写用户操作、失败边界、数据流转等可验收口径。
- 新增未被当前 `schema.ts` 支持的必填字段。
- 先写固定标题，再为了匹配标题拼凑正文。

## 规则素材收集规则

生成每条需求前，必须收集：

### A. Pad 代码已体现

从平板端页面代码提取可见对象与已实现交互：

- 标题、文案、按钮、Tab、弹窗、空状态、禁用态
- 已实现的切换、跳转、打开关闭行为
- 已展示的数据与条件显示

### B. PC 端对应业务逻辑

从 PC 端对应页面、组件、需求注册表或历史决策中提取可沿用口径：

- 上传资料、识别、题目答案匹配、加入试卷等业务结果。
- 输入校验、失败提示、重试、关闭恢复等边界。
- 权限、数据流转、异常处理。

若 PC 对应能力存在，必须把 PC 文件加入 `relatedFiles` 或 `source.relatedFiles`。若找不到 PC 对应项，写明“未确认 PC 对应项”，不要把猜测当作 PC 口径。

### C. Skill1 已确认

从 `产品文档/prd-workflow/decisions/*.decision.md` 读取已拍板口径，作为硬约束写入规则。

### D. 合理延伸

基于 A+B+C，补齐该对象通常必须定清的边界，例如：

- 上传失败、文件格式不支持、文件为空
- 智能切题失败、识别失败、部分识别成功
- 重复点击、重新上传、删除文件、关闭弹窗后状态是否保留
- 题目答案匹配失败、题型缺失、加入试卷前校验

## PC / Pad 差异记录规则

1. Pad 与 PC 业务口径一致：正文直接写统一口径，来源中同时追溯 Pad 和 PC 文件。
2. Pad 只是交互不同：正文写业务结果一致，必要时在操作说明中写清 Pad 的触控或步骤差异。
3. Pad 与 PC 业务结果不同：必须说明差异原因；若原因未确认，回到 Skill1 提问，不直接写入最终口径。
4. PC 有但 Pad 缺失：进入 Skill1 待确认问题，不能在 Skill2 中擅自补成已确认规则。
5. Pad 独有能力：标记为 Pad 独有，并说明没有确认到 PC 对应项。

## 需求拆分粒度

按「一个核对入口 = 一个可独立拍板的业务决策」拆条。

应拆开：

1. 决策对象不同，例如上传资料 vs 选择识别方式。
2. 页面落点不同，例如学段学科选择 vs 已上传文件列表。
3. 验收点不同，例如下一步禁用规则 vs 上传失败提示。
4. 有独立 UI 或独立业务口径。

不应拆开：

1. 同一字段下的枚举选项。
2. 同一操作的连续步骤，若只描述同一入口怎么用。
3. 拆开后大量重复、无法从页面位置区分的规则。

## 编号 / 锚点 / activate

编号示例：

```txt
TABLET_ENTRY-001
UPLOAD_FILES-001
OCR_MODE-001
BOX_RECOGNITION-001
QUESTION_REVIEW-001
```

锚点示例：

```txt
tablet.entry.start
upload.files.local-tab
ocr.mode.auto-detect
box-recognition.question-box
question-review.join-paper
```

`activate` 常见动作：`navigate`、`openDialog`、`setStep`、`setTab`、`scrollTo`、`highlight`、`openPanel`。含义见 `project-context.md`。

已有编号不要重排；删除编号不复用。
