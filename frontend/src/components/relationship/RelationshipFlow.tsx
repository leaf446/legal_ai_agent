'use client';

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
  ConnectionMode,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import {
  RelationshipGraph,
  PersonNode as PersonNodeType,
  RelationshipEdge as RelationshipEdgeType,
  ROLE_COLORS,
  RELATIONSHIP_COLORS,
  PersonRole,
  RelationshipType,
} from '@/types/relationship';
import PersonNode from './PersonNode';
import RelationshipEdge from './RelationshipEdge';
import FlowControls from './FlowControls';

// Register custom types
const nodeTypes = {
  person: PersonNode,
};

const edgeTypes = {
  relationship: RelationshipEdge,
};

interface RelationshipFlowProps {
  graph: RelationshipGraph;
  onNodeClick?: (node: PersonNodeType) => void;
  onEdgeClick?: (edge: RelationshipEdgeType) => void;
  onPaneClick?: () => void;
}

/**
 * Circular Layout Calculation
 */
function calculateCircularLayout(
  nodes: PersonNodeType[],
  centerX: number,
  centerY: number,
  radius: number
): Node[] {
  const angleStep = (2 * Math.PI) / nodes.length;

  return nodes.map((node, index) => {
    const angle = index * angleStep - Math.PI / 2; // Start from 12 o'clock
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    return {
      id: node.id,
      type: 'person',
      position: { x, y },
      data: {
        ...node,
        color: node.color || ROLE_COLORS[node.role as PersonRole] || ROLE_COLORS[PersonRole.UNKNOWN],
      },
    };
  });
}

/**
 * Edge Conversion
 */
function convertEdges(edges: RelationshipEdgeType[]): Edge[] {
  return edges.map((edge, index) => ({
    id: `edge-${index}`,
    source: edge.source,
    target: edge.target,
    type: 'relationship',
    data: {
      ...edge,
      relationship: edge.relationship,
      confidence: edge.confidence,
    },
    // Styles are handled in the custom Edge component, 
    // but we set some defaults here for fallback/interaction
    style: {
      strokeWidth: 2,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: RELATIONSHIP_COLORS[edge.relationship as RelationshipType] || '#CBD5E1',
    },
  }));
}

export default function RelationshipFlow({
  graph,
  onNodeClick,
  onEdgeClick,
  onPaneClick,
}: RelationshipFlowProps) {
  // Memoize layout calculation
  const initialNodes = useMemo(
    () => calculateCircularLayout(graph.nodes, 400, 300, 250),
    [graph.nodes]
  );

  const initialEdges = useMemo(() => convertEdges(graph.edges), [graph.edges]);

  // React Flow State
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handlers
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        const personNode = graph.nodes.find((n) => n.id === node.id);
        if (personNode) {
          onNodeClick(personNode);
        }
      }
    },
    [graph.nodes, onNodeClick]
  );

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      if (onEdgeClick) {
        const relationshipEdge = graph.edges.find(
          (e) => e.source === edge.source && e.target === edge.target
        );
        if (relationshipEdge) {
          onEdgeClick(relationshipEdge);
        }
      }
    },
    [graph.edges, onEdgeClick]
  );

  return (
    <div className="w-full h-full bg-neutral-50/50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        nodesConnectable={false}
        nodesDraggable={true}
        fitView
        minZoom={0.2}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={24} 
          size={2} 
          color="#E2E8F0" // neutral-200 
        />
        
        <FlowControls />
        
        <MiniMap
          nodeColor={(node) => node.data?.color || '#94A3B8'}
          maskColor="rgba(248, 249, 250, 0.7)" // neutral-50 with opacity
          style={{
            backgroundColor: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: '0.5rem',
            margin: '1.5rem',
          }}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
}
