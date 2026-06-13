// ============================================================================
// DNF Frida modern modular package - gameApi.js
// 多个功能模块共用的游戏 API 封装。
// ============================================================================

// ============================================================================

//测试系统API
const strlen = new NativeFunction(ptr(0x0807e3b0), 'int', ['pointer'], {
  abi: 'sysv'
}) //获取字符串长度
let globalConfig = {}
//获取随机数
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}

//读取文件
function apiReadFile(path, mode, len) {
  const pathPtr = Memory.allocUtf8String(path)
  const modePtr = Memory.allocUtf8String(mode)
  const f = fopen(pathPtr, modePtr)
  if (isNullPointer(f)) {
    return null
  }
  const data = Memory.alloc(len)
  const freadRet = fread(data, 1, len, f)
  fclose(f)
  //返回字符串
  if (mode == 'r') {
    return data.readUtf8String(freadRet)
  }

  //返回二进制buff指针
  return data
}

//加载本地配置文件(json格式)
function loadConfig(path) {
  pluginSafeCall('load_config', function () {
    const data = apiReadFile(path, 'r', 10 * 1024 * 1024)
    if (!data) {
      console.warn(`配置文件不存在或读取失败: ${path}`)
      globalConfig = {}
      return
    }
    globalConfig = JSON.parse(data)
  })
}

//获取系统UTC时间(秒)
function apiCSystemTimeGetCurSec() {
  return globalDataSSystemTime.readInt()
}

//获取道具数据
function findItem(itemId) {
  return cDataManagerFindItem(gCDataManager(), itemId)
}

//邮件函数封装
function CMailBoxHelperReqDBSendNewSystemMail(User, itemId, itemCount) {
  const retitem = findItem(itemId)
  if (retitem) {
    const invenItemPr = Memory.alloc(100)
    invenItem(invenItemPr) //清空道具
    const itemid = getItemIndex(retitem)
    const itemtype = retitem.add(8).readU8()
    invenItemPr.writeU8(itemtype)
    invenItemPr.add(2).writeInt(itemid)
    invenItemPr.add(7).writeInt(itemCount)
    // set_add_info(Inven_ItemPr, item_count)
    const GoldValue = 0
    const TitlePr = Memory.allocUtf8String('居民代表')
    const TxtValue = '击杀怪物奖励：'
    const UserID = GetCurCharacNo(User)
    const TxtValuePr = Memory.allocUtf8String(TxtValue)
    const TxtValueLength = toString(TxtValue).length
    const ServerGroup = GetServerGroup(User)
    const MailDate = 30
    ReqDBSendNewSystemMail(
      TitlePr,
      invenItemPr,
      GoldValue,
      UserID,
      TxtValuePr,
      TxtValueLength,
      MailDate,
      ServerGroup,
      0,
      0
    )
  }
}

//获取角色名字
function apiCUserCharacInfoGetCurCharacName(user) {
  const p = cUserCharacInfoGetCurCharacName(user)
  if (p.isNull()) {
    return ''
  }
  return p.readUtf8String(-1)
}

//点券充值 (禁止直接修改billing库所有表字段, 点券相关操作务必调用数据库存储过程!)
function apiRechargeCashCera(user, amount) {
  //充值
  wongWorkIpgCIPGHelperIPGInput(
    ptr(0x941f734).readPointer(),
    user,
    5,
    amount,
    ptr(0x8c7fa20),
    ptr(0x8c7fa20),
    Memory.allocUtf8String('GM'),
    ptr(0),
    ptr(0),
    ptr(0)
  )
  //通知客户端充值结果
  wongWorkIpgCIPGHelperIPGQuery(ptr(0x941f734).readPointer(), user)
}

//代币充值 (禁止直接修改billing库所有表字段, 点券相关操作务必调用数据库存储过程!)
function apiRechargeCashCeraPoint(user, amount) {
  //充值
  wongWorkIpgCIPGHelperIPGInputPoint(ptr(0x941f734).readPointer(), user, amount, 4, ptr(0), ptr(0))
  //通知客户端充值结果
  wongWorkIpgCIPGHelperIPGQuery(ptr(0x941f734).readPointer(), user)
}

//在线奖励
function enableOnlineReward() {
  //在线每5min发一次奖, 在线时间越长, 奖励越高
  //CUser::WorkPerFiveMin
  Interceptor.attach(ptr(0x8652f0c), {
    onEnter: function (args) {
      const user = args[0]
      //当前系统时间
      const curTime = apiCSystemTimeGetCurSec()
      //本次登录时间
      const loginTick = cUserCharacInfoGetLoginTick(user)
      if (loginTick > 0) {
        //在线时长(分钟)
        const diffTime = Math.floor((curTime - loginTick) / 60)
        //在线30min后开始计算
        if (diffTime < 30) return
        //在线奖励最多发送半天
        if (diffTime > 1 * 12 * 60) return
        //奖励: 每分钟0.1点券
        const rewardCashCeraPerMin = 0.1
        //计算奖励
        const rewardCashCera = Math.floor(diffTime * rewardCashCeraPerMin)
        //发点券
        apiRechargeCashCera(user, rewardCashCera)
        //发消息通知客户端奖励已发送
        apiCUserSendNotiPacketMessage(
          user,
          `[${getTimestamp()}] 在线奖励已发送(当前阶段点券奖励:${rewardCashCera})`,
          6
        )
      }
    },
    onLeave: function (retval) {}
  })
}

//给角色发经验
function apiCUserGainExpSp(user, exp) {
  const a2 = Memory.alloc(4)
  const a3 = Memory.alloc(4)
  cUserGainExpSp(user, exp, a2, a3, 0, 0, 0)
}

