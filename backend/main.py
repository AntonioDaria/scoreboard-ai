"""FastAPI application entry point: registers routers, CORS middleware, and the health check endpoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.controllers import auth_controller, football_controller, prediction_controller, betting_slip_controller

load_dotenv()

app = FastAPI(title="Football Predictions API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8080", "http://localhost:8081"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_controller.router, prefix="/auth", tags=["auth"])
app.include_router(football_controller.router, tags=["football"])
app.include_router(prediction_controller.router, prefix="/predictions", tags=["predictions"])
app.include_router(betting_slip_controller.router, prefix="/slips", tags=["betting_slips"])


@app.get("/health")
def health_check():
    """Return a simple liveness response used by the load balancer and CI health checks."""
    return {"status": "ok"}
