import type { ActivationStep, RequirementRegistry } from './schema';

const relatedFiles = [
  'src/app/tablet-ai-entry/tablet-ai-entry-preview.tsx',
  'src/components/UploadQuestionDialog.tsx',
  'src/requirements/upload-question-dialog-select-mode.registry.ts',
  '产品文档/prd-workflow/inventories/tablet-recognition-mode-page.inventory.md',
  '产品文档/prd-workflow/decisions/tablet-recognition-mode-page.decision.md',
  '产品文档/prd-workflow/decisions/select-mode-page.decision.md',
];

const pageName = '平板端选择识别方式页面';
const route = '/tablet-ai-entry → 选择识别方式';
const moduleName = '识别作业资料';
const decisionFile = '产品文档/prd-workflow/decisions/tablet-recognition-mode-page.decision.md';

function activateRecognitionModePage(anchorId: string): ActivationStep[] {
  return [
    { type: 'navigate', label: '打开平板端入口页', to: '/tablet-ai-entry' },
    { type: 'openPanel', label: '打开 AI 小乐对话面板', panel: 'TabletAiPanel' },
    { type: 'openDialog', label: '打开选择识别方式页面', dialog: 'TabletRecognitionModeDialog' },
    { type: 'scrollTo', label: '定位页面对象', anchorId },
    { type: 'highlight', label: '高亮页面对象', anchorId },
  ];
}

