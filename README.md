# Bilibili Demo

## 原理

### 1. 获取视频信息
调用 Bilibili 官方 API 获取视频元数据：

```
GET https://api.bilibili.com/x/web-interface/view?bvid={BV号}
```

返回：标题、封面、作者、播放量、时长等信息。

### 2. 获取下载地址
调用官方播放接口获取视频流地址：

```
GET https://api.bilibili.com/x/player/playurl?bvid={BV号}&cid={CID}&qn=16&fnval=0
```

参数说明：
- `bvid`: 视频 BV 号
- `cid`: 视频分 P ID（从第一步获取）
- `qn`: 画质等级（16 = 360P 流畅，无需登录）

### 3. 代理转发
由于浏览器跨域限制，服务器端代理转发视频流请求：

```
客户端 → /api/proxy?url={视频地址} → Bilibili CDN → 客户端
```

### 4. 数据流

```
输入 BV 号 → 解析视频信息 → 获取下载地址 → 代理下载/预览
```

## 注意事项

本项目仅供学习研究，请勿用于商业用途或下载受版权保护的内容。
