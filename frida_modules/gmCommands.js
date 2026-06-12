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
  { cmd: '//help/h', desc: '显示帮助信息' }
]

// 道具名称列表
// ============================================================================

let g_itemNameList = null

function ensureItemNameListLoaded() {
  if (g_itemNameList) return
  try {
    const f = new File('/dp2/frida/pvf_files.lst', 'r')
    g_itemNameList = []
    let count = 0
    while (count < 50000) {
      const line = f.readLine()
      if (!line) break
      const p = line.indexOf(' ')
      if (p < 0) continue
      g_itemNameList.push({ id: line.slice(0, p), name: line.slice(p + 1) })
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
  Interceptor.attach(ptr(0x85B15BC), {
    onEnter(args) {
      if (heffPartyTag) args[0].add(2).writeInt(1)
    }
  })
}

// 命令处理器
// ============================================================================

function cmdMove(user, args) {
  if (args.length < 4) {
    apiCUserSendNotiPacketMessage(user, '格式: //move village area x y', 6)
    return
  }
  const village = parseInt(args[0], 10)
  const area = parseInt(args[1], 10)
  const x = parseInt(args[2], 10)
  const y = parseInt(args[3], 10)
  gameWorldMoveArea(gGameWorld(), user, village, area, x, y, 0, 0, 0, 0, 0)
  apiCUserSendNotiPacketMessage(user, '移动成功', 6)
}

function cmdCoin(user, args) {
  if (args.length < 1) {
    apiCUserSendNotiPacketMessage(user, '格式: //coin 数量 [1,10000000]', 6)
    return
  }
  const amount = parseInt(args[0], 10)
  if (amount < 1 || amount > 10000000) {
    apiCUserSendNotiPacketMessage(user, '金币数量范围为 [1, 10000000]', 6)
    return
  }
  const inven = cUserCharacInfoGetCurCharacInvenW(user)
  cInventoryGainMoney(inven, amount, 0, 0, 0)
  cUserSendUpdateItemList(user, 1, 0, 0)
  apiCUserSendNotiPacketMessage(user, '已获得金币: ' + amount, 6)
}

function cmdCash(user, args) {
  if (args.length < 1) {
    apiCUserSendNotiPacketMessage(user, '格式: //cash 数量 [1,100000]', 6)
    return
  }
  const amount = parseInt(args[0], 10)
  if (amount < 1 || amount > 100000) {
    apiCUserSendNotiPacketMessage(user, '点券数量范围为 [1, 100000]', 6)
    return
  }
  apiRechargeCashCera(user, amount)
  apiCUserSendNotiPacketMessage(user, '已获得点券: ' + amount, 6)
}

function cmdItem(user, args) {
  if (args.length < 2) {
    apiCUserSendNotiPacketMessage(user, '格式: //it id 数量', 6)
    return
  }
  const id = parseInt(args[0], 10)
  const count = parseInt(args[1], 10)
  if (count <= 0) {
    apiCUserSendNotiPacketMessage(user, '数量必须大于0', 6)
    return
  }
  cUserAddItem(user, id, count, 6, ptr(0), 0)
  apiCUserSendNotiPacketMessage(user, '已获得物品 ID=' + id + ' 数量=' + count, 6)
}

function cmdFindItem(user, args) {
  if (args.length < 1) {
    apiCUserSendNotiPacketMessage(user, '格式: //fi 物品名称', 6)
    return
  }
  ensureItemNameListLoaded()
  if (!g_itemNameList || g_itemNameList.length === 0) {
    apiCUserSendNotiPacketMessage(user, '道具查找功能不可用', 6)
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
    apiCUserSendNotiPacketMessage(user, '未找到匹配物品: ' + keyword, 6)
    return
  }
  for (let i = 0; i < matches.length; i++) {
    apiCUserSendNotiPacketMessage(user, 'ID=' + matches[i].id + ' ' + matches[i].name, 6)
  }
  if (matches.length >= 20) {
    apiCUserSendNotiPacketMessage(user, '结果过多，只显示前20条', 6)
  }
}

function cmdItemName(user, args) {
  if (args.length < 1) {
    apiCUserSendNotiPacketMessage(user, '格式: //in 物品名称 [数量]', 6)
    return
  }
  ensureItemNameListLoaded()
  if (!g_itemNameList || g_itemNameList.length === 0) {
    apiCUserSendNotiPacketMessage(user, '道具查找功能不可用', 6)
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
    apiCUserSendNotiPacketMessage(user, '未找到匹配物品: ' + name, 6)
    return
  }
  if (matches.length > 1) {
    for (let i = 0; i < Math.min(matches.length, 10); i++) {
      apiCUserSendNotiPacketMessage(user, 'ID=' + matches[i].id + ' ' + matches[i].name, 6)
    }
    if (matches.length > 10) {
      apiCUserSendNotiPacketMessage(user, '匹配过多，只显示前10条，请使用精确名称', 6)
    }
    return
  }
  const count = hasCount ? countArg : 1
  cUserAddItem(user, parseInt(matches[0].id, 10), count, 6, ptr(0), 0)
  apiCUserSendNotiPacketMessage(user, '已获得物品 ID=' + matches[0].id + ' ' + matches[0].name + ' 数量=' + count, 6)
}

function cmdRepair(user) {
  const inven = cUserCharacInfoGetCurCharacInvenW(user)
  // 身上装备栏 10-21 (INVENTORY_TYPE_BODY = 0)
  for (let slot = 10; slot <= 21; slot++) {
    const item = cInventoryGetInvenRef(inven, 0, slot)
    if (!item.isNull() && !invenItemIsEmpty(item)) {
      const itemId = invenItemGetKey(item)
      const itemData = cDataManagerFindItem(gCDataManager(), itemId)
      if (!itemData.isNull()) {
        const durabilityMax = cEquipItemGetEndurance(itemData)
        item.add(11).writeU16(durabilityMax)
        cUserSendUpdateItemList(user, 1, 0, slot)
      }
    }
  }
  // 物品栏装备 3-8 (INVENTORY_TYPE_ITEM = 1)
  for (let slot = 3; slot <= 8; slot++) {
    const item = cInventoryGetInvenRef(inven, 1, slot)
    if (!item.isNull() && !invenItemIsEmpty(item)) {
      const itemId = invenItemGetKey(item)
      const itemData = cDataManagerFindItem(gCDataManager(), itemId)
      if (!itemData.isNull()) {
        const durabilityMax = cEquipItemGetEndurance(itemData)
        item.add(11).writeU16(durabilityMax)
      }
    }
  }
  apiCUserSendNotiPacketMessage(user, '装备已修复', 6)
}

function cmdLevel(user, args) {
  if (args.length < 1) {
    apiCUserSendNotiPacketMessage(user, '格式: //lv 等级', 6)
    return
  }
  const level = parseInt(args[0], 10)
  if (level < 1 || level > 70) {
    apiCUserSendNotiPacketMessage(user, '等级范围为 [1, 70]', 6)
    return
  }
  debugCommandSetLevel(ptr(0), user, level)
  apiCUserSendNotiPacketMessage(user, '角色等级已设置为: ' + level, 6)
}

function cmdQuestFinish(user) {
  const userQuest = cUserGetCurCharacQuestW(user)
  const questList = userQuest.add(8)
  const questCount = questList.readInt()
  const questData = questList.add(4)
  for (let i = 0; i < questCount; i++) {
    const questId = questData.add(i * 4).readInt()
    if (questId > 0) {
      try { clearDoingQuestEx(user, questId) } catch (e) {}
    }
  }
  apiCUserSendNotiPacketMessage(user, '任务完成处理完毕', 6)
}

function cmdQuestClear(user) {
  const userQuest = cUserGetCurCharacQuestW(user)
  const questList = userQuest.add(8)
  const questCount = questList.readInt()
  const questData = questList.add(4)
  for (let i = 0; i < questCount; i++) {
    const questId = questData.add(i * 4).readInt()
    if (questId > 0) {
      try { apiForceClearQuest(user, questId) } catch (e) {}
    }
  }
  apiCUserSendNotiPacketMessage(user, '任务完成并领取奖励完毕', 6)
}

function cmdQuestReset(user) {
  userQuestReset(user)
  apiCUserSendNotiPacketMessage(user, '所有任务已重置', 6)
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
  apiCUserSendNotiPacketMessage(user, '当前等级所有主线任务已完成', 6)
}

function cmdHellToggle(user, on) {
  heffPartyTag = on ? 1 : 0
  apiCUserSendNotiPacketMessage(user, on ? '深渊模式已开启' : '深渊模式已关闭', 6)
}

function cmdHelp(user) {
  for (let i = 0; i < COMMANDS.length; i++) {
    apiCUserSendNotiPacketMessage(user, COMMANDS[i].cmd + ' - ' + COMMANDS[i].desc, 6)
  }
}

// 命令路由
// ============================================================================

const CMD_MAP = {
  'test': function (user) { apiCUserSendNotiPacketMessage(user, 'GM测试成功', 6) },
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
  'h': cmdHelp
}

function routeGmCommand(user, rawMsg) {
  const spaceIdx = rawMsg.indexOf(' ')
  const cmdName = spaceIdx < 0 ? rawMsg : rawMsg.slice(0, spaceIdx)
  const args = spaceIdx < 0 ? [] : rawMsg.slice(spaceIdx + 1).split(' ').filter(function (a) { return a.length > 0 })
  const handler = CMD_MAP[cmdName]
  if (!handler) {
    apiCUserSendNotiPacketMessage(user, '未知命令: //' + cmdName + ', 输入 //help 查看帮助', 6)
    return
  }
  try {
    handler(user, args)
  } catch (e) {
    apiCUserSendNotiPacketMessage(user, '命令执行失败: ' + cmdName, 6)
    bootLog('[GM-ERROR] cmd=' + cmdName + ' error=' + e)
  }
}

// 主安装入口
// ============================================================================

function installGmCommands() {
  startHellParty()

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
