# FiiRE Meeting Room Booking System

A web application for managing meeting room bookings at FiiRE Incubation Center. Built with Next.js, MongoDB, and Tailwind CSS.

## Features

- User authentication with role-based access control
- Room management for administrators
- Booking system with approval workflow
- Real-time availability checking
- Calendar view for booking
- Different booking flows for incubated and external startups

## Tech Stack

- Frontend: Next.js 14 with App Router
- Styling: Tailwind CSS
- Database: MongoDB with Mongoose
- Authentication: NextAuth.js
- Calendar: react-calendar

## Prerequisites

- Node.js 18.x or later
- MongoDB database
- npm or yarn package manager

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd meeting-room
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## User Roles

1. Admin
   - Manage meeting rooms
   - View all bookings
   - Approve/reject booking requests
   - Filter bookings by date, room, and startup

2. Incubated Startup
   - Direct booking (no approval needed)
   - View room availability
   - View their bookings

3. External Startup
   - Booking requests require admin approval
   - View room availability
   - View their bookings

## API Routes

- `/api/auth/register` - User registration
- `/api/auth/login` - User login
- `/api/rooms` - Room management
- `/api/bookings` - Booking management
- `/api/bookings/user` - User-specific bookings

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
