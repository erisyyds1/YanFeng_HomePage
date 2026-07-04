# MySQL 部署说明

## 目的

`mysql` 服务为 Go API 提供 MySQL 8 数据库。表结构由后端 GORM 在启动时自动迁移，当前目录不维护手写初始化 SQL。

## 使用方法

通过项目根目录的 Compose 启动：

```bash
docker compose up -d --build
```

## 参数说明

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `MYSQL_DATABASE` | `yanfeng_homepage` | 应用数据库名 |
| `MYSQL_USER` | `yanfeng` | 应用数据库用户 |
| `MYSQL_PASSWORD` | 无，必须在 `.env` 中配置 | 应用数据库密码 |
| `MYSQL_ROOT_PASSWORD` | 无，必须在 `.env` 中配置 | MySQL root 密码 |

## 返回值

MySQL 不直接对外暴露 HTTP 返回值。Go API 会通过 Compose 内部网络连接 `mysql:3306`。

## 示例

```bash
cp .env.example .env
docker compose up -d --build
docker compose logs -f mysql
```
