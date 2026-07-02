@echo off
cd /d %~dp0
call backend\venv\Scripts\activate 2>nul
python -m uvicorn backend.main:app --reload
