import type { ActivationStep, RequirementRegistry } from './schema';

const relatedFiles = [
  'src/app/tablet-ai-entry/tablet-ai-entry-preview.tsx',
  'src/components/UploadQuestionDialog.tsx',
  'src/requirements/upload-files-step.registry.ts',
  'src/requirements/upload-question-dialog-select-mode.registry.ts',
  '产品文档/prd-workflow/inventories/tablet-capture-page.inventory.md',
  '产品文档/prd-workflow/inventories/tablet-capture-supplement-page.inventory.md',
  '产品文档/prd-workflow/decisions/tablet-capture-page.decision.md',
  '产品文档/prd-workflow/decisions/tablet-capture-supplement-page.decision.md',
  '产品文档/prd-workflow/decisions/upload-files-step.decision.md',
  '产品文档/prd-workflow/decisions/select-mode-page.decision.md',
];

const pageName = '平板端拍摄资料页面';
const route = '/tablet-ai-entry → 拍摄资料';
const moduleName = '识别作业资料';
const decisionFile = '产品文档/prd-workflow/decisions/tablet-capture-page.decision.md';

function activateTabletCapturePage(anchorId: string): ActivationStep[] {
  return [
    { type: 'navigate', label: '打开平板端入口页', to: '/tablet-ai-entry' },
    { type: 'openPanel', label: '打开 AI 小乐对话面板', panel: 'TabletAiPanel' },
    { type: 'openDialog', label: '打开拍摄资料页面', dialog: 'TabletCaptureSimulator' },
    { type: 'scrollTo', label: '定位页面对象', anchorId },
    { type: 'highlight', label: '高亮页面对象', anchorId },
  ];
}

