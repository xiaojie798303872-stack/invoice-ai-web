/**
 * 仪表盘/总览组件
 * 展示系统概览数据、最近发票、类型分布图表
 */

const DashboardComponent = {
  name: 'Dashboard',
  emits: ['navigate', 'view-invoice'],
  template: `
    <div class="dashboard-page">
      <!-- 页面标题 -->
      <div class="page-title">
        <el-icon><component is="Odometer" /></el-icon>
        系统概览
      </div>

      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card blue">
          <div class="stat-card-header">
            <span class="stat-card-label">发票总数</span>
            <div class="stat-card-icon">
              <el-icon><component is="Document" /></el-icon>
            </div>
          </div>
          <div class="stat-card-value">{{ overview.total_count || 0 }}</div>
          <div class="stat-card-footer">累计录入发票</div>
        </div>

        <div class="stat-card green">
          <div class="stat-card-header">
            <span class="stat-card-label">本月新增</span>
            <div class="stat-card-icon">
              <el-icon><component is="Plus" /></el-icon>
            </div>
          </div>
          <div class="stat-card-value">{{ overview.month_count || 0 }}</div>
          <div class="stat-card-footer">本月上传发票数</div>
        </div>

        <div class="stat-card orange">
          <div class="stat-card-header">
            <span class="stat-card-label">总金额</span>
            <div class="stat-card-icon">
              <el-icon><component is="Money" /></el-icon>
            </div>
          </div>
          <div class="stat-card-value">{{ formatAmount(overview.total_amount) }}</div>
          <div class="stat-card-footer">发票累计金额</div>
        </div>

        <div class="stat-card red">
          <div class="stat-card-header">
            <span class="stat-card-label">待审核</span>
            <div class="stat-card-icon">
              <el-icon><component is="Warning" /></el-icon>
            </div>
          </div>
          <div class="stat-card-value">{{ overview.pending_count || 0 }}</div>
          <div class="stat-card-footer">待审核发票数</div>
        </div>
      </div>

      <!-- 中间区域：最近发票 + 类型分布 -->
      <div class="chart-row">
        <!-- 最近上传的发票 -->
        <div class="page-card">
          <div class="card-header">
            <div class="card-header-title">
              <el-icon><component is="Clock" /></el-icon>
              最近上传
            </div>
            <el-button text type="primary" @click="$emit('navigate', 'invoices')">
              查看全部 <el-icon><component is="ArrowRight" /></el-icon>
            </el-button>
          </div>

          <!-- 加载状态 -->
          <div v-if="loadingRecent" class="loading-mask">
            <el-icon class="is-loading" :size="32" color="#409EFF"><component is="Loading" /></el-icon>
          </div>

          <!-- 空状态 -->
          <div v-else-if="recentInvoices.length === 0" class="empty-state">
            <div class="empty-state-icon">
              <el-icon><component is="FolderOpened" /></el-icon>
            </div>
            <div class="empty-state-text">暂无发票数据</div>
            <el-button type="primary" @click="$emit('navigate', 'upload')">
              <el-icon><component is="Upload" /></el-icon> 上传发票
            </el-button>
          </div>

          <!-- 最近发票列表 -->
          <div v-else>
            <div
              v-for="item in recentInvoices"
              :key="item.id"
              class="recent-invoice-item"
              @click="$emit('view-invoice', item.id)"
            >
              <div class="recent-invoice-left">
                <div class="recent-invoice-title">
                  {{ getInvoiceTypeName(item.invoice_type) }}
                </div>
                <div class="recent-invoice-meta">
                  {{ item.invoice_number || '无编号' }}
                </div>
              </div>
              <div class="recent-invoice-right">
                <div class="recent-invoice-amount">
                  {{ formatAmount(item.amount) }}
                </div>
                <div class="recent-invoice-date">
                  {{ formatDate(item.invoice_date) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 发票类型分布饼图 -->
        <div class="page-card">
          <div class="card-header">
            <div class="card-header-title">
              <el-icon><component is="PieChart" /></el-icon>
              类型分布
            </div>
          </div>
          <div ref="pieChartRef" class="chart-container"></div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="page-card">
        <div class="card-header">
          <div class="card-header-title">
            <el-icon><component is="Opportunity" /></el-icon>
            快捷操作
          </div>
        </div>
        <div class="quick-actions">
          <div class="quick-action-btn" @click="$emit('navigate', 'upload')">
            <el-icon><component is="Upload" /></el-icon>
            上传发票
          </div>
          <div class="quick-action-btn" @click="$emit('navigate', 'invoices')">
            <el-icon><component is="Document" /></el-icon>
            管理发票
          </div>
          <div class="quick-action-btn" @click="$emit('navigate', 'stats')">
            <el-icon><component is="DataAnalysis" /></el-icon>
            数据统计
          </div>
        </div>
      </div>
    </div>
  `,
  setup(props, { emit }) {
    const { ref, onMounted, onUnmounted, nextTick } = Vue

    // 数据状态
    const overview = ref({})
    const recentInvoices = ref([])
    const loadingRecent = ref(false)
    const pieChartRef = ref(null)
    let pieChart = null

    // 方法引用
    const formatAmount = Helpers.formatAmount
    const formatDate = Helpers.formatDate
    const getInvoiceTypeName = Helpers.getInvoiceTypeName

    /**
     * 加载概览统计数据
     */
    const loadOverview = async () => {
      try {
        const data = await Api.getStatsOverview()
        overview.value = data || {}
      } catch (err) {
        console.error('加载概览数据失败:', err)
        // 使用模拟数据（后端不可用时）
        overview.value = {
          total_count: 156,
          month_count: 23,
          total_amount: 285630.50,
          pending_count: 8
        }
      }
    }

    /**
     * 加载最近上传的发票
     */
    const loadRecentInvoices = async () => {
      loadingRecent.value = true
      try {
        const data = await Api.getInvoices({ page: 1, page_size: 5, order_by: 'created_at', order: 'desc' })
        recentInvoices.value = data.items || data.data || data || []
      } catch (err) {
        console.error('加载最近发票失败:', err)
        // 使用模拟数据
        recentInvoices.value = [
          { id: 1, invoice_type: 'vat_special', invoice_number: 'NO1202456001', amount: 5680.00, invoice_date: '2025-12-20' },
          { id: 2, invoice_type: 'vat_normal', invoice_number: 'NO3202456002', amount: 1250.50, invoice_date: '2025-12-19' },
          { id: 3, invoice_type: 'vat_electronic', invoice_number: 'NO4402456003', amount: 890.00, invoice_date: '2025-12-18' },
          { id: 4, invoice_type: 'train', invoice_number: 'TX20251218001', amount: 553.00, invoice_date: '2025-12-18' },
          { id: 5, invoice_type: 'taxi', invoice_number: 'TAX20251217001', amount: 36.80, invoice_date: '2025-12-17' }
        ]
      } finally {
        loadingRecent.value = false
      }
    }

    /**
     * 初始化饼图
     */
    const initPieChart = () => {
      if (!pieChartRef.value) return

      pieChart = echarts.init(pieChartRef.value)

      // 尝试加载分类统计数据，失败则使用模拟数据
      Api.getCategoryStats().then(data => {
        const chartData = (data || []).map(item => ({
          name: Helpers.getCategoryName(item.category || item.name),
          value: item.count || item.value
        }))
        renderPieChart(chartData)
      }).catch(() => {
        // 模拟数据
        renderPieChart([
          { name: '办公用品', value: 35 },
          { name: '交通出行', value: 28 },
          { name: '餐饮住宿', value: 22 },
          { name: '通讯费', value: 15 },
          { name: '培训教育', value: 12 },
          { name: '其他', value: 44 }
        ])
      })
    }

    /**
     * 渲染饼图
     */
    const renderPieChart = (chartData) => {
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
          textStyle: { fontSize: 12 }
        },
        color: Helpers.chartColors,
        series: [
          {
            name: '发票类型分布',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['40%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 6,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold'
              }
            },
            labelLine: { show: false },
            data: chartData
          }
        ]
      }
      pieChart.setOption(option)
    }

    // 窗口大小变化时重绘图表
    const handleResize = () => {
      if (pieChart) pieChart.resize()
    }

    onMounted(() => {
      loadOverview()
      loadRecentInvoices()
      nextTick(() => {
        initPieChart()
        window.addEventListener('resize', handleResize)
      })
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      if (pieChart) {
        pieChart.dispose()
        pieChart = null
      }
    })

    return {
      overview,
      recentInvoices,
      loadingRecent,
      pieChartRef,
      formatAmount,
      formatDate,
      getInvoiceTypeName
    }
  }
}
