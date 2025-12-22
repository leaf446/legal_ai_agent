'use client';

/**
 * Case Detail Page - App Router Version
 */

import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Filter,
  Shield,
  Sparkles,
  Loader2,
  FileUp,
  Activity,
  UserPlus,
  Wallet,
  Scale,
  FileText,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import EvidenceUpload from '@/components/evidence/EvidenceUpload';
import EvidenceTable from '@/components/evidence/EvidenceTable';
import { Evidence } from '@/types/evidence';
import DraftPreviewPanel from '@/components/draft/DraftPreviewPanel';
import DraftGenerationModal from '@/components/draft/DraftGenerationModal';
import { DraftCitation } from '@/types/draft';
import { downloadDraftAsDocx, DraftDownloadFormat } from '@/services/documentService';
import {
  getPresignedUploadUrl,
  uploadToS3,
  notifyUploadComplete,
  UploadProgress
} from '@/lib/api/evidence';

const MOCK_EVIDENCE: Evidence[] = [
  {
    id: '1',
    caseId: '1',
    filename: '녹취록_20240501.mp3',
    type: 'audio',
    status: 'completed',
    uploadDate: '2024-05-01T10:00:00Z',
    summary: '피고의 폭언이 담긴 통화 녹음',
    size: 15 * 1024 * 1024,
  },
  {
    id: '2',
    caseId: '1',
    filename: '카카오톡_대화내역.txt',
    type: 'text',
    status: 'processing',
    uploadDate: '2024-05-02T09:30:00Z',
    size: 50 * 1024,
  },
  {
    id: '3',
    caseId: '1',
    filename: '폭행_상해_진단서.pdf',
    type: 'pdf',
    status: 'queued',
    uploadDate: '2024-05-03T14:20:00Z',
    size: 2 * 1024 * 1024,
  },
];

const INITIAL_DRAFT_CONTENT = `Ⅰ. 핵심 주장 요약
- 피고의 반복적인 언어적 폭력과 경제적 통제 사실이 다수의 증거에서 확인됩니다.
- 원고는 자녀 양육과 생활비 부담을 대부분 담당해왔습니다.

Ⅱ. 사실관계
1. 폭언 및 협박 (녹취록_20240501.mp3)
  - 피고의 '너를 사회적으로 매장하겠다'는 발언 기록
2. 자녀 돌봄 소홀 (카카오톡_대화내역.txt)
  - 자녀 학업 행사 불참을 인정하는 메시지

Ⅲ. 청구 취지
- 위자료 7천만 원
- 자녀 친권 및 양육권 원고 단독
`;

const INITIAL_CITATIONS: DraftCitation[] = [
  {
    evidenceId: '1',
    title: '녹취록_20240501.mp3',
    quote: '피고가 반복적으로 위협적인 발언을 한 사실이 확인됩니다.',
  },
  {
    evidenceId: '2',
    title: '카카오톡_대화내역.txt',
    quote: '자녀 돌봄을 회피한 메시지가 명시되어 있습니다.',
  },
];

const GENERATION_DELAY_MS = 1200;
type CaseDetailTab = 'evidence' | 'timeline' | 'persons' | 'property' | 'analysis' | 'draft' | 'consultation';
type UploadFeedback = { message: string; tone: 'info' | 'success' | 'error' };
type UploadStatus = {
  isUploading: boolean;
  currentFile: string;
  progress: number;
  completed: number;
  total: number;
};

