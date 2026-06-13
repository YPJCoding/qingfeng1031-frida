// ============================================================================
// DNF Frida modern modular package - ranking.js
// 静态战力排行榜展示（客户端站街显示前三名）。
// ============================================================================

const ranklist = {
  1: {
    rank: 100,
    characname: '虚位以待',
    job: 0,
    lev: 85,
    Grow: 17,
    Guilkey: 1,
    Guilname: '',
    str: '111！',
    equip: [101531433, 101551558, 101501731, 101571413, 101561697, 101521488, 101511859, 101541622, 0, -1, 101040146]
  },
  2: {
    rank: 90,
    characname: '虚位以待',
    job: 1,
    lev: 85,
    Grow: 17,
    Guilkey: 1,
    Guilname: '',
    str: '222！',
    equip: [45486, 43101, 44757, 43879, 43541, 44283, 45155, 45935, 0, -1, 102040100]
  },
  3: {
    rank: 80,
    characname: '虚位以待',
    job: 4,
    lev: 85,
    Grow: 17,
    Guilkey: 1,
    Guilname: '',
    str: '333！',
    equip: [57519, 55153, 56754, 55922, 55533, 56332, 57147, 57946, 0, -1, 108030043]
  }
}

function sendRankingList(user) {
  const packetGuard = apiPacketGuardPacketGuard()
  try {
    interfacePacketBufPutHeader(packetGuard, pluginPacket.rankingList.category, pluginPacket.rankingList.header)
    interfacePacketBufPutByte(packetGuard, Object.keys(ranklist).length)
    for (const rankingItem of Object.values(ranklist)) {
      const equipment = rankingItem.equip
      apiInterfacePacketBufPutString(packetGuard, rankingItem.characname)
      interfacePacketBufPutByte(packetGuard, rankingItem.lev)
      interfacePacketBufPutByte(packetGuard, rankingItem.job)
      interfacePacketBufPutByte(packetGuard, rankingItem.Grow)
      apiInterfacePacketBufPutString(packetGuard, rankingItem.Guilname)
      interfacePacketBufPutInt(packetGuard, rankingItem.Guilkey)
      for (let slot = 0; slot < equipment.length; slot++) {
        if (slot == 9) {
          interfacePacketBufPutInt(packetGuard, -1)
          continue
        }
        interfacePacketBufPutInt(packetGuard, equipment[slot])
      }
    }
    interfacePacketBufFinalize(packetGuard, 1)
    cUserSend(user, packetGuard)
  } finally {
    destroyPacketGuardPacketGuard(packetGuard)
  }
}

if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

__dnfExport({ sendRankingList })
