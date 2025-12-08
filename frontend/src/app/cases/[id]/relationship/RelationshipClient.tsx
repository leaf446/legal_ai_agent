'use client';

import { useCallback, useState } from 'react';
import { ArrowLeft, Loader2, AlertCircle, Users, Share2, Download, PlayCircle, FileText, PenLine } from 'lucide-react';
import Link from 'next/link';
import { RelationshipGraph, PersonNode } from '@/types/relationship';
import { analyzeRelationships } from '@/lib/api/relationship';
import RelationshipFlow from '@/components/relationship/RelationshipFlow';
import RelationshipLegend from '@/components/relationship/RelationshipLegend';
import NodeDetailsPanel from '@/components/relationship/NodeDetailsPanel';
import EvidenceSelector from '@/components/relationship/EvidenceSelector';
import TextInputPanel from '@/components/relationship/TextInputPanel';

interface RelationshipClientProps {
  caseId: string;
}

type InputMode = 'evidence' | 'text';

export default function RelationshipClient({ caseId }: RelationshipClientProps) {
  // Input state
  const [inputMode, setInputMode] = useState<InputMode>('evidence');
  const [evidenceText, setEvidenceText] = useState('');
  const [directText, setDirectText] = useState('');
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);

  // Analysis state
  const [graph, setGraph] = useState<RelationshipGraph | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<PersonNode | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Get current text to analyze based on input mode
  const currentText = inputMode === 'evidence' ? evidenceText : directText;
  const canAnalyze = currentText.trim().length > 0 && !isAnalyzing;

  // Evidence selection handler
  const handleEvidenceSelection = useCallback((ids: string[], combinedText: string) => {
    setSelectedEvidenceIds(ids);
    setEvidenceText(combinedText);
  }, []);

  // Direct text input handler
  const handleTextInput = useCallback((text: string) => {
    setDirectText(text);
  }, []);

  // Analyze relationships
  const handleAnalyze = async () => {
    if (!canAnalyze) return;

    setIsAnalyzing(true);
    setError(null);
    setSelectedNode(null);
    setHasAnalyzed(true);

    try {
      const response = await analyzeRelationships(currentText);

      if (response.error) {
        setError(response.error);
        setGraph(null);
      } else if (response.data) {
        setGraph(response.data);
      }
    } catch (err) {
      console.error('Failed to analyze relationships:', err);
      setError('관계 분석 중 오류가 발생했습니다.');
      setGraph(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const hasData = graph && graph.nodes.length > 0;

  // Handlers
  const handleNodeClick = (node: PersonNode) => {
    setSelectedNode(node);
  };

  const handlePaneClick = () => {
    setSelectedNode(null);
  };

  const handleClosePanel = () => {
    setSelectedNode(null);
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-6 py-3 shrink-0 z-20 shadow-sm relative">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href={`/cases/${caseId}`}
              className="p-2 -ml-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              title="사건 홈으로 돌아가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                인물 관계도
              </h1>
              <div className="flex items-center text-xs text-neutral-500 gap-2">
                <span className="bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                  Case ID: {caseId}
                </span>
                <span>•</span>
                <span>AI 자동 분석</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="flex items-center text-sm font-medium text-white bg-primary hover:bg-primary-hover px-4 py-2 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  인물관계 분석 실행
                </>
              )}
            </button>
            {hasData && (
              <button
                className="flex items-center text-sm font-medium text-neutral-700 bg-white border border-neutral-200 hover:border-neutral-300 px-3 py-1.5 rounded-md shadow-sm transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                이미지 저장
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Input Selection */}
        <aside className="w-96 bg-white border-r border-neutral-200 flex flex-col shrink-0 overflow-hidden">
          {/* Input Mode Tabs */}
          <div className="flex border-b border-neutral-200 shrink-0">
            <button
              onClick={() => setInputMode('evidence')}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                ${inputMode === 'evidence'
                  ? 'text-primary border-b-2 border-primary bg-primary-light/50'
                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'}
              `}
            >
              <FileText className="w-4 h-4" />
              증거에서 분석
            </button>
            <button
              onClick={() => setInputMode('text')}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                ${inputMode === 'text'
                  ? 'text-primary border-b-2 border-primary bg-primary-light/50'
                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'}
              `}
            >
              <PenLine className="w-4 h-4" />
              텍스트 직접 입력
            </button>
          </div>

          {/* Input Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {inputMode === 'evidence' ? (
              <EvidenceSelector
                caseId={caseId}
                onSelectionChange={handleEvidenceSelection}
                disabled={isAnalyzing}
              />
            ) : (
              <TextInputPanel
                onTextChange={handleTextInput}
                disabled={isAnalyzing}
              />
            )}

            {/* Help Text */}
            <div className="mt-4 p-3 bg-primary-light/30 border border-primary-200 rounded-lg">
              <p className="text-xs text-primary-dark">
                <strong>사용 방법:</strong> {inputMode === 'evidence'
                  ? '분석할 증거를 선택한 후 상단의 "인물관계 분석 실행" 버튼을 클릭하세요.'
                  : '진술서나 증거 내용을 직접 입력한 후 상단의 "인물관계 분석 실행" 버튼을 클릭하세요.'}
              </p>
              <p className="text-xs text-primary-dark mt-1">
                AI가 자동으로 인물을 추출하고 관계를 분석합니다.
              </p>
            </div>

            {/* Analysis Summary */}
            {hasAnalyzed && hasData && (
              <div className="mt-4 p-3 bg-success-light border border-success-200 rounded-lg">
                <p className="text-xs text-success-dark font-medium">
                  분석 완료: {graph?.nodes.length}명의 인물, {graph?.edges.length}개의 관계 추출됨
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Right Panel - Graph Visualization */}
        <main className="flex-1 relative bg-neutral-100">
          {/* Initial State - Before Analysis */}
          {!hasAnalyzed && !isAnalyzing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 p-8">
              <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8 max-w-md w-full text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
                <h3 className="text-lg font-bold text-neutral-700 mb-2">인물관계 분석 대기 중</h3>
                <p className="text-sm text-neutral-500 mb-4">
                  {inputMode === 'evidence'
                    ? '좌측에서 분석할 증거를 선택하고'
                    : '좌측에서 분석할 텍스트를 입력하고'}
                  <br />
                  상단의 &quot;인물관계 분석 실행&quot; 버튼을 클릭하세요.
                </p>
                {!canAnalyze && currentText.length === 0 && (
                  <p className="text-xs text-warning bg-warning-light px-3 py-2 rounded-lg">
                    {inputMode === 'evidence' ? '증거를 선택해주세요' : '텍스트를 입력해주세요'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-neutral-600 font-medium">AI가 인물관계를 분석하고 있습니다...</p>
              <p className="text-sm text-neutral-500 mt-1">잠시만 기다려주세요</p>
            </div>
          )}

          {/* Error State */}
          {!isAnalyzing && error && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="bg-white rounded-2xl shadow-lg border border-error-200 p-8 max-w-md w-full text-center">
                <div className="w-12 h-12 bg-error-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-error" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">분석 실패</h3>
                <p className="text-sm text-neutral-600 mb-6">{error}</p>
                <button
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  className="w-full py-2 px-4 bg-white border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  다시 시도
                </button>
              </div>
            </div>
          )}

          {/* Empty State - After Analysis with No Results */}
          {hasAnalyzed && !isAnalyzing && !error && !hasData && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
              <Users className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium text-neutral-500">인물 정보를 찾지 못했습니다</p>
              <p className="text-sm text-neutral-400 mt-1">다른 증거를 선택하거나 더 자세한 내용을 입력해보세요</p>
            </div>
          )}

          {/* Graph Visualization */}
          {!isAnalyzing && !error && hasData && graph && (
            <>
              <div className="absolute inset-0">
                <RelationshipFlow
                  graph={graph}
                  onNodeClick={handleNodeClick}
                  onPaneClick={handlePaneClick}
                />
              </div>

              {/* Floating Legend */}
              <div className="absolute top-6 left-6 z-10">
                <div className="bg-white/90 backdrop-blur shadow-lg border border-neutral-200 rounded-xl p-4 max-w-xs">
                  <RelationshipLegend />
                </div>
              </div>
            </>
          )}
        </main>

        {/* Side Panel (Node Details) */}
        <div
          className={`
            absolute top-0 right-0 h-full z-30 shadow-2xl transform transition-transform duration-300 ease-in-out
            ${selectedNode ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          <NodeDetailsPanel
            node={selectedNode}
            onClose={handleClosePanel}
          />
        </div>
      </div>
    </div>
  );
}
