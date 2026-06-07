/**
 * 统计图表组件
 * 展示月度趋势、分类分布、类型分布等统计图表
 */

const StatsComponent = {
  name: 'StatsPage',
  template: `
    <div class="stats-page">
      <!-- 页面标题 -->
      <div class="page-title">
        <el-icon><component is="DataAnalysis" /></el-icon>
        数据统计
      </div>

      <!-- 年份选择和导出按钮 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-date-picker
            v-model="selectedYear"
            type="year"
            placeholder="选择年份"
            value-format="YYYY"
            style="width: 120px;"
            @change="loadAllData"
          />
        </div>
        <div class="toolbar-right">
          <el-button @click="handleExport('excel')">
            <el-icon><component is="Download" /></el-icon> 导出Excel
          </el-button>
          <el-button @click="handleExport('pdf')">
            <el-icon><component is="Document" /></el-icon> 导出PDF
          </el-button>
        </div>
      </div>

      <!-- 统计概要卡片 -->
      <div class="stats-grid">
        <div class="stat-card blue">
          <div class="stat-card-header">
            <span class="stat-card-label">年度发票总数</span>
            <div class="stat-card-icon">
              <el-icon><component is="Document" /></el-icon>
            </div>
          </div>
          <div class="stat-card-value">{{ yearlyStats.total_count || 0 }}</div>
          <div class="stat-card-footer">全年累计</div>
        </div>
        <div class="stat-card green">
          <div class="stat-card-header">
            <span class="stat-card-label">年度总金额</span>
            <div class="stat-card-icon">
              <el-icon><component is="Money" /></el-icon>
            </div>
          </div>
          <div class="stat-card-value">{{ formatAmount(yearlyStats.total_amount) }}</div>
          <div class="stat-card-footer">全年累计</div>
        </div>
        <div class="stat-card orange">
          <div class="stat-card-header">
            <span class="stat-card-label">月均发票数</span>
            <div class="stat-card-icon">
              <el-icon><component is="TrendCharts" /></el-icon>
            </div>
          </div>
          <div class="stat-card-value">{{ yearlyStats.avg_monthly_count || 0 }}</div>
          <div class="stat-card-footer">月平均值</div>
        </div>
        <div class="stat-card red">
          <div class="stat-card-header">
            <span class="stat-card-label">月均金额</span>
            <div class="stat-card-icon">
              <el-icon><component is="Coin" /></el-icon>
            </div>
          </div>
          <div class="stat-card-value">{{ formatAmount(yearlyStats.avg_monthly_amount) }}</div>
          <div class="stat-card-footer">月平均值</div>
        </div>
      </div>

      <!-- 月度趋势折线图 -->
      <div class="page-card">
        <div class="card-header">
          <div class="card-header-title">
            <el-icon><component is="TrendCharts" /></el-icon>
            月度趋势
          </div>
        </div>
        <div ref="lineChartRef" class="chart-container"></div>
      </div>

      <!-- 分类分布和类型分布 -->
      <div class="chart-row">
        <!-- 分类分布饼图 -->
        <div class="page-card">
          <div class="card-header">
            <div class="card-header-title">
              <el-icon><component is="PieChart" /></el-icon>
              分类分布
            </div>
          </div>
          <div ref="categoryPieRef" class="chart-container"></div>
        </div>

        <!-- 类型分布柱状图 -->
        <div class="page-card">
          <div class="card-header">
            <div class="card-header-title">
              <el-icon><component is="Histogram" /></el-icon>
              类型分布
            </div>
          </div>
          <div ref="typeBarRef" class="chart-container"></div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const { ref, onMounted, onUnmounted, nextTick } = Vue

    // 选中年份
    const selectedYear = ref(new Date().getFullYear().toString())

    // 年度统计
    const yearlyStats = ref({})

    // 图表引用
    const lineChartRef = ref(null)
    const categoryPieRef = ref(null)
    const typeBarRef = ref(null)

    let lineChart = null
    let categoryPieChart = null
    let typeBarChart = null

    // 方法引用
    const formatAmount = Helpers.formatAmount

    /**
     * 加载所有统计数据
     */
    const loadAllData = async () => {
      const params = { year: selectedYear.value }
      await Promise.all([
        loadMonthlyData(params),
        loadCategoryData(params),
        loadTypeData(params)
      ])
    }

    /**
     * 加载月度统计数据
     */
    const loadMonthlyData = async (params) => {
      try {
        const data = await Api.getMonthlyStats(params)
        const items = data || []
        renderLineChart(items)
        // 计算年度统计
        calculateYearlyStats(items)
      } catch (err) {
        console.error('加载月度统计失败:', err)
        // 使用模拟数据
        const mockData = generateMockMonthlyData()
        renderLineChart(mockData)
        calculateYearlyStats(mockData)
      }
    }

    /**
     * 加载分类统计数据
     */
    const loadCategoryData = async (params) => {
      try {
        const data = await Api.getCategoryStats(params)
        renderCategoryPieChart(data || [])
      } catch (err) {
        console.error('加载分类统计失败:', err)
        renderCategoryPieChart(generateMockCategoryData())
      }
    }

    /**
     * 加载类型统计数据
     */
    const loadTypeData = async (params) => {
      try {
        const data = await Api.getCategoryStats({ ...params, by_type: true })
        renderTypeBarChart(data || [])
      } catch (err) {
        console.error('加载类型统计失败:', err)
        renderTypeBarChart(generateMockTypeData())
      }
    }

    /**
     * 计算年度统计
     */
    const calculateYearlyStats = (monthlyData) => {
      let totalCount = 0
      let totalAmount = 0
      monthlyData.forEach(item => {
        totalCount += item.count || 0
        totalAmount += item.amount || item.total_amount || 0
      })
      yearlyStats.value = {
        total_count: totalCount,
        total_amount: totalAmount,
        avg_monthly_count: Math.round(totalCount / 12),
        avg_monthly_amount: Math.round(totalAmount / 12 * 100) / 100
      }
    }

    /**
     * 渲染月度趋势折线图
     */
    const renderLineChart = (data) => {
      if (!lineChartRef.value) return
      if (!lineChart) lineChart = echarts.init(lineChartRef.value)

      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
      const countData = new Array(12).fill(0)
      const amountData = new Array(12).fill(0)

      data.forEach(item => {
        const month = (item.month || 1) - 1
        if (month >= 0 && month < 12) {
          countData[month] = item.count || 0
          amountData[month] = item.amount || item.total_amount || 0
        }
      })

      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' }
        },
        legend: {
          data: ['发票数量', '发票金额'],
          top: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '40px',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: months,
          axisLabel: { color: '#606266' },
          axisLine: { lineStyle: { color: '#DCDFE6' } }
        },
        yAxis: [
          {
            type: 'value',
            name: '数量（张）',
            nameTextStyle: { color: '#909399' },
            axisLabel: { color: '#606266' },
            splitLine: { lineStyle: { color: '#EBEEF5', type: 'dashed' } }
          },
          {
            type: 'value',
            name: '金额（元）',
            nameTextStyle: { color: '#909399' },
            axisLabel: { color: '#606266', formatter: val => (val / 10000).toFixed(0) + '万' },
            splitLine: { show: false }
          }
        ],
        color: Helpers.chartColors,
        series: [
          {
            name: '发票数量',
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            lineStyle: { width: 3 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
                { offset: 1, color: 'rgba(64, 158, 255, 0.02)' }
              ])
            },
            data: countData
          },
          {
            name: '发票金额',
            type: 'line',
            yAxisIndex: 1,
            smooth: true,
            symbol: 'diamond',
            symbolSize: 8,
            lineStyle: { width: 3 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
                { offset: 1, color: 'rgba(103, 194, 58, 0.02)' }
              ])
            },
            data: amountData
          }
        ]
      }
      lineChart.setOption(option)
    }

    /**
     * 渲染分类分布饼图
     */
    const renderCategoryPieChart = (data) => {
      if (!categoryPieRef.value) return
      if (!categoryPieChart) categoryPieChart = echarts.init(categoryPieRef.value)

      const chartData = data.map(item => ({
        name: Helpers.getCategoryName(item.category || item.name),
        value: item.count || item.value || item.amount || 0
      }))

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
            name: '分类分布',
            type: 'pie',
            radius: ['35%', '65%'],
            center: ['40%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 6,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: { show: false },
            emphasis: {
              label: { show: true, fontSize: 14, fontWeight: 'bold' }
            },
            data: chartData
          }
        ]
      }
      categoryPieChart.setOption(option)
    }

    /**
     * 渲染类型分布柱状图
     */
    const renderTypeBarChart = (data) => {
      if (!typeBarRef.value) return
      if (!typeBarChart) typeBarChart = echarts.init(typeBarRef.value)

      const chartData = data.map(item => ({
        name: Helpers.getInvoiceTypeName(item.invoice_type || item.type || item.name),
        value: item.count || item.value || 0
      }))

      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '20px',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          axisLabel: { color: '#606266' },
          splitLine: { lineStyle: { color: '#EBEEF5', type: 'dashed' } }
        },
        yAxis: {
          type: 'category',
          data: chartData.map(d => d.name).reverse(),
          axisLabel: {
            color: '#606266',
            fontSize: 11,
            width: 120,
            overflow: 'truncate'
          }
        },
        color: Helpers.chartColors,
        series: [
          {
            name: '发票数量',
            type: 'bar',
            barWidth: 20,
            itemStyle: {
              borderRadius: [0, 4, 4, 0]
            },
            data: chartData.map(d => d.value).reverse()
          }
        ]
      }
      typeBarChart.setOption(option)
    }

    /**
     * 导出数据
     */
    const handleExport = async (format) => {
      try {
        const blob = await Api.exportData({ format, year: selectedYear.value })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `统计报表_${selectedYear.value}.${format === 'excel' ? 'xlsx' : 'pdf'}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        Helpers.showSuccess('导出成功', ElementPlus.ElMessage)
      } catch (err) {
        Helpers.showError('导出失败: ' + err.message, ElementPlus.ElMessage)
      }
    }

    /**
     * 生成模拟月度数据
     */
    const generateMockMonthlyData = () => {
      return [
        { month: 1, count: 12, amount: 18500 },
        { month: 2, count: 8, amount: 12300 },
        { month: 3, count: 15, amount: 28700 },
        { month: 4, count: 11, amount: 19800 },
        { month: 5, count: 18, amount: 35600 },
        { month: 6, count: 14, amount: 24100 },
        { month: 7, count: 9, amount: 15200 },
        { month: 8, count: 16, amount: 31200 },
        { month: 9, count: 20, amount: 42800 },
        { month: 10, count: 13, amount: 22600 },
        { month: 11, count: 17, amount: 33400 },
        { month: 12, count: 23, amount: 45900 }
      ]
    }

    /**
     * 生成模拟分类数据
     */
    const generateMockCategoryData = () => [
      { category: 'office', count: 35 },
      { category: 'transport', count: 28 },
      { category: 'catering', count: 22 },
      { category: 'communication', count: 15 },
      { category: 'training', count: 12 },
      { category: 'travel', count: 18 },
      { category: 'advertising', count: 8 },
      { category: 'other', count: 26 }
    ]

    /**
     * 生成模拟类型数据
     */
    const generateMockTypeData = () => [
      { invoice_type: 'vat_special', count: 42 },
      { invoice_type: 'vat_normal', count: 35 },
      { invoice_type: 'vat_electronic', count: 28 },
      { invoice_type: 'train', count: 18 },
      { invoice_type: 'taxi', count: 15 },
      { invoice_type: 'airline', count: 12 },
      { invoice_type: 'quota', count: 6 }
    ]

    // 窗口大小变化时重绘图表
    const handleResize = () => {
      if (lineChart) lineChart.resize()
      if (categoryPieChart) categoryPieChart.resize()
      if (typeBarChart) typeBarChart.resize()
    }

    onMounted(() => {
      loadAllData()
      nextTick(() => {
        window.addEventListener('resize', handleResize)
      })
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      if (lineChart) { lineChart.dispose(); lineChart = null }
      if (categoryPieChart) { categoryPieChart.dispose(); categoryPieChart = null }
      if (typeBarChart) { typeBarChart.dispose(); typeBarChart = null }
    })

    return {
      selectedYear,
      yearlyStats,
      lineChartRef,
      categoryPieRef,
      typeBarRef,
      formatAmount,
      loadAllData,
      handleExport
    }
  }
}
