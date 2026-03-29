// Admin functionality
class AdminManager {
    constructor() {
        this.storage = storage;
        this.auth = auth;
        this.currentUser = this.auth.getCurrentUser();
        
        if (!this.currentUser || !this.auth.isAdmin()) {
            window.location.href = '../login.html';
        }
    }

    loadDashboard() {
        document.getElementById('adminWelcomeName').textContent = this.currentUser.name;
        this.loadStats();
        this.loadCharts();
        this.loadRecentBookings();
    }

    loadStats() {
        const rooms = this.storage.getRooms();
        const bookings = this.storage.getBookings();
        const users = this.storage.getUsers().filter(u => u.role === 'customer');
        const today = new Date().toISOString().split('T')[0];
        const todayBookings = bookings.filter(b => b.checkIn === today);
        
        const currentMonth = new Date().getMonth();
        const monthlyRevenue = bookings
            .filter(b => b.status === 'completed' && new Date(b.checkOut).getMonth() === currentMonth)
            .reduce((sum, b) => sum + b.totalAmount, 0);
        
        document.getElementById('totalRooms').textContent = rooms.length;
        document.getElementById('todayBookings').textContent = todayBookings.length;
        document.getElementById('totalCustomers').textContent = users.length;
        document.getElementById('monthlyRevenue').textContent = formatCurrency(monthlyRevenue);
    }

