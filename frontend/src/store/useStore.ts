import { create } from 'zustand';
import type { GraphModel } from '../lib/types';

interface AppState {
  projectId: string | null;
  fileName: string | null;
  graph: GraphModel | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  setProject: (projectId: string, fileName: string, graph: GraphModel) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  projectId: null,
  fileName: null,
  graph: null,
  selectedNodeId: null,
  selectedEdgeId: null,
  setProject: (projectId, fileName, graph) => 
    set({ projectId, fileName, graph, selectedNodeId: null, selectedEdgeId: null }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
}));
