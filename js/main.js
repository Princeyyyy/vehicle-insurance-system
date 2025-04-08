// User Management
class UserManager {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.quotes = JSON.parse(localStorage.getItem('quotes')) || [];
        this.claims = JSON.parse(localStorage.getItem('claims')) || [];
    }

    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    saveQuotes() {
        localStorage.setItem('quotes', JSON.stringify(this.quotes));
    }

    saveClaims() {
        localStorage.setItem('claims', JSON.stringify(this.claims));
    }

    signup(name, email, password) {
        if (this.users.some(user => user.email === email)) {
            throw new Error('Email already exists');
        }

        const user = {
            id: Date.now().toString(),
            name,
            email,
            password,
            createdAt: new Date().toISOString()
        };

        this.users.push(user);
        this.saveUsers();
        return user;
    }

    login(email, password) {
        const user = this.users.find(u => u.email === email && u.password === password);
        if (!user) {
            throw new Error('Invalid email or password');
        }
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        return user;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    saveQuote(quoteData) {
        if (!this.currentUser) return;
        
        const quote = {
            id: Date.now().toString(),
            userId: this.currentUser.id,
            ...quoteData,
            createdAt: new Date().toISOString()
        };

        this.quotes.push(quote);
        this.saveQuotes();
        return quote;
    }

    saveClaim(claimData) {
        if (!this.currentUser) return;
        
        const claim = {
            id: Date.now().toString(),
            userId: this.currentUser.id,
            status: 'pending',
            ...claimData,
            createdAt: new Date().toISOString()
        };

        this.claims.push(claim);
        this.saveClaims();
        return claim;
    }

    getUserQuotes() {
        if (!this.currentUser) return [];
        return this.quotes.filter(quote => quote.userId === this.currentUser.id);
    }

    getUserClaims() {
        if (!this.currentUser) return [];
        return this.claims.filter(claim => claim.userId === this.currentUser.id);
    }

    deleteQuote(quoteId) {
        if (!this.currentUser) return false;
        
        const index = this.quotes.findIndex(quote => 
            quote.id === quoteId && quote.userId === this.currentUser.id
        );
        
        if (index !== -1) {
            this.quotes.splice(index, 1);
            this.saveQuotes();
            return true;
        }
        
        return false;
    }

    deleteClaim(claimId) {
        if (!this.currentUser) return false;
        
        const index = this.claims.findIndex(claim => 
            claim.id === claimId && claim.userId === this.currentUser.id
        );
        
        if (index !== -1) {
            this.claims.splice(index, 1);
            this.saveClaims();
            return true;
        }
        
        return false;
    }
}

// UI Management
class UIManager {
    constructor() {
        this.userManager = new UserManager();
        this.setupEventListeners();
        this.checkAuthState();
        this.setupNavigation();
        this.setupAnimations();
    }

