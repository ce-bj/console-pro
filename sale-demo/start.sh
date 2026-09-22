#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  sale-demo 一键启动脚本
#  后端 API : http://localhost:8005
#  前端页面 : http://localhost:8002
# ─────────────────────────────────────────────────────────────

set -e
cd "$(dirname "$0")"

# ── 颜色 ──────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; RED='\033[0;31m'; NC='\033[0m'

log()  { echo -e "${CYAN}[sale-demo]${NC} $*"; }
ok()   { echo -e "${GREEN}✅${NC} $*"; }
warn() { echo -e "${YELLOW}⚠️ ${NC} $*"; }
err()  { echo -e "${RED}❌${NC} $*"; }

BACKEND_PORT=8005
FRONTEND_PORT=8002
LOG_DIR=/tmp/sale-demo-logs
mkdir -p "$LOG_DIR"

# ── 端口占用检查 & 释放 ────────────────────────────────────────
kill_port() {
  local port=$1
  local pid
  pid=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    warn "端口 $port 被占用 (PID $pid)，正在释放..."
    kill -9 $pid 2>/dev/null || true
    sleep 0.5
  fi
}

# ── 清理函数（Ctrl+C 时执行）─────────────────────────────────
cleanup() {
  echo ""
  log "正在停止所有服务..."
  [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null && log "后端已停止 (PID $BACKEND_PID)"
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null && log "前端已停止 (PID $FRONTEND_PID)"
  log "再见 👋"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── 等待端口就绪 ──────────────────────────────────────────────
wait_for_port() {
  local port=$1 name=$2 timeout=15 i=0
  while ! lsof -ti tcp:"$port" >/dev/null 2>&1; do
    sleep 0.5; i=$((i+1))
    [ $i -ge $((timeout*2)) ] && err "$name 启动超时 (${timeout}s)" && return 1
  done
  return 0
}

# ═════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      sale-demo 服务启动              ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# ── 1. 释放端口 ───────────────────────────────────────────────
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT

# ── 2. 启动后端（node server.js）─────────────────────────────
log "启动后端 API (port $BACKEND_PORT)..."
node server/index.js > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

if wait_for_port $BACKEND_PORT "后端"; then
  ok "后端已就绪  →  http://localhost:$BACKEND_PORT"
else
  err "后端启动失败，查看日志：$LOG_DIR/backend.log"
  exit 1
fi

# ── 3. 启动前端（npx serve）──────────────────────────────────
log "启动前端静态服务 (port $FRONTEND_PORT)..."
npx serve public --listen $FRONTEND_PORT > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

if wait_for_port $FRONTEND_PORT "前端"; then
  ok "前端已就绪  →  http://localhost:$FRONTEND_PORT"
else
  err "前端启动失败，查看日志：$LOG_DIR/frontend.log"
  kill "$BACKEND_PID" 2>/dev/null
  exit 1
fi

# ── 4. 汇总信息 ───────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  🌐  演示页面   http://localhost:$FRONTEND_PORT/demo.html"
echo -e "  🔧  后端 API   http://localhost:$BACKEND_PORT"
echo -e "  📋  日志目录   $LOG_DIR"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  后端 PID: $BACKEND_PID   前端 PID: $FRONTEND_PID"
echo -e "  按 ${YELLOW}Ctrl+C${NC} 停止所有服务"
echo ""

# ── 5. 实时显示后端日志（保持进程活跃）──────────────────────
log "后端日志实时输出 ↓"
echo "──────────────────────────────────────"
tail -f "$LOG_DIR/backend.log" &
TAIL_PID=$!

# 等待子进程退出（任一退出则触发 cleanup）
wait $BACKEND_PID 2>/dev/null
err "后端进程意外退出！查看：$LOG_DIR/backend.log"
kill "$TAIL_PID" 2>/dev/null
cleanup
