@echo off
echo Closing processes that may lock files...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Removing node_modules...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo Installing dependencies...
call npm install

echo.
echo Done. Run: npm run dev
pause
