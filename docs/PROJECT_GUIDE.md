# CppBook Project Guide

This document explains the current CppBook project file by file, how the application starts, how each feature works, and which files are generated rather than maintained by hand.

## 1. What CppBook Is

CppBook is a local Jupyter-like notebook IDE for C++. A notebook contains code cells and Markdown cells. Code is compiled and executed locally through a C++ compiler. The application has three main runtime layers:

```text
Electron desktop window
        |
React + TypeScript frontend
        |
FastAPI backend
        |
Temporary C++ source -> compiler -> executable
```

The backend does not run C++ inside Python. It creates a temporary C++ program, compiles it, runs the executable, captures the output, and returns structured results to the frontend.

## 2. Complete Runtime Flow

### Development startup

`npm run dev` starts two processes through `concurrently`:

1. `backend/dev.py` starts FastAPI on port 8000 with reload enabled.
2. Vite starts the frontend on port 5173.
3. Vite proxies `/api` requests to the backend.
4. The browser loads `frontend/index.html` and React mounts the application.

### Desktop startup

`npm run desktop:dev` first builds the frontend and then opens Electron:

1. `electron/main.cjs` selects an available local port.
2. Electron starts `backend/serve.py`, or the packaged backend executable.
3. The backend receives `BACKEND_PORT`, `CPPBOOK_API_BASE_URL`, and `WORKSPACE_DIR`.
4. Electron waits for `/api/health` to return HTTP 200.
5. Electron loads the built `dist/index.html`.
6. `electron/preload.cjs` exposes the API URL as `window.cppbook.apiBaseUrl`.
7. React sends requests to the local backend.
8. When Electron closes, it terminates the backend process.

### Frontend initialization

`useNotebookController` performs the initial frontend setup:

1. Reads recent notebook IDs from `localStorage`.
2. Reads the selected theme from `localStorage`.
3. Calls `/api/compiler`.
4. Calls `/api/kernel/start`.
5. Calls `/api/notebooks`.
6. Stores compiler and notebook information in React state.
7. Shows the Home page.

## 3. Root Files

### `package.json`

The JavaScript project manifest. It defines dependencies, npm scripts, and Electron Builder packaging.

Important scripts:

- `dev`: starts backend and frontend together.
- `frontend:dev`: starts Vite.
- `backend:dev`: starts the reload-enabled backend.
- `backend:serve`: starts the production-style backend.
- `build`: creates the frontend build in `dist/`.
- `test`: runs backend tests and then builds the frontend.
- `desktop:backend`: packages Python with PyInstaller.
- `desktop:dev`: builds the frontend and launches Electron.
- `desktop:dist`: builds the frontend, packages Python, and creates the installer.
- `compiler:check`: runs the compiler setup script.

The `build` section tells Electron Builder to include the frontend, Electron files, backend executable/source, notebooks, and compiler scripts.

### `package-lock.json`

Locks exact npm dependency versions so installations are repeatable.

### `.env.example`

Example environment configuration:

- `BACKEND_PORT`: FastAPI port in development.
- `FRONTEND_PORT`: Vite port.
- `CPP_COMPILER`: optional compiler path.
- `EXECUTION_TIMEOUT`: maximum execution time.
- `WORKSPACE_DIR`: notebook/project workspace.
- `CPP_STANDARD`: C++ language standard, normally `c++17`.
- `VITE_API_BASE_URL`: frontend API location.
- `VITE_ENABLE_VARIABLE_INSPECTOR`: enables the experimental inspector UI.

### `.gitignore`

Excludes virtual environments, caches, temporary execution files, dependency folders, and build outputs.

## 4. Backend Files

### `backend/dev.py`

Development entry point. It prefers `.venv`, adds `backend/` to Python's import path, and starts Uvicorn with reload enabled.

### `backend/serve.py`

Production and desktop entry point. It starts Uvicorn without reload on the port supplied by `BACKEND_PORT` or `CPPBOOK_BACKEND_PORT`.

### `backend/run_tests.py`

Test runner. It chooses the project virtual environment when available, creates an isolated `.tmp/pytest-*` directory, disables the pytest cache plugin, and runs `backend/tests`.

