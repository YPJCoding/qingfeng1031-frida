// ============================================================================
// DNF Frida modern modular package - villageAttack.js
// Village attack event logic, status packets, hooks, rewards, and persistence.
// ============================================================================

// 11. 怪物攻城业务区
// ============================================================================

//怪物攻城活动数据存档
/** eventVillageAttackSaveToDb。
 * @returns {unknown} 返回值。*/
function eventVillageAttackSaveToDb() {
  apiMySQLExec(
    mySQLFrida,
      `replace into game_event (event_id, event_info) values ('villageattack', '${JSON.stringify(villageAttackEventInfo)}');`
  )
}

//从数据库载入怪物攻城活动数据
/** eventVillageAttackLoadFromDb。
 * @returns {unknown} 返回值。*/
function eventVillageAttackLoadFromDb() {
  if (apiMySQLExec(mySQLFrida, "select event_info from game_event where event_id = 'villageattack';")) {
    if (mySQLGetNRows(mySQLFrida) == 1) {
      mySQLFetch(mySQLFrida)
      const info = apiMySQLGetStr(mySQLFrida, 0)
      villageAttackEventInfo = JSON.parse(info)
    }
  }
}

//处理到期的自定义定时器
/** doTimerDispatch。
 * @returns {unknown} 返回值。*/
function doTimerDispatch() {
  //当前待处理的定时器任务列表
  const taskList = []
  //线程安全
  const guard = apiGuardMutexGuard()
  //依次取出队列中的任务
  while (timerDispatcherList.length > 0) {
    //先入先出
    const task = timerDispatcherList.shift()
    taskList.push(task)
  }
  destroyGuardMutexGuard(guard)
  //执行任务
  for (const [f, args] of taskList) {
    f.apply(null, args)
  }
}

//申请锁(申请后务必手动释放!!!)
/** apiGuardMutexGuard。
 * @returns {unknown} 返回值。*/
function apiGuardMutexGuard() {
  const a1 = Memory.alloc(100)
  guardMutexGuard(a1, gTimerQueue().add(16))
  return a1
}

//挂接消息分发线程 确保代码线程安全
/** hookTimerDispatcherDispatch。
 * @returns {unknown} 返回值。*/
function hookTimerDispatcherDispatch() {
  //hook TimerDispatcher::dispatch
  //服务器内置定时器 每秒至少执行一次
  Interceptor.attach(ptr(0x8632a18), {
    onEnter: function (args) {},
    onLeave: function (retval) {
      //清空等待执行的任务队列
      doTimerDispatch()
    }
  })
}

//在dispatcher线程执行(args为函数f的参数组成的数组, 若f无参数args可为null)
/** apiScheduleOnMainThread。
 * @param {unknown} f 参数。
 * @param {unknown} args 参数。
 * @returns {unknown} 返回值。*/
function apiScheduleOnMainThread(f, args) {
  //线程安全
  const guard = apiGuardMutexGuard()
  timerDispatcherList.push([f, args])
  destroyGuardMutexGuard(guard)
  return
}

//设置定时器 到期后在dispatcher线程执行
/** apiScheduleOnMainThreadDelay。
 * @param {unknown} f 参数。
 * @param {unknown} args 参数。
 * @param {unknown} delay 参数。
 * @returns {unknown} 返回值。*/
function apiScheduleOnMainThreadDelay(f, args, delay) {
  setTimeout(apiScheduleOnMainThread, delay, f, args)
}

//重置活动数据
/** resetVillageAttackInfo。
 * @returns {unknown} 返回值。*/
function resetVillageAttackInfo() {
  villageAttackEventInfo.state = villageAttackStateP1
  villageAttackEventInfo.score = 0
  villageAttackEventInfo.difficult = 0
  villageAttackEventInfo.nextVillageMonsterId = tauCaptainMonsterId
  villageAttackEventInfo.lastKilledMonsterId = 0
  villageAttackEventInfo.p2KillCombo = 0
  villageAttackEventInfo.userPtInfo = {}
  setVillageAttackDungeonDifficult(villageAttackEventInfo.difficult)
  villageAttackEventInfo.startTime = apiCSystemTimeGetCurSec()
}

//怪物攻城活动计时器(每5秒触发一次)
/** eventVillageAttackTimer。
 * @returns {unknown} 返回值。*/
