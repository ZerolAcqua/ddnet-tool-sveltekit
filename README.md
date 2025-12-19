# 丘卡的 DDTools

一个基于 SvelteKit 构建的 DDNet 工具集合网站

## 功能特色

- **用户认证系统** - JWT 身份验证与会话管理
- **玩家追踪器** - 追踪 DDNet 玩家数据和统计信息
- **管理面板** - 系统管理和配置界面
- **响应式设计** - 适配桌面和移动设备

## 技术栈

- **前端**: SvelteKit 2.x + TypeScript + TailwindCSS
- **数据库**: SQLite + Drizzle ORM
- **认证**: JWT + bcrypt
- **部署**: Node.js/Vercel/Netlify

## 快速开始

### 安装依赖

```bash
npm install
```

### 数据库设置

```bash
# 生成数据库迁移
npm run db:generate

# 执行数据库迁移
npm run db:migrate
```

### 开发环境

```bash
npm run dev
```

访问 `http://localhost:5173` 查看应用

### 生产构建

```bash
npm run build
npm run start
```