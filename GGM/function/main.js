// ==========================================
// ENHANCED MAIN.JS - USER SESSION & ACCESS CONTROL
// CRITICAL FIX: Staff sees only their allowed modules
// ==========================================

window.addEventListener('load', () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (!user) {
        window.location.href = 'log_in.html';
        return;
    }
    
    console.log('%c========================================', 'color: #D4AF37;');
    console.log('%c🔐 RBAC SYSTEM INITIALIZING', 'color: #D4AF37; font-weight: bold; font-size: 14px;');
    console.log('%c========================================', 'color: #D4AF37;');
    console.log('User Data:', user);
    console.log('User Role:', user.role);
    console.log('Permissions Object:', user.permissions);
    
    // Display user info
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    const userInitial = document.getElementById('userInitial');
    
    if (userName) userName.textContent = user.username;
    if (userRole) userRole.textContent = user.displayName || (user.role.charAt(0).toUpperCase() + user.role.slice(1));
    if (userInitial) userInitial.textContent = user.username.charAt(0).toUpperCase();
    
    // Apply role-based restrictions IMMEDIATELY
    applyRoleRestrictions(user);
    
    // Initialize logout functionality
    initializeLogout();
    
    console.log('%c✓ Main system loaded', 'color: #27AE60; font-weight: bold;');
});

// ==========================================
// ROLE-BASED ACCESS CONTROL - STRICT MODE
// ==========================================

function applyRoleRestrictions(user) {
    console.log('%c--- APPLYING ROLE RESTRICTIONS ---', 'color: #3498DB; font-weight: bold;');
    
    // Get all navigation items
    const navItems = document.querySelectorAll('.nav-item');
    console.log(`Total navigation items found: ${navItems.length}`);
    
    // CRITICAL: Administrators have unrestricted access to all modules
    if (user.role === 'administrator') {
        console.log('%c🔓 ADMINISTRATOR MODE', 'color: #D4AF37; font-weight: bold; font-size: 14px; background: #1A2332; padding: 5px 10px;');
        
        // Show ALL navigation items for administrators
        navItems.forEach((navItem, index) => {
            const pageName = navItem.getAttribute('data-page');
            navItem.style.display = 'flex';
            console.log(`  ✅ [${index}] Administrator can access: ${pageName}`);
        });
        
        return; // Skip permission checks for administrators
    }
    
    // ==========================================
    // STAFF MODE - STRICT ENFORCEMENT
    // ==========================================
    
    console.log('%c🔒 STAFF MODE - ENFORCING RESTRICTIONS', 'color: #E74C3C; font-weight: bold; font-size: 14px; background: #1A2332; padding: 5px 10px;');
    
    const permissions = user.permissions;
    
    if (!permissions || !permissions.allowedPages) {
        console.error('❌ CRITICAL ERROR: No permissions found for staff user!');
        console.error('User object:', user);
        return;
    }
    
    console.log('Allowed Pages Array:', permissions.allowedPages);
    console.log('Allowed Pages Type:', typeof permissions.allowedPages);
    console.log('Is Array?', Array.isArray(permissions.allowedPages));
    
    // Process each navigation item
    navItems.forEach((navItem, index) => {
        const pageName = navItem.getAttribute('data-page');
        const href = navItem.getAttribute('href');
        
        console.log(`\n[${index}] Checking navigation item:`);
        console.log(`  - data-page: "${pageName}"`);
        console.log(`  - href: "${href}"`);
        
        if (!pageName) {
            console.warn(`  ⚠️ Missing data-page attribute!`);
            // Don't hide items without data-page (like dashboard)
            return;
        }
        
        // ✅ EXACT MATCH ONLY - No fuzzy matching
        const hasAccess = permissions.allowedPages.includes(pageName);
        
        console.log(`  - Checking if "${pageName}" is in allowed pages...`);
        console.log(`  - Result: ${hasAccess}`);
        
        if (hasAccess) {
            // ALLOW ACCESS - Show the navigation item
            navItem.style.display = 'flex';
            navItem.style.visibility = 'visible';
            navItem.style.opacity = '1';
            console.log(`  ✅ ALLOWED - Showing "${pageName}"`);
        } else {
            // DENY ACCESS - Hide the navigation item completely
            navItem.style.display = 'none';
            navItem.style.visibility = 'hidden';
            navItem.style.opacity = '0';
            console.log(`  ❌ DENIED - Hiding "${pageName}"`);
        }
    });
    
    // Summary
    console.log('\n%c--- RESTRICTION SUMMARY ---', 'color: #3498DB; font-weight: bold;');
    console.log('%cAllowed Pages:', 'color: #27AE60; font-weight: bold;');
    permissions.allowedPages.forEach(page => {
        console.log(`  ✅ ${page}`);
    });
    
    if (permissions.restrictedPages) {
        console.log('%cRestricted Pages:', 'color: #E74C3C; font-weight: bold;');
        permissions.restrictedPages.forEach(page => {
            console.log(`  ❌ ${page}`);
        });
    }
}

