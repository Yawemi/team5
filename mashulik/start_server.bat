@echo off
echo Установка зависимостей...
pip install -r requirements.txt

echo.
echo Запуск сервера...
python server.py
pause