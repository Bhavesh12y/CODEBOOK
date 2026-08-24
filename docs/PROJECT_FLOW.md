# CppBook Project Flow

This document explains the complete flow of CppBook: what the project is, how each part works, how the notebook executes C++ code, how files are saved and opened, how the desktop app runs its own server, and how a user can use the software even without setting up a development environment.

## 1. Product Goal

CppBook is a local Jupyter-like notebook for C++.

The user should be able to:

- Create C++ notebooks with code and markdown cells.
- Run one cell or all cells.
- See stdout, stderr, compiler errors, runtime errors, status, and timing below each cell.
- Save notebooks inside the app.
- Save/open notebooks from the local computer.
- Import `.cpp`, `.cc`, `.cxx`, `.hpp`, `.h`, and `.cppnb` files.
- Export a notebook to a `.cpp` source file.
- Use a desktop app where the server starts automatically.
- Install the app with an `.exe` without manually running frontend/backend commands.

The main idea is simple: the user sees one desktop app, but internally CppBook has a frontend UI, a backend API, and a C++ execution engine.

## 2. High-Level Architecture

CppBook has four main layers.

```text
User
  |
  v
Electron Desktop App
  |
  v
React Frontend UI
  |
  v
FastAPI Backend Server
  |
  v
C++ Compiler and Execution Kernel
```

In development mode, the frontend and backend can run as normal local servers.

In desktop mode, Electron starts the backend automatically and loads the built frontend inside a desktop window.

## 3. Repository Structure

```text
backend/
  serve.py
  dev.py
  app/
    main.py
    config.py
    dependencies.py
    api/
      routes.py
    execution/
      compiler.py
      cpp_kernel.py
      cpp_source.py
    models/
      execution.py
      notebook.py
    notebook/
      repository.py
      exporter.py
    ai/
      service.py
  tests/

frontend/
  index.html
  vite.config.ts
  src/
    main.tsx
    styles.css
    pages/
      App.tsx
    hooks/
      useNotebookController.ts
    services/
      api.ts
    components/
      HomePage.tsx
      NewNotebookDialog.tsx
      Toolbar.tsx
      NotebookCell.tsx
      OutputPanel.tsx
      CommandPalette.tsx
      VariableInspector.tsx
    types/
      notebook.ts
      file-system-access.d.ts
    utils/
      notebook.ts
      monaco.ts

electron/
  main.cjs
  preload.cjs

notebooks/
  *.cppnb

tools/
  check-compiler.ps1
  check-compiler.cmd

dist/
  production frontend build

desktop-dist/
  PyInstaller backend executable output

installer-release/
  Windows installer output
```

## 4. Frontend Flow

The frontend is a React and TypeScript app built with Vite.

Important frontend files:

- `frontend/src/pages/App.tsx`: top-level app shell.
- `frontend/src/hooks/useNotebookController.ts`: main state reducer and all notebook actions.
- `frontend/src/services/api.ts`: frontend API client.
- `frontend/src/components/HomePage.tsx`: home page with new/open/recent actions.
- `frontend/src/components/NewNotebookDialog.tsx`: popup for creating a notebook with name and description.
- `frontend/src/components/NotebookCell.tsx`: cell editor and cell controls.
- `frontend/src/components/Toolbar.tsx`: notebook toolbar.
- `frontend/src/styles.css`: global UI and theme styling.

### 4.1 App Startup

When the frontend starts:

1. It loads the initial notebook state.
2. It reads recent notebook IDs from `localStorage`.
3. It reads the saved theme from `localStorage`.
4. It calls the backend compiler endpoint.
5. It starts the backend kernel.
6. It loads the saved notebook list.
7. It shows the Home page.

### 4.2 Home Page Flow

The Home page is designed to be the first simple entry point.

User actions:

- `New Notebook`: opens the create notebook popup.
- `Open Local`: opens a local `.cpp`, `.hpp`, or `.cppnb` file.
- `Continue`: returns to the current notebook.
- `Save Copy`: saves the current notebook to the local PC.
- Recent notebook row: opens a saved notebook.
- Rename icon: renames a saved notebook.
- Search notebooks: opens the command palette.

