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
function apiCEnvironmentGetFileName() {
  const filename = cEnvironmentGetFileName(gCEnvironment())
  return filename.readUtf8String(-1)
}

// ============================================================================

//内存十六进制打印
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
//爆率控制
const cLuckPointGetItemRarity = new NativeFunction(ptr(0x8550BE4), 'int', ['pointer', 'pointer', 'int', 'int'], { abi: 'sysv' })
//GM权限检查
const cGmAccountsIsGM = new NativeFunction(ptr(0x08109346), 'int', ['pointer', 'int'], { abi: 'sysv' })
const cUserIsGMUser = new NativeFunction(ptr(0x0814589c), 'int', ['pointer'], { abi: 'sysv' })
//GM命令支持
const gameWorldMoveArea = new NativeFunction(ptr(0x86C5A84), 'pointer', ['pointer', 'pointer', 'int', 'int', 'int', 'int', 'int', 'int', 'int', 'int', 'int'], { abi: 'sysv' })
const cInventoryGainMoney = new NativeFunction(ptr(0x84FF29C), 'int', ['pointer', 'int', 'int', 'int', 'int'], { abi: 'sysv' })
const cUserAddItem = new NativeFunction(ptr(0x867B6D4), 'int', ['pointer', 'int', 'int', 'int', 'pointer', 'int'], { abi: 'sysv' })
const debugCommandSetLevel = new NativeFunction(ptr(0x0858EFDE), 'int', ['pointer', 'pointer', 'int'], { abi: 'sysv' })
const cEquipItemGetEndurance = new NativeFunction(ptr(0x0811ED98), 'int', ['pointer'], { abi: 'sysv' })
const userQuestReset = new NativeFunction(ptr(0x86AB894), 'int', ['pointer'], { abi: 'sysv' })
const doUserDefineCommand = new NativeFunction(ptr(0x0820BA90), 'int', ['pointer', 'int', 'pointer'], { abi: 'sysv' })
const cUserSendItemspace = new NativeFunction(ptr(0x865DB6C), 'int', ['pointer', 'int'], { abi: 'sysv' })
const cDisJointItem = new NativeFunction(ptr(0x81f92ca), 'int', ['pointer', 'int', 'int', 'int', 'pointer', 'int'], { abi: 'sysv' })
const cEquipItemGetSubType = new NativeFunction(ptr(0x833eecc), 'int', ['pointer'], { abi: 'sysv' })
const cDataManagerGetDimensionInout = new NativeFunction(ptr(0x0822b612), 'int', ['pointer', 'int'], { abi: 'sysv' })
const cUserCharacInfoSetDemensionInoutValue = new NativeFunction(ptr(0x0822f184), 'int', ['pointer', 'int', 'int'], { abi: 'sysv' })
const cUserCharacInfoGetCurCharacExpertJob = new NativeFunction(ptr(0x822f8d4), 'int', ['pointer'], { abi: 'sysv' })
//跨界/转职
const cUserGetAccountCargo = new NativeFunction(ptr(0x822fc22), 'pointer', ['pointer'], { abi: 'sysv' })
const cAccountCargoGetEmptySlot = new NativeFunction(ptr(0x828a580), 'int', ['pointer'], { abi: 'sysv' })
const cAccountCargoInsertItem = new NativeFunction(ptr(0x8289c82), 'int', ['pointer', 'pointer', 'int'], { abi: 'sysv' })
const cAccountCargoSendItemList = new NativeFunction(ptr(0x828a88a), 'int', ['pointer'], { abi: 'sysv' })
const cUserReturnToSelectCharacList = new NativeFunction(ptr(0x8686FEE), 'int', ['pointer', 'int'], { abi: 'sysv' })
// ============================================================================

if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

__dnfExport({
  gCEnvironment, cEnvironmentGetFileName, apiCEnvironmentGetFileName, bin2hex,
  cUserCharacInfoEnableSaveCharacStat, cUserGetState, cUserGetAccId, cUserCharacInfoGetCurCharacNo,
  cUserCharacInfoGetCharacLevel, cUserCharacInfoGetCurCharacName, cUserCharacInfoGetLevelUpExp,
  cUserCharacInfoGetCurCharacInvenW, cDungeonGetIndex, cInventoryGetInvenRef, invenItemIsEquipableItemType,
  cItemGetRarity, cItemGetUsableLevel, cItemGetItemGroupName, invenItemIsEmpty, invenItemGetKey,
  invenItemGetAddInfo, wongWorkCAvatarItemMgrGetJewelSocketData, gGameWorld, gCDataManager,
  cInventoryGetAvatarItemMgrR, cDataManagerFindItem, cDataManagerFindQuest, cStackableItemGetItemType,
  cStackableItemGetJewelTargetSocket, invenItemInvenItem, cUserGetCera, cUserGetCurCharacQuestW,
  cSystemTimeGetCurSec, globalDataSSystemTime, cUserCharacInfoGetLoginTick, cUserCheckItemLock,
  cItemIsStackable, wongWorkCQuestClearIsClearedQuest, gameWorldFindUserFromWorldByaccid,
  cUserQuestAction, cUserSetGmQuestFlag, invenItemReset, cInventoryUseMoney, cInventoryDeleteItem,
  cUserGainExpSp, dbUpdateAvatarJewelSlotMakeRequest, cUserSend, cUserSendNotiPacketMessage,
  gameWorldSendAll, gameWorldSendAllWithState, cUserSendUpdateItemList, cUserSendClearQuestList,
  userQuestGetQuestInfo, gameWorldGetUserCountInWorld, gameworldUserMapBegin, gameworldUserMapEnd,
  gameworldUserMapNotEqual, gameworldUserMapGet, gameworldUserMapNext,
  wongWorkCMailBoxHelperReqDBSendNewSystemMultiMail, wongWorkCMailBoxHelperMakeSystemMultiMailPostal,
  wongWorkCMailBoxHelperReqDBSendNewAvatarMail, stdVectorStdPairIntIntVector, stdVectorStdPairIntIntClear,
  stdMakePairIntInt, stdVectorStdPairIntIntPushBack, wongWorkIpgCIPGHelperIPGInput,
  wongWorkIpgCIPGHelperIPGQuery, wongWorkIpgCIPGHelperIPGInputPoint, packetBufGetByte,
  packetBufGetShort, packetBufGetInt, packetBufGetBinary, packetGuardPacketGuard,
  interfacePacketBufPutHeader, interfacePacketBufPutByte, interfacePacketBufPutShort,
  interfacePacketBufPutInt, interfacePacketBufPutBinary, interfacePacketBufFinalize,
  destroyPacketGuardPacketGuard, fopen, fread, fclose, cLuckPointGetItemRarity,
  cGmAccountsIsGM, cUserIsGMUser, gameWorldMoveArea, cInventoryGainMoney, cUserAddItem,
  debugCommandSetLevel, cEquipItemGetEndurance, userQuestReset, doUserDefineCommand,
  cUserSendItemspace, cDisJointItem, cEquipItemGetSubType, cDataManagerGetDimensionInout,
  cUserCharacInfoSetDemensionInoutValue, cUserCharacInfoGetCurCharacExpertJob,
  cUserGetAccountCargo, cAccountCargoGetEmptySlot, cAccountCargoInsertItem, cAccountCargoSendItemList, cUserReturnToSelectCharacList
})

