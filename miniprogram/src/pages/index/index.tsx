import { View, Text } from '@tarojs/components'
import { generatePlans, plannerDefaults, spots } from '@shared/domain'
import './index.scss'

export default function Index () {
  const criteria = plannerDefaults()
  const plans = generatePlans(
    criteria.county,
    criteria.startDate,
    criteria.days,
    criteria.theme1,
    criteria.theme2,
    criteria.experience,
    criteria.purpose,
    criteria.travelMode
  )

  return (
    <View className='index'>
      <View><Text>数智-红途</Text></View>
      <View><Text>共享业务层已接入</Text></View>
      <View><Text>{spots.length} 个点位 · {plans.length} 条示例路线</Text></View>
    </View>
  )
}
