from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import users, missions, attempts
import models

# Initialize the database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MathVerse AI API",
    description="Backend API for the AI-Powered Gamified Mathematics Learning Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(users.router)
app.include_router(missions.router)
app.include_router(attempts.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the MathVerse AI Backend Services"}