function eventVillageAttackTimer() {
  if (villageAttackEventInfo.state == villageAttackStateEnd) return
  //活动结束检测
  const remainTime = eventVillageAttackGetRemainTime()
  if (remainTime <= 0) {
    //活动结束
    onEndEventVillageAttack()
    return
  }
  //当前应扣除的PT
  let damage = 0
  //P2/P3阶段GBL主教扣PT
  if (villageAttackEventInfo.state == villageAttackStateP2 || villageAttackEventInfo.state == villageAttackStateP3) {
    for (let i = 0; i < villageAttackEventInfo.gblCnt; ++i) {
      if (getRandomInt(0, 100) < 4 + villageAttackEventInfo.difficult) {
        damage += 1
      }
    }
  }
  //P3阶段世界BOSS自身回血
  if (villageAttackEventInfo.state == villageAttackStateP3) {
    if (getRandomInt(0, 100) < 6 + villageAttackEventInfo.difficult) {
      damage += 1
    }
  }
  //扣除PT
  if (damage > 0) {
    villageAttackEventInfo.score -= damage
    if (villageAttackEventInfo.score < eventVillageAttackTargetScore[villageAttackEventInfo.state - 1]) {
      villageAttackEventInfo.score = eventVillageAttackTargetScore[villageAttackEventInfo.state - 1]
    }
    //更新PT
    gameworldUpdateVillageAttackScore()
  }
  //重复触发计时器
  if (villageAttackEventInfo.state != villageAttackStateEnd) {
    apiScheduleOnMainThreadDelay(eventVillageAttackTimer, null, 5000)
  }
}

//开启怪物攻城活动
/** startVillageAttack。
 * @returns {unknown} 返回值。*/
function startVillageAttack() {
  console.log('start_villageattack-------------')
  const a3 = Memory.alloc(100)
  a3.add(10).writeInt(eventVillageAttackTotalTime) //活动剩余时间
  a3.add(14).writeInt(villageAttackEventInfo.score) //当前频道PT点数
  a3.add(18).writeInt(eventVillageAttackTargetScore[2]) //成功防守所需点数
  interVillageAttackedStartDispatchSig(ptr(0), ptr(0), a3)
}

//开始怪物攻城活动
/** onStartEventVillageAttack。
 * @returns {unknown} 返回值。*/
function onStartEventVillageAttack() {
  //重置活动数据
  resetVillageAttackInfo()
  //通知全服玩家活动开始 并刷新城镇怪物
  startVillageAttack()
  //开启活动计时器
  apiScheduleOnMainThreadDelay(eventVillageAttackTimer, null, 5000)
  //公告通知当前活动进度
  eventVillageAttackBroadcastDiffcult()
}

//开启怪物攻城活动定时器
/** startEventVillageAttackTimer。
 * @returns {unknown} 返回值。*/
function startEventVillageAttackTimer() {
  //获取当前系统时间
  const curTime = apiCSystemTimeGetCurSec()
  //计算距离下次开启怪物攻城活动的时间
  let delayTime = 3600 * eventVillageAttackStartHour - (curTime % (3600 * 24))
  if (delayTime <= 0) delayTime += 3600 * 24
  //delay_time = 10
  console.log('-------------------- <countdown time>:' + delayTime)
  //log('距离下次开启<怪物攻城活动>还有:' + delay_time / 3600 + '小时')
  //log('距离下次开启<怪物攻城活动>还有:' + delay_time * 1000)
  //定时开启活动
  apiScheduleOnMainThreadDelay(onStartEventVillageAttack, null, delayTime * 1000)
}

//开启怪物攻城活动
/** startEventVillageAttack。
 * @returns {unknown} 返回值。*/
function startEventVillageAttack() {
  //patch相关函数, 修复活动流程
  hookVillageAttack()
  console.log('-------------------- start_event_villageattack-----------------')
  if (villageAttackEventInfo.state == villageAttackStateEnd) {
    //开启怪物攻城活动定时器
    startEventVillageAttackTimer()
  } else {
    //开启活动计时器
    apiScheduleOnMainThreadDelay(eventVillageAttackTimer, null, 5000)
  }
}

//设置怪物攻城副本难度(0-4: 普通-英雄)
/** setVillageAttackDungeonDifficult。
 * @param {unknown} difficult 参数。
 * @returns {unknown} 返回值。*/
