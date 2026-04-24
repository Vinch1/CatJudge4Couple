from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import cases
from app.routers.ws import router as ws_router

app = FastAPI(title="猫咪法官", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


app.include_router(cases.router)
app.include_router(ws_router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "猫咪法官"}
