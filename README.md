# InsureDrive - Vehicle Insurance System

InsureDrive is a modern, responsive web application for vehicle insurance management. This system provides users with a seamless experience for exploring insurance options, getting quotes, filing claims, and managing their insurance profile.

## Features

- **User Authentication**
  - Secure signup and login
  - User profile management
  - Password visibility toggle for improved user experience

- **Insurance Quote Generation**
  - Dynamic quote calculation based on:
    - Vehicle type
    - Vehicle make and model
    - Vehicle age
  - Instant premium estimation

- **Claims Management**
  - Multiple claim types support (accidents, theft, vandalism, etc.)
  - Detailed claim description
  - Date selection for incidents
  - Claims tracking in user dashboard

- **User Dashboard**
  - Saved quotes overview
  - Claims history and status
  - Profile information management

- **Contact Portal**
  - Direct communication with support
  - Form validation
  - Success confirmation

- **Responsive Design**
  - Mobile-friendly interface
  - Modern UI with smooth transitions
  - Consistent styling across all device sizes

## Technology Stack

- **Frontend**
  - HTML5
  - CSS3 with custom variables
  - Vanilla JavaScript (ES6+)
  - Font Awesome icons
  - Google Fonts (Inter)

- **Data Management**
  - LocalStorage for persistent data
  - Client-side data processing

## Project Structure

```
vehicle-insurance-system/
├── index.html          # Main HTML document with all page sections
├── css/                # Styling directory
│   └── styles.css      # Main stylesheet with all custom styling
├── js/                 # JavaScript directory
│   └── main.js         # Application logic including user management, UI controls
└── README.md           # Project documentation
```

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/vehicle-insurance-system.git
   ```

2. Navigate to the project directory:
   ```bash
   cd vehicle-insurance-system
   ```

3. Open the project:
   - Open `index.html` directly in your browser
   - Alternatively, use a local development server:
     ```bash
     npx serve
     ```
     or
     ```bash
     python -m http.server
     ```

## Usage

### Getting an Insurance Quote

1. Navigate to the "Get Quote" section
2. Fill in your vehicle details
3. Click "Calculate Quote" to see your estimated premium

### Filing a Claim

1. Navigate to the "Claims" section
2. Select the claim type
3. Provide incident details
4. Submit your claim

### Managing Your Account

1. Sign up or log in to access your dashboard
2. View saved quotes and submitted claims
3. Update your profile information

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- Backend integration with PHP/Node.js
- Database implementation (MySQL/MongoDB)
- Payment gateway integration
- Email notifications
- Advanced analytics dashboard
- Document upload for claims

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For support or inquiries, please contact:
- Email: support@insuredrive.co.ke
- Phone: +254 700 123 456

---

© All rights reserved.