// ============================================================================
// DNF Frida modern modular package - userWorld.js
// GameWorld enter/leave hooks and feature fan-out.
// ============================================================================

// 16. 玩家进入 / 离开游戏世界 Hook 区
// ============================================================================

// 玩家进入 / 离开游戏世界时的统一处理。
// 进入世界：可下发排行榜、同步怪物攻城状态、发送登录问候。
// 离开世界：可刷新排行榜数据。
/** hookUserInOutGameWorld。
 * @returns {unknown} 返回值。*/
function hookUserInOutGameWorld() {
  Interceptor.attach(pluginAddress.gameWorldReach, {
    onEnter: function (args) {
      this.user = args[1]
    },
    onLeave: function (retval) {
      const user = this.user
      pluginSafeCall('onReachGameWorld', function () {
        if (pluginFeatureSwitch.ranking) {
          apiScheduleOnMainThread(sendRankingList, [user, true])
        }
        if (pluginFeatureSwitch.villageAttack && villageAttackEventInfo.state != villageAttackStateEnd) {
          notifyVillageAttackScore(user)
          eventVillageAttackBroadcastDiffcult()
        }
        if (pluginFeatureSwitch.loginGreeting) {
          apiCUserSendNotiPacketMessage(user, 'Hello : ' + apiCUserCharacInfoGetCurCharacName(user), 2)
        }
      })
    }
  })
  Interceptor.attach(pluginAddress.gameWorldLeave, {
    onEnter: function (args) {
      const user = args[1]
      pluginSafeCall('onLeaveGameWorld', function () {
        if (pluginFeatureSwitch.ranking) {
          updateRankingByUser(user)
        }
      })
    },
    onLeave: function (retval) {}
  })
}

// 旧函数名兼容。
/** hookUserInoutGameWorld。
 * @returns {unknown} 返回值。*/
function hookUserInoutGameWorld() {
  return hookUserInOutGameWorld()
}

//怪物攻城副本回调奖励处理函数
/** VillageAttackedRewardSendReward。
 * @param {unknown} user 参数。
 * @returns {unknown} 返回值。*/
function VillageAttackedRewardSendReward(user) {
  const VAttackCount = GetCurVAttackCount(user)
  switch (VAttackCount) {
    case 1:
      CMailBoxHelperReqDBSendNewSystemMail(user, 3037, 5)
      break
    case 2:
      CMailBoxHelperReqDBSendNewSystemMail(user, 3037, 5)
      break
    case 3:
      CMailBoxHelperReqDBSendNewSystemMail(user, 3037, 5)
      break
    case 4:
      CMailBoxHelperReqDBSendNewSystemMail(user, 1085, 2)
      break
    case 5:
      CMailBoxHelperReqDBSendNewSystemMail(user, 1085, 5)
      break
    case 6:
      CMailBoxHelperReqDBSendNewSystemMail(user, 1085, 2)
      break
    case 7:
      CMailBoxHelperReqDBSendNewSystemMail(user, 8, 2)
      break
    case 8:
      CMailBoxHelperReqDBSendNewSystemMail(user, 8, 5)
      break
    case 9:
      CMailBoxHelperReqDBSendNewSystemMail(user, 8, 2)
      break
    case 10:
      CMailBoxHelperReqDBSendNewSystemMail(user, 36, 1)
      break
    case 11:
      CMailBoxHelperReqDBSendNewSystemMail(user, 36, 1)
      break
    case 12:
      CMailBoxHelperReqDBSendNewSystemMail(user, 15, 1)
      break
    case 13:
      CMailBoxHelperReqDBSendNewSystemMail(user, 15, 1)
      break
    case 14:
      CMailBoxHelperReqDBSendNewSystemMail(user, 3037, 10)
      break
    case 15:
      CMailBoxHelperReqDBSendNewSystemMail(user, 3262, 2)
      break
    case 16:
      CMailBoxHelperReqDBSendNewSystemMail(user, 3262, 3)
      break
    case 17:
      CMailBoxHelperReqDBSendNewSystemMail(user, 2600261, 1)
      break
    case 18:
      CMailBoxHelperReqDBSendNewSystemMail(user, 2600261, 1)
      break
    case 19:
      CMailBoxHelperReqDBSendNewSystemMail(user, 3037, 5)
      break
    case 20:
      CMailBoxHelperReqDBSendNewSystemMail(user, 1031, 2)
      break
    case 21:
      CMailBoxHelperReqDBSendNewSystemMail(user, 8, 2)
      break
    case 22:
      CMailBoxHelperReqDBSendNewSystemMail(user, 1085, 2)
      break
    case 23:
      CMailBoxHelperReqDBSendNewSystemMail(user, 8, 5)
      break
    case 24:
      CMailBoxHelperReqDBSendNewSystemMail(user, 15, 1)
      break
    case 25:
      CMailBoxHelperReqDBSendNewSystemMail(user, 15, 2)
      break
    case 26:
      CMailBoxHelperReqDBSendNewSystemMail(user, 3262, 5)
      break
    case 27:
      CMailBoxHelperReqDBSendNewSystemMail(user, 3262, 2)
      break
    case 28:
      CMailBoxHelperReqDBSendNewSystemMail(user, 8, 5)
      break
    case 29:
      CMailBoxHelperReqDBSendNewSystemMail(user, 1085, 2)
      break
    case 30:
      CMailBoxHelperReqDBSendNewSystemMail(user, 10000160, 1)
      break
    case 31:
      CMailBoxHelperReqDBSendNewSystemMail(user, 3037, 5)
      break
    case 32:
      CMailBoxHelperReqDBSendNewSystemMail(user, 3037, 5)
      break
    case 33:
      CMailBoxHelperReqDBSendNewSystemMail(user, 8, 2)
      break
    case 34:
      CMailBoxHelperReqDBSendNewSystemMail(user, 1085, 2)
      break
    case 35:
      CMailBoxHelperReqDBSendNewSystemMail(user, 2600261, 1)
      break
    case 36:
      CMailBoxHelperReqDBSendNewSystemMail(user, 10000161, 1)
      break
    default:
      CMailBoxHelperReqDBSendNewSystemMail(user, 3037, 5)
  }
}

// ============================================================================

// ============================================================================
// 模块公共 API 注册区
// ============================================================================
if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

/**
 * Registers public symbols exported by userWorld.js.
 * Symbols are also attached to globalThis to preserve old script-style references
 * between modules loaded through Frida Script.load().
 * @returns {void}
 */
function registerCurrentModuleSymbols() {
  globalThis.hookUserInOutGameWorld = hookUserInOutGameWorld
  globalThis.dnfPlugin.hookUserInOutGameWorld = hookUserInOutGameWorld
  globalThis.hookUserInoutGameWorld = hookUserInoutGameWorld
  globalThis.dnfPlugin.hookUserInoutGameWorld = hookUserInoutGameWorld
  globalThis.VillageAttackedRewardSendReward = VillageAttackedRewardSendReward
  globalThis.dnfPlugin.VillageAttackedRewardSendReward = VillageAttackedRewardSendReward
}

registerCurrentModuleSymbols()