    loadCharts() {
        const bookings = this.storage.getBookings();
        const last7Days = Array.from({length: 7}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();
        
        const dailyBookings = last7Days.map(date => 
            bookings.filter(b => b.bookingDate.split('T')[0] === date).length
        );
        
        const bookingCtx = document.getElementById('bookingChart')?.getContext('2d');
        if (bookingCtx) {
            new Chart(bookingCtx, {
                type: 'line',
                data: { labels: last7Days, datasets: [{ label: 'Bookings', data: dailyBookings, borderColor: '#c7a17a', tension: 0.4 }] }
            });
        }
        
        const revenueCtx = document.getElementById('revenueChart')?.getContext('2d');
        if (revenueCtx) {
            const roomTypes = ['Standard', 'Deluxe', 'Suite'];
            const revenueByType = roomTypes.map(type => 
                bookings.filter(b => b.roomType === type && b.status === 'completed').reduce((sum, b) => sum + b.totalAmount, 0)
            );
            new Chart(revenueCtx, {
                type: 'pie',
                data: { labels: roomTypes, datasets: [{ data: revenueByType, backgroundColor: ['#c7a17a', '#2c3e50', '#e67e22'] }] }
            });
        }
    }

    loadRecentBookings() {
        const bookings = this.storage.getBookings().slice(0, 10);
        const tbody = document.querySelector('#recentBookingsTable tbody');
        if (tbody) {
            tbody.innerHTML = bookings.map(booking => `
                <tr>
                    <td>${booking.bookingId}</td>
                    <td>${booking.customerName}</td>
                    <td>${booking.roomNumber}</td>
                    <td>${formatDate(booking.checkIn)}</td>
                    <td>${formatCurrency(booking.totalAmount)}</td>
                    <td><span class="status ${booking.status}">${booking.status}</span></td>
                </tr>
            `).join('');
        }
    }

    loadRooms() {
        let rooms = this.storage.getRooms();
        const searchTerm = document.getElementById('searchRoom')?.value.toLowerCase();
        const typeFilter = document.getElementById('roomTypeFilter')?.value;
        const statusFilter = document.getElementById('statusFilter')?.value;
        
        if (searchTerm) {
            rooms = rooms.filter(r => r.roomNumber.toLowerCase().includes(searchTerm) || r.type.toLowerCase().includes(searchTerm));
        }
        if (typeFilter) rooms = rooms.filter(r => r.type === typeFilter);
        if (statusFilter) rooms = rooms.filter(r => r.status === statusFilter);
        
        const tbody = document.querySelector('#roomsTable tbody');
        if (tbody) {
            tbody.innerHTML = rooms.map(room => `
                <tr>
                    <td>${room.roomNumber}</td>
                    <td>${room.type}</td>
                    <td>${formatCurrency(room.price)}</td>
                    <td>${room.maxOccupancy}</td>
                    <td>${room.amenities.join(', ')}</td>
                    <td><span class="status ${room.status}">${room.status}</span></td>
                    <td>
                        <button onclick="editRoom('${room.id}')" class="btn btn-small">Edit</button>
                        <button onclick="deleteRoom('${room.id}')" class="btn btn-small btn-danger">Delete</button>
                    </td>
                </tr>
            `).join('');
        }
    }

    addRoom(roomData) {
        if (this.storage.getRoomByNumber(roomData.roomNumber)) {
            showAlert('Room number already exists', 'error');
            return false;
        }
        this.storage.saveRoom(roomData);
        showAlert('Room added successfully', 'success');
        return true;
    }

    updateRoom(roomId, roomData) {
        this.storage.updateRoom(roomId, roomData);
        showAlert('Room updated successfully', 'success');
    }

    deleteRoom(roomId) {
        if (confirm('Are you sure you want to delete this room?')) {
            this.storage.deleteRoom(roomId);
            showAlert('Room deleted successfully', 'success');
            this.loadRooms();
        }
    }

    loadReservations() {
        let bookings = this.storage.getBookings();
        const searchTerm = document.getElementById('searchReservation')?.value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter')?.value;
        
        if (searchTerm) {
            bookings = bookings.filter(b => 
                b.bookingId.toLowerCase().includes(searchTerm) || 
                b.customerName.toLowerCase().includes(searchTerm) ||
                b.roomNumber.toLowerCase().includes(searchTerm)
            );
        }
        if (statusFilter) bookings = bookings.filter(b => b.status === statusFilter);
        
        const tbody = document.querySelector('#reservationsTable tbody');
        if (tbody) {
            tbody.innerHTML = bookings.map(booking => `
                <tr>
                    <td>${booking.bookingId}</td>
                    <td>${booking.customerName}</td>
                    <td>${booking.roomNumber}</td>
                    <td>${formatDate(booking.checkIn)}</td>
                    <td>${formatDate(booking.checkOut)}</td>
                    <td>${formatCurrency(booking.totalAmount)}</td>
                    <td><span class="status ${booking.status}">${booking.status}</span></td>
                    <td>
                        <button onclick="editReservation('${booking.id}')" class="btn btn-small">Edit</button>
                        <button onclick="cancelReservation('${booking.id}')" class="btn btn-small btn-danger">Cancel</button>
                    </td>
                </tr>
            `).join('');
        }
    }

    loadCustomers() {
        let users = this.storage.getUsers().filter(u => u.role === 'customer');
        const searchTerm = document.getElementById('searchCustomer')?.value.toLowerCase();
        if (searchTerm) {
            users = users.filter(u => 
                u.name.toLowerCase().includes(searchTerm) || 
                u.email.toLowerCase().includes(searchTerm) ||
                u.username.toLowerCase().includes(searchTerm)
            );
        }
        
        const tbody = document.querySelector('#customersTable tbody');
        if (tbody) {
            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>${user.id.slice(-6)}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.mobile}</td>
                    <td>${user.username}</td>
                    <td><span class="status ${user.status || 'active'}">${user.status || 'active'}</span></td>
                    <td>
                        <button onclick="editCustomer('${user.id}')" class="btn btn-small">Edit</button>
                        <button onclick="toggleCustomerStatus('${user.id}')" class="btn btn-small">${user.status === 'inactive' ? 'Activate' : 'Deactivate'}</button>
                    </td>
                </tr>
            `).join('');
        }
    }

    loadStaff() {
        let staff = this.storage.getUsers().filter(u => u.role === 'staff');
        const searchTerm = document.getElementById('searchStaff')?.value.toLowerCase();
        if (searchTerm) {
            staff = staff.filter(s => 
                s.name.toLowerCase().includes(searchTerm) || 
                s.email.toLowerCase().includes(searchTerm) ||
                s.staffId.toLowerCase().includes(searchTerm)
            );
        }
        
        const tbody = document.querySelector('#staffTable tbody');
        if (tbody) {
            tbody.innerHTML = staff.map(member => `
                <tr>
                    <td>${member.staffId || member.id.slice(-6)}</td>
                    <td>${member.name}</td>
                    <td>${member.email}</td>
                    <td>${member.mobile}</td>
                    <td>${member.department || 'General'}</td>
                    <td>${member.staffRole || 'Staff'}</td>
                    <td><span class="status ${member.status || 'active'}">${member.status || 'active'}</span></td>
                    <td>
                        <button onclick="editStaff('${member.id}')" class="btn btn-small">Edit</button>
                        <button onclick="resetStaffPassword('${member.id}')" class="btn btn-small">Reset Password</button>
                    </td>
                </tr>
            `).join('');
        }
    }

    loadComplaints() {
        let complaints = this.storage.getComplaints();
        const statusFilter = document.getElementById('complaintStatusFilter')?.value;
        const categoryFilter = document.getElementById('complaintCategoryFilter')?.value;
        
        if (statusFilter) complaints = complaints.filter(c => c.status === statusFilter);
        if (categoryFilter) complaints = complaints.filter(c => c.category === categoryFilter);
        
        const staff = this.storage.getUsers().filter(u => u.role === 'staff');
        const staffSelect = document.getElementById('assignedStaffFilter');
        if (staffSelect) {
            staffSelect.innerHTML = '<option value="">All Staff</option>' + 
                staff.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        }
        
        const tbody = document.querySelector('#complaintsTable tbody');
        if (tbody) {
            tbody.innerHTML = complaints.map(complaint => {
                const assignedStaff = staff.find(s => s.id === complaint.assignedTo);
                return `
                    <tr>
                        <td>${complaint.complaintNumber}</td>
                        <td>${complaint.customerName}</td>
                        <td>${complaint.category}</td>
                        <td>${complaint.title}</td>
                        <td><span class="status ${complaint.status}">${complaint.status}</span></td>
                        <td>${assignedStaff ? assignedStaff.name : 'Unassigned'}</td>
                        <td>${formatDate(complaint.createdAt)}</td>
                        <td><button onclick="viewComplaint('${complaint.id}')" class="btn btn-small">View</button></td>
                    </tr>
                `;
            }).join('');
        }
    }

    updateComplaint(complaintId, data) {
        this.storage.updateComplaint(complaintId, data);
        showAlert('Complaint updated successfully', 'success');
        this.loadComplaints();
    }

    loadBills() {
        let bills = this.storage.getBills();
        const searchTerm = document.getElementById('searchBill')?.value.toLowerCase();
        if (searchTerm) {
            bills = bills.filter(b => 
                b.billNumber.toLowerCase().includes(searchTerm) || 
                (b.customerName && b.customerName.toLowerCase().includes(searchTerm))
            );
        }
        
        const tbody = document.querySelector('#billsTable tbody');
        if (tbody) {
            tbody.innerHTML = bills.map(bill => {
                const customer = this.storage.getUserById(bill.userId);
                return `
                    <tr>
                        <td>${bill.billNumber}</td>
                        <td>${customer ? customer.name : 'N/A'}</td>
                        <td>${formatDate(bill.createdAt)}</td>
                        <td>${formatCurrency(bill.amount)}</td>
                        <td><span class="status ${bill.status}">${bill.status}</span></td>
                        <td>
                            <button onclick="viewBill('${bill.id}')" class="btn btn-small">View</button>
                            <button onclick="downloadBill('${bill.id}')" class="btn btn-small">Download</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    generateReport() {
        const fromDate = document.getElementById('reportFrom')?.value;
        const toDate = document.getElementById('reportTo')?.value;
        const bookings = this.storage.getBookings();
        
        let filtered = bookings;
        if (fromDate) filtered = filtered.filter(b => b.bookingDate >= fromDate);
        if (toDate) filtered = filtered.filter(b => b.bookingDate <= toDate);
        
        const monthlyData = {};
        filtered.forEach(booking => {
            const month = new Date(booking.bookingDate).toLocaleString('default', { month: 'short', year: 'numeric' });
            if (!monthlyData[month]) monthlyData[month] = { bookings: 0, roomRevenue: 0, serviceRevenue: 0, total: 0 };
            monthlyData[month].bookings++;
            monthlyData[month].roomRevenue += booking.totalAmount;
            monthlyData[month].total += booking.totalAmount;
        });
        
        const tbody = document.querySelector('#revenueReportTable tbody');
        if (tbody) {
            tbody.innerHTML = Object.entries(monthlyData).map(([month, data]) => `
                <tr>
                    <td>${month}</td>
                    <td>${data.bookings}</td>
                    <td>${formatCurrency(data.roomRevenue)}</td>
                    <td>${formatCurrency(data.serviceRevenue)}</td>
                    <td>${formatCurrency(data.total)}</td>
                </tr>
            `).join('');
        }
        
        // Update charts
        const bookingCtx = document.getElementById('bookingSummaryChart')?.getContext('2d');
        const revenueCtx = document.getElementById('revenueByRoomChart')?.getContext('2d');
        const occupancyCtx = document.getElementById('occupancyChart')?.getContext('2d');
        const complaintCtx = document.getElementById('complaintStatsChart')?.getContext('2d');
        
        if (bookingCtx) {
            const months = Object.keys(monthlyData);
            const bookingCounts = Object.values(monthlyData).map(d => d.bookings);
            new Chart(bookingCtx, { type: 'bar', data: { labels: months, datasets: [{ label: 'Bookings', data: bookingCounts, backgroundColor: '#c7a17a' }] } });
        }
        
        if (revenueCtx) {
            const roomTypes = ['Standard', 'Deluxe', 'Suite'];
            const revenueByType = roomTypes.map(type => 
                filtered.filter(b => b.roomType === type).reduce((sum, b) => sum + b.totalAmount, 0)
            );
            new Chart(revenueCtx, { type: 'pie', data: { labels: roomTypes, datasets: [{ data: revenueByType, backgroundColor: ['#c7a17a', '#2c3e50', '#e67e22'] }] } });
        }
    }
}

const adminManager = new AdminManager();

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('adminWelcomeName')) adminManager.loadDashboard();
    if (document.getElementById('roomsTable')) adminManager.loadRooms();
    if (document.getElementById('reservationsTable')) adminManager.loadReservations();
    if (document.getElementById('customersTable')) adminManager.loadCustomers();
    if (document.getElementById('staffTable')) adminManager.loadStaff();
    if (document.getElementById('complaintsTable')) adminManager.loadComplaints();
    if (document.getElementById('billsTable')) adminManager.loadBills();
    if (document.getElementById('revenueReportTable')) adminManager.generateReport();
    