### `backend/requirements.txt`

Python dependencies:

- FastAPI and Uvicorn: HTTP/WebSocket server.
- Pydantic: request and response validation.
- python-multipart: uploaded-file support.
- pytest and httpx: tests and API client support.
- PyInstaller: desktop backend executable.
- ReportLab: PDF export.

### `backend/app/__init__.py`

Marks `app` as a Python package. It contains no application logic.

### `backend/app/main.py`

Creates the FastAPI application. It:

- Sets the API title and version.
- Configures CORS for the frontend development port.
- Includes the router from `app/api/routes.py`.

### `backend/app/config.py`

Loads environment-based settings into the `Settings` model. It calculates:

- Workspace directory.
- `notebooks/` directory.
- `examples/` directory.
- Compiler configuration.
- Execution timeout.
- C++ standard.
- Variable inspector flag.

`get_settings()` is cached so the backend uses one consistent configuration instance.

### `backend/app/dependencies.py`

Creates shared backend services at import time:

- `notebook_repository` for notebook files.
- `kernel_manager` for C++ execution.
- `ai_service` for environment-configured AI.

It also calls `ensure_examples()` so default example notebooks exist.

### `backend/app/api/__init__.py`

Marks the API directory as a package.

### `backend/app/api/routes.py`

Defines the public API. It is the backend's request-routing layer.

Health and environment:

- `GET /api/health`: confirms that FastAPI is running.
- `GET /api/compiler`: detects the compiler.

Kernel control:

- `POST /api/kernel/start`: reports the compile-replay mode.
- `POST /api/kernel/restart`: interrupts current work and resets the logical kernel.
- `POST /api/kernel/stop`: stops execution.
- `POST /api/kernel/interrupt`: terminates the active process.

Execution:

- `POST /api/execute`: executes one cell through the normal request/response path.
- `POST /api/execute/all`: executes code cells one by one.
- `WS /api/execute/interactive`: compiles and streams programs that need live stdin.

Notebook files:

- `GET /api/notebooks`: lists saved notebooks.
- `GET /api/notebooks/{id}`: loads one notebook.
- `POST /api/notebooks`: creates a notebook.
- `PUT /api/notebooks/{id}`: updates a notebook.
- `DELETE /api/notebooks/{id}`: deletes a notebook.
- `PATCH /api/notebooks/{id}/rename`: renames a notebook and its file ID.
- `POST /api/notebooks/import`: imports `.cpp`, `.cc`, `.cxx`, `.h`, `.hpp`, or `.cppnb`.
- `GET /api/notebooks/{id}/export`: exports generated C++.
- `GET /api/notebooks/{id}/export/cppnb`: exports notebook JSON.
- `GET /api/notebooks/{id}/export/pdf`: exports a PDF.

AI:

- `POST /api/ai/action`: explain, fix, optimize, or enhance a cell/notebook.
- `POST /api/ai/chat`: chat with notebook context.
- `POST /api/ai/test`: tests a Groq or Gemini key and model.

Project browsing:

- `GET /api/project/files`: returns allowed workspace files and directories.

### `backend/app/models/notebook.py`

Pydantic models for persisted notebook data:

- `NotebookDocument`: complete notebook.
- `NotebookMetadata`: name, description, creation time, update time.
- `NotebookCell`: source, type, outputs, status, execution count, timing.
- `CellOutput`: stdout, stderr, error, Markdown, or input output.
- `NotebookSummary`: lightweight list entry.
- `ProjectFile`: recursive file tree entry.

### `backend/app/models/execution.py`

Pydantic models for execution:

- `ExecutionCell`: the minimal cell sent to the compiler.
- `ExecuteRequest`: one-cell execution request.
- `ExecuteAllRequest`: multi-cell execution request.
- `ExecutionResult`: status, output, error, diagnostics, timing, and exit code.
- `ExecutionDiagnostic`: compiler location mapped to a notebook cell.
- `VariableSnapshot`: experimental variable data shape.
- `CompilerInfo`: compiler availability and version.

### `backend/app/models/ai.py`

Pydantic models for AI action requests, chat messages, provider credentials, and connection-test responses.

