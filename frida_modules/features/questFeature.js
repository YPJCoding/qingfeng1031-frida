// ============================================================================
// DNF Frida modern modular package - questFeature.js
// 通过 GM 模式强制完成任务并领取奖励。
// ============================================================================

// ============================================================================

//无条件完成指定任务并领取奖励
function apiForceClearQuest(user, questId) {
  //设置GM完成任务模式(无条件完成任务)
  cUserSetGmQuestFlag(user, 1)
  //接受任务
  cUserQuestAction(user, 33, questId, 0, 0)
  //完成任务
  cUserQuestAction(user, 35, questId, 0, 0)
  //领取任务奖励(倒数第二个参数表示领取奖励的编号, -1=领取不需要选择的奖励; 0=领取可选奖励中的第1个奖励; 1=领取可选奖励中的第二个奖励)
  cUserQuestAction(user, 36, questId, 0, 1)
  cUserQuestAction(user, 36, questId, -1, 1)
  //服务端有反作弊机制: 任务完成时间间隔不能小于1秒.  这里将上次任务完成时间清零 可以连续提交任务
  user.add(0x79644).writeInt(0)
  //关闭GM完成任务模式(不需要材料直接完成)
  cUserSetGmQuestFlag(user, 0)
  return
}

//完成指定任务并领取奖励
function clearDoingQuestEx(user, questId) {
  //完成指定任务并领取奖励1
  //玩家任务信息
  const userQuest = cUserGetCurCharacQuestW(user)
  //玩家已完成任务信息
  const wongWorkCQuestClear = userQuest.add(4)
  //pvf数据
  const dataManager = gCDataManager()
  //跳过已完成的任务
  if (!wongWorkCQuestClearIsClearedQuest(wongWorkCQuestClear, questId)) {
    //获取pvf任务数据
    const quest = cDataManagerFindQuest(dataManager, questId)
    if (!quest.isNull()) {
      //无条件完成指定任务并领取奖励
      apiForceClearQuest(user, questId)
      //通知客户端更新已完成任务列表
      cUserSendClearQuestList(user)
      //通知客户端更新任务列表
      const packetGuard = apiPacketGuardPacketGuard()
      userQuestGetQuestInfo(userQuest, packetGuard)
      cUserSend(user, packetGuard)
      destroyPacketGuardPacketGuard(packetGuard)
    }
  } else {
    //公告通知客户端本次自动完成任务数据
    apiCUserSendNotiPacketMessage(user, '当前任务已完成: ', 14)
  }
}

// ============================================================================

if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

__dnfExport({ apiForceClearQuest, clearDoingQuestEx })
