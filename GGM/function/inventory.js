// ==========================================
// INVENTORY MANAGEMENT MODULE
// ==========================================

let inventoryItems = [];
let currentItemSKU = null;
let isEditMode = false;

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    safeAttachEventListeners();
    loadSampleData(); // Optional: Load sample data for testing
    renderInventoryTable();
    updateStatistics();
});

// ==========================================
// AUTH CHECK
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
    if (userRole) userRole.textContent = user.role;
    if (userInitial) userInitial.textContent = user.username.charAt(0).toUpperCase();
}

// ==========================================
// SKU GENERATOR (collision-safe)
// ==========================================

function generateSKU(category) {
    const map = {
        fabric: 'FAB',
        thread: 'THR',
        buttons: 'BTN',
        trims: 'TRM',
        packaging: 'PKG',
        other: 'OTH'
    };

    const prefix = map[category] || 'ITM';
    let sku;

    do {
        sku = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    } while (inventoryItems.some(item => item.sku === sku));

    return sku;
}

// ==========================================
// EVENT LISTENERS (SAFE)
// ==========================================

function safeAttachEventListeners() {
    const addBtn = document.getElementById('addItemBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const form = document.getElementById('itemForm');
    const closeViewBtn = document.getElementById('closeViewModalBtn');

    const qtyInput = document.getElementById('itemQuantity');
    const priceInput = document.getElementById('itemUnitPrice');

    if (addBtn) addBtn.addEventListener('click', openAddItemModal);
    if (closeBtn) closeBtn.addEventListener('click', closeItemModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeItemModal);
    if (form) form.addEventListener('submit', handleItemSubmit);
    if (closeViewBtn) closeViewBtn.addEventListener('click', closeViewModal);

    if (qtyInput) qtyInput.addEventListener('input', calculateTotalValue);
    if (priceInput) priceInput.addEventListener('input', calculateTotalValue);

    // Search and Filter functionality
    const searchInput = document.getElementById('searchInput');
    const filterBtn = document.getElementById('filterBtn');
    
    if (searchInput) {
        searchInput.addEventListener('keyup', applyFilters);
    }
    
    if (filterBtn) {
        filterBtn.addEventListener('click', applyFilters);
    }
}

// ==========================================
// MODAL CONTROL
// ==========================================

function openAddItemModal() {
    currentItemSKU = null;
    isEditMode = false;

    const form = document.getElementById('itemForm');
    if (form) form.reset();

    const totalValue = document.getElementById('itemTotalValue');
    if (totalValue) totalValue.value = '₱0.00';

    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Add Inventory Item';

    document.getElementById('itemModal')?.classList.add('active');
}

function openEditItemModal(sku) {
    const item = inventoryItems.find(i => i.sku === sku);
    if (!item) return;

    currentItemSKU = sku;
    isEditMode = true;

    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemUnit').value = item.unit;
    document.getElementById('itemQuantity').value = item.quantity;
    document.getElementById('itemMinStock').value = item.minStock;
    document.getElementById('itemUnitPrice').value = item.unitPrice;

    calculateTotalValue();

    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Edit Inventory Item';

    document.getElementById('itemModal')?.classList.add('active');
}

function closeItemModal() {
    document.getElementById('itemModal')?.classList.remove('active');
    isEditMode = false;
    currentItemSKU = null;
}

function closeViewModal() {
    document.getElementById('viewItemModal')?.classList.remove('active');
}

// ==========================================
// FORM HANDLER
// ==========================================

function handleItemSubmit(e) {
    e.preventDefault();

    const category = document.getElementById('itemCategory').value;

    const itemData = {
        name: document.getElementById('itemName').value.trim(),
        category,
        unit: document.getElementById('itemUnit').value,
        quantity: Number(document.getElementById('itemQuantity').value),
        minStock: Number(document.getElementById('itemMinStock').value),
        unitPrice: Number(document.getElementById('itemUnitPrice').value)
    };

    if (isEditMode && currentItemSKU) {
        // Update existing item
        const index = inventoryItems.findIndex(i => i.sku === currentItemSKU);
        if (index !== -1) {
            inventoryItems[index] = {
                ...inventoryItems[index],
                ...itemData
            };
            alert('Item updated successfully!');
        }
    } else {
        // Add new item
        const item = {
            sku: generateSKU(category),
            ...itemData
        };
        inventoryItems.push(item);
        alert('Item added successfully!');
    }

    closeItemModal();
    renderInventoryTable();
    updateStatistics();
}

// ==========================================
// DELETE ITEM
// ==========================================

function deleteItem(sku) {
    const item = inventoryItems.find(i => i.sku === sku);
    if (!item) return;

    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
        inventoryItems = inventoryItems.filter(i => i.sku !== sku);
        renderInventoryTable();
        updateStatistics();
        alert('Item deleted successfully!');
    }
}

// ==========================================
// VIEW ITEM DETAILS
// ==========================================

