// ==========================================
// REPORTS & ANALYTICS MODULE
// GoldenThreads IMS - Read-Only Analysis Module
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('%c📊 Reports & Analytics Module Initializing...', 'color: #D4AF37; font-weight: bold;');
    
    // Initialize module
    initializeReportsModule();
});

// ==========================================
// MODULE INITIALIZATION
// ==========================================

function initializeReportsModule() {
    // Display current date
    displayCurrentDate();
    
    // Set default date range (current month)
    setDefaultDateRange();
    
    // Initialize tab switching
    initializeReportTabs();
    
    // Initialize filter controls
    initializeFilterControls();
    
    // Load initial data
    loadSummaryData();
    loadReportData('production');
    
    // Initialize export/print buttons
    initializeExportPrint();
    
    console.log('%c✓ Reports & Analytics Module Ready', 'color: #27AE60; font-weight: bold;');
}

// ==========================================
// DATE DISPLAY & DEFAULT RANGE
// ==========================================

function displayCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (!dateElement) return;
    
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', options);
    
    dateElement.textContent = formattedDate;
}

function setDefaultDateRange() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput) {
        startDateInput.value = formatDateForInput(firstDayOfMonth);
    }
    
    if (endDateInput) {
        endDateInput.value = formatDateForInput(today);
    }
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ==========================================
// TAB SWITCHING
// ==========================================

function initializeReportTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const reportType = button.getAttribute('data-report');
            
            // Update active tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show corresponding report
            const allReports = document.querySelectorAll('.report-content');
            allReports.forEach(report => report.classList.remove('active'));
            
            const activeReport = document.getElementById(`${reportType}Report`);
            if (activeReport) {
                activeReport.classList.add('active');
                
                // Load data for this report if not already loaded
                loadReportData(reportType);
            }
            
            console.log(`Switched to ${reportType} report`);
        });
    });
}

// ==========================================
// FILTER CONTROLS
// ==========================================

function initializeFilterControls() {
    const generateBtn = document.getElementById('generateReportBtn');
    const resetBtn = document.getElementById('resetFiltersBtn');
    
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            console.log('Generating report with filters...');
            
            const filters = getFilterValues();
            console.log('Applied filters:', filters);
            
            // Show loading state
            showLoadingState();
            
            // Reload all data with filters
            setTimeout(() => {
                loadSummaryData();
                
                // Reload current active report
                const activeTab = document.querySelector('.tab-btn.active');
                const reportType = activeTab ? activeTab.getAttribute('data-report') : 'production';
                loadReportData(reportType);
                
                showNotification('Report generated successfully!', 'success');
            }, 1000);
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            console.log('Resetting filters...');
            
            // Reset date range
            setDefaultDateRange();
            
            // Reset category
            const categorySelect = document.getElementById('reportCategory');
            if (categorySelect) {
                categorySelect.value = 'all';
            }
            
            // Reload data
            loadSummaryData();
            const activeTab = document.querySelector('.tab-btn.active');
            const reportType = activeTab ? activeTab.getAttribute('data-report') : 'production';
            loadReportData(reportType);
            
            showNotification('Filters reset to default', 'info');
        });
    }
}

function getFilterValues() {
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    const category = document.getElementById('reportCategory')?.value;
    
    return {
        startDate,
        endDate,
        category
    };
}

// ==========================================
// LOAD SUMMARY DATA
// ==========================================

function loadSummaryData() {
    console.log('Loading summary data...');
    
    // Simulate API call with setTimeout
    setTimeout(() => {
        updateSummaryCard('totalOrders', 124);
        updateSummaryCard('totalSales', '₱854,320.00');
        updateSummaryCard('totalMaterials', '2,450 units');
        updateSummaryCard('totalPayroll', '₱425,800.00');
        updateSummaryCard('deliveryRate', '94.5%');
    }, 500);
}

function updateSummaryCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Animate the value change
    const duration = 800;
    const startTime = performance.now();
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // For numeric values, animate counting
        if (typeof value === 'number') {
            const current = Math.floor(progress * value);
            element.textContent = current;
        } else {
            // For text values, just set after animation
            if (progress >= 1) {
                element.textContent = value;
            }
        }
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
}

// ==========================================
// LOAD REPORT DATA
// ==========================================

function loadReportData(reportType) {
    console.log(`Loading ${reportType} report data...`);
    
    const tableBodyId = `${reportType}TableBody`;
    const tableBody = document.getElementById(tableBodyId);
    
    if (!tableBody) {
        console.warn(`Table body not found: ${tableBodyId}`);
        return;
    }
    
    // Show loading state
    tableBody.innerHTML = `
        <tr class="loading-row">
            <td colspan="6" class="loading-cell">
                <div class="loading-spinner"></div>
                <p>Loading ${reportType} data...</p>
            </td>
        </tr>
    `;
    
    // Simulate API call
    setTimeout(() => {
        const data = getMockReportData(reportType);
        populateReportTable(tableBodyId, data, reportType);
    }, 800);
}