function setVillageAttackDungeonDifficult(difficult) {
  Memory.protect(ptr(0x085b9605), 4, 'rwx') //修改内存保护属性为可写
  ptr(0x085b9605).writeInt(difficult)
}

//世界广播怪物攻城活动当前进度/难度
/** eventVillageAttackBroadcastDiffcult。
 * @returns {unknown} 返回值。*/
function eventVillageAttackBroadcastDiffcult() {
  if (villageAttackEventInfo.state != villageAttackStateEnd) {
    apiGameWorldSendNotiPacketMessage(
      `<怪物攻城活动> 当前阶段:${villageAttackEventInfo.state + 1}, 当前难度等级: ${villageAttackEventInfo.difficult}`,
      14
    )
  }
}

//计算活动剩余时间
/** eventVillageAttackGetRemainTime。
 * @returns {unknown} 返回值。*/
function eventVillageAttackGetRemainTime() {
  const curTime = apiCSystemTimeGetCurSec()
  const eventEndTime = villageAttackEventInfo.startTime + eventVillageAttackTotalTime
  const remainTime = eventEndTime - curTime
  return remainTime
}

//更新怪物攻城当前进度(广播给频道内在线玩家)
/** gameworldUpdateVillageAttackScore。
 * @returns {unknown} 返回值。*/
function gameworldUpdateVillageAttackScore() {
  //计算活动剩余时间
  const remainTime = eventVillageAttackGetRemainTime()
  if (remainTime <= 0 || villageAttackEventInfo.state == villageAttackStateEnd) return
  const packetGuard = apiPacketGuardPacketGuard()
  interfacePacketBufPutHeader(packetGuard, 0, 247) //协议: ENUM_NOTIPACKET_UPDATE_VILLAGE_ATTACKED
  interfacePacketBufPutInt(packetGuard, remainTime) //活动剩余时间
  interfacePacketBufPutInt(packetGuard, villageAttackEventInfo.score) //当前频道PT点数
  interfacePacketBufPutInt(packetGuard, eventVillageAttackTargetScore[2]) //成功防守所需点数
  interfacePacketBufFinalize(packetGuard, 1)
  gameWorldSendAll(gGameWorld(), packetGuard)
  destroyPacketGuardPacketGuard(packetGuard)
}

//通知玩家怪物攻城进度
/** notifyVillageAttackScore。
 * @param {unknown} user 参数。
 * @returns {unknown} 返回值。*/
function notifyVillageAttackScore(user) {
  //玩家当前PT点
  const characNo = cUserCharacInfoGetCurCharacNo(user).toString()
  let villageAttackPt = 0
  if (characNo in villageAttackEventInfo.userPtInfo) villageAttackPt = villageAttackEventInfo.userPtInfo[characNo][1]
  //计算活动剩余时间
  const remainTime = eventVillageAttackGetRemainTime()
  //log("remain_time=" + remain_time)
  if (remainTime <= 0 || villageAttackEventInfo.state == villageAttackStateEnd) return
  //发包通知角色打开怪物攻城UI并更新当前进度
  const packetGuard = apiPacketGuardPacketGuard()
  interfacePacketBufPutHeader(packetGuard, 0, 248) //协议: ENUM_NOTIPACKET_STARTED_VILLAGE_ATTACKED
  interfacePacketBufPutInt(packetGuard, remainTime) //活动剩余时间
  interfacePacketBufPutInt(packetGuard, villageAttackEventInfo.score) //当前频道PT点数
  interfacePacketBufPutInt(packetGuard, eventVillageAttackTargetScore[2]) //成功防守所需点数
  interfacePacketBufPutInt(packetGuard, villageAttackPt) //个人PT点数
  interfacePacketBufFinalize(packetGuard, 1)
  cUserSend(user, packetGuard)
  destroyPacketGuardPacketGuard(packetGuard)
}

//怪物攻城活动相关patch
/** hookVillageAttack。
 * @returns {unknown} 返回值。*/
