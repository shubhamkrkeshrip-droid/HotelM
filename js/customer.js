// Customer functionality
class CustomerManager {
    constructor() {
        this.storage = storage;
        this.auth = auth;
        this.currentUser = this.auth.getCurrentUser();
        
        if (!this.currentUser && !window.location.pathname.includes('register.html')) {
            window.location.href = '../login.html';
        }
    }

    loadDashboard() {
        document.getElementById('userName').textContent = this.currentUser.name;
        this.loadStats();
        this.loadRecentBookings();
    }

    loadStats() {
        const bookings = this.storage.getBookingsByUser(this.currentUser.id);
        const upcoming = bookings.filter(b => b.status === 'confirmed' && new Date(b.checkIn) > new Date());
        const past = bookings.filter(b => b.status === 'completed' || new Date(b.checkOut) < new Date());
        const complaints = this.storage.getComplaintsByUser(this.currentUser.id);
        const activeComplaints = complaints.filter(c => c.status !== 'closed');
        const totalSpent = bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.totalAmount, 0);
        
        document.getElementById('upcomingBookingsCount').textContent = upcoming.length;
        document.getElementById('pastBookingsCount').textContent = past.length;
        document.getElementById('activeComplaintsCount').textContent = activeComplaints.length;
        document.getElementById('totalSpent').textContent = formatCurrency(totalSpent);
    }

    loadRecentBookings() {
        const bookings = this.storage.getBookingsByUser(this.currentUser.id);
        const recent = bookings.sort((a,b) => new Date(b.bookingDate) - new Date(a.bookingDate)).slice(0, 5);
        const container = document.getElementById('recentBookingsList');
        
        if (!container) return;
        
        if (recent.length === 0) {
            container.innerHTML = '<p class="no-data">No bookings yet. <a href="search-rooms.html">Book a room now!</a></p>';
            return;
        }
        
        container.innerHTML = recent.map(booking => `
            <div class="booking-card">
                <div class="booking-info">
                    <strong>Booking #${booking.bookingId}</strong>
                    <p>${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}</p>
                    <p>${booking.roomType} Room | ${booking.adults} Adults</p>
                </div>
                <div class="booking-status">
                    <span class="status ${booking.status}">${booking.status}</span>
                    <p>${formatCurrency(booking.totalAmount)}</p>
                </div>
            </div>
        `).join('');
    }

    loadBookingHistory() {
        const bookings = this.storage.getBookingsByUser(this.currentUser.id);
        const upcoming = bookings.filter(b => b.status === 'confirmed' && new Date(b.checkIn) > new Date());
        const past = bookings.filter(b => b.status === 'completed' || new Date(b.checkOut) < new Date());
        const cancelled = bookings.filter(b => b.status === 'cancelled');
        
        this.displayBookings(upcoming, 'upcomingBookingsList');
        this.displayBookings(past, 'pastBookingsList');
        this.displayBookings(cancelled, 'cancelledBookingsList');
    }

    displayBookings(bookings, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (bookings.length === 0) {
            container.innerHTML = '<p class="no-data">No bookings found</p>';
            return;
        }
        
        container.innerHTML = bookings.map(booking => `
            <div class="booking-card">
                <div class="booking-header">
                    <h4>${booking.bookingId}</h4>
                    <span class="status ${booking.status}">${booking.status}</span>
                </div>
                <div class="booking-details">
                    <p><i class="fas fa-bed"></i> ${booking.roomType} Room</p>
                    <p><i class="fas fa-calendar"></i> ${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}</p>
                    <p><i class="fas fa-users"></i> ${booking.adults} Adults, ${booking.children || 0} Children</p>
                    <p><i class="fas fa-dollar-sign"></i> ${formatCurrency(booking.totalAmount)}</p>
                </div>
                <div class="booking-actions">
                    <button onclick="viewBookingDetails('${booking.id}')" class="btn btn-small">View Details</button>
                    ${booking.status === 'confirmed' ? `
                        <button onclick="modifyBooking('${booking.id}')" class="btn btn-small">Modify</button>
                        <button onclick="cancelBooking('${booking.id}')" class="btn btn-small btn-danger">Cancel</button>
                    ` : ''}
                    <button onclick="downloadInvoice('${booking.id}')" class="btn btn-small">Invoice</button>
                </div>
            </div>
        `).join('');
    }

    loadProfile() {
        document.getElementById('profileName').textContent = this.currentUser.name;
        document.getElementById('memberSince').textContent = formatDate(this.currentUser.createdAt);
        document.getElementById('fullName').value = this.currentUser.name || '';
        document.getElementById('email').value = this.currentUser.email || '';
        document.getElementById('mobile').value = this.currentUser.mobile || '';
        document.getElementById('gender').value = this.currentUser.gender || '';
        document.getElementById('age').value = this.currentUser.age || '';
        document.getElementById('address').value = this.currentUser.address || '';
        document.getElementById('username').value = this.currentUser.username || '';
    }

    updateProfile(formData) {
        const updatedUser = {
            ...this.currentUser,
            name: formData.fullName,
            email: formData.email,
            gender: formData.gender,
            age: formData.age,
            address: formData.address
        };
        
        const result = this.storage.updateUser(this.currentUser.id, updatedUser);
        if (result) {
            sessionStorage.setItem('currentUser', JSON.stringify(result));
            showAlert('Profile updated successfully!', 'success');
            return true;
        }
        return false;
    }

    loadComplaints() {
        const complaints = this.storage.getComplaintsByUser(this.currentUser.id);
        const container = document.getElementById('complaintsList');
        
        if (!container) return;
        
        if (complaints.length === 0) {
            container.innerHTML = '<p class="no-data">You have not registered any complaints.</p>';
            return;
        }
        
        container.innerHTML = complaints.map(complaint => `
            <div class="complaint-card" onclick="viewComplaintDetails('${complaint.id}')">
                <div class="complaint-header">
                    <h4>${complaint.title}</h4>
                    <span class="status ${complaint.status}">${complaint.status}</span>
                </div>
                <p><strong>Complaint #:</strong> ${complaint.complaintNumber}</p>
                <p><strong>Category:</strong> ${complaint.category}</p>
                <p><strong>Submitted:</strong> ${formatDate(complaint.createdAt)}</p>
                <p><strong>Description:</strong> ${complaint.description.substring(0, 100)}${complaint.description.length > 100 ? '...' : ''}</p>
                ${complaint.response ? `<p><strong>Response:</strong> ${complaint.response}</p>` : ''}
            </div>
        `).join('');
    }

    submitComplaint(complaintData) {
        const complaint = {
            userId: this.currentUser.id,
            customerName: this.currentUser.name,
            customerEmail: this.currentUser.email,
            ...complaintData,
            createdAt: new Date().toISOString()
        };
        
        const result = this.storage.saveComplaint(complaint);
        if (result) {
            showAlert(`Complaint submitted successfully! Complaint ID: ${result.complaintNumber}`, 'success');
            return true;
        }
        return false;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const customerManager = new CustomerManager();
    
    // Dashboard
    if (document.getElementById('userName')) {
        customerManager.loadDashboard();
    }
    
    // Booking History
    if (document.getElementById('upcomingBookingsList')) {
        customerManager.loadBookingHistory();
    }
    
    // Profile
    if (document.getElementById('profileForm')) {
        customerManager.loadProfile();
        
        document.getElementById('profileForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = {
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                gender: document.getElementById('gender').value,
                age: document.getElementById('age').value,
                address: document.getElementById('address').value
            };
            customerManager.updateProfile(formData);
        });
    }
    
    // Complaints
    if (document.getElementById('complaintsList')) {
        customerManager.loadComplaints();
    }
    
    // Register Complaint
    if (document.getElementById('complaintForm')) {
        // Load booking dropdown
        const bookings = customerManager.storage.getBookingsByUser(customerManager.currentUser.id);
        const bookingSelect = document.getElementById('bookingId');
        if (bookingSelect) {
            bookingSelect.innerHTML = '<option value="">Select a booking (optional)</option>' + 
                bookings.filter(b => b.status === 'confirmed').map(b => `<option value="${b.id}">${b.bookingId} - ${b.roomType} (${formatDate(b.checkIn)} to ${formatDate(b.checkOut)})</option>`).join('');
        }
        
        document.getElementById('complaintForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const complaintData = {
                category: document.getElementById('complaintCategory').value,
                bookingId: document.getElementById('bookingId').value,
                title: document.getElementById('complaintTitle').value,
                description: document.getElementById('complaintDescription').value,
                contactPreference: document.querySelector('input[name="contactPreference"]:checked').value
            };
            
            if (customerManager.submitComplaint(complaintData)) {
                setTimeout(() => window.location.href = 'track-complaints.html', 2000);
            }
        });
    }
});