    // Add Room Form
    const addRoomForm = document.getElementById('addRoomForm');
    if (addRoomForm) {
        const amenities = ['Wi-Fi', 'TV', 'AC', 'Coffee Machine', 'Mini Bar', 'Jacuzzi', 'Ocean View', 'City View'];
        const amenitiesHtml = amenities.map(a => `<label><input type="checkbox" value="${a}"> ${a}</label>`).join('');
        document.getElementById('amenitiesList').innerHTML = amenitiesHtml;
        
        addRoomForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const amenities = Array.from(document.querySelectorAll('#amenitiesList input:checked')).map(cb => cb.value);
            const roomData = {
                roomNumber: document.getElementById('roomNumber').value,
                type: document.getElementById('roomType').value,
                price: parseFloat(document.getElementById('price').value),
                maxOccupancy: parseInt(document.getElementById('maxOccupancy').value),
                amenities: amenities,
                status: document.getElementById('roomStatus').value,
                description: document.getElementById('description').value
            };
            if (adminManager.addRoom(roomData)) {
                window.location.href = 'manage-rooms.html';
            }
        });
    }
});

function editRoom(roomId) {
    const room = storage.getRoomById(roomId);
    if (room) {
        const modal = document.getElementById('editRoomModal') || createEditModal();
        // Populate and show modal
    }
}

