// ==========================================
// USER SETTINGS MODULE
// Handles user menu, password changes, and account management
// ==========================================

let currentUser = null;
let allUsers = [];

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    currentUser = JSON.parse(sessionStorage.getItem('user'));
    loadAllUsers();
    initializeUserSettings();
    attachEventListeners();
    
    console.log('✓ User Settings Module Loaded');
});

// ==========================================
// LOAD USERS
// ==========================================

function loadAllUsers() {
    // Get all users from localStorage
    const usersData = localStorage.getItem('users');
    if (usersData) {
        allUsers = JSON.parse(usersData);
    } else {
        // Initialize with default users if none exist
        allUsers = [
            {
                username: 'admin',
                password: 'admin123',
                displayName: 'Administrator',
                role: 'administrator',
                permissions: {
                    allowedPages: ['order & job', 'Production & Quality', 'inventory', 'billing & delivery', 'Employee & Payroll', 'reports'],
                    restrictedPages: []
                }
            },
            {
                username: 'staff',
                password: 'staff123',
                displayName: 'Staff User',
                role: 'staff',
                permissions: {
                    allowedPages: ['order & job', 'Production & Quality', 'inventory', 'billing & delivery'],
                    restrictedPages: ['Employee & Payroll', 'reports']
                }
            }
        ];
        saveAllUsers();
    }
}

function saveAllUsers() {
    localStorage.setItem('users', JSON.stringify(allUsers));
}

// ==========================================
// INITIALIZE USER SETTINGS
// ==========================================

function initializeUserSettings() {
    if (!currentUser) return;
    
    // Show/hide admin-only options
    const adminOnlyItems = document.querySelectorAll('.admin-only');
    if (currentUser.role === 'administrator') {
        adminOnlyItems.forEach(item => {
            item.style.display = 'flex';
        });
    } else {
        adminOnlyItems.forEach(item => {
            item.style.display = 'none';
        });
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function attachEventListeners() {
    // User info dropdown toggle
    const userInfoTrigger = document.getElementById('userInfoTrigger');
    const userSettingsDropdown = document.getElementById('userSettingsDropdown');
    
    if (userInfoTrigger) {
        userInfoTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            userSettingsDropdown.classList.toggle('active');
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-info-container')) {
            userSettingsDropdown?.classList.remove('active');
        }
    });
    
    // Dropdown menu items
    document.getElementById('changePasswordBtn')?.addEventListener('click', openChangePasswordModal);
    document.getElementById('createAccountBtn')?.addEventListener('click', openCreateAccountModal);
    document.getElementById('manageAccountsBtn')?.addEventListener('click', openManageAccountsModal);
    document.getElementById('aboutSystemBtn')?.addEventListener('click', openAboutSystemModal);
    
    // Change Password Modal
    document.getElementById('closeChangePasswordBtn')?.addEventListener('click', closeChangePasswordModal);
    document.getElementById('cancelChangePasswordBtn')?.addEventListener('click', closeChangePasswordModal);
    document.getElementById('changePasswordForm')?.addEventListener('submit', handleChangePassword);
    
    // Password strength indicator
    document.getElementById('newPassword')?.addEventListener('input', checkPasswordStrength);
    
    // Create Account Modal
    document.getElementById('closeCreateAccountBtn')?.addEventListener('click', closeCreateAccountModal);
    document.getElementById('cancelCreateAccountBtn')?.addEventListener('click', closeCreateAccountModal);
    document.getElementById('createAccountForm')?.addEventListener('submit', handleCreateAccount);
    
    // Role change updates permissions
    document.getElementById('newAccountRole')?.addEventListener('change', handleRoleChange);
    
    // Manage Accounts Modal
    document.getElementById('closeManageAccountsBtn')?.addEventListener('click', closeManageAccountsModal);
    document.getElementById('addNewAccountBtn')?.addEventListener('click', () => {
        closeManageAccountsModal();
        openCreateAccountModal();
    });
    document.getElementById('accountSearchInput')?.addEventListener('input', filterAccounts);
    
    // About System Modal
    document.getElementById('closeAboutSystemBtn')?.addEventListener('click', closeAboutSystemModal);
    document.getElementById('closeAboutBtn')?.addEventListener('click', closeAboutSystemModal);
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

// ==========================================
// CHANGE PASSWORD
// ==========================================

function openChangePasswordModal() {
    closeUserDropdown();
    document.getElementById('changePasswordModal').classList.add('active');
    document.getElementById('changePasswordForm').reset();
    document.getElementById('passwordStrength').style.display = 'none';
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.remove('active');
}

function checkPasswordStrength(e) {
    const password = e.target.value;
    const strengthDiv = document.getElementById('passwordStrength');
    const strengthFill = strengthDiv.querySelector('.strength-fill');
    const strengthText = strengthDiv.querySelector('.strength-text');
    
    if (!password) {
        strengthDiv.style.display = 'none';
        return;
    }
    
    strengthDiv.style.display = 'block';
    
    let strength = 0;
    let strengthLabel = '';
    let color = '';
    
    // Length
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    
    // Contains number
    if (/\d/.test(password)) strength += 25;
    
    // Contains special character or uppercase
    if (/[A-Z]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength += 25;
    
    if (strength <= 25) {
        strengthLabel = 'Weak';
        color = '#E74C3C';
    } else if (strength <= 50) {
        strengthLabel = 'Fair';
        color = '#F39C12';
    } else if (strength <= 75) {
        strengthLabel = 'Good';
        color = '#3498DB';
    } else {
        strengthLabel = 'Strong';
        color = '#27AE60';
    }
    
    strengthFill.style.width = strength + '%';
    strengthFill.style.background = color;
    strengthText.textContent = strengthLabel;
    strengthText.style.color = color;
}

function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate current password
    if (currentPassword !== currentUser.password) {
        showNotification('Current password is incorrect', 'error');
        return;
    }
    
    // Validate new password
    if (newPassword.length < 6) {
        showNotification('New password must be at least 6 characters long', 'error');
        return;
    }
    
    // Validate password match
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }
    
    // Update password
    const userIndex = allUsers.findIndex(u => u.username === currentUser.username);
    if (userIndex !== -1) {
        allUsers[userIndex].password = newPassword;
        saveAllUsers();
        
        // Update session
        currentUser.password = newPassword;
        sessionStorage.setItem('user', JSON.stringify(currentUser));
        
        showNotification('Password changed successfully!', 'success');
        closeChangePasswordModal();
    } else {
        showNotification('User not found', 'error');
    }
}

