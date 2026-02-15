/**
 * SeaStar Database - نظام إدارة قاعدة البيانات المتقدم
 * يدعم IndexedDB مع التخزين المحلي والمزامنة
 */

class SeaStarDatabase {
    constructor() {
        this.db = null;
        this.DB_NAME = 'SeaStarLegalDB';
        this.DB_VERSION = 8;
        this.stores = {
            users: { keyPath: 'id', autoIncrement: true },
            cases: { keyPath: 'id', autoIncrement: true },
            clients: { keyPath: 'id', autoIncrement: true },
            sessions: { keyPath: 'id', autoIncrement: true },
            documents: { keyPath: 'id', autoIncrement: true },
            tasks: { keyPath: 'id', autoIncrement: true },
            notifications: { keyPath: 'id', autoIncrement: true },
            settings: { keyPath: 'key' },
            financial: { keyPath: 'id', autoIncrement: true },
            reports: { keyPath: 'id', autoIncrement: true },
            backups: { keyPath: 'id', autoIncrement: true }
        };
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = (event) => {
                console.error('❌ خطأ في فتح قاعدة البيانات:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('✅ تم فتح قاعدة البيانات بنجاح');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStores(db);
                this.createIndexes(db);
                this.insertInitialData(db);
            };
        });
    }

    createStores(db) {
        for (const [storeName, config] of Object.entries(this.stores)) {
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, config);
            }
        }
    }

    createIndexes(db) {
        // إنشاء الفهارس للبحث السريع
        
        // فهارس القضايا
        if (db.objectStoreNames.contains('cases')) {
            const caseStore = event.currentTarget.transaction.objectStore('cases');
            
            if (!caseStore.indexNames.contains('caseNumber')) {
                caseStore.createIndex('caseNumber', 'caseNumber', { unique: true });
            }
            if (!caseStore.indexNames.contains('clientId')) {
                caseStore.createIndex('clientId', 'clientId');
            }
            if (!caseStore.indexNames.contains('status')) {
                caseStore.createIndex('status', 'status');
            }
            if (!caseStore.indexNames.contains('type')) {
                caseStore.createIndex('type', 'type');
            }
            if (!caseStore.indexNames.contains('createdAt')) {
                caseStore.createIndex('createdAt', 'createdAt');
            }
        }
        
        // فهارس الجلسات
        if (db.objectStoreNames.contains('sessions')) {
            const sessionStore = event.currentTarget.transaction.objectStore('sessions');
            
            if (!sessionStore.indexNames.contains('caseId')) {
                sessionStore.createIndex('caseId', 'caseId');
            }
            if (!sessionStore.indexNames.contains('date')) {
                sessionStore.createIndex('date', 'date');
            }
            if (!sessionStore.indexNames.contains('status')) {
                sessionStore.createIndex('status', 'status');
            }
        }
        
        // فهارس العملاء
        if (db.objectStoreNames.contains('clients')) {
            const clientStore = event.currentTarget.transaction.objectStore('clients');
            
            if (!clientStore.indexNames.contains('phone')) {
                clientStore.createIndex('phone', 'phone', { unique: true });
            }
            if (!clientStore.indexNames.contains('email')) {
                clientStore.createIndex('email', 'email');
            }
            if (!clientStore.indexNames.contains('type')) {
                clientStore.createIndex('type', 'type');
            }
        }
    }

    insertInitialData(db) {
        // إدخال البيانات الافتراضية
        const transaction = db.transaction(['settings', 'users'], 'readwrite');
        
        // إعدادات افتراضية
        const settings = transaction.objectStore('settings');
        settings.put({ key: 'appName', value: 'SeaStar Legal' });
        settings.put({ key: 'theme', value: 'light' });
        settings.put({ key: 'language', value: 'ar' });
        settings.put({ key: 'autoSync', value: true });
        
        // مستخدم افتراضي
        const users = transaction.objectStore('users');
        users.put({
            username: 'admin',
            password: 'admin123', // في التطبيق الفعلي يجب تشفير كلمة المرور
            name: 'محمد الأحمدي',
            role: 'محامي رئيسي',
            email: 'admin@seastar.com',
            phone: '123456789',
            createdAt: new Date().toISOString()
        });
    }

    // ========== العمليات الأساسية ==========
    
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                data.createdAt = new Date().toISOString();
                data.updatedAt = new Date().toISOString();
                
                const request = store.add(data);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = (event) => reject(event.target.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(id);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = (event) => reject(event.target.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getAll(storeName, indexName = null, query = null) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                let request;
                
                if (indexName && query) {
                    const index = store.index(indexName);
                    request = index.getAll(query);
                } else {
                    request = store.getAll();
                }
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = (event) => reject(event.target.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                data.updatedAt = new Date().toISOString();
                
                const request = store.put(data);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = (event) => reject(event.target.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(id);
                
                request.onsuccess = () => resolve();
                request.onerror = (event) => reject(event.target.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    // ========== عمليات البحث المتقدمة ==========
    
    async search(storeName, searchTerm, fields) {
        const results = [];
        const allItems = await this.getAll(storeName);
        
        for (const item of allItems) {
            for (const field of fields) {
                const value = item[field];
                if (value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())) {
                    results.push(item);
                    break;
                }
            }
        }
        
        return results;
    }

    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const index = store.index(indexName);
                const request = index.getAll(value);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = (event) => reject(event.target.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    // ========== إحصائيات وتقارير ==========
    
    async getStats() {
        const cases = await this.getAll('cases');
        const clients = await this.getAll('clients');
        const sessions = await this.getAll('sessions');
        
        const today = new Date().toISOString().split('T')[0];
        
        return {
            totalCases: cases.length,
            activeCases: cases.filter(c => c.status !== 'منتهية').length,
            completedCases: cases.filter(c => c.status === 'منتهية').length,
            totalClients: clients.length,
            todaySessions: sessions.filter(s => s.date === today).length,
            upcomingSessions: sessions.filter(s => s.date > today).length,
            totalRevenue: cases.reduce((sum, c) => sum + (c.feesAmount || 0), 0),
            collectedRevenue: cases.reduce((sum, c) => sum + (c.feesPaid || 0), 0)
        };
    }

    async getUpcomingSessions(days = 7) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        
        const sessions = await this.getAll('sessions');
        
        return sessions.filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate >= today && sessionDate <= futureDate && session.status === 'مجدولة';
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    async getCaseStats(period = 'month') {
        const cases = await this.getAll('cases');
        const now = new Date();
        
        const stats = {
            byType: {},
            byStatus: {},
            byCourt: {},
            timeline: []
        };
        
        cases.forEach(c => {
            // حسب النوع
            stats.byType[c.type] = (stats.byType[c.type] || 0) + 1;
            
            // حسب الحالة
            stats.byStatus[c.status] = (stats.byStatus[c.status] || 0) + 1;
            
            // حسب المحكمة
            stats.byCourt[c.courtName] = (stats.byCourt[c.courtName] || 0) + 1;
        });
        
        return stats;
    }

    async getFinancialStats(period = 'month') {
        const cases = await this.getAll('cases');
        
        const stats = {
            totalFees: 0,
            paidFees: 0,
            pendingFees: 0,
            byMonth: {},
            byPaymentMethod: {}
        };
        
        cases.forEach(c => {
            stats.totalFees += c.feesAmount || 0;
            stats.paidFees += c.feesPaid || 0;
            
            if (c.paymentMethod) {
                stats.byPaymentMethod[c.paymentMethod] = (stats.byPaymentMethod[c.paymentMethod] || 0) + (c.feesPaid || 0);
            }
        });
        
        stats.pendingFees = stats.totalFees - stats.paidFees;
        
        return stats;
    }

    // ========== النسخ الاحتياطي ==========
    
    async createBackup() {
        const backup = {
            timestamp: new Date().toISOString(),
            version: this.DB_VERSION,
            data: {}
        };
        
        for (const storeName of Object.keys(this.stores)) {
            backup.data[storeName] = await this.getAll(storeName);
        }
        
        // حفظ النسخة
        await this.add('backups', {
            name: `نسخة احتياطية ${new Date().toLocaleDateString('ar')}`,
            data: backup,
            size: JSON.stringify(backup).length,
            createdAt: new Date().toISOString()
        });
        
        return backup;
    }

    async restoreBackup(backupId) {
        const backup = await this.get('backups', backupId);
        if (!backup) throw new Error('النسخة الاحتياطية غير موجودة');
        
        const transaction = this.db.transaction(Object.keys(this.stores), 'readwrite');
        
        for (const storeName of Object.keys(this.stores)) {
            const store = transaction.objectStore(storeName);
            store.clear();
            
            const items = backup.data.data[storeName] || [];
            for (const item of items) {
                store.add(item);
            }
        }
        
        return true;
    }

    // ========== مزامنة البيانات ==========
    
    async syncWithServer() {
        if (!navigator.onLine) {
            throw new Error('لا يوجد اتصال بالإنترنت');
        }
        
        // هنا يمكن إضافة كود المزامنة مع الخادم
        console.log('🔄 جاري مزامنة البيانات...');
        
        // مثال بسيط للمزامنة
        const localData = {};
        for (const storeName of Object.keys(this.stores)) {
            localData[storeName] = await this.getAll(storeName);
        }
        
        // إرسال البيانات المحلية إلى الخادم
        // واستقبال التحديثات من الخادم
        
        return { synced: true, timestamp: new Date().toISOString() };
    }

    // ========== إدارة الإعدادات ==========
    
    async getSettings() {
        const settings = {};
        const settingsList = await this.getAll('settings');
        
        settingsList.forEach(s => {
            settings[s.key] = s.value;
        });
        
        return settings;
    }

    async updateSetting(key, value) {
        return await this.update('settings', { key, value });
    }
}

// تهيئة قاعدة البيانات
const db = new SeaStarDatabase();
window.db = db;
