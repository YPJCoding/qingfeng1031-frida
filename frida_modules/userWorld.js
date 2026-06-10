// ============================================================================
// DNF Frida modern modular package - userWorld.js
// GameWorld enter/leave hooks and feature fan-out.
// ============================================================================

// 16. 玩家进入 / 离开游戏世界 Hook 区
// ============================================================================

// 玩家进入 / 离开游戏世界时的统一处理。
// 进入世界：可下发排行榜、同步怪物攻城状态、发送登录问候。
// 离开世界：可刷新排行榜数据。
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
function hookUserInoutGameWorld() {
  return hookUserInOutGameWorld()
}

//怪物攻城副本回调奖励处理函数
function VillageAttackedRewardSendReward(user) {
  const rewardMap = {
    1: [3037, 5],  2: [3037, 5],  3: [3037, 5],  4: [1085, 2],  5: [1085, 5],
    6: [1085, 2],  7: [8, 2],     8: [8, 5],     9: [8, 2],     10: [36, 1],
    11: [36, 1],   12: [15, 1],   13: [15, 1],   14: [3037, 10], 15: [3262, 2],
    16: [3262, 3], 17: [2600261, 1], 18: [2600261, 1], 19: [3037, 5], 20: [1031, 2],
    21: [8, 2],    22: [1085, 2], 23: [8, 5],    24: [15, 1],   25: [15, 2],
    26: [3262, 5], 27: [3262, 2], 28: [8, 5],    29: [1085, 2], 30: [10000160, 1],
    31: [3037, 5], 32: [3037, 5], 33: [8, 2],    34: [1085, 2], 35: [2600261, 1],
    36: [10000161, 1]
  }
  const [itemId, count] = rewardMap[GetCurVAttackCount(user)] || [3037, 5]
  CMailBoxHelperReqDBSendNewSystemMail(user, itemId, count)
}

// ============================================================================

if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

__dnfExport({ hookUserInOutGameWorld, hookUserInoutGameWorld, VillageAttackedRewardSendReward })