function viewItemDetails(sku) {
    const item = inventoryItems.find(i => i.sku === sku);
    if (!item) return;

    const total = item.quantity * item.unitPrice;
    const status =
        item.quantity === 0 ? 'Out of Stock' :
        item.quantity <= item.minStock ? 'Low Stock' : 'In Stock';

    const categoryLabel = item.category.charAt(0).toUpperCase() + item.category.slice(1);

    const detailsContent = document.getElementById('itemDetailsContent');
    if (detailsContent) {
        detailsContent.innerHTML = `
            <div class="item-details-grid">
                <div class="detail-section">
                    <h3>Basic Information</h3>
                    <div class="detail-row">
                        <span class="detail-label">SKU:</span>
                        <span class="detail-value">${item.sku}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Item Name:</span>
                        <span class="detail-value">${item.name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Category:</span>
                        <span class="detail-value">${categoryLabel}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Unit:</span>
                        <span class="detail-value">${item.unit}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>Stock & Pricing</h3>
                    <div class="detail-row">
                        <span class="detail-label">Current Quantity:</span>
                        <span class="detail-value">${item.quantity} ${item.unit}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Minimum Stock:</span>
                        <span class="detail-value">${item.minStock} ${item.unit}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Unit Price:</span>
                        <span class="detail-value">₱${item.unitPrice.toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Total Value:</span>
                        <span class="detail-value">₱${total.toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">${status}</span>
                    </div>
                </div>
            </div>
        `;
    }

    document.getElementById('viewItemModal')?.classList.add('active');
}

// ==========================================
// TABLE RENDER
// ==========================================

function renderInventoryTable(items = inventoryItems) {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    if (items.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="9">
                    <div class="empty-message">
                        <span class="empty-icon">📦</span>
                        <p>No inventory items found. Click "Add Item" to start.</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = items.map(item => {
        const total = item.quantity * item.unitPrice;
        const status =
            item.quantity === 0 ? 'Out of Stock' :
            item.quantity <= item.minStock ? 'Low Stock' : 'In Stock';

        const statusClass =
            status === 'Out of Stock' ? 'status-out-of-stock' :
            status === 'Low Stock' ? 'status-low-stock' : 'status-in-stock';

        const categoryLabel =
            item.category.charAt(0).toUpperCase() + item.category.slice(1);

        return `
        <tr>
            <td>${item.sku}</td>
            <td>${item.name}</td>
            <td>${categoryLabel}</td>
            <td>${item.quantity}</td>
            <td>${item.unit}</td>
            <td>₱${item.unitPrice.toFixed(2)}</td>
            <td>₱${total.toFixed(2)}</td>
            <td><span class="status-badge ${statusClass}">${status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn action-btn-view" onclick="viewItemDetails('${item.sku}')">View</button>
                    <button class="action-btn action-btn-edit" onclick="openEditItemModal('${item.sku}')">Edit</button>
                    <button class="action-btn action-btn-delete" onclick="deleteItem('${item.sku}')">Delete</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// ==========================================
// STATS
// ==========================================

function updateStatistics() {
    const totalItems = document.getElementById('totalItems');
    const lowStockCount = document.getElementById('lowStockCount');
    const outOfStockCount = document.getElementById('outOfStockCount');
    const totalValue = document.getElementById('totalValue');

    if (totalItems) totalItems.textContent = inventoryItems.length;

    const lowStock = inventoryItems.filter(item => 
        item.quantity > 0 && item.quantity <= item.minStock
    ).length;
    if (lowStockCount) lowStockCount.textContent = lowStock;

    const outOfStock = inventoryItems.filter(item => item.quantity === 0).length;
    if (outOfStockCount) outOfStockCount.textContent = outOfStock;

    const total = inventoryItems.reduce((sum, item) => 
        sum + (item.quantity * item.unitPrice), 0
    );
    if (totalValue) totalValue.textContent = '₱' + total.toFixed(2);
}

// ==========================================
// TOTAL VALUE AUTO-CALC
// ==========================================

function calculateTotalValue() {
    const qty = Number(document.getElementById('itemQuantity')?.value) || 0;
    const price = Number(document.getElementById('itemUnitPrice')?.value) || 0;

    const totalValue = document.getElementById('itemTotalValue');
    if (totalValue) {
        totalValue.value = '₱' + (qty * price).toFixed(2);
    }
}

// ==========================================
// SEARCH AND FILTER
// ==========================================

function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
    const stockFilter = document.getElementById('stockFilter')?.value || 'all';

    let filteredItems = inventoryItems.filter(item => {
        // Search filter
        const matchesSearch = 
            item.name.toLowerCase().includes(searchTerm) ||
            item.sku.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm);

        // Category filter
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

        // Stock filter
        let matchesStock = true;
        if (stockFilter === 'in_stock') {
            matchesStock = item.quantity > item.minStock;
        } else if (stockFilter === 'low_stock') {
            matchesStock = item.quantity > 0 && item.quantity <= item.minStock;
        } else if (stockFilter === 'out_of_stock') {
            matchesStock = item.quantity === 0;
        }

        return matchesSearch && matchesCategory && matchesStock;
    });

    renderInventoryTable(filteredItems);
}

// ==========================================
// LOAD SAMPLE DATA (Optional - for testing)
// ==========================================

function loadSampleData() {
    // Uncomment this to load sample data for testing
    /*
    inventoryItems = [
        {
            sku: 'FAB-1001',
            name: 'Cotton Fabric - White',
            category: 'fabric',
            unit: 'meters',
            quantity: 150,
            minStock: 50,
            unitPrice: 120.00
        },
        {
            sku: 'THR-2001',
            name: 'Polyester Thread - Black',
            category: 'thread',
            unit: 'rolls',
            quantity: 25,
            minStock: 30,
            unitPrice: 85.00
        },
        {
            sku: 'BTN-3001',
            name: 'Plastic Buttons - 15mm',
            category: 'buttons',
            unit: 'pieces',
            quantity: 0,
            minStock: 100,
            unitPrice: 2.50
        }
    ];
    */
}