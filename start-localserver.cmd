@echo off
cd /d C:\Users\Administrator\Desktop\project
set QUAKE_SERVER_URL=http://127.0.0.1:8123
".\.localserver\bin\sqlite-patched\StaticServer.exe" >> ".localserver\run-8123-stdout.log" 2>> ".localserver\run-8123-stderr.log"
