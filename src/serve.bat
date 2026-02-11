@echo off
echo Starting blog server at http://localhost:4000
echo Press Ctrl+C to stop
cd /d "%~dp0"
node serve.js
