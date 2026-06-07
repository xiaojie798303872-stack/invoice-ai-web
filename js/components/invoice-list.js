/**
 * 发票列表组件
 * 包含搜索筛选、数据表格、分页、批量操作等功能
 */

const InvoiceListComponent = {
  name: 'InvoiceList',
  emits: ['view-invoice', 'refresh'],
  template: `
    <div class="invoice-list-page">
      <!-- 页面标题 -->
      <div class="page-title">
        <el-icon><component is="Document" /></el-icon>
        发票管理
        <span class="page-subtitle">共 {{ total }} 条记录</span>
      </div>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchParams.keyword"
          placeholder="搜索发票号/金额/备注"
          clearable
          :prefix-icon="SearchIcon"
          style="width: 220px;"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />

        <el-select
          v-model="searchParams.invoice_type"
          placeholder="发票类型"
          clearable
          style="width: 180px;"
          @change="handleSearch"
        >
          <el-option
            v-for="item in invoiceTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <el-select
          v-model="searchParams.category"
          placeholder="分类"
          clearable
          style="width: 140px;"
          @change="handleSearch"
        >
          <el-option
            v-for="item in categoryOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <el-select
          v-model="searchParams.status"
          placeholder="状态"
          clearable
          style="width: 120px;"
          @change="handleSearch"
        >
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px;"
          @change="handleDateChange"
        />

        <div class="search-bar-actions">
          <el-button type="primary" @click="handleSearch">
            <el-icon><component is="Search" /></el-icon> 搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><component is="Refresh" /></el-icon> 重置
          </el-button>
        </div>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button
            type="danger"
            :disabled="selectedRows.length === 0"
            @click="handleBatchDelete"
          >
            <el-icon><component is="Delete" /></el-icon>
            批量删除 ({{ selectedRows.length }})
          </el-button>
          <el-button @click="handleExport('excel')">
            <el-icon><component is="Download" /></el-icon> 导出Excel
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-select v-model="searchParams.order_by" placeholder="排序字段" style="width: 120px;" @change="handleSearch">
            <el-option label="日期" value="invoice_date" />
            <el-option label="金额" value="amount" />
            <el-option label="创建时间" value="created_at" />
          </el-select>
          <el-select v-model="searchParams.order" placeholder="排序方向" style="width: 100px;" @change="handleSearch">
            <el-option label="降序" value="desc" />
            <el-option label="升序" value="asc" />
          </el-select>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="page-card" style="padding: 0; overflow: hidden;">
        <el-table
          :data="invoiceList"
          v-loading="loading"
          stripe
          @selection-change="handleSelectionChange"
          style="width: 100%"
        >
          <el-table-column type="selection" width="45" align="center" />

          <el-table-column prop="invoice_number" label="发票号码" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.invoice_number || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="invoice_type" label="类型" width="140" show-overflow-tooltip>
            <template #default="{ row }">
              {{ getInvoiceTypeName(row.invoice_type) }}
            </template>
          </el-table-column>

          <el-table-column prop="amount" label="金额" width="120" sortable align="right">
            <template #default="{ row }">
              <span style="font-weight: 600; color: #f56c6c;">
                {{ formatAmount(row.amount) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column prop="invoice_date" label="日期" width="120" sortable>
            <template #default="{ row }">
              {{ formatDate(row.invoice_date) }}
            </template>
          </el-table-column>

          <el-table-column prop="category" label="分类" width="110">
            <template #default="{ row }">
              <el-tag size="small" type="info">
                {{ getCategoryName(row.category) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <span class="status-tag" :class="getInvoiceStatus(row.status).className">
                {{ getInvoiceStatus(row.status).label }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="180" align="center" fixed="right">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button type="primary" link size="small" @click="$emit('view-invoice', row.id)">
                  <el-icon><component is="View" /></el-icon> 详情
                </el-button>
                <el-button type="warning" link size="small" @click="$emit('view-invoice', row.id, true)">
                  <el-icon><component is="Edit" /></el-icon> 编辑
                </el-button>
                <el-button type="danger" link size="small" @click="handleDelete(row)">
                  <el-icon><component is="Delete" /></el-icon>
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="searchParams.page"
          v-model:page-size="searchParams.page_size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  `,
  setup(props, { emit }) {
    const { ref, reactive, onMounted, shallowRef, markRaw } = Vue

    // 搜索图标组件引用
    const SearchIcon = shallowRef(markRaw(ElementPlusIconsVue.Search))

    // 加载状态
    const loading = ref(false)

    // 发票列表数据
    const invoiceList = ref([])
    // 总条数
    const total = ref(0)
    // 选中的行
    const selectedRows = ref([])
    // 日期范围
    const dateRange = ref(null)

    // 搜索参数
    const searchParams = reactive({
      page: 1,
      page_size: 20,
      keyword: '',
      invoice_type: '',
      category: '',
      status: '',
      date_from: '',
      date_to: '',
      order_by: 'invoice_date',
      order: 'desc'
    })

    // 下拉选项
    const invoiceTypeOptions = ref([
      { value: 'vat_special', label: '增值税专用发票' },
      { value: 'vat_normal', label: '增值税普通发票' },
      { value: 'vat_electronic', label: '增值税电子普通发票' },
      { value: 'vat_electronic_special', label: '增值税电子专用发票' },
      { value: 'motor_vehicle', label: '机动车销售统一发票' },
      { value: 'train', label: '火车票' },
      { value: 'airline', label: '航空客票' },
      { value: 'taxi', label: '出租车发票' },
      { value: 'quota', label: '定额发票' },
      { value: 'other', label: '其他' }
    ])

    const categoryOptions = ref([
      { value: 'office', label: '办公用品' },
      { value: 'transport', label: '交通出行' },
      { value: 'catering', label: '餐饮住宿' },
      { value: 'communication', label: '通讯费' },
      { value: 'advertising', label: '广告宣传' },
      { value: 'training', label: '培训教育' },
      { value: 'travel', label: '差旅费' },
      { value: 'entertainment', label: '招待费' },
      { value: 'other', label: '其他' }
    ])

    const statusOptions = ref([
      { value: 'pending', label: '待审核' },
      { value: 'confirmed', label: '已确认' },
      { value: 'error', label: '识别异常' },
      { value: 'processing', label: '处理中' }
    ])

    // 方法引用
    const formatAmount = Helpers.formatAmount
    const formatDate = Helpers.formatDate
    const getInvoiceTypeName = Helpers.getInvoiceTypeName
    const getCategoryName = Helpers.getCategoryName
    const getInvoiceStatus = Helpers.getInvoiceStatus

    /**
     * 加载发票列表
     */
    const loadInvoices = async () => {
      loading.value = true
      try {
        const data = await Api.getInvoices(searchParams)
        if (data) {
          invoiceList.value = data.items || data.data || []
          total.value = data.total || data.count || invoiceList.value.length
        }
      } catch (err) {
        console.error('加载发票列表失败:', err)
        // 使用模拟数据
        const mockData = generateMockData()
        invoiceList.value = mockData
        total.value = mockData.length
      } finally {
        loading.value = false
      }
    }

    /**
     * 生成模拟数据（后端不可用时）
     */
    const generateMockData = () => {
      const types = ['vat_special', 'vat_normal', 'vat_electronic', 'train', 'taxi', 'airline']
      const categories = ['office', 'transport', 'catering', 'communication', 'travel', 'other']
      const statuses = ['pending', 'confirmed', 'error', 'processing']
      const data = []
      for (let i = 1; i <= 15; i++) {
        data.push({
          id: i,
          invoice_number: 'NO' + (120000000 + i * 1000 + Math.floor(Math.random() * 999)),
          invoice_type: types[Math.floor(Math.random() * types.length)],
          amount: Math.round(Math.random() * 10000 * 100) / 100,
          invoice_date: `2025-12-${String(Math.max(1, 28 - i)).padStart(2, '0')}`,
          category: categories[Math.floor(Math.random() * categories.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          seller_name: '测试公司' + (i % 5 + 1) + '有限公司',
          remark: ''
        })
      }
      return data
    }

    /**
     * 搜索
     */
    const handleSearch = () => {
      searchParams.page = 1
      loadInvoices()
    }

    /**
     * 重置搜索条件
     */
    const handleReset = () => {
      searchParams.keyword = ''
      searchParams.invoice_type = ''
      searchParams.category = ''
      searchParams.status = ''
      searchParams.date_from = ''
      searchParams.date_to = ''
      searchParams.order_by = 'invoice_date'
      searchParams.order = 'desc'
      dateRange.value = null
      handleSearch()
    }

    /**
     * 日期范围变化
     */
    const handleDateChange = (val) => {
      if (val && val.length === 2) {
        searchParams.date_from = val[0]
        searchParams.date_to = val[1]
      } else {
        searchParams.date_from = ''
        searchParams.date_to = ''
      }
      handleSearch()
    }

    /**
     * 分页大小变化
     */
    const handleSizeChange = (val) => {
      searchParams.page_size = val
      searchParams.page = 1
      loadInvoices()
    }

    /**
     * 页码变化
     */
    const handlePageChange = (val) => {
      searchParams.page = val
      loadInvoices()
    }

    /**
     * 多选变化
     */
    const handleSelectionChange = (rows) => {
      selectedRows.value = rows
    }

    /**
     * 删除单条发票
     */
    const handleDelete = async (row) => {
      try {
        await Helpers.showConfirm('确定要删除该发票吗？此操作不可恢复。', ElementPlus.ElMessageBox)
        await Api.deleteInvoice(row.id)
        Helpers.showSuccess('删除成功', ElementPlus.ElMessage)
        loadInvoices()
        emit('refresh')
      } catch (err) {
        if (err !== 'cancel') {
          Helpers.showError('删除失败: ' + err.message, ElementPlus.ElMessage)
        }
      }
    }

    /**
     * 批量删除
     */
    const handleBatchDelete = async () => {
      try {
        await Helpers.showConfirm(
          `确定要删除选中的 ${selectedRows.value.length} 条发票吗？此操作不可恢复。`,
          ElementPlus.ElMessageBox
        )
        const ids = selectedRows.value.map(row => row.id)
        await Api.batchDeleteInvoices(ids)
        Helpers.showSuccess(`成功删除 ${ids.length} 条发票`, ElementPlus.ElMessage)
        loadInvoices()
        emit('refresh')
      } catch (err) {
        if (err !== 'cancel') {
          Helpers.showError('批量删除失败: ' + err.message, ElementPlus.ElMessage)
        }
      }
    }

    /**
     * 导出数据
     */
    const handleExport = async (format) => {
      try {
        const blob = await Api.exportData({ format, ...searchParams })
        // 创建下载链接
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `发票数据_${Helpers.formatDate(new Date(), 'date')}.${format === 'excel' ? 'xlsx' : 'pdf'}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        Helpers.showSuccess('导出成功', ElementPlus.ElMessage)
      } catch (err) {
        Helpers.showError('导出失败: ' + err.message, ElementPlus.ElMessage)
      }
    }

    onMounted(() => {
      loadInvoices()
    })

    return {
      loading,
      invoiceList,
      total,
      selectedRows,
      dateRange,
      searchParams,
      SearchIcon,
      invoiceTypeOptions,
      categoryOptions,
      statusOptions,
      formatAmount,
      formatDate,
      getInvoiceTypeName,
      getCategoryName,
      getInvoiceStatus,
      handleSearch,
      handleReset,
      handleDateChange,
      handleSizeChange,
      handlePageChange,
      handleSelectionChange,
      handleDelete,
      handleBatchDelete,
      handleExport
    }
  }
}