// ==========================================
// CREATE ACCOUNT (ADMIN ONLY)
// ==========================================

function openCreateAccountModal() {
    if (currentUser.role !== 'administrator') {
        showNotification('Access Denied: Only administrators can create accounts', 'error');
        return;
    }
    
    closeUserDropdown();
    document.getElementById('createAccountModal').classList.add('active');
    document.getElementById('createAccountForm').reset();
    
    // Check all permissions by default
    const checkboxes = document.querySelectorAll('#permissionsGrid input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
}

function closeCreateAccountModal() {
    document.getElementById('createAccountModal').classList.remove('active');
}

function handleRoleChange(e) {
    const role = e.target.value;
    const checkboxes = document.querySelectorAll('#permissionsGrid input[type="checkbox"]');
    
    if (role === 'administrator') {
        // Admin gets all permissions
        checkboxes.forEach(cb => cb.checked = true);
    } else if (role === 'staff') {
        // Staff gets basic permissions
        checkboxes.forEach(cb => {
            const value = cb.value;
            if (value === 'order & job' || value === 'Production & Quality' || 
                value === 'inventory' || value === 'billing & delivery') {
                cb.checked = true;
            } else {
                cb.checked = false;
            }
        });
    }
}

function handleCreateAccount(e) {
    e.preventDefault();
    
    const username = document.getElementById('newUsername').value.trim();
    const displayName = document.getElementById('newDisplayName').value.trim();
    const password = document.getElementById('newAccountPassword').value;
    const role = document.getElementById('newAccountRole').value;
    
    // Validate username uniqueness
    if (allUsers.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        showNotification('Username already exists', 'error');
        return;
    }
    
    // Get selected permissions
    const checkboxes = document.querySelectorAll('#permissionsGrid input[type="checkbox"]:checked');
    const allowedPages = Array.from(checkboxes).map(cb => cb.value);
    
    if (allowedPages.length === 0) {
        showNotification('Please select at least one permission', 'error');
        return;
    }
    
    // Get all permissions for restricted pages
    const allCheckboxes = document.querySelectorAll('#permissionsGrid input[type="checkbox"]');
    const allPages = Array.from(allCheckboxes).map(cb => cb.value);
    const restrictedPages = allPages.filter(page => !allowedPages.includes(page));
    
    // Create new user
    const newUser = {
        username: username,
        password: password,
        displayName: displayName,
        role: role,
        permissions: {
            allowedPages: allowedPages,
            restrictedPages: restrictedPages
        }
    };
    
    allUsers.push(newUser);
    saveAllUsers();
    
    showNotification(`Account created successfully for ${username}!`, 'success');
    closeCreateAccountModal();
    
    console.log('New account created:', newUser);
}

// ==========================================
// MANAGE ACCOUNTS (ADMIN ONLY)
// ==========================================

function openManageAccountsModal() {
    if (currentUser.role !== 'administrator') {
        showNotification('Access Denied: Only administrators can manage accounts', 'error');
        return;
    }
    
    closeUserDropdown();
    document.getElementById('manageAccountsModal').classList.add('active');
    renderAccountsTable();
}

function closeManageAccountsModal() {
    document.getElementById('manageAccountsModal').classList.remove('active');
}

function renderAccountsTable(filteredUsers = null) {
    const tbody = document.getElementById('accountsTableBody');
    const usersToRender = filteredUsers || allUsers;
    
    if (usersToRender.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: #999;">
                    No users found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = usersToRender.map(user => {
        const permissionsList = user.permissions.allowedPages.slice(0, 3).join(', ');
        const morePermissions = user.permissions.allowedPages.length > 3 ? 
            ` +${user.permissions.allowedPages.length - 3} more` : '';
        
        return `
            <tr>
                <td><strong>${user.username}</strong></td>
                <td>${user.displayName}</td>
                <td>
                    <span class="role-badge role-${user.role}">
                        ${user.role === 'administrator' ? '👑' : '👤'} ${capitalize(user.role)}
                    </span>
                </td>
                <td>
                    <span class="permissions-text">${permissionsList}${morePermissions}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn action-btn-edit" onclick="editUserAccount('${user.username}')">
                            Edit
                        </button>
                        ${user.username !== currentUser.username ? `
                            <button class="action-btn action-btn-delete" onclick="deleteUserAccount('${user.username}')">
                                Delete
                            </button>
                        ` : '<span style="color: #999; font-size: 0.85rem;">Current User</span>'}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterAccounts() {
    const searchTerm = document.getElementById('accountSearchInput').value.toLowerCase();
    
    if (!searchTerm) {
        renderAccountsTable();
        return;
    }
    
    const filtered = allUsers.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.displayName.toLowerCase().includes(searchTerm) ||
        user.role.toLowerCase().includes(searchTerm)
    );
    
    renderAccountsTable(filtered);
}

function editUserAccount(username) {
    const user = allUsers.find(u => u.username === username);
    if (!user) return;
    
    // For now, show a simple alert. In a full implementation, you'd open an edit modal
    const newDisplayName = prompt(`Edit display name for ${username}:`, user.displayName);
    
    if (newDisplayName && newDisplayName.trim()) {
        const userIndex = allUsers.findIndex(u => u.username === username);
        allUsers[userIndex].displayName = newDisplayName.trim();
        saveAllUsers();
        
        // Update current user if editing self
        if (username === currentUser.username) {
            currentUser.displayName = newDisplayName.trim();
            sessionStorage.setItem('user', JSON.stringify(currentUser));
            document.getElementById('userName').textContent = currentUser.username;
            document.getElementById('userRole').textContent = newDisplayName.trim();
        }
        
        showNotification('User updated successfully!', 'success');
        renderAccountsTable();
    }
}

function deleteUserAccount(username) {
    if (username === currentUser.username) {
        showNotification('Cannot delete your own account', 'error');
        return;
    }
    
    if (username === 'admin') {
        showNotification('Cannot delete the default admin account', 'error');
        return;
    }
    
    if (confirm(`Are you sure you want to delete the account "${username}"? This action cannot be undone.`)) {
        allUsers = allUsers.filter(u => u.username !== username);
        saveAllUsers();
        
        showNotification('Account deleted successfully', 'success');
        renderAccountsTable();
    }
}

// Make functions globally available
window.editUserAccount = editUserAccount;
window.deleteUserAccount = deleteUserAccount;

// ==========================================
// ABOUT SYSTEM
// ==========================================

function openAboutSystemModal() {
    closeUserDropdown();
    document.getElementById('aboutSystemModal').classList.add('active');
}

function closeAboutSystemModal() {
    document.getElementById('aboutSystemModal').classList.remove('active');
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function closeUserDropdown() {
    document.getElementById('userSettingsDropdown')?.classList.remove('active');
}

function closeAllModals() {
    closeChangePasswordModal();
    closeCreateAccountModal();
    closeManageAccountsModal();
    closeAboutSystemModal();
}

function showNotification(message, type = 'info') {
    // Simple alert for now - can be enhanced with a toast notification system
    alert(message);
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ==========================================
// EXPORT FOR USE IN OTHER MODULES
// ==========================================

window.UserSettings = {
    getCurrentUser: () => currentUser,
    getAllUsers: () => allUsers,
    updateUser: (username, updates) => {
        const userIndex = allUsers.findIndex(u => u.username === username);
        if (userIndex !== -1) {
            allUsers[userIndex] = { ...allUsers[userIndex], ...updates };
            saveAllUsers();
            return true;
        }
        return false;
    }
};

console.log('%c⚙️ User Settings Ready', 'color: #3498DB; font-size: 14px; font-weight: bold;');
console.log(`Current User: ${currentUser?.username} (${currentUser?.role})`);
console.log(`Total Users: ${allUsers.length}`);