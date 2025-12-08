import React from 'react';
import { X, User, FileText, Hash } from 'lucide-react';
import { PersonNode, ROLE_LABELS, PersonRole } from '@/types/relationship';

interface NodeDetailsPanelProps {
  node: PersonNode | null;
  onClose: () => void;
  className?: string;
}

export default function NodeDetailsPanel({
  node,
  onClose,
  className = '',
}: NodeDetailsPanelProps) {
  if (!node) return null;

  const roleLabel = ROLE_LABELS[node.role as PersonRole] || '미상';
  const roleColor = node.color || '#94A3B8'; // Fallback to neutral-400

  return (
    <div
      className={`bg-white border-l border-neutral-200 shadow-xl h-full w-80 flex flex-col transition-transform duration-300 ease-in-out ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
        <h3 className="text-lg font-semibold text-neutral-800 flex items-center">
          <User className="w-5 h-5 mr-2" style={{ color: roleColor }} />
          인물 상세 정보
        </h3>
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200 rounded-full p-1 transition-colors"
          aria-label="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Profile Header */}
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white text-xl font-bold mb-3 shadow-md border-2 border-white ring-2 ring-offset-2"
            style={{ backgroundColor: roleColor, ['--tw-ring-color' as string]: roleColor }}
          >
            {node.name.slice(0, 1)}
          </div>
          <h2 className="text-xl font-bold text-neutral-900">{node.name}</h2>
          <span
            className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm"
            style={{ backgroundColor: roleColor }}
          >
            {roleLabel}
          </span>
        </div>

        {/* Details List */}
        <div className="space-y-4">
          {/* Aliases */}
          {node.aliases && node.aliases.length > 0 && (
            <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-100">
              <div className="flex items-center text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
                <Hash className="w-3 h-3 mr-1" />
                별칭 / 호칭
              </div>
              <div className="flex flex-wrap gap-2">
                {node.aliases.map((alias, idx) => (
                  <span
                    key={idx}
                    className="text-sm bg-white border border-neutral-200 px-2 py-1 rounded text-neutral-700"
                  >
                    {alias}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description / Notes (Placeholder for now as generic type might not have it yet, 
              but planning for future 'attributes' field) */}
          <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-100">
             <div className="flex items-center text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
                <FileText className="w-3 h-3 mr-1" />
                분석 노트
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed">
                 AI가 분석한 이 인물에 대한 특이사항이 이곳에 표시됩니다. 
                 (현재 데이터 모델에서는 별도 설명 필드가 없으므로 데모 텍스트입니다.)
              </p>
          </div>
        </div>
      </div>

      {/* Footer Actions (Optional) */}
      <div className="p-4 border-t border-neutral-200 bg-neutral-50">
        <button className="w-full py-2 bg-white border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors shadow-sm">
           인물 정보 수정
        </button>
      </div>
    </div>
  );
}
