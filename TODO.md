# TODO

## hook_history_log

frida_GM.js 来源: `hook_history_log()` @ line 2273

**功能**: Hook `cHistoryTrace::operator()`@`0x854F990`，解析游戏事件日志 CSV，拦截以下事件：
- `Item-` (reason=3: 使用道具, reason=9: 分解道具)
- `KillMob` (杀怪)
- `Money+` (获得金币)
- `DungeonLeave` (离开副本 → 可触发自动修装备、重置异界次数)

**待处理**:
- `disintegrate_item_handler` 和 `use_item_handler` 在 frida_GM.js 中只有调用未定义，需确认是否需要实现
- 离开副本自动修装备/重置异界次数功能（当前被注释掉）

**移植目标**: `utilityPatches.js`，作为 `installHistoryLog()` 函数
