# SDU Meow Web

这是一个基于 Vite 的 React + TypeScript 前端项目，面向 SDU Meow 宠物领养平台。项目包含用户端与管理端路由，使用 Ant Design + TailwindCSS 构建 UI，Axios 封装 API 请求，Zustand 管理认证状态，React Query 处理服务器状态。

## 主要特性

- 用户与管理员双端页面
- 响应式移动端风格 UI
- Ant Design / TailwindCSS 混合样式
- Axios API 层与统一错误处理
- Zustand 认证状态管理
- React Query 服务端数据缓存
- Vitest 测试 + 测试库

## 技术栈

- React 19
- TypeScript
- Vite
- React Router
- Ant Design
- Tailwind CSS
- Axios
- Zustand
- React Query
- Vitest

## 安装与运行

```bash
pnpm install
pnpm dev
```

浏览器打开 `http://localhost:5173`

## 代码规范与检查

```bash
pnpm lint
pnpm build
pnpm test:run
```

## 环境变量

可在项目根目录创建 `.env`：

```bash
VITE_API_BASE_URL=https://meow.sduonline.cn/api
VITE_FRONTEND_BASE_URL=https://meow.sduonline.cn
```

`VITE_API_BASE_URL` 会自动补 `/api`，`VITE_FRONTEND_BASE_URL` 用于相对资源拼接。

接口默认走 `/api`，相对资源默认走前端域名根路径。

## 项目结构（简要）

- `src/pages`：页面路由入口
- `src/layouts`：应用布局组件
- `src/api`：API 客户端、适配器、请求封装
- `src/store`：全局状态管理
- `src/hooks`：自定义 Hook
- `src/components`：通用组件
- `src/styles`：主题与样式配置

## 已实现路由

- 登录：`/login`
- 用户端：`/user/...`
- 管理端：`/admin/...`

## 说明

部分云端 mock 接口可能返回 404，项目仍保留对应页面的 UI 壳与统一错误提示。
