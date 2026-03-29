// Authentication Manager
class AuthManager {
    constructor() {
        this.storage = storage;
        this.currentUser = null;
        this.loadSession();
    }

    loadSession() {
        const session = sessionStorage.getItem('currentUser');
        if (session) {
            this.currentUser = JSON.parse(session);
        }
    }

    login(username, password, role) {
        const users = this.storage.getUsers();
        const user = users.find(u => u.username === username && u.role === role);
        
        if (user && this.storage.verifyPassword(password, user.password)) {
            if (user.status === 'inactive') {
                return { success: false, message: 'Your account is inactive. Please contact admin.' };
            }
            this.currentUser = user;
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            return { success: true, user };
        }
        
        return { success: false, message: 'Invalid username or password' };
    }

    register(userData) {
        if (this.storage.getUserByUsername(userData.username)) {
            return { success: false, message: 'Username already exists' };
        }
        
        if (this.storage.getUserByEmail(userData.email)) {
            return { success: false, message: 'Email already registered' };
        }
        
        if (this.storage.getUserByMobile(userData.mobile)) {
            return { success: false, message: 'Mobile number already registered' };
        }
        
        userData.password = this.storage.hashPassword(userData.password);
        userData.role = 'customer';
        userData.status = 'active';
        userData.createdAt = new Date().toISOString();
        
        const user = this.storage.saveUser(userData);
        return { success: true, user };
    }

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('currentUser');
        window.location.href = '../login.html';
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    isStaff() {
        return this.currentUser && this.currentUser.role === 'staff';
    }

    isCustomer() {
        return this.currentUser && this.currentUser.role === 'customer';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    changePassword(userId, oldPassword, newPassword) {
        const user = this.storage.getUserById(userId);
        if (!user || !this.storage.verifyPassword(oldPassword, user.password)) {
            return { success: false, message: 'Current password is incorrect' };
        }
        
        const passwordError = Validator.validatePassword(newPassword);
        if (passwordError) {
            return { success: false, message: passwordError };
        }
        
        user.password = this.storage.hashPassword(newPassword);
        this.storage.updateUser(userId, user);
        return { success: true, message: 'Password changed successfully' };
    }
}

const auth = new AuthManager();

// Handle login form submissions
document.addEventListener('DOMContentLoaded', function() {
    const customerLoginForm = document.getElementById('customerLoginForm');
    if (customerLoginForm) {
        customerLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('customerUsername').value;
            const password = document.getElementById('customerPassword').value;
            
            const result = auth.login(username, password, 'customer');
            if (result.success) {
                showAlert('Login successful!', 'success');
                setTimeout(() => window.location.href = 'customer/dashboard.html', 1000);
            } else {
                showAlert(result.message, 'error');
            }
        });
    }
    
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('adminUsername').value;
            const password = document.getElementById('adminPassword').value;
            
            const result = auth.login(username, password, 'admin');
            if (result.success) {
                showAlert('Admin login successful!', 'success');
                setTimeout(() => window.location.href = 'admin/dashboard.html', 1000);
            } else {
                showAlert(result.message, 'error');
            }
        });
    }
    
    const staffLoginForm = document.getElementById('staffLoginForm');
    if (staffLoginForm) {
        staffLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const staffId = document.getElementById('staffId').value;
            const password = document.getElementById('staffPassword').value;
            
            const result = auth.login(staffId, password, 'staff');
            if (result.success) {
                showAlert('Staff login successful!', 'success');
                setTimeout(() => window.location.href = 'staff/dashboard.html', 1000);
            } else {
                showAlert(result.message, 'error');
            }
        });
    }
});

function showLoginTab(role) {
    const forms = document.querySelectorAll('.login-form');
    forms.forEach(form => form.classList.remove('active'));
    
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    if (role === 'customer') {
        document.getElementById('customerLoginForm').classList.add('active');
    } else if (role === 'admin') {
        document.getElementById('adminLoginForm').classList.add('active');
    } else if (role === 'staff') {
        document.getElementById('staffLoginForm').classList.add('active');
    }
    event.target.classList.add('active');
}

function logout() {
    auth.logout();
}