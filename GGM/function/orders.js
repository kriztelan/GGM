// ==========================================
// ORDER & JOB MANAGEMENT MODULE
// GoldenThreads IMS - Database Ready Version
// No Hardcoded Data - Clean UI Implementation
// ==========================================

// ==========================================
// GLOBAL STATE
// ==========================================
let orders = [];
let jobOrders = [];
let currentOrderId = null;
let orderCounter = 1001;
let jobCounter = 5001;
let currentStep = 1;
let currentOrderData = {};

// ==========================================
// CONFIGURATION
// ==========================================
const Config = {
    apiBaseUrl: '/api', // Update with your backend URL
    endpoints: {
        orders: '/orders',
        jobOrders: '/job-orders',
        stats: '/orders/stats'
    }
};

// ==========================================
// CONSTANTS
// ==========================================

// Size fabric multipliers for accurate estimation
const SIZE_MULTIPLIERS = {
    'XS': 0.85,    // 15% less fabric than Medium
    'S': 0.9,      // 10% less fabric than Medium
    'M': 1.0,      // Baseline
    'L': 1.1,      // 10% more fabric than Medium
    'XL': 1.2,     // 20% more fabric than Medium
    'XXL': 1.3,    // 30% more fabric than Medium
    '3XL': 1.4     // 40% more fabric than Medium
};

// Base fabric usage per garment (in meters)
const BASE_FABRIC_USAGE = {
    'T-Shirt': 1.2,
    'Polo Shirt': 1.5,
    'Dress Shirt': 1.8,
    'Pants': 2.0,
    'Jacket': 2.5,
    'Uniform': 2.2,
    'Custom': 1.5
};

// Base pricing per garment type (₱)
const BASE_PRICING = {
    'T-Shirt': { fabric: 80, labor: 50, overhead: 20, profit: 30 },
    'Polo Shirt': { fabric: 120, labor: 80, overhead: 30, profit: 50 },
    'Dress Shirt': { fabric: 150, labor: 100, overhead: 40, profit: 60 },
    'Pants': { fabric: 180, labor: 120, overhead: 50, profit: 70 },
    'Jacket': { fabric: 300, labor: 200, overhead: 80, profit: 120 },
    'Uniform': { fabric: 200, labor: 150, overhead: 60, profit: 90 },
    'Custom': { fabric: 100, labor: 80, overhead: 30, profit: 50 }
};

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    initializeUI();
    loadOrders();
    attachEventListeners();
    
    if (window.GoldenThreadsAuth) {
        applyModuleRestrictions();
    }
    
    console.log('%c📋 Order & Job Management Module Loaded', 'color: #D4AF37; font-size: 16px; font-weight: bold;');
});

// ==========================================
// AUTHENTICATION & RESTRICTIONS
// ==========================================

function checkAuthentication() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (!user) {
        window.location.href = '/log_in.html';
        return;
    }
    
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    const userInitial = document.getElementById('userInitial');
    
    if (userName) userName.textContent = user.username;
    if (userRole) userRole.textContent = user.displayName || user.role;
    if (userInitial) userInitial.textContent = user.username.charAt(0).toUpperCase();
    
    console.log('User authenticated:', user.username, '(' + user.role + ')');
}

function applyModuleRestrictions() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;
    console.log(`${user.role} access granted to Order & Job Management`);
}

// ==========================================
// UI INITIALIZATION
// ==========================================

function initializeUI() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = ['targetStartDate', 'targetCompletionDate', 'targetDeliveryDate'];
    
    dateInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.min = today;
    });
    
    console.log('UI Initialized');
}

// ==========================================
// LOAD DATA FROM DATABASE
// ==========================================

async function loadOrders() {
    try {
        showLoadingState();
        
        // TODO: Replace with actual API call
        // const response = await fetch(`${Config.apiBaseUrl}${Config.endpoints.orders}`);
        // const data = await response.json();
        // orders = data.orders || [];
        // jobOrders = data.jobOrders || [];
        
        // Temporary: Initialize empty state
        orders = [];
        jobOrders = [];
        
        renderOrdersTable();
        updateStatistics();
        
        console.log('Orders loaded:', orders.length);
        
    } catch (error) {
        console.error('Error loading orders:', error);
        showError('Failed to load orders. Please try again.');
        renderOrdersTable();
    }
}

