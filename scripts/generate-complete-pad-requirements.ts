import fs from 'node:fs';
import path from 'node:path';

const outputDir = '产品文档/Pad端-prd';

const pages = [
  {
    file: '01-小乐对话面板.md',
    title: '小乐对话面板',
    goal: '作为 Pad 端作业资料识别的入口，用户从 AI 小乐对话面板发起“识别作业资料”流程，并在需要时先确认本次识别的学段学科。',
  },
  {
    file: '02-选择识别方式.md',
    title: '选择识别方式',
    goal: '承接 AI 小乐入口，确定本次识别内容模式和资料组织方式，包括仅题目、题目+答案一题一答、题目+答案题答分页。',
  },
  {
    file: '03-拍摄页面.md',
    title: '拍摄页面',
    goal: '根据用户选择的识别方式，支持拍摄或从相册选择资料；题答分页时题目资料和答案资料分开采集与管理。',
  },
  {
    file: '04-选择识别内容.md',
    title: '选择识别内容',
    goal: '在识别前让用户核对资料页并确认题目区域；无论选择哪种识别内容模式，本页面只框选题目区域。',
  },
  {
    file: '05-核对识别结果.md',
    title: '核对识别结果',
    goal: '核对识别后的题干、题型、选项、空位、复合题子题，以及题目+答案模式下的答案和解析匹配结果，最终加入试卷或返回录题。',
  },
];

function readPage(file: string) {
  return fs.readFileSync(path.join(outputDir, file), 'utf8');
}

function extractSection(text: string, startHeading: string, endHeading: string) {
  const startIndex = text.indexOf(startHeading);
  const endIndex = text.indexOf(endHeading, startIndex + startHeading.length);

  if (startIndex < 0) {
    return '';
  }

  return text.slice(
    startIndex + startHeading.length,
    endIndex > startIndex ? endIndex : undefined,
  ).trim();
}

