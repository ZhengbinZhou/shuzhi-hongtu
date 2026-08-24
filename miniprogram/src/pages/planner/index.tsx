import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Picker, Text, View } from '@tarojs/components'
import {
  counties,
  experiences,
  generatePlans,
  plannerDefaults,
  purposes,
  themeOptions,
  travelModes,
  type Plan,
  type PlannerCriteria
} from '@shared/domain'
import { loadSavedRoutes, saveRoute, setActiveRoute } from '../../services/route-storage'
import { miniPlanPath } from '../../utils/route-link'
import './index.scss'

type SelectorFieldProps = {
  label: string
  note: string
  value: string
  range: string[]
  onChange: (index: number) => void
}

const dayOptions = [1, 2, 3, 4, 5]

function SelectorField ({ label, note, value, range, onChange }: SelectorFieldProps) {
  return (
    <View className='planner-field'>
      <Text className='field-label'>{label}</Text>
      <Picker mode='selector' range={range} value={Math.max(0, range.indexOf(value))} onChange={(event) => onChange(Number(event.detail.value))}>
        <View className='field-value'><Text>{value}</Text><Text>⌄</Text></View>
      </Picker>
      <Text className='field-note'>{note}</Text>
    </View>
  )
}

export default function PlannerPage () {
  const [criteria, setCriteria] = useState<PlannerCriteria>(() => plannerDefaults())
  const [plans, setPlans] = useState<Plan[]>([])
  const [hasGenerated, setHasGenerated] = useState(false)
  const [savedPlanIds, setSavedPlanIds] = useState<string[]>([])

  useDidShow(() => {
    setSavedPlanIds(loadSavedRoutes().map((item) => item.plan.id))
  })

  function updateCriteria<K extends keyof PlannerCriteria> (key: K, value: PlannerCriteria[K]) {
    setCriteria((current) => ({ ...current, [key]: value }))
  }

  const createPlans = () => {
    setPlans(generatePlans(
      criteria.county,
      criteria.startDate,
      criteria.days,
      criteria.theme1,
      criteria.theme2,
      criteria.experience,
      criteria.purpose,
      criteria.travelMode
    ).slice(0, 3))
    setHasGenerated(true)
  }

  const savePlan = (plan: Plan) => {
    const saved = saveRoute(plan)
    setSavedPlanIds(saved.map((item) => item.plan.id))
    Taro.showToast({ title: '已保存到我的路线', icon: 'success' })
  }

  const openPlan = (plan: Plan) => {
    setActiveRoute(plan)
    Taro.navigateTo({ url: miniPlanPath(plan) })
  }

  return (
    <View className='page-shell planner-page'>
      <View className='planner-hero'>
        <Text className='planner-eyebrow'>ROUTE PLANNER / 路线生成</Text>
        <Text className='planner-title'>告诉我们，{`\n`}你想怎样读懂这段历史</Text>
        <Text className='planner-intro'>先校验开放日期与每日时长，再按主题和体验偏好挑选点位。</Text>
      </View>

      <View className='planner-form'>
        <View className='form-heading'>
          <Text>01</Text>
          <View><Text>行程基础</Text><Text>从哪里出发，准备走多久</Text></View>
        </View>

        <View className='field-grid'>
          <SelectorField
            label='起始县区'
            note='优先从附近的核心点位开始'
            value={criteria.county}
            range={counties}
            onChange={(index) => updateCriteria('county', counties[index] ?? criteria.county)}
          />
          <View className='planner-field'>
            <Text className='field-label'>出发日期</Text>
            <Picker mode='date' value={criteria.startDate} onChange={(event) => updateCriteria('startDate', event.detail.value)}>
              <View className='field-value'><Text>{criteria.startDate}</Text><Text>⌄</Text></View>
            </Picker>
            <Text className='field-note'>用于避开固定闭馆日</Text>
          </View>
          <SelectorField
            label='游览天数'
            note='每日按约 8 小时安排'
            value={`${criteria.days} 天`}
            range={dayOptions.map((day) => `${day} 天`)}
            onChange={(index) => updateCriteria('days', dayOptions[index] ?? criteria.days)}
          />
          <SelectorField
            label='交通方式'
            note={travelModes.find((mode) => mode.value === criteria.travelMode)?.note ?? ''}
            value={travelModes.find((mode) => mode.value === criteria.travelMode)?.label ?? '自驾'}
            range={travelModes.map((mode) => mode.label)}
            onChange={(index) => updateCriteria('travelMode', travelModes[index]?.value ?? criteria.travelMode)}
          />
        </View>

        <View className='form-divider' />

        <View className='form-heading'>
          <Text>02</Text>
          <View><Text>内容偏好</Text><Text>此行最想理解什么</Text></View>
        </View>

        <View className='field-grid'>
          <SelectorField
            label='优先主题'
            note='路线匹配的主要权重'
            value={criteria.theme1}
            range={themeOptions}
            onChange={(index) => updateCriteria('theme1', themeOptions[index] ?? criteria.theme1)}
          />
          <SelectorField
            label='补充主题'
            note='构成更完整的历史线索'
            value={criteria.theme2}
            range={themeOptions}
            onChange={(index) => updateCriteria('theme2', themeOptions[index] ?? criteria.theme2)}
          />
          <SelectorField
            label='体验方式'
            note='决定点位类型与停留节奏'
            value={criteria.experience}
            range={experiences}
            onChange={(index) => updateCriteria('experience', experiences[index] ?? criteria.experience)}
          />
          <SelectorField
            label='实践目的'
            note='用于组织推荐理由'
            value={criteria.purpose}
            range={purposes}
            onChange={(index) => updateCriteria('purpose', purposes[index] ?? criteria.purpose)}
          />
        </View>

        <Button className='tap-button generate-button' onClick={createPlans}>
          <View><Text>开始生成路线</Text><Text>综合点位评分、开放约束与通行时间</Text></View>
          <Text>→</Text>
        </Button>
      </View>

      <View className='plan-results' id='plan-results'>
        {!hasGenerated && (
          <View className='result-placeholder'>
            <Text>03 / YOUR JOURNEY</Text>
            <Text>你的路线会从这里展开</Text>
            <Text>完成上方选择并生成，我们会给出最多 3 条差异化方案。</Text>
          </View>
        )}

        {hasGenerated && plans.length === 0 && (
          <View className='result-placeholder'>
            <Text>暂无可行路线</Text>
            <Text>当前条件过于紧凑，请增加游览天数或调整出发日期。</Text>
          </View>
        )}

        {plans.length > 0 && (
          <View className='results-inner'>
            <Text className='results-kicker'>为你找到 {plans.length} 条可行路线</Text>
            {plans.map((plan, planIndex) => (
              <View className='plan-card' key={plan.id}>
                <View className='plan-head'>
                  <Text className='plan-index'>0{planIndex + 1}</Text>
                  <View className='plan-score'><Text>{plan.score}</Text><Text>综合匹配</Text></View>
                </View>
                <Text className='plan-angle'>{plan.angle}</Text>
                <Text className='plan-name'>{plan.name}</Text>
                <Text className='plan-reason'>{plan.reason}</Text>

                <View className='plan-days'>
                  {plan.days.map((day, dayIndex) => (
                    <View className='plan-day' key={`${plan.id}-${dayIndex}`}>
                      <View className='day-label'><Text>DAY</Text><Text>0{dayIndex + 1}</Text></View>
                      <View className='day-stops'>
                        {day.map((spot, stopIndex) => (
                          <View className='day-stop' key={spot.id}>
                            <Text>{stopIndex + 1}</Text>
                            <View><Text>{spot.name}</Text><Text>{spot.region} · 建议 {spot.minutes} 分钟</Text></View>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
                <View className='plan-card-actions'>
                  <Button className={`tap-button plan-save-button ${savedPlanIds.includes(plan.id) ? 'plan-saved-button' : ''}`} onClick={() => savePlan(plan)}>
                    {savedPlanIds.includes(plan.id) ? '已保存' : '保存路线'}
                  </Button>
                  <Button className='tap-button plan-open-button' onClick={() => openPlan(plan)}>查看行程 <Text>→</Text></Button>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}
