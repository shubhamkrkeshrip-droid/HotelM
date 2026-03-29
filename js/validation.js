// Validation Functions
class Validator {
    static validateName(name) {
        const regex = /^[A-Za-z\s]{3,}$/;
        if (!name) return "Name is required";
        if (!regex.test(name)) return "Name must be at least 3 characters long and contain only letters";
        return null;
    }

    static validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) return "Email is required";
        if (!regex.test(email)) return "Enter a valid email address";
        return null;
    }

    static validateMobile(mobile) {
        const regex = /^[0-9]{8,10}$/;
        if (!mobile) return "Mobile number is required";
        if (!regex.test(mobile)) return "Enter a valid mobile number";
        return null;
    }

    static validateUsername(username) {
        const regex = /^[^\s]{5,}$/;
        if (!username) return "Username is required";
        if (!regex.test(username)) return "Username must be at least 5 characters and no spaces";
        return null;
    }

    static validatePassword(password) {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!password) return "Password is required";
        if (!regex.test(password)) {
            return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";
        }
        return null;
    }

    static validateConfirmPassword(password, confirmPassword) {
        if (!confirmPassword) return "Please confirm your password";
        if (password !== confirmPassword) return "Passwords do not match";
        return null;
    }

    static validateAddress(address) {
        if (!address) return "Address is required";
        if (address.length < 10) return "Address must be at least 10 characters long";
        return null;
    }

    static validateAge(age) {
        if (!age) return null;
        const num = parseInt(age);
        if (num < 18) return "Age must be at least 18";
        if (num > 120) return "Invalid age";
        return null;
    }

    static validateDate(date, isCheckIn = true, checkInDate = null) {
        if (!date) return "Date is required";
        
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (isCheckIn) {
            if (selectedDate < today) return "Check-in date cannot be in the past";
        } else {
            if (checkInDate && selectedDate <= new Date(checkInDate)) {
                return "Check-out date must be after the check-in date";
            }
        }
        return null;
    }

    static validateAdults(adults) {
        if (!adults) return "Number of adults is required";
        const num = parseInt(adults);
        if (num < 1) return "At least one adult must be selected";
        if (num > 10) return "Maximum 10 adults allowed";
        return null;
    }

    static validateChildren(children) {
        const num = parseInt(children) || 0;
        if (num < 0) return "Number of children cannot be negative";
        if (num > 5) return "Maximum 5 children allowed";
        return null;
    }

    static validateCardNumber(cardNumber) {
        const regex = /^[0-9]{16}$/;
        if (!cardNumber) return "Card number is required";
        if (!regex.test(cardNumber.replace(/\s/g, ''))) return "Invalid card number";
        return null;
    }

    static validateCVV(cvv, cardType = 'VISA') {
        const length = cardType === 'AMEX' ? 4 : 3;
        const regex = new RegExp(`^[0-9]{${length}}$`);
        if (!cvv) return "CVV is required";
        if (!regex.test(cvv)) return "Invalid CVV";
        return null;
    }

    static validateExpiryDate(expiryDate) {
        if (!expiryDate) return "Expiry date is required";
        
        const [month, year] = expiryDate.split('/');
        if (!month || !year) return "Invalid expiry date format";
        
        const expDate = new Date(2000 + parseInt(year), parseInt(month));
        const today = new Date();
        
        if (expDate < today) return "Card expiry date must be in the future";
        return null;
    }
}

function validateForm(formId, fields) {
    let isValid = true;
    const errors = {};
    
    for (const field of fields) {
        const element = document.getElementById(field.id);
        if (element) {
            const value = element.value;
            const validator = Validator[field.validator];
            const error = validator ? validator(value, ...(field.params || [])) : null;
            
            if (error) {
                isValid = false;
                errors[field.id] = error;
                showFieldError(field.id, error);
            } else {
                clearFieldError(field.id);
            }
        }
    }
    
    return { isValid, errors };
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorDiv = document.getElementById(`${fieldId}-error`) || createErrorDiv(fieldId);
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    field.classList.add('error');
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorDiv = document.getElementById(`${fieldId}-error`);
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
    if (field) {
        field.classList.remove('error');
    }
}

function createErrorDiv(fieldId) {
    const field = document.getElementById(fieldId);
    const errorDiv = document.createElement('div');
    errorDiv.id = `${fieldId}-error`;
    errorDiv.className = 'error-message';
    field.parentNode.appendChild(errorDiv);
    return errorDiv;
}