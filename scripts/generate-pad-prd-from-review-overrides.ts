import fs from 'node:fs';
import path from 'node:path';

import * as reqModule from '../src/requirements/index';
import * as overridesModule from '../src/requirements/review-overrides';
import * as utilsModule from '../src/components/prd/requirement-utils';

const resolvedReqModule = (reqModule as any).default ?? reqModule;
const resolvedOverridesModule = (overridesModule as any).default ?? overridesModule;
const resolvedUtilsModule = (utilsModule as any).default ?? utilsModule;
const { requirementRegistries } = resolvedReqModule as any;
const {
  persistedRequirementReviewOverrides,
  applyPersistedRequirementReviewOverride,
} = resolvedOverridesModule as any;
const {
  createRequirementDisplayNumberMap,
  getOrderedRequirementsForDisplay,
} = resolvedUtilsModule as any;

const outputDir = '产品文档/Pad端-prd';

const pageConfigs = [
  {
    file: '01-小乐对话面板.md',
    title: 'Pad端小乐对话面板',
    registryIds: ['tablet-ai-chat-recognize-homework'],
    overview:
      '本页面用于在 Pad 端 AI 小乐对话面板内发起作业资料识别流程，并在需要时完成本次识别任务的学段学科确认。',
  },
  {
    file: '02-选择识别方式.md',
    title: 'Pad端选择识别方式',
    registryIds: ['tablet-recognition-mode-page'],
    overview:
      '本页面用于让用户选择本次作业资料识别的内容模式和识别方式，决定后续进入拍摄、上传或导入资料的流程。',
  },
  {
    file: '03-拍摄页面.md',
    title: 'Pad端拍摄页面',
    registryIds: ['tablet-capture-page'],
    overview:
      '本页面用于在 Pad 端完成作业资料拍摄、图片预览、补拍、重拍和进入下一步识别前的资料确认。',
  },
  {
    file: '04-选择识别内容.md',
    title: 'Pad端选择识别内容',
    registryIds: ['tablet-question-content-selection-page'],
    overview:
      '本页面用于在识别前核对资料页、框选或补充需要识别的题目区域，并确认进入识别结果核对流程。',
  },
  {
    file: '05-核对识别结果.md',
    title: 'Pad端核对识别结果',
    registryIds: ['question-answer-review-step'],
    overview:
      '本页面用于核对作业资料识别后的题目、答案、解析、题型和子题结构，并将确认后的内容加入试卷或继续后续录题流程。',
  },
];

