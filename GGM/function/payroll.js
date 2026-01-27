/**
 * GoldenThreads Employee & Payroll Module
 * Database-Ready Version - No Hardcoded Data
 * 
 * CRITICAL PRINCIPLE: No salary computation logic exists on frontend.
 * All payroll calculations are backend-generated for accuracy and integrity.
 */

// ============================================
// CONFIGURATION & STATE
// ============================================

const PayrollModule = {
    config: {
        apiBaseUrl: '/api', // Update with actual backend API URL
        endpoints: {
            employees: '/employees',
            attendance: '/attendance',
            payroll: '/payroll',
            reports: '/payroll/reports',
            stats: '/payroll/stats'
        }
    },
    
    state: {
        currentUser: null,
        userRole: 'staff', // Default to most restricted role
        employees: [],
        currentMonth: null,
        attendanceData: [],
        payrollData: [],
        selectedEmployee: null
    },
    
    elements: {},
    
    init() {
        // Check authentication using existing GoldenThreadsAuth
        if (!window.GoldenThreadsAuth || !window.GoldenThreadsAuth.isAuthenticated()) {
            window.location.href = '/log_in.html';
            return;
        }
        
        this.cacheElements();
        this.checkUserRole();
        this.setupEventListeners();
        this.initializeMonthSelectors();
        this.loadInitialData();
        
        console.log('%c✓ Payroll Module Loaded', 'color: #D4AF37; font-weight: bold;');
    },
    
    cacheElements() {
        // Stats
        this.elements.totalEmployees = document.getElementById('totalEmployees');
        this.elements.activeEmployees = document.getElementById('activeEmployees');
        this.elements.avgAttendance = document.getElementById('avgAttendance');
        this.elements.totalPayroll = document.getElementById('totalPayroll');
        this.elements.employeeCount = document.getElementById('employeeCount');
        this.elements.periodDisplay = document.getElementById('periodDisplay');
        
        // Tables
        this.elements.employeeTableBody = document.getElementById('employeeTableBody');
        this.elements.attendanceTableBody = document.getElementById('attendanceTableBody');
        this.elements.payrollTableBody = document.getElementById('payrollTableBody');
        this.elements.payrollFooter = document.getElementById('payrollFooter');
        this.elements.recentPayrollsBody = document.getElementById('recentPayrollsBody');
        
        // Buttons
        this.elements.addEmployeeBtn = document.getElementById('addEmployeeBtn');
        this.elements.generatePayrollBtn = document.getElementById('generatePayrollBtn');
        this.elements.filterEmployees = document.getElementById('filterEmployees');
        this.elements.exportAttendance = document.getElementById('exportAttendance');
        this.elements.printReport = document.getElementById('printReport');
        this.elements.exportReport = document.getElementById('exportReport');
        this.elements.refreshData = document.getElementById('refreshData');
        
        // Selectors
        this.elements.attendanceMonth = document.getElementById('attendanceMonth');
        this.elements.payrollMonth = document.getElementById('payrollMonth');
        
        // Modal
        this.elements.employeeModal = document.getElementById('employeeModal');
        this.elements.employeeForm = document.getElementById('employeeForm');
        this.elements.modalTitle = document.getElementById('modalTitle');
        this.elements.closeEmployeeModal = document.getElementById('closeEmployeeModal');
        this.elements.cancelEmployee = document.getElementById('cancelEmployee');
        
        // Toast
        this.elements.toast = document.getElementById('toast');
        this.elements.toastMessage = document.getElementById('toastMessage');
        this.elements.toastIcon = document.getElementById('toastIcon');
        
        // Report elements
        this.elements.reportPeriod = document.getElementById('reportPeriod');
        this.elements.reportEmployeeCount = document.getElementById('reportEmployeeCount');
        this.elements.reportTotalCost = document.getElementById('reportTotalCost');
        this.elements.reportAvgSalary = document.getElementById('reportAvgSalary');
        this.elements.reportTotalDeductions = document.getElementById('reportTotalDeductions');
        this.elements.dailyBar = document.getElementById('dailyBar');
        this.elements.monthlyBar = document.getElementById('monthlyBar');
        this.elements.dailyCount = document.getElementById('dailyCount');
        this.elements.monthlyCount = document.getElementById('monthlyCount');
    },
    
    /**
     * Check user role using existing GoldenThreadsAuth
     */
    checkUserRole() {
        // Use existing authentication system
        this.state.currentUser = window.GoldenThreadsAuth.getCurrentUser();
        this.state.userRole = this.state.currentUser.role;
        
        // Administrators have full access
        if (window.GoldenThreadsAuth.isAdmin()) {
            console.log('%c🔓 Administrator: Full Payroll Access', 'color: #D4AF37; font-weight: bold;');
            return;
        }
        
        // Staff users - hide admin controls
        if (this.elements.addEmployeeBtn) {
            this.elements.addEmployeeBtn.style.display = 'none';
        }
        if (this.elements.generatePayrollBtn) {
            this.elements.generatePayrollBtn.style.display = 'none';
        }
        
        console.log('%c🔒 Staff Access: View-Only Mode', 'color: #95A5A6; font-weight: bold;');
    },
    
    setupEventListeners() {
        // Employee Management
        if (this.elements.addEmployeeBtn) {
            this.elements.addEmployeeBtn.addEventListener('click', () => this.openEmployeeModal());
        }
        
        if (this.elements.employeeForm) {
            this.elements.employeeForm.addEventListener('submit', (e) => this.handleEmployeeSubmit(e));
        }
        
        if (this.elements.closeEmployeeModal) {
            this.elements.closeEmployeeModal.addEventListener('click', () => this.closeModal());
        }
        
        if (this.elements.cancelEmployee) {
            this.elements.cancelEmployee.addEventListener('click', () => this.closeModal());
        }
        
        // Month Selectors
        if (this.elements.attendanceMonth) {
            this.elements.attendanceMonth.addEventListener('change', (e) => 
                this.loadAttendanceData(e.target.value)
            );
        }
        
        if (this.elements.payrollMonth) {
            this.elements.payrollMonth.addEventListener('change', (e) => 
                this.state.currentMonth = e.target.value
            );
        }
        
        // Payroll Generation
        if (this.elements.generatePayrollBtn) {
            this.elements.generatePayrollBtn.addEventListener('click', () => this.generatePayroll());
        }
        
        // Export & Print
        if (this.elements.exportAttendance) {
            this.elements.exportAttendance.addEventListener('click', () => this.exportAttendance());
        }
        
        if (this.elements.printReport) {
            this.elements.printReport.addEventListener('click', () => window.print());
        }
        
        if (this.elements.exportReport) {
            this.elements.exportReport.addEventListener('click', () => this.exportPayrollReport());
        }
        
        if (this.elements.refreshData) {
            this.elements.refreshData.addEventListener('click', () => this.loadInitialData());
        }
        
        // Modal overlay click to close
        if (this.elements.employeeModal) {
            this.elements.employeeModal.addEventListener('click', (e) => {
                if (e.target === this.elements.employeeModal) {
                    this.closeModal();
                }
            });
        }
    },
    
    initializeMonthSelectors() {
        const months = this.generateMonthOptions();
        const currentMonth = this.getCurrentMonth();
        
        // Populate attendance month selector
        if (this.elements.attendanceMonth) {
            this.elements.attendanceMonth.innerHTML = '<option value="">Select Month</option>' + 
                months.map(m => `<option value="${m.value}" ${m.value === currentMonth ? 'selected' : ''}>${m.label}</option>`).join('');
        }
        
        // Populate payroll month selector
        if (this.elements.payrollMonth) {
            this.elements.payrollMonth.innerHTML = '<option value="">Select Month</option>' + 
                months.map(m => `<option value="${m.value}" ${m.value === currentMonth ? 'selected' : ''}>${m.label}</option>`).join('');
        }
        
        // Set current period display
        const currentDate = new Date();
        if (this.elements.periodDisplay) {
            this.elements.periodDisplay.textContent = currentDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
            });
        }
        
        this.state.currentMonth = currentMonth;
    },
    
    generateMonthOptions() {
        const months = [];
        const currentDate = new Date();
        
        // Generate last 12 months
        for (let i = 0; i < 12; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            months.push({ value, label });
        }
        
        return months;
    },
    
    getCurrentMonth() {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    },
    
    // ============================================
    // DATA LOADING - DATABASE READY
    // ============================================
    
    async loadInitialData() {
        try {
            this.showToast('Loading data...', 'success');
            
            await Promise.all([
                this.loadEmployees(),
                this.loadStats(),
                this.loadRecentPayrolls()
            ]);
            
        } catch (error) {
            this.showToast('Error loading initial data', 'error');
            console.error('Load error:', error);
        }
    },
    
    async loadEmployees() {
        try {
            this.showLoading(this.elements.employeeTableBody, 7);
            
            // TODO: Replace with actual API call
            // const response = await fetch(`${this.config.apiBaseUrl}${this.config.endpoints.employees}`);
            // const data = await response.json();
            // this.state.employees = data.employees || [];
            
            // Temporary: Initialize empty state
            this.state.employees = [];
            
            this.renderEmployeeTable();
            this.updateEmploymentBreakdown();
            
        } catch (error) {
            console.error('Error loading employees:', error);
            this.showToast('Failed to load employees', 'error');
            this.showEmptyState(this.elements.employeeTableBody, 'Failed to load employee data', 7);
        }
    },
    
    async loadStats() {
        try {
            // TODO: Replace with actual API call
            // const response = await fetch(`${this.config.apiBaseUrl}${this.config.endpoints.stats}`);
            // const stats = await response.json();
            
            // Calculate stats from loaded employees
            const stats = {
                totalEmployees: this.state.employees.length,
                activeEmployees: this.state.employees.filter(e => e.status === 'active').length,
                avgAttendance: 0,
                totalPayroll: 0
            };
            
            this.updateStats(stats);
            
        } catch (error) {
            console.error('Error loading stats:', error);
            // Show zero values on error
            this.updateStats({
                totalEmployees: 0,
                activeEmployees: 0,
                avgAttendance: 0,
                totalPayroll: 0
            });
        }
    },
    
    async loadAttendanceData(month) {
        if (!month) {
            this.showEmptyState(this.elements.attendanceTableBody, 'Select a month to view attendance data', 6);
            return;
        }
        
        try {
            this.showLoading(this.elements.attendanceTableBody, 6);
            
            // TODO: Replace with actual API call
            // const response = await fetch(`${this.config.apiBaseUrl}${this.config.endpoints.attendance}?month=${month}`);
            // const data = await response.json();
            // this.state.attendanceData = data.attendance || [];
            
            // Temporary: Show empty state
            this.state.attendanceData = [];
            
            this.renderAttendanceTable();
            
        } catch (error) {
            console.error('Error loading attendance:', error);
            this.showToast('Failed to load attendance data', 'error');
            this.showEmptyState(this.elements.attendanceTableBody, 'Failed to load attendance data', 6);
        }
    },
    
    async loadRecentPayrolls() {
        try {
            // TODO: Replace with actual API call
            // const response = await fetch(`${this.config.apiBaseUrl}${this.config.endpoints.reports}/recent`);
            // const data = await response.json();
            // const payrolls = data.payrolls || [];
            
            // Temporary: Initialize empty
            const payrolls = [];
            
            this.renderRecentPayrolls(payrolls);
            
        } catch (error) {
            console.error('Error loading recent payrolls:', error);
            this.showEmptyState(this.elements.recentPayrollsBody, 'No payroll records available', 6);
        }
    },
    
    // ============================================
    // RENDERING FUNCTIONS
    // ============================================
    
    renderEmployeeTable() {
        if (!this.elements.employeeTableBody) return;
        
        if (this.state.employees.length === 0) {
            this.showEmptyState(this.elements.employeeTableBody, 'No employees found. Click "Add Employee" to get started.', 7);
            if (this.elements.employeeCount) {
                this.elements.employeeCount.textContent = '0 employees';
            }
            return;
        }
        
        const isAdmin = window.GoldenThreadsAuth.isAdmin();
        
        const html = this.state.employees.map(emp => `
            <tr>
                <td>${this.escapeHtml(emp.id || 'N/A')}</td>
                <td><strong>${this.escapeHtml(emp.fullName || 'Unknown')}</strong></td>
                <td>${this.escapeHtml(emp.position || 'N/A')}</td>
                <td><span class="capitalize">${this.escapeHtml(emp.employmentType || 'N/A')}</span></td>
                <td>₱${this.formatNumber(emp.basicRate || 0)}</td>
                <td>
                    <span class="status-badge ${emp.status === 'active' ? 'active' : 'inactive'}">
                        ${this.escapeHtml(emp.status || 'unknown')}
                    </span>
                </td>
                <td class="actions-column">
                    ${isAdmin ? `
                        <button class="table-action-btn edit" onclick="PayrollModule.editEmployee('${emp.id}')">Edit</button>
                        <button class="table-action-btn" onclick="PayrollModule.viewEmployee('${emp.id}')">View</button>
                    ` : `
                        <button class="table-action-btn" onclick="PayrollModule.viewEmployee('${emp.id}')">View</button>
                    `}
                </td>
            </tr>
        `).join('');
        
        this.elements.employeeTableBody.innerHTML = html;
        
        if (this.elements.employeeCount) {
            this.elements.employeeCount.textContent = `${this.state.employees.length} employee${this.state.employees.length !== 1 ? 's' : ''}`;
        }
    },
    
    renderAttendanceTable() {
        if (!this.elements.attendanceTableBody) return;
        
        if (this.state.attendanceData.length === 0) {
            this.showEmptyState(this.elements.attendanceTableBody, 'No attendance data available for the selected month', 6);
            return;
        }
        
        const html = this.state.attendanceData.map(att => `
            <tr>
                <td><strong>${this.escapeHtml(att.employeeName || 'Unknown')}</strong></td>
                <td>${att.daysWorked || 0}</td>
                <td>${att.overtimeHours || 0}</td>
                <td>${att.absences || 0}</td>
                <td>${att.lateUndertime || 0}</td>
                <td>
                    <span class="status-badge ${att.attendanceRate >= 95 ? 'active' : 'inactive'}">
                        ${att.attendanceRate || 0}%
                    </span>
                </td>
            </tr>
        `).join('');
        
        this.elements.attendanceTableBody.innerHTML = html;
    },
    
    renderPayrollTable(payrollData) {
        if (!this.elements.payrollTableBody) return;
        
        if (!payrollData || payrollData.length === 0) {
            this.showEmptyState(this.elements.payrollTableBody, 'No payroll data available. Generate payroll for the selected month.', 6);
            if (this.elements.payrollFooter) {
                this.elements.payrollFooter.style.display = 'none';
            }
            return;
        }
        
        const html = payrollData.map(pay => `
            <tr>
                <td><strong>${this.escapeHtml(pay.employeeName || 'Unknown')}</strong></td>
                <td>₱${this.formatNumber(pay.basicPay || 0)}</td>
                <td>₱${this.formatNumber(pay.overtimePay || 0)}</td>
                <td>₱${this.formatNumber(pay.deductions || 0)}</td>
                <td>₱${this.formatNumber(pay.grossPay || 0)}</td>
                <td class="highlight-column"><strong>₱${this.formatNumber(pay.netPay || 0)}</strong></td>
            </tr>
        `).join('');
        
        this.elements.payrollTableBody.innerHTML = html;
        
        // Calculate and display totals
        const totals = this.calculatePayrollTotals(payrollData);
        this.displayPayrollTotals(totals);
        
        // Show footer
        if (this.elements.payrollFooter) {
            this.elements.payrollFooter.style.display = '';
        }
    },
    
    renderRecentPayrolls(payrolls) {
        if (!this.elements.recentPayrollsBody) return;
        
        if (!payrolls || payrolls.length === 0) {
            this.showEmptyState(this.elements.recentPayrollsBody, 'No payroll records available', 6);
            return;
        }
        
        const html = payrolls.map(p => `
            <tr>
                <td><strong>${this.escapeHtml(p.period || 'Unknown')}</strong></td>
                <td>${p.generatedDate ? new Date(p.generatedDate).toLocaleDateString() : 'N/A'}</td>
                <td>${p.employees || 0}</td>
                <td>₱${this.formatNumber(p.totalAmount || 0)}</td>
                <td>
                    <span class="status-badge ${p.status === 'completed' ? 'active' : 'inactive'}">
                        ${this.escapeHtml(p.status || 'unknown')}
                    </span>
                </td>
                <td>
                    <button class="table-action-btn" onclick="PayrollModule.viewPayrollDetails('${p.period}')">
                        View
                    </button>
                </td>
            </tr>
        `).join('');
        
        this.elements.recentPayrollsBody.innerHTML = html;
    },
    
    updateStats(stats) {
        if (this.elements.totalEmployees) {
            this.elements.totalEmployees.textContent = stats.totalEmployees || 0;
        }
        if (this.elements.activeEmployees) {
            this.elements.activeEmployees.textContent = stats.activeEmployees || 0;
        }
        if (this.elements.avgAttendance) {
            this.elements.avgAttendance.textContent = `${stats.avgAttendance || 0}%`;
        }
        if (this.elements.totalPayroll) {
            this.elements.totalPayroll.textContent = `₱${this.formatNumber(stats.totalPayroll || 0)}`;
        }
    },
    
    updateEmploymentBreakdown() {
        const daily = this.state.employees.filter(e => e.employmentType === 'daily').length;
        const monthly = this.state.employees.filter(e => e.employmentType === 'monthly').length;
        const total = this.state.employees.length;
        
        if (total > 0) {
            const dailyPercent = (daily / total) * 100;
            const monthlyPercent = (monthly / total) * 100;
            
            if (this.elements.dailyBar) {
                this.elements.dailyBar.style.width = `${dailyPercent}%`;
            }
            if (this.elements.monthlyBar) {
                this.elements.monthlyBar.style.width = `${monthlyPercent}%`;
            }
            if (this.elements.dailyCount) {
                this.elements.dailyCount.textContent = daily;
            }
            if (this.elements.monthlyCount) {
                this.elements.monthlyCount.textContent = monthly;
            }
        } else {
            // Reset to zero
            if (this.elements.dailyBar) this.elements.dailyBar.style.width = '0%';
            if (this.elements.monthlyBar) this.elements.monthlyBar.style.width = '0%';
            if (this.elements.dailyCount) this.elements.dailyCount.textContent = '0';
            if (this.elements.monthlyCount) this.elements.monthlyCount.textContent = '0';
        }
    },
    
    // ============================================
    // PAYROLL GENERATION
    // ============================================
    
    async generatePayroll() {
        if (!this.state.currentMonth) {
            this.showToast('Please select a month first', 'warning');
            return;
        }
        
        if (!window.GoldenThreadsAuth.isAdmin()) {
            this.showToast('Unauthorized: Admin access required', 'error');
            return;
        }
        
        if (this.state.employees.length === 0) {
            this.showToast('No employees found. Add employees first.', 'warning');
            return;
        }
        
        try {
            this.showLoading(this.elements.payrollTableBody, 6);
            
            // TODO: Replace with actual API call
            // const response = await fetch(`${this.config.apiBaseUrl}${this.config.endpoints.payroll}/generate`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ month: this.state.currentMonth })
            // });
            // const data = await response.json();
            // const computedPayroll = data.payroll || [];
            
            // Temporary: Show empty state until backend is connected
            const computedPayroll = [];
            
            this.state.payrollData = computedPayroll;
            this.renderPayrollTable(computedPayroll);
            this.updateReportSummary(computedPayroll);
            
            if (computedPayroll.length > 0) {
                this.showToast('Payroll generated successfully', 'success');
            } else {
                this.showToast('No payroll data generated. Check backend connection.', 'warning');
            }
            
        } catch (error) {
            console.error('Error generating payroll:', error);
            this.showToast('Failed to generate payroll', 'error');
            this.showEmptyState(this.elements.payrollTableBody, 'Failed to generate payroll. Check backend connection.', 6);
        }
    },
    
    calculatePayrollTotals(payrollData) {
        return payrollData.reduce((acc, pay) => ({
            basicPay: acc.basicPay + (pay.basicPay || 0),
            overtimePay: acc.overtimePay + (pay.overtimePay || 0),
            deductions: acc.deductions + (pay.deductions || 0),
            grossPay: acc.grossPay + (pay.grossPay || 0),
            netPay: acc.netPay + (pay.netPay || 0)
        }), {
            basicPay: 0,
            overtimePay: 0,
            deductions: 0,
            grossPay: 0,
            netPay: 0
        });
    },
    
    displayPayrollTotals(totals) {
        const elements = {
            totalBasicPay: document.getElementById('totalBasicPay'),
            totalOvertimePay: document.getElementById('totalOvertimePay'),
            totalDeductions: document.getElementById('totalDeductions'),
            totalGrossPay: document.getElementById('totalGrossPay'),
            totalNetPay: document.getElementById('totalNetPay')
        };
        
        if (elements.totalBasicPay) elements.totalBasicPay.textContent = `₱${this.formatNumber(totals.basicPay)}`;
        if (elements.totalOvertimePay) elements.totalOvertimePay.textContent = `₱${this.formatNumber(totals.overtimePay)}`;
        if (elements.totalDeductions) elements.totalDeductions.textContent = `₱${this.formatNumber(totals.deductions)}`;
        if (elements.totalGrossPay) elements.totalGrossPay.textContent = `₱${this.formatNumber(totals.grossPay)}`;
        if (elements.totalNetPay) elements.totalNetPay.textContent = `₱${this.formatNumber(totals.netPay)}`;
    },
    
    updateReportSummary(payrollData) {
        const totals = this.calculatePayrollTotals(payrollData);
        const avgSalary = payrollData.length > 0 ? totals.netPay / payrollData.length : 0;
        
        if (this.elements.reportPeriod) {
            if (this.state.currentMonth) {
                const date = new Date(this.state.currentMonth + '-01');
                this.elements.reportPeriod.textContent = date.toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                });
            } else {
                this.elements.reportPeriod.textContent = '-';
            }
        }
        
        if (this.elements.reportEmployeeCount) {
            this.elements.reportEmployeeCount.textContent = payrollData.length;
        }
        
        if (this.elements.reportTotalCost) {
            this.elements.reportTotalCost.textContent = `₱${this.formatNumber(totals.netPay)}`;
        }
        
        if (this.elements.reportAvgSalary) {
            this.elements.reportAvgSalary.textContent = `₱${this.formatNumber(avgSalary)}`;
        }
        
        if (this.elements.reportTotalDeductions) {
            this.elements.reportTotalDeductions.textContent = `₱${this.formatNumber(totals.deductions)}`;
        }
    },
    
    // ============================================
    // EMPLOYEE MANAGEMENT
    // ============================================
    
    openEmployeeModal(employee = null) {
        if (!window.GoldenThreadsAuth.isAdmin() && !employee) {
            this.showToast('Unauthorized: Admin access required', 'error');
            return;
        }
        
        this.state.selectedEmployee = employee;
        
        if (employee) {
            this.elements.modalTitle.textContent = '✏️ Edit Employee';
            this.populateEmployeeForm(employee);
        } else {
            this.elements.modalTitle.textContent = '➕ Add New Employee';
            this.elements.employeeForm.reset();
        }
        
        this.elements.employeeModal.classList.add('active');
    },
    
    closeModal() {
        this.elements.employeeModal.classList.remove('active');
        this.elements.employeeForm.reset();
        this.state.selectedEmployee = null;
    },
    
    populateEmployeeForm(employee) {
        document.getElementById('employeeId').value = employee.id || '';
        document.getElementById('fullName').value = employee.fullName || '';
        document.getElementById('position').value = employee.position || '';
        document.getElementById('employmentType').value = employee.employmentType || '';
        document.getElementById('basicRate').value = employee.basicRate || '';
        document.getElementById('contactNumber').value = employee.contactNumber || '';
        document.getElementById('email').value = employee.email || '';
        document.getElementById('address').value = employee.address || '';
        document.getElementById('hireDate').value = employee.hireDate || '';
        document.getElementById('status').value = employee.status || 'active';
    },
    
    async handleEmployeeSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.elements.employeeForm);
        const employeeData = Object.fromEntries(formData.entries());
        
        // Basic validation
        if (!employeeData.fullName || !employeeData.position || !employeeData.employmentType || !employeeData.basicRate) {
            this.showToast('Please fill in all required fields', 'warning');
            return;
        }
        
        try {
            // TODO: Replace with actual API call
            // const method = this.state.selectedEmployee ? 'PUT' : 'POST';
            // const url = this.state.selectedEmployee 
            //     ? `${this.config.apiBaseUrl}${this.config.endpoints.employees}/${this.state.selectedEmployee.id}`
            //     : `${this.config.apiBaseUrl}${this.config.endpoints.employees}`;
            // 
            // const response = await fetch(url, {
            //     method: method,
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(employeeData)
            // });
            // 
            // if (!response.ok) throw new Error('Failed to save employee');
            
            this.showToast(
                `Employee ${this.state.selectedEmployee ? 'updated' : 'added'} successfully`, 
                'success'
            );
            
            this.closeModal();
            await this.loadEmployees();
            await this.loadStats();
            
        } catch (error) {
            console.error('Error saving employee:', error);
            this.showToast('Failed to save employee. Check backend connection.', 'error');
        }
    },
    
    editEmployee(employeeId) {
        const employee = this.state.employees.find(e => e.id === employeeId);
        if (employee) {
            this.openEmployeeModal(employee);
        }
    },
    
    viewEmployee(employeeId) {
        const employee = this.state.employees.find(e => e.id === employeeId);
        if (employee) {
            alert(`Viewing details for ${employee.fullName}\n\nEmployee ID: ${employee.id}\nPosition: ${employee.position}\nType: ${employee.employmentType}\nRate: ₱${this.formatNumber(employee.basicRate)}\nStatus: ${employee.status}`);
        }
    },
    
    // ============================================
    // EXPORT & PRINT
    // ============================================
    
    async exportAttendance() {
        if (!this.state.currentMonth) {
            this.showToast('Please select a month first', 'warning');
            return;
        }
        
        if (this.state.attendanceData.length === 0) {
            this.showToast('No attendance data to export', 'warning');
            return;
        }
        
        // TODO: Implement actual export functionality
        this.showToast('Export feature coming soon', 'success');
    },
    
    async exportPayrollReport() {
        if (this.state.payrollData.length === 0) {
            this.showToast('No payroll data to export', 'warning');
            return;
        }
        
        // TODO: Implement actual PDF export
        this.showToast('PDF export feature coming soon', 'success');
    },
    
    viewPayrollDetails(period) {
        // TODO: Implement detailed view
        alert(`Viewing payroll details for ${period}\n\nDetailed view feature coming soon.`);
    },
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    formatNumber(num) {
        const number = parseFloat(num) || 0;
        return number.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },
    
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    },
    
    showLoading(container, colspan = 10) {
        if (!container) return;
        container.innerHTML = `
            <tr class="loading-row">
                <td colspan="${colspan}">
                    <div class="loading-spinner"></div>
                    <span>Loading data...</span>
                </td>
            </tr>
        `;
    },
    
    showEmptyState(container, message, colspan = 10) {
        if (!container) return;
        container.innerHTML = `
            <tr class="empty-row">
                <td colspan="${colspan}">
                    <div class="empty-state">
                        <span class="empty-icon">📋</span>
                        <p>${this.escapeHtml(message)}</p>
                    </div>
                </td>
            </tr>
        `;
    },
    
    showToast(message, type = 'success') {
        const toast = this.elements.toast;
        const toastMessage = this.elements.toastMessage;
        const toastIcon = this.elements.toastIcon;
        
        toast.className = `toast ${type}`;
        toastMessage.textContent = message;
        
        // Set icon based on type
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        toastIcon.textContent = icons[type] || icons.success;
        
        // Show toast
        toast.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
};

// ============================================
// INITIALIZE ON DOM READY
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        PayrollModule.init();
    });
} else {
    PayrollModule.init();
}

// Export for global access
window.PayrollModule = PayrollModule;