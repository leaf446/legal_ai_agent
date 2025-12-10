'use client';

import React from 'react';
import {
  SimilarPrecedent,
  getSimilarityColor,
  getSimilarityLabel,
  formatAlimonyAmount,
} from '@/types/precedent';
import { FileText, Scale, ChevronRight } from 'lucide-react';

interface PrecedentCardProps {
  precedent: SimilarPrecedent;
  onClick?: (precedent: SimilarPrecedent) => void;
  isCompact?: boolean;
}

export default function PrecedentCard({
  precedent,
  onClick,
  isCompact = false,
}: PrecedentCardProps) {
  const similarityColor = getSimilarityColor(precedent.similarity_score);
  const similarityLabel = getSimilarityLabel(precedent.similarity_score);

  return (
    <div
      className={`
        border rounded-lg transition-all cursor-pointer
        hover:border-blue-300 hover:shadow-md
        ${isCompact ? 'p-3' : 'p-4'}
      `}
      onClick={() => onClick?.(precedent)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-sm font-medium text-gray-800">
              {precedent.court}
            </p>
            <p className="text-xs text-gray-500">
              {precedent.case_number}
            </p>
          </div>
        </div>

        {/* Similarity Score */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${similarityColor}20`,
            color: similarityColor,
          }}
        >
          <span>{precedent.similarity_score}%</span>
          {!isCompact && <span className="text-xs opacity-75">{similarityLabel}</span>}
        </div>
      </div>

      {/* Fault Types */}
      {precedent.fault_type_labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {precedent.fault_type_labels.map((label, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Summary */}
      {!isCompact && (
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {precedent.summary}
        </p>
      )}

      {/* Key Metrics */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          {/* Alimony */}
          {precedent.alimony_amount !== undefined && (
            <div className="flex items-center gap-1 text-gray-600">
              <Scale className="w-3 h-3" />
              <span>위자료: {formatAlimonyAmount(precedent.alimony_amount)}</span>
            </div>
          )}

          {/* Division Ratio */}
          {precedent.division_ratio && (
            <span className="text-gray-500">
              분할: {precedent.division_ratio}
            </span>
          )}
        </div>

        {/* View More */}
        <button className="flex items-center text-blue-600 hover:text-blue-800">
          <span>상세보기</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