The editor toolbar is hidden on the Home page to keep the first screen clean.

### 4.3 New Notebook Flow

When the user clicks `New Notebook`:

1. A dialog opens.
2. User enters notebook name.
3. User optionally enters description.
4. User clicks `Create`.
5. The app creates a new notebook object with one code cell.
6. The view switches to the notebook editor.

New notebook default code:

```cpp
#include <iostream>
using namespace std;

cout << "Hello CppBook";
```

### 4.4 Notebook State

The main notebook state lives in `useNotebookController.ts`.

State includes:

- Current notebook.
- Current view: `home` or `notebook`.
- Current theme: `dark` or `light`.
- Selected cell ID.
- Kernel status.
- Saved notebooks list.
- Recent notebooks list.
- Dirty/saving status.
- Running cell ID.
- Command palette state.
- Minimap state.
- Variable inspector state.
- Continue-on-error setting.
- Status text.

### 4.5 Autosave

Autosave is active for notebooks that already have an ID.

Flow:

1. User edits a saved notebook.
2. The notebook becomes dirty.
3. The app waits briefly.
4. If no cell is running and no save is already active, it saves automatically.
5. The header shows one of these states:
   - `Autosave pending`
   - `Autosaving`
   - `Autosaved`

Unsaved new notebooks still need an initial save, because the backend must create an ID first.

### 4.6 Keyboard Shortcuts

Shortcuts are handled globally in `App.tsx`.

Current shortcuts:

- `Ctrl/Cmd + S`: save notebook.
- `Ctrl/Cmd + O`: open local file picker.
- `Ctrl/Cmd + Shift + P`: command palette.
- `Ctrl/Cmd + Enter`: run selected cell.
- `Shift + Enter`: run selected cell and select next.
- `Alt + Enter`: run selected cell and insert a new code cell below.
- `Escape`: close command palette.

The shortcut handler uses refs for the latest state/actions so shortcuts work reliably even after React re-renders.

## 5. Backend Flow

The backend is a FastAPI app.

Important backend files:

- `backend/app/main.py`: FastAPI app creation and middleware.
- `backend/app/api/routes.py`: API routes.
- `backend/app/config.py`: environment-based settings.
- `backend/app/dependencies.py`: shared kernel manager and notebook repository.
- `backend/serve.py`: production/desktop backend entry point.
- `backend/dev.py`: development backend entry point.

### 5.1 API Routes

The backend exposes routes under `/api`.

Core routes:

- `GET /api/health`: backend health check.
- `GET /api/compiler`: detect compiler.
- `POST /api/kernel/start`: start kernel.
- `POST /api/kernel/restart`: restart kernel.
- `POST /api/kernel/stop`: stop kernel.
- `POST /api/kernel/interrupt`: interrupt running execution.
- `POST /api/execute`: run one cell.
- `POST /api/execute/all`: run all cells.
- `GET /api/notebooks`: list saved notebooks.
- `GET /api/notebooks/{id}`: load notebook.
- `POST /api/notebooks`: create notebook.
- `PUT /api/notebooks/{id}`: update notebook.
- `DELETE /api/notebooks/{id}`: delete notebook.
- `PATCH /api/notebooks/{id}/rename`: rename notebook.
- `POST /api/notebooks/import`: import local file.
- `GET /api/notebooks/{id}/export`: export notebook to `.cpp`.
- `GET /api/project/files`: list allowed project files.

## 6. Notebook File Model

CppBook notebooks use `.cppnb` files.

A notebook contains:

```json
{
  "version": 1,
  "id": "notebook-id",
  "metadata": {
    "name": "Notebook Name",
    "description": "Optional description",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  },
  "cells": [
    {
      "id": "cell-id",
      "type": "code",
      "source": "C++ source",
      "outputs": [],
      "executionCount": null,
      "status": "idle",
      "executionTime": null
    }
  ]
}
```

Cell types:

- `code`: C++ code.
- `markdown`: notes, explanation, headings, etc.

Cell statuses:

- `idle`
- `running`
- `success`
- `error`
- `stopped`

## 7. Notebook Persistence

