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
const inventoryTypeAvartar = 2 //时装栏
//已打开的数据库句柄
let mySQLTaiwanCain = null
let mySQLTaiwanCain2nd = null
let mySQLTaiwanBilling = null
let mySQLFrida = null
// ============================================================================

// ============================================================================
// 模块公共 API 注册区
// ============================================================================
if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

/**
 * Registers public symbols exported by databaseApi.js.
 * Symbols are also attached to globalThis to preserve old script-style references
 * between modules loaded through Frida Script.load().
 * @returns {void}
 */
function registerCurrentModuleSymbols() {
  globalThis.taiwanCain = taiwanCain
  globalThis.dnfPlugin.taiwanCain = taiwanCain
  globalThis.dBMgrGetDBHandle = dBMgrGetDBHandle
  globalThis.dnfPlugin.dBMgrGetDBHandle = dBMgrGetDBHandle
  globalThis.mySQLMySQL = mySQLMySQL
  globalThis.dnfPlugin.mySQLMySQL = mySQLMySQL
  globalThis.mySQLInit = mySQLInit
  globalThis.dnfPlugin.mySQLInit = mySQLInit
  globalThis.mySQLOpen = mySQLOpen
  globalThis.dnfPlugin.mySQLOpen = mySQLOpen
  globalThis.mySQLClose = mySQLClose
  globalThis.dnfPlugin.mySQLClose = mySQLClose
  globalThis.mySQLSetQuery2 = mySQLSetQuery2
  globalThis.dnfPlugin.mySQLSetQuery2 = mySQLSetQuery2
  globalThis.mySQLSetQuery3 = mySQLSetQuery3
  globalThis.dnfPlugin.mySQLSetQuery3 = mySQLSetQuery3
  globalThis.mySQLSetQuery4 = mySQLSetQuery4
  globalThis.dnfPlugin.mySQLSetQuery4 = mySQLSetQuery4
  globalThis.mySQLSetQuery5 = mySQLSetQuery5
  globalThis.dnfPlugin.mySQLSetQuery5 = mySQLSetQuery5
  globalThis.mySQLSetQuery6 = mySQLSetQuery6
  globalThis.dnfPlugin.mySQLSetQuery6 = mySQLSetQuery6
  globalThis.mySQLExec = mySQLExec
  globalThis.dnfPlugin.mySQLExec = mySQLExec
  globalThis.mySQLExecQuery = mySQLExecQuery
  globalThis.dnfPlugin.mySQLExecQuery = mySQLExecQuery
  globalThis.mySQLGetNRows = mySQLGetNRows
  globalThis.dnfPlugin.mySQLGetNRows = mySQLGetNRows
  globalThis.mySQLFetch = mySQLFetch
  globalThis.dnfPlugin.mySQLFetch = mySQLFetch
  globalThis.mySQLGetInt = mySQLGetInt
  globalThis.dnfPlugin.mySQLGetInt = mySQLGetInt
  globalThis.mySQLGetShort = mySQLGetShort
  globalThis.dnfPlugin.mySQLGetShort = mySQLGetShort
  globalThis.mySQLGetUint = mySQLGetUint
  globalThis.dnfPlugin.mySQLGetUint = mySQLGetUint
  globalThis.mySQLGetUlonglong = mySQLGetUlonglong
  globalThis.dnfPlugin.mySQLGetUlonglong = mySQLGetUlonglong
  globalThis.mySQLGetUshort = mySQLGetUshort
  globalThis.dnfPlugin.mySQLGetUshort = mySQLGetUshort
  globalThis.mySQLGetFloat = mySQLGetFloat
  globalThis.dnfPlugin.mySQLGetFloat = mySQLGetFloat
  globalThis.mySQLGetBinary = mySQLGetBinary
  globalThis.dnfPlugin.mySQLGetBinary = mySQLGetBinary
  globalThis.mySQLGetBinaryLength = mySQLGetBinaryLength
  globalThis.dnfPlugin.mySQLGetBinaryLength = mySQLGetBinaryLength
  globalThis.mySQLGetStr = mySQLGetStr
  globalThis.dnfPlugin.mySQLGetStr = mySQLGetStr
  globalThis.mySQLBlobToStr = mySQLBlobToStr
  globalThis.dnfPlugin.mySQLBlobToStr = mySQLBlobToStr
  globalThis.compressZip = compressZip
  globalThis.dnfPlugin.compressZip = compressZip
  globalThis.uncompressZip = uncompressZip
  globalThis.dnfPlugin.uncompressZip = uncompressZip
  globalThis.cUserCharacInfoGetCharacJob = cUserCharacInfoGetCharacJob
  globalThis.dnfPlugin.cUserCharacInfoGetCharacJob = cUserCharacInfoGetCharacJob
  globalThis.cUserCharacInfoGetCurCharacGrowType = cUserCharacInfoGetCurCharacGrowType
  globalThis.dnfPlugin.cUserCharacInfoGetCurCharacGrowType = cUserCharacInfoGetCurCharacGrowType
  globalThis.cUserCharacInfoGetCharacGuildkey = cUserCharacInfoGetCharacGuildkey
  globalThis.dnfPlugin.cUserCharacInfoGetCharacGuildkey = cUserCharacInfoGetCharacGuildkey
  globalThis.cUserGetGuildName = cUserGetGuildName
  globalThis.dnfPlugin.cUserGetGuildName = cUserGetGuildName
  globalThis.guardMutexGuard = guardMutexGuard
  globalThis.dnfPlugin.guardMutexGuard = guardMutexGuard
  globalThis.destroyGuardMutexGuard = destroyGuardMutexGuard
  globalThis.dnfPlugin.destroyGuardMutexGuard = destroyGuardMutexGuard
  globalThis.gTimerQueue = gTimerQueue
  globalThis.dnfPlugin.gTimerQueue = gTimerQueue
  globalThis.timerDispatcherList = timerDispatcherList
  globalThis.dnfPlugin.timerDispatcherList = timerDispatcherList
  globalThis.inventoryTypeBody = inventoryTypeBody
  globalThis.dnfPlugin.inventoryTypeBody = inventoryTypeBody
  globalThis.inventoryTypeItem = inventoryTypeItem
  globalThis.dnfPlugin.inventoryTypeItem = inventoryTypeItem
  globalThis.inventoryTypeAvartar = inventoryTypeAvartar
  globalThis.dnfPlugin.inventoryTypeAvartar = inventoryTypeAvartar
  Object.defineProperty(globalThis, 'mySQLTaiwanCain', {
    get: function () {
      return mySQLTaiwanCain
    },
    set: function (value) {
      mySQLTaiwanCain = value
    },
    configurable: true
  })
  Object.defineProperty(globalThis.dnfPlugin, 'mySQLTaiwanCain', {
    get: function () {
      return mySQLTaiwanCain
    },
    set: function (value) {
      mySQLTaiwanCain = value
    },
    configurable: true
  })
  Object.defineProperty(globalThis, 'mySQLTaiwanCain2nd', {
    get: function () {
      return mySQLTaiwanCain2nd
    },
    set: function (value) {
      mySQLTaiwanCain2nd = value
    },
    configurable: true
  })
  Object.defineProperty(globalThis.dnfPlugin, 'mySQLTaiwanCain2nd', {
    get: function () {
      return mySQLTaiwanCain2nd
    },
    set: function (value) {
      mySQLTaiwanCain2nd = value
    },
    configurable: true
  })
  Object.defineProperty(globalThis, 'mySQLTaiwanBilling', {
    get: function () {
      return mySQLTaiwanBilling
    },
    set: function (value) {
      mySQLTaiwanBilling = value
    },
    configurable: true
  })
  Object.defineProperty(globalThis.dnfPlugin, 'mySQLTaiwanBilling', {
    get: function () {
      return mySQLTaiwanBilling
    },
    set: function (value) {
      mySQLTaiwanBilling = value
    },
    configurable: true
  })
  Object.defineProperty(globalThis, 'mySQLFrida', {
    get: function () {
      return mySQLFrida
    },
    set: function (value) {
      mySQLFrida = value
    },
    configurable: true
  })
  Object.defineProperty(globalThis.dnfPlugin, 'mySQLFrida', {
    get: function () {
      return mySQLFrida
    },
    set: function (value) {
      mySQLFrida = value
    },
    configurable: true
  })
}

registerCurrentModuleSymbols()
