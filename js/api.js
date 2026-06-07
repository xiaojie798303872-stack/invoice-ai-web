/**
 * API请求封装模块
 * 基于axios封装所有后端API调用
 */

const Api = (() => {
  // API基础地址配置
  // 生产环境使用 Railway 后端地址
  const API_BASE_URL = window.API_BASE_URL || 'https://invoice-ai-backend-production-ae1b.up.railway.app/api'

  // 创建axios实例
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // 请求拦截器
  instance.interceptors.request.use(
    config => {
      // 可在此处添加token等认证信息
      // const token = localStorage.getItem('token')
      // if (token) {
      //   config.headers.Authorization = `Bearer ${token}`
      // }
      return config
    },
    error => {
      console.error('请求错误:', error)
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  instance.interceptors.response.use(
    response => {
      return response.data
    },
    error => {
      console.error('响应错误:', error)
      const message = error.response?.data?.detail || error.response?.data?.message || error.message || '请求失败'
      return Promise.reject(new Error(message))
    }
  )

  // ============================================
  // 发票管理相关API
  // ============================================

  /**
   * 获取发票列表
   * @param {object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.page_size - 每页数量
   * @param {string} params.keyword - 搜索关键词
   * @param {string} params.invoice_type - 发票类型筛选
   * @param {string} params.category - 分类筛选
   * @param {string} params.status - 状态筛选
   * @param {string} params.date_from - 开始日期
   * @param {string} params.date_to - 结束日期
   * @param {string} params.order_by - 排序字段
   * @param {string} params.order - 排序方向 asc/desc
   * @returns {Promise} 发票列表数据
   */
  function getInvoices(params = {}) {
    return instance.get('/invoices', { params })
  }

  /**
   * 获取单张发票详情
   * @param {number|string} id - 发票ID
   * @returns {Promise} 发票详情数据
   */
  function getInvoice(id) {
    return instance.get(`/invoices/${id}`)
  }

  /**
   * 更新发票信息
   * @param {number|string} id - 发票ID
   * @param {object} data - 更新数据
   * @returns {Promise} 更新后的发票数据
   */
  function updateInvoice(id, data) {
    return instance.put(`/invoices/${id}`, data)
  }

  /**
   * 删除单张发票
   * @param {number|string} id - 发票ID
   * @returns {Promise}
   */
  function deleteInvoice(id) {
    return instance.delete(`/invoices/${id}`)
  }

  /**
   * 批量删除发票
   * @param {Array} ids - 发票ID数组
   * @returns {Promise}
   */
  function batchDeleteInvoices(ids) {
    return instance.post('/invoices/batch-delete', { ids })
  }

  /**
   * 上传发票文件（OCR识别）
   * @param {FormData} formData - 包含文件的FormData
   * @param {Function} onProgress - 上传进度回调
   * @returns {Promise} 识别结果
   */
  function uploadInvoice(formData, onProgress) {
    return instance.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress
    })
  }

  /**
   * 重新OCR识别发票
   * @param {number|string} id - 发票ID
   * @returns {Promise} 重新识别结果
   */
  function reOcrInvoice(id) {
    return instance.post(`/invoices/${id}/re-ocr`)
  }

  // ============================================
  // 统计分析相关API
  // ============================================

  /**
   * 获取统计概览数据
   * @returns {Promise} 概览统计数据
   */
  function getStatsOverview() {
    return instance.get('/stats/overview')
  }

  /**
   * 获取月度统计数据
   * @param {object} params - 查询参数
   * @param {string} params.year - 年份
   * @returns {Promise} 月度统计数据
   */
  function getMonthlyStats(params = {}) {
    return instance.get('/stats/monthly', { params })
  }

  /**
   * 获取分类统计数据
   * @param {object} params - 查询参数
   * @param {string} params.year - 年份
   * @param {string} params.month - 月份
   * @returns {Promise} 分类统计数据
   */
  function getCategoryStats(params = {}) {
    return instance.get('/stats/category', { params })
  }

  /**
   * 导出数据
   * @param {object} params - 导出参数
   * @param {string} params.format - 导出格式：excel / pdf
   * @param {object} params.filters - 筛选条件
   * @returns {Promise} 导出文件（Blob）
   */
  function exportData(params = {}) {
    return instance.get('/export', {
      params,
      responseType: 'blob'
    })
  }

  // 返回公共API接口
  return {
    // axios实例（供特殊场景使用）
    instance,
    // 发票管理
    getInvoices,
    getInvoice,
    updateInvoice,
    deleteInvoice,
    batchDeleteInvoices,
    uploadInvoice,
    reOcrInvoice,
    // 统计分析
    getStatsOverview,
    getMonthlyStats,
    getCategoryStats,
    // 数据导出
    exportData
  }
})()
