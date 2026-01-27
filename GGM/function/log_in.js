// ==========================================
// ROLE-BASED ACCESS CONFIGURATION
// ==========================================

const ROLE_PERMISSIONS = {
    administrator: {
        name: 'Administrator',
        allowedPages: [
            'order_job',           // ✓ Has access
            'Production_Quality',  // ✓ Has access
            'inventory',             // ✓ Has access
            'billing_delivery',    // ✓ Has access
            'Employee_Payroll',    // ✓ Has access
            'reports'                // ✓ Has access
        ],
        allowedModules: [
            'orderTracking',
            'productionQuality',
            'inventoryManagement',
            'billingDelivery',
            'employeePayroll',
            'reportsAnalytics'
        ]
    },
    staff: {
        name: 'Staff',
        allowedPages: [
            'main',                // ✓ Dashboard access
            'order_job',           // ✓ Staff HAS access
            'billing_delivery',    // ✓ Has access
            'Production_Quality'   // ✓ Staff HAS access
        ],
        allowedModules: [
            'orderTracking',
            'billingDelivery',
            'productionQuality'
        ],
        restrictedPages: [
            'inventory',             // ✗ Staff CANNOT access
            'Employee_Payroll',    // ✗ Staff CANNOT access
            'reports'                // ✗ Staff CANNOT access
        ]
    }
};

// ==========================================
// DEMO CREDENTIALS (Replace with backend authentication)
// ==========================================

const DEMO_USERS = {
    administrator: {
        username: 'admin',
        password: 'admin123',
        role: 'administrator'
    },
    staff: {
        username: 'staff',
        password: 'staff123',
        role: 'staff'
    }
};

// ==========================================
// GLOBAL VARIABLES
// ==========================================

let selectedRole = 'administrator';

// ==========================================
// DOM ELEMENTS
// ==========================================

const roleButtons = document.querySelectorAll('.role-btn');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');
const formError = document.getElementById('formError');

// ==========================================
// ROLE SELECTION HANDLER
// ==========================================

roleButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        roleButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Update selected role
        selectedRole = button.dataset.role;
        
        // Clear any existing errors
        clearErrors();
        
        console.log('Selected role:', selectedRole);
    });
});

// ==========================================
// FORM VALIDATION
// ==========================================

function validateUsername(username) {
    if (!username || username.trim() === '') {
        return 'Username is required';
    }
    if (username.length < 3) {
        return 'Username must be at least 3 characters';
    }
    return null;
}

function validatePassword(password) {
    if (!password || password.trim() === '') {
        return 'Password is required';
    }
    if (password.length < 6) {
        return 'Password must be at least 6 characters';
    }
    return null;
}

function showFieldError(input, errorElement, message) {
    input.classList.add('error');
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

function clearFieldError(input, errorElement) {
    input.classList.remove('error');
    errorElement.textContent = '';
    errorElement.classList.remove('show');
}

function clearErrors() {
    clearFieldError(usernameInput, usernameError);
    clearFieldError(passwordInput, passwordError);
    formError.style.display = 'none';
    formError.textContent = '';
}

function showFormError(message) {
    formError.textContent = message;
    formError.style.display = 'block';
}

// ==========================================
// AUTHENTICATION
// ==========================================

function authenticateUser(username, password, role) {
    // In a real application, this would be an API call to your backend
    // For demo purposes, we're using the DEMO_USERS object
    
    const demoUser = DEMO_USERS[role];
    
    if (demoUser && demoUser.username === username && demoUser.password === password) {
        return {
            success: true,
            user: {
                username: username,
                role: role,
                displayName: ROLE_PERMISSIONS[role].name
            }
        };
    }
    
    return {
        success: false,
        message: 'Invalid username or password'
    };
}

// ==========================================
// SESSION MANAGEMENT
// ==========================================

function createUserSession(user) {
    const sessionData = {
        username: user.username,
        role: user.role,
        displayName: user.displayName,
        permissions: ROLE_PERMISSIONS[user.role],
        loginTime: new Date().toISOString(),
        sessionId: generateSessionId()
    };
    
    // Store in sessionStorage (for demo - use secure backend sessions in production)
    sessionStorage.setItem('user', JSON.stringify(sessionData));
    sessionStorage.setItem('isAuthenticated', 'true');
    
    return sessionData;
}

function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ==========================================
// FORM SUBMISSION HANDLER
// ==========================================

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    clearErrors();
    
    // Get form values
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    // Validate inputs
    let hasError = false;
    
    const usernameValidation = validateUsername(username);
    if (usernameValidation) {
        showFieldError(usernameInput, usernameError, usernameValidation);
        hasError = true;
    }
    
    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
        showFieldError(passwordInput, passwordError, passwordValidation);
        hasError = true;
    }
    
    if (hasError) {
        return;
    }
    
    // Disable submit button during authentication
    const submitBtn = loginForm.querySelector('.sign-in-btn');
    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'LOGGING IN...';
    
    // Simulate API delay (remove in production)
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Authenticate user
    const authResult = authenticateUser(username, password, selectedRole);
    
    if (authResult.success) {
        // Create session
        const session = createUserSession(authResult.user);
        
        console.log('Login successful:', session);
        
        // Show success feedback
        submitBtn.querySelector('span').textContent = 'SUCCESS!';
        submitBtn.style.background = 'var(--success-green)';
        
        // Redirect to main page after brief delay
        setTimeout(() => {
            window.location.href = 'main.html';
        }, 500);
    } else {
        // Show error message
        showFormError(authResult.message);
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'SIGN IN';
    }
});

