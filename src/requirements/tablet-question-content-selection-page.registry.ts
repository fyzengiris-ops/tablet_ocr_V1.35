import type { ActivationStep, RequirementRegistry } from './schema';

const relatedFiles = [
  'src/app/tablet-ai-entry/tablet-ai-entry-preview.tsx',
  'src/components/UploadQuestionDialog.tsx',
  'src/requirements/box-recognition-step.registry.ts',
  '产品文档/prd-workflow/inventories/tablet-question-content-selection-page.inventory.md',
  '产品文档/prd-workflow/decisions/tablet-question-content-selection-page.decision.md',
];

const pageName = '仅识别题目模式下的选择识别内容页面';
const route = '/tablet-ai-entry → 选择识别内容';
const moduleName = '识别作业资料';
const decisionFile = '产品文档/prd-workflow/decisions/tablet-question-content-selection-page.decision.md';

function activateQuestionContentSelection(anchorId: string): ActivationStep[] {
  return [
    { type: 'navigate', label: '打开平板端入口页', to: '/tablet-ai-entry' },
    { type: 'openPanel', label: '打开 AI 小乐对话面板', panel: 'TabletAiPanel' },
    { type: 'setStep', label: '切换到选择识别内容页', step: 'question-content-selection' },
    { type: 'scrollTo', label: '定位页面对象', anchorId },
    { type: 'highlight', label: '高亮页面对象', anchorId },
  ];
}

