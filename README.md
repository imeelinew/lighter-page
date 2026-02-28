# lighter-page

一个基于 Docker + Nginx 的轻量起始页，适合部署到 VPS 自托管使用。

## 当前能力

- Google 搜索
- 分组书签
- 书签增删改查
- 书签拖拽排序
- 自定义弹层
- 手机端适配
- Docker 部署

## 目录结构

```text
.
|-- Dockerfile
|-- docker-compose.yml
|-- nginx.conf
`-- public
    |-- app.js
    |-- assets
    |-- data
    |   `-- bookmarks.json
    |-- index.html
    `-- styles.css
```

## 本地启动

```bash
docker compose up -d --build
```

默认访问：

```text
http://localhost:8080
```

## VPS 自托管

### 1. 安装 Docker

Ubuntu / Debian 常见安装方式：

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

安装完成后确认：

```bash
docker --version
docker compose version
```

### 2. 上传项目到 VPS

方式任选一种：

- `git clone`
- `scp` 上传
- SFTP / 面板上传

例如：

```bash
git clone <your-repo-url> lighter-page
cd lighter-page
```

### 3. 修改默认书签

编辑：

[`public/data/bookmarks.json`](/c:/Development/lighter-page/public/data/bookmarks.json)

注意：

- 这是默认配置
- 首次打开会导入到浏览器本地
- 如果某个浏览器后续已经自己改过书签，那么它会优先使用本地数据
- 想重新读取默认配置，可以点页面里的“恢复默认”

### 4. 启动容器

```bash
docker compose up -d --build
```

查看状态：

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs -f
```

### 5. 放行端口

当前 compose 映射的是：

```text
8080 -> 80
```

如果 VPS 开了防火墙，需要放行 `8080`：

```bash
sudo ufw allow 8080/tcp
```

然后直接访问：

```text
http://你的VPS公网IP:8080
```

## 绑定域名和 HTTPS

最推荐的方式是让这个容器继续监听 `8080`，前面再挂一个反向代理。

常见方案：

- Caddy
- Nginx Proxy Manager
- 你自己的 Nginx / Caddy

### Caddy 示例

如果你的域名是 `start.example.com`，Caddy 可以直接反代并自动签发 HTTPS：

```caddyfile
start.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

这样外部访问就是：

```text
https://start.example.com
```

## 更新项目

如果你修改了页面代码，VPS 上执行：

```bash
docker compose up -d --build
```

如果只是改默认书签：

```bash
docker compose restart
```

## 停止项目

```bash
docker compose down
```

## 说明

- `docker-compose.yml` 已加 `restart: unless-stopped`
- `bookmarks.json` 使用只读挂载，容器内不会改坏你的默认配置
- 用户在浏览器里新增、编辑、排序书签后，数据保存在该浏览器自己的 `localStorage`
- 这意味着它不是“服务端统一账号同步”，而是“每个浏览器各自保存”

## 更适合长期使用的下一步

如果你后面要把它变成更完整的自托管首页，最值得继续做的是：

1. 增加服务端持久化，而不是只靠浏览器 `localStorage`
2. 增加登录或单用户鉴权
3. 增加一份专门给 VPS 用的反向代理配置
