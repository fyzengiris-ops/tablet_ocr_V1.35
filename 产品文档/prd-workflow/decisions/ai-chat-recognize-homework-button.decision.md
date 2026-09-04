# 平板端 AI 小乐“帮我识别作业资料”按钮决策记录

## 页面范围

- 页面/流程：平板端 AI 小乐对话面板 - “帮我识别作业资料”按钮
- 路由：`/tablet-ai-entry`
- 相关代码文件：
  - `src/app/tablet-ai-entry/tablet-ai-entry-preview.tsx`
- PC 对照文件：
  - `D:\工作文档\A工作文档\14作业系统\projects-new-recognition-flow\src\components\AIChatPanel.tsx`
  - `D:\工作文档\A工作文档\14作业系统\projects-new-recognition-flow\src\app\homework\page.tsx`
  - `D:\工作文档\A工作文档\14作业系统\projects-new-recognition-flow\src\requirements\ai-chat-panel.registry.ts`
- 来源对象清单：`产品文档/prd-workflow/inventories/ai-chat-recognize-homework-button.inventory.md`

## 已确认决策

1. 按钮：“帮我识别作业资料”
   - 决策：B
   - 结论：Pad 按当前交互简化：点击后不追加对话消息，直接进入学科/识别方式选择流程。
   - 影响范围：页面操作、状态流转、PC/Pad 差异说明。

2. 流程规则：按钮点击后的学科前置判断
   - 决策：A
   - 结论：保留 Pad 前置分流：单学科用户跳过学科选择，多学科用户必须先选学段学科。
   - 影响范围：页面操作、流程前置条件、学科选择规则。

3. 流程分支：多学科用户点击后的学科选择
   - 决策：A
   - 结论：多学科用户必须先选学科；选中学科后立即进入识别方式弹窗。
   - 影响范围：页面操作、步骤流转、后续识别方式选择。

4. 流程分支：单学科用户点击后的默认学科进入
   - 决策：A
   - 结论：单学科用户直接使用系统默认学科，不展示确认，点击后进入识别方式弹窗。
   - 影响范围：页面操作、默认学科规则、步骤流转。

5. 后续流程：点击后进入识别方式弹窗
   - 决策：A
   - 结论：保留 Pad 当前流程：点击按钮后按“学科确认 -> 选择识别方式 -> 上传/拍照资料 -> 识别内容选择”推进。
   - 影响范围：识别流程顺序、PC/Pad 差异说明、后续上传和识别内容选择。

## 暂不处理

- 历史对话、新对话、底部输入框、语音、深度思考、布置试卷作业、布置听力作业等其他 AI 小乐面板能力不纳入本轮审核。
- PC 端 AI 小乐点击后追加对话消息的表现不作为 Pad 本轮必须沿用项；Pad 本轮以直接进入流程为准。

## 待后续确认

- 无。
