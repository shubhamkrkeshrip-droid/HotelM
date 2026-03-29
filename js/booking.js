// Booking functionality
class BookingManager {
    constructor() {
        this.storage = storage;
        this.auth = auth;
        this.currentUser = this.auth.getCurrentUser();
        
        if (!this.currentUser && !window.location.pathname.includes('payment.html')) {
            window.location.href = '../login.html';
        }
    }

    searchRooms(criteria) {
        const rooms = this.storage.getRooms();
        let availableRooms = rooms.filter(room => room.status === 'available');
        
        if (criteria.roomType && criteria.roomType !== 'all') {
            availableRooms = availableRooms.filter(room => 
                room.type.toLowerCase() === criteria.roomType.toLowerCase()
            );
        }
        
        if (criteria.maxPrice) {
            availableRooms = availableRooms.filter(room => room.price <= criteria.maxPrice);
        }
        
        if (criteria.amenities && criteria.amenities.length > 0) {
            availableRooms = availableRooms.filter(room =>
                criteria.amenities.every(amenity => room.amenities.includes(amenity))
            );
        }
        
        availableRooms = availableRooms.filter(room => 
            room.maxOccupancy >= parseInt(criteria.adults)
        );
        
        const bookings = this.storage.getBookings();
        availableRooms = availableRooms.filter(room => {
            const isBooked = bookings.some(booking => 
                booking.roomId === room.id &&
                booking.status === 'confirmed' &&
                this.datesOverlap(criteria.checkIn, criteria.checkOut, booking.checkIn, booking.checkOut)
            );
            return !isBooked;
        });
        
        return availableRooms;
    }

    datesOverlap(checkIn1, checkOut1, checkIn2, checkOut2) {
        return (new Date(checkIn1) < new Date(checkOut2) && new Date(checkOut1) > new Date(checkIn2));
    }

    calculateNights(checkIn, checkOut) {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    calculateTotal(roomPrice, nights, guests, specialServices = []) {
        let total = roomPrice * nights;
        const serviceTotal = specialServices.reduce((sum, service) => sum + service.price, 0);
        total += serviceTotal;
        const tax = total * 0.18;
        return { subtotal: total, tax, total: total + tax };
    }

    createBooking(bookingData) {
        const room = this.storage.getRoomById(bookingData.roomId);
        const nights = this.calculateNights(bookingData.checkIn, bookingData.checkOut);
        const { total } = this.calculateTotal(room.price, nights, bookingData.adults + bookingData.children);
        
        const booking = {
            userId: this.currentUser.id,
            customerName: this.currentUser.name,
            customerEmail: this.currentUser.email,
            customerMobile: this.currentUser.mobile,
            roomId: bookingData.roomId,
            roomNumber: room.roomNumber,
            roomType: room.type,
            checkIn: bookingData.checkIn,
            checkOut: bookingData.checkOut,
            adults: bookingData.adults,
            children: bookingData.children || 0,
            guests: bookingData.guests || [],
            specialRequests: bookingData.specialRequests || '',
            totalAmount: total,
            paymentStatus: 'pending',
            status: 'confirmed'
        };
        
        return this.storage.saveBooking(booking);
    }

    processPayment(bookingId, paymentDetails) {
        const booking = this.storage.getBookingById(bookingId);
        if (!booking) return { success: false, message: 'Booking not found' };
        
        const bill = {
            userId: this.currentUser.id,
            bookingId: booking.id,
            bookingId: booking.bookingId,
            amount: booking.totalAmount,
            paymentMethod: paymentDetails.method,
            transactionId: `TXN${Date.now()}`,
            status: 'paid',
            paidAt: new Date().toISOString()
        };
        
        this.storage.saveBill(bill);
        this.storage.updateBooking(booking.id, { paymentStatus: 'paid', status: 'confirmed' });
        
        return { success: true, transactionId: bill.transactionId };
    }
}

// Room Search Handler
document.addEventListener('DOMContentLoaded', function() {
    const bookingManager = new BookingManager();
    
    // Search Rooms
    const searchForm = document.getElementById('roomSearchForm');
    if (searchForm) {
        const priceRange = document.getElementById('priceRange');
        const priceValue = document.getElementById('priceValue');
        
        if (priceRange) {
            priceRange.addEventListener('input', function() {
                priceValue.textContent = this.value;
            });
        }
        
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const checkIn = document.getElementById('checkIn').value;
            const checkOut = document.getElementById('checkOut').value;
            const adults = document.getElementById('adults').value;
            const children = document.getElementById('children').value;
            const roomType = document.getElementById('roomType').value;
            const maxPrice = document.getElementById('priceRange') ? document.getElementById('priceRange').value : 500;
            
            const amenities = Array.from(document.querySelectorAll('.amenities-checkbox input:checked'))
                .map(cb => cb.value);
            
            const criteria = { checkIn, checkOut, adults, children, roomType, maxPrice, amenities };
            
            const rooms = bookingManager.searchRooms(criteria);
            displaySearchResults(rooms, criteria);
        });
    }
    
