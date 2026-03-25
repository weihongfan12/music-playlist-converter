# Music Playlist Converter

一个强大的音乐平台歌单转换工具，支持将歌单从一个平台迁移到另一个平台。

## 功能特点

- 🎵 **多平台支持**: 网易云音乐、QQ音乐、酷狗、酷我、咪咕
- 🔄 **智能匹配**: 采用先进的歌曲匹配算法，准确率高达95%以上
- 📤 **多格式导出**: 支持 CSV、JSON、M3U 格式
- 👤 **用户系统**: 注册、登录、个人资料管理
- 🌙 **暗色模式**: 支持明暗主题切换

## 技术栈

### 前端
- Vue 3 + TypeScript
- Vite
- Tailwind CSS
- Pinia

### 后端
- Node.js + TypeScript
- Express
- JWT 认证

## 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd frontend
npm install
```

### 配置环境变量

复制 `backend/.env.example` 为 `backend/.env` 并填写配置。

### 启动开发服务器

```bash
# 后端 (端口 3001)
cd backend
npm run dev

# 前端 (端口 3000)
cd frontend
npm run dev
```

## 支持的平台

### 源平台
| 平台 | 状态 |
|------|------|
| 网易云音乐 | ✅ |
| QQ音乐 | ✅ |
| 酷狗音乐 | ✅ |
| 酷我音乐 | ✅ |
| 咪咕音乐 | ✅ |

### 目标平台
| 平台 | 状态 |
|------|------|
| YouTube Music | ✅ |
| Spotify | ⚠️ 需配置API |
| Apple Music | ⚠️ 需配置API |

## API 文档

详见 [API配置指南.md](./API配置指南.md)

## License

MIT
