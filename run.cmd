@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "CLIENT=%ROOT%client"

echo Starting TalentStageX database...
where docker >nul 2>nul
if %errorlevel%==0 (
	start "TalentStageX DB" /min /D "%BACKEND%" cmd /c docker compose -f docker-compose.yml up -d
) else (
	echo Docker not found, using local SQLite database.
)

echo Starting TalentStageX backend API...
start "TalentStageX API" /D "%BACKEND%" cmd /k py -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

echo Starting TalentStageX frontend...
where npm >nul 2>nul
if %errorlevel%==0 (
	if not exist "%CLIENT%\node_modules\" (
		echo Installing frontend dependencies...
		pushd "%CLIENT%"
		call npm install
		popd
	)
	start "TalentStageX Frontend" /D "%CLIENT%" cmd /k npm run dev
) else (
	echo npm not found. Install Node.js to run the Next.js frontend.
)

echo.
echo TalentStageX is starting.
echo Frontend:    http://localhost:3000
echo Backend API: http://localhost:8000
echo.
pause