export const tabletRecognitionModePageRegistry: RequirementRegistry = {
  registryId: 'tablet-recognition-mode-page',
  pageName,
  route,
  module: moduleName,
  description:
    '记录平板端「选择识别方式」页面的标题与返回、三种识别方式卡片、点击流转、PC/Pad 模式映射，以及题答分页在后续上传/拍摄环节承接的资料分类规则。',
  sourceDecisionFile: decisionFile,
  relatedFiles,
  displayOrder: [
    'TABLET_RECOGNITION_MODE-001',
    'TABLET_RECOGNITION_MODE-002',
    'TABLET_RECOGNITION_MODE-003',
    'TABLET_RECOGNITION_MODE-004',
  ],
  displayNumberMap: {
    'TABLET_RECOGNITION_MODE-001': 1,
    'TABLET_RECOGNITION_MODE-002': 2,
    'TABLET_RECOGNITION_MODE-003': 3,
    'TABLET_RECOGNITION_MODE-004': 4,
  },
  requirements: [
    {
      id: 'TABLET_RECOGNITION_MODE-001',
      title: '标题与返回',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.27',
      objectType: 'button',
      objectName: '选择识别方式标题与返回入口',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-recognition-mode.header-back',
      anchorStatus: 'implemented',
      activate: activateRecognitionModePage('tablet-recognition-mode.header-back'),
      display: {
        title: '标题展示',
        description:
          '页面顶部展示返回入口、标题「选择识别方式」和说明文案「（根据资料内容选择识别方式）」。该文案作为 Pad 正式口径使用，不再改为 PC 端「请选择识别方式 / 建议根据您的资料内容，选择合适的处理流程」。',
        fields: ['返回入口', '选择识别方式', '（根据资料内容选择识别方式）'],
        states: ['选择识别方式页面打开状态'],
      },
      operation: {
        title: '返回规则',
        description:
          '用户在当前步骤或后续流程中点击返回时，只要还没有上传图片或拍摄图片，就返回至上一步页面。当前页面返回到 AI 小乐面板时，AI 小乐面板恢复为三个快捷指令状态，不展示学科选择状态。',
        permission: '沿用平板端 AI 小乐「帮我识别作业资料」入口的使用范围。',
        dataFlow:
          '未上传或未拍摄资料前返回，不产生识别资料数据；已选学科不在 AI 小乐面板继续展示，后续重新发起识别时按入口流程重新承接。',
        exceptions:
          '如果用户已经上传图片或拍摄图片，返回规则不由本页面继续处理，应由上传/拍摄资料环节按其已确认规则承接。',
      },
      acceptance: [
        '页面顶部应展示「选择识别方式」和「（根据资料内容选择识别方式）」。',
        '未上传或未拍摄资料前点击返回，应回到上一步页面。',
        '从当前页面返回 AI 小乐面板后，应只展示三个快捷指令状态。',
        '从当前页面返回 AI 小乐面板后，不应继续展示学科选择状态。',
      ],
      source: {
        decisionFile,
        decisionObject: '返回入口 / 页面标题文案',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_RECOGNITION_MODE-002',
      title: '仅识别题目',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.27',
      objectType: 'button',
      objectName: '仅识别题目卡片',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-recognition-mode.questions-only-card',
      anchorStatus: 'implemented',
      activate: activateRecognitionModePage('tablet-recognition-mode.questions-only-card'),
      display: {
        title: '卡片说明',
        description:
          '第一张识别方式卡片展示标题「仅识别题目」和适用场景「适用于只包含题目、不包含答案解析的资料」。该模式用于用户只需要识别题目内容的资料。',
        fields: ['仅识别题目', '适用于只包含题目、不包含答案解析的资料'],
        states: ['默认可点击状态'],
      },
      operation: {
        title: '选择规则',
        description:
          '用户点击「仅识别题目」卡片后，该识别方式立即生效，并直接进入拍摄/上传资料流程。即使资料中包含答案解析，用户仍可选择该模式继续处理；后续流程只识别题目，答案解析不参与处理。',
        permission: '沿用平板端 AI 小乐「帮我识别作业资料」入口的使用范围。',
        dataFlow:
          '「仅识别题目」作为本次识别方式传递给后续拍摄/上传、选择识别内容和结果核对流程；后续识别结果只保留题目内容。',
        exceptions:
          '本页面不检查资料是否已经包含答案解析，也不在选模式时拦截用户继续。',
      },
      acceptance: [
        '卡片应展示「仅识别题目」和对应适用场景。',
        '点击卡片后应直接进入拍摄/上传资料流程。',
        '选择该模式后，后续流程不应识别答案解析内容。',
        '本页面不应因资料可能包含答案解析而阻止用户选择该模式。',
      ],
      source: {
        decisionFile,
        decisionObject: '仅识别题目卡片 / 仅识别题目适用场景 / 卡片点击后的流转',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_RECOGNITION_MODE-003',
      title: '一题一答',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.27',
      objectType: 'button',
      objectName: '题目+答案（一题一答）卡片',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-recognition-mode.same-image-answer-card',
      anchorStatus: 'implemented',
      activate: activateRecognitionModePage('tablet-recognition-mode.same-image-answer-card'),
      display: {
        title: '卡片说明',
        description:
          '第二张识别方式卡片展示标题「题目+答案」、标签「一题一答」和适用场景「适用于题目与答案解析紧挨着出现的资料」。Pad 正式使用「一题一答」命名，业务上对应 PC 端「同文件」模式。',
        fields: ['题目+答案', '一题一答', '适用于题目与答案解析紧挨着出现的资料'],
        states: ['默认可点击状态'],
      },
      operation: {
        title: '选择规则',
        description:
          '用户点击「一题一答」卡片后，该识别方式立即生效，并直接进入拍摄/上传资料流程。该模式只适用于题目和答案解析紧挨着排列的资料。',
        permission: '沿用平板端 AI 小乐「帮我识别作业资料」入口的使用范围。',
        dataFlow:
          '「一题一答」作为本次识别方式传递给后续拍摄/上传、选择识别内容、题目答案匹配和结果核对流程；后续按题目与答案解析同页相邻的业务口径处理。',
        exceptions:
          '如果资料中的题目与答案解析分开拍摄或不在同一排列场景中，用户应选择「题答分页」模式。',
      },
      acceptance: [
        '卡片应展示「题目+答案」和「一题一答」。',
        '卡片说明应表达题目与答案解析紧挨着出现的适用场景。',
        '点击卡片后应直接进入拍摄/上传资料流程。',
        '该模式在业务口径上应对应 PC 端「同文件」模式。',
      ],
      source: {
        decisionFile,
        decisionObject: '识别方式名称 / 一题一答适用场景 / 卡片点击后的流转',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_RECOGNITION_MODE-004',
      title: '题答分页',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.27',
      objectType: 'button',
      objectName: '题目+答案（题答分页）卡片',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-recognition-mode.separate-answer-card',
      anchorStatus: 'implemented',
      activate: activateRecognitionModePage('tablet-recognition-mode.separate-answer-card'),
      display: {
        title: '卡片说明',
        description:
          '第三张识别方式卡片展示标题「题目+答案」、标签「题答分页」和适用场景「适用于题目与答案解析分开拍摄的资料」。Pad 正式使用「题答分页」命名，业务上对应 PC 端「不同文件」模式。',
        fields: ['题目+答案', '题答分页', '适用于题目与答案解析分开拍摄的资料'],
        states: ['默认可点击状态'],
      },
      operation: {
        title: '分类流转',
        description:
          '用户点击「题答分页」卡片后，该识别方式立即生效，并直接进入拍摄/上传资料流程。当前页面不判断资料数量，因为用户此时还没有上传或拍摄资料；后续上传/拍摄资料环节使用「题目图片 / 答案图片」分类替代 PC 端文件用途弹窗。',
        permission: '沿用平板端 AI 小乐「帮我识别作业资料」入口的使用范围。',
        dataFlow:
          '「题答分页」作为本次识别方式传递给后续拍摄/上传流程；后续题目图片用于切题和题目识别，答案图片用于答案解析匹配。',
        exceptions:
          '题目图片和答案图片的最少数量、缺少其中一类资料时的提示文案和拦截方式，不在当前页面判断，需在后续上传/拍摄资料环节继续确认和承接。',
      },
      acceptance: [
        '卡片应展示「题目+答案」和「题答分页」。',
        '卡片说明应表达题目与答案解析分开拍摄的适用场景。',
        '点击卡片后应直接进入拍摄/上传资料流程。',
        '当前页面不应因为尚无资料而判断或提示资料数量不足。',
        '该模式在后续上传/拍摄资料环节应使用题目图片和答案图片分类。',
        '该模式在业务口径上应对应 PC 端「不同文件」模式。',
      ],
      source: {
        decisionFile,
        decisionObject: '识别方式名称 / 题答分页资料数量规则 / 题答分页文件用途规则',
        relatedFiles,
      },
    },
  ],
  excludedDecisions: [
    {
      objectName: '三张卡片的示意图区',
      reason: '该区域暂未纳入 Skill1 决策，本轮不生成需求卡片。',
      sourceDecision: decisionFile,
    },
    {
      objectName: '当前页面无空状态',
      reason: '用户进入本页时尚未上传或拍摄资料，资料空状态和资料数量校验不属于当前页面。',
      sourceDecision: decisionFile,
    },
    {
      objectName: '上传/拍照资料、选择识别内容、校对识别结果',
      reason: '这些属于后续流程页面，本注册表只记录需要由后续环节承接的题答分页分类规则。',
      sourceDecision: decisionFile,
    },
  ],
};
