#!/bin/bash
# Start both backend and frontend for SkillBridge
# The frontend (port 5173) is the exposed preview port and proxies /api + /ws to the backend.

set -e

cd "$(dirname "$0")"

# Build backend if jar is missing
if [ ! -f backend/target/skillbridge-backend-1.0.0.jar ]; then
  echo "Building backend..."
  (cd backend && mvn -q package -DskipTests)
fi

# Install frontend dependencies if missing
if [ ! -d frontend/node_modules ]; then
  echo "Installing frontend dependencies..."
  (cd frontend && npm install --no-audit --no-fund)
fi

echo "Starting backend on :8080"
java -Xmx512m -jar backend/target/skillbridge-backend-1.0.0.jar &
BACKEND_PID=$!

echo "Starting frontend on :5173"
(cd frontend && npm run dev) &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true" EXIT

wait
