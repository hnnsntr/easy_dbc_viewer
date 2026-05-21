from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes_projects import router as projects_router

app = FastAPI(title="DBC Network Explorer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "DBC Network Explorer API is running"}