export const tabletCapturePageRegistry: RequirementRegistry = {
  registryId: 'tablet-capture-page',
  pageName,
  route,
  module: moduleName,
  description:
    '记录平板端拍摄资料页面在首次拍摄和补充资料态下的关闭、标题、题目/答案分类、相册选择、拍照裁剪、图片管理、数量限制、排序合并和去切题规则。',
  sourceDecisionFile: decisionFile,
  relatedFiles,
  displayOrder: [
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
  displayNumberMap: {
    'TABLET_CAPTURE-001': 1,
    'TABLET_CAPTURE-002': 2,
    'TABLET_CAPTURE-003': 3,
    'TABLET_CAPTURE-004': 4,
    'TABLET_CAPTURE-005': 5,
    'TABLET_CAPTURE-006': 6,
    'TABLET_CAPTURE-007': 7,
    'TABLET_CAPTURE-008': 8,
    'TABLET_CAPTURE-009': 9,
  },
  requirements: [
    {
      id: 'TABLET_CAPTURE-001',
      title: '标题与关闭',
      sourceType: 'code+decision',
      changeType: 'changed',
      changeDate: '8.31',
      objectType: 'button',
      objectName: '拍摄页标题与关闭入口',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-capture.header-close',
      anchorStatus: 'implemented',
      activate: activateTabletCapturePage('tablet-capture.header-close'),
      display: {
        title: '页面状态',
        description:
          '拍摄页左上角展示关闭入口。首次拍摄时，仅识别题目模式展示当前拍摄资料的标题；题答分页模式根据当前分类展示「拍摄题目」或「拍摄答案」。从选择识别内容页点击「补充资料」进入时，页面主操作区域展示「补充作业资料」，表示当前是在已有资料基础上补充图片。',
        fields: ['关闭入口', '拍摄作业资料', '拍摄题目', '拍摄答案', '补充作业资料', '题目图片数量', '答案图片数量'],
        states: ['首次拍摄状态', '补充资料状态', '题答分页题目拍摄状态', '题答分页答案拍摄状态'],
      },
      operation: {
        title: '返回规则',
        description:
          '首次拍摄时，用户点击关闭后直接返回上一页，不区分当前是否已经拍摄或从相册添加图片。补充资料时，用户点击关闭后丢弃本次补充图片和本次排序调整，返回选择识别内容页。',
        permission: '仅面向已从 AI 小乐发起识别作业资料流程、并进入拍摄资料页的用户。',
        dataFlow:
          '首次拍摄关闭后清空本次拍摄页内已拍摄和已从相册添加的图片；补充资料关闭后保留原资料、原切题框和原选中状态，不把本次补充图片或排序调整带回选择识别内容页。',
        exceptions:
          '关闭操作不弹出二次确认，也不保留当前拍摄进度。',
      },
      acceptance: [
        '拍摄页应展示左上角关闭入口。',
        '仅识别题目模式应展示当前拍摄资料标题。',
        '题答分页模式应能区分当前正在拍摄题目还是答案。',
        '点击关闭后应返回上一页并清空本次图片。',
        '补充资料态点击关闭后，应丢弃本次补充图片和排序调整，并保留原资料、原切题框和原选中状态。',
      ],
      source: {
        decisionFile,
        decisionObject: '关闭入口 / 拍摄页标题 / 补充资料态页面标题 / 关闭补充资料页面',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_CAPTURE-002',
      title: '题答分类',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.27',
      objectType: 'tab',
      objectName: '题目图片 / 答案图片分类切换',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-capture.role-tabs',
      anchorStatus: 'implemented',
      activate: activateTabletCapturePage('tablet-capture.role-tabs'),
      display: {
        title: '分类展示',
        description:
          '题答分页模式下，顶部展示「题目图片」和「答案图片」两个分类入口，并分别显示当前已添加数量。当前选中的分类需要有明确选中状态，让用户知道接下来拍摄或从相册添加的图片会进入哪一类。',
        fields: ['题目图片', '答案图片', '题目图片数量', '答案图片数量'],
        states: ['题目图片选中态', '答案图片选中态'],
      },
      operation: {
        title: '归属规则',
        description:
          '用户可以随时在题目图片和答案图片之间切换。切换后，新拍摄或新从相册添加的图片归入当前选中的分类。',
        permission: '仅题答分页模式展示并允许使用该分类切换；仅识别题目模式不展示题目/答案分类。',
        dataFlow:
          '题目图片用于后续切题和题目识别，答案图片用于后续答案解析匹配；两个分类随本次识别任务一起传递到后续流程。',
        exceptions:
          '切换分类本身不校验数量，也不阻止用户进入空分类查看或继续添加图片。',
      },
      acceptance: [
        '题答分页模式应展示题目图片和答案图片分类入口。',
        '点击分类入口后，当前拍摄分类应切换成功。',
        '从相册添加或拍摄生成的图片应归入当前分类。',
        '仅识别题目模式不应展示题目/答案分类入口。',
      ],
      source: {
        decisionFile,
        decisionObject: '题答分页分类切换',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_CAPTURE-003',
      title: '拍摄示例',
      sourceType: 'decision',
      changeType: 'new',
      changeDate: '8.27',
      objectType: 'button',
      objectName: '拍摄示例按钮',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-capture.example',
      anchorStatus: 'implemented',
      activate: activateTabletCapturePage('tablet-capture.example'),
      display: {
        title: '示例入口',
        description:
          '拍摄页右上角展示「拍摄示例」入口，用于帮助用户查看当前资料应该如何拍摄。',
        fields: ['拍摄示例'],
        states: ['默认可点击状态'],
      },
      operation: {
        title: '示例查看',
        description:
          '用户点击「拍摄示例」后，展示线上已有的拍摄示例效果。',
        permission: '进入拍摄资料页后即可查看拍摄示例。',
        dataFlow:
          '查看拍摄示例不改变已拍图片、已选分类和后续识别资料。',
        exceptions:
          '关闭拍摄示例后，应回到当前拍摄页并保持原有拍摄进度。',
      },
      acceptance: [
        '拍摄页应展示「拍摄示例」入口。',
        '点击后应展示线上已有的拍摄示例效果。',
        '关闭示例后应回到拍摄页。',
        '查看示例不应清空或修改已添加图片。',
      ],
      source: {
        decisionFile,
        decisionObject: '拍摄示例',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_CAPTURE-004',
      title: '相册添加',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.27',
      objectType: 'button',
      objectName: '从相册选择入口',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-capture.album',
      anchorStatus: 'implemented',
      activate: activateTabletCapturePage('tablet-capture.album'),
      display: {
        title: '入口规则',
        description:
          '拍摄页侧边栏展示从相册选择入口。平板端拍摄页只支持添加图片资料，不支持在本页添加 PDF、Word 等非图片资料。',
        fields: ['从相册选择', '图片资料'],
        states: ['默认可点击状态'],
      },
      operation: {
        title: '添加规则',
        description:
          '用户从相册选择图片后，图片加入本次识别资料。仅识别题目模式下，图片加入作业图片；题答分页模式下，图片加入当前选中的题目图片或答案图片分类。',
        permission: '进入拍摄资料页后即可从相册添加图片。',
        dataFlow:
          '相册图片按添加顺序进入当前任务，并与拍摄生成的图片共同参与 24 张上限校验；题答分页模式下，题目图片和答案图片合计最多 24 张。',
        exceptions:
          '单次识别最多 24 张图片；达到上限后，应阻止继续添加新图片。非图片资料不进入本页资料列表。',
      },
      acceptance: [
        '拍摄页应提供从相册选择入口。',
        '仅图片资料可以进入拍摄页资料列表。',
        '题答分页模式下，相册图片应归入当前选中的分类。',
        '题目图片和答案图片合计超过 24 张时，应阻止继续添加。',
      ],
      source: {
        decisionFile,
        decisionObject: '相册选择入口 / 图片数量上限 / 相册文件格式',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_CAPTURE-005',
      title: '拍照裁剪',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.27',
      objectType: 'button',
      objectName: '拍照按钮与裁剪框',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-capture.shutter-crop',
      anchorStatus: 'implemented',
      activate: activateTabletCapturePage('tablet-capture.shutter-crop'),
      display: {
        title: '裁剪状态',
        description:
          '拍摄页展示拍照按钮。第一次点击后，页面出现可调整的裁剪框；裁剪框展示在拍摄画面上，用户可以看到本次将生成图片的范围。',
        fields: ['拍照按钮', '裁剪框', '确认拍照裁剪'],
        states: ['待拍照状态', '待确认裁剪状态'],
      },
      operation: {
        title: '生成图片',
        description:
          '优选方案为第一次点击拍照后，系统自动框选图片中有内容的区域；用户可以手动调整框选范围，再次点击确认生成图片。若自动框选不可用，则第一次点击出现默认裁剪框，用户调整后再次点击确认生成图片。',
        permission: '进入拍摄资料页后即可拍摄图片。',
        dataFlow:
          '确认生成后的图片加入当前识别资料；仅识别题目模式加入作业图片，题答分页模式加入当前选中的题目图片或答案图片。',
        exceptions:
          '用户未确认裁剪前，不生成新的图片。自动框选能力不稳定或不可用时，使用默认裁剪框作为兜底。',
      },
      acceptance: [
        '第一次点击拍照后应进入裁剪确认状态。',
        '裁剪框应支持用户手动调整范围。',
        '再次点击确认后应生成图片。',
        '生成的图片应加入当前模式对应的图片集合。',
      ],
      source: {
        decisionFile,
        decisionObject: '拍照按钮与裁剪框 / 裁剪框调整',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_CAPTURE-006',
      title: '继续识别',
      sourceType: 'code+decision',
      changeType: 'changed',
      changeDate: '8.31',
      objectType: 'button',
      objectName: '下一步拍答案 / 去切题按钮',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-capture.primary-action',
      anchorStatus: 'implemented',
      activate: activateTabletCapturePage('tablet-capture.primary-action'),
      display: {
        title: '按钮状态',
        description: [
          '正常拍摄流程：拍摄页底部展示主操作按钮。仅识别题目模式展示「去切题」；题答分页题目阶段展示「下一步：拍答案」；题答分页答案阶段展示「去切题」。未满足当前阶段资料条件时，按钮不可用。',
          '补充资料流程：从选择识别内容页进入补充资料后，底部主按钮仍展示「去切题」。如果用户没有新增图片，也没有调整已处理图片顺序，「去切题」保持置灰不可点击；如果用户新增了图片或调整了图片顺序，「去切题」恢复可点击。',
        ],
        fields: ['下一步：拍答案', '去切题'],
        states: ['可点击状态', '禁用状态', '补充资料无变化禁用态'],
      },
      operation: {
        title: '流转规则',
        description: [
          '正常拍摄流程：题答分页模式下，题目阶段已有题目图片后，用户可以点击「下一步：拍答案」进入答案图片拍摄；答案阶段已有答案图片后，用户可以点击「去切题」。仅识别题目和题目答案同图模式下，已有作业图片后，用户可以点击「去切题」。',
          '补充资料流程：用户新增图片，或只调整已处理图片顺序后，都可以点击「去切题」重新处理资料；用户没有新增图片且没有调整顺序时，不进入重新切题流程。',
        ],
        permission: [
          '正常拍摄流程：仅当前拍摄阶段已经添加必需资料时允许继续。',
          '补充资料流程：仅本次补充资料存在新增图片或顺序变化时允许继续。',
        ],
        dataFlow: [
          '正常拍摄流程：点击「下一步：拍答案」只切换拍摄阶段；点击「去切题」后，按当前已拍资料进入后续选择识别内容流程。',
          '补充资料流程：点击「去切题」后，后续选择识别内容页按补充资料后的最新图片顺序展示；如果只新增图片且未调整旧图片顺序，可优先保留旧图片的原切题结果，只处理新增图片；如果调整了旧图片顺序，或无法稳定保留旧切题结果，则按最新图片顺序重新切题。',
        ],
        exceptions: [
          '正常拍摄流程：缺少题目图片时提示「请先添加题目图片」；缺少答案图片时提示「请先添加答案图片」。',
          '补充资料流程：无新增图片且无排序变化时，「去切题」置灰不可点击，不展示额外提示。',
        ],
      },
      acceptance: [
        '仅识别题目模式下，没有作业图片时「去切题」不可用。',
        '题答分页题目阶段，有题目图片后可以进入拍答案。',
        '题答分页答案阶段，题目图片和答案图片都存在后才能去切题。',
        '缺少对应图片时，应展示已确认提示文案。',
        '补充资料态无新增且无排序变化时，「去切题」应置灰不可点击。',
        '补充资料态新增图片或调整图片顺序后，应允许点击「去切题」。',
      ],
      source: {
        decisionFile,
        decisionObject: '主操作按钮 / 缺少图片提示 / 题答分页两阶段流转 / 无新增且无排序变化时的去切题按钮 / 有新增或有排序变化时的去切题按钮',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_CAPTURE-007',
      title: '已拍入口',
      sourceType: 'code+decision',
      changeType: 'changed',
      changeDate: '8.31',
      objectType: 'button',
      objectName: '已拍图片入口',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-capture.manager-entry',
      anchorStatus: 'implemented',
      activate: activateTabletCapturePage('tablet-capture.manager-entry'),
      display: {
        title: '数量口径',
        description:
          '拍摄页侧边栏展示已拍图片入口。没有图片时入口不可用；已有图片时展示最近添加图片的缩略图。首次拍摄时，数量角标显示本次已添加的全部图片数量；补充资料态下，数量角标只显示本次补充图片数量，已处理图片只在图片管理面板中可见。',
        fields: ['已拍图片入口', '缩略图', '数量角标'],
        states: ['无图片禁用态', '有图片可点击态', '补充资料数量状态'],
      },
      operation: {
        title: '打开管理',
        description:
          '用户点击已拍图片入口后，打开已拍图片管理面板，用于查看、删除、调整图片顺序，或在题答分页模式下调整图片分类。',
        permission: '本次拍摄任务已有图片时才允许打开图片管理面板。',
        dataFlow:
          '首次拍摄时，数量角标统计本次已添加的全部图片；题答分页模式下，该数量为题目图片和答案图片合计数。补充资料态下，数量角标不统计已处理图片，只统计本次补充图片。',
        exceptions:
          '没有任何图片时，已拍图片入口保持不可用，不打开图片管理面板。',
      },
      acceptance: [
        '没有图片时，已拍图片入口不可用。',
        '已有图片时，入口应展示最近添加图片缩略图。',
        '数量角标应显示本次全部图片数量。',
        '题答分页模式下，数量角标应统计题目图片和答案图片合计数。',
        '补充资料态下，数量角标应只显示本次补充图片数量。',
      ],
      source: {
        decisionFile,
        decisionObject: '已拍缩略图入口 / 已拍图片入口数量角标 / 补充态右下角缩略图入口',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_CAPTURE-008',
      title: '图片管理',
      sourceType: 'code+decision',
      changeType: 'changed',
      changeDate: '8.31',
      objectType: 'panel',
      objectName: '已拍图片管理面板',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-capture.manager-panel',
      anchorStatus: 'implemented',
      activate: activateTabletCapturePage('tablet-capture.manager-panel'),
      display: {
        title: '列表状态',
        description:
          '图片管理面板标题为「已拍图片」。仅识别题目模式下按「作业图片」分组展示；题答分页模式下按「题目」和「答案」分组展示。每个分组展示当前图片数量，分组为空时展示「暂未添加图片」。补充资料态下，已处理图片展示“已处理”标签，本次新增图片展示“本次补充”标签；这两个标签只在图片管理面板中展示。',
        fields: ['已拍图片', '作业图片', '题目', '答案', '暂未添加图片', '已处理', '本次补充', '删除'],
        states: ['作业图片分组', '题目分组', '答案分组', '分组空状态', '补充资料状态'],
      },
      operation: {
        title: '删除规则',
        description:
          '首次拍摄时，用户可以在图片管理面板中删除图片，删除时不需要二次确认。补充资料态下，本次补充图片可以直接删除，已处理图片不展示删除入口，只允许参与排序。',
        permission: '本次拍摄任务已有图片时才允许进入图片管理面板执行管理操作。',
        dataFlow:
          '删除图片后，该图片从本次识别资料中移除，不再传递给后续切题、识别或答案匹配流程。补充资料态下删除本次补充图片后，系统继续按剩余补充图片和当前排序状态判断「去切题」是否可用。',
        exceptions:
          '首次拍摄时，删除最后一张图片后，已拍图片入口恢复为无图片状态，主操作按钮按无资料规则不可继续。补充资料态下，如果删除所有本次补充图片但已调整过已处理图片顺序，仍允许点击「去切题」重新切题；如果没有新增也没有排序变化，「去切题」保持置灰。',
      },
      acceptance: [
        '图片管理面板应按当前识别方式展示正确分组。',
        '空分组应展示「暂未添加图片」。',
        '删除图片不应弹出二次确认。',
        '删除后应更新数量和主操作按钮状态。',
        '补充资料态下，已处理图片应展示“已处理”标签且不展示删除按钮。',
        '补充资料态下，本次补充图片应展示“本次补充”标签并允许直接删除。',
        '已处理/本次补充标签不应展示在拍摄页顶部。',
      ],
      source: {
        decisionFile,
        decisionObject: '已拍图片管理面板 / 作业图片分组 / 题目答案图片分组 / 删除图片 / 暂未添加图片空状态 / 已处理图片 / 本次补充图片 / 已处理本次补充标签 / 删除本次补充图片 / 已处理图片不可删除',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_CAPTURE-009',
      title: '排序与移动',
      sourceType: 'code+decision',
      changeType: 'changed',
      changeDate: '8.31',
      objectType: 'button',
      objectName: '排序 / 移到题目 / 移到答案',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-capture.sort-move',
      anchorStatus: 'implemented',
      activate: activateTabletCapturePage('tablet-capture.sort-move'),
      display: {
        title: '操作入口',
        description: [
          '正常拍摄流程：图片管理面板中的图片行展示排序入口。题答分页模式下，题目图片和答案图片分别展示在各自分组内，并提供「移到答案」或「移到题目」入口。',
          '补充资料流程：图片管理面板同时展示已处理图片和本次补充图片。已处理图片展示“已处理”标签，本次新增图片展示“本次补充”标签；两类图片都可以展示排序入口，已处理图片不展示删除入口。',
        ],
        fields: ['排序', '移到答案', '移到题目', '已处理', '本次补充'],
        states: ['题目图片行', '答案图片行', '补充资料图片行'],
      },
      operation: {
        title: '排序流转',
        description: [
          '正常拍摄流程：题答分页模式下，题目图片支持调整顺序，用户可以把题目图片移到答案分组，也可以把答案图片移到题目分组。图片移动后，图片进入目标分组，并参与该分组后续资料处理。',
          '补充资料流程：仅识别题目、题目答案同图、题答分页三种模式下，用户都可以在图片管理面板中调整已处理图片和本次补充图片的顺序。用户只调整已处理图片顺序但没有新增图片时，也视为本次资料发生变化。',
        ],
        permission: [
          '正常拍摄流程：仅题答分页模式提供题目/答案图片移动；题目图片排序只对题目分组开放。',
          '补充资料流程：三种识别模式都允许对图片管理面板中的可见图片排序；已处理图片不可删除，本次补充图片可删除。',
        ],
        dataFlow: [
          '正常拍摄流程：移动图片会改变该图片在本次识别任务中的分类；题目图片顺序调整后，后续切题和识别按最新顺序处理。',
          '补充资料流程：用户点击「去切题」后，系统按补充资料后的最新图片顺序重新进入切题处理；重新切题时清空旧切题框、手动框和框选状态，再按最新图片顺序生成新的切题框。此时还没有进入识别结果页，不涉及清空识别结果。',
        ],
        exceptions: [
          '正常拍摄流程：移动后如果某一分类为空，面板展示该分类空状态；进入切题前仍按题目图片和答案图片都要有内容的规则校验。',
          '补充资料流程：删除全部本次补充图片后，如果已处理图片顺序没有变化，「去切题」置灰；如果已处理图片顺序已经变化，仍允许点击「去切题」重新处理。',
        ],
      },
      acceptance: [
        '题目图片应支持排序。',
        '答案图片不应展示排序入口。',
        '题目图片可以移动到答案分组。',
        '答案图片可以移动到题目分组。',
        '移动或排序后，后续流程应使用最新分类和顺序。',
        '补充资料态下，已处理图片和本次补充图片都应能参与排序。',
        '补充资料态重新切题时，应清空旧切题框、手动框和框选状态，并按最新图片顺序重新生成。',
        '补充资料态题答分页模式下，题目图片和答案图片应分别维护顺序。',
      ],
      source: {
        decisionFile,
        decisionObject: '题目图片排序 / 移到题目答案 / 图片顺序和移动规则 / 已拍图片面板排序 / 题答分页补充资料 / 补充后重新切题的清空范围',
        relatedFiles,
      },
    },
  ],
  excludedDecisions: [
    {
      objectName: '查看大图',
      reason: '该对象在 Skill1 中明确暂不纳入本轮决策，后续如需作为可验收操作规则，可单独补充审核。',
      sourceDecision: decisionFile,
    },
    {
      objectName: '摄像头背景、拍照按钮颜色、纯视觉装饰',
      reason: '属于视觉表现，不承载本轮已确认的业务规则。',
      sourceDecision: decisionFile,
    },
    {
      objectName: '一题一答拍摄效果',
      reason: '用户本轮确认不纳入拍摄资料页面审核范围。',
      sourceDecision: decisionFile,
    },
    {
      objectName: '进入切题后的选择识别内容页面、最终识别结果页面',
      reason: '属于后续流程页面，不在本注册表范围内。',
      sourceDecision: decisionFile,
    },
    {
      objectName: '补充资料说明弹窗',
      reason: '用户已确认暂不弹窗，避免用户还没看到功能就被复杂说明打断。',
      sourceDecision: '产品文档/prd-workflow/decisions/tablet-capture-supplement-page.decision.md',
    },
    {
      objectName: '顶部已处理/本次补充统计',
      reason: '用户已确认拍摄页顶部不展示该统计，图片来源只通过已拍图片管理面板内标签表达。',
      sourceDecision: '产品文档/prd-workflow/decisions/tablet-capture-supplement-page.decision.md',
    },
  ],
};

