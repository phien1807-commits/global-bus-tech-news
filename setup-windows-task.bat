@echo off
chcp 65001 >nul
echo ======================================================================
echo  CAI DAT LICH TU DONG CAP NHAT TIN TUC XE BUS (WINDOWS TASK SCHEDULER)
echo ======================================================================
echo.
echo Script nay se tao mot tac vu trong Windows Task Scheduler de tu dong chay
echo cào tin tức xe bus toan cau vao lúc 07:00 sang moi ngay.
echo.
set TASK_NAME=BusTechNewsDailyUpdate
set SCRIPT_PATH=%~dp0update-news.ps1

schtasks /create /tn "%TASK_NAME%" /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File \"%SCRIPT_PATH%\"" /sc daily /st 07:00 /f

if %errorlevel% equ 0 (
    echo.
    echo [V] DA CAI DAT THANH CONG!
    echo Tu bay gio, he thong se tu dong cap nhat tin tuc moi luc 07:00 sang hang ngay.
) else (
    echo.
    echo [!] Vui long chay file nay voi quyen Administrator (Run as Administrator).
)
echo.
pause
