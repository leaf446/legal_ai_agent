'use client';

import React from 'react';
import {
  SimilarPrecedent,
  getSimilarityColor,
  getSimilarityLabel,
  formatAlimonyAmount,
} from '@/types/precedent';
import { X, FileText, Scale, Calendar, CheckCircle, ExternalLink } from 'lucide-react';

interface PrecedentModalProps {
  precedent: SimilarPrecedent | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PrecedentModal({
  precedent,
  isOpen,
  onClose,
}: PrecedentModalProps) {
  if (!isOpen || !precedent) return null;

  const similarityColor = getSimilarityColor(precedent.similarity_score);
  const similarityLabel = getSimilarityLabel(precedent.similarity_score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {precedent.court}
              </h3>
              <p className="text-sm text-gray-500">{precedent.case_number}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Similarity Badge */}
            <div
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{
                backgroundColor: `${similarityColor}20`,
                color: similarityColor,
              }}
            >
              <span>{precedent.similarity_score}%</span>
              <span className="text-xs opacity-75">{similarityLabel}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Fault Types */}
          {precedent.fault_type_labels.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">유책사유</h4>
              <div className="flex flex-wrap gap-2">
                {precedent.fault_type_labels.map((label, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            {/* Alimony */}
            {precedent.alimony_amount !== undefined && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Scale className="w-4 h-4" />
                  위자료 인정 금액
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {formatAlimonyAmount(precedent.alimony_amount)}
                </p>
              </div>
            )}

            {/* Division Ratio */}
            {precedent.division_ratio && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Scale className="w-4 h-4" />
                  재산분할 비율
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {precedent.division_ratio}
                </p>
              </div>
            )}

            {/* Year */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Calendar className="w-4 h-4" />
                판결 연도
              </div>
              <p className="text-xl font-bold text-gray-900">
                {precedent.case_year}년
              </p>
            </div>
          </div>

          {/* Summary */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">판결 요약</h4>
            <p className="text-gray-800 bg-gray-50 rounded-lg p-3 leading-relaxed">
              {precedent.summary}
            </p>
          </div>

          {/* Key Points */}
          {precedent.key_points && precedent.key_points.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">핵심 판결 포인트</h4>
              <ul className="space-y-2">
                {precedent.key_points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Relevance Reason */}
          {precedent.relevance_reason && (
            <div className="bg-blue-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-800 mb-1">
                유사 판단 근거
              </h4>
              <p className="text-sm text-blue-700">{precedent.relevance_reason}</p>
            </div>
          )}

          {/* Full Text Preview */}
          {precedent.full_text && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">판결문 일부</h4>
              <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {precedent.full_text.slice(0, 1000)}
                  {precedent.full_text.length > 1000 && '...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-500">
            * 본 정보는 참고용이며, 실제 판결은 개별 사안에 따라 다를 수 있습니다.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              닫기
            </button>
            <button className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
              <ExternalLink className="w-4 h-4" />
              전체 판결문 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
