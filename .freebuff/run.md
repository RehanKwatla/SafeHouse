# SafeRoom Frontend — Run Doc

## How to reproduce artifacts

- **No `.env` files needed** — the project runs entirely on simulation data.
- **`node_modules/` already present** in the checkout. If missing, run `npm install`.

## How to run the dev server

```bash
npm run dev -- --port 5180 --host 127.0.0.1
```

If port 5180 is occupied, Vite auto-increments to the next free port. Check the terminal output for the actual URL (e.g. `http://127.0.0.1:5181`).

### Windows detach (PowerShell)

```powershell
Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev','--','--port','5180','--host','127.0.0.1' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru
```

### Windows detach (Git Bash / cmd)

```bash
start /b npm.cmd run dev -- --port 5180 --host 127.0.0.1 > <log> 2> <log>.err
```

## Tech stack

- React 18 + TypeScript + Vite 5
- Tailwind CSS 3 (custom color system in `tailwind.config.js`)
- Recharts (history charts), Lucide React (icons)
- Simulation engine (no backend required)

## Key files

- `src/config/index.ts` — room layout, isometric projection constants
- `src/components/PatrolMap.tsx` — isometric facility map (hero component)
- `src/engine/simulationEngine.ts` — full patrol simulation
- `src/api/index.ts` — API abstraction layer
