#!/bin/zsh
cd "$(dirname "$0")"
if curl -fsS "http://127.0.0.1:4173/api/status" >/dev/null 2>&1; then
  open "http://127.0.0.1:4173/"
  exit 0
fi
npm start &
workbench_pid=$!
for attempt in {1..40}; do
  if curl -fsS "http://127.0.0.1:4173/api/status" >/dev/null 2>&1; then
    open "http://127.0.0.1:4173/"
    wait "$workbench_pid"
    exit $?
  fi
  sleep 0.25
done
echo "工作台启动失败，请检查本机服务。"
wait "$workbench_pid"
