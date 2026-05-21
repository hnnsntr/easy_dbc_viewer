import type { GraphModel } from './types';

const API_BASE = 'http://localhost:8000/api';

export async function uploadDbcFile(file: File): Promise<{projectId: string, fileName: string, graph: GraphModel}> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload DBC file');
  }

  const result = await response.json();
  
  // Fetch graph right away
  const graphResponse = await fetch(`${API_BASE}/projects/${result.projectId}/graph`);
  
  if (!graphResponse.ok) {
    throw new Error('Failed to fetch graph data');
  }

  const graph = await graphResponse.json();

  return {
    projectId: result.projectId,
    fileName: result.fileName,
    graph
  };
}
