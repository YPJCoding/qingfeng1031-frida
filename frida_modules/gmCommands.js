// ============================================================================
// DNF Frida modern modular package - gmCommands.js
// Custom GM commands: move, coin, cash, item, level, repair, quest, hell.
// ============================================================================

// GM命令定义区
// ============================================================================

const COMMANDS = [
  { cmd: '//test', desc: 'GM测试命令' },
  { cmd: '//move/mv {village} {area} {x} {y}', desc: '城镇移动' },
  { cmd: '//coin {num}', desc: '获取金币 [1,10000000]' },
  { cmd: '//cash {num}', desc: '获得点券 [1,100000]' },
  { cmd: '//it {id} {num}', desc: '按id获得物品' },
  { cmd: '//finditem/fi {name}', desc: '物品名称模糊查找id' },
  { cmd: '//itemname/in {name} {num}', desc: '按名称获得物品' },
  { cmd: '//repair/rp', desc: '修复装备' },
  { cmd: '//questfinish/qf', desc: '完成已接任务' },
  { cmd: '//questclear/qc', desc: '完成已接任务并领取奖励' },
  { cmd: '//questreset/qr', desc: '重置所有任务' },
  { cmd: '//questall/qa', desc: '完成当前等级所有主线任务' },
  { cmd: '//onhell/onh', desc: '开启深渊模式' },
  { cmd: '//offhell/ofh', desc: '关闭深渊模式' },
  { cmd: '//lv {level}', desc: '角色到指定等级' },
  { cmd: '//help/h', desc: '显示帮助信息' },
  { cmd: '//decompose/dc', desc: '批量分解背包装备' },
  { cmd: '//inherit/ih', desc: '装备继承(背包第1格→身上同类型)' },
  { cmd: '//dimreset/dr {index}', desc: '重置异界次数(0-5)' },
  { cmd: '//clearmail/cm', desc: '清空角色邮件' },
  { cmd: '//clearavatar/ca', desc: '清空时装栏' },
  { cmd: '//clearcreature/cc', desc: '清空宠物栏' },
  { cmd: '//crossover/cs', desc: '跨界石(背包第1格→账号金库)' },
  { cmd: '//job {job} {growtype} {level}', desc: '转职(job=职业ID growtype=成长类型 level=等级)' }
]

// 道具名称列表
// ============================================================================

let g_itemNameList = null

function ensureItemNameListLoaded() {
  if (g_itemNameList) return
  try {
    const f = new File('/data/frida/data/item_name_list.txt', 'r')
    g_itemNameList = []
    let count = 0
    while (count < 50000) {
      const line = f.readLine()
      if (!line) break
      const p = line.indexOf('----')
      if (p < 0) continue
      g_itemNameList.push({ id: line.slice(0, p), name: line.slice(p + 4) })
      count++
    }
    f.close()
  } catch (e) {
    g_itemNameList = []
  }
}

// 深渊模式
// ============================================================================

let heffPartyTag = 0

function startHellParty() {
  Interceptor.attach(ptr(0x085a0954), {
    onEnter(args) {
      bootLog('[HELL] hook触发, heffPartyTag=' + heffPartyTag)
      if (heffPartyTag) {
        args[3] = ptr(1)
        bootLog('[HELL] 深渊模式已注入')
      }
    }
  })
  bootLog('[HELL] startHellParty hook installed at 0x085a0954')
}

// 命令处理器
// ============================================================================

function cmdMove(user, args) {
  if (args.length < 4) {
    apiCUserSendNotiPacketMessage(user, '格式: //move village area x y', 2)
    return
  }
  const village = parseInt(args[0], 10)
  const area = parseInt(args[1], 10)
  const x = parseInt(args[2], 10)
  const y = parseInt(args[3], 10)
  gameWorldMoveArea(gGameWorld(), user, village, area, x, y, 0, 0, 0, 0, 0)
  apiCUserSendNotiPacketMessage(user, '移动成功', 1)
}

function cmdCoin(user, args) {
  if (args.length < 1) {
    apiCUserSendNotiPacketMessage(user, '格式: //coin 数量 [1,10000000]', 2)
    return
  }
  const amount = parseInt(args[0], 10)
  if (amount < 1 || amount > 10000000) {
    apiCUserSendNotiPacketMessage(user, '金币数量范围为 [1, 10000000]', 2)
    return
  }
  const inven = cUserCharacInfoGetCurCharacInvenW(user)
  cInventoryGainMoney(inven, amount, 0, 0, 0)
  cUserSendUpdateItemList(user, 1, 0, 0)
  apiCUserSendNotiPacketMessage(user, '已获得金币: ' + amount, 1)
}

