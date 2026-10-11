@echo off
rem EasyHub launcher - zero npm dependency, reuses the raccoon-pet electron runtime.
set "ELECTRON=E:\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a9ac8b70b064143c7560d5f\raccoon-pet\node_modules\electron\dist\electron.exe"
if not exist "%ELECTRON%" (
  echo [ERROR] electron.exe not found:
  echo   %ELECTRON%
  pause
  exit /b 1
)
start "" "%ELECTRON%" "%~dp0."
