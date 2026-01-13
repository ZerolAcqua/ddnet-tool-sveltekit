
# DDNet 工具集 - SvelteKit 项目说明

## 项目概述

本项目基于 SvelteKit 5 + TypeScript + TailwindCSS 3

## 技术栈

- SvelteKit 2.x
- TypeScript
- TailwindCSS
- SQLite (Drizzle ORM)
- JWT + bcrypt


## 项目结构

```
src/
	lib/         # 组件、stores、server 端代码
	routes/      # 路由、API、页面
	app.css      # 全局样式
```

## 开发命令

npm run dev          # 开发服务器
npm run build        # 生产构建
npm run check        # 类型检查
npm run db:generate  # 生成数据库迁移
npm run db:migrate   # 执行数据库迁移


## 下一步计划

- 统一日志模块
- AI 功能
  - AI 对话功能
  - Wiki 知识库集成
  - 攻略智能查询
- 地图攻略工具支持抓取并展示 B 站视频

## 网站风格要求

- 整体为简约暗色风格
- 避免高饱和度鲜艳色彩
- icon 使用要克制，避免堆砌
- 各页面风格保持一致
- 鉴权应使用已有中间件