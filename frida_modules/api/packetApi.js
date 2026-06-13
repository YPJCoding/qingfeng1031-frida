// ============================================================================
// DNF Frida modern modular package - packetApi.js
// Packet buffer read/write and notification message helpers.
// ============================================================================

//服务器组包
function apiPacketGuardPacketGuard() {
  const packetGuard = Memory.alloc(0x20000)
  packetGuardPacketGuard(packetGuard)
  return packetGuard
}

//从客户端封包中读取数据(失败会抛异常, 调用方必须做异常处理)
function apiPacketBufGetByte(packetBuf) {
  const data = Memory.alloc(1)
  if (packetBufGetByte(packetBuf, data)) {
    return data.readU8()
  }
  throw new Error('PacketBuf_get_byte Fail!')
}
function apiPacketBufGetShort(packetBuf) {
  const data = Memory.alloc(2)
  if (packetBufGetShort(packetBuf, data)) {
    return data.readShort()
  }
  throw new Error('PacketBuf_get_short Fail!')
}
function apiPacketBufGetInt(packetBuf) {
  const data = Memory.alloc(4)
  if (packetBufGetInt(packetBuf, data)) {
    return data.readInt()
  }
  throw new Error('PacketBuf_get_int Fail!')
}
function apiPacketBufGetBinary(packetBuf, len) {
  const data = Memory.alloc(len)
  if (packetBufGetBinary(packetBuf, data, len)) {
    return data.readByteArray(len)
  }
  throw new Error('PacketBuf_get_binary Fail!')
}

//获取原始封包数据
function apiPacketBufGetBuf(packetBuf) {
  return packetBuf.add(20).readPointer().add(13)
}

//给角色发消息
function apiCUserSendNotiPacketMessage(user, msg, msgType) {
  const p = Memory.allocUtf8String(msg)
  cUserSendNotiPacketMessage(user, p, msgType)
  return
}

//发送字符串给客户端
function apiInterfacePacketBufPutString(packetGuard, s) {
  const p = Memory.allocUtf8String(s)
  const len = strlen(p)
  interfacePacketBufPutInt(packetGuard, len)
  interfacePacketBufPutBinary(packetGuard, p, len)
  return
}

//世界广播(频道内公告)
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

// ============================================================================

if (!globalThis.dnfPlugin) { globalThis.dnfPlugin = {} }
__dnfExport({ apiPacketGuardPacketGuard, apiPacketBufGetByte, apiPacketBufGetShort, apiPacketBufGetInt, apiPacketBufGetBinary, apiPacketBufGetBuf, apiCUserSendNotiPacketMessage, apiInterfacePacketBufPutString, apiGameWorldSendNotiPacketMessage })
