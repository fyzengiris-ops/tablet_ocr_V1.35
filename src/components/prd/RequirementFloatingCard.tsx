'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Pencil, X } from 'lucide-react';

import type { RequirementItem } from '@/requirements';
import {
  type EditableRequirementSection,
  useRequirementReviewOverride,
} from './requirement-review-storage';
import { getRequirementBusinessLogicSections, splitTextIntoReadableItems } from './requirement-utils';

interface FloatingCardPlacement {
  left: number;
  top: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
}

interface RequirementFloatingCardProps {
  requirement: RequirementItem;
  placement: FloatingCardPlacement;
  displayNumber?: number;
  onClose: () => void;
}

function EmphasizedFlowText({ value }: { value: string }) {
  const match = value.match(/^(正常拍摄流程|补充资料流程)：([\s\S]*)$/);

  if (!match) {
    return <span className="whitespace-pre-wrap">{value}</span>;
  }

  return (
    <span className="whitespace-pre-wrap">
      <strong className="font-semibold text-gray-900">{match[1]}</strong>
      ：{match[2]}
    </span>
  );
}

function SectionValue({ value }: { value: string | string[] }) {
  const items = Array.isArray(value)
    ? value.map((item) => item.trim()).filter(Boolean)
    : splitTextIntoReadableItems(value);

  if (items.length > 1) {
    return (
      <ol className="mt-1.5 space-y-1.5 leading-5">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-1.5">
            <span className="shrink-0 text-[11px] font-semibold text-emerald-700">{index + 1}、</span>
            <EmphasizedFlowText value={item} />
          </li>
        ))}
      </ol>
    );
  }

  return (
    <p className="mt-1 leading-5">
      <EmphasizedFlowText value={items[0] ?? ''} />
    </p>
  );
}

function toEditableSections(requirement: RequirementItem): EditableRequirementSection[] {
  return getRequirementBusinessLogicSections(requirement).map((section) => ({
    id: section.id,
    title: section.category,
    items: Array.isArray(section.content)
      ? section.content.map((item) => item.trim()).filter(Boolean)
      : splitTextIntoReadableItems(section.content),
  }));
}

function getSectionsSourceSignature(sections: EditableRequirementSection[]) {
  return JSON.stringify(sections.map((section) => ({
    id: section.id,
    items: section.items,
    title: section.title,
  })));
}

const questionTypeFailureSupplementSections: EditableRequirementSection[] = [
  {
    id: 'display.description',
    title: '题型展示',
    items: [
      '题型识别失败时，题卡头部的题型选择器显示「识别失败」。',
      '失败状态使用橙色边框和橙色文字提示，和正常识别出的绿色题型状态区分。',
    ],
  },
  {
    id: 'operation.description',
    title: '切换保护',
    items: [
      '题型识别请求失败时，题卡保留在核对列表中，并将题型状态标记为识别失败。',
      '用户可通过调整识别框并继续识别，重新获取题型结果。',
      '题型识别失败状态不自动改写为某个默认题型，避免把失败结果误当成已确认题型。',
    ],
  },
  {
    id: 'operation.exceptions',
    title: '异常处理',
    items: [
      '如果所有题目都处于识别失败且没有可加入题目，加入试卷按钮保持不可用。',
    ],
  },
];

function appendMissingItems(targetItems: string[], supplementItems: string[]) {
  const existingText = targetItems.join('\n');

  return [
    ...targetItems,
    ...supplementItems.filter((item) => !existingText.includes(item)),
  ];
}

