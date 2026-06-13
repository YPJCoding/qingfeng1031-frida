# ⚠️ 核心约束（每次回答前自查）

- **纯 Frida JS**，无 Lua 层，不依赖 `df_game_r.lua`
- **迁移唯一参照**：`/Users/YPJCoding/Downloads/frida_GM.js`，不与 dp2 对比
- **地址/逻辑禁止猜测**，必须逐行比对源文件
- 提及"对比/迁移/参考/参照/原版/来源"时，确认只引用了 frida_GM.js，没有提 Lua/dp2

## 服务器环境
- SSH：`ssh aliyun` → `root@39.105.29.15:22`，密钥 `~/.ssh/39.105.29.15_ed25519`
- 游戏运行在 Docker 容器 `dnf` 内（镜像 `registry.cn-hangzhou.aliyuncs.com/1995chen/dnf:centos7-2.1.9.fix1`）
- 开源仓库：[1995chen/dnf](https://github.com/1995chen/dnf) — 容器化 DNF 私服，已内置 DP2
- 两个频道：`siroco11`、`siroco52`
- Volume 映射：`/data/data`→`/data`，`/data/log`→`/home/neople/game/log`，`/data/mysql`→`/var/lib/mysql`
- Frida 部署：宿主机 `/data/data/frida/`，容器内 `/data/frida/`
- 游戏日志：`/data/log/siroco11/`、`/data/log/siroco52/`
- Frida 日志：`/data/data/frida/plugin.log`
- 道具名列表：`data/item_name_list.txt`（本地），`/data/frida/data/item_name_list.txt`（容器内），格式 `ID----名称`
- 重启容器：`ssh aliyun "docker restart dnf"`
- 容器内命令：`ssh aliyun "docker exec dnf <cmd>"`
- Supervisor：`http://39.105.29.15:2000`
- 数据库：game 用户 `uu5!^%jg`，其他凭据需用时询问
- shm-size 需 8g

## 行为约束
- **提交不改动**（`git commit` 只提交，不 push）
- **禁止自动部署**：无明确指令时不执行 `bash deploy.sh` 或 `docker restart`
- **询问不修改**：提问/咨询时只分析，不改代码；用户说"改/修/实现/开始"才动手
- 被指出幻觉/违反规则时，立即重读本文件

## 代码约定
- 模块化架构，`frida_modules/core|api|features|commands/` 四个子目录
- 命名：驼峰
- 消息类型：成功 `1`，错误 `2`
- 日志：`bootLog()`，禁止 `console.log`

## 参考项目（可扩展）

| 路径 | 类型 | 说明 |
|------|------|------|
| `/Users/YPJCoding/Downloads/frida_GM.js` | 纯 Frida | **功能迁移唯一来源** |
| `/Users/YPJCoding/Downloads/dp2` | Lua+Frida | 仅逻辑参考，不用于迁移比对 |