function cmdCash(user, args) {
  if (args.length < 1) {
    apiCUserSendNotiPacketMessage(user, '格式: //cash 数量 [1,100000]', 2)
    return
  }
  const amount = parseInt(args[0], 10)
  if (amount < 1 || amount > 100000) {
    apiCUserSendNotiPacketMessage(user, '点券数量范围为 [1, 100000]', 2)
    return
  }
  apiRechargeCashCera(user, amount)
  apiCUserSendNotiPacketMessage(user, '已获得点券: ' + amount, 1)
}

function cmdItem(user, args) {
  if (args.length < 2) {
    apiCUserSendNotiPacketMessage(user, '格式: //it id 数量', 2)
    return
  }
  const id = parseInt(args[0], 10)
  const count = parseInt(args[1], 10)
  if (count <= 0) {
    apiCUserSendNotiPacketMessage(user, '数量必须大于0', 2)
    return
  }
  cUserAddItem(user, id, count, 6, ptr(0), 0)
  apiCUserSendNotiPacketMessage(user, '已获得物品 ID=' + id + ' 数量=' + count, 1)
}

function cmdFindItem(user, args) {
  if (args.length < 1) {
    apiCUserSendNotiPacketMessage(user, '格式: //fi 物品名称', 2)
    return
  }
  ensureItemNameListLoaded()
  if (!g_itemNameList || g_itemNameList.length === 0) {
    apiCUserSendNotiPacketMessage(user, '道具查找功能不可用', 2)
    return
  }
  const keyword = args.join(' ').toLowerCase()
  const matches = []
  for (let i = 0; i < g_itemNameList.length; i++) {
    if (g_itemNameList[i].name.toLowerCase().includes(keyword)) {
      matches.push(g_itemNameList[i])
      if (matches.length >= 20) break
    }
  }
  if (matches.length === 0) {
    apiCUserSendNotiPacketMessage(user, '未找到匹配物品: ' + keyword, 2)
    return
  }
  for (let i = 0; i < matches.length; i++) {
    apiCUserSendNotiPacketMessage(user, 'ID=' + matches[i].id + ' ' + matches[i].name, 1)
  }
  if (matches.length >= 20) {
    apiCUserSendNotiPacketMessage(user, '结果过多，只显示前20条', 1)
  }
}

function cmdItemName(user, args) {
  if (args.length < 1) {
    apiCUserSendNotiPacketMessage(user, '格式: //in 物品名称 [数量]', 2)
    return
  }
  ensureItemNameListLoaded()
  if (!g_itemNameList || g_itemNameList.length === 0) {
    apiCUserSendNotiPacketMessage(user, '道具查找功能不可用', 2)
    return
  }
  const countArg = args.length >= 2 ? parseInt(args[args.length - 1], 10) : 1
  const hasCount = args.length >= 2 && !isNaN(countArg) && countArg > 0
  const searchEnd = hasCount ? args.length - 1 : args.length
  const name = args.slice(0, searchEnd).join(' ').toLowerCase()
  const matches = []
  for (let i = 0; i < g_itemNameList.length; i++) {
    if (g_itemNameList[i].name.toLowerCase() === name) {
      matches.push(g_itemNameList[i])
    }
  }
  if (matches.length === 0) {
    apiCUserSendNotiPacketMessage(user, '未找到匹配物品: ' + name, 2)
    return
  }
  if (matches.length > 1) {
    for (let i = 0; i < Math.min(matches.length, 10); i++) {
      apiCUserSendNotiPacketMessage(user, 'ID=' + matches[i].id + ' ' + matches[i].name, 1)
      }
      if (matches.length > 10) {
        apiCUserSendNotiPacketMessage(user, '匹配过多，只显示前10条，请使用精确名称', 1)
    }
    return
  }
  const count = hasCount ? countArg : 1
  cUserAddItem(user, parseInt(matches[0].id, 10), count, 6, ptr(0), 0)
  apiCUserSendNotiPacketMessage(user, '已获得物品 ID=' + matches[0].id + ' ' + matches[0].name + ' 数量=' + count, 1)
}

