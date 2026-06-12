// ============================================================================
// DNF Frida modern modular package - main.js
// Startup orchestration and exported Frida module API.
// ============================================================================

// 20. 单文件模块注册区
// ============================================================================

// 统一安装功能，避免在 start() 中堆叠大量业务代码。
function installPluginFeature(name, enabled, installer) {
  if (!enabled) {
    bootLog(`[WARN] 功能已关闭: ${name}`)
    return
  }
  if (pluginInstalledFeatureMap[name]) {
    bootLog(`[WARN] 功能已安装，跳过重复安装: ${name}`)
    return
  }
  pluginSafeCall(`安装功能失败: ${name}`, function () {
    installer()
    pluginInstalledFeatureMap[name] = true
    bootLog(`[INFO] 功能已启用: ${name}`)
  })
}

// 安装业务功能。
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
function installCoreServices() {
  installPluginFeature('加载本地配置', pluginFeatureSwitch.loadConfig, function () {
    loadConfig(pluginRuntimeConfig.configPath)
  })
  installPluginFeature('爆率控制', pluginFeatureSwitch.dropRate, function () {
    installDropRate()
  })
  installPluginFeature('GM权限绕过', pluginFeatureSwitch.gmBypass, function () {
    installGmBypass()
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
function start() {
  if (globalThis.dnfPlugin?._started) {
    bootLog('[WARN] start() 已执行过，本次跳过，避免重复安装 Hook。')
    return
  }
  if (pluginStarted && !pluginRuntimeConfig.allowRepeatStart) {
    bootLog('[WARN] start() 已执行过，本次跳过，避免重复安装 Hook。')
    return
  }
  pluginStarted = true
  globalThis.dnfPlugin._started = true
  bootLog('[INFO] ++++++++++++++++++++ frida init start ++++++++++++++++++++')
  try {
    const bootFile = new File('/tmp/frida_modular_boot.log', 'a+')
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
  bootLog('[INFO] ++++++++++++++++++++ frida init done ++++++++++++++++++++')
  try {
    const bootFile2 = new File('/tmp/frida_modular_boot.log', 'a+')
    bootFile2.write('[MAIN_START] frida init done\n')
    bootFile2.flush()
    bootFile2.close()
  } catch (e) {}
}

// 延迟加载插件。
// early 阶段加载时，等待 check_argv 执行结束，再安装业务 Hook 和基础服务。
function awake() {
  if (globalThis.dnfPlugin?.entryEarlyHookInstalled) {
    bootLog('[WARN] awake skipped: entry early hook already installed')
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
    bootLog('[ERROR] frida init failed: ' + error)
  }
}
function dispose() {
  bootLog('[INFO] -------------------- frida dispose called -----------------')
  if (lifecycleState.disposing) {
    bootLog('[WARN] dispose skipped: already disposing')
    return 'dispose_skip_already_disposing'
  }
  if (!lifecycleState.initialized && !lifecycleState.failed) {
    bootLog('[WARN] dispose skipped: not initialized (early DP2 dispose, safe to ignore)')
    lifecycleState.disposed = true
    return 'dispose_skip_not_initialized'
  }
  lifecycleState.disposing = true
  try {
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
    if (globalThis.dnfPlugin) {
      globalThis.dnfPlugin._started = false
    }
    closeBootLog()
    closeBootLog()
    bootLog('[INFO] -------------------- frida dispose done -----------------')
  }
}
export { init, start, awake, dispose } // ============================================================================

if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

__dnfExport({
  installPluginFeature, installBusinessFeatures, installCoreServices,
  start, awake, init, dispose
})
__dnfMutable('pluginStarted', () => pluginStarted, (v) => { pluginStarted = v })
