from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from .db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    email = Column(String(256), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=True)
    role = Column(String(32), default="freelancer")

    profile = relationship("Profile", back_populates="user", uselist=False)

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    title = Column(String(256), nullable=True)
    bio = Column(Text, nullable=True)
    hourly_rate = Column(Float, nullable=True)
    completeness_pct = Column(Integer, default=0)

    user = relationship("User", back_populates="profile")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    skills = Column(Text, nullable=True)
    budget_min = Column(Integer, nullable=True)
    budget_max = Column(Integer, nullable=True)
    status = Column(String(32), default="open")

    client = relationship("User")


class Proposal(Base):
    __tablename__ = "proposals"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    freelancer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=True)
    duration_days = Column(Integer, nullable=True)
    cover_message = Column(Text, nullable=True)
    score = Column(Integer, nullable=True)

    project = relationship("Project")
    freelancer = relationship("User")
