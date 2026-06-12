# 项目架构

## 服务器环境
- SSH：`ssh aliyun` → `root@39.105.29.15:22`，密钥 `~/.ssh/39.105.29.15_ed25519`
- 游戏运行在 Docker 容器 `dnf` 内（镜像 `registry.cn-hangzhou.aliyuncs.com/1995chen/dnf:centos7-2.1.9.fix1`）
- 开源仓库：[1995chen/dnf](https://github.com/1995chen/dnf) — 容器化 DNF 私服，已内置 DP2
- 两个频道：`siroco11`、`siroco52`
- Volume 映射：`/data/data`→`/data`，`/data/log`→`/home/neople/game/log`，`/data/mysql`→`/var/lib/mysql`
- Frida 文件部署位置：宿主机 `/data/data/frida/`，容器内对应 `/data/frida/`
- 游戏日志：`/data/log/siroco11/`、`/data/log/siroco52/`
- Frida 日志：`/data/data/frida/plugin.log`
- 重启容器：`ssh aliyun "docker restart dnf"`
- 容器内执行命令：`ssh aliyun "docker exec dnf <cmd>"`
- 进程管理页面：`http://39.105.29.15:2000`（supervisor）
- 数据库：game 用户 `uu5!^%jg`，其他凭据不记录，需用时询问
- shm-size 需 8g，内存不足会导致五国失败或 Init DataManager 循环

## 行为约束
- **提交不改动**（`git commit` 只提交，不 push）
- **禁止自动部署**：没有用户明确指令时，不得执行 `bash deploy.sh` 或 `docker restart`

## 运行时
- **纯 Frida JS**，注入到 df_game_r 游戏进程
- 通过 Frida API（`Interceptor.attach`/`replace`、`NativeCallback`、`NativeFunction`）Hook 游戏 C++ 函数
- **没有 Lua 层**，不依赖 `df_game_r.lua`
- 部署：`bash deploy.sh`（scp 到 aliyun + docker restart dnf）
- 提交用 `git commit`，不建议 force push

## 代码约定
- 模块化架构，`frida_modules/` 下每个 `.js` 独立加载
- 函数命名：驼峰（camelCase）
- 消息类型：成功 `1`，错误 `2`
- Hook 地址和逻辑**禁止猜测**，必须逐行比对源文件

## 参考项目（可扩展）

| 路径 | 类型 | 说明 |
|------|------|------|
| `/Users/YPJCoding/Downloads/dp2` | Lua + Frida 混合 | DNF 私服框架，架构不同，仅作逻辑参考 |
| `/Users/YPJCoding/Downloads/frida_GM.js` | 纯 Frida | 功能迁移直接来源，地址/逻辑以它为准 |

> 新参考项目追加到上表即可，我会在每次会话中自动读取。
