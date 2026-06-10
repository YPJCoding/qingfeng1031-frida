// ============================================================================
// DNF Frida modern modular package - gameApi.js
// Common game API wrappers used by multiple feature modules.
// ============================================================================

// 10. 通用 API 封装区
// ============================================================================

//测试系统API
const strlen = new NativeFunction(ptr(0x0807e3b0), 'int', ['pointer'], {
  abi: 'sysv'
}) //获取字符串长度
let globalConfig = {}
//获取随机数
/** getRandomInt。
 * @param {unknown} min 参数。
 * @param {unknown} max 参数。
 * @returns {unknown} 返回值。*/
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}

//读取文件
/** apiReadFile。
 * @param {unknown} path 参数。
 * @param {unknown} mode 参数。
 * @param {unknown} len 参数。
 * @returns {unknown} 返回值。*/
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
/** loadConfig。
 * @param {unknown} path 参数。
 * @returns {unknown} 返回值。*/
function loadConfig(path) {
  pluginSafeCall('load_config', function () {
    const data = apiReadFile(path, 'r', 10 * 1024 * 1024)
    if (!data) {
      pluginLogWarn('配置文件不存在或读取失败: ' + path)
      globalConfig = {}
      return
    }
    globalConfig = JSON.parse(data)
  })
}

//获取系统UTC时间(秒)
/** apiCSystemTimeGetCurSec。
 * @returns {unknown} 返回值。*/
function apiCSystemTimeGetCurSec() {
  return globalDataSSystemTime.readInt()
}

//获取道具数据
/** findItem。
 * @param {unknown} itemId 参数。
 * @returns {unknown} 返回值。*/
function findItem(itemId) {
  return cDataManagerFindItem(gCDataManager(), itemId)
}

//邮件函数封装
/** CMailBoxHelperReqDBSendNewSystemMail。
 * @param {unknown} User 参数。
 * @param {unknown} itemId 参数。
 * @param {unknown} itemCount 参数。
 * @returns {unknown} 返回值。*/
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
/** apiCUserCharacInfoGetCurCharacName。
 * @param {unknown} user 参数。
 * @returns {unknown} 返回值。*/
function apiCUserCharacInfoGetCurCharacName(user) {
  const p = cUserCharacInfoGetCurCharacName(user)
  if (p.isNull()) {
    return ''
  }
  return p.readUtf8String(-1)
}

//点券充值 (禁止直接修改billing库所有表字段, 点券相关操作务必调用数据库存储过程!)
/** apiRechargeCashCera。
 * @param {unknown} user 参数。
 * @param {unknown} amount 参数。
 * @returns {unknown} 返回值。*/
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
/** apiRechargeCashCeraPoint。
 * @param {unknown} user 参数。
 * @param {unknown} amount 参数。
 * @returns {unknown} 返回值。*/
function apiRechargeCashCeraPoint(user, amount) {
  //充值
  wongWorkIpgCIPGHelperIPGInputPoint(ptr(0x941f734).readPointer(), user, amount, 4, ptr(0), ptr(0))
  //通知客户端充值结果
  wongWorkIpgCIPGHelperIPGQuery(ptr(0x941f734).readPointer(), user)
}

//在线奖励
/** enableOnlineReward。
 * @returns {unknown} 返回值。*/
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
          '[' + getTimestamp() + '] 在线奖励已发送(当前阶段点券奖励:' + rewardCashCera + ')',
          6
        )
      }
    },
    onLeave: function (retval) {}
  })
}

//给角色发经验
/** apiCUserGainExpSp。
 * @param {unknown} user 参数。
 * @param {unknown} exp 参数。
 * @returns {unknown} 返回值。*/
function apiCUserGainExpSp(user, exp) {
  const a2 = Memory.alloc(4)
  const a3 = Memory.alloc(4)
  cUserGainExpSp(user, exp, a2, a3, 0, 0, 0)
}

//获取在线玩家列表表头
/** apiGameworldUserMapBegin。
 * @returns {unknown} 返回值。*/
function apiGameworldUserMapBegin() {
  const begin = Memory.alloc(4)
  gameworldUserMapBegin(begin, gGameWorld().add(308))
  return begin
}

//获取在线玩家列表表尾
/** apiGameworldUserMapEnd。
 * @returns {unknown} 返回值。*/
