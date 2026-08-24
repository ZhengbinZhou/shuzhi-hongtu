export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/planner/index',
    'pages/landmarks/index',
    'pages/saved/index',
    'pages/route-detail/index'
  ],
  lazyCodeLoading: 'requiredComponents',
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#6f171d',
    navigationBarTitleText: '数智-红途',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f5eddf'
  },
  tabBar: {
    color: '#806f66',
    selectedColor: '#851f25',
    backgroundColor: '#fffaf1',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/index/index', text: '首页' },
      { pagePath: 'pages/planner/index', text: '规划' },
      { pagePath: 'pages/landmarks/index', text: '图鉴' },
      { pagePath: 'pages/saved/index', text: '我的' }
    ]
  }
})