function arrayify(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value.split(/\r?\n+/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function useful(items: string[]) {
  const emptyFallbacks = new Set([
    '无额外权限限制',
    '无额外数据流转',
    '无异常场景',
    '本对象无操作入口',
    '本对象仅展示',
    '暂无',
    '无',
  ]);
  return items.filter((item) => item && !emptyFallbacks.has(item));
}

function sourceTypeLabel(type: string) {
  if (type === 'code') return '代码事实';
  if (type === 'decision') return '确认决策';
  return '代码事实 + 确认决策';
}

function getDisplayNumber(requirement: any, displayNumberMap: Map<string, number>, fallback: number) {
  const override = persistedRequirementReviewOverrides[requirement.id];
  return override?.displayNumber ?? displayNumberMap.get(requirement.id) ?? fallback;
}

function renderList(items: string[]) {
  return useful(items).map((item, index) => `${index + 1}. ${item}`).join('\n');
}

function renderRequirement(requirement: any, displayNumber: number) {
  const req = applyPersistedRequirementReviewOverride(requirement);
  const displayItems = useful(arrayify(req.display?.description));
  const operationItems = useful(arrayify(req.operation?.description));
  const permissionItems = useful(arrayify(req.operation?.permission));
  const dataFlowItems = useful(arrayify(req.operation?.dataFlow));
  const exceptionItems = useful(arrayify(req.operation?.exceptions));
  const acceptanceItems = useful(arrayify(req.acceptance));
  const lines: string[] = [];

  lines.push(`### ${displayNumber}. ${req.title}`);
  lines.push('');
  lines.push(`需求编号：${req.id}`);
  lines.push(`来源：${sourceTypeLabel(req.sourceType)}`);
  lines.push(`页面对象：${req.objectName}`);
  lines.push(`页面锚点：${req.anchorId}`);
  lines.push('');

  if (displayItems.length > 0) {
    lines.push(`#### ${req.display?.title || '显示说明'}`);
    lines.push(renderList(displayItems));
    lines.push('');
  }
  if (operationItems.length > 0) {
    lines.push(`#### ${req.operation?.title || '操作说明'}`);
    lines.push(renderList(operationItems));
    lines.push('');
  }
  if (permissionItems.length > 0) {
    lines.push('#### 权限规则');
    lines.push(renderList(permissionItems));
    lines.push('');
  }
  if (dataFlowItems.length > 0) {
    lines.push('#### 数据流转');
    lines.push(renderList(dataFlowItems));
    lines.push('');
  }
  if (exceptionItems.length > 0) {
    lines.push('#### 异常处理');
    lines.push(renderList(exceptionItems));
    lines.push('');
  }
  if (acceptanceItems.length > 0) {
    lines.push('#### 验收标准');
    lines.push(renderList(acceptanceItems));
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

function renderPage(config: (typeof pageConfigs)[number]) {
  const registries = config.registryIds
    .map((id) => requirementRegistries.find((registry: any) => registry.registryId === id))
    .filter(Boolean);
  const displayNumberMap = createRequirementDisplayNumberMap(registries);
  const relatedFiles = [...new Set(registries.flatMap((registry: any) => registry.relatedFiles || []))];
  const sourceFiles = [...new Set(registries.flatMap((registry: any) => [registry.sourceDecisionFile].filter(Boolean)))];
  const requirements = registries.flatMap((registry: any) => getOrderedRequirementsForDisplay(registry));
  const ordered = requirements
    .map((requirement: any, index: number) => ({
      requirement,
      displayNumber: getDisplayNumber(requirement, displayNumberMap, index + 1),
      index,
    }))
    .sort((a: any, b: any) => (
      a.displayNumber === b.displayNumber ? a.index - b.index : a.displayNumber - b.displayNumber
    ));
  const lines: string[] = [];

  lines.push(`# ${config.title} PRD`);
  lines.push('');
  lines.push('## 1. 页面范围');
  lines.push('');
  lines.push('### 1.1 当前页面');
  lines.push(`- 页面名称：${config.title}`);
  lines.push(`- 所属模块：${registries.map((registry: any) => registry.module).filter(Boolean).join(' / ')}`);
  lines.push(`- 页面路由/视图：${registries.map((registry: any) => registry.route).filter(Boolean).join(' / ')}`);
  lines.push(`- 需求条目：${ordered.length} 条`);
  lines.push('');
  lines.push('### 1.2 上级页面/上游入口');
  lines.push('- 上级页面：Pad 端作业资料识别流程上一环节');
  lines.push('- 进入方式：用户从上一流程按钮、弹窗确认或步骤流转进入当前页面。');
  lines.push('- 传入数据：当前识别任务的学段学科、识别方式、识别内容、资料页或识别结果数据。');
  lines.push('');
  lines.push('### 1.3 下级页面/下游流程');
  lines.push('- 下级页面/下游流程：Pad 端作业资料识别流程下一环节。');
  lines.push('- 触发方式：用户完成当前页面必需的选择、拍摄、框选、核对或加入试卷操作后继续。');
  lines.push('- 传出数据：当前页面已确认的识别任务状态、资料图片、框选区域、题目结构或录题内容。');
  lines.push('');
  lines.push('### 1.4 范围边界摘要');
  lines.push('- 本文档覆盖：当前页面可见数字角标对应的业务说明，以及浏览器角标面板中已核对修订后的注释内容。');
  lines.push('- 本文档不覆盖：未在当前页面角标中出现的后台 AI 生成细节、非 Pad 端页面和未确认的外部系统能力。');
  lines.push('');
  lines.push('## 2. 功能概述');
  lines.push('');
  lines.push(config.overview);
  lines.push('');
  lines.push('## 3. 业务逻辑说明');
  lines.push('');
  lines.push(ordered.map((item: any) => renderRequirement(item.requirement, item.displayNumber)).join('\n\n'));
  lines.push('');
  lines.push('## 4. 范围边界');
  lines.push('');
  lines.push('### 4.1 本文档覆盖');
  lines.push('- 当前页面数字角标对应对象的展示、操作、数据流转、异常处理和验收标准。');
  lines.push('- 浏览器本地角标面板已经核对修订过的注释正文。');
  lines.push('');
  lines.push('### 4.2 本文档不覆盖');
  lines.push('- 题目识别、答案识别、解析识别的内部 AI 生成逻辑。');
  lines.push('- 未在当前页面角标中确认的 PC 端或服务端扩展能力。');
  lines.push('');
  lines.push('## 5. 验收标准');
  lines.push('');

  for (const item of ordered) {
    const req = applyPersistedRequirementReviewOverride(item.requirement);
    const acceptanceItems = useful(arrayify(req.acceptance));
    if (acceptanceItems.length === 0) continue;
    lines.push(`### ${item.displayNumber}. ${req.id}`);
    lines.push(renderList(acceptanceItems));
    lines.push('');
  }

  lines.push('## 6. 来源追溯');
  lines.push('');
  lines.push('- 需求注册表：');
  for (const registry of registries) lines.push(`  - src/requirements/${registry.registryId}.registry.ts`);
  lines.push('- 浏览器角标修订快照：src/requirements/review-overrides.ts');
  lines.push('- 相关代码文件：');
  for (const file of relatedFiles) lines.push(`  - ${file}`);
  if (sourceFiles.length > 0) {
    lines.push('- 来源决策文件：');
    for (const file of sourceFiles) lines.push(`  - ${file}`);
  }
  lines.push('');

  return lines.join('\n');
}

fs.mkdirSync(outputDir, { recursive: true });

for (const config of pageConfigs) {
  fs.writeFileSync(path.join(outputDir, config.file), renderPage(config), 'utf8');
}

console.log(`Generated ${pageConfigs.length} Pad PRD files.`);