function hookVillageAttack() {
  //怪物攻城副本回调
  Interceptor.attach(ptr(0x086b34a0), {
    onEnter: function (args) {
      //保存函数参数
      // const cVillageMonster = args[0]
      this.user = args[1]
    },
    onLeave: function (retval) {
      if (retval == 0 && this.user.isNull() == false) {
        VillageAttackedRewardSendReward(this.user)
      }
    }
  })
  //hook挑战攻城怪物副本结束事件, 更新怪物攻城活动各阶段状态
  //village_attacked::CVillageMonster::SendVillageMonsterFightResult
  Interceptor.attach(ptr(0x086b330a), {
    onEnter: function (args) {
      this.villageMonster = args[0] //当前挑战的攻城怪物
      this.user = args[1] //当前挑战的角色
      this.result = args[2].toInt32() //挑战结果: 1==成功
    },
    onLeave: function (retval) {
      //玩家杀死了攻城怪物
      if (this.result == 1) {
        if (villageAttackEventInfo.state == villageAttackStateEnd)
          //攻城活动已结束
          return
        //当前杀死的攻城怪物id
        const villageMonsterId = this.villageMonster.add(2).readUShort()
        //当前阶段杀死每只攻城怪物PT点数奖励: (1, 2, 4, 8, 16)
        const bonusPt = 2 ** villageAttackEventInfo.difficult
        //玩家所在队伍
        const party = cUserGetParty(this.user)
        if (party.isNull()) return
        //更新队伍中的所有玩家PT点数
        for (let i = 0; i < 4; ++i) {
          const user = cPartyGetUser(party, i)
          if (!user.isNull()) {
            //角色当前PT点数(游戏中的原始PT数据记录在village_attack_dungeon表中)
            const characNo = cUserCharacInfoGetCurCharacNo(user).toString()
            if (!(characNo in villageAttackEventInfo.userPtInfo))
              villageAttackEventInfo.userPtInfo[characNo] = [cUserGetAccId(user), 0] //记录角色accid, 方便离线充值
            //更新角色当前PT点数
            villageAttackEventInfo.userPtInfo[characNo][1] += bonusPt
            //击杀世界BOSS, 额外获得PT奖励
            if (villageMonsterId == tauMetaCowMonsterId && villageAttackEventInfo.state == villageAttackStateP3) {
              villageAttackEventInfo.userPtInfo[characNo][1] += 1000 * (1 + villageAttackEventInfo.difficult)
            }
          }
        }
        if (villageAttackEventInfo.state == villageAttackStateP1) { //怪物攻城一阶段
          //更新频道内总PT
          villageAttackEventInfo.score += bonusPt
          //P1阶段未完成
          if (villageAttackEventInfo.score < eventVillageAttackTargetScore[0]) {
            //若杀死了牛头统帅, 则攻城难度+1
            if (villageMonsterId == tauCaptainMonsterId) {
              if (villageAttackEventInfo.difficult < 4) {
                villageAttackEventInfo.difficult += 1
                //怪物攻城副本难度
                setVillageAttackDungeonDifficult(villageAttackEventInfo.difficult)
                //下次刷新出的攻城怪物为: 牛头统帅
                villageAttackEventInfo.nextVillageMonsterId = tauCaptainMonsterId
                //公告通知客户端活动进度
                eventVillageAttackBroadcastDiffcult()
              }
            }
          } else {
            //P1阶段已结束, 进入P2
            villageAttackEventInfo.state = villageAttackStateP2
            villageAttackEventInfo.score = eventVillageAttackTargetScore[0]
            villageAttackEventInfo.p2LastKilledMonsterTime = 0
            villageAttackEventInfo.lastKilledMonsterId = 0
            villageAttackEventInfo.p2KillCombo = 0
            //公告通知客户端活动进度
            eventVillageAttackBroadcastDiffcult()
          }
        } else if (villageAttackEventInfo.state == villageAttackStateP2) { //怪物攻城二阶段
          //计算连杀时间
          const curTime = apiCSystemTimeGetCurSec()
          const diffTime = curTime - villageAttackEventInfo.p2LastKilledMonsterTime
          //1分钟内连续击杀相同攻城怪物
          if (diffTime < 60 && villageMonsterId == villageAttackEventInfo.lastKilledMonsterId) {
            //连杀点数+1
            villageAttackEventInfo.p2KillCombo += 1
            if (villageAttackEventInfo.p2KillCombo >= 3) {
              //三连杀增加当前阶段总PT
              villageAttackEventInfo.score += 33
              //重新计算连杀
              villageAttackEventInfo.lastKilledMonsterId = 0
              villageAttackEventInfo.p2KillCombo = 0
            }
          } else {
            //重新计算连杀
            villageAttackEventInfo.lastKilledMonsterId = villageMonsterId
            villageAttackEventInfo.p2KillCombo = 1
          }
          //保存本次击杀时间
          villageAttackEventInfo.p2LastKilledMonsterTime = curTime
          //P2阶段已结束, 进入P3
          if (villageAttackEventInfo.score >= eventVillageAttackTargetScore[1]) {
            //P2阶段已结束, 进入P3
            villageAttackEventInfo.state = villageAttackStateP3
            villageAttackEventInfo.score = eventVillageAttackTargetScore[1]
            villageAttackEventInfo.nextVillageMonsterId = tauMetaCowMonsterId
            //公告通知客户端活动进度
            eventVillageAttackBroadcastDiffcult()
          }
        } else if (villageAttackEventInfo.state == villageAttackStateP3) { //怪物攻城三阶段
          //击杀世界boss
          if (villageMonsterId == tauMetaCowMonsterId) {
            //更新世界BOSS血量(PT)
            villageAttackEventInfo.score += 25
            //继续刷新世界BOSS
            villageAttackEventInfo.nextVillageMonsterId = tauMetaCowMonsterId
            //世界广播
            apiGameWorldSendNotiPacketMessage(
              `<怪物攻城活动> 世界BOSS已被【${apiCUserCharacInfoGetCurCharacName(this.user)}】击杀!`,
              14
            )
            //P3阶段已结束
            if (villageAttackEventInfo.score >= eventVillageAttackTargetScore[2]) {
              //怪物攻城活动防守成功, 立即结束活动
              villageAttackEventInfo.defendSuccess = 1
              apiScheduleOnMainThread(onEndEventVillageAttack, null)
              return
            }
          }
        }
        //世界广播当前活动进度
        gameworldUpdateVillageAttackScore()
        //通知队伍中的所有玩家更新PT点数
        for (let i = 0; i < 4; ++i) {
          const user = cPartyGetUser(party, i)
          if (!user.isNull()) {
            notifyVillageAttackScore(user)
          }
        }
        //更新存活GBL主教数量
        if (villageMonsterId == gblPopeMonsterId) {
          if (villageAttackEventInfo.gblCnt > 0) {
            villageAttackEventInfo.gblCnt -= 1
          }
        }
      }
    }
  })
  //hook 刷新攻城怪物函数, 控制下一只刷新的攻城怪物id
  //village_attacked::CVillageMonsterArea::GetAttackedMonster
  Interceptor.attach(ptr(0x086b3aea), {
    onEnter: function (args) {},
    onLeave: function (retval) {
      //返回值为下一次刷新的攻城怪物
      if (retval != 0) {
        //下一只刷新的攻城怪物
        const nextVillageMonster = ptr(retval)
        const nextVillageMonsterId = nextVillageMonster.readUShort()
        //当前刷新的怪物为机制怪物
        if (nextVillageMonsterId == tauMetaCowMonsterId || nextVillageMonsterId == tauCaptainMonsterId) {
          //替换为随机怪物
          nextVillageMonster.writeUShort(getRandomInt(1, 17))
        }
        //如果需要刷新指定怪物
        if (villageAttackEventInfo.nextVillageMonsterId) {
          if (
            villageAttackEventInfo.state == villageAttackStateP1 ||
            villageAttackEventInfo.state == villageAttackStateP2
          ) {
            //P1 P2阶段立即刷新怪物
            nextVillageMonster.writeUShort(villageAttackEventInfo.nextVillageMonsterId)
            villageAttackEventInfo.nextVillageMonsterId = 0
          } else if (villageAttackEventInfo.state == villageAttackStateP3) {
            //P3阶段 几率刷新出世界BOSS
            if (getRandomInt(0, 100) < 44) {
              nextVillageMonster.writeUShort(villageAttackEventInfo.nextVillageMonsterId)
              villageAttackEventInfo.nextVillageMonsterId = 0
              //世界广播
              apiGameWorldSendNotiPacketMessage('<怪物攻城活动> 世界BOSS已刷新, 请勇士们前往挑战!', 14)
            }
          }
        }
        //统计存活GBL主教数量
        if (nextVillageMonster.readUShort() == gblPopeMonsterId) {
          villageAttackEventInfo.gblCnt += 1
        }
      }
    }
  })
  //当前正在处理挑战的攻城怪物请求
  let stateOnFighting = false
  //当前正在被挑战的怪物id
  let onFightingVillageMonsterId = 0
  //hook 挑战攻城怪物函数 控制副本刷怪流程
  //CParty::OnFightVillageMonster
  Interceptor.attach(ptr(0x085b9596), {
    onEnter: function (args) {
      stateOnFighting = true
      onFightingVillageMonsterId = 0
    },
    onLeave: function (retval) {
      onFightingVillageMonsterId = 0
      stateOnFighting = false
    }
  })
  //village_attacked::CVillageMonster::OnFightVillageMonster
  Interceptor.attach(ptr(0x086b3240), {
    onEnter: function (args) {
      if (stateOnFighting) {
        const villageMonster = args[0]
        //记录当前正在挑战的攻城怪物id
        onFightingVillageMonsterId = villageMonster.add(2).readU16()
      }
    },
    onLeave: function (retval) {}
  })
  //hook 副本刷怪函数 控制副本内怪物的数量和属性
  //MapInfo::Add_Mob
  const readF = new NativeFunction(ptr(0x08151612), 'int', ['pointer', 'pointer'], {
    abi: 'sysv'
  })
  Interceptor.replace(
    ptr(0x08151612),
    new NativeCallback(
      function (mapInfo, monster) {
        //当前刷怪的副本id
        // const mapId = mapInfo.add(4).readUInt()
        //怪物攻城副本
        //if((map_id >= 40001) && (map_id <= 40095))
        if (stateOnFighting) {
          //怪物攻城活动未结束
          if (villageAttackEventInfo.state != villageAttackStateEnd) {
            //正在挑战世界BOSS
            if (onFightingVillageMonsterId == tauMetaCowMonsterId) {
              //P3阶段
              if (villageAttackEventInfo.state == villageAttackStateP3) {
                //副本中有几率刷新出世界BOSS, 当前PT点数越高, 活动难度越大, 刷新出世界BOSS概率越大
                if (
                  getRandomInt(0, 100) <
                  villageAttackEventInfo.score - eventVillageAttackTargetScore[1] + 6 * villageAttackEventInfo.difficult
                ) {
                  monster.add(0xc).writeUInt(tauMetaCowMonsterId)
                }
              }
            }
            if (villageAttackEventInfo.difficult == 0) {
              //难度0: 无变化
              return readF(mapInfo, monster)
            } else if (villageAttackEventInfo.difficult == 1) {
              //难度1: 怪物等级提升至100级
              monster.add(16).writeU8(100)
              return readF(mapInfo, monster)
            } else if (villageAttackEventInfo.difficult == 2) {
              //难度2: 怪物等级提升至110级; 随机刷新紫名怪
              monster.add(16).writeU8(110)
              //非BOSS怪
              if (monster.add(8).readU8() != 3) {
                if (getRandomInt(0, 100) < 50) {
                  monster.add(8).writeU8(1) //怪物类型: 0-3
                }
              }
              return readF(mapInfo, monster)
            } else if (villageAttackEventInfo.difficult == 3) {
              //难度3: 怪物等级提升至120级; 随机刷新不灭粉名怪; 怪物数量*2
              monster.add(16).writeU8(120)
              //非BOSS怪
              if (monster.add(8).readU8() != 3) {
                if (getRandomInt(0, 100) < 75) {
                  monster.add(8).writeU8(2) //怪物类型: 0-3
                }
              }
              //执行原始刷怪流程
              readF(mapInfo, monster)
              //刷新额外的怪物(同一张地图内, 怪物index和怪物uid必须唯一, 这里为怪物分配新的index和uid)
              //额外刷新怪物数量
              let cnt = 1
              //新的怪物uid偏移
              const uidOffset = 1000
              //返回值
              let ret = 0
              while (cnt > 0) {
                --cnt
                //新增怪物index
                monster.writeUInt(monster.readUInt() + uidOffset)
                //新增怪物uid
                monster.add(4).writeUInt(monster.add(4).readUInt() + uidOffset)
                //为当前地图刷新额外的怪物
                ret = readF(mapInfo, monster)
              }
              return ret
            } else if (villageAttackEventInfo.difficult == 4) {
              //难度4: 怪物等级提升至127级; 随机刷新橙名怪; 怪物数量*4
              monster.add(16).writeU8(127)
              //非BOSS怪
              if (monster.add(8).readU8() != 3) {
                //英雄级副本精英怪类型等于2的怪为橙名怪
                monster.add(8).writeU8(getRandomInt(1, 3)) //怪物类型: 0-3
              }
              //执行原始刷怪流程
              readF(mapInfo, monster)
              //刷新额外的怪物(同一张地图内, 怪物index和怪物uid必须唯一, 这里为怪物分配新的index和uid)
              //额外刷新怪物数量
              let cnt = 3
              //新的怪物uid偏移
              const uidOffset = 1000
              //返回值
              let ret = 0
              while (cnt > 0) {
                --cnt
                //新增怪物index
                monster.writeUInt(monster.readUInt() + uidOffset)
                //新增怪物uid
                monster.add(4).writeUInt(monster.add(4).readUInt() + uidOffset)
                //为当前地图刷新额外的怪物
                ret = readF(mapInfo, monster)
              }
              return ret
            }
          }
        }
        //执行原始刷怪流程
        return readF(mapInfo, monster)
      },
      'int',
      ['pointer', 'pointer']
    )
  )
  //每次通关额外获取当前等级升级所需经验的0%-0.1%
  //village_attacked::CVillageMonsterMgr::OnKillVillageMonster
  Interceptor.attach(ptr(0x086b4866), {
    onEnter: function (args) {
      this.user = args[1]
      this.result = args[2].toInt32()
    },
    onLeave: function (retval) {
      if (retval == 0) {
        //挑战成功
        if (this.result) {
          //玩家所在队伍
          const party = cUserGetParty(this.user)
          //怪物攻城挑战成功, 给队伍中所有成员发送额外通关发经验
          for (let i = 0; i < 4; ++i) {
            const user = cPartyGetUser(party, i)
            if (!user.isNull()) {
              //随机经验奖励
              const curLevel = cUserCharacInfoGetCharacLevel(user)
              const rewardExp = Math.floor(
                (cUserCharacInfoGetLevelUpExp(user, curLevel) * getRandomInt(0, 1000)) / 1000000
              )
              //发经验
              apiCUserGainExpSp(user, rewardExp)
              //通知玩家获取额外奖励
              apiCUserSendNotiPacketMessage(user, '怪物攻城挑战成功, 获取额外经验奖励' + rewardExp, 0)
            }
          }
        }
      }
    }
  })
}

