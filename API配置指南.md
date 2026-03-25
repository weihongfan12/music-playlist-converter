# API 配置指南

## 已集成平台状态

### 源平台（歌单解析）

| 平台 | 状态 | 是否需要API密钥 | 说明 |
|------|------|----------------|------|
| **网易云音乐** | ✅ 已配置 | ❌ 不需要 | 使用您提供的API |
| **QQ音乐** | ✅ 已集成 | ❌ 不需要 | 自动解析 |
| **酷狗音乐** | ✅ 已集成 | ❌ 不需要 | 自动解析 |
| **酷我音乐** | ✅ 已集成 | ❌ 不需要 | 自动解析 |
| **咪咕音乐** | ✅ 已集成 | ❌ 不需要 | 自动解析 |

### 目标平台（歌曲匹配）

| 平台 | 状态 | 是否需要API密钥 | 说明 |
|------|------|----------------|------|
| **YouTube Music** | ✅ 可用 | ❌ 不需要 | 直接使用 |
| **Spotify** | ⚠️ 需配置 | ✅ 需要 | 需申请Client ID |
| **Apple Music** | ⚠️ 需配置 | ✅ 需要 | 需Apple Developer账号 |

---

## 当前可用功能

### 无需任何配置即可使用

```
✅ 网易云音乐歌单解析
✅ QQ音乐歌单解析
✅ 酷狗音乐歌单解析
✅ 酷我音乐歌单解析
✅ 咪咕音乐歌单解析
✅ YouTube Music 歌曲匹配
✅ 导出为 CSV/JSON/M3U 文件
✅ 用户注册/登录系统
✅ 个人资料管理
```

### 需要配置后可用

```
⚠️ Spotify 歌曲匹配 - 需配置 Client ID/Secret
⚠️ Apple Music 歌曲匹配 - 需 Apple Developer 账号
⚠️ 密码找回邮件 - 需配置 SMTP
```

---

## 支持的歌单链接格式

### 网易云音乐
```
https://music.163.com/playlist?id=12345678
https://music.163.com/#/playlist?id=12345678
```

### QQ音乐
```
https://y.qq.com/n/ryqq/playlist/12345678
```

### 酷狗音乐
```
https://www.kugou.com/yy/special/12345678.html
```

### 酷我音乐
```
https://www.kuwo.cn/playlist_detail/12345678
```

### 咪咕音乐
```
https://music.migu.cn/v3/playlist/12345678
```

---

## 可选配置

### Spotify API（可选）

如果想使用 Spotify 匹配功能：

1. 访问 https://developer.spotify.com/dashboard
2. 创建应用获取 Client ID 和 Client Secret
3. 配置到 `backend/.env`:

```env
SPOTIFY_CLIENT_ID=你的Client_ID
SPOTIFY_CLIENT_SECRET=你的Client_Secret
```

### SMTP 邮件服务（可选）

如果想使用密码找回功能：

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 快速开始

1. **启动后端**
```bash
cd backend
npm install
npm run dev
```

2. **启动前端**
```bash
cd frontend
npm install
npm run dev
```

3. **访问应用**
```
http://localhost:3000
```

---

## 测试歌单链接

您可以使用以下测试歌单：

- 网易云: `https://music.163.com/playlist?id=3778678` (热门歌单)
- QQ音乐: `https://y.qq.com/n/ryqq/playlist/12345678`

---

## 项目架构

```
musicplaylist/
├── frontend/          # Vue 3 + TypeScript + Vite
│   ├── src/
│   │   ├── views/     # 页面组件
│   │   ├── stores/    # Pinia 状态管理
│   │   └── router/    # 路由配置
│   └── package.json
│
├── backend/           # Node.js + TypeScript + Express
│   ├── src/
│   │   ├── services/  # 核心服务
│   │   │   ├── parser.ts    # 歌单解析
│   │   │   ├── matcher.ts   # 歌曲匹配
│   │   │   └── userService.ts # 用户系统
│   │   ├── routes/    # API路由
│   │   └── types/     # 类型定义
│   └── package.json
│
└── API配置指南.md
```

---

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/playlist/parse` | POST | 解析歌单 |
| `/api/v1/songs/match` | POST | 匹配歌曲 |
| `/api/v1/playlist/export` | POST | 导出文件 |
| `/api/v1/auth/register` | POST | 用户注册 |
| `/api/v1/auth/login` | POST | 用户登录 |
| `/api/v1/auth/profile` | GET | 获取用户信息 |
