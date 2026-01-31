# Digital Inheritance Platform - Backend API

## MongoDB + Express + Node.js Backend

### 🏗️ Architecture

```
backend/
├── server.js              # Express server entry point
├── config/
│   └── database.js        # MongoDB connection
├── models/
│   ├── User.js            # User schema
│   └── Nominee.js         # Nominee schema with BEN-ID
├── routes/
│   ├── userRoutes.js      # User endpoints
│   └── nomineeRoutes.js   # Nominee endpoints
├── middleware/
│   └── auth.js            # JWT authentication
└── utils/
    └── benIdGenerator.js  # BEN-ID generator

```

### 📦 Installation

```bash
cd backend
npm install
```

### 🚀 Start Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server runs on: `http://localhost:5000`

### 🗄️ MongoDB Setup

**Option 1: Local MongoDB**
```bash
# Install MongoDB Community Edition
# macOS: brew install mongodb-community
# Windows: Download from mongodb.com

# Start MongoDB
mongod --dbpath /path/to/data
```

**Option 2: MongoDB Atlas (Cloud)**
1. Create free account at mongodb.com/atlas
2. Create cluster
3. Get connection string
4. Update `.env` file:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/digital_inheritance
```

### 🔐 Security Features

**1. BEN-ID Generation**
- Cryptographically random
- Format: `BEN-XXXX-XXXX`
- Uniqueness enforced in database
- Cannot be guessed

**2. Access Control**
- Nominee status must be `ACTIVE`
- User `continuity_triggered` must be `true`
- Both conditions required for access

**3. JWT Authentication**
- Separate tokens for users and nominees
- 7-day expiry for users
- 30-day expiry for nominees

### 📡 API Endpoints

#### User Endpoints

**Register User**
```http
POST /api/user/register
Content-Type: application/json

{
  "email": "user@example.com",
  "fullName": "John Doe",
  "password": "securepassword123"
}
```

**User Login**
```http
POST /api/user/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Add Nominee** (Authenticated)
```http
POST /api/user/add-nominee
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "nominee_email": "nominee@example.com",
  "nominee_name": "Jane Smith",
  "relation": "Family"
}

Response:
{
  "success": true,
  "data": {
    "nomineeId": "...",
    "beneficiary_reference_id": "BEN-A7F2-9K4L",
    "status": "INACTIVE"
  }
}
```

**Get Nominees** (Authenticated)
```http
GET /api/user/nominees
Authorization: Bearer <user_token>
```

**Trigger Continuity Access** (Authenticated)
```http
POST /api/user/trigger-continuity
Authorization: Bearer <user_token>
```

#### Nominee Endpoints

**Nominee Login**
```http
POST /api/nominee/login
Content-Type: application/json

{
  "nominee_email": "nominee@example.com",
  "beneficiary_reference_id": "BEN-A7F2-9K4L"
}

Response (if ACTIVE):
{
  "success": true,
  "data": {
    "nomineeId": "...",
    "token": "eyJhbG..."
  }
}

Response (if INACTIVE):
{
  "success": false,
  "message": "Reference ID not activated. Access will be granted after..."
}
```

**Upload Death Certificate**
```http
POST /api/nominee/upload-death-proof
Content-Type: application/json

{
  "nominee_email": "nominee@example.com",
  "beneficiary_reference_id": "BEN-A7F2-9K4L",
  "document_name": "death_certificate.pdf",
  "file_path": "/encrypted/files/cert_123.enc"
}
```

**Get Dashboard** (Authenticated)
```http
GET /api/nominee/dashboard
Authorization: Bearer <nominee_token>
```

**Verify Death** (Admin Endpoint)
```http
POST /api/nominee/verify-death
Content-Type: application/json

{
  "nomineeId": "...",
  "decision": "APPROVE"
}

OR

{
  "nomineeId": "...",
  "decision": "REJECT",
  "rejection_reason": "Invalid document"
}
```

### 🔄 Nominee Access Flow

