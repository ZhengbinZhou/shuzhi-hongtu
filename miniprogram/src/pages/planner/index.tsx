import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Picker, Text, View } from '@tarojs/components'
import {
  counties,
  experiences,
  plannerDefaults,
  plannerQuery,
  purposes,
  themeOptions,
  travelModes,
  type PlannerCriteria
} from '@shared/domain'
import { takePlannerPreset, type HistoryPlannerContext } from '../../services/planner-preset'
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
  const [historyContext, setHistoryContext] = useState<HistoryPlannerContext | null>(null)

  useDidShow(() => {
    const preset = takePlannerPreset()
    if (preset) {
      setCriteria(preset.criteria)
      setHistoryContext(preset.historyContext)
    }
  })

  function updateCriteria<K extends keyof PlannerCriteria> (key: K, value: PlannerCriteria[K]) {
    setCriteria((current) => ({ ...current, [key]: value }))
  }

  const createPlans = () => {
    const historyQuery = historyContext ? `&historyStage=${encodeURIComponent(historyContext.id)}` : ''
    Taro.navigateTo({ url: `/pages/routes/index?${plannerQuery(criteria)}${historyQuery}` })
  }

  return (
    <View className='page-shell planner-page'>
      <View className='planner-hero'>
        <Text className='planner-eyebrow'>ROUTE PLANNER / 路线生成</Text>
        <Text className='planner-title'>告诉我们，{`\n`}你想怎样读懂这段历史</Text>
        <Text className='planner-intro'>先校验开放日期与每日时长，再按主题和体验偏好挑选点位。</Text>
      </View>

      {historyContext && (
        <View className='planner-preset-note'>
          <View>
            <Text>历史专题 · 第 {historyContext.number} 章</Text>
            <Text>{historyContext.shortTitle}</Text>
            <Text>{historyContext.period} · {historyContext.spotIds.length} 个专题点位将随条件进入推荐页</Text>
          </View>
          <Text onClick={() => setHistoryContext(null)}>×</Text>
        </View>
      )}

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

      <View className='plan-results'>
        <View className='result-placeholder'>
          <Text>03 / YOUR JOURNEY</Text>
          <Text>五条路线，进入推荐页比较</Text>
          <Text>完成上方选择后，将在独立页面展示最多 5 条差异化方案。</Text>
        </View>
      </View>
    </View>
  )
}
