@echo off
echo Starting EVM API Flask Application...

REM Set the absolute path to your project directory
set PROJECT_DIR="c:\Users\SNQU-0245\Documents\evm_api\evm_api_flask"

REM Change to the project directory
cd /d %PROJECT_DIR%

REM Try to activate virtual environment
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call "venv\Scripts\activate.bat"
) else (
    goto :no_venv
)

goto :run_app

:no_venv
echo Virtual environment (venv) not found. Using system Python.

:run_app
REM Run Flask application
echo Running app.py...
python app.py

echo Application stopped.
pause
