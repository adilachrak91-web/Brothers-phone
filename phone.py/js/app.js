// Main Application Logic
class BrothersPhone {
    constructor() {
        this.stock = Storage.load(Storage.KEYS.STOCK, {});
        this.sales = Storage.load(Storage.KEYS.SALES, []);
        this.expenses = Storage.load(Storage.KEYS.EXPENSES, []);
        this.opening_cash = Storage.load(Storage.KEYS.OPENING_CASH, {});
        this.debts = Storage.load(Storage.KEYS.DEBTS, { customers: [], suppliers: [] });
        this.recharge_data = Storage.load(Storage.KEYS.RECHARGE_BALANCE, { balance: "0" });

        this.today = Utils.today();
        this.cart = [];
        this.selectedCartItem = null;
        this.selectedProduct = null;
        this.temp_img_path = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCurrentDate();
        this.refreshAll();
        this.setupAutoDateCheck();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // POS Section
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleScan();
        });
        document.getElementById('searchInput').addEventListener('input', () => this.updateProductInfo());

        document.getElementById('applyAdjBtn').addEventListener('click', () => this.applyDiscount());
        document.getElementById('processReturnBtn').addEventListener('click', () => this.processReturn());
        document.getElementById('processDamagedBtn').addEventListener('click', () => this.processDamaged());
        document.getElementById('confirmSaleBtn').addEventListener('click', () => this.confirmSale());
        document.getElementById('clearCartBtn').addEventListener('click', () => this.clearCart());

        // Cart table click handler
        document.getElementById('cartTableBody').addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const idx = e.target.dataset.index;
                this.removeFromCart(idx);
            }
        });

        // Inventory Section
        document.getElementById('invSearch').addEventListener('input', () => this.updateInventoryList());
        document.getElementById('saveProductBtn').addEventListener('click', () => this.saveProduct());
        document.getElementById('deleteProductBtn').addEventListener('click', () => this.deleteProduct());

        document.getElementById('inventoryTableBody').addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-btn')) {
                const barcode = e.target.dataset.barcode;
                this.loadProductToForm(barcode);
            }
        });

        // Reports Section
        const reportDate = document.getElementById('reportDate');
        reportDate.value = this.today;
        reportDate.addEventListener('change', () => this.refreshReports());
        
        document.getElementById('refreshReportBtn').addEventListener('click', () => this.refreshReports());
        document.getElementById('saveOpeningBtn').addEventListener('click', () => this.saveOpeningCash());
        document.getElementById('addExpenseBtn').addEventListener('click', () => this.addExpense());

        // Debts Section
        document.getElementById('debtBarcode').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.autoFillDebtFromStock();
        });
        document.getElementById('addDebtBtn').addEventListener('click', () => this.addDebt());

        document.getElementById('supplierDebtsBody').addEventListener('click', (e) => this.handleDebtAction(e, 'suppliers'));
        document.getElementById('customerDebtsBody').addEventListener('click', (e) => this.handleDebtAction(e, 'customers'));
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(tabName).classList.add('active');

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Refresh tab content
        if (tabName === 'inventory') this.updateInventoryList();
        if (tabName === 'reports') this.refreshReports();
        if (tabName === 'debts') this.refreshDebts();
    }

    updateCurrentDate() {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        document.getElementById('currentDate').textContent = now.toLocaleDateString('ar-SA', options);
    }

    setupAutoDateCheck() {
        setInterval(() => {
            const newDate = Utils.today();
            if (newDate !== this.today) {
                this.today = newDate;
                this.cart = [];
                this.updateCartUI();
                this.refreshAll();
                Utils.notify('تم تحديث التاريخ تلقائياً');
            }
        }, 60000);
    }

    // POS Functions
    handleScan() {
        const searchVal = document.getElementById('searchInput').value.trim();
        if (!searchVal) return;

        const product = Object.values(this.stock).find(p => 
            p.b === searchVal || p.n === searchVal
        );

        if (!product) {
            Utils.notify('المنتج غير موجود', 'error');
            return;
        }

        const qty = parseInt(product.qty || 0);
        if (qty <= 0) {
            Utils.notify('الكمية نفاد', 'error');
            return;
        }

        const discount = Utils.parseFloat(document.getElementById('discountInput').value);
        const increase = Utils.parseFloat(document.getElementById('increaseInput').value);
        
        const buyPrice = Utils.parseFloat(product.buy);
        const sellPrice = Utils.parseFloat(product.sell) - discount + increase;
        const profit = sellPrice - buyPrice;

        this.cart.push({
            b: Object.keys(this.stock).find(key => this.stock[key] === product),
            n: product.n,
            q: 1,
            buy: buyPrice,
            sell: sellPrice,
            prof: profit
        });

        this.updateCartUI();
        this.updateProductInfo();
        document.getElementById('searchInput').value = '';
    }

    updateProductInfo() {
        const searchVal = document.getElementById('searchInput').value.trim();
        const product = Object.values(this.stock).find(p => 
            p.b === searchVal || p.n === searchVal
        );

        if (product) {
            const qty = parseInt(product.qty || 0);
            document.getElementById('stockQty').textContent = `الكمية المتوفرة: ${qty}`;
            
            if (product.img && product.img.startsWith('data:')) {
                document.getElementById('productImg').src = product.img;
                document.getElementById('productImgText').style.display = 'none';
            } else {
                document.getElementById('productImgText').style.display = 'block';
            }
        }
    }

    updateCartUI() {
        const tbody = document.getElementById('cartTableBody');
        tbody.innerHTML = '';

        let total = 0;
        this.cart.forEach((item, idx) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.n}</td>
                <td>${item.q}</td>
                <td>${Utils.formatCurrency(item.buy)}</td>
                <td>${Utils.formatCurrency(item.sell)}</td>
                <td>${Utils.formatCurrency(item.prof)}</td>
                <td><button class="delete-btn" data-index="${idx}">حذف</button></td>
            `;
            tbody.appendChild(row);
            total += item.sell * item.q;
        });

        document.getElementById('cartTotal').textContent = Utils.formatCurrency(total);
    }

    removeFromCart(idx) {
        this.cart.splice(idx, 1);
        this.updateCartUI();
    }

    clearCart() {
        if (Utils.confirm('هل تريد حذف السلة؟')) {
            this.cart = [];
            this.updateCartUI();
        }
    }

    applyDiscount() {
        if (this.cart.length === 0) {
            Utils.notify('السلة فارغة', 'error');
            return;
        }

        const lastItem = this.cart[this.cart.length - 1];
        const discount = Utils.parseFloat(document.getElementById('discountInput').value);
        const increase = Utils.parseFloat(document.getElementById('increaseInput').value);
        const originalPrice = Utils.parseFloat(this.stock[lastItem.b].sell);
        
        lastItem.sell = originalPrice - discount + increase;
        lastItem.prof = lastItem.sell - lastItem.buy;
        
        this.updateCartUI();
        document.getElementById('discountInput').value = '0';
        document.getElementById('increaseInput').value = '0';
    }

    confirmSale() {
        if (this.cart.length === 0) {
            Utils.notify('السلة فارغة', 'error');
            return;
        }

        const now = new Date();
        this.cart.forEach(item => {
            const currentQty = parseInt(this.stock[item.b].qty || 0);
            this.stock[item.b].qty = String(currentQty - 1);

            this.sales.push({
                date: this.today,
                time: Utils.formatTime(now),
                name: item.n,
                total: item.sell,
                buy_price: item.buy,
                profit: item.prof,
                barcode: item.b
            });
        });

        Storage.save(Storage.KEYS.STOCK, this.stock);
        Storage.save(Storage.KEYS.SALES, this.sales);

        this.cart = [];
        this.updateCartUI();
        this.refreshReports();
        this.updateInventoryList();
        document.getElementById('searchInput').value = '';
        
        Utils.notify('✅ تمت عملية البيع بنجاح');
    }

    processReturn() {
        const barcode = document.getElementById('returnBarcode').value.trim();
        const amount = Utils.parseFloat(document.getElementById('returnAmount').value);

        if (!barcode || !this.stock[barcode]) {
            Utils.notify('الباركود غير صحيح', 'error');
            return;
        }

        const product = this.stock[barcode];
        const currentQty = parseInt(product.qty || 0);
        this.stock[barcode].qty = String(currentQty + 1);

        this.sales.push({
            date: this.today,
            time: 'مرتجع',
            name: `إرجاع: ${product.n}`,
            total: -amount,
            buy_price: Utils.parseFloat(product.buy),
            profit: -(amount - Utils.parseFloat(product.buy)),
            barcode: barcode
        });

        Storage.save(Storage.KEYS.STOCK, this.stock);
        Storage.save(Storage.KEYS.SALES, this.sales);

        document.getElementById('returnBarcode').value = '';
        document.getElementById('returnAmount').value = '';
        this.refreshReports();
        this.updateInventoryList();
        
        Utils.notify('تم تسجيل المرتجع');
    }

    processDamaged() {
        const barcode = document.getElementById('damagedBarcode').value.trim();
        if (!barcode || !this.stock[barcode]) {
            Utils.notify('الباركود غير صحيح', 'error');
            return;
        }

        const product = this.stock[barcode];
        const currentQty = parseInt(product.qty || 0);
        
        if (currentQty > 0) {
            this.stock[barcode].qty = String(currentQty - 1);
            Storage.save(Storage.KEYS.STOCK, this.stock);
            this.updateInventoryList();
            document.getElementById('damagedBarcode').value = '';
            Utils.notify('تم تسجيل المنتج التالف');
        } else {
            Utils.notify('الكمية صفر', 'error');
        }
    }

    // Inventory Functions
    saveProduct() {
        const barcode = document.getElementById('invBarcode').value.trim();
        const name = document.getElementById('invName').value.trim();

        if (!barcode || !name) {
            Utils.notify('أدخل الباركود والاسم', 'error');
            return;
        }

        const buyPrice = document.getElementById('invBuyPrice').value || '0';
        const sellPrice = document.getElementById('invSellPrice').value || '0';
        const qty = document.getElementById('invQty').value || '0';
        const supplier = document.getElementById('invSupplier').value.trim() || '-';

        this.stock[barcode] = {
            b: barcode,
            n: name,
            sup: supplier,
            buy: buyPrice,
            sell: sellPrice,
            qty: qty,
            img: this.temp_img_path || (this.stock[barcode]?.img || '')
        };

        Storage.save(Storage.KEYS.STOCK, this.stock);
        this.updateInventoryList();
        this.clearProductForm();
        this.temp_img_path = null;
        
        Utils.notify('✅ تم حفظ المنتج');
    }

    deleteProduct() {
        const barcode = document.getElementById('invBarcode').value.trim();
        if (!barcode || !this.stock[barcode]) {
            Utils.notify('اختر منتج أولاً', 'error');
            return;
        }

        if (Utils.confirm('هل تريد حذف المنتج؟')) {
            delete this.stock[barcode];
            Storage.save(Storage.KEYS.STOCK, this.stock);
            this.updateInventoryList();
            this.clearProductForm();
            Utils.notify('✅ تم حذف المنتج');
        }
    }

    loadProductToForm(barcode) {
        const product = this.stock[barcode];
        if (product) {
            document.getElementById('invBarcode').value = barcode;
            document.getElementById('invName').value = product.n;
            document.getElementById('invSupplier').value = product.sup || '';
            document.getElementById('invBuyPrice').value = product.buy;
            document.getElementById('invSellPrice').value = product.sell;
            document.getElementById('invQty').value = product.qty;
        }
    }

    clearProductForm() {
        document.getElementById('invBarcode').value = '';
        document.getElementById('invName').value = '';
        document.getElementById('invSupplier').value = '';
        document.getElementById('invBuyPrice').value = '';
        document.getElementById('invSellPrice').value = '';
        document.getElementById('invQty').value = '';
        document.getElementById('invImage').value = '';
    }

    updateInventoryList() {
        const query = document.getElementById('invSearch').value.trim().toLowerCase();
        const tbody = document.getElementById('inventoryTableBody');
        tbody.innerHTML = '';

        let totalCapital = 0;

        Object.keys(this.stock).forEach(barcode => {
            const product = this.stock[barcode];
            const qty = parseInt(product.qty || 0);
            const buyPrice = Utils.parseFloat(product.buy);
            const capitalValue = qty * buyPrice;

            if (!query || query === '' || 
                barcode.toLowerCase().includes(query) || 
                product.n.toLowerCase().includes(query)) {
                
                const row = document.createElement('tr');
                const isLowStock = qty < 3;
                
                row.className = isLowStock ? 'low-stock' : '';
                row.innerHTML = `
                    <td>${barcode}</td>
                    <td>${product.n}</td>
                    <td>${product.sup || '-'}</td>
                    <td>${qty}</td>
                    <td>${Utils.formatCurrency(product.buy)}</td>
                    <td>${Utils.formatCurrency(product.sell)}</td>
                    <td>${Utils.formatCurrency(capitalValue)}</td>
                `;
                
                row.addEventListener('click', () => this.loadProductToForm(barcode));
                tbody.appendChild(row);
                totalCapital += capitalValue;
            }
        });

        document.getElementById('totalCapital').textContent = 
            `رأس المال: ${Utils.formatCurrency(totalCapital)}`;
    }

    // Reports Functions
    refreshReports() {
        const selectedDate = document.getElementById('reportDate').value;
        const daySales = this.sales.filter(s => s.date === selectedDate);
        const dayExpenses = this.expenses.filter(e => e.date === selectedDate);

        // Update table
        const tbody = document.getElementById('reportsTableBody');
        tbody.innerHTML = '';

        daySales.forEach(sale => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sale.time}</td>
                <td>${sale.name}</td>
                <td>${Utils.formatCurrency(sale.total)}</td>
                <td>${Utils.formatCurrency(sale.buy_price)}</td>
                <td>${Utils.formatCurrency(sale.profit)}</td>
            `;
            tbody.appendChild(row);
        });

        dayExpenses.forEach(exp => {
            const row = document.createElement('tr');
            const prefix = exp.type === 'personal' ? '👤 شخصي: ' : '🏗️ استثمار: ';
            row.innerHTML = `
                <td>مصروف</td>
                <td>${prefix}${exp.note}</td>
                <td>-${Utils.formatCurrency(exp.amt)}</td>
                <td>-</td>
                <td>0.00</td>
            `;
            tbody.appendChild(row);
        });

        // Calculate statistics
        const totalSales = daySales.reduce((sum, s) => sum + Utils.parseFloat(s.total), 0);
        const totalProfit = daySales.reduce((sum, s) => sum + Utils.parseFloat(s.profit), 0);
        const personalExp = dayExpenses.reduce((sum, e) => 
            sum + (e.type === 'personal' ? Utils.parseFloat(e.amt) : 0), 0);
        const investExp = dayExpenses.reduce((sum, e) => 
            sum + (e.type === 'invest' ? Utils.parseFloat(e.amt) : 0), 0);
        
        let opening = 0;
        try {
            opening = Utils.parseFloat(this.opening_cash[selectedDate] || 0);
        } catch (e) {}

        const netProfit = totalProfit - personalExp;
        const boxTotal = opening + totalSales - personalExp - investExp;

        document.getElementById('statOpening').textContent = Utils.formatCurrency(opening);
        document.getElementById('statIncome').textContent = Utils.formatCurrency(totalSales - investExp);
        document.getElementById('statPersonal').textContent = Utils.formatCurrency(personalExp);
        document.getElementById('statInvest').textContent = Utils.formatCurrency(investExp);
        document.getElementById('statProfit').textContent = Utils.formatCurrency(netProfit);
        document.getElementById('statBox').textContent = Utils.formatCurrency(boxTotal);

        // Update short items
        this.updateShortItems();
    }

    updateShortItems() {
        const shortList = document.getElementById('shortItemsList');
        shortList.innerHTML = '';

        Object.keys(this.stock).forEach(barcode => {
            const product = this.stock[barcode];
            const qty = parseInt(product.qty || 0);
            
            if (qty < 3) {
                const item = document.createElement('div');
                item.className = 'short-item';
                item.innerHTML = `⚠️ ${barcode} | ${product.n} | الكمية: ${qty}`;
                shortList.appendChild(item);
            }
        });
    }

    saveOpeningCash() {
        const value = document.getElementById('openingCash').value || '0';
        this.opening_cash[document.getElementById('reportDate').value] = value;
        Storage.save(Storage.KEYS.OPENING_CASH, this.opening_cash);
        this.refreshReports();
        Utils.notify('✅ تم حفظ الافتتاحية');
    }

    addExpense() {
        const amount = Utils.parseFloat(document.getElementById('expenseAmount').value);
        const note = document.getElementById('expenseNote').value.trim() || 'مصروف';
        const type = document.getElementById('expenseType').value;

        if (amount <= 0) {
            Utils.notify('أدخل مبلغ صحيح', 'error');
            return;
        }

        this.expenses.push({
            date: document.getElementById('reportDate').value,
            note: note,
            amt: amount,
            type: type
        });

        Storage.save(Storage.KEYS.EXPENSES, this.expenses);
        this.refreshReports();
        document.getElementById('expenseNote').value = '';
        document.getElementById('expenseAmount').value = '';
        
        Utils.notify('✅ تم إضافة المصروف');
    }

    // Debts Functions
    autoFillDebtFromStock() {
        const barcode = document.getElementById('debtBarcode').value.trim();
        if (barcode && this.stock[barcode]) {
            const product = this.stock[barcode];
            document.getElementById('debtReason').value = product.n;
            document.getElementById('debtAmount').value = product.sell;
        }
    }

    addDebt() {
        const name = document.getElementById('debtName').value.trim();
        const amount = Utils.parseFloat(document.getElementById('debtAmount').value);
        const barcode = document.getElementById('debtBarcode').value.trim();
        const reason = document.getElementById('debtReason').value.trim() || '-';
        const type = document.getElementById('debtType').value;

        if (!name || amount <= 0) {
            Utils.notify('أدخل البيانات صحيحة', 'error');
            return;
        }

        const category = type === 'customer' ? 'customers' : 'suppliers';
        
        this.debts[category].push({
            name: name,
            reason: reason,
            total_amt: amount,
            paid_amt: 0,
            date: this.today,
            barcode: barcode
        });

        Storage.save(Storage.KEYS.DEBTS, this.debts);
        this.refreshDebts();
        
        document.getElementById('debtName').value = '';
        document.getElementById('debtBarcode').value = '';
        document.getElementById('debtReason').value = '';
        document.getElementById('debtAmount').value = '';
        
        Utils.notify('✅ تم إضافة الدين');
    }

    refreshDebts() {
        ['customerDebtsBody', 'supplierDebtsBody'].forEach(bodyId => {
            const tbody = document.getElementById(bodyId);
            tbody.innerHTML = '';
        });

        let totalCustomers = 0;
        this.debts.customers.forEach((debt, idx) => {
            const remaining = debt.total_amt - debt.paid_amt;
            totalCustomers += remaining;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${debt.name}</td>
                <td>${debt.reason}</td>
                <td>${Utils.formatCurrency(debt.total_amt)}</td>
                <td>${Utils.formatCurrency(debt.paid_amt)}</td>
                <td>${Utils.formatCurrency(remaining)}</td>
                <td>${debt.date}</td>
                <td>
                    <button class="pay-btn" data-idx="${idx}" data-type="customer">تسديد</button>
                    <button class="delete-debt-btn" data-idx="${idx}" data-type="customer">حذف</button>
                </td>
            `;
            document.getElementById('customerDebtsBody').appendChild(row);
        });

        let totalSuppliers = 0;
        this.debts.suppliers.forEach((debt, idx) => {
            const remaining = debt.total_amt - debt.paid_amt;
            totalSuppliers += remaining;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${debt.name}</td>
                <td>${debt.reason}</td>
                <td>${Utils.formatCurrency(debt.total_amt)}</td>
                <td>${Utils.formatCurrency(debt.paid_amt)}</td>
                <td>${Utils.formatCurrency(remaining)}</td>
                <td>${debt.date}</td>
                <td>
                    <button class="pay-btn" data-idx="${idx}" data-type="supplier">تسديد</button>
                    <button class="delete-debt-btn" data-idx="${idx}" data-type="supplier">حذف</button>
                </td>
            `;
            document.getElementById('supplierDebtsBody').appendChild(row);
        });

        document.getElementById('customerTotal').textContent = 
            `إجمالي العملاء: ${Utils.formatCurrency(totalCustomers)}`;
        document.getElementById('supplierTotal').textContent = 
            `إجمالي الموردين: ${Utils.formatCurrency(totalSuppliers)}`;
    }

    handleDebtAction(e, type) {
        if (e.target.classList.contains('pay-btn')) {
            const idx = parseInt(e.target.dataset.idx);
            const category = e.target.dataset.type === 'customer' ? 'customers' : 'suppliers';
            this.payDebt(idx, category);
        } else if (e.target.classList.contains('delete-debt-btn')) {
            const idx = parseInt(e.target.dataset.idx);
            const category = e.target.dataset.type === 'customer' ? 'customers' : 'suppliers';
            this.deleteDebt(idx, category);
        }
    }

    payDebt(idx, category) {
        const debt = this.debts[category][idx];
        const remaining = debt.total_amt - debt.paid_amt;
        
        const amount = prompt(`المتبقي: ${Utils.formatCurrency(remaining)}\nأدخل المبلغ المراد تسديده:`, remaining);
        
        if (amount === null) return;
        
        const payAmount = Utils.parseFloat(amount);
        if (payAmount <= 0 || payAmount > remaining) {
            Utils.notify('المبلغ غير صحيح', 'error');
            return;
        }

        debt.paid_amt += payAmount;

        if (category === 'customers' && debt.barcode) {
            this.sales.push({
                date: this.today,
                time: Utils.formatTime(),
                name: `تسديد: ${debt.name}`,
                total: payAmount,
                buy_price: 0,
                profit: payAmount,
                barcode: debt.barcode
            });
            Storage.save(Storage.KEYS.SALES, this.sales);
        }

        if (debt.total_amt - debt.paid_amt <= 0) {
            this.debts[category].splice(idx, 1);
        }

        Storage.save(Storage.KEYS.DEBTS, this.debts);
        this.refreshDebts();
        this.refreshReports();
        Utils.notify('✅ تم تسديد الدين');
    }

    deleteDebt(idx, category) {
        if (Utils.confirm('هل تريد حذف هذا الدين؟')) {
            this.debts[category].splice(idx, 1);
            Storage.save(Storage.KEYS.DEBTS, this.debts);
            this.refreshDebts();
            Utils.notify('✅ تم حذف الدين');
        }
    }

    refreshAll() {
        this.updateInventoryList();
        this.refreshReports();
        this.refreshDebts();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BrothersPhone();

    // Handle file upload for product image
    document.getElementById('invImage').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                window.app.temp_img_path = event.target.result;
                Utils.notify('✅ تم تحميل الصورة');
            };
            reader.readAsDataURL(file);
        }
    });
});
