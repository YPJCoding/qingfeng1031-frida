// ============================================================================
// DNF Frida modern modular package - nativeBindings.js
// NativeFunction bindings for game server symbols and packet primitives.
// ============================================================================

// 07. 服务器环境 / 系统 API 绑定区
// ============================================================================

//服务器环境
const gCEnvironment = new NativeFunction(ptr(0x080cc181), 'pointer', [], {
  abi: 'sysv'
})
//获取当前服务器配置文件名
const cEnvironmentGetFileName = new NativeFunction(ptr(0x80da39a), 'pointer', ['pointer'], {
  abi: 'sysv'
})
//获取当前频道名
/** apiCEnvironmentGetFileName。
 * @returns {unknown} 返回值。*/
function apiCEnvironmentGetFileName() {
  const filename = cEnvironmentGetFileName(gCEnvironment())
  return filename.readUtf8String(-1)
}

//文件记录日志
const fridaLogDirPath = './frida_log/'
let fLog = null
let logDay = null
/** log。
 * @param {unknown} msg 参数。
 * @returns {unknown} 返回值。*/
function log(msg) {
  let date = new Date()
  date = new Date(date.setHours(date.getHours() + 0)) //转换到本地时间
  const year = date.getFullYear().toString()
  const month = (date.getMonth() + 1).toString()
  const day = date.getDate().toString()
  const hour = date.getHours().toString()
  const minute = date.getMinutes().toString()
  const second = date.getSeconds().toString()
  const ms = date.getMilliseconds().toString()
  //日志按日期记录
  if (fLog == null || logDay != day) {
    closeLogFile()
    apiMkdir(fridaLogDirPath)
    fLog = new File(
      fridaLogDirPath + 'frida_' + apiCEnvironmentGetFileName() + '_' + year + '_' + month + '_' + day + '.log',
      'a+'
    )
    logDay = day
  }
  //时间戳
  const timestamp = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + '.' + ms
  //控制台日志
  console.log('[' + timestamp + ']' + msg)
  //文件日志
  fLog.write('[' + timestamp + ']' + msg + '\n')
  //立即写日志到文件中
  fLog.flush()
}
/** closeLogFile。
 * @returns {unknown} 返回值。*/
function closeLogFile() {
  if (fLog == null) {
    return
  }
  try {
    fLog.flush()
    fLog.close()
  } catch (error) {}
  fLog = null
}

//内存十六进制打印
/** bin2hex。
 * @param {unknown} p 参数。
 * @param {unknown} len 参数。
 * @returns {unknown} 返回值。*/
function bin2hex(p, len) {
  let hex = ''
  for (let i = 0; i < len; i++) {
    let s = p.add(i).readU8().toString(16)
    if (s.length == 1) s = '0' + s
    hex += s
    if (i != len - 1) hex += ' '
  }
  return hex
}

