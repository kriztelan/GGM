// ==========================================
// PRODUCTION & QUALITY MANAGEMENT MODULE
// GoldenThreads IMS - Complete Implementation
// Connected to Order & Job Management Module
// ==========================================

// ==========================================
// GLOBAL STATE
// ==========================================
let productionJobs = [];
let currentJobOrderId = null;

// Production stages in sequential order
const PRODUCTION_STAGES = [
    { id: 'pattern_making', name: 'Pattern Making', department: 'Pattern Making' },
    { id: 'cutting', name: 'Cutting', department: 'Cutting' },
    { id: 'sewing', name: 'Sewing', department: 'Sewing' },
    { id: 'embroidery', name: 'Embroidery', department: 'Embroidery' },
    { id: 'quality_control', name: 'Quality Control Inspection', department: 'Quality Control' },
    { id: 'packaging', name: 'Packaging', department: 'Packaging' }
];

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    loadApprovedJobOrders();
    attachEventListeners();
    renderProductionTable();
    updateStatistics();
    
    console.log('%c⚙️ Production & Quality Management Module Loaded', 'color: #D4AF37; font-size: 16px; font-weight: bold;');
});

// ==========================================
// AUTHENTICATION
// ==========================================

function checkAuthentication() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (!user) {
        window.location.href = '/log in.html';
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

// ==========================================
// LOAD APPROVED JOB ORDERS FROM ORDER MODULE
// ==========================================

function loadApprovedJobOrders() {
    // Get orders from Order & Job Module (localStorage or direct access)
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const jobOrders = JSON.parse(localStorage.getItem('jobOrders')) || [];
    
    // Filter for approved job orders only
    const approvedJobs = jobOrders.filter(job => {
        const order = orders.find(o => o.id === job.orderId);
        return order && order.status === 'approved';
    });
    
    // Initialize production jobs with workflow stages
    productionJobs = approvedJobs.map(job => {
        const order = orders.find(o => o.id === job.orderId);
        
        // Check if production job already exists
        const existingJob = productionJobs.find(pj => pj.jobOrderId === job.jobOrderNumber);
        
        if (existingJob) {
            return existingJob;
        }
        
        // Create new production job with workflow stages
        return {
            jobOrderId: job.jobOrderNumber,
            orderId: job.orderId,
            clientName: order?.clientName || 'Unknown',
            garmentType: order?.garmentType || 'Unknown',
            quantity: order?.quantity || 0,
            sizeDetails: order?.sizeDetails || '',
            fabricType: order?.fabricType || '',
            specialInstructions: order?.specialInstructions || '',
            estimatedFabric: calculateFabricUsage(order),
            productionStatus: 'not_started',
            currentStage: 'pattern_making',
            qualityStatus: 'pending',
            dateStarted: null,
            dateCompleted: null,
            stages: initializeStages(),
            qcInspections: [],
            packagingCompleted: false,
            packagingDate: null,
            readyForBilling: false
        };
    });
    
    // Save to localStorage for persistence
    saveProductionJobs();
    
    console.log('Loaded approved job orders:', productionJobs.length);
}

function calculateFabricUsage(order) {
    // Simplified fabric calculation based on order data
    // In real implementation, this would pull from your size-based calculations
    const baseUsage = {
        'T-Shirt': 1.2,
        'Polo Shirt': 1.5,
        'Dress Shirt': 1.8,
        'Pants': 2.0,
        'Jacket': 2.5,
        'Uniform': 2.2,
        'Custom': 1.5
    };
    
    const base = baseUsage[order?.garmentType] || 1.5;
    return (base * (order?.quantity || 0)).toFixed(2);
}

function initializeStages() {
    return PRODUCTION_STAGES.map((stage, index) => ({
        id: stage.id,
        name: stage.name,
        department: stage.department,
        status: 'pending',
        startDate: null,
        completionDate: null,
        remarks: '',
        order: index + 1
    }));
}

function saveProductionJobs() {
    localStorage.setItem('productionJobs', JSON.stringify(productionJobs));
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function attachEventListeners() {
    // Modal close buttons
    document.getElementById('closeDetailModalBtn').addEventListener('click', closeProductionDetailModal);
    document.getElementById('closeUpdateStageModalBtn').addEventListener('click', closeUpdateStageModal);
    document.getElementById('cancelUpdateStageBtn').addEventListener('click', closeUpdateStageModal);
    document.getElementById('closeQCModalBtn').addEventListener('click', closeQCModal);
    document.getElementById('cancelQCBtn').addEventListener('click', closeQCModal);
    document.getElementById('closePackagingModalBtn').addEventListener('click', closePackagingModal);
    document.getElementById('cancelPackagingBtn').addEventListener('click', closePackagingModal);
    
    // Form submissions
    document.getElementById('updateStageForm').addEventListener('submit', handleStageUpdate);
    document.getElementById('qcInspectionForm').addEventListener('submit', handleQCInspection);
    document.getElementById('packagingForm').addEventListener('submit', handlePackagingCompletion);
    
    // QC Result change handler
    document.getElementById('qcResult').addEventListener('change', handleQCResultChange);
    
    // Search and filter
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('filterBtn').addEventListener('click', applyFilter);
    
    // Logout
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
// RENDER PRODUCTION TABLE
// ==========================================

function renderProductionTable(filteredJobs = null) {
    const tbody = document.getElementById('productionTableBody');
    const jobsToRender = filteredJobs || productionJobs;
    
    if (jobsToRender.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="8">
                    <div class="empty-message">
                        <span class="empty-icon">⚙️</span>
                        <p>No approved job orders available for production.</p>
                        <p class="empty-hint">Job orders must be approved in the Order & Job Management module first.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = jobsToRender.map(job => {
        const currentStageObj = job.stages.find(s => s.id === job.currentStage);
        const currentStageName = currentStageObj?.name || 'Not Started';
        
        return `
            <tr>
                <td><strong>${job.jobOrderId}</strong></td>
                <td>${job.clientName}</td>
                <td>${job.garmentType}</td>
                <td>${job.quantity} pcs</td>
                <td>${currentStageName}</td>
                <td>
                    <span class="status-badge status-${job.productionStatus}">
                        ${formatStatus(job.productionStatus)}
                    </span>
                </td>
                <td>
                    <span class="status-badge status-${job.qualityStatus}">
                        ${formatStatus(job.qualityStatus)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn action-btn-view" onclick="openProductionDetailModal('${job.jobOrderId}')">
                            View Workflow
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ==========================================
// PRODUCTION DETAIL MODAL
// ==========================================

function openProductionDetailModal(jobOrderId) {
    currentJobOrderId = jobOrderId;
    const job = productionJobs.find(j => j.jobOrderId === jobOrderId);
    
    if (!job) return;
    
    // Populate job summary
    const summaryHTML = `
        <div class="summary-item">
            <span class="summary-label">Job Order ID:</span>
            <span class="summary-value">${job.jobOrderId}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Client Name:</span>
            <span class="summary-value">${job.clientName}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Garment Type:</span>
            <span class="summary-value">${job.garmentType}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Quantity:</span>
            <span class="summary-value">${job.quantity} pcs</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Size Details:</span>
            <span class="summary-value">${job.sizeDetails}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Fabric Type:</span>
            <span class="summary-value">${job.fabricType || 'N/A'}</span>
        </div>
        ${job.specialInstructions ? `
        <div class="summary-item" style="grid-column: 1 / -1;">
            <span class="summary-label">Special Instructions:</span>
            <span class="summary-value">${job.specialInstructions}</span>
        </div>
        ` : ''}
    `;
    
    document.getElementById('jobSummaryContent').innerHTML = summaryHTML;
    
    // Populate workflow stages
    renderWorkflowStages(job);
    
    // Show inventory check
    renderInventoryCheck(job);
    
    document.getElementById('productionDetailModal').classList.add('active');
}

function renderWorkflowStages(job) {
    const stagesHTML = job.stages.map((stage, index) => {
        const isCompleted = stage.status === 'completed';
        const isInProgress = stage.status === 'in_progress';
        const isPending = stage.status === 'pending';
        
        // Determine if stage can be started
        const previousStage = index > 0 ? job.stages[index - 1] : null;
        const canStart = !previousStage || previousStage.status === 'completed';
        
        // Special handling for QC and Packaging
        const isQC = stage.id === 'quality_control';
        const isPackaging = stage.id === 'packaging';
        
        const canDoQC = isQC && job.stages.find(s => s.id === 'embroidery').status === 'completed';
        const canDoPackaging = isPackaging && job.qualityStatus === 'passed';
        
        let stageClasses = 'stage-card';
        if (isCompleted) stageClasses += ' stage-completed';
        else if (isInProgress) stageClasses += ' stage-in-progress';
        else if (isPending) stageClasses += ' stage-pending';
        
        return `
            <div class="${stageClasses}">
                <div class="stage-header">
                    <div class="stage-title">
                        <span class="stage-number">${index + 1}</span>
                        <span>${stage.name}</span>
                    </div>
                    <div class="stage-actions">
                        ${!isQC && !isPackaging ? `
                            <button class="btn-update-stage" 
                                    onclick="openUpdateStageModal('${job.jobOrderId}', '${stage.id}')"
                                    ${!canStart || isCompleted ? 'disabled' : ''}>
                                Update
                            </button>
                        ` : ''}
                        ${isQC && canDoQC && stage.status !== 'completed' ? `
                            <button class="btn-qc-inspection" 
                                    onclick="openQCModal('${job.jobOrderId}')">
                                QC Inspection
                            </button>
                        ` : ''}
                        ${isPackaging && canDoPackaging && !job.packagingCompleted ? `
                            <button class="btn-packaging" 
                                    onclick="openPackagingModal('${job.jobOrderId}')">
                                Complete Packaging
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="stage-body">
                    <div class="stage-info-item">
                        <span class="stage-info-label">Department:</span>
                        <span class="stage-info-value">${stage.department}</span>
                    </div>
                    <div class="stage-info-item">
                        <span class="stage-info-label">Status:</span>
                        <span class="stage-info-value">
                            <span class="status-badge status-${stage.status}">
                                ${formatStatus(stage.status)}
                            </span>
                        </span>
                    </div>
                    <div class="stage-info-item">
                        <span class="stage-info-label">Start Date:</span>
                        <span class="stage-info-value">${stage.startDate || 'Not started'}</span>
                    </div>
                    <div class="stage-info-item">
                        <span class="stage-info-label">Completion Date:</span>
                        <span class="stage-info-value">${stage.completionDate || 'Not completed'}</span>
                    </div>
                    ${stage.remarks ? `
                        <div class="stage-remarks">
                            <strong>Remarks:</strong> ${stage.remarks}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('workflowStagesContent').innerHTML = stagesHTML;
}

function renderInventoryCheck(job) {
    // Simplified inventory check
    // In real implementation, this would query the Inventory Module
    const requiredFabric = parseFloat(job.estimatedFabric) || 0;
    const availableFabric = 500; // Mock data - would come from Inventory Module
    
    const isSufficient = availableFabric >= requiredFabric;
    
    const inventoryHTML = `
        <div class="inventory-status ${isSufficient ? 'sufficient' : 'insufficient'}">
            <span class="inventory-icon">${isSufficient ? '✅' : '⚠️'}</span>
            <div class="inventory-message">
                <h4>${isSufficient ? 'Materials Available' : 'Insufficient Materials'}</h4>
                <p>${isSufficient 
                    ? 'All required materials are in stock and ready for production.' 
                    : 'Some materials are below required quantity. Please restock before starting production.'
                }</p>
            </div>
        </div>
        
        <table class="material-requirements-table">
            <thead>
                <tr>
                    <th>Material</th>
                    <th>Required</th>
                    <th>Available</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Fabric (${job.fabricType || 'General'})</strong></td>
                    <td>${requiredFabric} meters</td>
                    <td>${availableFabric} meters</td>
                    <td>
                        <span class="stock-indicator ${isSufficient ? 'sufficient' : 'insufficient'}">
                            ${isSufficient ? 'Sufficient' : 'Insufficient'}
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>
        
        ${!isSufficient ? `
        <div class="info-note warning">
            <span class="note-icon">⚠️</span>
            <p>Production cannot start until materials are restocked. Please coordinate with Inventory Management.</p>
        </div>
        ` : ''}
    `;
    
    document.getElementById('inventoryCheckContent').innerHTML = inventoryHTML;
}

function closeProductionDetailModal() {
    document.getElementById('productionDetailModal').classList.remove('active');
    currentJobOrderId = null;
}

// ==========================================
// UPDATE STAGE MODAL
// ==========================================

function openUpdateStageModal(jobOrderId, stageId) {
    const job = productionJobs.find(j => j.jobOrderId === jobOrderId);
    if (!job) return;
    
    const stage = job.stages.find(s => s.id === stageId);
    if (!stage) return;
    
    // Check if previous stage is completed
    const stageIndex = job.stages.findIndex(s => s.id === stageId);
    if (stageIndex > 0) {
        const previousStage = job.stages[stageIndex - 1];
        if (previousStage.status !== 'completed') {
            showNotification('Previous stage must be completed first.', 'error');
            return;
        }
    }
    
    // Check if only one stage can be in progress
    const inProgressStage = job.stages.find(s => s.status === 'in_progress' && s.id !== stageId);
    if (inProgressStage) {
        showNotification('Another stage is already in progress. Complete it first.', 'error');
        return;
    }
    
    document.getElementById('updateJobOrderId').value = jobOrderId;
    document.getElementById('updateStageName').value = stageId;
    document.getElementById('displayStageName').value = stage.name;
    document.getElementById('stageStatus').value = stage.status;
    document.getElementById('stageStartDate').value = stage.startDate || '';
    document.getElementById('stageCompletionDate').value = stage.completionDate || '';
    document.getElementById('stageRemarks').value = stage.remarks || '';
    
    document.getElementById('updateStageModal').classList.add('active');
}

function handleStageUpdate(e) {
    e.preventDefault();
    
    const jobOrderId = document.getElementById('updateJobOrderId').value;
    const stageId = document.getElementById('updateStageName').value;
    const status = document.getElementById('stageStatus').value;
    const startDate = document.getElementById('stageStartDate').value;
    const completionDate = document.getElementById('stageCompletionDate').value;
    const remarks = document.getElementById('stageRemarks').value;
    
    const job = productionJobs.find(j => j.jobOrderId === jobOrderId);
    if (!job) return;
    
    const stage = job.stages.find(s => s.id === stageId);
    if (!stage) return;
    
    // Update stage
    stage.status = status;
    stage.startDate = startDate || stage.startDate;
    stage.completionDate = completionDate || stage.completionDate;
    stage.remarks = remarks;
    
    // Update job production status
    if (status === 'in_progress' && job.productionStatus === 'not_started') {
        job.productionStatus = 'in_progress';
        job.dateStarted = new Date().toISOString().split('T')[0];
    }
    
    // Move to next stage if completed
    if (status === 'completed') {
        const currentIndex = job.stages.findIndex(s => s.id === stageId);
        if (currentIndex < job.stages.length - 1) {
            job.currentStage = job.stages[currentIndex + 1].id;
        }
    }
    
    // Check if all stages are completed
    const allCompleted = job.stages.every(s => s.status === 'completed');
    if (allCompleted && job.qualityStatus === 'passed' && job.packagingCompleted) {
        job.productionStatus = 'completed';
        job.dateCompleted = new Date().toISOString().split('T')[0];
        job.readyForBilling = true;
    }
    
    saveProductionJobs();
    closeUpdateStageModal();
    renderProductionTable();
    updateStatistics();
    
    // Refresh detail modal if open
    if (currentJobOrderId === jobOrderId) {
        openProductionDetailModal(jobOrderId);
    }
    
    showNotification('Stage updated successfully!', 'success');
}

function closeUpdateStageModal() {
    document.getElementById('updateStageModal').classList.remove('active');
    document.getElementById('updateStageForm').reset();
}

// ==========================================
// QC INSPECTION MODAL
// ==========================================

function openQCModal(jobOrderId) {
    const job = productionJobs.find(j => j.jobOrderId === jobOrderId);
    if (!job) return;
    
    // Check if embroidery stage is completed
    const embroideryStage = job.stages.find(s => s.id === 'embroidery');
    if (embroideryStage.status !== 'completed') {
        showNotification('All production stages must be completed before QC inspection.', 'error');
        return;
    }
    
    document.getElementById('qcJobOrderId').value = jobOrderId;
    
    // Populate summary
    const summaryHTML = `
        <div class="summary-item">
            <span class="summary-label">Job Order ID:</span>
            <span class="summary-value">${job.jobOrderId}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Client:</span>
            <span class="summary-value">${job.clientName}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Garment:</span>
            <span class="summary-value">${job.garmentType}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Quantity:</span>
            <span class="summary-value">${job.quantity} pcs</span>
        </div>
    `;
    
    document.getElementById('qcJobSummary').innerHTML = summaryHTML;
    
    // Reset form
    document.getElementById('qcInspectionForm').reset();
    document.getElementById('qcJobOrderId').value = jobOrderId;
    document.getElementById('returnStageGroup').style.display = 'none';
    
    document.getElementById('qcInspectionModal').classList.add('active');
}

function handleQCResultChange(e) {
    const result = e.target.value;
    const returnStageGroup = document.getElementById('returnStageGroup');
    
    if (result === 'failed') {
        returnStageGroup.style.display = 'block';
    } else {
        returnStageGroup.style.display = 'none';
    }
}

function handleQCInspection(e) {
    e.preventDefault();
    
    const jobOrderId = document.getElementById('qcJobOrderId').value;
    const result = document.getElementById('qcResult').value;
    const defectNotes = document.getElementById('qcDefectNotes').value;
    const returnToStage = document.getElementById('returnToStage').value;
    
    const job = productionJobs.find(j => j.jobOrderId === jobOrderId);
    if (!job) return;
    
    // Get checked items
    const checkedItems = Array.from(document.querySelectorAll('.qc-checkbox:checked'))
        .map(cb => cb.value);
    
    // Create QC inspection record
    const inspection = {
        date: new Date().toISOString().split('T')[0],
        result: result,
        checkedItems: checkedItems,
        defectNotes: defectNotes,
        returnToStage: returnToStage || null
    };
    
    job.qcInspections.push(inspection);
    
    // Update quality status
    job.qualityStatus = result;
    
    // Update QC stage
    const qcStage = job.stages.find(s => s.id === 'quality_control');
    qcStage.status = 'completed';
    qcStage.completionDate = inspection.date;
    qcStage.remarks = `Result: ${result.toUpperCase()}${defectNotes ? '. ' + defectNotes : ''}`;
    
    if (result === 'passed') {
        // Move to packaging
        job.currentStage = 'packaging';
    } else if (result === 'failed' && returnToStage) {
        // Return to specified stage
        const returnStageObj = job.stages.find(s => s.id === returnToStage);
        if (returnStageObj) {
            returnStageObj.status = 'pending';
            returnStageObj.completionDate = null;
            job.currentStage = returnToStage;
            job.productionStatus = 'on_hold';
        }
    }
    
    saveProductionJobs();
    closeQCModal();
    renderProductionTable();
    updateStatistics();
    
    // Refresh detail modal if open
    if (currentJobOrderId === jobOrderId) {
        openProductionDetailModal(jobOrderId);
    }
    
    showNotification(`QC inspection completed. Result: ${result.toUpperCase()}`, result === 'passed' ? 'success' : 'warning');
}

function closeQCModal() {
    document.getElementById('qcInspectionModal').classList.remove('active');
    document.getElementById('qcInspectionForm').reset();
    document.getElementById('returnStageGroup').style.display = 'none';
}

// ==========================================
// PACKAGING MODAL
// ==========================================

function openPackagingModal(jobOrderId) {
    const job = productionJobs.find(j => j.jobOrderId === jobOrderId);
    if (!job) return;
    
    // Check if QC passed
    if (job.qualityStatus !== 'passed') {
        showNotification('Quality control must pass before packaging.', 'error');
        return;
    }
    
    document.getElementById('packagingJobOrderId').value = jobOrderId;
    
    const summaryHTML = `
        <div class="summary-item">
            <span class="summary-label">Job Order ID:</span>
            <span class="summary-value">${job.jobOrderId}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Client:</span>
            <span class="summary-value">${job.clientName}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Garment:</span>
            <span class="summary-value">${job.garmentType}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Quantity:</span>
            <span class="summary-value">${job.quantity} pcs</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">QC Status:</span>
            <span class="summary-value">
                <span class="status-badge status-passed">PASSED</span>
            </span>
        </div>
    `;
    
    document.getElementById('packagingSummary').innerHTML = summaryHTML;
    document.getElementById('packagingForm').reset();
    document.getElementById('packagingJobOrderId').value = jobOrderId;
    
    document.getElementById('packagingModal').classList.add('active');
}

function handlePackagingCompletion(e) {
    e.preventDefault();
    
    const jobOrderId = document.getElementById('packagingJobOrderId').value;
    const notes = document.getElementById('packagingNotes').value;
    
    const job = productionJobs.find(j => j.jobOrderId === jobOrderId);
    if (!job) return;
    
    // Update packaging stage
    const packagingStage = job.stages.find(s => s.id === 'packaging');
    packagingStage.status = 'completed';
    packagingStage.completionDate = new Date().toISOString().split('T')[0];
    packagingStage.remarks = notes || 'Packaging completed';
    
    // Mark job as completed
    job.packagingCompleted = true;
    job.packagingDate = packagingStage.completionDate;
    job.productionStatus = 'completed';
    job.dateCompleted = packagingStage.completionDate;
    job.readyForBilling = true;
    
    saveProductionJobs();
    closePackagingModal();
    renderProductionTable();
    updateStatistics();
    
    // Refresh detail modal if open
    if (currentJobOrderId === jobOrderId) {
        openProductionDetailModal(jobOrderId);
    }
    
    showNotification('Production completed! Job order is now ready for billing.', 'success');
}

function closePackagingModal() {
    document.getElementById('packagingModal').classList.remove('active');
    document.getElementById('packagingForm').reset();
}

// ==========================================
// STATISTICS UPDATE
// ==========================================

function updateStatistics() {
    document.getElementById('notStartedCount').textContent = 
        productionJobs.filter(j => j.productionStatus === 'not_started').length;
    document.getElementById('inProgressCount').textContent = 
        productionJobs.filter(j => j.productionStatus === 'in_progress').length;
    document.getElementById('onHoldCount').textContent = 
        productionJobs.filter(j => j.productionStatus === 'on_hold').length;
    document.getElementById('completedCount').textContent = 
        productionJobs.filter(j => j.productionStatus === 'completed').length;
}

// ==========================================
// SEARCH AND FILTER
// ==========================================

function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (searchTerm === '') {
        renderProductionTable();
        return;
    }
    
    const filtered = productionJobs.filter(job => 
        job.jobOrderId.toLowerCase().includes(searchTerm) ||
        job.clientName.toLowerCase().includes(searchTerm)
    );
    
    renderProductionTable(filtered);
}

function applyFilter() {
    const statusFilter = document.getElementById('statusFilter').value;
    const departmentFilter = document.getElementById('departmentFilter').value;
    
    let filtered = [...productionJobs];
    
    if (statusFilter !== 'all') {
        filtered = filtered.filter(job => job.productionStatus === statusFilter);
    }
    
    if (departmentFilter !== 'all') {
        filtered = filtered.filter(job => job.currentStage === departmentFilter);
    }
    
    renderProductionTable(filtered);
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function formatStatus(status) {
    const statusMap = {
        'not_started': 'Not Started',
        'in_progress': 'In Progress',
        'on_hold': 'On Hold',
        'completed': 'Completed',
        'pending': 'Pending',
        'passed': 'Passed',
        'failed': 'Failed',
        'ready_for_billing': 'Ready for Billing'
    };
    return statusMap[status] || status;
}

function showNotification(message, type = 'info') {
    alert(message);
}

function closeAllModals() {
    closeProductionDetailModal();
    closeUpdateStageModal();
    closeQCModal();
    closePackagingModal();
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
// DATA EXPORT FOR BILLING MODULE
// ==========================================

function getCompletedJobsForBilling() {
    // This function can be called by Billing Module
    return productionJobs.filter(job => 
        job.readyForBilling && 
        job.productionStatus === 'completed' &&
        job.packagingCompleted
    );
}

// Make available globally for other modules
window.ProductionModule = {
    getCompletedJobsForBilling,
    productionJobs
};

// ==========================================
// CONSOLE INFO
// ==========================================

console.log('%cProduction Jobs:', 'color: #2C3E50; font-weight: bold;', productionJobs.length);
console.log('%c✅ Connected to Order & Job Management Module', 'color: #27AE60;');
console.log('%c⚠️ Frontend-only implementation. Backend integration pending.', 'color: #E74C3C;');