export default function CaseDetailPage() {
  const params = useParams();
  const id = (params?.id as string) ?? '';

  const [evidenceList] = useState<Evidence[]>(MOCK_EVIDENCE);
  const [draftContent, setDraftContent] = useState(INITIAL_DRAFT_CONTENT);
  const [draftCitations, setDraftCitations] = useState<DraftCitation[]>(INITIAL_CITATIONS);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [hasGeneratedDraft, setHasGeneratedDraft] = useState(true);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CaseDetailTab>('evidence');
  const [uploadFeedback, setUploadFeedback] = useState<UploadFeedback | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    isUploading: false,
    currentFile: '',
    progress: 0,
    completed: 0,
    total: 0,
  });

  const caseId = id || '';

  const handleUpload = useCallback(async (files: File[]) => {
    if (files.length === 0 || !caseId) return;

    setUploadStatus({
      isUploading: true,
      currentFile: files[0].name,
      progress: 0,
      completed: 0,
      total: files.length,
    });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      setUploadStatus(prev => ({
        ...prev,
        currentFile: file.name,
        progress: 0,
      }));

      try {
        const presignedResult = await getPresignedUploadUrl(
          caseId,
          file.name,
          file.type || 'application/octet-stream'
        );

        if (presignedResult.error || !presignedResult.data) {
          throw new Error(presignedResult.error || 'Failed to get presigned URL');
        }

        const { upload_url, evidence_temp_id, s3_key } = presignedResult.data;

        const uploadSuccess = await uploadToS3(
          upload_url,
          file,
          (progress: UploadProgress) => {
            setUploadStatus(prev => ({
              ...prev,
              progress: progress.percent,
            }));
          }
        );

        if (!uploadSuccess) {
          throw new Error('S3 upload failed');
        }

        const completeResult = await notifyUploadComplete({
          case_id: caseId,
          evidence_temp_id,
          s3_key,
        });

        if (completeResult.error) {
          throw new Error(completeResult.error || 'Failed to complete upload');
        }

        successCount++;
      } catch {
        failCount++;
      }

      setUploadStatus(prev => ({
        ...prev,
        completed: i + 1,
      }));
    }

    setUploadStatus(prev => ({ ...prev, isUploading: false }));

    if (failCount === 0) {
      setUploadFeedback({
        tone: 'success',
        message: `${successCount}개 파일 업로드 완료. AI가 증거를 분석 중입니다.`,
      });
    } else if (successCount > 0) {
      setUploadFeedback({
        tone: 'info',
        message: `${successCount}개 성공, ${failCount}개 실패. 실패한 파일을 다시 업로드해주세요.`,
      });
    } else {
      setUploadFeedback({
        tone: 'error',
        message: `업로드 실패. 네트워크를 확인하고 다시 시도해주세요.`,
      });
    }

    setTimeout(() => setUploadFeedback(null), 5000);
  }, [caseId]);

  const openDraftModal = () => {
    setIsDraftModalOpen(true);
  };

  const handleGenerateDraft = (selectedEvidenceIds: string[]) => {
    setIsDraftModalOpen(false);
    if (isGeneratingDraft) return;

    setIsGeneratingDraft(true);
    setTimeout(() => {
      setDraftContent((prev) =>
        prev.includes('업데이트')
          ? INITIAL_DRAFT_CONTENT
          : `${prev}\n\n※ ${new Date().toLocaleString('ko-KR')} 업데이트: 선택된 ${selectedEvidenceIds.length}건의 증거를 기반으로 핵심 주장이 재정리되었습니다.`,
      );
      setDraftCitations((prev) =>
        prev.length > 2
          ? INITIAL_CITATIONS
          : [
              ...prev,
              {
                evidenceId: '3',
                title: '폭행_상해_진단서.pdf',
                quote: '의료 기록상 상해 사실이 확인됩니다.',
              },
            ],
      );
      setHasGeneratedDraft(true);
      setIsGeneratingDraft(false);
    }, GENERATION_DELAY_MS);
  };

  const handleDownload = async (format: DraftDownloadFormat = 'docx') => {
    if (!id) return;
    await downloadDraftAsDocx(draftContent, id, format);
  };

  const tabItems: { id: CaseDetailTab; label: string; description: string; icon: React.ReactNode; category: string }[] = useMemo(
    () => [
      { id: 'evidence', label: '증거 자료', description: '업로드 · 상태 · 요약', icon: <FileUp className="w-4 h-4" />, category: 'Input' },
      { id: 'timeline', label: '타임라인', description: '사건 맥락 · 흐름', icon: <Activity className="w-4 h-4" />, category: 'Context' },
      { id: 'persons', label: '인물 관계', description: '관련자 정보 정리', icon: <UserPlus className="w-4 h-4" />, category: 'Context' },
      { id: 'property', label: '재산분할', description: '재산 목록 · 분석', icon: <Wallet className="w-4 h-4" />, category: 'Context' },
      { id: 'analysis', label: '법률 분석', description: 'AI 기반 법률 검토', icon: <Scale className="w-4 h-4" />, category: 'Process' },
      { id: 'draft', label: '초안 생성', description: 'AI 초안 검토/다운로드', icon: <FileText className="w-4 h-4" />, category: 'Output' },
      { id: 'consultation', label: '상담 내역', description: '의뢰인 소통 기록', icon: <MessageSquare className="w-4 h-4" />, category: 'Communication' },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/cases" className="mr-4 text-gray-500 hover:text-gray-800 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-secondary">김철수 이혼 소송</h1>
              <p className="text-xs text-gray-500">Case ID: {id}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={openDraftModal}
              className="btn-primary bg-deep-trust-blue hover:bg-slate-700"
            >
              Draft 작성
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">의뢰인</p>
            <p className="text-base font-semibold text-gray-900">김철수</p>
            <p className="text-xs text-gray-500">최근 업데이트: {new Date().toLocaleDateString('ko-KR')}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">증거 현황</p>
            <p className="text-base font-semibold text-gray-900">{evidenceList.length}건 처리 중</p>
            <p className="text-xs text-gray-500">AI 분석 상태는 실시간으로 반영됩니다.</p>
          </div>
          <div className="flex items-center space-x-2 bg-neutral-50 rounded-xl px-4 py-3">
            <Shield className="w-5 h-5 text-secondary" />
            <div>
              <p className="text-sm font-semibold text-gray-800">모든 데이터는 암호화되어 저장됩니다.</p>
              <p className="text-xs text-gray-500">Calm Control · Sage & Caregiver</p>
            </div>
          </div>
        </section>

        <nav role="tablist" aria-label="Case detail tabs" className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm sticky top-[72px] z-10">
          <div className="flex flex-wrap gap-2">
            {tabItems.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-accent text-white shadow-md'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-gray-400'}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {activeTab === 'evidence' && (
          <div className="space-y-6" role="tabpanel" aria-label="증거 탭">
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">증거 업로드</h2>
                  <p className="text-sm text-gray-500">파일을 드래그하거나 클릭하여 업로드할 수 있습니다.</p>
                </div>
                <span className="text-xs text-gray-500 flex items-center">
                  <Sparkles className="w-4 h-4 text-accent mr-1" /> Whisper · OCR 자동 적용
                </span>
              </div>
              <EvidenceUpload onUpload={handleUpload} disabled={uploadStatus.isUploading} />
              {uploadStatus.isUploading && (
                <div
                  role="status"
                  aria-live="polite"
                  className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-blue-800 font-medium">
                      업로드 중 ({uploadStatus.completed + 1}/{uploadStatus.total})
                    </span>
                  </div>
                  <p className="text-blue-700 text-xs mb-2 truncate">{uploadStatus.currentFile}</p>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadStatus.progress}%` }}
                    />
                  </div>
                </div>
              )}
              {uploadFeedback && !uploadStatus.isUploading && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`flex items-start space-x-2 rounded-lg px-4 py-3 text-sm ${
                    uploadFeedback.tone === 'success'
                      ? 'bg-accent/10 text-secondary'
                      : uploadFeedback.tone === 'error'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-gray-100 text-neutral-700'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 mt-0.5 ${
                    uploadFeedback.tone === 'error' ? 'text-red-500' : 'text-accent'
                  }`} />
                  <p>{uploadFeedback.message}</p>
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    증거 목록 <span className="text-gray-500 text-sm font-normal">({evidenceList.length})</span>
                  </h2>
                  <p className="text-xs text-gray-500">상태 컬럼을 통해 AI 분석 파이프라인의 진행 상황을 확인하세요.</p>
                </div>
                <button className="flex items-center text-sm text-neutral-600 hover:text-gray-900 bg-white border border-gray-300 px-3 py-1.5 rounded-md shadow-sm">
                  <Filter className="w-4 h-4 mr-2" />
                  뷰 필터
                </button>
              </div>
              <EvidenceTable items={evidenceList} />
            </section>
          </div>
        )}

        {activeTab === 'persons' && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4" role="tabpanel" aria-label="인물 관계 탭">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-gray-900">인물 관계</h2>
            </div>
            <p className="text-sm text-gray-500">
              사건에 관련된 인물들의 정보와 관계를 정리합니다. 당사자, 증인, 참고인 등을 등록하고 관계도를 확인하세요.
            </p>
            <div className="bg-neutral-50 rounded-xl p-4 text-sm text-neutral-600">
              곧 제공될 기능: 인물 카드 추가, 관계도 시각화, AI 기반 인물 분석
            </div>
          </section>
        )}

        {activeTab === 'property' && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4" role="tabpanel" aria-label="재산분할 탭">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-gray-900">재산분할</h2>
            </div>
            <p className="text-sm text-gray-500">
              부부 공동재산 및 특유재산을 정리하고 분할 비율을 계산합니다. 부동산, 금융자산, 퇴직금 등을 등록하세요.
            </p>
            <div className="bg-neutral-50 rounded-xl p-4 text-sm text-neutral-600">
              곧 제공될 기능: 재산 목록 관리, 기여도 분석, 분할 시뮬레이션
            </div>
          </section>
        )}

        {activeTab === 'analysis' && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4" role="tabpanel" aria-label="법률 분석 탭">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-gray-900">법률 분석</h2>
            </div>
            <p className="text-sm text-gray-500">
              AI가 증거와 사건 정보를 바탕으로 관련 판례와 법률을 분석합니다. 승소 가능성과 전략을 검토하세요.
            </p>
            <div className="bg-neutral-50 rounded-xl p-4 text-sm text-neutral-600">
              곧 제공될 기능: 관련 판례 검색, 승소율 예측, 법률 조항 매핑, 전략 제안
            </div>
          </section>
        )}

        {activeTab === 'timeline' && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4" role="tabpanel" aria-label="타임라인 탭">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-gray-900">사건 타임라인</h2>
            </div>
            <p className="text-sm text-gray-500">AI가 추출한 주요 사건들을 시간순으로 정리합니다. 증거 탭에서 AI 요약이 쌓일수록 타임라인의 정확도가 향상됩니다.</p>
            <ul className="space-y-3">
              {evidenceList.map((item) => (
                <li key={item.id} className="flex items-start space-x-3 border-l-2 border-accent pl-3">
                  <div className="text-xs text-gray-400">{new Date(item.uploadDate).toLocaleDateString()}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.filename}</p>
                    <p className="text-xs text-gray-500">{item.summary ? item.summary : '요약이 곧 제공됩니다. 증거를 검토 중입니다.'}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {activeTab === 'draft' && (
          <section className="space-y-4" role="tabpanel" aria-label="Draft 탭">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">이 문서는 AI가 생성한 초안이며, 최종 법적 책임은 검토한 변호사에게 있습니다.</p>
                  <p className="text-xs text-gray-500">중요한 문장은 증거 탭에서 원본을 다시 확인하고, 필요한 경우 직접 수정하세요.</p>
                </div>
              </div>
            </div>
            <DraftPreviewPanel
              draftText={draftContent}
              citations={draftCitations}
              isGenerating={isGeneratingDraft}
              hasExistingDraft={hasGeneratedDraft}
              onGenerate={openDraftModal}
              onDownload={handleDownload}
            />
          </section>
        )}

        {activeTab === 'consultation' && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4" role="tabpanel" aria-label="상담 내역 탭">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-gray-900">상담 내역</h2>
            </div>
            <p className="text-sm text-gray-500">
              의뢰인과의 상담 기록을 관리합니다. 전화, 대면, 메시지 상담 내역을 시간순으로 정리하세요.
            </p>
            <div className="bg-neutral-50 rounded-xl p-4 text-sm text-neutral-600">
              곧 제공될 기능: 상담 기록 추가, 음성 녹음 연동, 요약 자동 생성
            </div>
          </section>
        )}
      </main>

      <DraftGenerationModal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        onGenerate={handleGenerateDraft}
        evidenceList={evidenceList}
      />
    </div>
  );
}
