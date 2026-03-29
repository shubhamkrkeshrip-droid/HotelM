// Staff functionality
class StaffManager {
    constructor() {
        this.storage = storage;
        this.auth = auth;
        this.currentUser = this.auth.getCurrentUser();
        
        if (!this.currentUser || !this.auth.isStaff()) {
            window.location.href = '../login.html';
        }
    }

    loadDashboard() {
        document.getElementById('staffWelcomeName').textContent = this.currentUser.name;
        document.getElementById('staffDepartment').textContent = this.currentUser.department || 'General Staff';
        this.loadStats();
        this.loadRecentComplaints();
    }

    loadStats() {
        const complaints = this.storage.getComplaintsByStaff(this.currentUser.id);
        const assigned = complaints.length;
        const inProgress = complaints.filter(c => c.status === 'in-progress').length;
        const resolvedThisMonth = complaints.filter(c => 
            c.status === 'resolved' && 
            new Date(c.resolvedAt).getMonth() === new Date().getMonth()
        ).length;
        
        document.getElementById('assignedComplaints').textContent = assigned;
        document.getElementById('inProgressComplaints').textContent = inProgress;
        document.getElementById('resolvedComplaints').textContent = resolvedThisMonth;
    }

    loadRecentComplaints() {
        const complaints = this.storage.getComplaintsByStaff(this.currentUser.id);
        const recent = complaints.slice(0, 5);
        const container = document.getElementById('recentComplaintsList');
        
        if (container) {
            if (recent.length === 0) {
                container.innerHTML = '<p class="no-data">No complaints assigned yet.</p>';
                return;
            }
            
            container.innerHTML = recent.map(complaint => `
                <div class="complaint-card" onclick="viewComplaintDetails('${complaint.id}')">
                    <div class="complaint-header">
                        <h4>${complaint.title}</h4>
                        <span class="status ${complaint.status}">${complaint.status}</span>
                    </div>
                    <p><strong>#:</strong> ${complaint.complaintNumber}</p>
                    <p><strong>Customer:</strong> ${complaint.customerName}</p>
                    <p><strong>Category:</strong> ${complaint.category}</p>
                    <p><strong>Submitted:</strong> ${formatDate(complaint.createdAt)}</p>
                </div>
            `).join('');
        }
    }

    loadComplaints() {
        let complaints = this.storage.getComplaintsByStaff(this.currentUser.id);
        const statusFilter = document.getElementById('statusFilter')?.value;
        if (statusFilter) complaints = complaints.filter(c => c.status === statusFilter);
        
        const tbody = document.querySelector('#complaintsTable tbody');
        if (tbody) {
            tbody.innerHTML = complaints.map(complaint => `
                <tr>
                    <td>${complaint.complaintNumber}</td>
                    <td>${complaint.customerName}</td>
                    <td>${complaint.category}</td>
                    <td>${complaint.title}</td>
                    <td><span class="status ${complaint.status}">${complaint.status}</span></td>
                    <td>${formatDate(complaint.createdAt)}</td>
                    <td>
                        <button onclick="viewComplaintDetails('${complaint.id}')" class="btn btn-small">View & Update</button>
                    </td>
                </tr>
            `).join('');
        }
    }

    updateComplaint(complaintId, data) {
        const updatedData = {
            ...data,
            updatedAt: new Date().toISOString()
        };
        
        if (data.status === 'resolved') {
            updatedData.resolvedAt = new Date().toISOString();
        }
        
        const result = this.storage.updateComplaint(complaintId, updatedData);
        if (result) {
            showAlert('Complaint updated successfully', 'success');
            this.loadComplaints();
            this.loadStats();
            return true;
        }
        return false;
    }
}

const staffManager = new StaffManager();

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('staffWelcomeName')) {
        staffManager.loadDashboard();
    }
    
    if (document.getElementById('complaintsTable')) {
        staffManager.loadComplaints();
    }
});

function viewComplaintDetails(complaintId) {
    const complaint = storage.getComplaints().find(c => c.id === complaintId);
    if (complaint) {
        const modal = document.getElementById('complaintModal');
        const details = document.getElementById('complaintDetails');
        
        details.innerHTML = `
            <h3>Complaint Details</h3>
            <p><strong>Complaint #:</strong> ${complaint.complaintNumber}</p>
            <p><strong>Customer:</strong> ${complaint.customerName} (${complaint.customerEmail})</p>
            <p><strong>Category:</strong> ${complaint.category}</p>
            <p><strong>Title:</strong> ${complaint.title}</p>
            <p><strong>Description:</strong> ${complaint.description}</p>
            <p><strong>Submitted:</strong> ${formatDate(complaint.createdAt)}</p>
            <p><strong>Contact Preference:</strong> ${complaint.contactPreference}</p>
            ${complaint.response ? `<p><strong>Previous Response:</strong> ${complaint.response}</p>` : ''}
        `;
        
        document.getElementById('complaintStatus').value = complaint.status;
        document.getElementById('resolutionNotes').value = complaint.response || '';
        document.getElementById('complaintModal').style.display = 'block';
        
        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = () => modal.style.display = 'none';
        
        document.getElementById('updateComplaintForm').onsubmit = function(e) {
            e.preventDefault();
            staffManager.updateComplaint(complaintId, {
                status: document.getElementById('complaintStatus').value,
                response: document.getElementById('resolutionNotes').value
            });
            modal.style.display = 'none';
        };
    }
}

function filterComplaints() {
    staffManager.loadComplaints();
}