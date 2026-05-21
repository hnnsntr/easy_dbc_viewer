from fastapi import APIRouter, UploadFile, File, HTTPException
from ..dbc.parser import parse_dbc
from ..dbc.graph_builder import build_graph
from ..dbc.models import GraphModel
import uuid

router = APIRouter()

# In-memory store for MVP
projects_store = {}

@router.post("/projects")
async def upload_project(file: UploadFile = File(...)):
    if not file.filename.endswith('.dbc'):
        raise HTTPException(status_code=400, detail="Only .dbc files are supported")
    
    content = await file.read()
    try:
        content_str = content.decode('utf-8')
    except UnicodeDecodeError:
        try:
            content_str = content.decode('iso-8859-1')
        except Exception:
            raise HTTPException(status_code=400, detail="Could not decode file content")
            
    try:
        nodes, messages, signals = parse_dbc(content_str)
        graph = build_graph(nodes, messages, signals)
        
        project_id = str(uuid.uuid4())
        projects_store[project_id] = {
            "id": project_id,
            "fileName": file.filename,
            "graph": graph
        }
        
        return {
            "projectId": project_id,
            "fileName": file.filename,
            "metadata": graph.metadata
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing DBC: {str(e)}")

@router.get("/projects/{project_id}/graph", response_model=GraphModel)
async def get_project_graph(project_id: str):
    if project_id not in projects_store:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return projects_store[project_id]["graph"]