//获取在线玩家列表表头
function apiGameworldUserMapBegin() {
  const begin = Memory.alloc(4)
  gameworldUserMapBegin(begin, gGameWorld().add(308))
  return begin
}

//获取在线玩家列表表尾
function apiGameworldUserMapEnd() {
  const end = Memory.alloc(4)
  gameworldUserMapEnd(end, gGameWorld().add(308))
  return end
}

//获取当前正在遍历的玩家
function apiGameworldUserMapGet(it) {
  return gameworldUserMapGet(it).add(4).readPointer()
}

//遍历在线玩家列表
function apiGameworldUserMapNext(it) {
  const next = Memory.alloc(4)
  gameworldUserMapNext(next, it)
  return next
}

//对全服在线玩家执行回调函数
function apiGameworldForeach(f, args) {
  //遍历在线玩家列表
  const it = apiGameworldUserMapBegin()
  const end = apiGameworldUserMapEnd()
  //判断在线玩家列表遍历是否已结束
  while (gameworldUserMapNotEqual(it, end)) {
    //当前被遍历到的玩家
    const user = apiGameworldUserMapGet(it)
    //只处理已登录角色
    if (cUserGetState(user) >= 3) {
      //执行回调函数
      f(user, args)
    }
    //继续遍历下一个玩家
    apiGameworldUserMapNext(it)
  }
}

//设置角色当前绝望之塔层数
function apiTodUserStateSetEnterLayer(user, layer) {
  const todLayer = Memory.alloc(100)
  todLayerTodLayer(todLayer, layer)
  const expandData = cUserGetCharacExpandData(user, 13)
  todUserStateSetEnterLayer(expandData, todLayer)
}

//根据角色id查询角色名
function apiGetCharacNameByCharacNo(characNo) {
  //从数据库中查询角色名
  if (apiMySQLExec(mySQLTaiwanCain, 'select charac_name from charac_info where charac_no=' + characNo + ';')) {
    if (mySQLGetNRows(mySQLTaiwanCain) == 1) {
      if (mySQLFetch(mySQLTaiwanCain)) {
        const characName = apiMySQLGetStr(mySQLTaiwanCain, 0)
        return characName
      }
    }
  }
  return characNo.toString()
}

//发系统邮件(多道具)(角色charac_no, 邮件标题, 邮件正文, 金币数量, 道具列表)
function apiWongWorkCMailBoxHelperReqDBSendNewSystemMultiMail(targetCharacNo, title, text, gold, itemList) {
  //添加道具附件
  const vector = Memory.alloc(100)
  stdVectorStdPairIntIntVector(vector)
  stdVectorStdPairIntIntClear(vector)
  for (let i = 0; i < itemList.length; ++i) {
    const itemId = Memory.alloc(4) //道具id
    const itemCnt = Memory.alloc(4) //道具数量
    itemId.writeInt(itemList[i][0])
    itemCnt.writeInt(itemList[i][1])
    const pair = Memory.alloc(100)
    stdMakePairIntInt(pair, itemId, itemCnt)
    stdVectorStdPairIntIntPushBack(vector, pair)
  }
  //邮件支持10个道具附件格子
  const additionSlots = Memory.alloc(1000)
  for (let i = 0; i < 10; ++i) {
    invenItemInvenItem(additionSlots.add(i * 61))
  }
  wongWorkCMailBoxHelperMakeSystemMultiMailPostal(vector, additionSlots, 10)
  const titlePtr = Memory.allocUtf8String(title) //邮件标题
  const textPtr = Memory.allocUtf8String(text) //邮件正文
  const textLen = strlen(textPtr) //邮件正文长度
  //发邮件给角色
  wongWorkCMailBoxHelperReqDBSendNewSystemMultiMail(
    titlePtr,
    additionSlots,
    itemList.length,
    gold,
    targetCharacNo,
    textPtr,
    textLen,
    0,
    99,
    1
  )
}

//全服在线玩家发信
function apiGameworldSendMail(title, text, gold, itemList) {
  //遍历在线玩家列表
  const it = apiGameworldUserMapBegin()
  const end = apiGameworldUserMapEnd()
  //判断在线玩家列表遍历是否已结束
  while (gameworldUserMapNotEqual(it, end)) {
    //当前被遍历到的玩家
    const user = apiGameworldUserMapGet(it)
    //只处理已登录角色
    if (cUserGetState(user) >= 3) {
      //角色uid
      const characNo = cUserCharacInfoGetCurCharacNo(user)
      //给角色发信
      apiWongWorkCMailBoxHelperReqDBSendNewSystemMultiMail(characNo, title, text, gold, itemList)
    }
    //继续遍历下一个玩家
    apiGameworldUserMapNext(it)
  }
}

function apiCUserGetGuildName(user) {
  const p = cUserGetGuildName(user)
  if (p.isNull()) {
    return ''
  }
  return p.readUtf8String(-1)
}

// ============================================================================

if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

__dnfExport({
  strlen, getRandomInt, apiReadFile, loadConfig, apiCSystemTimeGetCurSec, findItem,
  CMailBoxHelperReqDBSendNewSystemMail, apiCUserCharacInfoGetCurCharacName,
  apiRechargeCashCera, apiRechargeCashCeraPoint, enableOnlineReward, apiCUserGainExpSp,
  apiGameworldUserMapBegin, apiGameworldUserMapEnd, apiGameworldUserMapGet,
  apiGameworldUserMapNext, apiGameworldForeach, apiTodUserStateSetEnterLayer,
  apiGetCharacNameByCharacNo, apiWongWorkCMailBoxHelperReqDBSendNewSystemMultiMail,
  apiGameworldSendMail,
  apiCUserGetGuildName
})
__dnfMutable('globalConfig', () => globalConfig, (v) => { globalConfig = v })
