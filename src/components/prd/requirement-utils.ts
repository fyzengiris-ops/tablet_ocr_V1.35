import type { RequirementItem, RequirementRegistry } from '@/requirements';

interface RequirementDisplayGroupConfig {
  id: string;
  title: string;
  requirementIds: string[];
}

export interface RequirementDisplayGroup {
  id: string;
  title?: string;
  requirements: RequirementItem[];
}

export interface RequirementReadableSection {
  id: string;
  category: string;
  content: string | string[];
}

const emptyFallbacks = new Set([
  '无额外权限限制',
  '无额外数据流转',
  '无异常场景',
  '本对象无操作入口',
  '本对象仅展示',
]);

const lowInformationStates = new Set(['正常显示', '正常态']);

export const requirementDisplayGroupConfigs: Record<string, RequirementDisplayGroupConfig[]> = {
  'upload-question-dialog-select-mode': [
    {
      id: 'page-markers',
      title: '选择识别方式',
      requirementIds: [
        'SELECT_MODE-007',
        'SELECT_MODE-002',
        'SELECT_MODE-003',
        'SELECT_MODE-008',
        'SELECT_MODE-005',
        'SELECT_MODE-004',
      ],
    },
  ],
  'upload-files-step': [
    {
      id: 'page-markers',
      title: '上传资料',
      requirementIds: [
        'UPLOAD_FILES_STEP-001',
        'UPLOAD_FILES_STEP-005',
        'UPLOAD_FILES_STEP-016',
        'UPLOAD_FILES_STEP-004',
        'UPLOAD_FILES_STEP-002',
        'UPLOAD_FILES_STEP-014',
        'UPLOAD_FILES_STEP-012',
        'UPLOAD_FILES_STEP-003',
        'UPLOAD_FILES_STEP-006',
        'UPLOAD_FILES_STEP-007',
        'UPLOAD_FILES_STEP-008',
        'UPLOAD_FILES_STEP-011',
      ],
    },
  ],
  'box-recognition-step': [
    {
      id: 'page-markers',
      title: '选择识别内容',
      requirementIds: [
        'SELECT_MODE-007',
        'BOX_STEP-010',
        'BOX_STEP-001',
        'BOX_STEP-003',
        'BOX_STEP-002',
        'BOX_STEP-007',
        'BOX_STEP-014',
        'BOX_STEP-013',
        'BOX_STEP-005',
        'IMPORT_DOCUMENT_DIALOG-001',
        'IMPORT_DOCUMENT_DIALOG-018',
        'IMPORT_DOCUMENT_DIALOG-002',
        'IMPORT_DOCUMENT_DIALOG-020',
        'IMPORT_DOCUMENT_DIALOG-004',
        'IMPORT_DOCUMENT_DIALOG-003',
        'IMPORT_DOCUMENT_DIALOG-006',
        'IMPORT_DOCUMENT_DIALOG-007',
        'IMPORT_DOCUMENT_DIALOG-015',
        'IMPORT_DOCUMENT_DIALOG-016',
        'BOX_STEP-008',
        'BOX_STEP-011',
        'BOX_STEP-012',
        'BOX_STEP-004',
      ],
    },
  ],
  'question-answer-review-step': [
    {
      id: 'tablet-questions-only-image-mode',
      title: '平板端仅题目图片模式',
      requirementIds: [
        'TABLET_REVIEW_IMAGE-001',
        'TABLET_REVIEW_IMAGE-002',
        'TABLET_REVIEW_IMAGE-003',
        'TABLET_REVIEW_IMAGE-004',
        'TABLET_REVIEW_IMAGE-005',
        'TABLET_REVIEW_IMAGE-006',
        'TABLET_REVIEW_IMAGE-007',
        'TABLET_REVIEW_IMAGE-008',
        'TABLET_REVIEW_IMAGE-009',
        'TABLET_REVIEW_IMAGE-010',
        'TABLET_REVIEW_IMAGE-011',
        'TABLET_REVIEW_IMAGE-012',
        'TABLET_REVIEW_IMAGE-013',
        'TABLET_REVIEW_IMAGE-014',
        'TABLET_REVIEW_IMAGE-015',
        'TABLET_REVIEW_IMAGE-016',
        'TABLET_REVIEW_IMAGE-017',
        'TABLET_REVIEW_IMAGE-018',
      ],
    },
    {
      id: 'tablet-questions-only-recognition-mode',
      title: '平板端仅题目识别模式',
      requirementIds: [
        'TABLET_REVIEW_RECOGNITION-002',
        'TABLET_REVIEW_RECOGNITION-003',
        'TABLET_REVIEW_RECOGNITION-004',
        'TABLET_REVIEW_RECOGNITION-005',
        'TABLET_REVIEW_RECOGNITION-006',
      ],
    },
    {
      id: 'tablet-question-answer-image-mode',
      title: '平板端题目+答案图片模式',
      requirementIds: [
        'TABLET_REVIEW_QA_IMAGE-001',
        'TABLET_REVIEW_QA_IMAGE-004',
        'TABLET_REVIEW_QA_IMAGE-005',
        'TABLET_REVIEW_QA_IMAGE-006',
        'TABLET_REVIEW_QA_IMAGE-007',
        'TABLET_REVIEW_QA_IMAGE-008',
        'TABLET_REVIEW_QA_IMAGE-009',
        'TABLET_REVIEW_QA_IMAGE-010',
        'TABLET_REVIEW_QA_IMAGE-013',
        'TABLET_REVIEW_QA_IMAGE-015',
        'TABLET_REVIEW_QA_IMAGE-016',
        'TABLET_REVIEW_QA_IMAGE-022',
        'TABLET_REVIEW_QA_IMAGE-018',
        'TABLET_REVIEW_QA_IMAGE-002',
      ],
    },
    {
      id: 'single-mode',
      title: '仅识别题目模式及通用核查',
      requirementIds: [
        'REVIEW_STEP-006',
        'REVIEW_STEP-002',
        'REVIEW_STEP-013',
        'REVIEW_STEP-014',
        'REVIEW_STEP-007',
        'REVIEW_STEP-012',
        'REVIEW_STEP-008',
        'REVIEW_STEP-009',
      ],
    },
    {
      id: 'question-answer-mode',
      title: '题目+答案模式',
      requirementIds: [
        'REVIEW_STEP-001',
        'REVIEW_STEP-003',
        'REVIEW_STEP-015',
        'REVIEW_STEP-016',
        'REVIEW_STEP-017',
        'REVIEW_STEP-005',
        'REVIEW_STEP-018',
        'REVIEW_STEP-004',
      ],
    },
  ],
  'tablet-capture-page': [
    {
      id: 'page-markers',
      title: '拍摄资料',
      requirementIds: [
        'TABLET_CAPTURE-001',
        'TABLET_CAPTURE-002',
        'TABLET_CAPTURE-003',
        'TABLET_CAPTURE-004',
        'TABLET_CAPTURE-005',
        'TABLET_CAPTURE-006',
        'TABLET_CAPTURE-007',
        'TABLET_CAPTURE-008',
        'TABLET_CAPTURE-009',
      ],
    },
  ],
  'tablet-question-content-selection-page': [
    {
      id: 'page-markers',
      title: '选择识别内容',
      requirementIds: [
        'TABLET_QUESTION_CONTENT_SELECTION-001',
        'TABLET_QUESTION_CONTENT_SELECTION-002',
        'TABLET_QUESTION_CONTENT_SELECTION-003',
        'TABLET_QUESTION_CONTENT_SELECTION-004',
        'TABLET_QUESTION_CONTENT_SELECTION-005',
        'TABLET_QUESTION_CONTENT_SELECTION-006',
        'TABLET_QUESTION_CONTENT_SELECTION-007',
        'TABLET_QUESTION_CONTENT_SELECTION-008',
        'TABLET_QUESTION_CONTENT_SELECTION-009',
        'TABLET_QUESTION_CONTENT_SELECTION-010',
        'TABLET_QUESTION_CONTENT_SELECTION-011',
        'TABLET_QUESTION_CONTENT_SELECTION-012',
        'TABLET_QUESTION_CONTENT_SELECTION-013',
        'TABLET_QUESTION_CONTENT_SELECTION-014',
        'TABLET_QUESTION_CONTENT_SELECTION-015',
        'TABLET_QUESTION_CONTENT_SELECTION-016',
        'TABLET_QUESTION_CONTENT_SELECTION-017',
        'TABLET_QUESTION_CONTENT_SELECTION-018',
        'TABLET_QUESTION_CONTENT_SELECTION-021',
        'TABLET_QUESTION_CONTENT_SELECTION-022',
        'TABLET_QUESTION_CONTENT_SELECTION-023',
      ],
    },
  ],
};