```
1. USER CREATES NOMINEE
   └─> Status: INACTIVE
   └─> BEN-ID generated: BEN-XXXX-XXXX
   └─> Email sent to nominee (simulated)

2. USER TRIGGERS CONTINUITY
   └─> continuity_triggered = true
   └─> Nominee still INACTIVE (cannot login yet)

3. NOMINEE UPLOADS DEATH CERTIFICATE
   └─> Status: INACTIVE → PENDING_VERIFICATION
   └─> Document stored locally (encrypted)

4. SYSTEM/ADMIN VERIFIES DOCUMENT
   └─> APPROVE: Status → ACTIVE
   └─> REJECT: Status → REJECTED

5. NOMINEE CAN LOGIN (only if ACTIVE)
   └─> Receives JWT token
   └─> Accesses dashboard
```

### 📊 Database Collections

**users**
```javascript
{
  _id: ObjectId,
  email: "user@example.com",
  fullName: "John Doe",
  password_hash: "$2a$12$...",
  continuity_triggered: false,
  date_of_death_verified_at: null,
  created_at: ISODate,
  updatedAt: ISODate
}
```

**nominees**
```javascript
{
  _id: ObjectId,
  user_id: ObjectId("..."),
  nominee_email: "nominee@example.com",
  nominee_name: "Jane Smith",
  relation: "Family",
  beneficiary_reference_id: "BEN-A7F2-9K4L",
  status: "INACTIVE",
  death_document_url: null,
  death_document_name: null,
  verified_at: null,
  rejected_at: null,
  rejection_reason: null,
  created_at: ISODate,
  updatedAt: ISODate
}
```

### 🛡️ Security Rules

1. **BEN-ID is NOT a password**
   - Used for identification only
   - Must be combined with email
   - Status check is mandatory

2. **Access Control**
   - `status === 'ACTIVE'` required
   - `continuity_triggered === true` required
   - Both must be true for access

3. **File Storage**
   - Files NOT stored in MongoDB
   - Stored locally with encryption
   - Only file path stored in database

### 🧪 Testing

**1. Start MongoDB**
```bash
mongod
```

**2. Start Backend**
```bash
cd backend
npm run dev
```

**3. Test Health Check**
```bash
curl http://localhost:5000/health
```

**4. Test User Registration**
```bash
curl -X POST http://localhost:5000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","fullName":"Test User","password":"password123"}'
```

### 🔍 Console Logging

All critical operations log to console:

```
=== NOMINEE CREATED ===
User ID: 507f1f77bcf86cd799439011
Nominee Name: Jane Smith
BEN-ID: BEN-A7F2-9K4L
Status: INACTIVE
⚠ Nominee CANNOT login until status is ACTIVE
=======================

=== NOMINEE LOGIN ATTEMPT ===
Email: nominee@example.com
BEN-ID: BEN-A7F2-9K4L
✓ Nominee found: Jane Smith
Current status: ACTIVE
✓ Authentication successful
✓ Access granted to dashboard
============================
```

### ⚙️ Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/digital_inheritance
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
NODE_ENV=development
DEMO_MODE=true
```

### 🎯 Demo Mode

When `DEMO_MODE=true`:
- Death certificates auto-approved after 3 seconds
- Console shows demo warnings
- Perfect for hackathon presentations

### 📝 Error Messages

**Invalid BEN-ID:**
```json
{
  "success": false,
  "message": "Invalid email or beneficiary reference ID."
}
```

**Inactive Nominee:**
```json
{
  "success": false,
  "message": "Reference ID not activated. Access will be granted after the account owner triggers Continuity Access and death verification is complete."
}
```

**Continuity Not Triggered:**
```json
{
  "success": false,
  "message": "Continuity access has not been triggered by the account owner. Access denied."
}
```

### 🔗 Connect to Frontend

Update your React app to use the API:

```javascript
// src/api/client.js
const API_BASE = 'http://localhost:5000/api';

export const registerUser = async (userData) => {
  const response = await fetch(`${API_BASE}/user/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return response.json();
};

export const addNominee = async (token, nomineeData) => {
  const response = await fetch(`${API_BASE}/user/add-nominee`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(nomineeData)
  });
  return response.json();
};
```

---

**Ready to use! 🚀**

Run `npm install` then `npm run dev` in the backend folder.
