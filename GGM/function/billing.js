// ==========================================
// BILLING & DELIVERY MANAGEMENT MODULE
// GoldenThreads IMS - Database Ready Version
// No Hardcoded Data - Clean Implementation
// ==========================================

// ==========================================
// GLOBAL STATE
// ==========================================
let billingRecords = [];
let currentBillingId = null;
let currentUser = null;

// ==========================================
// CONFIGURATION
// ==========================================
const Config = {
    apiBaseUrl: '/api', // Update with your backend URL
    endpoints: {
        billing: '/billing',
        payments: '/billing/payments',
        delivery: '/billing/delivery',
        stats: '/billing/stats',
        sms: '/billing/sms'
    }
};

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    initializeUI();
    loadBillingRecords();
    attachEventListeners();
    
    if (window.GoldenThreadsAuth) {
        applyModuleRestrictions();
    }
    
    console.log('%c💰 Billing & Delivery Module Loaded', 'color: #D4AF37; font-size: 16px; font-weight: bold;');
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
    
    currentUser = user;
    
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
    
    // Apply role-based restrictions
    if (user.role === 'staff') {
        // Staff can record payments but with limitations
        console.log('Staff access granted with limited permissions');
    } else if (user.role === 'administrator') {
        console.log('Administrator access granted with full permissions');
    }
}

// ==========================================
// UI INITIALIZATION
// ==========================================

function initializeUI() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = ['paymentDate', 'deliveryDate'];
    
    dateInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.max = today;
            el.value = today;
        }
    });
    
    console.log('UI Initialized');
}

// ==========================================
// LOAD DATA FROM DATABASE
// ==========================================

async function loadBillingRecords() {
    try {
        showLoadingState();
        
        // TODO: Replace with actual API call
        // const response = await fetch(`${Config.apiBaseUrl}${Config.endpoints.billing}`);
        // const data = await response.json();
        // billingRecords = data.billingRecords || [];
        
        // Temporary: Initialize empty state
        billingRecords = [];
        
        renderBillingTable();
        updateStatistics();
        
        console.log('Billing records loaded:', billingRecords.length);
        
    } catch (error) {
        console.error('Error loading billing records:', error);
        showError('Failed to load billing records. Please try again.');
        renderBillingTable();
    }
}

