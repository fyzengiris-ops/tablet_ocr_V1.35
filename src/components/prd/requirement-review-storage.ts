'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  persistedRequirementReviewOverrides,
  type PersistedRequirementReviewOverride,
} from '@/requirements/review-overrides';

export interface EditableRequirementSection {
  id: string;
  title: string;
  items: string[];
}

export interface RequirementMarkerOffset {
  x: number;
  y: number;
}

export interface RequirementReviewOverride {
  displayNumber?: number;
  markerOffset?: RequirementMarkerOffset;
  sections?: EditableRequirementSection[];
  sectionsSourceSignature?: string;
}

export interface RequirementDisplayNumberScopeItem {
  requirementId: string;
  displayNumber?: number;
}

interface RequirementReviewStore {
  version: 1;
  requirements: Record<string, RequirementReviewOverride>;
}

const STORAGE_KEY = 'homework-ocr:requirement-review:v1';
const CHANGE_EVENT = 'requirement-review-change';

function toRequirementReviewOverride(
  override: PersistedRequirementReviewOverride,
): RequirementReviewOverride {
  return {
    displayNumber: override.displayNumber,
    markerOffset: override.markerOffset,
    sections: override.sections
      ? override.sections.map((section) => ({
          id: section.id,
          title: section.title,
          items: [...section.items],
        }))
      : undefined,
  };
}

function readPersistedStore(): RequirementReviewStore {
  return {
    version: 1,
    requirements: Object.fromEntries(
      Object.entries(persistedRequirementReviewOverrides).map(([requirementId, override]) => [
        requirementId,
        toRequirementReviewOverride(override),
      ]),
    ),
  };
}

function readStore(): RequirementReviewStore {
  const persistedStore = readPersistedStore();

  if (typeof window === 'undefined') {
    return persistedStore;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return persistedStore;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<RequirementReviewStore>;

    return {
      version: 1,
      requirements: {
        ...persistedStore.requirements,
        ...(parsedValue.requirements ?? {}),
      },
    };
  } catch {
    return persistedStore;
  }
}

function writeRequirementOverride(
  requirementId: string,
  patch: Partial<RequirementReviewOverride>,
) {
  const store = readStore();
  const nextOverride = {
    ...store.requirements[requirementId],
    ...patch,
  };
  const nextStore: RequirementReviewStore = {
    version: 1,
    requirements: {
      ...store.requirements,
      [requirementId]: nextOverride,
    },
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStore));
    window.dispatchEvent(
      new CustomEvent(CHANGE_EVENT, {
        detail: { requirementId },
      }),
    );
  } catch {
    // 浏览器禁用本地存储时，当前页面仍可继续编辑。
  }

  return nextOverride;
}

function getScopedDisplayNumber(
  scopeItem: RequirementDisplayNumberScopeItem,
  reviewOverride: RequirementReviewOverride | undefined,
  fallbackDisplayNumber: number,
) {
  return reviewOverride?.displayNumber ?? scopeItem.displayNumber ?? fallbackDisplayNumber;
}

export function moveRequirementDisplayNumber(
  requirementId: string,
  nextDisplayNumber: number,
  displayNumberScope?: RequirementDisplayNumberScopeItem[],
) {
  if (typeof window === 'undefined') {
    return;
  }

  const targetNumber = Math.floor(nextDisplayNumber);

  if (!Number.isFinite(targetNumber) || targetNumber <= 0) {
    return;
  }

  const store = readStore();
  const uniqueScope = (displayNumberScope ?? [{ requirementId }]).filter(
    (scopeItem, index, scopeItems) =>
      scopeItem.requirementId &&
      scopeItems.findIndex((item) => item.requirementId === scopeItem.requirementId) === index,
  );

  if (!uniqueScope.some((scopeItem) => scopeItem.requirementId === requirementId)) {
    uniqueScope.push({ requirementId });
  }

  const orderedScope = uniqueScope
    .map((scopeItem, index) => ({
      requirementId: scopeItem.requirementId,
      currentDisplayNumber: getScopedDisplayNumber(
        scopeItem,
        store.requirements[scopeItem.requirementId],
        index + 1,
      ),
      originalIndex: index,
    }))
    .sort((firstItem, secondItem) => {
      if (firstItem.currentDisplayNumber !== secondItem.currentDisplayNumber) {
        return firstItem.currentDisplayNumber - secondItem.currentDisplayNumber;
      }

      return firstItem.originalIndex - secondItem.originalIndex;
    });
  const fromIndex = orderedScope.findIndex((scopeItem) => scopeItem.requirementId === requirementId);

  if (fromIndex < 0) {
    return;
  }

  const toIndex = Math.min(targetNumber, orderedScope.length) - 1;
  const nextOrderedScope = [...orderedScope];
  const [movedScopeItem] = nextOrderedScope.splice(fromIndex, 1);
  nextOrderedScope.splice(toIndex, 0, movedScopeItem);

  const nextRequirements = { ...store.requirements };
  nextOrderedScope.forEach((scopeItem, index) => {
    nextRequirements[scopeItem.requirementId] = {
      ...nextRequirements[scopeItem.requirementId],
      displayNumber: index + 1,
    };
  });

  const nextStore: RequirementReviewStore = {
    version: 1,
    requirements: nextRequirements,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStore));
    window.dispatchEvent(
      new CustomEvent(CHANGE_EVENT, {
        detail: { requirementId: null },
      }),
    );
  } catch {
    // 浏览器禁用本地存储时，当前页面仍可继续编辑。
  }
}

export function useRequirementReviewOverride(requirementId: string) {
  const [reviewOverride, setReviewOverride] = useState<RequirementReviewOverride>({});

  useEffect(() => {
    const reloadOverride = () => {
      setReviewOverride(readStore().requirements[requirementId] ?? {});
    };
    const handleCustomChange = (event: Event) => {
      const changedRequirementId = (event as CustomEvent<{ requirementId?: string }>).detail
        ?.requirementId;

      if (!changedRequirementId || changedRequirementId === requirementId) {
        reloadOverride();
      }
    };

    reloadOverride();
    window.addEventListener('storage', reloadOverride);
    window.addEventListener(CHANGE_EVENT, handleCustomChange);

    return () => {
      window.removeEventListener('storage', reloadOverride);
      window.removeEventListener(CHANGE_EVENT, handleCustomChange);
    };
  }, [requirementId]);

  const updateReviewOverride = useCallback(
    (patch: Partial<RequirementReviewOverride>) => {
      const nextOverride = writeRequirementOverride(requirementId, patch);
      setReviewOverride(nextOverride);
    },
    [requirementId],
  );

  return { reviewOverride, updateReviewOverride };
}

export function useRequirementReviewOverrides() {
  const [reviewOverrides, setReviewOverrides] = useState<Record<string, RequirementReviewOverride>>({});

  useEffect(() => {
    const reloadOverrides = () => {
      setReviewOverrides(readStore().requirements);
    };

    reloadOverrides();
    window.addEventListener('storage', reloadOverrides);
    window.addEventListener(CHANGE_EVENT, reloadOverrides);

    return () => {
      window.removeEventListener('storage', reloadOverrides);
      window.removeEventListener(CHANGE_EVENT, reloadOverrides);
    };
  }, []);

  return reviewOverrides;
}
