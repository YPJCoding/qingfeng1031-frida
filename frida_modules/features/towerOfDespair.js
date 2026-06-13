// ============================================================================
// DNF Frida modern modular package - towerOfDespair.js
// 绝望之塔门票/金币/UserAPC 修复。
// ============================================================================

// ============================================================================

//修复绝望之塔 skip_user_apc: 为true时, 跳过每10层的UserAPC
function installTowerOfDespairFix(skipUserApc) {
  //挑战成功后可以继续使用门票挑战
  Interceptor.attach(ptr(0x0864387e), {
    onEnter: function (args) {},
    onLeave: function (retval) {
      retval.replace(0)
    }
  })
  //每10层挑战玩家APC 服务器内角色不足10个无法进入
  if (skipUserApc) {
    //跳过10/20/.../90层
    //TOD_UserState::getTodayEnterLayer
    Interceptor.attach(ptr(0x0864383e), {
      onEnter: function (args) {
        //绝望之塔当前层数
        const todayEnterLayer = args[1].add(0x14).readShort()
        if (todayEnterLayer % 10 == 9 && todayEnterLayer > 0 && todayEnterLayer < 99) {
          //当前层数为10的倍数时  直接进入下一层
          args[1].add(0x14).writeShort(todayEnterLayer + 1)
        }
      },
      onLeave: function (retval) {}
    })
  }

  //修复金币异常
  //CParty::UseAncientDungeonItems
  const cPartyUseAncientDungeonItemsPtr = ptr(0x859eac2)
  const cPartyUseAncientDungeonItems = new NativeFunction(
    cPartyUseAncientDungeonItemsPtr,
    'int',
    ['pointer', 'pointer', 'pointer', 'pointer'],
    {
      abi: 'sysv'
    }
  )
  Interceptor.replace(
    cPartyUseAncientDungeonItemsPtr,
    new NativeCallback(
      function (party, dungeon, invenItem2, a4) {
        //当前进入的地下城id
        const dungeonIndex = cDungeonGetIndex(dungeon)
        //根据地下城id判断是否为绝望之塔
        if (dungeonIndex >= 11008 && dungeonIndex <= 11107) {
          //绝望之塔 不再扣除金币
          return 1
        }
        //其他副本执行原始扣除道具逻辑
        return cPartyUseAncientDungeonItems(party, dungeon, invenItem2, a4)
      },
      'int',
      ['pointer', 'pointer', 'pointer', 'pointer']
    )
  )
}

// ============================================================================

if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

__dnfExport({ installTowerOfDespairFix })