function cmdRepair(user) {
  const inven = cUserCharacInfoGetCurCharacInvenW(user)
  // 身上装备栏 10-21 (INVENTORY_TYPE_BODY = 0)
  for (let slot = 10; slot <= 21; slot++) {
    const item = cInventoryGetInvenRef(inven, 0, slot)
    if (item.isNull()) continue
    const itemId = invenItemGetKey(item)
    if (!itemId) continue
    const itemData = cDataManagerFindItem(gCDataManager(), itemId)
    if (!itemData.isNull()) {
      const durabilityMax = cEquipItemGetEndurance(itemData)
      item.add(11).writeU16(durabilityMax)
      cUserSendUpdateItemList(user, 1, 3, slot)
    }
  }
  // 物品栏装备 3-8 (INVENTORY_TYPE_ITEM = 1)
  for (let slot = 3; slot <= 8; slot++) {
    const item = cInventoryGetInvenRef(inven, 1, slot)
    if (item.isNull()) continue
    const itemId = invenItemGetKey(item)
    if (!itemId) continue
    const itemData = cDataManagerFindItem(gCDataManager(), itemId)
    if (!itemData.isNull()) {
      const durabilityMax = cEquipItemGetEndurance(itemData)
      item.add(11).writeU16(durabilityMax)
    }
  }
  cUserSendItemspace(user, 0)
  apiCUserSendNotiPacketMessage(user, '装备已修复', 1)
}

function cmdLevel(user, args) {
  if (args.length < 1) {
    apiCUserSendNotiPacketMessage(user, '格式: //lv 等级', 2)
    return
  }
  const level = parseInt(args[0], 10)
  if (level < 1 || level > 70) {
    apiCUserSendNotiPacketMessage(user, '等级范围为 [1, 70]', 2)
    return
  }
  debugCommandSetLevel(ptr(0), user, level)
  apiCUserSendNotiPacketMessage(user, '角色等级已设置为: ' + level, 1)
}

function cmdQuestFinish(user) {
  const userQuest = cUserGetCurCharacQuestW(user)
  let success = 0, fail = 0
  for (let i = 0; i < 20; i++) {
    const questId = userQuest.add(4 * (i + 7500 + 2)).readInt()
    if (questId > 0) {
      try {
        clearDoingQuestEx(user, questId)
        success++
        bootLog('[QUEST-FINISH] quest=' + questId + ' OK')
      } catch (e) {
        fail++
        bootLog('[QUEST-FINISH] quest=' + questId + ' FAIL: ' + e)
      }
    }
  }
  cUserSendClearQuestList(user)
  const packetGuard = apiPacketGuardPacketGuard()
  userQuestGetQuestInfo(userQuest, packetGuard)
  cUserSend(user, packetGuard)
  destroyPacketGuardPacketGuard(packetGuard)
  apiCUserSendNotiPacketMessage(user, '任务完成: 成功' + success + ' 失败' + fail, 1)
}

function cmdQuestClear(user) {
  const userQuest = cUserGetCurCharacQuestW(user)
  let success = 0, fail = 0
  for (let i = 0; i < 20; i++) {
    const questId = userQuest.add(4 * (i + 7500 + 2)).readInt()
    if (questId > 0) {
      try {
        apiForceClearQuest(user, questId)
        success++
        bootLog('[QUEST-CLEAR] quest=' + questId + ' OK')
      } catch (e) {
        fail++
        bootLog('[QUEST-CLEAR] quest=' + questId + ' FAIL: ' + e)
      }
    }
  }
  cUserSendClearQuestList(user)
  const packetGuard = apiPacketGuardPacketGuard()
  userQuestGetQuestInfo(userQuest, packetGuard)
  cUserSend(user, packetGuard)
  destroyPacketGuardPacketGuard(packetGuard)
  apiCUserSendNotiPacketMessage(user, '任务完成并领奖: 成功' + success + ' 失败' + fail, 1)
}

function cmdQuestReset(user) {
  userQuestReset(user)
  cUserSendClearQuestList(user)
  const userQuest = cUserGetCurCharacQuestW(user)
  const packetGuard = apiPacketGuardPacketGuard()
  userQuestGetQuestInfo(userQuest, packetGuard)
  cUserSend(user, packetGuard)
  destroyPacketGuardPacketGuard(packetGuard)
  apiCUserSendNotiPacketMessage(user, '所有任务已重置', 1)
}

