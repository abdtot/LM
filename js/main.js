/**
 * SeaStar Legal - نظام إدارة المحاماة المتكامل
 * الملف الرئيسي للتطبيق
 */

class SeaStarApp {
    constructor() {
        this.currentScreen = 'dashboard';
        this.screens = {};
        this.user = null;
        this.notifications = [];
        this.init();
    }

    async init() {
        console.log('🚀 بدء تشغيل SeaStar Legal...');
        
        // إظهار شاشة التحميل
        this.showSplashScreen();
        
        try {
            // انتظار تحميل قاعدة البيانات
            await this.initDatabase();
            
            // التحقق من حالة تسجيل الدخول
            await this.checkAuth();
            
            // تحميل الإعدادات
            await this.loadSettings();
            
            // تهيئة واجهة المستخدم
            this.initUI();
            
            // تحميل الشاشات
            await this.loadScreens();
            
            // بدء المهام الخلفية
            this.startBackgroundTasks();
            
            // إخفاء شاشة التحميل
            this.hideSplashScreen();
            
            console.log('✅ تم تشغيل التطبيق بنجاح');
            
        } catch (error) {
            console.error('❌ خطأ في تشغيل التطبيق:', error);
            this.showError('حدث خطأ في تشغيل التطبيق');
        }
    }

    async initDatabase() {
        // تهيئة قاعدة البيانات من database.js
        if (window.db) {
            await window.db.init();
        }
    }

    async checkAuth() {
        // التحقق من وجود مستخدم مسجل الدخول
        const savedUser = localStorage.getItem('seastar-user');
        
        if (savedUser) {
            this.user = JSON.parse(savedUser);
            document.getElementById('mainApp').style.display = 'flex';
            document.getElementById('loginScreen').style.display = 'none';
        } else {
            document.getElementById('mainApp').style.display = 'none';
            document.getElementById('loginScreen').style.display = 'block';
            
            // تحميل شاشة تسجيل الدخول
            if (window.loginScreen) {
                await window.loginScreen.init();
            }
        }
    }

    async loadSettings() {
        // تحميل الإعدادات من قاعدة البيانات
        if (window.db) {
            this.settings = await window.db.getSettings() || {};
        }
    }

    initUI() {
        // تهيئة القائمة الجانبية
        this.initSideMenu();
        
        // تهيئة شريط التنقل السفلي
        this.initBottomNav();
        
        // تهيئة زر الإجراء السريع
        this.initFAB();
        
        // تهيئة مستمعي الأحداث
        this.initEventListeners();
        
        // تحديث بيانات المستخدم
        this.updateUserInfo();
    }

    initSideMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const closeMenu = document.getElementById('closeMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        const sideMenu = document.getElementById('sideMenu');
        
        menuToggle?.addEventListener('click', () => {
            sideMenu.classList.add('open');
            menuOverlay.classList.add('active');
        });
        
        closeMenu?.addEventListener('click', () => {
            sideMenu.classList.remove('open');
            menuOverlay.classList.remove('active');
        });
        
        menuOverlay?.addEventListener('click', () => {
            sideMenu.classList.remove('open');
            menuOverlay.classList.remove('active');
        });
        
        // مستمع لعناصر القائمة
        document.querySelectorAll('.menu-item[data-screen]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const screen = item.dataset.screen;
                this.navigateTo(screen);
                sideMenu.classList.remove('open');
                menuOverlay.classList.remove('active');
            });
        });
    }

    initBottomNav() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const screen = item.dataset.screen;
                this.navigateTo(screen);
            });
        });
    }

    initFAB() {
        const fabMain = document.getElementById('fabMain');
        const fabMenu = document.getElementById('fabMenu');
        
        fabMain?.addEventListener('click', () => {
            fabMain.classList.toggle('rotate');
            fabMenu.classList.toggle('show');
        });
        
        // إغلاق القائمة عند النقر خارجها
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.fab-container')) {
                fabMain?.classList.remove('rotate');
                fabMenu?.classList.remove('show');
            }
        });
        
        // معالجة إجراءات FAB
        document.querySelectorAll('.fab-item[data-action]').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                this.handleFABAction(action);
                fabMain?.classList.remove('rotate');
                fabMenu?.classList.remove('show');
            });
        });
    }

    initEventListeners() {
        // زر الإشعارات
        document.getElementById('notificationBtn')?.addEventListener('click', () => {
            this.showNotifications();
        });
        
        // زر قائمة المستخدم
        document.getElementById('userMenuBtn')?.addEventListener('click', () => {
            this.navigateTo('settings');
        });
        
        // زر تسجيل الخروج
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });
        
        // دعم السحب للإغلاق (للموبايل)
        this.initSwipeGestures();
        
        // معالجة أزرار الرجوع
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.screen) {
                this.navigateTo(e.state.screen, false);
            }
        });
    }

    initSwipeGestures() {
        const mainContent = document.getElementById('mainContent');
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        
        if (mainContent && window.Hammer) {
            const mc = new Hammer(mainContent);
            
            // سحب لليمين لفتح القائمة
            mc.on('swiperight', () => {
                sideMenu?.classList.add('open');
                menuOverlay?.classList.add('active');
            });
            
            // سحب لليسار لإغلاق القائمة
            mc.on('swipeleft', () => {
                sideMenu?.classList.remove('open');
                menuOverlay?.classList.remove('active');
            });
        }
    }

    async loadScreens() {
        // تسجيل جميع الشاشات
        this.screens = {
            dashboard: window.dashboardScreen,
            cases: window.casesScreen,
            sessions: window.sessionsScreen,
            clients: window.clientsScreen,
            documents: window.documentsScreen,
            financial: window.financialScreen,
            reports: window.reportsScreen,
            settings: window.settingsScreen
        };
        
        // تحميل الشاشة الحالية
        await this.loadScreen(this.currentScreen);
    }

    async loadScreen(screenName) {
        const screen = this.screens[screenName];
        if (screen) {
            const content = await screen.render();
            document.getElementById('mainContent').innerHTML = content;
            await screen.init();
            
            // تحديث العنوان في الهيدر
            this.updateHeaderTitle(screenName);
        }
    }

    async navigateTo(screen, addToHistory = true) {
        if (screen === this.currentScreen) return;
        
        // تحديث الحالة
        this.currentScreen = screen;
        
        // تحديث العناصر النشطة
        this.updateActiveNavItems(screen);
        
        // تحميل الشاشة
        await this.loadScreen(screen);
        
        // إضافة إلى تاريخ التصفح
        if (addToHistory) {
            history.pushState({ screen }, '', `#${screen}`);
        }
        
        // تمرير لأعلى الصفحة
        document.getElementById('mainContent')?.scrollTo(0, 0);
    }

    updateActiveNavItems(screen) {
        // تحديث عناصر القائمة الجانبية
        document.querySelectorAll('.menu-item[data-screen]').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.screen === screen) {
                item.classList.add('active');
            }
        });
        
        // تحديث شريط التنقل السفلي
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.screen === screen) {
                item.classList.add('active');
            }
        });
    }

    updateHeaderTitle(screen) {
        const titles = {
            dashboard: 'الرئيسية',
            cases: 'إدارة القضايا',
            sessions: 'جدول الجلسات',
            clients: 'الموكلين',
            documents: 'المستندات القانونية',
            financial: 'الرصيد والرسوم',
            reports: 'التقارير والإحصائيات',
            settings: 'الإعدادات'
        };
        
        // يمكن إضافة تحديث عنوان الصفحة هنا
        document.title = `SeaStar - ${titles[screen]}`;
    }

    updateUserInfo() {
        if (this.user) {
            document.getElementById('userName').textContent = this.user.name;
            document.getElementById('userRole').textContent = this.user.role;
            
            if (this.user.avatar) {
                document.getElementById('userAvatar').src = this.user.avatar;
                document.querySelector('.menu-avatar').src = this.user.avatar;
            }
        }
    }

    async handleFABAction(action) {
        switch (action) {
            case 'newCase':
                this.showModal('caseModal');
                break;
            case 'newClient':
                this.showModal('clientModal');
                break;
            case 'newSession':
                this.showModal('sessionModal');
                break;
            case 'newDocument':
                this.showModal('documentModal');
                break;
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    showNotifications() {
        // عرض لوحة الإشعارات
        this.showModal('notificationsModal');
        
        // تحديث الإشعارات
        if (window.notificationsScreen) {
            window.notificationsScreen.render();
        }
    }

    async logout() {
        const confirmed = await this.showConfirm('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟');
        
        if (confirmed) {
            localStorage.removeItem('seastar-user');
            this.user = null;
            
            document.getElementById('mainApp').style.display = 'none';
            document.getElementById('loginScreen').style.display = 'block';
            
            if (window.loginScreen) {
                await window.loginScreen.init();
            }
        }
    }

    showSplashScreen() {
        document.getElementById('splashScreen').classList.remove('hide');
    }

    hideSplashScreen() {
        setTimeout(() => {
            document.getElementById('splashScreen').classList.add('hide');
        }, 2000);
    }

    showError(message) {
        // عرض رسالة خطأ
        alert(message);
    }

    showConfirm(title, message) {
        return new Promise((resolve) => {
            const result = confirm(message);
            resolve(result);
        });
    }

    async startBackgroundTasks() {
        // تحديث الإحصائيات كل 5 دقائق
        setInterval(async () => {
            await this.updateStats();
        }, 5 * 60 * 1000);
        
        // التحقق من الجلسات القادمة كل ساعة
        setInterval(async () => {
            await this.checkUpcomingSessions();
        }, 60 * 60 * 1000);
        
        // مزامنة البيانات كل ساعة
        setInterval(async () => {
            await this.syncData();
        }, 60 * 60 * 1000);
    }

    async updateStats() {
        // تحديث الإحصائيات في الشاشة الحالية
        if (this.currentScreen === 'dashboard' && window.dashboardScreen) {
            await window.dashboardScreen.updateStats();
        }
    }

    async checkUpcomingSessions() {
        // التحقق من الجلسات القادمة
        if (window.db) {
            const sessions = await window.db.getUpcomingSessions();
            
            if (sessions.length > 0) {
                this.notifications = sessions;
                this.updateNotificationBadge(sessions.length);
                
                // عرض إشعار للمستخدم
                this.showNotification(`لديك ${sessions.length} جلسة قادمة`, 'info');
            }
        }
    }

    async syncData() {
        // مزامنة البيانات مع الخادم (إذا كان متصلاً)
        if (navigator.onLine && this.settings.autoSync) {
            console.log('🔄 بدء مزامنة البيانات...');
            // هنا يمكن إضافة كود المزامنة مع الخادم
        }
    }

    updateNotificationBadge(count) {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    showNotification(message, type = 'info') {
        // إنشاء عنصر الإشعار
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // إزالة الإشعار بعد 3 ثوان
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// تهيئة التطبيق
const app = new SeaStarApp();
window.app = app;
