/**
 * Vue应用主入口
 * 初始化Vue应用，组合所有组件，管理全局状态
 */

const App = Vue.createApp({
  template: `
    <div class="app-container">
      <!-- 顶部导航栏 -->
      <app-navbar
        :current-route="currentRoute"
        @navigate="handleNavigate"
      />

      <!-- 主内容区域 -->
      <main class="app-main">
        <!-- 仪表盘页面 -->
        <dashboard-component
          v-if="currentRoute === 'dashboard'"
          @navigate="handleNavigate"
          @view-invoice="handleViewInvoice"
        />

        <!-- 发票列表页面 -->
        <invoice-list-component
          v-if="currentRoute === 'invoices'"
          @view-invoice="handleViewInvoice"
          @refresh="handleRefresh"
        />

        <!-- 上传页面 -->
        <upload-component
          v-if="currentRoute === 'upload'"
          @navigate="handleNavigate"
          @uploaded="handleUploaded"
        />

        <!-- 统计页面 -->
        <stats-component
          v-if="currentRoute === 'stats'"
        />
      </main>

      <!-- 发票详情抽屉（全局组件） -->
      <invoice-detail-component
        ref="invoiceDetailRef"
        @updated="handleDetailUpdated"
        @deleted="handleDetailDeleted"
      />
    </div>
  `,
  setup() {
    const { ref, onMounted } = Vue

    // 当前路由
    const currentRoute = ref('dashboard')
    // 发票详情组件引用
    const invoiceDetailRef = ref(null)

    /**
     * 处理导航事件
     */
    const handleNavigate = (route) => {
      Router.push(route)
    }

    /**
     * 处理查看发票详情
     * @param {number|string} id - 发票ID
     * @param {boolean} editMode - 是否编辑模式
     */
    const handleViewInvoice = (id, editMode = false) => {
      if (invoiceDetailRef.value) {
        invoiceDetailRef.value.open(id, editMode)
      }
    }

    /**
     * 发票详情更新后的回调
     */
    const handleDetailUpdated = () => {
      // 如果在发票列表页面，刷新列表
      // 由于组件使用v-if，重新进入时会自动加载
      console.log('发票信息已更新')
    }

    /**
     * 发票删除后的回调
     */
    const handleDetailDeleted = () => {
      console.log('发票已删除')
    }

    /**
     * 刷新当前页面数据
     */
    const handleRefresh = () => {
      // 通过重新切换路由来刷新
      const route = currentRoute.value
      currentRoute.value = ''
      Vue.nextTick(() => {
        currentRoute.value = route
      })
    }

    /**
     * 上传完成后的回调
     */
    const handleUploaded = () => {
      console.log('发票上传完成')
    }

    onMounted(() => {
      // 初始化路由
      Router.init()

      // 监听路由变化
      Router.onRouteChange((route) => {
        currentRoute.value = route
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })

      // 设置初始路由
      currentRoute.value = Router.getCurrentRoute()
    })

    return {
      currentRoute,
      invoiceDetailRef,
      handleNavigate,
      handleViewInvoice,
      handleDetailUpdated,
      handleDetailDeleted,
      handleRefresh,
      handleUploaded
    }
  }
})

// 注册所有组件
App.component('app-navbar', NavbarComponent)
App.component('dashboard-component', DashboardComponent)
App.component('invoice-list-component', InvoiceListComponent)
App.component('invoice-detail-component', InvoiceDetailComponent)
App.component('upload-component', UploadComponent)
App.component('stats-component', StatsComponent)

// 注册所有Element Plus图标（全局可用）
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  App.component(key, component)
}

// 使用Element Plus
App.use(ElementPlus, { locale: ElementPlusLocaleZhCn })

// 挂载应用
App.mount('#app')