function cmdQuestAll(user) {
  const level = cUserCharacInfoGetCharacLevel(user)
  const dataManager = gCDataManager()
  for (let questId = 1; questId < 10000; questId++) {
    const quest = cDataManagerFindQuest(dataManager, questId)
    if (quest.isNull()) continue
    const questLevel = quest.add(0x10).readInt()
    if (questLevel <= 0 || questLevel > level) continue
    try { apiForceClearQuest(user, questId) } catch (e) {}
  }
  cUserSendClearQuestList(user)
  apiCUserSendNotiPacketMessage(user, '当前等级所有主线任务已完成', 1)
}

function cmdHellToggle(user, on) {
  heffPartyTag = on ? 1 : 0
  apiCUserSendNotiPacketMessage(user, on ? '深渊模式已开启' : '深渊模式已关闭', 1)
}

function cmdHelp(user) {
  for (let i = 0; i < COMMANDS.length; i++) {
    apiCUserSendNotiPacketMessage(user, COMMANDS[i].cmd + ' - ' + COMMANDS[i].desc, 1)
  }
}

function cmdDecompose(user) {
  var index = 0
  var checkTag = cUserCharacInfoGetCurCharacExpertJob(user)
  if (checkTag == 0) {
    apiCUserSendNotiPacketMessage(user, '注意： 副职业没有开启！', 1)
    return
  }
  var inven = cUserCharacInfoGetCurCharacInvenW(user)
  for (var i = 9; i <= 24; i++) {
    var equ = cInventoryGetInvenRef(inven, 1, i)
    if (invenItemGetKey(equ)) {
      cDisJointItem(user, i, 0, 239, user, 0xFFFF)
      equ = cInventoryGetInvenRef(inven, 1, i)
      if (invenItemGetKey(equ)) {
        // 失败
      } else {
        index++
        cUserSendUpdateItemList(user, 1, 0, i)
      }
    }
  }
  if (index > 0) {
    apiCUserSendNotiPacketMessage(user, '恭喜： ' + index + '件装备分解 成功！', 0)
  } else {
    apiCUserSendNotiPacketMessage(user, '注意： 装备分解 失败！', 0)
  }
}

function cmdInherit(user) {
  var inven = cUserCharacInfoGetCurCharacInvenW(user)
  var equ = cInventoryGetInvenRef(inven, 1, 9)
  var itemId = invenItemGetKey(equ)
  if (invenItemGetKey(equ)) {
    var upgrade_level = equ.add(6).readU8()
    var itemData = cDataManagerFindItem(gCDataManager(), itemId)
    var equ_type = itemData.add(141 * 4).readU32()
    var sub_type = cEquipItemGetSubType(itemData)
    var equRarity = cItemGetRarity(itemData)
    var needLevel = cItemGetUsableLevel(itemData)
    bootLog('equ_type :' + equ_type)
    bootLog('sub_type :' + sub_type)
    var useJob = ''
    for (var i = 60; i <= 70; i++) {
      useJob += itemData.add(i).readU8()
    }
    bootLog(equ_type + '  ' + useJob)
    if (equRarity < 3) {
      apiCUserSendNotiPacketMessage(user, '继承失败：装备品级必须要求粉色以上，继承装备不满足要求', 0)
      return
    }
    if (needLevel < 55) {
      apiCUserSendNotiPacketMessage(user, '继承失败：装备等级要大于等于55级以上，继承装备不满足要求(' + needLevel + ')', 0)
      return
    }
    var successTag = false
    for (var i = 10; i <= 21; i++) {
      var equIn = cInventoryGetInvenRef(inven, 0, i)
      if (invenItemGetKey(equIn)) {
        var inItemId = invenItemGetKey(equIn)
        var inItemData = cDataManagerFindItem(gCDataManager(), inItemId)
        var inEqu_type = inItemData.add(141 * 4).readU32()
        var inEquRarity = cItemGetRarity(inItemData)
        var inNeedLevel = cItemGetUsableLevel(inItemData)
        bootLog('equ_type a：' + equ_type + ',' + inEqu_type + ',' + inItemData.add(148).readU8())
        if (inEqu_type == equ_type) {
          if (inEqu_type == 10) {
            var useJob = ''
            var inUseJob = ''
            for (var i = 60; i <= 70; i++) {
              useJob += itemData.add(i).readU8()
              inUseJob += inItemData.add(i).readU8()
            }
            if (useJob != inUseJob) {
              apiCUserSendNotiPacketMessage(user, '继承失败：武器装备需要当前职业且同类型，穿戴装备不满足要求', 0)
              return
            }
            var inSubType = cEquipItemGetSubType(inItemData)
            if (sub_type != inSubType) {
              apiCUserSendNotiPacketMessage(user, '继承失败：武器装备需要当前职业且同类型，穿戴装备不满足要求', 0)
              return
            }
          }
          if (inEquRarity < 3) {
            apiCUserSendNotiPacketMessage(user, '继承失败：装备品级必须要求粉色以上，穿戴装备不满足要求', 0)
            return
          }
          if (inNeedLevel < 55) {
            apiCUserSendNotiPacketMessage(user, '继承失败：装备等级要大于等于55级以上，穿戴装备不满足要求', 0)
            return
          }
          var inUpgrade_level = equIn.add(6).readU8()
          var zengfu = equ.add(17).readU16()
          var duanzao = equ.add(51).readU8()
          var baozhu = equ.add(13).readU32()
          if (inUpgrade_level <= upgrade_level) {
            equIn.add(6).writeU8(upgrade_level)
            equIn.add(17).writeU16(zengfu)
            equIn.add(51).writeU8(duanzao)
            equIn.add(13).writeU32(baozhu)
            equ.add(6).writeU8(0)
            equ.add(17).writeU16(0)
            equ.add(51).writeU8(0)
            equ.add(13).writeU32(0)
            cUserSendUpdateItemList(user, 1, 3, i)
            cUserSendUpdateItemList(user, 1, 0, 9)
            successTag = true
            bootLog('success！！！')
            apiCUserSendNotiPacketMessage(user, '继承成功！！！', 0)
          }
          break
        }
      }
    }
    if (!successTag) {
      apiCUserSendNotiPacketMessage(user, '继承失败：没有合适的装备', 0)
    }
  }
}

