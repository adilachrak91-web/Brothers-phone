// Utility Functions
const Utils = {
    // Format currency
    formatCurrency(value) {
        return parseFloat(value || 0).toFixed(2) + ' د';
    },

    // Parse input as float
    parseFloat(value) {
        const parsed = parseFloat(value || 0);
        return isNaN(parsed) ? 0 : parsed;
    },

    // Format date
    formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Format time
    formatTime(date = new Date()) {
        const d = new Date(date);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    },

    // Get today's date
    today() {
        return this.formatDate(new Date());
    },

    // Get date string
    getDateString(offsetDays = 0) {
        const date = new Date();
        date.setDate(date.getDate() + offsetDays);
        return this.formatDate(date);
    },

    // Get month from date
    getMonth(dateStr) {
        return dateStr.substring(0, 7);
    },

    // Calculate profit
    calculateProfit(sellingPrice, buyingPrice) {
        return this.parseFloat(sellingPrice) - this.parseFloat(buyingPrice);
    },

    // Validate email
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validate number
    validateNumber(value) {
        const num = parseFloat(value);
        return !isNaN(num) && isFinite(num);
    },

    // Show notification
    notify(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#d63031' : '#f39c12'};
            color: white;
            border-radius: 4px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            animation: slideIn 0.3s ease;
            font-weight: bold;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    // Download JSON file
    downloadJSON(data, filename) {
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || 'data.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    // Read file as JSON
    readFileAsJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    resolve(json);
                } catch (error) {
                    reject(new Error('صيغة JSON غير صحيحة'));
                }
            };
            reader.onerror = () => reject(new Error('خطأ في قراءة الملف'));
            reader.readAsText(file);
        });
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Confirm dialog
    confirm(message) {
        return confirm(message);
    },

    // Alert dialog
    alert(message) {
        alert(message);
    }
};

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
