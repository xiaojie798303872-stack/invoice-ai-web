/**
 * 导航栏组件
 * 顶部固定导航栏，支持PC端和移动端响应式布局
 */

const NavbarComponent = {
  name: 'AppNavbar',
  props: {
    // 当前路由
    currentRoute: {
      type: String,
      default: 'dashboard'
    }
  },
  emits: ['navigate'],
  template: `
    <header class="app-header">
      <!-- 左侧：Logo和标题 -->
      <div class="header-left">
        <img src="assets/logo.svg" alt="Logo" class="header-logo" />
        <span class="header-title">发票AI智能管理系统</span>
      </div>

      <!-- 中间：PC端导航菜单 -->
      <nav class="nav-menu" v-if="!isMobile">
        <a
          v-for="route in routeList"
          :key="route.key"
          class="nav-item"
          :class="{ active: currentRoute === route.key }"
          href="javascript:void(0)"
          @click="handleNavigate(route.key)"
        >
          <el-icon><component :is="route.icon" /></el-icon>
          <span>{{ route.name }}</span>
        </a>
      </nav>

      <!-- 右侧：用户信息和移动端菜单按钮 -->
      <div class="header-right">
        <!-- 移动端汉堡菜单按钮 -->
        <button class="hamburger-btn" v-if="isMobile" @click="toggleMobileMenu">
          <el-icon :size="24"><component :is="mobileMenuOpen ? 'Close' : 'Menu'" /></el-icon>
        </button>
      </div>

      <!-- 移动端导航遮罩 -->
      <div
        class="mobile-nav-overlay"
        :class="{ show: mobileMenuOpen }"
        @click="closeMobileMenu"
      ></div>

      <!-- 移动端导航菜单 -->
      <div class="mobile-nav-menu" :class="{ show: mobileMenuOpen }">
        <div
          v-for="route in routeList"
          :key="route.key"
          class="mobile-nav-item"
          :class="{ active: currentRoute === route.key }"
          @click="handleMobileNavigate(route.key)"
        >
          <el-icon><component :is="route.icon" /></el-icon>
          <span>{{ route.name }}</span>
        </div>
      </div>
    </header>
  `,
  setup(props, { emit }) {
    const { ref, onMounted, onUnmounted } = Vue

    // 移动端菜单状态
    const mobileMenuOpen = ref(false)
    // 是否为移动端
    const isMobile = ref(false)

    // 路由列表
    const routeList = ref([
      { key: 'dashboard', name: '仪表盘', icon: 'Odometer' },
      { key: 'invoices', name: '发票管理', icon: 'Document' },
      { key: 'upload', name: '上传发票', icon: 'Upload' },
      { key: 'stats', name: '数据统计', icon: 'DataAnalysis' }
    ])

    // 检测屏幕宽度
    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 768
    }

    // 切换移动端菜单
    const toggleMobileMenu = () => {
      mobileMenuOpen.value = !mobileMenuOpen.value
    }

    // 关闭移动端菜单
    const closeMobileMenu = () => {
      mobileMenuOpen.value = false
    }

    // PC端导航点击
    const handleNavigate = (route) => {
      emit('navigate', route)
    }

    // 移动端导航点击
    const handleMobileNavigate = (route) => {
      mobileMenuOpen.value = false
      emit('navigate', route)
    }

    onMounted(() => {
      checkMobile()
      window.addEventListener('resize', checkMobile)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', checkMobile)
    })

    return {
      mobileMenuOpen,
      isMobile,
      routeList,
      toggleMobileMenu,
      closeMobileMenu,
      handleNavigate,
      handleMobileNavigate
    }
  }
}