//设置角色属性改变脏标记(角色上线时把所有属性从数据库缓存到内存中, 只有设置了脏标记, 角色下线时才能正确存档到数据库, 否则变动的属性下线后可能会回档)
const cUserCharacInfoEnableSaveCharacStat = new NativeFunction(ptr(0x819a870), 'int', ['pointer'], {
  abi: 'sysv'
})
//获取角色状态
const cUserGetState = new NativeFunction(ptr(0x80da38c), 'int', ['pointer'], {
  abi: 'sysv'
})
//获取角色账号id
const cUserGetAccId = new NativeFunction(ptr(0x80da36e), 'int', ['pointer'], {
  abi: 'sysv'
})
//获取当前角色id
const cUserCharacInfoGetCurCharacNo = new NativeFunction(ptr(0x80cbc4e), 'int', ['pointer'], {
  abi: 'sysv'
})
//获取角色等级
const cUserCharacInfoGetCharacLevel = new NativeFunction(ptr(0x80da2b8), 'int', ['pointer'], {
  abi: 'sysv'
})
//获取角色名字
const cUserCharacInfoGetCurCharacName = new NativeFunction(ptr(0x8101028), 'pointer', ['pointer'], {
  abi: 'sysv'
})
//获取角色当前等级升级所需经验
const cUserCharacInfoGetLevelUpExp = new NativeFunction(ptr(0x0864e3ba), 'int', ['pointer', 'int'], {
  abi: 'sysv'
})
//获取角色背包
const cUserCharacInfoGetCurCharacInvenW = new NativeFunction(ptr(0x80da28e), 'pointer', ['pointer'], {
  abi: 'sysv'
})
//获取副本id
const cDungeonGetIndex = new NativeFunction(ptr(0x080fdcf0), 'int', ['pointer'], {
  abi: 'sysv'
})
//获取背包槽中的道具
const cInventoryGetInvenRef = new NativeFunction(ptr(0x84fc1de), 'pointer', ['pointer', 'int', 'int'], {
  abi: 'sysv'
})
//道具是否是装备
const invenItemIsEquipableItemType = new NativeFunction(ptr(0x08150812), 'int', ['pointer'], {
  abi: 'sysv'
})
//获取装备品级
const cItemGetRarity = new NativeFunction(ptr(0x080f12d6), 'int', ['pointer'], {
  abi: 'sysv'
})
//获取装备可穿戴等级
const cItemGetUsableLevel = new NativeFunction(ptr(0x80f12ee), 'int', ['pointer'], {
  abi: 'sysv'
})
//获取装备[item group name]
const cItemGetItemGroupName = new NativeFunction(ptr(0x80f1312), 'int', ['pointer'], {
  abi: 'sysv'
})
//检查背包中道具是否为空
const invenItemIsEmpty = new NativeFunction(ptr(0x811ed66), 'int', ['pointer'], {
  abi: 'sysv'
})
//获取背包中道具item_id
const invenItemGetKey = new NativeFunction(ptr(0x850d14e), 'int', ['pointer'], {
  abi: 'sysv'
})
//获取道具附加信息
const invenItemGetAddInfo = new NativeFunction(ptr(0x80f783a), 'int', ['pointer'], {
  abi: 'sysv'
})
//获取时装插槽数据
const wongWorkCAvatarItemMgrGetJewelSocketData = new NativeFunction(ptr(0x82f98f8), 'pointer', ['pointer', 'int'], {
  abi: 'sysv'
})
//获取GameWorld实例
const gGameWorld = new NativeFunction(ptr(0x80da3a7), 'pointer', [], {
  abi: 'sysv'
})
//获取DataManager实例
const gCDataManager = new NativeFunction(ptr(0x80cc19b), 'pointer', [], {
  abi: 'sysv'
})
//获取时装管理器
const cInventoryGetAvatarItemMgrR = new NativeFunction(ptr(0x80dd576), 'pointer', ['pointer'], {
  abi: 'sysv'
})
//获取装备pvf数据
const cDataManagerFindItem = new NativeFunction(ptr(0x835fa32), 'pointer', ['pointer', 'int'], {
  abi: 'sysv'
})
//从pvf中获取任务数据
const cDataManagerFindQuest = new NativeFunction(ptr(0x835fdc6), 'pointer', ['pointer', 'int'], {
  abi: 'sysv'
})
//获取消耗品类型
const cStackableItemGetItemType = new NativeFunction(ptr(0x8514a84), 'int', ['pointer'], {
  abi: 'sysv'
})
//获取徽章支持的镶嵌槽类型
const cStackableItemGetJewelTargetSocket = new NativeFunction(ptr(0x0822ca28), 'int', ['pointer'], {
  abi: 'sysv'
})
//背包道具
const invenItemInvenItem = new NativeFunction(ptr(0x80cb854), 'pointer', ['pointer'], {
  abi: 'sysv'
})
//获取角色点券余额
const cUserGetCera = new NativeFunction(ptr(0x080fdf7a), 'int', ['pointer'], {
  abi: 'sysv'
})
//获取玩家任务信息
const cUserGetCurCharacQuestW = new NativeFunction(ptr(0x814aa5e), 'pointer', ['pointer'], {
  abi: 'sysv'
})
//获取系统时间
const cSystemTimeGetCurSec = new NativeFunction(ptr(0x80cbc9e), 'int', ['pointer'], {
  abi: 'sysv'
})
const globalDataSSystemTime = ptr(0x941f714)
//本次登录时间
const cUserCharacInfoGetLoginTick = new NativeFunction(ptr(0x822f692), 'int', ['pointer'], {
  abi: 'sysv'
})
//道具是否被锁
const cUserCheckItemLock = new NativeFunction(ptr(0x8646942), 'int', ['pointer', 'int', 'int'], {
  abi: 'sysv'
})
//道具是否为消耗品
const cItemIsStackable = new NativeFunction(ptr(0x80f12fa), 'int', ['pointer'], {
  abi: 'sysv'
})
//任务是否已完成
const wongWorkCQuestClearIsClearedQuest = new NativeFunction(ptr(0x808bae0), 'int', ['pointer', 'int'], {
  abi: 'sysv'
})
//根据账号查找已登录角色
const gameWorldFindUserFromWorldByaccid = new NativeFunction(ptr(0x86c4d40), 'pointer', ['pointer', 'int'], {
  abi: 'sysv'
})
//任务相关操作(第二个参数为协议编号: 33=接受任务, 34=放弃任务, 35=任务完成条件已满足, 36=提交任务领取奖励)
const cUserQuestAction = new NativeFunction(ptr(0x0866da8a), 'int', ['pointer', 'int', 'int', 'int', 'int'], {
  abi: 'sysv'
})
//设置GM完成任务模式(无条件完成任务)
const cUserSetGmQuestFlag = new NativeFunction(ptr(0x822fc8e), 'int', ['pointer', 'int'], {
  abi: 'sysv'
})
//删除背包槽中的道具
const invenItemReset = new NativeFunction(ptr(0x080cb7d8), 'int', ['pointer'], {
  abi: 'sysv'
})
//减少金币
const cInventoryUseMoney = new NativeFunction(ptr(0x84ff54c), 'int', ['pointer', 'int', 'int', 'int'], {
  abi: 'sysv'
})
//背包中删除道具(背包指针, 背包类型, 槽, 数量, 删除原因, 记录删除日志)
const cInventoryDeleteItem = new NativeFunction(ptr(0x850400c), 'int', ['pointer', 'int', 'int', 'int', 'int', 'int'], {
  abi: 'sysv'
})
//角色增加经验
const cUserGainExpSp = new NativeFunction(
  ptr(0x866a3fe),
  'int',
  ['pointer', 'int', 'pointer', 'pointer', 'int', 'int', 'int'],
  {
    abi: 'sysv'
  }
)
//时装镶嵌数据存盘
const dbUpdateAvatarJewelSlotMakeRequest = new NativeFunction(ptr(0x843081c), 'pointer', ['int', 'int', 'pointer'], {
  abi: 'sysv'
})
//发包给客户端
const cUserSend = new NativeFunction(ptr(0x86485ba), 'int', ['pointer', 'pointer'], {
  abi: 'sysv'
})
//给角色发消息
const cUserSendNotiPacketMessage = new NativeFunction(ptr(0x86886ce), 'int', ['pointer', 'pointer', 'int'], {
  abi: 'sysv'
})
//将协议发给所有在线玩家(慎用! 广播类接口必须限制调用频率, 防止CC攻击)
//除非必须使用, 否则改用对象更加明确的CParty::send_to_party/GameWorld::send_to_area
const gameWorldSendAll = new NativeFunction(ptr(0x86c8c14), 'int', ['pointer', 'pointer'], {
  abi: 'sysv'
})
const gameWorldSendAllWithState = new NativeFunction(ptr(0x86c9184), 'int', ['pointer', 'pointer', 'int'], {
  abi: 'sysv'
})
//通知客户端道具更新(客户端指针, 通知方式[仅客户端=1, 世界广播=0, 小队=2, war room=3], itemSpace[装备=0, 时装=1], 道具所在的背包槽)
const cUserSendUpdateItemList = new NativeFunction(ptr(0x867c65a), 'int', ['pointer', 'int', 'int', 'int'], {
  abi: 'sysv'
})
//通知客户端更新已完成任务列表
const cUserSendClearQuestList = new NativeFunction(ptr(0x868b044), 'int', ['pointer'], {
  abi: 'sysv'
})
//通知客户端更新角色任务列表
const userQuestGetQuestInfo = new NativeFunction(ptr(0x86abba8), 'int', ['pointer', 'pointer'], {
  abi: 'sysv'
})
//获取在线玩家数量
const gameWorldGetUserCountInWorld = new NativeFunction(ptr(0x86c4550), 'int', ['pointer'], {
  abi: 'sysv'
})
//在线玩家列表(用于std::map遍历)
const gameworldUserMapBegin = new NativeFunction(ptr(0x80f78a6), 'int', ['pointer', 'pointer'], {
  abi: 'sysv'
})
const gameworldUserMapEnd = new NativeFunction(ptr(0x80f78cc), 'int', ['pointer', 'pointer'], {
  abi: 'sysv'
})
const gameworldUserMapNotEqual = new NativeFunction(ptr(0x80f78f2), 'bool', ['pointer', 'pointer'], {
  abi: 'sysv'
})
const gameworldUserMapGet = new NativeFunction(ptr(0x80f7944), 'pointer', ['pointer'], {
  abi: 'sysv'
})
const gameworldUserMapNext = new NativeFunction(ptr(0x80f7906), 'pointer', ['pointer', 'pointer'], {
  abi: 'sysv'
})
//发系统邮件(多道具)
const wongWorkCMailBoxHelperReqDBSendNewSystemMultiMail = new NativeFunction(
  ptr(0x8556b68),
  'int',
  ['pointer', 'pointer', 'int', 'int', 'int', 'pointer', 'int', 'int', 'int', 'int'],
  {
    abi: 'sysv'
  }
)
const wongWorkCMailBoxHelperMakeSystemMultiMailPostal = new NativeFunction(
  ptr(0x8556a14),
  'int',
  ['pointer', 'pointer', 'int'],
  {
    abi: 'sysv'
  }
)
//发系统邮件(时装)(仅支持在线角色发信)
const wongWorkCMailBoxHelperReqDBSendNewAvatarMail = new NativeFunction(
  ptr(0x85561b0),
  'pointer',
  ['pointer', 'int', 'int', 'int', 'int', 'int', 'int', 'pointer', 'int'],
  {
    abi: 'sysv'
  }
)
//vector相关操作
const stdVectorStdPairIntIntVector = new NativeFunction(ptr(0x81349d6), 'pointer', ['pointer'], {
  abi: 'sysv'
})
const stdVectorStdPairIntIntClear = new NativeFunction(ptr(0x817a342), 'pointer', ['pointer'], {
  abi: 'sysv'
})
const stdMakePairIntInt = new NativeFunction(ptr(0x81b8d41), 'pointer', ['pointer', 'pointer', 'pointer'], {
  abi: 'sysv'
})
const stdVectorStdPairIntIntPushBack = new NativeFunction(ptr(0x80dd606), 'pointer', ['pointer', 'pointer'], {
  abi: 'sysv'
})
//点券充值
const wongWorkIpgCIPGHelperIPGInput = new NativeFunction(
  ptr(0x80ffca4),
  'int',
  ['pointer', 'pointer', 'int', 'int', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer'],
  {
    abi: 'sysv'
  }
)
//同步点券数据库
const wongWorkIpgCIPGHelperIPGQuery = new NativeFunction(ptr(0x8100790), 'int', ['pointer', 'pointer'], {
  abi: 'sysv'
})
//代币充值
const wongWorkIpgCIPGHelperIPGInputPoint = new NativeFunction(
  ptr(0x80fffc0),
  'int',
  ['pointer', 'pointer', 'int', 'int', 'pointer', 'pointer'],
  {
    abi: 'sysv'
  }
)
//从客户端封包中读取数据
const packetBufGetByte = new NativeFunction(ptr(0x858cf22), 'int', ['pointer', 'pointer'], {
  abi: 'sysv'
})
const packetBufGetShort = new NativeFunction(ptr(0x858cfc0), 'int', ['pointer', 'pointer'], {
  abi: 'sysv'
})
const packetBufGetInt = new NativeFunction(ptr(0x858d27e), 'int', ['pointer', 'pointer'], {
  abi: 'sysv'
})
const packetBufGetBinary = new NativeFunction(ptr(0x858d3b2), 'int', ['pointer', 'pointer', 'int'], {
  abi: 'sysv'
})
//服务器组包
const packetGuardPacketGuard = new NativeFunction(ptr(0x858dd4c), 'int', ['pointer'], {
  abi: 'sysv'
})
const interfacePacketBufPutHeader = new NativeFunction(ptr(0x80cb8fc), 'int', ['pointer', 'int', 'int'], {
  abi: 'sysv'
})
const interfacePacketBufPutByte = new NativeFunction(ptr(0x80cb920), 'int', ['pointer', 'uint8'], {
  abi: 'sysv'
})
const interfacePacketBufPutShort = new NativeFunction(ptr(0x80d9ea4), 'int', ['pointer', 'uint16'], {
  abi: 'sysv'
})
const interfacePacketBufPutInt = new NativeFunction(ptr(0x80cb93c), 'int', ['pointer', 'int'], {
  abi: 'sysv'
})
const interfacePacketBufPutBinary = new NativeFunction(ptr(0x811df08), 'int', ['pointer', 'pointer', 'int'], {
  abi: 'sysv'
})
const interfacePacketBufFinalize = new NativeFunction(ptr(0x80cb958), 'int', ['pointer', 'int'], {
  abi: 'sysv'
})
const destroyPacketGuardPacketGuard = new NativeFunction(ptr(0x858de80), 'int', ['pointer'], {
  abi: 'sysv'
})
//linux读本地文件
const fopen = createSystemNativeFunction('fopen', 'pointer', ['pointer', 'pointer'])
const fread = createSystemNativeFunction('fread', 'int', ['pointer', 'int', 'int', 'pointer'])
const fclose = createSystemNativeFunction('fclose', 'int', ['pointer'])
// ============================================================================

// ============================================================================
// 模块公共 API 注册区
// ============================================================================
if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

/**
 * Registers public symbols exported by nativeBindings.js.
 * Symbols are also attached to globalThis to preserve old script-style references
 * between modules loaded through Frida Script.load().
 * @returns {void}
 */
function registerCurrentModuleSymbols() {
  globalThis.gCEnvironment = gCEnvironment
  globalThis.dnfPlugin.gCEnvironment = gCEnvironment
  globalThis.cEnvironmentGetFileName = cEnvironmentGetFileName
  globalThis.dnfPlugin.cEnvironmentGetFileName = cEnvironmentGetFileName
  globalThis.apiCEnvironmentGetFileName = apiCEnvironmentGetFileName
  globalThis.dnfPlugin.apiCEnvironmentGetFileName = apiCEnvironmentGetFileName
  globalThis.fridaLogDirPath = fridaLogDirPath
  globalThis.dnfPlugin.fridaLogDirPath = fridaLogDirPath
  globalThis.log = log
  globalThis.dnfPlugin.log = log
  globalThis.closeLogFile = closeLogFile
  globalThis.dnfPlugin.closeLogFile = closeLogFile
  globalThis.bin2hex = bin2hex
  globalThis.dnfPlugin.bin2hex = bin2hex
  globalThis.cUserCharacInfoEnableSaveCharacStat = cUserCharacInfoEnableSaveCharacStat
  globalThis.dnfPlugin.cUserCharacInfoEnableSaveCharacStat = cUserCharacInfoEnableSaveCharacStat
  globalThis.cUserGetState = cUserGetState
  globalThis.dnfPlugin.cUserGetState = cUserGetState
  globalThis.cUserGetAccId = cUserGetAccId
  globalThis.dnfPlugin.cUserGetAccId = cUserGetAccId
  globalThis.cUserCharacInfoGetCurCharacNo = cUserCharacInfoGetCurCharacNo
  globalThis.dnfPlugin.cUserCharacInfoGetCurCharacNo = cUserCharacInfoGetCurCharacNo
  globalThis.cUserCharacInfoGetCharacLevel = cUserCharacInfoGetCharacLevel
  globalThis.dnfPlugin.cUserCharacInfoGetCharacLevel = cUserCharacInfoGetCharacLevel
  globalThis.cUserCharacInfoGetCurCharacName = cUserCharacInfoGetCurCharacName
  globalThis.dnfPlugin.cUserCharacInfoGetCurCharacName = cUserCharacInfoGetCurCharacName
  globalThis.cUserCharacInfoGetLevelUpExp = cUserCharacInfoGetLevelUpExp
  globalThis.dnfPlugin.cUserCharacInfoGetLevelUpExp = cUserCharacInfoGetLevelUpExp
  globalThis.cUserCharacInfoGetCurCharacInvenW = cUserCharacInfoGetCurCharacInvenW
  globalThis.dnfPlugin.cUserCharacInfoGetCurCharacInvenW = cUserCharacInfoGetCurCharacInvenW
  globalThis.cDungeonGetIndex = cDungeonGetIndex
  globalThis.dnfPlugin.cDungeonGetIndex = cDungeonGetIndex
  globalThis.cInventoryGetInvenRef = cInventoryGetInvenRef
  globalThis.dnfPlugin.cInventoryGetInvenRef = cInventoryGetInvenRef
  globalThis.invenItemIsEquipableItemType = invenItemIsEquipableItemType
  globalThis.dnfPlugin.invenItemIsEquipableItemType = invenItemIsEquipableItemType
  globalThis.cItemGetRarity = cItemGetRarity
  globalThis.dnfPlugin.cItemGetRarity = cItemGetRarity
  globalThis.cItemGetUsableLevel = cItemGetUsableLevel
  globalThis.dnfPlugin.cItemGetUsableLevel = cItemGetUsableLevel
  globalThis.cItemGetItemGroupName = cItemGetItemGroupName
  globalThis.dnfPlugin.cItemGetItemGroupName = cItemGetItemGroupName
  globalThis.invenItemIsEmpty = invenItemIsEmpty
  globalThis.dnfPlugin.invenItemIsEmpty = invenItemIsEmpty
  globalThis.invenItemGetKey = invenItemGetKey
  globalThis.dnfPlugin.invenItemGetKey = invenItemGetKey
  globalThis.invenItemGetAddInfo = invenItemGetAddInfo
  globalThis.dnfPlugin.invenItemGetAddInfo = invenItemGetAddInfo
  globalThis.wongWorkCAvatarItemMgrGetJewelSocketData = wongWorkCAvatarItemMgrGetJewelSocketData
  globalThis.dnfPlugin.wongWorkCAvatarItemMgrGetJewelSocketData = wongWorkCAvatarItemMgrGetJewelSocketData
  globalThis.gGameWorld = gGameWorld
  globalThis.dnfPlugin.gGameWorld = gGameWorld
  globalThis.gCDataManager = gCDataManager
  globalThis.dnfPlugin.gCDataManager = gCDataManager
  globalThis.cInventoryGetAvatarItemMgrR = cInventoryGetAvatarItemMgrR
  globalThis.dnfPlugin.cInventoryGetAvatarItemMgrR = cInventoryGetAvatarItemMgrR
  globalThis.cDataManagerFindItem = cDataManagerFindItem
  globalThis.dnfPlugin.cDataManagerFindItem = cDataManagerFindItem
  globalThis.cDataManagerFindQuest = cDataManagerFindQuest
  globalThis.dnfPlugin.cDataManagerFindQuest = cDataManagerFindQuest
  globalThis.cStackableItemGetItemType = cStackableItemGetItemType
  globalThis.dnfPlugin.cStackableItemGetItemType = cStackableItemGetItemType
  globalThis.cStackableItemGetJewelTargetSocket = cStackableItemGetJewelTargetSocket
  globalThis.dnfPlugin.cStackableItemGetJewelTargetSocket = cStackableItemGetJewelTargetSocket
  globalThis.invenItemInvenItem = invenItemInvenItem
  globalThis.dnfPlugin.invenItemInvenItem = invenItemInvenItem
  globalThis.cUserGetCera = cUserGetCera
  globalThis.dnfPlugin.cUserGetCera = cUserGetCera
  globalThis.cUserGetCurCharacQuestW = cUserGetCurCharacQuestW
  globalThis.dnfPlugin.cUserGetCurCharacQuestW = cUserGetCurCharacQuestW
  globalThis.cSystemTimeGetCurSec = cSystemTimeGetCurSec
  globalThis.dnfPlugin.cSystemTimeGetCurSec = cSystemTimeGetCurSec
  globalThis.globalDataSSystemTime = globalDataSSystemTime
  globalThis.dnfPlugin.globalDataSSystemTime = globalDataSSystemTime
  globalThis.cUserCharacInfoGetLoginTick = cUserCharacInfoGetLoginTick
  globalThis.dnfPlugin.cUserCharacInfoGetLoginTick = cUserCharacInfoGetLoginTick
  globalThis.cUserCheckItemLock = cUserCheckItemLock
  globalThis.dnfPlugin.cUserCheckItemLock = cUserCheckItemLock
  globalThis.cItemIsStackable = cItemIsStackable
  globalThis.dnfPlugin.cItemIsStackable = cItemIsStackable
  globalThis.wongWorkCQuestClearIsClearedQuest = wongWorkCQuestClearIsClearedQuest
  globalThis.dnfPlugin.wongWorkCQuestClearIsClearedQuest = wongWorkCQuestClearIsClearedQuest
  globalThis.gameWorldFindUserFromWorldByaccid = gameWorldFindUserFromWorldByaccid
  globalThis.dnfPlugin.gameWorldFindUserFromWorldByaccid = gameWorldFindUserFromWorldByaccid
  globalThis.cUserQuestAction = cUserQuestAction
  globalThis.dnfPlugin.cUserQuestAction = cUserQuestAction
  globalThis.cUserSetGmQuestFlag = cUserSetGmQuestFlag
  globalThis.dnfPlugin.cUserSetGmQuestFlag = cUserSetGmQuestFlag
  globalThis.invenItemReset = invenItemReset
  globalThis.dnfPlugin.invenItemReset = invenItemReset
  globalThis.cInventoryUseMoney = cInventoryUseMoney
  globalThis.dnfPlugin.cInventoryUseMoney = cInventoryUseMoney
  globalThis.cInventoryDeleteItem = cInventoryDeleteItem
  globalThis.dnfPlugin.cInventoryDeleteItem = cInventoryDeleteItem
  globalThis.cUserGainExpSp = cUserGainExpSp
  globalThis.dnfPlugin.cUserGainExpSp = cUserGainExpSp
  globalThis.dbUpdateAvatarJewelSlotMakeRequest = dbUpdateAvatarJewelSlotMakeRequest
  globalThis.dnfPlugin.dbUpdateAvatarJewelSlotMakeRequest = dbUpdateAvatarJewelSlotMakeRequest
  globalThis.cUserSend = cUserSend
  globalThis.dnfPlugin.cUserSend = cUserSend
  globalThis.cUserSendNotiPacketMessage = cUserSendNotiPacketMessage
  globalThis.dnfPlugin.cUserSendNotiPacketMessage = cUserSendNotiPacketMessage
  globalThis.gameWorldSendAll = gameWorldSendAll
  globalThis.dnfPlugin.gameWorldSendAll = gameWorldSendAll
  globalThis.gameWorldSendAllWithState = gameWorldSendAllWithState
  globalThis.dnfPlugin.gameWorldSendAllWithState = gameWorldSendAllWithState
  globalThis.cUserSendUpdateItemList = cUserSendUpdateItemList
  globalThis.dnfPlugin.cUserSendUpdateItemList = cUserSendUpdateItemList
  globalThis.cUserSendClearQuestList = cUserSendClearQuestList
  globalThis.dnfPlugin.cUserSendClearQuestList = cUserSendClearQuestList
  globalThis.userQuestGetQuestInfo = userQuestGetQuestInfo
  globalThis.dnfPlugin.userQuestGetQuestInfo = userQuestGetQuestInfo
  globalThis.gameWorldGetUserCountInWorld = gameWorldGetUserCountInWorld
  globalThis.dnfPlugin.gameWorldGetUserCountInWorld = gameWorldGetUserCountInWorld
  globalThis.gameworldUserMapBegin = gameworldUserMapBegin
  globalThis.dnfPlugin.gameworldUserMapBegin = gameworldUserMapBegin
  globalThis.gameworldUserMapEnd = gameworldUserMapEnd
  globalThis.dnfPlugin.gameworldUserMapEnd = gameworldUserMapEnd
  globalThis.gameworldUserMapNotEqual = gameworldUserMapNotEqual
  globalThis.dnfPlugin.gameworldUserMapNotEqual = gameworldUserMapNotEqual
  globalThis.gameworldUserMapGet = gameworldUserMapGet
  globalThis.dnfPlugin.gameworldUserMapGet = gameworldUserMapGet
  globalThis.gameworldUserMapNext = gameworldUserMapNext
  globalThis.dnfPlugin.gameworldUserMapNext = gameworldUserMapNext
  globalThis.wongWorkCMailBoxHelperReqDBSendNewSystemMultiMail = wongWorkCMailBoxHelperReqDBSendNewSystemMultiMail
  globalThis.dnfPlugin.wongWorkCMailBoxHelperReqDBSendNewSystemMultiMail = wongWorkCMailBoxHelperReqDBSendNewSystemMultiMail
  globalThis.wongWorkCMailBoxHelperMakeSystemMultiMailPostal = wongWorkCMailBoxHelperMakeSystemMultiMailPostal
  globalThis.dnfPlugin.wongWorkCMailBoxHelperMakeSystemMultiMailPostal = wongWorkCMailBoxHelperMakeSystemMultiMailPostal
  globalThis.wongWorkCMailBoxHelperReqDBSendNewAvatarMail = wongWorkCMailBoxHelperReqDBSendNewAvatarMail
  globalThis.dnfPlugin.wongWorkCMailBoxHelperReqDBSendNewAvatarMail = wongWorkCMailBoxHelperReqDBSendNewAvatarMail
  globalThis.stdVectorStdPairIntIntVector = stdVectorStdPairIntIntVector
  globalThis.dnfPlugin.stdVectorStdPairIntIntVector = stdVectorStdPairIntIntVector
  globalThis.stdVectorStdPairIntIntClear = stdVectorStdPairIntIntClear
  globalThis.dnfPlugin.stdVectorStdPairIntIntClear = stdVectorStdPairIntIntClear
  globalThis.stdMakePairIntInt = stdMakePairIntInt
  globalThis.dnfPlugin.stdMakePairIntInt = stdMakePairIntInt
  globalThis.stdVectorStdPairIntIntPushBack = stdVectorStdPairIntIntPushBack
  globalThis.dnfPlugin.stdVectorStdPairIntIntPushBack = stdVectorStdPairIntIntPushBack
  globalThis.wongWorkIpgCIPGHelperIPGInput = wongWorkIpgCIPGHelperIPGInput
  globalThis.dnfPlugin.wongWorkIpgCIPGHelperIPGInput = wongWorkIpgCIPGHelperIPGInput
  globalThis.wongWorkIpgCIPGHelperIPGQuery = wongWorkIpgCIPGHelperIPGQuery
  globalThis.dnfPlugin.wongWorkIpgCIPGHelperIPGQuery = wongWorkIpgCIPGHelperIPGQuery
  globalThis.wongWorkIpgCIPGHelperIPGInputPoint = wongWorkIpgCIPGHelperIPGInputPoint
  globalThis.dnfPlugin.wongWorkIpgCIPGHelperIPGInputPoint = wongWorkIpgCIPGHelperIPGInputPoint
  globalThis.packetBufGetByte = packetBufGetByte
  globalThis.dnfPlugin.packetBufGetByte = packetBufGetByte
  globalThis.packetBufGetShort = packetBufGetShort
  globalThis.dnfPlugin.packetBufGetShort = packetBufGetShort
  globalThis.packetBufGetInt = packetBufGetInt
  globalThis.dnfPlugin.packetBufGetInt = packetBufGetInt
  globalThis.packetBufGetBinary = packetBufGetBinary
  globalThis.dnfPlugin.packetBufGetBinary = packetBufGetBinary
  globalThis.packetGuardPacketGuard = packetGuardPacketGuard
  globalThis.dnfPlugin.packetGuardPacketGuard = packetGuardPacketGuard
  globalThis.interfacePacketBufPutHeader = interfacePacketBufPutHeader
  globalThis.dnfPlugin.interfacePacketBufPutHeader = interfacePacketBufPutHeader
  globalThis.interfacePacketBufPutByte = interfacePacketBufPutByte
  globalThis.dnfPlugin.interfacePacketBufPutByte = interfacePacketBufPutByte
  globalThis.interfacePacketBufPutShort = interfacePacketBufPutShort
  globalThis.dnfPlugin.interfacePacketBufPutShort = interfacePacketBufPutShort
  globalThis.interfacePacketBufPutInt = interfacePacketBufPutInt
  globalThis.dnfPlugin.interfacePacketBufPutInt = interfacePacketBufPutInt
  globalThis.interfacePacketBufPutBinary = interfacePacketBufPutBinary
  globalThis.dnfPlugin.interfacePacketBufPutBinary = interfacePacketBufPutBinary
  globalThis.interfacePacketBufFinalize = interfacePacketBufFinalize
  globalThis.dnfPlugin.interfacePacketBufFinalize = interfacePacketBufFinalize
  globalThis.destroyPacketGuardPacketGuard = destroyPacketGuardPacketGuard
  globalThis.dnfPlugin.destroyPacketGuardPacketGuard = destroyPacketGuardPacketGuard
  globalThis.fopen = fopen
  globalThis.dnfPlugin.fopen = fopen
  globalThis.fread = fread
  globalThis.dnfPlugin.fread = fread
  globalThis.fclose = fclose
  globalThis.dnfPlugin.fclose = fclose
  Object.defineProperty(globalThis, 'fLog', {
    get: function () {
      return fLog
    },
    set: function (value) {
      fLog = value
    },
    configurable: true
  })
  Object.defineProperty(globalThis.dnfPlugin, 'fLog', {
    get: function () {
      return fLog
    },
    set: function (value) {
      fLog = value
    },
    configurable: true
  })
  Object.defineProperty(globalThis, 'logDay', {
    get: function () {
      return logDay
    },
    set: function (value) {
      logDay = value
    },
    configurable: true
  })
  Object.defineProperty(globalThis.dnfPlugin, 'logDay', {
    get: function () {
      return logDay
    },
    set: function (value) {
      logDay = value
    },
    configurable: true
  })
}

registerCurrentModuleSymbols()
