'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  SimilarPrecedent,
  PrecedentSearchResult,
} from '@/types/precedent';
import { searchPrecedentsByCase, generateMockPrecedents } from '@/lib/api/precedent';
import PrecedentCard from './PrecedentCard';
import PrecedentStats from './PrecedentStats';
import PrecedentModal from './PrecedentModal';
import { BookOpen, RefreshCw, Loader2, AlertCircle, X, ChevronRight, ChevronLeft } from 'lucide-react';

interface PrecedentPanelProps {
  caseId: string;
  isOpen: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  className?: string;
}

export default function PrecedentPanel({
  caseId,
  isOpen,
  onClose,
  onToggle,
  className = '',
}: PrecedentPanelProps) {
  const [searchResult, setSearchResult] = useState<PrecedentSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrecedent, setSelectedPrecedent] = useState<SimilarPrecedent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch precedents
  const fetchPrecedents = useCallback(async () => {
    if (!caseId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await searchPrecedentsByCase(caseId);

      if (response.error) {
        // API not ready - use mock data
        console.log('Precedent API not available, using mock data');
        setSearchResult(generateMockPrecedents(caseId));
      } else if (response.data) {
        setSearchResult(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch precedents:', err);
      // Fallback to mock data
      setSearchResult(generateMockPrecedents(caseId));
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  // Auto-fetch when panel opens
  useEffect(() => {
    if (isOpen && !searchResult && !isLoading) {
      fetchPrecedents();
    }
  }, [isOpen, searchResult, isLoading, fetchPrecedents]);

  const handlePrecedentClick = (precedent: SimilarPrecedent) => {
    setSelectedPrecedent(precedent);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrecedent(null);
  };

  // Collapsed state (just toggle button)
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-30
          bg-blue-600 text-white px-2 py-4 rounded-l-lg shadow-lg
          hover:bg-blue-700 transition-colors
          flex flex-col items-center gap-2
          ${className}
        `}
        title="유사 판례 패널 열기"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="writing-mode-vertical text-xs font-medium">유사 판례</span>
        <BookOpen className="w-4 h-4" />
      </button>
    );
  }

  // Expanded panel
  return (
    <>
      <div
        className={`
          fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-40
          flex flex-col border-l border-gray-200
          transform transition-transform duration-300
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">유사 판례</h3>
            {searchResult && (
              <span className="text-xs text-gray-500">
                ({searchResult.precedents.length}건)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchPrecedents}
              disabled={isLoading}
              className="p-1.5 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            {onToggle && (
              <button
                onClick={onToggle}
                className="p-1.5 hover:bg-white rounded-lg transition-colors"
                title="패널 접기"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white rounded-lg transition-colors"
                title="닫기"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="ml-2 text-gray-500">판례 검색 중...</span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">{error}</p>
                <button
                  onClick={fetchPrecedents}
                  className="text-sm text-red-600 hover:text-red-800 underline mt-1"
                >
                  다시 시도
                </button>
              </div>
            </div>
          )}

          {/* Precedents List */}
          {!isLoading && !error && searchResult && (
            <>
              {/* Statistics */}
              <PrecedentStats statistics={searchResult.statistics} />

              {/* Precedent Cards */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">
                  유사 판례 목록
                </h4>
                {searchResult.precedents.map((precedent) => (
                  <PrecedentCard
                    key={precedent.id}
                    precedent={precedent}
                    onClick={handlePrecedentClick}
                  />
                ))}
              </div>

              {/* Empty State */}
              {searchResult.precedents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>유사한 판례를 찾지 못했습니다.</p>
                  <p className="text-sm mt-1">증거를 더 업로드하면 정확도가 향상됩니다.</p>
                </div>
              )}
            </>
          )}

          {/* Initial State - No Search Yet */}
          {!isLoading && !error && !searchResult && (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">유사 판례를 검색하세요</p>
              <button
                onClick={fetchPrecedents}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                판례 검색
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            * 판례 정보는 참고용이며, 개별 사안에 따라 결과가 다를 수 있습니다.
          </p>
        </div>
      </div>

      {/* Precedent Detail Modal */}
      <PrecedentModal
        precedent={selectedPrecedent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Custom CSS for vertical text */}
      <style jsx>{`
        .writing-mode-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </>
  );
}