function showBookings(type) {
    const sections = document.querySelectorAll('.bookings-section');
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(`${type}Bookings`).classList.add('active');
    
    const tabs = document.querySelectorAll('.booking-tabs .tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
}

function viewBookingDetails(bookingId) {
    window.location.href = `booking-details.html?id=${bookingId}`;
}

function modifyBooking(bookingId) {
    window.location.href = `modify-booking.html?id=${bookingId}`;
}

function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking? Check cancellation policy for refund eligibility.')) {
        const result = storage.cancelBooking(bookingId);
        if (result) {
            showAlert('Booking cancelled successfully', 'success');
            setTimeout(() => window.location.reload(), 1500);
        }
    }
}

function downloadInvoice(bookingId) {
    const booking = storage.getBookingById(bookingId);
    if (booking && booking.status === 'completed') {
        showAlert('Invoice download started', 'success');
    } else {
        showAlert('Invoice will be available after stay completion', 'info');
    }
}

function viewComplaintDetails(complaintId) {
    const complaint = storage.getComplaints().find(c => c.id === complaintId);
    if (complaint) {
        const modal = document.getElementById('complaintModal');
        const details = document.getElementById('complaintDetails');
        details.innerHTML = `
            <h3>${complaint.title}</h3>
            <p><strong>Complaint #:</strong> ${complaint.complaintNumber}</p>
            <p><strong>Category:</strong> ${complaint.category}</p>
            <p><strong>Status:</strong> <span class="status ${complaint.status}">${complaint.status}</span></p>
            <p><strong>Submitted:</strong> ${formatDate(complaint.createdAt)}</p>
            <p><strong>Description:</strong> ${complaint.description}</p>
            ${complaint.response ? `<p><strong>Response:</strong> ${complaint.response}</p>` : ''}
            ${complaint.resolutionDate ? `<p><strong>Resolved on:</strong> ${formatDate(complaint.resolutionDate)}</p>` : ''}
        `;
        modal.style.display = 'block';
        
        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = () => modal.style.display = 'none';
    }
}

