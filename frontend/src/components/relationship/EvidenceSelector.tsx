'use client';

import { useEffect, useState, useCallback } from 'react';
import { FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getEvidence, Evidence, getEvidenceDetail, EvidenceDetail } from '@/lib/api/evidence';

interface EvidenceSelectorProps {
  caseId: string;
  onSelectionChange: (selectedIds: string[], combinedText: string) => void;
  disabled?: boolean;
}

export default function EvidenceSelector({
  caseId,
  onSelectionChange,
  disabled = false
}: EvidenceSelectorProps) {
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  // 증거 목록 로드
  useEffect(() => {
    async function fetchEvidences() {
      setLoading(true);
      setError(null);

      try {
        const response = await getEvidence(caseId);
        if (response.data?.evidence) {
          setEvidences(response.data.evidence);
        } else if (response.error) {
          setError(response.error);
        }
      } catch (err) {
        console.error('Failed to fetch evidences:', err);
        setError('증거 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchEvidences();
  }, [caseId]);

  // 선택된 증거의 content 로드 및 합치기
  const loadSelectedContents = useCallback(async (selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      onSelectionChange([], '');
      return;
    }

    setLoadingContent(true);

    try {
      // 각 증거의 상세 정보(content 포함) 로드
      const detailPromises = selectedIds.map(id => getEvidenceDetail(id));
      const results = await Promise.all(detailPromises);

      // content 합치기
      const combinedText = results
        .filter(r => r.data?.content)
        .map(r => {
          const ev = r.data as EvidenceDetail;
          return `[${ev.filename}]\n${ev.content}`;
        })
        .join('\n\n---\n\n');

      onSelectionChange(selectedIds, combinedText);
    } catch (err) {
      console.error('Failed to load evidence contents:', err);
      setError('증거 내용을 불러오는데 실패했습니다.');
    } finally {
      setLoadingContent(false);
    }
  }, [onSelectionChange]);

  const handleToggle = (id: string) => {
    if (disabled || loadingContent) return;

    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);

    // 선택 변경 시 content 로드
    loadSelectedContents(Array.from(newSelected));
  };

  const handleSelectAll = () => {
    if (disabled || loadingContent) return;

    if (selected.size === evidences.length) {
      // 전체 해제
      setSelected(new Set());
      onSelectionChange([], '');
    } else {
      // 전체 선택
      const allIds = evidences.map(e => e.id);
      setSelected(new Set(allIds));
      loadSelectedContents(allIds);
    }
  };

  const getTypeIcon = (type: Evidence['type']) => {
    switch (type) {
      case 'audio':
        return '🎵';
      case 'video':
        return '🎬';
      case 'image':
        return '🖼️';
      case 'pdf':
        return '📄';
      default:
        return '📝';
    }
  };

  const getTypeLabel = (type: Evidence['type']) => {
    switch (type) {
      case 'audio':
        return '음성';
      case 'video':
        return '영상';
      case 'image':
        return '이미지';
      case 'pdf':
        return 'PDF';
      case 'text':
        return '텍스트';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="border border-neutral-200 rounded-lg p-6 bg-white">
        <div className="flex items-center justify-center text-neutral-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span>증거 목록 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-error-200 bg-error-light rounded-lg p-6">
        <div className="flex items-center text-error">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          분석할 증거 선택
        </h3>
        {evidences.length > 0 && (
          <button
            onClick={handleSelectAll}
            disabled={disabled || loadingContent}
            className="text-xs text-primary hover:text-primary-hover font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selected.size === evidences.length ? '전체 해제' : '전체 선택'}
          </button>
        )}
      </div>

      {/* Evidence List */}
      <div className="p-4">
        {evidences.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>등록된 증거가 없습니다</p>
            <p className="text-xs mt-1">증거를 먼저 업로드해 주세요</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {evidences.map(ev => (
              <label
                key={ev.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg cursor-pointer
                  transition-colors border
                  ${selected.has(ev.id)
                    ? 'bg-primary-light border-primary-200'
                    : 'bg-white border-neutral-200 hover:bg-neutral-50'}
                  ${(disabled || loadingContent) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <input
                  type="checkbox"
                  checked={selected.has(ev.id)}
                  onChange={() => handleToggle(ev.id)}
                  disabled={disabled || loadingContent}
                  className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary"
                />
                <span className="text-lg">{getTypeIcon(ev.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {ev.filename}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {getTypeLabel(ev.type)} • {ev.status === 'processed' ? '분석 완료' : ev.status}
                  </p>
                </div>
                {selected.has(ev.id) && (
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-neutral-50 border-t border-neutral-200 px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-neutral-500">
          {selected.size}개 선택됨 / 총 {evidences.length}개
        </span>
        {loadingContent && (
          <span className="text-xs text-primary flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            내용 로딩 중...
          </span>
        )}
      </div>
    </div>
  );
}
