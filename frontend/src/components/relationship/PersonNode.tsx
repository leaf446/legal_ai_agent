'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { User, Shield, AlertTriangle } from 'lucide-react';
import { PersonNode as PersonNodeType, ROLE_LABELS, PersonRole } from '@/types/relationship';

interface PersonNodeData extends PersonNodeType {
  color: string;
}

// Role-based icons
const RoleIcon = ({ role, className }: { role: PersonRole; className?: string }) => {
  if (role === PersonRole.PLAINTIFF) return <Shield className={className} />;
  if (role === PersonRole.DEFENDANT) return <AlertTriangle className={className} />;
  return <User className={className} />;
};

function PersonNode({ data, selected }: NodeProps<PersonNodeData>) {
  const roleLabel = ROLE_LABELS[data.role as PersonRole] || '미상';
  const displayColor = data.color || '#94A3B8';

  return (
    <div
      className={`
        relative group transition-all duration-300 ease-out animate-scale-in
        ${selected ? 'z-10 scale-105' : 'hover:scale-102'}
      `}
    >
      {/* Node Card */}
      <div
        className={`
          flex items-center p-3 pr-5 bg-white rounded-full border-2 shadow-sm
          transition-all duration-300
          ${selected 
            ? 'border-primary ring-2 ring-primary ring-opacity-20 shadow-md' 
            : 'border-neutral-200 hover:border-primary-light hover:shadow-md'
          }
        `}
      >
        {/* Avatar Circle */}
        <div 
          className="relative flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-lg shadow-inner mr-3"
          style={{ backgroundColor: displayColor }}
        >
          {data.name.slice(0, 1)}
          
          {/* Role Badge Indicator (Small Icon) */}
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-neutral-100">
            <RoleIcon role={data.role as PersonRole} className="w-3 h-3 text-neutral-600" />
          </div>
        </div>

        {/* Text Content */}
        <div className="flex flex-col justify-center">
          <span className="text-sm font-bold text-neutral-800 leading-tight">
            {data.name}
          </span>
          <span 
            className="text-[10px] font-medium uppercase tracking-wider mt-0.5 px-1.5 py-0.5 rounded-full w-fit"
            style={{ 
              backgroundColor: `${displayColor}15`, // 15 = ~10% opacity hex
              color: displayColor 
            }}
          >
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Handles - Custom Styled */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-neutral-300 !border-2 !border-white transition-colors group-hover:!bg-primary"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-neutral-300 !border-2 !border-white transition-colors group-hover:!bg-primary"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-neutral-300 !border-2 !border-white transition-colors group-hover:!bg-primary"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-neutral-300 !border-2 !border-white transition-colors group-hover:!bg-primary"
      />
    </div>
  );
}

export default memo(PersonNode);
