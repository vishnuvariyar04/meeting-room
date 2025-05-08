'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import AddRoomModal from '../modals/AddRoomModal'
import EditRoomModal from '../modals/EditRoomModal'
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiCalendar, FiClock, FiUsers, FiInfo } from 'react-icons/fi'

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('rooms')
  const [bookingTab, setBookingTab] = useState('pending')
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false)
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRooms()
    fetchBookings()
  }, [])

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms')
      const data = await response.json()
      setRooms(data)
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings', {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }
      const data = await response.json()
      setBookings(data)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setError('Failed to load bookings')
    }
  }

  const handleAddRoom = async (roomData) => {
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(roomData),
      })

      if (response.ok) {
        fetchRooms()
        setIsAddRoomModalOpen(false)
      } else {
        const error = await response.json()
        alert(error.message || 'Error adding room')
      }
    } catch (error) {
      console.error('Error adding room:', error)
      alert('Error adding room')
    }
  }

  const handleEditRoom = async (roomId, roomData) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(roomData),
      })

      if (response.ok) {
        fetchRooms()
        setIsEditRoomModalOpen(false)
        setSelectedRoom(null)
      } else {
        const error = await response.json()
        alert(error.message || 'Error updating room')
      }
    } catch (error) {
      console.error('Error updating room:', error)
      alert('Error updating room')
    }
  }

  const handleDeleteRoom = async (roomId) => {
    if (!confirm('Are you sure you want to delete this room?')) {
      return
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        fetchRooms()
      } else {
        const error = await response.json()
        alert(error.message || 'Error deleting room')
      }
    } catch (error) {
      console.error('Error deleting room:', error)
      alert('Error deleting room')
    }
  }

  const handleApproveBooking = async (bookingId) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'approved' }),
      })

      if (response.ok) {
        fetchBookings()
      } else {
        const error = await response.json()
        alert(error.message || 'Error approving booking')
      }
    } catch (error) {
      console.error('Error approving booking:', error)
      alert('Error approving booking')
    }
  }

  const handleRejectBooking = async (bookingId) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'rejected' }),
      })

      if (response.ok) {
        fetchBookings()
      } else {
        const error = await response.json()
        alert(error.message || 'Error rejecting booking')
      }
    } catch (error) {
      console.error('Error rejecting booking:', error)
      alert('Error rejecting booking')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back, {session?.user?.name}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign out
          </button>
        </div>

        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('rooms')}
                className={`${
                  activeTab === 'rooms'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Rooms
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`${
                  activeTab === 'bookings'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Bookings
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'rooms' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Meeting Rooms</h2>
              <button
                onClick={() => setIsAddRoomModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <FiPlus className="w-5 h-5" />
                <span>Add Room</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <div
                  key={room._id}
                  className="border rounded-lg p-6 hover:shadow-lg transition-all duration-200 bg-white"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">{room.name}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRoom(room)
                          setIsEditRoomModalOpen(true)
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors duration-200"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{room.description}</p>
                  <div className="flex items-center text-gray-500 mb-4">
                    <FiUsers className="w-5 h-5 mr-2" />
                    <span>Capacity: {room.capacity} people</span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Amenities:</h4>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm flex items-center"
                        >
                          <FiCheck className="w-3 h-3 mr-1" />
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Booking Requests</h2>
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
                  <FiCalendar className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Booking Requests</h3>
                <p className="text-gray-500">There are no booking requests at the moment.</p>
              </div>
            ) : (
              <div>
                {/* Booking Status Tabs */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex flex-wrap sm:flex-nowrap gap-2 sm:gap-0 sm:space-x-8">
                    <button
                      onClick={() => setBookingTab('pending')}
                      className={`${
                        bookingTab === 'pending'
                          ? 'border-yellow-500 text-yellow-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm flex items-center justify-center w-full sm:w-auto`}
                    >
                      <span className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full mr-2"></span>
                      <span className="hidden sm:inline">Pending</span>
                      <span className="sm:hidden">Pending Requests</span>
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        {bookings.filter(b => b.status === 'pending').length}
                      </span>
                    </button>
                    <button
                      onClick={() => setBookingTab('approved')}
                      className={`${
                        bookingTab === 'approved'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm flex items-center justify-center w-full sm:w-auto`}
                    >
                      <span className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full mr-2"></span>
                      <span className="hidden sm:inline">Approved</span>
                      <span className="sm:hidden">Approved Bookings</span>
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {bookings.filter(b => b.status === 'approved').length}
                      </span>
                    </button>
                    <button
                      onClick={() => setBookingTab('completed')}
                      className={`${
                        bookingTab === 'completed'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm flex items-center justify-center w-full sm:w-auto`}
                    >
                      <span className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full mr-2"></span>
                      <span className="hidden sm:inline">Completed</span>
                      <span className="sm:hidden">Completed Bookings</span>
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {bookings.filter(b => {
                          if (b.status !== 'approved') return false;
                          const bookingDateTime = new Date(`${b.date}T${b.endTime}`);
                          return bookingDateTime < new Date();
                        }).length}
                      </span>
                    </button>
                    <button
                      onClick={() => setBookingTab('rejected')}
                      className={`${
                        bookingTab === 'rejected'
                          ? 'border-red-500 text-red-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm flex items-center justify-center w-full sm:w-auto`}
                    >
                      <span className="w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full mr-2"></span>
                      <span className="hidden sm:inline">Rejected</span>
                      <span className="sm:hidden">Rejected Bookings</span>
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        {bookings.filter(b => b.status === 'rejected').length}
                      </span>
                    </button>
                  </nav>
                </div>

                {/* Booking Content */}
                <div className="space-y-4">
                  {bookings
                    .filter(booking => {
                      if (bookingTab === 'completed') {
                        return booking.status === 'approved' && 
                          new Date(`${booking.date}T${booking.endTime}`) < new Date();
                      }
                      return booking.status === bookingTab;
                    })
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((booking) => (
                      <BookingCard
                        key={booking._id}
                        booking={booking}
                        onApprove={() => handleApproveBooking(booking._id)}
                        onReject={() => handleRejectBooking(booking._id)}
                      />
                    ))}
                  {bookings.filter(booking => {
                    if (bookingTab === 'completed') {
                      return booking.status === 'approved' && 
                        new Date(`${booking.date}T${booking.endTime}`) < new Date();
                    }
                    return booking.status === bookingTab;
                  }).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        {bookingTab === 'pending' && 'No pending requests'}
                        {bookingTab === 'approved' && 'No approved bookings'}
                        {bookingTab === 'completed' && 'No completed bookings'}
                        {bookingTab === 'rejected' && 'No rejected bookings'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AddRoomModal
        isOpen={isAddRoomModalOpen}
        onClose={() => setIsAddRoomModalOpen(false)}
        onAdd={handleAddRoom}
      />

      <EditRoomModal
        isOpen={isEditRoomModalOpen}
        onClose={() => {
          setIsEditRoomModalOpen(false)
          setSelectedRoom(null)
        }}
        onEdit={handleEditRoom}
        room={selectedRoom}
      />
    </div>
  )
}

const BookingCard = ({ booking, onApprove, onReject }) => {
  const isCompleted = booking.status === 'approved' && 
    new Date(`${booking.date}T${booking.endTime}`) < new Date();

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {booking.room?.name}
              </h3>
              <span
                className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-full ${
                  isCompleted
                    ? 'bg-blue-100 text-blue-800'
                    : booking.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : booking.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {isCompleted ? 'Completed' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
              <div className="flex items-center text-gray-600">
                <FiCalendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-500" />
                <span className="text-sm sm:text-base">
                  {new Date(booking.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <FiClock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-500" />
                <span className="text-sm sm:text-base">{booking.startTime} - {booking.endTime}</span>
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <div className="flex items-start">
                <FiUsers className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-500 mt-1" />
                <div>
                  <p className="text-sm sm:text-base text-gray-900 font-medium">{booking.user?.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500">{booking.user?.email}</p>
                  {booking.user?.startupName && (
                    <p className="text-xs sm:text-sm text-indigo-600 font-medium mt-1">
                      {booking.user.startupName}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {booking.purpose && (
              <div className="mt-3 sm:mt-4">
                <div className="flex items-start">
                  <FiInfo className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-500 mt-1" />
                  <p className="text-xs sm:text-sm text-gray-600 italic">
                    {booking.purpose}
                  </p>
                </div>
              </div>
            )}
          </div>
          {booking.status === 'pending' && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 sm:ml-4">
              <button
                onClick={onApprove}
                className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
              >
                <FiCheck className="w-4 h-4 mr-2" />
                Approve
              </button>
              <button
                onClick={onReject}
                className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 