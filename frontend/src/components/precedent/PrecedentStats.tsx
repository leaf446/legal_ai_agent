'use client';

import React from 'react';
import { PrecedentStatistics, formatAlimonyAmount } from '@/types/precedent';
import { TrendingUp, Scale, Award, BarChart3 } from 'lucide-react';

interface PrecedentStatsProps {
  statistics: PrecedentStatistics;
}

export default function PrecedentStats({ statistics }: PrecedentStatsProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-blue-600" />
        판례 기반 참고 정보
      </h4>

      {/* Alimony Range */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Scale className="w-3 h-3" />
            위자료 범위
          </span>
          <span className="font-medium">
            {formatAlimonyAmount(statistics.min_alimony)} ~ {formatAlimonyAmount(statistics.max_alimony)}
          </span>
        </div>

        {/* Visual Range Bar */}
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
            style={{
              left: '10%',
              right: '10%',
            }}
          />
          {/* Average Marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-600 rounded-full shadow"
            style={{ left: '50%', marginLeft: '-6px' }}
            title={`평균: ${formatAlimonyAmount(statistics.avg_alimony)}`}
          />
        </div>

        <div className="flex justify-center text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            평균: <strong className="text-gray-700">{formatAlimonyAmount(statistics.avg_alimony)}</strong>
          </span>
        </div>
      </div>

      {/* Win Rate */}
      {statistics.win_rate !== undefined && (
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-gray-600">
            <Award className="w-3 h-3" />
            유사 사안 승소율
          </span>
          <span className="font-semibold text-green-600">
            {statistics.win_rate}%
          </span>
        </div>
      )}

      {/* Most Common Fault Types */}
      {statistics.most_common_fault_types.length > 0 && (
        <div className="pt-2 border-t border-blue-100">
          <p className="text-xs text-gray-600 mb-1">주요 유책사유</p>
          <div className="flex flex-wrap gap-1">
            {statistics.most_common_fault_types.map((type, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 bg-white/60 text-gray-700 rounded border border-blue-100"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Total Count */}
      <p className="text-xs text-gray-500 text-center pt-1">
        총 {statistics.total_count}건의 유사 판례 분석
      </p>
    </div>
  );
}
