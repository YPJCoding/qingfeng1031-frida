// ============================================================================
// DNF Frida modern modular package - databaseApi.js
// MySQL bindings, DB initialization, query helpers, and timer dispatcher plumbing.
// ============================================================================

// 08. MySQL 绑定与数据库基础操作区
// ============================================================================

//MYSQL操作
//游戏中已打开的数据库索引(游戏数据库非线程安全 谨慎操作)
const taiwanCain = 2
const dBMgrGetDBHandle = new NativeFunction(ptr(0x83f523e), 'pointer', ['pointer', 'int', 'int'], {
  abi: 'sysv'
})
const mySQLMySQL = new NativeFunction(ptr(0x83f3ac8), 'pointer', ['pointer'], {
  abi: 'sysv'
})
const mySQLInit = new NativeFunction(ptr(0x83f3ce4), 'int', ['pointer'], {
  abi: 'sysv'
})
const mySQLOpen = new NativeFunction(
  ptr(0x83f4024),
  'int',
  ['pointer', 'pointer', 'int', 'pointer', 'pointer', 'pointer'],
  {
    abi: 'sysv'
  }
)
const mySQLClose = new NativeFunction(ptr(0x83f3e74), 'int', ['pointer'], {
  abi: 'sysv'
})
const mySQLSetQuery2 = new NativeFunction(ptr(0x83f41c0), 'int', ['pointer', 'pointer'], {
  abi: 'sysv'
})
const mySQLSetQuery3 = new NativeFunction(ptr(0x83f41c0), 'int', ['pointer', 'pointer', 'int'], {
  abi: 'sysv'
})
const mySQLSetQuery4 = new NativeFunction(ptr(0x83f41c0), 'int', ['pointer', 'pointer', 'int', 'int'], {
  abi: 'sysv'
})
const mySQLSetQuery5 = new NativeFunction(ptr(0x83f41c0), 'int', ['pointer', 'pointer', 'int', 'int', 'int'], {
  abi: 'sysv'
})
const mySQLSetQuery6 = new NativeFunction(ptr(0x83f41c0), 'int', ['pointer', 'pointer', 'int', 'int', 'int', 'int'], {
  abi: 'sysv'
})
const mySQLExec = new NativeFunction(ptr(0x83f4326), 'int', ['pointer', 'int'], {
  abi: 'sysv'
})
const mySQLExecQuery = new NativeFunction(ptr(0x083f5348), 'int', ['pointer'], {
  abi: 'sysv'
})
const mySQLGetNRows = new NativeFunction(ptr(0x80e236c), 'int', ['pointer'], {
  abi: 'sysv'
})
const mySQLFetch = new NativeFunction(ptr(0x83f44bc), 'int', ['pointer'], {
  abi: 'sysv'
})
const mySQLGetInt = new NativeFunction(ptr(0x811692c), 'int', ['pointer', 'int', 'pointer'], {
  abi: 'sysv'
})
const mySQLGetShort = new NativeFunction(ptr(0x0814201c), 'int', ['pointer', 'int', 'pointer'], {
  abi: 'sysv'
})
const mySQLGetUint = new NativeFunction(ptr(0x80e22f2), 'int', ['pointer', 'int', 'pointer'], {
  abi: 'sysv'
})
const mySQLGetUlonglong = new NativeFunction(ptr(0x81754c8), 'int', ['pointer', 'int', 'pointer'], {
  abi: 'sysv'
})
const mySQLGetUshort = new NativeFunction(ptr(0x8116990), 'int', ['pointer'], {
  abi: 'sysv'
})
const mySQLGetFloat = new NativeFunction(ptr(0x844d6d0), 'int', ['pointer', 'int', 'pointer'], {
  abi: 'sysv'
})
const mySQLGetBinary = new NativeFunction(ptr(0x812531a), 'int', ['pointer', 'int', 'pointer', 'int'], {
  abi: 'sysv'
})
const mySQLGetBinaryLength = new NativeFunction(ptr(0x81253de), 'int', ['pointer', 'int'], {
  abi: 'sysv'
})
const mySQLGetStr = new NativeFunction(ptr(0x80ecdea), 'int', ['pointer', 'int', 'pointer', 'int'], {
  abi: 'sysv'
})
const mySQLBlobToStr = new NativeFunction(ptr(0x83f452a), 'pointer', ['pointer', 'int', 'pointer', 'int'], {
  abi: 'sysv'
})
const compressZip = new NativeFunction(ptr(0x86b201f), 'int', ['pointer', 'pointer', 'pointer', 'int'], {
  abi: 'sysv'
})
const uncompressZip = new NativeFunction(ptr(0x86b2102), 'int', ['pointer', 'pointer', 'pointer', 'int'], {
  abi: 'sysv'
})
const cUserCharacInfoGetCharacJob = new NativeFunction(ptr(0x80fdf20), 'int', ['pointer'], {
  abi: 'sysv'
})
const cUserCharacInfoGetCurCharacGrowType = new NativeFunction(ptr(0x815741c), 'int', ['pointer'], {
  abi: 'sysv'
})
const cUserCharacInfoGetCharacGuildkey = new NativeFunction(ptr(0x822f46c), 'int', ['pointer'], {
  abi: 'sysv'
})
const cUserGetGuildName = new NativeFunction(ptr(0x869742a), 'pointer', ['pointer'], {
  abi: 'sysv'
})
//线程安全锁
const guardMutexGuard = new NativeFunction(ptr(0x810544c), 'int', ['pointer', 'pointer'], {
  abi: 'sysv'
})
const destroyGuardMutexGuard = new NativeFunction(ptr(0x8105468), 'int', ['pointer'], {
  abi: 'sysv'
})
//服务器内置定时器队列
const gTimerQueue = new NativeFunction(ptr(0x80f647c), 'pointer', [], {
  abi: 'sysv'
})
//需要在dispatcher线程执行的任务队列(热加载后会被清空)
const timerDispatcherList = []
const inventoryTypeBody = 0 //身上穿的装备
const inventoryTypeItem = 1 //物品栏
const inventoryTypeAvatar = 2 //时装栏
//已打开的数据库句柄
let mySQLTaiwanCain = null
let mySQLTaiwanCain2nd = null
let mySQLTaiwanBilling = null
let mySQLFrida = null

