// ============================================================================
// DNF Frida modern modular package - main.js
// Startup orchestration and exported Frida module API.
// ============================================================================

// 20. 单文件模块注册区
// ============================================================================

// 统一安装功能，避免在 start() 中堆叠大量业务代码。
/** installPluginFeature。
 * @param {unknown} name 参数。
 * @param {unknown} enabled 参数。
 * @param {unknown} installer 参数。
 * @returns {unknown} 返回值。*/
function installPluginFeature(name, enabled, installer) {
  if (!enabled) {
    pluginLogWarn('功能已关闭: ' + name)
    return
  }
  if (pluginInstalledFeatureMap[name]) {
    pluginLogWarn('功能已安装，跳过重复安装: ' + name)
    return
  }
  pluginSafeCall('安装功能失败: ' + name, function () {
    installer()
    pluginInstalledFeatureMap[name] = true
    pluginLogInfo('功能已启用: ' + name)
  })
}

// 安装业务功能。
/** installBusinessFeatures。
 * @returns {unknown} 返回值。*/
function installBusinessFeatures() {
  installPluginFeature('绝望之塔修复', pluginFeatureSwitch.towerOfDespair, function () {
    installTowerOfDespairFix(pluginRuntimeConfig.skipTodUserApc)
  })
  installPluginFeature('时装徽章镶嵌', pluginFeatureSwitch.avatarEmblemSocket, function () {
    installAvatarEmblemFix()
  })
  installPluginFeature('时装潜能', pluginFeatureSwitch.hiddenOption, function () {
    installHiddenOptionFix()
  })
  installPluginFeature('玩家上下线处理', pluginFeatureSwitch.userWorldHook, function () {
    hookUserInOutGameWorld()
  })
  installPluginFeature('勇士归来天数设置', pluginFeatureSwitch.returnUser, function () {
    setReturnUserDays(pluginRuntimeConfig.returnUserDays)
  })
  installPluginFeature('在线奖励', pluginFeatureSwitch.onlineReward, function () {
    enableOnlineReward()
  })
}

// 安装基础服务。
/** installCoreServices。
 * @returns {unknown} 返回值。*/
function installCoreServices() {
  installPluginFeature('加载本地配置', pluginFeatureSwitch.loadConfig, function () {
    loadConfig(pluginRuntimeConfig.configPath)
  })
  installPluginFeature('初始化数据库', pluginFeatureSwitch.database, function () {
    apiScheduleOnMainThread(initDb, null)
  })
  installPluginFeature('挂接定时器分发线程', pluginFeatureSwitch.timerDispatcher, function () {
    hookTimerDispatcherDispatch()
  })
  installPluginFeature('怪物攻城活动', pluginFeatureSwitch.villageAttack, function () {
    apiScheduleOnMainThread(startEventVillageAttack, null)
  })
}
let pluginStarted = false
// 加载主功能。
/** start。
 * @returns {unknown} 返回值。*/
function start() {
  if (pluginStarted && !pluginRuntimeConfig.allowRepeatStart) {
    pluginLogWarn('start() 已执行过，本次跳过，避免重复安装 Hook。')
    return
  }
  pluginStarted = true
  pluginLogInfo('++++++++++++++++++++ frida init start ++++++++++++++++++++')
  try {
    var bootFile = new File('/tmp/frida_modular_boot.log', 'a+')
    bootFile.write('[MAIN_START] frida init start\n')
    bootFile.flush()
    bootFile.close()
  } catch (e) {}
  // 安装业务 Hook。
  installBusinessFeatures()
  // 安装基础服务。这里保持原脚本语义：配置、数据库、定时器、活动启动都在 start 阶段完成。
  installCoreServices()
  lifecycleState.initialized = true
  lifecycleState.initializing = false
  pluginLogInfo('++++++++++++++++++++ frida init done ++++++++++++++++++++')
  try {
    var bootFile2 = new File('/tmp/frida_modular_boot.log', 'a+')
    bootFile2.write('[MAIN_START] frida init done\n')
    bootFile2.flush()
    bootFile2.close()
  } catch (e) {}
}

