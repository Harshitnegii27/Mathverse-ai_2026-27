from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

import models, schemas
from database import get_db

router = APIRouter(
    prefix="/attempts",
    tags=["attempts"],
)

def analyze_behavior_async(attempt_id: int):
    print(f"[AI] Running LSTM temporal analysis on attempt {attempt_id}...")
    try:
        from ml.attention_model import predict_risk
        
        # In reality, fetch recent DB attempts combined with eye-tracker output
        dummy_history = [{
            "correct": 1,
            "response_time_s": 15.0,
            "attention_state_eye": "Focused",
            "eye_blink_rate": 20.0,
            "eye_pupil_dilation": 5.0,
            "eye_fixation_duration": 400.0,
            "eye_saccade_rate": 2.0,
            "eye_gaze_stability": 0.8
        }]
        
        probability = predict_risk(dummy_history)
        print(f"[AI] LSTM Predicted Next-Question Success Probability: {probability:.2%}")
        
        if probability < 0.40:
            print(f"[AI] -> High cognitive risk detected. Adjusting adaptive engine: EASIER.")
        elif probability > 0.80:
            print(f"[AI] -> Student is cruising. Adjusting adaptive engine: HARDER.")
        else:
            print(f"[AI] -> Student is challenged but capable. Adjusting adaptive engine: MAINTAIN.")
            
    except Exception as e:
        print(f"[AI] LSTM model inference failed: {e}")

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
