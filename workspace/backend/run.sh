#!/usr/bin/env bash
# Starts the backend with local gateway credentials if they are present.
set -e
cd "$(dirname "$0")"
[ -f .env.local ] && . ./.env.local
export JAVA_HOME=${JAVA_HOME:-/opt/homebrew/Cellar/openjdk@17/17.0.19/libexec/openjdk.jdk/Contents/Home}
exec java -jar target/skillbridge-backend-1.0.0.jar "$@"