//结束怪物攻城活动(立即销毁攻城怪物, 不开启逆袭之谷, 不发送活动奖励)
/** endVillageAttack。
 * @returns {unknown} 返回值。*/
function endVillageAttack() {
  villageAttackedCVillageMonsterMgrOnDestroyVillageMonster(globalDataSVillageMonsterMgr.readPointer(), 2)
}

//结束怪物攻城活动
/** onEndEventVillageAttack。
 * @returns {unknown} 返回值。*/
function onEndEventVillageAttack() {
  if (villageAttackEventInfo.state == villageAttackStateEnd) return
  //设置活动状态
  villageAttackEventInfo.state = villageAttackStateEnd
  //立即结束怪物攻城活动
  endVillageAttack()
  //防守成功
  if (villageAttackEventInfo.defendSuccess) {
    //频道内在线玩家发奖
    //发信奖励: 金币+道具
    const rewardGold = 1000000 * (1 + villageAttackEventInfo.difficult) //金币
    const rewardItemList = [
      [7745, 5 * (1 + villageAttackEventInfo.difficult)],
      //士气冲天
      [2600028, 5 * (1 + villageAttackEventInfo.difficult)],
      //天堂痊愈
      [42, 5 * (1 + villageAttackEventInfo.difficult)],
      //复活币
      [3314, 1 + villageAttackEventInfo.difficult] //绝望之塔通关奖章
    ]
    apiGameworldSendMail('<怪物攻城活动>', '恭喜勇士!', rewardGold, rewardItemList)
    //特殊奖励
    apiGameworldForeach(function (user, args) {
      //设置绝望之塔当前层数为100层
      apiTodUserStateSetEnterLayer(user, 99)
      //随机选择一件穿戴中的装备
      const inven = cUserCharacInfoGetCurCharacInvenW(user)
      const slot = getRandomInt(10, 21) //12件装备slot范围10-21
      const equ = cInventoryGetInvenRef(inven, inventoryTypeBody, slot)
      if (invenItemGetKey(equ)) {
        //读取装备强化等级
        let upgradeLevel = equ.add(6).readU8()
        if (upgradeLevel < 31) {
          //提升装备的强化/增幅等级
          const bonusLevel = getRandomInt(1, 1 + villageAttackEventInfo.difficult)
          upgradeLevel += bonusLevel
          if (upgradeLevel >= 31) upgradeLevel = 31
          //提升强化/增幅等级
          equ.add(6).writeU8(upgradeLevel)
          //通知客户端更新装备
          cUserSendUpdateItemList(user, 1, 3, slot)
        }
      }
    }, null)
    //榜一大哥
    let rankFirstCharacNo = 0
    let rankFirstAccountId = 0
    let maxPt = 0
    //论功行赏
    for (const characNo in villageAttackEventInfo.userPtInfo) {
      //发点券
      const accountId = villageAttackEventInfo.userPtInfo[characNo][0]
      const pt = villageAttackEventInfo.userPtInfo[characNo][1]
      const rewardCera = pt * 10 //点券奖励 = 个人PT * 10
      const userPr = gameWorldFindUserFromWorldByaccid(gGameWorld(), accountId)
      apiRechargeCashCera(userPr, rewardCera)
      //找出榜一大哥
      if (pt > maxPt) {
        rankFirstCharacNo = characNo
        rankFirstAccountId = accountId
        maxPt = pt
      }
    }
    //频道内公告活动已结束
    apiGameWorldSendNotiPacketMessage('<怪物攻城活动> 防守成功, 奖励已发送!', 14)
    if (rankFirstCharacNo) {
      //个人积分排行榜第一名 额外获得10倍点券奖励
      const userPr = gameWorldFindUserFromWorldByaccid(gGameWorld(), rankFirstAccountId)
      apiRechargeCashCera(userPr, maxPt * 10)
      //频道内广播本轮活动排行榜第一名玩家名字
      const rankFirstCharacName = apiGetCharacNameByCharacNo(rankFirstCharacNo)
      apiGameWorldSendNotiPacketMessage(
        `<怪物攻城活动> 恭喜勇士 【${rankFirstCharacName}】 成为个人积分排行榜第一名(${maxPt}pt)!`,
        14
      )
    }
  } else {
    //防守失败
    apiGameworldForeach(function (user, args) {
      //获取角色背包
      const inven = cUserCharacInfoGetCurCharacInvenW(user)
      //在线玩家被攻城怪物随机掠夺一件穿戴中的装备
      if (getRandomInt(0, 100) < 7) {
        //随机删除一件穿戴中的装备
        const slot = getRandomInt(10, 21) //12件装备slot范围10-21
        const equ = cInventoryGetInvenRef(inven, inventoryTypeBody, slot)
        if (invenItemGetKey(equ)) {
          invenItemReset(equ)
          //通知客户端更新装备
          cUserSendNotiPacket(user, 1, 2, 3)
        }
      }
      //在线玩家被攻城怪物随机掠夺1%-10%所持金币
      const rate = getRandomInt(1, 11)
      const curGold = cInventoryGetMoney(inven)
      const tax = Math.floor((rate / 100) * curGold)
      cInventoryUseMoney(inven, tax, 0, 0)
      //通知客户端更新金币数量
      cUserSendUpdateItemList(user, 1, 0, 0)
    }, null)
    //频道内公告活动已结束
    apiGameWorldSendNotiPacketMessage('<怪物攻城活动> 防守失败, 请勇士们再接再厉!', 14)
  }
  //释放空间
  villageAttackEventInfo.userPtInfo = {}
  //存档
  eventVillageAttackSaveToDb()
  //开启怪物攻城活动定时器
  startEventVillageAttackTimer()
}

// ============================================================================

if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

__dnfExport({
  eventVillageAttackSaveToDb, eventVillageAttackLoadFromDb, doTimerDispatch,
  apiGuardMutexGuard, hookTimerDispatcherDispatch, apiScheduleOnMainThread,
  apiScheduleOnMainThreadDelay, resetVillageAttackInfo, eventVillageAttackTimer,
  startVillageAttack, onStartEventVillageAttack, startEventVillageAttackTimer,
  startEventVillageAttack, setVillageAttackDungeonDifficult,
  eventVillageAttackBroadcastDiffcult, eventVillageAttackGetRemainTime,
  gameworldUpdateVillageAttackScore, notifyVillageAttackScore,
  hookVillageAttack, endVillageAttack, onEndEventVillageAttack
})
