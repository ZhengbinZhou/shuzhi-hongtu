import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Progress, Text, View } from '@tarojs/components'
import {
  loadCompletedSpotIds,
  loadSavedRoutes,
  removeRoute,
  setActiveRoute
} from '../../services/route-storage'
import { miniPlanPath } from '../../utils/route-link'
import { routeProgress, type SavedRoute } from '../../utils/route-state'
import './index.scss'

const savedDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '最近保存'
    : `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

export default function SavedRoutesPage () {
  const [routes, setRoutes] = useState<SavedRoute[]>([])

  useDidShow(() => {
    setRoutes(loadSavedRoutes())
  })

  const openRoute = (item: SavedRoute) => {
    setActiveRoute(item.plan)
    Taro.navigateTo({ url: miniPlanPath(item.plan) })
  }

  const confirmRemove = async (savedId: string) => {
    const result = await Taro.showModal({
      title: '删除这条路线？',
      content: '路线执行进度仍会保留，重新保存后可以继续。',
      confirmColor: '#851f25'
    })
    if (result.confirm) setRoutes(removeRoute(savedId))
  }

  return (
    <View className='page-shell saved-page'>
      <View className='saved-hero'>
        <Text className='saved-eyebrow'>MY JOURNEYS / 我的路线</Text>
        <Text className='saved-title'>把准备好的行程，{`\n`}带到路上</Text>
        <Text className='saved-intro'>路线保存在当前微信设备中；进入详情后可以逐站打卡、打开地图并分享给同行人。</Text>
      </View>

      {routes.length === 0 && (
        <View className='saved-empty'>
          <Text>00</Text>
          <Text>还没有保存路线</Text>
          <Text>先生成一条路线，挑选最合适的方案保存下来。</Text>
          <Button className='tap-button saved-empty-action' onClick={() => Taro.switchTab({ url: '/pages/planner/index' })}>去生成路线 →</Button>
        </View>
      )}

      {routes.length > 0 && (
        <View className='saved-content'>
          <View className='saved-summary'><Text>已保存路线</Text><Text>{routes.length} 条</Text></View>
          {routes.map((item, index) => {
            const progress = routeProgress(item.plan, loadCompletedSpotIds(item.plan))
            return (
              <View className='saved-card' key={item.id}>
                <View className='saved-card-head'>
                  <Text>0{index + 1}</Text>
                  <Text>{savedDate(item.savedAt)} 保存</Text>
                </View>
                <Text className='saved-angle'>{item.plan.angle}</Text>
                <Text className='saved-name'>{item.plan.name}</Text>
                <View className='saved-facts'>
                  <Text>{item.plan.days.length} 天</Text>
                  <Text>{item.plan.spots.length} 个点位</Text>
                  <Text>{item.plan.score} 分匹配</Text>
                </View>
                <View className='saved-stops'>
                  {item.plan.spots.slice(0, 4).map((spot, spotIndex) => (
                    <View key={spot.id}><Text>{spotIndex + 1}</Text><Text>{spot.short}</Text></View>
                  ))}
                </View>
                <View className='saved-progress'>
                  <View><Text>执行进度</Text><Text>{progress.completed}/{progress.total}</Text></View>
                  <Progress percent={progress.percent} strokeWidth={4} activeColor='#b77f3f' backgroundColor='#eadcca' borderRadius={0} />
                </View>
                <View className='saved-actions'>
                  <Button className='tap-button saved-open' onClick={() => openRoute(item)}>查看并执行 <Text>→</Text></Button>
                  <Button className='tap-button saved-remove' onClick={() => confirmRemove(item.id)}>删除</Button>
                </View>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}
