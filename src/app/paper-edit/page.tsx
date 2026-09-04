'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlignLeft,
  Bell,
  Bot,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  Clock3,
  FileText,
  List,
  Minus,
  Plus,
  Redo2,
  SendHorizonal,
  Sparkles,
  Undo2,
  Volume2,
  X,
} from 'lucide-react';
import { MathText } from '@/lib/math-render';

interface PaperQuestion {
  id: string;
  number: number | string;
  questionType: string;
  content: string;
  answer: string;
  analysis: string;
  knowledgePoints?: string[];
  difficulty?: string;
  croppedImageData?: string;
  originalCroppedImageData?: string;
  optionCount?: number;
  optionContents?: Record<string, string>;
  blankCount?: number;
  blankAnswers?: string[];
  subQuestions?: {
    id: string;
    number?: number | string;
    questionType?: string;
    content?: string;
    answer?: string;
    analysis?: string;
    optionCount?: number;
    optionContents?: Record<string, string>;
    blankCount?: number;
    blankAnswers?: string[];
  }[];
}

interface PageImageData {
  data: string;
  fileName: string;
  sourceFileIndex: number;
  pageNumber: number;
}

interface PaperEditData {
  joinPaperMode?: 'by_type' | 'by_order';
  pageImages: PageImageData[];
  questions: PaperQuestion[];
  subjectInfo: string;
}

const subjectOptions = [
  '小学语文',
  '初中语文',
  '初中数学',
  '初中英语',
  '初中物理',
  '初中化学',
  '初中生物',
  '初中道德与法治',
  '初中历史',
  '初中历史与社会',
  '高中语文',
  '高中数学',
  '高中英语',
  '高中物理',
];

function normalizeQuestions(data: PaperEditData | null) {
  return (data?.questions || []).map((question, index) => {
    const mainNumber = index + 1;
    return {
      ...question,
      number: mainNumber,
      knowledgePoints: question.knowledgePoints || [],
      difficulty: question.difficulty || '容易',
      blankAnswers: question.blankAnswers || [],
      subQuestions: question.subQuestions?.map((subQuestion, subIndex) => ({
        ...subQuestion,
        number: `${mainNumber}.${subIndex + 1}`,
        blankAnswers: subQuestion.blankAnswers || [],
      })),
    };
  });
}

function getQuestionAnswer(question: PaperQuestion) {
  if (question.blankAnswers?.some(Boolean)) {
    return question.blankAnswers.map((item, index) => `空${index + 1}：${item || '请输入'}`).join('；');
  }
  return question.answer || '';
}

