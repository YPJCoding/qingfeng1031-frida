// ============================================================================
// DNF Frida modern modular entry
// Early checkArgv hook installed before async module loading to avoid race.
// ============================================================================

globalThis.__dnfExport = function (exportsObj) {
  const ns = globalThis.dnfPlugin
  for (const [k, v] of Object.entries(exportsObj)) {
    globalThis[k] = v
    ns[k] = v
  }
}
globalThis.__dnfMutable = function (name, getter, setter) {
  const desc = { get: getter, configurable: true }
  if (setter) desc.set = setter
  Object.defineProperty(globalThis, name, desc)
  const ns = globalThis.dnfPlugin || {}
  Object.defineProperty(ns, name, desc)
}

const modulePathConfig = {
  baseDir: '/data/frida/frida_modules',
  modules: [
    ['config', 'config.js'],
    ['coreRuntime', 'coreRuntime.js'],
    ['nativeBindings', 'nativeBindings.js'],
    ['databaseApi', 'databaseApi.js'],
    ['villageState', 'villageState.js'],
    ['gameApi', 'gameApi.js'],
    ['villageAttack', 'villageAttack.js'],
    ['questFeature', 'questFeature.js'],
    ['towerOfDespair', 'towerOfDespair.js'],
    ['avatarEmblem', 'avatarEmblem.js'],
    ['ranking', 'ranking.js'],
    ['userWorld', 'userWorld.js'],
    ['returnUser', 'returnUser.js'],
    ['hiddenOption', 'hiddenOption.js'],
    ['main', 'main.js'],
    ['legacyAliases', 'legacyAliases.js']
  ]
}

const bootLogPath = '/tmp/frida_modular_boot.log'
const checkArgvAddress = ptr(0x829ea5a)

const loadedModuleMap = {}
let mainModule = null
let modulesLoaded = false
let modulesLoadingPromise = null
let earlyHookInstalled = false
let earlyHookTriggered = false
let pendingEarlyStart = false
let pluginStartCalled = false
let initStage = null
let initParameters = null

function bootNowText() {
  try {
    return new Date().toISOString()
  } catch (error) {
    return String(Date.now())
  }
}

function bootLog(message) {
  const line = '[' + bootNowText() + '] ' + message

  try {
    console.log('[FRIDA_BOOT] ' + message)
  } catch (error) {
  }

  try {
    const file = new File(bootLogPath, 'a+')
    file.write(line + '\n')
    file.flush()
    file.close()
  } catch (error) {
  }
}

function resolveModulePath(fileName) {
  return modulePathConfig.baseDir + '/' + fileName
}

function readTextFile(filePath) {
  return File.readAllText(filePath)
}

async function loadScriptModule(moduleName, filePath) {
  bootLog('loading module: ' + moduleName)
  const source = readTextFile(filePath)
  const moduleNamespace = await Script.load('dnf-frida-' + moduleName, source)
  bootLog('loaded module: ' + moduleName)
  return moduleNamespace
}

async function loadAllModules() {
  if (modulesLoaded) {
    return mainModule
  }

  if (modulesLoadingPromise) {
    return modulesLoadingPromise
  }

  modulesLoadingPromise = (async function () {
    globalThis.dnfPlugin = globalThis.dnfPlugin || {}

    for (let index = 0; index < modulePathConfig.modules.length; index += 1) {
      const moduleItem = modulePathConfig.modules[index]
      const moduleName = moduleItem[0]
      const fileName = moduleItem[1]
      const moduleNamespace = await loadScriptModule(moduleName, resolveModulePath(fileName))

      loadedModuleMap[moduleName] = moduleNamespace

      if (moduleName === 'main') {
        mainModule = moduleNamespace
      }
    }

    modulesLoaded = true
    bootLog('all modules loaded, pendingEarlyStart=' + pendingEarlyStart)

    if (pendingEarlyStart) {
      bootLog('pending early start detected after modules loaded')
      startMainModule('pendingEarlyStartAfterLoad')
    }

    return mainModule
  })()

  return modulesLoadingPromise
}