Saved notebooks are managed by `backend/app/notebook/repository.py`.

Flow for saving:

1. Frontend sends notebook JSON to backend.
2. Backend validates the notebook with Pydantic models.
3. Backend assigns or keeps the notebook ID.
4. Backend updates timestamps.
5. Backend writes the `.cppnb` file to the notebooks workspace.
6. Backend returns the saved notebook to frontend.

Flow for opening:

1. Frontend asks backend for notebook ID.
2. Backend loads `.cppnb`.
3. Backend validates structure.
4. Backend returns notebook JSON.
5. Frontend renders cells.

Flow for local save:

1. Frontend serializes the notebook to JSON.
2. If the browser supports File System Access API, it opens a save dialog.
3. Otherwise, it downloads the file.

## 8. C++ Execution Model

CppBook does not run C++ like JavaScript in a browser. C++ must be compiled.

CppBook uses a compile-and-replay model.

When the user runs a cell:

1. Backend receives the whole notebook and the target cell ID.
2. Backend collects all code cells up to the target cell.
3. Backend splits code into:
   - `#include` lines
   - `using namespace` directives
   - global declarations
   - classes
   - structs
   - functions
   - executable statements
   - user-defined `main()` if present
4. Backend generates a temporary `main.cpp`.
5. Backend compiles `main.cpp` with the detected C++ compiler.
6. Backend runs the compiled executable.
7. Previous cells are replayed silently.
8. Only the target cell output is shown to the user.
9. Backend returns stdout, stderr, status, timing, and diagnostics.

This allows normal notebook-style behavior:

```cpp
int x = 10;
```

Then in the next cell:

```cpp
x += 20;
cout << x;
```

CppBook can compile both cells together and show output for the current cell.

## 9. Why Compile-and-Replay Is Possible

C++ is not naturally interactive like Python.

Python notebooks can keep a live interpreter process. C++ normally needs:

1. source code,
2. compilation,
3. executable output.

CppBook makes C++ feel notebook-like by generating a complete temporary C++ program every time a cell runs.

For example, notebook cells:

```cpp
#include <iostream>
using namespace std;
int x = 5;
```

```cpp
x += 3;
cout << x;
```

become a generated program like:

```cpp
#include <iostream>
using namespace std;

int x = 5;

int main() {
    x += 3;
    cout << x;
    return 0;
}
```

This is the central trick that makes the project possible without needing a full C++ interpreter.

## 10. User `int main()` Problem and Fix

Normal generated CppBook source needs its own backend `int main()` wrapper.

Problem:

If the user writes:

```cpp
int main() {
    cout << "hello";
}
```

and CppBook also generates:

```cpp
int main() {
    // notebook wrapper
}
```

C++ compilation fails because there are two `main()` functions.

Fix:

CppBook detects user-defined `main()` and rewrites it internally.

Example:

```cpp
int main() {
    cout << "hello";
}
```

becomes something like:

```cpp
int __cppbook_user_main_cell_abc() {
    cout << "hello";
}
```

Then the generated wrapper calls it:

```cpp
int main() {
    __cppbook_user_main_cell_abc();
    return 0;
}
```

This means users can write normal C++ examples with `int main()` and still run them inside CppBook.

Supported user main forms:

- `int main()`
- `int main(void)`
- `int main(int argc, char** argv)`

## 11. Compiler Detection

CppBook needs a C++ compiler installed on the user's system.

Compiler flow:

1. Backend checks environment variable `CPP_COMPILER`.
2. If not set, backend searches for common compiler commands like `g++`.
3. Backend runs the compiler version command.
4. Backend returns availability, path, compiler name, and version to the frontend.

If no compiler is found, the app can still open and manage notebooks, but code execution will not work until a compiler is installed.

## 12. Compiler Setup Script

CppBook includes:

```text
tools/check-compiler.ps1
tools/check-compiler.cmd
```

Purpose:

- Check whether `g++` is available on PATH.
- Print detected compiler version.
- Explain what to do if no compiler exists.
- Optionally install MSYS2 with `winget`.

Manual check:

```powershell
npm run compiler:check
```

Direct check:

