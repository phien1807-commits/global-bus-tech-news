@echo off
chcp 65001 >nul
echo ========================================================
echo  BUSTECH PULSE - CAP NHAT VA MO WEBSITE TIN TUC XE BUS
echo ========================================================
echo.
echo [*] Dang cap nhat tin tuc tu cac nguon quoc te...
powershell -ExecutionPolicy Bypass -File "%~dp0update-news.ps1"
echo.
echo [*] Dang mo website tren trinh duyet mac dinh...
start "" "%~dp0index.html"
echo.
echo [V] Hoan tat!
pause