    // Booking Confirmation
    const bookingData = sessionStorage.getItem('bookingData');
    if (bookingData && document.getElementById('bookingDetails')) {
        const data = JSON.parse(bookingData);
        const room = storage.getRoomById(data.roomId);
        const nights = bookingManager.calculateNights(data.checkIn, data.checkOut);
        const { subtotal, tax, total } = bookingManager.calculateTotal(room.price, nights, data.adults + data.children);
        
        document.getElementById('bookingDetails').innerHTML = `
            <h3>Room Details</h3>
            <p><strong>Room Type:</strong> ${room.type}</p>
            <p><strong>Room Number:</strong> ${room.roomNumber}</p>
            <p><strong>Price per Night:</strong> ${formatCurrency(room.price)}</p>
            <p><strong>Check-in:</strong> ${formatDate(data.checkIn)}</p>
            <p><strong>Check-out:</strong> ${formatDate(data.checkOut)}</p>
            <p><strong>Number of Nights:</strong> ${nights}</p>
            <p><strong>Adults:</strong> ${data.adults} | <strong>Children:</strong> ${data.children || 0}</p>
            <hr>
            <p><strong>Subtotal:</strong> ${formatCurrency(subtotal)}</p>
            <p><strong>Tax (18% GST):</strong> ${formatCurrency(tax)}</p>
            <p><strong>Total Amount:</strong> ${formatCurrency(total)}</p>
        `;
        
        // Generate guest forms
        const totalGuests = parseInt(data.adults) + parseInt(data.children || 0);
        const guestFormsHtml = [];
        for (let i = 1; i <= totalGuests; i++) {
            guestFormsHtml.push(`
                <div class="guest-form">
                    <h4>Guest ${i}</h4>
                    <div class="form-row">
                        <div class="form-group"><label>Full Name</label><input type="text" name="guestName${i}" required></div>
                        <div class="form-group"><label>Age</label><input type="number" name="guestAge${i}"></div>
                    </div>
                </div>
            `);
        }
        document.getElementById('guestForms').innerHTML = guestFormsHtml.join('');
        
        document.getElementById('guestDetailsForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const guests = [];
            for (let i = 1; i <= totalGuests; i++) {
                guests.push({
                    name: document.querySelector(`[name="guestName${i}"]`).value,
                    age: document.querySelector(`[name="guestAge${i}"]`).value
                });
            }
            
            const booking = bookingManager.createBooking({
                ...data,
                guests: guests,
                specialRequests: document.getElementById('specialRequests').value
            });
            
            sessionStorage.setItem('currentBooking', JSON.stringify(booking));
            window.location.href = 'payment.html';
        });
    }
    
    // Payment Processing
    if (document.getElementById('cardPaymentForm')) {
        const currentBooking = JSON.parse(sessionStorage.getItem('currentBooking'));
        if (currentBooking) {
            document.getElementById('totalAmount').textContent = currentBooking.totalAmount;
            document.getElementById('bookingSummary').innerHTML = `
                <p><strong>Booking ID:</strong> ${currentBooking.bookingId}</p>
                <p><strong>Room:</strong> ${currentBooking.roomType}</p>
                <p><strong>Dates:</strong> ${formatDate(currentBooking.checkIn)} - ${formatDate(currentBooking.checkOut)}</p>
                <p><strong>Total:</strong> ${formatCurrency(currentBooking.totalAmount)}</p>
            `;
        }
        
        const cardNumber = document.getElementById('cardNumber');
        if (cardNumber) {
            cardNumber.addEventListener('input', function(e) {
                let value = this.value.replace(/\s/g, '');
                if (value.length > 16) value = value.slice(0, 16);
                this.value = value.replace(/(\d{4})/g, '$1 ').trim();
            });
        }
        
        const expiryDate = document.getElementById('expiryDate');
        if (expiryDate) {
            expiryDate.addEventListener('input', function(e) {
                let value = this.value.replace('/', '');
                if (value.length >= 2) {
                    this.value = value.slice(0, 2) + '/' + value.slice(2, 4);
                }
            });
        }
        
        document.getElementById('cardPaymentForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const cardName = document.getElementById('cardName').value;
            const cardNumberVal = document.getElementById('cardNumber').value.replace(/\s/g, '');
            const expiry = document.getElementById('expiryDate').value;
            const cvv = document.getElementById('cvv').value;
            
            const cardError = Validator.validateCardNumber(cardNumberVal);
            const expiryError = Validator.validateExpiryDate(expiry);
            const cvvError = Validator.validateCVV(cvv);
            
            if (cardError || expiryError || cvvError) {
                if (cardError) showAlert(cardError, 'error');
                else if (expiryError) showAlert(expiryError, 'error');
                else if (cvvError) showAlert(cvvError, 'error');
                return;
            }
            
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
            const result = bookingManager.processPayment(currentBooking.id, {
                method: paymentMethod,
                cardLast4: cardNumberVal.slice(-4)
            });
            
            if (result.success) {
                showAlert('Payment successful! Your booking is confirmed.', 'success');
                sessionStorage.removeItem('currentBooking');
                sessionStorage.removeItem('bookingData');
                setTimeout(() => {
                    window.location.href = `booking-confirmation.html?id=${currentBooking.id}`;
                }, 2000);
            } else {
                showAlert('Transaction failed. Please try again.', 'error');
            }
        });
    }
});

