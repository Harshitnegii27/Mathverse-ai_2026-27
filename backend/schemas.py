from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Users
class UserBase(BaseModel):
    name: str
    role: str = "student"

class UserCreate(UserBase):
    pass

class User(UserBase):
    userId: int
    points: int
    level: int
    class Config:
        from_attributes = True

# Missions
class MissionBase(BaseModel):
    missionId: str
    topic: str
    difficulty: int

class Mission(MissionBase):
    class Config:
        from_attributes = True

# Questions
class QuestionBase(BaseModel):
    text: str
    difficulty: int

class Question(QuestionBase):
    questionId: int
    missionId: str
    class Config:
        from_attributes = True

# Topic Mastery
class TopicMasteryBase(BaseModel):
    topic: str
    masteryLevel: float

class TopicMastery(TopicMasteryBase):
    masteryId: int
    userId: int
    class Config:
        from_attributes = True

# Attempts
class MissionAttemptBase(BaseModel):
    score: int
    timeTaken: int
    hintUsed: bool

class MissionAttemptCreate(MissionAttemptBase):
    pass

class MissionAttempt(MissionAttemptBase):
    attemptId: int
    userId: int
    timestamp: datetime
    class Config:
        from_attributes = True

# Hint History
class HintHistoryBase(BaseModel):
    hintText: str

class HintHistory(HintHistoryBase):
    hintId: int
    attemptId: int
    timestamp: datetime
    class Config:
        orm_mode = True

# Reports
class LearningReportBase(BaseModel):
    totalScore: int
    badges: str

class LearningReport(LearningReportBase):
    reportId: int
    userId: int
    class Config:
        orm_mode = True
