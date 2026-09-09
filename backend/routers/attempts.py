from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

import models, schemas
from database import get_db

router = APIRouter(
    prefix="/attempts",
    tags=["attempts"],
)

def analyze_behavior_async(attempt_id: int):
    # Placeholder for LSTM Time Analysis and Adaptive Difficulty Engine
    print(f"[AI] Running LSTM temporal analysis on attempt {attempt_id}...")
    print(f"[AI] Predicting risk and adjusting adaptive difficulty...")

@router.post("/", response_model=schemas.MissionAttempt)
def submit_attempt(attempt: schemas.MissionAttemptCreate, user_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_attempt = models.MissionAttempt(
        userId=user_id,
        score=attempt.score,
        timeTaken=attempt.timeTaken,
        hintUsed=attempt.hintUsed
    )
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)
    
    # Asynchronously invoke AI/Analytics layer
    background_tasks.add_task(analyze_behavior_async, db_attempt.attemptId)
    
    return db_attempt