// MySQL 操作封装
// ============================================================================

function apiMySQLOpen(dbName, dbIp, dbPort, dbAccount, dbPassword) {
  const mysql = Memory.alloc(0x80000)
  mySQLMySQL(mysql)
  mySQLInit(mysql)
  const dbIpPtr = Memory.allocUtf8String(dbIp)
  const dbNamePtr = Memory.allocUtf8String(dbName)
  const dbAccountPtr = Memory.allocUtf8String(dbAccount)
  const dbPasswordPtr = Memory.allocUtf8String(dbPassword)
  const ret = mySQLOpen(mysql, dbIpPtr, dbPort, dbNamePtr, dbAccountPtr, dbPasswordPtr)
  if (ret) { return mysql }
  return null
}

function apiMySQLExec(mysql, sql) {
  const sqlPtr = Memory.allocUtf8String(sql)
  mySQLSetQuery2(mysql, sqlPtr)
  return mySQLExec(mysql, 1)
}

function apiMySQLGetInt(mysql, fieldIndex) {
  const v = Memory.alloc(4)
  if (1 == mySQLGetInt(mysql, fieldIndex, v)) return v.readInt()
  return null
}
function apiMySQLGetUint(mysql, fieldIndex) {
  const v = Memory.alloc(4)
  if (1 == mySQLGetUint(mysql, fieldIndex, v)) return v.readUInt()
  return null
}
function apiMySQLGetShort(mysql, fieldIndex) {
  const v = Memory.alloc(4)
  if (1 == mySQLGetShort(mysql, fieldIndex, v)) return v.readShort()
  return null
}
function apiMySQLGetFloat(mysql, fieldIndex) {
  const v = Memory.alloc(4)
  if (1 == mySQLGetFloat(mysql, fieldIndex, v)) return v.readFloat()
  return null
}
function apiMySQLGetStr(mysql, fieldIndex) {
  const binaryLength = mySQLGetBinaryLength(mysql, fieldIndex)
  if (binaryLength > 0) {
    const v = Memory.alloc(binaryLength)
    if (1 == mySQLGetBinary(mysql, fieldIndex, v, binaryLength)) return v.readUtf8String(binaryLength)
  }
  return null
}
function apiMySQLGetBinary(mysql, fieldIndex) {
  const binaryLength = mySQLGetBinaryLength(mysql, fieldIndex)
  if (binaryLength > 0) {
    const v = Memory.alloc(binaryLength)
    if (1 == mySQLGetBinary(mysql, fieldIndex, v, binaryLength)) return v.readByteArray(binaryLength)
  }
  return null
}