// ==========================================
// INPUT FIELD LISTENERS
// ==========================================

usernameInput.addEventListener('input', () => {
    if (usernameError.classList.contains('show')) {
        clearFieldError(usernameInput, usernameError);
    }
});

passwordInput.addEventListener('input', () => {
    if (passwordError.classList.contains('show')) {
        clearFieldError(passwordInput, passwordError);
    }
});

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================

// Allow Enter key to submit form from password field
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
    }
});

// ==========================================
// PAGE LOAD ANIMATIONS
// ==========================================

window.addEventListener('load', () => {
    // Smooth fade-in animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
    
    // Check if already logged in
    checkExistingSession();
});

// ==========================================
// SESSION CHECK
// ==========================================

function checkExistingSession() {
    const isAuthenticated = sessionStorage.getItem('isAuthenticated');
    const userData = sessionStorage.getItem('user');
    
    if (isAuthenticated === 'true' && userData) {
        // User is already logged in, redirect to main page
        console.log('Active session found, redirecting...');
        window.location.href = 'main.html';
    }
}

// ==========================================
// HELPER FUNCTIONS FOR MAIN.HTML
// ==========================================

// Export these functions for use in main.html
window.GoldenThreadsAuth = {
    // Check if user has permission to access a page
    hasPageAccess: function(pageName) {
        const userData = JSON.parse(sessionStorage.getItem('user'));
        if (!userData) return false;
        
        const permissions = userData.permissions;
        return permissions.allowedPages.includes(pageName);
    },
    
    // Check if user has permission to access a module
    hasModuleAccess: function(moduleName) {
        const userData = JSON.parse(sessionStorage.getItem('user'));
        if (!userData) return false;
        
        const permissions = userData.permissions;
        return permissions.allowedModules && permissions.allowedModules.includes(moduleName);
    },
    
    // Get restricted pages for current user
    getRestrictedPages: function() {
        const userData = JSON.parse(sessionStorage.getItem('user'));
        if (!userData) return [];
        
        return userData.permissions.restrictedPages || [];
    },
    
    // Get user info
    getUserInfo: function() {
        return JSON.parse(sessionStorage.getItem('user'));
    },
    
    // Logout function
    logout: function() {
        sessionStorage.clear();
        window.location.href = 'log_in.html';
    },
    
    // Check if authenticated
    isAuthenticated: function() {
        return sessionStorage.getItem('isAuthenticated') === 'true';
    }
};

// ==========================================
// CONSOLE INFO
// ==========================================

console.log('%c🔐 GoldenThreads Login System', 'color: #D4AF37; font-size: 16px; font-weight: bold;');
console.log('%cDemo Credentials:', 'color: #2C3E50; font-weight: bold;');
console.log('Administrator: admin / admin123');
console.log('Staff: staff / staff123');
console.log('%c⚠️ Replace with secure backend authentication in production', 'color: #E74C3C;');