### `backend/app/execution/compiler.py`

Detects a compiler. It checks the configured compiler first and then searches for:

```text
g++
clang++
c++
```

It runs `--version` and returns the compiler name, path, version, and any error.

### `backend/app/execution/cpp_source.py`

Converts notebook cells into generated C++ source.

It:

- Deduplicates `#include` lines.
- Collects `using namespace` directives.
- Separates globals/functions/classes from executable statements.
- Preserves source locations with `#line` directives.
- Wraps executable statements in a generated `main()`.
- Redirects previous-cell output to silent buffers.
- Restores normal output for the target cell.
- Converts a user's `main()` into an internal function to avoid duplicate-main errors.
- Calls supported user mains with zero arguments or `(int, char**)` arguments.

This is the central compile-and-replay mechanism.

### `backend/app/execution/cpp_kernel.py`

Runs generated programs.

For one-cell execution:

1. Normalizes the cell list.
2. Detects missing stdin.
3. Detects a compiler.
4. Creates a temporary directory.
5. Writes `main.cpp`.
6. Compiles using the configured standard.
7. Runs the generated executable.
8. Captures stdout and stderr.
9. Parses diagnostics.
10. Deletes temporary files.

It also enforces timeouts and can terminate a Windows process tree or a Unix process group.

`execute_all()` calls `execute()` for each code cell and stops at the first failure unless `continueOnError` is enabled.

### `backend/app/notebook/repository.py`

Persists notebooks as JSON files with the `.cppnb` extension.

It handles:

- Safe notebook IDs using slugification.
- Save/load round trips.
- Creation and update timestamps.
- Duplicate-name IDs.
- Rename operations.
- C++ import into one code cell.
- Project file filtering.
- Example notebook creation.

It ignores `.git`, `.venv`, `node_modules`, caches, and build directories when listing project files.

### `backend/app/notebook/exporter.py`

Provides export functions:

- C++ export delegates to source generation.
- `.cppnb` export serializes JSON.
- PDF export uses ReportLab and includes cell source, Markdown, and saved outputs.

### `backend/app/ai/__init__.py`

Marks the AI directory as a package.

### `backend/app/ai/service.py`

Implements optional provider access.

The abstract `AIService` defines explain, fix, optimize, enhance, and chat operations. Concrete services support OpenAI-compatible APIs such as Groq and Gemini's native API format. The fallback service tries configured providers in order and turns provider/network failures into readable errors without exposing API keys.

## 5. Frontend Files

### `frontend/index.html`

Minimal HTML shell. It provides the `root` element and loads `src/main.tsx`.

### `frontend/vite.config.ts`

Configures Vite with:

- React plugin.
- `frontend/` as the source root.
- Relative production asset paths for Electron.
- `/api` proxy to FastAPI during development.
- `dist/` as the production output directory.

### `frontend/tsconfig.json`

Enables strict TypeScript checking, React JSX transformation, ES2020 APIs, and no emitted JavaScript.

### `frontend/tailwind.config.js`

Defines utility colors for the workbench and status signals, font families, and focus shadows.

### `frontend/postcss.config.js`

Runs Tailwind CSS and Autoprefixer.

### `frontend/src/main.tsx`

Creates the React root, enables `React.StrictMode`, renders `App`, and imports global styles.

### `frontend/src/styles.css`

Contains global layout rules, theme variables, toolbar styles, dialogs, output styling, responsive behavior, and visual states.

### `frontend/src/pages/App.tsx`

The top-level frontend component. It connects controller state to the visual components.

Responsibilities:

- Loads and saves UI settings in `localStorage`.
- Chooses Home or notebook view.
- Installs keyboard shortcuts.
- Starts interactive WebSocket cells.
- Buffers and displays terminal output.
- Handles fullscreen mode.
- Opens settings, command palette, and AI chat.
- Converts diagnostics into selected-cell navigation.
- Builds notebook context for AI.

Keyboard actions are configurable in Settings. The default shortcuts include save, save as, run cell, new code cell, and new Markdown cell.

### `frontend/src/hooks/useNotebookController.ts`

The main state machine. A reducer handles notebook edits and UI state, while action functions handle asynchronous API operations.

