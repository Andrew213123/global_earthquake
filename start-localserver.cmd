@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-localserver.ps1" >> ".localserver\run-8123-stdout.log" 2>> ".localserver\run-8123-stderr.log"
