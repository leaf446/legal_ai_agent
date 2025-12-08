'use client';

import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from 'reactflow';
import { RelationshipType, RELATIONSHIP_COLORS, RELATIONSHIP_LABELS } from '@/types/relationship';

interface RelationshipEdgeData {
  relationship: RelationshipType;
  confidence?: number; // 0-1
}

export default function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps<RelationshipEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const confidence = data?.confidence ?? 1;
  const isUncertain = confidence < 1.0;
  
  const relationshipType = data?.relationship as RelationshipType;
  const strokeColor = RELATIONSHIP_COLORS[relationshipType] || '#CBD5E1'; // Default: neutral-300

  // Dynamic Styles based on relationship
  const edgeStyle = {
    ...style,
    stroke: strokeColor,
    strokeWidth: 2,
    strokeDasharray: isUncertain ? '5, 5' : undefined,
    opacity: isUncertain ? 0.7 : 1,
  };

  const label = RELATIONSHIP_LABELS[relationshipType] || '관계';

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="group"
        >
          <div 
            className={`
              px-2.5 py-1 rounded-full bg-white border shadow-sm text-xs font-medium
              transition-all duration-200 hover:scale-110 hover:shadow-md cursor-pointer
              ${isUncertain ? 'border-neutral-300 text-neutral-500' : 'border-neutral-200 text-neutral-700'}
            `}
            style={{ 
              borderColor: isUncertain ? undefined : strokeColor,
              color: isUncertain ? undefined : strokeColor
            }}
          >
            {label}
            {isUncertain && <span className="ml-1 text-[10px] text-neutral-400">?</span>}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
