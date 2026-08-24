import { useState } from 'react'
import Taro, { useLoad, useShareAppMessage } from '@tarojs/taro'
import { Button, Progress, Text, View } from '@tarojs/components'
import { dateAt, travelModes, type Plan, type Spot } from '@shared/domain'
import {
  getActiveRoute,
  loadCompletedSpotIds,
  loadSavedRoutes,
  saveRoute,
  setActiveRoute,
  toggleCompletedSpot
} from '../../services/route-storage'
import { miniPlanPath, resolvePlanFromParams } from '../../utils/route-link'
import { routeProgress } from '../../utils/route-state'
import './index.scss'

type RouteParams = Record<string, string | string[] | undefined>

const dayLabel = (startDate: string, offset: number) => {
  const date = dateAt(startDate, offset)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const openSpotLocation = (spot: Spot) => {
  Taro.openLocation({
    latitude: spot.lat,
    longitude: spot.lng,
    name: spot.name,
    address: `${spot.region} · ${spot.county}`,
    scale: 16
  }).catch(() => Taro.showToast({ title: '未能打开地图，请稍后重试', icon: 'none' }))
}

export default function RouteDetailPage () {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [isSaved, setIsSaved] = useState(false)

  useLoad<RouteParams>((params) => {
    const nextPlan = resolvePlanFromParams(params) ?? getActiveRoute()
    if (!nextPlan) return
    setPlan(nextPlan)
    setActiveRoute(nextPlan)
    setCompletedIds(loadCompletedSpotIds(nextPlan))
    setIsSaved(loadSavedRoutes().some((item) => item.plan.id === nextPlan.id))
    Taro.setNavigationBarTitle({ title: nextPlan.name })
  })

  useShareAppMessage(() => ({
    title: plan ? `${plan.name}｜数智-红途` : '数智-红途｜江西红色路线',
    path: plan ? miniPlanPath(plan) : '/pages/index/index'
  }))

  const saveCurrentRoute = () => {
    if (!plan) return
    saveRoute(plan)
    setIsSaved(true)
    Taro.showToast({ title: '已保存到我的路线', icon: 'success' })
  }

  const toggleSpot = (spotId: string) => {
    if (!plan) return
    setCompletedIds(toggleCompletedSpot(plan, spotId))
  }

  if (!plan) {
    return (
      <View className='page-shell route-detail-page route-missing'>
        <Text>路线没有找到</Text>
        <Text>分享链接可能已失效，也可以回到规划页重新生成。</Text>
        <Button className='tap-button missing-action' onClick={() => Taro.switchTab({ url: '/pages/planner/index' })}>返回智能规划</Button>
      </View>
    )
  }

  const progress = routeProgress(plan, completedIds)
  const travelLabel = travelModes.find((mode) => mode.value === plan.criteria.travelMode)?.label ?? '自驾'

  return (
    <View className='page-shell route-detail-page'>
      <View className='route-detail-hero'>
        <View className='route-detail-meta'><Text>YOUR RED JOURNEY</Text><Text>{plan.score} / 100</Text></View>
        <Text className='route-detail-angle'>{plan.angle}</Text>
        <Text className='route-detail-title'>{plan.name}</Text>
        <Text className='route-detail-reason'>{plan.reason}</Text>
        <View className='route-detail-facts'>
          <View><Text>{plan.days.length}</Text><Text>行程天数</Text></View>
          <View><Text>{plan.spots.length}</Text><Text>红色点位</Text></View>
          <View><Text>{travelLabel}</Text><Text>交通方式</Text></View>
        </View>
      </View>

      <View className='execution-card'>
        <View className='execution-title'>
          <View><Text>路线执行进度</Text><Text>到达后勾选点位，进度仅保存在本机</Text></View>
          <Text>{progress.percent}%</Text>
        </View>
        <Progress percent={progress.percent} strokeWidth={6} activeColor='#b77f3f' backgroundColor='#eadcca' borderRadius={0} />
        <Text className='execution-count'>已完成 {progress.completed} / {progress.total} 站</Text>
      </View>

      <View className='route-days-detail'>
        {plan.days.map((day, dayIndex) => (
          <View className='route-day-card' key={`${plan.id}-${dayIndex}`}>
            <View className='route-day-head'>
              <View><Text>DAY</Text><Text>0{dayIndex + 1}</Text></View>
              <View><Text>{dayLabel(plan.criteria.startDate, dayIndex)}</Text><Text>{day.length} 处点位</Text></View>
            </View>

            <View className='route-day-stops'>
              {day.map((spot, stopIndex) => {
                const completed = completedIds.includes(spot.id)
                return (
                  <View className={`execution-stop ${completed ? 'execution-stop-complete' : ''}`} key={spot.id}>
                    <Button className='tap-button completion-button' onClick={() => toggleSpot(spot.id)}>{completed ? '✓' : stopIndex + 1}</Button>
                    <View className='execution-stop-copy'>
                      <Text>{spot.name}</Text>
                      <Text>{spot.region} · {spot.county} · 建议 {spot.minutes} 分钟</Text>
                      <Text>{spot.intro}</Text>
                    </View>
                    <Button className='tap-button map-button' onClick={() => openSpotLocation(spot)}>地图</Button>
                  </View>
                )
              })}
            </View>
          </View>
        ))}
      </View>

      <View className='route-background'>
        <Text>路线导读</Text>
        <Text>{plan.background}</Text>
      </View>

      <View className='route-detail-actions'>
        <Button className={`tap-button route-save ${isSaved ? 'route-saved' : ''}`} onClick={saveCurrentRoute}>{isSaved ? '已保存' : '保存路线'}</Button>
        <Button className='tap-button route-share' openType='share'>分享给同行人</Button>
      </View>

      <Text className='route-disclaimer'>开放时间与通行时间为演示资料，出发前请以场馆公告和实时路况为准。</Text>
    </View>
  )
}
