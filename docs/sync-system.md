# DDNet 地图数据同步系统

## 概述

本系统提供了两种方式来实现 DDNet 地图数据的定时同步：

1. **Node.js 定时任务**（推荐）- 直接调用内部服务，无需 HTTP 请求
2. **系统 Cron 任务** - 使用系统级定时任务

## 🚀 Node.js 定时任务（推荐）

### 优势
- ✅ 直接调用 `MapSyncService`，无需 HTTP 请求
- ✅ 更好的错误处理和日志记录
- ✅ 无需考虑 API 鉴权问题
- ✅ 统一的环境和配置
- ✅ 更易于调试和监控

### 可用脚本

```bash
# 执行一次同步
npm run sync:once

# 启动持久的定时任务调度器
npm run sync:start

# 测试模式（每2分钟执行一次，并立即执行一次）
npm run sync:test
```

### 配置选项

可以通过环境变量自定义调度：

```bash
# 自定义 cron 表达式
SYNC_SCHEDULE="0 */6 * * *" npm run sync:start

# 启动时立即执行一次
RUN_IMMEDIATELY=true npm run sync:start
```

### 生产环境部署

推荐使用 PM2 进程管理器：

```bash
# 安装 PM2
npm install -g pm2

# 启动同步调度器
pm2 start "npm run sync:start" --name "ddnet-sync"

# 查看状态
pm2 status

# 查看日志
pm2 logs ddnet-sync

# 设置开机自启
pm2 startup
pm2 save
```

## 📋 系统 Cron 任务

如果不想使用 Node.js 持久进程，也可以使用系统 cron：

```bash
# 安装 cron 任务
crontab scripts/ddnet-sync-cron

# 查看已安装的任务
crontab -l

# 查看日志
tail -f /var/log/ddnet-sync.log
```

## 📊 同步状态监控

### Web 管理面板

访问 `/admin/sync` 查看同步状态和手动触发同步。

### API 接口

```bash
# 获取同步状态
curl -X GET "http://localhost:5175/api/admin/sync-maps"

# 手动触发同步（需要在管理面板中操作）
```

## 🔧 故障排查

### 检查同步状态
```bash
# 运行一次同步并查看输出
npm run sync:once

# 检查数据库中的地图数量
sqlite3 local.db "SELECT COUNT(*) FROM maps;"
```

### 常见问题

1. **数据库权限问题**
   - 确保 `local.db` 文件有读写权限
   - 检查数据库文件是否存在

2. **网络连接问题**
   - 检查是否能访问 https://ddnet.org/releases/maps.json
   - 确认防火墙设置

3. **依赖问题**
   - 运行 `npm install` 确保所有依赖已安装
   - 检查 Node.js 版本兼容性

## 📈 同步统计

- **同步间隔**: 24 小时
- **当前地图数量**: 通过 API 或管理面板查看
- **最后同步时间**: 存储在数据库中

## 🔒 安全考虑

- Node.js 脚本直接调用内部服务，无需暴露 HTTP 接口
- 所有数据库操作使用事务确保数据一致性
- 详细的错误日志记录便于问题追踪