    setupEventListeners() {
        // Auth Modal
        const openLoginBtn = document.getElementById('openLogin');
        const openSignupBtn = document.getElementById('openSignup');
        const closeModalBtn = document.querySelector('.close-modal');
        const tabButtons = document.querySelectorAll('.tab-btn');

        openLoginBtn?.addEventListener('click', () => this.openAuthModal('login'));
        openSignupBtn?.addEventListener('click', () => this.openAuthModal('signup'));
        closeModalBtn?.addEventListener('click', () => this.closeAuthModal());

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchAuthTab(tab);
            });
        });

        // Auth Forms
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('signupForm')?.addEventListener('submit', (e) => this.handleSignup(e));

        // Logout buttons
        document.querySelectorAll('.logout-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleLogout());
        });

        // User dropdown toggle
        const userDropdownToggle = document.querySelector('.user-dropdown-toggle');
        userDropdownToggle?.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelector('.user-dropdown').classList.toggle('active');
        });

        // User dropdown menu items
        document.querySelector('.user-dropdown-menu')?.addEventListener('click', (e) => {
            const target = e.target.closest('.dropdown-item');
            if (!target) return;
            
            if (target.classList.contains('logout-btn')) {
                // Logout is already handled
                return;
            }
            
            e.preventDefault();
            const href = target.getAttribute('href');
            if (href) {
                // Special handling for profile panel
                if (href === '#profile-panel') {
                    this.scrollToSection('dashboard');
                    // Activate the profile tab
                    setTimeout(() => {
                        const profileTab = document.querySelector('.dashboard-tab[data-tab="profile"]');
                        if (profileTab) {
                            profileTab.click();
                        }
                    }, 100);
                } else {
                    this.scrollToSection(href.substring(1));
                }
                document.querySelector('.user-dropdown').classList.remove('active');
            }
        });

        // Close dropdown when clicking elsewhere
        document.addEventListener('click', () => {
            document.querySelector('.user-dropdown')?.classList.remove('active');
        });

        // Claims Form
        document.getElementById('claimForm')?.addEventListener('submit', (e) => this.handleClaim(e));

        // Contact Form
        document.getElementById('contactForm')?.addEventListener('submit', (e) => this.handleContact(e));

        // Get Started button
        const getStartedBtn = document.querySelector('.hero-content .primary-btn');
        getStartedBtn?.addEventListener('click', () => {
            this.scrollToSection('quote');
            this.showNotification('Let\'s get you a quote!', 'success');
        });

        // Form field focus effects
        document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });
            input.addEventListener('blur', () => {
                input.parentElement.classList.remove('focused');
            });
        });

        // Dashboard tabs
        const dashboardTabs = document.querySelectorAll('.dashboard-tab');
        dashboardTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                dashboardTabs.forEach(t => t.classList.remove('active'));
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Hide all panels
                document.querySelectorAll('.dashboard-panel').forEach(panel => {
                    panel.classList.remove('active');
                });
                
                // Show the panel that corresponds to the clicked tab
                const panelId = `${tab.dataset.tab}-panel`;
                document.getElementById(panelId).classList.add('active');
            });
        });
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.scrollToSection(targetId);
                this.updateActiveNav(link);
            });
        });
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            window.scrollTo({
                top: section.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    }

    updateActiveNav(activeLink) {
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    openAuthModal(tab = 'login') {
        const modal = document.getElementById('authModal');
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        this.switchAuthTab(tab);
    }

    closeAuthModal() {
        const modal = document.getElementById('authModal');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    switchAuthTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.toggle('active', form.id === `${tab}Form`);
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const user = this.userManager.login(email, password);
            this.showNotification('Login successful!', 'success');
            this.closeAuthModal();
            this.updateUIForLoggedInUser(user);
            this.loadDashboardData();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;

        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        try {
            const user = this.userManager.signup(name, email, password);
            this.showNotification('Account created successfully!', 'success');
            this.closeAuthModal();
            this.updateUIForLoggedInUser(user);
            this.loadDashboardData();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    handleLogout() {
        this.userManager.logout();
        this.updateUIForLoggedOutUser();
        this.showNotification('Logged out successfully', 'success');
    }

    async handleClaim(e) {
        e.preventDefault();
        const claimType = document.getElementById('claimType').value;
        const description = document.getElementById('claimDescription').value;
        const date = document.getElementById('claimDate').value;

        if (!this.userManager.currentUser) {
            this.showNotification('Please login to file a claim', 'error');
            this.openAuthModal('login');
            return;
        }

        // Save the claim
        this.userManager.saveClaim({
            claimType,
            description,
            date
        });

        // Update dashboard if visible
        this.loadUserClaims();

        // Notify user
        this.showNotification('Claim submitted successfully!', 'success');
        e.target.reset();
    }

    async handleContact(e) {
        e.preventDefault();

        // Simulate message submission
        this.showNotification('Message sent successfully!', 'success');
        e.target.reset();
    }

    checkAuthState() {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            this.userManager.currentUser = user;
            this.updateUIForLoggedInUser(user);
            this.loadDashboardData();
        }
    }

    updateUIForLoggedInUser(user) {
        document.querySelector('.auth-buttons').style.display = 'none';
        document.querySelector('.dashboard-link').style.display = 'block';
        const userProfile = document.querySelector('.user-profile');
        userProfile.style.display = 'flex';
        userProfile.querySelector('.user-name').textContent = user.name;
        
        // Make dashboard accessible
        document.getElementById('dashboard').style.display = 'block';
    }

    updateUIForLoggedOutUser() {
        document.querySelector('.auth-buttons').style.display = 'flex';
        document.querySelector('.dashboard-link').style.display = 'none';
        document.querySelector('.user-profile').style.display = 'none';
        
        // Hide dashboard
        document.getElementById('dashboard').style.display = 'none';
    }

    loadDashboardData() {
        this.loadUserProfile();
        this.loadUserQuotes();
        this.loadUserClaims();
    }

    loadUserProfile() {
        if (!this.userManager.currentUser) return;
        
        const user = this.userManager.currentUser;
        document.getElementById('profile-name').textContent = user.name;
        document.getElementById('profile-email').textContent = user.email;
        
        // Format the date
        const createdDate = new Date(user.createdAt);
        document.getElementById('profile-created').textContent = createdDate.toLocaleDateString();
    }

    loadUserQuotes() {
        const quotesContainer = document.querySelector('.saved-quotes');
        const quotes = this.userManager.getUserQuotes();
        
        if (quotes.length === 0) {
            quotesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-invoice-dollar"></i>
                    <p>You don't have any saved quotes yet.</p>
                    <a href="#quote" class="btn primary-btn">Get a Quote</a>
                </div>
            `;
            return;
        }
        
        let quotesHTML = '';
        
        quotes.forEach(quote => {
            const date = new Date(quote.createdAt).toLocaleDateString();
            
            quotesHTML += `
                <div class="quote-card" data-id="${quote.id}">
                    <h4><i class="fas fa-car"></i> ${quote.make} ${quote.model}</h4>
                    <div class="card-detail">
                        <strong>Type:</strong> 
                        <span>${quote.vehicleType.charAt(0).toUpperCase() + quote.vehicleType.slice(1)}</span>
                    </div>
                    <div class="card-detail">
                        <strong>Year:</strong> <span>${quote.year}</span>
                    </div>
                    <div class="card-detail">
                        <strong>Date:</strong> <span>${date}</span>
                    </div>
                    <div class="card-price">KES ${quote.premium}</div>
                    <div class="card-actions">
                        <button class="delete-quote" data-id="${quote.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        quotesContainer.innerHTML = quotesHTML;
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-quote').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const quoteId = e.currentTarget.dataset.id;
                if (confirm('Are you sure you want to delete this quote?')) {
                    this.userManager.deleteQuote(quoteId);
                    this.loadUserQuotes();
                    this.showNotification('Quote deleted successfully', 'success');
                }
            });
        });
    }

    loadUserClaims() {
        const claimsContainer = document.querySelector('.saved-claims');
        const claims = this.userManager.getUserClaims();
        
        if (claims.length === 0) {
            claimsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt"></i>
                    <p>You don't have any claims yet.</p>
                    <a href="#claims" class="btn primary-btn">File a Claim</a>
                </div>
            `;
            return;
        }
        
        let claimsHTML = '';
        
        claims.forEach(claim => {
            const date = new Date(claim.createdAt).toLocaleDateString();
            const incidentDate = new Date(claim.date).toLocaleDateString();
            
            // Get status badge color
            let statusColor = 'var(--text-color)';
            if (claim.status === 'approved') statusColor = 'var(--success-color)';
            if (claim.status === 'pending') statusColor = 'var(--primary-color)';
            if (claim.status === 'rejected') statusColor = 'var(--accent-color)';
            
            claimsHTML += `
                <div class="claim-card" data-id="${claim.id}">
                    <h4><i class="fas fa-file-alt"></i> ${claim.claimType.charAt(0).toUpperCase() + claim.claimType.slice(1)} Claim</h4>
                    <div class="card-detail">
                        <strong>Incident Date:</strong> <span>${incidentDate}</span>
                    </div>
                    <div class="card-detail">
                        <strong>Submitted:</strong> <span>${date}</span>
                    </div>
                    <div class="card-detail">
                        <strong>Status:</strong> 
                        <span style="color: ${statusColor}; font-weight: 600;">
                            ${claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </span>
                    </div>
                    <p class="claim-description">${claim.description.substring(0, 100)}${claim.description.length > 100 ? '...' : ''}</p>
                    <div class="card-actions">
                        <button class="delete-claim" data-id="${claim.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        claimsContainer.innerHTML = claimsHTML;
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-claim').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const claimId = e.currentTarget.dataset.id;
                if (confirm('Are you sure you want to delete this claim?')) {
                    this.userManager.deleteClaim(claimId);
                    this.loadUserClaims();
                    this.showNotification('Claim deleted successfully', 'success');
                }
            });
        });
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    setupAnimations() {
        // Intersection Observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, {
            threshold: 0.1
        });

        document.querySelectorAll('.quote-section, .claims-section, .contact-section').forEach(section => {
            observer.observe(section);
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const uiManager = new UIManager();
    const insuranceForm = document.getElementById('insuranceForm');
    const quoteResult = document.createElement('div');
    quoteResult.className = 'quote-result';
    insuranceForm.parentNode.appendChild(quoteResult);

    console.log('Setting up password toggles...');
    setupPasswordToggles();

    // Base rates for different vehicle types (in KES)
    const baseRates = {
        car: 100000,
        motorcycle: 80000,
        truck: 150000
    };

    // Age multipliers
    const ageMultipliers = {
        new: 1.2,    // Less than 3 years
        medium: 1.0, // 3-7 years
        old: 1.5     // More than 7 years
    };

    insuranceForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const vehicleType = document.getElementById('vehicleType').value;
        const make = document.getElementById('make').value;
        const model = document.getElementById('model').value;
        const year = parseInt(document.getElementById('year').value);
        const currentYear = new Date().getFullYear();
        const vehicleAge = currentYear - year;

        // Calculate age category
        let ageCategory;
        if (vehicleAge <= 3) {
            ageCategory = 'new';
        } else if (vehicleAge <= 7) {
            ageCategory = 'medium';
        } else {
            ageCategory = 'old';
        }

        // Calculate base premium
        let basePremium = baseRates[vehicleType] * ageMultipliers[ageCategory];

        // Add random variation (simulating other factors)
        const variation = Math.random() * 0.2 - 0.1; // ±10% variation
        const finalPremium = Math.round(basePremium * (1 + variation));

        // Save quote if user is logged in
        if (uiManager.userManager.currentUser) {
            uiManager.userManager.saveQuote({
                vehicleType,
                make,
                model,
                year,
                premium: finalPremium,
                ageCategory
            });
            
            // Update dashboard if it's visible
            if (document.getElementById('dashboard').style.display === 'block') {
                uiManager.loadUserQuotes();
            }
        }

        // Display the quote
        quoteResult.innerHTML = `
            <div class="quote-details">
                <h3>Your Insurance Quote</h3>
                <p>Vehicle: ${make} ${model} (${year})</p>
                <p>Type: ${vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)}</p>
                <p>Age Category: ${ageCategory.charAt(0).toUpperCase() + ageCategory.slice(1)}</p>
                <p class="premium">Annual Premium: KES ${finalPremium}</p>
                ${uiManager.userManager.currentUser ? 
                    '<p class="success-message"><i class="fas fa-check-circle"></i> Quote saved to your account</p>' : 
                    '<p class="login-prompt">Login to save your quote!</p>'}
            </div>
        `;

        // Add styles for the quote result
        quoteResult.style.marginTop = '2rem';
        quoteResult.style.padding = '2rem';
        quoteResult.style.backgroundColor = '#f8f9fa';
        quoteResult.style.borderRadius = '10px';
        quoteResult.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        
        // Scroll to show the quote result
        setTimeout(() => {
            quoteResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    });

    // Add input validation
    const yearInput = document.getElementById('year');
    yearInput?.addEventListener('input', () => {
        const currentYear = new Date().getFullYear();
        const minYear = currentYear - 30;
        const maxYear = currentYear + 1;

        if (yearInput.value < minYear) {
            yearInput.setCustomValidity(`Year must be after ${minYear}`);
        } else if (yearInput.value > maxYear) {
            yearInput.setCustomValidity(`Year cannot be in the future`);
        } else {
            yearInput.setCustomValidity('');
        }
    });

    // Contact Form Handler
    document.getElementById('contactForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show success message
        const successAlert = document.querySelector('.contact-success');
        successAlert.classList.add('show');
        
        // Hide success message after 3 seconds
        setTimeout(() => {
            successAlert.classList.remove('show');
        }, 3000);
        
        // Reset form
        this.reset();
    });

    // Quote Form Handler
    document.getElementById('insuranceForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const vehicleType = document.getElementById('vehicleType').value;
        const make = document.getElementById('make').value;
        const model = document.getElementById('model').value;
        const year = document.getElementById('year').value;
        
        // Update quote result
        document.getElementById('quote-vehicle-type').textContent = vehicleType;
        document.getElementById('quote-make').textContent = make;
        document.getElementById('quote-model').textContent = model;
        document.getElementById('quote-year').textContent = year;
        
        // Calculate premium (example calculation)
        let basePremium = 5000; // Base premium in KES
        const currentYear = new Date().getFullYear();
        const vehicleAge = currentYear - parseInt(year);
        
        // Adjust premium based on vehicle type
        switch(vehicleType) {
            case 'luxury':
                basePremium *= 2.5;
                break;
            case 'suv':
            case 'pickup':
                basePremium *= 1.5;
                break;
            case 'motorcycle':
            case 'scooter':
                basePremium *= 0.7;
                break;
            case 'bus':
            case 'truck':
                basePremium *= 2;
                break;
        }
        
        // Adjust for vehicle age
        if (vehicleAge > 5) {
            basePremium *= 1.2;
        }
        
        // Format and display premium
        const formattedPremium = new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(basePremium);
        
        document.getElementById('quote-premium').textContent = formattedPremium;
        
        // Show quote result
        document.querySelector('.quote-result').classList.add('show');
    });
});

// Set up password toggles function - moved outside DOMContentLoaded
function setupPasswordToggles() {
    console.log('Finding password toggles...');
    const passwordToggles = document.querySelectorAll('.password-toggle');
    console.log('Found toggles:', passwordToggles.length);
    
    passwordToggles.forEach(toggle => {
        console.log('Adding click listener to toggle');
        toggle.addEventListener('click', function(e) {
            console.log('Toggle clicked!');
            e.preventDefault(); // Prevent form submission
            
            // Get the parent form-group div and find the password input inside it
            const parentFormGroup = this.closest('.form-group');
            const input = parentFormGroup.querySelector('input[type="password"], input[type="text"]');
            console.log('Found input:', input);
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
                console.log('Changed to text');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                console.log('Changed to password');
            }
        });
    });
}

// Setup password toggles immediately as well
console.log('Setting up password toggles immediately...');
setupPasswordToggles();

// Password visibility toggle function - accessible globally
function togglePasswordVisibility(button) {
    // Get the parent form-group div
    const parentFormGroup = button.closest('.form-group');
    // Find the password input
    const input = parentFormGroup.querySelector('input');
    // Find the icon
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        console.log('Password now visible');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        console.log('Password now hidden');
    }
}