function deleteRoom(roomId) {
    adminManager.deleteRoom(roomId);
}

function editReservation(bookingId) {
    const booking = storage.getBookingById(bookingId);
    if (booking) {
        document.getElementById('editBookingId').value = booking.id;
        document.getElementById('editCheckIn').value = booking.checkIn;
        document.getElementById('editCheckOut').value = booking.checkOut;
        document.getElementById('editSpecialRequests').value = booking.specialRequests || '';
        document.getElementById('editStatus').value = booking.status;
        
        const rooms = storage.getRooms();
        const roomSelect = document.getElementById('editRoomNumber');
        roomSelect.innerHTML = rooms.map(r => `<option value="${r.id}" ${r.id === booking.roomId ? 'selected' : ''}>${r.roomNumber} - ${r.type}</option>`).join('');
        
        document.getElementById('editReservationModal').style.display = 'block';
    }
}

function cancelReservation(bookingId) {
    if (confirm('Are you sure you want to cancel this reservation?')) {
        storage.cancelBooking(bookingId);
        showAlert('Reservation cancelled', 'success');
        adminManager.loadReservations();
    }
}

function editCustomer(userId) {
    const user = storage.getUserById(userId);
    if (user) {
        document.getElementById('editCustomerId').value = user.id;
        document.getElementById('editName').value = user.name;
        document.getElementById('editEmail').value = user.email;
        document.getElementById('editAddress').value = user.address || '';
        document.getElementById('editStatus').value = user.status || 'active';
        document.getElementById('editCustomerModal').style.display = 'block';
    }
}