export function isUsefulRequirementText(content?: string) {
  const normalized = content?.trim();

  return Boolean(normalized && !emptyFallbacks.has(normalized));
}

export function filterUsefulItems(items?: string[]) {
  return (items ?? []).map((item) => item.trim()).filter((item) => isUsefulRequirementText(item));
}

export function splitTextIntoReadableItems(value: string) {
  return value
    .split(/\r?\n+/)
    .flatMap((line) => line.match(/[^。；;]+[。；;]?/g) ?? [line])
    .map((item) => item.trim())
    .filter(Boolean);
}

function createSection(
  id: string,
  category: string,
  content?: string | string[],
): RequirementReadableSection | null {
  if (Array.isArray(content)) {
    const items = filterUsefulItems(content);

    if (items.length === 0) {
      return null;
    }

    return {
      id,
      category,
      content: items,
    };
  }

  const normalized = content?.trim() ?? '';

  if (!isUsefulRequirementText(normalized)) {
    return null;
  }

  return {
    id,
    category,
    content: normalized,
  };
}

function filterUsefulStates(items?: string[]) {
  return filterUsefulItems(items).filter((item) => !lowInformationStates.has(item));
}

export function getRequirementShortId(id: string) {
  const suffix = id.split('-').at(-1);
  return suffix || id;
}

