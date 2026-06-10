// ============================================================================
// DNF Frida modern modular package - avatarEmblem.js
// Avatar emblem socket read/write and packet handling.
// ============================================================================

// 14. 时装徽章镶嵌业务区
// ============================================================================

//获取时装在数据库中的uid
function apiGetAvatarUiId(avatar) {
  return avatar.add(7).readInt()
}

//设置时装插槽数据(时装插槽数据指针, 插槽, 徽章id)
//jewel_type: 红=0x1, 黄=0x2, 绿=0x4, 蓝=0x8, 白金=0x10
function apiSetJewelSocketData(jewelSocketData, slot, emblemItemId) {
  if (!jewelSocketData.isNull()) {
    //每个槽数据长6个字节: 2字节槽类型+4字节徽章item_id
    //镶嵌不改变槽类型, 这里只修改徽章id
    jewelSocketData.add(slot * 6 + 2).writeInt(emblemItemId)
  }
  return
}

//修复时装镶嵌
function installAvatarEmblemFix() {
  //Dispatcher_UseJewel::dispatch_sig
  Interceptor.attach(ptr(0x8217bd6), {
    onEnter: function (args) {
      try {
        const user = args[1]
        const packetBuf = args[2]
        //校验角色状态是否允许镶嵌
        const state = cUserGetState(user)
        if (state != 3) {
          return
        }
        //解析packet_buf
        //时装所在的背包槽
        const avatarInvenSlot = apiPacketBufGetShort(packetBuf)
        //时装item_id
        const avatarItemId = apiPacketBufGetInt(packetBuf)
        //本次镶嵌徽章数量
        const emblemCnt = apiPacketBufGetByte(packetBuf)
        //获取时装道具
        const inven = cUserCharacInfoGetCurCharacInvenW(user)
        const avatar = cInventoryGetInvenRef(inven, inventoryTypeAvatar, avatarInvenSlot)
        //校验时装 数据是否合法
        if (
          invenItemIsEmpty(avatar) ||
          invenItemGetKey(avatar) != avatarItemId ||
          cUserCheckItemLock(user, 2, avatarInvenSlot)
        ) {
          return
        }
        //获取时装插槽数据
        const avatarAddInfo = invenItemGetAddInfo(avatar)
        const invenAvatarMgr = cInventoryGetAvatarItemMgrR(inven)
        const jewelSocketData = wongWorkCAvatarItemMgrGetJewelSocketData(invenAvatarMgr, avatarAddInfo)
        if (jewelSocketData.isNull()) {
          return
        }
        //最多只支持3个插槽
        if (emblemCnt <= 3) {
          const emblems = {}
          for (let i = 0; i < emblemCnt; i++) {
            //徽章所在的背包槽
            const emblemInvenSlot = apiPacketBufGetShort(packetBuf)
            //徽章item_id
            const emblemItemId = apiPacketBufGetInt(packetBuf)
            //该徽章镶嵌的时装插槽id
            const avatarSocketSlot = apiPacketBufGetByte(packetBuf)
            //log('emblem_inven_slot=' + emblem_inven_slot + ', emblem_item_id=' + emblem_item_id + ', avatar_socket_slot=' + avatar_socket_slot)
            //获取徽章道具
            const emblem = cInventoryGetInvenRef(inven, inventoryTypeItem, emblemInvenSlot)
            //校验徽章及插槽数据是否合法
            if (invenItemIsEmpty(emblem) || invenItemGetKey(emblem) != emblemItemId || avatarSocketSlot >= 3) {
              return
            }
            //校验徽章是否满足时装插槽颜色要求
            //获取徽章pvf数据
            const citem = cDataManagerFindItem(gCDataManager(), emblemItemId)
            if (citem.isNull()) {
              return
            }
            //校验徽章类型
            if (!cItemIsStackable(citem) || cStackableItemGetItemType(citem) != 20) {
              return
            }
            //获取徽章支持的插槽
            const emblemSocketType = cStackableItemGetJewelTargetSocket(citem)
            //获取要镶嵌的时装插槽类型
            const avatarSocketType = jewelSocketData.add(avatarSocketSlot * 6).readShort()
            if (!(emblemSocketType & avatarSocketType)) {
              //插槽类型不匹配
              //log('socket type not match!')
              return
            }
            emblems[avatarSocketSlot] = [emblemInvenSlot, emblemItemId]
          }
          //开始镶嵌
          for (const avatarSocketSlot in emblems) {
            //删除徽章
            const emblemInvenSlot = emblems[avatarSocketSlot][0]
            cInventoryDeleteItem(inven, 1, emblemInvenSlot, 1, 8, 1)
            //设置时装插槽数据
            const emblemItemId = emblems[avatarSocketSlot][1]
            apiSetJewelSocketData(jewelSocketData, avatarSocketSlot, emblemItemId)
            //log('徽章item_id=' + emblem_item_id + '已成功镶嵌进avatar_socket_slot=' + avatar_socket_slot + '的槽内!')
          }
          //时装插槽数据存档
          dbUpdateAvatarJewelSlotMakeRequest(
            cUserCharacInfoGetCurCharacNo(user),
            apiGetAvatarUiId(avatar),
            jewelSocketData
          )
          //通知客户端时装数据已更新
          cUserSendUpdateItemList(user, 1, 1, avatarInvenSlot)
          //回包给客户端
          const packetGuard = apiPacketGuardPacketGuard()
          interfacePacketBufPutHeader(packetGuard, 1, 204)
          interfacePacketBufPutInt(packetGuard, 1)
          interfacePacketBufFinalize(packetGuard, 1)
          cUserSend(user, packetGuard)
          destroyPacketGuardPacketGuard(packetGuard)
          //log('镶嵌请求已处理完成!')
        }
      } catch (error) {
        console.log('installAvatarEmblemFix throw Exception:' + error)
      }
    },
    onLeave: function (retval) {
      //返回值改为0  不再踢线
      retval.replace(0)
    }
  })
}

// ============================================================================

if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

__dnfExport({ apiGetAvatarUiId, apiSetJewelSocketData, installAvatarEmblemFix })