// ==========================================
// PAGE ACCESS VERIFICATION - STRICT MODE
// ==========================================

function verifyPageAccess() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (!user) {
        console.error('❌ No user session found');
        window.location.href = '/log_in.html';
        return false;
    }
    
    // CRITICAL: Administrators bypass all access checks
    if (user.role === 'administrator') {
        console.log('%c✓ Administrator: Page access granted', 'color: #27AE60; font-weight: bold;');
        return true;
    }
    
    // Get current page name from URL
    const pathParts = window.location.pathname.split('/');
    const currentPage = pathParts[pathParts.length - 1].replace('.html', '');
    
    console.log(`Verifying access to page: "${currentPage}"`);
    
    // Check if user has access to current page
    const permissions = user.permissions;
    
    // If no permissions object, deny access
    if (!permissions || !permissions.allowedPages) {
        console.error('❌ No permissions found for staff user');
        alert('Access Denied: No permissions configured for your account.');
        window.location.href = '/templates/main.html';
        return false;
    }
    
    // Allow access to main dashboard always
    if (currentPage === 'main' || currentPage === '') {
        console.log('✓ Dashboard access allowed');
        return true;
    }
    
    // ✅ EXACT MATCH - Block direct URL access
    const hasAccess = permissions.allowedPages.includes(currentPage);
    
    console.log(`Checking if "${currentPage}" is in allowed pages:`, permissions.allowedPages);
    console.log(`Result: ${hasAccess}`);
    
    if (!hasAccess) {
        console.error(`❌ Access DENIED to page: ${currentPage}`);
        alert('Access Denied: You do not have permission to view this page.');
        window.location.href = '/templates/main.html';
        return false;
    }
    
    console.log(`✅ Access GRANTED to page: ${currentPage}`);
    return true;
}

// Run page access verification
verifyPageAccess();

// ==========================================
// LOGOUT FUNCTIONALITY
// ==========================================

function initializeLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        // Remove any existing event listeners by cloning the button
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        // Add the logout event listener
        newLogoutBtn.addEventListener('click', handleLogout);
        
        console.log('✓ Logout button initialized');
    } else {
        console.warn('⚠️ Logout button not found in DOM');
    }
}

function handleLogout() {
    console.log('🔓 Logout button clicked');
    
    if (confirm('Are you sure you want to logout?')) {
        // Clear all session storage
        sessionStorage.clear();
        
        // Clear any local storage if used
        localStorage.clear();
        
        console.log('%c👋 Logged out successfully', 'color: #27AE60; font-weight: bold;');
        
        // Redirect to login page
        window.location.href = 'log_in.html';
    } else {
        console.log('Logout cancelled by user');
    }
}

// ==========================================
// NAVIGATION HIGHLIGHT
// ==========================================

const currentPage = window.location.pathname.split('/').pop();
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href && href.includes(currentPage)) {
        item.style.background = 'rgba(212, 175, 55, 0.15)';
        item.style.color = 'var(--gold-light)';
        item.style.borderLeft = '4px solid var(--gold-primary)';
    }
});

// ==========================================
// PROTECTED NAVIGATION - STRICT MODE
// ==========================================

