// ============================================================================
// DNF Frida modern modular package - villageState.js
// Village attack constants, mutable event state, and related native bindings.
// ============================================================================

// 09. 怪物攻城常量与运行状态区
// ============================================================================

//怪物攻城活动当前状态
const villageAttackStateP1 = 0 //一阶段
const villageAttackStateP2 = 1 //二阶段
const villageAttackStateP3 = 2 //三阶段
const villageAttackStateEnd = 3 //活动已结束

const tauCaptainMonsterId = 50071 //牛头统帅id(P1阶段击杀该怪物可提升活动难度等级)
const gblPopeMonsterId = 262 //GBL教主教(P2/P3阶段城镇存在该怪物 持续减少PT点数)
const tauMetaCowMonsterId = 17 //机械牛(P3阶段世界BOSS)

const eventVillageAttackStartHour = 12 //每日北京时间20点开启活动
const eventVillageAttackTargetScore = [100, 200, 300] //各阶段目标PT
const eventVillageAttackTotalTime = 3600 //活动总时长(秒)

//怪物攻城活动数据
let villageAttackEventInfo = {
  state: villageAttackStateEnd,
  //活动当前状态
  score: 0,
  //当前阶段频道内总PT
  start_time: 0,
  //活动开始时间(UTC)
  difficult: 0,
  //活动难度(0-4)
  next_village_monster_id: 0,
  //下次刷新的攻城怪物id
  last_killed_monster_id: 0,
  //上次击杀的攻城怪物id
  p2_last_killed_monster_time: 0,
  //P2阶段上次击杀攻城怪物时间
  p2_kill_combo: 0,
  //P2阶段连续击杀相同攻城怪物数量
  gbl_cnt: 0,
  //城镇中存活的GBL主教数量
  defend_success: 0,
  //怪物攻城活动防守成功
  user_pt_info: {} //角色个人pt数据
}
//获取角色所在队伍
const cUserGetParty = new NativeFunction(ptr(0x0865514c), 'pointer', ['pointer'], {
  abi: 'sysv'
})
//获取队伍中玩家
const cPartyGetUser = new NativeFunction(ptr(0x08145764), 'pointer', ['pointer', 'int'], {
  abi: 'sysv'
})
//获取角色扩展数据
const cUserGetCharacExpandData = new NativeFunction(ptr(0x080dd584), 'pointer', ['pointer', 'int'], {
  abi: 'sysv'
})
//绝望之塔层数
const todLayerTodLayer = new NativeFunction(ptr(0x085fe7b4), 'pointer', ['pointer', 'int'], {
  abi: 'sysv'
})
//设置绝望之塔层数
const todUserStateSetEnterLayer = new NativeFunction(ptr(0x086438fc), 'pointer', ['pointer', 'pointer'], {
  abi: 'sysv'
})
//获取角色当前持有金币数量
const cInventoryGetMoney = new NativeFunction(ptr(0x81347d6), 'int', ['pointer'], {
  abi: 'sysv'
})
//通知客户端更新角色身上装备
const cUserSendNotiPacket = new NativeFunction(ptr(0x0867ba5c), 'int', ['pointer', 'int', 'int', 'int'], {
  abi: 'sysv'
})
//开启怪物攻城
const interVillageAttackedStartDispatchSig = new NativeFunction(
  ptr(0x84df47a),
  'pointer',
  ['pointer', 'pointer', 'pointer'],
  {
    abi: 'sysv'
  }
)
//结束怪物攻城
const villageAttackedCVillageMonsterMgrOnDestroyVillageMonster = new NativeFunction(
  ptr(0x086b43d4),
  'pointer',
  ['pointer', 'int'],
  {
    abi: 'sysv'
  }
)
const globalDataSVillageMonsterMgr = ptr(0x941f77c)
const nullptr = Memory.alloc(4)
const invenItem = new NativeFunction(ptr(0x080cb854), 'void', ['pointer'], {
  abi: 'sysv'
})
const getItemIndex = new NativeFunction(ptr(0x08110c48), 'int', ['pointer'], {
  abi: 'sysv'
})
const GetCurCharacNo = new NativeFunction(ptr(0x80cbc4e), 'int', ['pointer'], {
  abi: 'sysv'
})
const GetServerGroup = new NativeFunction(ptr(0x080cbc90), 'int', ['pointer'], {
  abi: 'sysv'
})
const GetCurVAttackCount = new NativeFunction(ptr(0x084ec216), 'int', ['pointer'], {
  abi: 'sysv'
})
const ReqDBSendNewSystemMail = new NativeFunction(
  ptr(0x085555e8),
  'int',
  ['pointer', 'pointer', 'int', 'int', 'pointer', 'int', 'int', 'int', 'char', 'char'],
  {
    abi: 'sysv'
  }
)
// ============================================================================

// ============================================================================
// 模块公共 API 注册区
// ============================================================================
if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

/**
 * Registers public symbols exported by villageState.js.
 * Symbols are also attached to globalThis to preserve old script-style references
 * between modules loaded through Frida Script.load().
 * @returns {void}
 */
