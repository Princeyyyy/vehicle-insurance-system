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
        if (!this.currentUser) {
            throw new Error('User must be logged in to save quotes');
        }

        // Generate a unique ID for the quote
        const quoteId = Date.now().toString();
        
        // Create a new quote object with the unique ID
        const newQuote = {
            id: quoteId,
            ...quoteData,
            date: new Date().toISOString(),
            userId: this.currentUser.id
        };

        // Get existing quotes or initialize empty array
        const quotes = JSON.parse(localStorage.getItem('quotes') || '[]');
        
        // Add the new quote
        quotes.push(newQuote);
        
        // Save back to localStorage
        localStorage.setItem('quotes', JSON.stringify(quotes));
        
        return newQuote;
    }

    saveClaim(claim) {
        if (!this.currentUser) {
            throw new Error('User must be logged in to save claims');
        }

        // Generate a unique ID for the claim
        const claimId = Date.now().toString();
        
        // Create a new claim object with the unique ID
        const newClaim = {
            id: claimId,
            ...claim,
            date: new Date().toISOString(),
            status: 'pending',
            userId: this.currentUser.id
        };

        // Get existing claims or initialize empty array
        const claims = JSON.parse(localStorage.getItem('claims') || '[]');
        
        // Add the new claim
        claims.push(newClaim);
        
        // Save back to localStorage
        localStorage.setItem('claims', JSON.stringify(claims));
        
        return newClaim;
    }

    getUserQuotes() {
        if (!this.currentUser) {
            return [];
        }
        
        const quotes = JSON.parse(localStorage.getItem('quotes') || '[]');
        return quotes.filter(quote => quote.userId === this.currentUser.id);
    }

    getUserClaims() {
        if (!this.currentUser) {
            return [];
        }
        
        const claims = JSON.parse(localStorage.getItem('claims') || '[]');
        return claims.filter(claim => claim.userId === this.currentUser.id);
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
        document.getElementById('claimForm')?.addEventListener('submit', (e) => this.handleClaimSubmit(e));

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
            
            // Clear login form fields
            document.getElementById('loginForm').reset();
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
            // Automatically log in the user after signup
            this.userManager.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            this.showNotification('Account created successfully!', 'success');
            this.closeAuthModal();
            this.updateUIForLoggedInUser(user);
            this.loadDashboardData();
            
            // Clear signup form fields
            document.getElementById('signupForm').reset();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    handleLogout() {
        this.userManager.logout();
        this.updateUIForLoggedOutUser();
        this.showNotification('Logged out successfully', 'success');
    }

    handleClaimSubmit(e) {
        e.preventDefault();
        
        if (!this.userManager.currentUser) {
            this.showNotification('Please log in to submit a claim', 'error');
            return;
        }

        const claimType = document.getElementById('claimType').value;
        const description = document.getElementById('claimDescription').value;
        const amount = parseFloat(document.getElementById('claimAmount').value);
        const date = document.getElementById('claimDate').value;

        if (!claimType || !description || isNaN(amount) || !date) {
            this.showNotification('Please fill in all fields correctly', 'error');
            return;
        }

        try {
            const claim = this.userManager.saveClaim({
                type: claimType,
                description,
                amount,
                date
            });

            // Use the claim object to show more detailed success message
            this.showNotification(`Claim #${claim.id} submitted successfully`, 'success');
            
            // Clear claim form fields
            document.getElementById('claimForm').reset();
            
            // Log claim details for debugging
            console.log('Claim submitted:', claim);
            
            // Update the claims display if on the dashboard
            if (document.getElementById('dashboard').style.display === 'block') {
                this.loadUserClaims();
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async handleContact(e) {
        e.preventDefault();

        // Simulate message submission
        this.showNotification('Message sent successfully!', 'success');
        
        // Clear contact form fields
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
        if (!quotesContainer) return;
        
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
            const date = new Date(quote.date).toLocaleDateString();
            const formattedPremium = new Intl.NumberFormat('en-KE', {
                style: 'currency',
                currency: 'KES'
            }).format(quote.premium);
            
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
                        <strong>Age Category:</strong> <span>${quote.ageCategory.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                    <div class="card-detail">
                        <strong>Coverage:</strong> <span>${quote.coverageLevel.charAt(0).toUpperCase() + quote.coverageLevel.slice(1)}</span>
                    </div>
                    <div class="card-detail">
                        <strong>Date:</strong> <span>${date}</span>
                    </div>
                    <div class="card-price">${formattedPremium}</div>
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
        if (!claimsContainer) return;

        const claims = this.userManager.getUserClaims();
        
        if (claims.length === 0) {
            claimsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt"></i>
                    <p>You haven't filed any claims yet.</p>
                    <a href="#" class="btn btn-primary" onclick="showModal('claimModal')">File a Claim</a>
                </div>
            `;
            return;
        }

        // Sort claims by date (newest first)
        claims.sort((a, b) => new Date(b.date) - new Date(a.date));

        claimsContainer.innerHTML = claims.map(claim => {
            const statusClass = `status-${claim.status.toLowerCase()}`;
            const statusIcon = {
                'approved': 'fa-check-circle',
                'pending': 'fa-clock',
                'rejected': 'fa-times-circle'
            }[claim.status.toLowerCase()];

            const typeIcon = {
                'accident': 'fa-car-crash',
                'theft': 'fa-shield-alt',
                'damage': 'fa-tools',
                'other': 'fa-exclamation-circle'
            }[claim.type.toLowerCase()] || 'fa-file-alt';

            return `
                <div class="claim-card" data-claim-id="${claim.id}">
                    <div class="claim-header">
                        <div class="claim-type">
                            <i class="fas ${typeIcon}"></i>
                            <h3>${claim.type.charAt(0).toUpperCase() + claim.type.slice(1)}</h3>
                        </div>
                        <div class="claim-status ${statusClass}">
                            <i class="fas ${statusIcon}"></i>
                            ${claim.status}
                        </div>
                    </div>
                    <div class="claim-body">
                        <div class="claim-info">
                            <div class="info-item">
                                <i class="fas fa-calendar"></i>
                                <div>
                                    <span class="info-label">Date of Incident</span>
                                    <span class="info-value">${new Date(claim.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-money-bill-wave"></i>
                                <div>
                                    <span class="info-label">Claim Amount</span>
                                    <span class="info-value">KES ${parseFloat(claim.amount).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div class="claim-description">
                            <h4>Description</h4>
                            <p>${claim.description}</p>
                        </div>
                    </div>
                    <div class="claim-footer">
                        <span class="claim-id">ID: ${claim.id}</span>
                        <button class="delete-claim" onclick="userManager.deleteClaim('${claim.id}')">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
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
        // Passenger vehicles
        sedan: 85000,
        hatchback: 75000,
        suv: 120000,
        luxury: 250000,
        van: 95000,
        
        // Two-wheelers
        motorcycle: 45000,
        scooter: 35000,
        
        // Commercial vehicles
        pickup: 110000,
        truck: 180000,
        bus: 200000
    };

    // Age multipliers with more granular categories
    const ageMultipliers = {
        brandNew: 1.3,    // Less than 1 year
        veryNew: 1.2,     // 1-2 years
        new: 1.1,         // 2-3 years
        recent: 1.0,      // 3-5 years
        medium: 0.95,     // 5-7 years
        older: 1.1,       // 7-10 years
        old: 1.3,         // 10-15 years
        veryOld: 1.5      // More than 15 years
    };

    // Additional risk factors
    const riskFactors = {
        // Vehicle type risk factors
        vehicleRisk: {
            luxury: 1.4,      // Higher risk due to higher value
            suv: 1.2,         // Higher risk due to size
            motorcycle: 1.5,   // Higher risk due to vulnerability
            scooter: 1.4,     // Higher risk due to vulnerability
            truck: 1.3,       // Higher risk due to size and usage
            bus: 1.3          // Higher risk due to passenger capacity
        },
        
        // Seasonal factors (based on current month)
        seasonal: {
            0: 1.1,  // January - New Year driving
            1: 1.0,  // February
            2: 1.0,  // March
            3: 1.1,  // April - Easter holidays
            4: 1.0,  // May
            5: 1.0,  // June
            6: 1.0,  // July
            7: 1.1,  // August - Back to school
            8: 1.0,  // September
            9: 1.0,  // October
            10: 1.1, // November - Holiday season approaching
            11: 1.2  // December - Holiday season
        },
        
        // Coverage level multipliers
        coverageLevel: {
            basic: 1.0,
            standard: 1.2,
            premium: 1.5,
            comprehensive: 2.0
        }
    };

    // Remove the duplicate event listener and keep only one comprehensive handler
    insuranceForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const vehicleType = document.getElementById('vehicleType').value;
        const make = document.getElementById('make').value;
        const model = document.getElementById('model').value;
        const year = parseInt(document.getElementById('year').value);
        const currentYear = new Date().getFullYear();
        const vehicleAge = currentYear - year;
        const currentMonth = new Date().getMonth();

        // Calculate age category with more granular categories
        let ageCategory;
        if (vehicleAge < 1) {
            ageCategory = 'brandNew';
        } else if (vehicleAge < 2) {
            ageCategory = 'veryNew';
        } else if (vehicleAge < 3) {
            ageCategory = 'new';
        } else if (vehicleAge < 5) {
            ageCategory = 'recent';
        } else if (vehicleAge < 7) {
            ageCategory = 'medium';
        } else if (vehicleAge < 10) {
            ageCategory = 'older';
        } else if (vehicleAge < 15) {
            ageCategory = 'old';
        } else {
            ageCategory = 'veryOld';
        }

        // Get base premium from baseRates
        let basePremium = baseRates[vehicleType] || baseRates.sedan; // Default to sedan if type not found
        
        // Apply age multiplier
        basePremium *= ageMultipliers[ageCategory];
        
        // Apply vehicle type risk factor
        if (riskFactors.vehicleRisk[vehicleType]) {
            basePremium *= riskFactors.vehicleRisk[vehicleType];
        }
        
        // Apply seasonal factor
        basePremium *= riskFactors.seasonal[currentMonth];
        
        // Apply coverage level (default to standard)
        const coverageLevel = 'standard'; // This could be selected by the user in a real application
        basePremium *= riskFactors.coverageLevel[coverageLevel];
        
        // Add random variation (simulating other factors)
        const variation = Math.random() * 0.2 - 0.1; // ±10% variation
        const finalPremium = Math.round(basePremium * (1 + variation));

        // Update quote result elements
        document.getElementById('quote-vehicle-type').textContent = vehicleType;
        document.getElementById('quote-make').textContent = make;
        document.getElementById('quote-model').textContent = model;
        document.getElementById('quote-year').textContent = year;
        
        // Format and display premium
        const formattedPremium = new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(finalPremium);
        
        document.getElementById('quote-premium').textContent = formattedPremium;

        // Save quote if user is logged in
        if (uiManager.userManager.currentUser) {
            uiManager.userManager.saveQuote({
                vehicleType,
                make,
                model,
                year,
                premium: finalPremium,
                ageCategory,
                coverageLevel,
                baseRate: baseRates[vehicleType],
                ageMultiplier: ageMultipliers[ageCategory],
                vehicleRiskFactor: riskFactors.vehicleRisk[vehicleType] || 1.0,
                seasonalFactor: riskFactors.seasonal[currentMonth],
                coverageMultiplier: riskFactors.coverageLevel[coverageLevel]
            });
            
            // Update dashboard if it's visible
            if (document.getElementById('dashboard').style.display === 'block') {
                uiManager.loadUserQuotes();
            }
        }

        // Display the quote with more details
        quoteResult.innerHTML = `
            <div class="quote-details">
                <h3>Your Insurance Quote</h3>
                <p>Vehicle: ${make} ${model} (${year})</p>
                <p>Type: ${vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)}</p>
                <p>Age Category: ${ageCategory.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p>Coverage Level: ${coverageLevel.charAt(0).toUpperCase() + coverageLevel.slice(1)}</p>
                <p class="premium">Annual Premium: ${formattedPremium}</p>
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
        
        // Show quote result
        quoteResult.classList.add('show');
        
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

    // Remove the duplicate quote form handler
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
