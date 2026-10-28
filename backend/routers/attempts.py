from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

import models, schemas
from database import get_db

router = APIRouter(
    prefix="/attempts",
    tags=["attempts"],
)

def analyze_behavior(attempt_id: int):
    print(f"[AI] Running LSTM temporal analysis on attempt {attempt_id}...")
    try:
        from ml.attention_model import predict_risk
        from services.rag_tutor import generate_dynamic_question, generate_gwen_hint
        import json
        
        # Simulated data
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
        
        if probability < 0.40:
            difficulty = "easy"
        elif probability > 0.80:
            difficulty = "hard"
        else:
            difficulty = "medium"
            
        villain = "Green Goblin"
        topic = "solving linear equations"

        question_json = generate_dynamic_question(villain, topic, difficulty)

        try:
            clean_json = question_json.strip()
            if clean_json.startswith("```json"): clean_json = clean_json[7:]
            if clean_json.endswith("```"): clean_json = clean_json[:-3]
            question_data = json.loads(clean_json.strip())
            actual_question_text = question_data.get("question", topic)
        except Exception as e:
            print(f"[AI] Failed to parse JSON: {e}")
            question_data = {}
            actual_question_text = topic

        hint = generate_gwen_hint(villain, actual_question_text, cognitive_state)
        return question_data, hint
            
    except Exception as e:
        print(f"[AI] LSTM or LLM inference failed: {e}")
        return {}, "Gwen: Comms are down, trust your spider-sense!"

@router.get("/start/{boss_id}")
def get_initial_question(boss_id: str):
    """Generates the very first AI question for a mission without needing a prior attempt."""
    from services.rag_tutor import generate_dynamic_question
    import json
    
    # Map boss ID to topic
    boss_topics = {
        'goblin': "solving linear equations",
        'doc-ock': "calculating area and perimeter",
        'mysterio': "number sequences and patterns",
        'venom': "percentages and fractions",
        'lizard': "radicals and exponents",
        'kingpin': "ratios and proportions"
    }
    boss_names = {
        'goblin': "Green Goblin",
        'doc-ock': "Doctor Octopus",
        'mysterio': "Mysterio",
        'venom': "Venom",
        'lizard': "The Lizard",
        'kingpin': "Kingpin"
    }
    
    topic = boss_topics.get(boss_id, "basic algebra")
    villain = boss_names.get(boss_id, "an unknown threat")
    
    question_json = generate_dynamic_question(villain, topic, "medium")
    
    try:
        clean_json = question_json.strip()
        if clean_json.startswith("```json"): clean_json = clean_json[7:]
        if clean_json.endswith("```"): clean_json = clean_json[:-3]
        question_data = json.loads(clean_json.strip())
    except Exception as e:
        print(f"[AI] Failed to parse JSON: {e}")
        question_data = {}
        
    return {"next_question": question_data, "gwen_hint": "Let's go Spider-Man! Focus on the problem!"}

@router.post("/", response_model=schemas.MissionAttemptResponse)
def submit_attempt(attempt: schemas.MissionAttemptCreate, user_id: int, db: Session = Depends(get_db)):
    db_attempt = models.MissionAttempt(
        userId=user_id,
        score=attempt.score,
        timeTaken=attempt.timeTaken,
        hintUsed=attempt.hintUsed
    )
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)
    
    question_data, gwen_hint = analyze_behavior(db_attempt.attemptId)
    
    return schemas.MissionAttemptResponse(
        attempt=db_attempt,
        next_question=question_data,
        gwen_hint=gwen_hint
    )