// 数据库生命周期
function initDb() {
  const config = globalConfig['db_config']
  if (mySQLTaiwanCain == null) {
    mySQLTaiwanCain = apiMySQLOpen('taiwan_cain', '127.0.0.1', 3306, config['account'], config['password'])
  }
  if (mySQLTaiwanCain2nd == null) {
    mySQLTaiwanCain2nd = apiMySQLOpen('taiwan_cain_2nd', '127.0.0.1', 3306, config['account'], config['password'])
  }
  if (mySQLTaiwanBilling == null) {
    mySQLTaiwanBilling = apiMySQLOpen('taiwan_billing', '127.0.0.1', 3306, config['account'], config['password'])
  }
  apiMySQLExec(mySQLTaiwanCain, 'create database if not exists frida default charset utf8;')
  if (mySQLFrida == null) {
    mySQLFrida = apiMySQLOpen('frida', '127.0.0.1', 3306, config['account'], config['password'])
  }
  apiMySQLExec(
    mySQLFrida,
    'CREATE TABLE game_event (\
        event_id varchar(30) NOT NULL, event_info mediumtext NULL,\
        PRIMARY KEY  (event_id)\
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;'
  )
  eventVillageAttackLoadFromDb()
}

function uninitDb() {
  eventVillageAttackSaveToDb()
  if (mySQLTaiwanCain) { mySQLClose(mySQLTaiwanCain); mySQLTaiwanCain = null }
  if (mySQLTaiwanCain2nd) { mySQLClose(mySQLTaiwanCain2nd); mySQLTaiwanCain2nd = null }
  if (mySQLTaiwanBilling) { mySQLClose(mySQLTaiwanBilling); mySQLTaiwanBilling = null }
  if (mySQLFrida) { mySQLClose(mySQLFrida); mySQLFrida = null }
}

// ============================================================================

if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

__dnfExport({
  taiwanCain, dBMgrGetDBHandle, mySQLMySQL, mySQLInit, mySQLOpen, mySQLClose,
  mySQLSetQuery2, mySQLSetQuery3, mySQLSetQuery4, mySQLSetQuery5, mySQLSetQuery6,
  mySQLExec, mySQLExecQuery, mySQLGetNRows, mySQLFetch, mySQLGetInt, mySQLGetShort,
  mySQLGetUint, mySQLGetUlonglong, mySQLGetUshort, mySQLGetFloat, mySQLGetBinary,
  mySQLGetBinaryLength, mySQLGetStr, mySQLBlobToStr, compressZip, uncompressZip,
  cUserCharacInfoGetCharacJob, cUserCharacInfoGetCurCharacGrowType,
  cUserCharacInfoGetCharacGuildkey, cUserGetGuildName, guardMutexGuard,
  destroyGuardMutexGuard, gTimerQueue, timerDispatcherList,
  inventoryTypeBody, inventoryTypeItem, inventoryTypeAvatar,
  apiMySQLOpen, apiMySQLExec, apiMySQLGetInt, apiMySQLGetUint, apiMySQLGetShort,
  apiMySQLGetFloat, apiMySQLGetStr, apiMySQLGetBinary, initDb, uninitDb
})
__dnfMutable('mySQLTaiwanCain', () => mySQLTaiwanCain, (v) => { mySQLTaiwanCain = v })
__dnfMutable('mySQLTaiwanCain2nd', () => mySQLTaiwanCain2nd, (v) => { mySQLTaiwanCain2nd = v })
__dnfMutable('mySQLTaiwanBilling', () => mySQLTaiwanBilling, (v) => { mySQLTaiwanBilling = v })
__dnfMutable('mySQLFrida', () => mySQLFrida, (v) => { mySQLFrida = v })
