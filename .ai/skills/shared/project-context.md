# 平板端 OCR 项目上下文

本文件约束 `.ai/skills` 下全部 Skill 在本仓库中的落地方式。执行任一业务逻辑相关 Skill 前，必须先阅读本文件。

## Skill 主流程顺序

业务逻辑相关 Skill 默认按以下顺序执行：

```txt
Skill0 页面对象清单 -> Skill1 页面逻辑审核 -> Skill2 需求注册表 -> Skill3 角标评审 -> Skill4 右侧 PRD 面板联动 -> Skill5 Markdown PRD
```

| Skill | 目录 | 作用 |
| --- | --- | --- |
| 0 | `00-page-object-inventory` | 先锁「审什么」：列页面对象清单，让用户确认必审/可跳过 |
| 1 | `01-page-logic-auditor` | 再定「怎么定」：只对已确认「必审」对象出决策题 |
| 2 | `02-requirement-registry-writer` | 把代码事实、Skill1 决策和合理延伸写入现有 TypeScript 需求注册表 |
| 3 | `03-requirement-marker-reviewer` | 在页面对象旁接入需求编号角标和悬浮业务逻辑面板 |
| 4 | `04-prd-prototype-integrator` | 接入右侧 PRD 阅读面板、定位、高亮和激活路径 |
| 5 | `05-registry-to-prd-generator` | 从已核对的注册表生成页面级 Markdown PRD |
| 6 | `06-requirement-annotation-refiner` | 清洗现有 `display` / `operation` 注释表达 |

清单落盘路径：

```txt
产品文档/prd-workflow/inventories/<页面或流程>.inventory.md
```

决策记录落盘路径：

```txt
产品文档/prd-workflow/decisions/<页面或流程>.decision.md
```

## 项目类型

本项目是 **Next.js / React / TypeScript** 平板端 OCR 原型项目，不是静态 HTML/CSS/JS 项目。

技术栈：

- Next.js 16 App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui

主要入口与文件：

```txt
src/app/tablet-ai-entry/page.tsx
src/app/tablet-ai-entry/tablet-ai-entry-preview.tsx
src/components/UploadQuestionDialog.tsx
src/components/prd/RequirementMarker.tsx
src/components/prd/RequirementFloatingCard.tsx
src/components/prd/RequirementPanel.tsx
src/components/prd/RequirementReaderShell.tsx
src/components/prd/requirement-utils.ts
src/requirements/schema.ts
src/requirements/index.ts
src/requirements/*.registry.ts
```

主要访问路由：

```txt
/tablet-ai-entry
```

常见本地预览：

```txt
http://localhost:5002/tablet-ai-entry
```

## 当前保守方案

本项目当前运行时注册表结构使用 `display` + `operation`，页面角标、悬浮面板和右侧 PRD 面板也读取这两个字段。

因此本套 Skill 在本仓库中采用保守方案：

- 不把 `logicSections` 作为落地字段。
- 不要求改 `src/requirements/schema.ts`。
- 不要求改 `src/components/prd/*` 的渲染结构。
- Skill2 仍生成或更新现有 `display` / `operation` 字段。
- `logic-writing-spec.md` 中的“先收集规则、再归类、去重、不要空兜底”作为写作方法使用，但最终映射到现有 `display` / `operation`。

若以后用户明确要求升级新版结构，才能另行迁移 `schema.ts`、注册表和 PRD 展示组件到 `logicSections`。

## PC / Pad 业务一致性原则

平板端 OCR 是在平板交互特性下，对 PC 端作业识别、上传录题、题目校对等业务能力的适配实现。

后续做页面对象清单、页面逻辑审核和需求注册表时，默认遵循：

- **业务口径优先沿用 PC 端。** 数据范围、识别结果、题目答案匹配、加入试卷、失败重试、权限与异常处理等，除非平板端交互导致差异，默认不重新发明规则。
- **交互方式允许按 Pad 特性变化。** 例如触控、画框、步骤拆分、弹窗尺寸、横屏布局、按钮位置、列表密度可以不同，但业务结果应能对齐。
- **差异必须显式说明。** 如果 Pad 与 PC 不一致，需要说明差异对象、差异原因、是否需要用户决策，以及最终是否写入需求注册表。
- **找不到 PC 对应能力时不能硬套。** 应标记为“未确认 PC 对应项”，并回到 Skill1 让用户确认是否作为 Pad 独有逻辑。

常见 PC 对照来源需要执行时按代码实际情况查找，例如：

