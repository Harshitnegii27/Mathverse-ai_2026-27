from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    userId = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    role = Column(String, default="student") # student, teacher, parent
    points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    
    attempts = relationship("MissionAttempt", back_populates="user")
    mastery = relationship("TopicMastery", back_populates="user")

class Mission(Base):
    __tablename__ = "missions"
    missionId = Column(String, primary_key=True, index=True)
    topic = Column(String, index=True)
    difficulty = Column(Integer, default=1)
    
    questions = relationship("Question", back_populates="mission")

class Question(Base):
    __tablename__ = "questions"
    questionId = Column(Integer, primary_key=True, index=True)
    missionId = Column(String, ForeignKey("missions.missionId"))
    text = Column(String)
    difficulty = Column(Integer, default=1)
    
    mission = relationship("Mission", back_populates="questions")

class TopicMastery(Base):
    __tablename__ = "topic_mastery"
    masteryId = Column(Integer, primary_key=True, index=True)
    userId = Column(Integer, ForeignKey("users.userId"))
    topic = Column(String, index=True)
    masteryLevel = Column(Float, default=0.0)
    
    user = relationship("User", back_populates="mastery")

class MissionAttempt(Base):
    __tablename__ = "mission_attempts"
    attemptId = Column(Integer, primary_key=True, index=True)
    userId = Column(Integer, ForeignKey("users.userId"))
    score = Column(Integer, default=0)
    timeTaken = Column(Integer, default=0)
    hintUsed = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="attempts")
    hints = relationship("HintHistory", back_populates="attempt")

class HintHistory(Base):
    __tablename__ = "hint_history"
    hintId = Column(Integer, primary_key=True, index=True)
    attemptId = Column(Integer, ForeignKey("mission_attempts.attemptId"))
    hintText = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    attempt = relationship("MissionAttempt", back_populates="hints")

class LearningReport(Base):
    __tablename__ = "learning_reports"
    reportId = Column(Integer, primary_key=True, index=True)
    userId = Column(Integer, ForeignKey("users.userId"))
    totalScore = Column(Integer)
    badges = Column(String) # Stored as comma-separated list or JSON string for simplicity
    
class Badge(Base):
    __tablename__ = "badges"
    badgeId = Column(Integer, primary_key=True, index=True)
    criteria = Column(String)
