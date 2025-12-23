'use client';

import React from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

export type PipelineStage = 'collection' | 'analysis' | 'structuring' | 'generation';

export interface PipelineStatus {
  collection: 'pending' | 'in_progress' | 'completed';
  analysis: 'pending' | 'in_progress' | 'completed';
  structuring: 'pending' | 'in_progress' | 'completed';
  generation: 'pending' | 'in_progress' | 'completed';
}

interface StageConfig {
  id: PipelineStage;
  label: string;
  description: string;
}

const STAGES: StageConfig[] = [
  { id: 'collection', label: '수집', description: '증거 + 상담' },
  { id: 'analysis', label: '분석', description: '법률 분석' },
  { id: 'structuring', label: '구조화', description: '타임라인 · 관계' },
  { id: 'generation', label: '생성', description: '초안 생성' },
];

interface PipelineProgressIndicatorProps {
  status: PipelineStatus;
  className?: string;
}

/**
 * 4단계 파이프라인 진행 상황 시각화 컴포넌트
 * 참조: docs/analysis/DRAFT_PIPELINE_ANALYSIS.md - Section 11.4
 */
export function PipelineProgressIndicator({ status, className = '' }: PipelineProgressIndicatorProps) {
  const getStageIcon = (stageStatus: 'pending' | 'in_progress' | 'completed') => {
    switch (stageStatus) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getStageStyles = (stageStatus: 'pending' | 'in_progress' | 'completed') => {
    switch (stageStatus) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'in_progress':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getConnectorStyles = (prevStatus: 'pending' | 'in_progress' | 'completed') => {
    return prevStatus === 'completed' ? 'bg-green-400' : 'bg-gray-200';
  };

  return (
    <div className={`flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 ${className}`}>
      {STAGES.map((stage, index) => {
        const stageStatus = status[stage.id];
        const isLast = index === STAGES.length - 1;

        return (
          <React.Fragment key={stage.id}>
            {/* Stage indicator */}
            <div className="flex flex-col items-center">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStageStyles(stageStatus)}`}>
                {getStageIcon(stageStatus)}
                <span className="text-sm font-medium hidden sm:inline">{stage.label}</span>
              </div>
              <span className="text-xs text-gray-500 mt-1 hidden md:inline">{stage.description}</span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-2 ${getConnectorStyles(stageStatus)}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * 케이스 데이터를 기반으로 파이프라인 상태 계산
 */
export function calculatePipelineStatus(caseData: {
  evidenceCount?: number;
  consultationCount?: number;
  analysisCompleted?: boolean;
  timelineCount?: number;
  relationsCount?: number;
  assetsCount?: number;
  draftGenerated?: boolean;
}): PipelineStatus {
  const {
    evidenceCount = 0,
    consultationCount = 0,
    analysisCompleted = false,
    timelineCount = 0,
    relationsCount = 0,
    assetsCount = 0,
    draftGenerated = false,
  } = caseData;

  // 수집: 증거 1개 이상 + 상담내역 1개 이상
  const collectionCompleted = evidenceCount >= 1 && consultationCount >= 1;
  const collectionInProgress = evidenceCount >= 1 || consultationCount >= 1;

  // 분석: 법률 분석 완료
  const analysisInProgress = collectionCompleted;

  // 구조화: 타임라인/관계도/재산분할 중 1개 이상
  const structuringCompleted = timelineCount > 0 || relationsCount > 0 || assetsCount > 0;
  const structuringInProgress = analysisCompleted;

  // 생성: 초안 생성 완료
  const generationInProgress = structuringCompleted;

  return {
    collection: collectionCompleted ? 'completed' : collectionInProgress ? 'in_progress' : 'pending',
    analysis: analysisCompleted ? 'completed' : analysisInProgress ? 'in_progress' : 'pending',
    structuring: structuringCompleted ? 'completed' : structuringInProgress ? 'in_progress' : 'pending',
    generation: draftGenerated ? 'completed' : generationInProgress ? 'in_progress' : 'pending',
  };
}

export default PipelineProgressIndicator;