// Add click handler to all nav items to verify access
navItems.forEach(navItem => {
    navItem.addEventListener('click', (e) => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        
        if (!user) {
            e.preventDefault();
            window.location.href = 'log_in.html';
            return;
        }
        
        // CRITICAL: Administrators bypass all navigation restrictions
        if (user.role === 'administrator') {
            return true; // Allow navigation
        }
        
        // Get exact page identifier from data-page attribute
        const pageName = navItem.getAttribute('data-page');
        
        if (!pageName) {
            console.warn('Navigation item missing data-page attribute');
            return;
        }
        
        // Check access for staff users
        const permissions = user.permissions;
        
        if (!permissions || !permissions.allowedPages) {
            e.preventDefault();
            alert('Access Denied: No permissions configured for your account.');
            return false;
        }
        
        // ✅ EXACT MATCH - Prevent click if no access
        const hasAccess = permissions.allowedPages.includes(pageName);
        
        if (!hasAccess) {
            e.preventDefault();
            alert(`Access Denied: You do not have permission to access this module.`);
            console.log(`❌ Navigation blocked to: ${pageName}`);
            return false;
        }
        
        console.log(`✅ Navigation allowed to: ${pageName}`);
    });
});

// ==========================================
// MOBILE SIDEBAR TOGGLE
// ==========================================

const createMobileToggle = () => {
    if (window.innerWidth <= 768) {
        const topBar = document.querySelector('.top-bar');
        if (!document.querySelector('.mobile-toggle')) {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'mobile-toggle';
            toggleBtn.innerHTML = '☰';
            toggleBtn.style.cssText = `
                position: absolute;
                left: 1rem;
                top: 1.5rem;
                background: transparent;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: var(--navy-dark);
                z-index: 1000;
            `;
            
            toggleBtn.addEventListener('click', () => {
                const sidebar = document.querySelector('.sidebar');
                sidebar.classList.toggle('active');
            });
            
            topBar.appendChild(toggleBtn);
        }
    }
};

window.addEventListener('resize', createMobileToggle);
createMobileToggle();

// ==========================================
// SMOOTH PAGE TRANSITIONS
// ==========================================

document.body.style.opacity = '0';
setTimeout(() => {
    document.body.style.transition = 'opacity 0.5s ease';
    document.body.style.opacity = '1';
}, 100);

// ==========================================
// GLOBAL AUTHENTICATION API
// ==========================================

window.GoldenThreadsAuth = {
    getCurrentUser: () => {
        return JSON.parse(sessionStorage.getItem('user'));
    },
    
    isAuthenticated: () => {
        return sessionStorage.getItem('user') !== null;
    },
    
    hasPermission: (pageName) => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user) return false;
        
        // Administrators always have permission
        if (user.role === 'administrator') return true;
        
        // Check staff permissions with EXACT MATCH
        if (!user.permissions || !user.permissions.allowedPages) return false;
        
        return user.permissions.allowedPages.includes(pageName);
    },
    
    isAdmin: () => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        return user && user.role === 'administrator';
    },
    
    logout: handleLogout,
    
    updateSession: (userData) => {
        sessionStorage.setItem('user', JSON.stringify(userData));
    }
};

// ==========================================
// FINAL CONSOLE SUMMARY
// ==========================================