```txt
src/components/UploadQuestionDialog.tsx
src/app/homework/page.tsx
src/app/homework/**
src/requirements/*.registry.ts
```

以上路径只是优先线索，不是唯一来源。执行时应使用 `rg` 根据页面文案、组件名、接口路径、需求编号查找 PC 对应页面或组件。

## 需求注册表落地路径

需求注册表统一放在：

```txt
src/requirements/schema.ts
src/requirements/<页面或流程>.registry.ts
src/requirements/index.ts
```

说明：

- 使用 TypeScript 类型，不创建 `js/requirements/*.js`。
- 需求正文继续使用当前 schema 的 `display` 和 `operation`。
- 已有编号、`anchorId`、`anchorStatus`、`activate`、`sourceType` 等稳定字段不要无故重排或重命名。
- 新增需求时优先复用现有 registry 命名和导出方式。

## 页面角标 / 悬浮面板 / 右侧 PRD 面板落地路径

通用实现放在：

```txt
src/components/prd/RequirementMarker.tsx
src/components/prd/RequirementFloatingCard.tsx
src/components/prd/RequirementPanel.tsx
src/components/prd/RequirementReaderShell.tsx
src/components/prd/requirement-utils.ts
```

接入方式：

- 在目标 React 组件中包裹或放置 `RequirementMarker`。
- 页面锚点使用 `data-req-anchor="<anchorId>"`。
- 右侧 PRD 面板使用现有 `RequirementReaderShell` / `RequirementPanel` 模式。
- 不新建 `js/prd/*.js` 或 `css/prd.css`。

## 路由与激活动作约定

`route` 字段优先写真实 App Router 路由，例如：

```txt
/tablet-ai-entry
```

平板端内部步骤可写在 `activate` 中：

| type | 本项目落地方式 |
| --- | --- |
| `navigate` | 跳转到 `/tablet-ai-entry` |
| `openDialog` | 打开上传资料、识别、确认等已有弹窗 |
| `setStep` | 切换上传资料、选择识别方式、选择识别内容、校对识别结果等步骤 |
| `setTab` | 切换资料来源、本地上传/资源库、识别方式等 Tab |
| `scrollTo` | 滚动到 `data-req-anchor` |
| `highlight` | 高亮 `data-req-anchor` |
| `openPanel` | 打开右侧 PRD 面板或页面已有侧栏 |

优先使用组件中已有状态和显式控制函数，不要依赖按钮文案模拟点击。

## 本项目常见页面对象

编写示例、编号前缀、锚点时，优先使用本项目对象：

- 平板端首页入口、开始识别按钮、AI 助手入口
- 上传资料弹窗、上传资料步骤、资料来源 Tab、本地上传、资源库
- 学段学科选择、资料类型选择、文件上传列表、格式/大小限制
- 选择识别方式、智能切题、手动画框、全页识别、答案匹配
- 选择识别内容、题干框、答案框、手动补框、删除框、框选状态
- 校对识别结果、题目列表、题型、答案、解析、加入试卷
- 腾讯云智能切题失败、豆包/火山方舟识别失败、网络错误、重试

需求编号前缀示例：

```txt
TABLET_ENTRY-001
UPLOAD_FILES-001
OCR_MODE-001
BOX_RECOGNITION-001
QUESTION_REVIEW-001
IMPORT_DOCUMENT-001
AI_CHAT-001
```

锚点示例：

```txt
tablet.entry.start
upload.files.local-tab
upload.files.subject-select
ocr.mode.auto-detect
box-recognition.question-box
question-review.join-paper
```

## 验证方式

本项目默认验证方式：

1. TypeScript 检查：`pnpm ts-check`。
2. 本地打开 `/tablet-ai-entry`，确认页面可访问。
3. 若改动角标、浮窗或右侧 PRD 面板，手动检查角标可点击、文案可读、无遮挡、无双编号。
4. 若改动识别流程，至少确认相关按钮状态、异常提示、网络错误路径和重试入口。

不要使用 `node --check js/...` 作为本项目默认验证方式。

## 输出约束

- 面向用户时优先使用中文。
- 业务规则要写成产品/测试可验收的口径，不写技术实现说明书。
- 不输出空兜底句，例如“无额外权限限制”“无异常场景”“本对象仅展示”。
- 不照搬 PC 端视觉布局或交互形态；PC 端只作为业务口径基线和对照来源。
- 不把 Pad 与 PC 的交互差异误判为业务差异；只有业务口径、数据流转、异常处理或结果不一致时，才作为差异提出。
