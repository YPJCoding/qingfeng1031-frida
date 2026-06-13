// ============================================================================
// DNF Frida modern modular package - dungeonPatch.js
// 副本便捷补丁：解锁全难度、赛利亚房间互通。
// ============================================================================

// 副本解锁全部难度
// ============================================================================

function unlockAllDungeonDifficulty(user) {
  bootLog('[DUNGEON] unlockAllDungeonDifficulty 被调用')
  const a3 = Memory.allocUtf8String('3')
  const ret = doUserDefineCommand(user, 120, a3)
  bootLog('[DUNGEON] doUserDefineCommand 返回值: ' + ret)
}

// 赛利亚房间互通
// ============================================================================

function shareSeriaRoom() {
  Interceptor.attach(ptr(0x86C25A6), {
    onEnter(args) {
      args[0].add(0x68).writeInt(0)
    }
  })
}

// 主安装入口
// ============================================================================

function installDungeonPatch() {
  try { shareSeriaRoom() } catch (e) { bootLog('[DUNGEON] 赛利亚互通安装失败: ' + e) }
  bootLog('[DUNGEON] 副本全难度解锁 + 赛利亚互通补丁已安装')
}

// ============================================================================

if (!globalThis.dnfPlugin) { globalThis.dnfPlugin = {} }
__dnfExport({ unlockAllDungeonDifficulty, shareSeriaRoom, installDungeonPatch })
