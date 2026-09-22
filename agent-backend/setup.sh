#!/usr/bin/env bash
# ── agent-backend 环境初始化 ─────────────────────────────────────────
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTSCOPE_SRC="$SCRIPT_DIR/../agentscope"

echo "🔧 创建 Python 虚拟环境..."
python3 -m venv "$SCRIPT_DIR/.venv"
source "$SCRIPT_DIR/.venv/bin/activate"

echo "📦 安装依赖..."
pip install --upgrade pip -q
pip install -r "$SCRIPT_DIR/requirements.txt" -q

if [ -f "$AGENTSCOPE_SRC/pyproject.toml" ]; then
  echo "📦 从本地源码安装 agentscope..."
  pip install -e "$AGENTSCOPE_SRC" -q
else
  echo "📦 未发现本地 agentscope 源码，安装 PyPI 版本..."
  pip install "agentscope>=2.0.0" -q
fi

echo "📄 复制 .env 配置（如未存在）..."
if [ ! -f "$SCRIPT_DIR/.env" ]; then
  cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
  echo "   ⚠️  请编辑 .env 填写 LLM_API_KEY"
fi

echo "✅ 初始化完成！"
echo ""
echo "启动服务："
echo "  source .venv/bin/activate"
echo "  python main.py"
