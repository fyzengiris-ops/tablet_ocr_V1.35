import { TabletAiEntryPreview } from './tablet-ai-entry-preview';
import { RequirementReaderShell } from '@/components/prd/RequirementReaderShell';
import {
  questionAnswerReviewStepRegistry,
  tabletQuestionContentSelectionPageRegistry,
} from '@/requirements';

export default function TabletAiEntryPage() {
  return (
    <RequirementReaderShell
      registries={[
        tabletQuestionContentSelectionPageRegistry,
        questionAnswerReviewStepRegistry,
      ]}
    >
      <TabletAiEntryPreview />
    </RequirementReaderShell>
  );
}