function showLoadingState() {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = `
        <tr class="loading-row">
            <td colspan="7">
                <div class="loading-state">
                    <div class="spinner"></div>
                    <span>Loading orders...</span>
                </div>
            </td>
        </tr>
    `;
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function attachEventListeners() {
    // Main buttons
    document.getElementById('newOrderBtn').addEventListener('click', openNewOrderModal);
    document.getElementById('closeModalBtn').addEventListener('click', closeOrderModal);
    document.getElementById('closeJobModalBtn').addEventListener('click', closeJobOrderModal);
    document.getElementById('closeViewModalBtn').addEventListener('click', closeViewOrderModal);
    document.getElementById('cancelBtn').addEventListener('click', closeOrderModal);
    document.getElementById('cancelJobBtn').addEventListener('click', closeJobOrderModal);
    
    // Form submissions
    document.getElementById('orderForm').addEventListener('submit', handleOrderSubmit);
    document.getElementById('jobOrderForm').addEventListener('submit', handleJobOrderSubmit);
    
    // Size quantity inputs - auto calculate
    const sizeInputs = ['qtyXS', 'qtySmall', 'qtyMedium', 'qtyLarge', 'qtyXL', 'qty2XL', 'qty3XL'];
    sizeInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => {
                calculateSizeBasedMetrics();
                updateDisplays();
            });
        }
    });
    
    // Garment type change
    const garmentType = document.getElementById('garmentType');
    if (garmentType) {
        garmentType.addEventListener('change', () => {
            calculateSizeBasedMetrics();
            calculateBaseCosts();
            updateDisplays();
        });
    }
    
    // Search and filter
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('filterBtn').addEventListener('click', applyFilter);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Modal outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    console.log('Event listeners attached');
}

// ==========================================
// STEP NAVIGATION
// ==========================================

function goToStep(stepNumber) {
    // Validate current step before proceeding
    if (!validateCurrentStep(currentStep)) {
        return;
    }
    
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show target step
    const targetStep = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    if (targetStep) {
        targetStep.classList.add('active');
        currentStep = stepNumber;
    }
    
    // Update progress indicators
    updateProgressSteps(stepNumber);
    
    // Update displays when entering specific steps
    if (stepNumber === 2) {
        calculateSizeBasedMetrics();
        updateDisplays();
    } else if (stepNumber === 3) {
        calculateBaseCosts();
        displayBaseCosts();
    } else if (stepNumber === 4) {
        calculateAccessoriesCost();
    } else if (stepNumber === 5) {
        generateQuotationSummary();
    }
}

function updateProgressSteps(currentStepNum) {
    document.querySelectorAll('.step').forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNum < currentStepNum) {
            step.classList.add('completed');
        } else if (stepNum === currentStepNum) {
            step.classList.add('active');
        }
    });
}

function validateCurrentStep(stepNum) {
    if (stepNum === 1) {
        const clientName = document.getElementById('clientName').value.trim();
        const clientContact = document.getElementById('clientContact').value.trim();
        const garmentType = document.getElementById('garmentType').value;
        
        if (!clientName || !clientContact || !garmentType) {
            showNotification('Please fill in all required fields (Client Name, Contact, Garment Type).', 'error');
            return false;
        }
    }
    
    if (stepNum === 2) {
        const totalQty = calculateSizeBasedMetrics();
        if (totalQty === 0) {
            showNotification('Please enter at least one size quantity.', 'error');
            return false;
        }
    }
    
    return true;
}

// ==========================================
// SIZE-BASED CALCULATIONS
// ==========================================

function calculateSizeBasedMetrics() {
    const sizes = {
        'XS': parseInt(document.getElementById('qtyXS')?.value) || 0,
        'S': parseInt(document.getElementById('qtySmall')?.value) || 0,
        'M': parseInt(document.getElementById('qtyMedium')?.value) || 0,
        'L': parseInt(document.getElementById('qtyLarge')?.value) || 0,
        'XL': parseInt(document.getElementById('qtyXL')?.value) || 0,
        'XXL': parseInt(document.getElementById('qty2XL')?.value) || 0,
        '3XL': parseInt(document.getElementById('qty3XL')?.value) || 0
    };
    
    // Calculate total quantity
    const totalQuantity = Object.values(sizes).reduce((sum, qty) => sum + qty, 0);
    
    // Calculate size-adjusted fabric usage
    const garmentType = document.getElementById('garmentType')?.value;
    let totalFabric = 0;
    
    if (garmentType && BASE_FABRIC_USAGE[garmentType]) {
        const baseFabric = BASE_FABRIC_USAGE[garmentType];
        
        Object.entries(sizes).forEach(([size, qty]) => {
            const multiplier = SIZE_MULTIPLIERS[size] || 1.0;
            totalFabric += baseFabric * multiplier * qty;
        });
    }
    
    // Store in current order data
    currentOrderData.sizes = sizes;
    currentOrderData.totalQuantity = totalQuantity;
    currentOrderData.totalFabric = totalFabric;
    
    return totalQuantity;
}

