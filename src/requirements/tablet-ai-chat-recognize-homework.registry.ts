import type { ActivationStep, RequirementRegistry } from './schema';

const relatedFiles = [
  'src/app/tablet-ai-entry/tablet-ai-entry-preview.tsx',
  '../projects-new-recognition-flow/src/components/AIChatPanel.tsx',
  '../projects-new-recognition-flow/src/app/homework/page.tsx',
  '../projects-new-recognition-flow/src/requirements/ai-chat-panel.registry.ts',
  '产品文档/prd-workflow/inventories/ai-chat-recognize-homework-button.inventory.md',
  '产品文档/prd-workflow/decisions/ai-chat-recognize-homework-button.decision.md',
];

const pageName = '平板端 AI 小乐对话面板';
const route = '/tablet-ai-entry → AI 小乐对话面板';
const moduleName = '识别作业资料';
const decisionFile = '产品文档/prd-workflow/decisions/ai-chat-recognize-homework-button.decision.md';

function activateAiPanel(anchorId: string): ActivationStep[] {
  return [
    { type: 'navigate', label: '打开平板端入口页', to: '/tablet-ai-entry' },
    { type: 'openPanel', label: '打开 AI 小乐对话面板', panel: 'TabletAiPanel' },
    { type: 'scrollTo', label: '定位页面对象', anchorId },
    { type: 'highlight', label: '高亮页面对象', anchorId },
  ];
}

