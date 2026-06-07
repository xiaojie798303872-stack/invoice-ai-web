/**
 * 上传组件
 * 支持拖拽上传、多文件上传、进度显示、结果预览
 */

const UploadComponent = {
  name: 'InvoiceUpload',
  template: `
    <div class="upload-page">
      <!-- 页面标题 -->
      <div class="page-title">
        <el-icon><component is="Upload" /></el-icon>
        上传发票
      </div>

      <!-- 上传区域 -->
      <div class="page-card">
        <div
          class="upload-area"
          :class="{ dragging: isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <div class="upload-icon">
            <el-icon :size="64"><component is="UploadFilled" /></el-icon>
          </div>
          <div class="upload-title">将发票文件拖拽到此处，或点击选择文件</div>
          <div class="upload-hint">支持批量上传，系统将自动进行OCR识别</div>
          <div class="upload-formats">
            <span class="upload-format-tag">JPG</span>
            <span class="upload-format-tag">PNG</span>
            <span class="upload-format-tag">PDF</span>
            <span class="upload-format-tag">JPEG</span>
          </div>
          <div style="margin-top: 16px;">
            <el-button type="primary" size="large">
              <el-icon><component is="FolderOpened" /></el-icon> 选择文件
            </el-button>
          </div>
          <input
            ref="fileInputRef"
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf"
            style="display: none;"
            @change="handleFileSelect"
          />
        </div>
      </div>

      <!-- 上传进度列表 -->
      <div v-if="uploadList.length > 0" class="page-card">
        <div class="card-header">
          <div class="card-header-title">
            <el-icon><component is="List" /></el-icon>
            上传进度 ({{ uploadList.length }} 个文件)
          </div>
          <el-button text type="info" @click="clearCompleted" v-if="hasCompletedItems">
            清除已完成
          </el-button>
        </div>

        <div class="upload-progress-list">
          <div
            v-for="(item, index) in uploadList"
            :key="item.uid"
            class="upload-progress-item"
          >
            <!-- 文件图标 -->
            <el-icon :size="24" :color="getFileIconColor(item.status)">
              <component :is="getFileIcon(item.status)" />
            </el-icon>

            <!-- 文件信息 -->
            <div style="flex: 1; min-width: 0;">
              <div class="upload-file-name">{{ item.file.name }}</div>
              <div style="font-size: 12px; color: #909399;">
                {{ formatFileSize(item.file.size) }}
              </div>
              <!-- 进度条 -->
              <el-progress
                v-if="item.status === 'uploading'"
                :percentage="item.progress"
                :stroke-width="4"
                :show-text="true"
                status="default"
                style="margin-top: 4px;"
              />
            </div>

            <!-- 状态文字 -->
            <div class="upload-file-status" :class="item.status">
              <template v-if="item.status === 'waiting'">等待中</template>
              <template v-else-if="item.status === 'uploading'">上传中 {{ item.progress }}%</template>
              <template v-else-if="item.status === 'success'">识别完成</template>
              <template v-else-if="item.status === 'error'">失败</template>
            </div>

            <!-- 删除按钮 -->
            <el-button
              v-if="item.status !== 'uploading'"
              type="danger"
              link
              size="small"
              @click="removeUploadItem(index)"
            >
              <el-icon><component is="Close" /></el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 上传结果预览 -->
      <div v-if="uploadResults.length > 0" class="page-card">
        <div class="card-header">
          <div class="card-header-title">
            <el-icon><component is="CircleCheck" /></el-icon>
            识别结果预览
          </div>
          <el-button type="primary" @click="$emit('navigate', 'invoices')">
            查看全部发票 <el-icon><component is="ArrowRight" /></el-icon>
          </el-button>
        </div>

        <div
          v-for="(result, index) in uploadResults"
          :key="'result-' + index"
          class="upload-result-card"
        >
          <div class="upload-result-header">
            <div class="upload-result-title">
              <el-icon color="#67C23A"><component is="Document" /></el-icon>
              {{ result.file_name || '发票' + (index + 1) }}
            </div>
            <span class="status-tag" :class="result.status || 'confirmed'">
              {{ result.status === 'error' ? '识别异常' : '已识别' }}
            </span>
          </div>
          <div class="upload-result-info">
            <div class="upload-result-item">
              <span>发票号码：</span>{{ result.invoice_number || '-' }}
            </div>
            <div class="upload-result-item">
              <span>发票类型：</span>{{ getInvoiceTypeName(result.invoice_type) }}
            </div>
            <div class="upload-result-item">
              <span>金额：</span>{{ formatAmount(result.amount) }}
            </div>
            <div class="upload-result-item">
              <span>日期：</span>{{ formatDate(result.invoice_date) }}
            </div>
            <div class="upload-result-item">
              <span>销售方：</span>{{ result.seller_name || '-' }}
            </div>
            <div class="upload-result-item">
              <span>分类：</span>{{ getCategoryName(result.category) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  emits: ['navigate', 'uploaded'],
  setup(props, { emit }) {
    const { ref, computed } = Vue

    // 文件输入引用
    const fileInputRef = ref(null)
    // 拖拽状态
    const isDragging = ref(false)
    // 上传列表
    const uploadList = ref([])
    // 上传结果
    const uploadResults = ref([])

    // 方法引用
    const formatAmount = Helpers.formatAmount
    const formatDate = Helpers.formatDate
    const formatFileSize = Helpers.formatFileSize
    const getInvoiceTypeName = Helpers.getInvoiceTypeName
    const getCategoryName = Helpers.getCategoryName

    // 是否有已完成的项目
    const hasCompletedItems = computed(() => {
      return uploadList.value.some(item => item.status === 'success' || item.status === 'error')
    })

    /**
     * 获取文件图标
     */
    const getFileIcon = (status) => {
      const iconMap = {
        waiting: 'Clock',
        uploading: 'Loading',
        success: 'CircleCheck',
        error: 'CircleClose'
      }
      return iconMap[status] || 'Document'
    }

    /**
     * 获取文件图标颜色
     */
    const getFileIconColor = (status) => {
      const colorMap = {
        waiting: '#909399',
        uploading: '#409EFF',
        success: '#67C23A',
        error: '#F56C6C'
      }
      return colorMap[status] || '#909399'
    }

    /**
     * 触发文件选择
     */
    const triggerFileInput = () => {
      fileInputRef.value && fileInputRef.value.click()
    }

    /**
     * 处理文件选择
     */
    const handleFileSelect = (event) => {
      const files = event.target.files
      if (files && files.length > 0) {
        addFiles(files)
      }
      // 重置input，允许重复选择同一文件
      event.target.value = ''
    }

    /**
     * 处理拖拽放下
     */
    const handleDrop = (event) => {
      isDragging.value = false
      const files = event.dataTransfer.files
      if (files && files.length > 0) {
        addFiles(files)
      }
    }

    /**
     * 添加文件到上传列表
     */
    const addFiles = (files) => {
      const validFiles = []
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (allowedTypes.includes(file.type) || /\.(jpg|jpeg|png|pdf)$/i.test(file.name)) {
          validFiles.push(file)
        } else {
          Helpers.showError(`文件 "${file.name}" 格式不支持`, ElementPlus.ElMessage)
        }
      }

      if (validFiles.length === 0) return

      // 添加到上传列表
      validFiles.forEach(file => {
        uploadList.value.push({
          uid: Helpers.generateId(),
          file: file,
          progress: 0,
          status: 'waiting'
        })
      })

      // 开始上传
      processUploadQueue()
    }

    /**
     * 处理上传队列（逐个上传）
     */
    const processUploadQueue = async () => {
      const waitingItems = uploadList.value.filter(item => item.status === 'waiting')
      for (const item of waitingItems) {
        await uploadSingleFile(item)
      }
    }

    /**
     * 上传单个文件
     */
    const uploadSingleFile = async (item) => {
      item.status = 'uploading'
      item.progress = 0

      const formData = new FormData()
      formData.append('files', item.file)

      try {
        const result = await Api.uploadInvoice(formData, (progressEvent) => {
          if (progressEvent.total) {
            item.progress = Math.round((progressEvent.loaded / progressEvent.total) * 100)
          }
        })

        item.status = 'success'
        item.progress = 100

        // 添加到结果列表
        if (result) {
          uploadResults.value.unshift({
            file_name: item.file.name,
            ...(result.invoice || result.data || result)
          })
        }

        emit('uploaded')
        Helpers.showSuccess(`${item.file.name} 上传成功`, ElementPlus.ElMessage)
      } catch (err) {
        item.status = 'error'
        Helpers.showError(`${item.file.name} 上传失败: ${err.message}`, ElementPlus.ElMessage)
      }
    }

    /**
     * 移除上传项
     */
    const removeUploadItem = (index) => {
      uploadList.value.splice(index, 1)
    }

    /**
     * 清除已完成的项目
     */
    const clearCompleted = () => {
      uploadList.value = uploadList.value.filter(
        item => item.status !== 'success' && item.status !== 'error'
      )
    }

    return {
      fileInputRef,
      isDragging,
      uploadList,
      uploadResults,
      hasCompletedItems,
      formatAmount,
      formatDate,
      formatFileSize,
      getInvoiceTypeName,
      getCategoryName,
      getFileIcon,
      getFileIconColor,
      triggerFileInput,
      handleFileSelect,
      handleDrop,
      removeUploadItem,
      clearCompleted
    }
  }
}