function apiGameworldUserMapEnd() {
  const end = Memory.alloc(4)
  gameworldUserMapEnd(end, gGameWorld().add(308))
  return end
}

//获取当前正在遍历的玩家
/** apiGameworldUserMapGet。
 * @param {unknown} it 参数。
 * @returns {unknown} 返回值。*/
function apiGameworldUserMapGet(it) {
  return gameworldUserMapGet(it).add(4).readPointer()
}

//遍历在线玩家列表
/** apiGameworldUserMapNext。
 * @param {unknown} it 参数。
 * @returns {unknown} 返回值。*/
function apiGameworldUserMapNext(it) {
  const next = Memory.alloc(4)
  gameworldUserMapNext(next, it)
  return next
}

//对全服在线玩家执行回调函数
/** apiGameworldForeach。
 * @param {unknown} f 参数。
 * @param {unknown} args 参数。
 * @returns {unknown} 返回值。*/
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
/** apiTodUserStateSetEnterLayer。
 * @param {unknown} user 参数。
 * @param {unknown} layer 参数。
 * @returns {unknown} 返回值。*/
function apiTodUserStateSetEnterLayer(user, layer) {
  const todLayer = Memory.alloc(100)
  todLayerTodLayer(todLayer, layer)
  const expandData = cUserGetCharacExpandData(user, 13)
  todUserStateSetEnterLayer(expandData, todLayer)
}

//根据角色id查询角色名
/** apiGetCharacNameByCharacNo。
 * @param {unknown} characNo 参数。
 * @returns {unknown} 返回值。*/
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
/** apiWongWorkCMailBoxHelperReqDBSendNewSystemMultiMail。
 * @param {unknown} targetCharacNo 参数。
 * @param {unknown} title 参数。
 * @param {unknown} text 参数。
 * @param {unknown} gold 参数。
 * @param {unknown} itemList 参数。
 * @returns {unknown} 返回值。*/
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
/** apiGameworldSendMail。
 * @param {unknown} title 参数。
 * @param {unknown} text 参数。
 * @param {unknown} gold 参数。
 * @param {unknown} itemList 参数。
 * @returns {unknown} 返回值。*/
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

//服务器组包
/** apiPacketGuardPacketGuard。
 * @returns {unknown} 返回值。*/
function apiPacketGuardPacketGuard() {
  const packetGuard = Memory.alloc(0x20000)
  packetGuardPacketGuard(packetGuard)
  return packetGuard
}

//从客户端封包中读取数据(失败会抛异常, 调用方必须做异常处理)
/** apiPacketBufGetByte。
 * @param {unknown} packetBuf 参数。
 * @returns {unknown} 返回值。*/
function apiPacketBufGetByte(packetBuf) {
  const data = Memory.alloc(1)
  if (packetBufGetByte(packetBuf, data)) {
    return data.readU8()
  }
  throw new Error('PacketBuf_get_byte Fail!')
}
/** apiCUserGetGuildName。
 * @param {unknown} user 参数。
 * @returns {unknown} 返回值。*/
function apiCUserGetGuildName(user) {
  const p = cUserGetGuildName(user)
  if (p.isNull()) {
    return ''
  }
  return p.readUtf8String(-1)
}
/** apiPacketBufGetShort。
 * @param {unknown} packetBuf 参数。
 * @returns {unknown} 返回值。*/
function apiPacketBufGetShort(packetBuf) {
  const data = Memory.alloc(2)
  if (packetBufGetShort(packetBuf, data)) {
    return data.readShort()
  }
  throw new Error('PacketBuf_get_short Fail!')
}
/** apiPacketBufGetInt。
 * @param {unknown} packetBuf 参数。
 * @returns {unknown} 返回值。*/
function apiPacketBufGetInt(packetBuf) {
  const data = Memory.alloc(4)
  if (packetBufGetInt(packetBuf, data)) {
    return data.readInt()
  }
  throw new Error('PacketBuf_get_int Fail!')
}
/** apiPacketBufGetBinary。
 * @param {unknown} packetBuf 参数。
 * @param {unknown} len 参数。
 * @returns {unknown} 返回值。*/
function apiPacketBufGetBinary(packetBuf, len) {
  const data = Memory.alloc(len)
  if (packetBufGetBinary(packetBuf, data, len)) {
    return data.readByteArray(len)
  }
  throw new Error('PacketBuf_get_binary Fail!')
}

