export type {
  ActivationStep,
  AnchorStatus,
  ExcludedDecision,
  RequirementChangeType,
  RequirementDisplay,
  RequirementItem,
  RequirementObjectType,
  RequirementOperation,
  RequirementRegistry,
  RequirementSource,
  RequirementSourceType,
} from './schema';

export { aiChatPanelRegistry } from './ai-chat-panel.registry';
export { tabletAiChatRecognizeHomeworkRegistry } from './tablet-ai-chat-recognize-homework.registry';
export { tabletRecognitionModePageRegistry } from './tablet-recognition-mode-page.registry';
export { tabletCapturePageRegistry } from './tablet-capture-page.registry';
export { tabletQuestionContentSelectionPageRegistry } from './tablet-question-content-selection-page.registry';
export { importDocumentDialogRegistry } from './import-document-dialog.registry';
export { uploadFilesStepRegistry } from './upload-files-step.registry';
export { uploadQuestionDialogSelectModeRegistry } from './upload-question-dialog-select-mode.registry';
export { boxRecognitionStepRegistry } from './box-recognition-step.registry';
export { questionAnswerReviewStepRegistry } from './question-answer-review-step.registry';

import { aiChatPanelRegistry } from './ai-chat-panel.registry';
import { tabletAiChatRecognizeHomeworkRegistry } from './tablet-ai-chat-recognize-homework.registry';
import { tabletRecognitionModePageRegistry } from './tablet-recognition-mode-page.registry';
import { tabletCapturePageRegistry } from './tablet-capture-page.registry';
import { tabletQuestionContentSelectionPageRegistry } from './tablet-question-content-selection-page.registry';
import { importDocumentDialogRegistry } from './import-document-dialog.registry';
import { uploadFilesStepRegistry } from './upload-files-step.registry';
import { uploadQuestionDialogSelectModeRegistry } from './upload-question-dialog-select-mode.registry';
import { boxRecognitionStepRegistry } from './box-recognition-step.registry';
import { questionAnswerReviewStepRegistry } from './question-answer-review-step.registry';

export const requirementRegistries = [
  aiChatPanelRegistry,
  tabletAiChatRecognizeHomeworkRegistry,
  tabletRecognitionModePageRegistry,
  tabletCapturePageRegistry,
  tabletQuestionContentSelectionPageRegistry,
  importDocumentDialogRegistry,
  uploadFilesStepRegistry,
  uploadQuestionDialogSelectModeRegistry,
  boxRecognitionStepRegistry,
  questionAnswerReviewStepRegistry,
];
