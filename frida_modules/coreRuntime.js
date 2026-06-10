// ============================================================================
// DNF Frida modern modular package - coreRuntime.js
// Core runtime utilities: logging, safe calls, native export lookup, timestamps, files, and binary helpers.
// ============================================================================

// 05. 日志与安全调用工具
// ============================================================================
const pluginLogPath = '/data/frida/plugin.log'
let pluginLogFile = null

function ensurePluginLogFile() {
  if (pluginLogFile) return
  try {
    pluginLogFile = new File(pluginLogPath, 'a+')
  } catch (e) {}
}

function pluginFileLog(level, message) {
  try {
    ensurePluginLogFile()
    if (pluginLogFile) {
      pluginLogFile.write(`[${getTimestamp()}] [${level}] ${message}\n`)
      pluginLogFile.flush()
    }
  } catch (e) {}
}

function closePluginLog() {
  if (pluginLogFile) {
    try { pluginLogFile.flush(); pluginLogFile.close() } catch (e) {}
    pluginLogFile = null
  }
}

function pluginLogInfo(message) {
  pluginFileLog('INFO', message)
}
function pluginLogWarn(message) {
  pluginFileLog('WARN', message)
}
function pluginLogError(message, error) {
  if (error) {
    pluginFileLog('ERROR', `${message}: ${error}`)
    return
  }
  pluginFileLog('ERROR', message)
}

// Hook 回调、模块安装、数据库操作都建议通过该函数保护，避免单个功能异常影响整体脚本。
function pluginSafeCall(name, callback) {
  try {
    return callback()
  } catch (error) {
    pluginLogError(name, error)
    return null
  }
}

// Frida 16.3.1 / QJS 环境中 Module.getGlobalExportByName 不可用。
// 系统导出统一走 Module.getExportByName(null, name)，并保留 findExportByName 兜底。
const pluginNativeAbi = {
  abi: 'sysv'
}
let pluginInstalledFeatureMap = {}
const lifecycleState = {
  initialized: false,
  initializing: false,
  disposing: false,
  disposed: false,
  failed: false
}
function getSystemExportAddress(name) {
  let address = null
  if (typeof Module.getExportByName === 'function') {
    return Module.getExportByName(null, name)
  }
  if (typeof Module.findExportByName === 'function') {
    address = Module.findExportByName(null, name)
    if (address) {
      return address
    }
  }
  throw new Error(`system export not found: ${name}`)
}
function createSystemNativeFunction(name, retType, argTypes) {
  return new NativeFunction(getSystemExportAddress(name), retType, argTypes, pluginNativeAbi)
}
function isNullPointer(pointerValue) {
  return !pointerValue || (typeof pointerValue.isNull === 'function' && pointerValue.isNull())
}
function isValidPointer(pointerValue) {
  return !isNullPointer(pointerValue)
}

function sqlEscapeString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

// ============================================================================


// 06. 原始工具函数与 NativeFunction 绑定区
// ============================================================================

//本地时间戳
function getTimestamp() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

//linux创建文件夹
function apiMkdir(path) {
  const opendir = createSystemNativeFunction('opendir', 'pointer', ['pointer'])
  const closedir = createSystemNativeFunction('closedir', 'int', ['pointer'])
  const mkdir = createSystemNativeFunction('mkdir', 'int', ['pointer', 'int'])
  const pathPtr = Memory.allocUtf8String(path)
  const dir = opendir(pathPtr)
  if (!isNullPointer(dir)) {
    closedir(dir)
    return true
  }
  return mkdir(pathPtr, 0x1ff)
}

// ============================================================================

if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

__dnfExport({
  pluginLogInfo, pluginLogWarn, pluginLogError, pluginSafeCall, closePluginLog,
  pluginNativeAbi, getSystemExportAddress, createSystemNativeFunction,
  isNullPointer, isValidPointer, sqlEscapeString, getTimestamp, apiMkdir
})
__dnfMutable('lifecycleState', () => lifecycleState)
__dnfMutable('pluginInstalledFeatureMap', () => pluginInstalledFeatureMap, (v) => { pluginInstalledFeatureMap = v })