// 延迟加载插件。
// early 阶段加载时，等待 check_argv 执行结束，再安装业务 Hook 和基础服务。
/** awake。
 * @returns {unknown} 返回值。*/
function awake() {
  if (typeof globalThis.dnfPlugin !== 'undefined' && globalThis.dnfPlugin.entryEarlyHookInstalled) {
    pluginLogWarn('awake skipped: entry early hook already installed')
    return
  }
  Interceptor.attach(pluginAddress.checkArgv, {
    onEnter: function (args) {},
    onLeave: function (retval) {
      start()
    }
  })
}

// 框架入口。
/** 初始化插件。
 * @param {unknown} stage 参数。
 * @param {unknown} parameters 参数。
 * @returns {unknown} 返回值。*/
function init(stage, parameters) {
  lifecycleState.initializing = true
  lifecycleState.failed = false
  try {
    if (stage == 'early') {
      awake()
      // lifecycleState.initialized set by start()
  lifecycleState.initializing = false
      return
    }
    start()
    lifecycleState.initialized = true
    lifecycleState.initializing = false
  } catch (error) {
    lifecycleState.failed = true
    lifecycleState.initializing = false
    pluginLogError('frida init failed', error)
  }
}
/** 释放插件资源。
 * @returns {unknown} 返回值。*/
function dispose() {
  pluginLogInfo('-------------------- frida dispose called -----------------')
  if (lifecycleState.disposing) {
    pluginLogWarn('dispose skipped: already disposing')
    return 'dispose_skip_already_disposing'
  }
  if (!lifecycleState.initialized && !lifecycleState.failed) {
    pluginLogWarn('dispose skipped: not initialized (early DP2 dispose, safe to ignore)')
    lifecycleState.disposed = true
    return 'dispose_skip_not_initialized'
  }
  lifecycleState.disposing = true
  try {
    pluginSafeCall('dispose_save_ranking', function () {
      if (pluginFeatureSwitch.database && isValidPointer(mySQLFrida)) {
        eventRankinfoSaveToDb()
      }
    })
    pluginSafeCall('dispose_uninit_db', function () {
      if (pluginFeatureSwitch.database && isValidPointer(mySQLFrida)) {
        uninitDb()
      }
    })
    lifecycleState.disposed = true
    lifecycleState.initialized = false
  } finally {
    lifecycleState.disposing = false
    pluginStarted = false
    pluginInstalledFeatureMap = {}
    closeLogFile()
    pluginLogInfo('-------------------- frida dispose done -----------------')
  }
}
export { init, start, awake, dispose } // ============================================================================

// ============================================================================
// 模块公共 API 注册区
// ============================================================================
if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

/**
 * Registers public symbols exported by main.js.
 * Symbols are also attached to globalThis to preserve old script-style references
 * between modules loaded through Frida Script.load().
 * @returns {void}
 */
function registerCurrentModuleSymbols() {
  globalThis.installPluginFeature = installPluginFeature
  globalThis.dnfPlugin.installPluginFeature = installPluginFeature
  globalThis.installBusinessFeatures = installBusinessFeatures
  globalThis.dnfPlugin.installBusinessFeatures = installBusinessFeatures
  globalThis.installCoreServices = installCoreServices
  globalThis.dnfPlugin.installCoreServices = installCoreServices
  globalThis.start = start
  globalThis.dnfPlugin.start = start
  globalThis.awake = awake
  globalThis.dnfPlugin.awake = awake
  globalThis.init = init
  globalThis.dnfPlugin.init = init
  globalThis.dispose = dispose
  globalThis.dnfPlugin.dispose = dispose
  Object.defineProperty(globalThis, 'pluginStarted', {
    get: function () {
      return pluginStarted
    },
    set: function (value) {
      pluginStarted = value
    },
    configurable: true
  })
  Object.defineProperty(globalThis.dnfPlugin, 'pluginStarted', {
    get: function () {
      return pluginStarted
    },
    set: function (value) {
      pluginStarted = value
    },
    configurable: true
  })
}

registerCurrentModuleSymbols()
