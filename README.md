# Expense Management System

A comprehensive expense management system with multi-level approval workflows, OCR receipt processing, and multi-currency support.

## Features

### Authentication & User Management
- **Company Registration**: Auto-creates company with country-specific currency
- **Role-based Access**: Admin, Manager, and Employee roles
- **User Management**: Admins can create and manage users
- **Manager Assignment**: Assign managers to employees

### Expense Management
- **Multi-currency Support**: Submit expenses in any currency
- **Automatic Conversion**: Real-time currency conversion to company base currency
- **Receipt Upload**: Upload and attach receipts to expenses
- **OCR Processing**: Automatic text extraction from receipt images
- **Expense Categories**: Organized by categories (Food, Travel, etc.)

### Approval Workflows
- **Flexible Rules**: Configure approval rules per user
- **Sequential Approval**: Step-by-step approval process
- **Parallel Approval**: Multiple approvers with percentage-based approval
- **Manager Override**: Managers can be required as first approvers
- **Amount Thresholds**: Different rules based on expense amounts

### Dashboard & Analytics
- **Role-based Views**: Different dashboards for Admin, Manager, and Employee
- **Expense Statistics**: Visual summary of expense statuses
- **Approval History**: Complete audit trail of approvals/rejections
- **Real-time Updates**: Live status updates

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Tesseract.js** for OCR processing
- **Axios** for external API calls

### Frontend
- **React 18** with functional components
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Vite** for build tooling

### External APIs
- **REST Countries API** for country/currency data
- **Exchange Rate API** for currency conversion

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
MONGO_URI=mongodb://localhost:27017/expense-management
JWT_SECRET=your-secret-key-here
PORT=4000
```

4. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Usage

### Getting Started

1. **Sign Up**: Create a new company account
2. **Admin Setup**: Configure users and approval rules
3. **Submit Expenses**: Employees can submit expense claims
4. **Review & Approve**: Managers review and approve expenses

### User Roles

#### Admin
- Create and manage users
- Configure approval rules
- View all company expenses
- Override approvals

#### Manager
- Approve/reject expenses
- View team expenses
- Configure approval workflows

#### Employee
- Submit expense claims
- Upload receipts
- View personal expense history
- Track approval status

### Approval Rules Configuration

1. **Select User**: Choose which user the rule applies to
2. **Set Thresholds**: Define amount thresholds
3. **Configure Approvers**: Add approvers and set sequence
4. **Manager Settings**: Enable/disable manager approval requirement
5. **Percentage Rules**: Set minimum approval percentage for parallel approval

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Company registration
- `POST /api/auth/login` - User login
- `GET /api/auth/countries` - Get countries list

### Expenses
- `GET /api/expenses` - Get expenses (filtered by role)
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/:id` - Get expense details
- `POST /api/expenses/:id/submit` - Submit expense for approval
- `POST /api/expenses/:id/approve` - Approve expense
- `POST /api/expenses/:id/reject` - Reject expense
- `POST /api/expenses/:id/upload-receipt` - Upload receipt with OCR

### Admin
- `GET /api/admin/users/:companyId` - Get company users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `GET /api/admin/rules/:companyId` - Get approval rules
- `POST /api/admin/rules` - Create approval rule
- `PUT /api/admin/rules/:id` - Update approval rule
- `DELETE /api/admin/rules/:id` - Delete approval rule

## Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ['Admin', 'Manager', 'Employee'],
  managerId: ObjectId (ref: User),
  companyId: ObjectId (ref: Company),
  isActive: Boolean
}
```

### Company Model
```javascript
{
  name: String,
  country: String,
  defaultCurrency: String,
  currencySymbol: String,
  createdBy: ObjectId (ref: User)
}
```

### Expense Model
```javascript
{
  description: String,
  category: String,
  amount: Number,
  currency: String,
  paidBy: ['Cash', 'Card', 'Company'],
  remarks: String,
  expenseDate: Date,
  submittedBy: ObjectId (ref: User),
  companyId: ObjectId (ref: Company),
  status: ['Draft', 'WaitingApproval', 'Approved', 'Rejected'],
  approvers: [ObjectId (ref: User)],
  approvals: [ApprovalSchema],
  isManagerApprover: Boolean,
  approvalSequence: Boolean,
  minApprovalPercentage: Number,
  amountInCompanyCurrency: Number,
  exchangeRateUsed: Number,
  receipts: [ReceiptSchema]
}
```

### Rule Model
```javascript
{
  companyId: ObjectId (ref: Company),
  userId: ObjectId (ref: User),
  name: String,
  description: String,
  category: String,
  isManagerApprover: Boolean,
  approvers: [ObjectId (ref: User)],
  approvalSequence: Boolean,
  minApprovalPercentage: Number,
  amountThreshold: Number,
  isActive: Boolean
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support


For support and questions, please open an issue in the repository.