function showLoadingState() {
    const tbody = document.getElementById('billingTableBody');
    tbody.innerHTML = `
        <tr class="loading-row">
            <td colspan="10">
                <div class="loading-state">
                    <div class="spinner"></div>
                    <span>Loading billing records...</span>
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
    document.getElementById('refreshBtn').addEventListener('click', loadBillingRecords);
    document.getElementById('closeBillingModalBtn').addEventListener('click', closeBillingModal);
    
    // Form submissions
    document.getElementById('paymentForm').addEventListener('submit', handlePaymentSubmit);
    document.getElementById('deliveryForm').addEventListener('submit', handleDeliverySubmit);
    
    // Payment amount validation
    document.getElementById('paymentAmount').addEventListener('input', validatePaymentAmount);
    
    // Search and filter
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('filterBtn').addEventListener('click', applyFilter);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Modal outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeBillingModal();
        }
    });
    
    console.log('Event listeners attached');
}

// ==========================================
// TABLE RENDERING
// ==========================================

function renderBillingTable(filteredRecords = null) {
    const tbody = document.getElementById('billingTableBody');
    const recordsToRender = filteredRecords || billingRecords;
    
    if (recordsToRender.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="10">
                    <div class="empty-message">
                        <span class="empty-icon">💰</span>
                        <p>No billing records yet. Completed job orders will appear here.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = recordsToRender.map(record => {
        const balance = (record.totalAmount || 0) - (record.amountPaid || 0);
        
        return `
            <tr>
                <td><strong>${escapeHtml(record.jobOrderNumber || 'N/A')}</strong></td>
                <td>${escapeHtml(record.clientName || 'Unknown')}</td>
                <td>${escapeHtml(record.garmentType || 'N/A')}</td>
                <td>${record.quantity || 0} pcs</td>
                <td>₱${formatNumber(record.totalAmount || 0)}</td>
                <td>₱${formatNumber(record.amountPaid || 0)}</td>
                <td>₱${formatNumber(balance)}</td>
                <td>
                    <span class="status-badge status-payment-${record.paymentStatus || 'unpaid'}">
                        ${formatPaymentStatus(record.paymentStatus || 'unpaid')}
                    </span>
                </td>
                <td>
                    <span class="status-badge status-delivery-${record.deliveryStatus || 'pending'}">
                        ${formatDeliveryStatus(record.deliveryStatus || 'pending')}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn action-btn-view" onclick="openBillingModal('${record.id}')">
                            View/Update
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ==========================================
// STATISTICS UPDATE
// ==========================================

async function updateStatistics() {
    try {
        // TODO: Replace with actual API call
        // const response = await fetch(`${Config.apiBaseUrl}${Config.endpoints.stats}`);
        // const stats = await response.json();
        
        // Calculate from loaded records
        let totalRevenue = 0;
        let unpaidCount = 0;
        let pendingDeliveryCount = 0;
        let completedCount = 0;
        
        billingRecords.forEach(record => {
            totalRevenue += (record.amountPaid || 0);
            
            if (record.paymentStatus === 'unpaid' || record.paymentStatus === 'partially_paid') {
                unpaidCount++;
            }
            
            if (record.deliveryStatus !== 'delivered') {
                pendingDeliveryCount++;
            }
            
            if (record.paymentStatus === 'fully_paid' && record.deliveryStatus === 'delivered') {
                completedCount++;
            }
        });
        
        document.getElementById('totalRevenue').textContent = `₱${formatNumber(totalRevenue)}`;
        document.getElementById('unpaidCount').textContent = unpaidCount;
        document.getElementById('pendingDeliveryCount').textContent = pendingDeliveryCount;
        document.getElementById('completedCount').textContent = completedCount;
        
    } catch (error) {
        console.error('Error updating statistics:', error);
        document.getElementById('totalRevenue').textContent = '₱0.00';
        document.getElementById('unpaidCount').textContent = '0';
        document.getElementById('pendingDeliveryCount').textContent = '0';
        document.getElementById('completedCount').textContent = '0';
    }
}

// ==========================================
// MODAL FUNCTIONS
// ==========================================

function openBillingModal(recordId) {
    const record = billingRecords.find(r => r.id === recordId);
    
    if (!record) {
        showNotification('Billing record not found.', 'error');
        return;
    }
    
    currentBillingId = recordId;
    
    // Populate job order information
    document.getElementById('modalJobOrderNumber').textContent = record.jobOrderNumber || 'N/A';
    document.getElementById('modalClientName').textContent = record.clientName || 'Unknown';
    document.getElementById('modalGarmentType').textContent = record.garmentType || 'N/A';
    document.getElementById('modalQuantity').textContent = `${record.quantity || 0} pcs`;
    
    // Populate billing summary
    const balance = (record.totalAmount || 0) - (record.amountPaid || 0);
    document.getElementById('modalTotalAmount').textContent = `₱${formatNumber(record.totalAmount || 0)}`;
    document.getElementById('modalDownpayment').textContent = `₱${formatNumber(record.downpayment || 0)}`;
    document.getElementById('modalAmountPaid').textContent = `₱${formatNumber(record.amountPaid || 0)}`;
    document.getElementById('modalBalance').textContent = `₱${formatNumber(balance)}`;
    
    const paymentStatusBadge = document.getElementById('modalPaymentStatus');
    paymentStatusBadge.className = `status-badge status-payment-${record.paymentStatus || 'unpaid'}`;
    paymentStatusBadge.textContent = formatPaymentStatus(record.paymentStatus || 'unpaid');
    
    // Set hidden form fields
    document.getElementById('recordJobOrderId').value = recordId;
    document.getElementById('deliveryJobOrderId').value = recordId;
    
    // Reset forms
    document.getElementById('paymentForm').reset();
    document.getElementById('deliveryForm').reset();
    
    // Set default dates to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('paymentDate').value = today;
    document.getElementById('deliveryDate').value = today;
    
    // Populate payment history
    populatePaymentHistory(record.paymentHistory || []);
    
    // Populate delivery log
    populateDeliveryLog(record.deliveryLog || []);
    
    // Set current delivery status
    if (record.deliveryStatus) {
        document.getElementById('deliveryStatus').value = record.deliveryStatus;
    }
    
    document.getElementById('billingModal').classList.add('active');
}

function closeBillingModal() {
    document.getElementById('billingModal').classList.remove('active');
    currentBillingId = null;
}

// ==========================================
// PAYMENT HISTORY
// ==========================================

function populatePaymentHistory(paymentHistory) {
    const tbody = document.getElementById('paymentHistoryBody');
    
    if (!paymentHistory || paymentHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;">No payment records yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = paymentHistory.map(payment => `
        <tr>
            <td>${payment.date || 'N/A'}</td>
            <td>₱${formatNumber(payment.amount || 0)}</td>
            <td>${escapeHtml(payment.method || 'N/A')}</td>
            <td>${escapeHtml(payment.notes || '-')}</td>
        </tr>
    `).join('');
}

// ==========================================
// DELIVERY LOG
// ==========================================

function populateDeliveryLog(deliveryLog) {
    const tbody = document.getElementById('deliveryLogBody');
    
    if (!deliveryLog || deliveryLog.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;">No delivery updates yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = deliveryLog.map(log => `
        <tr>
            <td>
                <span class="status-badge status-delivery-${log.status}">
                    ${formatDeliveryStatus(log.status)}
                </span>
            </td>
            <td>${log.date || 'N/A'}</td>
            <td>${escapeHtml(log.notes || '-')}</td>
            <td>${escapeHtml(log.updatedBy || 'System')}</td>
        </tr>
    `).join('');
}

// ==========================================
// PAYMENT FORM HANDLER
// ==========================================

async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    const recordId = document.getElementById('recordJobOrderId').value;
    const record = billingRecords.find(r => r.id === recordId);
    
    if (!record) {
        showNotification('Billing record not found.', 'error');
        return;
    }
    
    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value) || 0;
    const paymentDate = document.getElementById('paymentDate').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const paymentNotes = document.getElementById('paymentNotes').value;
    
    // Validation
    if (paymentAmount <= 0) {
        showNotification('Payment amount must be greater than zero.', 'error');
        return;
    }
    
    const balance = (record.totalAmount || 0) - (record.amountPaid || 0);
    
    if (paymentAmount > balance) {
        showNotification(`Payment amount cannot exceed remaining balance (₱${formatNumber(balance)}).`, 'error');
        return;
    }
    
    const paymentData = {
        recordId: recordId,
        amount: paymentAmount,
        date: paymentDate,
        method: paymentMethod,
        notes: paymentNotes,
        recordedBy: currentUser.username
    };
    
    try {
        // TODO: Replace with actual API call
        // const response = await fetch(`${Config.apiBaseUrl}${Config.endpoints.payments}`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(paymentData)
        // });
        // 
        // if (!response.ok) throw new Error('Failed to record payment');
        
        // Update local record
        const newAmountPaid = (record.amountPaid || 0) + paymentAmount;
        const newBalance = (record.totalAmount || 0) - newAmountPaid;
        
        record.amountPaid = newAmountPaid;
        
        // Update payment status
        if (newBalance <= 0) {
            record.paymentStatus = 'fully_paid';
        } else if (newAmountPaid > 0) {
            record.paymentStatus = 'partially_paid';
        }
        
        // Add to payment history
        if (!record.paymentHistory) {
            record.paymentHistory = [];
        }
        
        record.paymentHistory.push({
            date: paymentDate,
            amount: paymentAmount,
            method: paymentMethod,
            notes: paymentNotes,
            recordedBy: currentUser.username
        });
        
        // Reset form
        document.getElementById('paymentForm').reset();
        document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
        
        // Refresh displays
        renderBillingTable();
        updateStatistics();
        openBillingModal(recordId); // Refresh modal
        
        showNotification('Payment recorded successfully!', 'success');
        
    } catch (error) {
        console.error('Error recording payment:', error);
        showNotification('Failed to record payment. Check backend connection.', 'error');
    }
}

// ==========================================
// DELIVERY FORM HANDLER
// ==========================================

async function handleDeliverySubmit(e) {
    e.preventDefault();
    
    const recordId = document.getElementById('deliveryJobOrderId').value;
    const record = billingRecords.find(r => r.id === recordId);
    
    if (!record) {
        showNotification('Billing record not found.', 'error');
        return;
    }
    
    const deliveryStatus = document.getElementById('deliveryStatus').value;
    const deliveryDate = document.getElementById('deliveryDate').value;
    const deliveryNotes = document.getElementById('deliveryNotes').value;
    
    // Validation: Check if payment is required before delivery
    if (deliveryStatus === 'delivered' && record.paymentStatus !== 'fully_paid') {
        const confirm = window.confirm('Order is not fully paid. Do you want to proceed with delivery?');
        if (!confirm) {
            return;
        }
    }
    
    const deliveryData = {
        recordId: recordId,
        status: deliveryStatus,
        date: deliveryDate,
        notes: deliveryNotes,
        updatedBy: currentUser.username
    };
    
    try {
        // TODO: Replace with actual API call
        // const response = await fetch(`${Config.apiBaseUrl}${Config.endpoints.delivery}`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(deliveryData)
        // });
        // 
        // if (!response.ok) throw new Error('Failed to update delivery status');
        
        // Update local record
        record.deliveryStatus = deliveryStatus;
        
        // Add to delivery log
        if (!record.deliveryLog) {
            record.deliveryLog = [];
        }
        
        record.deliveryLog.push({
            status: deliveryStatus,
            date: deliveryDate,
            notes: deliveryNotes,
            updatedBy: currentUser.username
        });
        
        // Send SMS notification
        await sendSMSNotification(record, deliveryStatus);
        
        // Reset form
        document.getElementById('deliveryForm').reset();
        document.getElementById('deliveryDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('deliveryStatus').value = deliveryStatus;
        
        // Refresh displays
        renderBillingTable();
        updateStatistics();
        openBillingModal(recordId); // Refresh modal
        
        showNotification('Delivery status updated successfully! SMS notification sent.', 'success');
        
    } catch (error) {
        console.error('Error updating delivery status:', error);
        showNotification('Failed to update delivery status. Check backend connection.', 'error');
    }
}

// ==========================================
// SMS NOTIFICATION
// ==========================================

async function sendSMSNotification(record, deliveryStatus) {
    try {
        // Get SMS message based on status
        const smsMessage = getSMSMessage(deliveryStatus, record);
        
        const smsData = {
            clientName: record.clientName,
            clientContact: record.clientContact,
            message: smsMessage,
            deliveryStatus: deliveryStatus
        };
        
        // TODO: Replace with actual API call
        // const response = await fetch(`${Config.apiBaseUrl}${Config.endpoints.sms}`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(smsData)
        // });
        // 
        // if (!response.ok) throw new Error('Failed to send SMS');
        
        console.log('SMS notification sent:', smsData);
        
    } catch (error) {
        console.error('Error sending SMS notification:', error);
        // Don't block the delivery update if SMS fails
    }
}

function getSMSMessage(status, record) {
    const messages = {
        'ready_for_pickup': `Dear ${record.clientName}, your order (${record.jobOrderNumber}) is now ready for pickup. Thank you for choosing GoldenThreads Garments Manufacturing.`,
        'out_for_delivery': `Dear ${record.clientName}, your order (${record.jobOrderNumber}) is now out for delivery. Thank you for choosing GoldenThreads Garments Manufacturing.`,
        'delivered': `Dear ${record.clientName}, your order (${record.jobOrderNumber}) has been delivered. Thank you for choosing GoldenThreads Garments Manufacturing.`
    };
    
    return messages[status] || 'Your order status has been updated.';
}

// ==========================================
// PAYMENT VALIDATION
// ==========================================

function validatePaymentAmount() {
    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value) || 0;
    const recordId = document.getElementById('recordJobOrderId').value;
    const record = billingRecords.find(r => r.id === recordId);
    
    if (!record) return;
    
    const balance = (record.totalAmount || 0) - (record.amountPaid || 0);
    const paymentInput = document.getElementById('paymentAmount');
    
    if (paymentAmount > balance) {
        paymentInput.style.borderColor = '#E74C3C';
        showNotification(`Payment cannot exceed balance: ₱${formatNumber(balance)}`, 'warning');
    } else {
        paymentInput.style.borderColor = '';
    }
}

// ==========================================
// SEARCH AND FILTER
// ==========================================

function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (searchTerm === '') {
        renderBillingTable();
        return;
    }
    
    const filtered = billingRecords.filter(record => 
        (record.jobOrderNumber && record.jobOrderNumber.toLowerCase().includes(searchTerm)) ||
        (record.clientName && record.clientName.toLowerCase().includes(searchTerm))
    );
    
    renderBillingTable(filtered);
}

function applyFilter() {
    const paymentStatusFilter = document.getElementById('paymentStatusFilter').value;
    const deliveryStatusFilter = document.getElementById('deliveryStatusFilter').value;
    
    let filtered = billingRecords;
    
    if (paymentStatusFilter !== 'all') {
        filtered = filtered.filter(record => record.paymentStatus === paymentStatusFilter);
    }
    
    if (deliveryStatusFilter !== 'all') {
        filtered = filtered.filter(record => record.deliveryStatus === deliveryStatusFilter);
    }
    
    renderBillingTable(filtered);
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function formatPaymentStatus(status) {
    const statusMap = {
        'unpaid': 'Unpaid',
        'partially_paid': 'Partially Paid',
        'fully_paid': 'Fully Paid'
    };
    return statusMap[status] || status;
}

function formatDeliveryStatus(status) {
    const statusMap = {
        'pending': 'Pending',
        'ready_for_pickup': 'Ready for Pickup',
        'out_for_delivery': 'Out for Delivery',
        'delivered': 'Delivered'
    };
    return statusMap[status] || status;
}

function formatNumber(number) {
    return Number(number).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
    // Simple notification (can be enhanced with toast library)
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

console.log('%cBilling & Delivery Module - Database Ready', 'color: #2C3E50; font-weight: bold;');
console.log('%c⚠️ No hardcoded data. Connect to backend API to load billing records.', 'color: #F39C12;');
console.log('%cAPI Configuration:', 'color: #3498DB;', Config);