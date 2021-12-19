@echo off

if "%RUN%"=="" set RUN=%CD%\run
if "%STUFF%"=="" set STUFF=%CD%\stuff

call %RUN% :init_colors

:check_run_mode
    if "%*"=="" (       
        call :run_executable 
    ) else (
        call :run_library %*
    )
    goto :eof

:run_executable
    rem run stuff.bat as executable script
    call %RUN% :color ‘%CL_INFO%‘ ‘This is not executable script. Please use 'run.bat' only.‘
    call %RUN% :ask   
    goto :eof

:run_library
    rem run stuff.bat as library
    call %*     
    goto :eof          

:settings
    if "%INSTALL_LOCALLY%"=="true" ( set NODE_HOME=)

    if "%NODE_HOME%"==""   ( set NO_NODE=true)
    if "%NO_NODE%"=="true" ( set NODE_HOME=%ROOT%\.node)
    if "%NO_NODE%"=="true" ( set PATH=%NODE_HOME%\;%PATH%)

    set NPM=%NODE_HOME%\npm

    echo Language environment variables
    call %RUN% :color ‘%CL_INFO%‘ ‘PATH=%PATH%‘
    call %RUN% :color ‘%CL_INFO%‘ ‘NODE_HOME=%NODE_HOME%‘

    set ARCH_URL=https://nodejs.org/dist/v14.17.0/node-v14.17.0-win-x64.zip
    set ARCH_FOLDER=node-v14.17.0-win-x64
    goto :eof

:install
    if exist %TOOLS%\..\node_modules (
        call %RUN% :eval_echo ‘rd /S /Q %TOOLS%\..\node_modules‘
    )
    call %RUN% :install node %ARCH_URL% %ARCH_FOLDER%
    goto :eof

:version
    call %RUN% :eval_echo_color ‘%NPM% -v‘
    goto :eof

:build
    call %RUN% :eval_echo ‘%NPM% install‘
    goto :eof

:test    
    call %RUN% :eval_echo ‘%NPM% test‘
    echo.
    goto :eof

:run
    call %RUN% :eval_echo ‘%NPM% start %GAME_TO_RUN% %SERVER_URL%‘
    goto :eof