function QuestionBlock({ question }: { question: PaperQuestion }) {
  const answer = getQuestionAnswer(question);

  return (
    <article className="relative py-[18px] pl-[80px] pr-[34px] text-[19px] leading-[34px] text-[#2f3439]">
      <div className="absolute left-[26px] top-[18px] w-[34px] text-right font-semibold">
        {question.number}.
      </div>
      <div className="min-h-[34px]">
        <MathText text={question.content || '如有题干请在此输入'} />
      </div>

      {question.optionContents && Object.keys(question.optionContents).length > 0 ? (
        <div className="mt-[10px] space-y-[4px] pl-[24px]">
          {Object.entries(question.optionContents).map(([letter, content]) => (
            <div key={letter}>
              {letter}. {content}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-[10px] flex items-start gap-[8px]">
        <span className="shrink-0 font-semibold">【答案】</span>
        <span className={answer ? 'text-[#2f3439]' : 'text-[#a8adb2]'}>
          {answer || '如有答案请在此输入'}
        </span>
        <button className="ml-auto inline-flex h-[32px] items-center gap-[5px] rounded-[6px] bg-white px-[10px] text-[16px] text-[#3f454a] shadow-sm">
          <Sparkles className="h-[16px] w-[16px]" />
          AI解析
        </button>
      </div>

      <div className="mt-[8px] flex items-start gap-[8px]">
        <span className="shrink-0 font-semibold">【解析】</span>
        <span className={question.analysis ? 'text-[#2f3439]' : 'text-[#a8adb2]'}>
          {question.analysis || '如有解析请在此输入'}
        </span>
      </div>

      {question.subQuestions?.length ? (
        <div className="mt-[12px] space-y-[10px] rounded-[6px] bg-[#fafafa] px-[18px] py-[12px]">
          {question.subQuestions.map((subQuestion) => {
            const subAnswer = subQuestion.blankAnswers?.some(Boolean)
              ? subQuestion.blankAnswers.map((item, index) => `空${index + 1}：${item || '请输入'}`).join('；')
              : subQuestion.answer || '';

            return (
              <div key={subQuestion.id} className="rounded-[4px] bg-white px-[14px] py-[10px]">
                <div className="mb-[4px] text-[16px] text-[#6a7178]">
                  {subQuestion.number} {subQuestion.questionType || ''}
                </div>
                {subQuestion.content ? <MathText text={subQuestion.content} /> : null}
                <div className="mt-[4px] text-[17px]">
                  【答案】<span className={subAnswer ? 'text-[#2f3439]' : 'text-[#a8adb2]'}>{subAnswer || '请输入'}</span>
                </div>
                <div className="mt-[4px] text-[17px]">
                  【解析】<span className={subQuestion.analysis ? 'text-[#2f3439]' : 'text-[#a8adb2]'}>{subQuestion.analysis || '请输入'}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="mt-[10px] flex items-center gap-[9px] text-[18px]">
        <span className="font-semibold">【知识点】</span>
        <button className="flex h-[24px] w-[24px] items-center justify-center rounded-[3px] border border-[#c8cdd2] text-[#8a9198]">
          <Plus className="h-[17px] w-[17px]" />
        </button>
      </div>

      <div className="mt-[10px] flex items-center gap-[9px] text-[18px]">
        <span className="font-semibold">【难度】</span>
        <button className="flex h-[24px] w-[24px] items-center justify-center rounded-[4px] border border-[#c8cdd2] text-[#8a9198]">
          <ChevronDown className="h-[17px] w-[17px]" />
        </button>
        <button className="ml-auto inline-flex h-[32px] items-center gap-[5px] rounded-[6px] bg-white px-[10px] text-[16px] text-[#3f454a] shadow-sm">
          <Sparkles className="h-[16px] w-[16px]" />
          AI生成
        </button>
      </div>
    </article>
  );
}

function AiAssistantPanel() {
  return (
    <aside className="flex h-full w-[376px] shrink-0 flex-col bg-white px-[28px] pb-[18px] pt-[30px]">
      <div className="flex items-center justify-between">
        <div className="text-[30px] font-black italic tracking-[-1px] text-[#111]">AI小乐</div>
        <div className="flex items-center gap-[18px] text-[#25323b]">
          <CirclePlus className="h-[22px] w-[22px] text-[#48c7b9]" />
          <Clock3 className="h-[22px] w-[22px]" />
          <Minus className="h-[22px] w-[22px]" />
        </div>
      </div>

      <button className="ml-auto mt-[34px] flex h-[44px] items-center gap-[8px] rounded-[4px] bg-[#fbfbfb] px-[18px] text-[17px] text-[#52baa8] shadow-sm">
        全部展开
        <ChevronDown className="h-[18px] w-[18px]" />
      </button>

      <div className="mt-[26px] flex items-start gap-[14px]">
        <div className="mt-[3px] flex h-[28px] w-[28px] items-center justify-center rounded-[8px] bg-[#10b981] text-white">
          <Bot className="h-[18px] w-[18px]" />
        </div>
        <div className="text-[18px] leading-[28px] text-[#464d54]">
          请您确认下布置试卷作业的学段学科属性？
        </div>
      </div>

      <div className="mt-[18px] grid grid-cols-2 gap-[10px]">
        {subjectOptions.map((item) => (
          <button
            key={item}
            className="h-[40px] rounded-[3px] border border-[#edf0f2] bg-white text-[17px] text-[#3e444a] shadow-sm"
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-auto rounded-[8px] border border-[#dcdfe3] bg-white p-[10px] shadow-[0_2px_10px_rgba(20,30,40,0.08)]">
        <div className="flex items-center gap-[10px]">
          <div className="flex h-[28px] w-[28px] items-center justify-center rounded-full border border-[#7e8790]">
            <Volume2 className="h-[16px] w-[16px] text-[#606870]" />
          </div>
          <div className="flex-1 text-[16px] text-[#b3b8bd]">我能够帮您出题、布置作业，请把您</div>
        </div>
        <div className="mt-[10px] flex items-center gap-[8px]">
          <button className="rounded-[4px] border border-[#e5e8eb] bg-[#f8f8f8] px-[10px] py-[7px] text-[16px] text-[#333]">
            深度思考（R1）
          </button>
          <button className="ml-auto flex h-[32px] w-[32px] items-center justify-center rounded-full border border-[#111]">
            <Plus className="h-[20px] w-[20px]" />
          </button>
          <button className="flex h-[32px] w-[32px] items-center justify-center rounded-[5px] bg-[#22d366] text-white">
            <SendHorizonal className="h-[19px] w-[19px]" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function PaperEditPage() {
  const router = useRouter();
  const [paperData, setPaperData] = useState<PaperEditData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [returnPath, setReturnPath] = useState('/homework');

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('paperEditData');
      if (raw) {
        setPaperData(JSON.parse(raw) as PaperEditData);
      }
      setReturnPath(sessionStorage.getItem('tabletAiEntryReturnPath') || '/homework');
    } catch (error) {
      console.error('[paper-edit] sessionStorage 数据解析失败:', error);
    }
  }, []);

  const questions = useMemo(() => normalizeQuestions(paperData), [paperData]);
  const currentImage = paperData?.pageImages?.[currentPage - 1];
  const title = `${paperData?.subjectInfo || ''}试卷`.trim() || '试卷作业';

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#f3f5f6] text-[#202124]">
      <header className="flex h-[72px] shrink-0 items-center bg-[#5acb8f] px-[24px] text-white shadow-sm">
        <button
          className="flex h-[44px] items-center gap-[8px] rounded-[6px] pr-[14px] text-[22px] active:bg-white/10"
          onClick={() => router.push('/homework')}
          type="button"
        >
          <ChevronDown className="h-[28px] w-[28px] rotate-90 stroke-[2.4]" />
          返回
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[24px] font-medium">试卷作业</h1>
        <div className="ml-auto flex items-center gap-[10px] text-[15px]">
          <Bell className="h-[18px] w-[18px]" />
        </div>
      </header>

      <div className="flex h-[73px] shrink-0 items-center justify-between border-b border-[#eceff1] bg-white px-[16px]">
        <div className="flex items-center gap-[14px] text-[#c7cbd0]">
          <button className="flex h-[38px] w-[38px] items-center justify-center rounded-[4px] active:bg-[#f3f4f5]">
            <Undo2 className="h-[20px] w-[20px]" />
          </button>
          <button className="flex h-[38px] w-[38px] items-center justify-center rounded-[4px] active:bg-[#f3f4f5]">
            <Redo2 className="h-[20px] w-[20px]" />
          </button>
          <button className="text-[20px] font-semibold">B</button>
          <button className="text-[20px] underline">U</button>
          <List className="h-[21px] w-[21px]" />
          <AlignLeft className="h-[21px] w-[21px]" />
        </div>
        <div className="flex items-center gap-[12px]">
          <button className="inline-flex h-[34px] items-center gap-[6px] rounded-[5px] border border-[#d5d8dc] bg-white px-[16px] text-[16px] text-[#4f5963]">
            <Sparkles className="h-[16px] w-[16px]" />
            AI批量补充
          </button>
          <button className="inline-flex h-[34px] items-center gap-[6px] rounded-[5px] border border-[#d5d8dc] bg-white px-[16px] text-[16px] text-[#4f5963]">
            <FileText className="h-[16px] w-[16px]" />
            试卷结构
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col bg-white">
          <div className="mx-[16px] mt-[16px] flex h-[46px] items-center rounded-[4px] border border-[#f3d98d] bg-[#fff9e8] px-[12px] text-[15px] text-[#575f66]">
            <CheckCircle2 className="mr-[8px] h-[18px] w-[18px] text-[#f1b313]" />
            请老师审核已生成的内容，带AI标识的内容由AI生成，请您注意甄别。
            <button className="ml-auto text-[#b1a47e]">
              <X className="h-[17px] w-[17px]" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-[86px] pb-[96px] pt-[22px]">
            <div className="mx-auto max-w-[780px]">
              <div className="mb-[18px] text-right text-[14px] text-[#a5abb0]">最近保存 15:35</div>
              <h2 className="mb-[22px] text-center text-[24px] font-semibold">{title}</h2>

              {questions.length > 0 ? (
                <div className="divide-y divide-[#f0f1f2] bg-white">
                  {questions.map((question) => (
                    <QuestionBlock key={question.id} question={question} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[8px] border border-dashed border-[#d7dde3] py-[70px] text-center text-[16px] text-[#9aa2aa]">
                  请先在「识别作业资料」页面识别题目后点击「加入试卷」
                </div>
              )}

              <button className="mt-[12px] flex h-[38px] items-center gap-[10px] text-[18px] text-[#c1c5c9]">
                <Plus className="h-[20px] w-[20px]" />
                添加题目
              </button>
            </div>
          </div>

          <div className="absolute bottom-[18px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-[22px] rounded-[8px] bg-white px-[16px] py-[10px] shadow-[0_4px_18px_rgba(20,30,40,0.14)]">
            <button
              className="h-[40px] min-w-[90px] rounded-[5px] border border-[#d4d8dc] bg-white px-[18px] text-[17px] text-[#646b72]"
              onClick={() => router.push('/homework')}
              type="button"
            >
              取消
            </button>
            <button
              className="h-[40px] min-w-[110px] rounded-[5px] border border-[#5dcfbd] bg-white px-[18px] text-[17px] text-[#21bdb4]"
              onClick={() => router.push(returnPath)}
              type="button"
            >
              返回录题
            </button>
            <button className="h-[40px] min-w-[128px] rounded-[5px] border border-[#5dcfbd] bg-white px-[18px] text-[17px] text-[#21bdb4]">
              保存至资源库
            </button>
            <button className="h-[40px] min-w-[160px] rounded-[5px] bg-[#37cdb7] px-[18px] text-[17px] text-white">
              保存并添加至作业
            </button>
          </div>
        </section>

        <section className="hidden w-[176px] shrink-0 border-l border-[#e7eaed] bg-[#fafafa] p-[10px] xl:block">
          {currentImage ? (
            <div className="overflow-hidden rounded-[4px] border border-[#e2e6ea] bg-white">
              <img alt={`第${currentImage.pageNumber}页`} className="w-full object-contain" src={currentImage.data} />
            </div>
          ) : null}
          {paperData?.pageImages?.length ? (
            <div className="mt-[12px] flex items-center justify-center gap-[8px] text-[14px] text-[#737b83]">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                type="button"
              >
                上页
              </button>
              <span>{currentPage}/{paperData.pageImages.length}</span>
              <button
                disabled={currentPage >= paperData.pageImages.length}
                onClick={() => setCurrentPage((page) => Math.min(paperData.pageImages.length, page + 1))}
                type="button"
              >
                下页
              </button>
            </div>
          ) : null}
        </section>

        <AiAssistantPanel />
      </div>
    </main>
  );
}