It manages:

- Current notebook and selected cell.
- Home/editor view.
- Themes.
- Kernel/compiler state.
- Saved and recent notebooks.
- Dirty and saving state.
- Autosave.
- Execution and interruption.
- Import/export.
- Project files.
- Variable snapshots.

Editing a cell marks the notebook dirty. Saved notebooks are autosaved after a short delay when no execution is active.

### `frontend/src/services/api.ts`

Typed HTTP client for the backend. It serializes notebook cells for execution, parses API errors, downloads export responses, and builds the WebSocket URL for interactive execution.

### `frontend/src/types/notebook.ts`

TypeScript interfaces matching backend notebook, execution, compiler, AI, and terminal models.

### `frontend/src/types/file-system-access.d.ts`

Adds TypeScript declarations for `showSaveFilePicker`, used when the browser supports the File System Access API.

### `frontend/src/utils/notebook.ts`

Utility functions for:

- Creating cells.
- Creating default notebooks.
- Ensuring a notebook has at least one cell.
- Downloading text files.
- Generating `.cppnb` filenames.
- Saving local notebook files.
- Importing C++ source into a frontend notebook object.
- Finding the next cell.

### `frontend/src/utils/monaco.ts`

Configures Monaco only once. It defines five editor themes and C++ completion snippets for `cout`, `cin`, vectors, loops, `main`, and classes.

## 6. UI Components

### `HomePage.tsx`

The starting screen. It displays new/open/continue/export actions, recent notebooks, compiler availability, search, and settings access.

### `NewNotebookDialog.tsx`

Collects a new notebook name and optional description, then calls the parent callback.

### `Toolbar.tsx`

Editor toolbar for notebook navigation and commands: new, open, save, save as, rename, export, run, stop, restart, settings, minimap, inspector, fullscreen, and command palette access.

### `NotebookCell.tsx`

Renders one cell. It chooses C++ or Markdown language mode, creates the Monaco editor, renders cell controls, displays status/timing, and passes output/terminal data to `OutputPanel`.

Cell actions include run, edit Markdown, change type, move, duplicate, clear output, delete, add code, add Markdown, and AI enhance.

### `OutputPanel.tsx`

Displays batch output and interactive output. It supports stdout, stderr, compiler errors, Markdown rendering, diagnostics, batch stdin, terminal input, terminal scrolling, exit codes, timing, and interrupt controls.

### `Sidebar.tsx`

Displays project files and notebook-related navigation when enabled by the surrounding layout.

### `CommandPalette.tsx`

Searchable command menu. It filters commands by group and label, focuses itself when opened, runs the first matching command on Enter, and closes on Escape or backdrop click.

### `SettingsPanel.tsx`

Controls themes, AI keys/models, editor behavior, autosave, continue-on-error, and keyboard shortcuts. Provider connection tests call `/api/ai/test`. Settings are persisted locally by `App.tsx`.

### `AIChatPanel.tsx`

Displays the conversation, sends messages, scrolls to the newest response, shows busy state, and renders fenced code with a copy button.

### `VariableInspector.tsx`

Displays `VariableSnapshot` values when the experimental inspector flag is enabled.

### `StatusPill.tsx`

Reusable status indicator for kernel and cell state.

### `IconButton.tsx`

Reusable icon button with optional text label, tooltip, active state, and disabled behavior.

### `CellActionButton.tsx`

Small reusable action button used in the cell toolbar.

## 7. User Features

### Create notebook

The user opens New Notebook, enters a name and description, and receives a notebook with one default C++ cell.

### Edit cells

Monaco provides syntax highlighting, folding, bracket matching, line numbers, snippets, minimap support, word wrapping, and theme-aware colors.

### Markdown

Markdown cells are rendered using React Markdown. They can be switched between Markdown and code types. Markdown is not compiled as C++.

### Run one cell

The frontend sends the complete cell list and target cell ID. The backend replays earlier cells silently and displays only the target cell output.

### Run all

The backend runs every code cell sequentially. It either stops on the first error or continues according to the Continue on error setting.

### Input

Cells containing common stdin functions use the interactive WebSocket terminal. The user can type input while the process is running and interrupt it without restarting the application.