function toggleCustomerStatus(userId) {
    const user = storage.getUserById(userId);
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    storage.updateUser(userId, { status: newStatus });
    showAlert(`Customer ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
    adminManager.loadCustomers();
}

function editStaff(staffId) {
    const staff = storage.getUserById(staffId);
    if (staff) {
        document.getElementById('editStaffId').value = staff.id;
        document.getElementById('editStaffName').value = staff.name;
        document.getElementById('editStaffEmail').value = staff.email;
        document.getElementById('editStaffMobile').value = staff.mobile;
        document.getElementById('editStaffDepartment').value = staff.department || '';
        document.getElementById('editStaffRole').value = staff.staffRole || 'Staff';
        document.getElementById('editStaffStatus').value = staff.status || 'active';
        document.getElementById('editStaffModal').style.display = 'block';
    }
}

function resetStaffPassword(staffId) {
    if (confirm('Reset password for this staff member?')) {
        const newPassword = 'staff123';
        storage.updateUser(staffId, { password: storage.hashPassword(newPassword) });
        showAlert(`Password reset to: ${newPassword}`, 'success');
    }
}

function viewComplaint(complaintId) {
    const complaint = storage.getComplaints().find(c => c.id === complaintId);
    const staff = storage.getUsers().filter(u => u.role === 'staff');
    
    if (complaint) {
        document.getElementById('complaintFullDetails').innerHTML = `
            <p><strong>Complaint #:</strong> ${complaint.complaintNumber}</p>
            <p><strong>Customer:</strong> ${complaint.customerName} (${complaint.customerEmail})</p>
            <p><strong>Category:</strong> ${complaint.category}</p>
            <p><strong>Title:</strong> ${complaint.title}</p>
            <p><strong>Description:</strong> ${complaint.description}</p>
            <p><strong>Submitted:</strong> ${formatDate(complaint.createdAt)}</p>
            <p><strong>Contact Preference:</strong> ${complaint.contactPreference}</p>
        `;
        
        const assignSelect = document.getElementById('assignStaff');
        assignSelect.innerHTML = '<option value="">Unassigned</option>' + 
            staff.map(s => `<option value="${s.id}" ${complaint.assignedTo === s.id ? 'selected' : ''}>${s.name} (${s.department || 'Staff'})</option>`).join('');
        
        document.getElementById('updateStatus').value = complaint.status;
        document.getElementById('responseMessage').value = complaint.response || '';
        document.getElementById('viewComplaintModal').style.display = 'block';
        
        document.getElementById('complaintResponseForm').onsubmit = function(e) {
            e.preventDefault();
            adminManager.updateComplaint(complaintId, {
                assignedTo: document.getElementById('assignStaff').value,
                status: document.getElementById('updateStatus').value,
                response: document.getElementById('responseMessage').value,
                resolvedAt: document.getElementById('updateStatus').value === 'resolved' ? new Date().toISOString() : undefined
            });
            document.getElementById('viewComplaintModal').style.display = 'none';
        };
    }
}

function filterRooms() { adminManager.loadRooms(); }
function searchReservations() { adminManager.loadReservations(); }
function filterReservations() { adminManager.loadReservations(); }
function searchCustomers() { adminManager.loadCustomers(); }
function searchStaff() { adminManager.loadStaff(); }
function filterComplaints() { adminManager.loadComplaints(); }
function searchBills() { adminManager.loadBills(); }
function generateReports() { adminManager.generateReport(); }

function showAddRoomModal() { document.getElementById('addRoomModal').style.display = 'block'; }
function showBulkUploadModal() { document.getElementById('bulkUploadModal').style.display = 'block'; }
function showAddCustomerModal() { document.getElementById('addCustomerModal').style.display = 'block'; }
function showAddStaffModal() { document.getElementById('addStaffModal').style.display = 'block'; }
function showAddBillModal() { document.getElementById('addBillModal').style.display = 'block'; }
function showBookOnBehalfModal() { document.getElementById('bookOnBehalfModal').style.display = 'block'; }

// Close modal handlers
document.querySelectorAll('.modal .close').forEach(closeBtn => {
    closeBtn.onclick = function() { this.closest('.modal').style.display = 'none'; };
});// Additional Admin Functions

function editRoom(roomId) {
    const room = storage.getRoomById(roomId);
    if (room) {
        let modal = document.getElementById('editRoomModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'editRoomModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h3>Edit Room</h3>
                    <form id="editRoomForm">
                        <input type="hidden" id="editRoomId">
                        <div class="form-group"><label>Room Number</label><input type="text" id="editRoomNumber" readonly></div>
                        <div class="form-group"><label>Room Type</label><select id="editRoomType"><option>Standard</option><option>Deluxe</option><option>Suite</option></select></div>
                        <div class="form-group"><label>Price per Night</label><input type="number" id="editPrice" step="0.01"></div>
                        <div class="form-group"><label>Max Occupancy</label><input type="number" id="editMaxOccupancy"></div>
                        <div class="form-group"><label>Status</label><select id="editRoomStatus"><option value="available">Available</option><option value="occupied">Occupied</option><option value="maintenance">Under Maintenance</option></select></div>
                        <div class="form-group"><label>Description</label><textarea id="editDescription" rows="3"></textarea></div>
                        <button type="submit" class="btn btn-primary">Update Room</button>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.querySelector('.close').onclick = () => modal.style.display = 'none';
        }
        
        document.getElementById('editRoomId').value = room.id;
        document.getElementById('editRoomNumber').value = room.roomNumber;
        document.getElementById('editRoomType').value = room.type;
        document.getElementById('editPrice').value = room.price;
        document.getElementById('editMaxOccupancy').value = room.maxOccupancy;
        document.getElementById('editRoomStatus').value = room.status;
        document.getElementById('editDescription').value = room.description || '';
        
        modal.style.display = 'block';
        
        document.getElementById('editRoomForm').onsubmit = function(e) {
            e.preventDefault();
            const updatedRoom = {
                type: document.getElementById('editRoomType').value,
                price: parseFloat(document.getElementById('editPrice').value),
                maxOccupancy: parseInt(document.getElementById('editMaxOccupancy').value),
                status: document.getElementById('editRoomStatus').value,
                description: document.getElementById('editDescription').value
            };
            adminManager.updateRoom(room.id, updatedRoom);
            modal.style.display = 'none';
            adminManager.loadRooms();
        };
    }
}

function createEditModal() {
    // Modal already created in editRoom function
}

function viewBill(billId) {
    const bill = storage.getBillById(billId);
    const booking = storage.getBookingById(bill.bookingId);
    const customer = storage.getUserById(bill.userId);
    
    if (bill) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h3>Bill Details</h3>
                <div class="bill-details">
                    <p><strong>Bill Number:</strong> ${bill.billNumber}</p>
                    <p><strong>Customer:</strong> ${customer ? customer.name : 'N/A'}</p>
                    <p><strong>Booking ID:</strong> ${booking ? booking.bookingId : 'N/A'}</p>
                    <p><strong>Date:</strong> ${formatDate(bill.createdAt)}</p>
                    <p><strong>Amount:</strong> ${formatCurrency(bill.amount)}</p>
                    <p><strong>Payment Method:</strong> ${bill.paymentMethod}</p>
                    <p><strong>Transaction ID:</strong> ${bill.transactionId}</p>
                    <p><strong>Status:</strong> <span class="status ${bill.status}">${bill.status}</span></p>
                </div>
                <button onclick="downloadBill('${billId}')" class="btn btn-primary">Download PDF</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';
        modal.querySelector('.close').onclick = () => modal.remove();
    }
}

function downloadBill(billId) {
    const bill = storage.getBillById(billId);
    if (bill) {
        showAlert('Invoice downloaded successfully', 'success');
        // In production, generate actual PDF
    }
}

function downloadInvoice(bookingId) {
    const booking = storage.getBookingById(bookingId);
    if (booking && booking.paymentStatus === 'paid') {
        showAlert('Invoice downloaded successfully', 'success');
    } else {
        showAlert('Invoice will be available after payment', 'info');
    }
}

function exportReport() {
    showAlert('Report exported successfully', 'success');
}

function addService() {
    const servicesDiv = document.getElementById('servicesList');
    const serviceCount = servicesDiv.children.length + 1;
    const serviceHtml = `
        <div class="service-item" id="service${serviceCount}">
            <select class="serviceName">
                <option value="">Select Service</option>
                <option value="Room Service">Room Service - $25</option>
                <option value="Spa">Spa - $50</option>
                <option value="Laundry">Laundry - $15</option>
                <option value="Mini Bar">Mini Bar - $30</option>
                <option value="Airport Transfer">Airport Transfer - $40</option>
            </select>
            <button type="button" onclick="removeService('service${serviceCount}')" class="btn btn-small btn-danger">Remove</button>
        </div>
    `;
    servicesDiv.insertAdjacentHTML('beforeend', serviceHtml);
}

function removeService(serviceId) {
    document.getElementById(serviceId).remove();
    calculateBillTotal();
}

function calculateBillTotal() {
    const roomCharges = parseFloat(document.getElementById('roomCharges').value) || 0;
    let serviceTotal = 0;
    document.querySelectorAll('.service-item select').forEach(select => {
        const value = select.value;
        if (value.includes('$')) {
            serviceTotal += parseFloat(value.split('$')[1]);
        }
    });
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const subtotal = roomCharges + serviceTotal;
    const tax = subtotal * 0.18;
    const total = subtotal + tax - (subtotal * discount / 100);
    
    document.getElementById('tax').value = tax.toFixed(2);
    document.getElementById('totalAmount').value = total.toFixed(2);
}

// Add Customer Form
document.addEventListener('DOMContentLoaded', function() {
    const addCustomerForm = document.getElementById('addCustomerForm');
    if (addCustomerForm) {
        addCustomerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const userData = {
                name: document.getElementById('newName').value,
                email: document.getElementById('newEmail').value,
                mobile: document.getElementById('newMobile').value,
                username: document.getElementById('newUsername').value,
                password: storage.hashPassword(document.getElementById('newPassword').value),
                address: document.getElementById('newAddress').value,
                role: 'customer',
                status: 'active'
            };
            
            if (storage.getUserByUsername(userData.username)) {
                showAlert('Username already exists', 'error');
                return;
            }
            if (storage.getUserByEmail(userData.email)) {
                showAlert('Email already exists', 'error');
                return;
            }
            
            storage.saveUser(userData);
            showAlert('Customer added successfully', 'success');
            document.getElementById('addCustomerModal').style.display = 'none';
            adminManager.loadCustomers();
        });
    }
    
    // Add Staff Form
    const addStaffForm = document.getElementById('addStaffForm');
    if (addStaffForm) {
        addStaffForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const staffData = {
                name: document.getElementById('staffName').value,
                email: document.getElementById('staffEmail').value,
                mobile: document.getElementById('staffMobile').value,
                gender: document.getElementById('staffGender').value,
                age: document.getElementById('staffAge').value,
                department: document.getElementById('staffDepartment').value,
                staffRole: document.getElementById('staffRole').value,
                username: document.getElementById('staffUsername').value,
                password: storage.hashPassword('staff123'),
                staffId: `STF${Date.now().slice(-6)}`,
                role: 'staff',
                status: 'active'
            };
            
            if (storage.getUserByUsername(staffData.username)) {
                showAlert('Username already exists', 'error');
                return;
            }
            
            storage.saveUser(staffData);
            showAlert('Staff member added successfully. Default password: staff123', 'success');
            document.getElementById('addStaffModal').style.display = 'none';
            adminManager.loadStaff();
        });
    }
    
    // Edit Customer Form
    const editCustomerForm = document.getElementById('editCustomerForm');
    if (editCustomerForm) {
        editCustomerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const userId = document.getElementById('editCustomerId').value;
            const updatedData = {
                name: document.getElementById('editName').value,
                email: document.getElementById('editEmail').value,
                address: document.getElementById('editAddress').value,
                status: document.getElementById('editStatus').value
            };
            storage.updateUser(userId, updatedData);
            showAlert('Customer updated successfully', 'success');
            document.getElementById('editCustomerModal').style.display = 'none';
            adminManager.loadCustomers();
        });
    }
    
    // Edit Staff Form
    const editStaffForm = document.getElementById('editStaffForm');
    if (editStaffForm) {
        editStaffForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const staffId = document.getElementById('editStaffId').value;
            const updatedData = {
                name: document.getElementById('editStaffName').value,
                email: document.getElementById('editStaffEmail').value,
                mobile: document.getElementById('editStaffMobile').value,
                department: document.getElementById('editStaffDepartment').value,
                staffRole: document.getElementById('editStaffRole').value,
                status: document.getElementById('editStaffStatus').value
            };
            storage.updateUser(staffId, updatedData);
            showAlert('Staff updated successfully', 'success');
            document.getElementById('editStaffModal').style.display = 'none';
            adminManager.loadStaff();
        });
    }
    
    // Book on Behalf Form
    const bookOnBehalfForm = document.getElementById('bookOnBehalfForm');
    if (bookOnBehalfForm) {
        const mobileInput = document.getElementById('customerMobile');
        mobileInput.addEventListener('blur', function() {
            const mobile = this.value;
            const customer = storage.getUserByMobile(mobile);
            const detailsDiv = document.getElementById('customerDetails');
            if (customer) {
                detailsDiv.innerHTML = `
                    <div class="alert alert-success">
                        Customer found: ${customer.name} (${customer.email})
                    </div>
                    <input type="hidden" id="customerId" value="${customer.id}">
                `;
            } else {
                detailsDiv.innerHTML = `<div class="alert alert-warning">Customer not found. They will need to register first.</div>`;
            }
        });
        
        bookOnBehalfForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const customerId = document.getElementById('customerId')?.value;
            if (!customerId) {
                showAlert('Customer not found. Please register the customer first.', 'error');
                return;
            }
            
            const bookingData = {
                userId: customerId,
                roomId: document.getElementById('behalfRoomType').value,
                checkIn: document.getElementById('behalfCheckIn').value,
                checkOut: document.getElementById('behalfCheckOut').value,
                adults: document.getElementById('behalfAdults').value,
                children: document.getElementById('behalfChildren').value,
                specialRequests: 'Booked by admin on behalf of customer'
            };
            
            const room = storage.getRoomById(bookingData.roomId);
            const nights = Math.ceil((new Date(bookingData.checkOut) - new Date(bookingData.checkIn)) / (1000 * 60 * 60 * 24));
            const total = room.price * nights;
            
            const booking = {
                ...bookingData,
                customerName: storage.getUserById(customerId).name,
                customerEmail: storage.getUserById(customerId).email,
                roomNumber: room.roomNumber,
                roomType: room.type,
                totalAmount: total,
                paymentStatus: 'pending',
                status: 'confirmed'
            };
            
            storage.saveBooking(booking);
            showAlert('Booking created successfully', 'success');
            document.getElementById('bookOnBehalfModal').style.display = 'none';
            adminManager.loadReservations();
        });
    }
    
    // Bulk Upload
    const bulkUploadForm = document.getElementById('bulkUploadForm');
    if (bulkUploadForm) {
        document.getElementById('downloadTemplate').addEventListener('click', function(e) {
            e.preventDefault();
            const csvContent = "Room Number,Type,Price,Max Occupancy,Status,Amenities,Description\n101,Standard,99,2,available,\"Wi-Fi, TV, AC\",Comfortable room";
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'room_template.csv';
            a.click();
            URL.revokeObjectURL(url);
        });
        
        bulkUploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const file = document.getElementById('csvFile').files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const csv = event.target.result;
                    const lines = csv.split('\n');
                    const headers = lines[0].split(',');
                    let successCount = 0;
                    
                    for (let i = 1; i < lines.length; i++) {
                        if (lines[i].trim()) {
                            const values = lines[i].split(',');
                            const roomData = {
                                roomNumber: values[0],
                                type: values[1],
                                price: parseFloat(values[2]),
                                maxOccupancy: parseInt(values[3]),
                                status: values[4],
                                amenities: values[5] ? values[5].split('|') : [],
                                description: values[6] || ''
                            };
                            
                            if (!storage.getRoomByNumber(roomData.roomNumber)) {
                                storage.saveRoom(roomData);
                                successCount++;
                            }
                        }
                    }
                    
                    showAlert(`${successCount} rooms added successfully`, 'success');
                    document.getElementById('bulkUploadModal').style.display = 'none';
                    adminManager.loadRooms();
                };
                reader.readAsText(file);
            }
        });
    }
    
    // Add Bill Form
    const addBillForm = document.getElementById('addBillForm');
    if (addBillForm) {
        // Load customers
        const customers = storage.getUsers().filter(u => u.role === 'customer');
        const customerSelect = document.getElementById('billCustomer');
        customerSelect.innerHTML = '<option value="">Select Customer</option>' + 
            customers.map(c => `<option value="${c.id}">${c.name} (${c.email})</option>`).join('');
        
        customerSelect.addEventListener('change', function() {
            const customerId = this.value;
            const bookings = storage.getBookingsByUser(customerId).filter(b => b.status === 'confirmed' || b.status === 'completed');
            const bookingSelect = document.getElementById('billBooking');
            bookingSelect.innerHTML = '<option value="">Select Booking</option>' + 
                bookings.map(b => `<option value="${b.id}" data-amount="${b.totalAmount}">${b.bookingId} - ${b.roomType} (${formatDate(b.checkIn)} to ${formatDate(b.checkOut)}) - ${formatCurrency(b.totalAmount)}</option>`).join('');
        });
        
        document.getElementById('billBooking').addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const amount = selectedOption.getAttribute('data-amount');
            if (amount) {
                document.getElementById('roomCharges').value = amount;
                calculateBillTotal();
            }
        });
        
        document.getElementById('discount').addEventListener('input', calculateBillTotal);
        
        addBillForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const billData = {
                userId: document.getElementById('billCustomer').value,
                bookingId: document.getElementById('billBooking').value,
                amount: parseFloat(document.getElementById('totalAmount').value),
                paymentMethod: 'Card',
                status: 'paid',
                services: []
            };
            
            storage.saveBill(billData);
            storage.updateBooking(billData.bookingId, { paymentStatus: 'paid' });
            showAlert('Bill generated successfully', 'success');
            document.getElementById('addBillModal').style.display = 'none';
            adminManager.loadBills();
        });
    }
});

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

function resetPassword(userId) {
    if (confirm('Reset password for this user?')) {
        storage.updateUser(userId, { password: storage.hashPassword('password123') });
        showAlert('Password reset to: password123', 'success');
    }
}