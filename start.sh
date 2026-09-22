#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  console-crm 一键启动脚本
#
#  服务端口：
#    agent-backend   http://localhost:8001   (AI 客服 Agent / FastAPI)
#    prototype       http://localhost:1234   (中台控制台原型 / Vite)
#    sale-demo 后端  http://localhost:8005   (行为事件 & 访客画像 API / Node.js)
#    sale-demo 前端  http://localhost:8002   (演示落地页 / static)
#
#  日志目录：
#    agent-backend   agent-backend/logs/app.log
#    sale-demo       /tmp/sale-demo-logs/
# ─────────────────────────────────────────────────────────────────────────────

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; RED='\033[0;31m'; NC='\033[0m'

log()  { echo -e "${CYAN}[console-crm]${NC} $*"; }
ok()   { echo -e "${GREEN}✅${NC} $*"; }
warn() { echo -e "${YELLOW}⚠️ ${NC} $*"; }
err()  { echo -e "${RED}❌${NC} $*"; }

# ── 端口释放 ──────────────────────────────────────────────────────────────────
kill_port() {
  local port=$1
  local pid; pid=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    warn "端口 $port 被占用 (PID $pid)，正在释放..."
    kill -9 $pid 2>/dev/null || true
    sleep 0.5
  fi
}

# ── 等待端口就绪 ──────────────────────────────────────────────────────────────
wait_for_port() {
  local port=$1 name=$2 timeout=${3:-20}
  local i=0
  while ! lsof -ti tcp:"$port" >/dev/null 2>&1; do
    sleep 0.5; i=$((i+1))
    [ $i -ge $((timeout*2)) ] && err "$name 启动超时 (${timeout}s)" && return 1
  done
  return 0
}

# ── 清理（Ctrl+C）────────────────────────────────────────────────────────────
cleanup() {
  echo ""
  log "正在停止所有服务..."
  [ -n "$AGENT_PID" ]    && kill "$AGENT_PID"    2>/dev/null && log "agent-backend 已停止"
  [ -n "$PROTO_PID" ]    && kill "$PROTO_PID"    2>/dev/null && log "prototype 已停止"
  [ -n "$DEMO_SRV_PID" ] && kill "$DEMO_SRV_PID" 2>/dev/null && log "sale-demo 后端已停止"
  [ -n "$DEMO_FE_PID" ]  && kill "$DEMO_FE_PID"  2>/dev/null && log "sale-demo 前端已停止"
  log "再见 👋"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ═════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         console-crm  服务启动                ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. 释放端口 ───────────────────────────────────────────────────────────────
kill_port 8001
kill_port 1234
kill_port 8005
kill_port 8002

# ── 2. agent-backend（Python FastAPI） ────────────────────────────────────────
log "启动 agent-backend (port 8001)..."
AGENT_LOG="$ROOT/agent-backend/logs/app.log"
mkdir -p "$ROOT/agent-backend/logs"
cd "$ROOT/agent-backend"
.venv/bin/python main.py > /dev/null 2>&1 &
AGENT_PID=$!
if wait_for_port 8001 "agent-backend"; then
  ok "agent-backend 已就绪  →  http://localhost:8001"
else
  err "agent-backend 启动失败，查看日志：$AGENT_LOG"
  cleanup; exit 1
fi

# ── 3. prototype（Vite dev server） ───────────────────────────────────────────
log "启动 prototype (port 1234)..."
cd "$ROOT/prototype"
npm run dev --silent > /tmp/prototype.log 2>&1 &
PROTO_PID=$!
if wait_for_port 1234 "prototype" 30; then
  ok "prototype 已就绪    →  http://localhost:1234"
else
  err "prototype 启动失败，查看日志：/tmp/prototype.log"
  cleanup; exit 1
fi

# ── 4. sale-demo 后端（Node.js） ──────────────────────────────────────────────
DEMO_LOG_DIR=/tmp/sale-demo-logs
mkdir -p "$DEMO_LOG_DIR"
log "启动 sale-demo 后端 (port 8005)..."
cd "$ROOT/sale-demo"
node server/index.js > "$DEMO_LOG_DIR/backend.log" 2>&1 &
DEMO_SRV_PID=$!
if wait_for_port 8005 "sale-demo 后端"; then
  ok "sale-demo 后端已就绪 →  http://localhost:8005"
else
  err "sale-demo 后端启动失败，查看日志：$DEMO_LOG_DIR/backend.log"
  cleanup; exit 1
fi

# ── 5. sale-demo 前端（静态） ─────────────────────────────────────────────────
log "启动 sale-demo 前端 (port 8002)..."
npx serve public --listen 8002 > "$DEMO_LOG_DIR/frontend.log" 2>&1 &
DEMO_FE_PID=$!
if wait_for_port 8002 "sale-demo 前端"; then
  ok "sale-demo 前端已就绪 →  http://localhost:8002"
else
  err "sale-demo 前端启动失败，查看日志：$DEMO_LOG_DIR/frontend.log"
  cleanup; exit 1
fi

# ── 汇总 ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  💬  访客 AI 对话        http://localhost:8002/chat"
echo -e "  🧑‍💼  N2 坐席工作台       http://localhost:8002/operator-test"
echo -e "  🖥️   中台控制台原型      http://localhost:1234"
echo -e "  🔍  Agent API / Swagger  http://localhost:8001/docs"
echo -e ""
echo -e "  📋  agent 日志          agent-backend/logs/app.log"
echo -e "  📋  sale-demo 日志      /tmp/sale-demo-logs/"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  按 ${YELLOW}Ctrl+C${NC} 停止所有服务"
echo ""

# ── 保持运行，监控关键服务 ────────────────────────────────────────────────────
wait $AGENT_PID 2>/dev/null
err "agent-backend 意外退出！查看：$AGENT_LOG"
cleanup
