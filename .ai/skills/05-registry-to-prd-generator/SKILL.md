---
name: registry-to-prd-generator
description: 当页面需求注册表已经生成，并且业务逻辑已通过页面角标/悬浮面板或右侧 PRD 面板核对后，需要从 src/requirements 生成页面级 Markdown PRD 文档时使用；用于输出产品文档/prd-workflow/prd/*.prd.md。当前保守方案下，业务逻辑章节来自 display / operation，与悬浮面板、右侧 PRD 面板同源。
---

# 注册表生成 Markdown PRD Skill

## 目标

从 `src/requirements` 生成页面级 Markdown PRD。

PRD 是核对后的归档文档，必须与角标悬浮面板、右侧 PRD 面板同源，均来自注册表的 `display` / `operation`。

执行前必须先读：

```txt
.ai/skills/shared/project-context.md
.ai/skills/shared/logic-writing-spec.md
.ai/skills/05-registry-to-prd-generator/references/prd-document-template.md
src/requirements/index.ts
src/requirements/schema.ts
```

若指定页面，再读对应 `*.registry.ts`。  
若注册表不存在，提示先跑 Skill2。  
若尚未页面核对，可出草稿，但摘要中必须说明。

## 输出文件

```txt
产品文档/prd-workflow/prd/<页面或流程>.prd.md
```

示例：`产品文档/prd-workflow/prd/tablet-ai-entry.prd.md`。

## PRD 必须包含

1. 页面范围（当前页 / 上游 / 下游 / 边界摘要）。
2. 功能概述。
3. 业务逻辑说明（按 `display` / `operation`）。
4. 范围边界。
5. 验收标准。
6. 来源追溯。

无法确认上下游时，写“未在当前代码或注册表中确认”，不编造。

## 页面关系生成规则

1. 优先读 `route`、`relatedFiles`、`activate`，以及 `display` / `operation` 中与跳转、生成、流转相关的条目。
2. 再读代码中的路由、弹窗、Tab、步骤状态传递。
3. 再读决策文件范围说明。
4. 仍无法确认则明确写未确认。

## 业务逻辑渲染规则

必须遵循：

```txt
.ai/skills/shared/logic-writing-spec.md
```

对每条需求，按现有字段输出：

```md
### <需求编号> <需求标题>

来源：<代码事实 / 确认决策 / 代码事实 + 确认决策>

#### 显示说明
1. <display.description 条目>

#### 操作说明
1. <operation.description 条目>

#### 权限规则
1. <operation.permission 条目，如有>

#### 数据流转
1. <operation.dataFlow 条目，如有>

#### 异常情况处理
1. <operation.exceptions 条目，如有>

#### 验收标准
1. ...
```

规则：

- 只输出有内容的章节。
- 标题名称和条目含义来自注册表，不二次编造。
- 禁止跨章节复述同一规则。
- 不输出空兜底句。
- 不输出大段 TypeScript 原始数据。
- `excludedDecisions` 写入范围边界，不混入普通需求。

## 空兜底过滤

不输出：

- 无额外权限限制
- 无额外数据流转
- 无异常场景
- 本对象无操作入口
- 本对象仅展示
- 空字符串 / 空数组

## 验收标准与来源追溯

- 验收标准按需求编号分组，来自 `acceptance`。
- 来源追溯包含：决策文件、相关代码、注册表文件。
- `sourceType` 中文：代码事实 / 确认决策 / 代码事实 + 确认决策。

## 文档标题

```md
# <页面名称> PRD
```

例如：`# 平板端识别作业资料 PRD`。

## 生成后摘要

```md
一、生成结果
- 已生成 PRD：产品文档/prd-workflow/prd/<页面或流程>.prd.md

二、文档包含
- 页面范围
- 上游/下游
- 业务逻辑说明（display / operation）
- 范围边界
- 验收标准
- 来源追溯

三、注意事项
- <如有未确认上下游，写这里>
```

## 输出约束

- 尽量中文。
- 不编造注册表与代码无法确认的规则。
- 不改注册表，除非用户明确要求。
- 若 `display` / `operation` 缺失，提示先修正 Skill2，不要自行补旧模板。