const user = JSON.parse(sessionStorage.getItem('user'));
if (user) {
    console.log('\n%c========================================', 'color: #D4AF37;');
    console.log('%c👤 CURRENT USER SESSION', 'color: #D4AF37; font-size: 14px; font-weight: bold;');
    console.log('%c========================================', 'color: #D4AF37;');
    console.log(`Username: ${user.username}`);
    console.log(`Role: ${user.role}`);
    console.log(`Display Name: ${user.displayName}`);
    
    if (user.role === 'administrator') {
        console.log('\n%c🔓 ADMINISTRATOR MODE - FULL ACCESS', 'color: #D4AF37; font-size: 14px; font-weight: bold; background: #1A2332; padding: 5px 10px;');
    } else {
        console.log('\n%c🔒 STAFF MODE - LIMITED ACCESS', 'color: #E74C3C; font-size: 14px; font-weight: bold; background: #1A2332; padding: 5px 10px;');
        if (user.permissions && user.permissions.allowedPages) {
            console.log('\n%cAllowed Pages:', 'color: #27AE60; font-weight: bold;');
            user.permissions.allowedPages.forEach(page => {
                console.log(`  ✅ ${page}`);
            });
        }
        if (user.permissions && user.permissions.restrictedPages) {
            console.log('\n%cRestricted Pages:', 'color: #E74C3C; font-weight: bold;');
            user.permissions.restrictedPages.forEach(page => {
                console.log(`  ❌ ${page}`);
            });
        }
    }


    /*dashboard function*/
    // ==========================================
// DASHBOARD MODULE
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});

// ==========================================
// DASHBOARD INITIALIZATION
// ==========================================

function initializeDashboard() {
    console.log('%c📊 Dashboard Initializing...', 'color: #D4AF37; font-weight: bold;');
    
    // Display current date
    displayCurrentDate();
    
    // Display welcome message
    displayWelcomeMessage();
    
    // Load dashboard statistics
    loadDashboardStats();
    
    // Initialize task checkboxes
    initializeTaskCheckboxes();
    
    // Initialize notification system
    updateNotificationCount();
    
    console.log('%c✓ Dashboard Ready', 'color: #27AE60; font-weight: bold;');
}

// ==========================================
// CURRENT DATE DISPLAY
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

// ==========================================
// WELCOME MESSAGE
// ==========================================

function displayWelcomeMessage() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const welcomeUserName = document.getElementById('welcomeUserName');
    
    if (user && welcomeUserName) {
        welcomeUserName.textContent = user.displayName || user.username;
    }
}

// ==========================================
// LOAD DASHBOARD STATISTICS
// ==========================================

function loadDashboardStats() {
    // Simulate loading data (in real app, this would be API calls)
    setTimeout(() => {
        updateStatCard('activeOrders', 24);
        updateStatCard('inProduction', 18);
        updateStatCard('inventoryItems', 156);
        updateStatCard('employeeCount', 32);
        updateStatCard('completedToday', 12);
        updateStatCard('inProgressToday', 8);
        updateStatCard('pendingQC', 4);
    }, 500);
}

function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Animate number counting
    const duration = 1000;
    const start = 0;
    const end = value;
    const startTime = performance.now();
    
    function updateCount(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(progress * (end - start) + start);
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(updateCount);
        }
    }
    
    requestAnimationFrame(updateCount);
}

// ==========================================
// TASK CHECKBOXES
// ==========================================

function initializeTaskCheckboxes() {
    const checkboxes = document.querySelectorAll('.task-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const taskItem = this.closest('.task-item');
            const taskTitle = taskItem.querySelector('.task-title');
            
            if (this.checked) {
                taskTitle.style.textDecoration = 'line-through';
                taskTitle.style.opacity = '0.6';
                
                // Update task count
                updateTaskCount(-1);
                
                // Show completion message
                setTimeout(() => {
                    if (confirm('Mark this task as completed?')) {
                        taskItem.style.transition = 'all 0.3s ease';
                        taskItem.style.opacity = '0';
                        taskItem.style.transform = 'translateX(20px)';
                        
                        setTimeout(() => {
                            taskItem.remove();
                        }, 300);
                    } else {
                        this.checked = false;
                        taskTitle.style.textDecoration = 'none';
                        taskTitle.style.opacity = '1';
                        updateTaskCount(1);
                    }
                }, 100);
            } else {
                taskTitle.style.textDecoration = 'none';
                taskTitle.style.opacity = '1';
                updateTaskCount(1);
            }
        });
    });
}

function updateTaskCount(change) {
    const badge = document.getElementById('taskCountBadge');
    if (!badge) return;
    
    const currentCount = parseInt(badge.textContent) || 0;
    const newCount = Math.max(0, currentCount + change);
    badge.textContent = newCount;
}

