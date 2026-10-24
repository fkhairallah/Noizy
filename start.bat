@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed. Install the LTS version from https://nodejs.org and run this file again.
  pause
  exit /b 1
)
if exist src\visual\scene.ts.part00 (
  node join-scene.cjs
  if errorlevel 1 (
    echo Could not prepare the drawing file.
    pause
    exit /b 1
  )
)
if not exist node_modules (
  echo Installing Noizy...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)
echo.
echo Noizy is starting. Your browser will open in a moment.
echo Wiggle the mouse or press any key to start the sound.
echo Turn up the Windows volume if it is quiet. Close this window to stop.
echo.
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:47321"
call npm run dev
pause
