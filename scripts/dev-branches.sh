#!/bin/bash
# 在本地同时启动多个分支的开发服务器，每个分支在独立端口运行
# 用法:
#   bash scripts/dev-branches.sh              # 启动所有分支
#   bash scripts/dev-branches.sh main         # 只启动 main
#   bash scripts/dev-branches.sh new-recog    # 只启动 feat/new-recognition-flow
#   bash scripts/dev-branches.sh step3        # 只启动当前分支 (step3-4-alt)
#   bash scripts/dev-branches.sh stop         # 停止所有已启动的分支服务器
#   bash scripts/dev-branches.sh status       # 查看状态

set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

declare -A BRANCH_PORT BRANCH_PATH BRANCH_LABEL

BRANCH_PORT["feat/step3-4-alt-interaction"]=5000
BRANCH_PATH["feat/step3-4-alt-interaction"]="$ROOT"
BRANCH_LABEL["feat/step3-4-alt-interaction"]="step3-4 (current)"

BRANCH_PORT["feat/new-recognition-flow"]=5001
BRANCH_PATH["feat/new-recognition-flow"]="${ROOT}-new-recognition-flow"
BRANCH_LABEL["feat/new-recognition-flow"]="new-recognition"

BRANCH_PORT["main"]=5002
BRANCH_PATH["main"]="${ROOT}-old"
BRANCH_LABEL["main"]="main"

PID_FILE="$ROOT/.dev-branches-pids"
ORDERED_BRANCHES=("feat/step3-4-alt-interaction" "feat/new-recognition-flow" "main")

log() { echo "[$(date +%H:%M:%S)] $*"; }

resolve_branch() {
    local key="$1"
    for branch in "${ORDERED_BRANCHES[@]}"; do
        case "$branch" in
            *"$key"*) echo "$branch"; return ;;
        esac
    done
    echo ""
}

# 获取占用指定端口的 PID 列表
port_pids() {
    local port="$1"
    netstat -ano 2>/dev/null | awk -v p=":$port " '$0 ~ p && $0 ~ /LISTENING/ {print $NF}' | sort -u
}

# 释放端口
kill_port() {
    local port="$1"
    local pids
    pids=$(port_pids "$port")
    if [[ -n "$pids" ]]; then
        log "  端口 $port 被占用 (PID: $pids)，释放中..."
        for pid in $pids; do
            taskkill //PID "$pid" //F 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
        done
        sleep 0.5
    fi
}

# 检查端口是否在监听
port_active() {
    local port="$1"
    [[ -n "$(port_pids "$port")" ]]
}

# 启动单个分支的 dev server
start_branch() {
    local branch="$1"
    local port="${BRANCH_PORT[$branch]}"
    local path="${BRANCH_PATH[$branch]}"
    local label="${BRANCH_LABEL[$branch]}"

    if [[ ! -d "$path" ]]; then
        log "  $label: 目录不存在 $path，跳过"
        return 1
    fi

    kill_port "$port"

    if [[ ! -d "$path/node_modules" ]]; then
        log "  $label: 正在安装依赖..."
        (cd "$path" && pnpm install --prefer-frozen-lockfile --prefer-offline) > /dev/null 2>&1
    fi

    log "  $label: 启动 → http://localhost:$port"
    (
        cd "$path"
        PORT="$port" nohup pnpm tsx watch src/server.ts > "$path/.dev-server.log" 2>&1 &
        echo $!
    ) >> "$PID_FILE"
}

# 停止所有
stop_all() {
    if [[ -f "$PID_FILE" ]]; then
        log "停止所有分支服务器..."
        while read -r pid; do
            [[ -z "$pid" ]] && continue
            kill "$pid" 2>/dev/null || true
        done < "$PID_FILE"
        rm -f "$PID_FILE"
        # 额外清理：杀掉各端口的残留进程
        for branch in "${ORDERED_BRANCHES[@]}"; do
            kill_port "${BRANCH_PORT[$branch]}"
        done
        log "已全部停止"
    else
        log "没有正在运行的分支服务器"
    fi
}

# 显示状态
show_status() {
    echo ""
    echo "  ============================================"
    echo "    分支开发服务器"
    echo "  ============================================"
    for branch in "${ORDERED_BRANCHES[@]}"; do
        local port="${BRANCH_PORT[$branch]}"
        local label="${BRANCH_LABEL[$branch]}"
        if port_active "$port"; then
            echo "    [ON]  $label → http://localhost:$port"
        else
            echo "    [OFF] $label → http://localhost:$port"
        fi
    done
    echo "  ============================================"
    echo ""
}

# ---- MAIN ----
case "${1:-}" in
    stop)
        stop_all
        show_status
        exit 0
        ;;
    status)
        show_status
        exit 0
        ;;
esac

if [[ -n "${1:-}" ]]; then
    target=$(resolve_branch "$1")
    if [[ -z "$target" ]]; then
        log "未识别的分支简写: $1"
        log "可用的简写: main, new-recog, step3"
        exit 1
    fi
    > "$PID_FILE"
    log "启动: ${BRANCH_LABEL[$target]}"
    start_branch "$target"
    sleep 3
    show_status
    log "日志: ${BRANCH_PATH[$target]}/.dev-server.log"
    exit 0
fi

# 默认：启动所有分支
> "$PID_FILE"
log "=============================="
log "  启动所有分支开发服务器"
log "=============================="

for branch in "${ORDERED_BRANCHES[@]}"; do
    start_branch "$branch"
done

sleep 4
show_status
log "查看日志: tail -f <分支目录>/.dev-server.log"
log "停止所有: bash scripts/dev-branches.sh stop"