export const tabletAiChatRecognizeHomeworkRegistry: RequirementRegistry = {
  registryId: 'tablet-ai-chat-recognize-homework',
  pageName,
  route,
  module: moduleName,
  description:
    '记录平板端 AI 小乐对话面板中「帮我识别作业资料」入口、多学科用户学段学科提示和底部输入框置灰的业务逻辑。',
  sourceDecisionFile: decisionFile,
  relatedFiles,
  displayOrder: [
    'TABLET_AI_CHAT_RECOGNIZE-001',
    'TABLET_AI_CHAT_SUBJECT_PROMPT-001',
    'TABLET_AI_CHAT_INPUT_DISABLED-001',
  ],
  displayNumberMap: {
    'TABLET_AI_CHAT_RECOGNIZE-001': 1,
    'TABLET_AI_CHAT_SUBJECT_PROMPT-001': 2,
    'TABLET_AI_CHAT_INPUT_DISABLED-001': 3,
  },
  requirements: [
    {
      id: 'TABLET_AI_CHAT_RECOGNIZE-001',
      title: '识别作业资料入口',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.25',
      objectType: 'button',
      objectName: '帮我识别作业资料',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-ai-chat.recognize-homework-button',
      anchorStatus: 'implemented',
      activate: activateAiPanel('tablet-ai-chat.recognize-homework-button'),
      display: {
        title: '入口展示',
        description:
          'AI 小乐对话面板在快捷功能区展示「帮我识别作业资料」入口，用户可从该入口开始本次作业资料识别。',
        fields: ['帮我识别作业资料', '快捷功能区'],
        states: ['默认可点击状态'],
      },
      operation: {
        title: '点击流转',
        description:
          '用户点击「帮我识别作业资料」后，系统进入作业资料识别流程；如本次识别需要先确认学科，应先完成学科确认，再进入识别方式选择。',
        permission: '该入口面向可使用平板端作业识别能力的用户展示。',
        dataFlow:
          '入口只负责发起本次识别任务，不在 AI 小乐对话区新增聊天消息；后续识别资料、学科和识别方式在作业识别流程内继续流转。',
        exceptions:
          '如果学科确认或识别方式选择无法继续，页面应停留在当前面板，并允许用户重新点击入口发起流程。',
      },
      acceptance: [
        'AI 小乐面板应展示「帮我识别作业资料」入口。',
        '点击入口后应进入作业资料识别流程。',
        '点击入口后不应在 AI 小乐对话区新增用户消息或 AI 回复。',
      ],
      source: {
        decisionFile,
        decisionObject: '对象 1：帮我识别作业资料按钮',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_AI_CHAT_SUBJECT_PROMPT-001',
      title: '多学科用户学段学科提示',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.25',
      objectType: 'copy',
      objectName: '请先选择这次识别资料的学段学科',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-ai-chat.subject-prompt',
      anchorStatus: 'implemented',
      activate: activateAiPanel('tablet-ai-chat.subject-prompt'),
      display: {
        title: '提示展示',
        description:
          '当前用户存在多个可用学段学科时，点击「帮我识别作业资料」后，AI 小乐面板展示「请先选择这次识别资料的学段学科」提示，引导用户先确认本次识别资料所属学段学科。',
        fields: ['请先选择这次识别资料的学段学科', '学段学科列表'],
        states: ['多学科待选择状态'],
      },
      operation: {
        title: '学科来源',
        description:
          '提示下方展示的学段学科范围，应来自当前用户账号在乐课网下可使用的学段学科信息；用户只能从该范围内选择本次识别资料对应的学段学科。',
        permission: '只展示当前用户账号可使用的学段学科。',
        dataFlow: '用户选定的学段学科作为本次作业资料识别的学科信息，继续传递到后续识别方式选择和资料识别流程。',
        exceptions: '如果当前账号没有可用学段学科，不应直接进入识别方式选择，应停留在 AI 小乐面板并提示用户无法继续选择。',
      },
      acceptance: [
        '多学科用户点击「帮我识别作业资料」后，应看到「请先选择这次识别资料的学段学科」提示。',
        '提示下方的学段学科应与当前用户账号在乐课网可用的学段学科范围一致。',
        '用户未选择学段学科前，不应进入识别方式选择。',
      ],
      source: {
        decisionFile,
        decisionObject: '对象 2：多学科用户学段学科提示',
        relatedFiles,
      },
    },
    {
      id: 'TABLET_AI_CHAT_INPUT_DISABLED-001',
      title: '底部输入框置灰',
      sourceType: 'code+decision',
      changeType: 'new',
      changeDate: '8.25',
      objectType: 'state',
      objectName: 'AI 小乐底部输入框',
      module: moduleName,
      pageName,
      route,
      anchorId: 'tablet-ai-chat.input-disabled',
      anchorStatus: 'implemented',
      activate: activateAiPanel('tablet-ai-chat.input-disabled'),
      display: {
        title: '置灰展示',
        description:
          'AI 小乐对话面板底部输入区展示为置灰状态，输入提示、语音入口、添加入口和发送入口均呈现不可用样式。',
        fields: ['向我提问或提出要求', '语音入口', '添加入口', '发送入口'],
        states: ['置灰不可用状态'],
      },
      operation: {
        title: '不可输入',
        description:
          '当前原型阶段，用户不能通过底部输入区直接向 AI 小乐发送自由文本、语音或附件任务，只能通过页面提供的快捷入口发起对应业务流程。',
        permission: '',
        dataFlow: '底部输入区不采集用户输入，也不产生新的对话记录或识别任务。',
        exceptions: '',
      },
      acceptance: [
        '底部输入区应以置灰状态展示。',
        '用户不能在底部输入区输入文本或发送消息。',
        '点击添加入口或发送入口不应发起识别流程。',
      ],
      source: {
        decisionFile,
        decisionObject: '对象 3：AI 小乐底部输入框置灰',
        relatedFiles,
      },
    },
  ],
  excludedDecisions: [
    {
      objectName: '单学科用户、多学科用户切换按钮',
      reason: '该切换只用于原型演示不同用户状态，不作为本页面业务需求角标维护。',
      sourceDecision: decisionFile,
    },
    {
      objectName: '帮我布置试卷作业、帮我布置听力作业',
      reason: '本次只审核「帮我识别作业资料」入口，其他快捷按钮暂不纳入本注册表。',
      sourceDecision: decisionFile,
    },
    {
      objectName: '识别方式弹窗内部选项、上传资料、切题和结果核对',
      reason: '本次只记录 AI 小乐对话面板内的入口与输入区状态；后续步骤由对应流程注册表维护。',
      sourceDecision: decisionFile,
    },
  ],
};