function registerCurrentModuleSymbols() {
  globalThis.villageAttackStateP1 = villageAttackStateP1
  globalThis.dnfPlugin.villageAttackStateP1 = villageAttackStateP1
  globalThis.villageAttackStateP2 = villageAttackStateP2
  globalThis.dnfPlugin.villageAttackStateP2 = villageAttackStateP2
  globalThis.villageAttackStateP3 = villageAttackStateP3
  globalThis.dnfPlugin.villageAttackStateP3 = villageAttackStateP3
  globalThis.villageAttackStateEnd = villageAttackStateEnd
  globalThis.dnfPlugin.villageAttackStateEnd = villageAttackStateEnd
  globalThis.tauCaptainMonsterId = tauCaptainMonsterId
  globalThis.dnfPlugin.tauCaptainMonsterId = tauCaptainMonsterId
  globalThis.gblPopeMonsterId = gblPopeMonsterId
  globalThis.dnfPlugin.gblPopeMonsterId = gblPopeMonsterId
  globalThis.tauMetaCowMonsterId = tauMetaCowMonsterId
  globalThis.dnfPlugin.tauMetaCowMonsterId = tauMetaCowMonsterId
  globalThis.eventVillageAttackStartHour = eventVillageAttackStartHour
  globalThis.dnfPlugin.eventVillageAttackStartHour = eventVillageAttackStartHour
  globalThis.eventVillageAttackTargetScore = eventVillageAttackTargetScore
  globalThis.dnfPlugin.eventVillageAttackTargetScore = eventVillageAttackTargetScore
  globalThis.eventVillageAttackTotalTime = eventVillageAttackTotalTime
  globalThis.dnfPlugin.eventVillageAttackTotalTime = eventVillageAttackTotalTime
  globalThis.cUserGetParty = cUserGetParty
  globalThis.dnfPlugin.cUserGetParty = cUserGetParty
  globalThis.cPartyGetUser = cPartyGetUser
  globalThis.dnfPlugin.cPartyGetUser = cPartyGetUser
  globalThis.cUserGetCharacExpandData = cUserGetCharacExpandData
  globalThis.dnfPlugin.cUserGetCharacExpandData = cUserGetCharacExpandData
  globalThis.todLayerTodLayer = todLayerTodLayer
  globalThis.dnfPlugin.todLayerTodLayer = todLayerTodLayer
  globalThis.todUserStateSetEnterLayer = todUserStateSetEnterLayer
  globalThis.dnfPlugin.todUserStateSetEnterLayer = todUserStateSetEnterLayer
  globalThis.cInventoryGetMoney = cInventoryGetMoney
  globalThis.dnfPlugin.cInventoryGetMoney = cInventoryGetMoney
  globalThis.cUserSendNotiPacket = cUserSendNotiPacket
  globalThis.dnfPlugin.cUserSendNotiPacket = cUserSendNotiPacket
  globalThis.interVillageAttackedStartDispatchSig = interVillageAttackedStartDispatchSig
  globalThis.dnfPlugin.interVillageAttackedStartDispatchSig = interVillageAttackedStartDispatchSig
  globalThis.villageAttackedCVillageMonsterMgrOnDestroyVillageMonster = villageAttackedCVillageMonsterMgrOnDestroyVillageMonster
  globalThis.dnfPlugin.villageAttackedCVillageMonsterMgrOnDestroyVillageMonster = villageAttackedCVillageMonsterMgrOnDestroyVillageMonster
  globalThis.globalDataSVillageMonsterMgr = globalDataSVillageMonsterMgr
  globalThis.dnfPlugin.globalDataSVillageMonsterMgr = globalDataSVillageMonsterMgr
  globalThis.nullptr = nullptr
  globalThis.dnfPlugin.nullptr = nullptr
  globalThis.invenItem = invenItem
  globalThis.dnfPlugin.invenItem = invenItem
  globalThis.getItemIndex = getItemIndex
  globalThis.dnfPlugin.getItemIndex = getItemIndex
  globalThis.GetCurCharacNo = GetCurCharacNo
  globalThis.dnfPlugin.GetCurCharacNo = GetCurCharacNo
  globalThis.GetServerGroup = GetServerGroup
  globalThis.dnfPlugin.GetServerGroup = GetServerGroup
  globalThis.GetCurVAttackCount = GetCurVAttackCount
  globalThis.dnfPlugin.GetCurVAttackCount = GetCurVAttackCount
  globalThis.ReqDBSendNewSystemMail = ReqDBSendNewSystemMail
  globalThis.dnfPlugin.ReqDBSendNewSystemMail = ReqDBSendNewSystemMail
  Object.defineProperty(globalThis, 'villageAttackEventInfo', {
    get: function () {
      return villageAttackEventInfo
    },
    set: function (value) {
      villageAttackEventInfo = value
    },
    configurable: true
  })
  Object.defineProperty(globalThis.dnfPlugin, 'villageAttackEventInfo', {
    get: function () {
      return villageAttackEventInfo
    },
    set: function (value) {
      villageAttackEventInfo = value
    },
    configurable: true
  })
}

registerCurrentModuleSymbols()
