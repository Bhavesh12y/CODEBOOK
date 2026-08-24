# CodeBook

CodeBook is an interactive, Jupyter-like notebook IDE designed for modern C, C++, Java, and Python. It combines a responsive React/TypeScript frontend with Monaco Editor and a local FastAPI backend, enabling you to write, compile, and execute code interactively in a multi-cell notebook environment—completely locally without any cloud dependencies.

Whether you are learning programming, prototyping algorithms, solving competitive programming problems, or preparing technical course material, CodeBook provides an interactive workflow with real-time execution feedback, persistent multi-cell state management, and an intuitive desktop interface.

For technical deep dives into the execution model and packaging architecture, refer to `docs/PROJECT_FLOW.md` or the documentation portal in `documentation/`.

---

## Key Features

### Core Notebook Experience
- Multi-Language Support: Create code cells in C, C++, Java, or Python.
- Multiple Cell Types: Code cells and Markdown documentation cells.
- Granular Execution: Run individual cells, execute all cells sequentially, or run from the beginning up to the active cell.
- Persistent Multi-Cell State: A unified execution model preserves variables and function declarations across cells.
- Comprehensive Cell Output: Every cell displays stdout, stderr, execution errors, exit codes, and elapsed wall-clock time.

### Code Editing & IntelliSense
- Monaco Editor Integration: Industrial editing with syntax highlighting, bracket matching, indentation guides, code folding, and line numbers.
- Minimap Navigation: Visual code overview for large code cells.
- Keyboard Shortcuts: Fast execution workflows (Shift+Enter to run and advance, Ctrl+Enter to run in-place, Ctrl+S to save, Ctrl+Shift+P for Command Palette).
- Command Palette: Fast searchable menu for every notebook operation.

### Notebook Persistence & File Formats
- Native Document Model: Save and load `.cbnb` JSON files (backwards-compatible with legacy `.cppnb` format) with full cell hierarchy and metadata.
- Autosave: Automatic background disk persistence for saved notebook files.
- Recent Notebooks: Fast switching between recently opened workspaces from the home dashboard.
- Import and Export: Import source files directly into notebook cells; export notebooks into standalone compiled or scripted files.

### Execution Kernel & Toolchain Control
- Local Subprocess Engine: Direct execution using your native toolchains (GCC, Clang, Python, Java JDK) on loopback (127.0.0.1).
- Toolchain Detection: Automatic discovery of system compilers and interpreters on PATH.
- Interrupt & Reset: Stop long-running or runaway infinite-loop processes safely.

### Desktop Application
- Standalone Packages: Self-contained desktop applications for Windows (NSIS .exe), macOS (.dmg), and Linux (AppImage) with embedded Python and Electron runtime.
- Zero Cloud Lock-in: 100% offline capability with no user accounts, no telemetry beacons, and no external server requirements.

---

## System Requirements

- Node.js: Version 20.0 or higher (for source development)
- Python: Version 3.11 or higher (for backend source development)
- Toolchains (install what you need):
  - C/C++: GCC (g++), Clang (clang++), or MSVC
  - Python: Python 3.10+
  - Java: Java JDK 17+

The backend automatically locates and verifies your toolchains at runtime.

---

## Quick Start (Development from Source)

### 1. Repository Setup

Clone the repository and install frontend and root dependencies:

```bash
git clone https://github.com/Bhavesh12y/CODEBOOK.git
cd CODEBOOK
npm install
```

### 2. Python Backend Virtual Environment

Initialize a virtual environment and install backend requirements:

```bash
# Create virtual environment
python -m venv .venv

# Activate and install dependencies (Windows PowerShell)
.venv\Scripts\python -m pip install -r backend/requirements.txt

# Activate and install dependencies (macOS / Linux)
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### 3. Verify Local Toolchains

Ensure your desired compilers and interpreters are accessible:

```bash
# Windows PowerShell
powershell -ExecutionPolicy Bypass -File tools/check-toolchain.ps1

# Linux / macOS
bash tools/check-toolchain.sh
```

### 4. Launch Development Servers

Start both the frontend and backend servers concurrently:

```bash
npm run dev
```

The services will start at:
- Frontend Web UI: `http://127.0.0.1:5173`
- Backend API Server: `http://127.0.0.1:8000`
- API Health Endpoint: `http://127.0.0.1:8000/api/health`
- Compiler Inspection: `http://127.0.0.1:8000/api/compiler`

---

## Project Architecture

CodeBook is structured into decoupled layers:

