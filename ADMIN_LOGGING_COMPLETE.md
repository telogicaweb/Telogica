# Admin Activity Logging - Complete Implementation

## Overview
Comprehensive admin activity logging system that tracks **every action** performed by administrators across all critical entities.

---

## Logged Entities
1. **Product** - All product management operations
2. **Order** - All order management and fulfillment operations
3. **Warranty** - All warranty approval and management operations
4. **Payment** - All payment-related operations
5. **User** - All user management operations (NEW)
6. **Invoice** - All invoice generation operations (NEW)

---

## Logged Actions
- **CREATE** - Creating new records
- **UPDATE** - Modifying existing records
- **DELETE** - Removing records
- **APPROVE** - Approving requests (warranties, retailer accounts)
- **REJECT** - Rejecting requests (warranties)

---

## Complete List of Logged Admin Operations

### 🛍️ **Product Management**
| Operation | Action | Logged Details |
|-----------|--------|----------------|
| Create Product | `CREATE` | Product name, category, price |
| Update Product | `UPDATE` | Product name, all changes made |
| Delete Product | `DELETE` | Product name |

**File**: `Backend/controllers/productController.js`

---

### 📦 **Order Management**
| Operation | Action | Logged Details |
|-----------|--------|----------------|
| Update Order Status | `UPDATE` | Previous status, new status, payment status |
| Update Tracking Link | `UPDATE` | Tracking link, tracking ID |

**File**: `Backend/controllers/orderController.js`

**Note**: Order creation by users is not logged as admin action (user-initiated). Payment verification is automated, not admin action.

---

### 🛡️ **Warranty Management**
| Operation | Action | Logged Details |
|-----------|--------|----------------|
| Approve Warranty | `UPDATE` | Status change from pending to approved |
| Reject Warranty | `UPDATE` | Status change from pending to rejected, reason |
| Update Warranty | `UPDATE` | All changes made to warranty |

**File**: `Backend/controllers/warrantyController.js`

---

### 👥 **User Management** *(Newly Added)*
| Operation | Action | Logged Details |
|-----------|--------|----------------|
| Create User | `CREATE` | User name, email, role |
| Update User | `UPDATE` | Previous data, changes made (name, email, role, approval status) |
| Delete User | `DELETE` | User name, email, role |
| Approve Retailer | `APPROVE` | User name, email, role |

**File**: `Backend/controllers/authController.js`

---

### 📄 **Invoice Management** *(Newly Added)*
| Operation | Action | Logged Details |
|-----------|--------|----------------|
| Generate Dropship Invoice | `CREATE` | Invoice type, order number, customer email |

**File**: `Backend/controllers/orderController.js`

---

## Log Data Structure

Each admin log entry contains:

```javascript
{
  adminId: ObjectId,           // Reference to admin user
  adminName: String,            // Admin's name
  adminEmail: String,           // Admin's email
  action: String,               // CREATE, UPDATE, DELETE, APPROVE, REJECT
  entity: String,               // Product, Order, Warranty, Payment, User, Invoice
  entityId: String,             // ID of affected entity
  details: Mixed,               // Contextual information about the action
  ipAddress: String,            // Admin's IP address
  timestamp: Date               // When action occurred
}
```

---

## Enhanced Features

### 🔍 **Detailed Context**
Every log includes contextual information:
- **Product logs**: Name, category, price, changes
- **Order logs**: Status transitions, tracking updates
- **Warranty logs**: Approval/rejection reasons, status changes
- **User logs**: Role changes, approval status, data modifications
- **Invoice logs**: Invoice type, customer details

### 🔒 **Security Features**
- IP address tracking for all admin actions
- Automatic timestamp recording
- Immutable log entries
- Admin authentication verification before logging

### 📊 **Indexed Fields**
Fast query performance on:
- `timestamp` - Time-based queries
- `adminId` - Filter by specific admin
- `action` - Filter by action type
- `entity` - Filter by entity type

---

## API Endpoints

### Get Admin Activity Logs
```http
GET /api/logs/admin-logs
Authorization: Bearer {admin_token}

Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 20)
- adminId: Filter by admin user ID
- action: Filter by action type
- entity: Filter by entity type
- startDate: Filter from date
- endDate: Filter to date
```

**Response Format:**
```json
{
  "logs": [
    {
      "_id": "...",
      "adminId": "...",
      "adminName": "John Admin",
      "adminEmail": "admin@telogica.com",
      "action": "UPDATE",
      "entity": "Product",
      "entityId": "...",
      "details": {
        "name": "Product Name",
        "changes": { ... }
      },
      "ipAddress": "192.168.1.1",
      "timestamp": "2025-12-08T10:30:00.000Z"
    }
  ],
  "total": 150,
  "totalPages": 8
}
```

---

## What's NOT Logged

To maintain focus on admin actions and reduce noise:

❌ **User Self-Service Actions**
- User registration
- User login/logout
- User password resets
- User profile updates
- User-initiated warranty registrations
- User-initiated orders

❌ **Automated System Actions**
- Payment gateway callbacks
- Scheduled tasks
- Email notifications
- Inventory auto-updates

❌ **Read-Only Operations**
- Viewing lists
- Searching
- Filtering
- Exporting data (unless it modifies records)

---

## Implementation Notes

### Logger Function
**File**: `Backend/utils/logger.js`

```javascript
const logAdminAction = async (req, action, entity, entityId, details)
```

**Usage Example:**
```javascript
await logAdminAction(req, 'UPDATE', 'Product', productId, {
  name: product.name,
  changes: req.body
});
```

### Validation
- Automatically validates admin role before logging
- Only logs if user is authenticated as admin
- Validates action and entity against allowed enums
- Fails silently to prevent blocking main operations

---

## Database Model

**File**: `Backend/models/AdminLog.js`

**Mongoose Schema:**
```javascript
{
  adminId: { type: ObjectId, ref: 'User', required: true },
  adminName: { type: String, required: true },
  adminEmail: String,
  action: { 
    type: String, 
    enum: ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT'],
    required: true 
  },
  entity: { 
    type: String, 
    enum: ['Product', 'Order', 'Warranty', 'Payment', 'User', 'Invoice'],
    required: true 
  },
  entityId: String,
  details: Mixed,
  ipAddress: String,
  timestamp: { type: Date, default: Date.now }
}
```

---

## Testing Checklist

✅ **Product Operations**
- [ ] Create product → logged
- [ ] Update product → logged
- [ ] Delete product → logged

✅ **Order Operations**
- [ ] Update order status → logged
- [ ] Add tracking link → logged

✅ **Warranty Operations**
- [ ] Approve warranty → logged
- [ ] Reject warranty → logged
- [ ] Update warranty → logged

✅ **User Operations**
- [ ] Create user → logged
- [ ] Update user → logged
- [ ] Delete user → logged
- [ ] Approve retailer → logged

✅ **Invoice Operations**
- [ ] Generate dropship invoice → logged

---

## Usage for Admins

### View Recent Activity
1. Login as admin
2. Navigate to Admin Dashboard → Activity Logs
3. View all recent admin actions with full details

### Filter Logs
- By admin name/email
- By action type (CREATE, UPDATE, DELETE, etc.)
- By entity (Product, Order, User, etc.)
- By date range

### Audit Trail
- Every change is permanently recorded
- Track who made what changes and when
- Accountability for all administrative actions

---

## Status: ✅ COMPLETE

All admin operations across Product, Order, Warranty, User, and Invoice management are now fully logged with comprehensive details.

**Last Updated**: December 8, 2025
