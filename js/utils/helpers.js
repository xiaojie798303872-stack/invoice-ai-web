/**
 * 工具函数模块
 * 提供通用的辅助方法
 */

const Helpers = {
  /**
   * 格式化金额（千分位分隔）
   * @param {number} amount - 金额
   * @param {number} decimals - 小数位数，默认2位
   * @returns {string} 格式化后的金额字符串
   */
  formatAmount(amount, decimals = 2) {
    if (amount === null || amount === undefined || isNaN(amount)) return '¥0.00'
    const num = Number(amount)
    return '¥' + num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  /**
   * 格式化日期
   * @param {string|Date} date - 日期
   * @param {string} format - 格式类型：'date' | 'datetime' | 'time'
   * @returns {string} 格式化后的日期字符串
   */
  formatDate(date, format = 'date') {
    if (!date) return '-'
    const d = new Date(date)
    if (isNaN(d.getTime())) return '-'

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')

    switch (format) {
      case 'datetime':
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      case 'time':
        return `${hours}:${minutes}:${seconds}`
      case 'date':
      default:
        return `${year}-${month}-${day}`
    }
  },

  /**
   * 获取发票类型的中文名称
   * @param {string} type - 发票类型代码
   * @returns {string} 中文名称
   */
  getInvoiceTypeName(type) {
    const typeMap = {
      'vat_special': '增值税专用发票',
      'vat_normal': '增值税普通发票',
      'vat_electronic': '增值税电子普通发票',
      'vat_electronic_special': '增值税电子专用发票',
      'vat_rolling': '增值税卷票',
      'motor_vehicle': '机动车销售统一发票',
      'tolll': '通行费发票',
      'train': '火车票',
      'airline': '航空运输电子客票行程单',
      'taxi': '出租车发票',
      'bus': '汽车票',
      'ferry': '轮船票',
      'quota': '定额发票',
      'financial': '金融发票',
      'other': '其他'
    }
    return typeMap[type] || type || '未知'
  },

  /**
   * 获取发票分类的中文名称
   * @param {string} category - 分类代码
   * @returns {string} 中文名称
   */
  getCategoryName(category) {
    const categoryMap = {
      'office': '办公用品',
      'transport': '交通出行',
      'catering': '餐饮住宿',
      'communication': '通讯费',
      'advertising': '广告宣传',
      'training': '培训教育',
      'maintenance': '维修保养',
      'rent': '租赁费',
      'service': '服务费',
      'material': '原材料',
      'equipment': '设备采购',
      'welfare': '福利费',
      'entertainment': '招待费',
      'travel': '差旅费',
      'other': '其他'
    }
    return categoryMap[category] || category || '未分类'
  },

  /**
   * 获取发票状态的中文名称和样式类
   * @param {string} status - 状态代码
   * @returns {object} { label, className }
   */
  getInvoiceStatus(status) {
    const statusMap = {
      'pending': { label: '待审核', className: 'pending' },
      'confirmed': { label: '已确认', className: 'confirmed' },
      'error': { label: '识别异常', className: 'error' },
      'processing': { label: '处理中', className: 'processing' }
    }
    return statusMap[status] || { label: status || '未知', className: 'pending' }
  },

  /**
   * 生成文件大小显示文本
   * @param {number} bytes - 文件字节数
   * @returns {string} 文件大小文本
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + units[i]
  },

  /**
   * 防抖函数
   * @param {Function} fn - 要防抖的函数
   * @param {number} delay - 延迟毫秒数
   * @returns {Function} 防抖后的函数
   */
  debounce(fn, delay = 300) {
    let timer = null
    return function (...args) {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        fn.apply(this, args)
      }, delay)
    }
  },

  /**
   * 节流函数
   * @param {Function} fn - 要节流的函数
   * @param {number} interval - 间隔毫秒数
   * @returns {Function} 节流后的函数
   */
  throttle(fn, interval = 300) {
    let lastTime = 0
    return function (...args) {
      const now = Date.now()
      if (now - lastTime >= interval) {
        lastTime = now
        fn.apply(this, args)
      }
    }
  },

  /**
   * 显示成功消息提示
   * @param {string} message - 消息内容
   * @param {Function} ElMessage - Element Plus消息组件
   */
  showSuccess(message, ElMessage) {
    if (ElMessage) {
      ElMessage.success(message)
    } else {
      alert(message)
    }
  },

  /**
   * 显示错误消息提示
   * @param {string} message - 消息内容
   * @param {Function} ElMessage - Element Plus消息组件
   */
  showError(message, ElMessage) {
    if (ElMessage) {
      ElMessage.error(message)
    } else {
      alert(message)
    }
  },

  /**
   * 显示确认对话框
   * @param {string} message - 确认消息
   * @param {Function} ElMessageBox - Element Plus消息框组件
   * @returns {Promise}
   */
  showConfirm(message, ElMessageBox) {
    if (ElMessageBox) {
      return ElMessageBox.confirm(message, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } else {
      return Promise.resolve(window.confirm(message))
    }
  },

  /**
   * 生成随机ID
   * @returns {string} 随机ID字符串
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  },

  /**
   * 深拷贝对象
   * @param {object} obj - 要拷贝的对象
   * @returns {object} 拷贝后的对象
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj))
  },

  /**
   * 判断值是否为空
   * @param {*} value - 要判断的值
   * @returns {boolean}
   */
  isEmpty(value) {
    return value === null || value === undefined || value === '' ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && Object.keys(value).length === 0)
  },

  /**
   * ECharts 配色方案
   */
  chartColors: [
    '#409EFF', '#67C23A', '#E6A23C', '#F56C6C',
    '#909399', '#00d2ff', '#ff6b6b', '#ffd93d',
    '#6bcb77', '#4d96ff', '#ff6b9d', '#c084fc'
  ]
}
