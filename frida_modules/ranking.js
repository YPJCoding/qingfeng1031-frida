// ============================================================================
// DNF Frida modern modular package - ranking.js
// Combat-power ranking calculation, persistence, and packet dispatch.
// ============================================================================

// 15. 战力排行榜业务区
// ============================================================================

// 战力榜默认数据：客户端只展示前三名。
// 字段名称中 Grow / Guilkey / Guilname 等大小写沿用旧协议字段，避免影响客户端解析。
let ranklist = {
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
// 根据角色 ID 查询战力分。
// 默认适配：SELECT ZLZ FROM frida.battle WHERE CID = charac_no。
// 如果你使用其他战力表，只需要调整这里的 SQL 即可，不需要改排行榜其他逻辑。
/** getRankScore。
 * @param {unknown} characNo 参数。
 * @returns {unknown} 返回值。*/
function getRankScore(characNo) {
  let score = 0
  const query = `SELECT ZLZ FROM frida.battle WHERE CID='${characNo}';`
  if (apiMySQLExec(mySQLTaiwanCain, query)) {
    if (mySQLGetNRows(mySQLTaiwanCain) == 1) {
      mySQLFetch(mySQLTaiwanCain)
      score = parseInt(apiMySQLGetStr(mySQLTaiwanCain, 0))
    }
  }
  if (!score) {
    return 0
  }
  return score
}

// 创建一条空排行榜记录，字段结构保持和客户端协议一致。
/** createEmptyRankingItem。
 * @returns {unknown} 返回值。*/
function createEmptyRankingItem() {
  return {
    rank: 0,
    characname: '',
    job: 0,
    lev: 0,
    Grow: 0,
    Guilkey: 0,
    Guilname: '',
    str: '',
    equip: []
  }
}

// 读取当前角色身上的展示装备，用于排行榜站街外观显示。
/** collectRankingEquipments。
 * @param {unknown} user 参数。
 * @returns {unknown} 返回值。*/
function collectRankingEquipments(user) {
  const equipmentList = []
  const inven = cUserCharacInfoGetCurCharacInvenW(user)
  let slot = 0
  for (slot = 0; slot <= 10; slot++) {
    if (slot == 9) {
      // 第 9 位按原协议固定写 -1。
      equipmentList.push(-1)
      continue
    }
    const invenItem = cInventoryGetInvenRef(inven, inventoryTypeBody, slot)
    const itemId = invenItemGetKey(invenItem)
    equipmentList.push(itemId)
  }
  return equipmentList
}

// 构建当前玩家的排行榜展示数据。
/** buildRankingItemFromUser。
 * @param {unknown} user 参数。
 * @returns {unknown} 返回值。*/
function buildRankingItemFromUser(user) {
  const item = createEmptyRankingItem()
  const characNo = cUserCharacInfoGetCurCharacNo(user)
  item.rank = getRankScore(characNo)
  item.characname = apiCUserCharacInfoGetCurCharacName(user) + ''
  item.job = cUserCharacInfoGetCharacJob(user)
  item.lev = cUserCharacInfoGetCharacLevel(user)
  item.Grow = cUserCharacInfoGetCurCharacGrowType(user)
  item.Guilkey = cUserCharacInfoGetCharacGuildkey(user)
  item.Guilname = apiCUserGetGuildName(user)
  item.equip = collectRankingEquipments(user)
  item.Guilname ??= '未加入公会'
  return item
}

// 按角色名查找排行榜中的 key。
/** findRankingKeyByCharacName。
 * @param {unknown} characName 参数。
 * @returns {unknown} 返回值。*/
function findRankingKeyByCharacName(characName) {
  const entry = Object.entries(ranklist).find(([, v]) => v.characname === characName)
  return entry ? entry[0] : null
}

// 将排行榜对象转为数组，方便排序。
/** getRankingArray。
 * @returns {unknown} 返回值。*/
function getRankingArray() {
  return Object.values(ranklist)
}

// 根据战力分从高到低重建排行榜，只保留前三名。
/** rebuildTopRanking。
 * @param {unknown} rankArray 参数。
 * @param {unknown} maxCount 参数。
 * @returns {unknown} 返回值。*/
function rebuildTopRanking(rankArray, maxCount) {
  const result = {}
  let index = 0
  rankArray.sort(function (a, b) {
    return b.rank - a.rank
  })
  for (index = 0; index < rankArray.length && index < maxCount; index++) {
    result[(index + 1).toString()] = rankArray[index]
  }
  return result
}

// 玩家离开游戏世界时刷新战力榜。
/** updateRankingByUser。
 * @param {unknown} user 参数。
 * @returns {unknown} 返回值。*/
function updateRankingByUser(user) {
  const item = buildRankingItemFromUser(user)
  let existingKey = null
  let tempKey = null
  if (!item.rank) {
    return
  }
  existingKey = findRankingKeyByCharacName(item.characname)
  if (existingKey !== null) {
    ranklist[existingKey] = item
  } else {
    // 临时追加一条记录，再统一排序截取前三。
    tempKey = (getRankingArray().length + 1).toString()
    ranklist[tempKey] = item
  }
  ranklist = rebuildTopRanking(getRankingArray(), 3)
  pluginLogInfo(`排行榜已刷新: ${JSON.stringify(ranklist)}`)
}

// 向客户端下发战力榜站街数据。
// all = true  时广播给全频道在线玩家。
// all = false 时只发给指定 user。
let rankingBroadcastLastAt = 0
/** canBroadcastRanking。
 * @returns {unknown} 返回值。*/
function canBroadcastRanking() {
  const now = Date.now()
  if (now - rankingBroadcastLastAt < 3000) {
    return false
  }
  rankingBroadcastLastAt = now
  return true
}
/** sendRankingList。
 * @param {unknown} user 参数。
 * @param {unknown} all 参数。
 * @returns {unknown} 返回值。*/
function sendRankingList(user, all) {
  const packetGuard = apiPacketGuardPacketGuard()
  let key = null
  try {
    interfacePacketBufPutHeader(packetGuard, pluginPacket.rankingList.category, pluginPacket.rankingList.header)
    interfacePacketBufPutByte(packetGuard, Object.keys(ranklist).length)
    for (const rankingItem of Object.values(ranklist)) {
      const equipment = rankingItem.equip
      let slot = 0
      apiInterfacePacketBufPutString(packetGuard, rankingItem.characname)
      interfacePacketBufPutByte(packetGuard, rankingItem.lev)
      interfacePacketBufPutByte(packetGuard, rankingItem.job)
      interfacePacketBufPutByte(packetGuard, rankingItem.Grow)
      apiInterfacePacketBufPutString(packetGuard, rankingItem.Guilname)
      interfacePacketBufPutInt(packetGuard, rankingItem.Guilkey)
      for (slot = 0; slot < equipment.length; slot++) {
        if (slot == 9) {
          interfacePacketBufPutInt(packetGuard, -1)
          continue
        }
        interfacePacketBufPutInt(packetGuard, equipment[slot])
      }
    }
    interfacePacketBufFinalize(packetGuard, 1)
    if (all) {
      if (canBroadcastRanking()) {
        gameWorldSendAll(gGameWorld(), packetGuard)
      }
    } else {
      cUserSend(user, packetGuard)
    }
  } finally {
    destroyPacketGuardPacketGuard(packetGuard)
  }
}

// 热载脚本时，从数据库恢复排行榜数据。
/** eventRankinfoLoadFromDb。
 * @returns {unknown} 返回值。*/
function eventRankinfoLoadFromDb() {
  if (!isValidPointer(mySQLFrida)) {
    pluginLogWarn('[ranking] skip load: mysql frida not initialized')
    return
  }
  const query = "select event_info from game_event where event_id = 'rankinfo';"
  if (apiMySQLExec(mySQLFrida, query)) {
    if (mySQLGetNRows(mySQLFrida) == 1) {
      mySQLFetch(mySQLFrida)
      const info = apiMySQLGetStr(mySQLFrida, 0)
      ranklist = JSON.parse(info)
    }
  }
}

// 热载脚本时，将排行榜数据写回数据库。
/** eventRankinfoSaveToDb。
 * @returns {unknown} 返回值。*/
function eventRankinfoSaveToDb() {
  pluginSafeCall('event_rankinfo_save_to_db', function () {
    if (!isValidPointer(mySQLFrida)) {
      pluginLogWarn('[ranking] skip save: mysql frida not initialized')
      return
    }
    const info = sqlEscapeString(JSON.stringify(ranklist))
    apiMySQLExec(mySQLFrida, `replace into game_event (event_id, event_info) values ('rankinfo', '${info}');`)
  })
}

// 旧函数名兼容：保留原脚本中的调用方式，外部如果仍调用旧名称也不会报错。
/** GetRankNumber。
 * @param {unknown} characNo 参数。
 * @returns {unknown} 返回值。*/
function GetRankNumber(characNo) {
  return getRankScore(characNo)
}
/** GetMyEquInfo。
 * @param {unknown} user 参数。
 * @returns {unknown} 返回值。*/
function GetMyEquInfo(user) {
  return buildRankingItemFromUser(user)
}
/** SetRanking。
 * @param {unknown} user 参数。
 * @returns {unknown} 返回值。*/
function SetRanking(user) {
  return updateRankingByUser(user)
}
/** SendRankLits。
 * @param {unknown} user 参数。
 * @param {unknown} all 参数。
 * @returns {unknown} 返回值。*/
function SendRankLits(user, all) {
  return sendRankingList(user, all)
}

// ============================================================================

if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

__dnfExport({
  getRankScore, createEmptyRankingItem, collectRankingEquipments,
  buildRankingItemFromUser, findRankingKeyByCharacName, getRankingArray,
  rebuildTopRanking, updateRankingByUser, canBroadcastRanking, sendRankingList,
  eventRankinfoLoadFromDb, eventRankinfoSaveToDb,
  GetRankNumber, GetMyEquInfo, SetRanking, SendRankLits
})
__dnfMutable('ranklist', () => ranklist, (v) => { ranklist = v })
__dnfMutable('rankingBroadcastLastAt', () => rankingBroadcastLastAt, (v) => { rankingBroadcastLastAt = v })
