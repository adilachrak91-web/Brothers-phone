// Storage Management System
const Storage = {
    // Initialize storage keys
    KEYS: {
        STOCK: 'brothersphone_stock',
        SALES: 'brothersphone_sales',
        EXPENSES: 'brothersphone_expenses',
        OPENING_CASH: 'brothersphone_opening_cash',
        DEBTS: 'brothersphone_debts',
        RECHARGE_BALANCE: 'brothersphone_recharge_balance'
    },

    // Load data from localStorage
    load(key, defaultValue = {}) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Error loading ${key}:`, error);
            return defaultValue;
        }
    },

    // Save data to localStorage
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            this.backup();
            return true;
        } catch (error) {
            console.error(`Error saving ${key}:`, error);
            return false;
        }
    },

    // Backup data
    backup() {
        const backup = {
            timestamp: new Date().toISOString(),
            data: {
                stock: this.load(this.KEYS.STOCK, {}),
                sales: this.load(this.KEYS.SALES, []),
                expenses: this.load(this.KEYS.EXPENSES, []),
                opening_cash: this.load(this.KEYS.OPENING_CASH, {}),
                debts: this.load(this.KEYS.DEBTS, { customers: [], suppliers: [] }),
                recharge_balance: this.load(this.KEYS.RECHARGE_BALANCE, { balance: "0" })
            }
        };
        
        const backupKey = `backup_${new Date().toISOString().split('T')[0]}`;
        localStorage.setItem(backupKey, JSON.stringify(backup));
    },

    // Get all backups
    getBackups() {
        const backups = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('backup_')) {
                backups.push({ key, data: JSON.parse(localStorage.getItem(key)) });
            }
        }
        return backups.sort((a, b) => 
            new Date(b.data.timestamp) - new Date(a.data.timestamp)
        );
    },

    // Clear all data (for reset)
    clearAll() {
        const keysToKeep = ['backup_'];
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (!keysToKeep.some(k => key.startsWith(k))) {
                localStorage.removeItem(key);
            }
        }
    },

    // Export data as JSON
    exportData() {
        return {
            stock: this.load(this.KEYS.STOCK, {}),
            sales: this.load(this.KEYS.SALES, []),
            expenses: this.load(this.KEYS.EXPENSES, []),
            opening_cash: this.load(this.KEYS.OPENING_CASH, {}),
            debts: this.load(this.KEYS.DEBTS, { customers: [], suppliers: [] })
        };
    },

    // Import data from JSON
    importData(data) {
        try {
            if (data.stock) this.save(this.KEYS.STOCK, data.stock);
            if (data.sales) this.save(this.KEYS.SALES, data.sales);
            if (data.expenses) this.save(this.KEYS.EXPENSES, data.expenses);
            if (data.opening_cash) this.save(this.KEYS.OPENING_CASH, data.opening_cash);
            if (data.debts) this.save(this.KEYS.DEBTS, data.debts);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
};

// Auto-backup on page load
window.addEventListener('load', () => {
    Storage.backup();
});

// Auto-backup on page unload
window.addEventListener('beforeunload', () => {
    Storage.backup();
});