function startMainModule(reason) {
  if (pluginStartCalled) {
    bootLog('start skipped: already called, reason=' + reason)
    return 'start_skip_already_called'
  }

  if (typeof mainModule?.start !== 'function') {
    bootLog('start skipped: mainModule.start not ready, reason=' + reason)
    pendingEarlyStart = true
    return 'start_pending_module_not_ready'
  }

  pluginStartCalled = true
  pendingEarlyStart = false

  bootLog(`mainModule keys=${JSON.stringify(Object.keys(mainModule || {}))}`)
  bootLog(`mainModule.start typeof=${typeof mainModule?.start}`)
  bootLog('calling mainModule.start, reason=' + reason)

  try {
    const result = mainModule.start()
    bootLog('mainModule.start returned: ' + result)
    return result
  } catch (error) {
    bootLog('mainModule.start failed: ' + error)
    throw error
  }
}

function installEarlyCheckArgvHook() {
  if (earlyHookInstalled) {
    bootLog('early checkArgv hook skipped: already installed')
    return
  }

  earlyHookInstalled = true

  globalThis.dnfPlugin = globalThis.dnfPlugin || {}
  globalThis.dnfPlugin.entryEarlyHookInstalled = true

  bootLog('installing early checkArgv hook at ' + checkArgvAddress)

  Interceptor.attach(checkArgvAddress, {
    onEnter(args) {
      bootLog('checkArgv onEnter')
    },
    onLeave(retval) {
      earlyHookTriggered = true
      bootLog('checkArgv onLeave, retval=' + retval)

      if (modulesLoaded) {
        startMainModule('checkArgvOnLeave')
        return
      }

      pendingEarlyStart = true
      bootLog('modules not loaded yet, mark pendingEarlyStart=true')
    }
  })

  Interceptor.flush()
  bootLog('early checkArgv hook installed')
}

function scheduleEarlyFallbackStart() {
  setTimeout(function () {
    if (pluginStartCalled) {
      bootLog('early fallback skipped: already started')
      return
    }

    if (!modulesLoaded) {
      bootLog('early fallback waiting: modules not loaded')
      return
    }

    if (!earlyHookTriggered) {
      bootLog('early fallback start: checkArgv was not triggered, probably missed')
      startMainModule('earlyFallbackAfterModulesLoaded')
    }
  }, 1000)
}

rpc.exports = {
  async init(stage, parameters) {
    initStage = stage
    initParameters = parameters

    bootLog('rpc init called, stage=' + stage + ', parameters=' + JSON.stringify(parameters))
    bootLog('entry runtime: typeof File=' + typeof File + ', typeof Script=' + typeof Script)

    if (stage === 'early') {
      installEarlyCheckArgvHook()
      scheduleEarlyFallbackStart()
      loadAllModules().catch(function (error) {
        bootLog('loadAllModules failed: ' + error)
      })
      return 'early_init_async_loading'
    }

    const moduleApi = await loadAllModules()
    if (moduleApi && typeof moduleApi.init === 'function') {
      return moduleApi.init(stage, parameters)
    }

    return startMainModule('normalStageNoInit')
  },

  async dispose() {
    bootLog('rpc dispose called')

    if (!modulesLoaded || !mainModule) {
      bootLog('dispose skipped: modules not loaded')
      return 'dispose_skip_modules_not_loaded'
    }

    if (typeof mainModule.dispose !== 'function') {
      bootLog('dispose skipped: mainModule.dispose missing')
      return 'dispose_skip_missing'
    }

    try {
      const result = await mainModule.dispose()
      bootLog('dispose returned: ' + result)
      return result
    } catch (error) {
      bootLog('dispose failed: ' + error)
      return 'dispose_failed: ' + error
    }
  }
}
