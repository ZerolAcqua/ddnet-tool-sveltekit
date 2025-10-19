# 禁用注册功能

## 功能说明

为了保护生产环境，该系统支持禁用新用户注册功能。启用后，只有现有用户可以登录，新用户无法注册。

## 启用方法

### 方法1: 使用启动脚本
```bash
# 禁用注册，端口 5300
./start-production.sh 5300 true

# 允许注册，端口 8080  
./start-production.sh 8080 false
```

### 方法2: 环境变量
```bash
# 禁用注册
DISABLE_REGISTRATION=true node build/index.js

# 允许注册
DISABLE_REGISTRATION=false node build/index.js
```

### 方法3: 系统服务配置
```ini
# systemd 服务文件
[Service]
Environment=DISABLE_REGISTRATION=true
Environment=PORT=5300
ExecStart=node build/index.js
```

## 管理面板

管理员可以在管理面板中查看当前的注册状态：

- ✅ 已启用：新用户可以注册
- 🚫 已禁用：新用户无法注册

## 注意事项

1. **首个用户例外**：即使禁用注册，如果系统中没有任何用户，仍然允许注册第一个用户（管理员）
2. **需要重启**：修改 `DISABLE_REGISTRATION` 环境变量后需要重启应用才能生效
3. **登录页面提示**：当注册被禁用时，登录页面会显示相应提示

## 安全建议

生产环境建议：
- 启动应用后立即创建管理员账户
- 设置 `DISABLE_REGISTRATION=true` 禁用注册
- 定期检查用户列表，移除不必要的账户