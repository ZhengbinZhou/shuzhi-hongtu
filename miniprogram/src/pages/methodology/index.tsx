import Taro, { useShareAppMessage } from '@tarojs/taro'
import { Button, Text, View } from '@tarojs/components'
import './index.scss'

const steps = [
  { number: '01', title: '可行性过滤', text: '依据出发日期、固定闭馆日、建议参观时长和预设通行时间，将每天可用时间控制在约 480 分钟以内。' },
  { number: '02', title: '内容匹配', text: '对重要人物、重大事件、军事斗争、群众支前、政权建设、长征文化和革命精神七个维度设置内容评分。' },
  { number: '03', title: '历史叙事校验', text: '保留主题下的核心景区，并结合起始县区与空间距离调整参观顺序，让路线具备连续历史线索。' },
  { number: '04', title: '差异化输出', text: '每条路线采用不同观察重点，并校验重复点位，避免方案只是简单替换少量景点。' }
]

export default function MethodologyPage () {
  useShareAppMessage(() => ({ title: '路线匹配方法｜数智-红途', path: '/pages/methodology/index' }))
  return (
    <View className='page-shell methodology-page'>
      <View className='methodology-hero'>
        <Text>METHOD & DATA</Text>
        <Text>让路线推荐有依据，也有边界</Text>
        <Text>平台将内容相关性与行程可行性分开计算，再生成具备差异化叙事角度的路线。</Text>
      </View>
      <View className='methodology-steps'>
        {steps.map((step) => (
          <View className='methodology-step' key={step.number}>
            <Text>{step.number}</Text><View><Text>{step.title}</Text><Text>{step.text}</Text></View>
          </View>
        ))}
      </View>
      <View className='methodology-boundary'>
        <Text>使用边界</Text>
        <Text>当前开放日期、闭馆安排和通行时间均为演示期静态资料，不包含节假日临时调整、预约余量和实时路况。实际出行前应再次核验各场馆官方通知。</Text>
      </View>
      <Button className='tap-button methodology-action' onClick={() => Taro.switchTab({ url: '/pages/planner/index' })}>开始生成路线 <Text>→</Text></Button>
    </View>
  )
}
