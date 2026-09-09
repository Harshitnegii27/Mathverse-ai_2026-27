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
        from services.rag_tutor import generate_dynamic_question, generate_gwen_hint
        
        # Simulated data (student took 45s, got it wrong, eye tracker shows Overwhelmed)
        cognitive_state = "Overwhelmed"
        dummy_history = [{
            "correct": 0,
            "response_time_s": 45.0,
            "attention_state_eye": cognitive_state,
            "eye_blink_rate": 8.0,
            "eye_pupil_dilation": 35.0,
            "eye_fixation_duration": 1200.0,
            "eye_saccade_rate": 0.5,
            "eye_gaze_stability": 0.9
        }]
        
        probability = predict_risk(dummy_history)
        print(f"[AI] LSTM Predicted Next-Question Success Probability: {probability:.2%}")
        
        if probability < 0.40:
            print(f"[AI] -> High cognitive risk detected. Adjusting adaptive engine: EASIER.")
            difficulty = "easy"
        elif probability > 0.80:
            print(f"[AI] -> Student is cruising. Adjusting adaptive engine: HARDER.")
            difficulty = "hard"
        else:
            print(f"[AI] -> Student is challenged but capable. Adjusting adaptive engine: MAINTAIN.")
            difficulty = "medium"
            
        villain = "Green Goblin"
        topic = "solving linear equations"

        print(f"\n[AI] --- GENERATING DYNAMIC CONTENT ---")
        question_json = generate_dynamic_question(villain, topic, difficulty)
        print(f"[AI] RAG Generated Question JSON:\n{question_json}\n")

        # Parse the JSON to extract the actual question string
        import json
        try:
            # Sometimes LLMs wrap JSON in markdown blocks
            clean_json = question_json.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]
            
            question_data = json.loads(clean_json.strip())
            actual_question_text = question_data.get("question", topic)
        except Exception as e:
            print(f"[AI] Failed to parse generated question JSON for hint: {e}")
            actual_question_text = topic

        hint = generate_gwen_hint(villain, actual_question_text, cognitive_state)
        print(f"[AI] Spider-Gwen Hint:\n{hint}\n")
            
    except Exception as e:
        print(f"[AI] LSTM or LLM inference failed: {e}")

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
