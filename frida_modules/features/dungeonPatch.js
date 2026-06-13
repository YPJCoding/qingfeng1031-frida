// ============================================================================
// DNF Frida modern modular package - dungeonPatch.js
// Dungeon quality-of-life patches: unlock all difficulties, share Seria room.
// ============================================================================

// 副本解锁全部难度
// ============================================================================

function unlockAllDungeonDifficulty(user) {
  const a3 = Memory.allocUtf8String('3')
  doUserDefineCommand(user, 120, a3)
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