```powershell
powershell -ExecutionPolicy Bypass -File tools\check-compiler.ps1
```

Optional MSYS2 install:

```powershell
powershell -ExecutionPolicy Bypass -File tools\check-compiler.ps1 -Install
```

After MSYS2 install, the user should install GCC in MSYS2 and add the compiler folder to PATH, usually:

```text
C:\msys64\ucrt64\bin
```

## 13. Export to `.cpp`

Export flow:

1. Frontend asks backend to export a saved notebook.
2. Backend loads notebook.
3. Backend converts notebook cells into C++ source.
4. `#include` lines are deduplicated.
5. `using namespace` lines are deduplicated.
6. Global declarations stay outside `main()`.
7. Executable statements are placed inside `main()`.
8. Markdown cells are converted into C++ comments.
9. Frontend downloads the `.cpp` file.

Example markdown cell:

```markdown
# Binary Search
This cell explains the algorithm.
```

Exported as:

```cpp
// ===== Markdown Cell 1 =====
// # Binary Search
// This cell explains the algorithm.
```

## 14. Desktop App Flow

The desktop app uses Electron.

Important files:

- `electron/main.cjs`: Electron main process.
- `electron/preload.cjs`: secure bridge from Electron to frontend.
- `backend/serve.py`: starts FastAPI backend in packaged mode.
- `package.json`: desktop build scripts and Electron Builder config.

### 14.1 Desktop Startup

When user opens CppBook desktop app:

1. Electron main process starts.
2. Electron chooses a free backend port.
3. Electron sets `CPPBOOK_API_BASE_URL`.
4. Electron starts the backend process.
5. Electron waits for backend health check.
6. Electron loads `dist/index.html`.
7. Frontend reads backend URL from preload bridge.
8. Frontend talks to the local backend.

The user does not need to run:

```text
npm run dev
python backend/serve.py
vite
```

The desktop app starts what it needs automatically.

## 15. Why the Desktop App Can Work Without a Dev Environment

A normal development setup needs:

- Node.js
- npm packages
- Python
- Python packages
- Vite dev server
- FastAPI server

That is too much for normal users.

The installer solves this by packaging the app.

Build process:

1. Vite builds the frontend into static files in `dist/`.
2. PyInstaller converts the Python FastAPI backend into `cppbook-backend.exe`.
3. Electron Builder packages:
   - Electron runtime,
   - frontend `dist/`,
   - backend executable,
   - notebooks folder,
   - compiler check scripts,
   - app metadata.
4. Electron Builder creates a Windows installer `.exe`.

After installation, the user's machine does not need Node.js or Python to run CppBook.

Important note:

The user still needs a C++ compiler for executing C++ code. If no compiler is installed, CppBook can still open notebooks, edit notebooks, save files, and export `.cpp`, but running code requires compiler setup.

## 16. Build Commands

Install dependencies for development:

```powershell
npm install
python -m venv .venv
.venv\Scripts\python -m pip install -r backend\requirements.txt
```

Run development mode:

```powershell
npm run dev
```

Run backend only:

```powershell
npm run backend:dev
```

Run frontend only:

```powershell
npm run frontend:dev
```

Build frontend:

```powershell
npm run build
```

Build backend executable:

```powershell
npm run desktop:backend
```

Run desktop app locally:

```powershell
npm run desktop:dev
```

Build Windows installer:

```powershell
npm run desktop:dist
```

Check compiler:

```powershell
npm run compiler:check
```

Run tests:

```powershell
npm test
```

## 17. Installer Output

The Windows installer is generated in:

```text
installer-release/
```

Main installer file:

```text
installer-release/CppBook Setup 1.0.0.exe
```

There is also:

```text
installer-release/win-unpacked/
```

That folder contains the unpacked desktop app and can be useful for testing before installing.

## 18. End-User Installation Flow

For a normal user:

1. Download `CppBook Setup 1.0.0.exe`.
2. Run the installer.
3. Choose install location.
4. Launch CppBook from desktop shortcut or Start Menu.
5. If compiler is ready, run C++ cells immediately.
6. If compiler is missing, use the compiler setup/check script or install GCC.

