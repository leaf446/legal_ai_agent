'use client';

/**
 * Lawyer Cases Page
 * 케이스 관리 페이지 - lawyer 레이아웃 내에서 렌더링
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw, FileText, Search, Filter } from 'lucide-react';
import CaseCard from '@/components/cases/CaseCard';
import AddCaseModal from '@/components/cases/AddCaseModal';
import { Case } from '@/types/case';
import { getCases } from '@/lib/api/cases';
import { mapApiCaseToCase } from '@/lib/utils/caseMapper';

// Example mock cases for demonstration
const EXAMPLE_CASES: Case[] = [
  {
    id: 'example-1',
    title: '이혼 소송 예시 - 김OO vs 박OO',
    clientName: '김OO',
    status: 'open',
    evidenceCount: 12,
    draftStatus: 'ready',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'example-2',
    title: '협의이혼 예시 - 이OO vs 최OO',
    clientName: '이OO',
    status: 'open',
    evidenceCount: 5,
    draftStatus: 'generating',
    lastUpdated: new Date().toISOString(),
  },
];

type ErrorType = 'network' | 'server' | null;

export default function LawyerCasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch cases from API
  const fetchCases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setErrorType(null);

    try {
      const response = await getCases();
      if (response.error) {
        setError(response.error);
        setErrorType('server');
        setCases([]);
      } else if (response.data) {
        const mappedCases = response.data.cases.map(mapApiCaseToCase);
        setCases(mappedCases);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('Network')) {
        setError('네트워크 연결을 확인해주세요.');
        setErrorType('network');
      } else {
        setError('사건 목록을 불러오는데 실패했습니다.');
        setErrorType('server');
      }
      setCases([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Filter cases based on search query
  const filteredCases = cases.filter(
    (caseItem) =>
      caseItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            케이스 관리
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            진행 중인 사건을 관리하고 새 사건을 등록하세요.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-[var(--color-primary)] text-white font-medium rounded-lg shadow-sm hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          새 사건 등록
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            placeholder="사건명 또는 의뢰인 이름으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border-default)] rounded-lg bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
          />
        </div>
        <button className="flex items-center px-4 py-2.5 border border-[var(--color-border-default)] rounded-lg bg-white text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors">
          <Filter className="w-5 h-5 mr-2" />
          필터
        </button>
      </div>

      {/* Error State */}
      {error && errorType && (
        <div className="text-center py-10 bg-[var(--color-error-light)] rounded-lg border border-[var(--color-error)]/20">
          <p className="text-[var(--color-error)] text-lg font-medium mb-4">{error}</p>
          <button
            onClick={fetchCases}
            className="inline-flex items-center px-4 py-2 bg-[var(--color-error)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </button>
        </div>
      )}

      {/* Case Grid */}
      {!error && filteredCases.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((caseItem) => (
            <CaseCard key={caseItem.id} caseData={caseItem} onDelete={fetchCases} />
          ))}
        </div>
      )}

      {/* Empty State with Example Cases */}
      {!error && cases.length === 0 && (
        <div className="space-y-8">
          {/* Empty state message */}
          <div className="text-center py-10 bg-white rounded-xl border border-[var(--color-border-default)]">
            <FileText className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
            <p className="text-[var(--color-text-primary)] text-lg font-medium">등록된 사건이 없습니다.</p>
            <p className="text-[var(--color-text-secondary)] mt-2">새 사건 등록 버튼을 눌러 첫 사건을 추가해보세요.</p>
          </div>

          {/* Example Cases Section */}
          <div className="border-t border-[var(--color-border-default)] pt-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">예시 사건</span>
              <span className="text-xs bg-[var(--color-warning-light)] text-[var(--color-warning)] px-2 py-0.5 rounded">데모</span>
            </div>
            <p className="text-sm text-[var(--color-text-tertiary)] mb-4">
              아래는 LEH 플랫폼 사용 예시입니다. 실제 사건을 등록하면 이와 같이 표시됩니다.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
              {EXAMPLE_CASES.map((caseItem) => (
                <div key={caseItem.id} className="relative">
                  <div className="absolute -top-2 -right-2 z-10">
                    <span className="text-xs bg-[var(--color-warning-light)] text-[var(--color-warning)] px-2 py-0.5 rounded-full">
                      예시
                    </span>
                  </div>
                  <CaseCard caseData={caseItem} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Search Results */}
      {!error && cases.length > 0 && filteredCases.length === 0 && (
        <div className="text-center py-10 bg-white rounded-xl border border-[var(--color-border-default)]">
          <Search className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
          <p className="text-[var(--color-text-primary)] text-lg font-medium">검색 결과가 없습니다.</p>
          <p className="text-[var(--color-text-secondary)] mt-2">다른 검색어로 시도해보세요.</p>
        </div>
      )}

      {/* Add Case Modal */}
      <AddCaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCases}
      />
    </div>
  );
}
