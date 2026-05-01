from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    age = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    results = relationship("ScreeningResult", back_populates="owner")

class ScreeningResult(Base):
    __tablename__ = "screening_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Feature scores
    memory_accuracy = Column(Float)
    reaction_time = Column(Float)
    attention_accuracy = Column(Float)
    speech_rate = Column(Float)
    pause_duration = Column(Float)
    pitch_variance = Column(Float)
    task_completion_time = Column(Float)
    age = Column(Integer)
    
    # Risk prediction
    risk_level = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="results")