//获取原始封包数据
/** apiPacketBufGetBuf。
 * @param {unknown} packetBuf 参数。
 * @returns {unknown} 返回值。*/
function apiPacketBufGetBuf(packetBuf) {
  return packetBuf.add(20).readPointer().add(13)
}

//给角色发消息
/** apiCUserSendNotiPacketMessage。
 * @param {unknown} user 参数。
 * @param {unknown} msg 参数。
 * @param {unknown} msgType 参数。
 * @returns {unknown} 返回值。*/
function apiCUserSendNotiPacketMessage(user, msg, msgType) {
  const p = Memory.allocUtf8String(msg)
  cUserSendNotiPacketMessage(user, p, msgType)
  return
}

//发送字符串给客户端
/** apiInterfacePacketBufPutString。
 * @param {unknown} packetGuard 参数。
 * @param {unknown} s 参数。
 * @returns {unknown} 返回值。*/
function apiInterfacePacketBufPutString(packetGuard, s) {
  const p = Memory.allocUtf8String(s)
  const len = strlen(p)
  interfacePacketBufPutInt(packetGuard, len)
  interfacePacketBufPutBinary(packetGuard, p, len)
  return
}

//世界广播(频道内公告)
/** apiGameWorldSendNotiPacketMessage。
 * @param {unknown} msg 参数。
 * @param {unknown} msgType 参数。
 * @returns {unknown} 返回值。*/
function apiGameWorldSendNotiPacketMessage(msg, msgType) {
  const packetGuard = apiPacketGuardPacketGuard()
  interfacePacketBufPutHeader(packetGuard, 0, 12)
  interfacePacketBufPutByte(packetGuard, msgType)
  interfacePacketBufPutShort(packetGuard, 0)
  interfacePacketBufPutByte(packetGuard, 0)
  apiInterfacePacketBufPutString(packetGuard, msg)
  interfacePacketBufFinalize(packetGuard, 1)
  gameWorldSendAllWithState(gGameWorld(), packetGuard, 3) //只给state >= 3 的玩家发公告
  destroyPacketGuardPacketGuard(packetGuard)
}

//打开数据库
/** apiMySQLOpen。
 * @param {unknown} dbName 参数。
 * @param {unknown} dbIp 参数。
 * @param {unknown} dbPort 参数。
 * @param {unknown} dbAccount 参数。
 * @param {unknown} dbPassword 参数。
 * @returns {unknown} 返回值。*/
function apiMySQLOpen(dbName, dbIp, dbPort, dbAccount, dbPassword) {
  //mysql初始化
  const mysql = Memory.alloc(0x80000)
  mySQLMySQL(mysql)
  mySQLInit(mysql)
  //连接数据库
  const dbIpPtr = Memory.allocUtf8String(dbIp)
  const dbNamePtr = Memory.allocUtf8String(dbName)
  const dbAccountPtr = Memory.allocUtf8String(dbAccount)
  const dbPasswordPtr = Memory.allocUtf8String(dbPassword)
  const ret = mySQLOpen(mysql, dbIpPtr, dbPort, dbNamePtr, dbAccountPtr, dbPasswordPtr)
  if (ret) {
    //log('Connect MYSQL DB <' + db_name + '> SUCCESS!')
    return mysql
  }
  return null
}

//mysql查询(返回mysql句柄)(注意线程安全)
/** apiMySQLExec。
 * @param {unknown} mysql 参数。
 * @param {unknown} sql 参数。
 * @returns {unknown} 返回值。*/
function apiMySQLExec(mysql, sql) {
  const sqlPtr = Memory.allocUtf8String(sql)
  mySQLSetQuery2(mysql, sqlPtr)
  return mySQLExec(mysql, 1)
}

//查询sql结果
//使用前务必保证api_MySQL_exec返回0
//并且MySQL_get_n_rows与预期一致
/** apiMySQLGetInt。
 * @param {unknown} mysql 参数。
 * @param {unknown} fieldIndex 参数。
 * @returns {unknown} 返回值。*/
