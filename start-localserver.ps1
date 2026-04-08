$ErrorActionPreference = "Stop"

Set-Location "C:\Users\Administrator\Desktop\project"
$env:QUAKE_SERVER_URL = "http://127.0.0.1:8123"

& ".\.localserver\bin\sqlite-patched\StaticServer.exe"
