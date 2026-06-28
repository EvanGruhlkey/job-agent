"""Start the FastAPI backend with a Windows-compatible asyncio loop.

Use this instead of ``python -m uvicorn ...`` for local development on
Windows. Procrastinate's async psycopg connector cannot run on the default
Proactor event loop, and uvicorn creates the loop before the app module can
change it.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

import uvicorn

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Careerbase backend")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--reload", action="store_true")
    args = parser.parse_args()

    config = uvicorn.Config(
        "src.backend.api.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
    )
    server = uvicorn.Server(config)
    if sys.platform == "win32":
        with asyncio.Runner(loop_factory=asyncio.SelectorEventLoop) as runner:
            runner.run(server.serve())
    else:
        uvicorn.run(
            "src.backend.api.main:app",
            host=args.host,
            port=args.port,
            reload=args.reload,
        )


if __name__ == "__main__":
    main()