export function createRequirementMap(requirements: RequirementItem[]) {
  return new Map(requirements.map((requirement) => [requirement.id, requirement]));
}

export function getRequirementDisplayGroups(registry: RequirementRegistry, extraRequirementsById?: Map<string, RequirementItem>): RequirementDisplayGroup[] {
  const groupConfigs = requirementDisplayGroupConfigs[registry.registryId];

  if (!groupConfigs) {
    return [
      {
        id: `${registry.registryId}:default`,
        requirements: registry.requirements,
      },
    ];
  }

  const requirementsById = createRequirementMap(registry.requirements);
  const usedRequirementIds = new Set<string>();
  const groups = groupConfigs
    .map((groupConfig) => {
      const requirements = groupConfig.requirementIds
        .map((requirementId) => requirementsById.get(requirementId) ?? extraRequirementsById?.get(requirementId))
        .filter((requirement): requirement is RequirementItem => Boolean(requirement));

      requirements.forEach((requirement) => usedRequirementIds.add(requirement.id));

      return {
        id: `${registry.registryId}:${groupConfig.id}`,
        title: groupConfig.title,
        requirements,
      };
    })
    .filter((group) => group.requirements.length > 0);

  const uncategorizedRequirements = registry.requirements.filter(
    (requirement) => !usedRequirementIds.has(requirement.id),
  );

  if (uncategorizedRequirements.length > 0) {
    groups.push({
      id: `${registry.registryId}:uncategorized`,
      title: '其他需求',
      requirements: uncategorizedRequirements,
    });
  }

  return groups;
}

export function getOrderedRequirementsForDisplay(registry: RequirementRegistry, extraRequirementsById?: Map<string, RequirementItem>) {
  const requirements = getRequirementDisplayGroups(registry, extraRequirementsById).flatMap((group) => group.requirements);
  if (registry.displayOrder && registry.displayOrder.length > 0) {
    const orderMap = new Map(registry.displayOrder.map((id, i) => [id, i]));
    return [...requirements].sort((a, b) => {
      const ai = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const bi = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return ai - bi;
    });
  }
  return requirements;
}

export function createRequirementDisplayNumberMap(registries: RequirementRegistry[]) {
  const map = new Map<string, number>();
  // 先收集所有 registries 的 displayNumberMap
  const globalNumberMap = new Map<string, number>();
  for (const registry of registries) {
    if (registry.displayNumberMap) {
      for (const [id, num] of Object.entries(registry.displayNumberMap)) {
        globalNumberMap.set(id, num);
      }
    }
  }
  for (const registry of registries) {
    const requirements = getOrderedRequirementsForDisplay(registry);
    requirements.forEach((requirement, index) => {
      map.set(requirement.id, globalNumberMap.get(requirement.id) ?? index + 1);
    });
    // 处理 displayNumberMap 中属于本 registry 但不在 requirements 里的 ID（跨注册表引用）
    if (registry.displayNumberMap) {
      for (const [id, num] of Object.entries(registry.displayNumberMap)) {
        if (!map.has(id)) {
          map.set(id, num);
        }
      }
    }
  }
  return map;
}

export function getDisplaySections(requirement: RequirementItem) {
  return [
    createSection(
      'display.description',
      requirement.display.title.trim() || '展示规则',
      requirement.display.description,
    ),
  ].filter(
    (item): item is RequirementReadableSection => Boolean(item),
  );
}

export function getOperationSections(requirement: RequirementItem) {
  return [
    createSection(
      'operation.description',
      requirement.operation.title.trim() || '操作规则',
      requirement.operation.description,
    ),
    createSection('operation.permission', '权限规则', requirement.operation.permission),
    createSection('operation.dataFlow', '数据流转', requirement.operation.dataFlow),
    createSection('operation.exceptions', '异常处理', requirement.operation.exceptions),
  ].filter((item): item is RequirementReadableSection => Boolean(item));
}

export function getRequirementBusinessLogicSections(requirement: RequirementItem) {
  return [...getDisplaySections(requirement), ...getOperationSections(requirement)];
}
