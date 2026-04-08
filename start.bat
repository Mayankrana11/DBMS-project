@echo off

REM Start backend server
start cmd /k "cd backend && node server.js"

REM Start frontend dev server
start cmd /k "cd frontend && npm run dev"