function apiMySQLGetInt(mysql, fieldIndex) {
  const v = Memory.alloc(4)
  if (1 == mySQLGetInt(mysql, fieldIndex, v)) return v.readInt()
  //log('api_MySQL_get_int Fail!!!')
  return null
}
/** apiMySQLGetUint。
 * @param {unknown} mysql 参数。
 * @param {unknown} fieldIndex 参数。
 * @returns {unknown} 返回值。*/
function apiMySQLGetUint(mysql, fieldIndex) {
  const v = Memory.alloc(4)
  if (1 == mySQLGetUint(mysql, fieldIndex, v)) return v.readUInt()
  //log('api_MySQL_get_uint Fail!!!')
  return null
}
/** apiMySQLGetShort。
 * @param {unknown} mysql 参数。
 * @param {unknown} fieldIndex 参数。
 * @returns {unknown} 返回值。*/
function apiMySQLGetShort(mysql, fieldIndex) {
  const v = Memory.alloc(4)
  if (1 == mySQLGetShort(mysql, fieldIndex, v)) return v.readShort()
  //log('MySQL_get_short Fail!!!')
  return null
}
/** apiMySQLGetFloat。
 * @param {unknown} mysql 参数。
 * @param {unknown} fieldIndex 参数。
 * @returns {unknown} 返回值。*/
function apiMySQLGetFloat(mysql, fieldIndex) {
  const v = Memory.alloc(4)
  if (1 == mySQLGetFloat(mysql, fieldIndex, v)) return v.readFloat()
  //log('MySQL_get_float Fail!!!')
  return null
}
/** apiMySQLGetStr。
 * @param {unknown} mysql 参数。
 * @param {unknown} fieldIndex 参数。
 * @returns {unknown} 返回值。*/
function apiMySQLGetStr(mysql, fieldIndex) {
  const binaryLength = mySQLGetBinaryLength(mysql, fieldIndex)
  if (binaryLength > 0) {
    const v = Memory.alloc(binaryLength)
    if (1 == mySQLGetBinary(mysql, fieldIndex, v, binaryLength)) return v.readUtf8String(binaryLength)
  }
  //log('MySQL_get_str Fail!!!')
  return null
}
/** apiMySQLGetBinary。
 * @param {unknown} mysql 参数。
 * @param {unknown} fieldIndex 参数。
 * @returns {unknown} 返回值。*/
function apiMySQLGetBinary(mysql, fieldIndex) {
  const binaryLength = mySQLGetBinaryLength(mysql, fieldIndex)
  if (binaryLength > 0) {
    const v = Memory.alloc(binaryLength)
    if (1 == mySQLGetBinary(mysql, fieldIndex, v, binaryLength)) return v.readByteArray(binaryLength)
  }
  //log('api_MySQL_get_binary Fail!!!')
  return null
}

//初始化数据库(打开数据库/建库建表/数据库字段扩展)
/** initDb。
 * @returns {unknown} 返回值。*/
function initDb() {
  //配置文件
  const config = globalConfig['db_config']
  //打开数据库连接
  if (mySQLTaiwanCain == null) {
    mySQLTaiwanCain = apiMySQLOpen('taiwan_cain', '127.0.0.1', 3306, config['account'], config['password'])
  }
  if (mySQLTaiwanCain2nd == null) {
    mySQLTaiwanCain2nd = apiMySQLOpen('taiwan_cain_2nd', '127.0.0.1', 3306, config['account'], config['password'])
  }
  if (mySQLTaiwanBilling == null) {
    mySQLTaiwanBilling = apiMySQLOpen('taiwan_billing', '127.0.0.1', 3306, config['account'], config['password'])
  }
  //建库frida
  apiMySQLExec(mySQLTaiwanCain, 'create database if not exists frida default charset utf8;')
  if (mySQLFrida == null) {
    mySQLFrida = apiMySQLOpen('frida', '127.0.0.1', 3306, config['account'], config['password'])
  }
  //建表frida.game_event
  apiMySQLExec(
    mySQLFrida,
    'CREATE TABLE game_event (\
        event_id varchar(30) NOT NULL, event_info mediumtext NULL,\
        PRIMARY KEY  (event_id)\
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;'
  )
  //载入活动数据
  eventVillageAttackLoadFromDb()
}

//关闭数据库（卸载插件前调用）
/** uninitDb。
 * @returns {unknown} 返回值。*/
