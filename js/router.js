/**
 * 简单Hash路由管理模块
 * 基于 window.location.hash 实现前端路由
 */

const Router = (() => {
  // 路由配置映射
  const routes = {
    'dashboard': {
      name: '仪表盘',
      icon: 'Odometer',
      component: 'dashboard'
    },
    'invoices': {
      name: '发票管理',
      icon: 'Document',
      component: 'invoice-list'
    },
    'upload': {
      name: '上传发票',
      icon: 'Upload',
      component: 'upload'
    },
    'stats': {
      name: '数据统计',
      icon: 'DataAnalysis',
      component: 'stats'
    }
  }

  // 当前路由
  let currentRoute = 'dashboard'

  // 路由变化回调列表
  const listeners = []

  /**
   * 初始化路由
   * 读取当前hash并监听hash变化
   */
  function init() {
    // 读取初始hash
    const hash = window.location.hash.replace('#', '')
    if (hash && routes[hash]) {
      currentRoute = hash
    } else {
      // 默认跳转到仪表盘
      window.location.hash = '#dashboard'
    }

    // 监听hash变化
    window.addEventListener('hashchange', () => {
      const newHash = window.location.hash.replace('#', '')
      if (newHash && routes[newHash] && newHash !== currentRoute) {
        currentRoute = newHash
        notifyListeners()
      }
    })
  }

  /**
   * 注册路由变化监听器
   * @param {Function} callback - 路由变化时的回调函数
   */
  function onRouteChange(callback) {
    listeners.push(callback)
  }

  /**
   * 通知所有监听器路由已变化
   */
  function notifyListeners() {
    listeners.forEach(cb => {
      try {
        cb(currentRoute)
      } catch (e) {
        console.error('路由回调执行错误:', e)
      }
    })
  }

  /**
   * 导航到指定路由
   * @param {string} route - 路由名称
   */
  function push(route) {
    if (routes[route]) {
      window.location.hash = '#' + route
    }
  }

  /**
   * 获取当前路由名称
   * @returns {string} 当前路由
   */
  function getCurrentRoute() {
    return currentRoute
  }

  /**
   * 获取当前路由信息
   * @returns {object} 路由配置对象
   */
  function getCurrentRouteInfo() {
    return routes[currentRoute] || routes['dashboard']
  }

  /**
   * 获取所有路由配置
   * @returns {object} 路由配置映射
   */
  function getRoutes() {
    return routes
  }

  return {
    init,
    onRouteChange,
    push,
    getCurrentRoute,
    getCurrentRouteInfo,
    getRoutes
  }
})()
