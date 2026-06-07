/**
 * 发票详情/编辑组件
 * 使用抽屉(Drawer)展示发票完整信息，支持编辑模式
 */

const InvoiceDetailComponent = {
  name: 'InvoiceDetail',
  emits: ['updated', 'deleted'],
  template: `
    <!-- 发票详情抽屉 -->
    <el-drawer
      v-model="visible"
      :title="isEditing ? '编辑发票' : '发票详情'"
      direction="rtl"
      size="520px"
      :before-close="handleClose"
    >
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-mask">
        <el-icon class="is-loading" :size="32" color="#409EFF"><component is="Loading" /></el-icon>
      </div>

      <div v-else-if="invoiceData">
        <!-- 操作按钮 -->
        <div style="display: flex; gap: 8px; margin-bottom: 20px;">
          <el-button v-if="!isEditing" type="primary" @click="enterEditMode">
            <el-icon><component is="Edit" /></el-icon> 编辑
          </el-button>
          <el-button v-if="isEditing" type="success" @click="handleSave" :loading="saving">
            <el-icon><component is="Check" /></el-icon> 保存
          </el-button>
          <el-button v-if="isEditing" @click="cancelEdit">
            <el-icon><component is="Close" /></el-icon> 取消
          </el-button>
          <el-button type="warning" @click="handleReOcr" :loading="reOcring">
            <el-icon><component is="Refresh" /></el-icon> 重新OCR
          </el-button>
        </div>

        <!-- 基本信息 -->
        <div class="detail-section">
          <div class="detail-section-title">基本信息</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">发票号码</span>
              <el-input v-if="isEditing" v-model="editData.invoice_number" placeholder="请输入发票号码" />
              <span v-else class="detail-value">{{ invoiceData.invoice_number || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">发票代码</span>
              <el-input v-if="isEditing" v-model="editData.invoice_code" placeholder="请输入发票代码" />
              <span v-else class="detail-value">{{ invoiceData.invoice_code || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">发票类型</span>
              <el-select v-if="isEditing" v-model="editData.invoice_type" placeholder="请选择">
                <el-option v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
              <span v-else class="detail-value">{{ getInvoiceTypeName(invoiceData.invoice_type) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">发票日期</span>
              <el-date-picker
                v-if="isEditing"
                v-model="editData.invoice_date"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                style="width: 100%;"
              />
              <span v-else class="detail-value">{{ formatDate(invoiceData.invoice_date) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">金额（元）</span>
              <el-input-number
                v-if="isEditing"
                v-model="editData.amount"
                :precision="2"
                :min="0"
                :step="0.01"
                controls-position="right"
                style="width: 100%;"
              />
              <span v-else class="detail-value" style="color: #f56c6c; font-weight: 700;">
                {{ formatAmount(invoiceData.amount) }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">税额（元）</span>
              <el-input-number
                v-if="isEditing"
                v-model="editData.tax_amount"
                :precision="2"
                :min="0"
                :step="0.01"
                controls-position="right"
                style="width: 100%;"
              />
              <span v-else class="detail-value">{{ formatAmount(invoiceData.tax_amount) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">分类</span>
              <el-select v-if="isEditing" v-model="editData.category" placeholder="请选择分类">
                <el-option v-for="c in categoryOptions" :key="c.value" :label="c.label" :value="c.value" />
              </el-select>
              <span v-else class="detail-value">{{ getCategoryName(invoiceData.category) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">状态</span>
              <el-select v-if="isEditing" v-model="editData.status" placeholder="请选择状态">
                <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
              <span v-else class="detail-value">
                <span class="status-tag" :class="getInvoiceStatus(invoiceData.status).className">
                  {{ getInvoiceStatus(invoiceData.status).label }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- 开票信息 -->
        <div class="detail-section">
          <div class="detail-section-title">开票信息</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">销售方名称</span>
              <el-input v-if="isEditing" v-model="editData.seller_name" placeholder="请输入" />
              <span v-else class="detail-value">{{ invoiceData.seller_name || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">销售方税号</span>
              <el-input v-if="isEditing" v-model="editData.seller_tax_number" placeholder="请输入" />
              <span v-else class="detail-value">{{ invoiceData.seller_tax_number || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">购买方名称</span>
              <el-input v-if="isEditing" v-model="editData.buyer_name" placeholder="请输入" />
              <span v-else class="detail-value">{{ invoiceData.buyer_name || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">购买方税号</span>
              <el-input v-if="isEditing" v-model="editData.buyer_tax_number" placeholder="请输入" />
              <span v-else class="detail-value">{{ invoiceData.buyer_tax_number || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 备注 -->
        <div class="detail-section">
          <div class="detail-section-title">备注</div>
          <el-input
            v-if="isEditing"
            v-model="editData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
          <div v-else class="detail-value">{{ invoiceData.remark || '无' }}</div>
        </div>

        <!-- OCR原始文本 -->
        <div class="detail-section" v-if="invoiceData.ocr_text">
          <div class="detail-section-title">
            OCR识别原文
            <el-button text type="info" size="small" @click="ocrTextExpanded = !ocrTextExpanded">
              {{ ocrTextExpanded ? '收起' : '展开' }}
            </el-button>
          </div>
          <div class="ocr-text-box" :style="{ maxHeight: ocrTextExpanded ? '600px' : '150px' }">
            {{ invoiceData.ocr_text }}
          </div>
        </div>

        <!-- 系统信息 -->
        <div class="detail-section">
          <div class="detail-section-title">系统信息</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">创建时间</span>
              <span class="detail-value">{{ formatDate(invoiceData.created_at, 'datetime') }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">更新时间</span>
              <span class="detail-value">{{ formatDate(invoiceData.updated_at, 'datetime') }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  `,
  setup(props, { emit }) {
    const { ref, watch, nextTick } = Vue

    // 抽屉可见性
    const visible = ref(false)
    // 加载状态
    const loading = ref(false)
    // 保存中
    const saving = ref(false)
    // 重新OCR中
    const reOcring = ref(false)
    // 是否编辑模式
    const isEditing = ref(false)
    // OCR文本展开状态
    const ocrTextExpanded = ref(false)
    // 发票数据
    const invoiceData = ref(null)
    // 编辑数据副本
    const editData = ref({})
    // 当前发票ID
    const currentId = ref(null)

    // 下拉选项
    const typeOptions = ref([
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
     * 打开详情抽屉
     * @param {number|string} id - 发票ID
     * @param {boolean} editMode - 是否直接进入编辑模式
     */
    const open = async (id, editMode = false) => {
      currentId.value = id
      visible.value = true
      isEditing.value = editMode
      ocrTextExpanded.value = false
      await loadInvoice()
    }

    /**
     * 加载发票详情
     */
    const loadInvoice = async () => {
      if (!currentId.value) return
      loading.value = true
      try {
        const data = await Api.getInvoice(currentId.value)
        invoiceData.value = data || {}
      } catch (err) {
        console.error('加载发票详情失败:', err)
        // 模拟数据
        invoiceData.value = {
          id: currentId.value,
          invoice_number: 'NO1202456001',
          invoice_code: '011002100311',
          invoice_type: 'vat_special',
          invoice_date: '2025-12-20',
          amount: 5680.00,
          tax_amount: 738.40,
          category: 'office',
          status: 'pending',
          seller_name: '北京测试科技有限公司',
          seller_tax_number: '91110108MA01XXXXX',
          buyer_name: '上海示例贸易有限公司',
          buyer_tax_number: '91310115MA1HXXXXX',
          remark: '采购办公设备',
          ocr_text: '发票代码：011002100311\n发票号码：1202456001\n开票日期：2025年12月20日\n金额：5680.00\n税额：738.40\n价税合计：6418.40\n销售方：北京测试科技有限公司',
          created_at: '2025-12-20 14:30:00',
          updated_at: '2025-12-20 14:30:00'
        }
      } finally {
        loading.value = false
        if (isEditing.value) {
          enterEditMode()
        }
      }
    }

    /**
     * 进入编辑模式
     */
    const enterEditMode = () => {
      editData.value = Helpers.deepClone(invoiceData.value)
      isEditing.value = true
    }

    /**
     * 取消编辑
     */
    const cancelEdit = () => {
      isEditing.value = false
      editData.value = {}
    }

    /**
     * 保存编辑
     */
    const handleSave = async () => {
      saving.value = true
      try {
        const data = await Api.updateInvoice(currentId.value, editData.value)
        invoiceData.value = data || editData.value
        isEditing.value = false
        Helpers.showSuccess('保存成功', ElementPlus.ElMessage)
        emit('updated')
      } catch (err) {
        Helpers.showError('保存失败: ' + err.message, ElementPlus.ElMessage)
      } finally {
        saving.value = false
      }
    }

    /**
     * 重新OCR识别
     */
    const handleReOcr = async () => {
      try {
        await Helpers.showConfirm('确定要重新进行OCR识别吗？', ElementPlus.ElMessageBox)
        reOcring.value = true
        const data = await Api.reOcrInvoice(currentId.value)
        invoiceData.value = data || invoiceData.value
        Helpers.showSuccess('OCR识别完成', ElementPlus.ElMessage)
        emit('updated')
      } catch (err) {
        if (err !== 'cancel') {
          Helpers.showError('OCR识别失败: ' + err.message, ElementPlus.ElMessage)
        }
      } finally {
        reOcring.value = false
      }
    }

    /**
     * 关闭抽屉
     */
    const handleClose = () => {
      if (isEditing.value) {
        Helpers.showConfirm('正在编辑中，确定要关闭吗？未保存的更改将丢失。', ElementPlus.ElMessageBox)
          .then(() => {
            isEditing.value = false
            visible.value = false
          })
          .catch(() => {})
      } else {
        visible.value = false
      }
    }

    return {
      visible,
      loading,
      saving,
      reOcring,
      isEditing,
      ocrTextExpanded,
      invoiceData,
      editData,
      typeOptions,
      categoryOptions,
      statusOptions,
      formatAmount,
      formatDate,
      getInvoiceTypeName,
      getCategoryName,
      getInvoiceStatus,
      open,
      enterEditMode,
      cancelEdit,
      handleSave,
      handleReOcr,
      handleClose
    }
  }
}
