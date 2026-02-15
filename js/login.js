/**
 * SeaStar Login Screen - شاشة تسجيل الدخول
 */

const loginScreen = {
    // البيانات
    currentTab: 'login',
    loginAttempts: 0,
    lastAttempt: null,
    
    // تهيئة الشاشة
    async init() {
        console.log('📱 تهيئة شاشة تسجيل الدخول...');
        
        // إضافة مستمعي الأحداث
        this.initEventListeners();
        
        // التحقق من وجود جلسة سابقة
        this.checkSavedCredentials();
        
        // إضافة تأثيرات بصرية
        this.initVisualEffects();
        
        // تفعيل التبويب النشط
        this.switchTab('login');
    },
    
    initEventListeners() {
        // التبويبات
        document.querySelectorAll('.login-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // نموذج تسجيل الدخول
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // نموذج إنشاء حساب
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
        
        // زر نسيت كلمة المرور
        document.getElementById('forgotPasswordBtn').addEventListener('click', () => {
            this.showForgotPassword();
        });
        
        // قوة كلمة المرور
        document.getElementById('regPassword').addEventListener('input', (e) => {
            this.checkPasswordStrength(e.target.value);
        });
        
        // تأكيد كلمة المرور
        document.getElementById('confirmPassword').addEventListener('input', (e) => {
            this.checkPasswordMatch();
        });
        
        // منع النقر بزر الرجوع
        window.addEventListener('popstate', (e) => {
            if (document.getElementById('loginScreen').style.display !== 'none') {
                e.preventDefault();
                this.showExitConfirm();
            }
        });
    },
    
    initVisualEffects() {
        // تأثير التركيز على الحقول
        document.querySelectorAll('.form-input').forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                input.parentElement.classList.remove('focused');
            });
        });
        
        // تأثيرات الحركة للخلفية
        this.animateBackground();
    },
    
    animateBackground() {
        const shapes = document.querySelectorAll('.login-background .shape');
        shapes.forEach((shape, index) => {
            shape.style.animation = `float ${8 + index * 2}s ease-in-out infinite`;
        });
    },
    
    // تبديل التبويبات
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // تحديث التبويبات
        document.querySelectorAll('.login-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            }
        });
        
        // تحديث النماذج
        document.querySelectorAll('.login-form').forEach(form => {
            form.classList.remove('active');
        });
        
        document.getElementById(tabName === 'login' ? 'loginForm' : 'registerForm').classList.add('active');
        
        // إعادة تعيين الرسائل
        this.clearMessages();
    },
    
    // معالجة تسجيل الدخول
    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // التحقق من المدخلات
        if (!username || !password) {
            this.showError('يرجى إدخال اسم المستخدم وكلمة المرور');
            return;
        }
        
        // التحقق من محاولات تسجيل الدخول الفاشلة
        if (this.isBlocked()) {
            this.showError(`تم حظر تسجيل الدخول مؤقتاً. حاول بعد ${this.getBlockTime()} دقائق`);
            return;
        }
        
        try {
            // إظهار حالة التحميل
            this.showLoading(true);
            
            // محاولة تسجيل الدخول
            const result = await window.auth.login(username, password);
            
            if (result.success) {
                // حفظ بيانات تسجيل الدخول إذا طلب المستخدم
                if (rememberMe) {
                    this.saveCredentials(username, password);
                } else {
                    this.clearSavedCredentials();
                }
                
                // إعادة تعيين محاولات تسجيل الدخول
                this.resetLoginAttempts();
                
                // إخفاء شاشة التحميل
                this.showLoading(false);
                
                // الانتقال إلى التطبيق الرئيسي
                this.showSuccess('تم تسجيل الدخول بنجاح');
                
                setTimeout(() => {
                    document.getElementById('loginScreen').style.display = 'none';
                    document.getElementById('mainApp').style.display = 'flex';
                    
                    // تحديث معلومات المستخدم
                    if (window.app) {
                        window.app.user = result.user;
                        window.app.updateUserInfo();
                    }
                }, 1000);
                
            } else {
                this.showLoading(false);
                this.handleFailedLogin(result.error);
            }
            
        } catch (error) {
            this.showLoading(false);
            this.handleFailedLogin(error.message);
        }
    },
    
    // معالجة إنشاء حساب
    async handleRegister() {
        const userData = {
            username: document.getElementById('username').value.trim(),
            password: document.getElementById('regPassword').value,
            name: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            role: document.getElementById('specialization').value
        };
        
        const confirmPassword = document.getElementById('confirmPassword').value;
        const acceptTerms = document.getElementById('acceptTerms').checked;
        
        // التحقق من المدخلات
        if (!userData.username || !userData.password || !userData.name || !userData.email || !userData.phone || !userData.role) {
            this.showError('يرجى تعبئة جميع الحقول المطلوبة');
            return;
        }
        
        if (userData.password !== confirmPassword) {
            this.showError('كلمة المرور غير متطابقة');
            return;
        }
        
        if (!acceptTerms) {
            this.showError('يجب الموافقة على شروط الاستخدام');
            return;
        }
        
        try {
            // إظهار حالة التحميل
            this.showLoading(true, 'registerBtn');
            
            // محاولة إنشاء الحساب
            const result = await window.auth.register(userData);
            
            if (result.success) {
                this.showLoading(false);
                this.showSuccess('تم إنشاء الحساب بنجاح');
                
                // التبديل إلى شاشة تسجيل الدخول
                setTimeout(() => {
                    this.switchTab('login');
                    document.getElementById('username').value = userData.username;
                    document.getElementById('password').focus();
                }, 2000);
                
            } else {
                this.showLoading(false);
                this.showError(result.error);
            }
            
        } catch (error) {
            this.showLoading(false);
            this.showError(error.message);
        }
    },
    
    // معالجة تسجيل الدخول الفاشل
    handleFailedLogin(errorMessage) {
        this.loginAttempts++;
        this.lastAttempt = Date.now();
        
        if (this.loginAttempts >= 5) {
            this.showError('تم تجاوز الحد الأقصى للمحاولات. حاول بعد 15 دقيقة');
        } else {
            this.showError(`فشل تسجيل الدخول: ${errorMessage}. المحاولات المتبقية: ${5 - this.loginAttempts}`);
        }
    },
    
    // التحقق من الحظر
    isBlocked() {
        if (this.loginAttempts >= 5 && this.lastAttempt) {
            const blockTime = 15 * 60 * 1000; // 15 دقيقة
            return (Date.now() - this.lastAttempt) < blockTime;
        }
        return false;
    },
    
    getBlockTime() {
        if (!this.lastAttempt) return 15;
        const elapsed = Date.now() - this.lastAttempt;
        const remaining = 15 - Math.floor(elapsed / (60 * 1000));
        return Math.max(1, remaining);
    },
    
    resetLoginAttempts() {
        this.loginAttempts = 0;
        this.lastAttempt = null;
    },
    
    // حفظ بيانات تسجيل الدخول
    saveCredentials(username, password) {
        try {
            const encrypted = btoa(`${username}:${password}`);
            localStorage.setItem('seastar-saved-login', encrypted);
        } catch (error) {
            console.error('خطأ في حفظ بيانات تسجيل الدخول:', error);
        }
    },
    
    clearSavedCredentials() {
        localStorage.removeItem('seastar-saved-login');
    },
    
    checkSavedCredentials() {
        const saved = localStorage.getItem('seastar-saved-login');
        if (saved) {
            try {
                const decoded = atob(saved);
                const [username, password] = decoded.split(':');
                
                document.getElementById('username').value = username || '';
                document.getElementById('password').value = password || '';
                document.getElementById('rememberMe').checked = true;
            } catch (error) {
                console.error('خطأ في قراءة بيانات تسجيل الدخول المحفوظة:', error);
            }
        }
    },
    
    // التحقق من قوة كلمة المرور
    checkPasswordStrength(password) {
        const strengthBars = document.querySelectorAll('.password-strength .strength-bar');
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;
        
        strengthBars.forEach((bar, index) => {
            bar.classList.remove('weak', 'medium', 'strong');
            if (index < strength) {
                if (strength <= 2) bar.classList.add('weak');
                else if (strength <= 3) bar.classList.add('medium');
                else bar.classList.add('strong');
            }
        });
        
        const strengthText = ['ضعيفة', 'متوسطة', 'قوية', 'قوية جداً'];
        document.querySelector('.password-strength span').textContent = 
            `قوة كلمة المرور: ${strengthText[strength - 1] || 'ضعيفة'}`;
    },
    
    checkPasswordMatch() {
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('confirmPassword').value;
        
        if (confirm && password !== confirm) {
            document.getElementById('confirmPassword').style.borderColor = 'var(--danger)';
        } else {
            document.getElementById('confirmPassword').style.borderColor = '';
        }
    },
    
    // نافذة استعادة كلمة المرور
    showForgotPassword() {
        // إنشاء النافذة المنبثقة
        const modal = document.createElement('div');
        modal.className = 'forgot-password-modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <h3><i class="fas fa-key"></i> استعادة كلمة المرور</h3>
                <p>أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور</p>
                
                <div class="form-group">
                    <input type="email" class="form-input" id="resetEmail" placeholder="example@domain.com" required>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="closeModal(this)">إلغاء</button>
                    <button class="btn btn-primary" onclick="loginScreen.sendResetLink()">إرسال</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // التركيز على حقل البريد
        setTimeout(() => {
            document.getElementById('resetEmail')?.focus();
        }, 100);
    },
    
    async sendResetLink() {
        const email = document.getElementById('resetEmail')?.value.trim();
        
        if (!email) {
            this.showError('يرجى إدخال البريد الإلكتروني');
            return;
        }
        
        try {
            const result = await window.auth.resetPassword(email);
            
            if (result.success) {
                this.closeModal(document.querySelector('.forgot-password-modal .btn-secondary'));
                this.showSuccess(result.message);
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError(error.message);
        }
    },
    
    // تسجيل الدخول ببصمة الإصبع
    async biometricLogin() {
        if (!window.PublicKeyCredential) {
            this.showError('جهازك لا يدعم تسجيل الدخول ببصمة الإصبع');
            return;
        }
        
        try {
            this.showLoading(true);
            
            // هنا يمكن إضافة كود المصادقة البيومترية
            // هذا مجرد مثال توضيحي
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.showLoading(false);
            this.showError('المصادقة البيومترية غير مفعلة حالياً');
            
        } catch (error) {
            this.showLoading(false);
            this.showError('فشل المصادقة البيومترية');
        }
    },
    
    // تعبئة بيانات النسخة التجريبية
    fillDemoCredentials() {
        document.getElementById('username').value = 'admin';
        document.getElementById('password').value = 'admin123';
        document.getElementById('rememberMe').checked = true;
    },
    
    // عرض رسائل الخطأ
    showError(message) {
        this.clearMessages();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        const activeForm = document.querySelector('.login-form.active');
        activeForm.insertBefore(errorDiv, activeForm.firstChild);
        
        // اهتزاز النموذج
        activeForm.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            activeForm.style.animation = '';
        }, 500);
    },
    
    showSuccess(message) {
        this.clearMessages();
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        const activeForm = document.querySelector('.login-form.active');
        activeForm.insertBefore(successDiv, activeForm.firstChild);
    },
    
    clearMessages() {
        document.querySelectorAll('.error-message, .success-message').forEach(el => el.remove());
    },
    
    showLoading(show, buttonId = 'loginBtn') {
        const btn = document.getElementById(buttonId);
        if (!btn) return;
        
        if (show) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحميل...';
        } else {
            btn.disabled = false;
            btn.innerHTML = buttonId === 'loginBtn' ? 
                '<span>تسجيل الدخول</span><i class="fas fa-arrow-left"></i>' :
                '<span>إنشاء حساب</span><i class="fas fa-user-plus"></i>';
        }
    },
    
    closeModal(btn) {
        const modal = btn.closest('.forgot-password-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    },
    
    showExitConfirm() {
        if (confirm('هل تريد الخروج من التطبيق؟')) {
            navigator.app?.exitApp();
        }
    }
};

// دوال مساعدة للاستخدام من HTML
window.togglePassword = (inputId) => {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
};

window.switchToRegister = () => loginScreen.switchTab('register');
window.switchToLogin = () => loginScreen.switchTab('login');
window.showTerms = () => alert('سيتم عرض شروط الاستخدام');
window.showPrivacy = () => alert('سيتم عرض سياسة الخصوصية');
window.fillDemoCredentials = () => loginScreen.fillDemoCredentials();
window.socialLogin = (provider) => loginScreen.showError(`تسجيل الدخول عبر ${provider} غير متاح حالياً`);
window.biometricLogin = () => loginScreen.biometricLogin();

// تهيئة الشاشة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.loginScreen = loginScreen;
    loginScreen.init();
});