### Save and autosave

New notebooks use `POST /api/notebooks`. Existing notebooks use `PUT /api/notebooks/{id}`. The backend stores them under the workspace's `notebooks/` directory. Saved notebook edits are autosaved after a delay.

### Local files

The frontend can import supported C++ and `.cppnb` files. Local save uses the File System Access API when available and falls back to a browser download.

### Export

The app exports generated C++, native `.cppnb` JSON, and PDF documents containing source, Markdown, and outputs.

### AI assistant

When enabled and configured, the assistant can explain, fix, optimize, enhance, and discuss notebook code. Groq is attempted first and Gemini can be used as fallback.

### Themes and settings

Themes, shortcut preferences, caret animation, toolbar captions, autosave, and continue-on-error are persisted locally in the browser/Electron renderer.

## 8. Electron Files

### `electron/main.cjs`

Electron main process. It finds a free port, starts the backend, waits for health, creates the browser window, loads the frontend, and kills the backend on exit. Node integration is disabled in the renderer and context isolation is enabled.

### `electron/preload.cjs`

Secure bridge. It exposes only the backend base URL and a desktop flag through `contextBridge`.

## 9. Tests

### `backend/tests/conftest.py`

Adds `backend/` to Python's import path so tests can import `app`.

### `backend/tests/test_api.py`

Checks the health endpoint and confirms invalid execution requests are rejected with HTTP 422.

### `backend/tests/test_cpp_kernel.py`

Checks:

- State replay across cells.
- Compiler diagnostics mapped to the correct cell.
- Runtime exception handling.
- User-defined `main()` rewriting.
- Stdin execution.
- Missing-input behavior.
- Timeout termination.

These tests are skipped when `g++` is unavailable.

### `backend/tests/test_exporter.py`

Checks include deduplication, generated `main()`, executable statements, and Markdown comments.

### `backend/tests/test_notebook_repository.py`

Checks save/load, malformed files, C++ import, rename behavior, and workspace file filtering.

Run tests with:

```text
npm test
```

This runs backend pytest tests and the frontend production build. There are currently no dedicated frontend component tests; frontend correctness is checked primarily through TypeScript/Vite compilation and manual UI testing.

## 10. Generated and Data Directories

These directories are not the main source of application behavior:

- `dist/`: generated Vite frontend build.
- `desktop-dist/`: PyInstaller executable and intermediate files.
- `installer-release/`: Electron Builder installer and unpacked Windows application.
- `node_modules/`: installed JavaScript dependencies.
- `.venv/`: local Python virtual environment.
- `.tmp/`: temporary test and execution-related files.
- `__pycache__/`: Python bytecode cache.

Do not manually edit generated build output. Change source files and run the appropriate build command instead.

The `notebooks/` directory contains `.cppnb` data files. Some are built-in examples; others may be saved user notebooks.

## 11. Security and Limitations

CppBook executes local native C++ code. It is suitable for local personal use but is not a hardened public sandbox.

Current protections include:

- Child-process execution.
- Temporary execution directories.
- Timeouts.
- Process interruption.
- Reduced child-process environment.
- Workspace-restricted project file listing.

It does not currently provide complete isolation against malicious native code. Public deployment would require stronger filesystem, CPU, memory, network, user, and operating-system sandboxing.

Other limitations:

- C++ is repeatedly compiled rather than interpreted persistently.
- Complex macros or unusual C++ layouts may confuse source splitting.
- Interactive stdin uses the WebSocket console.
- Variable inspection is experimental.
- A local C++ compiler is required to run code.
- The Windows installer is unsigned unless code signing is added.

## 12. Best Reading Order

For understanding the project efficiently, read these files in this order:

1. `docs/PROJECT_FLOW.md`
2. `frontend/src/pages/App.tsx`
3. `frontend/src/hooks/useNotebookController.ts`
4. `frontend/src/services/api.ts`
5. `backend/app/api/routes.py`
6. `backend/app/execution/cpp_kernel.py`
7. `backend/app/execution/cpp_source.py`
8. `backend/app/notebook/repository.py`
9. `electron/main.cjs`
10. `backend/tests/`