function filterComplaints() {
    const filter = document.getElementById('complaintFilter').value;
    const complaints = storage.getComplaintsByUser(auth.getCurrentUser().id);
    const filtered = filter === 'all' ? complaints : complaints.filter(c => c.status === filter);
    
    const container = document.getElementById('complaintsList');
    if (filtered.length === 0) {
        container.innerHTML = '<p class="no-data">No complaints found</p>';
        return;
    }
    
    container.innerHTML = filtered.map(complaint => `
        <div class="complaint-card" onclick="viewComplaintDetails('${complaint.id}')">
            <div class="complaint-header">
                <h4>${complaint.title}</h4>
                <span class="status ${complaint.status}">${complaint.status}</span>
            </div>
            <p><strong>#:</strong> ${complaint.complaintNumber}</p>
            <p><strong>Category:</strong> ${complaint.category}</p>
            <p><strong>Submitted:</strong> ${formatDate(complaint.createdAt)}</p>
        </div>
    `).join('');
}

function resetComplaintForm() {
    document.getElementById('complaintForm').reset();
}

function changePassword() {
    const modal = document.getElementById('passwordModal');
    modal.style.display = 'block';
    
    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = () => modal.style.display = 'none';
    
    document.getElementById('changePasswordForm').onsubmit = function(e) {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        
        if (newPassword !== confirmPassword) {
            showAlert('New passwords do not match', 'error');
            return;
        }
        
        const result = auth.changePassword(auth.getCurrentUser().id, currentPassword, newPassword);
        if (result.success) {
            showAlert(result.message, 'success');
            modal.style.display = 'none';
            this.reset();
        } else {
            showAlert(result.message, 'error');
        }
    };
}