// ==========================================
// MOCK DATA GENERATION
// ==========================================

function getMockReportData(reportType) {
    switch (reportType) {
        case 'production':
            return [
                { jobOrder: 'JO-2024-001', garmentType: 'Corporate Uniform', quantity: 150, stage: 'Completed', completionDate: '2024-01-25', status: 'Completed' },
                { jobOrder: 'JO-2024-002', garmentType: 'School Uniform', quantity: 200, stage: 'Quality Check', completionDate: '2024-01-26', status: 'In Progress' },
                { jobOrder: 'JO-2024-003', garmentType: 'Hospital Scrubs', quantity: 100, stage: 'Sewing', completionDate: '2024-01-28', status: 'In Progress' },
                { jobOrder: 'JO-2024-004', garmentType: 'Restaurant Uniform', quantity: 75, stage: 'Cutting', completionDate: '2024-01-29', status: 'Pending' },
                { jobOrder: 'JO-2024-005', garmentType: 'Security Uniform', quantity: 120, stage: 'Completed', completionDate: '2024-01-24', status: 'Completed' },
            ];
        
        case 'inventory':
            return [
                { material: 'Cotton Fabric - White', quantityUsed: 250, remaining: 150, unit: 'yards', usageDate: '2024-01-26', status: 'Low' },
                { material: 'Polyester Fabric - Navy', quantityUsed: 180, remaining: 320, unit: 'yards', usageDate: '2024-01-26', status: 'Normal' },
                { material: 'Thread - Black', quantityUsed: 45, remaining: 155, unit: 'rolls', usageDate: '2024-01-25', status: 'Normal' },
                { material: 'Buttons - 15mm White', quantityUsed: 1200, remaining: 450, unit: 'pieces', usageDate: '2024-01-26', status: 'Low' },
                { material: 'Zippers - 20cm', quantityUsed: 85, remaining: 215, unit: 'pieces', usageDate: '2024-01-24', status: 'Normal' },
            ];
        
        case 'sales':
            return [
                { transaction: 'TXN-2024-015', client: 'ABC Corporation', amount: '₱125,500.00', status: 'Paid', date: '2024-01-26', method: 'Bank Transfer' },
                { transaction: 'TXN-2024-016', client: 'XYZ School', amount: '₱98,750.00', status: 'Partial', date: '2024-01-25', method: 'Check' },
                { transaction: 'TXN-2024-017', client: 'City Hospital', amount: '₱67,800.00', status: 'Unpaid', date: '2024-01-27', method: 'Invoice' },
                { transaction: 'TXN-2024-018', client: 'Metro Restaurant', amount: '₱45,250.00', status: 'Paid', date: '2024-01-24', method: 'Cash' },
                { transaction: 'TXN-2024-019', client: 'Security Services Inc.', amount: '₱89,900.00', status: 'Paid', date: '2024-01-23', method: 'Bank Transfer' },
            ];
        
        case 'payroll':
            return [
                { employee: 'Juan Dela Cruz', workDays: 22, grossPay: '₱18,500.00', deductions: '₱2,450.00', netPay: '₱16,050.00', paymentDate: '2024-01-30' },
                { employee: 'Maria Santos', workDays: 22, grossPay: '₱16,800.00', deductions: '₱2,150.00', netPay: '₱14,650.00', paymentDate: '2024-01-30' },
                { employee: 'Pedro Reyes', workDays: 20, grossPay: '₱15,200.00', deductions: '₱1,980.00', netPay: '₱13,220.00', paymentDate: '2024-01-30' },
                { employee: 'Ana Garcia', workDays: 22, grossPay: '₱17,500.00', deductions: '₱2,280.00', netPay: '₱15,220.00', paymentDate: '2024-01-30' },
                { employee: 'Carlos Mendoza', workDays: 21, grossPay: '₱16,100.00', deductions: '₱2,095.00', netPay: '₱14,005.00', paymentDate: '2024-01-30' },
            ];
        
        case 'delivery':
            return [
                { jobOrder: 'JO-2024-001', client: 'ABC Corporation', status: 'Delivered', scheduledDate: '2024-01-25', actualDate: '2024-01-25', onTime: 'Yes' },
                { jobOrder: 'JO-2024-002', client: 'XYZ School', status: 'In Transit', scheduledDate: '2024-01-27', actualDate: '--', onTime: 'Yes' },
                { jobOrder: 'JO-2024-003', client: 'City Hospital', status: 'Pending', scheduledDate: '2024-01-29', actualDate: '--', onTime: 'Yes' },
                { jobOrder: 'JO-2024-004', client: 'Metro Restaurant', status: 'Delivered', scheduledDate: '2024-01-26', actualDate: '2024-01-28', onTime: 'No' },
                { jobOrder: 'JO-2024-005', client: 'Security Services Inc.', status: 'Delivered', scheduledDate: '2024-01-24', actualDate: '2024-01-24', onTime: 'Yes' },
            ];
        
        default:
            return [];
    }
}

// ==========================================
// POPULATE REPORT TABLES
// ==========================================

