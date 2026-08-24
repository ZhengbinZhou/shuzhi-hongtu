import Taro from '@tarojs/taro'

export async function openExternalLink (url: string, label: string): Promise<void> {
  await Taro.setClipboardData({ data: url })
  await Taro.showModal({
    title: `${label}链接已复制`,
    content: '受小程序业务域名限制，请粘贴到浏览器或微信中打开。',
    showCancel: false,
    confirmText: '知道了',
    confirmColor: '#851f25'
  })
}
