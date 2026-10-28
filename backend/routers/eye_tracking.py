import os
import base64
import time
from typing import Dict, List, Optional
import numpy as np
import cv2
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ml.eye_tracker import EyeTracker, ensure_model

router = APIRouter(
    prefix="/eye-track",
    tags=["eye-tracking"],
)

class FramePayload(BaseModel):
    user_id: int = 1
    image_base64: str  # Data URL or raw base64 string (JPEG/PNG)

class SimulatePayload(BaseModel):
    user_id: int = 1
    state: str  # "Focused" | "Drifting" | "Impulsive" | "Overwhelmed"
    blink_rate: Optional[float] = None
    pupil_dilation: Optional[float] = None

# In-memory storage for active user telemetry sessions
class UserTelemetrySession:
    def __init__(self, user_id: int):
        self.user_id = user_id
        model_path = ensure_model()
        self.tracker = EyeTracker(model_path=model_path, window_size=15)
        self.latest_result: Dict = {
            "attention_state": "Focused",
            "confidence": 0.85,
            "metrics": {
                "blink_rate": 18.0,
                "pupil_dilation": 5.0,
                "fixation_duration": 400.0,
                "saccade_rate": 1.8,
                "gaze_stability": 0.92
            },
            "blink_count": 0,
            "avg_ear": 0.28
        }
        self.history: List[Dict] = []
        self.last_updated = time.time()

    def update_with_frame(self, bgr_image: np.ndarray) -> Dict:
        result = self.tracker.process_frame(bgr_image)
        self.latest_result = result
        self.last_updated = time.time()
        
        # Keep rolling snapshot
        m = result.get("metrics", {})
        row = {
            "attention_state_eye": result.get("attention_state", "Focused"),
            "eye_blink_rate": m.get("blink_rate", 20.0),
            "eye_pupil_dilation": m.get("pupil_dilation", 0.0),
            "eye_fixation_duration": m.get("fixation_duration", 300.0),
            "eye_saccade_rate": m.get("saccade_rate", 2.0),
            "eye_gaze_stability": m.get("gaze_stability", 1.0),
            "correct": 1,
            "response_time_s": 15.0
        }
        self.history.append(row)
        if len(self.history) > 50:
            self.history.pop(0)
            
        return result

    def set_simulated_state(self, state: str, blink_rate: Optional[float] = None, pupil_dilation: Optional[float] = None):
        defaults = {
            "Focused": {"blink_rate": 18.0, "pupil_dilation": 5.0, "fixation_duration": 450.0, "saccade_rate": 1.5, "gaze_stability": 0.95},
            "Drifting": {"blink_rate": 35.0, "pupil_dilation": -5.0, "fixation_duration": 120.0, "saccade_rate": 4.5, "gaze_stability": 0.45},
            "Impulsive": {"blink_rate": 42.0, "pupil_dilation": 20.0, "fixation_duration": 80.0, "saccade_rate": 7.0, "gaze_stability": 0.55},
            "Overwhelmed": {"blink_rate": 8.0, "pupil_dilation": 35.0, "fixation_duration": 1200.0, "saccade_rate": 0.6, "gaze_stability": 0.80}
        }
        m = defaults.get(state, defaults["Focused"])
        if blink_rate is not None:
            m["blink_rate"] = blink_rate
        if pupil_dilation is not None:
            m["pupil_dilation"] = pupil_dilation
            
        self.latest_result = {
            "attention_state": state,
            "confidence": 0.92,
            "metrics": m,
            "blink_count": int(m["blink_rate"]),
            "avg_ear": 0.28
        }
        self.last_updated = time.time()
        self.history.append({
            "attention_state_eye": state,
            "eye_blink_rate": m["blink_rate"],
            "eye_pupil_dilation": m["pupil_dilation"],
            "eye_fixation_duration": m["fixation_duration"],
            "eye_saccade_rate": m["saccade_rate"],
            "eye_gaze_stability": m["gaze_stability"],
            "correct": 1,
            "response_time_s": 15.0
        })

active_sessions: Dict[int, UserTelemetrySession] = {}

def get_or_create_session(user_id: int) -> UserTelemetrySession:
    if user_id not in active_sessions:
        active_sessions[user_id] = UserTelemetrySession(user_id)
    return active_sessions[user_id]

def get_user_latest_telemetry(user_id: int) -> Dict:
    session = get_or_create_session(user_id)
    return session.latest_result

def get_user_eye_history(user_id: int) -> List[Dict]:
    session = get_or_create_session(user_id)
    return session.history

@router.post("/frame")
def process_client_frame(payload: FramePayload):
    """
    Receives base64 image frame from browser webcam,
    runs facial landmark & iris tracking, and updates cognitive state.
    Computes real-time LSTM risk prediction based on rolling attention sequence.
    """
    try:
        session = get_or_create_session(payload.user_id)
        img_str = payload.image_base64
        if "," in img_str:
            img_str = img_str.split(",", 1)[1]
            
        img_bytes = base64.b64decode(img_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image encoding")
            
        result = session.update_with_frame(frame)
        
        # Live LSTM inference on user's rolling attention records
        from ml.attention_model import predict_risk
        lstm_prob = predict_risk(session.history)
        
        return {
            "success": True,
            "user_id": payload.user_id,
            "telemetry": result,
            "predicted_probability": round(float(lstm_prob), 3)
        }
    except Exception as e:
        print(f"[EyeTrackRouter] Frame processing error: {e}")
        from ml.attention_model import predict_risk
        hist = session.history if 'session' in locals() else []
        lstm_prob = predict_risk(hist) if hist else 0.70
        return {
            "success": False,
            "error": str(e),
            "telemetry": get_user_latest_telemetry(payload.user_id),
            "predicted_probability": round(float(lstm_prob), 3)
        }

@router.get("/status/{user_id}")
def get_status(user_id: int):
    """Returns current real-time attention state & 5 eye tracking metrics."""
    session = get_or_create_session(user_id)
    return {
        "user_id": user_id,
        "telemetry": session.latest_result,
        "history_count": len(session.history),
        "last_updated": session.last_updated
    }

@router.post("/simulate")
def simulate_state(payload: SimulatePayload):
    """Allows manual simulation of cognitive states (for testing and demoing adaptive Gwen hints)."""
    session = get_or_create_session(payload.user_id)
    session.set_simulated_state(payload.state, payload.blink_rate, payload.pupil_dilation)
    from ml.attention_model import predict_risk
    prob = predict_risk(session.history)
    return {
        "success": True,
        "message": f"User {payload.user_id} cognitive state set to {payload.state}",
        "telemetry": session.latest_result,
        "predicted_probability": round(float(prob), 3)
    }

