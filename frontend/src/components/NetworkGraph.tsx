import { useMemo, useCallback } from 'react';
import type { MouseEvent } from 'react';
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  Handle,
  Position,
  BackgroundVariant,
  MarkerType
} from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '../store/useStore';

// Custom Node Component to look like an ECU card
const EcuNode = ({ data, selected }: any) => {
  return (
    <div className={`px-4 py-3 rounded-lg shadow-md border-2 transition-colors
      ${selected ? 'border-blue-500 bg-slate-800' : 'border-slate-700 bg-slate-800 hover:border-slate-500'}
      min-w-[150px]
    `}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
      
      <div className="font-bold text-slate-100 text-center mb-2 border-b border-slate-700 pb-1">
        {data.name}
      </div>
      <div className="text-xs text-slate-400 grid grid-cols-2 gap-x-2 gap-y-1">
        <div>TX Msg: <span className="text-blue-400">{data.txMessageCount}</span></div>
        <div>RX Msg: <span className="text-green-400">{data.rxMessageCount}</span></div>
        <div>TX Sig: <span className="text-blue-400">{data.txSignalCount}</span></div>
        <div>RX Sig: <span className="text-green-400">{data.rxSignalCount}</span></div>
      </div>
    </div>
  );
};

const nodeTypes = {
  ecu: EcuNode,
};

export const NetworkGraph = () => {
  const graph = useStore((state) => state.graph);
  const setSelectedNodeId = useStore((state) => state.setSelectedNodeId);
  const setSelectedEdgeId = useStore((state) => state.setSelectedEdgeId);

  // Convert generic graph model to ReactFlow specific nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!graph) return { initialNodes: [], initialEdges: [] };

    // Simple circle layout for MVP
    const nodes: Node[] = [];
    const radius = Math.max(300, graph.nodes.length * 40);
    const centerX = 400;
    const centerY = 300;

    graph.nodes.forEach((node, i) => {
      const angle = (i / graph.nodes.length) * 2 * Math.PI;
      nodes.push({
        id: node.id,
        type: 'ecu',
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
        data: node,
      });
    });

    const edges: Edge[] = graph.edges.map((edge) => {
      // Calculate stroke width based on signals or messages
      const thickness = Math.min(Math.max(1, edge.signalCount / 5), 8);
      
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: true,
        style: { strokeWidth: thickness },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#94a3b8',
        },
        data: edge,
      };
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [graph]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Update selection based on store if needed, or update store based on node click
  const onNodeClick = useCallback((_: MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const onEdgeClick = useCallback((_: MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id);
  }, [setSelectedEdgeId]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [setSelectedNodeId, setSelectedEdgeId]);

  if (!graph) return null;

  return (
    <div className="w-full h-full bg-slate-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-slate-900"
      >
        <Controls className="bg-slate-800 border-slate-700" showInteractive={false} />
        <MiniMap 
          nodeColor="#1e293b" 
          maskColor="rgba(15, 23, 42, 0.7)" 
          className="bg-slate-800" 
        />
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#334155" />
      </ReactFlow>
    </div>
  );
};
