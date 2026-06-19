@echo off
setlocal
set PROJECT_PATH=C:\Users\User\AppData\Roaming\npm\evalua-ia-simple
set PORT=5174

:menu
cls
echo ===================================================
echo        🛡️  GESTOR EVALUAIA-SIMPLE SEGURO  🛡️
echo ===================================================
echo  1. Iniciar Modo Desarrollo (Vite - puerto %PORT%)
echo  2. Iniciar Modo Seguro Produccion (Express + Anti-DDoS)
echo  3. Detener Todos los Servidores (Matar procesos)
echo  4. Salir
echo ===================================================
set /p choice="Selecciona una opcion (1-4): "

if "%choice%"=="1" goto start_dev
if "%choice%"=="2" goto start_prod
if "%choice%"=="3" goto stop_servers
if "%choice%"=="4" exit
goto menu

:start_dev
echo.
echo Iniciando servidor de desarrollo rapido en puerto %PORT%...
cd /d "%PROJECT_PATH%"
start cmd /k "title EvaluaIA-Dev && npm run dev -- --port %PORT%"
echo Servidor de desarrollo lanzado en segundo plano.
pause
goto menu

:start_prod
echo.
echo Compilando la aplicacion para produccion (npm run build)...
cd /d "%PROJECT_PATH%"
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: Fallo la compilacion. No se puede iniciar el servidor seguro.
    pause
    goto menu
)
echo.
echo Iniciando Servidor Express Seguro (Anti-DDoS activo)...
start cmd /k "title EvaluaIA-Secure-Backend && PORT=%PORT% npm run start"
echo Servidor de produccion seguro lanzado en http://localhost:%PORT%
pause
goto menu

:stop_servers
echo.
echo Deteniendo todos los servidores de desarrollo y produccion...
taskkill /f /fi "windowtitle eq EvaluaIA-Dev*" /t 2>nul
taskkill /f /fi "windowtitle eq EvaluaIA-Secure-Backend*" /t 2>nul
taskkill /f /im node.exe /t 2>nul
echo Servidores detenidos correctamente.
pause
goto menu
