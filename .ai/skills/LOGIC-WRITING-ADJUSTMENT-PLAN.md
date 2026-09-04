# 业务逻辑写作调整方案（保守兼容版）

> 状态：当前项目采用保守方案。  
> 目标：吸收新 Skill 中“先收集规则、再分层、不要重复和空兜底”的写作质量要求，但不迁移当前项目运行时结构。

## 1. 当前决策

当前平板端 OCR 项目的需求注册表、悬浮面板、右侧 PRD 面板已经使用 `display` + `operation`。

因此本阶段：

- 不新增 `logicSections` 作为落地字段。
- 不修改 `src/requirements/schema.ts` 的主结构。
- 不修改 `src/components/prd/*` 的主渲染结构。
- 不创建 `js/requirements/*.js` 或 `js/prd/*.js`。
- 继续用 `pnpm ts-check` 作为默认验证。

## 2. 保留的新写作方法

写业务逻辑时仍采用以下流程：

```txt
1) 收集代码事实、Skill1 决策、合理延伸
2) 整理为可验收的原子业务规则
3) 判断规则属于展示侧还是操作侧
4) 写入 display / operation
5) 删除重复和空兜底
```

保留原则：

- 一条规则只写一次。
- 不只描述 UI 表象。
- 不写技术实现细节。
- 不写“无额外权限限制”“无异常场景”等空说明。
- 拿不准且影响验收时，回到 Skill1 确认。

## 3. 映射方式

| 规则类型 | 当前落地字段 |
| --- | --- |
| 页面展示、状态展示、空状态、禁用态 | `display.description` |
| 用户操作、按钮点击、步骤切换、提交、重试 | `operation.description` |
| 角色、入口可见性、可操作范围 | `operation.permission` |
| 文件、切题框、识别结果、题目答案匹配结果流转 | `operation.dataFlow` |
| 上传失败、识别失败、网络错误、重复操作、缺少输入 | `operation.exceptions` |

## 4. 以后如需升级

只有用户明确要求“升级到新版分组展示”时，才启动迁移：

1. 扩展 `src/requirements/schema.ts`。
2. 迁移已有 registry 数据。
3. 修改 `RequirementFloatingCard.tsx`、`RequirementPanel.tsx`、Markdown PRD 生成逻辑。
4. 用浏览器检查角标、浮窗、右侧面板的展示结果。

在此之前，不要让 Skill2 / Skill3 / Skill4 / Skill5 强制依赖 `logicSections`。