function stripAcceptanceBlocks(text: string) {
  const lines = text.split(/\r?\n/);
  const keptLines: string[] = [];
  let skippingAcceptance = false;

  for (const line of lines) {
    if (line.startsWith('#### 验收标准')) {
      skippingAcceptance = true;
      continue;
    }

    if (skippingAcceptance && /^(###|####|##) /.test(line)) {
      skippingAcceptance = false;
    }

    if (!skippingAcceptance) {
      keptLines.push(line);
    }
  }

  return keptLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function deepenHeadings(text: string) {
  return text
    .replace(/^#### /gm, '##### ')
    .replace(/^### /gm, '#### ');
}

function getBusinessLogic(file: string) {
  const page = readPage(file);
  return deepenHeadings(stripAcceptanceBlocks(extractSection(
    page,
    '## 3. 业务逻辑说明',
    '## 4. 范围边界',
  )));
}

function renderPageDetail(index: number, page: (typeof pages)[number]) {
  const lines: string[] = [];
  const number = `7.${index + 1}`;

  lines.push(`### ${number} ${page.title}`);
  lines.push('');
  lines.push(`页面目标：${page.goal}`);
  lines.push('');
  lines.push('#### 页面业务逻辑');
  lines.push('');
  lines.push(getBusinessLogic(page.file));
  lines.push('');

  return lines.join('\n');
}

const lines: string[] = [];

lines.push('# Pad端作业资料识别完整需求');
lines.push('');
lines.push('## 1. 文档说明');
lines.push('');
lines.push('本文档用于给后续开发或 AI 开发提供 Pad 端作业资料识别流程的完整需求视角。文档基于 `01-小乐对话面板.md`、`02-选择识别方式.md`、`03-拍摄页面.md`、`04-选择识别内容.md`、`05-核对识别结果.md` 中已经整理过的页面业务逻辑，并同步使用页面数字角标悬浮面板中已核对修订后的注释内容。');
lines.push('');
lines.push('本文档关注前端页面展示、用户交互、跨页面数据流转、模式关系和边界场景。不覆盖题目识别、答案识别、解析生成等内部 AI 模型推理逻辑；只要求前端交互效果、状态呈现和数据承接关系符合当前原型和已确认规则。');
lines.push('');
lines.push('本文档不单独设置验收标准章节；如需逐条验收，可回到单页 PRD 或页面数字角标查看对应对象。');
lines.push('');
lines.push('## 2. 整体业务目标');
lines.push('');
lines.push('Pad 端作业资料识别流程的目标，是让用户从 AI 小乐对话面板发起作业资料识别任务，完成识别方式选择、资料拍摄或相册选择、题目区域确认、识别结果核对，并把确认后的题目结构加入试卷或进入后续录题页面。');
lines.push('');
lines.push('完整流程需要支持仅题目模式和题目+答案模式。题目+答案模式继续区分一题一答和题答分页；其中题答分页下，题目资料和答案资料需要分别拍摄或分别从相册选择。');
lines.push('');
lines.push('## 3. 整体流程图');
lines.push('');
lines.push('```mermaid');
lines.push('flowchart TD');
lines.push('  A[AI 小乐对话面板] --> B{是否需要选择学段学科}');
lines.push('  B -->|需要| C[选择学段学科]');
lines.push('  B -->|不需要| D[选择识别方式]');
lines.push('  C --> D');
lines.push('');
lines.push('  D --> E{识别内容模式}');
lines.push('  E -->|仅题目| F[仅题目模式]');
lines.push('  E -->|题目+答案| G{题目+答案类型}');
lines.push('');
lines.push('  G -->|一题一答| H[题目+答案：一题一答]');
lines.push('  G -->|题答分页| I[题目+答案：题答分页]');
lines.push('');
lines.push('  F --> J[拍摄/相册选择题目资料]');
lines.push('  H --> J');
lines.push('  I --> K[拍摄/相册选择题目资料]');
lines.push('  I --> L[拍摄/相册选择答案资料]');
lines.push('');
lines.push('  J --> M[选择识别内容]');
lines.push('  K --> M');
lines.push('  L --> M');
lines.push('');
lines.push('  M --> N[只框选题目区域]');
lines.push('  N --> O[确认识别内容]');
lines.push('  O --> P[核对识别结果]');
lines.push('');
lines.push('  P --> Q{核对页展示模式}');
lines.push('  Q -->|识别模式| R[识别模式：展示可编辑识别结构]');
lines.push('  Q -->|图片模式| S[图片模式：展示题干图片与结构化编辑区]');
lines.push('');
lines.push('  R --> T{是否为题目+答案模式}');
lines.push('  S --> U{是否为题目+答案模式}');
lines.push('');
lines.push('  T -->|仅题目| V[核对题干、题型、选项、空位、复合题子题]');
lines.push('  T -->|题目+答案| W[核对题干、题型、选项、空位、答案、解析、复合题子题]');
lines.push('');
lines.push('  U -->|仅题目| X[题干区展示题目图片；下方核对子题、题型、选项数、空数]');
lines.push('  U -->|题目+答案| Y[题干区展示题目图片；答案解析区展示匹配结果与可补充内容]');
lines.push('');
lines.push('  V --> Z[加入试卷]');
lines.push('  W --> Z');
lines.push('  X --> Z');
lines.push('  Y --> Z');
lines.push('');
lines.push('  Z --> AA{选择组卷方式}');
lines.push('  AA -->|按题型加入| AB[进入试卷作业编辑页]');
lines.push('  AA -->|按题目顺序加入| AB');
lines.push('');
lines.push('  AB --> AC[取消]');
lines.push('  AB --> AD[返回录题]');
lines.push('  AB --> AE[保存至资源库]');
lines.push('  AB --> AF[保存并添加至作业]');
lines.push('```');
lines.push('');
lines.push('## 4. 完整流程总览');
lines.push('');
lines.push('### 4.1 AI 小乐发起流程');
lines.push('');
lines.push('用户在 AI 小乐对话面板点击“帮我识别作业资料”后，系统进入 Pad 端作业资料识别流程。若当前账号存在多个可用学段学科，先要求用户选择本次识别资料所属的学段学科；若无需选择，则直接进入选择识别方式页面。该入口不在对话区追加用户消息或 AI 回复气泡。');
lines.push('');
lines.push('### 4.2 选择识别方式');
lines.push('');
lines.push('选择识别方式用于确定本次识别内容模式。仅题目模式表示后续只识别和核对题目结构；题目+答案模式表示后续除题目结构外，还需要承接答案和解析的匹配、回填与人工补充。题目+答案模式继续分为一题一答和题答分页：一题一答下题目与答案解析在同一份资料里组织；题答分页下题目资料和答案资料分开采集、分开管理。');
lines.push('');
lines.push('### 4.3 拍摄或相册选择资料');
lines.push('');
lines.push('所有模式的资料来源都支持拍摄和相册选择。仅题目模式和一题一答模式主要采集题目资料；题答分页模式需要分别采集题目资料和答案资料，拍摄入口、相册选择、图片管理和继续识别都需要带上当前资料分类。');
lines.push('');
lines.push('### 4.4 选择识别内容');
lines.push('');
lines.push('选择识别内容页面只处理题目区域确认。无论当前是仅题目、一题一答还是题答分页，本页面都只框选题目区域，不框选答案或解析区域。答案资料在后续识别和核对阶段用于答案解析匹配，不在本页面作为可框选对象维护。');
lines.push('');
lines.push('### 4.5 核对识别结果');
lines.push('');
lines.push('核对识别结果页同时存在顶层识别模式/图片模式，以及每张题卡自己的识别/图片切换。识别模式侧重展示和编辑结构化识别结果；图片模式侧重展示题目图片或截图，同时保留必要的结构化核对能力。题目+答案模式下，图片模式需要区分题干区和答案解析区：题干区展示题目图片并承载题型、选项数、空数、子题结构等核对操作；答案解析区展示答案/解析匹配结果、未匹配状态、人工补充入口和回填内容。');
lines.push('');
lines.push('### 4.6 加入试卷和返回录题');
lines.push('');
lines.push('用户点击加入试卷后，系统先根据当前题目、答案、解析和子题结构进行前端校验。需要用户确认组卷方式时，展示加入试卷弹窗，支持按题型加入试卷或按题目顺序加入试卷。确认后进入试卷作业编辑页，底部提供取消、返回录题、保存至资源库、保存并添加至作业等操作。');
lines.push('');
lines.push('## 5. 核心模式关系');
lines.push('');
lines.push('### 5.1 仅题目模式');
lines.push('');
lines.push('仅题目模式只要求用户核对题干、题型、选项、空位和复合题子题结构。该模式不展示答案解析匹配模块，也不要求处理答案和解析回填。');
lines.push('');
lines.push('### 5.2 题目+答案模式');
lines.push('');
lines.push('题目+答案模式在题目结构核对之外，增加答案和解析的匹配、未匹配提示、人工关联、人工补充和回填内容。该模式下的核对页需要同时处理父题答案、父题解析、空位答案、子题答案、子题解析等对象。');
lines.push('');
lines.push('### 5.3 一题一答');
lines.push('');
lines.push('一题一答是题目+答案模式的一种资料组织方式，题目、答案和解析通常来自同一组资料。前端流程仍支持拍摄和相册选择资料，并在后续核对页按题目维度承接答案解析匹配结果。');
lines.push('');
lines.push('### 5.4 题答分页');
lines.push('');
lines.push('题答分页是题目+答案模式的另一种资料组织方式。题目资料和答案资料需要分开拍摄或分开从相册选择；进入选择识别内容时仍只框选题目资料里的题目区域，答案资料不进入题目框选操作。');
lines.push('');
lines.push('### 5.5 识别模式');
lines.push('');
lines.push('识别模式展示结构化识别结果，并允许用户对题干、题型、选项、空位、答案、解析和子题结构进行编辑或补充。若图片内容发生更新，切回识别模式时需要重新识别；若图片没有更新，则回显用户之前编辑过的识别结果。');
lines.push('');
lines.push('### 5.6 图片模式');
lines.push('');
lines.push('图片模式展示题目图片或截图，并保留与图片内容相关的裁剪、单题视图切换和结构核对能力。仅题目模式下，图片模式主要核对题目图片、题型、选项数、空数和复合题子题；题目+答案模式下，图片模式还需要展示答案解析区的匹配结果和补充入口。');
lines.push('');
lines.push('## 6. 跨页面数据流转');
lines.push('');
lines.push('### 6.1 学段学科');
lines.push('');
lines.push('学段学科来自当前用户账号可用范围。若账号存在多个可用学段学科，用户从 AI 小乐对话面板发起识别后需要先选择本次识别的学段学科；选择结果继续传递给识别方式、资料采集、识别内容选择和识别结果核对。');
lines.push('');
lines.push('### 6.2 识别内容模式和资料组织方式');
lines.push('');
lines.push('用户在选择识别方式页面确定仅题目或题目+答案。若选择题目+答案，还需要确定一题一答或题答分页。该模式决定拍摄页面是否需要区分题目资料和答案资料，也决定核对结果页是否展示答案解析匹配模块。');
lines.push('');
lines.push('### 6.3 资料图片和资料页');
lines.push('');
lines.push('拍摄页面产生资料图片列表。用户可以通过拍照、相册选择、补拍、重拍、删除、排序或移动维护资料顺序。题答分页下，每张资料图片需要归属到题目资料或答案资料。');
lines.push('');
lines.push('### 6.4 题目框选区域');
lines.push('');
lines.push('选择识别内容页面根据资料页展示自动切题框和人工框选框。用户确认后，题目框选区域进入识别流程。所有模式下，本页面传出的都是题目区域，不传出答案解析框选区域。');
lines.push('');
lines.push('### 6.5 题目结构');
lines.push('');
lines.push('识别流程产出题目结构，包括题干、题型、选项、填空空位、复合题父题和子题。核对页允许用户继续修正这些结构；用户手动新增的空位、选项数或子题按页面原型已实现的交互效果执行。');
lines.push('');
lines.push('### 6.6 答案和解析');
lines.push('');
lines.push('题目+答案模式下，答案和解析在核对页进入匹配、回填和人工补充流程。答案解析可以和题目自动匹配，也可以通过人工关联图标、画框和补充操作回填到右侧对应题干、父题答案解析、空位答案或子题答案解析区域。');
lines.push('');
lines.push('### 6.7 加入试卷输出');
lines.push('');
lines.push('加入试卷时，系统输出用户确认后的题目结构、题型、选项、空位、复合题子题、答案和解析。进入试卷作业编辑页后，用户可取消、返回录题、保存至资源库或保存并添加至作业。');
lines.push('');
lines.push('## 7. 页面级需求说明');
lines.push('');
pages.forEach((page, index) => lines.push(renderPageDetail(index, page)));
lines.push('## 8. 关键业务规则汇总');
lines.push('');
lines.push('### 8.1 识别内容选择规则');
lines.push('');
lines.push('用户必须先确定识别内容模式。仅题目模式只进入题目结构核对；题目+答案模式需要进一步区分一题一答和题答分页，并在核对页增加答案解析匹配相关模块。');
lines.push('');
lines.push('### 8.2 资料拍摄、相册选择和资料分类规则');
lines.push('');
lines.push('拍摄和相册选择是所有模式共同支持的资料来源。题答分页下，题目资料和答案资料需要分别采集、分别展示和分别维护；继续识别时必须保留资料分类。');
lines.push('');
lines.push('### 8.3 框选与手动补充规则');
lines.push('');
lines.push('选择识别内容页面只框选题目区域。用户可以使用自动切题框、手动添加识别框、清空框选、全选、横竖屏切换和单框操作来完成题目区域确认。题目+答案模式也不在该页面框选答案或解析。');
lines.push('');
lines.push('### 8.4 识别模式和图片模式切换规则');
lines.push('');
lines.push('顶层识别模式/图片模式影响所有题卡的初始展示模式；单题卡识别/图片切换只影响当前题卡。切换时保留题型、题干、裁剪图片、子题和已编辑内容。图片有更新时切回识别模式需要重新识别；图片未更新时回显用户此前编辑结果。');
lines.push('');
lines.push('### 8.5 题型、选项数和空数规则');
lines.push('');
lines.push('题型切换需要保护已有结构。选择题和判断题需要维护选项数；填空题需要维护空数和空位；复合题下的子题根据子题题型显示对应的选项数或空数设置。完型填空题只能手动增加子题数和选项数。');
lines.push('');
lines.push('### 8.6 复合题子题规则');
lines.push('');
lines.push('复合题默认至少展示一个子题结构。用户可以通过子题右侧添加图标选择在上方或下方添加子题，再选择子题题型后，在对应位置生成空的子题结构。只有一个子题时不展示删除图标；多个子题时才展示删除图标。删除子题时，若子题全是占位内容则直接删除；若已有内容，则弹窗提示“确认删除当前子题吗？”，取消只关闭弹窗，确认后删除。');
lines.push('');
lines.push('### 8.7 答案解析匹配与人工补充规则');
lines.push('');
lines.push('题目+答案模式下，核对页展示答案解析匹配状态。系统自动匹配成功时回填到对应题目、父题、空位或子题区域；未匹配或缺失时允许用户通过答案/解析关联图标、左侧资料画框和人工补充入口把内容回填到右侧对应区域。');
lines.push('');
lines.push('### 8.8 加入试卷与后续录题规则');
lines.push('');
lines.push('点击加入试卷时，若需要选择组卷方式，先展示加入试卷弹窗。用户确认加入后进入试卷作业编辑页。编辑页底部在取消按钮后、保存至资源库前展示“返回录题”按钮，用于回到录题流程。');
lines.push('');
lines.push('## 9. 异常与边界场景');
lines.push('');
lines.push('### 9.1 未选择学段学科');
lines.push('');
lines.push('多学段学科账号未选择学段学科时，不进入识别方式选择。页面应停留在 AI 小乐对话面板或当前选择提示状态，要求用户先完成选择。');
lines.push('');
lines.push('### 9.2 未拍摄或未选择资料');
lines.push('');
lines.push('没有有效资料图片时，不允许继续进入识别内容确认或结果核对。拍摄页面需要保留拍摄、相册选择、补拍或重拍入口。');
lines.push('');
lines.push('### 9.3 无有效题目框');
lines.push('');
lines.push('选择识别内容页面没有题目框时，不应直接进入识别；用户需要手动添加识别框或更换、补充资料。');
lines.push('');
lines.push('### 9.4 识别失败和题型识别失败');
lines.push('');
lines.push('识别失败时保留题卡和可修正入口，允许用户通过调整识别框、继续识别、手动编辑或切换模式进行处理。题型识别失败时不自动改写成某个默认题型，避免把失败结果误认为已确认题型。');
lines.push('');
lines.push('### 9.5 答案或解析缺失');
lines.push('');
lines.push('题目+答案模式下，答案或解析缺失时显示未匹配或待补充状态，并提供人工关联、画框或补充入口。加入试卷前需要根据当前缺口状态触发相应确认。');
lines.push('');
lines.push('### 9.6 删除有内容对象');
lines.push('');
lines.push('删除题目或删除已有内容的复合题子题时，需要弹窗确认。删除全占位子题时可直接删除。弹窗取消只隐藏弹窗，不改变题目结构；确认后执行删除。');
lines.push('');
lines.push('### 9.7 刷新和模式切换后的内容保留');
lines.push('');
lines.push('页面刷新、顶层模式切换或单题模式切换后，应尽量保留用户已编辑的题型、题干、选项、空位、裁剪图片、答案、解析和子题结构。只有图片发生更新并切回识别模式时，才需要重新识别更新后的图片内容。');
lines.push('');
lines.push('## 10. 来源索引');
lines.push('');
lines.push('- `产品文档/Pad端-prd/01-小乐对话面板.md`');
lines.push('- `产品文档/Pad端-prd/02-选择识别方式.md`');
lines.push('- `产品文档/Pad端-prd/03-拍摄页面.md`');
lines.push('- `产品文档/Pad端-prd/04-选择识别内容.md`');
lines.push('- `产品文档/Pad端-prd/05-核对识别结果.md`');
lines.push('- `src/requirements/review-overrides.ts`');
lines.push('- `src/app/tablet-ai-entry/tablet-ai-entry-preview.tsx`');
lines.push('- `src/components/prd/RequirementMarker.tsx`');
lines.push('- `src/components/prd/RequirementFloatingCard.tsx`');
lines.push('- `src/components/prd/RequirementPanel.tsx`');
lines.push('');

fs.writeFileSync(path.join(outputDir, '06-完整需求.md'), lines.join('\n'), 'utf8');

console.log('Generated 产品文档/Pad端-prd/06-完整需求.md');