// ==========================================
// NOTIFICATION SYSTEM
// ==========================================

function updateNotificationCount() {
    const notificationBadge = document.getElementById('notificationCount');
    if (!notificationBadge) return;
    
    // Simulate notifications (in real app, this would be from backend)
    const notifications = [
        'Low stock alert: Cotton Fabric',
        'Order #1234 completed',
        'Quality check pending for Batch #456'
    ];
    
    notificationBadge.textContent = notifications.length;
    
    // Add click handler for notification button
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            showNotifications(notifications);
        });
    }
}

function showNotifications(notifications) {
    const message = notifications.length > 0 
        ? notifications.join('\n\n') 
        : 'No new notifications';
    
    alert(`Notifications:\n\n${message}`);
}

// ==========================================
// REORDER FUNCTIONALITY
// ==========================================

// Add event listeners to all reorder buttons
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('alert-action-btn')) {
        const alertItem = e.target.closest('.stock-alert-item');
        const itemName = alertItem.querySelector('.alert-item-name').textContent;
        
        if (confirm(`Create reorder request for "${itemName}"?`)) {
            // In real app, this would send data to backend
            alert(`Reorder request created for ${itemName}\n\nRedirecting to Inventory Management...`);
            
            // Optionally redirect to inventory page
            setTimeout(() => {
                // window.location.href = '/templates/inventory.html';
            }, 1000);
        }
    }
});

// ==========================================
// ACTIVITY REFRESH
// ==========================================

function refreshActivityFeed() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;
    
    // Add loading state
    activityList.style.opacity = '0.5';
    
    setTimeout(() => {
        // In real app, fetch new activities from backend
        activityList.style.opacity = '1';
        console.log('Activity feed refreshed');
    }, 500);
}

// ==========================================
// AUTO-REFRESH DATA
// ==========================================

// Refresh dashboard data every 5 minutes
setInterval(() => {
    console.log('Auto-refreshing dashboard data...');
    loadDashboardStats();
    updateNotificationCount();
}, 300000); // 5 minutes

// ==========================================
// QUICK ACTION HANDLERS
// ==========================================

// These are already handled by onclick in HTML, but can be enhanced here
function navigateToModule(modulePath) {
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (!user) {
        alert('Please log in to continue');
        window.location.href = '/log_in.html';
        return;
    }
    
    // Check permissions if needed
    window.location.href = modulePath;
}

// ==========================================
// WIDGET ANIMATIONS
// ==========================================

// Add scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all widgets
document.querySelectorAll('.dashboard-widget').forEach(widget => {
    widget.style.opacity = '0';
    widget.style.transform = 'translateY(20px)';
    widget.style.transition = 'all 0.6s ease';
    observer.observe(widget);
});

// ==========================================
// GREETING MESSAGE BASED ON TIME
// ==========================================

function getGreeting() {
    const hour = new Date().getHours();
    
    if (hour < 12) {
        return 'Good morning';
    } else if (hour < 18) {
        return 'Good afternoon';
    } else {
        return 'Good evening';
    }
}

// Update welcome message with time-based greeting
window.addEventListener('load', () => {
    const welcomeText = document.querySelector('.welcome-text h2');
    if (welcomeText) {
        const user = JSON.parse(sessionStorage.getItem('user'));
        const userName = user ? (user.displayName || user.username) : 'User';
        const greeting = getGreeting();
        
        welcomeText.innerHTML = `${greeting}, <span id="welcomeUserName">${userName}</span>!`;
    }
});

// ==========================================
// EXPORT DASHBOARD UTILITIES
// ==========================================

window.DashboardUtils = {
    refreshStats: loadDashboardStats,
    refreshActivity: refreshActivityFeed,
    updateNotifications: updateNotificationCount,
    navigateTo: navigateToModule
};

console.log('%c✓ Dashboard Module Loaded', 'color: #27AE60; font-weight: bold;');

    
    console.log('\n%c✓ GoldenThreads IMS System Ready', 'color: #27AE60; font-size: 14px; font-weight: bold;');
    console.log('%c========================================\n', 'color: #D4AF37;');
}