The user does not need:

- Git
- Node.js
- npm
- Python
- FastAPI knowledge
- Vite knowledge
- terminal commands for normal app use

## 19. Environment Variables

CppBook supports environment-based configuration.

```text
BACKEND_PORT
FRONTEND_PORT
CPP_COMPILER
EXECUTION_TIMEOUT
WORKSPACE_DIR
CPP_STANDARD
VITE_API_BASE_URL
VITE_ENABLE_VARIABLE_INSPECTOR
```

Common usage:

- `CPP_COMPILER`: set a custom compiler path.
- `EXECUTION_TIMEOUT`: control max execution time.
- `WORKSPACE_DIR`: change notebook/project workspace.
- `CPP_STANDARD`: choose compiler standard, such as `c++17`.
- `VITE_ENABLE_VARIABLE_INSPECTOR`: enable experimental variable inspector UI.

## 20. Security Model

CppBook executes local C++ code.

That means it is powerful and must be treated carefully.

Current safety decisions:

- C++ code runs in a child process, not inside FastAPI.
- Each run uses a temporary execution directory.
- Execution has timeouts.
- The backend can interrupt/stop running code.
- Temporary files are cleaned after execution.
- Project file listing is restricted to the configured workspace.

Important limitation:

CppBook is safe for local personal use, but it is not a hardened public cloud sandbox.

If it is ever exposed online, it needs stronger isolation:

- containers,
- filesystem isolation,
- CPU limits,
- memory limits,
- network restrictions,
- seccomp/AppArmor or Windows sandboxing,
- per-user permissions,
- authentication.

## 21. Testing Strategy

Backend tests cover:

- API health and notebook routes.
- Notebook save/load/rename/import behavior.
- C++ kernel execution.
- `int main()` handling.
- Export behavior.

Frontend verification currently uses:

- TypeScript/Vite production build.
- Manual UI testing through browser/Electron.

Main command:

```powershell
npm test
```

This runs backend tests and the frontend production build.

## 22. Current Important Features

User-facing features:

- Clean Home page.
- Recent notebooks.
- Rename saved notebooks.
- New notebook popup with name and description.
- Autosave status indicator.
- Dark and light themes.
- Expandable toolbar with tool names.
- Fullscreen enter/exit control.
- Local file open/save.
- Export to `.cpp`.
- Markdown exported as C++ comments.
- User `int main()` support.
- Desktop installer.
- Backend server automatically started by desktop app.
- Compiler check scripts.

Developer-facing features:

- FastAPI backend.
- React frontend.
- Electron shell.
- PyInstaller backend bundling.
- Electron Builder installer.
- Tests for backend behavior.

## 23. Known Limitations

CppBook is not a full C++ interpreter.

Known limitations:

- It uses compile-and-replay, not a persistent Cling interpreter.
- Very complex macro-heavy code may need manual adjustment.
- Interactive stdin is not supported as a normal terminal session.
- Variable inspector is experimental because C++ reflection is limited.
- A compiler must exist for code execution.
- Windows installer is unsigned unless code signing is added.

## 24. Future Improvements

Possible next steps:

- Add a custom CppBook app icon.
- Add first-run compiler setup screen inside the app.
- Add automatic compiler installation flow with user confirmation.
- Add MSVC/Clang compiler adapters.
- Add better diagnostics directly inside Monaco editor.
- Add notebook search indexing.
- Add export to PDF/HTML.
- Add project folders and multiple-file C++ builds.
- Add safe sandbox mode for untrusted code.
- Add AI explain/fix/generate actions through `AIService`.
- Add update mechanism for the desktop app.
- Add code signing before public release.

## 25. Summary

CppBook is possible because it turns notebook cells into generated C++ source, compiles that source, runs the executable, and maps the result back to notebook cells.

For developers, it can run as separate frontend and backend services.

For normal users, it can run as a desktop app because Electron starts the bundled backend automatically and displays the built frontend inside a desktop window.

Even if a user cannot create a Python or Node environment, they can still use the installer build. The only external requirement for running C++ cells is a C++ compiler, and CppBook includes scripts to check and guide that setup.