function cmdDimReset(user, args) {
  if (args.length < 1) {
    apiCUserSendNotiPacketMessage(user, '格式: //dr 异界次数索引(0-5)', 2)
    return
  }
  var index = parseInt(args[0], 10)
  var dimensionInout = cDataManagerGetDimensionInout(gCDataManager(), index)
  cUserCharacInfoSetDemensionInoutValue(user, index, dimensionInout)
  apiCUserSendNotiPacketMessage(user, '异界次数已重置: ' + index, 1)
}

function cmdClearMail(user) {
  var charac_no = cUserCharacInfoGetCurCharacNo(user)
  apiMySQLExec(mySQLTaiwanCain2nd, 'delete from letter where charac_no=' + charac_no + ';')
  apiMySQLExec(mySQLTaiwanCain2nd, 'delete from postal where receive_charac_no=' + charac_no + ';')
  apiCUserSendNotiPacketMessage(user, '角色邮件已清空', 1)
}

function cmdClearAvatar(user) {
  var inven = cUserCharacInfoGetCurCharacInvenW(user)
  for (var i = 0; i <= 13; i++) {
    cInventoryDeleteItem(inven, 2, i, 1, 6, 1)
  }
  cUserSendItemspace(user, 1)
  apiCUserSendNotiPacketMessage(user, '时装栏已清空', 1)
}

function cmdClearCreature(user) {
  var inven = cUserCharacInfoGetCurCharacInvenW(user)
  for (var i = 0; i <= 13; i++) {
    cInventoryDeleteItem(inven, 3, i, 1, 6, 1)
  }
  cUserSendItemspace(user, 7)
  apiCUserSendNotiPacketMessage(user, '宠物栏已清空', 1)
}

function cmdCrossover(user) {
  var accountCargo = cUserGetAccountCargo(user)
  bootLog('账号金库：' + accountCargo)
  var emptyIndex = cAccountCargoGetEmptySlot(accountCargo)
  bootLog('空格子的位置:' + emptyIndex)
  if (emptyIndex == -1) {
    apiCUserSendNotiPacketMessage(user, '跨界失败：账号金库没有空的格子！！！', 0)
  }
  var inven = cUserCharacInfoGetCurCharacInvenW(user)
  var equ = cInventoryGetInvenRef(inven, 1, 9)
  var itemId = invenItemGetKey(equ)
  if (itemId) {
    var tag = cAccountCargoInsertItem(accountCargo, equ, emptyIndex)
    if (tag == -1) {
      bootLog('fail!!!')
      apiCUserSendNotiPacketMessage(user, '跨界失败：移入装备error', 0)
    } else {
      invenItemReset(equ)
      cUserSendUpdateItemList(user, 1, 0, 9)
      cAccountCargoSendItemList(accountCargo)
      bootLog('success!!!')
      apiCUserSendNotiPacketMessage(user, '跨界成功：已存入第 ' + (emptyIndex + 1) + ' 个格子！', 0)
    }
  }
}

