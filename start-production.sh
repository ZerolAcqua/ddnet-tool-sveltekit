#!/bin/bash
# start-production.sh

# 设置生产环境变量
export NODE_ENV=production
export PORT=5300
export HOST=0.0.0.0

# 启动应用
echo "启动 DDNet Tool (生产环境)"
echo "监听地址: http://$HOST:$PORT"
echo "注册功能可在管理面板中控制"

node build/index.js