```text
CPPBOOK/
├── backend/                          # FastAPI Python backend server
│   ├── serve.py                      # Production entry point
│   ├── dev.py                        # Development entry point
│   ├── run_tests.py                  # Backend test runner
│   ├── requirements.txt               # Backend Python dependencies
│   └── app/
│       ├── main.py                   # FastAPI app initialization and CORS
│       ├── config.py                 # Pydantic configuration settings
│       ├── dependencies.py            # Route dependency injection
│       ├── api/
│       │   └── routes.py              # REST endpoints (/api/execute, /api/compiler, etc.)
│       ├── execution/
│       │   ├── compiler.py            # System compiler detector and flag builder
│       │   ├── cpp_kernel.py          # Compile-and-replay execution process manager
│       │   └── cpp_source.py          # AST chunk classifier and source synthesizer
│       ├── models/
│       │   ├── execution.py           # Cell execution payload and response schemas
│       │   └── notebook.py            # .cppnb notebook document schemas
│       ├── notebook/
│       │   ├── repository.py          # Disk read/write persistence
│       │   └── exporter.py            # Export to single .cpp translation unit
│       └── tests/                     # Backend test suite
│
├── frontend/                         # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── index.html                    # Single page application entry
│   ├── vite.config.ts                # Vite bundling configuration
│   └── src/
│       ├── main.tsx                  # React DOM root
│       ├── pages/                    # Main application view
│       ├── components/               # Monaco editor cells, toolbar, output panel, modal dialogs
│       ├── hooks/                    # Notebook state controller and reducer
│       └── services/                 # API client communication layer
│
├── documentation/                    # Standalone documentation and download portal
│   ├── package.json                  # Isolated dependencies (deployable to Vercel)
│   └── src/                          # Docs pages, search modal, release archive
│
├── electron/                         # Electron 34 desktop shell
│   ├── main.cjs                      # Native window lifecycle & local backend spawn
│   └── preload.cjs                   # Secure IPC contextBridge
│
├── desktop-dist/                     # Desktop build artifacts and PyInstaller bundles
├── notebooks/                        # Bundled sample notebooks (.cppnb files)
├── tools/                            # Compiler detection and validation scripts
└── package.json                      # Root workspace scripts and electron-builder config
```

---

## Desktop Packaging & Distribution

CodeBook can be compiled into standalone desktop installers that bundle the Node runtime, Monaco frontend, and Python backend executable together into a single native binary.

### Build Steps

1. Package Backend Binary with PyInstaller:
   ```bash
   npm run desktop:backend
   ```
   This creates `desktop-dist/backend/cppbook-backend.exe` (Windows) or `desktop-dist/backend/cppbook-backend` (macOS/Linux).

2. Run Electron Desktop App in Development:
   ```bash
   npm run desktop:dev
   ```

3. Build Production Installer:
   ```bash
   # Windows (generates NSIS installer .exe)
   npm run desktop:dist:win

   # macOS (generates .dmg disk image)
   npm run desktop:dist:mac

   # Linux (generates standalone .AppImage)
   npm run desktop:dist:linux
   ```

Installers are output directly to `dist/` or `installer-release/`.

---

## Execution Engine & State Persistence

Because standard C++ is a statically compiled language rather than an interpreted scripting language, CodeBook implements a compile-and-replay architecture:

1. Cell Parsing: When you run a target cell, the backend gathers all preceding code cells up to that point.
2. Source Synthesis: An AST classifier separates include directives, namespace declarations, global type definitions (structs, classes, enums, templates), function signatures, and body statements.
3. Symbol Isolation: User-defined `main()` functions are safely isolated into cell-scoped wrappers to prevent multiple-definition linker collisions.
4. Translation Unit Generation: A unified temporary `main.cpp` is written to a private temporary sandbox directory.
5. Compilation: The system compiler is invoked (e.g. `g++ -O2 -std=c++17 main.cpp -o main`).
6. Replay & Output Streaming: The compiled binary executes silently through prior cells to construct memory state, and streams stdout/stderr specifically for the executing cell.

---

## Keyboard Shortcuts Reference

| Shortcut | Action | Description |
|---|---|---|
| Shift + Enter | Run Cell & Advance | Compiles and executes current cell, then moves focus to the next cell. |
| Ctrl / Cmd + Enter | Run Cell | Compiles and executes the current cell in-place. |
| Alt + Enter | Run & Insert Below | Executes the current cell and inserts a new empty code cell below it. |
| Ctrl / Cmd + S | Save Notebook | Writes all notebook cells and execution states to disk. |
| Ctrl / Cmd + Shift + P | Command Palette | Opens the global command palette for quick action search. |
| Ctrl / Cmd + O | Open Palette | Fast keyboard shortcut to open notebook actions. |

---

## Testing & Quality Assurance

Run test suites across both the backend engine and frontend compilation:

```bash
# Run backend pytest suite
npm run backend:test

# Run full build validation
npm run test
```

---

## Documentation Website

The repository includes a dedicated documentation website located in the `documentation/` subfolder. It is completely decoupled from the desktop app and can be deployed directly to static hosting platforms such as Vercel, Netlify, or GitHub Pages.

To run the documentation site locally:
```bash
cd documentation
npm install
npm run dev
```

To build for production:
```bash
cd documentation
npm run build
```
Production output will be generated in `documentation/dist/`.

---

## Contributing

Contributions to CodeBook are welcome. Please open an issue on GitHub to discuss proposed architecture changes, bug reports, or feature requests before submitting a pull request.