function populateReportTable(tableBodyId, data, reportType) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;
    
    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                    <div class="empty-state">
                        <div class="empty-state-icon">📊</div>
                        <p class="empty-state-text">No data available for the selected period</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = '';
    
    data.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.style.opacity = '0';
        tr.style.animation = `fadeIn 0.4s ease forwards ${index * 0.05}s`;
        
        switch (reportType) {
            case 'production':
                tr.innerHTML = `
                    <td>${row.jobOrder}</td>
                    <td>${row.garmentType}</td>
                    <td>${row.quantity}</td>
                    <td>${row.stage}</td>
                    <td>${row.completionDate}</td>
                    <td><span class="status-badge status-${getStatusClass(row.status)}">${row.status}</span></td>
                `;
                break;
            
            case 'inventory':
                tr.innerHTML = `
                    <td>${row.material}</td>
                    <td>${row.quantityUsed} ${row.unit}</td>
                    <td>${row.remaining} ${row.unit}</td>
                    <td>${row.unit}</td>
                    <td>${row.usageDate}</td>
                    <td><span class="status-badge status-${row.status.toLowerCase()}">${row.status}</span></td>
                `;
                break;
            
            case 'sales':
                tr.innerHTML = `
                    <td>${row.transaction}</td>
                    <td>${row.client}</td>
                    <td>${row.amount}</td>
                    <td><span class="status-badge status-${row.status.toLowerCase()}">${row.status}</span></td>
                    <td>${row.date}</td>
                    <td>${row.method}</td>
                `;
                break;
            
            case 'payroll':
                tr.innerHTML = `
                    <td>${row.employee}</td>
                    <td>${row.workDays}</td>
                    <td>${row.grossPay}</td>
                    <td>${row.deductions}</td>
                    <td>${row.netPay}</td>
                    <td>${row.paymentDate}</td>
                `;
                break;
            
            case 'delivery':
                tr.innerHTML = `
                    <td>${row.jobOrder}</td>
                    <td>${row.client}</td>
                    <td><span class="status-badge status-${getStatusClass(row.status)}">${row.status}</span></td>
                    <td>${row.scheduledDate}</td>
                    <td>${row.actualDate}</td>
                    <td><span class="ontime-indicator ontime-${row.onTime.toLowerCase()}">${row.onTime === 'Yes' ? '✓ On Time' : '✗ Late'}</span></td>
                `;
                break;
        }
        
        tableBody.appendChild(tr);
    });
}

function getStatusClass(status) {
    const statusMap = {
        'Completed': 'completed',
        'In Progress': 'in-progress',
        'Pending': 'pending',
        'Delayed': 'delayed',
        'Paid': 'paid',
        'Unpaid': 'unpaid',
        'Partial': 'partial',
        'Delivered': 'completed',
        'In Transit': 'in-progress'
    };
    
    return statusMap[status] || 'pending';
}

// ==========================================
// EXPORT & PRINT FUNCTIONALITY
// ==========================================

function initializeExportPrint() {
    const printBtn = document.getElementById('printReportBtn');
    const exportBtn = document.getElementById('exportReportBtn');
    
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            console.log('Printing report...');
            window.print();
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            console.log('Exporting report...');
            exportReportToCSV();
        });
    }
}

function exportReportToCSV() {
    const activeTab = document.querySelector('.tab-btn.active');
    const reportType = activeTab ? activeTab.getAttribute('data-report') : 'production';
    
    const activeReport = document.querySelector('.report-content.active');
    if (!activeReport) return;
    
    const table = activeReport.querySelector('.report-table');
    if (!table) return;
    
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const csvRow = [];
        
        cols.forEach(col => {
            // Remove status badges and get clean text
            let text = col.textContent.trim();
            // Escape quotes
            text = text.replace(/"/g, '""');
            csvRow.push(`"${text}"`);
        });
        
        csv.push(csvRow.join(','));
    });
    
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportType}_report_${formatDateForFilename(new Date())}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Report exported successfully!', 'success');
}

function formatDateForFilename(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

// ==========================================
// LOADING STATE
// ==========================================

function showLoadingState() {
    const summaryValues = document.querySelectorAll('.summary-value');
    summaryValues.forEach(el => {
        el.textContent = '--';
    });
}

// ==========================================
// NOTIFICATION SYSTEM
// ==========================================

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#27AE60' : type === 'error' ? '#E74C3C' : '#3498DB'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-family: 'Cormorant Garamond', serif;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add notification animations
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

// ==========================================
// EXPORT UTILITIES FOR GLOBAL ACCESS
// ==========================================

window.ReportsModule = {
    refreshData: () => {
        loadSummaryData();
        const activeTab = document.querySelector('.tab-btn.active');
        const reportType = activeTab ? activeTab.getAttribute('data-report') : 'production';
        loadReportData(reportType);
    },
    exportReport: exportReportToCSV,
    printReport: () => window.print()
};

console.log('%c✓ Reports & Analytics Module Loaded', 'color: #27AE60; font-weight: bold;');