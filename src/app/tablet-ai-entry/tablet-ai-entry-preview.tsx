'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowUp,
  Camera,
  ChevronLeft,
  ChevronDown,
  Check,
  CirclePlus,
  Clock3,
  EllipsisVertical,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Images,
  Layers as LayersIcon,
  Link2,
  MessageCircle,
  Mic2,
  Minus,
  Plus,
  RotateCw,
  Search,
  SendHorizonal,
  Trash2,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react';
import { RequirementMarker } from '@/components/prd/RequirementMarker';
import type { RequirementDisplayNumberScopeItem } from '@/components/prd/requirement-review-storage';
import { createRequirementDisplayNumberMap, createRequirementMap } from '@/components/prd/requirement-utils';
import { getValidQuestionTypes } from '@/lib/ai-recognizer';
import {
  questionAnswerReviewStepRegistry,
  tabletAiChatRecognizeHomeworkRegistry,
  tabletCapturePageRegistry,
  tabletQuestionContentSelectionPageRegistry,
  tabletRecognitionModePageRegistry,
} from '@/requirements';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1200;
const OCR_BOX_SELECT_ICON_SAFE_WIDTH = 24;
const MATERIAL_PAGE_MAX_WIDTH = 890;
const MATERIAL_PAGE_MAX_HEIGHT = 830;
const REVIEW_QUESTION_IMAGE_MAX_WIDTH = 760;

type SelectedImage = {
  id?: string;
  name: string;
  url: string;
  role?: ImageRole;
};

type RecognitionMode = 'questions_only' | 'same_image_answer' | 'separate_answer';
type ImageRole = 'question' | 'answer';
type PrototypeSubjectType = 'math' | 'english';
type PrototypeTargetStep = 'content' | 'review';
type CaptureImageOrigin = 'processed' | 'supplement';
type SubjectMode = 'single' | 'multiple';
type OcrDetectStatus = 'loading' | 'ready' | 'failed';
type CaptureCloseTarget = 'mode' | 'content' | 'upload' | null;
type ReviewDisplayMode = 'recognition' | 'image';
type SelectionOrientation = 'landscape' | 'portrait';
type AddBoxInteractionMode = 'draw' | 'tap';
type JoinPaperMode = 'by_type' | 'by_order';
type ReviewQuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'fill_blank'
  | 'judge'
  | 'cloze'
  | 'reading_comprehension'
  | 'short_answer'
  | 'translation'
  | 'listening'
  | 'material'
  | 'writing'
  | 'error_correction'
  | 'short_fill'
  | 'solution'
  | 'calculation'
  | 'proof'
  | 'application';
type QuestionTypeRecognitionStatus = 'pending' | 'recognized' | 'failed' | 'manual' | 'stale';
type CropDragAction = 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' | 'resize-n' | 'resize-s' | 'resize-w' | 'resize-e';
type TabletManualLinkField = 'content' | 'optionContent' | 'answer' | 'analysis';
type TabletManualLinkTarget = {
  questionId: string;
  field: TabletManualLinkField;
  subQuestionId?: string;
};
type ImageModeSubQuestionInsertMenu = {
  questionId: string;
  subQuestionId: string;
  placement?: 'before' | 'after';
} | null;
type PendingSubQuestionDeletion = {
  mode: ReviewDisplayMode;
  questionId: string;
  subQuestionId: string;
  source: 'recognition' | 'image';
} | null;
type RequirementMarkerRenderer = (
  requirementId: string,
  className: string,
  displayNumber?: number,
) => React.ReactNode;

const tabletAiChatMarkerIds = [
  'TABLET_AI_CHAT_RECOGNIZE-001',
  'TABLET_AI_CHAT_SUBJECT_PROMPT-001',
  'TABLET_AI_CHAT_INPUT_DISABLED-001',
];

const tabletRecognitionModeMarkerIds = [
  'TABLET_RECOGNITION_MODE-001',
  'TABLET_RECOGNITION_MODE-002',
  'TABLET_RECOGNITION_MODE-003',
  'TABLET_RECOGNITION_MODE-004',
];

const tabletCaptureMarkerIds = [
  'TABLET_CAPTURE-001',
  'TABLET_CAPTURE-002',
  'TABLET_CAPTURE-003',
  'TABLET_CAPTURE-004',
  'TABLET_CAPTURE-005',
  'TABLET_CAPTURE-006',
  'TABLET_CAPTURE-007',
  'TABLET_CAPTURE-008',
  'TABLET_CAPTURE-009',
];

const tabletQuestionContentSelectionMarkerIds = [
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
];

const tabletReviewImageMarkerIds = [
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
];

const tabletReviewRecognitionMarkerIds = [
  'TABLET_REVIEW_RECOGNITION-002',
  'TABLET_REVIEW_RECOGNITION-003',
  'TABLET_REVIEW_RECOGNITION-004',
  'TABLET_REVIEW_RECOGNITION-005',
  'TABLET_REVIEW_RECOGNITION-006',
];

const tabletReviewQaImageMarkerIds = [
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
];

const tabletReviewQaRecognitionMarkerIds = [
  'TABLET_REVIEW_QA_RECOGNITION-001',
];

type MaterialPage = SelectedImage & {
  pageNumber: number;
  naturalWidth: number;
  naturalHeight: number;
  imageData: string;
};

type RecognitionBox = {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  selected: boolean;
  source: 'system' | 'manual';
};

type TabletConfirmAction = 'back' | 'replace' | 'clear' | null;
type CropRegion = { x: number; y: number; width: number; height: number };
type DrawingBoxDraft = {
  pageNumber: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  clientX: number;
  clientY: number;
  intent: 'manual' | 'precision';
};
type OptionsContentRecognitionResult = {
  hasOptions: boolean;
  options: Array<{ label: string; content: string }>;
  plainContent: string;
};
type AnswerOnlyRecognitionResult = {
  answer: string;
  analysis: string;
};

type ReviewQuestion = {
  id: string;
  pageNumber: number;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  questionType: ReviewQuestionType;
  questionTypeStatus: QuestionTypeRecognitionStatus;
  answer?: string;
  analysis?: string;
  blankAnswers: string[];
  content?: string;
  optionContents?: Record<string, string>;
  optionCount: number;
  blankCount: number;
  subQuestions: Array<{
    id: string;
    questionType: ReviewQuestionType;
    answer?: string;
    analysis?: string;
    blankAnswers: string[];
    content?: string;
    optionContents?: Record<string, string>;
    optionAnalyses?: Record<string, string>;
    optionCount: number;
    blankCount: number;
  }>;
  viewMode: ReviewDisplayMode;
  croppedImageData?: string;
  croppedImageHeight?: number;
  croppedImageWidth?: number;
  userCroppedImageData?: string;
};

type ReviewAiMatchedQuestion = {
  questionBoxId?: string;
  questionType?: string;
  questionContent?: string;
  content?: string;
  optionContents?: Record<string, string>;
  optionCount?: number;
  blankCount?: number;
  answer?: string | null;
  analysis?: string | null;
  blankAnswers?: string[];
  subQuestions?: Array<{
    questionType?: string;
    answer?: string | null;
    analysis?: string | null;
    blankAnswers?: string[];
    content?: string;
    optionContents?: Record<string, string>;
    optionAnalyses?: Record<string, string>;
    optionCount?: number;
    blankCount?: number;
  }>;
};

type TabletPrototypeFixture = {
  id: string;
  subject: string;
  mode: RecognitionMode;
  targetStep: PrototypeTargetStep;
  images: SelectedImage[];
  pages: MaterialPage[];
  boxes: RecognitionBox[];
  reviewQuestions: ReviewQuestion[];
  autoStartReview: boolean;
};

const SINGLE_SUBJECT = '高中数学';

const englishReviewQuestionTypeOptions: Array<{ value: ReviewQuestionType; label: string }> = [
  { value: 'single_choice', label: '单选题' },
  { value: 'multiple_choice', label: '多选题' },
  { value: 'fill_blank', label: '填空题' },
  { value: 'judge', label: '判断题' },
  { value: 'cloze', label: '完型填空' },
  { value: 'reading_comprehension', label: '阅读理解' },
  { value: 'short_answer', label: '问答题' },
  { value: 'translation', label: '翻译题' },
  { value: 'listening', label: '听力题' },
  { value: 'material', label: '材料题' },
  { value: 'writing', label: '书面表达' },
  { value: 'error_correction', label: '短文改错' },
  { value: 'short_fill', label: '短文填空' },
];

const generalReviewQuestionTypeOptions: Array<{ value: ReviewQuestionType; label: string }> = [
  { value: 'single_choice', label: '单选题' },
  { value: 'multiple_choice', label: '多选题' },
  { value: 'fill_blank', label: '填空题' },
  { value: 'judge', label: '判断题' },
  { value: 'short_answer', label: '问答题' },
  { value: 'material', label: '材料题' },
  { value: 'solution', label: '解答题' },
  { value: 'calculation', label: '计算题' },
  { value: 'proof', label: '证明题' },
  { value: 'application', label: '应用题' },
];

const allReviewQuestionTypeOptions = [...englishReviewQuestionTypeOptions, ...generalReviewQuestionTypeOptions].filter(
  (option, index, options) => options.findIndex((currentOption) => currentOption.value === option.value) === index,
);

function isEnglishSubjectName(subject: string) {
  return subject.includes('英语');
}

function getReviewQuestionTypeOptions(subject: string) {
  return isEnglishSubjectName(subject) ? englishReviewQuestionTypeOptions : generalReviewQuestionTypeOptions;
}

function mapRecognizedQuestionType(questionType: string | undefined): ReviewQuestionType {
  const normalizedType = questionType || '';
  if (normalizedType.includes('阅读理解')) return 'reading_comprehension';
  if (normalizedType.includes('完形填空') || normalizedType.includes('完型填空')) return 'cloze';
  if (normalizedType.includes('翻译')) return 'translation';
  if (normalizedType.includes('听力')) return 'listening';
  if (normalizedType.includes('书面表达') || normalizedType.includes('作文') || normalizedType.includes('写作')) return 'writing';
  if (normalizedType.includes('短文改错')) return 'error_correction';
  if (normalizedType.includes('短文填空')) return 'short_fill';
  if (normalizedType.includes('解答')) return 'solution';
  if (normalizedType.includes('计算')) return 'calculation';
  if (normalizedType.includes('证明')) return 'proof';
  if (normalizedType.includes('应用')) return 'application';
  if (normalizedType.includes('单选')) return 'single_choice';
  if (normalizedType.includes('多选')) return 'multiple_choice';
  if (normalizedType.includes('填空') || normalizedType.includes('空')) return 'fill_blank';
  if (
    normalizedType.includes('材料') ||
    normalizedType.includes('综合') ||
    normalizedType.includes('任务型阅读')
  ) return 'material';
  if (normalizedType.includes('判断')) return 'judge';
  return 'short_answer';
}

function getDefaultOptionCount(questionType: ReviewQuestionType, optionCount?: number) {
  if (
    questionType === 'multiple_choice' ||
    questionType === 'single_choice' ||
    questionType === 'reading_comprehension' ||
    questionType === 'cloze'
  ) return optionCount || 4;
  return 4;
}

function getDefaultBlankCount(questionType: ReviewQuestionType, blankCount?: number) {
  if (questionType === 'fill_blank') return blankCount || 1;
  return 1;
}

const OPTION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CIRCLED_NUMBER_MAP = new Map('①②③④⑤⑥⑦⑧⑨⑩⑪⑫'.split('').map((char, index) => [char, index + 1]));

function isChoiceLikeQuestionType(questionType: ReviewQuestionType) {
  return questionType === 'single_choice' || questionType === 'multiple_choice' || questionType === 'judge';
}

function isCompoundReviewQuestionType(questionType: ReviewQuestionType, subject = '') {
  const englishCompoundTypes: ReviewQuestionType[] = [
    'material',
    'reading_comprehension',
    'translation',
    'listening',
    'error_correction',
    'short_fill',
  ];
  const generalCompoundTypes: ReviewQuestionType[] = [
    'solution',
    'calculation',
    'proof',
    'application',
    'material',
  ];
  if (!subject) {
    return [...englishCompoundTypes, ...generalCompoundTypes, 'cloze'].includes(questionType);
  }
  return isEnglishSubjectName(subject)
    ? englishCompoundTypes.includes(questionType)
    : generalCompoundTypes.includes(questionType);
}

function canAddReviewSubQuestions(questionType: ReviewQuestionType, subject = '') {
  return isCompoundReviewQuestionType(questionType, subject) || questionType === 'cloze';
}

function shouldShowReviewSubQuestionAction(questionType: ReviewQuestionType) {
  return !['short_answer', 'single_choice', 'fill_blank', 'multiple_choice', 'judge'].includes(questionType);
}

function getDefaultCompoundReviewQuestionType(subject = ''): ReviewQuestionType {
  return isEnglishSubjectName(subject) ? 'reading_comprehension' : 'solution';
}

function inferReviewSubQuestionTypeFromContent(content: string): ReviewQuestionType {
  if (splitChoiceContent(content)) return 'single_choice';
  if (/_{2,}|____|\(\s*\)|（\s*）|填空/.test(content)) return 'fill_blank';
  if (/判断|对错|正确|错误|√|×/.test(content)) return 'judge';
  return 'short_answer';
}

type InlineBlankToken = { start: number; end: number };

function getInlineBlankTokens(content: string | undefined) {
  const normalized = (content || '').replace(/\r\n/g, '\n');
  const blankPattern = /_{2,}|（\s*）|\(\s*\)/g;
  const tokens: InlineBlankToken[] = [];
  let match: RegExpExecArray | null;

  while ((match = blankPattern.exec(normalized)) !== null) {
    tokens.push({ start: match.index, end: match.index + match[0].length });
  }

  return tokens;
}

function countInlineBlanks(content: string | undefined) {
  const matches = getInlineBlankTokens(content);
  return Math.max(1, matches.length || 1);
}

function getDefaultOptionContent(questionType: ReviewQuestionType, letter: string) {
  if (questionType === 'judge') {
    return letter === 'A' ? '对' : letter === 'B' ? '错' : '';
  }
  return '';
}

function getNormalizedOptionCount(questionType: ReviewQuestionType, count: number) {
  return questionType === 'judge' ? 2 : Math.max(2, Math.min(26, count || 4));
}

function buildOptionContents(
  questionType: ReviewQuestionType,
  count: number,
  current: Record<string, string> = {},
) {
  const optionCount = getNormalizedOptionCount(questionType, count);
  return OPTION_LETTERS.slice(0, optionCount).split('').reduce<Record<string, string>>((contents, letter) => {
    contents[letter] = current[letter] ?? getDefaultOptionContent(questionType, letter);
    return contents;
  }, {});
}

function createBlankAnswers(count: number, current: string[] = []) {
  return Array.from({ length: Math.max(1, count || 1) }, (_, index) => current[index] || '');
}

function syncBlankAnswersByInsertedToken(
  previousContent: string | undefined,
  nextContent: string,
  current: string[] = [],
  insertStart: number,
) {
  const previousTokens = getInlineBlankTokens(previousContent);
  const nextTokens = getInlineBlankTokens(nextContent);
  const nextCount = Math.max(1, nextTokens.length || 1);

  if (nextTokens.length <= previousTokens.length) {
    return createBlankAnswers(nextCount, current);
  }

  const insertedIndex = nextTokens.findIndex((token) => token.start >= insertStart);
  const nextAnswers = [...current];
  nextAnswers.splice(insertedIndex >= 0 ? insertedIndex : nextTokens.length - 1, 0, '');
  return createBlankAnswers(nextCount, nextAnswers);
}

function getPointerPercent(rect: DOMRect, clientX: number, clientY: number) {
  return {
    x: clampPercent(((clientX - rect.left) / rect.width) * 100, 0, 100),
    y: clampPercent(((clientY - rect.top) / rect.height) * 100, 0, 100),
  };
}

function getBoxFromDrawingDraft(draft: DrawingBoxDraft) {
  const x = Math.min(draft.startX, draft.currentX);
  const y = Math.min(draft.startY, draft.currentY);
  const width = Math.abs(draft.currentX - draft.startX);
  const height = Math.abs(draft.currentY - draft.startY);
  return {
    height: clampPercent(height, 0, 100 - y),
    width: clampPercent(width, 0, 100 - x),
    x: clampPercent(x, 0, 100),
    y: clampPercent(y, 0, 100),
  };
}

function formatRecognizedReviewContent(text: string | undefined) {
  return (text || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function isUsableText(value: string | undefined) {
  return Boolean(value?.trim());
}

function hasQuestionAnswer(question: Pick<ReviewQuestion, 'answer' | 'blankAnswers'> | ReviewQuestion['subQuestions'][number]) {
  return isUsableText(question.answer) || question.blankAnswers?.some(isUsableText);
}

function normalizeChoiceAnswer(questionType: ReviewQuestionType, value: string) {
  const normalized = value.trim();
  if (!normalized) return '';
  if (questionType === 'judge') {
    if (/^(错|错误|否|×|✕|✗|B)$/i.test(normalized)) return 'B';
    if (/^(对|正确|是|√|✓|A)$/i.test(normalized)) return 'A';
  }
  const match = normalized.toUpperCase().match(/[A-Z]/);
  return isChoiceLikeQuestionType(questionType) && match ? match[0] : normalized;
}

function splitAnswerToBlanks(value: string, count: number) {
  const parts = value
    .split(/\s*(?:[；;、,，]|\n)\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length > 1) return createBlankAnswers(Math.max(count, parts.length), parts);
  return createBlankAnswers(count, [value.trim()]);
}

function splitChoiceContent(content: string | undefined) {
  const normalized = formatRecognizedReviewContent(content);
  if (!normalized) return null;

  const optionMarker = /(?:^|[\s\n])([A-H])\s*[.．、:：)）]\s*/g;
  const matches: Array<{ letter: string; markerStart: number; contentStart: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = optionMarker.exec(normalized)) !== null) {
    matches.push({
      letter: match[1].toUpperCase(),
      markerStart: match.index + (match[0].length - match[0].trimStart().length),
      contentStart: match.index + match[0].length,
    });
  }

  if (matches.length < 2) return null;

  const expectedLetters = OPTION_LETTERS.slice(0, matches.length).split('');
  if (!matches.every((item, index) => item.letter === expectedLetters[index])) return null;

  const optionContents: Record<string, string> = {};
  matches.forEach((item, index) => {
    const nextStart = matches[index + 1]?.markerStart ?? normalized.length;
    optionContents[item.letter] = normalized.slice(item.contentStart, nextStart).trim();
  });

  return {
    stem: normalized.slice(0, matches[0].markerStart).trim(),
    optionContents,
    optionCount: matches.length,
  };
}

function splitNumberedSubQuestionSegments(content: string | undefined) {
  const normalized = formatRecognizedReviewContent(content);
  if (!normalized) return null;

  const markerPattern = /(?:^|[\n\s])(?:[（(]\s*(\d{1,2})\s*[）)]|([①②③④⑤⑥⑦⑧⑨⑩⑪⑫])|(\d{1,2})\s*[.．、)）])\s*/g;
  const markers: Array<{ start: number; contentStart: number; number: number }> = [];
  let markerMatch: RegExpExecArray | null;

  while ((markerMatch = markerPattern.exec(normalized)) !== null) {
    const number = Number(markerMatch[1] || markerMatch[3] || CIRCLED_NUMBER_MAP.get(markerMatch[2] || '') || 0);
    if (!Number.isFinite(number) || number <= 0 || number > 30) continue;
    const start = markerMatch.index + (markerMatch[0].length - markerMatch[0].trimStart().length);
    markers.push({ start, contentStart: markerMatch.index + markerMatch[0].length, number });
  }

  const firstSubQuestionIndex = markers.findIndex((marker) => marker.number === 1);
  const subQuestionMarkers = firstSubQuestionIndex >= 0 ? markers.slice(firstSubQuestionIndex) : markers;

  if (subQuestionMarkers.length < 2) return null;
  const increasing = subQuestionMarkers.every((marker, index) => (
    index === 0 || marker.number === subQuestionMarkers[index - 1].number + 1
  ));
  if (!increasing) return null;

  return {
    parentContent: normalized.slice(0, subQuestionMarkers[0].start).trim(),
    segments: subQuestionMarkers.map((marker, index) => {
      const nextStart = subQuestionMarkers[index + 1]?.start ?? normalized.length;
      return normalized.slice(marker.contentStart, nextStart).trim();
    }),
  };
}

function splitAnswerSegmentsForSubQuestions(content: string | undefined, count: number) {
  const normalized = formatRecognizedReviewContent(content);
  if (count === 1 && normalized) {
    return [normalized.replace(/^(?:[（(]\s*1\s*[）)]|1\s*[.．、)）]|①)\s*/, '').trim()];
  }
  const split = splitNumberedSubQuestionSegments(content);
  if (!split || split.segments.length === 0) return null;
  const segments = createBlankAnswers(count, split.segments);
  return segments.some((segment) => segment.trim()) ? segments : null;
}

function applyAnswerValue<T extends {
  answer?: string;
  blankAnswers: string[];
  blankCount: number;
  optionContents?: Record<string, string>;
  questionType: ReviewQuestionType;
}>(entity: T, value: string): T {
  const normalized = value.trim();
  if (entity.questionType === 'fill_blank') {
    return {
      ...entity,
      answer: normalized,
      blankAnswers: normalized ? splitAnswerToBlanks(normalized, entity.blankCount) : createBlankAnswers(entity.blankCount),
    };
  }
  if (isChoiceLikeQuestionType(entity.questionType)) {
    return {
      ...entity,
      answer: normalized ? normalizeChoiceAnswer(entity.questionType, normalized) : '',
    };
  }
  return { ...entity, answer: normalized };
}

function mergeAnswerToReviewQuestion(question: ReviewQuestion, answer: string, analysis: string): ReviewQuestion {
  const answerText = answer.trim();
  const analysisText = analysis.trim();
  if (question.subQuestions.length > 0) {
    const answerSegments = splitAnswerSegmentsForSubQuestions(answerText, question.subQuestions.length);
    const analysisSegments = splitAnswerSegmentsForSubQuestions(analysisText, question.subQuestions.length);
    if (answerSegments || analysisSegments) {
      return {
        ...question,
        subQuestions: question.subQuestions.map((subQuestion, index) => {
          let nextSubQuestion = subQuestion;
          const subAnswer = answerSegments?.[index]?.trim() || '';
          const subAnalysis = analysisSegments?.[index]?.trim() || '';
          if (subAnswer) nextSubQuestion = applyAnswerValue(nextSubQuestion, subAnswer);
          if (subAnalysis) nextSubQuestion = { ...nextSubQuestion, analysis: subAnalysis };
          return nextSubQuestion;
        }),
        answer: answerSegments ? question.answer : (answerText || question.answer),
        analysis: analysisSegments ? question.analysis : (analysisText || question.analysis),
      };
    }
  }

  let nextQuestion = question;
  if (answerText) nextQuestion = applyAnswerValue(nextQuestion, answerText);
  if (analysisText) nextQuestion = { ...nextQuestion, analysis: analysisText };
  return nextQuestion;
}

function createReviewSubQuestion(
  parentId: string,
  index: number,
  questionType: ReviewQuestionType,
  source?: {
    answer?: string | null;
    analysis?: string | null;
    blankAnswers?: string[];
    content?: string;
    optionContents?: Record<string, string>;
    optionAnalyses?: Record<string, string>;
    optionCount?: number | null;
    blankCount?: number | null;
  },
) {
  const choiceStructure = splitChoiceContent(source?.content);
  const optionCount = getDefaultOptionCount(questionType, source?.optionCount ?? choiceStructure?.optionCount);

  return {
    id: `${parentId}-ai-sub-${index + 1}-${Date.now()}`,
    answer: typeof source?.answer === 'string' ? source.answer : '',
    analysis: typeof source?.analysis === 'string' ? source.analysis : '',
    blankCount: getDefaultBlankCount(questionType, source?.blankCount ?? undefined),
    blankAnswers: createBlankAnswers(getDefaultBlankCount(questionType, source?.blankCount ?? undefined), source?.blankAnswers),
    content: isChoiceLikeQuestionType(questionType) ? (choiceStructure?.stem || formatRecognizedReviewContent(source?.content)) : formatRecognizedReviewContent(source?.content),
    optionContents: isChoiceLikeQuestionType(questionType)
      ? buildOptionContents(questionType, optionCount, source?.optionContents || choiceStructure?.optionContents || {})
      : undefined,
    optionAnalyses: source?.optionAnalyses || {},
    optionCount,
    questionType,
  };
}

function buildSubQuestionsFromContent(parentId: string, parentType: ReviewQuestionType, content: string | undefined, fallbackCount = 1) {
  const split = splitNumberedSubQuestionSegments(content);

  if (split) {
    return split.segments.map((segment, index) => {
      const subType = parentType === 'reading_comprehension' || parentType === 'cloze'
        ? 'single_choice'
        : inferReviewSubQuestionTypeFromContent(segment);
      return createReviewSubQuestion(parentId, index, subType, { content: segment });
    });
  }

  if (parentType === 'cloze') {
    return Array.from({ length: Math.max(1, fallbackCount) }, (_, index) => (
      createReviewSubQuestion(parentId, index, 'single_choice', { optionCount: 4 })
    ));
  }

  return [];
}

const assignments = [
  {
    date: '2026-06-10作业',
    name: '乡土中国：《无为政治》《长老统治》配套练...',
    tags: ['课前'],
  },
  {
    date: '2026-06-03作业',
    name: '高一数学第一章 集合练习',
    tags: ['课中', '学生自批'],
  },
  {
    date: '2026-05-08作业',
    name: '2026年4月20日19时组卷',
    tags: ['课中', '学生自批'],
  },
  {
    date: '2026-05-02作业',
    name: '阶段同步练习',
    tags: ['课后'],
  },
];

const subjects = [
  '小学语文',
  '小学数学',
  '小学英语',
  '初中语文',
  '初中英语',
  '高中语文',
  '高中数学',
  '高中英语',
  '高中物理',
  '高中化学',
  '高中生物',
  '高中政治',
  '高中历史',
  '高中地理',
];

function useCanvasScale(containerRef: RefObject<HTMLElement | null>) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const container = containerRef.current;
      const availableWidth = container?.clientWidth ?? window.innerWidth;
      const availableHeight = container?.clientHeight ?? window.innerHeight;
      const nextScale = Math.min(
        availableWidth / CANVAS_WIDTH,
        availableHeight / CANVAS_HEIGHT,
        1,
      );
      setScale(nextScale);
    };

    updateScale();
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' && containerRef.current
        ? new ResizeObserver(updateScale)
        : null;

    if (containerRef.current && resizeObserver) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateScale);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [containerRef]);

  return scale;
}

function TrialFileIcon() {
  return (
    <div className="relative h-[96px] w-[82px]">
      <FileText className="absolute left-0 top-0 h-[96px] w-[82px] stroke-[1.4] text-slate-200" />
      <div className="absolute bottom-[14px] left-[29px] rounded-[5px] bg-[#10b981] px-[9px] py-[5px] text-[18px] font-semibold leading-none text-white">
        试卷
      </div>
    </div>
  );
}

function AssignmentBlock({
  date,
  name,
  tags,
  top,
}: {
  date: string;
  name: string;
  tags: string[];
  top: number;
}) {
  return (
    <section
      className="absolute left-[31px] h-[294px] w-[935px] rounded-[2px] bg-white"
      style={{ top }}
    >
      <div className="absolute left-[29px] top-[27px] rounded-full bg-[#b9b9b9] px-[22px] py-[8px] text-[22px] font-medium leading-none text-white">
        已结束
      </div>
      <h2 className="absolute left-[186px] top-[28px] text-[31px] font-bold leading-none text-[#202124]">
        {date}
      </h2>
      <div className="absolute left-[30px] top-[96px] h-[169px] w-[900px] rounded-[7px] border border-[#ececec] bg-white">
        <div className="absolute left-[42px] top-[34px]">
          <TrialFileIcon />
        </div>
        <div className="absolute left-[153px] top-[36px] flex max-w-[640px] items-center gap-[16px]">
          <p className="truncate text-[29px] leading-none text-[#505050]">{name}</p>
          {tags.map((tag) => (
            <span
              key={tag}
              className="shrink-0 rounded-full bg-[#f1f1f1] px-[22px] py-[10px] text-[21px] leading-none text-[#606060]"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="absolute left-[153px] top-[106px] flex items-center gap-[32px] text-[24px] leading-none text-[#868686]">
          <span>
            提交人数： <strong className="font-medium text-[#45c9a6]">1/71</strong>
          </span>
          <span>
            批改人数： <strong className="font-medium text-[#45c9a6]">0/1</strong>
          </span>
          <span>
            正确率： <strong className="font-medium text-[#555]">0%</strong>
          </span>
        </div>
      </div>
    </section>
  );
}

function RobotMark() {
  return (
    <div className="relative h-[62px] w-[64px]">
      <img
        alt="AI小乐"
        className="h-full w-full object-contain"
        src="/ai-mascot.jpg"
      />
    </div>
  );
}

function QuickButton({
  children,
  top,
  onClick,
  marker,
  anchorId,
}: {
  children: React.ReactNode;
  top: number;
  onClick?: () => void;
  marker?: React.ReactNode;
  anchorId?: string;
}) {
  return (
    <div
      className="absolute left-[88px]"
      data-req-anchor={anchorId}
      style={{ top }}
    >
      <button
        className="h-[60px] rounded-[8px] border border-[#dcdcdc] bg-white px-[14px] text-left text-[24px] leading-none text-[#2f2f2f] active:bg-[#f6f6f6]"
        onClick={onClick}
        type="button"
      >
        {children}
      </button>
      {marker}
    </div>
  );
}

function HomeworkPanel() {
  return (
    <div className="absolute left-0 top-0 h-[1200px] w-[966px] overflow-hidden bg-[#f4f4f4]">
      <div className="absolute left-0 top-0 h-[107px] w-[966px] bg-[#59ce91]">
        <div className="absolute left-[22px] top-[8px] flex items-center gap-[14px] text-[23px] font-semibold text-white">
          <span>4:39</span>
          <ImageIcon className="h-[20px] w-[20px] fill-white/90 stroke-white/90" />
        </div>
        <div className="absolute left-[42px] top-[56px] flex items-center gap-[26px] text-[29px] font-medium text-white/90">
          <ChevronLeft className="h-[31px] w-[31px]" />
          <span>返回</span>
          <span>关闭</span>
        </div>
        <div className="absolute right-[3px] top-[57px] text-[31px] font-medium text-white/80">
          作业
        </div>
      </div>

      <div className="absolute left-0 top-[107px] h-[109px] w-[966px] bg-white">
        <div className="absolute right-[65px] top-[29px] text-[30px] font-bold leading-none text-[#202124]">
          待批改(50)
        </div>
        <div className="absolute right-[66px] top-[79px] h-[5px] w-[58px] rounded-full bg-[#58cf9a]" />
      </div>

      {assignments.map((assignment, index) => (
        <AssignmentBlock
          key={assignment.date}
          {...assignment}
          top={216 + index * 316}
        />
      ))}

      <div className="absolute bottom-[48px] left-[792px] h-[83px] w-[232px] rounded-full bg-[#58d297] text-center text-[34px] font-medium leading-[83px] text-white">
        布置
      </div>
    </div>
  );
}

function SelectedImageCard({ image }: { image: SelectedImage }) {
  const roleLabel = image.role === 'question' ? '题目' : image.role === 'answer' ? '答案' : '图片';
  const roleClass = image.role === 'answer' ? 'bg-[#5d82f3]' : image.role === 'question' ? 'bg-[#10b981]' : 'bg-[#ff5f60]';

  return (
    <div className="flex h-[86px] w-[330px] items-center gap-[14px] rounded-[10px] border border-[#e8e8e8] bg-white px-[14px]">
      <img
        alt=""
        className="h-[58px] w-[58px] shrink-0 rounded-[6px] object-cover"
        src={image.url}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[21px] leading-none text-[#303030]">
          {image.name}
        </div>
        <div className={`mt-[10px] rounded-[4px] px-[7px] py-[4px] text-[15px] font-medium leading-none text-white w-fit ${roleClass}`}>
          {roleLabel}
        </div>
      </div>
    </div>
  );
}

function SubjectSelectionPanel({
  onSubjectSelect,
  renderRequirementMarker,
  selectedSubject,
}: {
  onSubjectSelect: (subject: string) => void;
  renderRequirementMarker: RequirementMarkerRenderer;
  selectedSubject: string;
}) {
  return (
    <>
      <div className="absolute left-[22px] top-[345px]">
        <RobotMark />
      </div>
      <div
        className="absolute left-[106px] top-[354px] h-[76px] w-[600px] rounded-[8px] bg-[#f7f8fb] px-[22px] py-[18px] text-[24px] leading-[40px] text-[#303030]"
        data-req-anchor="tablet-ai-chat.subject-prompt"
      >
        请先选择这次识别资料的学段学科
        {renderRequirementMarker('TABLET_AI_CHAT_SUBJECT_PROMPT-001', '-right-3 -top-3')}
      </div>
      <div className="absolute left-[88px] top-[468px] grid w-[780px] grid-cols-4 gap-[16px]">
        {subjects.map((subject) => (
          <button
            key={subject}
            className={`h-[58px] rounded-[8px] border text-[22px] leading-none active:bg-[#f6f6f6] ${
              selectedSubject === subject
                ? 'border-[#58cf9a] bg-[#eefaf4] text-[#20a874]'
                : 'border-[#dedede] bg-white text-[#333]'
            }`}
            onClick={() => onSubjectSelect(subject)}
            type="button"
          >
            {subject}
          </button>
        ))}
      </div>
    </>
  );
}

function AiPanel({
  onSubjectSelect,
  isSubjectPickerOpen,
  onUserModeChange,
  selectedSubject,
  userMode,
  onOpenUpload,
  renderRequirementMarker,
}: {
  onSubjectSelect: (subject: string) => void;
  isSubjectPickerOpen: boolean;
  onUserModeChange: (mode: SubjectMode) => void;
  selectedSubject: string;
  userMode: SubjectMode;
  onOpenUpload: () => void;
  renderRequirementMarker: RequirementMarkerRenderer;
}) {
  return (
    <aside className="absolute left-[966px] top-0 h-[1200px] w-[954px] rounded-l-[12px] bg-white shadow-[-12px_0_24px_rgba(0,0,0,0.13)]">
      <header className="absolute left-0 top-0 h-[142px] w-full">
        <div className="absolute left-[28px] top-[63px] text-[40px] font-black italic leading-none text-[#242424]">
          AI小乐
        </div>
        <div className="absolute right-[24px] top-[72px] flex items-center gap-[30px]">
          <CirclePlus className="h-[29px] w-[29px] text-[#63c7a2]" />
          <Clock3 className="h-[29px] w-[29px] text-[#222]" />
          <Minus className="h-[31px] w-[31px] stroke-[4] text-[#222]" />
        </div>
      </header>

      <div className="absolute left-[22px] top-[150px]">
        <RobotMark />
      </div>
      <div className="absolute left-[106px] top-[144px] h-[108px] w-[617px] rounded-[8px] bg-[#f7f8fb] px-[22px] py-[22px]">
        <div className="text-[28px] font-bold leading-none text-[#282828]">Hi！我是AI小乐！</div>
        <div className="mt-[15px] text-[23px] leading-none text-[#333]">
          我能够帮您出题、布置作业，请把您的任务交给我吧！
        </div>
      </div>

      <div
        className="absolute right-[26px] top-[266px] flex h-[46px] rounded-full bg-[#eef0f2] p-[4px]"
      >
        <button
          className={`h-[38px] rounded-full px-[18px] text-[18px] leading-none ${
            userMode === 'single' ? 'bg-white text-[#202124] shadow-sm' : 'text-[#777]'
          }`}
          onClick={() => onUserModeChange('single')}
          type="button"
        >
          单学科用户
        </button>
        <button
          className={`h-[38px] rounded-full px-[18px] text-[18px] leading-none ${
            userMode === 'multiple' ? 'bg-white text-[#202124] shadow-sm' : 'text-[#777]'
          }`}
          onClick={() => onUserModeChange('multiple')}
          type="button"
        >
          多学科用户
        </button>
      </div>

      {isSubjectPickerOpen ? (
        <SubjectSelectionPanel
          onSubjectSelect={onSubjectSelect}
          renderRequirementMarker={renderRequirementMarker}
          selectedSubject={selectedSubject}
        />
      ) : (
        <>
          <QuickButton top={334}>帮我布置试卷作业</QuickButton>
          <QuickButton
            anchorId="tablet-ai-chat.recognize-homework-button"
            marker={renderRequirementMarker('TABLET_AI_CHAT_RECOGNIZE-001', '-right-3 -top-3')}
            top={412}
            onClick={onOpenUpload}
          >
            帮我识别作业资料
          </QuickButton>
          <QuickButton top={485}>帮我布置听力作业</QuickButton>
        </>
      )}

      <div
        className="absolute bottom-[24px] left-[26px] h-[155px] w-[902px] rounded-[16px] border border-[#d3d3d3] bg-[#f4f4f4] text-[#b9b9b9] shadow-[0_0_0_1px_rgba(0,0,0,0.02)]"
        data-req-anchor="tablet-ai-chat.input-disabled"
      >
        {renderRequirementMarker('TABLET_AI_CHAT_INPUT_DISABLED-001', '-right-3 -top-3')}
        <div className="absolute left-[20px] top-[22px] flex items-center gap-[18px]">
          <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full border-[2px] border-[#222] bg-white opacity-45">
            <Mic2 className="h-[24px] w-[24px] text-[#222]" />
          </div>
          <span className="text-[26px] leading-none text-[#b8b8b8]">向我提问或提出要求</span>
        </div>
        <div className="absolute left-[24px] bottom-[18px] flex h-[44px] items-center rounded-[5px] border border-[#dfdfdf] bg-[#eeeeee] px-[10px] text-[22px] leading-none text-[#6f6f6f] opacity-70">
          <MessageCircle className="mr-[5px] h-[24px] w-[24px]" />
          深度思考（R1）
        </div>
        <button
          className="absolute bottom-[21px] right-[82px] flex h-[42px] w-[42px] items-center justify-center rounded-full border-[3px] border-[#777] bg-[#f1f1f1] text-[#777]"
          disabled
          type="button"
        >
          <Plus className="h-[28px] w-[28px]" />
        </button>
        <button
          className="absolute bottom-[19px] right-[19px] flex h-[45px] w-[45px] items-center justify-center rounded-[8px] bg-[#c9c9c9] text-white"
          disabled
          type="button"
        >
          <SendHorizonal className="h-[28px] w-[28px] fill-white stroke-white" />
        </button>
      </div>
    </aside>
  );
}

const recognitionModes: {
  id: RecognitionMode;
  title: string;
  badge?: string;
  description: string;
}[] = [
  {
    id: 'questions_only',
    title: '仅识别题目',
    description: '适用于只包含题目、不包含答案解析的资料',
  },
  {
    id: 'same_image_answer',
    title: '题目+答案',
    badge: '一题一答',
    description: '适用于题目与答案解析紧挨着出现的资料',
  },
  {
    id: 'separate_answer',
    title: '题目+答案',
    badge: '题答分页',
    description: '适用于题目与答案解析分开拍摄的资料',
  },
];

function DiagramLine({
  tone = 'question',
  width = 'w-full',
}: {
  tone?: 'question' | 'answer' | 'muted';
  width?: string;
}) {
  const color =
    tone === 'question'
      ? 'bg-[#a9ead8]'
      : tone === 'answer'
        ? 'bg-[#adc5ff]'
        : 'bg-[#d9dde3]';

  return <div className={`h-[10px] rounded-full ${color} ${width}`} />;
}

function DiagramTag({
  children,
  tone = 'question',
}: {
  children: React.ReactNode;
  tone?: 'question' | 'answer';
}) {
  const toneClass =
    tone === 'question'
      ? 'bg-[#4fc6b1] text-white'
      : 'bg-[#6f94f7] text-white';

  return (
    <div className={`inline-flex h-[30px] items-center rounded-[3px] px-[9px] text-[14px] font-medium leading-none ${toneClass}`}>
      {children}
    </div>
  );
}

function SourcePageFrame({
  title = '《试卷题目文件》',
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative h-full rounded-[10px] border border-[#d7dde3] bg-white shadow-[0_2px_8px_rgba(31,44,58,0.08)] ${className}`}>
      <div className="absolute left-0 top-0 flex h-[50px] w-full items-center justify-center text-[18px] leading-none text-[#4b5563]">
        {title}
      </div>
      <div className="absolute left-[20px] right-[20px] top-[60px] bottom-[18px]">
        {children}
      </div>
    </div>
  );
}

function QuestionBlock({ label, top }: { label: string; top: number }) {
  return (
    <div
      className="absolute left-[18px] right-[18px] h-[58px] rounded-[6px] border border-[#68d3c2] bg-[#e8faf5]"
      style={{ top }}
    >
      <div className="absolute -top-[30px] left-0">
        <DiagramTag>{label}</DiagramTag>
      </div>
      <div className="absolute left-[16px] right-[14px] top-[15px] space-y-[9px]">
        <DiagramLine />
        <DiagramLine width="w-[68%]" />
      </div>
    </div>
  );
}

function AdjacentAnswerBlock({ label, top }: { label: string; top: number }) {
  return (
    <div
      className="absolute left-[18px] right-[18px] h-[66px] rounded-[6px] border border-[#68d3c2] bg-[#e8faf5]"
      style={{ top }}
    >
      <div className="absolute -top-[30px] left-0">
        <DiagramTag>{label}</DiagramTag>
      </div>
      <div className="absolute left-[18px] right-[18px] top-[17px] space-y-[9px]">
        <DiagramLine />
        <DiagramLine width="w-[66%]" />
      </div>
      <div className="absolute left-[18px] top-[78px] space-y-[10px]">
        <DiagramLine tone="answer" width="w-[224px]" />
        <DiagramLine tone="answer" width="w-[172px]" />
      </div>
    </div>
  );
}

function CompactQuestionBlock({
  label,
  top,
  tone = 'question',
}: {
  label: string;
  top: number;
  tone?: 'question' | 'answer';
}) {
  const blockClass =
    tone === 'question'
      ? 'border-[#68d3c2] bg-[#e8faf5]'
      : 'border-[#aec3ff] bg-[#eef3ff]';

  return (
    <div
      className={`absolute left-[12px] right-[12px] h-[52px] rounded-[6px] border ${blockClass}`}
      style={{ top }}
    >
      <div className="absolute -top-[26px] left-0">
        <DiagramTag tone={tone}>
          {label}
        </DiagramTag>
      </div>
      <div className="absolute left-[10px] right-[8px] top-[13px] space-y-[8px]">
        <DiagramLine tone={tone} />
        <DiagramLine tone={tone} width="w-[62%]" />
      </div>
    </div>
  );
}

function CompactFileFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-full rounded-[10px] border border-[#d7dde3] bg-white shadow-[0_2px_8px_rgba(31,44,58,0.08)]">
      <div className="absolute left-0 top-[18px] w-full text-center text-[15px] leading-none text-[#4b5563]">
        {title}
      </div>
      {children}
    </div>
  );
}

function QuestionOnlyDiagram() {
  return (
    <div className="h-full">
      <SourcePageFrame>
        <QuestionBlock label="题1" top={14} />
        <QuestionBlock label="题2" top={106} />
        <QuestionBlock label="题3" top={198} />
      </SourcePageFrame>
    </div>
  );
}

function SameFileDiagram() {
  return (
    <div className="h-full">
      <SourcePageFrame>
        <AdjacentAnswerBlock label="题1+答案/解析" top={14} />
        <AdjacentAnswerBlock label="题2+答案/解析" top={162} />
      </SourcePageFrame>
    </div>
  );
}

function SeparateFileDiagram() {
  return (
    <div className="grid h-full grid-cols-2 gap-[18px]">
      <CompactFileFrame title="《试卷题目文件》">
        {[1, 2, 3].map((index, itemIndex) => (
          <CompactQuestionBlock key={index} label={`题${index}`} top={72 + itemIndex * 86} />
        ))}
      </CompactFileFrame>
      <CompactFileFrame title="《试卷答案文件》">
        {[1, 2, 3].map((index, itemIndex) => (
          <CompactQuestionBlock
            key={index}
            label={`题${index}答案解析`}
            tone="answer"
            top={72 + itemIndex * 86}
          />
        ))}
      </CompactFileFrame>
    </div>
  );
}

function ModeDiagram({ mode }: { mode: RecognitionMode }) {
  if (mode === 'questions_only') {
    return <QuestionOnlyDiagram />;
  }

  if (mode === 'same_image_answer') {
    return <SameFileDiagram />;
  }

  return <SeparateFileDiagram />;
}

function RecognitionModeDialog({
  onClose,
  onModeSelect,
  onPrototypeStart,
  renderRequirementMarker,
}: {
  onClose: () => void;
  onModeSelect: (mode: RecognitionMode) => void;
  onPrototypeStart: (subjectType: PrototypeSubjectType, mode: RecognitionMode, targetStep: PrototypeTargetStep) => void;
  renderRequirementMarker: RequirementMarkerRenderer;
}) {
  const [prototypeMode, setPrototypeMode] = useState<RecognitionMode>('questions_only');
  const [prototypeSubjectType, setPrototypeSubjectType] = useState<PrototypeSubjectType>('math');
  const [prototypeTargetStep, setPrototypeTargetStep] = useState<PrototypeTargetStep>('review');

  return (
    <div className="absolute inset-0 z-20 bg-[#f0f4f7]">
      <header className="absolute left-0 top-0 h-[96px] w-full border-b border-[#e8e8e8] bg-white">
        <button
          data-req-anchor="tablet-recognition-mode.header-back"
          aria-label="返回"
          className="absolute left-[34px] top-[26px] flex h-[48px] items-center gap-[8px] rounded-[8px] pr-[16px] text-[#202124] active:bg-[#f4f4f4]"
          onClick={onClose}
          type="button"
        >
          {renderRequirementMarker('TABLET_RECOGNITION_MODE-001', 'right-[-18px] top-[-10px]')}
          <ChevronLeft className="h-[34px] w-[34px] stroke-[2.3]" />
          <span className="text-[30px] font-normal leading-none">选择识别方式</span>
          <span className="text-[21px] font-normal leading-none text-[#7b838c]">
            （根据资料内容选择识别方式）
          </span>
        </button>
      </header>

      <main className="absolute left-0 top-[96px] h-[1002px] w-full">
        <div className="absolute left-[44px] top-[86px] grid w-[1832px] grid-cols-3 gap-[24px]">
          {recognitionModes.map((mode) => {
            const iconColor =
              mode.id === 'questions_only'
                ? 'bg-blue-50 text-blue-600'
                : mode.id === 'same_image_answer'
                  ? 'bg-purple-50 text-purple-600'
                  : 'bg-amber-50 text-amber-600';
            const badgeColor =
              mode.id === 'same_image_answer'
                ? 'bg-[#eaf5ff] text-[#2698ff]'
                : mode.id === 'separate_answer'
                  ? 'bg-[#fff5dc] text-[#f59f22]'
                  : 'bg-blue-50 text-blue-600';
            const Icon =
              mode.id === 'questions_only'
                ? FileText
                : mode.id === 'same_image_answer'
                  ? Images
                : LayersIcon;
            const requirementId =
              mode.id === 'questions_only'
                ? 'TABLET_RECOGNITION_MODE-002'
                : mode.id === 'same_image_answer'
                  ? 'TABLET_RECOGNITION_MODE-003'
                  : 'TABLET_RECOGNITION_MODE-004';
            const anchorId =
              mode.id === 'questions_only'
                ? 'tablet-recognition-mode.questions-only-card'
                : mode.id === 'same_image_answer'
                  ? 'tablet-recognition-mode.same-image-answer-card'
                  : 'tablet-recognition-mode.separate-answer-card';

            return (
              <button
                key={mode.id}
                data-req-anchor={anchorId}
                className="group relative flex h-[600px] cursor-pointer flex-col rounded-[16px] border-2 border-white bg-white px-[34px] pb-[32px] pt-[36px] text-left shadow-[0_12px_34px_rgba(31,44,58,0.10)] transition-all active:scale-[0.995] active:border-[#58cf9a] active:bg-[#f3fbf7]"
                onClick={() => onModeSelect(mode.id)}
                type="button"
              >
                {renderRequirementMarker(requirementId, 'right-[18px] top-[18px]')}
                <div className="mb-[30px] flex items-start gap-[18px]">
                  <div className={`flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[14px] ${iconColor}`}>
                    <Icon className="h-[28px] w-[28px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-[12px]">
                      <span className="text-[30px] font-bold leading-none text-[#222831]">
                        {mode.title}
                      </span>
                      {mode.badge ? (
                        <span className={`rounded-full px-[12px] py-[6px] text-[18px] font-medium leading-none ${badgeColor}`}>
                          {mode.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-[22px] text-[22px] leading-none text-[#7b818a]">
                      {mode.description}
                    </p>
                  </div>
                </div>

                <div className="min-h-0 flex-1 rounded-[8px] border border-[#edf0f2] bg-[#fbfcfd] p-[18px]">
                  <ModeDiagram mode={mode.id} />
                </div>
              </button>
            );
          })}
        </div>

        <section
          className="absolute left-[66px] right-[66px] rounded-[10px] border border-[#dfe6ec] bg-white/42 px-[30px] py-[24px] shadow-[0_6px_18px_rgba(31,44,58,0.04)]"
          style={{ top: 860 }}
        >
          <div className="flex items-center justify-between gap-[36px]">
            <div className="min-w-0">
              <div className="text-[20px] font-medium leading-none text-[#59636d]">原型快捷查看</div>
              <div className="mt-[10px] text-[17px] leading-none text-[#9aa3ab]">
                使用内置示例资料快速进入后续页面，仅用于原型演示
              </div>
            </div>
            <div className="flex shrink-0 items-end gap-[22px]">
              <label className="grid gap-[8px] text-[16px] leading-none text-[#7c8791]">
                识别方式
                <select
                  className="h-[42px] w-[248px] rounded-[6px] border border-[#d6dee5] bg-white px-[12px] text-[18px] text-[#37414b]"
                  onChange={(event) => setPrototypeMode(event.target.value as RecognitionMode)}
                  value={prototypeMode}
                >
                  <option value="questions_only">仅识别题目</option>
                  <option value="same_image_answer">题目+答案 · 一题一答</option>
                  <option value="separate_answer">题目+答案 · 题答分页</option>
                </select>
              </label>
              <label className="grid gap-[8px] text-[16px] leading-none text-[#7c8791]">
                资料类型
                <select
                  className="h-[42px] w-[206px] rounded-[6px] border border-[#d6dee5] bg-white px-[12px] text-[18px] text-[#37414b]"
                  onChange={(event) => setPrototypeSubjectType(event.target.value as PrototypeSubjectType)}
                  value={prototypeSubjectType}
                >
                  <option value="math">数学常见题</option>
                  <option value="english">英语常见题</option>
                </select>
              </label>
              <label className="grid gap-[8px] text-[16px] leading-none text-[#7c8791]">
                跳转目标
                <select
                  className="h-[42px] w-[234px] rounded-[6px] border border-[#d6dee5] bg-white px-[12px] text-[18px] text-[#37414b]"
                  onChange={(event) => setPrototypeTargetStep(event.target.value as PrototypeTargetStep)}
                  value={prototypeTargetStep}
                >
                  <option value="content">选择识别内容页</option>
                  <option value="review">核对识别结果页</option>
                </select>
              </label>
              <button
                className="h-[42px] rounded-[6px] border border-[#bfcbd5] bg-white px-[28px] text-[18px] font-medium leading-none text-[#53606b] active:bg-[#f5f7f8]"
                onClick={() => onPrototypeStart(prototypeSubjectType, prototypeMode, prototypeTargetStep)}
                type="button"
              >
                确定
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SourceCard({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="flex h-[286px] w-[428px] flex-col items-center justify-center rounded-[16px] bg-[#f8f9f9] text-center shadow-[0_8px_24px_rgba(20,44,35,0.06)] active:scale-[0.99] active:bg-[#f2f7f5]"
      onClick={onClick}
      type="button"
    >
      <div className="flex h-[78px] w-[78px] items-center justify-center rounded-[20px] bg-white text-[#49bf89] shadow-[0_6px_18px_rgba(20,44,35,0.08)]">
        {icon}
      </div>
      <div className="mt-[30px] text-[30px] font-medium leading-none text-[#202124]">
        {title}
      </div>
    </button>
  );
}

let mockCaptureSequence = 0;
let selectedImageSequence = 0;
const imageRuntimeKeyMap = new WeakMap<SelectedImage, string>();

function createSelectedImageId(prefix = 'image') {
  selectedImageSequence += 1;
  return `${prefix}-${Date.now()}-${selectedImageSequence}`;
}

function getImageKey(image: SelectedImage) {
  if (image.id) return image.id;

  const existingKey = imageRuntimeKeyMap.get(image);
  if (existingKey) return existingKey;

  const nextKey = createSelectedImageId('legacy-image');
  imageRuntimeKeyMap.set(image, nextKey);
  return nextKey;
}

function createMockCapture(role: ImageRole | undefined, index: number, crop?: CropRegion): SelectedImage {
  const roleText = role === 'question' ? '题目图片' : role === 'answer' ? '答案图片' : '作业图片';
  const accent = role === 'answer' ? '#6f94f7' : '#58cf9a';
  const cropText = crop ? `裁剪 ${Math.round(crop.width)}×${Math.round(crop.height)}` : '';
  mockCaptureSequence += 1;
  const captureToken = `mock-capture-${mockCaptureSequence}`;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220">
      <desc>${captureToken}</desc>
      <rect width="320" height="220" rx="18" fill="#f7fafc"/>
      <rect x="28" y="24" width="264" height="172" rx="12" fill="#ffffff" stroke="#d9e1e8" stroke-width="2"/>
      <rect x="54" y="58" width="118" height="20" rx="10" fill="${accent}"/>
      <rect x="54" y="96" width="210" height="12" rx="6" fill="#bae9da"/>
      <rect x="54" y="122" width="170" height="12" rx="6" fill="#c7d7ff"/>
      <rect x="54" y="148" width="198" height="12" rx="6" fill="#c7d7ff"/>
      <text x="66" y="73" fill="#ffffff" font-size="16" font-family="Arial, sans-serif">${roleText}${index}</text>
      ${cropText ? `<text x="190" y="73" fill="${accent}" font-size="13" font-family="Arial, sans-serif">${cropText}</text>` : ''}
    </svg>
  `;

  return {
    id: createSelectedImageId('mock-capture'),
    name: `${roleText}${index}.jpg`,
    role,
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
  };
}

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createPrototypePageImage({
  badge,
  lines,
  role,
  title,
}: {
  badge: string;
  lines: string[];
  role?: ImageRole;
  title: string;
}) {
  const accent = role === 'answer' ? '#6f94f7' : '#23bfb2';
  const lineNodes = lines.slice(0, 18).map((line, index) => {
    const y = 128 + index * 44;
    return `<text x="72" y="${y}" fill="#202124" font-size="24" font-family="Arial, sans-serif">${escapeSvgText(line)}</text>`;
  }).join('');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="1280" viewBox="0 0 960 1280">
      <rect width="960" height="1280" fill="#ffffff"/>
      <rect x="48" y="42" width="864" height="1196" rx="18" fill="#ffffff" stroke="#dfe4ea" stroke-width="3"/>
      <rect x="72" y="70" width="138" height="42" rx="8" fill="${accent}"/>
      <text x="92" y="99" fill="#ffffff" font-size="22" font-weight="700" font-family="Arial, sans-serif">${escapeSvgText(badge)}</text>
      <text x="236" y="101" fill="#202124" font-size="30" font-weight="700" font-family="Arial, sans-serif">${escapeSvgText(title)}</text>
      ${lineNodes}
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function createPrototypeSelectedImage(
  subjectType: PrototypeSubjectType,
  mode: RecognitionMode,
  index: number,
  role: ImageRole | undefined,
  url: string,
): SelectedImage {
  const subjectName = subjectType === 'math' ? '数学常见题' : '英语常见题';
  const modeName = mode === 'questions_only' ? '仅题目' : mode === 'same_image_answer' ? '一题一答' : '题答分页';
  const roleName = role === 'answer' ? '答案' : '题目';

  return {
    id: `prototype-${subjectType}-${mode}-${roleName}-${index}`,
    name: `${subjectName}-${modeName}-${roleName}${index}.png`,
    role,
    url,
  };
}

function createPrototypeMaterialPage(image: SelectedImage, pageNumber: number): MaterialPage {
  return {
    ...image,
    imageData: image.url,
    naturalHeight: 1280,
    naturalWidth: 960,
    pageNumber,
  };
}

const prototypeContentBySubject: Record<PrototypeSubjectType, {
  subject: string;
  questionsOnlyLines: string[][];
  sameFileLines: string[][];
  separateQuestionLines: string[][];
  separateAnswerLines: string[][];
}> = {
  math: {
    subject: '高中数学',
    questionsOnlyLines: [
      ['一、选择题（每题 5 分）', '1. 下列数据最符合生活实际的是（ ）', 'A. 中学生身高约 160mm', 'B. 人体正常体温约 42℃', 'C. 家用台灯正常工作电流约 1A', 'D. 人步行速度约 1.1m/s'],
      ['二、填空题（每空 2 分）', '6. 弹奏吉他时，琴弦______发声。', '7. 光在真空中的传播速度为______m/s。', '8. 一个质量为 50kg 的中学生，重力为______N。', '9. 潜水艇下潜时，浮力______，压强______。'],
      ['三、解答题（共 40 分）', '11. 一个重为 600N 的物体，用 200N 的水平拉力匀速移动 5m。', '（1）求摩擦力大小；', '（2）求拉力做的功；', '（3）求拉力的功率。', '12. 金属块温度从 90℃ 降低到 40℃，放出热量 4.5×10⁴J。'],
    ],
    sameFileLines: [
      ['5.（8分）已知 (a+b)²=a²+2ab+b²，(a-b)²=a²-2ab+b²。', '（1）已知 a+b=9，a-b=5，求 ab 的值。', '【答案】ab=14', '【解析】由两式相减得 4ab=56，所以 ab=14。', '（2）若 a-b=m，ab=n，用含 m,n 的代数式表示 a²+b²。', '【答案】a²+b²=m²+2n'],
      ['1.（3分）若 x²+mx-12 可分解为 (x-3)(x+4)，则 m 的值为（ ）', 'A. 1  B. -1  C. -4  D. 2', '【答案】A', '【解析】(x-3)(x+4)=x²+x-12，所以 m=1。', '2. 若 36x²+kx+16 可以写成完全平方形式，则 k=（ ）', '【答案】D'],
      ['3.（4分）因式分解：ab³-9ab=____。', '【答案】ab(b+3)(b-3)', '【解析】先提公因式 ab，再用平方差公式。', '4.（4分）分解因式：4m-4=____。', '【答案】4(m-1)', '【解析】提取公因式 4 即可。'],
    ],
    separateQuestionLines: [
      ['一、选择题（每题 5 分）', '1. 下列数据最符合生活实际的是（ ）', 'A. 中学生身高约 160mm', 'B. 人体正常体温约 42℃', 'C. 家用台灯正常工作电流约 1A', 'D. 人步行速度约 1.1m/s'],
      ['二、填空题（每空 2 分）', '6. 弹奏吉他时，琴弦______发声。', '7. 光在真空中的传播速度为______m/s。', '8. 一个质量为 50kg 的中学生，重力为______N。', '9. 潜水艇下潜时，浮力______，压强______。'],
      ['三、解答题（共 40 分）', '11. 一个重为 600N 的物体，用 200N 的水平拉力匀速移动 5m。', '（1）求摩擦力大小；', '（2）求拉力做的功；', '（3）求拉力的功率。'],
    ],
    separateAnswerLines: [
      ['一、选择题', '1. 答案：D', '解析：人步行速度约 1.1m/s，符合实际。', '2. 答案：C', '3. 答案：C', '4. 答案：C'],
      ['二、填空题', '6. 振动；空气', '7. 3×10⁸；漫', '8. 500；竖直向下', '9. 不变；变大', '10. 横截面积；无关'],
      ['三、解答题', '11.（1）答案：200N', '（2）答案：1000J', '（3）答案：100W', '12.（1）答案：50℃', '（2）答案：1.8×10³J/(kg·℃)'],
    ],
  },
  english: {
    subject: '高中英语',
    questionsOnlyLines: [
      ['Passage 1', 'Hello, everyone! Welcome to our school library.', 'Before you enter, please follow the rules.', '1. How many rules are mentioned in the passage?', 'A. Two  B. Three  C. Four  D. Five', '2. What can you do in the library?', 'A. Talk loudly  B. Borrow books  C. Eat food  D. Listen to music'],
      ['四、完形填空（共 15 小题）', 'Dear John, I am writing to tell you something about my school life.', 'There ____1____ about 2,000 students and 150 teachers in our school.', 'We go to school ____2____ Monday to Friday.', 'Classes begin ____3____ eight o’clock in the morning.', '1. A. is  B. are  C. has  D. have', '2. A. on  B. in  C. from  D. at'],
    ],
    sameFileLines: [
      ['阅读理解（总分 10 分）', 'When your pen is broken, what do you do with these things?', 'All kinds of rubbish need to be sorted separately.', '(1) How should we deal with all kinds of rubbish?', 'A. We can throw them all into one bin.', 'B. We can sort them separately.', '【答案】(1) B  (2) A  (3) C  (4) B  (5) C'],
      ['完型填空（总分 10 分）', 'Wayne Lotter spent 25 years ____1____ the wild animals.', 'He was always thinking about how ____2____ people from killing elephants.', '(1) A. protect  B. protected  C. to protect  D. protecting', '【答案】(1) D  (2) B  (3) C  (4) C  (5) A', '【解析】spend + 时间 + doing sth，故选 D。'],
    ],
    separateQuestionLines: [
      ['完型填空', 'My English teacher, Miss Wang, is very ____7____.', 'She teaches us new words and grammar in a fun way.', 'Mr. Li is very ____9____ and organized.', '7. A. strict  B. amusing  C. nervous  D. boring', '8. A. boring  B. difficult  C. interesting  D. tiring', '9. A. shy  B. energetic  C. disorganized  D. bored'],
      ['Space Hotel Promises Guests A Truly Out-Of-This World Vacation', 'Aurora Station will circle the planet once every 90 minutes.', '(1) What can be learned about Aurora Station?', 'A. People can visit it now.', 'B. Its construction will last for about 5 years.', 'C. It can only hold four people in this station.', 'D. It looks like a pill with the size of a small plane.'],
    ],
    separateAnswerLines: [
      ['答案：7-11 BCBCA  12-16 ADBAA', '7. 答案：B', '解析：后文提到老师笑容灿烂、上课有趣，amusing 符合语境。', '8. 答案：C', '解析：老师用有趣的方式教学，让课堂变得 interesting。', '9. 答案：B', '解析：energetic 与 organized 并列，符合老师形象。'],
      ['【答案】(1) D  (2) C  (3) A  (4) B', '【解析】', '1. 根据文中 the pill-shaped space station 可知答案为 D。', '2. 根据 guests can enjoy fantastic auroras 可知答案为 C。'],
    ],
  },
};

const prototypeQuestionSpecs: Record<PrototypeSubjectType, Array<{
  answer?: string;
  analysis?: string;
  blankAnswers?: string[];
  content: string;
  optionContents?: Record<string, string>;
  pageIndex: number;
  questionType: ReviewQuestionType;
}>> = {
  math: [
    {
      answer: 'D',
      analysis: '人步行速度约 1.1m/s，符合生活实际。',
      content: '1. 下列数据最符合生活实际的是（ ）',
      optionContents: { A: '中学生身高约 160mm', B: '人体正常体温约 42℃', C: '家用台灯正常工作电流约 1A', D: '人步行速度约 1.1m/s' },
      pageIndex: 0,
      questionType: 'single_choice',
    },
    {
      answer: '振动；空气',
      analysis: '声音由物体振动产生，通过空气传播到人耳。',
      blankAnswers: ['振动', '空气'],
      content: '6. 弹奏吉他时，琴弦______发声，琴声通过______传入人耳。',
      pageIndex: 1,
      questionType: 'fill_blank',
    },
    {
      answer: '200N；1000J；100W',
      analysis: '物体匀速直线运动时拉力与摩擦力平衡；W=Fs，P=W/t。',
      content: '11. 一个重为 600N 的物体，用 200N 的水平拉力匀速移动 5m，用时 10s。求摩擦力、拉力做功和功率。',
      pageIndex: 2,
      questionType: 'solution',
    },
  ],
  english: [
    {
      answer: 'B',
      analysis: 'The passage says rubbish should be sorted separately.',
      content: '1. How should we deal with all kinds of rubbish?',
      optionContents: { A: 'We can throw them all into one bin.', B: 'We can sort them separately.', C: 'We can throw them away freely.', D: 'We can reuse them all.' },
      pageIndex: 0,
      questionType: 'reading_comprehension',
    },
    {
      answer: 'D；B；C；C；A',
      analysis: 'Use the context and common grammar patterns to choose the answers.',
      content: 'Wayne Lotter spent 25 years ____1____ the wild animals. He was always thinking about how ____2____ people from killing elephants.',
      pageIndex: 1,
      questionType: 'cloze',
    },
    {
      answer: 'D',
      analysis: 'The station is described as pill-shaped and about the size of a private jet cabin.',
      content: '3. What can be learned about Aurora Station?',
      optionContents: { A: 'People can visit it now.', B: 'Its construction will last for about 5 years.', C: 'It can only hold four people in this station.', D: 'It looks like a pill with the size of a small plane.' },
      pageIndex: 1,
      questionType: 'reading_comprehension',
    },
  ],
};

function createPrototypeBoxes(subjectType: PrototypeSubjectType, pageCount: number) {
  const layouts = subjectType === 'math'
    ? [
        { pageNumber: 1, x: 8, y: 12, width: 82, height: 22 },
        { pageNumber: Math.min(2, pageCount), x: 8, y: 18, width: 82, height: 28 },
        { pageNumber: Math.min(3, pageCount), x: 8, y: 18, width: 82, height: 30 },
      ]
    : [
        { pageNumber: 1, x: 7, y: 9, width: 84, height: 34 },
        { pageNumber: Math.min(2, pageCount), x: 7, y: 10, width: 84, height: 38 },
        { pageNumber: Math.min(2, pageCount), x: 7, y: 54, width: 84, height: 26 },
      ];

  return layouts.map((layout, index) => ({
    id: `prototype-box-${subjectType}-${index + 1}`,
    selected: true,
    source: 'system' as const,
    ...layout,
  }));
}

function createPrototypeReviewQuestions(
  subjectType: PrototypeSubjectType,
  boxes: RecognitionBox[],
  pages: MaterialPage[],
  mode: RecognitionMode,
) {
  const specs = prototypeQuestionSpecs[subjectType];

  return boxes.map((box, index): ReviewQuestion => {
    const spec = specs[index % specs.length];
    const page = pages[Math.min(spec.pageIndex, pages.length - 1)] || pages[0];
    const optionCount = isChoiceLikeQuestionType(spec.questionType)
      ? Math.max(4, Object.keys(spec.optionContents || {}).length || 4)
      : 4;
    const blankCount = spec.blankAnswers?.length || (spec.questionType === 'cloze' ? 5 : 1);
    const subQuestions = spec.questionType === 'reading_comprehension'
      ? [0, 1].map((subIndex) => createReviewSubQuestion(box.id, subIndex, 'single_choice', { optionCount: 4 }))
      : spec.questionType === 'cloze'
        ? Array.from({ length: blankCount }, (_, subIndex) => createReviewSubQuestion(box.id, subIndex, 'single_choice', { optionCount: 4 }))
        : [];

    return {
      id: box.id,
      analysis: mode === 'questions_only' ? '' : (spec.analysis || ''),
      answer: mode === 'questions_only' ? '' : (spec.answer || ''),
      blankAnswers: mode === 'questions_only' ? createBlankAnswers(blankCount) : createBlankAnswers(blankCount, spec.blankAnswers),
      blankCount,
      content: spec.content,
      crop: { x: box.x, y: box.y, width: box.width, height: box.height },
      croppedImageData: page?.imageData,
      croppedImageHeight: page?.naturalHeight,
      croppedImageWidth: page?.naturalWidth,
      optionContents: isChoiceLikeQuestionType(spec.questionType)
        ? buildOptionContents(spec.questionType, optionCount, spec.optionContents || {})
        : {},
      optionCount,
      pageNumber: box.pageNumber,
      questionType: spec.questionType,
      questionTypeStatus: 'recognized',
      subQuestions,
      viewMode: 'recognition',
    };
  });
}

function createTabletPrototypeFixture(
  subjectType: PrototypeSubjectType,
  mode: RecognitionMode,
  targetStep: PrototypeTargetStep,
): TabletPrototypeFixture {
  const content = prototypeContentBySubject[subjectType];
  const linesByMode = mode === 'questions_only'
    ? content.questionsOnlyLines
    : mode === 'same_image_answer'
      ? content.sameFileLines
      : content.separateQuestionLines;
  const selectedImages = linesByMode.map((lines, index) => {
    const url = createPrototypePageImage({
      badge: mode === 'same_image_answer' ? '题答同页' : '题目',
      lines,
      role: mode === 'separate_answer' ? 'question' : undefined,
      title: `${content.subject}资料 ${index + 1}`,
    });
    return createPrototypeSelectedImage(subjectType, mode, index + 1, mode === 'separate_answer' ? 'question' : undefined, url);
  });
  const answerImages = mode === 'separate_answer'
    ? content.separateAnswerLines.map((lines, index) => {
        const url = createPrototypePageImage({
          badge: '答案',
          lines,
          role: 'answer',
          title: `${content.subject}答案 ${index + 1}`,
        });
        return createPrototypeSelectedImage(subjectType, mode, index + 1, 'answer', url);
      })
    : [];
  const images = [...selectedImages, ...answerImages];
  const pages = images.map((image, index) => createPrototypeMaterialPage(image, index + 1));
  const questionPageCount = mode === 'separate_answer' ? selectedImages.length : pages.length;
  const boxes = createPrototypeBoxes(subjectType, questionPageCount);
  const reviewQuestions = createPrototypeReviewQuestions(subjectType, boxes, pages, mode);

  return {
    autoStartReview: targetStep === 'review',
    boxes,
    id: `prototype-${subjectType}-${mode}-${targetStep}`,
    images,
    mode,
    pages,
    reviewQuestions,
    subject: content.subject,
    targetStep,
  };
}

function revokeImageUrls(images: SelectedImage[]) {
  images.forEach((image) => {
    if (image.url.startsWith('blob:')) {
      URL.revokeObjectURL(image.url);
    }
  });
}

function revokeImageUrl(image: SelectedImage) {
  if (image.url.startsWith('blob:')) {
    URL.revokeObjectURL(image.url);
  }
}

function appendFilesAsImages(files: File[], role?: ImageRole): SelectedImage[] {
  const rolePrefix = role === 'question' ? '题目' : role === 'answer' ? '答案' : '';

  return files.map((file, index) => ({
    id: createSelectedImageId('upload'),
    name: rolePrefix ? `${rolePrefix}_${file.name || index + 1}` : file.name,
    role,
    url: URL.createObjectURL(file),
  }));
}

function getStepThreeModeLabel(mode: RecognitionMode | '') {
  if (mode === 'questions_only') return '仅识别题目';
  if (mode === 'same_image_answer') return '题目+答案 · 同图片';
  if (mode === 'separate_answer') return '题目+答案 · 不同图片';
  return '识别作业资料';
}

function getStepThreeModeTip(mode: RecognitionMode | '') {
  if (mode === 'questions_only') return '只框选题目内容，答案解析不参与处理';
  if (mode === 'same_image_answer') return '只框选题目内容，答案解析后续自动匹配';
  if (mode === 'separate_answer') return '只对题目图片切题，答案图片后续参与答案解析匹配';
  return '请在左侧资料上选择需要识别的内容';
}

function clampPercent(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getMaterialPageFrameSize(page: MaterialPage) {
  const scale = Math.min(
    MATERIAL_PAGE_MAX_WIDTH / page.naturalWidth,
    MATERIAL_PAGE_MAX_HEIGHT / page.naturalHeight,
  );

  return {
    width: page.naturalWidth * scale,
    height: page.naturalHeight * scale,
  };
}

function expandSystemBoxForSelectIcon(box: RecognitionBox, page: MaterialPage | undefined) {
  if (!page || box.source !== 'system') return box;

  const frame = getMaterialPageFrameSize(page);
  const offsetPercent = (OCR_BOX_SELECT_ICON_SAFE_WIDTH / frame.width) * 100;
  const actualOffset = Math.min(offsetPercent, box.x);
  const rightEdge = clampPercent(box.x + box.width, 0, 100);
  const nextX = box.x - actualOffset;

  return {
    ...box,
    x: nextX,
    width: clampPercent(rightEdge - nextX, 3, 100 - nextX),
  };
}

function createRequirementDisplayNumberScope(
  markerIds: string[],
  displayNumbersByRequirementId: Map<string, number>,
): RequirementDisplayNumberScopeItem[] {
  return markerIds.map((requirementId, index) => ({
    requirementId,
    displayNumber: displayNumbersByRequirementId.get(requirementId) ?? index + 1,
  }));
}

function reorderImagesByUrl(images: SelectedImage[], fromUrl: string, toUrl: string) {
  const fromIndex = images.findIndex((image) => getImageKey(image) === fromUrl);
  const toIndex = images.findIndex((image) => getImageKey(image) === toUrl);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return images;

  const nextImages = [...images];
  const [movedImage] = nextImages.splice(fromIndex, 1);
  nextImages.splice(toIndex, 0, movedImage);
  return nextImages;
}

function mergeSupplementImagesByOrder(
  order: string[],
  processedImages: SelectedImage[],
  supplementImages: SelectedImage[],
) {
  const imageMap = new Map<string, SelectedImage>();
  [...processedImages, ...supplementImages].forEach((image) => {
    imageMap.set(getImageKey(image), image);
  });

  const orderedImages = order
    .map((url) => imageMap.get(url))
    .filter((image): image is SelectedImage => Boolean(image));
  const orderedUrlSet = new Set(orderedImages.map((image) => getImageKey(image)));
  const missingImages = [...processedImages, ...supplementImages].filter((image) => !orderedUrlSet.has(getImageKey(image)));

  return [...orderedImages, ...missingImages];
}

function getImageOrderSignature(images: SelectedImage[]) {
  return images.map((image) => getImageKey(image)).join('|');
}

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function loadImageSize(url: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth || 1, height: image.naturalHeight || 1 });
    image.onerror = () => reject(new Error('image load failed'));
    image.src = url;
  });
}

async function prepareMaterialPages(images: SelectedImage[]) {
  const pages: MaterialPage[] = [];

  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    const [{ width, height }, blob] = await Promise.all([
      loadImageSize(image.url),
      fetch(image.url).then((response) => response.blob()),
    ]);
    const imageData = await readBlobAsDataUrl(blob);

    pages.push({
      ...image,
      pageNumber: index + 1,
      naturalWidth: width,
      naturalHeight: height,
      imageData,
    });
  }

  return pages;
}

async function detectMaterialBoxes(pages: MaterialPage[]) {
  const response = await fetch('/api/auto-detect-boxes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pages: pages.map((page) => ({
        pageNumber: page.pageNumber,
        imageData: page.imageData,
        width: page.naturalWidth,
        height: page.naturalHeight,
      })),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'auto detect failed');
  }

  if (!response.body) {
    throw new Error('auto detect response is empty');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const eventText of events) {
      const dataLine = eventText.split('\n').find((line) => line.startsWith('data:'));
      if (!dataLine) continue;

      const event = JSON.parse(dataLine.replace(/^data:\s*/, '')) as {
        type?: string;
        data?: {
          error?: string;
          result?: {
            boxes?: Array<{
              pageNumber?: number;
              x?: number;
              y?: number;
              width?: number;
              height?: number;
            }>;
          };
        };
      };

      if (event.type === 'error') {
        throw new Error(event.data?.error || 'auto detect failed');
      }

      if (event.type === 'complete') {
        return (event.data?.result?.boxes || []).map((box, index) => ({
          id: `system-${box.pageNumber || 1}-${index}-${Date.now()}`,
          pageNumber: box.pageNumber || 1,
          x: clampPercent(Number(box.x || 0), 0, 96),
          y: clampPercent(Number(box.y || 0), 0, 96),
          width: clampPercent(Number(box.width || 0), 4, 100),
          height: clampPercent(Number(box.height || 0), 3, 100),
          selected: true,
          source: 'system' as const,
        }));
      }
    }

    if (done) break;
  }

  return [];
}

function cropImageByPixels(
  imageData: string,
  region: { x: number; y: number; width: number; height: number },
) {
  return new Promise<{ imageData: string; width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const sourceX = clampPercent(region.x, 0, image.naturalWidth - 1);
      const sourceY = clampPercent(region.y, 0, image.naturalHeight - 1);
      const sourceWidth = clampPercent(region.width, 1, image.naturalWidth - sourceX);
      const sourceHeight = clampPercent(region.height, 1, image.naturalHeight - sourceY);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(sourceWidth);
      canvas.height = Math.round(sourceHeight);
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('无法创建 Canvas 上下文'));
        return;
      }

      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      resolve({
        imageData: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
      });
    };
    image.onerror = () => reject(new Error('图片裁剪失败'));
    image.src = imageData;
  });
}

function cropMaterialQuestionImage(page: MaterialPage, crop: ReviewQuestion['crop']) {
  return cropImageByPixels(page.imageData, {
    x: Math.round((crop.x / 100) * page.naturalWidth),
    y: Math.round((crop.y / 100) * page.naturalHeight),
    width: Math.round((crop.width / 100) * page.naturalWidth),
    height: Math.round((crop.height / 100) * page.naturalHeight),
  });
}

function cropRenderedImageRegion(
  imageData: string,
  displaySize: { width: number; height: number },
  region: CropRegion,
) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scaleX = image.naturalWidth / displaySize.width;
      const scaleY = image.naturalHeight / displaySize.height;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(region.width * scaleX);
      canvas.height = Math.round(region.height * scaleY);
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('无法创建 Canvas 上下文'));
        return;
      }

      context.drawImage(
        image,
        region.x * scaleX,
        region.y * scaleY,
        region.width * scaleX,
        region.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => reject(new Error('图片裁剪失败'));
    image.src = imageData;
  });
}

function CameraGrid() {
  return (
    <>
      {[1, 2, 3, 4].map((index) => (
        <div
          key={`v-${index}`}
          className="absolute top-0 h-full w-px bg-white/55"
          style={{ left: `${index * 20}%` }}
        />
      ))}
      {[1, 2, 3].map((index) => (
        <div
          key={`h-${index}`}
          className="absolute left-0 h-px w-full bg-white/55"
          style={{ top: `${index * 25}%` }}
        />
      ))}
    </>
  );
}

function CaptureImageManager({
  answerImages,
  getImageOrigin,
  isSupplementMode = false,
  mode,
  onAnswerReorder,
  onClose,
  onDelete,
  onMove,
  onQuestionReorder,
  onSelectedReorder,
  questionImages,
  renderRequirementMarker,
  selectedImages,
  supplementImageKeys,
}: {
  answerImages: SelectedImage[];
  getImageOrigin?: (image: SelectedImage) => CaptureImageOrigin;
  isSupplementMode?: boolean;
  mode: RecognitionMode | '';
  onAnswerReorder: (fromUrl: string, toUrl: string) => void;
  onClose: () => void;
  onDelete: (image: SelectedImage, role?: ImageRole) => void;
  onMove: (image: SelectedImage, fromRole: ImageRole, toRole: ImageRole) => void;
  onQuestionReorder: (fromUrl: string, toUrl: string) => void;
  onSelectedReorder?: (fromUrl: string, toUrl: string) => void;
  questionImages: SelectedImage[];
  renderRequirementMarker: RequirementMarkerRenderer;
  selectedImages: SelectedImage[];
  supplementImageKeys?: ReadonlySet<string>;
}) {
  const isSeparateMode = mode === 'separate_answer';
  const [previewImage, setPreviewImage] = useState<SelectedImage | null>(null);
  const [draggingImageUrl, setDraggingImageUrl] = useState<string | null>(null);
  const [dragOverImageUrl, setDragOverImageUrl] = useState<string | null>(null);
  const draggingImageUrlRef = useRef<string | null>(null);
  const lastReorderTargetUrlRef = useRef<string | null>(null);
  const dragGroupRef = useRef<ImageRole | 'selected' | null>(null);

  const findDragTargetUrl = (clientX: number, clientY: number) => {
    const directTarget = document
      .elementFromPoint(clientX, clientY)
      ?.closest<HTMLElement>('[data-sortable-image-url]');

    if (directTarget?.dataset.sortableImageUrl) return directTarget.dataset.sortableImageUrl;

    const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-sortable-image-url]'));
    if (rows.length === 0) return undefined;

    return rows.reduce(
      (closest, row) => {
        const rect = row.getBoundingClientRect();
        const distance = Math.abs(clientY - (rect.top + rect.height / 2));
        return distance < closest.distance
          ? { distance, url: row.dataset.sortableImageUrl }
          : closest;
      },
      { distance: Number.POSITIVE_INFINITY, url: undefined as string | undefined },
    ).url;
  };

  const handleDragStart = (url: string, group: ImageRole | 'selected', event: ReactPointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    draggingImageUrlRef.current = url;
    lastReorderTargetUrlRef.current = url;
    dragGroupRef.current = group;
    setDraggingImageUrl(url);
    setDragOverImageUrl(url);
  };

  const handleDragEnd = () => {
    draggingImageUrlRef.current = null;
    lastReorderTargetUrlRef.current = null;
    dragGroupRef.current = null;
    setDraggingImageUrl(null);
    setDragOverImageUrl(null);
  };

  useEffect(() => {
    if (!draggingImageUrl) return undefined;

    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault();
      const fromUrl = draggingImageUrlRef.current;
      if (!fromUrl) return;

      const targetUrl = findDragTargetUrl(event.clientX, event.clientY);
      if (!targetUrl || targetUrl === fromUrl) return;
      if (targetUrl === lastReorderTargetUrlRef.current) return;

      lastReorderTargetUrlRef.current = targetUrl;
      setDragOverImageUrl(targetUrl);

      if (dragGroupRef.current === 'selected') {
        onSelectedReorder?.(fromUrl, targetUrl);
        return;
      }

      if (dragGroupRef.current === 'answer') {
        onAnswerReorder(fromUrl, targetUrl);
        return;
      }

      onQuestionReorder(fromUrl, targetUrl);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handleDragEnd);
    window.addEventListener('pointercancel', handleDragEnd);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handleDragEnd);
      window.removeEventListener('pointercancel', handleDragEnd);
    };
  }, [draggingImageUrl, onAnswerReorder, onQuestionReorder, onSelectedReorder]);

  const renderImageItem = (image: SelectedImage, index: number, role?: ImageRole) => {
    const imageKey = getImageKey(image);
    const imageOrigin = supplementImageKeys
      ? supplementImageKeys.has(imageKey) ? 'supplement' : 'processed'
      : getImageOrigin?.(image);
    const isProcessedImage = imageOrigin === 'processed';
    const isSortable = Boolean(role) || (!role && Boolean(onSelectedReorder));
    const dragGroup = role || 'selected';

    return (
    <div
      key={imageKey}
      className={`flex h-[116px] touch-none items-center gap-[16px] rounded-[12px] border bg-white p-[12px] ${
        draggingImageUrl === imageKey
          ? 'border-[#58cf9a] shadow-[0_8px_22px_rgba(88,207,154,0.22)]'
          : dragOverImageUrl === imageKey
            ? 'border-[#b6ead9]'
            : 'border-[#e6e9ed]'
      }`}
      data-sortable-image-url={isSortable ? imageKey : undefined}
      onPointerCancel={handleDragEnd}
      onPointerDown={(event) => {
        if (!isSortable) return;
        if ((event.target as HTMLElement).closest('button')) return;
        handleDragStart(imageKey, dragGroup, event);
      }}
      onPointerUp={handleDragEnd}
    >
      <button
        aria-label="查看大图"
        className="h-[88px] w-[88px] shrink-0 rounded-[8px] active:scale-[0.98]"
        onClick={() => setPreviewImage(image)}
        type="button"
      >
        <img
          alt=""
          className="h-full w-full rounded-[8px] object-cover"
          src={image.url}
        />
      </button>
      <div
        className="min-w-0 flex-1"
        onPointerDown={(event) => {
          if (isSortable) handleDragStart(imageKey, dragGroup, event);
        }}
      >
        <div className="truncate text-[22px] font-medium leading-none text-[#202124]">
          {role === 'question' ? `题目图片 ${index + 1}` : role === 'answer' ? `答案图片 ${index + 1}` : `作业图片 ${index + 1}`}
        </div>
        <div className="mt-[10px] flex min-w-0 items-center gap-[8px]">
          {isSupplementMode ? (
            isProcessedImage ? (
              <span
                className="inline-flex shrink-0 rounded-[5px] px-[10px] py-[6px] text-[15px] font-medium leading-none shadow-[0_3px_8px_rgba(35,191,178,0.20)]"
                style={{ backgroundColor: '#23bfb2', color: '#ffffff' }}
              >
                已处理
              </span>
            ) : (
              <span
                className="inline-flex shrink-0 rounded-[5px] px-[10px] py-[6px] text-[15px] font-medium leading-none shadow-[0_3px_8px_rgba(245,158,11,0.22)]"
                style={{ backgroundColor: '#f59e0b', color: '#ffffff' }}
              >
                本次补充
              </span>
            )
          ) : null}
          <span className="truncate text-[17px] leading-none text-[#7a838d]">
            {isSortable ? '按住拖动可调整顺序' : '点击缩略图查看大图'}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-[10px]">
        {isSortable ? (
          <button
            aria-label="拖动调整图片顺序"
            className="flex h-[42px] items-center gap-[6px] rounded-[7px] border border-[#d7dde3] bg-white px-[12px] text-[18px] leading-none text-[#4b5563] active:bg-[#f4f6f7]"
            onPointerDown={(event) => handleDragStart(imageKey, dragGroup, event)}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
            type="button"
          >
            <GripVertical className="h-[22px] w-[22px]" />
            排序
          </button>
        ) : null}
        {isSeparateMode && role && !(isSupplementMode && isProcessedImage) ? (
          <button
            className="h-[42px] rounded-[7px] border border-[#d7dde3] bg-white px-[14px] text-[18px] leading-none text-[#4b5563] active:bg-[#f4f6f7]"
            onClick={() => onMove(image, role, role === 'question' ? 'answer' : 'question')}
            type="button"
          >
            移到{role === 'question' ? '答案' : '题目'}
          </button>
        ) : null}
        {isSupplementMode && isProcessedImage ? null : (
          <button
            className="h-[42px] rounded-[7px] bg-[#fff1f1] px-[14px] text-[18px] leading-none text-[#e14c4c] active:bg-[#ffe5e5]"
            onClick={() => onDelete(image, role)}
            type="button"
          >
            删除
          </button>
        )}
      </div>
    </div>
    );
  };
  const renderGroup = (title: string, images: SelectedImage[], role?: ImageRole) => {
    const shouldShowSortRequirementMarker =
      (isSeparateMode && role === 'question') || (isSupplementMode && !isSeparateMode && !role);

    return (
    <section>
      <div
        data-req-anchor={shouldShowSortRequirementMarker ? 'tablet-capture.sort-move' : undefined}
        className="relative mb-[14px] flex items-center justify-between"
      >
        {shouldShowSortRequirementMarker
          ? renderRequirementMarker('TABLET_CAPTURE-009', 'left-[62px] top-[-12px]')
          : null}
        <h3 className="text-[24px] font-semibold leading-none text-[#202124]">{title}</h3>
        <span className="text-[19px] leading-none text-[#7a838d]">{images.length} 张</span>
      </div>
      <div className="grid gap-[12px]">
        {images.length > 0 ? (
          images.map((image, index) => renderImageItem(image, index, role))
        ) : (
          <div className="flex h-[104px] items-center justify-center rounded-[12px] border border-dashed border-[#d7dde3] bg-[#f7f8f9] text-[21px] text-[#8b949e]">
            暂未添加图片
          </div>
        )}
      </div>
    </section>
    );
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/45">
      <div className="absolute right-[156px] top-[118px] h-[930px] w-[720px] rounded-[18px] bg-[#f8fafb] shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
        <header className="absolute left-0 top-0 h-[88px] w-full border-b border-[#e3e7ea] bg-white">
          <div
            data-req-anchor="tablet-capture.manager-panel"
            className="absolute left-[34px] top-[30px] text-[28px] font-semibold leading-none text-[#202124]"
          >
            {renderRequirementMarker('TABLET_CAPTURE-008', 'right-[-36px] top-[-14px]')}
            已拍图片
          </div>
          <button
            aria-label="关闭图片管理"
            className="absolute right-[24px] top-[20px] flex h-[48px] w-[48px] items-center justify-center rounded-full text-[#68727d] active:bg-[#f2f4f5]"
            onClick={onClose}
            type="button"
          >
            <X className="h-[32px] w-[32px]" />
          </button>
        </header>
        <div className="absolute bottom-0 left-0 right-0 top-[88px] overflow-y-auto p-[28px]">
          <div className="space-y-[30px]">
            {isSeparateMode ? (
              <>
                {renderGroup('题目', questionImages, 'question')}
                {renderGroup('答案', answerImages, 'answer')}
              </>
            ) : (
              renderGroup('作业图片', selectedImages)
            )}
          </div>
        </div>
      </div>
      {previewImage ? (
        <div className="absolute inset-0 z-50 bg-black/78">
          <button
            aria-label="关闭大图"
            className="absolute right-[36px] top-[34px] flex h-[54px] w-[54px] items-center justify-center rounded-full bg-black/65 text-white active:bg-black"
            onClick={() => setPreviewImage(null)}
            type="button"
          >
            <X className="h-[34px] w-[34px]" />
          </button>
          <div className="absolute bottom-[72px] left-[72px] right-[72px] top-[104px] flex items-center justify-center">
            <img
              alt=""
              className="max-h-full max-w-full rounded-[12px] object-contain shadow-[0_20px_70px_rgba(0,0,0,0.38)]"
              src={previewImage.url}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CaptureSimulator({
  title,
  currentRole,
  currentImages,
  getImageOrigin,
  isSupplementMode = false,
  mode,
  questionCount,
  answerCount,
  questionImages,
  answerImages,
  selectedImages,
  primaryText,
  primaryDisabled,
  onAlbumSelected,
  onCapture,
  onClose,
  onDeleteImage,
  onMoveImage,
  onAnswerReorder,
  onPrimary,
  onQuestionReorder,
  onSelectedReorder,
  onRoleChange,
  renderRequirementMarker,
  supplementImageKeys,
}: {
  title: string;
  currentRole?: ImageRole;
  currentImages: SelectedImage[];
  getImageOrigin?: (image: SelectedImage) => CaptureImageOrigin;
  isSupplementMode?: boolean;
  mode: RecognitionMode | '';
  questionCount: number;
  answerCount: number;
  questionImages: SelectedImage[];
  answerImages: SelectedImage[];
  selectedImages: SelectedImage[];
  primaryText: string;
  primaryDisabled: boolean;
  onAlbumSelected: (files: File[]) => void;
  onCapture: (crop?: CropRegion) => void;
  onClose: () => void;
  onDeleteImage: (image: SelectedImage, role?: ImageRole) => void;
  onMoveImage: (image: SelectedImage, fromRole: ImageRole, toRole: ImageRole) => void;
  onAnswerReorder: (fromUrl: string, toUrl: string) => void;
  onPrimary: () => void;
  onQuestionReorder: (fromUrl: string, toUrl: string) => void;
  onSelectedReorder?: (fromUrl: string, toUrl: string) => void;
  onRoleChange?: (role: ImageRole) => void;
  renderRequirementMarker: RequirementMarkerRenderer;
  supplementImageKeys?: ReadonlySet<string>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [pendingCaptureBox, setPendingCaptureBox] = useState<CropRegion | null>(null);
  const [captureBoxDrag, setCaptureBoxDrag] = useState<{
    action: 'move' | 'resize';
    startClientX: number;
    startClientY: number;
    startBox: CropRegion;
  } | null>(null);
  const latestImage = currentImages[currentImages.length - 1] || (isSupplementMode ? selectedImages[selectedImages.length - 1] : undefined);
  const managerImageCount = mode === 'separate_answer'
    ? questionImages.length + answerImages.length
    : selectedImages.length;
  const supplementImageCount = currentImages.length;
  const captureFrame = { height: 690, left: 360, top: 210, width: 930 };
  const captureTitleToneClass = currentRole
    ? currentRole === 'question'
      ? 'bg-[#58cf9a] text-white'
      : 'bg-[#6f94f7] text-white'
    : 'bg-black/40 text-white/90';

  useEffect(() => {
    if (!captureBoxDrag) return undefined;

    const handlePointerMove = (event: PointerEvent) => {
      const dx = ((event.clientX - captureBoxDrag.startClientX) / captureFrame.width) * 100;
      const dy = ((event.clientY - captureBoxDrag.startClientY) / captureFrame.height) * 100;
      setPendingCaptureBox((currentBox) => {
        if (!currentBox) return currentBox;
        if (captureBoxDrag.action === 'move') {
          return {
            ...currentBox,
            x: clampPercent(captureBoxDrag.startBox.x + dx, 0, 100 - captureBoxDrag.startBox.width),
            y: clampPercent(captureBoxDrag.startBox.y + dy, 0, 100 - captureBoxDrag.startBox.height),
          };
        }
        return {
          ...currentBox,
          height: clampPercent(captureBoxDrag.startBox.height + dy, 8, 100 - captureBoxDrag.startBox.y),
          width: clampPercent(captureBoxDrag.startBox.width + dx, 10, 100 - captureBoxDrag.startBox.x),
        };
      });
    };

    const handlePointerUp = () => setCaptureBoxDrag(null);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [captureBoxDrag]);

  const handleCaptureButtonClick = () => {
    if (!pendingCaptureBox) {
      setPendingCaptureBox({ x: 14, y: 16, width: 72, height: 44 });
      return;
    }
    onCapture(pendingCaptureBox);
    setPendingCaptureBox(null);
  };

  return (
    <div className="absolute inset-0 z-40 overflow-hidden bg-[#101010]">
      <input
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) {
            onAlbumSelected(files.slice(0, 24));
          }
          event.target.value = '';
        }}
        type="file"
      />

      <div className="absolute left-0 top-0 h-full w-[1784px] overflow-hidden bg-[#d8e0df]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#d8e2e1_0%,#f6f7f4_34%,#cbd2ce_64%,#4c302d_100%)]" />
        <div className="absolute left-[-120px] top-[730px] h-[580px] w-[980px] rotate-[-12deg] rounded-[120px] bg-[#5b2d2d]/55 blur-[4px]" />
        <div className="absolute left-[710px] top-[-70px] h-[260px] w-[360px] rotate-[16deg] rounded-[22px] bg-[#267fcc]/45 blur-[1px]" />
        <CameraGrid />
        {pendingCaptureBox ? (
          <div
            className="absolute touch-none border-[4px] border-[#58cf9a] bg-[#ddf8f4]/20 shadow-[0_0_0_3px_rgba(88,207,154,0.20)]"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              event.currentTarget.setPointerCapture?.(event.pointerId);
              setCaptureBoxDrag({
                action: 'move',
                startBox: pendingCaptureBox,
                startClientX: event.clientX,
                startClientY: event.clientY,
              });
            }}
            style={{
              height: `${(pendingCaptureBox.height / 100) * captureFrame.height}px`,
              left: `${captureFrame.left + (pendingCaptureBox.x / 100) * captureFrame.width}px`,
              top: `${captureFrame.top + (pendingCaptureBox.y / 100) * captureFrame.height}px`,
              width: `${(pendingCaptureBox.width / 100) * captureFrame.width}px`,
            }}
          >
            <button
              aria-label="调整拍照裁剪框大小"
              className="absolute bottom-[-13px] right-[-13px] h-[26px] w-[26px] rounded-full border-[3px] border-white bg-[#58cf9a] shadow-[0_3px_10px_rgba(0,0,0,0.24)]"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                event.currentTarget.setPointerCapture?.(event.pointerId);
                setCaptureBoxDrag({
                  action: 'resize',
                  startBox: pendingCaptureBox,
                  startClientX: event.clientX,
                  startClientY: event.clientY,
                });
              }}
              type="button"
            />
          </div>
        ) : null}
        <div className={`absolute left-1/2 top-[536px] -translate-x-1/2 rounded-[12px] px-[34px] py-[17px] text-[28px] font-medium leading-none ${captureTitleToneClass}`}>
          {currentRole
            ? `拍摄${currentRole === 'question' ? '题目' : '答案'}`
            : title}
        </div>
        <div
          data-req-anchor="tablet-capture.header-close"
          className="absolute left-[31px] top-[45px] h-[52px] w-[52px]"
        >
          {renderRequirementMarker('TABLET_CAPTURE-001', 'right-[-12px] top-[-12px]')}
          <button
            aria-label="关闭"
            className="flex h-full w-full items-center justify-center rounded-full bg-black/70 text-white active:bg-black"
            onClick={onClose}
            type="button"
          >
            <X className="h-[33px] w-[33px]" />
          </button>
        </div>

        {currentRole ? (
          <div
            data-req-anchor="tablet-capture.role-tabs"
            className="absolute left-1/2 top-[42px] flex -translate-x-1/2 gap-[12px] rounded-full bg-black/35 p-[7px]"
          >
            {renderRequirementMarker('TABLET_CAPTURE-002', 'right-[-14px] top-[-12px]')}
            <button
              className={`h-[44px] rounded-full px-[24px] text-[22px] leading-none ${
                currentRole === 'question' ? 'bg-[#58cf9a] text-white' : 'text-white/82'
              }`}
              onClick={() => onRoleChange?.('question')}
              type="button"
            >
              题目图片 {questionCount}
            </button>
            <button
              className={`h-[44px] rounded-full px-[24px] text-[22px] leading-none ${
                currentRole === 'answer' ? 'bg-[#6f94f7] text-white' : 'text-white/82'
              }`}
              onClick={() => onRoleChange?.('answer')}
              type="button"
            >
              答案图片 {answerCount}
            </button>
          </div>
        ) : null}

        <div
          data-req-anchor="tablet-capture.example"
          className="absolute right-[156px] top-[50px]"
        >
          {renderRequirementMarker('TABLET_CAPTURE-003', 'right-[-12px] top-[-12px]')}
          <button
            className="rounded-full bg-black/55 px-[28px] py-[16px] text-[25px] font-medium leading-none text-white"
            type="button"
          >
            拍摄示例
          </button>
        </div>
      </div>

      <aside className="absolute right-0 top-0 h-full w-[136px] bg-[#1f1f1f]">
        <div
          data-req-anchor="tablet-capture.album"
          className="absolute left-[30px] top-[232px] h-[76px] w-[76px]"
        >
          {renderRequirementMarker('TABLET_CAPTURE-004', 'right-[-12px] top-[-14px]')}
          <button
            aria-label="从相册选择"
            className="flex h-full w-full items-center justify-center rounded-full bg-black text-white active:bg-[#303030]"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <Images className="h-[38px] w-[38px]" />
          </button>
        </div>

        <div
          data-req-anchor="tablet-capture.shutter-crop"
          className="absolute left-[23px] top-[538px] h-[90px] w-[90px]"
        >
          {renderRequirementMarker('TABLET_CAPTURE-005', 'right-[-12px] top-[-14px]')}
          <button
            aria-label={pendingCaptureBox ? '确认拍照裁剪' : '拍照'}
            className={`flex h-full w-full items-center justify-center rounded-full border-[8px] border-white/45 shadow-[0_0_0_2px_rgba(255,255,255,0.75)] active:scale-95 ${
              pendingCaptureBox ? 'bg-[#58cf9a] text-white' : 'bg-white text-[#202124]'
            }`}
            onClick={handleCaptureButtonClick}
            type="button"
          >
            {pendingCaptureBox ? <Check className="h-[42px] w-[42px] stroke-[3]" /> : null}
          </button>
        </div>

        <div
          data-req-anchor="tablet-capture.manager-entry"
          className="absolute bottom-[150px] left-[31px] h-[82px] w-[82px]"
        >
          {renderRequirementMarker('TABLET_CAPTURE-007', 'right-[-12px] top-[-14px]')}
          <button
            aria-label="管理已拍图片"
            className="relative block h-[82px] w-[82px] rounded-[10px] active:scale-95 disabled:active:scale-100"
            disabled={managerImageCount === 0}
            onClick={() => setIsManagerOpen(true)}
            type="button"
          >
            {latestImage ? (
              <img
                alt=""
                className="h-full w-full rounded-[10px] border border-white/70 object-cover"
                src={latestImage.url}
              />
            ) : (
              <div className="h-full w-full rounded-[10px] border border-white/35 bg-black/40" />
            )}
          </button>
          {currentImages.length > 0 ? (
            <span className="absolute right-[-8px] top-[-10px] flex h-[30px] min-w-[30px] items-center justify-center rounded-full bg-[#58cf9a] px-[8px] text-[17px] font-medium leading-none text-white">
              {currentImages.length}
            </span>
          ) : null}
          {isSupplementMode ? (
            <span className="absolute left-1/2 top-[88px] -translate-x-1/2 whitespace-nowrap rounded-full bg-[#2f3438] px-[10px] py-[6px] text-[15px] leading-none text-white/86">
              本次 {supplementImageCount}
            </span>
          ) : null}
        </div>
        <div
          data-req-anchor="tablet-capture.primary-action"
          className="absolute bottom-[42px] left-[16px] h-[48px] w-[104px]"
        >
          {renderRequirementMarker('TABLET_CAPTURE-006', 'right-[-12px] top-[-14px]')}
          <button
            className={`h-full w-full rounded-[24px] text-[18px] font-medium leading-none text-white ${
              primaryDisabled ? 'bg-[#7a7a7a]' : 'bg-[#58cf9a] active:bg-[#45bf89]'
            }`}
            disabled={primaryDisabled}
            onClick={onPrimary}
            type="button"
          >
            {primaryText}
          </button>
        </div>
      </aside>
      {isManagerOpen ? (
        <CaptureImageManager
          answerImages={answerImages}
          getImageOrigin={getImageOrigin}
          isSupplementMode={isSupplementMode}
          mode={mode}
          onAnswerReorder={onAnswerReorder}
          onClose={() => setIsManagerOpen(false)}
          onDelete={onDeleteImage}
          onMove={onMoveImage}
          onQuestionReorder={onQuestionReorder}
          onSelectedReorder={onSelectedReorder}
          questionImages={questionImages}
          renderRequirementMarker={renderRequirementMarker}
          selectedImages={selectedImages}
          supplementImageKeys={supplementImageKeys}
        />
      ) : null}
    </div>
  );
}

function OcrPreviewPage({
  images,
  mode,
  onBack,
  subject,
}: {
  images: SelectedImage[];
  mode: RecognitionMode | '';
  onBack: () => void;
  subject: string;
}) {
  const modeLabel =
    mode === 'questions_only'
      ? '仅识别题目'
      : mode === 'same_image_answer'
        ? '题目+答案｜同图片'
        : '题目+答案｜不同图片';
  const questionCount = images.filter((image) => image.role === 'question').length;
  const answerCount = images.filter((image) => image.role === 'answer').length;

  return (
    <div className="absolute inset-0 z-30 bg-[#f5f7f8]">
      <header className="absolute left-0 top-0 h-[96px] w-full border-b border-[#e6e9ec] bg-white">
        <button
          aria-label="返回拍摄"
          className="absolute left-[34px] top-[26px] flex h-[48px] items-center gap-[8px] rounded-[8px] pr-[16px] text-[#202124] active:bg-[#f4f4f4]"
          onClick={onBack}
          type="button"
        >
          <ChevronLeft className="h-[34px] w-[34px] stroke-[2.3]" />
          <span className="text-[30px] font-normal leading-none">识别作业资料</span>
        </button>
        <div className="absolute right-[48px] top-[30px] rounded-full bg-[#eaf7f1] px-[18px] py-[10px] text-[20px] leading-none text-[#31ad76]">
          {subject}
        </div>
      </header>

      <main className="absolute left-0 top-[96px] flex h-[1104px] w-full">
        <section className="relative h-full w-[770px] border-r border-[#e1e5e8] bg-white">
          <div className="absolute left-[42px] top-[34px]">
            <div className="text-[30px] font-semibold leading-none text-[#202124]">待切题资料</div>
            <div className="mt-[14px] text-[21px] leading-none text-[#737b84]">
              {modeLabel} · 共 {images.length} 张图片
              {mode === 'separate_answer' ? ` · 题目 ${questionCount} 张 / 答案 ${answerCount} 张` : ''}
            </div>
          </div>

          <div className="absolute left-[42px] top-[124px] grid w-[686px] grid-cols-2 gap-[18px]">
            {images.slice(0, 6).map((image, index) => (
              <div
                key={`${image.url}-${index}`}
                className="relative h-[168px] rounded-[12px] border border-[#e6eaee] bg-[#f8fafb] p-[12px]"
              >
                <img
                  alt=""
                  className="h-full w-full rounded-[8px] object-cover"
                  src={image.url}
                />
                <span className={`absolute left-[18px] top-[18px] rounded-[4px] px-[8px] py-[5px] text-[16px] font-medium leading-none text-white ${
                  image.role === 'answer' ? 'bg-[#6f94f7]' : 'bg-[#10b981]'
                }`}>
                  {image.role === 'answer' ? '答案' : '题目'}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="relative flex-1 bg-[#f5f7f8]">
          <div className="absolute left-[68px] top-[54px] text-[32px] font-semibold leading-none text-[#202124]">
            OCR 切题中
          </div>
          <div className="absolute left-[68px] top-[110px] text-[22px] leading-none text-[#7b838c]">
            已带入学科和识别方式，拍摄完成后直接进入切题环节
          </div>

          <div className="absolute left-[68px] top-[178px] h-[720px] w-[934px] rounded-[16px] border border-[#e2e7eb] bg-white shadow-[0_10px_32px_rgba(31,44,58,0.08)]">
            <div className="absolute left-[42px] top-[40px] h-[610px] w-[510px] rounded-[10px] border border-[#dde4ea] bg-[#fbfbfa] p-[26px]">
              <div className="mb-[24px] h-[20px] w-[270px] rounded-full bg-[#dce3e8]" />
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="relative mb-[48px] h-[116px] rounded-[8px] border-2 border-[#58cf9a] bg-[#e8faf5]"
                >
                  <span className="absolute -left-[2px] -top-[32px] rounded bg-[#4fc6b1] px-[10px] py-[7px] text-[18px] font-medium leading-none text-white">
                    题{index + 1}
                  </span>
                  <div className="absolute left-[24px] right-[24px] top-[28px] space-y-[14px]">
                    <div className="h-[14px] rounded-full bg-[#a9ead8]" />
                    <div className="h-[14px] w-[72%] rounded-full bg-[#a9ead8]" />
                    <div className="h-[14px] w-[52%] rounded-full bg-[#d6dde3]" />
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute right-[42px] top-[62px] h-[560px] w-[280px] rounded-[12px] bg-[#f7faf9] p-[24px]">
              <div className="text-[24px] font-semibold leading-none text-[#202124]">识别进度</div>
              <div className="mt-[34px] space-y-[22px]">
                {['智能切题', '识别题干', mode === 'questions_only' ? '整理题目' : '匹配答案解析'].map((step, index) => (
                  <div key={step} className="flex items-center gap-[14px]">
                    <span className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[#58cf9a] text-[16px] font-semibold leading-none text-white">
                      {index + 1}
                    </span>
                    <span className="text-[21px] leading-none text-[#3d4650]">{step}</span>
                  </div>
                ))}
              </div>
              <button
                className="absolute bottom-[28px] left-[24px] h-[56px] w-[232px] rounded-[8px] bg-[#58cf9a] text-[23px] font-medium leading-none text-white active:bg-[#45bf89]"
                type="button"
              >
                查看切题结果
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StepThreeGuide({ mode }: { mode: RecognitionMode | '' }) {
  const isSameImage = mode === 'same_image_answer';
  const isSeparate = mode === 'separate_answer';

  return (
    <div className="relative h-[420px] w-[660px] rounded-[18px] border border-dashed border-[#d8dee5] bg-white shadow-[0_16px_42px_rgba(31,44,58,0.08)]">
      <div className="absolute left-[48px] top-[42px] flex h-[304px] w-[276px] flex-col gap-[18px] rounded-[12px] border border-[#e2e8ee] bg-[#fbfdfc] p-[22px]">
        <div className="text-center text-[22px] font-medium text-[#5b6672]">资料页</div>
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className={`relative h-[74px] rounded-[7px] border ${
              item === 1 && !isSeparate ? 'border-[#39c8b8] bg-[#e4f8f4]' : 'border-[#edf0f3] bg-[#f4f5f6]'
            }`}
          >
            <span className="absolute -left-px -top-[24px] rounded bg-[#4fc6b1] px-[9px] py-[5px] text-[16px] leading-none text-white">
              题{item}
            </span>
            {isSameImage ? (
              <div className="absolute left-[20px] right-[20px] bottom-[12px] h-[10px] rounded-full bg-[#b8cdfb]" />
            ) : null}
            {isSeparate ? (
              <div className="absolute inset-x-[20px] top-[26px] h-[10px] rounded-full bg-[#9fe8d5]" />
            ) : (
              <div className="absolute inset-x-[20px] top-[22px] h-[10px] rounded-full bg-[#9fe8d5]" />
            )}
          </div>
        ))}
      </div>

      {isSeparate ? (
        <div className="absolute left-[344px] top-[42px] flex h-[304px] w-[138px] flex-col gap-[18px] rounded-[12px] border border-[#e2e8ee] bg-[#fbfdfc] p-[22px]">
          <div className="text-center text-[21px] font-medium text-[#5b6672]">答案页</div>
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-[74px] rounded-[7px] border border-[#c8d8ff] bg-[#eef4ff]">
              <span className="ml-[12px] mt-[10px] inline-block rounded bg-[#6f94f7] px-[8px] py-[5px] text-[15px] leading-none text-white">
                题{item}答案
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="absolute right-[42px] top-[42px] h-[304px] w-[148px] rounded-[12px] border border-[#e2e8ee] bg-[#fbfdfc] p-[20px]">
        <div className="text-center text-[21px] font-medium text-[#202124]">识别结果</div>
        <div className="mt-[34px] space-y-[18px]">
          <div className="h-[10px] rounded-full bg-[#9fe8d5]" />
          <div className="h-[10px] w-[72%] rounded-full bg-[#9fe8d5]" />
          {mode !== 'questions_only' ? (
            <>
              <div className="mt-[28px] h-[10px] rounded-full bg-[#b8cdfb]" />
              <div className="h-[10px] w-[62%] rounded-full bg-[#b8cdfb]" />
            </>
          ) : null}
        </div>
      </div>
      <div className="absolute bottom-[28px] left-1/2 w-[560px] -translate-x-1/2 whitespace-nowrap rounded-full bg-[#23bfb2] px-[28px] py-[12px] text-center text-[20px] font-medium leading-none text-white">
        左侧框选题目并选中后，点击「开始识别」
      </div>
    </div>
  );
}

function TabletConfirmDialog({
  action,
  onCancel,
  onConfirm,
  renderRequirementMarker,
}: {
  action: TabletConfirmAction;
  onCancel: () => void;
  onConfirm: () => void;
  renderRequirementMarker?: RequirementMarkerRenderer;
}) {
  if (!action) return null;

  const isClear = action === 'clear';
  const title = isClear ? '确认清空所有切题框吗？' : '当前操作将清空本次框选内容';
  const description = action === 'back'
    ? '返回上一步后，当前自动切题框和手动添加的识别框都不会保留。'
    : action === 'replace'
      ? '更换资料后，当前资料、框选内容和识别方式都需要重新选择。'
      : '';
  const confirmText = action === 'back'
    ? '确认返回'
    : isClear
      ? '确认清空'
      : '确认';

  return (
    <div className="absolute inset-0 z-50 bg-black/45">
      <section
        className="absolute left-1/2 top-1/2 h-[302px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-[18px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
        data-req-anchor="tablet-question-content-selection.confirm-dialog"
      >
        {renderRequirementMarker?.('TABLET_QUESTION_CONTENT_SELECTION-021', 'right-[18px] top-[18px]')}
        <div className={`absolute left-[40px] right-[40px] ${isClear ? 'top-1/2 -translate-y-1/2' : 'top-[42px]'}`}>
          <h3 className={`text-[28px] font-semibold leading-none text-[#202124] ${isClear ? 'text-center' : ''}`}>
            {title}
          </h3>
          {description ? (
            <p className="mt-[24px] text-[21px] leading-[32px] text-[#68727d]">
              {description}
            </p>
          ) : null}
        </div>
        <div className="absolute bottom-[30px] right-[32px] flex gap-[16px]">
          <button
            className="h-[48px] rounded-[8px] border border-[#d7dde3] bg-white px-[28px] text-[21px] leading-none text-[#3f4852] active:bg-[#f4f6f7]"
            onClick={onCancel}
            type="button"
          >
            取消
          </button>
          <button
            className="h-[48px] rounded-[8px] bg-[#e45454] px-[28px] text-[21px] font-medium leading-none text-white active:bg-[#d84242]"
            onClick={onConfirm}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </section>
    </div>
  );
}

function AddBoxModeTipDialog({
  mode,
  onCancel,
  onConfirm,
  onModeChange,
  renderRequirementMarker,
}: {
  mode: AddBoxInteractionMode;
  onCancel: () => void;
  onConfirm: () => void;
  onModeChange: (mode: AddBoxInteractionMode) => void;
  renderRequirementMarker?: RequirementMarkerRenderer;
}) {
  const options: Array<{
    description: string;
    label: string;
    value: AddBoxInteractionMode;
  }> = [
    {
      description: '按住资料上的题目区域拖动，松手后生成一个识别框。',
      label: '画线生成识别框',
      value: 'draw',
    },
    {
      description: '点击资料上的题目位置，系统在点击处生成默认大小的识别框。',
      label: '点击位置生成识别框',
      value: 'tap',
    },
  ];

  return (
    <div className="absolute inset-0 z-50 bg-black/45">
      <section
        className="absolute left-1/2 top-1/2 w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-[18px] bg-white px-[44px] py-[38px] shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
        data-req-anchor="tablet-question-content-selection.add-box-tip"
      >
        {renderRequirementMarker?.('TABLET_QUESTION_CONTENT_SELECTION-008', 'right-[58px] top-[18px]')}
        <button
          aria-label="关闭识别框添加提示"
          className="absolute right-[18px] top-[18px] flex h-[34px] w-[34px] items-center justify-center rounded-full text-[#68727d] active:bg-[#f3f5f6] active:text-[#202124]"
          onClick={onCancel}
          type="button"
        >
          <X className="h-[22px] w-[22px] stroke-[2.4]" />
        </button>
        <h3 className="text-[28px] font-semibold leading-none text-[#202124]">
          选择添加识别框的方式
        </h3>
        <div
          className="space-y-[18px]"
          data-req-anchor="tablet-question-content-selection.manual-box-interaction"
          style={{ marginTop: 56 }}
        >
          {renderRequirementMarker?.('TABLET_QUESTION_CONTENT_SELECTION-007', 'right-[-12px] top-[-12px]')}
          {options.map((option) => {
            const isSelected = mode === option.value;

            return (
              <button
                key={option.value}
                className={`flex w-full items-center gap-[18px] rounded-[12px] border px-[22px] py-[20px] text-left ${
                  isSelected
                    ? 'border-[#23bfb2] bg-[#e9fbf7]'
                    : 'border-[#dfe5ea] bg-white active:bg-[#f6f8f9]'
                }`}
                onClick={() => onModeChange(option.value)}
                type="button"
              >
                <span className={`flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full border-[2px] ${
                  isSelected ? 'border-[#23bfb2]' : 'border-[#c8d0d8]'
                }`}>
                  {isSelected ? <span className="h-[10px] w-[10px] rounded-full bg-[#23bfb2]" /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-[22px] font-semibold leading-none text-[#202124]">
                    {option.label}
                  </span>
                  <span className="mt-[12px] block text-[18px] leading-[28px] text-[#68727d]">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-[34px] flex justify-end">
          <button
            className="h-[48px] rounded-[8px] bg-[#23bfb2] px-[30px] text-[21px] font-medium leading-none text-white active:bg-[#12a99d]"
            onClick={onConfirm}
            type="button"
          >
            我知道了
          </button>
        </div>
      </section>
    </div>
  );
}

function getReviewQuestionTypeLabel(type: ReviewQuestionType) {
  return allReviewQuestionTypeOptions.find((option) => option.value === type)?.label || '问答题';
}

function buildPaperEditDataFromTabletReview(
  questions: ReviewQuestion[],
  materialPages: MaterialPage[],
  subject: string,
  mode: RecognitionMode,
  joinPaperMode: JoinPaperMode,
) {
  return {
    joinPaperMode,
    pageImages: materialPages.map((page) => ({
      data: page.imageData,
      fileName: page.name,
      sourceFileIndex: 0,
      pageNumber: page.pageNumber,
    })),
    questions: questions.map((question, index) => ({
      id: String(question.id),
      number: index + 1,
      questionType: getReviewQuestionTypeLabel(question.questionType),
      content: question.content || '',
      answer: mode === 'questions_only' ? '' : question.answer || '',
      analysis: mode === 'questions_only' ? '' : question.analysis || '',
      knowledgePoints: [],
      difficulty: '容易',
      croppedImageData: question.userCroppedImageData || question.croppedImageData || '',
      originalCroppedImageData: question.croppedImageData || '',
      optionCount: isChoiceLikeQuestionType(question.questionType) ? question.optionCount : 0,
      optionContents: isChoiceLikeQuestionType(question.questionType) ? question.optionContents || {} : {},
      blankCount: question.blankCount,
      blankAnswers: mode === 'questions_only' ? [] : question.blankAnswers || [],
      subQuestions: question.subQuestions.map((subQuestion, subIndex) => ({
        id: String(subQuestion.id),
        number: `${index + 1}.${subIndex + 1}`,
        questionType: getReviewQuestionTypeLabel(subQuestion.questionType),
        content: subQuestion.content || '',
        answer: mode === 'questions_only' ? '' : subQuestion.answer || '',
        analysis: mode === 'questions_only' ? '' : subQuestion.analysis || '',
        optionCount: isChoiceLikeQuestionType(subQuestion.questionType) ? subQuestion.optionCount : 0,
        optionContents: isChoiceLikeQuestionType(subQuestion.questionType) ? subQuestion.optionContents || {} : {},
        optionAnalyses: subQuestion.optionAnalyses || {},
        blankCount: subQuestion.blankCount || 1,
        blankAnswers: mode === 'questions_only' ? [] : subQuestion.blankAnswers || [],
      })),
    })),
    subjectInfo: subject || SINGLE_SUBJECT,
  };
}

function createInitialReviewQuestions(boxes: RecognitionBox[], displayMode: ReviewDisplayMode): ReviewQuestion[] {
  return boxes
    .filter((box) => box.selected)
    .sort((firstBox, secondBox) => firstBox.pageNumber - secondBox.pageNumber || firstBox.y - secondBox.y)
    .map((box) => ({
      id: box.id,
      pageNumber: box.pageNumber,
      crop: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      },
      questionType: 'short_answer',
      questionTypeStatus: 'pending',
      answer: '',
      analysis: '',
      blankAnswers: [''],
      content: '',
      optionContents: {},
      optionCount: 4,
      blankCount: 1,
      subQuestions: [],
      viewMode: displayMode,
    }));
}

function applyAiQuestionType(question: ReviewQuestion, matchedQuestion: ReviewAiMatchedQuestion | undefined): ReviewQuestion {
  if (!matchedQuestion) {
    return {
      ...question,
      questionTypeStatus: 'failed',
    };
  }

  const questionType = mapRecognizedQuestionType(matchedQuestion.questionType);
  const rawContent = formatRecognizedReviewContent(matchedQuestion.questionContent || matchedQuestion.content || question.content);
  const splitChoice = splitChoiceContent(rawContent);
  const aiSubQuestions = matchedQuestion.subQuestions && matchedQuestion.subQuestions.length > 0
    ? matchedQuestion.subQuestions.map((subQuestion, index) => {
        const subQuestionType = questionType === 'reading_comprehension'
          ? 'single_choice'
          : mapRecognizedQuestionType(subQuestion.questionType);
        return createReviewSubQuestion(question.id, index, subQuestionType, {
          ...subQuestion,
          analysis: null,
          answer: null,
          blankAnswers: undefined,
          optionAnalyses: {},
        });
      })
    : [];
  const contentSubQuestions = aiSubQuestions.length > 0
    ? aiSubQuestions
    : buildSubQuestionsFromContent(question.id, questionType, rawContent, matchedQuestion.blankCount || question.blankCount);
  const numberedSplit = isCompoundReviewQuestionType(questionType)
    ? splitNumberedSubQuestionSegments(rawContent)
    : null;
  const optionCount = getDefaultOptionCount(questionType, matchedQuestion.optionCount ?? splitChoice?.optionCount);
  const clozeSubQuestionCount = Math.max(
    1,
    matchedQuestion.blankCount || contentSubQuestions.length || question.blankCount,
  );

  return {
    ...question,
    answer: question.answer,
    analysis: question.analysis,
    content: isChoiceLikeQuestionType(questionType)
      ? (splitChoice?.stem || rawContent)
      : (numberedSplit?.parentContent || rawContent),
    blankCount: questionType === 'cloze' ? clozeSubQuestionCount : getDefaultBlankCount(questionType, matchedQuestion.blankCount),
    blankAnswers: createBlankAnswers(
      questionType === 'cloze' ? clozeSubQuestionCount : getDefaultBlankCount(questionType, matchedQuestion.blankCount),
      question.blankAnswers,
    ),
    optionContents: isChoiceLikeQuestionType(questionType)
      ? buildOptionContents(questionType, optionCount, matchedQuestion.optionContents || splitChoice?.optionContents || question.optionContents || {})
      : {},
    optionCount,
    questionType,
    questionTypeStatus: 'recognized',
    subQuestions: questionType === 'cloze'
      ? contentSubQuestions
      : canAddReviewSubQuestions(questionType)
        ? (contentSubQuestions.length > 0
            ? contentSubQuestions
            : question.subQuestions.length > 0
              ? question.subQuestions
              : [createReviewSubQuestion(question.id, 0, questionType === 'reading_comprehension' ? 'single_choice' : 'short_answer')])
        : [],
  };
}

function StepSegmentedControl({
  labels = {
    recognition: '识别',
    image: '图片',
  },
  mode,
  onChange,
}: {
  labels?: {
    recognition: string;
    image: string;
  };
  mode: ReviewDisplayMode;
  onChange: (mode: ReviewDisplayMode) => void;
}) {
  return (
    <div className="flex h-[42px] rounded-[8px] bg-[#eef1f3] p-[4px]">
      <button
        className={`h-[34px] rounded-[6px] px-[15px] text-[18px] font-medium leading-none ${
          mode === 'recognition' ? 'bg-white text-[#202124] shadow-sm' : 'text-[#68727d]'
        }`}
        onClick={() => onChange('recognition')}
        type="button"
      >
        {labels.recognition}
      </button>
      <button
        className={`h-[34px] rounded-[6px] px-[15px] text-[18px] font-medium leading-none ${
          mode === 'image' ? 'bg-white text-[#202124] shadow-sm' : 'text-[#68727d]'
        }`}
        onClick={() => onChange('image')}
        type="button"
      >
        {labels.image}
      </button>
    </div>
  );
}

function QuestionTypeSelect({
  options,
  status = 'recognized',
  value,
  onChange,
}: {
  options: Array<{ value: ReviewQuestionType; label: string }>;
  status?: QuestionTypeRecognitionStatus;
  value: ReviewQuestionType;
  onChange: (value: ReviewQuestionType) => void;
}) {
  const statusLabel = status === 'pending'
    ? '识别中'
    : status === 'stale'
      ? ''
      : status === 'failed'
        ? '识别失败'
        : '';
  const statusClassName = status === 'failed'
    ? 'border-[#f2a93b] text-[#d98712]'
    : statusLabel
      ? 'border-[#d7dde3] text-[#7b858f]'
      : 'border-[#26c9bc] text-[#16a69a]';

  return (
    <label className={`relative inline-flex h-[42px] min-w-[128px] items-center rounded-[7px] border bg-white pl-[14px] pr-[38px] text-[20px] font-medium leading-none ${
      statusClassName
    }`}>
      <select
        aria-label="题型"
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(event) => onChange(event.target.value as ReviewQuestionType)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span>{statusLabel || getReviewQuestionTypeLabel(value)}</span>
      <ChevronDown className="absolute right-[10px] top-1/2 h-[22px] w-[22px] -translate-y-1/2" />
    </label>
  );
}

function CountStepper({
  disabled = false,
  label,
  max = 12,
  min = 1,
  onChange,
  value,
}: {
  disabled?: boolean;
  label: string;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <div className="inline-flex h-[40px] items-center overflow-hidden rounded-[7px] border border-[#d7dde3] bg-white">
      <span className="px-[12px] text-[18px] leading-none text-[#68727d]">{label}</span>
      <button
        className="flex h-full w-[38px] items-center justify-center border-l border-[#d7dde3] text-[#69727c] active:bg-[#f3f5f6] disabled:text-[#c4cbd2]"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        type="button"
      >
        <Minus className="h-[18px] w-[18px]" />
      </button>
      <span className="flex h-full min-w-[44px] items-center justify-center border-l border-[#d7dde3] text-[20px] leading-none text-[#202124]">
        {value}
      </span>
      <button
        className="flex h-full w-[38px] items-center justify-center border-l border-[#d7dde3] text-[#69727c] active:bg-[#f3f5f6]"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        type="button"
      >
        <Plus className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

function AutoResizeTextarea({
  className,
  id,
  onBlur,
  onChange,
  onClick,
  onFocus,
  placeholder,
  readOnly = false,
  value,
}: {
  className: string;
  id?: string;
  onBlur?: () => void;
  onChange: (value: string) => void;
  onClick?: (event: ReactMouseEvent<HTMLTextAreaElement>) => void;
  onFocus?: () => void;
  placeholder?: string;
  readOnly?: boolean;
  value: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      className={className}
      id={id}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value)}
      onClick={onClick}
      onFocus={onFocus}
      placeholder={placeholder}
      readOnly={readOnly}
      ref={textareaRef}
      rows={1}
      value={value}
    />
  );
}

function CroppedQuestionImage({
  cropRegion,
  imageData,
  isEditing,
  onClick,
  onCropDragStart,
  onImageLoad,
}: {
  cropRegion: CropRegion | null;
  imageData: string | undefined;
  isEditing: boolean;
  onClick: () => void;
  onCropDragStart: (event: ReactPointerEvent, action: CropDragAction) => void;
  onImageLoad: (width: number, height: number) => void;
}) {
  if (!imageData) {
    return (
      <div
        className="flex h-[204px] w-full items-center justify-center rounded-[8px] border border-dashed border-[#d7dde3] bg-[#f8fafb] text-[20px] text-[#8b949e]"
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') onClick();
        }}
        role="button"
        tabIndex={0}
      >
        暂无题目图片
      </div>
    );
  }

  const cropHandleClass = 'absolute h-[14px] w-[14px] rounded-full border-[2px] border-[#2f80ed] bg-white shadow-[0_1px_5px_rgba(47,128,237,0.32)]';

  return (
    <div
      className="relative flex w-full justify-center rounded-[8px] border border-[#dfe4e8] bg-white px-[18px] py-[16px]"
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onClick();
      }}
      role="button"
      tabIndex={0}
    >
      <div className="relative max-w-full overflow-visible bg-white">
        <img
          alt=""
          className="block h-auto max-w-full"
          draggable={false}
          onLoad={(event) => {
            onImageLoad(event.currentTarget.clientWidth, event.currentTarget.clientHeight);
          }}
          src={imageData}
          style={{ width: REVIEW_QUESTION_IMAGE_MAX_WIDTH }}
        />
        {isEditing && cropRegion ? (
          <>
            <div className="pointer-events-none absolute inset-0 bg-black/28" />
            <div
              className="absolute cursor-move border-[2px] border-white shadow-[0_0_0_1px_rgba(47,128,237,0.9),0_8px_24px_rgba(0,0,0,0.16)]"
              onPointerDown={(event) => onCropDragStart(event, 'move')}
              style={{
                height: cropRegion.height,
                left: cropRegion.x,
                top: cropRegion.y,
                width: cropRegion.width,
              }}
            >
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-0 left-1/3 top-0 w-px bg-white/36" />
                <div className="absolute bottom-0 left-2/3 top-0 w-px bg-white/36" />
                <div className="absolute left-0 right-0 top-1/3 h-px bg-white/36" />
                <div className="absolute left-0 right-0 top-2/3 h-px bg-white/36" />
              </div>
              <div className={`${cropHandleClass} -left-[7px] -top-[7px] cursor-nw-resize`} onPointerDown={(event) => onCropDragStart(event, 'resize-nw')} />
              <div className={`${cropHandleClass} -right-[7px] -top-[7px] cursor-ne-resize`} onPointerDown={(event) => onCropDragStart(event, 'resize-ne')} />
              <div className={`${cropHandleClass} -bottom-[7px] -left-[7px] cursor-sw-resize`} onPointerDown={(event) => onCropDragStart(event, 'resize-sw')} />
              <div className={`${cropHandleClass} -bottom-[7px] -right-[7px] cursor-se-resize`} onPointerDown={(event) => onCropDragStart(event, 'resize-se')} />
              <div className="absolute -top-[5px] left-1/2 h-[10px] w-[28px] -translate-x-1/2 cursor-n-resize rounded-full border border-[#2f80ed] bg-white" onPointerDown={(event) => onCropDragStart(event, 'resize-n')} />
              <div className="absolute -bottom-[5px] left-1/2 h-[10px] w-[28px] -translate-x-1/2 cursor-s-resize rounded-full border border-[#2f80ed] bg-white" onPointerDown={(event) => onCropDragStart(event, 'resize-s')} />
              <div className="absolute -left-[5px] top-1/2 h-[28px] w-[10px] -translate-y-1/2 cursor-w-resize rounded-full border border-[#2f80ed] bg-white" onPointerDown={(event) => onCropDragStart(event, 'resize-w')} />
              <div className="absolute -right-[5px] top-1/2 h-[28px] w-[10px] -translate-y-1/2 cursor-e-resize rounded-full border border-[#2f80ed] bg-white" onPointerDown={(event) => onCropDragStart(event, 'resize-e')} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function AnswerConfigPanel({
  answerMode = false,
  onBlankCountChange,
  onDeleteSubQuestion,
  onInsertSubQuestion,
  onOptionCountChange,
  onSetClozeSubQuestionCount,
  onSubQuestionBlankCountChange,
  onSubQuestionOptionCountChange,
  onSubQuestionTypeChange,
  question,
  subject,
}: {
  answerMode?: boolean;
  onBlankCountChange: (value: number) => void;
  onDeleteSubQuestion: (subQuestionId: string) => void;
  onInsertSubQuestion?: (subQuestionId: string, placement: 'before' | 'after', questionType: ReviewQuestionType) => void;
  onOptionCountChange: (value: number) => void;
  onSetClozeSubQuestionCount: (value: number) => void;
  onSubQuestionBlankCountChange: (subQuestionId: string, value: number) => void;
  onSubQuestionOptionCountChange: (subQuestionId: string, value: number) => void;
  onSubQuestionTypeChange: (subQuestionId: string, value: ReviewQuestionType) => void;
  question: ReviewQuestion;
  subject: string;
}) {
  const [rowAddMenu, setRowAddMenu] = useState<ImageModeSubQuestionInsertMenu>(null);
  const [rowTypeMenuSubQuestionId, setRowTypeMenuSubQuestionId] = useState<string | null>(null);
  const isEnglishSubject = isEnglishSubjectName(subject);
  const questionTypeOptions = getReviewQuestionTypeOptions(subject);
  const subQuestionTypeOptions = questionTypeOptions.filter((option) => !canAddReviewSubQuestions(option.value, subject));

  if (question.questionType === 'single_choice' || question.questionType === 'multiple_choice') {
    return <CountStepper label="选项数" max={26} min={2} onChange={onOptionCountChange} value={question.optionCount} />;
  }

  if (question.questionType === 'fill_blank') {
    return <CountStepper label="空数" onChange={onBlankCountChange} value={question.blankCount} />;
  }

  if (isEnglishSubject && question.questionType === 'cloze') {
    return (
      <div className="inline-flex min-h-[54px] w-fit items-center rounded-[7px] bg-[#f3f4f5] px-[16px] py-[7px]">
        <CountStepper label="子题数" onChange={onSetClozeSubQuestionCount} value={question.blankCount} />
        <div className="mx-[16px] h-[28px] w-px bg-[#c9ced3]" />
        <div className="inline-flex h-[40px] items-center gap-[10px]">
          <span className="text-[18px] leading-none text-[#68727d]">题型：</span>
          <label className="relative inline-flex h-[40px] min-w-[100px] items-center rounded-[7px] border border-[#d7dde3] bg-[#eceff1] pl-[14px] pr-[36px] text-[20px] leading-none text-[#8b949e]">
            <span>单选</span>
            <ChevronDown className="absolute right-[10px] top-1/2 h-[22px] w-[22px] -translate-y-1/2 text-[#a5adb5]" />
          </label>
        </div>
        <div className="mx-[16px] h-[28px] w-px bg-[#c9ced3]" />
        <CountStepper label="选项数" max={26} min={2} onChange={onOptionCountChange} value={question.optionCount} />
      </div>
    );
  }

  if (canAddReviewSubQuestions(question.questionType, subject) && question.questionType !== 'cloze') {
    const isFixedSingleChoiceSubQuestion = isEnglishSubject && question.questionType === 'reading_comprehension';

    return (
      <div>
        {answerMode ? null : (
        <div className="grid justify-start gap-[16px]">
          {question.subQuestions.map((subQuestion, index) => (
            <div key={subQuestion.id} className="inline-flex min-h-[54px] w-fit items-center rounded-[7px] bg-[#f3f4f5] px-[16px] py-[7px]">
              <div className="relative">
                <button
                  aria-label="子题题型"
                  className={`inline-flex h-[40px] items-center gap-[12px] pr-[12px] text-[22px] leading-none ${
                    isFixedSingleChoiceSubQuestion ? 'text-[#6c737a]' : 'text-[#555b61] active:text-[#23bfb2]'
                  }`}
                  disabled={isFixedSingleChoiceSubQuestion}
                  onClick={(event) => {
                    event.stopPropagation();
                    setRowAddMenu(null);
                    setRowTypeMenuSubQuestionId((currentId) => (
                      currentId === subQuestion.id ? null : subQuestion.id
                    ));
                  }}
                  type="button"
                >
                  <span className="flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-full border border-[#7b8085] text-[22px] leading-none text-[#5c6166]">
                    {index + 1}
                  </span>
                  <span>{isFixedSingleChoiceSubQuestion ? '单选' : getReviewQuestionTypeLabel(subQuestion.questionType).replace('题', '')}</span>
                  {isFixedSingleChoiceSubQuestion ? null : (
                    <ChevronDown className="h-[24px] w-[24px] stroke-[2.4] text-[#555b61]" />
                  )}
                </button>
                {rowTypeMenuSubQuestionId === subQuestion.id && !isFixedSingleChoiceSubQuestion ? (
                  <div className="absolute left-[44px] top-[44px] z-50 w-[118px] overflow-hidden rounded-[8px] border border-[#e3e7eb] bg-white py-[6px] text-[18px] leading-none text-[#343a40] shadow-[0_16px_38px_rgba(31,44,58,0.18)]">
                    {subQuestionTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        className={`h-[42px] w-full whitespace-nowrap px-[18px] text-left active:bg-[#f3f5f6] ${
                          subQuestion.questionType === option.value ? 'text-[#23bfb2]' : ''
                        }`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onSubQuestionTypeChange(subQuestion.id, option.value);
                          setRowTypeMenuSubQuestionId(null);
                        }}
                        type="button"
                      >
                        {option.label.replace('题', '')}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              {subQuestion.questionType === 'single_choice' || subQuestion.questionType === 'multiple_choice' ? (
                <>
                  <div className="mx-[16px] h-[28px] w-px bg-[#c9ced3]" />
                  <CountStepper
                    label="选项数"
                    max={26}
                    min={2}
                    onChange={(value) => onSubQuestionOptionCountChange(subQuestion.id, value)}
                    value={subQuestion.optionCount}
                  />
                </>
              ) : null}
              {subQuestion.questionType === 'fill_blank' ? (
                <>
                  <div className="mx-[16px] h-[28px] w-px bg-[#c9ced3]" />
                  <CountStepper
                    label="空数"
                    onChange={(value) => onSubQuestionBlankCountChange(subQuestion.id, value)}
                    value={subQuestion.blankCount}
                  />
                </>
              ) : null}
              {onInsertSubQuestion ? (
                <div className="relative ml-[12px]">
                  <button
                    aria-label="添加子题"
                    className={`flex h-[34px] w-[34px] items-center justify-center rounded-full active:bg-[#e6faf7] ${
                      rowAddMenu?.subQuestionId === subQuestion.id ? 'text-[#23bfb2]' : 'text-[#7b8085]'
                    }`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setRowTypeMenuSubQuestionId(null);
                      setRowAddMenu((current) => (
                        current?.subQuestionId === subQuestion.id
                          ? null
                          : { questionId: question.id, subQuestionId: subQuestion.id }
                      ));
                    }}
                    type="button"
                  >
                    <CirclePlus className="h-[19px] w-[19px] stroke-[2.4]" />
                  </button>
                  {rowAddMenu?.subQuestionId === subQuestion.id ? (
                    <div className="absolute left-[36px] top-[30px] z-40 flex items-start rounded-[8px] text-[18px] leading-none text-[#343a40] shadow-[0_16px_38px_rgba(31,44,58,0.18)]">
                      <div className="w-[186px] overflow-hidden rounded-[8px] border border-[#e3e7eb] bg-white py-[6px]">
                        {[
                          { value: 'before' as const, label: '在上方添加子题' },
                          { value: 'after' as const, label: '在下方添加子题' },
                        ].map((item) => (
                          <button
                            key={item.value}
                            className={`flex h-[44px] w-full items-center justify-between gap-[8px] whitespace-nowrap px-[18px] text-left active:bg-[#f3f5f6] ${
                              rowAddMenu.placement === item.value ? 'text-[#23bfb2]' : ''
                            }`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setRowAddMenu({ questionId: question.id, subQuestionId: subQuestion.id, placement: item.value });
                            }}
                            type="button"
                          >
                            <span>{item.label}</span>
                            <ChevronDown className="h-[18px] w-[18px] -rotate-90 stroke-[2.4]" />
                          </button>
                        ))}
                      </div>
                      {rowAddMenu.placement ? (
                        <div className="ml-[4px] w-[92px] overflow-hidden rounded-[8px] border border-[#e3e7eb] bg-white py-[6px]">
                          {subQuestionTypeOptions.map((option) => (
                            <button
                              key={option.value}
                              className="h-[42px] w-full whitespace-nowrap px-[18px] text-left active:bg-[#f3f5f6]"
                              onClick={(event) => {
                                event.stopPropagation();
                                onInsertSubQuestion(subQuestion.id, rowAddMenu.placement!, option.value);
                                setRowAddMenu(null);
                              }}
                              type="button"
                            >
                              {option.label.replace('题', '')}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {question.subQuestions.length > 1 ? (
                <button
                  aria-label="删除子题"
                  className="ml-[8px] flex h-[34px] w-[34px] items-center justify-center rounded-full text-[#7b8085] active:bg-[#eceff1] active:text-[#d84a4a]"
                  onClick={() => onDeleteSubQuestion(subQuestion.id)}
                  type="button"
                >
                  <Trash2 className="h-[20px] w-[20px]" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
        )}
      </div>
    );
  }

  return null;
}

function TabletOcrQuestionReviewPage({
  boxes,
  initialQuestions,
  materialPages,
  mode,
  onBackToSelection,
  onExit,
  renderRequirementMarker,
  subject,
}: {
  boxes: RecognitionBox[];
  initialQuestions?: ReviewQuestion[];
  materialPages: MaterialPage[];
  mode: RecognitionMode;
  onBackToSelection: () => void;
  onExit: () => void;
  renderRequirementMarker?: RequirementMarkerRenderer;
  subject: string;
}) {
  const router = useRouter();
  const initialSelectedBoxes = boxes
    .filter((box) => box.selected)
    .sort((firstBox, secondBox) => firstBox.pageNumber - secondBox.pageNumber || firstBox.y - secondBox.y);
  const initialReviewBoxes = initialSelectedBoxes.map((box) => ({ ...box, selected: false }));
  const hasInitialQuestions = Boolean(initialQuestions?.length);
  const [globalMode, setGlobalMode] = useState<ReviewDisplayMode>('recognition');
  const [reviewBoxes, setReviewBoxes] = useState<RecognitionBox[]>(initialReviewBoxes);
  const [questions, setQuestions] = useState<ReviewQuestion[]>(() => (
    initialQuestions?.length
      ? initialQuestions.map((question) => ({ ...question }))
      : createInitialReviewQuestions(initialSelectedBoxes, 'recognition')
  ));
  const [activeQuestionId, setActiveQuestionId] = useState('');
  const [openMenuQuestionId, setOpenMenuQuestionId] = useState<string | null>(null);
  const [recognitionAddSubMenu, setRecognitionAddSubMenu] = useState<{
    questionId: string;
    subQuestionId: string;
    afterIndex: number;
    placement?: 'before' | 'after';
  } | null>(null);
  const [imageModeAddSubMenu, setImageModeAddSubMenu] = useState<ImageModeSubQuestionInsertMenu>(null);
  const [imageModeTypeMenu, setImageModeTypeMenu] = useState<{ questionId: string; subQuestionId: string } | null>(null);
  const [pendingSubQuestionDeletion, setPendingSubQuestionDeletion] = useState<PendingSubQuestionDeletion>(null);
  const [manualLinkTarget, setManualLinkTarget] = useState<TabletManualLinkTarget | null>(null);
  const [manualLinkProcessingTarget, setManualLinkProcessingTarget] = useState<TabletManualLinkTarget | null>(null);
  const [precisionRecognitionBox, setPrecisionRecognitionBox] = useState<RecognitionBox | null>(null);
  const [editingCropQuestionId, setEditingCropQuestionId] = useState<string | null>(null);
  const [recognitionStatus, setRecognitionStatus] = useState<'idle' | 'recognizing' | 'done' | 'failed'>(hasInitialQuestions ? 'done' : 'idle');
  const [answerMatchStatus, setAnswerMatchStatus] = useState<'idle' | 'matching' | 'done' | 'failed'>(hasInitialQuestions ? 'done' : 'idle');
  const [recognitionMessage, setRecognitionMessage] = useState('正在准备识别题型...');
  const [answerMatchMessage, setAnswerMatchMessage] = useState('');
  const [pendingReviewBoxIds, setPendingReviewBoxIds] = useState<Set<string>>(new Set());
  const [recognizingReviewBoxIds, setRecognizingReviewBoxIds] = useState<Set<string>>(new Set());
  const [isReviewAddBoxMode, setIsReviewAddBoxMode] = useState(false);
  const [focusedStemEditorId, setFocusedStemEditorId] = useState<string | null>(null);
  const [reviewDrawingBoxDraft, setReviewDrawingBoxDraft] = useState<DrawingBoxDraft | null>(null);
  const [showJoinMissingDialog, setShowJoinMissingDialog] = useState(false);
  const [showJoinEmptyStemDialog, setShowJoinEmptyStemDialog] = useState(false);
  const [showJoinEditingDialog, setShowJoinEditingDialog] = useState(false);
  const [showJoinModeDialog, setShowJoinModeDialog] = useState(false);
  const [joinPaperMode, setJoinPaperMode] = useState<JoinPaperMode>('by_order');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [reviewBoxDrag, setReviewBoxDrag] = useState<{
    id: string;
    action: 'move' | 'resize';
    startClientX: number;
    startClientY: number;
    startBox: RecognitionBox;
    containerRect: DOMRect;
  } | null>(null);
  const [cropRegion, setCropRegion] = useState<CropRegion | null>(null);
  const [cropDrag, setCropDrag] = useState<{
    action: CropDragAction;
    startClientX: number;
    startClientY: number;
    startRegion: CropRegion;
  } | null>(null);
  const leftBoxRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const reviewPageWrapRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const imageDisplaySizesRef = useRef<Map<string, { width: number; height: number }>>(new Map());
  const hasDraggedCropRef = useRef(false);
  const hasMovedReviewBoxRef = useRef(false);
  const recognitionStartedRef = useRef(hasInitialQuestions);
  const answerMatchStartedRef = useRef(hasInitialQuestions);
  const toastTimerRef = useRef<number | null>(null);
  const validQuestionTypes = getValidQuestionTypes(subject || '');
  const reviewQuestionTypeOptions = getReviewQuestionTypeOptions(subject);
  const shouldShowAnswerAnalysis = mode !== 'questions_only';
  const [toastMessage, setToastMessage] = useState('');
  const renderReviewImageRequirementMarker: RequirementMarkerRenderer = (
    requirementId,
    className,
    displayNumber,
  ) => {
    if (mode !== 'questions_only' || globalMode !== 'image') {
      return null;
    }

    return renderRequirementMarker?.(requirementId, className, displayNumber) ?? null;
  };
  const renderReviewRecognitionRequirementMarker: RequirementMarkerRenderer = (
    requirementId,
    className,
    displayNumber,
  ) => {
    if (mode !== 'questions_only') {
      return null;
    }

    return renderRequirementMarker?.(requirementId, className, displayNumber) ?? null;
  };
  const renderReviewQaImageRequirementMarker: RequirementMarkerRenderer = (
    requirementId,
    className,
    displayNumber,
  ) => {
    if (mode === 'questions_only' || globalMode !== 'image') {
      return null;
    }

    return renderRequirementMarker?.(requirementId, className, displayNumber) ?? null;
  };
  const renderReviewQaRecognitionRequirementMarker: RequirementMarkerRenderer = (
    requirementId,
    className,
    displayNumber,
  ) => {
    if (mode === 'questions_only' || globalMode !== 'recognition') {
      return null;
    }

    return renderRequirementMarker?.(requirementId, className, displayNumber) ?? null;
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage('');
      toastTimerRef.current = null;
    }, 1800);
  };

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => {
    setQuestions((currentQuestions) => {
      let changed = false;
      const nextQuestions = currentQuestions.map((question) => {
        if (!canAddReviewSubQuestions(question.questionType, subject) || question.subQuestions.length > 0) {
          return question;
        }

        changed = true;
        const subQuestionType = question.questionType === 'cloze' || question.questionType === 'reading_comprehension'
          ? 'single_choice'
          : 'short_answer';

        return {
          ...question,
          blankCount: question.questionType === 'cloze' ? 1 : question.blankCount,
          subQuestions: [createReviewSubQuestion(question.id, 0, subQuestionType, {
            optionCount: getDefaultOptionCount(subQuestionType),
          })],
        };
      });

      return changed ? nextQuestions : currentQuestions;
    });
  }, [questions, subject]);

  const hasMissingAnswerOrAnalysis = (question: ReviewQuestion) => {
    if (!shouldShowAnswerAnalysis) return false;
    if (isQuestionResultLoading(question) || question.questionTypeStatus === 'failed') return false;

    const isEnglishCloze = isEnglishSubjectName(subject) && question.questionType === 'cloze';
    if (question.subQuestions.length > 0) {
      const hasMissingSubQuestion = question.subQuestions.some((subQuestion) => (
        !hasQuestionAnswer(subQuestion) || (!isEnglishCloze && !isUsableText(subQuestion.analysis))
      ));
      return hasMissingSubQuestion || (isEnglishCloze && !isUsableText(question.analysis));
    }

    return !hasQuestionAnswer(question) || !isUsableText(question.analysis);
  };

  const hasEmptyQuestionStem = (question: ReviewQuestion) => {
    if (isQuestionResultLoading(question) || question.questionTypeStatus === 'failed') return false;
    if (!isUsableText(question.content)) return true;
    if (question.questionType !== 'cloze' && canAddReviewSubQuestions(question.questionType, subject)) {
      return question.subQuestions.some((subQuestion) => !isUsableText(subQuestion.content));
    }
    return false;
  };

  const requestAiQuestionTypes = async (questionSnapshot: ReviewQuestion[]) => {
    const response = await fetch('/api/recognize-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        croppedMode: true,
        subjectInfo: subject,
        pages: questionSnapshot.map((question, index) => ({
          pageNumber: index + 1,
          imageData: question.croppedImageData,
          width: question.croppedImageWidth || 1,
          height: question.croppedImageHeight || 1,
        })),
        userBoxes: questionSnapshot.map((question, index) => ({
          id: question.id,
          x: 0,
          y: 0,
          width: question.croppedImageWidth || 1,
          height: question.croppedImageHeight || 1,
          isSelected: true,
          pageNumber: index + 1,
          type: 'question',
        })),
        options: {
          validQuestionTypes,
        },
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error('AI 识别请求失败');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const eventText of events) {
        const dataLine = eventText.split('\n').find((line) => line.startsWith('data:'));
        if (!dataLine) continue;

        const event = JSON.parse(dataLine.replace(/^data:\s*/, '')) as {
          type?: string;
          data?: {
            message?: string;
            error?: string;
            result?: {
              matchedQuestions?: ReviewAiMatchedQuestion[];
            };
          };
        };

        if (event.type === 'progress' && event.data?.message) {
          setRecognitionMessage(event.data.message);
        }

        if (event.type === 'error') {
          throw new Error(event.data?.error || 'AI 识别失败');
        }

        if (event.type === 'complete') {
          return event.data?.result?.matchedQuestions || [];
        }
      }

      if (done) break;
    }

    return [];
  };

  const requestGlobalAnswerMatches = async (questionSnapshot: ReviewQuestion[]) => {
    const questionIdByMatchId = new Map<number, string>();
    const existingQuestions = questionSnapshot.map((question, index) => {
      const matchId = index + 1;
      questionIdByMatchId.set(matchId, question.id);
      return {
        id: matchId,
        number: index + 1,
        content: question.content || '',
        questionType: getReviewQuestionTypeLabel(question.questionType),
        hasAnswer: false,
        subQuestions: question.subQuestions.map((subQuestion, subIndex) => ({
          id: subIndex + 1,
          number: subIndex + 1,
          content: subQuestion.content || '',
          questionType: getReviewQuestionTypeLabel(subQuestion.questionType),
          hasAnswer: false,
        })),
      };
    });
    const pagesForMatch = mode === 'separate_answer'
      ? materialPages.filter((page) => page.role === 'answer')
      : materialPages;
    const sourcePages = pagesForMatch.length > 0 ? pagesForMatch : materialPages;

    const response = await fetch('/api/recognize-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        existingQuestions,
        globalMatch: true,
        pages: sourcePages.map((page) => ({
          pageNumber: page.pageNumber,
          imageData: page.imageData,
          width: page.naturalWidth,
          height: page.naturalHeight,
          sourceFileIndex: page.pageNumber - 1,
        })),
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error('答案解析匹配请求失败');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const eventText of events) {
        const dataLine = eventText.split('\n').find((line) => line.startsWith('data:'));
        if (!dataLine) continue;

        const event = JSON.parse(dataLine.replace(/^data:\s*/, '')) as {
          type?: string;
          data?: {
            message?: string;
            error?: string;
            result?: {
              globalMatches?: Array<{ questionId: number; answer?: string; analysis?: string }>;
            };
          };
        };

        if (event.type === 'progress' && event.data?.message) {
          setAnswerMatchMessage(event.data.message);
        }

        if (event.type === 'error') {
          throw new Error(event.data?.error || '答案解析匹配失败');
        }

        if (event.type === 'complete') {
          return (event.data?.result?.globalMatches || []).map((match) => ({
            ...match,
            questionId: questionIdByMatchId.get(match.questionId) || '',
          })).filter((match) => match.questionId);
        }
      }

      if (done) break;
    }

    return [];
  };

  useEffect(() => {
    let cancelled = false;
    const pageByNumberForCrop = new Map(materialPages.map((page) => [page.pageNumber, page]));

    async function buildCroppedImages() {
      const missingQuestions = questions.filter((question) => !question.croppedImageData);
      if (missingQuestions.length === 0) return;

      const croppedEntries = await Promise.all(missingQuestions.map(async (question) => {
        const page = pageByNumberForCrop.get(question.pageNumber);
        if (!page) return null;

        const cropped = await cropMaterialQuestionImage(page, question.crop);
        return {
          id: question.id,
          imageData: cropped.imageData,
          height: cropped.height,
          width: cropped.width,
        };
      }));

      if (cancelled) return;

      setQuestions((currentQuestions) => currentQuestions.map((question) => {
        const croppedEntry = croppedEntries.find((entry) => entry?.id === question.id);
        return croppedEntry ? {
          ...question,
          croppedImageData: croppedEntry.imageData,
          croppedImageHeight: croppedEntry.height,
          croppedImageWidth: croppedEntry.width,
        } : question;
      }));
    }

    void buildCroppedImages();

    return () => {
      cancelled = true;
    };
  }, [materialPages, questions]);

  useEffect(() => {
    if (recognitionStartedRef.current) return undefined;
    if (questions.length === 0 || questions.some((question) => !question.croppedImageData)) return undefined;

    recognitionStartedRef.current = true;
    const questionSnapshot = questions;

    async function recognizeQuestionTypes() {
      setRecognitionStatus('recognizing');
      setRecognitionMessage(`正在识别 ${questionSnapshot.length} 个区域...`);
      setRecognizingReviewBoxIds(new Set(questionSnapshot.map((question) => question.id)));
      setQuestions((currentQuestions) => currentQuestions.map((question) => ({
        ...question,
        questionTypeStatus: question.questionTypeStatus === 'manual' ? 'manual' : 'pending',
      })));

      try {
        const matchedQuestions = await requestAiQuestionTypes(questionSnapshot);
        setQuestions((currentQuestions) => currentQuestions.map((question) => {
          const matchedQuestion = matchedQuestions.find((item) => item.questionBoxId === question.id);
          return applyAiQuestionType(question, matchedQuestion);
        }));
        setRecognitionStatus('done');
        setRecognitionMessage('');
        if (!shouldShowAnswerAnalysis) {
          setRecognizingReviewBoxIds(new Set());
        }
      } catch (error) {
        console.error('[TabletOCR] question type recognition failed:', error);
        setQuestions((currentQuestions) => currentQuestions.map((question) => (
          question.questionTypeStatus === 'pending' ? { ...question, questionTypeStatus: 'failed' } : question
        )));
        setRecognizingReviewBoxIds(new Set());
        setRecognitionStatus('failed');
        setRecognitionMessage('AI 题型识别失败，请手动核对题型');
      }
    }

    void recognizeQuestionTypes();

    return undefined;
  }, [questions, shouldShowAnswerAnalysis, subject]);

  useEffect(() => {
    if (!shouldShowAnswerAnalysis || answerMatchStartedRef.current) return undefined;
    if (recognitionStatus !== 'done' || questions.length === 0) return undefined;

    answerMatchStartedRef.current = true;
    const questionSnapshot = questions;

    async function matchAnswers() {
      setAnswerMatchStatus('matching');
      setAnswerMatchMessage(`正在匹配 ${questionSnapshot.length} 道题的答案解析...`);
      try {
        const matches = await requestGlobalAnswerMatches(questionSnapshot);
        setQuestions((currentQuestions) => currentQuestions.map((question) => {
          const match = matches.find((item) => item.questionId === question.id);
          return match ? mergeAnswerToReviewQuestion(question, match.answer || '', match.analysis || '') : question;
        }));
        setAnswerMatchStatus('done');
        setAnswerMatchMessage('');
        setRecognizingReviewBoxIds(new Set());
      } catch (error) {
        console.error('[TabletOCR] answer global match failed:', error);
        setRecognizingReviewBoxIds(new Set());
        setAnswerMatchStatus('failed');
        setAnswerMatchMessage('答案解析自动匹配失败，可手动关联补充');
      }
    }

    void matchAnswers();
    return undefined;
  }, [questions, recognitionStatus, shouldShowAnswerAnalysis]);

  useEffect(() => {
    if (!cropDrag) return undefined;

    const handlePointerMove = (event: PointerEvent) => {
      const size = editingCropQuestionId ? imageDisplaySizesRef.current.get(editingCropQuestionId) : null;
      if (!size) return;

      const dx = event.clientX - cropDrag.startClientX;
      const dy = event.clientY - cropDrag.startClientY;
      const minSize = 30;
      let nextX = cropDrag.startRegion.x;
      let nextY = cropDrag.startRegion.y;
      let nextWidth = cropDrag.startRegion.width;
      let nextHeight = cropDrag.startRegion.height;

      if (Math.abs(event.clientX - cropDrag.startClientX) > 3 || Math.abs(event.clientY - cropDrag.startClientY) > 3) {
        hasDraggedCropRef.current = true;
      }

      switch (cropDrag.action) {
        case 'move':
          nextX = clampPercent(cropDrag.startRegion.x + dx, 0, size.width - nextWidth);
          nextY = clampPercent(cropDrag.startRegion.y + dy, 0, size.height - nextHeight);
          break;
        case 'resize-nw':
          nextWidth = Math.max(minSize, cropDrag.startRegion.width - dx);
          nextHeight = Math.max(minSize, cropDrag.startRegion.height - dy);
          nextX = cropDrag.startRegion.x + (cropDrag.startRegion.width - nextWidth);
          nextY = cropDrag.startRegion.y + (cropDrag.startRegion.height - nextHeight);
          break;
        case 'resize-ne':
          nextWidth = Math.max(minSize, cropDrag.startRegion.width + dx);
          nextHeight = Math.max(minSize, cropDrag.startRegion.height - dy);
          nextY = cropDrag.startRegion.y + (cropDrag.startRegion.height - nextHeight);
          break;
        case 'resize-sw':
          nextWidth = Math.max(minSize, cropDrag.startRegion.width - dx);
          nextHeight = Math.max(minSize, cropDrag.startRegion.height + dy);
          nextX = cropDrag.startRegion.x + (cropDrag.startRegion.width - nextWidth);
          break;
        case 'resize-se':
          nextWidth = Math.max(minSize, cropDrag.startRegion.width + dx);
          nextHeight = Math.max(minSize, cropDrag.startRegion.height + dy);
          break;
        case 'resize-n':
          nextHeight = Math.max(minSize, cropDrag.startRegion.height - dy);
          nextY = cropDrag.startRegion.y + (cropDrag.startRegion.height - nextHeight);
          break;
        case 'resize-s':
          nextHeight = Math.max(minSize, cropDrag.startRegion.height + dy);
          break;
        case 'resize-w':
          nextWidth = Math.max(minSize, cropDrag.startRegion.width - dx);
          nextX = cropDrag.startRegion.x + (cropDrag.startRegion.width - nextWidth);
          break;
        case 'resize-e':
          nextWidth = Math.max(minSize, cropDrag.startRegion.width + dx);
          break;
      }

      nextX = clampPercent(nextX, 0, size.width - minSize);
      nextY = clampPercent(nextY, 0, size.height - minSize);
      nextWidth = clampPercent(nextWidth, minSize, size.width - nextX);
      nextHeight = clampPercent(nextHeight, minSize, size.height - nextY);

      setCropRegion({
        height: Math.round(nextHeight),
        width: Math.round(nextWidth),
        x: Math.round(nextX),
        y: Math.round(nextY),
      });
    };
    const handlePointerUp = () => setCropDrag(null);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [cropDrag]);

  useEffect(() => {
    if (!reviewBoxDrag) return undefined;

    const handlePointerMove = (event: PointerEvent) => {
      const dx = ((event.clientX - reviewBoxDrag.startClientX) / reviewBoxDrag.containerRect.width) * 100;
      const dy = ((event.clientY - reviewBoxDrag.startClientY) / reviewBoxDrag.containerRect.height) * 100;
      if (
        Math.abs(event.clientX - reviewBoxDrag.startClientX) > 3 ||
        Math.abs(event.clientY - reviewBoxDrag.startClientY) > 3
      ) {
        hasMovedReviewBoxRef.current = true;
      }

      setReviewBoxes((currentBoxes) => currentBoxes.map((box) => {
        if (box.id !== reviewBoxDrag.id) return box;

        if (reviewBoxDrag.action === 'move') {
          return {
            ...box,
            x: clampPercent(reviewBoxDrag.startBox.x + dx, 0, 100 - reviewBoxDrag.startBox.width),
            y: clampPercent(reviewBoxDrag.startBox.y + dy, 0, 100 - reviewBoxDrag.startBox.height),
          };
        }

        return {
          ...box,
          width: clampPercent(reviewBoxDrag.startBox.width + dx, 5, 100 - reviewBoxDrag.startBox.x),
          height: clampPercent(reviewBoxDrag.startBox.height + dy, 3, 100 - reviewBoxDrag.startBox.y),
        };
      }));
      setPrecisionRecognitionBox((currentBox) => {
        if (!currentBox || currentBox.id !== reviewBoxDrag.id) return currentBox;

        if (reviewBoxDrag.action === 'move') {
          return {
            ...currentBox,
            x: clampPercent(reviewBoxDrag.startBox.x + dx, 0, 100 - reviewBoxDrag.startBox.width),
            y: clampPercent(reviewBoxDrag.startBox.y + dy, 0, 100 - reviewBoxDrag.startBox.height),
          };
        }

        return {
          ...currentBox,
          width: clampPercent(reviewBoxDrag.startBox.width + dx, 5, 100 - reviewBoxDrag.startBox.x),
          height: clampPercent(reviewBoxDrag.startBox.height + dy, 3, 100 - reviewBoxDrag.startBox.y),
        };
      });
    };

    const handlePointerUp = () => {
      const changedBoxId = reviewBoxDrag.id;
      setReviewBoxDrag(null);
      if (hasMovedReviewBoxRef.current && changedBoxId !== precisionRecognitionBox?.id) {
        setReviewBoxes((currentBoxes) => currentBoxes.map((box) => (
          box.id === changedBoxId ? { ...box, selected: true } : box
        )));
        setPendingReviewBoxIds((currentIds) => {
          const nextIds = new Set(currentIds);
          nextIds.add(changedBoxId);
          return nextIds;
        });
        setQuestions((currentQuestions) => currentQuestions.map((question) => (
          question.id === changedBoxId ? { ...question, questionTypeStatus: 'stale' } : question
        )));
      }
      window.setTimeout(() => {
        hasMovedReviewBoxRef.current = false;
      }, 0);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [precisionRecognitionBox?.id, reviewBoxDrag]);

  useEffect(() => {
    if (!reviewDrawingBoxDraft) return undefined;

    const containerRect = reviewPageWrapRefs.current[reviewDrawingBoxDraft.pageNumber]?.getBoundingClientRect();
    if (!containerRect) return undefined;

    const handlePointerMove = (event: PointerEvent) => {
      const point = getPointerPercent(containerRect, event.clientX, event.clientY);
      setReviewDrawingBoxDraft((currentDraft) => (
        currentDraft
          ? { ...currentDraft, clientX: event.clientX, clientY: event.clientY, currentX: point.x, currentY: point.y }
          : currentDraft
      ));
    };

    const handlePointerUp = () => {
      const box = getBoxFromDrawingDraft(reviewDrawingBoxDraft);
      if (box.width >= 3 && box.height >= 2) {
        if (reviewDrawingBoxDraft.intent === 'precision') {
          setPrecisionRecognitionBox({
            id: `precision-recognition-${Date.now()}`,
            pageNumber: reviewDrawingBoxDraft.pageNumber,
            x: box.x,
            y: box.y,
            width: Math.max(5, box.width),
            height: Math.max(3, box.height),
            selected: true,
            source: 'manual',
          });
        } else {
          const boxId = `review-manual-${Date.now()}`;
          setReviewBoxes((currentBoxes) => [
            ...currentBoxes,
            {
              id: boxId,
              pageNumber: reviewDrawingBoxDraft.pageNumber,
              x: box.x,
              y: box.y,
              width: Math.max(5, box.width),
              height: Math.max(3, box.height),
              selected: true,
              source: 'manual',
            },
          ]);
          setPendingReviewBoxIds((currentIds) => {
            const nextIds = new Set(currentIds);
            nextIds.add(boxId);
            return nextIds;
          });
        }
      }
      setReviewDrawingBoxDraft(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [reviewDrawingBoxDraft]);

  const scrollLeftToQuestion = (questionId: string) => {
    window.setTimeout(() => {
      leftBoxRefs.current[questionId]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 0);
  };

  const handleSelectQuestion = (questionId: string) => {
    if (activeQuestionId === questionId) {
      setActiveQuestionId('');
      return;
    }

    setActiveQuestionId(questionId);
    scrollLeftToQuestion(questionId);
  };

  const updateQuestion = (questionId: string, updater: (question: ReviewQuestion) => ReviewQuestion) => {
    setQuestions((currentQuestions) => currentQuestions.map((question) => (
      question.id === questionId ? updater(question) : question
    )));
  };

  const insertBlankIntoStemEditor = (
    editorId: string,
    value: string,
    onChange: (value: string) => void,
    onBlankInsert?: (nextValue: string, insertStart: number) => void,
  ) => {
    const textarea = document.getElementById(editorId) as HTMLTextAreaElement | null;
    const insertText = '____';
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const nextValue = `${value.slice(0, start)}${insertText}${value.slice(end)}`;

    if (onBlankInsert) onBlankInsert(nextValue, start);
    else onChange(nextValue);
    window.requestAnimationFrame(() => {
      const nextTextarea = document.getElementById(editorId) as HTMLTextAreaElement | null;
      nextTextarea?.focus();
      nextTextarea?.setSelectionRange(start + insertText.length, start + insertText.length);
    });
  };

  const renderFillBlankStemDisplay = (content: string | undefined) => {
    const value = content || '';
    const tokens = getInlineBlankTokens(value);

    if (tokens.length === 0) {
      return value || '题干';
    }

    const parts: React.ReactNode[] = [];
    let cursor = 0;

    tokens.forEach((token, index) => {
      if (token.start > cursor) {
        parts.push(value.slice(cursor, token.start));
      }
      parts.push(
        <span key={`blank-${token.start}-${index}`} className="relative mx-[6px] inline-block h-[30px] w-[62px] translate-y-[7px] align-baseline text-[#16a69a]">
          <span className="absolute left-1/2 top-0 flex h-[22px] min-w-[22px] -translate-x-1/2 items-center justify-center rounded-full border border-[#16a69a] px-[4px] text-[16px] font-medium leading-none">
            {index + 1}
          </span>
          <span className="absolute bottom-[4px] left-0 h-[2px] w-full rounded-full bg-[#16a69a]" />
        </span>,
      );
      cursor = token.end;
    });

    if (cursor < value.length) {
      parts.push(value.slice(cursor));
    }

    return parts;
  };

  const renderFillBlankStemPreview = (content: string | undefined) => (
    <div className="min-h-[64px] w-full whitespace-pre-wrap rounded-[6px] border border-[#d7dde3] bg-white px-[16px] py-[12px] text-[20px] leading-[1.55] text-[#2f363d]">
      {renderFillBlankStemDisplay(content)}
    </div>
  );

  const renderFillBlankStemEditor = (
    value: string,
    onChange: (value: string) => void,
    isProcessing: boolean,
    loadingLabel: string,
    options: {
      editorId: string;
      readOnly?: boolean;
      onBlankInsert?: (nextValue: string, insertStart: number) => void;
    },
  ) => {
    if (isProcessing) return renderFieldLoading(loadingLabel);
    if (options.readOnly) return renderFillBlankStemPreview(value);

    const showToolbar = focusedStemEditorId === options.editorId;

    return (
      <div>
        {showToolbar ? (
          <div className="mb-[7px] inline-flex h-[38px] items-center gap-[3px] rounded-[7px] border border-[#d9dee3] bg-[#f1f3f4] px-[6px] text-[17px] text-[#5c646d] shadow-[0_6px_16px_rgba(31,44,58,0.08)]" onClick={(event) => event.stopPropagation()}>
            <button className="flex h-[28px] w-[28px] items-center justify-center rounded-[5px] font-semibold active:bg-white" type="button">B</button>
            <button className="flex h-[28px] w-[28px] items-center justify-center rounded-[5px] italic active:bg-white" type="button">I</button>
            <button className="flex h-[28px] w-[28px] items-center justify-center rounded-[5px] underline active:bg-white" type="button">U</button>
            <div className="mx-[4px] h-[22px] w-px bg-[#d0d6dc]" />
            <button
              aria-label="挖空"
              className="flex h-[28px] w-[32px] items-center justify-center rounded-[5px] active:bg-white"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insertBlankIntoStemEditor(options.editorId, value, onChange, options.onBlankInsert)}
              type="button"
            >
              <span className="h-[11px] w-[20px] rounded-b-[3px] border-b-[3px] border-l-[3px] border-r-[3px] border-[#59616a]" />
            </button>
          </div>
        ) : null}
        <div className="relative">
          <div className="pointer-events-none min-h-[64px] w-full whitespace-pre-wrap rounded-[6px] border border-[#d7dde3] bg-white px-[16px] py-[12px] text-[20px] leading-[1.55] text-[#2f363d]">
            {renderFillBlankStemDisplay(value)}
          </div>
          <AutoResizeTextarea
            aria-label="题干"
            className="absolute inset-0 min-h-[64px] w-full resize-none overflow-hidden rounded-[6px] border border-transparent bg-transparent px-[16px] py-[12px] text-[20px] leading-[1.55] text-transparent caret-[#16a69a] outline-none focus:border-[#23bfb2]"
            id={options.editorId}
            onBlur={() => window.setTimeout(() => {
              setFocusedStemEditorId((currentId) => (currentId === options.editorId ? null : currentId));
            }, 120)}
            onChange={onChange}
            onClick={(event) => event.stopPropagation()}
            onFocus={() => setFocusedStemEditorId(options.editorId)}
            value={value}
          />
        </div>
      </div>
    );
  };

  const isManualLinkTargetActive = (target: TabletManualLinkTarget) => (
    manualLinkTarget?.questionId === target.questionId &&
    manualLinkTarget.field === target.field &&
    manualLinkTarget.subQuestionId === target.subQuestionId
  );

  const isManualLinkTargetProcessing = (target: TabletManualLinkTarget) => (
    manualLinkProcessingTarget?.questionId === target.questionId &&
    manualLinkProcessingTarget.field === target.field &&
    manualLinkProcessingTarget.subQuestionId === target.subQuestionId
  );

  const toggleManualLinkTarget = (target: TabletManualLinkTarget) => {
    if (isManualLinkTargetActive(target)) {
      setManualLinkTarget(null);
      setPrecisionRecognitionBox(null);
      return;
    }
    setManualLinkTarget(target);
    setPrecisionRecognitionBox(null);
    setIsReviewAddBoxMode(false);
    setActiveQuestionId(target.questionId);
    scrollLeftToQuestion(target.questionId);
  };

  const canPlacePrecisionBoxOnPage = (page: MaterialPage) => {
    if (!manualLinkTarget) return false;
    if (manualLinkTarget.field === 'content' || manualLinkTarget.field === 'optionContent') {
      return page.role !== 'answer';
    }
    return mode === 'separate_answer' ? page.role === 'answer' : page.role !== 'answer';
  };

  const applyPrecisionRecognitionResult = (target: TabletManualLinkTarget, result: OptionsContentRecognitionResult) => {
    updateQuestion(target.questionId, (currentQuestion) => {
      if (target.subQuestionId) {
        return {
          ...currentQuestion,
          subQuestions: currentQuestion.subQuestions.map((subQuestion) => {
            if (subQuestion.id !== target.subQuestionId) return subQuestion;
            if (result.hasOptions && result.options.length > 0) {
              const optionContents = result.options.reduce<Record<string, string>>((contents, option) => {
                const label = option.label.trim().toUpperCase().slice(0, 1);
                if (label) contents[label] = option.content;
                return contents;
              }, { ...(subQuestion.optionContents || {}) });
              const optionCount = getNormalizedOptionCount(subQuestion.questionType, Math.max(subQuestion.optionCount, result.options.length));
              return {
                ...subQuestion,
                optionContents: buildOptionContents(subQuestion.questionType, optionCount, optionContents),
                optionCount,
              };
            }
            return result.plainContent ? { ...subQuestion, content: result.plainContent } : subQuestion;
          }),
        };
      }

      if (result.hasOptions && result.options.length > 0) {
        const optionContents = result.options.reduce<Record<string, string>>((contents, option) => {
          const label = option.label.trim().toUpperCase().slice(0, 1);
          if (label) contents[label] = option.content;
          return contents;
        }, { ...(currentQuestion.optionContents || {}) });
        const optionCount = getNormalizedOptionCount(currentQuestion.questionType, Math.max(currentQuestion.optionCount, result.options.length));
        return {
          ...currentQuestion,
          optionContents: buildOptionContents(currentQuestion.questionType, optionCount, optionContents),
          optionCount,
        };
      }

      return result.plainContent ? { ...currentQuestion, content: result.plainContent } : currentQuestion;
    });
  };

  const applyManualAnswerFieldResult = (target: TabletManualLinkTarget, value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    updateQuestion(target.questionId, (currentQuestion) => {
      if (target.subQuestionId) {
        return {
          ...currentQuestion,
          subQuestions: currentQuestion.subQuestions.map((subQuestion) => {
            if (subQuestion.id !== target.subQuestionId) return subQuestion;
            return target.field === 'answer'
              ? applyAnswerValue(subQuestion, normalized)
              : { ...subQuestion, analysis: normalized };
          }),
        };
      }

      return target.field === 'answer'
        ? applyAnswerValue(currentQuestion, normalized)
        : { ...currentQuestion, analysis: normalized };
    });
  };

  const requestPrecisionRecognition = async (box: RecognitionBox, target: TabletManualLinkTarget) => {
    const page = materialPages.find((currentPage) => currentPage.pageNumber === box.pageNumber);
    if (!page) throw new Error('未找到资料页');
    const cropped = await cropMaterialQuestionImage(page, box);
    const isAnswerField = target.field === 'answer' || target.field === 'analysis';

    const response = await fetch('/api/recognize-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answerOnly: isAnswerField ? true : undefined,
        contentOnly: isAnswerField ? undefined : true,
        pages: [{
          pageNumber: 1,
          imageData: cropped.imageData,
          width: cropped.width,
          height: cropped.height,
        }],
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error('精准识别请求失败');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const eventText of events) {
        const dataLine = eventText.split('\n').find((line) => line.startsWith('data:'));
        if (!dataLine) continue;

        const event = JSON.parse(dataLine.replace(/^data:\s*/, '')) as {
          type?: string;
          data?: {
            error?: string;
            result?: AnswerOnlyRecognitionResult | OptionsContentRecognitionResult;
          };
        };

        if (event.type === 'error') {
          throw new Error(event.data?.error || '精准识别失败');
        }

        if (event.type === 'complete' && event.data?.result) {
          return event.data.result;
        }
      }

      if (done) break;
    }

    throw new Error('精准识别无结果');
  };

  const handlePrecisionRecognition = async () => {
    if (!manualLinkTarget || !precisionRecognitionBox || manualLinkProcessingTarget) return;

    setManualLinkProcessingTarget(manualLinkTarget);
    try {
      const result = await requestPrecisionRecognition(precisionRecognitionBox, manualLinkTarget);
      if (manualLinkTarget.field === 'answer' || manualLinkTarget.field === 'analysis') {
        const answerResult = result as AnswerOnlyRecognitionResult;
        applyManualAnswerFieldResult(
          manualLinkTarget,
          manualLinkTarget.field === 'answer' ? answerResult.answer || '' : answerResult.analysis || '',
        );
      } else {
        applyPrecisionRecognitionResult(manualLinkTarget, result as OptionsContentRecognitionResult);
      }
      setPrecisionRecognitionBox(null);
      setManualLinkTarget(null);
    } catch (error) {
      console.error('[TabletOCR] precision recognition failed:', error);
    } finally {
      setManualLinkProcessingTarget(null);
    }
  };

  const insertRecognitionSubQuestion = (questionId: string, afterIndex: number, questionType: ReviewQuestionType) => {
    updateQuestion(questionId, (currentQuestion) => {
      const parentQuestionType = canAddReviewSubQuestions(currentQuestion.questionType, subject)
        ? currentQuestion.questionType
        : getDefaultCompoundReviewQuestionType(subject);
      const nextSubQuestions = [...currentQuestion.subQuestions];
      const insertIndex = Math.min(Math.max(afterIndex + 1, 0), nextSubQuestions.length);
      nextSubQuestions.splice(insertIndex, 0, createReviewSubQuestion(currentQuestion.id, insertIndex, questionType, {
        optionCount: getDefaultOptionCount(questionType),
        blankCount: getDefaultBlankCount(questionType),
      }));
      return {
        ...currentQuestion,
        blankCount: parentQuestionType === 'cloze' ? nextSubQuestions.length : currentQuestion.blankCount,
        optionContents: isChoiceLikeQuestionType(parentQuestionType)
          ? buildOptionContents(parentQuestionType, getDefaultOptionCount(parentQuestionType, currentQuestion.optionCount), currentQuestion.optionContents || {})
          : {},
        optionCount: parentQuestionType === 'cloze' || parentQuestionType === 'reading_comprehension'
          ? Math.max(4, currentQuestion.optionCount)
          : isChoiceLikeQuestionType(parentQuestionType)
            ? getDefaultOptionCount(parentQuestionType, currentQuestion.optionCount)
            : currentQuestion.optionCount,
        questionType: parentQuestionType,
        questionTypeStatus: parentQuestionType === currentQuestion.questionType ? currentQuestion.questionTypeStatus : 'manual',
        subQuestions: nextSubQuestions,
      };
    });
    showToast('子题添加成功');
    setRecognitionAddSubMenu(null);
  };

  const getImageModeSubQuestionOptions = () => (
    reviewQuestionTypeOptions.filter((option) => (
      !canAddReviewSubQuestions(option.value, subject)
    ))
  );

  const insertImageModeSubQuestion = (
    questionId: string,
    anchorSubQuestionId: string,
    placement: 'before' | 'after',
    questionType: ReviewQuestionType,
  ) => {
    updateQuestion(questionId, (currentQuestion) => {
      const nextSubQuestions = [...currentQuestion.subQuestions];
      const anchorIndex = nextSubQuestions.findIndex((subQuestion) => subQuestion.id === anchorSubQuestionId);
      const insertIndex = anchorIndex < 0
        ? nextSubQuestions.length
        : placement === 'before'
          ? anchorIndex
          : anchorIndex + 1;

      nextSubQuestions.splice(insertIndex, 0, createReviewSubQuestion(currentQuestion.id, insertIndex, questionType, {
        blankCount: getDefaultBlankCount(questionType),
        optionCount: getDefaultOptionCount(questionType),
      }));

      return {
        ...currentQuestion,
        blankCount: currentQuestion.questionType === 'cloze' ? nextSubQuestions.length : currentQuestion.blankCount,
        subQuestions: nextSubQuestions,
      };
    });
    showToast('子题添加成功');
    setImageModeAddSubMenu(null);
    setImageModeTypeMenu(null);
  };

  const hasSubQuestionUserContent = (subQuestion: ReviewQuestion['subQuestions'][number]) => {
    const hasOptionContent = Object.entries(subQuestion.optionContents || {}).some(([letter, value]) => (
      isUsableText(value) && value.trim() !== getDefaultOptionContent(subQuestion.questionType, letter)
    ));
    const hasOptionAnalysis = Object.values(subQuestion.optionAnalyses || {}).some(isUsableText);

    return (
      isUsableText(subQuestion.content) ||
      isUsableText(subQuestion.answer) ||
      isUsableText(subQuestion.analysis) ||
      subQuestion.blankAnswers.some(isUsableText) ||
      hasOptionContent ||
      hasOptionAnalysis
    );
  };

  const deleteRecognitionSubQuestion = (questionId: string, subQuestionId: string) => {
    updateQuestion(questionId, (currentQuestion) => {
      if (currentQuestion.subQuestions.length <= 1) return currentQuestion;

      const nextSubQuestions = currentQuestion.subQuestions.filter((currentSubQuestion) => (
        currentSubQuestion.id !== subQuestionId
      ));

      return {
        ...currentQuestion,
        blankCount: currentQuestion.questionType === 'cloze'
          ? Math.max(1, nextSubQuestions.length)
          : currentQuestion.blankCount,
        subQuestions: nextSubQuestions,
      };
    });
    setRecognitionAddSubMenu(null);
  };

  const requestDeleteSubQuestion = (
    question: ReviewQuestion,
    subQuestion: ReviewQuestion['subQuestions'][number],
    source: 'recognition' | 'image',
  ) => {
    const hasContent = hasSubQuestionUserContent(subQuestion);
    const shouldConfirm = source === 'recognition'
      ? hasContent
      : shouldShowAnswerAnalysis && hasContent;

    if (shouldConfirm) {
      setPendingSubQuestionDeletion({
        mode: globalMode,
        questionId: question.id,
        source,
        subQuestionId: subQuestion.id,
      });
      return;
    }

    if (source === 'recognition') {
      deleteRecognitionSubQuestion(question.id, subQuestion.id);
      return;
    }

    deleteImageModeSubQuestion(question.id, subQuestion.id);
  };

  const handleConfirmDeleteSubQuestion = () => {
    if (!pendingSubQuestionDeletion) return;

    if (pendingSubQuestionDeletion.source === 'recognition') {
      deleteRecognitionSubQuestion(pendingSubQuestionDeletion.questionId, pendingSubQuestionDeletion.subQuestionId);
    } else {
      deleteImageModeSubQuestion(pendingSubQuestionDeletion.questionId, pendingSubQuestionDeletion.subQuestionId);
    }

    setPendingSubQuestionDeletion(null);
  };

  const handleGlobalModeChange = (mode: ReviewDisplayMode) => {
    setGlobalMode(mode);
    setRecognitionAddSubMenu(null);
    setImageModeAddSubMenu(null);
    setImageModeTypeMenu(null);
    setPendingSubQuestionDeletion(null);
    setQuestions((currentQuestions) => currentQuestions.map((question) => ({ ...question, viewMode: mode })));
  };

  const handleMoveQuestion = (questionId: string, direction: 'up' | 'down') => {
    setQuestions((currentQuestions) => {
      const index = currentQuestions.findIndex((question) => question.id === questionId);
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (index < 0 || targetIndex < 0 || targetIndex >= currentQuestions.length) return currentQuestions;

      const nextQuestions = [...currentQuestions];
      const [question] = nextQuestions.splice(index, 1);
      nextQuestions.splice(targetIndex, 0, question);
      return nextQuestions;
    });
    setOpenMenuQuestionId(null);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions((currentQuestions) => currentQuestions.filter((question) => question.id !== questionId));
    setReviewBoxes((currentBoxes) => currentBoxes.filter((box) => box.id !== questionId));
    setPendingReviewBoxIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.delete(questionId);
      return nextIds;
    });
    setOpenMenuQuestionId(null);
    if (activeQuestionId === questionId) {
      setActiveQuestionId('');
    }
  };

  const handleDeleteReviewBox = (boxId: string) => {
    const hasLinkedQuestion = questions.some((question) => question.id === boxId);
    if (hasLinkedQuestion) {
      handleDeleteQuestion(boxId);
      return;
    }

    setReviewBoxes((currentBoxes) => currentBoxes.filter((box) => box.id !== boxId));
    setPendingReviewBoxIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.delete(boxId);
      return nextIds;
    });
    setActiveQuestionId((currentId) => (currentId === boxId ? '' : currentId));
  };

  const handleToggleReviewBoxSelection = (box: RecognitionBox) => {
    const nextSelected = !box.selected;

    setReviewBoxes((currentBoxes) => currentBoxes.map((currentBox) => (
      currentBox.id === box.id ? { ...currentBox, selected: nextSelected } : currentBox
    )));
    setPendingReviewBoxIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextSelected) {
        nextIds.add(box.id);
      }
      return nextIds;
    });
    setQuestions((currentQuestions) => currentQuestions.map((question) => {
      if (question.id !== box.id) return question;
      return {
        ...question,
        questionTypeStatus: pendingReviewBoxIds.has(box.id) || nextSelected ? 'stale' : 'recognized',
      };
    }));
  };

  const handleStartCrop = (question: ReviewQuestion) => {
    if (hasDraggedCropRef.current) {
      window.setTimeout(() => {
        hasDraggedCropRef.current = false;
      }, 0);
      return;
    }

    if (editingCropQuestionId === question.id) {
      handleCancelCrop();
      return;
    }

    const displaySize = imageDisplaySizesRef.current.get(question.id);
    setActiveQuestionId(question.id);
    setEditingCropQuestionId(question.id);
    setCropRegion(displaySize ? {
      height: Math.round(displaySize.height * 0.72),
      width: displaySize.width,
      x: 0,
      y: 0,
    } : null);
    scrollLeftToQuestion(question.id);
  };

  const handleCancelCrop = () => {
    setEditingCropQuestionId(null);
    setCropRegion(null);
    setCropDrag(null);
  };

  const handleConfirmCrop = async () => {
    if (!editingCropQuestionId || !cropRegion) return;
    const question = questions.find((currentQuestion) => currentQuestion.id === editingCropQuestionId);
    const displaySize = imageDisplaySizesRef.current.get(editingCropQuestionId);
    if (!question?.croppedImageData || !displaySize) return;

    const nextImageData = await cropRenderedImageRegion(question.croppedImageData, displaySize, cropRegion);
    updateQuestion(editingCropQuestionId, (currentQuestion) => ({
      ...currentQuestion,
      userCroppedImageData: nextImageData,
    }));
    handleCancelCrop();
  };

  const handleQuestionImageLoad = (questionId: string, width: number, height: number) => {
    if (!width || !height) return;
    imageDisplaySizesRef.current.set(questionId, { width, height });

    if (editingCropQuestionId === questionId && !cropRegion) {
      setCropRegion({
        height: Math.round(height * 0.72),
        width,
        x: 0,
        y: 0,
      });
    }
  };

  const startReviewBoxDrag = (
    event: ReactPointerEvent,
    box: RecognitionBox,
    action: 'move' | 'resize',
  ) => {
    const containerRect = reviewPageWrapRefs.current[box.pageNumber]?.getBoundingClientRect();
    if (!containerRect) return;

    event.preventDefault();
    event.stopPropagation();
    hasMovedReviewBoxRef.current = false;
    setReviewBoxDrag({
      id: box.id,
      action,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startBox: box,
      containerRect,
    });
  };

  const addReviewBoxAtPoint = (page: MaterialPage, clientX: number, clientY: number) => {
    const containerRect = reviewPageWrapRefs.current[page.pageNumber]?.getBoundingClientRect();
    if (!containerRect) return;

    const width = 72;
    const height = 8;
    const clickX = ((clientX - containerRect.left) / containerRect.width) * 100;
    const clickY = ((clientY - containerRect.top) / containerRect.height) * 100;
    const boxId = `review-manual-${Date.now()}`;

    setReviewBoxes((currentBoxes) => [
      ...currentBoxes,
      {
        id: boxId,
        pageNumber: page.pageNumber,
        x: clampPercent(clickX - width / 2, 0, 100 - width),
        y: clampPercent(clickY - height / 2, 0, 100 - height),
        width,
        height,
        selected: true,
        source: 'manual',
      },
    ]);
    setPendingReviewBoxIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(boxId);
      return nextIds;
    });
  };

  const addPrecisionRecognitionBoxAtPoint = (page: MaterialPage, clientX: number, clientY: number) => {
    const containerRect = reviewPageWrapRefs.current[page.pageNumber]?.getBoundingClientRect();
    if (!containerRect) return;

    const width = 64;
    const height = 10;
    const clickX = ((clientX - containerRect.left) / containerRect.width) * 100;
    const clickY = ((clientY - containerRect.top) / containerRect.height) * 100;

    setPrecisionRecognitionBox({
      id: `precision-recognition-${Date.now()}`,
      pageNumber: page.pageNumber,
      x: clampPercent(clickX - width / 2, 0, 100 - width),
      y: clampPercent(clickY - height / 2, 0, 100 - height),
      width,
      height,
      selected: true,
      source: 'manual',
    });
  };

  const startReviewDrawingBox = (
    page: MaterialPage,
    event: ReactPointerEvent<HTMLDivElement>,
    intent: DrawingBoxDraft['intent'],
  ) => {
    const containerRect = reviewPageWrapRefs.current[page.pageNumber]?.getBoundingClientRect();
    if (!containerRect) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = getPointerPercent(containerRect, event.clientX, event.clientY);
    setReviewDrawingBoxDraft({
      pageNumber: page.pageNumber,
      startX: point.x,
      startY: point.y,
      currentX: point.x,
      currentY: point.y,
      clientX: event.clientX,
      clientY: event.clientY,
      intent,
    });
  };

  const mergeRecognizedReviewQuestions = (
    currentQuestions: ReviewQuestion[],
    incomingQuestions: ReviewQuestion[],
    changedBoxIds: Set<string>,
  ) => {
    const incomingById = new Map(incomingQuestions.map((question) => [question.id, question]));
    const nextQuestions = currentQuestions.map((question) => (
      incomingById.has(question.id) ? incomingById.get(question.id)! : question
    ));
    const existingIds = new Set(nextQuestions.map((question) => question.id));
    const sortedBoxes = [...reviewBoxes].sort((firstBox, secondBox) => (
      firstBox.pageNumber - secondBox.pageNumber || firstBox.y - secondBox.y || firstBox.x - secondBox.x
    ));

    incomingQuestions.forEach((question) => {
      if (existingIds.has(question.id)) return;

      const boxOrderIndex = sortedBoxes.findIndex((box) => box.id === question.id);
      const nextExistingBox = sortedBoxes.slice(boxOrderIndex + 1).find((box) => existingIds.has(box.id));
      const insertIndex = nextExistingBox
        ? nextQuestions.findIndex((currentQuestion) => currentQuestion.id === nextExistingBox.id)
        : -1;

      if (insertIndex >= 0) {
        nextQuestions.splice(insertIndex, 0, question);
      } else {
        nextQuestions.push(question);
      }
      existingIds.add(question.id);
    });

    return nextQuestions.map((question) => (
      changedBoxIds.has(question.id) ? { ...question, viewMode: globalMode } : question
    ));
  };

  const handleContinueRecognition = async () => {
    if (pendingReviewBoxIds.size === 0 || recognitionStatus === 'recognizing') return;

    const pageByNumberForCrop = new Map(materialPages.map((page) => [page.pageNumber, page]));
    const changedBoxes = reviewBoxes
      .filter((box) => pendingReviewBoxIds.has(box.id) && box.selected)
      .sort((firstBox, secondBox) => firstBox.pageNumber - secondBox.pageNumber || firstBox.y - secondBox.y || firstBox.x - secondBox.x);
    if (changedBoxes.length === 0) return;

    const changedBoxIds = new Set(changedBoxes.map((box) => box.id));

    setRecognitionStatus('recognizing');
    setRecognitionMessage(`正在识别 ${changedBoxes.length} 个区域...`);
    setRecognizingReviewBoxIds(changedBoxIds);
    setQuestions((currentQuestions) => currentQuestions.map((question) => (
      changedBoxIds.has(question.id) ? { ...question, questionTypeStatus: 'pending' } : question
    )));

    try {
      const preparedQuestions = (await Promise.all(changedBoxes.map(async (box): Promise<ReviewQuestion | null> => {
        const page = pageByNumberForCrop.get(box.pageNumber);
        if (!page) return null;
        const cropped = await cropMaterialQuestionImage(page, box);

        return {
          id: box.id,
          pageNumber: box.pageNumber,
          crop: {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
          },
          questionType: 'short_answer' as ReviewQuestionType,
          questionTypeStatus: 'pending' as QuestionTypeRecognitionStatus,
          answer: '',
          analysis: '',
          blankAnswers: [''],
          content: '',
          optionContents: {},
          optionCount: 4,
          blankCount: 1,
          subQuestions: [],
          viewMode: globalMode,
          croppedImageData: cropped.imageData,
          croppedImageHeight: cropped.height,
          croppedImageWidth: cropped.width,
          userCroppedImageData: undefined,
        };
      }))).filter((question): question is ReviewQuestion => Boolean(question));

      const matchedQuestions = await requestAiQuestionTypes(preparedQuestions);
      const recognizedQuestions = preparedQuestions.map((question) => (
        applyAiQuestionType(question, matchedQuestions.find((item) => item.questionBoxId === question.id))
      ));

      setQuestions((currentQuestions) => mergeRecognizedReviewQuestions(currentQuestions, recognizedQuestions, changedBoxIds));
      setReviewBoxes((currentBoxes) => currentBoxes.map((box) => (
        changedBoxIds.has(box.id) ? { ...box, selected: false } : box
      )));
      setPendingReviewBoxIds((currentIds) => {
        const nextIds = new Set(currentIds);
        changedBoxIds.forEach((boxId) => nextIds.delete(boxId));
        return nextIds;
      });
      setRecognizingReviewBoxIds(new Set());
      setRecognitionStatus('done');
      setRecognitionMessage('');
    } catch (error) {
      console.error('[TabletOCR] continue recognition failed:', error);
      setQuestions((currentQuestions) => currentQuestions.map((question) => (
        changedBoxIds.has(question.id) ? { ...question, questionTypeStatus: 'failed' } : question
      )));
      setRecognizingReviewBoxIds(new Set());
      setRecognitionStatus('failed');
      setRecognitionMessage('AI 继续识别失败，请手动核对题型');
    }
  };

  const renderLeftMaterialPage = (page: MaterialPage) => {
    const frame = getMaterialPageFrameSize(page);
    const pageBoxes = reviewBoxes.filter((box) => box.pageNumber === page.pageNumber);
    const visiblePageBoxes = manualLinkTarget ? [] : pageBoxes;
    const pagePrecisionBox = manualLinkTarget && precisionRecognitionBox?.pageNumber === page.pageNumber
      ? precisionRecognitionBox
      : null;
    const firstRecognizedBoxId = visiblePageBoxes.find((box) => (
      !pendingReviewBoxIds.has(box.id) && questions.some((question) => question.id === box.id)
    ))?.id;
    const firstNewPendingBoxId = visiblePageBoxes.find((box) => (
      pendingReviewBoxIds.has(box.id) && !questions.some((question) => question.id === box.id)
    ))?.id;

    return (
      <div
        key={page.pageNumber}
        className="mx-auto mb-[28px] w-fit rounded-[12px] border border-[#dfe6eb] bg-white p-[12px] shadow-[0_8px_22px_rgba(31,44,58,0.09)]"
      >
        <div
          className={`relative bg-white ${isReviewAddBoxMode || manualLinkTarget ? 'touch-none cursor-crosshair' : ''}`}
          onClick={(event) => {
            if ((manualLinkTarget && canPlacePrecisionBoxOnPage(page)) || (isReviewAddBoxMode && page.role !== 'answer')) event.stopPropagation();
          }}
          onPointerDown={(event) => {
            if (manualLinkTarget && canPlacePrecisionBoxOnPage(page)) {
              startReviewDrawingBox(page, event, 'precision');
              return;
            }
            if (isReviewAddBoxMode && page.role !== 'answer') {
              startReviewDrawingBox(page, event, 'manual');
            }
          }}
          ref={(node) => {
            reviewPageWrapRefs.current[page.pageNumber] = node;
          }}
          style={{ width: frame.width, height: frame.height }}
        >
          <img alt="" className="h-full w-full object-fill" src={page.url} />
          <DrawingBoxOverlay
            draft={reviewDrawingBoxDraft?.pageNumber === page.pageNumber ? reviewDrawingBoxDraft : null}
            frame={frame}
            imageUrl={page.url}
          />
          {visiblePageBoxes.map((box) => {
            const isPending = pendingReviewBoxIds.has(box.id);
            const isQueued = isPending && box.selected;
            const hasLinkedQuestion = questions.some((question) => question.id === box.id);
            const isActive = hasLinkedQuestion && box.id === activeQuestionId;
            const pendingLabel = hasLinkedQuestion ? '待重新识别' : '待识别';
            const isFirstRecognizedBox = box.id === firstRecognizedBoxId;
            const isFirstNewPendingBox = box.id === firstNewPendingBoxId;
            const boxRequirementAnchor = isFirstRecognizedBox
              ? 'tablet-review-image.recognized-box'
              : isFirstNewPendingBox
                ? 'tablet-review-image.new-box'
                : undefined;

            return (
              <div
                key={box.id}
                ref={(node) => {
                  leftBoxRefs.current[box.id] = node;
                }}
                data-req-anchor={boxRequirementAnchor}
                className={`absolute ${
                  isActive
                    ? 'border-2 border-[#23bfb2] bg-[#ddf8f4]/38 shadow-[0_0_0_3px_rgba(35,191,178,0.18)]'
                    : isPending
                      ? 'border-2 border-[#26c9bc] bg-[#ddf8f4]/25'
                      : 'border-0 bg-[#202124]/10'
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!hasMovedReviewBoxRef.current && hasLinkedQuestion) {
                    setActiveQuestionId((currentId) => (currentId === box.id ? '' : box.id));
                  }
                }}
                onPointerDown={(event) => startReviewBoxDrag(event, box, 'move')}
                style={{
                  height: `${box.height}%`,
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.width}%`,
                }}
              >
                {isFirstRecognizedBox
                  ? renderReviewImageRequirementMarker('TABLET_REVIEW_IMAGE-014', 'left-[30px] top-[-14px] z-50')
                  : null}
                {isFirstNewPendingBox
                  ? renderReviewImageRequirementMarker('TABLET_REVIEW_IMAGE-015', 'left-[30px] top-[-14px] z-50')
                  : null}
                <button
                  aria-label={box.selected ? '取消选中识别框' : '选中识别框'}
                  className={`absolute left-[4px] top-[4px] flex h-[22px] w-[22px] items-center justify-center rounded-[4px] border text-[13px] font-semibold leading-none shadow-[0_1px_5px_rgba(31,44,58,0.16)] ${
                    box.selected
                      ? 'border-[#26c9bc] bg-[#26c9bc] text-white'
                      : 'border-white/80 bg-[#202124]/42 text-transparent'
                  }`}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleToggleReviewBoxSelection(box);
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  type="button"
                >
                  ✓
                </button>
                {isPending ? (
                  <span className="absolute right-[32px] top-[4px] rounded-[4px] bg-[#f2a93b] px-[6px] py-[3px] text-[13px] font-medium leading-none text-white shadow-[0_1px_5px_rgba(31,44,58,0.14)]">
                    {pendingLabel}
                  </span>
                ) : null}
                <button
                  aria-label="删除识别框"
                  className="absolute right-[4px] top-[4px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#202124]/50 text-white shadow-[0_1px_5px_rgba(31,44,58,0.16)] active:bg-[#000]"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteReviewBox(box.id);
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  type="button"
                >
                  <X className="h-[13px] w-[13px]" />
                </button>
                <button
                  aria-label="调整识别框大小"
                  className="absolute bottom-[-8px] right-[-8px] h-[18px] w-[18px] rounded-full border-[2px] border-white bg-[#26c9bc] shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
                  onPointerDown={(event) => startReviewBoxDrag(event, box, 'resize')}
                  type="button"
                />
              </div>
            );
          })}
          {pagePrecisionBox ? (
            <div
              className="absolute border-2 border-[#26c9bc] bg-[#ddf8f4]/25"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => startReviewBoxDrag(event, pagePrecisionBox, 'move')}
              style={{
                height: `${pagePrecisionBox.height}%`,
                left: `${pagePrecisionBox.x}%`,
                top: `${pagePrecisionBox.y}%`,
                width: `${pagePrecisionBox.width}%`,
              }}
            >
              <button
                aria-label="取消精准识别框"
                className="absolute right-[4px] top-[4px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#202124]/50 text-white shadow-[0_1px_5px_rgba(31,44,58,0.16)] active:bg-[#000]"
                onClick={(event) => {
                  event.stopPropagation();
                  setPrecisionRecognitionBox(null);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                type="button"
              >
                <X className="h-[13px] w-[13px]" />
              </button>
              <button
                aria-label="调整精准识别框大小"
                className="absolute bottom-[-8px] right-[-8px] h-[18px] w-[18px] rounded-full border-[2px] border-white bg-[#26c9bc] shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
                onPointerDown={(event) => startReviewBoxDrag(event, pagePrecisionBox, 'resize')}
                type="button"
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderManualLinkButton = (target: TabletManualLinkTarget, label: string) => {
    const isActive = isManualLinkTargetActive(target);
    const isProcessing = isManualLinkTargetProcessing(target);

    return (
      <button
        aria-label={label}
        className={`flex h-[28px] w-[28px] items-center justify-center rounded-[5px] transition-colors ${
          isActive
            ? 'bg-[#fff3e0] text-[#f28b21]'
            : 'text-[#b4bdc6] active:bg-[#fff3e0] active:text-[#f28b21]'
        } ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
        disabled={isProcessing}
        onClick={(event) => {
          event.stopPropagation();
          toggleManualLinkTarget(target);
        }}
        type="button"
      >
        <Link2 className="h-[17px] w-[17px]" />
      </button>
    );
  };

  const renderFieldLinkBadge = (
    text: '题' | '选' | '答' | '析',
    target: TabletManualLinkTarget,
    label: string,
    options: {
      markerClassName?: string;
      markerRequirementId?: string;
      reqAnchor?: string;
      warning?: boolean;
      warningTone?: 'strong' | 'muted';
    } = {},
  ) => {
    const isActive = isManualLinkTargetActive(target);
    const isProcessing = isManualLinkTargetProcessing(target);
    const warning = !!options.warning;
    const warningTone = options.warningTone || 'strong';

    return (
      <div className="relative shrink-0" data-req-anchor={options.reqAnchor}>
        {options.markerRequirementId
          ? renderReviewQaImageRequirementMarker(
              options.markerRequirementId,
              options.markerClassName || 'left-[-8px] top-[-12px] z-40',
            )
          : null}
        <button
          aria-label={label}
          className={`relative flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[8px] border pb-[2px] pl-[7px] text-[18px] font-medium leading-none transition-colors ${
            isActive
              ? 'border-[#f28b21] bg-[#fff3e0] text-[#f28b21]'
              : warning
                ? 'border-[#cfd6dc] bg-white text-[#58626d] active:border-[#23bfb2] active:text-[#16a69a]'
                : 'border-[#cfd6dc] bg-white text-[#58626d] active:border-[#23bfb2] active:text-[#16a69a]'
          } ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
          disabled={isProcessing}
          onClick={(event) => {
            event.stopPropagation();
            toggleManualLinkTarget(target);
          }}
          type="button"
        >
          <span className={warning ? (warningTone === 'muted' ? 'text-[#8f99a3]' : 'text-[#f28b21]') : ''}>
            {text}
            {warning ? <span className="ml-[1px]">!</span> : null}
          </span>
          <span className={`absolute left-0 top-0 h-[23px] w-[23px] rounded-tl-[7px] [clip-path:polygon(0_0,100%_0,0_100%)] ${
            isActive ? 'bg-[#ffe5bf]' : 'bg-[#edf1f4]'
          }`}>
            <Link2 className={`absolute left-[2px] top-[2px] h-[12px] w-[12px] rotate-[135deg] stroke-[2] ${
              isActive ? 'text-[#f28b21]' : 'text-[#6f7a85]'
            }`} />
          </span>
        </button>
      </div>
    );
  };

  const renderLinkedFieldRow = (
    text: '题' | '选' | '答' | '析',
    target: TabletManualLinkTarget,
    label: string,
    children: React.ReactNode,
    options: {
      fieldMarkerClassName?: string;
      fieldRequirementId?: string;
      extraFieldMarkerClassName?: string;
      extraFieldReqAnchor?: string;
      extraFieldRequirementId?: string;
      linkMarkerClassName?: string;
      linkReqAnchor?: string;
      linkRequirementId?: string;
      reqAnchor?: string;
      warning?: boolean;
      warningTone?: 'strong' | 'muted';
    } = {},
  ) => (
    <div className="relative flex items-start gap-[12px]" data-req-anchor={options.reqAnchor}>
      {options.fieldRequirementId
        ? renderReviewQaImageRequirementMarker(
            options.fieldRequirementId,
            options.fieldMarkerClassName || 'right-[8px] top-[-12px] z-40',
          )
        : null}
      {options.extraFieldRequirementId ? (
        <span className="relative" data-req-anchor={options.extraFieldReqAnchor}>
          {renderReviewQaImageRequirementMarker(
            options.extraFieldRequirementId,
            options.extraFieldMarkerClassName || 'right-[58px] top-[-12px] z-40',
          )}
        </span>
      ) : null}
      {renderFieldLinkBadge(text, target, label, {
        markerClassName: options.linkMarkerClassName,
        markerRequirementId: options.linkRequirementId,
        reqAnchor: options.linkReqAnchor,
        warning: options.warning,
        warningTone: options.warningTone,
      })}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );

  const renderOptionLinkPill = (target: TabletManualLinkTarget) => {
    const isActive = isManualLinkTargetActive(target);
    const isProcessing = isManualLinkTargetProcessing(target);

    return (
      <button
        aria-label="关联选项区域"
        className={`relative inline-flex h-[38px] items-center rounded-[8px] border pl-[24px] pr-[12px] text-[18px] font-medium leading-none transition-colors ${
          isActive
            ? 'border-[#f28b21] bg-[#fff3e0] text-[#f28b21]'
            : 'border-[#cfd6dc] bg-white text-[#58626d] active:border-[#23bfb2] active:text-[#16a69a]'
        } ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
        disabled={isProcessing}
        onClick={(event) => {
          event.stopPropagation();
          toggleManualLinkTarget(target);
        }}
        type="button"
      >
        <span className={`absolute left-0 top-0 h-[21px] w-[21px] rounded-tl-[7px] [clip-path:polygon(0_0,100%_0,0_100%)] ${
          isActive ? 'bg-[#ffe5bf]' : 'bg-[#edf1f4]'
        }`}>
          <Link2 className={`absolute left-[2px] top-[2px] h-[11px] w-[11px] rotate-[135deg] stroke-[2] ${
            isActive ? 'text-[#f28b21]' : 'text-[#6f7a85]'
          }`} />
        </span>
        选项
      </button>
    );
  };

  const renderFieldLoading = (label: string) => (
    <div className="flex min-h-[54px] items-center gap-[10px] rounded-[6px] border border-[#b7ded9] bg-[#effcfb] px-[14px] text-[18px] font-medium leading-none text-[#16a69a]">
      <div className="h-[22px] w-[22px] animate-spin rounded-full border-[3px] border-[#cfe5e2] border-t-[#23bfb2]" />
      {label}
    </div>
  );

  const renderRecognitionTextAreaV2 = (
    value: string,
    onChange: (value: string) => void,
    placeholder = '题干',
    isProcessing = false,
    loadingLabel = '题干识别中...',
    options: {
      editorId?: string;
      fillBlankToolbar?: boolean;
      readOnly?: boolean;
      onBlankInsert?: (nextValue: string, insertStart: number) => void;
    } = {},
  ) => {
    if (isProcessing) return renderFieldLoading(loadingLabel);

    const showToolbar = !options.readOnly && !!options.fillBlankToolbar && !!options.editorId && focusedStemEditorId === options.editorId;

    return (
      <div className="relative">
        {showToolbar ? (
          <div className="mb-[7px] inline-flex h-[38px] items-center gap-[3px] rounded-[7px] border border-[#d9dee3] bg-[#f1f3f4] px-[6px] text-[17px] text-[#5c646d] shadow-[0_6px_16px_rgba(31,44,58,0.08)]" onClick={(event) => event.stopPropagation()}>
            <button className="flex h-[28px] w-[28px] items-center justify-center rounded-[5px] font-semibold active:bg-white" type="button">B</button>
            <button className="flex h-[28px] w-[28px] items-center justify-center rounded-[5px] italic active:bg-white" type="button">I</button>
            <button className="flex h-[28px] w-[28px] items-center justify-center rounded-[5px] underline active:bg-white" type="button">U</button>
            <div className="mx-[4px] h-[22px] w-px bg-[#d0d6dc]" />
            <button
              aria-label="挖空"
              className="flex h-[28px] w-[32px] items-center justify-center rounded-[5px] active:bg-white"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (options.editorId) insertBlankIntoStemEditor(options.editorId, value, onChange, options.onBlankInsert);
              }}
              type="button"
            >
              <span className="h-[11px] w-[20px] rounded-b-[3px] border-b-[3px] border-l-[3px] border-r-[3px] border-[#59616a]" />
            </button>
          </div>
        ) : null}
        <AutoResizeTextarea
          className="min-h-[64px] w-full resize-none overflow-hidden rounded-[6px] border border-[#d7dde3] bg-white px-[16px] py-[12px] text-[20px] leading-[1.55] text-[#2f363d] outline-none focus:border-[#23bfb2]"
          id={options.editorId}
          onBlur={() => window.setTimeout(() => {
            setFocusedStemEditorId((currentId) => (currentId === options.editorId ? null : currentId));
          }, 120)}
          onChange={onChange}
          onClick={(event) => event.stopPropagation()}
          onFocus={() => {
            if (!options.readOnly && options.editorId) setFocusedStemEditorId(options.editorId);
          }}
          placeholder={placeholder}
          readOnly={options.readOnly}
          value={value}
        />
      </div>
    );
  };

  const renderRecognitionOptionsV2 = (
    questionType: ReviewQuestionType,
    optionCount: number,
    optionContents: Record<string, string> | undefined,
    onOptionChange: (letter: string, value: string) => void,
    target: TabletManualLinkTarget,
    options: {
      optionAnalyses?: Record<string, string>;
      onOptionAnalysisChange?: (letter: string, value: string) => void;
      readOnly?: boolean;
      withOptionAnalysis?: boolean;
    } = {},
  ) => {
    const count = questionType === 'judge' ? 2 : optionCount;
    if (isManualLinkTargetProcessing(target)) return renderFieldLoading('选项识别中...');

    return (
      <div className="space-y-[12px]">
        {OPTION_LETTERS.slice(0, count).split('').map((letter) => (
          <div key={letter} className={options.withOptionAnalysis ? 'rounded-[7px] border border-[#dfe4e8] bg-white p-[12px]' : ''}>
            <label className="flex items-center gap-[12px]">
              <span className="w-[28px] shrink-0 text-right text-[18px] leading-none text-[#2f363d]">{letter}.</span>
              <input
                className="h-[42px] flex-1 rounded-[6px] border border-[#d7dde3] bg-white px-[14px] text-[18px] text-[#2f363d] outline-none focus:border-[#23bfb2]"
                onChange={(event) => onOptionChange(letter, event.target.value)}
                onClick={(event) => event.stopPropagation()}
                placeholder={`选项 ${letter}`}
                readOnly={options.readOnly}
                value={optionContents?.[letter] ?? getDefaultOptionContent(questionType, letter)}
              />
            </label>
            {options.withOptionAnalysis ? (
              <AutoResizeTextarea
                className="mt-[10px] min-h-[50px] w-full resize-none overflow-hidden rounded-[6px] border border-[#d7dde3] bg-[#f8fafb] px-[14px] py-[10px] text-[18px] leading-[1.5] text-[#2f363d] outline-none focus:border-[#23bfb2]"
                onChange={(value) => options.onOptionAnalysisChange?.(letter, value)}
                onClick={(event) => event.stopPropagation()}
                placeholder={`${letter}项答案解析`}
                readOnly={options.readOnly}
                value={options.optionAnalyses?.[letter] || ''}
              />
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  const renderRecognitionTextArea = (
    value: string,
    onChange: (value: string) => void,
    placeholder = '题干',
  ) => (
    <textarea
      className="min-h-[64px] w-full resize-none rounded-[6px] border border-[#d7dde3] bg-white px-[16px] py-[12px] text-[20px] leading-[1.55] text-[#2f363d] outline-none focus:border-[#23bfb2]"
      onChange={(event) => onChange(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      placeholder={placeholder}
      value={value}
    />
  );

  const renderRecognitionOptions = (
    questionType: ReviewQuestionType,
    optionCount: number,
    optionContents: Record<string, string> | undefined,
    onOptionChange: (letter: string, value: string) => void,
  ) => {
    const count = questionType === 'judge' ? 2 : optionCount;
    return (
      <div className="space-y-[12px]">
        <div className="flex items-center gap-[6px] text-[18px] leading-none text-[#68727d]">
          选项
          <span className="text-[#a1a9b1]">↗</span>
        </div>
        {OPTION_LETTERS.slice(0, count).split('').map((letter) => (
          <label key={letter} className="flex items-center gap-[12px]">
            <span className="w-[28px] shrink-0 text-right text-[18px] leading-none text-[#2f363d]">{letter}.</span>
            <input
              className="h-[42px] flex-1 rounded-[6px] border border-[#d7dde3] bg-white px-[14px] text-[18px] text-[#2f363d] outline-none focus:border-[#23bfb2]"
              onChange={(event) => onOptionChange(letter, event.target.value)}
              onClick={(event) => event.stopPropagation()}
              placeholder={`选项 ${letter}`}
              value={optionContents?.[letter] ?? getDefaultOptionContent(questionType, letter)}
            />
          </label>
        ))}
      </div>
    );
  };

  const renderRecognitionSubQuestionAddMenu = (
    question: ReviewQuestion,
    subQuestion: ReviewQuestion['subQuestions'][number],
    index: number,
  ) => {
    const isFixedSingleChoice = isEnglishSubjectName(subject) && (question.questionType === 'reading_comprehension' || question.questionType === 'cloze');
    const isMenuOpen = recognitionAddSubMenu?.questionId === question.id && recognitionAddSubMenu.subQuestionId === subQuestion.id;
    const subQuestionTypeOptions = reviewQuestionTypeOptions.filter((option) => !canAddReviewSubQuestions(option.value, subject));
    const openPlacementMenu = () => {
      setRecognitionAddSubMenu(isMenuOpen ? null : {
        afterIndex: index,
        questionId: question.id,
        subQuestionId: subQuestion.id,
      });
    };
    const selectPlacement = (placement: 'before' | 'after') => {
      setRecognitionAddSubMenu({
        afterIndex: placement === 'before' ? index - 1 : index,
        placement,
        questionId: question.id,
        subQuestionId: subQuestion.id,
      });
    };

    return (
      <div className="relative" onClick={(event) => event.stopPropagation()}>
        <button
          aria-label="添加子题"
          className={`flex h-[38px] w-[38px] items-center justify-center rounded-full active:bg-[#e6faf7] disabled:text-[#b8c0c8] ${
            isMenuOpen ? 'text-[#23bfb2]' : 'text-[#7b8085]'
          }`}
          onClick={() => {
            if (isFixedSingleChoice) {
              insertRecognitionSubQuestion(question.id, index, 'single_choice');
              return;
            }
            openPlacementMenu();
          }}
          type="button"
        >
          <CirclePlus className="h-[20px] w-[20px] stroke-[2.4]" />
        </button>
        {isMenuOpen && !isFixedSingleChoice ? (
          <div className="absolute right-[42px] top-[36px] z-40 flex items-start rounded-[8px] text-[18px] leading-none text-[#343a40] shadow-[0_16px_38px_rgba(31,44,58,0.18)]">
            <div className="w-[186px] overflow-hidden rounded-[8px] border border-[#e3e7eb] bg-white py-[6px]">
              {[
                { value: 'before' as const, label: '在上方添加子题' },
                { value: 'after' as const, label: '在下方添加子题' },
              ].map((item) => (
                <button
                  key={item.value}
                  className={`flex h-[44px] w-full items-center justify-between gap-[8px] whitespace-nowrap px-[18px] text-left active:bg-[#f3f5f6] ${
                    recognitionAddSubMenu?.placement === item.value ? 'text-[#23bfb2]' : ''
                  }`}
                  onClick={() => selectPlacement(item.value)}
                  type="button"
                >
                  <span>{item.label}</span>
                  <ChevronDown className="h-[18px] w-[18px] -rotate-90 stroke-[2.4]" />
                </button>
              ))}
            </div>
            {recognitionAddSubMenu?.placement ? (
              <div className="ml-[4px] w-[92px] overflow-hidden rounded-[8px] border border-[#e3e7eb] bg-white py-[6px]">
                {subQuestionTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    className="h-[42px] w-full whitespace-nowrap px-[18px] text-left active:bg-[#f3f5f6]"
                    onClick={() => insertRecognitionSubQuestion(question.id, recognitionAddSubMenu.afterIndex, option.value)}
                    type="button"
                  >
                    {option.label.replace('题', '')}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  };

  const renderRecognitionSubQuestion = (question: ReviewQuestion, subQuestion: ReviewQuestion['subQuestions'][number], index: number, readOnly = false) => {
    const isFixedSingleChoice = isEnglishSubjectName(subject) && (question.questionType === 'reading_comprehension' || question.questionType === 'cloze');
    const isEnglishClozeSubQuestion = isEnglishSubjectName(subject) && question.questionType === 'cloze';

    return (
      <div className="rounded-[8px] bg-[#f7f8f9] px-[18px] py-[18px]">
        <div className="mb-[14px] flex items-center justify-between">
          <div className="flex items-center gap-[14px]">
            <span className="text-[22px] font-semibold leading-none text-[#202124]">（{index + 1}）</span>
            {isFixedSingleChoice ? (
              <span className="inline-flex h-[34px] items-center rounded-[6px] bg-[#eceff1] px-[14px] text-[18px] leading-none text-[#5c6166]">
                单选
              </span>
            ) : (
              <label className="relative inline-flex h-[34px] min-w-[104px] items-center rounded-[6px] bg-[#eceff1] pl-[14px] pr-[36px] text-[18px] leading-none text-[#5c6166]">
                <select
                  aria-label="子题题型"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  disabled={readOnly}
                  onChange={(event) => {
                    const value = event.target.value as ReviewQuestionType;
                    updateQuestion(question.id, (currentQuestion) => ({
                      ...currentQuestion,
                      subQuestions: currentQuestion.subQuestions.map((currentSubQuestion) => (
                        currentSubQuestion.id === subQuestion.id
                          ? {
                              ...currentSubQuestion,
                              blankAnswers: value === 'fill_blank' ? createBlankAnswers(Math.max(1, currentSubQuestion.blankCount), currentSubQuestion.blankAnswers) : currentSubQuestion.blankAnswers,
                              blankCount: value === 'fill_blank' ? Math.max(1, currentSubQuestion.blankCount) : currentSubQuestion.blankCount,
                              optionContents: isChoiceLikeQuestionType(value)
                                ? buildOptionContents(value, getDefaultOptionCount(value, currentSubQuestion.optionCount), currentSubQuestion.optionContents || {})
                                : {},
                              optionCount: getDefaultOptionCount(value, currentSubQuestion.optionCount),
                              questionType: value,
                            }
                          : currentSubQuestion
                      )),
                    }));
                  }}
                  value={subQuestion.questionType}
                >
                  {reviewQuestionTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label.replace('题', '')}
                    </option>
                  ))}
                </select>
                <span>{getReviewQuestionTypeLabel(subQuestion.questionType).replace('题', '')}</span>
                <ChevronDown className="absolute right-[10px] top-1/2 h-[22px] w-[22px] -translate-y-1/2 stroke-[2.4] text-[#555b61]" />
              </label>
            )}
          </div>
          <div className="flex items-center gap-[4px]">
            {renderRecognitionSubQuestionAddMenu(question, subQuestion, index)}
            {question.subQuestions.length > 1 ? (
              <button
                aria-label="删除子题"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-full text-[#7b8085] active:bg-[#eceff1] active:text-[#d84a4a]"
                onClick={(event) => {
                  event.stopPropagation();
                  requestDeleteSubQuestion(question, subQuestion, 'recognition');
                }}
                type="button"
              >
                <Trash2 className="h-[20px] w-[20px]" />
              </button>
            ) : null}
          </div>
        </div>

        {question.questionType !== 'cloze' ? (
          <div className="mb-[16px]">
            {renderLinkedFieldRow(
              '题',
              { questionId: question.id, field: 'content', subQuestionId: subQuestion.id },
              '关联子题题干',
              subQuestion.questionType === 'fill_blank'
                ? renderFillBlankStemEditor(subQuestion.content || '', (value) => {
                    updateQuestion(question.id, (currentQuestion) => ({
                      ...currentQuestion,
                      subQuestions: currentQuestion.subQuestions.map((currentSubQuestion) => (
                        currentSubQuestion.id === subQuestion.id
                          ? {
                              ...currentSubQuestion,
                              blankAnswers: createBlankAnswers(countInlineBlanks(value), currentSubQuestion.blankAnswers),
                              blankCount: countInlineBlanks(value),
                              content: value,
                            }
                          : currentSubQuestion
                      )),
                    }));
                  }, isManualLinkTargetProcessing({ questionId: question.id, field: 'content', subQuestionId: subQuestion.id }), '子题题干识别中...', {
                    editorId: `tablet-stem-${question.id}-${subQuestion.id}`,
                    readOnly,
                    onBlankInsert: (nextValue, insertStart) => {
                      updateQuestion(question.id, (currentQuestion) => ({
                        ...currentQuestion,
                        subQuestions: currentQuestion.subQuestions.map((currentSubQuestion) => {
                          if (currentSubQuestion.id !== subQuestion.id) return currentSubQuestion;
                          const nextBlankAnswers = syncBlankAnswersByInsertedToken(
                            currentSubQuestion.content,
                            nextValue,
                            currentSubQuestion.blankAnswers,
                            insertStart,
                          );
                          return {
                            ...currentSubQuestion,
                            answer: nextBlankAnswers.filter(Boolean).join('；'),
                            blankAnswers: nextBlankAnswers,
                            blankCount: nextBlankAnswers.length,
                            content: nextValue,
                          };
                        }),
                      }));
                    },
                  })
                : renderRecognitionTextAreaV2(subQuestion.content || '', (value) => {
                    updateQuestion(question.id, (currentQuestion) => ({
                      ...currentQuestion,
                      subQuestions: currentQuestion.subQuestions.map((currentSubQuestion) => (
                        currentSubQuestion.id === subQuestion.id
                          ? { ...currentSubQuestion, content: value }
                          : currentSubQuestion
                      )),
                    }));
                  }, '子题题干', isManualLinkTargetProcessing({ questionId: question.id, field: 'content', subQuestionId: subQuestion.id }), '子题题干识别中...', {
                    editorId: `tablet-stem-${question.id}-${subQuestion.id}`,
                    readOnly,
                  }),
            )}
          </div>
        ) : null}

        {isChoiceLikeQuestionType(subQuestion.questionType) ? (
          <div>
            {subQuestion.questionType !== 'judge' && !isEnglishClozeSubQuestion ? (
              <div className="mb-[12px] flex items-center gap-[12px]" onClick={(event) => event.stopPropagation()}>
                {renderOptionLinkPill({ questionId: question.id, field: 'optionContent', subQuestionId: subQuestion.id })}
                <CountStepper
                  label="选项数"
                  disabled={readOnly}
                  max={26}
                  min={2}
                  onChange={(value) => {
                    updateQuestion(question.id, (currentQuestion) => ({
                      ...currentQuestion,
                      subQuestions: currentQuestion.subQuestions.map((currentSubQuestion) => (
                        currentSubQuestion.id === subQuestion.id
                          ? {
                              ...currentSubQuestion,
                              optionContents: buildOptionContents(currentSubQuestion.questionType, value, currentSubQuestion.optionContents || {}),
                              optionCount: value,
                            }
                          : currentSubQuestion
                      )),
                    }));
                  }}
                 value={subQuestion.optionCount}
                />
              </div>
            ) : (
              <div className="mb-[12px]" onClick={(event) => event.stopPropagation()}>
                {renderOptionLinkPill({ questionId: question.id, field: 'optionContent', subQuestionId: subQuestion.id })}
              </div>
            )}
            {renderRecognitionOptionsV2(
              subQuestion.questionType,
              subQuestion.optionCount,
              subQuestion.optionContents,
              (letter, value) => {
                updateQuestion(question.id, (currentQuestion) => ({
                  ...currentQuestion,
                  subQuestions: currentQuestion.subQuestions.map((currentSubQuestion) => (
                    currentSubQuestion.id === subQuestion.id
                      ? { ...currentSubQuestion, optionContents: { ...(currentSubQuestion.optionContents || {}), [letter]: value } }
                      : currentSubQuestion
                  )),
                }));
              },
              { questionId: question.id, field: 'optionContent', subQuestionId: subQuestion.id },
              {
                optionAnalyses: subQuestion.optionAnalyses,
                onOptionAnalysisChange: (letter, value) => {
                  updateQuestion(question.id, (currentQuestion) => ({
                    ...currentQuestion,
                    subQuestions: currentQuestion.subQuestions.map((currentSubQuestion) => (
                      currentSubQuestion.id === subQuestion.id
                        ? {
                            ...currentSubQuestion,
                            optionAnalyses: { ...(currentSubQuestion.optionAnalyses || {}), [letter]: value },
                          }
                        : currentSubQuestion
                    )),
                  }));
                },
                readOnly,
                withOptionAnalysis: isEnglishClozeSubQuestion,
              },
            )}
          </div>
        ) : null}

        {shouldShowAnswerAnalysis ? renderSubQuestionAnswerAnalysis(question, subQuestion, {
          hideAnalysis: isEnglishClozeSubQuestion,
          hideAnswerConfig: true,
          readOnly,
        }) : null}
      </div>
    );
  };

  const renderAnswerLabel = (label: '答案' | '解析', target: TabletManualLinkTarget, isMatched: boolean) => (
    renderFieldLinkBadge(label === '答案' ? '答' : '析', target, `关联${label}`, { warning: !isMatched })
  );

  const renderChoiceAnswerButtons = (
    entity: ReviewQuestion | ReviewQuestion['subQuestions'][number],
    onChange: (value: string) => void,
    readOnly = false,
  ) => {
    const count = entity.questionType === 'judge' ? 2 : entity.optionCount;
    const selectedLetters = (entity.answer || '').toUpperCase().split('');
    return (
      <div className="flex flex-wrap gap-[12px]" onClick={(event) => event.stopPropagation()}>
        {OPTION_LETTERS.slice(0, count).split('').map((letter) => {
          const label = entity.questionType === 'judge' ? getDefaultOptionContent(entity.questionType, letter) : letter;
          const isSelected = selectedLetters.includes(letter);
          return (
            <button
              key={letter}
              className={`h-[46px] min-w-[46px] rounded-[7px] border px-[14px] text-[22px] font-medium leading-none ${
                isSelected
                  ? 'border-[#23bfb2] bg-[#23bfb2] text-white'
                  : 'border-[#cfd5da] bg-white text-[#5c6166] active:border-[#23bfb2] active:text-[#16a69a]'
              }`}
              disabled={readOnly}
              onClick={() => {
                if (readOnly) return;
                if (entity.questionType === 'multiple_choice') {
                  const nextLetters = isSelected
                    ? selectedLetters.filter((item) => item !== letter)
                    : [...selectedLetters, letter].sort((a, b) => OPTION_LETTERS.indexOf(a) - OPTION_LETTERS.indexOf(b));
                  onChange(nextLetters.join(''));
                  return;
                }
                onChange(isSelected ? '' : letter);
              }}
              type="button"
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  };

  const renderAnswerInput = (
    entity: ReviewQuestion | ReviewQuestion['subQuestions'][number],
    onChange: (value: string) => void,
    onBlankChange: (index: number, value: string) => void,
    isProcessing: boolean,
    readOnly = false,
    options: { blankAnswerMarker?: React.ReactNode } = {},
  ) => {
    if (isProcessing) return renderFieldLoading('答案识别中...');
    if (isChoiceLikeQuestionType(entity.questionType)) {
      return renderChoiceAnswerButtons(entity, onChange, readOnly);
    }
    if (entity.questionType === 'fill_blank') {
      return (
        <div
          className="relative space-y-[12px]"
          data-req-anchor={options.blankAnswerMarker ? 'tablet-review-qa-image.blank-answers' : undefined}
          onClick={(event) => event.stopPropagation()}
        >
          {options.blankAnswerMarker}
          {createBlankAnswers(entity.blankCount, entity.blankAnswers).map((value, index) => (
            <label key={index} className="flex items-center gap-[12px]">
              <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-[#b6bec6] text-[20px] leading-none text-[#5c6166]">
                {index + 1}
              </span>
              <input
                className="h-[46px] flex-1 border-0 border-b border-[#d7dde3] bg-transparent px-[4px] text-[20px] text-[#2f363d] outline-none focus:border-[#23bfb2]"
                onChange={(event) => onBlankChange(index, event.target.value)}
                placeholder="请输入答案"
                readOnly={readOnly}
                value={value}
              />
            </label>
          ))}
        </div>
      );
    }
    return (
      <input
        className="h-[52px] w-full rounded-[6px] border border-[#d7dde3] bg-white px-[16px] text-[20px] text-[#2f363d] outline-none focus:border-[#23bfb2]"
        onChange={(event) => onChange(event.target.value)}
        onClick={(event) => event.stopPropagation()}
        placeholder="请输入答案"
        readOnly={readOnly}
        value={entity.answer || ''}
      />
    );
  };

  const renderAnalysisInput = (
    value: string | undefined,
    onChange: (value: string) => void,
    isProcessing: boolean,
    readOnly = false,
  ) => (
    isProcessing ? renderFieldLoading('解析识别中...') : (
      <AutoResizeTextarea
        className="min-h-[58px] w-full resize-none overflow-hidden rounded-[6px] border border-[#d7dde3] bg-white px-[16px] py-[12px] text-[20px] leading-[1.55] text-[#2f363d] outline-none focus:border-[#23bfb2]"
        onChange={onChange}
        onClick={(event) => event.stopPropagation()}
        placeholder="请输入解析"
        readOnly={readOnly}
        value={value || ''}
      />
    )
  );

  const renderParentAnswerAnalysis = (question: ReviewQuestion, options: { hideAnswer?: boolean; hideAnalysis?: boolean; readOnly?: boolean } = {}) => {
    const shouldShowQaMarkers = shouldShowAnswerAnalysis && questions.findIndex((item) => item.id === question.id) === 0;
    const firstFillBlankAnswerQuestionId = questions.find((item) => item.questionType === 'fill_blank')?.id;
    const shouldShowBlankAnswerMarker = shouldShowAnswerAnalysis && question.id === firstFillBlankAnswerQuestionId;

    return (
      <div className="mt-[22px] space-y-[18px]">
        {!options.hideAnswer ? (
          <div>
            {renderLinkedFieldRow(
              '答',
              { questionId: question.id, field: 'answer' },
              '关联答案',
              renderAnswerInput(
                question,
                (value) => updateQuestion(question.id, (currentQuestion) => applyAnswerValue(currentQuestion, value)),
                (index, value) => updateQuestion(question.id, (currentQuestion) => {
                  const nextBlankAnswers = createBlankAnswers(currentQuestion.blankCount, currentQuestion.blankAnswers);
                  nextBlankAnswers[index] = value;
                  return { ...currentQuestion, blankAnswers: nextBlankAnswers, answer: nextBlankAnswers.filter(Boolean).join('；') };
                }),
                isManualLinkTargetProcessing({ questionId: question.id, field: 'answer' }),
                options.readOnly,
                {
                  blankAnswerMarker: shouldShowBlankAnswerMarker
                    ? renderReviewQaImageRequirementMarker('TABLET_REVIEW_QA_IMAGE-013', 'right-[-14px] top-[-14px] z-40')
                    : null,
                },
              ),
              {
                fieldRequirementId: shouldShowQaMarkers ? 'TABLET_REVIEW_QA_IMAGE-004' : undefined,
                linkReqAnchor: shouldShowQaMarkers ? 'tablet-review-qa-image.answer-link-icon' : undefined,
                linkRequirementId: shouldShowQaMarkers ? 'TABLET_REVIEW_QA_IMAGE-006' : undefined,
                reqAnchor: shouldShowQaMarkers ? 'tablet-review-qa-image.parent-answer' : undefined,
                warning: !hasQuestionAnswer(question),
              },
            )}
          </div>
        ) : null}
        {!options.hideAnalysis ? (
          <div>
            {renderLinkedFieldRow(
              '析',
              { questionId: question.id, field: 'analysis' },
              '关联解析',
              renderAnalysisInput(
                question.analysis,
                (value) => updateQuestion(question.id, (currentQuestion) => ({ ...currentQuestion, analysis: value })),
                isManualLinkTargetProcessing({ questionId: question.id, field: 'analysis' }),
                options.readOnly,
              ),
              {
                fieldRequirementId: shouldShowQaMarkers ? 'TABLET_REVIEW_QA_IMAGE-005' : undefined,
                linkReqAnchor: shouldShowQaMarkers ? 'tablet-review-qa-image.analysis-link-icon' : undefined,
                linkRequirementId: shouldShowQaMarkers ? 'TABLET_REVIEW_QA_IMAGE-007' : undefined,
                reqAnchor: shouldShowQaMarkers ? 'tablet-review-qa-image.parent-analysis' : undefined,
                warning: !isUsableText(question.analysis),
                warningTone: 'muted',
              },
            )}
          </div>
        ) : null}
      </div>
    );
  };

  const renderSubQuestionAnswerAnalysis = (
    question: ReviewQuestion,
    subQuestion: ReviewQuestion['subQuestions'][number],
    options: { hideAnalysis?: boolean; hideAnswerConfig?: boolean; readOnly?: boolean } = {},
  ) => {
    const firstCompoundQuestionId = questions.find((item) => (
      canAddReviewSubQuestions(item.questionType, subject) && item.subQuestions.length > 0
    ))?.id;
    const shouldShowQaMarkers =
      shouldShowAnswerAnalysis &&
      question.id === firstCompoundQuestionId &&
      question.subQuestions.findIndex((item) => item.id === subQuestion.id) === 0;
    const shouldShowBlankAnswerMarker = shouldShowQaMarkers && subQuestion.questionType === 'fill_blank';

    return (
      <div className="mt-[16px] space-y-[16px]">
      {!options.hideAnswerConfig && (subQuestion.questionType === 'single_choice' || subQuestion.questionType === 'multiple_choice') ? (
        <div onClick={(event) => event.stopPropagation()}>
          <CountStepper
            disabled={options.readOnly}
            label="选项数"
            max={26}
            min={2}
            onChange={(value) => updateQuestion(question.id, (currentQuestion) => ({
              ...currentQuestion,
              subQuestions: currentQuestion.subQuestions.map((currentSubQuestion) => (
                currentSubQuestion.id === subQuestion.id ? {
                  ...currentSubQuestion,
                  optionContents: buildOptionContents(currentSubQuestion.questionType, value, currentSubQuestion.optionContents || {}),
                  optionCount: value,
                } : currentSubQuestion
              )),
            }))}
            value={subQuestion.optionCount}
          />
        </div>
      ) : null}
      {!options.hideAnswerConfig && subQuestion.questionType === 'fill_blank' ? (
        <div onClick={(event) => event.stopPropagation()}>
          <CountStepper
            disabled={options.readOnly}
            label="空数"
            onChange={(value) => updateQuestion(question.id, (currentQuestion) => ({
              ...currentQuestion,
              subQuestions: currentQuestion.subQuestions.map((currentSubQuestion) => {
                if (currentSubQuestion.id !== subQuestion.id) return currentSubQuestion;
                const nextBlankAnswers = createBlankAnswers(value, currentSubQuestion.blankAnswers);
                return {
                  ...currentSubQuestion,
                  answer: nextBlankAnswers.filter(Boolean).join('；'),
                  blankAnswers: nextBlankAnswers,
                  blankCount: value,
                };
              }),
            }))}
            value={subQuestion.blankCount}
          />
        </div>
      ) : null}
      <div>
          {renderLinkedFieldRow(
            '答',
            { questionId: question.id, field: 'answer', subQuestionId: subQuestion.id },
            '关联答案',
          renderAnswerInput(
            subQuestion,
            (value) => updateQuestion(question.id, (currentQuestion) => ({
              ...currentQuestion,
              subQuestions: currentQuestion.subQuestions.map((currentSubQuestion) => (
                currentSubQuestion.id === subQuestion.id ? applyAnswerValue(currentSubQuestion, value) : currentSubQuestion
              )),
            })),
            (index, value) => updateQuestion(question.id, (currentQuestion) => ({
              ...currentQuestion,
              subQuestions: currentQuestion.subQuestions.map((currentSubQuestion) => {
                if (currentSubQuestion.id !== subQuestion.id) return currentSubQuestion;
                const nextBlankAnswers = createBlankAnswers(currentSubQuestion.blankCount, currentSubQuestion.blankAnswers);
                nextBlankAnswers[index] = value;
                return { ...currentSubQuestion, blankAnswers: nextBlankAnswers, answer: nextBlankAnswers.filter(Boolean).join('；') };
              }),
            })),
            isManualLinkTargetProcessing({ questionId: question.id, field: 'answer', subQuestionId: subQuestion.id }),
            options.readOnly,
            {
              blankAnswerMarker: shouldShowBlankAnswerMarker
                ? renderReviewQaImageRequirementMarker('TABLET_REVIEW_QA_IMAGE-013', 'right-[-14px] top-[-14px] z-40')
                : null,
            },
          ),
          {
            fieldRequirementId: shouldShowQaMarkers ? 'TABLET_REVIEW_QA_IMAGE-015' : undefined,
            linkReqAnchor: shouldShowQaMarkers ? 'tablet-review-qa-image.answer-link-icon' : undefined,
            linkRequirementId: shouldShowQaMarkers ? 'TABLET_REVIEW_QA_IMAGE-006' : undefined,
            reqAnchor: shouldShowQaMarkers ? 'tablet-review-qa-image.sub-answer' : undefined,
            warning: !hasQuestionAnswer(subQuestion),
          },
        )}
      </div>
      {!options.hideAnalysis ? (
        <div>
          {renderLinkedFieldRow(
            '析',
            { questionId: question.id, field: 'analysis', subQuestionId: subQuestion.id },
            '关联解析',
            renderAnalysisInput(
              subQuestion.analysis,
              (value) => updateQuestion(question.id, (currentQuestion) => ({
                ...currentQuestion,
                subQuestions: currentQuestion.subQuestions.map((currentSubQuestion) => (
                  currentSubQuestion.id === subQuestion.id ? { ...currentSubQuestion, analysis: value } : currentSubQuestion
                )),
              })),
              isManualLinkTargetProcessing({ questionId: question.id, field: 'analysis', subQuestionId: subQuestion.id }),
              options.readOnly,
            ),
            {
              fieldRequirementId: shouldShowQaMarkers ? 'TABLET_REVIEW_QA_IMAGE-016' : undefined,
              linkReqAnchor: shouldShowQaMarkers ? 'tablet-review-qa-image.analysis-link-icon' : undefined,
              linkRequirementId: shouldShowQaMarkers ? 'TABLET_REVIEW_QA_IMAGE-007' : undefined,
              reqAnchor: shouldShowQaMarkers ? 'tablet-review-qa-image.sub-analysis' : undefined,
              warning: !isUsableText(subQuestion.analysis),
              warningTone: 'muted',
            },
          )}
        </div>
      ) : null}
      </div>
    );
  };

  const updateImageModeSubQuestionType = (questionId: string, subQuestionId: string, value: ReviewQuestionType) => {
    updateQuestion(questionId, (currentQuestion) => ({
      ...currentQuestion,
      subQuestions: currentQuestion.subQuestions.map((subQuestion) => (
        subQuestion.id === subQuestionId
          ? {
              ...subQuestion,
              blankAnswers: value === 'fill_blank' ? createBlankAnswers(Math.max(1, subQuestion.blankCount), subQuestion.blankAnswers) : subQuestion.blankAnswers,
              blankCount: value === 'fill_blank' ? Math.max(1, subQuestion.blankCount) : subQuestion.blankCount,
              optionContents: isChoiceLikeQuestionType(value) ? buildOptionContents(value, getDefaultOptionCount(value, subQuestion.optionCount), subQuestion.optionContents || {}) : {},
              optionCount: getDefaultOptionCount(value, subQuestion.optionCount),
              questionType: value,
            }
          : subQuestion
      )),
    }));
  };

  const deleteImageModeSubQuestion = (questionId: string, subQuestionId: string) => {
    updateQuestion(questionId, (currentQuestion) => ({
      ...currentQuestion,
      blankCount: currentQuestion.questionType === 'cloze'
        ? Math.max(1, currentQuestion.subQuestions.length - 1)
        : currentQuestion.blankCount,
      subQuestions: currentQuestion.subQuestions.filter((subQuestion) => subQuestion.id !== subQuestionId),
    }));
  };

  const renderImageModeSubQuestionAddMenu = (
    question: ReviewQuestion,
    subQuestion: ReviewQuestion['subQuestions'][number],
  ) => {
    if (question.questionType === 'cloze') {
      return null;
    }

    const currentMenu = imageModeAddSubMenu;
    const isOpen = currentMenu?.questionId === question.id && currentMenu.subQuestionId === subQuestion.id;
    const subQuestionTypeOptions = getImageModeSubQuestionOptions();
    const openPlacementMenu = () => {
      setImageModeTypeMenu(null);
      setImageModeAddSubMenu(isOpen ? null : { questionId: question.id, subQuestionId: subQuestion.id });
    };
    const selectPlacement = (placement: 'before' | 'after') => {
      setImageModeAddSubMenu({ questionId: question.id, subQuestionId: subQuestion.id, placement });
    };

    return (
      <div className="relative">
        <button
          aria-label="添加子题"
          className={`flex h-[38px] w-[38px] items-center justify-center rounded-full active:bg-[#e6faf7] ${
            isOpen ? 'text-[#23bfb2]' : 'text-[#7b8085]'
          }`}
          onClick={(event) => {
            event.stopPropagation();
            openPlacementMenu();
          }}
          type="button"
        >
          <CirclePlus className="h-[20px] w-[20px] stroke-[2.4]" />
        </button>
        {isOpen ? (
          <div className="absolute right-[42px] top-[36px] z-40 flex items-start rounded-[8px] text-[18px] leading-none text-[#343a40] shadow-[0_16px_38px_rgba(31,44,58,0.18)]">
            <div className="w-[186px] overflow-hidden rounded-[8px] border border-[#e3e7eb] bg-white py-[6px]">
              {[
                { value: 'before' as const, label: '在上方添加子题' },
                { value: 'after' as const, label: '在下方添加子题' },
              ].map((item) => (
                <button
                  key={item.value}
                  className={`flex h-[44px] w-full items-center justify-between gap-[8px] whitespace-nowrap px-[18px] text-left active:bg-[#f3f5f6] ${
                    currentMenu?.placement === item.value ? 'text-[#23bfb2]' : ''
                  }`}
                  onClick={(event) => {
                    event.stopPropagation();
                    selectPlacement(item.value);
                  }}
                  type="button"
                >
                  <span>{item.label}</span>
                  <ChevronDown className="h-[18px] w-[18px] -rotate-90 stroke-[2.4]" />
                </button>
              ))}
            </div>
            {currentMenu?.placement ? (
              <div className="ml-[4px] w-[92px] overflow-hidden rounded-[8px] border border-[#e3e7eb] bg-white py-[6px]">
                {subQuestionTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    className="h-[42px] w-full whitespace-nowrap px-[18px] text-left active:bg-[#f3f5f6]"
                    onClick={(event) => {
                      event.stopPropagation();
                      insertImageModeSubQuestion(question.id, subQuestion.id, currentMenu.placement!, option.value);
                    }}
                    type="button"
                  >
                    {option.label.replace('题', '')}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  };

  const renderImageModeSubQuestionHeader = (
    question: ReviewQuestion,
    subQuestion: ReviewQuestion['subQuestions'][number],
    index: number,
    options: { fixedSingleChoice?: boolean; readOnly?: boolean } = {},
  ) => {
    const typeMenuOpen = imageModeTypeMenu?.questionId === question.id && imageModeTypeMenu.subQuestionId === subQuestion.id;
    const subQuestionTypeOptions = getImageModeSubQuestionOptions();

    return (
      <div className="mb-[12px] flex items-center justify-between gap-[12px]">
        <div className="flex items-center gap-[12px]">
          <span className="text-[22px] font-semibold leading-none text-[#202124]">（{index + 1}）</span>
          {options.fixedSingleChoice ? (
            <span className="inline-flex h-[34px] items-center rounded-[6px] bg-[#eceff1] px-[14px] text-[18px] leading-none text-[#5c6166]">
              单选
            </span>
          ) : (
            <div className="relative">
              <button
                aria-label="子题题型"
                className="inline-flex h-[34px] min-w-[104px] items-center justify-between gap-[10px] rounded-[6px] bg-[#eceff1] pl-[14px] pr-[10px] text-[18px] leading-none text-[#5c6166] active:text-[#23bfb2] disabled:text-[#a7adb3]"
                disabled={options.readOnly}
                onClick={(event) => {
                  event.stopPropagation();
                  setImageModeAddSubMenu(null);
                  setImageModeTypeMenu((current) => (
                    current?.questionId === question.id && current.subQuestionId === subQuestion.id
                      ? null
                      : { questionId: question.id, subQuestionId: subQuestion.id }
                  ));
                }}
                type="button"
              >
                <span>{getReviewQuestionTypeLabel(subQuestion.questionType).replace('题', '')}</span>
                <ChevronDown className="h-[22px] w-[22px] shrink-0 stroke-[2.4] text-[#555b61]" />
              </button>
              {typeMenuOpen && !options.readOnly ? (
                <div className="absolute left-0 top-[40px] z-50 w-[118px] overflow-hidden rounded-[8px] border border-[#e3e7eb] bg-white py-[6px] text-[18px] leading-none text-[#343a40] shadow-[0_16px_38px_rgba(31,44,58,0.18)]">
                  {subQuestionTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`h-[42px] w-full whitespace-nowrap px-[18px] text-left active:bg-[#f3f5f6] ${
                        subQuestion.questionType === option.value ? 'text-[#23bfb2]' : ''
                      }`}
                      onClick={(event) => {
                        event.stopPropagation();
                        updateImageModeSubQuestionType(question.id, subQuestion.id, option.value);
                        setImageModeTypeMenu(null);
                      }}
                      type="button"
                    >
                      {option.label.replace('题', '')}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
        <div className="flex items-center gap-[4px]">
          {renderImageModeSubQuestionAddMenu(question, subQuestion)}
          {question.subQuestions.length > 1 ? (
            <button
              aria-label="删除子题"
              className="flex h-[38px] w-[38px] items-center justify-center rounded-full text-[#7b8085] active:bg-[#eceff1] active:text-[#d84a4a]"
              onClick={(event) => {
                event.stopPropagation();
                requestDeleteSubQuestion(question, subQuestion, 'image');
              }}
              type="button"
            >
              <Trash2 className="h-[20px] w-[20px]" />
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  const renderImageModeAnswerAnalysis = (question: ReviewQuestion, readOnly = false) => {
    if (!shouldShowAnswerAnalysis) return null;
    const isEnglishSubject = isEnglishSubjectName(subject);
    const firstCompoundQuestionId = questions.find((item) => (
      item.viewMode === 'image' &&
      canAddReviewSubQuestions(item.questionType, subject) &&
      item.subQuestions.length > 0
    ))?.id;
    const shouldShowQaSubQuestionStructureMarker = question.id === firstCompoundQuestionId;

    if (canAddReviewSubQuestions(question.questionType, subject) && question.questionType !== 'cloze') {
      return (
        <div className="mt-[22px] space-y-[16px]">
          {question.subQuestions.map((subQuestion, index) => (
            <div
              key={subQuestion.id}
              className="relative rounded-[8px] bg-[#f7f8f9] px-[18px] py-[18px]"
              data-req-anchor={shouldShowQaSubQuestionStructureMarker && index === 0 ? 'tablet-review-qa-image.subquestions' : undefined}
            >
              {shouldShowQaSubQuestionStructureMarker && index === 0
                ? renderReviewQaImageRequirementMarker('TABLET_REVIEW_QA_IMAGE-022', 'left-[12px] top-[-12px] z-40')
                : null}
              {renderImageModeSubQuestionHeader(question, subQuestion, index, { fixedSingleChoice: isEnglishSubject && question.questionType === 'reading_comprehension', readOnly })}
              {renderSubQuestionAnswerAnalysis(question, subQuestion, { readOnly })}
            </div>
          ))}
        </div>
      );
    }

    if (isEnglishSubject && question.questionType === 'cloze') {
      return (
        <div className="mt-[22px] space-y-[16px]">
          {question.subQuestions.map((subQuestion, index) => (
            <div
              key={subQuestion.id}
              className="relative rounded-[8px] bg-[#f7f8f9] px-[18px] py-[18px]"
              data-req-anchor={shouldShowQaSubQuestionStructureMarker && index === 0 ? 'tablet-review-qa-image.subquestions' : undefined}
            >
              {shouldShowQaSubQuestionStructureMarker && index === 0
                ? renderReviewQaImageRequirementMarker('TABLET_REVIEW_QA_IMAGE-022', 'left-[12px] top-[-12px] z-40')
                : null}
              {renderImageModeSubQuestionHeader(question, subQuestion, index, { fixedSingleChoice: true, readOnly })}
              {renderSubQuestionAnswerAnalysis(question, subQuestion, { hideAnalysis: true, hideAnswerConfig: true, readOnly })}
            </div>
          ))}
          {renderParentAnswerAnalysis(question, { hideAnswer: true, readOnly })}
        </div>
      );
    }

    return renderParentAnswerAnalysis(question, { readOnly });
  };

  const renderRecognitionContent = (question: ReviewQuestion, readOnly = false) => {
    const isEnglishSubject = isEnglishSubjectName(subject);
    const isCloze = isEnglishSubject && question.questionType === 'cloze';
    const isCompound = canAddReviewSubQuestions(question.questionType, subject);
    const showSubQuestionAction = shouldShowReviewSubQuestionAction(question.questionType);
    const isFirstQuestion = questions.findIndex((item) => item.id === question.id) === 0;
    const firstChoiceQuestionId = questions.find((item) => isChoiceLikeQuestionType(item.questionType))?.id;
    const firstFillBlankQuestionId = questions.find((item) => item.questionType === 'fill_blank')?.id;
    const firstCompoundQuestionId = questions.find((item) => (
      canAddReviewSubQuestions(item.questionType, subject) || shouldShowReviewSubQuestionAction(item.questionType)
    ))?.id;
    const shouldShowQaRecognitionStemMarker = shouldShowAnswerAnalysis && globalMode === 'recognition' && isFirstQuestion;
    const shouldShowRecognitionStemMarker = !shouldShowQaRecognitionStemMarker && isFirstQuestion;
    const shouldShowRecognitionOptionsMarker = question.id === firstChoiceQuestionId;
    const shouldShowRecognitionFillBlankMarker = question.id === firstFillBlankQuestionId;
    const shouldShowRecognitionSubQuestionsMarker = question.id === firstCompoundQuestionId;

    return (
      <div className="relative space-y-[18px] rounded-[8px] border border-[#e0e5e9] bg-white p-[18px]">
        <div
          className="relative"
          data-req-anchor={
            shouldShowQaRecognitionStemMarker
              ? 'tablet-review-qa-recognition.stem'
              : shouldShowRecognitionStemMarker
                ? 'tablet-review-recognition.stem'
                : undefined
          }
        >
          {shouldShowQaRecognitionStemMarker
            ? renderReviewQaRecognitionRequirementMarker('TABLET_REVIEW_QA_RECOGNITION-001', 'left-[-8px] top-[-12px] z-40')
            : shouldShowRecognitionStemMarker
              ? renderReviewRecognitionRequirementMarker('TABLET_REVIEW_RECOGNITION-002', 'left-[-8px] top-[-12px] z-40')
              : null}
          {renderLinkedFieldRow(
            '题',
            { questionId: question.id, field: 'content' },
            '关联父题题干',
            question.questionType === 'fill_blank'
              ? renderFillBlankStemEditor(question.content || '', (value) => {
                  updateQuestion(question.id, (currentQuestion) => ({
                    ...currentQuestion,
                    blankAnswers: createBlankAnswers(countInlineBlanks(value), currentQuestion.blankAnswers),
                    blankCount: countInlineBlanks(value),
                    content: value,
                  }));
                }, isManualLinkTargetProcessing({ questionId: question.id, field: 'content' }), '题干识别中...', {
                  editorId: `tablet-stem-${question.id}`,
                  readOnly,
                  onBlankInsert: (nextValue, insertStart) => {
                    updateQuestion(question.id, (currentQuestion) => {
                      const nextBlankAnswers = syncBlankAnswersByInsertedToken(
                        currentQuestion.content,
                        nextValue,
                        currentQuestion.blankAnswers,
                        insertStart,
                      );
                      return {
                        ...currentQuestion,
                        answer: nextBlankAnswers.filter(Boolean).join('；'),
                        blankAnswers: nextBlankAnswers,
                        blankCount: nextBlankAnswers.length,
                        content: nextValue,
                      };
                    });
                  },
                })
              : renderRecognitionTextAreaV2(question.content || '', (value) => {
                  updateQuestion(question.id, (currentQuestion) => ({
                    ...currentQuestion,
                    content: value,
                  }));
                }, '题干', isManualLinkTargetProcessing({ questionId: question.id, field: 'content' }), '题干识别中...', {
                  editorId: `tablet-stem-${question.id}`,
                  readOnly,
                }),
          )}
        </div>

        {isChoiceLikeQuestionType(question.questionType) ? (
          <div
            className="relative"
            data-req-anchor={shouldShowRecognitionOptionsMarker ? 'tablet-review-recognition.options' : undefined}
          >
            {shouldShowRecognitionOptionsMarker
              ? renderReviewRecognitionRequirementMarker('TABLET_REVIEW_RECOGNITION-003', 'right-[8px] top-[-12px] z-40')
              : null}
            {question.questionType !== 'judge' ? (
              <div className="mb-[12px] flex items-center gap-[12px]" onClick={(event) => event.stopPropagation()}>
                {renderOptionLinkPill({ questionId: question.id, field: 'optionContent' })}
                <CountStepper
                  disabled={readOnly}
                  label="选项数"
                  max={26}
                  min={2}
                  onChange={(value) => {
                    updateQuestion(question.id, (currentQuestion) => ({
                      ...currentQuestion,
                      optionContents: buildOptionContents(currentQuestion.questionType, value, currentQuestion.optionContents || {}),
                      optionCount: value,
                    }));
                  }}
                  value={question.optionCount}
                />
              </div>
            ) : (
              <div className="mb-[12px]" onClick={(event) => event.stopPropagation()}>
                {renderOptionLinkPill({ questionId: question.id, field: 'optionContent' })}
              </div>
            )}
            {renderRecognitionOptionsV2(
              question.questionType,
              question.optionCount,
              question.optionContents,
              (letter, value) => {
                updateQuestion(question.id, (currentQuestion) => ({
                  ...currentQuestion,
                  optionContents: { ...(currentQuestion.optionContents || {}), [letter]: value },
                }));
              },
              { questionId: question.id, field: 'optionContent' },
              { readOnly },
            )}
          </div>
        ) : null}

        {isCloze ? (
          <div className="flex items-center gap-[18px] rounded-[7px] bg-[#f3f4f5] px-[16px] py-[10px]" onClick={(event) => event.stopPropagation()}>
            <CountStepper
              disabled={readOnly}
              label="子题数"
              onChange={(value) => {
                updateQuestion(question.id, (currentQuestion) => {
                  const nextSubQuestions = [...currentQuestion.subQuestions];
                  if (value > nextSubQuestions.length) {
                    for (let index = nextSubQuestions.length; index < value; index += 1) {
                      nextSubQuestions.push(createReviewSubQuestion(currentQuestion.id, index, 'single_choice', { optionCount: currentQuestion.optionCount }));
                    }
                  } else {
                    nextSubQuestions.splice(value);
                  }
                  return { ...currentQuestion, blankCount: value, subQuestions: nextSubQuestions };
                });
              }}
              value={question.blankCount}
            />
            <div className="h-[28px] w-px bg-[#c9ced3]" />
            <span className="text-[18px] leading-none text-[#68727d]">题型：</span>
            <span className="inline-flex h-[40px] min-w-[86px] items-center justify-center rounded-[7px] border border-[#d7dde3] bg-[#eceff1] px-[14px] text-[20px] leading-none text-[#7b858f]">单选</span>
            <div className="h-[28px] w-px bg-[#c9ced3]" />
            <CountStepper
              disabled={readOnly}
              label="选项数"
              max={26}
              min={2}
              onChange={(value) => {
                updateQuestion(question.id, (currentQuestion) => ({
                  ...currentQuestion,
                  optionCount: value,
                  subQuestions: currentQuestion.subQuestions.map((subQuestion) => ({
                    ...subQuestion,
                    optionContents: buildOptionContents('single_choice', value, subQuestion.optionContents || {}),
                    optionCount: value,
                  })),
                }));
              }}
              value={question.optionCount}
            />
          </div>
        ) : null}

        {question.questionType === 'fill_blank' ? (
          <div
            className="absolute left-[16px] top-[60px]"
            data-req-anchor={shouldShowRecognitionFillBlankMarker ? 'tablet-review-recognition.fill-blank' : undefined}
          >
            {shouldShowRecognitionFillBlankMarker
              ? renderReviewRecognitionRequirementMarker('TABLET_REVIEW_RECOGNITION-004', 'left-0 top-0 z-40')
              : null}
          </div>
        ) : null}

        {isCompound || showSubQuestionAction ? (
          <div
            className="relative space-y-[4px]"
            data-req-anchor={shouldShowRecognitionSubQuestionsMarker ? 'tablet-review-recognition.subquestions' : undefined}
          >
            {shouldShowRecognitionSubQuestionsMarker
              ? renderReviewRecognitionRequirementMarker('TABLET_REVIEW_RECOGNITION-005', 'right-[8px] top-[-12px] z-40')
              : null}
            {question.subQuestions.map((subQuestion, index) => (
              <div key={subQuestion.id}>
                {renderRecognitionSubQuestion(question, subQuestion, index, readOnly)}
              </div>
            ))}
          </div>
        ) : null}
        {shouldShowAnswerAnalysis && !isCompound ? renderParentAnswerAnalysis(question, { readOnly }) : null}
        {shouldShowAnswerAnalysis && isCloze ? renderParentAnswerAnalysis(question, { hideAnswer: true, readOnly }) : null}
      </div>
    );
  };

  const renderReviewRecognizingContent = (message: string) => (
    <div className="flex h-[204px] w-full flex-col items-center justify-center rounded-[8px] border border-[#dfe4e8] bg-[#f8fafb]">
      <div className="h-[34px] w-[34px] animate-spin rounded-full border-[3px] border-[#cfe5e2] border-t-[#23bfb2]" />
      <div className="mt-[16px] text-[20px] font-medium leading-none text-[#3f4852]">{message}</div>
    </div>
  );

  const renderReviewQuestionSkeleton = (item: { id: string }) => (
    <section
      key={`skeleton-${item.id}`}
      className="relative rounded-[10px] bg-white px-[30px] py-[28px] shadow-[0_4px_14px_rgba(31,44,58,0.04)]"
    >
      <div className="space-y-[20px]">
        <div className="h-[18px] w-[46%] rounded-full bg-gradient-to-r from-[#e3e5e7] via-[#f1f2f3] to-[#e7e9eb]" />
        <div className="h-[18px] w-full rounded-full bg-gradient-to-r from-[#e3e5e7] via-[#f1f2f3] to-[#e7e9eb]" />
        <div className="h-[18px] w-full rounded-full bg-gradient-to-r from-[#e3e5e7] via-[#f1f2f3] to-[#e7e9eb]" />
      </div>
    </section>
  );

  const isQuestionResultLoading = (question: ReviewQuestion) => (
    recognizingReviewBoxIds.has(question.id) ||
    question.questionTypeStatus === 'pending' ||
    (shouldShowAnswerAnalysis && recognitionStatus === 'done' && answerMatchStatus === 'matching')
  );

  const renderQuestionCard = (question: ReviewQuestion) => {
    const isActive = question.id === activeQuestionId;
    const isCropEditing = editingCropQuestionId === question.id;
    const isQuestionEditing = editingQuestionId === question.id;
    const isQuestionRecognizing = recognizingReviewBoxIds.has(question.id);
    const shouldShowCardRequirementMarker = questions.findIndex((item) => item.id === question.id) === 0;
    const firstImageModeCompoundQuestionId = questions.find((item) => (
      item.viewMode === 'image' && canAddReviewSubQuestions(item.questionType, subject)
    ))?.id;
    const shouldShowRecognitionQuestionTypeMarker =
      shouldShowCardRequirementMarker && mode === 'questions_only' && question.viewMode === 'recognition';
    const shouldShowImageSubQuestionMarker =
      mode === 'questions_only' &&
      question.id === firstImageModeCompoundQuestionId &&
      question.viewMode === 'image' &&
      canAddReviewSubQuestions(question.questionType, subject);
    const questionImageData = isCropEditing
      ? question.croppedImageData
      : question.userCroppedImageData || question.croppedImageData;

    return (
      <section
        key={question.id}
        className={`relative rounded-[10px] border-[3px] bg-white shadow-[0_6px_18px_rgba(31,44,58,0.06)] ${
          isActive
            ? 'border-[#23bfb2] shadow-[0_8px_24px_rgba(35,191,178,0.18)]'
            : 'border-transparent'
        }`}
        onClick={() => handleSelectQuestion(question.id)}
      >
        <header className="flex h-[74px] items-center justify-between border-b border-[#edf0f2] px-[24px]">
          <div
            className="relative"
            data-req-anchor={
              shouldShowRecognitionQuestionTypeMarker
                ? 'tablet-review-recognition.type-structure'
                : shouldShowCardRequirementMarker
                  ? 'tablet-review-image.question-type'
                  : undefined
            }
          >
            {shouldShowCardRequirementMarker
              ? renderReviewImageRequirementMarker('TABLET_REVIEW_IMAGE-009', 'right-[-16px] top-[-14px] z-40')
              : null}
            {shouldShowRecognitionQuestionTypeMarker
              ? renderReviewRecognitionRequirementMarker('TABLET_REVIEW_RECOGNITION-006', 'right-[-16px] top-[-14px] z-40')
              : null}
            <div className={isQuestionEditing ? '' : 'pointer-events-none'}>
              <QuestionTypeSelect
                onChange={(value) => {
                  updateQuestion(question.id, (currentQuestion) => {
                    const existingSubQuestions = currentQuestion.subQuestions || [];
                    const nextSubQuestions = (() => {
                      if (value === 'cloze') {
                        return buildSubQuestionsFromContent(currentQuestion.id, 'cloze', currentQuestion.content, currentQuestion.blankCount);
                      }
                      if (value === 'reading_comprehension') {
                        return existingSubQuestions.length > 0
                          ? existingSubQuestions.map((subQuestion) => ({
                              ...subQuestion,
                              optionContents: buildOptionContents('single_choice', Math.max(4, subQuestion.optionCount), subQuestion.optionContents || {}),
                              optionCount: Math.max(4, subQuestion.optionCount),
                              questionType: 'single_choice' as ReviewQuestionType,
                            }))
                          : [createReviewSubQuestion(currentQuestion.id, 0, 'single_choice', { optionCount: 4 })];
                      }
                      if (canAddReviewSubQuestions(value, subject)) {
                        return existingSubQuestions.length > 0
                          ? existingSubQuestions
                          : [createReviewSubQuestion(currentQuestion.id, 0, 'short_answer')];
                      }
                      return [];
                    })();
                    const inlineBlankCount = countInlineBlanks(currentQuestion.content);

                    return {
                      ...currentQuestion,
                      blankAnswers: value === 'fill_blank'
                        ? createBlankAnswers(inlineBlankCount, currentQuestion.blankAnswers)
                        : currentQuestion.blankAnswers,
                      blankCount: value === 'fill_blank'
                        ? inlineBlankCount
                        : value === 'cloze'
                          ? Math.max(1, currentQuestion.blankCount)
                          : currentQuestion.blankCount,
                      content: currentQuestion.content || '',
                      optionContents: isChoiceLikeQuestionType(value)
                        ? buildOptionContents(value, getDefaultOptionCount(value, currentQuestion.optionCount), currentQuestion.optionContents || {})
                        : {},
                      optionCount: value === 'cloze' || value === 'reading_comprehension'
                        ? Math.max(4, currentQuestion.optionCount)
                        : isChoiceLikeQuestionType(value)
                          ? getDefaultOptionCount(value, currentQuestion.optionCount)
                          : currentQuestion.optionCount,
                      questionType: value,
                      questionTypeStatus: 'manual',
                      subQuestions: nextSubQuestions,
                    };
                  });
                }}
                options={reviewQuestionTypeOptions}
                status={question.questionTypeStatus}
                value={question.questionType}
              />
            </div>
          </div>
          <div className="flex items-center gap-[10px]">
            <div
              data-req-anchor={shouldShowCardRequirementMarker ? 'tablet-review-image.edit-toggle' : undefined}
              className="relative"
            >
              {shouldShowCardRequirementMarker
                ? renderReviewImageRequirementMarker('TABLET_REVIEW_IMAGE-010', 'right-[-16px] top-[-14px] z-40')
                : null}
              <button
                className={`h-[42px] rounded-[7px] border px-[16px] text-[19px] font-medium leading-none ${
                  isQuestionEditing
                    ? 'border-[#23bfb2] bg-[#23bfb2] text-white active:bg-[#12a99d]'
                    : 'border-[#cfd5da] bg-white text-[#3f4852] active:bg-[#f4f6f7]'
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  setEditingQuestionId(isQuestionEditing ? null : question.id);
                }}
                type="button"
              >
                {isQuestionEditing ? '完成' : '编辑'}
              </button>
            </div>
            <div
              className="relative"
              data-req-anchor={shouldShowCardRequirementMarker ? 'tablet-review-image.card-mode-switch' : undefined}
            >
              {shouldShowCardRequirementMarker
                ? renderReviewImageRequirementMarker('TABLET_REVIEW_IMAGE-016', 'right-[-14px] top-[-14px] z-40')
                : null}
              <StepSegmentedControl
                mode={question.viewMode}
                onChange={(value) => {
                  updateQuestion(question.id, (currentQuestion) => ({ ...currentQuestion, viewMode: value }));
                }}
              />
            </div>
            <div
              className="relative"
              data-req-anchor={shouldShowCardRequirementMarker ? 'tablet-review-image.more-menu' : undefined}
            >
              {shouldShowCardRequirementMarker
                ? renderReviewImageRequirementMarker('TABLET_REVIEW_IMAGE-018', 'right-[-12px] top-[-12px] z-40')
                : null}
              <button
                aria-label="更多操作"
                className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full text-[#68727d] active:bg-[#f3f5f6]"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenMenuQuestionId(openMenuQuestionId === question.id ? null : question.id);
                }}
                type="button"
              >
                <EllipsisVertical className="h-[24px] w-[24px]" />
              </button>
            </div>
            <div
              data-req-anchor={shouldShowCardRequirementMarker ? 'tablet-review-image.delete-question' : undefined}
              className="relative"
            >
              {shouldShowCardRequirementMarker
                ? renderReviewImageRequirementMarker('TABLET_REVIEW_IMAGE-012', 'right-[-12px] top-[-12px] z-40')
                : null}
              <button
                aria-label="删除题目"
                className="flex h-[42px] w-[42px] items-center justify-center rounded-full text-[#68727d] active:bg-[#fff1f1] active:text-[#e45454]"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteQuestion(question.id);
                }}
                type="button"
              >
                <Trash2 className="h-[22px] w-[22px]" />
              </button>
            </div>
          </div>
        </header>

        {openMenuQuestionId === question.id ? (
          <div className="absolute right-[76px] top-[58px] z-20 w-[190px] overflow-hidden rounded-[10px] border border-[#dfe4e8] bg-white shadow-[0_16px_36px_rgba(31,44,58,0.18)]">
            <button className="flex h-[48px] w-full items-center gap-[10px] px-[16px] text-[19px] text-[#3f4852] active:bg-[#f5f7f8]" onClick={() => handleMoveQuestion(question.id, 'up')} type="button">
              <ArrowUp className="h-[20px] w-[20px]" />
              上移
            </button>
            <button className="flex h-[48px] w-full items-center gap-[10px] px-[16px] text-[19px] text-[#3f4852] active:bg-[#f5f7f8]" onClick={() => handleMoveQuestion(question.id, 'down')} type="button">
              <ArrowDown className="h-[20px] w-[20px]" />
              下移
            </button>
            <button className="flex h-[48px] w-full items-center gap-[10px] px-[16px] text-[19px] text-[#3f4852] active:bg-[#f5f7f8]" onClick={() => setOpenMenuQuestionId(null)} type="button">
              <Search className="h-[20px] w-[20px]" />
              搜相似题
            </button>
          </div>
        ) : null}

        <div className="p-[24px]">
          {isQuestionRecognizing ? (
            renderReviewRecognizingContent('正在重新识别中')
          ) : question.viewMode === 'image' ? (
            <div
              className="relative"
              data-req-anchor={shouldShowCardRequirementMarker ? 'tablet-review-image.crop' : undefined}
            >
              {shouldShowCardRequirementMarker
                ? renderReviewImageRequirementMarker('TABLET_REVIEW_IMAGE-011', 'right-[12px] top-[12px] z-40')
                : null}
              <CroppedQuestionImage
                cropRegion={isCropEditing ? cropRegion : null}
                imageData={questionImageData}
                isEditing={isCropEditing}
                onClick={() => {
                  if (isQuestionEditing) handleStartCrop(question);
                }}
                onCropDragStart={(event, action) => {
                  if (!isQuestionEditing || !cropRegion) return;
                  event.preventDefault();
                  event.stopPropagation();
                  event.currentTarget.setPointerCapture?.(event.pointerId);
                  setCropDrag({
                    action,
                    startClientX: event.clientX,
                    startClientY: event.clientY,
                    startRegion: cropRegion,
                  });
                  hasDraggedCropRef.current = false;
                }}
                onImageLoad={(width, height) => handleQuestionImageLoad(question.id, width, height)}
              />
            </div>
          ) : (
            renderRecognitionContent(question, !isQuestionEditing)
          )}

          {isCropEditing ? (
            <div className="mt-[14px] flex justify-end gap-[12px]">
              <button
                className="h-[40px] rounded-[7px] border border-[#d7dde3] bg-white px-[18px] text-[19px] leading-none text-[#3f4852] active:bg-[#f4f6f7]"
                onClick={(event) => {
                  event.stopPropagation();
                  handleCancelCrop();
                }}
                type="button"
              >
                取消
              </button>
              <button
                className="inline-flex h-[40px] items-center gap-[8px] rounded-[7px] bg-[#23bfb2] px-[18px] text-[19px] font-medium leading-none text-white active:bg-[#12a99d]"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleConfirmCrop();
                }}
                type="button"
              >
                <Check className="h-[19px] w-[19px]" />
                确认裁剪
              </button>
            </div>
          ) : null}

          {question.viewMode === 'image' ? (
          <div className="mt-[18px]">
            {shouldShowReviewSubQuestionAction(question.questionType) ? (
            <div
              className="relative"
              data-req-anchor={shouldShowImageSubQuestionMarker ? 'tablet-review-image.subquestions' : undefined}
            >
              {shouldShowImageSubQuestionMarker
                ? renderReviewImageRequirementMarker('TABLET_REVIEW_IMAGE-017', 'left-[18px] top-[-12px] z-40')
                : null}
              <AnswerConfigPanel
                answerMode={shouldShowAnswerAnalysis}
                onBlankCountChange={(value) => {
                  updateQuestion(question.id, (currentQuestion) => ({
                    ...currentQuestion,
                    blankAnswers: createBlankAnswers(value, currentQuestion.blankAnswers),
                    blankCount: value,
                  }));
                }}
                onDeleteSubQuestion={(subQuestionId) => {
                  const subQuestion = question.subQuestions.find((item) => item.id === subQuestionId);
                  if (subQuestion) {
                    requestDeleteSubQuestion(question, subQuestion, 'image');
                  }
                }}
                onInsertSubQuestion={(subQuestionId, placement, questionType) => {
                  insertImageModeSubQuestion(question.id, subQuestionId, placement, questionType);
                }}
                onOptionCountChange={(value) => {
                  updateQuestion(question.id, (currentQuestion) => ({ ...currentQuestion, optionCount: value }));
                }}
                onSetClozeSubQuestionCount={(value) => {
                  updateQuestion(question.id, (currentQuestion) => {
                    const nextSubQuestions = [...currentQuestion.subQuestions];
                    if (value > nextSubQuestions.length) {
                      for (let index = nextSubQuestions.length; index < value; index += 1) {
                        nextSubQuestions.push(createReviewSubQuestion(currentQuestion.id, index, 'single_choice', { optionCount: currentQuestion.optionCount }));
                      }
                    } else {
                      nextSubQuestions.splice(value);
                    }
                    return { ...currentQuestion, blankCount: value, subQuestions: nextSubQuestions };
                  });
                }}
                onSubQuestionBlankCountChange={(subQuestionId, value) => {
                  updateQuestion(question.id, (currentQuestion) => ({
                    ...currentQuestion,
                    subQuestions: currentQuestion.subQuestions.map((subQuestion) => (
                      subQuestion.id === subQuestionId ? {
                        ...subQuestion,
                        blankAnswers: createBlankAnswers(value, subQuestion.blankAnswers),
                        blankCount: value,
                      } : subQuestion
                    )),
                  }));
                }}
                onSubQuestionOptionCountChange={(subQuestionId, value) => {
                  updateQuestion(question.id, (currentQuestion) => ({
                    ...currentQuestion,
                    subQuestions: currentQuestion.subQuestions.map((subQuestion) => (
                      subQuestion.id === subQuestionId ? { ...subQuestion, optionCount: value } : subQuestion
                    )),
                  }));
                }}
                onSubQuestionTypeChange={(subQuestionId, value) => {
                  updateQuestion(question.id, (currentQuestion) => ({
                    ...currentQuestion,
                    subQuestions: currentQuestion.subQuestions.map((subQuestion) => (
                      subQuestion.id === subQuestionId
                        ? {
                            ...subQuestion,
                            blankAnswers: value === 'fill_blank' ? createBlankAnswers(Math.max(1, subQuestion.blankCount), subQuestion.blankAnswers) : subQuestion.blankAnswers,
                            blankCount: value === 'fill_blank' ? Math.max(1, subQuestion.blankCount) : subQuestion.blankCount,
                            optionContents: isChoiceLikeQuestionType(value) ? buildOptionContents(value, getDefaultOptionCount(value, subQuestion.optionCount), subQuestion.optionContents || {}) : {},
                            optionCount: value === 'multiple_choice' ? Math.max(4, subQuestion.optionCount) : subQuestion.optionCount,
                            questionType: value,
                          }
                        : subQuestion
                    )),
                  }));
                }}
                question={question}
                subject={subject}
              />
            </div>
            ) : null}
            {renderImageModeAnswerAnalysis(question, !isQuestionEditing)}
          </div>
          ) : null}
        </div>
      </section>
    );
  };

  const renderReviewQuestionItems = () => {
    const existingQuestionIds = new Set(questions.map((question) => question.id));
    const sortedBoxes = [...reviewBoxes].sort((firstBox, secondBox) => (
      firstBox.pageNumber - secondBox.pageNumber || firstBox.y - secondBox.y || firstBox.x - secondBox.x
    ));
    const newRecognizingBoxes = sortedBoxes.filter((box) => (
      recognizingReviewBoxIds.has(box.id) && !existingQuestionIds.has(box.id)
    ));
    const items: Array<
      | { type: 'question'; question: ReviewQuestion }
      | { type: 'skeleton'; box: RecognitionBox }
    > = questions.map((question) => ({ type: 'question' as const, question }));

    newRecognizingBoxes.forEach((box) => {
      const boxOrderIndex = sortedBoxes.findIndex((currentBox) => currentBox.id === box.id);
      const nextExistingBox = sortedBoxes.slice(boxOrderIndex + 1).find((currentBox) => (
        existingQuestionIds.has(currentBox.id)
      ));
      const insertIndex = nextExistingBox
        ? items.findIndex((item) => item.type === 'question' && item.question.id === nextExistingBox.id)
        : -1;
      const skeletonItem = { type: 'skeleton' as const, box };

      if (insertIndex >= 0) {
        items.splice(insertIndex, 0, skeletonItem);
      } else {
        items.push(skeletonItem);
      }
    });

    return items.map((item) => (
      item.type === 'question'
        ? (isQuestionResultLoading(item.question) ? renderReviewQuestionSkeleton(item.question) : renderQuestionCard(item.question))
        : renderReviewQuestionSkeleton(item.box)
    ));
  };

  const selectedPendingBoxCount = reviewBoxes.filter((box) => box.selected && pendingReviewBoxIds.has(box.id)).length;
  const shouldShowRecognitionBar = recognitionStatus === 'recognizing' || answerMatchStatus === 'matching';
  const reviewStatusMessage = answerMatchStatus === 'matching'
    ? (answerMatchMessage || '正在匹配答案解析...')
    : (recognitionMessage || '正在识别中...');
  const hasJoinableQuestions = questions.some((question) => (
    !isQuestionResultLoading(question) && question.questionTypeStatus !== 'failed'
  ));
  const missingAnswerQuestionCount = questions.filter(hasMissingAnswerOrAnalysis).length;
  const matchedAnswerQuestionCount = shouldShowAnswerAnalysis
    ? questions.filter((question) => (
        !isQuestionResultLoading(question) &&
        question.questionTypeStatus !== 'failed' &&
        !hasMissingAnswerOrAnalysis(question)
      )).length
    : 0;
  const shouldShowQaMatchSummary = shouldShowAnswerAnalysis && !shouldShowRecognitionBar && questions.length > 0;
  const emptyStemQuestionCount = questions.filter(hasEmptyQuestionStem).length;
  const editingQuestionCount = editingQuestionId && questions.some((question) => question.id === editingQuestionId) ? 1 : 0;
  const handleJoinPaperClick = () => {
    if (!hasJoinableQuestions) return;
    if (emptyStemQuestionCount > 0) {
      setShowJoinEmptyStemDialog(true);
      return;
    }
    if (editingQuestionCount > 0) {
      setShowJoinEditingDialog(true);
      return;
    }
    setShowJoinModeDialog(true);
  };
  const enterPaperEditPage = () => {
    try {
      sessionStorage.setItem(
        'paperEditData',
        JSON.stringify(buildPaperEditDataFromTabletReview(
          questions,
          materialPages,
          subject,
          mode,
          joinPaperMode,
        )),
      );
      sessionStorage.setItem('tabletAiEntryReturnPath', '/tablet-ai-entry');
      router.push('/paper-edit');
    } catch (error) {
      console.error('[tablet-review] paperEditData 写入失败:', error);
      showToast('加入试卷失败，题目数据暂未保存，请重试');
    }
  };
  const handleConfirmMissingJoin = () => {
    setShowJoinMissingDialog(false);
    if (emptyStemQuestionCount > 0) {
      setShowJoinEmptyStemDialog(true);
      return;
    }
    if (editingQuestionCount > 0) {
      setShowJoinEditingDialog(true);
      return;
    }
    enterPaperEditPage();
  };
  const handleConfirmJoinMode = () => {
    setShowJoinModeDialog(false);
    enterPaperEditPage();
  };

  return (
    <div className="absolute inset-0 z-30 bg-[#eef2f5]">
      <header className="absolute left-0 top-0 h-[88px] w-full border-b border-[#e3e7eb] bg-white">
        <div
          data-req-anchor="tablet-review-image.back"
          className="absolute left-[28px] top-[20px]"
        >
          {renderReviewImageRequirementMarker('TABLET_REVIEW_IMAGE-001', 'right-[-18px] top-[-12px] z-40')}
          <button
            aria-label="返回"
            className="flex h-[50px] items-center gap-[6px] rounded-[8px] pr-[16px] text-[#202124] active:bg-[#f3f5f6]"
            onClick={onBackToSelection}
            type="button"
          >
            <ChevronLeft className="h-[34px] w-[34px] stroke-[2.3]" />
            <span className="text-[28px] font-semibold leading-none">核对识别结果</span>
            <span
              className="text-[20px] font-normal leading-none text-[#7b838c]"
            >
              （核对并补充识别出的题目内容）
            </span>
          </button>
        </div>
        <div
          data-req-anchor="tablet-review-image.subject"
          className="absolute right-[188px] top-[24px] rounded-full bg-[#e7f7f1] px-[18px] py-[10px] text-[20px] leading-none text-[#2fac76]"
        >
          {renderReviewImageRequirementMarker('TABLET_REVIEW_IMAGE-002', 'right-[-16px] top-[-14px] z-40')}
          {subject}
        </div>
        <div
          data-req-anchor="tablet-review-image.join-paper"
          className="absolute right-[40px] top-[20px]"
        >
          {renderReviewImageRequirementMarker('TABLET_REVIEW_IMAGE-003', 'right-[-16px] top-[-14px] z-40')}
          <button
            className="h-[48px] rounded-[8px] bg-[#23bfb2] px-[24px] text-[20px] font-medium leading-none text-white active:bg-[#12a99d] disabled:bg-[#cfd7dd] disabled:text-white disabled:active:bg-[#cfd7dd]"
            disabled={!hasJoinableQuestions}
            onClick={handleJoinPaperClick}
            type="button"
          >
            加入试卷
          </button>
        </div>
      </header>

      {toastMessage ? (
        <div className="absolute left-1/2 top-[104px] z-50 -translate-x-1/2 rounded-[8px] bg-[rgba(32,33,36,0.88)] px-[24px] py-[13px] text-[20px] font-medium leading-none text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)]">
          {toastMessage}
        </div>
      ) : null}

      {showJoinMissingDialog ? (
        <JoinMissingAnswerDialog
          missingCount={missingAnswerQuestionCount}
          onCancel={() => setShowJoinMissingDialog(false)}
          onConfirm={handleConfirmMissingJoin}
        />
      ) : null}

      {showJoinEmptyStemDialog ? (
        <JoinEmptyStemDialog
          emptyCount={emptyStemQuestionCount}
          onClose={() => setShowJoinEmptyStemDialog(false)}
        />
      ) : null}

      {showJoinEditingDialog ? (
        <JoinEditingUnsavedDialog
          editingCount={editingQuestionCount}
          onClose={() => setShowJoinEditingDialog(false)}
        />
      ) : null}

      {showJoinModeDialog ? (
        <JoinPaperModeDialog
          mode={joinPaperMode}
          onCancel={() => setShowJoinModeDialog(false)}
          onChange={setJoinPaperMode}
          onConfirm={handleConfirmJoinMode}
        />
      ) : null}

      {pendingSubQuestionDeletion ? (
        <DeleteSubQuestionConfirmDialog
          onCancel={() => setPendingSubQuestionDeletion(null)}
          onConfirm={handleConfirmDeleteSubQuestion}
        />
      ) : null}

      <main className="absolute bottom-0 left-0 right-0 top-[88px] flex">
        {manualLinkTarget && precisionRecognitionBox ? (
          <div
            className="absolute left-[980px] top-1/2 z-30 -translate-y-1/2"
            data-req-anchor="tablet-review-qa-image.precision-box"
          >
            {renderReviewQaImageRequirementMarker('TABLET_REVIEW_QA_IMAGE-008', 'right-[-12px] top-[-12px] z-40')}
            {manualLinkTarget.field === 'answer'
              ? (
                  <span className="relative" data-req-anchor="tablet-review-qa-image.answer-fill">
                    {renderReviewQaImageRequirementMarker('TABLET_REVIEW_QA_IMAGE-010', 'left-[-18px] top-[56px] z-40')}
                  </span>
                )
              : null}
            <button
              className="flex h-[82px] w-[82px] flex-col items-center justify-center rounded-full bg-[#23bfb2] text-[18px] font-semibold leading-[22px] text-white shadow-[0_10px_28px_rgba(35,191,178,0.36)] active:bg-[#12a99d] disabled:bg-[#b7d8d5]"
              disabled={!precisionRecognitionBox || !!manualLinkProcessingTarget}
              onClick={() => void handlePrecisionRecognition()}
              type="button"
            >
              <span>精准</span>
              <span>识别</span>
            </button>
          </div>
        ) : selectedPendingBoxCount > 0 ? (
          <div
            data-req-anchor="tablet-review-image.continue-recognition"
            className="absolute left-[980px] top-1/2 z-30 -translate-y-1/2"
          >
            {renderReviewImageRequirementMarker('TABLET_REVIEW_IMAGE-006', 'right-[-10px] top-[-10px] z-40')}
            <button
              className="flex h-[82px] w-[82px] flex-col items-center justify-center rounded-full bg-[#23bfb2] text-[18px] font-semibold leading-[22px] text-white shadow-[0_10px_28px_rgba(35,191,178,0.36)] active:bg-[#12a99d] disabled:bg-[#b7d8d5]"
              disabled={recognitionStatus === 'recognizing'}
              onClick={() => void handleContinueRecognition()}
              type="button"
            >
              <span>继续</span>
              <span>识别</span>
            </button>
          </div>
        ) : null}
        <section
          data-req-anchor="tablet-review-image.box-card-link"
          className="relative h-full w-[1030px] border-r border-[#dfe5ea] bg-[#f8fafb]"
        >
          {renderReviewImageRequirementMarker('TABLET_REVIEW_IMAGE-004', 'left-[940px] top-[88px] z-40')}
          {manualLinkTarget && (manualLinkTarget.field === 'answer' || manualLinkTarget.field === 'analysis') ? (
            <span className="relative" data-req-anchor="tablet-review-qa-image.answer-source-pages">
              {renderReviewQaImageRequirementMarker('TABLET_REVIEW_QA_IMAGE-009', 'left-[940px] top-[88px] z-40')}
            </span>
          ) : null}
          <div className="absolute left-0 right-0 top-0 z-10 flex h-[66px] items-center gap-[22px] border-b border-[#e3e7eb] bg-white px-[28px]">
            <div
              data-req-anchor="tablet-review-image.rotate-zoom"
              className="relative flex items-center gap-[22px]"
            >
              <button
                aria-label="旋转图片"
                className="inline-flex h-[42px] items-center gap-[8px] rounded-[7px] px-[12px] text-[20px] leading-none text-[#3f4852] active:bg-[#f3f5f6]"
                onClick={() => undefined}
                type="button"
              >
                <RotateCw className="h-[22px] w-[22px]" />
                旋转
              </button>
              <div className="inline-flex h-[42px] items-center gap-[10px] rounded-[7px] px-[8px] text-[20px] leading-none text-[#3f4852]">
                <button
                  aria-label="缩小图片"
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full active:bg-[#f3f5f6]"
                  onClick={() => undefined}
                  type="button"
                >
                  <ZoomOut className="h-[22px] w-[22px]" />
                </button>
                <span className="min-w-[58px] text-center">100%</span>
                <button
                  aria-label="放大图片"
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full active:bg-[#f3f5f6]"
                  onClick={() => undefined}
                  type="button"
                >
                  <ZoomIn className="h-[22px] w-[22px]" />
                </button>
              </div>
              {renderReviewImageRequirementMarker('TABLET_REVIEW_IMAGE-013', 'right-[-14px] top-[-14px] z-40')}
            </div>
            <div
              data-req-anchor="tablet-review-image.add-box"
              className="relative"
            >
              {renderReviewImageRequirementMarker('TABLET_REVIEW_IMAGE-005', 'right-[-16px] top-[-14px] z-40')}
              <button
                className={`inline-flex h-[42px] items-center gap-[8px] rounded-[7px] border px-[16px] text-[20px] font-medium leading-none ${
                  isReviewAddBoxMode
                    ? 'border-[#23bfb2] bg-[#e1f8f5] text-[#0f9489]'
                    : 'border-[#d7dde3] bg-white text-[#3f4852] active:bg-[#f3f5f6]'
                }`}
                onClick={() => setIsReviewAddBoxMode((currentMode) => !currentMode)}
                type="button"
              >
                <Plus className="h-[22px] w-[22px]" />
                添加识别框
              </button>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 top-[66px] overflow-y-auto px-[28px] py-[24px]">
            {materialPages.map(renderLeftMaterialPage)}
          </div>
        </section>
        <section className="relative flex-1 bg-[#eef2f5]">
          <div className="absolute left-0 right-0 top-0 z-10 flex h-[66px] items-center justify-between border-b border-[#e3e7eb] bg-white px-[28px]">
            <div className="relative" data-req-anchor="tablet-review-image.mode-switch">
              {renderReviewImageRequirementMarker('TABLET_REVIEW_IMAGE-007', 'right-[-18px] top-[-14px] z-40')}
              <StepSegmentedControl
                labels={{ recognition: '识别模式', image: '图片模式' }}
                mode={globalMode}
                onChange={handleGlobalModeChange}
              />
            </div>
            <div className="flex items-center gap-[12px]">
              <div
                data-req-anchor="tablet-review-image.question-count"
                className="relative rounded-full bg-[#f3f5f6] px-[18px] py-[10px] text-[19px] leading-none text-[#68727d]"
              >
                {renderReviewImageRequirementMarker('TABLET_REVIEW_IMAGE-008', 'right-[-14px] top-[-14px] z-40')}
                共 {questions.length} 题
              </div>
            </div>
          </div>
          {shouldShowRecognitionBar ? (
            <div
              className="absolute left-[28px] right-[28px] top-[82px] z-10 flex h-[48px] items-center gap-[12px] rounded-[8px] bg-[#e8f3ff] px-[18px] text-[20px] font-medium leading-none text-[#2478d4] shadow-sm"
              data-req-anchor={shouldShowAnswerAnalysis ? 'tablet-review-qa-image.answer-matching' : undefined}
            >
              {shouldShowAnswerAnalysis
                ? renderReviewQaImageRequirementMarker('TABLET_REVIEW_QA_IMAGE-002', 'right-[-14px] top-[-14px] z-40')
                : null}
              <div className="h-[24px] w-[24px] animate-spin rounded-full border-[3px] border-[#bddcff] border-t-[#2478d4]" />
              {reviewStatusMessage}
            </div>
          ) : null}
          {shouldShowQaMatchSummary ? (
            <div
              className="absolute left-[28px] right-[28px] top-[82px] z-10 flex h-[48px] items-center justify-between rounded-[8px] bg-[#fff7ed] px-[18px] text-[20px] font-medium leading-none text-[#b45309] shadow-sm"
              data-req-anchor="tablet-review-qa-image.match-banner"
            >
              {renderReviewQaImageRequirementMarker('TABLET_REVIEW_QA_IMAGE-001', 'right-[-14px] top-[-14px] z-40')}
              <span className="relative" data-req-anchor="tablet-review-qa-image.sub-missing-count">
                {renderReviewQaImageRequirementMarker('TABLET_REVIEW_QA_IMAGE-018', 'right-[42px] top-[-14px] z-40')}
              </span>
              <span>答案解析匹配：共 {questions.length} 题，已匹配 {matchedAnswerQuestionCount} 题，待补充 {missingAnswerQuestionCount} 题</span>
              <span className="text-[18px] text-[#92400e]">可点击【答】【析】手动关联补充</span>
            </div>
          ) : null}
          <div className={`absolute bottom-0 left-[28px] right-[28px] overflow-y-auto pb-[36px] ${shouldShowRecognitionBar || shouldShowQaMatchSummary ? 'top-[148px]' : 'top-[90px]'}`}>
            {questions.length > 0 || recognizingReviewBoxIds.size > 0 ? (
              <div className="space-y-[22px]">{renderReviewQuestionItems()}</div>
            ) : (
              <div className="flex h-[360px] items-center justify-center rounded-[12px] border border-dashed border-[#d7dde3] bg-white text-[22px] text-[#8b949e]">
                暂无可核对题目
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function DrawingBoxOverlay({
  draft,
  frame,
  imageUrl,
}: {
  draft: DrawingBoxDraft | null;
  frame: { width: number; height: number };
  imageUrl: string;
}) {
  if (!draft) return null;

  const box = getBoxFromDrawingDraft(draft);
  const lensSize = 124;
  const zoom = 2.2;
  const lensLeft = Math.min(Math.max((draft.currentX / 100) * frame.width + 24, lensSize / 2), frame.width - lensSize / 2);
  const lensTop = Math.min(Math.max((draft.currentY / 100) * frame.height - 154, lensSize / 2), frame.height - lensSize / 2);

  return (
    <>
      <div
        className="pointer-events-none absolute border-2 border-[#23bfb2] bg-[#ddf8f4]/30 shadow-[0_0_0_2px_rgba(35,191,178,0.18)]"
        style={{
          height: `${box.height}%`,
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${box.width}%`,
        }}
      />
      <div
        className="pointer-events-none absolute z-40 overflow-hidden rounded-full border-[3px] border-white bg-white shadow-[0_8px_24px_rgba(31,44,58,0.24)]"
        style={{
          height: lensSize,
          left: lensLeft - lensSize / 2,
          top: lensTop - lensSize / 2,
          width: lensSize,
        }}
      >
        <img
          alt=""
          className="absolute max-w-none"
          src={imageUrl}
          style={{
            height: frame.height * zoom,
            left: lensSize / 2 - (draft.currentX / 100) * frame.width * zoom,
            top: lensSize / 2 - (draft.currentY / 100) * frame.height * zoom,
            width: frame.width * zoom,
          }}
        />
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#23bfb2]/60" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#23bfb2]/60" />
      </div>
    </>
  );
}

function JoinMissingAnswerDialog({
  missingCount,
  onCancel,
  onConfirm,
}: {
  missingCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 bg-black/45">
      <section className="absolute left-1/2 top-1/2 w-[620px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[12px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <header className="relative flex h-[78px] items-center bg-[#e9fbf7] px-[30px]">
          <h3 className="text-[28px] font-medium leading-none text-[#23bfb2]">加入试卷</h3>
          <button
            aria-label="关闭加入试卷确认"
            className="absolute right-[24px] top-[21px] flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#23bfb2] text-white active:bg-[#12a99d]"
            onClick={onCancel}
            type="button"
          >
            <X className="h-[22px] w-[22px] stroke-[3]" />
          </button>
        </header>
        <div className="px-[48px] pb-[38px] pt-[36px] text-center">
          <div className="text-[26px] font-semibold leading-none text-[#202124]">确认加入试卷吗？</div>
          <p className="mt-[28px] text-[22px] leading-[36px] text-[#5f6872]">
            当前还有{missingCount}道题的答案/解析没有补充，您可以在后续组卷页面使用AI批量补充功能，进行补充。
          </p>
          <div className="mt-[38px] flex justify-center gap-[28px]">
            <button
              className="h-[50px] min-w-[128px] rounded-[7px] border border-[#c9ced3] bg-white px-[28px] text-[22px] leading-none text-[#5f6872] active:bg-[#f4f6f7]"
              onClick={onCancel}
              type="button"
            >
              取消
            </button>
            <button
              className="h-[50px] min-w-[128px] rounded-[7px] bg-[#23bfb2] px-[28px] text-[22px] font-medium leading-none text-white active:bg-[#12a99d]"
              onClick={onConfirm}
              type="button"
            >
              确认
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function DeleteSubQuestionConfirmDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 bg-black/45">
      <section className="absolute left-1/2 top-1/2 w-[520px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[12px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <div className="px-[48px] pb-[34px] pt-[42px] text-center">
          <div className="text-[26px] font-semibold leading-[36px] text-[#202124]">确认删除当前子题吗？</div>
          <div className="mt-[38px] flex justify-center gap-[28px]">
            <button
              className="h-[50px] min-w-[128px] rounded-[7px] border border-[#c9ced3] bg-white px-[28px] text-[22px] leading-none text-[#5f6872] active:bg-[#f4f6f7]"
              onClick={onCancel}
              type="button"
            >
              取消
            </button>
            <button
              className="h-[50px] min-w-[128px] rounded-[7px] bg-[#23bfb2] px-[28px] text-[22px] font-medium leading-none text-white active:bg-[#12a99d]"
              onClick={onConfirm}
              type="button"
            >
              确认
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function JoinEmptyStemDialog({
  emptyCount,
  onClose,
}: {
  emptyCount: number;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 bg-black/45">
      <section className="absolute left-1/2 top-1/2 w-[620px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[12px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <header className="relative flex h-[78px] items-center bg-[#e9fbf7] px-[30px]">
          <h3 className="text-[28px] font-medium leading-none text-[#23bfb2]">加入试卷</h3>
          <button
            aria-label="关闭题干为空提示"
            className="absolute right-[24px] top-[21px] flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#23bfb2] text-white active:bg-[#12a99d]"
            onClick={onClose}
            type="button"
          >
            <X className="h-[22px] w-[22px] stroke-[3]" />
          </button>
        </header>
        <div className="px-[48px] pb-[38px] pt-[42px] text-center">
          <p className="text-[24px] leading-[38px] text-[#3f4852]">
            当前还有{emptyCount}道题目的题干为空，请补充后再加入试卷。
          </p>
          <div className="mt-[38px] flex justify-center">
            <button
              className="h-[50px] min-w-[136px] rounded-[7px] bg-[#23bfb2] px-[28px] text-[22px] font-medium leading-none text-white active:bg-[#12a99d]"
              onClick={onClose}
              type="button"
            >
              我知道了
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function JoinEditingUnsavedDialog({
  editingCount,
  onClose,
}: {
  editingCount: number;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 bg-black/45">
      <section className="absolute left-1/2 top-1/2 w-[620px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[12px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <header className="relative flex h-[78px] items-center bg-[#e9fbf7] px-[30px]">
          <h3 className="text-[28px] font-medium leading-none text-[#23bfb2]">加入试卷</h3>
          <button
            aria-label="关闭加入试卷提示"
            className="absolute right-[24px] top-[21px] flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#23bfb2] text-white active:bg-[#12a99d]"
            onClick={onClose}
            type="button"
          >
            <X className="h-[22px] w-[22px] stroke-[3]" />
          </button>
        </header>
        <div className="px-[48px] pb-[38px] pt-[42px] text-center">
          <p className="text-[24px] leading-[38px] text-[#3f4852]">
            当前还有{editingCount}道题处于编辑状态，请先保存后再加入试卷。
          </p>
          <div className="mt-[38px] flex justify-center">
            <button
              className="h-[50px] min-w-[136px] rounded-[7px] bg-[#23bfb2] px-[28px] text-[22px] font-medium leading-none text-white active:bg-[#12a99d]"
              onClick={onClose}
              type="button"
            >
              我知道了
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function JoinPaperModeDialog({
  mode,
  onCancel,
  onChange,
  onConfirm,
}: {
  mode: JoinPaperMode;
  onCancel: () => void;
  onChange: (mode: JoinPaperMode) => void;
  onConfirm: () => void;
}) {
  const options: Array<{ value: JoinPaperMode; title: string; tip: string }> = [
    { value: 'by_type', title: '按题型加入试卷', tip: '该方式可能会改变题目显示顺序' },
    { value: 'by_order', title: '按题目顺序加入试卷', tip: '该方式进入到组卷页面后，将会只有一个大题名称' },
  ];

  return (
    <div className="absolute inset-0 z-50 bg-black/45">
      <section className="absolute left-1/2 top-1/2 max-h-[calc(100vh-64px)] w-[min(1180px,calc(100vw-64px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[20px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <header className="relative flex h-[104px] items-center bg-[#e6f7f3] px-[40px]">
          <h3 className="text-[36px] font-normal leading-none text-[#18b9ae]">加入试卷</h3>
          <button
            aria-label="关闭组卷方式选择"
            className="absolute right-[36px] top-[30px] flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#21bdb4] text-white active:bg-[#12a99d]"
            onClick={onCancel}
            type="button"
          >
            <X className="h-[28px] w-[28px] stroke-[2.8]" />
          </button>
        </header>
        <div className="max-h-[calc(100vh-168px)] overflow-y-auto px-[min(9vw,128px)] pb-[46px] pt-[54px]">
          <div className="text-center text-[34px] leading-none text-[#5d5d5d]">请选择一种组卷方式：</div>
          <div className="mt-[40px] space-y-[28px]">
            {options.map((option) => {
              const isSelected = mode === option.value;
              return (
                <button
                  key={option.value}
                  className={`flex min-h-[126px] w-full items-center gap-[34px] rounded-[16px] border-[2px] px-[52px] py-[24px] text-left ${
                    isSelected
                      ? 'border-[#23bfb2] bg-[#e9fbf7]'
                      : 'border-[#dadada] bg-white active:bg-[#f6f8f9]'
                  }`}
                  onClick={() => onChange(option.value)}
                  type="button"
                >
                  <span className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border-[2px] ${
                    isSelected ? 'border-[#23bfb2]' : 'border-[#bfc0c1]'
                  }`}>
                    {isSelected ? <span className="h-[16px] w-[16px] rounded-full bg-[#23bfb2]" /> : null}
                  </span>
                  <span>
                    <span className="block text-[34px] font-semibold leading-none text-[#3e454b]">{option.title}</span>
                    <span className="mt-[18px] block text-[27px] leading-[34px] text-[#93999d]">{option.tip}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-[58px] flex justify-center gap-[64px]">
            <button
              className="h-[66px] min-w-[172px] rounded-[8px] border-[2px] border-[#c7c7c7] bg-white px-[36px] text-[29px] leading-none text-[#626262] active:bg-[#f4f6f7]"
              onClick={onCancel}
              type="button"
            >
              取消
            </button>
            <button
              className="h-[66px] min-w-[184px] rounded-[8px] bg-[#23bfb2] px-[36px] text-[29px] font-medium leading-none text-white active:bg-[#12a99d]"
              onClick={onConfirm}
              type="button"
            >
              确认加入
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function TabletOcrContentSelectionPage({
  images,
  mode,
  onBack,
  onReplace,
  onSupplement,
  renderRequirementMarker,
  renderReviewRequirementMarker,
  prototypeFixture,
  subject,
}: {
  images: SelectedImage[];
  mode: RecognitionMode | '';
  onBack: () => void;
  onReplace: () => void;
  onSupplement: () => void;
  renderRequirementMarker: RequirementMarkerRenderer;
  renderReviewRequirementMarker: RequirementMarkerRenderer;
  prototypeFixture?: TabletPrototypeFixture | null;
  subject: string;
}) {
  const [status, setStatus] = useState<OcrDetectStatus>('loading');
  const [materialPages, setMaterialPages] = useState<MaterialPage[]>([]);
  const [activePageNumber, setActivePageNumber] = useState(1);
  const [boxes, setBoxes] = useState<RecognitionBox[]>([]);
  const [drawingBoxDraft, setDrawingBoxDraft] = useState<DrawingBoxDraft | null>(null);
  const [dragState, setDragState] = useState<{
    id: string;
    action: 'move' | 'resize';
    startClientX: number;
    startClientY: number;
    startBox: RecognitionBox;
    containerRect: DOMRect;
  } | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [confirmAction, setConfirmAction] = useState<TabletConfirmAction>(null);
  const [dismissedEmptyPromptPages, setDismissedEmptyPromptPages] = useState<Set<number>>(new Set());
  const [isAddBoxMode, setIsAddBoxMode] = useState(false);
  const [showAddBoxModeTip, setShowAddBoxModeTip] = useState(false);
  const [addBoxInteractionMode, setAddBoxInteractionMode] = useState<AddBoxInteractionMode>('draw');
  const [selectionOrientation, setSelectionOrientation] = useState<SelectionOrientation>('landscape');
  const [selectionToastMessage, setSelectionToastMessage] = useState('');
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const pageWrapRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const hasMovedBoxRef = useRef(false);
  const materialPagesRef = useRef<MaterialPage[]>([]);
  const processedImageUrlsRef = useRef<Set<string>>(new Set());
  const detectedModeRef = useRef<RecognitionMode | ''>(mode);
  const detectedImageOrderRef = useRef('');
  const selectionToastTimerRef = useRef<number | null>(null);
  const renderQuestionsOnlyRequirementMarker: RequirementMarkerRenderer = (
    requirementId,
    className,
    displayNumber,
  ) => renderRequirementMarker(requirementId, className, displayNumber);

  useEffect(() => {
    materialPagesRef.current = materialPages;
  }, [materialPages]);

  useEffect(() => () => {
    if (selectionToastTimerRef.current) {
      window.clearTimeout(selectionToastTimerRef.current);
    }
  }, []);

  const showSelectionToast = (message: string) => {
    setSelectionToastMessage(message);
    if (selectionToastTimerRef.current) {
      window.clearTimeout(selectionToastTimerRef.current);
    }
    selectionToastTimerRef.current = window.setTimeout(() => {
      setSelectionToastMessage('');
      selectionToastTimerRef.current = null;
    }, 2200);
  };

  useEffect(() => {
    let cancelled = false;

    async function runDetect() {
      if (prototypeFixture) {
        const pages = prototypeFixture.pages.map((page) => ({ ...page }));
        const fixtureBoxes = prototypeFixture.boxes.map((box) => ({ ...box }));

        processedImageUrlsRef.current = new Set(prototypeFixture.images.map((image) => getImageKey(image)));
        materialPagesRef.current = pages;
        detectedModeRef.current = prototypeFixture.mode;
        detectedImageOrderRef.current = getImageOrderSignature(prototypeFixture.images);
        setMaterialPages(pages);
        setBoxes(fixtureBoxes);
        setActivePageNumber(pages.find((page) => page.role !== 'answer')?.pageNumber || 1);
        setStatus('ready');
        setDismissedEmptyPromptPages(new Set());
        setIsAddBoxMode(false);
        setDrawingBoxDraft(null);
        setHasStarted(prototypeFixture.autoStartReview);
        return;
      }

      const imageOrderSignature = images.map((image) => `${getImageKey(image)}:${image.role || 'material'}`).join('|');
      const currentImageUrls = new Set(images.map((image) => getImageKey(image)));
      const hasRemovedImage = Array.from(processedImageUrlsRef.current).some((url) => !currentImageUrls.has(url));
      const hasModeChanged = detectedModeRef.current !== mode;
      const hasImageOrderChanged = detectedImageOrderRef.current !== imageOrderSignature;
      const shouldRebuildPages = hasRemovedImage || hasModeChanged || hasImageOrderChanged;

      if (shouldRebuildPages) {
        processedImageUrlsRef.current = new Set();
        materialPagesRef.current = [];
        detectedModeRef.current = mode;
        detectedImageOrderRef.current = imageOrderSignature;
        setMaterialPages([]);
        setBoxes([]);
        setHasStarted(false);
        setDismissedEmptyPromptPages(new Set());
        setIsAddBoxMode(false);
      }

      const existingPages = shouldRebuildPages ? [] : materialPagesRef.current;
      const newImages = shouldRebuildPages
        ? images
        : images.filter((image) => !processedImageUrlsRef.current.has(getImageKey(image)));

      if (newImages.length === 0) {
        if (existingPages.length === 0) {
          setStatus('failed');
        }
        return;
      }

      const isInitialLoad = existingPages.length === 0;
      if (isInitialLoad) {
        setStatus('loading');
        setBoxes([]);
        setHasStarted(false);
        setDismissedEmptyPromptPages(new Set());
        setIsAddBoxMode(false);
      }

      try {
        const preparedPages = await prepareMaterialPages(newImages);
        if (cancelled) return;

        const pageOffset = existingPages.length;
        const newPages = preparedPages.map((page) => ({
          ...page,
          pageNumber: page.pageNumber + pageOffset,
        }));
        const pages = [...existingPages, ...newPages];
        const pagesForCut = mode === 'separate_answer'
          ? newPages.filter((page) => page.role !== 'answer')
          : newPages;
        materialPagesRef.current = pages;
        setMaterialPages(pages);
        setActivePageNumber((pagesForCut[0] || pages[0])?.pageNumber || 1);
        newImages.forEach((image) => processedImageUrlsRef.current.add(getImageKey(image)));

        if (pagesForCut.length === 0) {
          setStatus(pages.length > 0 ? 'ready' : 'failed');
          return;
        }

        const detectedBoxes = (await detectMaterialBoxes(pagesForCut)).map((box) => {
          const displayPage = pagesForCut[(box.pageNumber || 1) - 1];
          const mappedBox = {
            ...box,
            pageNumber: displayPage?.pageNumber || box.pageNumber,
          };

          return expandSystemBoxForSelectIcon(mappedBox, displayPage);
        });
        if (cancelled) return;

        setBoxes((currentBoxes) => (isInitialLoad ? detectedBoxes : [...currentBoxes, ...detectedBoxes]));
        setStatus(detectedBoxes.length > 0 || pages.length > 0 ? 'ready' : 'failed');
      } catch (error) {
        if (!cancelled) {
          console.error('[TabletOCR] auto detect failed:', error);
          setStatus(isInitialLoad ? 'failed' : 'ready');
        }
      }
    }

    runDetect();

    return () => {
      cancelled = true;
    };
  }, [images, mode, prototypeFixture]);

  useEffect(() => {
    if (!dragState) return undefined;

    const handlePointerMove = (event: PointerEvent) => {
      const dx = ((event.clientX - dragState.startClientX) / dragState.containerRect.width) * 100;
      const dy = ((event.clientY - dragState.startClientY) / dragState.containerRect.height) * 100;
      if (
        Math.abs(event.clientX - dragState.startClientX) > 3 ||
        Math.abs(event.clientY - dragState.startClientY) > 3
      ) {
        hasMovedBoxRef.current = true;
      }

      setBoxes((currentBoxes) => currentBoxes.map((box) => {
        if (box.id !== dragState.id) return box;

        if (dragState.action === 'move') {
          return {
            ...box,
            x: clampPercent(dragState.startBox.x + dx, 0, 100 - dragState.startBox.width),
            y: clampPercent(dragState.startBox.y + dy, 0, 100 - dragState.startBox.height),
          };
        }

        return {
          ...box,
          width: clampPercent(dragState.startBox.width + dx, 5, 100 - dragState.startBox.x),
          height: clampPercent(dragState.startBox.height + dy, 3, 100 - dragState.startBox.y),
        };
      }));
    };

    const handlePointerUp = () => {
      setDragState(null);
      window.setTimeout(() => {
        hasMovedBoxRef.current = false;
      }, 0);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState]);

  useEffect(() => {
    if (!drawingBoxDraft) return undefined;

    const containerRect = pageWrapRefs.current[drawingBoxDraft.pageNumber]?.getBoundingClientRect();
    if (!containerRect) return undefined;

    const handlePointerMove = (event: PointerEvent) => {
      const point = getPointerPercent(containerRect, event.clientX, event.clientY);
      setDrawingBoxDraft((currentDraft) => (
        currentDraft
          ? { ...currentDraft, clientX: event.clientX, clientY: event.clientY, currentX: point.x, currentY: point.y }
          : currentDraft
      ));
    };

    const handlePointerUp = () => {
      const box = getBoxFromDrawingDraft(drawingBoxDraft);
      if (box.width >= 3 && box.height >= 2) {
        setBoxes((currentBoxes) => [
          ...currentBoxes,
          {
            id: `manual-${Date.now()}`,
            pageNumber: drawingBoxDraft.pageNumber,
            x: box.x,
            y: box.y,
            width: Math.max(5, box.width),
            height: Math.max(3, box.height),
            selected: true,
            source: 'manual',
          },
        ]);
        setStatus('ready');
        setDismissedEmptyPromptPages((currentPages) => {
          const nextPages = new Set(currentPages);
          nextPages.add(drawingBoxDraft.pageNumber);
          return nextPages;
        });
      }
      setDrawingBoxDraft(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [drawingBoxDraft]);

  const activePage = materialPages.find((page) => page.pageNumber === activePageNumber) || materialPages[0];
  const questionPages = materialPages.filter((page) => page.role !== 'answer');
  const answerPages = materialPages.filter((page) => page.role === 'answer');
  const isSeparateMode = mode === 'separate_answer';
  const selectedCount = boxes.filter((box) => box.selected).length;
  const isAllBoxesSelected = boxes.length > 0 && selectedCount === boxes.length;
  const isSomeBoxesSelected = selectedCount > 0 && !isAllBoxesSelected;
  const isPortraitSelection = selectionOrientation === 'portrait';
  const isDetecting = status === 'loading';
  const startRecognitionUnavailable = isDetecting || !activePage || boxes.length === 0 || selectedCount === 0;
  const firstAutoBoxId = boxes.find((box) => box.source === 'system')?.id;
  const firstBoxId = boxes[0]?.id;

  const getSelectionMaterialPageFrameSize = (page: MaterialPage) => {
    const scale = Math.min(
      (isPortraitSelection ? 920 : 1320) / page.naturalWidth,
      (isPortraitSelection ? 1420 : 900) / page.naturalHeight,
    );

    return {
      width: page.naturalWidth * scale,
      height: page.naturalHeight * scale,
    };
  };

  const addManualBox = (targetPage = activePage?.role === 'answer' ? questionPages[0] : activePage) => {
    if (!targetPage) return;

    const pageNumber = targetPage.pageNumber;
    const samePageCount = boxes.filter((box) => box.pageNumber === pageNumber).length;

    setBoxes((currentBoxes) => [
      ...currentBoxes,
      {
        id: `manual-${Date.now()}`,
        pageNumber,
        x: 10,
        y: clampPercent(10 + samePageCount * 8, 4, 74),
        width: 72,
        height: 8,
        selected: true,
        source: 'manual',
      },
    ]);
    setStatus('ready');
  };

  const addManualBoxAtPoint = (page: MaterialPage, clientX: number, clientY: number) => {
    const containerRect = pageWrapRefs.current[page.pageNumber]?.getBoundingClientRect();
    if (!containerRect) return;

    setActivePageNumber(page.pageNumber);
    const width = 72;
    const height = 8;
    const clickX = ((clientX - containerRect.left) / containerRect.width) * 100;
    const clickY = ((clientY - containerRect.top) / containerRect.height) * 100;

    setBoxes((currentBoxes) => [
      ...currentBoxes,
      {
        id: `manual-${Date.now()}`,
        pageNumber: page.pageNumber,
        x: clampPercent(clickX - width / 2, 0, 100 - width),
        y: clampPercent(clickY - height / 2, 0, 100 - height),
        width,
        height,
        selected: true,
        source: 'manual',
      },
    ]);
    setStatus('ready');
    setDismissedEmptyPromptPages((currentPages) => {
      const nextPages = new Set(currentPages);
      nextPages.add(page.pageNumber);
      return nextPages;
    });
  };

  const startDrawingBox = (page: MaterialPage, event: ReactPointerEvent<HTMLDivElement>) => {
    const containerRect = pageWrapRefs.current[page.pageNumber]?.getBoundingClientRect();
    if (!containerRect) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setActivePageNumber(page.pageNumber);
    const point = getPointerPercent(containerRect, event.clientX, event.clientY);
    setDrawingBoxDraft({
      pageNumber: page.pageNumber,
      startX: point.x,
      startY: point.y,
      currentX: point.x,
      currentY: point.y,
      clientX: event.clientX,
      clientY: event.clientY,
      intent: 'manual',
    });
  };

  const startBoxDrag = (
    event: ReactPointerEvent,
    box: RecognitionBox,
    action: 'move' | 'resize',
  ) => {
    const containerRect = (pageWrapRefs.current[box.pageNumber] || imageWrapRef.current)?.getBoundingClientRect();
    if (!containerRect) return;

    event.preventDefault();
    event.stopPropagation();
    hasMovedBoxRef.current = false;
    setDragState({
      id: box.id,
      action,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startBox: box,
      containerRect,
    });
  };

  const toggleBox = (boxId: string) => {
    setBoxes((currentBoxes) => currentBoxes.map((box) => (
      box.id === boxId ? { ...box, selected: !box.selected } : box
    )));
  };

  const toggleAllBoxes = () => {
    if (boxes.length === 0) return;
    setBoxes((currentBoxes) => currentBoxes.map((box) => ({
      ...box,
      selected: !isAllBoxesSelected,
    })));
  };

  const deleteBox = (boxId: string) => {
    setBoxes((currentBoxes) => currentBoxes.filter((box) => box.id !== boxId));
  };

  const handleReplaceClick = () => {
    if (isDetecting) {
      showSelectionToast('正在切题，请稍后再操作');
      return;
    }

    if (boxes.length > 0) {
      setConfirmAction('replace');
      return;
    }

    onReplace();
  };

  const handleClearClick = () => {
    if (isDetecting) {
      showSelectionToast('正在切题，请稍后再操作');
      return;
    }

    if (boxes.length > 0) {
      setConfirmAction('clear');
      return;
    }

    setBoxes([]);
  };

  const handleAddBoxModeClick = () => {
    if (isDetecting) {
      showSelectionToast('正在切题，请稍后再操作');
      return;
    }

    if (!isAddBoxMode) {
      setShowAddBoxModeTip(true);
      return;
    }

    setDrawingBoxDraft(null);
    setIsAddBoxMode(false);
  };

  const handleAddBoxModeTipConfirm = () => {
    setShowAddBoxModeTip(false);
    setIsAddBoxMode(true);
  };

  const handleBackClick = () => {
    if (boxes.length > 0) {
      setConfirmAction('back');
      return;
    }

    onBack();
  };

  const handleStartRecognitionClick = () => {
    if (isDetecting) {
      showSelectionToast('正在切题，请稍后再操作');
      return;
    }

    if (boxes.length === 0) {
      showSelectionToast('请先框选要识别的题目');
      return;
    }

    if (selectedCount === 0) {
      showSelectionToast('请先选择要识别的题目框');
      return;
    }

    setHasStarted(true);
  };

  const handleConfirmAction = () => {
    const action = confirmAction;
    setConfirmAction(null);

    if (action === 'back') {
      setBoxes([]);
      setDrawingBoxDraft(null);
      setIsAddBoxMode(false);
      onBack();
      return;
    }

    if (action === 'replace') {
      setBoxes([]);
      setDrawingBoxDraft(null);
      setIsAddBoxMode(false);
      onReplace();
      return;
    }

    if (action === 'clear') {
      setBoxes([]);
      setDrawingBoxDraft(null);
      setIsAddBoxMode(false);
    }
  };

  if (hasStarted) {
    const selectedBoxIds = new Set(
      boxes
        .filter((box) => box.selected)
        .map((box) => box.id),
    );
    const prototypeReviewQuestions = prototypeFixture?.reviewQuestions.filter((question) => (
      selectedBoxIds.has(question.id)
    ));

    return (
      <TabletOcrQuestionReviewPage
        boxes={boxes}
        initialQuestions={prototypeReviewQuestions?.length ? prototypeReviewQuestions : undefined}
        materialPages={materialPages}
        mode={mode || 'questions_only'}
        onBackToSelection={() => setHasStarted(false)}
        onExit={onBack}
        renderRequirementMarker={renderReviewRequirementMarker}
        subject={subject}
      />
    );
  }

  const renderMaterialPage = (page: MaterialPage, variant: 'question' | 'answer') => {
    const frame = getSelectionMaterialPageFrameSize(page);
    const pageBoxes = boxes.filter((box) => box.pageNumber === page.pageNumber);
    const isQuestionPage = variant === 'question';
    const isFirstQuestionPage = questionPages[0]?.pageNumber === page.pageNumber;

    return (
      <div
        key={page.pageNumber}
        className={`mx-auto mb-[28px] w-fit rounded-[12px] border bg-white p-[12px] shadow-[0_8px_24px_rgba(31,44,58,0.10)] ${
          isQuestionPage ? 'border-[#9edfd8]' : 'border-[#f2cf99]'
        }`}
        onClick={() => {
          if (isQuestionPage) {
            setActivePageNumber(page.pageNumber);
          }
        }}
      >
        <div
          className={`relative bg-white ${isAddBoxMode && isQuestionPage ? 'touch-none cursor-crosshair' : ''}`}
          onClick={(event) => {
            if (isAddBoxMode && isQuestionPage) {
              event.stopPropagation();
              if (addBoxInteractionMode === 'tap') {
                addManualBoxAtPoint(page, event.clientX, event.clientY);
              }
            }
          }}
          onPointerDown={(event) => {
            if (isAddBoxMode && isQuestionPage) {
              if (addBoxInteractionMode === 'draw') {
                startDrawingBox(page, event);
              } else {
                event.stopPropagation();
              }
            }
          }}
          ref={(node) => {
            pageWrapRefs.current[page.pageNumber] = node;
            if (page.pageNumber === activePage?.pageNumber) {
              imageWrapRef.current = node;
            }
          }}
          style={{ width: frame.width, height: frame.height }}
        >
          <img alt="" className="h-full w-full object-fill" src={page.url} />
          <DrawingBoxOverlay
            draft={drawingBoxDraft?.pageNumber === page.pageNumber ? drawingBoxDraft : null}
            frame={frame}
            imageUrl={page.url}
          />
          {isQuestionPage ? pageBoxes.map((box) => (
            <div
              key={box.id}
              data-req-anchor={
                box.id === firstAutoBoxId
                  ? 'tablet-question-content-selection.auto-box'
                  : box.id === firstBoxId
                    ? 'tablet-question-content-selection.single-box'
                    : undefined
              }
              className={`absolute border-2 ${
                box.selected
                  ? 'border-[#26c9bc] bg-[#ddf8f4]/25'
                  : 'border-[#9ba6b0] bg-white/30'
              }`}
              onClick={(event) => {
                event.stopPropagation();
                if (!hasMovedBoxRef.current) {
                  toggleBox(box.id);
                }
              }}
              onPointerDown={(event) => startBoxDrag(event, box, 'move')}
              style={{
                left: `${box.x}%`,
                top: `${box.y}%`,
                width: `${box.width}%`,
                height: `${box.height}%`,
              }}
            >
              {box.id === firstAutoBoxId
                ? renderQuestionsOnlyRequirementMarker('TABLET_QUESTION_CONTENT_SELECTION-015', 'left-[28px] top-[-18px]')
                : null}
              {box.id === firstBoxId
                ? renderQuestionsOnlyRequirementMarker('TABLET_QUESTION_CONTENT_SELECTION-016', 'right-[28px] top-[-18px]')
                : null}
              <button
                aria-label={box.selected ? '取消选中识别框' : '选中识别框'}
                className={`absolute left-[4px] top-[4px] flex h-[20px] w-[20px] items-center justify-center rounded-[3px] text-[12px] font-semibold leading-none text-white ${
                  box.selected ? 'bg-[#26c9bc]' : 'bg-[#9ba6b0]'
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleBox(box.id);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                type="button"
              >
                ✓
              </button>
              <button
                aria-label="删除识别框"
                className="absolute right-[4px] top-[4px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#202124]/55 text-white active:bg-[#000]"
                onClick={(event) => {
                  event.stopPropagation();
                  deleteBox(box.id);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                type="button"
              >
                <X className="h-[13px] w-[13px]" />
              </button>
              <button
                aria-label="调整识别框大小"
                className="absolute bottom-[-8px] right-[-8px] h-[18px] w-[18px] rounded-full border-[2px] border-white bg-[#26c9bc] shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
                onPointerDown={(event) => startBoxDrag(event, box, 'resize')}
                type="button"
              />
            </div>
          )) : null}
          {isQuestionPage && pageBoxes.length === 0 && isFirstQuestionPage && !dismissedEmptyPromptPages.has(page.pageNumber) ? (
            <div
              data-req-anchor="tablet-question-content-selection.no-box-tip"
              className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-[16px] bg-white/92 px-[42px] py-[34px] shadow-[0_12px_34px_rgba(31,44,58,0.16)]"
              onClick={(event) => event.stopPropagation()}
            >
              {renderQuestionsOnlyRequirementMarker('TABLET_QUESTION_CONTENT_SELECTION-017', 'right-[48px] top-[-12px]')}
              <button
                aria-label="关闭未识别提示"
                className="absolute right-[12px] top-[12px] flex h-[32px] w-[32px] items-center justify-center text-[#3f4852] active:text-[#202124]"
                onClick={() => {
                  setDismissedEmptyPromptPages((currentPages) => {
                    const nextPages = new Set(currentPages);
                    nextPages.add(page.pageNumber);
                    return nextPages;
                  });
                }}
                onPointerDown={(event) => event.stopPropagation()}
                type="button"
              >
                <X className="h-[22px] w-[22px] stroke-[2.5]" />
              </button>
              <div className="text-[24px] font-medium leading-none text-[#202124]">未识别到题目框</div>
              <div className="mt-[18px] text-[20px] leading-[30px] text-[#68727d]">
                可点击上方「添加识别框」手动框选
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderSeparateModeMaterials = () => (
    <div
      className={`absolute inset-0 overflow-y-auto ${isPortraitSelection ? 'px-[24px] py-[22px]' : 'px-[42px] py-[28px]'}`}
      data-req-anchor="tablet-question-content-selection.separate-mode-groups"
    >
      {renderQuestionsOnlyRequirementMarker('TABLET_QUESTION_CONTENT_SELECTION-022', 'left-[22px] top-[18px] z-50')}
      <section>
        <div className="mb-[18px] flex items-center gap-[14px]">
          <span className="rounded-[6px] bg-[#e7f7ff] px-[16px] py-[8px] text-[21px] font-semibold leading-none text-[#268fe8]">
            题目图片
          </span>
          <span className="text-[19px] leading-none text-[#7a848e]">
            对题目图片框选需识别的内容
          </span>
        </div>
        {questionPages.map((page) => renderMaterialPage(page, 'question'))}
      </section>

      {answerPages.length > 0 ? (
        <section className="mt-[34px] border-t border-dashed border-[#e3bd82] pt-[28px]">
          <div className="mb-[18px] flex items-center gap-[14px]">
            <span className="rounded-[6px] bg-[#fff3dd] px-[16px] py-[8px] text-[21px] font-semibold leading-none text-[#f0a12a]">
              答案图片
            </span>
            <span className="text-[19px] leading-none text-[#9a7a45]">
              用于系统匹配答案和解析，无需框选
            </span>
          </div>
          {answerPages.map((page) => renderMaterialPage(page, 'answer'))}
        </section>
      ) : null}
    </div>
  );

  const renderUnifiedModeMaterials = () => (
    <div
      className={`absolute inset-0 overflow-y-auto ${isPortraitSelection ? 'px-[24px] py-[22px]' : 'px-[42px] py-[28px]'}`}
      data-req-anchor="tablet-question-content-selection.material-pages"
    >
      {renderQuestionsOnlyRequirementMarker('TABLET_QUESTION_CONTENT_SELECTION-014', 'left-[36px] top-[28px]')}
      {materialPages.map((page) => renderMaterialPage(page, 'question'))}
    </div>
  );

  return (
    <div className="absolute inset-0 z-30 bg-[#eef2f5]">
      <header className="absolute left-0 top-0 h-[88px] w-full border-b border-[#e3e7eb] bg-white">
        <button
          aria-label="返回"
          className="absolute left-[28px] top-[20px] flex h-[50px] items-center gap-[6px] rounded-[8px] pr-[16px] text-[#202124] active:bg-[#f3f5f6]"
          data-req-anchor="tablet-question-content-selection.header-back"
          onClick={handleBackClick}
          type="button"
        >
          <ChevronLeft className="h-[34px] w-[34px] stroke-[2.3]" />
          <span className="text-[28px] font-semibold leading-none">选择识别内容</span>
          <span
            className="text-[20px] font-normal leading-none text-[#7b838c]"
            data-req-anchor="tablet-question-content-selection.scope-copy"
          >
            （在左侧资料上选择要识别的<strong className="font-semibold text-[#5f6872]">完整题干内容</strong>）
          </span>
        </button>
        {renderQuestionsOnlyRequirementMarker('TABLET_QUESTION_CONTENT_SELECTION-001', 'left-[360px] top-[12px] z-50')}
        {renderQuestionsOnlyRequirementMarker('TABLET_QUESTION_CONTENT_SELECTION-002', 'left-[760px] top-[12px] z-50')}
        <div
          className="absolute right-[40px] top-[24px] rounded-full bg-[#e7f7f1] px-[18px] py-[10px] text-[20px] leading-none text-[#2fac76]"
          data-req-anchor="tablet-question-content-selection.subject-tag"
        >
          {renderQuestionsOnlyRequirementMarker('TABLET_QUESTION_CONTENT_SELECTION-003', 'right-[-12px] top-[-12px]')}
          {subject}
        </div>
      </header>

      {selectionToastMessage ? (
        <div className="absolute left-1/2 top-[104px] z-50 -translate-x-1/2 rounded-[8px] bg-[rgba(32,33,36,0.88)] px-[24px] py-[13px] text-[20px] font-medium leading-none text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)]">
          {selectionToastMessage}
        </div>
      ) : null}

      <div className="absolute left-0 top-[88px] flex h-[76px] w-full items-center justify-between gap-[18px] border-b border-[#e2e7eb] bg-white px-[34px]">
        <div className="flex min-w-0 items-center gap-[14px]">
          <button className="h-[46px] rounded-[8px] border border-[#d7dde3] bg-white px-[20px] text-[20px] text-[#3f4852] active:bg-[#f4f6f7] disabled:text-[#b8c0c8]" data-req-anchor="tablet-question-content-selection.replace-material" disabled={isDetecting} onClick={handleReplaceClick} type="button">
            更换资料
          </button>
          {renderQuestionsOnlyRequirementMarker('TABLET_QUESTION_CONTENT_SELECTION-004', 'left-[132px] top-[8px]')}
          <button className="h-[46px] rounded-[8px] border border-[#d7dde3] bg-white px-[20px] text-[20px] text-[#3f4852] active:bg-[#f4f6f7] disabled:text-[#b8c0c8]" data-req-anchor="tablet-question-content-selection.supplement-material" disabled={isDetecting} onClick={onSupplement} type="button">
            补充资料
          </button>
          {renderQuestionsOnlyRequirementMarker('TABLET_QUESTION_CONTENT_SELECTION-005', 'left-[278px] top-[8px]')}
          <button
            className={`h-[46px] rounded-[8px] border px-[20px] text-[20px] font-medium disabled:border-[#d7dde3] disabled:bg-white disabled:text-[#b8c0c8] ${
              isAddBoxMode
                ? 'border-[#23bfb2] bg-[#23bfb2] text-white active:bg-[#12a99d]'
                : 'border-[#d7dde3] bg-white text-[#202124] active:bg-[#f4f6f7]'
            }`}
            data-req-anchor="tablet-question-content-selection.add-box"
            disabled={isDetecting || !activePage}
            onClick={handleAddBoxModeClick}
            type="button"
          >
            添加识别框
          </button>
          {renderQuestionsOnlyRequirementMarker('TABLET_QUESTION_CONTENT_SELECTION-006', 'left-[436px] top-[8px]')}
          <button
            className="h-[46px] rounded-[8px] border border-[#d7dde3] bg-white px-[20px] text-[20px] text-[#3f4852] active:bg-[#f4f6f7] disabled:text-[#b8c0c8]"
            data-req-anchor="tablet-question-content-selection.clear-boxes"
            disabled={isDetecting || boxes.length === 0}
            onClick={handleClearClick}
            type="button"
          >
            清空
          </button>
          {renderQuestionsOnlyRequirementMarker('TABLET_QUESTION_CONTENT_SELECTION-009', 'left-[612px] top-[8px]')}
        </div>
        <div className="flex h-[46px] shrink-0 items-center gap-[16px]">
          <div
            className="relative flex h-[42px] rounded-[8px] bg-[#eef1f3] p-[4px]"
            data-req-anchor="tablet-question-content-selection.orientation-switch"
          >
            {renderQuestionsOnlyRequirementMarker('TABLET_QUESTION_CONTENT_SELECTION-023', 'right-[-12px] top-[-16px] z-50')}
            <button
              aria-pressed={!isPortraitSelection}
              className={`h-[34px] rounded-[6px] px-[14px] text-[18px] font-medium leading-none ${
                !isPortraitSelection ? 'bg-white text-[#202124] shadow-sm' : 'text-[#68727d]'
              }`}
              onClick={() => setSelectionOrientation('landscape')}
              type="button"
            >
              横屏
            </button>
            <button
              aria-pressed={isPortraitSelection}
              className={`h-[34px] rounded-[6px] px-[14px] text-[18px] font-medium leading-none ${
                isPortraitSelection ? 'bg-white text-[#202124] shadow-sm' : 'text-[#68727d]'
              }`}
              onClick={() => setSelectionOrientation('portrait')}
              type="button"
            >
              竖屏
            </button>
          </div>
          <button
            aria-pressed={isAllBoxesSelected}
            className={`inline-flex h-[34px] items-center gap-[7px] rounded-[6px] px-[8px] text-[18px] leading-none ${
              isAllBoxesSelected
                ? 'text-[#68727d] active:bg-[#f4f6f7]'
                : isSomeBoxesSelected
                  ? 'text-[#4f5963] active:bg-[#f4f6f7]'
                  : 'text-[#8b949e] active:bg-[#f4f6f7]'
            } disabled:text-[#b8c0c8]`}
            data-req-anchor="tablet-question-content-selection.select-all"
            disabled={boxes.length === 0}
            onClick={toggleAllBoxes}
            type="button"
          >
            <span className={`flex h-[17px] w-[17px] items-center justify-center rounded-[4px] border ${
              isAllBoxesSelected || isSomeBoxesSelected
                ? 'border-[#95a0aa] bg-white text-[#68727d]'
                : 'border-[#c8d0d7] bg-white'
            }`}>
              {isAllBoxesSelected ? (
                <Check className="h-[13px] w-[13px] stroke-[2.6]" />
              ) : isSomeBoxesSelected ? (
                <Minus className="h-[12px] w-[12px] stroke-[2.8]" />
              ) : null}
            </span>
            全选
          </button>
          {renderQuestionsOnlyRequirementMarker('TABLET_QUESTION_CONTENT_SELECTION-010', 'left-[1220px] top-[8px]')}
          <span
            className="whitespace-nowrap text-[20px] leading-none text-[#68727d]"
            data-req-anchor="tablet-question-content-selection.selection-stats"
          >
            {renderQuestionsOnlyRequirementMarker('TABLET_QUESTION_CONTENT_SELECTION-011', 'right-[-20px] top-[-14px]')}
            已选中{selectedCount}题 / 已框选{boxes.length}题
          </span>
          <button
            aria-disabled={startRecognitionUnavailable}
            className={`h-[46px] rounded-[8px] px-[24px] text-[20px] font-medium leading-none text-white ${
              startRecognitionUnavailable
                ? 'bg-[#cfd7dd] shadow-none'
                : 'bg-[#23bfb2] shadow-[0_8px_18px_rgba(35,191,178,0.24)] active:bg-[#12a99d]'
            }`}
            data-req-anchor="tablet-question-content-selection.start-recognition"
            disabled={isDetecting || !activePage}
            onClick={handleStartRecognitionClick}
            type="button"
          >
            开始识别
          </button>
          {renderQuestionsOnlyRequirementMarker('TABLET_QUESTION_CONTENT_SELECTION-012', 'right-[18px] top-[8px]')}
        </div>
      </div>

      <main className="absolute bottom-0 left-0 right-0 top-[164px]">
        <section className="relative h-full w-full bg-[#f8fafb]">
          {status === 'loading' ? (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center bg-[#9fa4a6]"
              data-req-anchor="tablet-question-content-selection.detecting-state"
            >
              {renderQuestionsOnlyRequirementMarker('TABLET_QUESTION_CONTENT_SELECTION-013', 'left-1/2 top-[420px]')}
              <img alt="" className="h-[204px] w-[342px] object-contain" src="/tablet-ocr-loading.png" />
              <div className="mt-[28px] text-[23px] leading-none text-white">正在处理文件信息</div>
            </div>
          ) : activePage ? (
            isSeparateMode ? renderSeparateModeMaterials() : renderUnifiedModeMaterials()
          ) : (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div className="text-[25px] font-medium text-[#202124]">暂无可识别图片</div>
              <button className="mt-[24px] h-[48px] rounded-[8px] bg-[#23bfb2] px-[26px] text-[21px] text-white" onClick={onSupplement} type="button">
                补充资料
              </button>
            </div>
          )}
          {status === 'failed' ? (
            <div
              className="absolute right-[32px] top-[28px] rounded-full bg-[#fff8e8] px-[28px] py-[13px] text-[20px] leading-none text-[#b97412] shadow-[0_8px_20px_rgba(185,116,18,0.12)]"
              data-req-anchor="tablet-question-content-selection.detect-failed-tip"
            >
              {renderQuestionsOnlyRequirementMarker('TABLET_QUESTION_CONTENT_SELECTION-018', 'right-[-14px] top-[-14px]')}
              自动切题未完成，可手动添加识别框
            </div>
          ) : null}
        </section>
      </main>
      <TabletConfirmDialog
        action={confirmAction}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        renderRequirementMarker={renderQuestionsOnlyRequirementMarker}
      />
      {showAddBoxModeTip ? (
        <AddBoxModeTipDialog
          mode={addBoxInteractionMode}
          onCancel={() => setShowAddBoxModeTip(false)}
          onConfirm={handleAddBoxModeTipConfirm}
          onModeChange={setAddBoxInteractionMode}
          renderRequirementMarker={renderQuestionsOnlyRequirementMarker}
        />
      ) : null}
    </div>
  );
}

function AddImageDialog({
  onAlbumSelected,
  onCameraOpen,
  onClose,
}: {
  onAlbumSelected: (files: File[]) => void;
  onCameraOpen: () => void;
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="absolute inset-0 z-20 bg-black/55">
      <input
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) {
            onAlbumSelected(files.slice(0, 24));
          }
          event.target.value = '';
        }}
        type="file"
      />
      <section className="absolute left-[424px] top-[214px] h-[706px] w-[1072px] rounded-[20px] bg-white shadow-[0_20px_52px_rgba(0,0,0,0.24)]">
        <header className="absolute left-0 top-0 h-[96px] w-full border-b border-[#eeeeee]">
          <div className="absolute left-[48px] top-[33px] text-[30px] font-normal leading-none text-[#202124]">
            识别作业资料
          </div>
          <button
            aria-label="关闭"
            className="absolute right-[34px] top-[28px] flex h-[44px] w-[44px] items-center justify-center rounded-full text-[#808080] active:bg-[#f2f2f2] active:text-[#222]"
            onClick={onClose}
            type="button"
          >
            <X className="h-[34px] w-[34px] stroke-[2.2]" />
          </button>
        </header>

        <div className="absolute left-[64px] top-[154px] flex gap-[40px]">
          <SourceCard
            icon={<Images className="h-[42px] w-[42px] stroke-[1.9]" />}
            onClick={() => fileInputRef.current?.click()}
            title="从相册选择"
          />
          <SourceCard
            icon={<Camera className="h-[42px] w-[42px] stroke-[1.9]" />}
            onClick={onCameraOpen}
            title="拍照上传"
          />
        </div>

        <div className="absolute bottom-[80px] left-0 w-full text-center text-[22px] leading-none text-[#8a8f8c]">
          最多可添加24张图片
        </div>
      </section>
    </div>
  );
}

export function TabletAiEntryPreview() {
  const previewContainerRef = useRef<HTMLElement | null>(null);
  const scale = useCanvasScale(previewContainerRef);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isModeDialogOpen, setIsModeDialogOpen] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [isOcrPreviewOpen, setIsOcrPreviewOpen] = useState(false);
  const [isSubjectPickerOpen, setIsSubjectPickerOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [questionImages, setQuestionImages] = useState<SelectedImage[]>([]);
  const [answerImages, setAnswerImages] = useState<SelectedImage[]>([]);
  const [supplementSelectedImages, setSupplementSelectedImages] = useState<SelectedImage[]>([]);
  const [supplementQuestionImages, setSupplementQuestionImages] = useState<SelectedImage[]>([]);
  const [supplementAnswerImages, setSupplementAnswerImages] = useState<SelectedImage[]>([]);
  const [supplementSelectedImageOrder, setSupplementSelectedImageOrder] = useState<string[]>([]);
  const [supplementQuestionImageOrder, setSupplementQuestionImageOrder] = useState<string[]>([]);
  const [supplementAnswerImageOrder, setSupplementAnswerImageOrder] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedMode, setSelectedMode] = useState<RecognitionMode | ''>('');
  const [prototypeFixture, setPrototypeFixture] = useState<TabletPrototypeFixture | null>(null);
  const [captureRole, setCaptureRole] = useState<ImageRole>('question');
  const [captureCloseTarget, setCaptureCloseTarget] = useState<CaptureCloseTarget>(null);
  const [userMode, setUserMode] = useState<SubjectMode>('multiple');
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const selectedImagesRef = useRef(selectedImages);
  const questionImagesRef = useRef(questionImages);
  const answerImagesRef = useRef(answerImages);
  const supplementSelectedImagesRef = useRef(supplementSelectedImages);
  const supplementQuestionImagesRef = useRef(supplementQuestionImages);
  const supplementAnswerImagesRef = useRef(supplementAnswerImages);
  const tabletAiChatRequirementsById = useMemo(
    () => createRequirementMap(tabletAiChatRecognizeHomeworkRegistry.requirements),
    [],
  );
  const tabletAiChatDisplayNumbersByRequirementId = useMemo(
    () => createRequirementDisplayNumberMap([tabletAiChatRecognizeHomeworkRegistry]),
    [],
  );
  const tabletAiChatDisplayNumberScope = useMemo(
    () => createRequirementDisplayNumberScope(
      tabletAiChatMarkerIds,
      tabletAiChatDisplayNumbersByRequirementId,
    ),
    [tabletAiChatDisplayNumbersByRequirementId],
  );
  const tabletRecognitionModeRequirementsById = useMemo(
    () => createRequirementMap(tabletRecognitionModePageRegistry.requirements),
    [],
  );
  const tabletRecognitionModeDisplayNumbersByRequirementId = useMemo(
    () => createRequirementDisplayNumberMap([tabletRecognitionModePageRegistry]),
    [],
  );
  const tabletRecognitionModeDisplayNumberScope = useMemo(
    () => createRequirementDisplayNumberScope(
      tabletRecognitionModeMarkerIds,
      tabletRecognitionModeDisplayNumbersByRequirementId,
    ),
    [tabletRecognitionModeDisplayNumbersByRequirementId],
  );
  const tabletCapturePageRequirementsById = useMemo(
    () => createRequirementMap(tabletCapturePageRegistry.requirements),
    [],
  );
  const tabletCapturePageDisplayNumbersByRequirementId = useMemo(
    () => createRequirementDisplayNumberMap([tabletCapturePageRegistry]),
    [],
  );
  const tabletCapturePageDisplayNumberScope = useMemo(
    () => createRequirementDisplayNumberScope(
      tabletCaptureMarkerIds,
      tabletCapturePageDisplayNumbersByRequirementId,
    ),
    [tabletCapturePageDisplayNumbersByRequirementId],
  );
  const tabletQuestionContentSelectionRequirementsById = useMemo(
    () => createRequirementMap(tabletQuestionContentSelectionPageRegistry.requirements),
    [],
  );
  const tabletQuestionContentSelectionDisplayNumbersByRequirementId = useMemo(
    () => createRequirementDisplayNumberMap([tabletQuestionContentSelectionPageRegistry]),
    [],
  );
  const tabletQuestionContentSelectionDisplayNumberScope = useMemo(
    () => createRequirementDisplayNumberScope(
      tabletQuestionContentSelectionMarkerIds,
      tabletQuestionContentSelectionDisplayNumbersByRequirementId,
    ),
    [tabletQuestionContentSelectionDisplayNumbersByRequirementId],
  );
  const questionAnswerReviewRequirementsById = useMemo(
    () => createRequirementMap(questionAnswerReviewStepRegistry.requirements),
    [],
  );
  const questionAnswerReviewDisplayNumbersByRequirementId = useMemo(
    () => createRequirementDisplayNumberMap([questionAnswerReviewStepRegistry]),
    [],
  );
  const questionAnswerReviewDisplayNumberScope = useMemo(
    () => createRequirementDisplayNumberScope(
      tabletReviewImageMarkerIds,
      questionAnswerReviewDisplayNumbersByRequirementId,
    ),
    [questionAnswerReviewDisplayNumbersByRequirementId],
  );
  const questionAnswerReviewRecognitionDisplayNumberScope = useMemo(
    () => createRequirementDisplayNumberScope(
      tabletReviewRecognitionMarkerIds,
      questionAnswerReviewDisplayNumbersByRequirementId,
    ),
    [questionAnswerReviewDisplayNumbersByRequirementId],
  );
  const questionAnswerReviewQaImageDisplayNumberScope = useMemo(
    () => createRequirementDisplayNumberScope(
      tabletReviewQaImageMarkerIds,
      questionAnswerReviewDisplayNumbersByRequirementId,
    ),
    [questionAnswerReviewDisplayNumbersByRequirementId],
  );
  const questionAnswerReviewQaRecognitionDisplayNumberScope = useMemo(
    () => createRequirementDisplayNumberScope(
      tabletReviewQaRecognitionMarkerIds,
      questionAnswerReviewDisplayNumbersByRequirementId,
    ),
    [questionAnswerReviewDisplayNumbersByRequirementId],
  );
  const renderTabletAiChatRequirementMarker: RequirementMarkerRenderer = (
    requirementId,
    className,
    displayNumber,
  ) => {
    if (isModeDialogOpen) {
      return null;
    }

    const requirement = tabletAiChatRequirementsById.get(requirementId);

    if (!requirement) {
      return null;
    }

    const resolvedDisplayNumber =
      tabletAiChatDisplayNumbersByRequirementId.get(requirementId) ?? displayNumber;

    return (
      <RequirementMarker
        requirement={requirement}
        isOpen={selectedRequirementId === requirementId}
        displayNumber={resolvedDisplayNumber}
        displayNumberScope={tabletAiChatDisplayNumberScope}
        className={className}
        onToggle={() =>
          setSelectedRequirementId((current) => (current === requirementId ? null : requirementId))
        }
        onClose={() => setSelectedRequirementId(null)}
      />
    );
  };
  const renderTabletRecognitionModeRequirementMarker: RequirementMarkerRenderer = (
    requirementId,
    className,
    displayNumber,
  ) => {
    const requirement = tabletRecognitionModeRequirementsById.get(requirementId);

    if (!requirement) {
      return null;
    }

    const resolvedDisplayNumber =
      tabletRecognitionModeDisplayNumbersByRequirementId.get(requirementId) ?? displayNumber;

    return (
      <RequirementMarker
        requirement={requirement}
        isOpen={selectedRequirementId === requirementId}
        displayNumber={resolvedDisplayNumber}
        displayNumberScope={tabletRecognitionModeDisplayNumberScope}
        className={className}
        onToggle={() =>
          setSelectedRequirementId((current) => (current === requirementId ? null : requirementId))
        }
        onClose={() => setSelectedRequirementId(null)}
      />
    );
  };
  const renderTabletCapturePageRequirementMarker: RequirementMarkerRenderer = (
    requirementId,
    className,
    displayNumber,
  ) => {
    const requirement = tabletCapturePageRequirementsById.get(requirementId);

    if (!requirement) {
      return null;
    }

    const resolvedDisplayNumber =
      tabletCapturePageDisplayNumbersByRequirementId.get(requirementId) ?? displayNumber;

    return (
      <RequirementMarker
        requirement={requirement}
        isOpen={selectedRequirementId === requirementId}
        displayNumber={resolvedDisplayNumber}
        displayNumberScope={tabletCapturePageDisplayNumberScope}
        className={className}
        onToggle={() =>
          setSelectedRequirementId((current) => (current === requirementId ? null : requirementId))
        }
        onClose={() => setSelectedRequirementId(null)}
      />
    );
  };
  const renderTabletQuestionContentSelectionRequirementMarker: RequirementMarkerRenderer = (
    requirementId,
    className,
    displayNumber,
  ) => {
    const requirement = tabletQuestionContentSelectionRequirementsById.get(requirementId);

    if (!requirement) {
      return null;
    }

    const resolvedDisplayNumber =
      tabletQuestionContentSelectionDisplayNumbersByRequirementId.get(requirementId) ?? displayNumber;

    return (
      <RequirementMarker
        requirement={requirement}
        isOpen={selectedRequirementId === requirementId}
        displayNumber={resolvedDisplayNumber}
        displayNumberScope={tabletQuestionContentSelectionDisplayNumberScope}
        className={className}
        onToggle={() =>
          setSelectedRequirementId((current) => (current === requirementId ? null : requirementId))
        }
        onClose={() => setSelectedRequirementId(null)}
      />
    );
  };
  const renderQuestionAnswerReviewRequirementMarker: RequirementMarkerRenderer = (
    requirementId,
    className,
    displayNumber,
  ) => {
    const requirement = questionAnswerReviewRequirementsById.get(requirementId);

    if (!requirement) {
      return null;
    }

    const resolvedDisplayNumber =
      questionAnswerReviewDisplayNumbersByRequirementId.get(requirementId) ?? displayNumber;
    const displayNumberScope = tabletReviewRecognitionMarkerIds.includes(requirementId)
      ? questionAnswerReviewRecognitionDisplayNumberScope
      : tabletReviewQaRecognitionMarkerIds.includes(requirementId)
        ? questionAnswerReviewQaRecognitionDisplayNumberScope
        : tabletReviewQaImageMarkerIds.includes(requirementId)
          ? questionAnswerReviewQaImageDisplayNumberScope
          : questionAnswerReviewDisplayNumberScope;

    return (
      <RequirementMarker
        requirement={requirement}
        isOpen={selectedRequirementId === requirementId}
        displayNumber={resolvedDisplayNumber}
        displayNumberScope={displayNumberScope}
        className={className}
        onToggle={() =>
          setSelectedRequirementId((current) => (current === requirementId ? null : requirementId))
        }
        onClose={() => setSelectedRequirementId(null)}
      />
    );
  };

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    questionImagesRef.current = questionImages;
  }, [questionImages]);

  useEffect(() => {
    answerImagesRef.current = answerImages;
  }, [answerImages]);

  useEffect(() => {
    supplementSelectedImagesRef.current = supplementSelectedImages;
  }, [supplementSelectedImages]);

  useEffect(() => {
    supplementQuestionImagesRef.current = supplementQuestionImages;
  }, [supplementQuestionImages]);

  useEffect(() => {
    supplementAnswerImagesRef.current = supplementAnswerImages;
  }, [supplementAnswerImages]);

  useEffect(() => {
    if (isModeDialogOpen) {
      setSelectedRequirementId(null);
    }
  }, [isModeDialogOpen]);

  useEffect(() => () => {
    revokeImageUrls(selectedImagesRef.current);
    revokeImageUrls(questionImagesRef.current);
    revokeImageUrls(answerImagesRef.current);
    revokeImageUrls(supplementSelectedImagesRef.current);
    revokeImageUrls(supplementQuestionImagesRef.current);
    revokeImageUrls(supplementAnswerImagesRef.current);
  }, []);

  const clearSupplementImages = (shouldRevoke = true) => {
    if (shouldRevoke) {
      revokeImageUrls(supplementSelectedImagesRef.current);
      revokeImageUrls(supplementQuestionImagesRef.current);
      revokeImageUrls(supplementAnswerImagesRef.current);
    }

    setSupplementSelectedImages([]);
    setSupplementQuestionImages([]);
    setSupplementAnswerImages([]);
    setSupplementSelectedImageOrder([]);
    setSupplementQuestionImageOrder([]);
    setSupplementAnswerImageOrder([]);
  };

  const handleAlbumSelected = (files: File[]) => {
    revokeImageUrls(selectedImages);
    setSelectedImages(appendFilesAsImages(files));
    setIsUploadDialogOpen(false);
  };

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setIsSubjectPickerOpen(false);
    setIsModeDialogOpen(true);
  };

  const handleOpenRecognitionFlow = () => {
    clearSupplementImages();
    setPrototypeFixture(null);
    setIsOcrPreviewOpen(false);
    setIsCaptureOpen(false);
    setIsModeDialogOpen(false);
    setCaptureCloseTarget(null);

    if (userMode === 'single') {
      setSelectedSubject(SINGLE_SUBJECT);
      setIsSubjectPickerOpen(false);
      setIsModeDialogOpen(true);
      return;
    }

    setSelectedSubject('');
    setIsSubjectPickerOpen(true);
  };

  const handleUserModeChange = (mode: SubjectMode) => {
    setUserMode(mode);
    setIsSubjectPickerOpen(false);
    setSelectedSubject(mode === 'single' ? SINGLE_SUBJECT : '');
  };

  const handleModeSelect = (mode: RecognitionMode) => {
    clearSupplementImages();
    setPrototypeFixture(null);
    revokeImageUrls(selectedImages);
    revokeImageUrls(questionImages);
    revokeImageUrls(answerImages);
    setSelectedImages([]);
    setQuestionImages([]);
    setAnswerImages([]);
    setSelectedMode(mode);
    setIsModeDialogOpen(false);

    if (mode === 'separate_answer') {
      setCaptureRole('question');
    }

    setIsCaptureOpen(true);
    setCaptureCloseTarget('mode');
  };

  const handlePrototypeStart = (
    subjectType: PrototypeSubjectType,
    mode: RecognitionMode,
    targetStep: PrototypeTargetStep,
  ) => {
    clearSupplementImages();
    revokeImageUrls(selectedImages);
    revokeImageUrls(questionImages);
    revokeImageUrls(answerImages);

    const fixture = createTabletPrototypeFixture(subjectType, mode, targetStep);
    const fixtureQuestionImages = fixture.images.filter((image) => image.role === 'question');
    const fixtureAnswerImages = fixture.images.filter((image) => image.role === 'answer');

    setPrototypeFixture(fixture);
    setSelectedSubject(fixture.subject);
    setSelectedMode(mode);
    setSelectedImages(fixture.images);
    setQuestionImages(fixtureQuestionImages);
    setAnswerImages(fixtureAnswerImages);
    setCaptureRole('question');
    setCaptureCloseTarget(null);
    setIsSubjectPickerOpen(false);
    setIsUploadDialogOpen(false);
    setIsCaptureOpen(false);
    setIsModeDialogOpen(false);
    setIsOcrPreviewOpen(true);
  };

  const handleOpenCamera = () => {
    clearSupplementImages();
    setIsUploadDialogOpen(false);
    setIsCaptureOpen(true);
    setCaptureCloseTarget('upload');
  };

  const isSupplementCapture = captureCloseTarget === 'content';
  const mergedSupplementSelectedImages = isSupplementCapture && selectedMode !== 'separate_answer'
    ? mergeSupplementImagesByOrder(supplementSelectedImageOrder, selectedImages, supplementSelectedImages)
    : [];
  const mergedSupplementQuestionImages = isSupplementCapture && selectedMode === 'separate_answer'
    ? mergeSupplementImagesByOrder(supplementQuestionImageOrder, questionImages, supplementQuestionImages)
    : [];
  const mergedSupplementAnswerImages = isSupplementCapture && selectedMode === 'separate_answer'
    ? mergeSupplementImagesByOrder(supplementAnswerImageOrder, answerImages, supplementAnswerImages)
    : [];
  const captureSelectedImages = isSupplementCapture ? supplementSelectedImages : selectedImages;
  const captureQuestionImages = isSupplementCapture ? supplementQuestionImages : questionImages;
  const captureAnswerImages = isSupplementCapture ? supplementAnswerImages : answerImages;
  const managerSelectedImages = isSupplementCapture && selectedMode !== 'separate_answer'
    ? mergedSupplementSelectedImages
    : captureSelectedImages;
  const managerQuestionImages = isSupplementCapture && selectedMode === 'separate_answer'
    ? mergedSupplementQuestionImages
    : captureQuestionImages;
  const managerAnswerImages = isSupplementCapture && selectedMode === 'separate_answer'
    ? mergedSupplementAnswerImages
    : captureAnswerImages;
  const managerImageCount = selectedMode === 'separate_answer'
    ? managerQuestionImages.length + managerAnswerImages.length
    : managerSelectedImages.length;
  const supplementImageKeys = useMemo(
    () => new Set([
      ...supplementSelectedImages,
      ...supplementQuestionImages,
      ...supplementAnswerImages,
    ].map((image) => getImageKey(image))),
    [supplementAnswerImages, supplementQuestionImages, supplementSelectedImages],
  );
  const hasSupplementSelectedImageChanges =
    supplementSelectedImages.length > 0 ||
    getImageOrderSignature(mergedSupplementSelectedImages) !== getImageOrderSignature(selectedImages);
  const hasSupplementSeparateImageChanges =
    supplementQuestionImages.length > 0 ||
    supplementAnswerImages.length > 0 ||
    getImageOrderSignature(mergedSupplementQuestionImages) !== getImageOrderSignature(questionImages) ||
    getImageOrderSignature(mergedSupplementAnswerImages) !== getImageOrderSignature(answerImages);
  const hasSupplementCaptureChanges =
    selectedMode === 'separate_answer'
      ? hasSupplementSeparateImageChanges
      : hasSupplementSelectedImageChanges;
  const processedImageUrlSet = useMemo(
    () => new Set([...selectedImages, ...questionImages, ...answerImages].map((image) => getImageKey(image))),
    [answerImages, questionImages, selectedImages],
  );
  const getCaptureImageOrigin = (image: SelectedImage): CaptureImageOrigin => (
    isSupplementCapture && processedImageUrlSet.has(getImageKey(image)) ? 'processed' : 'supplement'
  );

  const getCurrentCaptureImages = () => {
    if (selectedMode === 'separate_answer') {
      return captureRole === 'question' ? captureQuestionImages : captureAnswerImages;
    }

    return captureSelectedImages;
  };

  const handleCapture = (crop?: CropRegion) => {
    if (selectedMode === 'separate_answer') {
      const updater = isSupplementCapture
        ? captureRole === 'question' ? setSupplementQuestionImages : setSupplementAnswerImages
        : captureRole === 'question' ? setQuestionImages : setAnswerImages;
      const currentCount = captureRole === 'question' ? captureQuestionImages.length : captureAnswerImages.length;
      updater((currentImages) => [
        ...currentImages,
        createMockCapture(captureRole, currentCount + 1, crop),
      ]);
      return;
    }

    const updater = isSupplementCapture ? setSupplementSelectedImages : setSelectedImages;
    updater((currentImages) => [
      ...currentImages,
      createMockCapture(undefined, currentImages.length + 1, crop),
    ]);
  };

  const handleCaptureAlbumSelected = (files: File[]) => {
    const nextImages = appendFilesAsImages(
      files,
      selectedMode === 'separate_answer' ? captureRole : undefined,
    );

    if (selectedMode === 'separate_answer') {
      const updater = isSupplementCapture
        ? captureRole === 'question' ? setSupplementQuestionImages : setSupplementAnswerImages
        : captureRole === 'question' ? setQuestionImages : setAnswerImages;
      updater((currentImages) => [...currentImages, ...nextImages]);
      return;
    }

    const updater = isSupplementCapture ? setSupplementSelectedImages : setSelectedImages;
    updater((currentImages) => [...currentImages, ...nextImages]);
  };

  const handleDeleteCaptureImage = (image: SelectedImage, role?: ImageRole) => {
    const imageKey = getImageKey(image);

    if (isSupplementCapture && processedImageUrlSet.has(imageKey)) {
      return;
    }

    if (selectedMode === 'separate_answer' && role) {
      const updater = isSupplementCapture
        ? role === 'question' ? setSupplementQuestionImages : setSupplementAnswerImages
        : role === 'question' ? setQuestionImages : setAnswerImages;
      updater((currentImages) => currentImages.filter((currentImage) => getImageKey(currentImage) !== imageKey));
      if (isSupplementCapture) {
        const orderUpdater = role === 'question' ? setSupplementQuestionImageOrder : setSupplementAnswerImageOrder;
        orderUpdater((currentOrder) => currentOrder.filter((url) => url !== imageKey));
      }
      revokeImageUrl(image);
      return;
    }

    const updater = isSupplementCapture ? setSupplementSelectedImages : setSelectedImages;
    updater((currentImages) => currentImages.filter((currentImage) => getImageKey(currentImage) !== imageKey));
    if (isSupplementCapture) {
      setSupplementSelectedImageOrder((currentOrder) => currentOrder.filter((url) => url !== imageKey));
    }
    revokeImageUrl(image);
  };

  const handleMoveCaptureImage = (image: SelectedImage, fromRole: ImageRole, toRole: ImageRole) => {
    const imageKey = getImageKey(image);

    if (isSupplementCapture && processedImageUrlSet.has(imageKey)) {
      return;
    }

    const fromUpdater = isSupplementCapture
      ? fromRole === 'question' ? setSupplementQuestionImages : setSupplementAnswerImages
      : fromRole === 'question' ? setQuestionImages : setAnswerImages;
    const toUpdater = isSupplementCapture
      ? toRole === 'question' ? setSupplementQuestionImages : setSupplementAnswerImages
      : toRole === 'question' ? setQuestionImages : setAnswerImages;

    fromUpdater((currentImages) => currentImages.filter((currentImage) => getImageKey(currentImage) !== imageKey));
    toUpdater((currentImages) => [
      ...currentImages,
      {
        ...image,
        name: image.name.replace(/^题目_/, '').replace(/^答案_/, ''),
        role: toRole,
      },
    ]);

    if (isSupplementCapture) {
      const fromOrderUpdater = fromRole === 'question' ? setSupplementQuestionImageOrder : setSupplementAnswerImageOrder;
      const toOrderUpdater = toRole === 'question' ? setSupplementQuestionImageOrder : setSupplementAnswerImageOrder;
      fromOrderUpdater((currentOrder) => currentOrder.filter((url) => url !== imageKey));
      toOrderUpdater((currentOrder) => (
        currentOrder.includes(imageKey) ? currentOrder : [...currentOrder, imageKey]
      ));
    }
  };

  const handleQuestionCaptureReorder = (fromUrl: string, toUrl: string) => {
    if (isSupplementCapture && selectedMode === 'separate_answer') {
      setSupplementQuestionImageOrder((currentOrder) => {
        const orderedImages = mergeSupplementImagesByOrder(currentOrder, questionImages, supplementQuestionImages);
        return reorderImagesByUrl(orderedImages, fromUrl, toUrl).map((image) => getImageKey(image));
      });
      return;
    }

    const updater = isSupplementCapture ? setSupplementQuestionImages : setQuestionImages;

    updater((currentImages) => reorderImagesByUrl(currentImages, fromUrl, toUrl));
  };

  const handleAnswerCaptureReorder = (fromUrl: string, toUrl: string) => {
    if (isSupplementCapture && selectedMode === 'separate_answer') {
      setSupplementAnswerImageOrder((currentOrder) => {
        const orderedImages = mergeSupplementImagesByOrder(currentOrder, answerImages, supplementAnswerImages);
        return reorderImagesByUrl(orderedImages, fromUrl, toUrl).map((image) => getImageKey(image));
      });
      return;
    }

    const updater = isSupplementCapture ? setSupplementAnswerImages : setAnswerImages;

    updater((currentImages) => reorderImagesByUrl(currentImages, fromUrl, toUrl));
  };

  const handleSelectedCaptureReorder = (fromUrl: string, toUrl: string) => {
    if (isSupplementCapture) {
      setSupplementSelectedImageOrder((currentOrder) => {
        const orderedImages = mergeSupplementImagesByOrder(currentOrder, selectedImages, supplementSelectedImages);
        return reorderImagesByUrl(orderedImages, fromUrl, toUrl).map((image) => getImageKey(image));
      });
      return;
    }

    setSelectedImages((currentImages) => reorderImagesByUrl(currentImages, fromUrl, toUrl));
  };

  const handleCapturePrimary = () => {
    if (selectedMode === 'separate_answer') {
      if (captureRole === 'question') {
        setCaptureRole('answer');
        return;
      }

      if (isSupplementCapture) {
        const nextQuestionImages = mergeSupplementImagesByOrder(
          supplementQuestionImageOrder,
          questionImages,
          supplementQuestionImages,
        );
        const nextAnswerImages = mergeSupplementImagesByOrder(
          supplementAnswerImageOrder,
          answerImages,
          supplementAnswerImages,
        );

        setQuestionImages(nextQuestionImages);
        setAnswerImages(nextAnswerImages);
        setSelectedImages([...nextQuestionImages, ...nextAnswerImages]);
        clearSupplementImages(false);
      } else {
        setSelectedImages([...questionImages, ...answerImages]);
      }

      setIsCaptureOpen(false);
      setCaptureCloseTarget(null);
      setIsOcrPreviewOpen(true);
      return;
    }

    if (isSupplementCapture) {
      setSelectedImages(mergeSupplementImagesByOrder(supplementSelectedImageOrder, selectedImages, supplementSelectedImages));
      clearSupplementImages(false);
    }

    setIsCaptureOpen(false);
    setCaptureCloseTarget(null);
    setIsOcrPreviewOpen(true);
  };

  const handleReplaceMaterials = () => {
    clearSupplementImages();
    setPrototypeFixture(null);
    revokeImageUrls(selectedImages);
    revokeImageUrls(questionImages);
    revokeImageUrls(answerImages);
    setSelectedImages([]);
    setQuestionImages([]);
    setAnswerImages([]);
    setIsOcrPreviewOpen(false);
    setIsCaptureOpen(false);
    setIsModeDialogOpen(true);
  };

  const handleSupplementMaterials = () => {
    clearSupplementImages();
    setSupplementSelectedImageOrder(selectedImages.map((image) => getImageKey(image)));
    setSupplementQuestionImageOrder(questionImages.map((image) => getImageKey(image)));
    setSupplementAnswerImageOrder(answerImages.map((image) => getImageKey(image)));
    setIsOcrPreviewOpen(true);
    setCaptureRole('question');
    setCaptureCloseTarget('content');
    setIsCaptureOpen(true);
  };

  const handleBackToRecognitionMode = () => {
    setIsOcrPreviewOpen(false);
    setIsCaptureOpen(false);
    setCaptureCloseTarget(null);
    setIsModeDialogOpen(true);
  };

  const handleCloseCapture = () => {
    const closeTarget = captureCloseTarget;
    setIsCaptureOpen(false);
    setCaptureCloseTarget(null);

    if (closeTarget === 'mode') {
      setIsModeDialogOpen(true);
      return;
    }

    if (closeTarget === 'content') {
      clearSupplementImages();
      setIsOcrPreviewOpen(true);
      return;
    }

    if (closeTarget === 'upload') {
      setIsUploadDialogOpen(true);
    }
  };

  const currentCaptureImages = getCurrentCaptureImages();
  const captureTitle = selectedMode === 'separate_answer'
    ? captureRole === 'question'
      ? '拍摄题目图片'
      : '拍摄答案图片'
    : isSupplementCapture
      ? '补充作业资料'
      : '拍摄作业资料';
  const capturePrimaryText = selectedMode === 'separate_answer'
    ? captureRole === 'question'
      ? '下一步：拍答案'
      : '去切题'
    : '去切题';
  const capturePrimaryDisabled = isSupplementCapture
    ? selectedMode === 'separate_answer' && captureRole === 'question'
      ? managerImageCount === 0
      : !hasSupplementCaptureChanges
    : currentCaptureImages.length === 0;

  return (
    <main ref={previewContainerRef} className="flex min-h-screen items-center justify-center overflow-hidden bg-[#dfe2e6]">
      <div
        style={{
          width: CANVAS_WIDTH * scale,
          height: CANVAS_HEIGHT * scale,
        }}
      >
        <div
          className="relative origin-top-left overflow-hidden bg-white"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${scale})`,
          }}
        >
          <HomeworkPanel />
          <AiPanel
            onSubjectSelect={handleSubjectSelect}
            isSubjectPickerOpen={isSubjectPickerOpen}
            onOpenUpload={handleOpenRecognitionFlow}
            onUserModeChange={handleUserModeChange}
            renderRequirementMarker={renderTabletAiChatRequirementMarker}
            selectedSubject={selectedSubject}
            userMode={userMode}
          />
          {isUploadDialogOpen ? (
            <AddImageDialog
              onAlbumSelected={handleAlbumSelected}
              onCameraOpen={handleOpenCamera}
              onClose={() => setIsUploadDialogOpen(false)}
            />
          ) : null}
          {isModeDialogOpen ? (
            <RecognitionModeDialog
              onClose={() => setIsModeDialogOpen(false)}
              onModeSelect={handleModeSelect}
              onPrototypeStart={handlePrototypeStart}
              renderRequirementMarker={renderTabletRecognitionModeRequirementMarker}
            />
          ) : null}
          {isCaptureOpen ? (
            <CaptureSimulator
              answerCount={captureAnswerImages.length}
              answerImages={managerAnswerImages}
              currentImages={currentCaptureImages}
              currentRole={selectedMode === 'separate_answer' ? captureRole : undefined}
              getImageOrigin={getCaptureImageOrigin}
              isSupplementMode={isSupplementCapture}
              mode={selectedMode}
              onAlbumSelected={handleCaptureAlbumSelected}
              onCapture={handleCapture}
              onClose={handleCloseCapture}
              onDeleteImage={handleDeleteCaptureImage}
              onMoveImage={handleMoveCaptureImage}
              onAnswerReorder={handleAnswerCaptureReorder}
              onPrimary={handleCapturePrimary}
              onQuestionReorder={handleQuestionCaptureReorder}
              onSelectedReorder={handleSelectedCaptureReorder}
              onRoleChange={setCaptureRole}
              primaryDisabled={capturePrimaryDisabled}
              primaryText={capturePrimaryText}
              questionCount={captureQuestionImages.length}
              questionImages={managerQuestionImages}
              renderRequirementMarker={renderTabletCapturePageRequirementMarker}
              selectedImages={managerSelectedImages}
              supplementImageKeys={supplementImageKeys}
              title={captureTitle}
            />
          ) : null}
          {isOcrPreviewOpen ? (
            <TabletOcrContentSelectionPage
              images={selectedImages}
              mode={selectedMode}
              onBack={handleBackToRecognitionMode}
              onReplace={handleReplaceMaterials}
              onSupplement={handleSupplementMaterials}
              prototypeFixture={prototypeFixture}
              renderRequirementMarker={renderTabletQuestionContentSelectionRequirementMarker}
              renderReviewRequirementMarker={renderQuestionAnswerReviewRequirementMarker}
              subject={selectedSubject || SINGLE_SUBJECT}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
