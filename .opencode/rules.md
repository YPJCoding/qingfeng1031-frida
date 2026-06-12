# 项目架构

## 服务器环境
- SSH：`ssh aliyun` → `root@39.105.29.15:22`，密钥 `~/.ssh/39.105.29.15_ed25519`
- 游戏运行在 Docker 容器 `dnf` 内（镜像 `registry.cn-hangzhou.aliyuncs.com/1995chen/dnf:centos7-2.1.9.fix1`）
- 两个频道：`siroco11`、`siroco52`
- 宿主机路径 → 容器内路径：`/data/data` → `/data`（volume mount）
- Frida 文件部署位置：宿主机 `/data/data/frida/`，容器内对应 `/data/frida/`
- 日志：`/data/data/frida/plugin.log`
- 重启容器：`ssh aliyun "docker restart dnf"`
- 容器内执行命令：`ssh aliyun "docker exec dnf <cmd>"`

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