function mergeQuestionTypeFailureSupplement(
  sections: EditableRequirementSection[],
) {
  const nextSections = sections.map((section) => ({ ...section, items: [...section.items] }));

  questionTypeFailureSupplementSections.forEach((supplementSection) => {
    const targetSection = nextSections.find((section) => section.id === supplementSection.id);

    if (!targetSection) {
      nextSections.push(supplementSection);
      return;
    }

    targetSection.items = appendMissingItems(targetSection.items, supplementSection.items);
  });

  return nextSections;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function RequirementFloatingCard({
  requirement,
  placement,
  displayNumber,
  onClose,
}: RequirementFloatingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { reviewOverride, updateReviewOverride } = useRequirementReviewOverride(requirement.id);
  const baseSections = useMemo(() => toEditableSections(requirement), [requirement]);
  const baseSectionsSourceSignature = useMemo(
    () => getSectionsSourceSignature(baseSections),
    [baseSections],
  );
  const effectiveSections =
    reviewOverride.sections && (
      reviewOverride.sectionsSourceSignature === undefined
      || reviewOverride.sectionsSourceSignature === baseSectionsSourceSignature
    )
      ? reviewOverride.sections
      : reviewOverride.sections && requirement.id === 'TABLET_REVIEW_IMAGE-009'
        ? mergeQuestionTypeFailureSupplement(reviewOverride.sections)
      : baseSections;
  const dragStateRef = useRef<{
    pointerX: number;
    pointerY: number;
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [position, setPosition] = useState({ left: placement.left, top: placement.top });
  const [isEditing, setIsEditing] = useState(false);
  const [draftSections, setDraftSections] = useState<EditableRequirementSection[]>(effectiveSections);

  const saveEdits = useCallback(() => {
    const normalizedSections = draftSections
      .map((section) => ({
        ...section,
        title: section.title.trim() || '业务规则',
        items: section.items.map((item) => item.trim()).filter(Boolean),
      }))
      .filter((section) => section.items.length > 0);

    updateReviewOverride({
      sections: normalizedSections,
      sectionsSourceSignature: baseSectionsSourceSignature,
    });
    setDraftSections(normalizedSections);
    setIsEditing(false);
  }, [baseSectionsSourceSignature, draftSections, updateReviewOverride]);

  const enterEditMode = () => {
    setDraftSections(
      effectiveSections.map((section) => ({
        ...section,
        items: [...section.items],
      })),
    );
    setIsEditing(true);
  };

  const handleDragStart = (event: PointerEvent<HTMLDivElement>) => {
    if (isEditing || !cardRef.current) {
      return;
    }

    const rect = cardRef.current.getBoundingClientRect();
    dragStateRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState) {
      return;
    }

    const nextLeft = dragState.left + event.clientX - dragState.pointerX;
    const nextTop = dragState.top + event.clientY - dragState.pointerY;

    setPosition({
      left: clamp(nextLeft, 8, window.innerWidth - dragState.width - 8),
      top: clamp(nextTop, 8, window.innerHeight - dragState.height - 8),
    });
  };

  const handleDragEnd = (event: PointerEvent<HTMLDivElement>) => {
    dragStateRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  useEffect(() => {
    if (!isEditing) {
      setDraftSections(effectiveSections);
    }
  }, [effectiveSections, isEditing]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const handleOutsidePointerDown = (event: globalThis.PointerEvent) => {
      if (cardRef.current?.contains(event.target as Node)) {
        return;
      }

      saveEdits();
    };

    document.addEventListener('pointerdown', handleOutsidePointerDown, true);

    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerDown, true);
    };
  }, [isEditing, saveEdits]);

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-label={`需求${displayNumber ?? requirement.id} ${requirement.title}`}
      className="fixed flex resize flex-col overflow-hidden rounded-lg border border-emerald-200 bg-white text-left text-xs text-gray-700 shadow-2xl"
      style={{
        left: position.left,
        top: position.top,
        width: placement.width,
        height: placement.height,
        minWidth: placement.minWidth,
        minHeight: placement.minHeight,
        maxWidth: placement.maxWidth,
        maxHeight: placement.maxHeight,
        zIndex: 2147483647,
      }}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerMove={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onPointerCancel={(event) => event.stopPropagation()}
      onDoubleClick={(event) => {
        event.stopPropagation();
        if (!isEditing) {
          enterEditMode();
        }
      }}
    >
      <div
        className={`flex touch-none select-none items-start justify-between gap-3 border-b border-gray-100 p-3 pb-2 ${
          isEditing ? 'cursor-default bg-emerald-50/60' : 'cursor-move'
        }`}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-emerald-700">
              {displayNumber ? `需求 ${displayNumber} · ${requirement.id}` : requirement.id}
            </span>
            {requirement.changeDate && (
              <span className="text-[10px] font-medium text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
                【{requirement.changeDate}】
              </span>
            )}
          </div>
          <div className="mt-0.5 text-sm font-semibold text-gray-900">{requirement.title}</div>
        </div>
        {isEditing && (
          <Pencil
            aria-label="需求面板正在编辑"
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
          />
        )}
        <button
          type="button"
          aria-label="关闭业务逻辑说明"
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            if (isEditing) {
              saveEdits();
            }
            onClose();
          }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <ol className="space-y-3">
          {(isEditing ? draftSections : effectiveSections).map((section, sectionIndex) => (
            <li key={section.id} className="flex gap-2">
              <span className="mt-0.5 text-[11px] font-semibold text-emerald-700">
                {sectionIndex + 1}、
              </span>
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <>
                    <div className="px-0.5 text-xs font-bold text-gray-900">{section.title}</div>
                    <ol className="mt-2 space-y-2">
                      {section.items.map((item, itemIndex) => (
                        <li key={`${section.id}:${itemIndex}`} className="group flex items-start gap-1.5">
                          <span className="mt-1 shrink-0 text-[11px] font-semibold text-emerald-700">
                            {itemIndex + 1}、
                          </span>
                          <textarea
                            aria-label={`${section.title}第 ${itemIndex + 1} 条描述`}
                            className="max-h-32 min-h-16 flex-1 resize-none overflow-y-auto rounded-md border border-transparent bg-gray-50 px-2.5 py-2 text-xs leading-5 text-gray-700 outline-none transition-colors [scrollbar-width:none] placeholder:text-gray-300 hover:border-gray-200 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 [&::-webkit-scrollbar]:hidden"
                            style={{ msOverflowStyle: 'none' }}
                            rows={Math.max(2, item.split('\n').length)}
                            value={item}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              setDraftSections((current) =>
                                current.map((currentSection) =>
                                  currentSection.id === section.id
                                    ? {
                                        ...currentSection,
                                        items: currentSection.items.map((currentItem, currentIndex) =>
                                          currentIndex === itemIndex ? nextValue : currentItem,
                                        ),
                                      }
                                    : currentSection,
                                ),
                              );
                            }}
                            onKeyDown={(event) => event.stopPropagation()}
                          />
                          <button
                            type="button"
                            title="删除这条描述"
                            aria-label={`删除${section.title}第 ${itemIndex + 1} 条描述`}
                            className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-base leading-none text-gray-300 opacity-70 transition-colors hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDraftSections((current) =>
                                current
                                  .map((currentSection) =>
                                    currentSection.id === section.id
                                      ? {
                                          ...currentSection,
                                          items: currentSection.items.filter(
                                            (_, currentIndex) => currentIndex !== itemIndex,
                                          ),
                                        }
                                      : currentSection,
                                  )
                                  .filter((currentSection) => currentSection.items.length > 0),
                              );
                            }}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ol>
                  </>
                ) : (
                  <>
                    <div className="font-bold text-gray-900">{section.title}</div>
                    <SectionValue value={section.items} />
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="pointer-events-none absolute bottom-1 right-1 h-3 w-3 border-b-2 border-r-2 border-emerald-300" />
    </div>
  );
}
