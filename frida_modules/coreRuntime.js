// ============================================================================
// DNF Frida modern modular package - coreRuntime.js
// Core runtime utilities: logging, safe calls, native export lookup, timestamps, files, and binary helpers.
// ============================================================================

// 05. 日志与安全调用工具
// ============================================================================
/** pluginLogInfo。
 * @param {unknown} message 参数。
 * @returns {unknown} 返回值。*/
function pluginLogInfo(message) {
  console.log('[INFO] ' + message)
}
/** pluginLogWarn。
 * @param {unknown} message 参数。
 * @returns {unknown} 返回值。*/
function pluginLogWarn(message) {
  console.log('[WARN] ' + message)
}
/** pluginLogError。
 * @param {unknown} message 参数。
 * @param {unknown} error 参数。
 * @returns {unknown} 返回值。*/
function pluginLogError(message, error) {
  if (error) {
    console.log('[ERROR] ' + message + ': ' + error)
    return
  }
  console.log('[ERROR] ' + message)
}

// Hook 回调、模块安装、数据库操作都建议通过该函数保护，避免单个功能异常影响整体脚本。
/** pluginSafeCall。
 * @param {unknown} name 参数。
 * @param {unknown} callback 参数。
 * @returns {unknown} 返回值。*/
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
/** getSystemExportAddress。
 * @param {unknown} name 参数。
 * @returns {unknown} 返回值。*/
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
/** createSystemNativeFunction。
 * @param {unknown} name 参数。
 * @param {unknown} retType 参数。
 * @param {unknown} argTypes 参数。
 * @returns {unknown} 返回值。*/
function createSystemNativeFunction(name, retType, argTypes) {
  return new NativeFunction(getSystemExportAddress(name), retType, argTypes, pluginNativeAbi)
}
/** isNullPointer。
 * @param {unknown} pointerValue 参数。
 * @returns {unknown} 返回值。*/
function isNullPointer(pointerValue) {
  return !pointerValue || (typeof pointerValue.isNull === 'function' && pointerValue.isNull())
}
function isValidPointer(pointerValue) {
  return !isNullPointer(pointerValue)
}

/** sqlEscapeString。
 * @param {unknown} value 参数。
 * @returns {unknown} 返回值。*/
function sqlEscapeString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

// ============================================================================


// 06. 原始工具函数与 NativeFunction 绑定区
// ============================================================================

//本地时间戳
/** getTimestamp。
 * @returns {unknown} 返回值。*/
function getTimestamp() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

//linux创建文件夹
/** apiMkdir。
 * @param {unknown} path 参数。
 * @returns {unknown} 返回值。*/
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
  pluginLogInfo, pluginLogWarn, pluginLogError, pluginSafeCall,
  pluginNativeAbi, getSystemExportAddress, createSystemNativeFunction,
  isNullPointer, isValidPointer, sqlEscapeString, getTimestamp, apiMkdir
})
__dnfMutable('lifecycleState', () => lifecycleState)
__dnfMutable('pluginInstalledFeatureMap', () => pluginInstalledFeatureMap, (v) => { pluginInstalledFeatureMap = v })
