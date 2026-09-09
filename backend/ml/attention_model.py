import torch
import torch.nn as nn
import numpy as np
from typing import List, Dict

class AdaptiveDifficultyLSTM(nn.Module):
    """
    Deep Knowledge Tracing variant that incorporates eye-tracking metrics.
    Predicts the probability of the student answering the next question correctly.
    """
    def __init__(self, input_size=11, hidden_size=32, num_layers=1):
        super(AdaptiveDifficultyLSTM, self).__init__()
        self.hidden_size = hidden_size
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        # x shape: (batch_size, sequence_length, input_size)
        lstm_out, _ = self.lstm(x)
        # Take the output of the last time step
        last_out = lstm_out[:, -1, :]
        out = self.fc(last_out)
        return self.sigmoid(out)

# Singleton instance of the model
# In a real app, you would load pre-trained weights here (e.g., model.load_state_dict(...))
model = AdaptiveDifficultyLSTM()
model.eval()

# One-hot encoding map for cognitive states
STATE_MAP = {
    "Focused": [1.0, 0.0, 0.0, 0.0],
    "Drifting": [0.0, 1.0, 0.0, 0.0],
    "Impulsive": [0.0, 0.0, 1.0, 0.0],
    "Overwhelmed": [0.0, 0.0, 0.0, 1.0]
}

def preprocess_history(history: List[Dict]) -> torch.Tensor:
    """
    Converts a list of dicts from the eye_tracker and attempt records into a normalized tensor.
    """
    seq = []
    for record in history:
        # 1. Performance metrics
        correct = float(record.get('correct', 0))
        # Normalize response time (assuming 60s is typical max)
        rt = min(record.get('response_time_s', 0.0) / 60.0, 1.0)
        
        # 2. Categorical eye state
        state = record.get('attention_state_eye', 'Focused')
        state_encoded = STATE_MAP.get(state, [1.0, 0.0, 0.0, 0.0])
        
        # 3. Continuous eye metrics (rough heuristic normalization)
        blink = record.get('eye_blink_rate', 20.0) / 60.0
        pupil = record.get('eye_pupil_dilation', 0.0) / 100.0
        fix = record.get('eye_fixation_duration', 300.0) / 2000.0
        saccade = record.get('eye_saccade_rate', 2.0) / 10.0
        gaze = record.get('eye_gaze_stability', 1.0)
        
        features = [correct, rt] + state_encoded + [blink, pupil, fix, saccade, gaze]
        seq.append(features)
        
    # If history is empty (first attempt), provide a dummy 'baseline' row
    if not seq:
        seq.append([0.5, 0.5] + STATE_MAP["Focused"] + [0.3, 0.0, 0.15, 0.2, 1.0])
        
    # Shape: (batch_size=1, sequence_length, input_size)
    return torch.tensor([seq], dtype=torch.float32)

def predict_risk(user_history: List[Dict]) -> float:
    """
    Returns the probability (0.0 to 1.0) of the student getting the next question correct.
    
    Higher probability = lower risk (student is doing well).
    Lower probability = higher risk (needs easier question / hint).
    """
    with torch.no_grad():
        x = preprocess_history(user_history)
        prediction = model(x)
        return prediction.item()