function cmdJob(user, args) {
  if (args.length < 3) {
    apiCUserSendNotiPacketMessage(user, '格式: //job 职业ID 成长类型 等级', 2)
    return
  }
  var newJob = parseInt(args[0], 10)
  var newGrowtype = parseInt(args[1], 10)
  var newLevel = parseInt(args[2], 10)
  debugCommandSetLevel(ptr(0), user, newLevel)
  var characNo = cUserCharacInfoGetCurCharacNo(user)
  apiMySQLExec(mySQLTaiwanCain, 'update charac_info set job=' + newJob + ', grow_type=' + newGrowtype + ' where charac_no=' + characNo + ';')
  apiScheduleOnMainThread(function () { cUserReturnToSelectCharacList(user, 1) }, null)
  apiCUserSendNotiPacketMessage(user, '转职完成，请重新选择角色', 1)
}

// 命令路由
// ============================================================================

const CMD_MAP = {
  'test': function (user) { apiCUserSendNotiPacketMessage(user, 'GM测试成功', 1) },
  'move': cmdMove,
  'mv': cmdMove,
  'coin': cmdCoin,
  'cash': cmdCash,
  'it': cmdItem,
  'finditem': cmdFindItem,
  'fi': cmdFindItem,
  'itemname': cmdItemName,
  'in': cmdItemName,
  'repair': cmdRepair,
  'rp': cmdRepair,
  'questfinish': cmdQuestFinish,
  'qf': cmdQuestFinish,
  'questclear': cmdQuestClear,
  'qc': cmdQuestClear,
  'questreset': cmdQuestReset,
  'qr': cmdQuestReset,
  'questall': cmdQuestAll,
  'qa': cmdQuestAll,
  'onhell': function (user) { cmdHellToggle(user, true) },
  'onh': function (user) { cmdHellToggle(user, true) },
  'offhell': function (user) { cmdHellToggle(user, false) },
  'ofh': function (user) { cmdHellToggle(user, false) },
  'lv': cmdLevel,
  'help': cmdHelp,
  'h': cmdHelp,
  'decompose': cmdDecompose,
  'dc': cmdDecompose,
  'inherit': cmdInherit,
  'ih': cmdInherit,
  'dimreset': cmdDimReset,
  'dr': cmdDimReset,
  'clearmail': cmdClearMail,
  'cm': cmdClearMail,
  'clearavatar': cmdClearAvatar,
  'ca': cmdClearAvatar,
  'clearcreature': cmdClearCreature,
  'cc': cmdClearCreature,
  'crossover': cmdCrossover, 'cs': cmdCrossover,
  'job': cmdJob
}

function routeGmCommand(user, rawMsg) {
  const spaceIdx = rawMsg.indexOf(' ')
  const cmdName = spaceIdx < 0 ? rawMsg : rawMsg.slice(0, spaceIdx)
  const args = spaceIdx < 0 ? [] : rawMsg.slice(spaceIdx + 1).split(' ').filter(function (a) { return a.length > 0 })
  const handler = CMD_MAP[cmdName]
  if (!handler) {
    apiCUserSendNotiPacketMessage(user, '未知命令: //' + cmdName + ', 输入 //help 查看帮助', 2)
    return
  }
  try {
    handler(user, args)
  } catch (e) {
    apiCUserSendNotiPacketMessage(user, '命令执行失败: ' + cmdName, 2)
    bootLog('[GM-ERROR] cmd=' + cmdName + ' error=' + e)
  }
}

// 主安装入口
// ============================================================================

function installGmCommands() {
  try { startHellParty() } catch (e) {}

  Interceptor.attach(ptr(0x820BBDE), {
    onEnter(args) {
      const user = args[1]
      const rawPacketBuf = apiPacketBufGetBuf(args[2])
      const msgLen = rawPacketBuf.readInt()
      let msg = rawPacketBuf.add(4).readUtf8String(msgLen)
      msg = msg.slice(2)
      bootLog('[GM-COMMAND] user=' + apiCUserCharacInfoGetCurCharacName(user) + ' msg=' + msg)
      routeGmCommand(user, msg)
    }
  })

  bootLog('[GM] 自定义GM命令模块已安装')
}

// ============================================================================

if (!globalThis.dnfPlugin) { globalThis.dnfPlugin = {} }
__dnfExport({ installGmCommands })
