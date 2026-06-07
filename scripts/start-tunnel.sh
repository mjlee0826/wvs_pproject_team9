#!/bin/bash
# 自動開 localtunnel，並把 URL 寫進 frontend/.env
# 用法：bash scripts/start-tunnel.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/frontend/.env"
TMP_LOG=$(mktemp)

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use >/dev/null 2>&1

echo "[tunnel] Starting localtunnel on port 3000..."

# 以 process substitution 跑 localtunnel，同時印出並抓 URL
TUNNEL_URL=""

while IFS= read -r line; do
  echo "$line"
  if [ -z "$TUNNEL_URL" ]; then
    MAYBE=$(echo "$line" | grep -o 'https://[^ ]*' | head -1)
    if [ -n "$MAYBE" ]; then
      TUNNEL_URL="$MAYBE"
      # 更新 frontend/.env
      sed -i "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=${TUNNEL_URL}/api|" "$ENV_FILE"
      echo ""
      echo "[tunnel] ✅ 已更新 frontend/.env → EXPO_PUBLIC_API_URL=${TUNNEL_URL}/api"
      echo "[tunnel] 保持運行中，按 Ctrl+C 停止"
      echo ""
    fi
  fi
done < <(npx localtunnel --port 3000 2>&1)
