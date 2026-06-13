// ============================================================================
// DNF Frida modern modular package - config.js
// 功能开关、运行配置、协议常量及关键地址。
// ============================================================================

// ============================================================================

// 功能开关说明：
// true  = 启用该功能
// false = 禁用该功能
// 注意：数据库、定时器、怪物攻城之间存在依赖，关闭前请确认对应功能不再使用。
const pluginFeatureSwitch = {
  // 基础能力：配置文件加载。
  loadConfig: true,
  // 基础能力：初始化 / 关闭数据库。
  database: true,
  // 基础能力：挂接服务器定时器分发线程，用于把逻辑投递到主线程执行。
  timerDispatcher: true,
  // 绝望之塔：修复门票 / 金币扣除，并可跳过每 10 层 UserAPC。
  towerOfDespair: true,
  // 时装徽章：修复 / 接管时装徽章镶嵌处理。
  avatarEmblemSocket: true,
  // 时装潜能：启用随机潜能属性下发与校验绕过。
  hiddenOption: true,
  // 玩家上下线 Hook：用于登录问候、排行榜下发、怪物攻城状态同步。
  userWorldHook: true,
  // 排行榜：玩家下线时刷新战力榜，玩家上线时下发战力前三名站街数据。
  ranking: true,
  // 怪物攻城：开启活动定时器、难度广播、进度同步、奖励回调等。
  villageAttack: true,
  // 勇士归来：修改回归勇士判定天数。
  returnUser: true,
  // 登录问候：玩家进入世界后发送一条提示消息。
  loginGreeting: true,
  // 在线奖励：原脚本默认关闭，这里继续默认关闭。
  onlineReward: true,
  // 爆率控制：修改装备掉落品级倍率。
  dropRate: true,
  // GM权限绕过：Hook权限检查，使所有角色可使用 // 命令。
  gmBypass: true,
  // 自定义GM命令：//move //coin //lv //repair 等15条命令。
  gmCommands: true,
  dungeonPatch: true,
  utilityPatches: true
}
// ============================================================================
// ============================================================================

const pluginRuntimeConfig = {
  // 本地配置文件路径。
  configPath: '/data/frida/frida_config.json',
  // 是否跳过绝望之塔每 10 层的 UserAPC。
  skipTodUserApc: true,
  // 勇士归来判定天数。
  returnUserDays: 15,
  // 是否允许重复执行 start()。
  // false：避免重复热载导致重复 Hook；如果你的加载器确实需要重复安装 Hook，可改为 true。
  allowRepeatStart: false
}
// ============================================================================
// ============================================================================

// 这里只集中 start / awake / 后续模块包装会直接使用到的地址。
// 早期 NativeFunction 大量地址仍保留在原绑定处，方便降低重构风险。
const pluginAddress = {
  checkArgv: ptr(0x829ea5a),
  gameWorldReach: ptr(0x86c4e50),
  gameWorldLeave: ptr(0x86c5288),
  returnUserDays: ptr(0x84c753d)
}
// ============================================================================
// ============================================================================

const pluginPacket = {
  rankingList: {
    category: 0,
    header: 182
  },
  avatarEmblemResult: {
    category: 1,
    header: 204,
    success: 1
  }
}
// ============================================================================

if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

__dnfExport({ pluginFeatureSwitch, pluginRuntimeConfig, pluginAddress, pluginPacket })
