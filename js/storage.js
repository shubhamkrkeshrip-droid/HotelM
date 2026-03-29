// Local Storage Management
class StorageManager {
    constructor() {
        this.storage = localStorage;
    }

    // User Management
    saveUser(user) {
        const users = this.getUsers();
        user.id = this.generateId();
        user.createdAt = new Date().toISOString();
        users.push(user);
        this.storage.setItem('users', JSON.stringify(users));
        return user;
    }

    getUsers() {
        return JSON.parse(this.storage.getItem('users')) || [];
    }

    getUserById(id) {
        const users = this.getUsers();
        return users.find(user => user.id === id);
    }

    getUserByUsername(username) {
        const users = this.getUsers();
        return users.find(user => user.username === username);
    }

    getUserByEmail(email) {
        const users = this.getUsers();
        return users.find(user => user.email === email);
    }

    getUserByMobile(mobile) {
        const users = this.getUsers();
        return users.find(user => user.mobile === mobile);
    }

    updateUser(id, updatedData) {
        const users = this.getUsers();
        const index = users.findIndex(user => user.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...updatedData };
            this.storage.setItem('users', JSON.stringify(users));
            return users[index];
        }
        return null;
    }

    deleteUser(id) {
        const users = this.getUsers();
        const filtered = users.filter(user => user.id !== id);
        this.storage.setItem('users', JSON.stringify(filtered));
    }

    // Room Management
    saveRoom(room) {
        const rooms = this.getRooms();
        room.id = this.generateId();
        rooms.push(room);
        this.storage.setItem('rooms', JSON.stringify(rooms));
        return room;
    }

    getRooms() {
        return JSON.parse(this.storage.getItem('rooms')) || [];
    }

    getRoomById(id) {
        const rooms = this.getRooms();
        return rooms.find(room => room.id === id);
    }

    getRoomByNumber(roomNumber) {
        const rooms = this.getRooms();
        return rooms.find(room => room.roomNumber === roomNumber);
    }

    updateRoom(id, updatedData) {
        const rooms = this.getRooms();
        const index = rooms.findIndex(room => room.id === id);
        if (index !== -1) {
            rooms[index] = { ...rooms[index], ...updatedData };
            this.storage.setItem('rooms', JSON.stringify(rooms));
            return rooms[index];
        }
        return null;
    }

    deleteRoom(id) {
        const rooms = this.getRooms();
        const filtered = rooms.filter(room => room.id !== id);
        this.storage.setItem('rooms', JSON.stringify(filtered));
    }

    // Booking Management
    saveBooking(booking) {
        const bookings = this.getBookings();
        booking.id = this.generateId();
        booking.bookingId = `BK${Date.now()}`;
        booking.bookingDate = new Date().toISOString();
        booking.status = 'confirmed';
        bookings.push(booking);
        this.storage.setItem('bookings', JSON.stringify(bookings));
        return booking;
    }

    getBookings() {
        return JSON.parse(this.storage.getItem('bookings')) || [];
    }

    getBookingsByUser(userId) {
        const bookings = this.getBookings();
        return bookings.filter(booking => booking.userId === userId);
    }

    getBookingById(id) {
        const bookings = this.getBookings();
        return bookings.find(booking => booking.id === id);
    }

    updateBooking(id, updatedData) {
        const bookings = this.getBookings();
        const index = bookings.findIndex(booking => booking.id === id);
        if (index !== -1) {
            bookings[index] = { ...bookings[index], ...updatedData };
            this.storage.setItem('bookings', JSON.stringify(bookings));
            return bookings[index];
        }
        return null;
    }

    cancelBooking(id) {
        return this.updateBooking(id, { 
            status: 'cancelled',
            cancelledAt: new Date().toISOString()
        });
    }

    // Complaint Management
    saveComplaint(complaint) {
        const complaints = this.getComplaints();
        complaint.id = this.generateId();
        complaint.complaintNumber = `CMP${Date.now()}`;
        complaint.status = 'open';
        complaint.createdAt = new Date().toISOString();
        complaints.push(complaint);
        this.storage.setItem('complaints', JSON.stringify(complaints));
        return complaint;
    }

    getComplaints() {
        return JSON.parse(this.storage.getItem('complaints')) || [];
    }

    getComplaintsByUser(userId) {
        const complaints = this.getComplaints();
        return complaints.filter(complaint => complaint.userId === userId);
    }

    getComplaintsByStaff(staffId) {
        const complaints = this.getComplaints();
        return complaints.filter(complaint => complaint.assignedTo === staffId);
    }

    updateComplaint(id, updatedData) {
        const complaints = this.getComplaints();
        const index = complaints.findIndex(complaint => complaint.id === id);
        if (index !== -1) {
            complaints[index] = { ...complaints[index], ...updatedData };
            this.storage.setItem('complaints', JSON.stringify(complaints));
            return complaints[index];
        }
        return null;
    }

    // Bill Management
    saveBill(bill) {
        const bills = this.getBills();
        bill.id = this.generateId();
        bill.billNumber = `INV${Date.now()}`;
        bill.createdAt = new Date().toISOString();
        bills.push(bill);
        this.storage.setItem('bills', JSON.stringify(bills));
        return bill;
    }

    getBills() {
        return JSON.parse(this.storage.getItem('bills')) || [];
    }

    getBillsByUser(userId) {
        const bills = this.getBills();
        return bills.filter(bill => bill.userId === userId);
    }

    getBillById(id) {
        const bills = this.getBills();
        return bills.find(bill => bill.id === id);
    }

    updateBill(id, updatedData) {
        const bills = this.getBills();
        const index = bills.findIndex(bill => bill.id === id);
        if (index !== -1) {
            bills[index] = { ...bills[index], ...updatedData };
            this.storage.setItem('bills', JSON.stringify(bills));
            return bills[index];
        }
        return null;
    }

    // Helper Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    clearAll() {
        this.storage.clear();
    }

    hashPassword(password) {
        return btoa(password);
    }

    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }

    // Initialize with sample data
    initializeSampleData() {
        if (this.getUsers().length > 0) return;

        // Sample Rooms
        const sampleRooms = [
            { roomNumber: '101', type: 'Standard', price: 99, amenities: ['Wi-Fi', 'TV', 'AC'], maxOccupancy: 2, status: 'available', bedType: 'Queen', description: 'Comfortable room with essential amenities' },
            { roomNumber: '102', type: 'Standard', price: 99, amenities: ['Wi-Fi', 'TV', 'AC'], maxOccupancy: 2, status: 'available', bedType: 'Queen', description: 'Comfortable room with essential amenities' },
            { roomNumber: '103', type: 'Standard', price: 99, amenities: ['Wi-Fi', 'TV', 'AC'], maxOccupancy: 2, status: 'occupied', bedType: 'Queen', description: 'Comfortable room with essential amenities' },
            { roomNumber: '201', type: 'Deluxe', price: 159, amenities: ['Wi-Fi', 'TV', 'AC', 'Coffee Machine'], maxOccupancy: 3, status: 'available', bedType: 'King', description: 'Spacious room with premium amenities' },
            { roomNumber: '202', type: 'Deluxe', price: 159, amenities: ['Wi-Fi', 'TV', 'AC', 'Coffee Machine'], maxOccupancy: 3, status: 'available', bedType: 'King', description: 'Spacious room with premium amenities' },
            { roomNumber: '301', type: 'Suite', price: 299, amenities: ['Wi-Fi', 'TV', 'AC', 'Jacuzzi', 'Butler Service'], maxOccupancy: 4, status: 'available', bedType: 'King', description: 'Luxury suite with separate living area' }
        ];
        sampleRooms.forEach(room => this.saveRoom(room));

        // Sample Admin
        const admin = {
            name: 'Admin User',
            email: 'admin@hotel.com',
            username: 'admin',
            password: this.hashPassword('admin123'),
            role: 'admin',
            mobile: '1234567890'
        };
        this.saveUser(admin);

        // Sample Staff
        const staff = {
            name: 'John Staff',
            email: 'staff@hotel.com',
            username: 'staff',
            password: this.hashPassword('staff123'),
            role: 'staff',
            mobile: '0987654321',
            department: 'Housekeeping',
            staffId: 'STF001'
        };
        this.saveUser(staff);
    }
}

const storage = new StorageManager();
storage.initializeSampleData();