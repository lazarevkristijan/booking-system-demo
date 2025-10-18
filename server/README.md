# Hair Salon Booking Platform - Backend API

A complete Node.js Express backend for managing hair salon bookings, employees, services, and clients.

## Features

-   **Employee Management**: CRUD operations and availability checking
-   **Service Management**: Manage services with pricing and duration
-   **Client Management**: Client database with booking history
-   **Booking System**: Advanced booking with multiple services support
-   **PostgreSQL Integration**: Using existing Supabase database schema
-   **RESTful API**: Clean REST endpoints with proper error handling

## Quick Start

### Prerequisites

-   Node.js 16+
-   PostgreSQL database (Supabase recommended)
-   npm or yarn

### Installation

1. Clone and navigate to backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DB_HOST=your-supabase-host
DB_PORT=5432
DB_NAME=postgres
DB_USER=your-username
DB_PASSWORD=your-password
PORT=3001
```

4. Start the server:

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Health Check

-   `GET /api/health` - Server health status

### Employees

-   `GET /api/employees` - List all employees
-   `GET /api/employees/:id` - Get single employee
-   `GET /api/employees/available?start_time=...&end_time=...` - Check availability
-   `POST /api/employees` - Create employee
-   `PUT /api/employees/:id` - Update employee
-   `DELETE /api/employees/:id` - Delete employee

### Services

-   `GET /api/services` - List all services
-   `GET /api/services/:id` - Get single service
-   `POST /api/services` - Create service
-   `PUT /api/services/:id` - Update service
-   `DELETE /api/services/:id` - Delete service

### Clients

-   `GET /api/clients` - List all clients (supports `?q=search`)
-   `GET /api/clients/:id` - Get single client
-   `GET /api/clients/:id/history` - Get client booking history
-   `POST /api/clients` - Create client
-   `PUT /api/clients/:id` - Update client
-   `DELETE /api/clients/:id` - Delete client

### Bookings

-   `GET /api/bookings` - List all bookings (supports `?start_date=...&end_date=...`)
-   `GET /api/bookings/:id` - Get single booking
-   `POST /api/bookings` - Create booking with multiple services
-   `PUT /api/bookings/:id` - Update booking
-   `DELETE /api/bookings/:id` - Delete booking

## Request/Response Examples

### Create Employee

```bash
POST /api/employees
Content-Type: application/json

{
  "name": "Alice Johnson"
}
```

### Create Service

```bash
POST /api/services
Content-Type: application/json

{
  "name": "Haircut",
  "duration": 30,
  "price": 25.00
}
```

### Create Client

```bash
POST /api/clients
Content-Type: application/json

{
  "full_name": "John Doe",
  "phone": "+1234567890"
}
```

### Create Booking with Multiple Services

```bash
POST /api/bookings
Content-Type: application/json

{
  "employee_id": 1,
  "client_id": 1,
  "start_time": "2024-01-20T09:00:00Z",
  "end_time": "2024-01-20T10:15:00Z",
  "service_ids": [1, 3],
  "price": 65.00
}
```

### Check Employee Availability

```bash
GET /api/employees/available?start_time=2024-01-20T09:00:00Z&end_time=2024-01-20T10:30:00Z
```

Response:

```json
[
	{
		"id": 1,
		"name": "Alice Johnson",
		"available": true
	},
	{
		"id": 2,
		"name": "Bob Smith",
		"available": false
	}
]
```

## Database Schema

The API works with the existing Supabase database schema:

-   `employees`
-   `services`
-   `clients`
-   `bookings`
-   `booking_services` (many-to-many join table)

## Error Handling

All endpoints return consistent error responses:

```json
{
	"error": "Error message describing what went wrong"
}
```

Common HTTP status codes:

-   `200` - Success
-   `201` - Created
-   `400` - Bad Request (validation errors)
-   `404` - Not Found
-   `500` - Грешка во серверот

## Business Logic

### Employee Availability

-   Checks for overlapping bookings in the requested time slot
-   Returns all employees with `available: true/false` status

### Booking Creation

-   Validates employee availability
-   Supports multiple services per booking
-   Automatically calculates total price if not provided
-   Uses database transactions for data consistency

### Cascade Protection

-   Prevents deletion of employees/services/clients with existing bookings
-   Maintains referential integrity

## Frontend Integration

This backend is designed to work seamlessly with the existing React frontend. Key integration points:

1. **Calendar Data**: `GET /api/bookings` provides all data needed for calendar display
2. **Booking Modal**: Employee availability and service data for multi-step booking form
3. **CRUD Operations**: All employee, service, and client management features
4. **Client Search**: Real-time client search in booking modal
5. **Booking History**: Complete client booking history with services

## Development

### Project Structure

```
backend/
├── server.js          # Main server setup
├── db.js             # Database connection
├── routes/           # API route modules
│   ├── index.js      # Route aggregator
│   ├── employees.js  # Employee endpoints
│   ├── services.js   # Service endpoints
│   ├── clients.js    # Client endpoints
│   └── bookings.js   # Booking endpoints
├── package.json      # Dependencies
├── .env.example      # Environment template
└── README.md         # This file
```

### Code Quality

-   Async/await for all database operations
-   Input validation on all endpoints
-   Transaction support for complex operations
-   Comprehensive error handling
-   Consistent response formatting

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Use environment variables for all configuration
3. Set up proper CORS origins for your frontend domain
4. Configure database connection pooling
5. Set up proper logging and monitoring

The backend is ready for deployment on platforms like Heroku, Railway, or any Node.js hosting service.