function updateDisplays() {
    const totalQty = currentOrderData.totalQuantity || 0;
    const totalFabric = currentOrderData.totalFabric || 0;
    
    const qtyDisplay = document.getElementById('displayTotalQty');
    const fabricDisplay = document.getElementById('displayFabricUsage');
    
    if (qtyDisplay) qtyDisplay.textContent = `${totalQty} pcs`;
    if (fabricDisplay) fabricDisplay.textContent = `${totalFabric.toFixed(2)} meters`;
}

function calculateBaseCosts() {
    const garmentType = document.getElementById('garmentType')?.value;
    const sizes = currentOrderData.sizes || {};
    
    if (!garmentType || !BASE_PRICING[garmentType]) {
        return;
    }
    
    const pricing = BASE_PRICING[garmentType];
    let totalFabricCost = 0;
    let totalLaborCost = 0;
    let totalOverhead = 0;
    let totalProfit = 0;
    
    Object.entries(sizes).forEach(([size, qty]) => {
        const multiplier = SIZE_MULTIPLIERS[size] || 1.0;
        totalFabricCost += pricing.fabric * multiplier * qty;
        totalLaborCost += pricing.labor * qty;
        totalOverhead += pricing.overhead * qty;
        totalProfit += pricing.profit * qty;
    });
    
    const baseTotalCost = totalFabricCost + totalLaborCost + totalOverhead + totalProfit;
    
    // Store in current order data
    currentOrderData.baseCosts = {
        fabric: totalFabricCost,
        labor: totalLaborCost,
        overhead: totalOverhead,
        profit: totalProfit,
        total: baseTotalCost
    };
}

function displayBaseCosts() {
    const costs = currentOrderData.baseCosts || {
        fabric: 0, labor: 0, overhead: 0, profit: 0, total: 0
    };
    
    const setDisplay = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = `₱${value.toFixed(2)}`;
    };
    
    setDisplay('displayFabricCost', costs.fabric);
    setDisplay('displayLaborCost', costs.labor);
    setDisplay('displayOverheadCost', costs.overhead);
    setDisplay('displayProfitCost', costs.profit);
    setDisplay('displayBaseTotalCost', costs.total);
}

// ==========================================
// ACCESSORIES MANAGEMENT
// ==========================================

function addAccessoryRow() {
    const tbody = document.getElementById('accessoriesTableBody');
    const emptyRow = tbody.querySelector('.empty-accessories');
    if (emptyRow) {
        emptyRow.remove();
    }
    
    const rowId = `accessory-${Date.now()}`;
    const row = document.createElement('tr');
    row.id = rowId;
    row.innerHTML = `
        <td>
            <select class="accessory-type" onchange="updateAccessoryTotal('${rowId}')">
                <option value="">Select Type</option>
                <option value="Button">Button</option>
                <option value="Zipper">Zipper</option>
                <option value="Embroidery">Embroidery</option>
                <option value="Printing">Printing</option>
                <option value="Label">Label</option>
                <option value="Patch">Patch</option>
                <option value="Thread">Thread</option>
                <option value="Other">Other</option>
            </select>
        </td>
        <td>
            <input type="text" class="accessory-brand" placeholder="Brand/Description">
        </td>
        <td>
            <input type="number" class="accessory-cost" min="0" step="0.01" placeholder="0.00" 
                   oninput="updateAccessoryTotal('${rowId}')">
        </td>
        <td>
            <input type="number" class="accessory-qty" min="1" value="1" 
                   oninput="updateAccessoryTotal('${rowId}')">
        </td>
        <td class="accessory-total">₱0.00</td>
        <td>
            <button type="button" class="accessory-remove-btn" onclick="removeAccessoryRow('${rowId}')">
                Remove
            </button>
        </td>
    `;
    
    tbody.appendChild(row);
}

function removeAccessoryRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
        row.remove();
    }
    
    const tbody = document.getElementById('accessoriesTableBody');
    if (tbody.children.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-accessories">
                <td colspan="6" style="text-align: center; padding: 2rem; color: #999;">
                    No accessories added yet
                </td>
            </tr>
        `;
    }
    
    calculateAccessoriesCost();
}

function updateAccessoryTotal(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    
    const cost = parseFloat(row.querySelector('.accessory-cost')?.value) || 0;
    const qty = parseInt(row.querySelector('.accessory-qty')?.value) || 0;
    const total = cost * qty;
    
    const totalCell = row.querySelector('.accessory-total');
    if (totalCell) {
        totalCell.textContent = `₱${total.toFixed(2)}`;
    }
    
    calculateAccessoriesCost();
}

function calculateAccessoriesCost() {
    const tbody = document.getElementById('accessoriesTableBody');
    const rows = tbody.querySelectorAll('tr:not(.empty-accessories)');
    
    let totalAccessories = 0;
    const accessoryItems = [];
    
    rows.forEach(row => {
        const type = row.querySelector('.accessory-type')?.value || '';
        const brand = row.querySelector('.accessory-brand')?.value || '';
        const cost = parseFloat(row.querySelector('.accessory-cost')?.value) || 0;
        const qty = parseInt(row.querySelector('.accessory-qty')?.value) || 0;
        
        totalAccessories += cost * qty;
        
        if (type && cost > 0 && qty > 0) {
            accessoryItems.push({ type, brand, cost, qty, total: cost * qty });
        }
    });
    
    // Calculate extra labor (10% of accessories cost)
    const extraLabor = totalAccessories * 0.10;
    
    // Get base cost
    const baseCost = currentOrderData.baseCosts?.total || 0;
    const updatedTotal = baseCost + totalAccessories + extraLabor;
    
    // Update displays
    const setDisplay = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = `₱${value.toFixed(2)}`;
    };
    
    setDisplay('displayAccessoriesCost', totalAccessories);
    setDisplay('displayExtraLaborCost', extraLabor);
    setDisplay('displayUpdatedTotalCost', updatedTotal);
    
    // Store in current order data
    currentOrderData.accessories = {
        total: totalAccessories,
        extraLabor: extraLabor,
        items: accessoryItems
    };
}

// ==========================================
// QUOTATION SUMMARY GENERATION
// ==========================================

function generateQuotationSummary() {
    const summary = document.getElementById('quotationSummary');
    if (!summary) return;
    
    const clientName = document.getElementById('clientName').value;
    const clientContact = document.getElementById('clientContact').value;
    const clientAddress = document.getElementById('clientAddress').value;
    const garmentType = document.getElementById('garmentType').value;
    const sizes = getSizeBreakdown();
    const baseCosts = currentOrderData.baseCosts || {};
    const accessories = currentOrderData.accessories || { total: 0, extraLabor: 0, items: [] };
    const grandTotal = (baseCosts.total || 0) + accessories.total + accessories.extraLabor;
    
    let accessoriesHTML = '';
    if (accessories.items && accessories.items.length > 0) {
        accessoriesHTML = '<h4>Accessories</h4>';
        accessories.items.forEach(item => {
            accessoriesHTML += `
                <div class="summary-row">
                    <span class="summary-label">${escapeHtml(item.type)} ${item.brand ? '(' + escapeHtml(item.brand) + ')' : ''} × ${item.qty}:</span>
                    <span class="summary-value">₱${item.total.toFixed(2)}</span>
                </div>
            `;
        });
    }
    
    summary.innerHTML = `
        <h4>Client Details</h4>
        <div class="summary-row">
            <span class="summary-label">Client Name:</span>
            <span class="summary-value">${escapeHtml(clientName)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Contact:</span>
            <span class="summary-value">${escapeHtml(clientContact)}</span>
        </div>
        ${clientAddress ? `
        <div class="summary-row">
            <span class="summary-label">Address:</span>
            <span class="summary-value">${escapeHtml(clientAddress)}</span>
        </div>
        ` : ''}
        
        <h4>Order Information</h4>
        <div class="summary-row">
            <span class="summary-label">Garment Type:</span>
            <span class="summary-value">${escapeHtml(garmentType)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Total Quantity:</span>
            <span class="summary-value">${currentOrderData.totalQuantity || 0} pcs</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Size Breakdown:</span>
            <span class="summary-value">${escapeHtml(sizes)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Estimated Fabric:</span>
            <span class="summary-value">${(currentOrderData.totalFabric || 0).toFixed(2)} meters</span>
        </div>
        
        <h4>Base Cost Breakdown</h4>
        <div class="summary-row">
            <span class="summary-label">Fabric Cost:</span>
            <span class="summary-value">₱${(baseCosts.fabric || 0).toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Labor Cost:</span>
            <span class="summary-value">₱${(baseCosts.labor || 0).toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Overhead:</span>
            <span class="summary-value">₱${(baseCosts.overhead || 0).toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Profit:</span>
            <span class="summary-value">₱${(baseCosts.profit || 0).toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label"><strong>Base Subtotal:</strong></span>
            <span class="summary-value"><strong>₱${(baseCosts.total || 0).toFixed(2)}</strong></span>
        </div>
        
        ${accessoriesHTML}
        ${accessories.items && accessories.items.length > 0 ? `
        <div class="summary-row">
            <span class="summary-label">Accessories Subtotal:</span>
            <span class="summary-value">₱${accessories.total.toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Extra Labor (10%):</span>
            <span class="summary-value">₱${accessories.extraLabor.toFixed(2)}</span>
        </div>
        ` : ''}
        
        <div class="summary-row" style="border-top: 3px solid var(--gold-primary, #D4AF37); margin-top: 1rem; padding-top: 1rem;">
            <span class="summary-label" style="font-size: 1.2rem; font-weight: 700;">GRAND TOTAL:</span>
            <span class="summary-value" style="font-size: 1.5rem; color: var(--gold-dark, #B8962C); font-weight: 700;">₱${grandTotal.toFixed(2)}</span>
        </div>
        
        <div class="summary-row">
            <span class="summary-label">Cost Per Piece:</span>
            <span class="summary-value">₱${(grandTotal / (currentOrderData.totalQuantity || 1)).toFixed(2)}</span>
        </div>
    `;
}

// ==========================================
// SIZE BREAKDOWN HELPERS
// ==========================================

function getSizeBreakdown() {
    const sizes = currentOrderData.sizes || {};
    
    const breakdown = Object.entries(sizes)
        .filter(([size, qty]) => qty > 0)
        .map(([size, qty]) => `${size}:${qty}`)
        .join(', ');
    
    return breakdown || 'No sizes specified';
}

function setSizeBreakdown(sizeDetails) {
    // Reset all sizes
    const sizeIds = ['qtyXS', 'qtySmall', 'qtyMedium', 'qtyLarge', 'qtyXL', 'qty2XL', 'qty3XL'];
    sizeIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = 0;
    });
    
    if (!sizeDetails) {
        calculateSizeBasedMetrics();
        return;
    }
    
    const sizeMap = {
        'XS': 'qtyXS',
        'S': 'qtySmall',
        'M': 'qtyMedium',
        'L': 'qtyLarge',
        'XL': 'qtyXL',
        'XXL': 'qty2XL',
        '3XL': 'qty3XL'
    };
    
    const pairs = sizeDetails.split(',').map(s => s.trim());
    pairs.forEach(pair => {
        const [size, qty] = pair.split(':').map(s => s.trim());
        if (sizeMap[size]) {
            const el = document.getElementById(sizeMap[size]);
            if (el) el.value = parseInt(qty) || 0;
        }
    });
    
    calculateSizeBasedMetrics();
}

// ==========================================
// MODAL FUNCTIONS
// ==========================================

function openNewOrderModal() {
    currentOrderId = null;
    currentOrderData = {};
    currentStep = 1;
    
    document.getElementById('modalTitle').textContent = 'New Quotation';
    document.getElementById('orderForm').reset();
    document.getElementById('orderID').value = generateOrderId();
    document.getElementById('orderStatus').value = 'draft';
    
    // Reset sizes
    setSizeBreakdown('');
    
    // Reset accessories table
    const tbody = document.getElementById('accessoriesTableBody');
    tbody.innerHTML = `
        <tr class="empty-accessories">
            <td colspan="6" style="text-align: center; padding: 2rem; color: #999;">
                No accessories added yet
            </td>
        </tr>
    `;
    
    // Go to step 1
    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    document.querySelector('.form-step[data-step="1"]').classList.add('active');
    updateProgressSteps(1);
    
    document.getElementById('orderModal').classList.add('active');
}

function openEditOrderModal(orderId) {
    currentOrderId = orderId;
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        showNotification('Order not found.', 'error');
        return;
    }
    
    currentOrderData = {};
    currentStep = 1;
    
    document.getElementById('modalTitle').textContent = 'Edit Order';
    document.getElementById('orderID').value = order.id;
    document.getElementById('clientName').value = order.clientName || '';
    document.getElementById('clientContact').value = order.clientContact || '';
    document.getElementById('clientAddress').value = order.clientAddress || '';
    document.getElementById('garmentType').value = order.garmentType || '';
    document.getElementById('fabricType').value = order.fabricType || '';
    document.getElementById('specialInstructions').value = order.specialInstructions || '';
    document.getElementById('orderStatus').value = order.status || 'draft';
    
    setSizeBreakdown(order.sizeDetails || '');
    
    // Go to step 1
    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    document.querySelector('.form-step[data-step="1"]').classList.add('active');
    updateProgressSteps(1);
    
    document.getElementById('orderModal').classList.add('active');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
    document.getElementById('orderForm').reset();
    currentOrderId = null;
    currentOrderData = {};
    currentStep = 1;
}

function openJobOrderModal(orderId) {
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        showNotification('Order not found.', 'error');
        return;
    }
    
    if (order.status !== 'approved') {
        showNotification('Order must be approved before creating a job order.', 'error');
        return;
    }
    
    if (order.hasJobOrder) {
        showNotification('This order already has a job order.', 'error');
        return;
    }
    
    document.getElementById('jobOrderOrderId').value = orderId;
    document.getElementById('jobOrderNumber').value = generateJobOrderNumber();
    document.getElementById('jobOrderForm').reset();
    document.getElementById('jobOrderNumber').value = generateJobOrderNumber();
    
    document.getElementById('jobOrderModal').classList.add('active');
}

function closeJobOrderModal() {
    document.getElementById('jobOrderModal').classList.remove('active');
    document.getElementById('jobOrderForm').reset();
}

function openViewOrderModal(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        showNotification('Order not found.', 'error');
        return;
    }
    
    const jobOrder = jobOrders.find(j => j.orderId === orderId);
    
    let html = `
        <div class="order-details-grid">
            <div class="detail-section">
                <h3>Client Information</h3>
                <div class="detail-row">
                    <span class="detail-label">Client Name:</span>
                    <span class="detail-value">${escapeHtml(order.clientName || 'N/A')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Contact:</span>
                    <span class="detail-value">${escapeHtml(order.clientContact || 'N/A')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Address:</span>
                    <span class="detail-value">${escapeHtml(order.clientAddress || 'N/A')}</span>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Order Information</h3>
                <div class="detail-row">
                    <span class="detail-label">Order ID:</span>
                    <span class="detail-value">${escapeHtml(order.id || 'N/A')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date Created:</span>
                    <span class="detail-value">${order.dateCreated || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">
                        <span class="status-badge status-${order.status || 'draft'}">${formatStatus(order.status || 'draft')}</span>
                    </span>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Product Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Garment Type:</span>
                    <span class="detail-value">${escapeHtml(order.garmentType || 'N/A')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Quantity:</span>
                    <span class="detail-value">${order.quantity || 0} pcs</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Size Details:</span>
                    <span class="detail-value">${escapeHtml(order.sizeDetails || 'N/A')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Fabric Type:</span>
                    <span class="detail-value">${escapeHtml(order.fabricType || 'N/A')}</span>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Quotation</h3>
                <div class="detail-row">
                    <span class="detail-label">Cost Per Piece:</span>
                    <span class="detail-value">₱${order.estimatedCostPerPiece ? order.estimatedCostPerPiece.toFixed(2) : '0.00'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Total Estimated Cost:</span>
                    <span class="detail-value">₱${order.estimatedCost ? order.estimatedCost.toFixed(2) : '0.00'}</span>
                </div>
            </div>
        </div>
        
        <div class="detail-section" style="margin-top: 1.5rem;">
            <h3>Special Instructions</h3>
            <p style="padding: 1rem; background: var(--cream, #FFF8E6); border-radius: 4px;">
                ${escapeHtml(order.specialInstructions || 'No special instructions')}
            </p>
        </div>
    `;
    
    if (jobOrder) {
        html += `
            <div class="detail-section" style="margin-top: 1.5rem;">
                <h3>Job Order Details</h3>
                <div class="order-details-grid">
                    <div class="detail-row">
                        <span class="detail-label">Job Order Number:</span>
                        <span class="detail-value">${escapeHtml(jobOrder.jobOrderNumber || 'N/A')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Department:</span>
                        <span class="detail-value">${escapeHtml(jobOrder.assignedDepartment || 'N/A')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Priority:</span>
                        <span class="detail-value">${escapeHtml(jobOrder.priorityLevel || 'N/A')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Target Start:</span>
                        <span class="detail-value">${jobOrder.targetStartDate || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Target Completion:</span>
                        <span class="detail-value">${jobOrder.targetCompletionDate || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">
                            <span class="status-badge status-${jobOrder.status || 'pending'}">${formatStatus(jobOrder.status || 'pending')}</span>
                        </span>
                    </div>
                </div>
                ${jobOrder.notes ? `<p style="padding: 1rem; background: var(--cream, #FFF8E6); border-radius: 4px; margin-top: 1rem;">${escapeHtml(jobOrder.notes)}</p>` : ''}
            </div>
        `;
    }
    
    document.getElementById('orderDetailsContent').innerHTML = html;
    document.getElementById('viewOrderModal').classList.add('active');
}

function closeViewOrderModal() {
    document.getElementById('viewOrderModal').classList.remove('active');
}

function closeAllModals() {
    closeOrderModal();
    closeJobOrderModal();
    closeViewOrderModal();
}

// ==========================================
// FORM HANDLERS
// ==========================================

async function handleOrderSubmit(e) {
    e.preventDefault();
    
    const totalQty = calculateSizeBasedMetrics();
    
    if (totalQty === 0) {
        showNotification('Please enter at least one size quantity.', 'error');
        return;
    }
    
    const baseCosts = currentOrderData.baseCosts || {};
    const accessories = currentOrderData.accessories || {};
    const grandTotal = (baseCosts.total || 0) + (accessories.total || 0) + (accessories.extraLabor || 0);
    
    const formData = {
        id: document.getElementById('orderID').value,
        clientName: document.getElementById('clientName').value,
        clientContact: document.getElementById('clientContact').value,
        clientAddress: document.getElementById('clientAddress').value,
        garmentType: document.getElementById('garmentType').value,
        quantity: totalQty,
        sizeDetails: getSizeBreakdown(),
        fabricType: document.getElementById('fabricType').value,
        specialInstructions: document.getElementById('specialInstructions').value,
        status: document.getElementById('orderStatus').value,
        estimatedCostPerPiece: grandTotal / totalQty,
        estimatedCost: grandTotal,
        dateCreated: new Date().toISOString().split('T')[0],
        hasJobOrder: false,
        baseCosts: baseCosts,
        accessories: accessories
    };
    
    try {
        // TODO: Replace with actual API call
        // const method = currentOrderId ? 'PUT' : 'POST';
        // const url = currentOrderId 
        //     ? `${Config.apiBaseUrl}${Config.endpoints.orders}/${currentOrderId}`
        //     : `${Config.apiBaseUrl}${Config.endpoints.orders}`;
        // 
        // const response = await fetch(url, {
        //     method: method,
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(formData)
        // });
        // 
        // if (!response.ok) throw new Error('Failed to save order');
        
        if (currentOrderId) {
            const index = orders.findIndex(o => o.id === currentOrderId);
            if (index !== -1) {
                formData.hasJobOrder = orders[index].hasJobOrder;
                formData.dateCreated = orders[index].dateCreated;
                orders[index] = formData;
            }
        } else {
            orders.push(formData);
        }
        
        closeOrderModal();
        renderOrdersTable();
        updateStatistics();
        
        showNotification('Order saved successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving order:', error);
        showNotification('Failed to save order. Check backend connection.', 'error');
    }
}

async function handleJobOrderSubmit(e) {
    e.preventDefault();
    
    const orderId = document.getElementById('jobOrderOrderId').value;
    
    const jobOrderData = {
        jobOrderNumber: document.getElementById('jobOrderNumber').value,
        orderId: orderId,
        assignedDepartment: document.getElementById('assignedDepartment').value,
        targetStartDate: document.getElementById('targetStartDate').value,
        targetCompletionDate: document.getElementById('targetCompletionDate').value,
        priorityLevel: document.getElementById('priorityLevel').value,
        notes: document.getElementById('jobOrderNotes').value,
        status: 'ready_for_production',
        dateCreated: new Date().toISOString().split('T')[0]
    };
    
    try {
        // TODO: Replace with actual API call
        // const response = await fetch(`${Config.apiBaseUrl}${Config.endpoints.jobOrders}`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(jobOrderData)
        // });
        // 
        // if (!response.ok) throw new Error('Failed to create job order');
        
        jobOrders.push(jobOrderData);
        
        // Update order status
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            orders[orderIndex].status = 'job_created';
            orders[orderIndex].hasJobOrder = true;
        }
        
        closeJobOrderModal();
        renderOrdersTable();
        updateStatistics();
        
        showNotification('Job order created successfully!', 'success');
        
    } catch (error) {
        console.error('Error creating job order:', error);
        showNotification('Failed to create job order. Check backend connection.', 'error');
    }
}

// ==========================================
// GENERATE FUNCTIONS
// ==========================================

function generateOrderId() {
    return `ORD-${orderCounter++}`;
}

function generateJobOrderNumber() {
    return `JOB-${jobCounter++}`;
}

// ==========================================
// TABLE RENDERING
// ==========================================

function renderOrdersTable(filteredOrders = null) {
    const tbody = document.getElementById('ordersTableBody');
    const ordersToRender = filteredOrders || orders;
    
    if (ordersToRender.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="7">
                    <div class="empty-message">
                        <span class="empty-icon">📋</span>
                        <p>No orders yet. Click "New Quotation" to create your first order.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = ordersToRender.map(order => `
        <tr>
            <td><strong>${escapeHtml(order.id || 'N/A')}</strong></td>
            <td>${escapeHtml(order.clientName || 'Unknown')}</td>
            <td>${escapeHtml(order.garmentType || 'N/A')}</td>
            <td>${order.quantity || 0} pcs</td>
            <td>
                <span class="status-badge status-${order.status || 'draft'}">
                    ${formatStatus(order.status || 'draft')}
                </span>
            </td>
            <td>${order.dateCreated || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn action-btn-view" onclick="openViewOrderModal('${order.id}')">
                        View
                    </button>
                    <button class="action-btn action-btn-edit" onclick="openEditOrderModal('${order.id}')">
                        Edit
                    </button>
                    ${order.status === 'approved' && !order.hasJobOrder ? 
                        `<button class="action-btn action-btn-job" onclick="openJobOrderModal('${order.id}')">
                            Create Job
                        </button>` : ''}
                    <button class="action-btn action-btn-delete" onclick="deleteOrder('${order.id}')">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ==========================================
// STATISTICS UPDATE
// ==========================================

async function updateStatistics() {
    try {
        // TODO: Replace with actual API call
        // const response = await fetch(`${Config.apiBaseUrl}${Config.endpoints.stats}`);
        // const stats = await response.json();
        
        // Calculate from loaded orders
        const stats = {
            draft: orders.filter(o => o.status === 'draft').length,
            quoted: orders.filter(o => o.status === 'quoted').length,
            approved: orders.filter(o => o.status === 'approved').length,
            jobOrders: jobOrders.length
        };
        
        document.getElementById('draftCount').textContent = stats.draft || 0;
        document.getElementById('quotedCount').textContent = stats.quoted || 0;
        document.getElementById('approvedCount').textContent = stats.approved || 0;
        document.getElementById('jobOrderCount').textContent = stats.jobOrders || 0;
        
    } catch (error) {
        console.error('Error updating statistics:', error);
        // Show zero values on error
        document.getElementById('draftCount').textContent = '0';
        document.getElementById('quotedCount').textContent = '0';
        document.getElementById('approvedCount').textContent = '0';
        document.getElementById('jobOrderCount').textContent = '0';
    }
}

// ==========================================
// SEARCH AND FILTER
// ==========================================

function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (searchTerm === '') {
        renderOrdersTable();
        return;
    }
    
    const filtered = orders.filter(order => 
        (order.id && order.id.toLowerCase().includes(searchTerm)) ||
        (order.clientName && order.clientName.toLowerCase().includes(searchTerm)) ||
        (order.garmentType && order.garmentType.toLowerCase().includes(searchTerm))
    );
    
    renderOrdersTable(filtered);
}

function applyFilter() {
    const statusFilter = document.getElementById('statusFilter').value;
    
    if (statusFilter === 'all') {
        renderOrdersTable();
        return;
    }
    
    const filtered = orders.filter(order => order.status === statusFilter);
    renderOrdersTable(filtered);
}

// ==========================================
// DELETE ORDER
// ==========================================

function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) {
        return;
    }
    
    // Remove order
    orders = orders.filter(o => o.id !== orderId);
    
    // Remove associated job order if exists
    jobOrders = jobOrders.filter(j => j.orderId !== orderId);
    
    renderOrdersTable();
    updateStatistics();
    
    showNotification('Order deleted successfully!', 'success');
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function formatStatus(status) {
    const statusMap = {
        'draft': 'Draft',
        'quoted': 'Quoted',
        'approved': 'Approved',
        'job_created': 'Job Created',
        'ready_for_production': 'Ready for Production'
    };
    return statusMap[status] || status;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function showNotification(message, type = 'info') {
    // Simple notification (can be enhanced with toast)
    alert(message);
}

function showError(message) {
    console.error(message);
    showNotification(message, 'error');
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        if (window.GoldenThreadsAuth && window.GoldenThreadsAuth.logout) {
            window.GoldenThreadsAuth.logout();
        } else {
            sessionStorage.clear();
            window.location.href = '/templates/log_in.html';
        }
    }
}

// ==========================================
// CONSOLE INFO
// ==========================================

console.log('%cOrder Management Module - Database Ready', 'color: #2C3E50; font-weight: bold;');
console.log('%c⚠️ No hardcoded data. Connect to backend API to load orders.', 'color: #F39C12;');
console.log('%cAPI Configuration:', 'color: #3498DB;', Config);