export const tabletQuestionContentSelectionPageRegistry: RequirementRegistry = {
  registryId: 'tablet-question-content-selection-page',
  pageName,
  route,
  module: moduleName,
  description:
    '记录平板端仅识别题目模式下，选择识别内容页面的资料展示、切题框选择、补充资料、手动框选、清空、全选、开始识别和异常状态规则。',
  sourceDecisionFile: decisionFile,
  relatedFiles,
  displayOrder: [
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
  displayNumberMap: {
    'TABLET_QUESTION_CONTENT_SELECTION-001': 1,
    'TABLET_QUESTION_CONTENT_SELECTION-002': 2,
    'TABLET_QUESTION_CONTENT_SELECTION-003': 3,
    'TABLET_QUESTION_CONTENT_SELECTION-004': 4,
    'TABLET_QUESTION_CONTENT_SELECTION-005': 5,
    'TABLET_QUESTION_CONTENT_SELECTION-006': 6,
    'TABLET_QUESTION_CONTENT_SELECTION-007': 7,
    'TABLET_QUESTION_CONTENT_SELECTION-008': 8,
    'TABLET_QUESTION_CONTENT_SELECTION-009': 9,
    'TABLET_QUESTION_CONTENT_SELECTION-010': 10,
    'TABLET_QUESTION_CONTENT_SELECTION-011': 11,
    'TABLET_QUESTION_CONTENT_SELECTION-012': 12,
    'TABLET_QUESTION_CONTENT_SELECTION-013': 13,
    'TABLET_QUESTION_CONTENT_SELECTION-014': 14,
    'TABLET_QUESTION_CONTENT_SELECTION-015': 15,
    'TABLET_QUESTION_CONTENT_SELECTION-016': 16,
    'TABLET_QUESTION_CONTENT_SELECTION-017': 17,
    'TABLET_QUESTION_CONTENT_SELECTION-018': 18,
    'TABLET_QUESTION_CONTENT_SELECTION-021': 21,
    'TABLET_QUESTION_CONTENT_SELECTION-022': 22,
    'TABLET_QUESTION_CONTENT_SELECTION-023': 23,
  },
  requirements: [
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-001',
      title: '标题与返回',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'button',
      objectName: '页面标题与返回入口',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.header-back',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.header-back'),
      display: {
        title: '显示说明',
        description:
          '页面顶部展示返回入口和标题「选择识别内容」，用于承接用户已经完成拍摄或上传后的题目内容确认。',
        fields: ['返回入口', '选择识别内容'],
        states: ['默认展示状态'],
      },
      operation: {
        title: '返回规则',
        description:
          '用户点击返回时，如果当前没有切题框，直接返回上一页；如果当前已有切题框，需要先提示用户返回后会清空当前框选内容。',
        permission: '进入仅识别题目模式的选择识别内容页后可使用。',
        dataFlow:
          '用户确认返回后，清空当前自动切题框、手动添加框和框选状态，再回到拍摄或上传资料页。',
        exceptions:
          '用户取消返回时，停留在当前页面，并保留已拍资料、切题框和当前选中状态。',
      },
      acceptance: [
        '页面顶部应展示返回入口和「选择识别内容」标题。',
        '无切题框时点击返回，应直接回到上一页。',
        '有切题框时点击返回，应先出现确认提示。',
        '确认返回后，应清空当前框选内容并返回上一页。',
        '取消返回后，应停留在当前页面并保留现有内容。',
      ],
      source: {
        decisionFile,
        decisionObject: '返回入口',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-002',
      title: '完整题干内容',
      sourceType: 'decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'copy',
      objectName: '完整题干内容说明文案',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.scope-copy',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.scope-copy'),
      display: {
        title: '显示说明',
        description:
          '页面说明文案使用「完整题干内容」表达用户需要框选的范围，避免用户误以为答案和解析也需要在本模式下参与识别。',
        fields: ['完整题干内容'],
        states: ['默认展示状态'],
      },
      operation: {
        title: '范围规则',
        description:
          '仅识别题目模式下，完整题干内容包含题干、题目图片、选项、表格等完成题目识别所需的信息，不包含答案和解析。',
        permission: '',
        dataFlow:
          '后续识别只处理用户选中的完整题干区域，答案和解析不进入本模式的识别结果。',
        exceptions:
          '如果资料图片中同时出现答案或解析，用户也只需要选择题干相关内容。',
      },
      acceptance: [
        '页面应使用「完整题干内容」作为识别范围说明。',
        '业务说明中应明确题干、选项、表格等属于可识别范围。',
        '业务说明中应明确答案和解析不属于本模式识别范围。',
      ],
      source: {
        decisionFile,
        decisionObject: '完整内容范围',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-003',
      title: '学段学科',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'field',
      objectName: '学段学科标签',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.subject-tag',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.subject-tag'),
      display: {
        title: '显示说明',
        description:
          '页面顶部展示当前识别任务已选择的学段学科，让用户确认本次资料将按该学科继续处理。',
        fields: ['学段学科标签'],
        states: ['已选择学科状态'],
      },
      operation: {
        title: '使用规则',
        description:
          '当前页面只展示学段学科，不提供修改入口；用户开始识别时，继续沿用进入本流程时已经选择的学段学科。',
        permission: '',
        dataFlow:
          '学段学科随本次识别任务传递到后续识别和结果核对流程。',
        exceptions:
          '如果用户需要更换学段学科，应退出当前流程后重新发起识别。',
      },
      acceptance: [
        '页面应展示当前已选择的学段学科。',
        '当前页面不应提供学段学科修改入口。',
        '点击开始识别后，应沿用当前展示的学段学科。',
      ],
      source: {
        decisionFile,
        decisionObject: '学段学科标签',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-004',
      title: '更换资料',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'button',
      objectName: '更换资料按钮',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.replace-material',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.replace-material'),
      display: {
        title: '显示说明',
        description:
          '工具栏展示「更换资料」入口，用于用户放弃当前资料并重新拍摄或上传。',
        fields: ['更换资料'],
        states: ['默认可点击状态'],
      },
      operation: {
        title: '操作规则',
        description:
          '没有切题框时，用户点击「更换资料」直接回到拍摄或上传资料页；已有切题框时，需要先提示本次操作会清空当前框选内容。',
        permission: '进入选择识别内容页后可使用。',
        dataFlow:
          '用户确认更换后，清空当前资料、切题框、手动框、框选状态和识别方式，并重新进入拍摄或上传资料流程。',
        exceptions:
          '用户取消更换时，保留当前资料和框选内容，不进入重新拍摄或上传流程。',
      },
      acceptance: [
        '工具栏应展示「更换资料」入口。',
        '无切题框时点击更换资料，应直接回到拍摄或上传资料页。',
        '有切题框时点击更换资料，应先出现确认提示。',
        '确认更换后，应清空当前资料、框选内容和识别方式。',
      ],
      source: {
        decisionFile,
        decisionObject: '更换资料',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-005',
      title: '补充资料',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'button',
      objectName: '补充资料按钮',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.supplement-material',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.supplement-material'),
      display: {
        title: '显示说明',
        description:
          '工具栏展示「补充资料」入口，用于用户在当前资料基础上继续添加图片资料。',
        fields: ['补充资料'],
        states: ['默认可点击状态'],
      },
      operation: {
        title: '补充流程',
        description: [
          '用户点击「补充资料」后进入拍摄或上传资料页，拍摄页只统计本次补充的图片数量，避免把已处理图片误认为本次新增图片。',
          '在补充资料的图片管理面板中，用户可以同时查看已处理图片和本次补充图片，并调整全部图片的展示顺序。',
          '用户返回选择识别内容页后，资料展示顺序以及后续题目顺序，都按照补充资料后确认的最新图片顺序处理。',
        ],
        permission: '进入选择识别内容页后可使用。',
        dataFlow:
          '补充图片默认追加在已处理图片后方；如果用户调整了图片顺序，系统以调整后的整体顺序重新进行切题。',
        exceptions:
          '如果用户没有新增图片，也没有调整已处理图片顺序，补充资料页的去切题按钮应保持置灰，用户可直接关闭补充流程。',
      },
      acceptance: [
        '工具栏应展示「补充资料」入口。',
        '点击补充资料后，应进入拍摄或上传资料页。',
        '补充资料页应只统计本次补充图片数量。',
        '图片管理面板应能查看已处理图片和本次补充图片。',
        '补充后返回本页，应按最新图片顺序展示资料并参与后续处理。',
        '无新增图片且无顺序变化时，去切题按钮应置灰。',
      ],
      source: {
        decisionFile,
        decisionObject: '补充资料',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-006',
      title: '添加识别框',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'button',
      objectName: '添加识别框按钮',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.add-box',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.add-box'),
      display: {
        title: '显示说明',
        description:
          '工具栏展示「添加识别框」入口，用于用户手动补充系统没有框出的题目区域。',
        fields: ['添加识别框'],
        states: ['智能切题中不可用', '切题完成后可用', '识别开始后可用'],
      },
      operation: {
        title: '可用规则',
        description:
          '智能切题过程中不可使用「添加识别框」；切题完成后允许用户开启手动添加识别框；已经开始识别后，如果页面仍支持回到框选状态，也允许继续补充题目区域。',
        permission: '进入选择识别内容页后可使用。',
        dataFlow:
          '用户手动添加的识别框进入当前框选列表，并与自动切题框一起参与选择、统计和后续识别。',
        exceptions:
          '如果当前没有可操作的资料图片，用户不能通过该入口添加识别框。',
      },
      acceptance: [
        '工具栏应展示「添加识别框」入口。',
        '智能切题中，该入口应不可用。',
        '切题完成后，该入口应可用。',
        '手动添加的识别框应进入当前框选列表。',
      ],
      source: {
        decisionFile,
        decisionObject: '添加识别框入口',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-007',
      title: '手动框选方式',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'region',
      objectName: '手动添加识别框交互',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.manual-box-interaction',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.manual-box-interaction'),
      display: {
        title: '显示说明',
        description:
          '用户开启添加识别框时，需要先选择本次使用的框选方式，包括「画线生成识别框」和「点击位置生成识别框」。',
        fields: ['画线生成识别框', '点击位置生成识别框'],
        states: ['未开启添加状态', '画线添加状态', '点击添加状态'],
      },
      operation: {
        title: '交互规则',
        description: [
          '选择「画线生成识别框」后，用户可在题目区域拖动画线，松手后生成一个识别框，并默认选中该框。',
          '选择「点击位置生成识别框」后，用户点击资料上的题目位置，系统在点击处生成默认大小的识别框，用户可继续调整。',
        ],
        permission: '仅在添加识别框模式开启后生效。',
        dataFlow:
          '新生成的识别框默认作为题目区域加入当前框选列表，并参与全选、统计和开始识别。',
        exceptions:
          '如果画线方式在平板触控环境中不稳定，应使用点击位置生成识别框作为备选交互。',
      },
      acceptance: [
        '开启添加识别框时，应提供两种框选方式选择。',
        '选择画线方式后，拖动画线松手应生成识别框。',
        '选择点击方式后，点击资料位置应生成默认大小识别框。',
        '新生成的识别框应默认选中。',
      ],
      source: {
        decisionFile,
        decisionObject: '手动添加识别框交互',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-008',
      title: '添加提示',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'dialog',
      objectName: '添加识别框提示弹窗',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.add-box-tip',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.add-box-tip'),
      display: {
        title: '显示说明',
        description:
          '用户首次在当前页面点击「添加识别框」时，展示添加方式选择和操作提示，帮助用户理解接下来如何在资料上生成识别框。',
        fields: ['选择添加识别框的方式', '我知道了'],
        states: ['提示弹窗展示状态', '提示弹窗关闭状态'],
      },
      operation: {
        title: '确认规则',
        description:
          '用户选择添加方式后，点击「我知道了」关闭提示，并进入对应的添加识别框模式。',
        permission: '用户点击「添加识别框」后触发。',
        dataFlow:
          '用户选择的添加方式只影响本次手动添加识别框的交互，不改变已有资料、已有切题框和已选状态。',
        exceptions:
          '用户关闭弹窗或未确认时，不进入添加识别框模式。',
      },
      acceptance: [
        '首次点击添加识别框时，应展示提示弹窗。',
        '弹窗应提供添加方式选择。',
        '点击「我知道了」后，应进入对应添加模式。',
        '关闭弹窗时，不应改变已有框选数据。',
      ],
      source: {
        decisionFile,
        decisionObject: '添加识别框提示',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-009',
      title: '清空框选',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'button',
      objectName: '清空按钮',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.clear-boxes',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.clear-boxes'),
      display: {
        title: '显示说明',
        description:
          '工具栏展示「清空」入口，用于用户一次性清除当前页面上的所有题目框。',
        fields: ['清空', '确认清空所有切题框吗？'],
        states: ['有切题框状态', '无切题框状态', '确认弹窗展示状态'],
      },
      operation: {
        title: '清空规则',
        description:
          '用户点击「清空」后，先展示确认提示。确认后只删除当前所有自动切题框和手动添加的识别框，不删除资料图片，也不改变本次识别方式。',
        permission: '当前存在切题框或手动识别框时可使用。',
        dataFlow:
          '清空后，当前框选列表、选中状态和框选统计同步归零；资料图片仍保留在当前页面。',
        exceptions:
          '用户取消清空时，保留所有切题框、手动识别框和选中状态。',
      },
      acceptance: [
        '工具栏应展示「清空」入口。',
        '点击清空后，应展示确认提示。',
        '确认清空后，应删除所有自动切题框和手动识别框。',
        '确认清空后，不应删除资料图片。',
        '取消清空后，应保留原有框选内容。',
      ],
      source: {
        decisionFile,
        decisionObject: '清空',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-010',
      title: '全选',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'button',
      objectName: '全选按钮',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.select-all',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.select-all'),
      display: {
        title: '显示说明',
        description:
          '页面操作区展示「全选」入口，用于用户快速选中或取消选中当前全部识别框。',
        fields: ['全选'],
        states: ['全部选中状态', '部分选中状态', '全部未选中状态'],
      },
      operation: {
        title: '选择规则',
        description:
          '全选作用于当前所有识别框，包括自动切题框和用户手动添加的识别框。补充资料后，新生成的识别框默认选中，原有识别框保留用户之前的选择状态。',
        permission: '当前存在识别框时可使用。',
        dataFlow:
          '全选状态改变后，已选中数量和开始识别可用状态同步更新。',
        exceptions:
          '当前没有识别框时，全选不应产生可识别内容。',
      },
      acceptance: [
        '页面应展示「全选」入口。',
        '点击全选应能选中当前全部识别框。',
        '再次取消全选时，应取消当前全部识别框选择。',
        '补充资料后，新框应默认选中，原框应保留原选择状态。',
      ],
      source: {
        decisionFile,
        decisionObject: '全选',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-011',
      title: '框选统计',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'field',
      objectName: '已选中与已框选统计',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.selection-stats',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.selection-stats'),
      display: {
        title: '统计口径',
        description:
          '页面展示「已选中 X 个 / 已框选 Y 个」，用于说明当前被选中的识别框数量和当前页面全部识别框数量。',
        fields: ['已选中 X 个', '已框选 Y 个'],
        states: ['无框统计状态', '部分选中统计状态', '全部选中统计状态'],
      },
      operation: {
        title: '更新规则',
        description:
          '用户新增、删除、全选、取消选择或单独调整识别框选择状态后，统计数字需要即时更新。',
        permission: '',
        dataFlow:
          'X 取当前已选中的识别框数量，Y 取当前全部识别框数量；统计只表示框的数量，不承诺每个框一定对应一道题。',
        exceptions:
          '当前没有识别框时，统计应回到 0 个状态。',
      },
      acceptance: [
        '统计文案应使用「个」作为单位。',
        '新增或删除识别框后，已框选数量应同步变化。',
        '选择状态变化后，已选中数量应同步变化。',
        '统计口径不应表述为已选中或已框选多少题。',
      ],
      source: {
        decisionFile,
        decisionObject: '统计',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-012',
      title: '开始识别',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'button',
      objectName: '开始识别按钮',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.start-recognition',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.start-recognition'),
      display: {
        title: '显示说明',
        description:
          '页面底部或操作区展示「开始识别」按钮，用于提交当前已经选中的识别框。',
        fields: ['开始识别'],
        states: ['可点击状态', '置灰状态', '提示状态'],
      },
      operation: {
        title: '提交规则',
        description:
          '点击「开始识别」时，只提交当前已选中的识别框。如果当前没有任何识别框，按钮置灰，点击时提示「请先框选要识别的题目」；如果存在识别框但没有选中任何框，点击时提示「请先选择要识别的题目框」。',
        permission: '当前存在并选中至少一个识别框时可继续。',
        dataFlow:
          '开始识别后，当前选中的识别框、资料图片顺序和学段学科进入后续识别流程。',
        exceptions:
          '智能切题过程中不可开始识别；无框或无选中框时，不进入后续识别流程。',
      },
      acceptance: [
        '无识别框时，开始识别按钮应置灰。',
        '无识别框点击时，应提示「请先框选要识别的题目」。',
        '有框但无选中框点击时，应提示「请先选择要识别的题目框」。',
        '有选中框时，点击开始识别应只提交已选中的框。',
      ],
      source: {
        decisionFile,
        decisionObject: '开始识别',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-013',
      title: '智能切题中',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'state',
      objectName: '智能切题中状态',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.detecting-state',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.detecting-state'),
      display: {
        title: '状态反馈',
        description:
          '系统正在处理资料时，页面展示「正在切题中，请稍候」，让用户知道当前正在生成题目框。',
        fields: ['正在切题中，请稍候'],
        states: ['智能切题中状态'],
      },
      operation: {
        title: '限制规则',
        description:
          '智能切题中，用户不能操作资料图片、识别框、添加识别框、清空、全选或开始识别。',
        permission: '',
        dataFlow:
          '智能切题完成后，系统根据资料图片生成题目框，并进入可选择识别内容的状态。',
        exceptions:
          '如果智能切题失败，页面需要进入自动切题未完成状态，允许用户手动补充识别框。',
      },
      acceptance: [
        '智能切题中应展示明确的等待文案。',
        '智能切题中不应允许操作资料和识别框。',
        '智能切题完成后，应进入可选择识别内容状态。',
        '智能切题失败后，应展示失败提示并允许手动处理。',
      ],
      source: {
        decisionFile,
        decisionObject: '正在处理文件信息',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-014',
      title: '资料顺序',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'region',
      objectName: '资料页展示区域',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.material-pages',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.material-pages'),
      display: {
        title: '显示说明',
        description:
          '资料页按照用户在拍摄或上传阶段确认的图片顺序展示；补充资料后，按照用户重新确认的整体图片顺序展示。',
        fields: ['资料图片', '图片顺序'],
        states: ['首次资料展示状态', '补充资料后展示状态'],
      },
      operation: {
        title: '顺序规则',
        description:
          '后续切题、选择识别内容和题目展示顺序，都以当前资料页展示顺序为准。',
        permission: '',
        dataFlow:
          '补充资料时，如果用户调整已处理图片和本次补充图片的整体顺序，系统按新顺序重新切题并刷新本页展示。',
        exceptions:
          '如果补充资料没有新增图片也没有顺序变化，不重新切题，不刷新当前资料顺序。',
      },
      acceptance: [
        '资料页应按用户确认的图片顺序展示。',
        '补充资料调整顺序后，本页应按最新顺序展示。',
        '后续题目顺序应跟随资料展示顺序。',
      ],
      source: {
        decisionFile,
        decisionObject: '资料页展示顺序',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-015',
      title: '自动切题框',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'region',
      objectName: '自动切题生成的识别框',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.auto-box',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.auto-box'),
      display: {
        title: '显示说明',
        description:
          '智能切题完成后，系统在资料图片上展示识别框，每个框表示一个待确认的题干区域。',
        fields: ['自动切题框', '题干区域'],
        states: ['默认选中状态', '取消选中状态'],
      },
      operation: {
        title: '默认规则',
        description:
          '自动切题生成的识别框默认选中，用户可以根据实际资料决定是否保留或取消选择。',
        permission: '',
        dataFlow:
          '自动切题框作为题目区域进入当前框选列表，并参与后续选择、统计和识别。',
        exceptions:
          '自动切题框只代表系统识别到的候选题干区域，用户仍可手动调整。',
      },
      acceptance: [
        '自动切题完成后，应在资料上展示识别框。',
        '自动切题框应默认选中。',
        '自动切题框应进入当前统计和开始识别范围。',
      ],
      source: {
        decisionFile,
        decisionObject: '自动切题框',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-016',
      title: '单框操作',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'region',
      objectName: '单个识别框',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.single-box',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.single-box'),
      display: {
        title: '显示说明',
        description:
          '每个识别框需要有明确的选中状态，并支持用户对单个框进行调整。',
        fields: ['识别框', '选中状态', '删除入口', '调整区域'],
        states: ['选中状态', '未选中状态', '拖动状态', '调整大小状态'],
      },
      operation: {
        title: '操作规则',
        description:
          '用户可以选择或取消选择单个识别框，也可以移动、调整大小或删除单个识别框。删除单个识别框立即生效，不需要二次确认。',
        permission: '当前存在识别框时可操作。',
        dataFlow:
          '单框操作即时更新当前框选列表、选中数量、已框选数量和开始识别范围。',
        exceptions:
          '删除后无法在当前页面通过撤销恢复，需要用户重新添加识别框。',
      },
      acceptance: [
        '单个识别框应能选择和取消选择。',
        '单个识别框应能移动和调整大小。',
        '单个识别框应能删除且不弹二次确认。',
        '单框操作后，统计和开始识别范围应同步更新。',
      ],
      source: {
        decisionFile,
        decisionObject: '单个识别框',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-017',
      title: '未识别到题目框',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'state',
      objectName: '未识别到题目框提示',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.no-box-tip',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.no-box-tip'),
      display: {
        title: '异常',
        description:
          '当系统没有识别到题目框时，只在第一张无框资料页上展示提示，提醒用户可以手动添加识别框。',
        fields: ['未识别到题目框提示', '添加识别框'],
        states: ['无框提示状态', '提示关闭状态'],
      },
      operation: {
        title: '处理规则',
        description:
          '用户可以点击添加识别框继续处理，也可以关闭该提示。用户手动添加任意识别框后，该提示消失。',
        permission: '',
        dataFlow:
          '提示本身不创建识别框；只有用户添加识别框后，才进入当前框选列表。',
        exceptions:
          '如果存在多张无框资料，提示不需要在每张资料上重复展示。',
      },
      acceptance: [
        '未识别到题目框时，应只在第一张无框资料页展示提示。',
        '用户可通过提示进入添加识别框流程。',
        '用户关闭提示后，提示应消失。',
        '用户添加识别框后，提示应消失。',
      ],
      source: {
        decisionFile,
        decisionObject: '未识别到题目框',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-018',
      title: '切题未完成',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'state',
      objectName: '自动切题未完成提示',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.detect-failed-tip',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.detect-failed-tip'),
      display: {
        title: '异常',
        description:
          '自动切题未完成时，页面展示明确提示，让用户知道系统没有正常生成题目框。',
        fields: ['自动切题未完成'],
        states: ['切题失败状态', '可手动补框状态'],
      },
      operation: {
        title: '处理规则',
        description:
          '如果当前仍有可识别图片，用户可以通过添加识别框手动补充题目区域后继续识别。',
        permission: '',
        dataFlow:
          '用户手动添加的识别框进入当前框选列表，并替代自动切题结果继续后续识别。',
        exceptions:
          '如果当前没有任何识别框，开始识别按钮保持置灰，不进入后续识别。',
      },
      acceptance: [
        '自动切题未完成时，应展示失败提示。',
        '失败后仍有图片时，应允许用户添加识别框。',
        '没有任何识别框时，开始识别按钮应置灰。',
      ],
      source: {
        decisionFile,
        decisionObject: '自动切题未完成',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-021',
      title: '确认弹窗',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'dialog',
      objectName: '清空与更换确认弹窗',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.confirm-dialog',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.confirm-dialog'),
      display: {
        title: '显示说明',
        description: [
          '用户点击返回且当前已有切题框时，弹窗标题展示「当前操作将清空本次框选内容」，正文展示「返回上一步后，当前自动切题框和手动添加的识别框都不会保留。」',
          '用户点击更换资料且当前已有切题框时，弹窗标题展示「当前操作将清空本次框选内容」，正文展示「更换资料后，当前资料、框选内容和识别方式都需要重新选择。」',
          '用户点击清空且当前已有切题框时，弹窗标题展示「确认清空所有切题框吗？」，当前弹窗不展示正文说明。',
          '三类弹窗都展示「取消」按钮；确认按钮根据操作类型分别展示「确认返回」「确认」「确认清空」。',
        ],
        fields: [
          '当前操作将清空本次框选内容',
          '返回上一步后，当前自动切题框和手动添加的识别框都不会保留。',
          '更换资料后，当前资料、框选内容和识别方式都需要重新选择。',
          '确认清空所有切题框吗？',
          '取消',
          '确认返回',
          '确认',
          '确认清空',
        ],
        states: ['清空确认状态', '返回确认状态', '更换资料确认状态'],
      },
      operation: {
        title: '确认规则',
        description: [
          '返回确认弹窗中，用户点击「取消」后停留在当前页面；点击「确认返回」后清空当前自动切题框和手动添加的识别框，并返回上一步。',
          '更换资料确认弹窗中，用户点击「取消」后停留在当前页面；点击「确认」后清空当前资料、框选内容和识别方式，重新进入资料选择流程。',
          '清空确认弹窗中，用户点击「取消」后停留在当前页面；点击「确认清空」后只清空切题框和手动识别框，不删除资料图片。',
        ],
        permission: '触发对应高风险操作时展示。',
        dataFlow:
          '用户点击确认后，按对应操作范围清空数据；用户点击取消后，保留当前页面状态。',
        exceptions:
          '不同确认弹窗可以共用基础提示文案，但正文必须说明当前操作实际影响范围。',
      },
      acceptance: [
        '清空、返回和更换资料涉及丢弃框选时，应展示确认弹窗。',
        '确认弹窗应提供取消和确认按钮。',
        '取消后应保留当前页面状态。',
        '确认后应按当前操作的实际范围清空数据。',
        '清空确认应说明不删除资料图片。',
        '更换资料确认应说明会清空资料、框选内容和识别方式。',
      ],
      source: {
        decisionFile,
        decisionObject: '确认清空/更换资料弹窗',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-022',
      title: '题答分页分组',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'region',
      objectName: '题答分页题目图片和答案图片分组',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.separate-mode-groups',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.separate-mode-groups'),
      display: {
        title: '分组展示',
        description: [
          '题答分页模式下，资料区按「题目图片」和「答案图片」分组展示，帮助用户区分需要框选的题目资料和后续用于匹配的答案资料。',
          '题目图片分组展示「对题目图片框选需识别的内容」，用于提示用户只在题目图片上选择完整题干内容。',
          '答案图片分组仅在当前存在答案图片时展示，展示「用于系统匹配答案和解析，无需框选」。',
          '题目图片分组和答案图片分组之间使用分隔线区分，避免用户把答案图片误认为需要继续框选的题目图片。',
        ],
        fields: [
          '题目图片',
          '对题目图片框选需识别的内容',
          '答案图片',
          '用于系统匹配答案和解析，无需框选',
        ],
        states: ['题答分页模式', '有答案图片状态', '无答案图片状态'],
      },
      operation: {
        title: '使用规则',
        description: [
          '题答分页模式下，用户只需要在题目图片分组内选择或补充识别框。',
          '答案图片不参与本页框选操作，后续用于答案和解析匹配。',
        ],
        permission: '仅题答分页模式展示该分组规则；仅识别题目和一题一答模式不展示答案图片分组。',
        dataFlow:
          '进入识别后，题目图片分组中的已选识别框生成题目内容，答案图片分组随本次任务进入后续答案和解析匹配流程。',
        exceptions:
          '当前没有答案图片时，不展示答案图片分组；题目图片分组仍正常展示并支持框选。',
      },
      acceptance: [
        '题答分页模式下，应展示题目图片分组。',
        '当前存在答案图片时，应展示答案图片分组。',
        '答案图片分组不应展示或允许框选题目识别框。',
        '开始识别后，答案图片应随任务进入后续答案和解析匹配流程。',
      ],
      source: {
        decisionFile,
        decisionObject: '题答分页题目图片和答案图片分组',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_QUESTION_CONTENT_SELECTION-023',
      title: '横竖屏切换',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.31',
      objectType: 'button',
      objectName: '横屏和竖屏切换入口',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-question-content-selection.orientation-switch',
      anchorStatus: 'planned',
      activate: activateQuestionContentSelection('tablet-question-content-selection.orientation-switch'),
      display: {
        title: '视图状态',
        description: [
          '选择识别内容页面顶部展示「横屏」和「竖屏」两个视图切换入口，当前选中的视图应有明确的选中态。',
          '默认进入页面时展示横屏视图，用于承接大多数资料图片的横向预览和框选。',
          '切换到竖屏视图后，资料展示区域按竖屏阅读尺寸重新排布，方便用户查看竖向拍摄或上传的资料。',
        ],
        fields: ['横屏', '竖屏'],
        states: ['横屏视图', '竖屏视图'],
      },
      operation: {
        title: '切换规则',
        description: [
          '用户点击「横屏」或「竖屏」后，只切换当前资料查看和框选的页面视图，不改变已上传资料、切题框、手动识别框和已选中状态。',
          '横屏和竖屏切换用于辅助用户查看资料，不代表重新上传资料或重新发起切题。',
        ],
        permission: '进入选择识别内容页面后可使用；智能切题中仍以等待状态为准，不展示资料框选操作。',
        dataFlow:
          '视图切换只影响当前页面的资料展示尺寸和滚动方式，后续识别仍按用户当前已选择的识别框和资料顺序继续处理。',
        exceptions:
          '如果当前资料更适合另一种阅读方向，用户可以随时切换回来，系统应保留切换前的框选结果。',
      },
      acceptance: [
        '页面顶部应展示横屏和竖屏两个切换入口。',
        '当前视图应有明确选中态。',
        '切换视图后，已上传资料、切题框和选中状态不应丢失。',
        '切换视图不应重新触发上传、切题或识别。',
      ],
      source: {
        decisionFile,
        decisionObject: '横屏/竖屏切换',
        relatedFiles,
      },
    },
  ],
  excludedDecisions: [
    {
      objectName: '手动框选原型实现备注',
      reason: '用户明确说明“两套交互方案都具备，便于给开发演示”属于后续原型调整思路，不写入业务逻辑正文。',
      sourceDecision: '手动添加识别框交互的备注信息。',
    },
  ],
};
