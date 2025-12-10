'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { PersonNode, PersonRole, ROLE_LABELS, ROLE_COLORS } from '@/types/relationship';

interface SearchFilterPanelProps {
  nodes: PersonNode[];
  onHighlight: (nodeId: string | null) => void;
  onFilter: (filteredNodeIds: string[] | null) => void;
  className?: string;
}

function SearchFilterPanel({
  nodes,
  onHighlight,
  onFilter,
  className = '',
}: SearchFilterPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<PersonRole[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 검색어 및 역할 필터 적용
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      // 검색어 필터
      const matchesSearch =
        !searchQuery ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.aliases?.some((alias) =>
          alias.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // 역할 필터
      const matchesRole =
        selectedRoles.length === 0 || selectedRoles.includes(node.role);

      return matchesSearch && matchesRole;
    });
  }, [nodes, searchQuery, selectedRoles]);

  // 필터 변경 시 부모에 알림
  const applyFilter = useCallback(() => {
    if (filteredNodes.length === nodes.length) {
      onFilter(null); // 전체 표시
    } else {
      onFilter(filteredNodes.map((n) => n.id));
    }
  }, [filteredNodes, nodes.length, onFilter]);

  // 검색어 변경
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // 딜레이 없이 즉시 필터 적용
    setTimeout(applyFilter, 0);
  };

  // 역할 토글
  const handleRoleToggle = (role: PersonRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
    setTimeout(applyFilter, 0);
  };

  // 필터 초기화
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRoles([]);
    onFilter(null);
    onHighlight(null);
  };

  // 역할 목록
  const roles: PersonRole[] = [
    PersonRole.PLAINTIFF,
    PersonRole.DEFENDANT,
    PersonRole.CHILD,
    PersonRole.THIRD_PARTY,
  ];

  const hasActiveFilter = searchQuery || selectedRoles.length > 0;

  return (
    <div className={`bg-white/90 backdrop-blur shadow-lg border border-neutral-200 rounded-xl overflow-hidden ${className}`}>
      {/* 검색 입력 */}
      <div className="p-3 border-b border-neutral-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="인물 검색..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 역할 필터 토글 */}
      <div className="px-3 py-2 border-b border-neutral-100">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center justify-between w-full text-sm font-medium text-neutral-700 hover:text-neutral-900"
        >
          <span className="flex items-center gap-1.5">
            <Filter className="w-4 h-4" />
            역할 필터
            {selectedRoles.length > 0 && (
              <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                {selectedRoles.length}
              </span>
            )}
          </span>
          <span className="text-neutral-400">{isFilterOpen ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* 역할 체크박스 */}
      {isFilterOpen && (
        <div className="p-3 space-y-2">
          {roles.map((role) => (
            <label
              key={role}
              className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 px-2 py-1 rounded"
            >
              <input
                type="checkbox"
                checked={selectedRoles.includes(role)}
                onChange={() => handleRoleToggle(role)}
                className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary/30"
              />
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: ROLE_COLORS[role] }}
              />
              <span className="text-sm text-neutral-700">
                {ROLE_LABELS[role]}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* 검색 결과 */}
      {searchQuery && (
        <div className="border-t border-neutral-100 max-h-40 overflow-y-auto">
          {filteredNodes.length === 0 ? (
            <div className="p-3 text-sm text-neutral-500 text-center">
              검색 결과가 없습니다
            </div>
          ) : (
            <ul className="py-1">
              {filteredNodes.map((node) => (
                <li
                  key={node.id}
                  onClick={() => onHighlight(node.id)}
                  className="px-3 py-2 hover:bg-neutral-50 cursor-pointer flex items-center gap-2 transition-colors"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: node.color || ROLE_COLORS[node.role] }}
                  />
                  <span className="text-sm text-neutral-800 truncate">
                    {node.name}
                  </span>
                  <span className="text-xs text-neutral-400 ml-auto">
                    {ROLE_LABELS[node.role]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 필터 초기화 */}
      {hasActiveFilter && (
        <div className="p-2 border-t border-neutral-100">
          <button
            onClick={clearFilters}
            className="w-full py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded transition-colors"
          >
            필터 초기화
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(SearchFilterPanel);