function uninitDb() {
  //活动数据存档
  eventVillageAttackSaveToDb()
  //关闭数据库连接
  if (mySQLTaiwanCain) {
    mySQLClose(mySQLTaiwanCain)
    mySQLTaiwanCain = null
  }
  if (mySQLTaiwanCain2nd) {
    mySQLClose(mySQLTaiwanCain2nd)
    mySQLTaiwanCain2nd = null
  }
  if (mySQLTaiwanBilling) {
    mySQLClose(mySQLTaiwanBilling)
    mySQLTaiwanBilling = null
  }
  if (mySQLFrida) {
    mySQLClose(mySQLFrida)
    mySQLFrida = null
  }
}

// ============================================================================

// ============================================================================
// 模块公共 API 注册区
// ============================================================================
if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

/**
 * Registers public symbols exported by gameApi.js.
 * Symbols are also attached to globalThis to preserve old script-style references
 * between modules loaded through Frida Script.load().
 * @returns {void}
 */
function registerCurrentModuleSymbols() {
  globalThis.strlen = strlen
  globalThis.dnfPlugin.strlen = strlen
  globalThis.getRandomInt = getRandomInt
  globalThis.dnfPlugin.getRandomInt = getRandomInt
  globalThis.apiReadFile = apiReadFile
  globalThis.dnfPlugin.apiReadFile = apiReadFile
  globalThis.loadConfig = loadConfig
  globalThis.dnfPlugin.loadConfig = loadConfig
  globalThis.apiCSystemTimeGetCurSec = apiCSystemTimeGetCurSec
  globalThis.dnfPlugin.apiCSystemTimeGetCurSec = apiCSystemTimeGetCurSec
  globalThis.findItem = findItem
  globalThis.dnfPlugin.findItem = findItem
  globalThis.CMailBoxHelperReqDBSendNewSystemMail = CMailBoxHelperReqDBSendNewSystemMail
  globalThis.dnfPlugin.CMailBoxHelperReqDBSendNewSystemMail = CMailBoxHelperReqDBSendNewSystemMail
  globalThis.apiCUserCharacInfoGetCurCharacName = apiCUserCharacInfoGetCurCharacName
  globalThis.dnfPlugin.apiCUserCharacInfoGetCurCharacName = apiCUserCharacInfoGetCurCharacName
  globalThis.apiRechargeCashCera = apiRechargeCashCera
  globalThis.dnfPlugin.apiRechargeCashCera = apiRechargeCashCera
  globalThis.apiRechargeCashCeraPoint = apiRechargeCashCeraPoint
  globalThis.dnfPlugin.apiRechargeCashCeraPoint = apiRechargeCashCeraPoint
  globalThis.enableOnlineReward = enableOnlineReward
  globalThis.dnfPlugin.enableOnlineReward = enableOnlineReward
  globalThis.apiCUserGainExpSp = apiCUserGainExpSp
  globalThis.dnfPlugin.apiCUserGainExpSp = apiCUserGainExpSp
  globalThis.apiGameworldUserMapBegin = apiGameworldUserMapBegin
  globalThis.dnfPlugin.apiGameworldUserMapBegin = apiGameworldUserMapBegin
  globalThis.apiGameworldUserMapEnd = apiGameworldUserMapEnd
  globalThis.dnfPlugin.apiGameworldUserMapEnd = apiGameworldUserMapEnd
  globalThis.apiGameworldUserMapGet = apiGameworldUserMapGet
  globalThis.dnfPlugin.apiGameworldUserMapGet = apiGameworldUserMapGet
  globalThis.apiGameworldUserMapNext = apiGameworldUserMapNext
  globalThis.dnfPlugin.apiGameworldUserMapNext = apiGameworldUserMapNext
  globalThis.apiGameworldForeach = apiGameworldForeach
  globalThis.dnfPlugin.apiGameworldForeach = apiGameworldForeach
  globalThis.apiTodUserStateSetEnterLayer = apiTodUserStateSetEnterLayer
  globalThis.dnfPlugin.apiTodUserStateSetEnterLayer = apiTodUserStateSetEnterLayer
  globalThis.apiGetCharacNameByCharacNo = apiGetCharacNameByCharacNo
  globalThis.dnfPlugin.apiGetCharacNameByCharacNo = apiGetCharacNameByCharacNo
  globalThis.apiWongWorkCMailBoxHelperReqDBSendNewSystemMultiMail = apiWongWorkCMailBoxHelperReqDBSendNewSystemMultiMail
  globalThis.dnfPlugin.apiWongWorkCMailBoxHelperReqDBSendNewSystemMultiMail = apiWongWorkCMailBoxHelperReqDBSendNewSystemMultiMail
  globalThis.apiGameworldSendMail = apiGameworldSendMail
  globalThis.dnfPlugin.apiGameworldSendMail = apiGameworldSendMail
  globalThis.apiPacketGuardPacketGuard = apiPacketGuardPacketGuard
  globalThis.dnfPlugin.apiPacketGuardPacketGuard = apiPacketGuardPacketGuard
  globalThis.apiPacketBufGetByte = apiPacketBufGetByte
  globalThis.dnfPlugin.apiPacketBufGetByte = apiPacketBufGetByte
  globalThis.apiCUserGetGuildName = apiCUserGetGuildName
  globalThis.dnfPlugin.apiCUserGetGuildName = apiCUserGetGuildName
  globalThis.apiPacketBufGetShort = apiPacketBufGetShort
  globalThis.dnfPlugin.apiPacketBufGetShort = apiPacketBufGetShort
  globalThis.apiPacketBufGetInt = apiPacketBufGetInt
  globalThis.dnfPlugin.apiPacketBufGetInt = apiPacketBufGetInt
  globalThis.apiPacketBufGetBinary = apiPacketBufGetBinary
  globalThis.dnfPlugin.apiPacketBufGetBinary = apiPacketBufGetBinary
  globalThis.apiPacketBufGetBuf = apiPacketBufGetBuf
  globalThis.dnfPlugin.apiPacketBufGetBuf = apiPacketBufGetBuf
  globalThis.apiCUserSendNotiPacketMessage = apiCUserSendNotiPacketMessage
  globalThis.dnfPlugin.apiCUserSendNotiPacketMessage = apiCUserSendNotiPacketMessage
  globalThis.apiInterfacePacketBufPutString = apiInterfacePacketBufPutString
  globalThis.dnfPlugin.apiInterfacePacketBufPutString = apiInterfacePacketBufPutString
  globalThis.apiGameWorldSendNotiPacketMessage = apiGameWorldSendNotiPacketMessage
  globalThis.dnfPlugin.apiGameWorldSendNotiPacketMessage = apiGameWorldSendNotiPacketMessage
  globalThis.apiMySQLOpen = apiMySQLOpen
  globalThis.dnfPlugin.apiMySQLOpen = apiMySQLOpen
  globalThis.apiMySQLExec = apiMySQLExec
  globalThis.dnfPlugin.apiMySQLExec = apiMySQLExec
  globalThis.apiMySQLGetInt = apiMySQLGetInt
  globalThis.dnfPlugin.apiMySQLGetInt = apiMySQLGetInt
  globalThis.apiMySQLGetUint = apiMySQLGetUint
  globalThis.dnfPlugin.apiMySQLGetUint = apiMySQLGetUint
  globalThis.apiMySQLGetShort = apiMySQLGetShort
  globalThis.dnfPlugin.apiMySQLGetShort = apiMySQLGetShort
  globalThis.apiMySQLGetFloat = apiMySQLGetFloat
  globalThis.dnfPlugin.apiMySQLGetFloat = apiMySQLGetFloat
  globalThis.apiMySQLGetStr = apiMySQLGetStr
  globalThis.dnfPlugin.apiMySQLGetStr = apiMySQLGetStr
  globalThis.apiMySQLGetBinary = apiMySQLGetBinary
  globalThis.dnfPlugin.apiMySQLGetBinary = apiMySQLGetBinary
  globalThis.initDb = initDb
  globalThis.dnfPlugin.initDb = initDb
  globalThis.uninitDb = uninitDb
  globalThis.dnfPlugin.uninitDb = uninitDb
  Object.defineProperty(globalThis, 'globalConfig', {
    get: function () {
      return globalConfig
    },
    set: function (value) {
      globalConfig = value
    },
    configurable: true
  })
  Object.defineProperty(globalThis.dnfPlugin, 'globalConfig', {
    get: function () {
      return globalConfig
    },
    set: function (value) {
      globalConfig = value
    },
    configurable: true
  })
}

registerCurrentModuleSymbols()