function displaySearchResults(rooms, criteria) {
    const container = document.getElementById('searchResults');
    if (!container) return;
    
    if (rooms.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No rooms available for the selected dates. Please try different dates.</div>';
        return;
    }
    
    const nights = Math.ceil((new Date(criteria.checkOut) - new Date(criteria.checkIn)) / (1000 * 60 * 60 * 24));
    
    container.innerHTML = rooms.map(room => `
        <div class="room-result-card">
            <div class="room-image">
                <img src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=300" alt="${room.type} Room">
            </div>
            <div class="room-details">
                <h3>${room.type} Room - ${room.roomNumber}</h3>
                <p>${room.description || 'Comfortable room with all amenities'}</p>
                <ul class="amenities">
                    ${room.amenities.map(amenity => `<li><i class="fas fa-check"></i> ${amenity}</li>`).join('')}
                </ul>
                <div class="room-pricing">
                    <span class="price">${formatCurrency(room.price)}</span>
                    <span class="per-night">/ night</span>
                </div>
                <div class="room-total">
                    <strong>Total for ${nights} nights: ${formatCurrency(room.price * nights)}</strong>
                </div>
                <button onclick="proceedToBooking('${room.id}', '${criteria.checkIn}', '${criteria.checkOut}', ${criteria.adults}, ${criteria.children || 0})" class="btn btn-primary">Book Now</button>
            </div>
        </div>
    `).join('');
}

function proceedToBooking(roomId, checkIn, checkOut, adults, children) {
    sessionStorage.setItem('bookingData', JSON.stringify({
        roomId, checkIn, checkOut, adults, children
    }));
    window.location.href = 'booking.html';
}