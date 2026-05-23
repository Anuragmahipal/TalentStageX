@echo off
setlocal

cd /d "%~dp0backend"

echo Starting TalentStageX backend API...
py -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000