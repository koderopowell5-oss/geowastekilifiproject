# GeoWaste Kilifi - Authentication Portal

## Overview
The GeoWaste Kilifi application includes a comprehensive authentication system with three separate portals:
1. **Enumerator Login** - For existing field data collectors
2. **Enumerator Signup** - For new field data collectors to create accounts
3. **Admin Login** - For administrators with hardcoded credentials

## Authentication System Features

### Enumerator Portal
- Create new accounts (signup)
- Login with email and password
- Demo accounts for testing
- Persistent session across page refreshes
- Role-based access control
- Survey data collection
- Map visualization
- Admin dashboard access

### Admin Portal
- Independent login with hardcoded credentials
- Full analytics dashboard
- Data review and reporting
- System administration features
- Separate from enumerator access

## Enumerator Demo Accounts

The following demo accounts are available for testing (password: `password123`):

### 1. John Kamau
- **Email**: enumerator1@geowaste.com
- **Password**: password123
- **Ward**: Mombasa
- **Phone**: +254712345678

### 2. Mary Kipchoge
- **Email**: enumerator2@geowaste.com
- **Password**: password123
- **Ward**: Kilifi
- **Phone**: +254723456789

### 3. David Omondi
- **Email**: enumerator3@geowaste.com
- **Password**: password123
- **Ward**: Malindi
- **Phone**: +254734567890

## Admin Hardcoded Credentials

- **Username**: `admin`
- **Password**: `AdminGeoWaste2024!`

**Note**: These credentials are hardcoded for demonstration. In production, implement secure backend authentication.

## User Flows

### Enumerator Workflow

#### Login
1. Navigate to http://localhost:3000
2. Select **"Sign In"** tab (default)
3. Enter email and password
4. Click **"Sign In"** button
5. Access dashboard with survey, map, and admin features

#### Signup
1. Navigate to http://localhost:3000
2. Click **"Create New Account"** button
3. Fill out form:
   - Full Name
   - Email Address
   - Password (min 6 characters)
   - Confirm Password
   - Assigned Ward (dropdown)
   - Phone Number (Kenyan format)
4. Click **"Create Account"** button
5. Confirmation page displayed
6. Back to login to access new account

#### Submitting Survey Data
1. Login to enumerator portal
2. Click **"Start New Survey"** button
3. Fill comprehensive questionnaire (40+ fields)
4. Auto-captured GPS coordinates
5. Click **"Submit"** button
6. Data saved to PostgreSQL database

#### Viewing Data
1. Click **"View Map"** - See all submitted waste sites
2. Click **"Admin Dashboard"** - View analytics and charts
3. Click on map markers to view detailed site information

### Admin Workflow

#### Admin Login
1. Navigate to http://localhost:3000
2. Click **"Admin Login"** button
3. Enter credentials:
   - **Username**: admin
   - **Password**: AdminGeoWaste2024!
4. Click **"Admin Login"** button
5. Access admin dashboard with:
   - Summary statistics
   - Multiple data visualizations
   - Detailed records table
   - Export/print functionality

#### Admin Features Available
- View all waste site records
- Analyze waste types distribution
- Track disposal method usage
- Analyze ward distribution
- View settlement type breakdown
- Calculate average household sizes
- Export reports

## Account Management

### User Registration Storage
- New accounts stored in browser localStorage
- Key: `registered_users`
- Format: JSON object with email keys

### Session Management
- Current user stored in localStorage
- Key: `auth_user`
- Persisted across page refreshes
- Cleared on logout

## Password Requirements

### Enumerators
- Minimum 6 characters
- No special requirements
- Example: `MyWaste2025`

### Admin
- Hardcoded password: `AdminGeoWaste2024!`
- Cannot be changed in demo
- Change in `AuthContext.tsx` for customization

## Phone Number Format

- Must be valid Kenyan number
- Format: `+254712345678` or variations
- Accepted formats:
  - `+254 712 345 678`
  - `+254712345678`
  - `0712345678` (will need code adjustment)

## Ward Selection

Available wards for enumerators:
- Mombasa
- Kilifi
- Malindi
- Lamu
- Tanariver

## Testing Checklist

- [ ] Login with demo account works
- [ ] Signup creates new account
- [ ] Back to login from signup
- [ ] New account can login
- [ ] Logout clears session
- [ ] Page refresh restores session
- [ ] Admin login with hardcoded credentials works
- [ ] Admin sees analytics dashboard
- [ ] Enumerator can start survey
- [ ] Survey data submitted successfully
- [ ] Data appears on map
- [ ] Data visible in admin dashboard

## Architecture

### Components
- **LoginPage.tsx**: Three-way auth selection interface
- **SignupPage.tsx**: New account creation form
- **AdminLoginPage.tsx**: Admin credentials entry
- **AuthContext.tsx**: Authentication state (signup, login, adminLogin)

### Storage
- **localStorage auth_user**: Current logged-in user
- **localStorage registered_users**: All created accounts
- **Demo accounts**: Hardcoded in AuthContext

### Auth Types
```typescript
Enumerator {
  id: string;
  name: string;
  email: string;
  ward: string;
  phone: string;
}

Admin {
  id: string;
  username: string;
  isAdmin: true;
}
```

## Security Considerations

### Development
- Demo credentials hardcoded
- localStorage used for session storage
- No encryption
- Mock authentication only

### Production Requirements
- Replace mock auth with backend API
- Implement JWT or session tokens
- Use secure HTTP only cookies
- Hash passwords with bcrypt
- Implement rate limiting
- Add CSRF protection
- Enable HTTPS
- Implement refresh token rotation
- Add password reset flow
- Implement account lockout

## Troubleshooting

### Cannot Login
- Check email spelling
- Verify password matches demo account
- Try demo account directly
- Check browser console for errors

### Signup Fails
- Email already registered?
- Phone number not valid Kenyan format?
- Password too short (< 6 chars)?
- Passwords don't match?

### Admin Cannot Access Dashboard
- Verify username is exactly `admin`
- Verify password case-sensitive
- Check hint on admin login page

### Session Lost
- Browser cleared localStorage?
- Private/incognito mode?
- Server restarted?
- Logout clicked?

## Future Enhancements

- [ ] Email verification for new accounts
- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)
- [ ] Real backend API integration
- [ ] JWT token management
- [ ] Role-based access control (RBAC)
- [ ] Activity audit logging
- [ ] Session timeout warnings
- [ ] Account deactivation
- [ ] Bulk user import
