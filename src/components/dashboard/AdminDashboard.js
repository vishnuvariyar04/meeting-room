'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import AddRoomModal from '../modals/AddRoomModal'
import EditRoomModal from '../modals/EditRoomModal'
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiCalendar, FiClock, FiUsers, FiInfo, FiImage, FiChevronLeft, FiChevronRight, FiBarChart2, FiPieChart, FiTrendingUp } from 'react-icons/fi'

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('rooms')
  const [bookingTab, setBookingTab] = useState('pending')
  const [selectedBookingMonth, setSelectedBookingMonth] = useState(new Date().toISOString().slice(0, 7))
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false)
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [error, setError] = useState(null)
  const [highlightedBookingId, setHighlightedBookingId] = useState(null)
  const [activeImageIndices, setActiveImageIndices] = useState({})
  const [analyticsData, setAnalyticsData] = useState({
    totalBookings: 0,
    totalHours: 0,
    userStats: [],
    roomStats: [],
    recentBookings: [],
    selectedMonth: ''
  })
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [userTypeTab, setUserTypeTab] = useState('incubated');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Get URL parameters
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    const status = params.get('status')
    const bookingId = params.get('bookingId')
    const error = params.get('error')

    if (tab === 'bookings') {
      setActiveTab('bookings')
      if (status) {
        setBookingTab(status)
      }
      if (bookingId) {
        setHighlightedBookingId(bookingId)
        // Remove highlight after 5 seconds
        setTimeout(() => setHighlightedBookingId(null), 5000)
      }
      if (error) {
        setError(error)
        // Clear error after 5 seconds
        setTimeout(() => setError(null), 5000)
      }
    }

    fetchRooms()
    fetchBookings()
    fetchAllUsers()
  }, [])

  useEffect(() => {
    // Update pending count whenever bookings change
    const count = bookings.filter(b => b.status === 'pending').length;
    setPendingCount(count);
  }, [bookings]);

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

  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setAllUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to load users')
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

  const handlePrevImage = (roomId, e) => {
    e.stopPropagation()
    setActiveImageIndices(prev => {
      const currentIndex = prev[roomId] || 0
      const room = rooms.find(r => r._id === roomId)
      const newIndex = currentIndex === 0 ? room.images.length - 1 : currentIndex - 1
      return { ...prev, [roomId]: newIndex }
    })
  }

  const handleNextImage = (roomId, e) => {
    e.stopPropagation()
    setActiveImageIndices(prev => {
      const currentIndex = prev[roomId] || 0
      const room = rooms.find(r => r._id === roomId)
      const newIndex = currentIndex === room.images.length - 1 ? 0 : currentIndex + 1
      return { ...prev, [roomId]: newIndex }
    })
  }

  const calculateAnalytics = useCallback(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);

    // Filter bookings for selected month
    const monthlyBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= firstDayOfMonth && bookingDate <= lastDayOfMonth;
    });

    // Calculate total bookings and hours for selected month
    const totalBookings = monthlyBookings.length;
    let totalHours = 0;

    // User statistics
    const userStats = {};
    const roomStats = {};
    const monthlyStats = {};

    // Initialize user stats for all users first
    allUsers.forEach(user => {
      if (user.role !== 'admin') { // Exclude admin users
        userStats[user._id] = {
          name: user.name,
          email: user.email,
          role: user.role,
          startupName: user.startupName || '-',
          totalBookings: 0,
          totalHours: 0,
          bookings: [],
          statusBreakdown: {
            pending: { count: 0, hours: 0 },
            approved: { count: 0, hours: 0 },
            rejected: { count: 0, hours: 0 }
          }
        };
      }
    });

    // Update user stats with booking data
    monthlyBookings.forEach(booking => {
      // Calculate hours for each booking
      const [startHour, startMinute] = booking.startTime.split(':').map(Number);
      const [endHour, endMinute] = booking.endTime.split(':').map(Number);
      const bookingHours = (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60;
      
      // Only add hours to total if booking is pending or approved
      if (booking.status === 'pending' || booking.status === 'approved') {
        totalHours += bookingHours;
      }

      // Update user stats if user exists
      if (userStats[booking.user?._id]) {
        const userStat = userStats[booking.user?._id];
        userStat.totalBookings++;
        // Only add hours to user total if booking is pending or approved
        if (booking.status === 'pending' || booking.status === 'approved') {
          userStat.totalHours += bookingHours;
        }
        userStat.bookings.push(booking);
        
        // Update status breakdown
        const status = booking.status || 'pending';
        if (userStat.statusBreakdown[status]) {
          userStat.statusBreakdown[status].count++;
          userStat.statusBreakdown[status].hours += bookingHours;
        }
      }

      // Room statistics
      if (!roomStats[booking.room?._id]) {
        roomStats[booking.room?._id] = {
          name: booking.room?.name || 'Unknown Room',
          totalBookings: 0,
          totalHours: 0,
          bookings: []
        };
      }
      roomStats[booking.room?._id].totalBookings++;
      // Only add hours to room total if booking is pending or approved
      if (booking.status === 'pending' || booking.status === 'approved') {
        roomStats[booking.room?._id].totalHours += bookingHours;
      }
      roomStats[booking.room?._id].bookings.push(booking);
    });

    // Convert to arrays and sort
    const userStatsArray = Object.values(userStats).sort((a, b) => b.totalHours - a.totalHours);
    const roomStatsArray = Object.values(roomStats).sort((a, b) => b.totalHours - a.totalHours);

    // Get recent bookings for the selected month
    const recentBookings = [...monthlyBookings]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    setAnalyticsData({
      totalBookings,
      totalHours,
      userStats: userStatsArray,
      roomStats: roomStatsArray,
      recentBookings,
      selectedMonth: new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
    });
  }, [bookings, selectedMonth, allUsers]);

  useEffect(() => {
    if (bookings.length > 0) {
      calculateAnalytics();
    }
  }, [calculateAnalytics]);

  // Generate month options for the current year
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Add all months of the current year
    for (let month = 0; month < 12; month++) {
      const date = new Date(currentYear, month, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <Image 
                  src="/Fiire_logo.jpeg" 
                  alt="Fiire Logo" 
                  width={48}
                  height={48}
                  className="object-contain sm:w-16 sm:h-16"
                  priority
                />
                <div className="h-12 sm:h-16 w-px bg-gray-200"></div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs sm:text-sm text-gray-500">
                    Welcome back, <span className="font-semibold text-[#FF6B00]">{session?.user?.name}</span>
                  </p>
                  <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-[#FF6B00] to-[#FF8F3F] text-white rounded-full">
                    Admin
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="w-full sm:w-auto group flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-[#FFF5EB] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B00] transition-all duration-200 shadow-sm hover:shadow"
            >
              <span className="text-sm font-medium text-gray-700 group-hover:text-[#FF6B00] transition-colors">Sign out</span>
              <svg className="w-4 h-4 text-gray-500 group-hover:text-[#FF6B00] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-3">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm sm:text-base">{error}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-2 border border-gray-100">
            <nav className="flex flex-wrap sm:flex-nowrap gap-2">
              <button
                onClick={() => setActiveTab('rooms')}
                className={`${
                  activeTab === 'rooms'
                    ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF8F3F] text-white'
                    : 'text-gray-500 hover:text-[#FF6B00] hover:bg-[#FFF5EB]'
                } flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center space-x-2`}
              >
                <FiImage className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Rooms</span>
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`${
                  activeTab === 'bookings'
                    ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF8F3F] text-white'
                    : 'text-gray-500 hover:text-[#FF6B00] hover:bg-[#FFF5EB]'
                } flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center space-x-2 relative`}
              >
                <FiCalendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Bookings</span>
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#FF6B00] opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 sm:h-5 sm:w-5 bg-[#FF8F3F] items-center justify-center">
                      <span className="text-[10px] sm:text-xs font-bold text-white">
                        {pendingCount}
                      </span>
                    </span>
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`${
                  activeTab === 'analytics'
                    ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF8F3F] text-white'
                    : 'text-gray-500 hover:text-[#FF6B00] hover:bg-[#FFF5EB]'
                } flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center space-x-2`}
              >
                <FiBarChart2 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Analytics</span>
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'rooms' && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Meeting Rooms</h2>
                <p className="mt-1 text-sm text-gray-500">Manage and monitor your meeting spaces</p>
              </div>
              <button
                onClick={() => setIsAddRoomModalOpen(true)}
                className="w-full sm:w-auto group flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#FF6B00] to-[#FF8F3F] text-white rounded-xl hover:from-[#FF8F3F] hover:to-[#FF6B00] transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <FiPlus className="w-5 h-5" />
                <span className="font-medium">Add Room</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {rooms.map((room) => (
                <div
                  key={room._id}
                  className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {room.images && room.images.length > 0 ? (
                    <div className="relative h-48 sm:h-56 overflow-hidden">
                      <img
                        src={room.images[activeImageIndices[room._id] || 0]}
                        alt={`${room.name} - Room Image ${(activeImageIndices[room._id] || 0) + 1}`}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                      />
                      {room.images.length > 1 && (
                        <>
                          <button
                            onClick={(e) => handlePrevImage(room._id, e)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                          >
                            <FiChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => handleNextImage(room._id, e)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                          >
                            <FiChevronRight className="w-5 h-5" />
                          </button>
                          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                            {room.images.map((_, index) => (
                              <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                                  (activeImageIndices[room._id] || 0) === index ? 'bg-white' : 'bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="h-48 sm:h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <FiImage className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  <div className="p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{room.name}</h3>
                        <div className="flex items-center text-gray-500">
                          <FiUsers className="w-4 h-4 mr-2" />
                          <span className="text-sm">Capacity: {room.capacity} people</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRoom(room)
                            setIsEditRoomModalOpen(true)
                          }}
                          className="p-2 text-[#FF6B00] hover:bg-[#FFF5EB] rounded-lg transition-colors duration-200"
                        >
                          <FiEdit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2 text-sm sm:text-base">{room.description}</p>
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {room.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-[#FFF5EB] to-[#FFE4CC] text-[#FF6B00] rounded-lg text-xs sm:text-sm font-medium flex items-center shadow-sm hover:shadow-md transition-all duration-200 border border-[#FFE4CC]/50 hover:border-[#FF6B00]/20"
                          >
                            <FiCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 text-[#FF8F3F]" />
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Booking Requests</h2>
                <p className="mt-1 text-sm text-gray-500">Manage and monitor meeting room bookings</p>
              </div>
              <div className="w-full sm:w-auto">
                <div className="bg-gradient-to-r from-[#FFF5EB] to-[#FFE4CC] p-1 rounded-xl shadow-sm">
                  <div className="flex items-center space-x-2 bg-white rounded-lg p-1">
                    <FiCalendar className="w-4 h-4 text-[#FF6B00]" />
                    <select
                      value={selectedBookingMonth}
                      onChange={(e) => setSelectedBookingMonth(e.target.value)}
                      className="block w-full pl-2 pr-8 py-1.5 text-sm border-0 focus:ring-0 focus:outline-none bg-transparent text-gray-900 cursor-pointer"
                    >
                      {getMonthOptions().map(option => (
                        <option key={option.value} value={option.value} className="text-gray-900">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            {bookings.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-50 mb-6">
                  <FiCalendar className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Booking Requests</h3>
                <p className="text-gray-500 max-w-md mx-auto">There are no booking requests at the moment. New requests will appear here.</p>
              </div>
            ) : (
              <div>
                {/* Booking Status Tabs */}
                <div className="bg-white rounded-xl shadow-sm p-2 mb-8 border border-gray-100">
                  <nav className="flex flex-wrap sm:flex-nowrap gap-2">
                    <button
                      onClick={() => setBookingTab('pending')}
                      className={`${
                        bookingTab === 'pending'
                          ? 'bg-[#FFF5EB] text-[#FF6B00] border-[#FFE4CC]'
                          : 'text-gray-500 hover:text-[#FF6B00] hover:bg-[#FFF5EB] border-transparent'
                      } flex-1 sm:flex-none px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2`}
                    >
                      <span className="w-2 h-2 bg-[#FF6B00] rounded-full"></span>
                      <span>Pending</span>
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-[#FFE4CC] text-[#FF6B00] rounded-full">
                        {pendingCount}
                      </span>
                    </button>
                    <button
                      onClick={() => setBookingTab('approved')}
                      className={`${
                        bookingTab === 'approved'
                          ? 'bg-[#E6F4EA] text-[#1E7E34] border-[#C6E7CE]'
                          : 'text-gray-500 hover:text-[#1E7E34] hover:bg-[#E6F4EA] border-transparent'
                      } flex-1 sm:flex-none px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2`}
                    >
                      <span className="w-2 h-2 bg-[#1E7E34] rounded-full"></span>
                      <span>Approved</span>
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-[#C6E7CE] text-[#1E7E34] rounded-full">
                        {bookings.filter(b => {
                          const bookingDate = new Date(b.date);
                          const [year, month] = selectedBookingMonth.split('-').map(Number);
                          return b.status === 'approved' && 
                                 bookingDate.getFullYear() === year && 
                                 bookingDate.getMonth() === month - 1;
                        }).length}
                      </span>
                    </button>
                    <button
                      onClick={() => setBookingTab('completed')}
                      className={`${
                        bookingTab === 'completed'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-transparent'
                      } flex-1 sm:flex-none px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2`}
                    >
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      <span>Completed</span>
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {bookings.filter(b => {
                          const bookingDate = new Date(b.date);
                          const [year, month] = selectedBookingMonth.split('-').map(Number);
                          return b.status === 'approved' && 
                                 bookingDate.getFullYear() === year && 
                                 bookingDate.getMonth() === month - 1 &&
                                 new Date(`${b.date}T${b.endTime}`) < new Date();
                        }).length}
                      </span>
                    </button>
                    <button
                      onClick={() => setBookingTab('rejected')}
                      className={`${
                        bookingTab === 'rejected'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-transparent'
                      } flex-1 sm:flex-none px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2`}
                    >
                      <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                      <span>Rejected</span>
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        {bookings.filter(b => {
                          const bookingDate = new Date(b.date);
                          const [year, month] = selectedBookingMonth.split('-').map(Number);
                          return b.status === 'rejected' && 
                                 bookingDate.getFullYear() === year && 
                                 bookingDate.getMonth() === month - 1;
                        }).length}
                      </span>
                    </button>
                  </nav>
                </div>

                {/* Booking Content */}
                <div className="space-y-6">
                  {bookings
                    .filter(booking => {
                      const bookingDate = new Date(booking.date);
                      const [year, month] = selectedBookingMonth.split('-').map(Number);
                      const isInSelectedMonth = bookingDate.getFullYear() === year && 
                                             bookingDate.getMonth() === month - 1;
                      
                      // Always show pending requests regardless of month
                      if (bookingTab === 'pending') {
                        return booking.status === 'pending';
                      }
                      
                      // For other statuses, check if booking is in selected month
                      if (!isInSelectedMonth) return false;
                      
                      if (bookingTab === 'completed') {
                        return booking.status === 'approved' && 
                          new Date(`${booking.date}T${booking.endTime}`) < new Date();
                      }
                      return booking.status === bookingTab;
                    })
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((booking) => (
                      <div
                        key={booking._id}
                        className={`bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 ${
                          highlightedBookingId === booking._id ? 'ring-2 ring-indigo-500' : ''
                        }`}
                      >
                        <BookingCard
                          booking={booking}
                          onApprove={() => handleApproveBooking(booking._id)}
                          onReject={() => handleRejectBooking(booking._id)}
                        />
                      </div>
                    ))}
                  {bookings.filter(booking => {
                    const bookingDate = new Date(booking.date);
                    const [year, month] = selectedBookingMonth.split('-').map(Number);
                    const isInSelectedMonth = bookingDate.getFullYear() === year && 
                                           bookingDate.getMonth() === month - 1;
                    
                    // Always show pending requests regardless of month
                    if (bookingTab === 'pending') {
                      return booking.status === 'pending';
                    }
                    
                    // For other statuses, check if booking is in selected month
                    if (!isInSelectedMonth) return false;
                    
                    if (bookingTab === 'completed') {
                      return booking.status === 'approved' && 
                        new Date(`${booking.date}T${booking.endTime}`) < new Date();
                    }
                    return booking.status === bookingTab;
                  }).length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        <FiCalendar className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">
                        {bookingTab === 'pending' && 'No pending requests for this month'}
                        {bookingTab === 'approved' && 'No approved bookings for this month'}
                        {bookingTab === 'completed' && 'No completed bookings for this month'}
                        {bookingTab === 'rejected' && 'No rejected bookings for this month'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl p-4 sm:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 space-y-4 md:space-y-0">
              <div>
                <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
                <p className="text-sm sm:text-base text-gray-600">Comprehensive insights into your meeting room usage</p>
              </div>
              <div className="w-full sm:w-auto flex items-center space-x-4 bg-white p-2 rounded-xl shadow-sm">
                <label htmlFor="month-select" className="text-sm font-medium text-gray-700">Select Month:</label>
                <select
                  id="month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="block w-full sm:w-48 pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-lg bg-white text-gray-900 shadow-sm"
                >
                  {getMonthOptions().map(option => (
                    <option key={option.value} value={option.value} className="text-gray-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
              <div className="bg-white rounded-2xl p-4 sm:p-8 text-gray-900 transform hover:scale-105 transition-transform duration-300 shadow-lg border border-[#FFE4CC]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#FF6B00] text-sm font-medium mb-2">Total Bookings</p>
                    <h3 className="text-2xl sm:text-4xl font-bold">{analyticsData.totalBookings}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm mt-2">{analyticsData.selectedMonth}</p>
                  </div>
                  <div className="bg-[#FFF5EB] p-3 sm:p-4 rounded-xl">
                    <FiCalendar className="w-6 h-6 sm:w-8 sm:h-8 text-[#FF6B00]" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-8 text-gray-900 transform hover:scale-105 transition-transform duration-300 shadow-lg border border-[#E6F4EA]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#1E7E34] text-sm font-medium mb-2">Total Hours Booked</p>
                    <h3 className="text-2xl sm:text-4xl font-bold">{analyticsData.totalHours.toFixed(1)}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm mt-2">{analyticsData.selectedMonth}</p>
                  </div>
                  <div className="bg-[#E6F4EA] p-3 sm:p-4 rounded-xl">
                    <FiClock className="w-6 h-6 sm:w-8 sm:h-8 text-[#1E7E34]" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-8 text-gray-900 transform hover:scale-105 transition-transform duration-300 shadow-lg border border-[#FFE4CC]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#FF6B00] text-sm font-medium mb-2">Active Users</p>
                    <h3 className="text-2xl sm:text-4xl font-bold">{analyticsData.userStats.length}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm mt-2">{analyticsData.selectedMonth}</p>
                  </div>
                  <div className="bg-[#FFF5EB] p-3 sm:p-4 rounded-xl">
                    <FiUsers className="w-6 h-6 sm:w-8 sm:h-8 text-[#FF6B00]" />
                  </div>
                </div>
              </div>
            </div>

            {/* User Statistics */}
            <div className="mb-8 sm:mb-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">User Statistics</h3>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">Detailed breakdown of user booking patterns</p>
                </div>
                <div className="w-full sm:w-auto flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="w-full sm:w-auto bg-white p-1 rounded-xl shadow-sm">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setUserTypeTab('incubated')}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          userTypeTab === 'incubated'
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Incubated Users
                      </button>
                      <button
                        onClick={() => setUserTypeTab('external')}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          userTypeTab === 'external'
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        External Users
                      </button>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto bg-indigo-50 px-4 py-2 rounded-lg">
                    <p className="text-indigo-700 text-sm font-medium">
                      Total {userTypeTab === 'incubated' ? 'Incubated' : 'External'} Users: {
                        analyticsData.userStats.filter(user => 
                          userTypeTab === 'incubated' ? user.role === 'incubated' : user.role === 'external'
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                {/* User List Section - 5 columns */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900">User Directory</h4>
                      <div className="bg-white px-3 py-1 rounded-lg shadow-sm">
                        <p className="text-sm font-medium text-indigo-600">
                          {analyticsData.userStats.filter(user => 
                            userTypeTab === 'incubated' ? user.role === 'incubated' : user.role === 'external'
                          ).length} Users
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="max-h-[400px] sm:max-h-[600px] overflow-y-auto custom-scrollbar">
                    <div className="divide-y divide-gray-200">
                      {analyticsData.userStats
                        .filter(user => userTypeTab === 'incubated' ? user.role === 'incubated' : user.role === 'external')
                        .map((user, index) => (
                          <div key={index} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                                  {user.name.charAt(0)}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                  <div>
                                    <h5 className="text-sm font-semibold text-gray-900">{user.name}</h5>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                  </div>
                                  {user.startupName && user.startupName !== '-' && (
                                    <span className="mt-2 sm:mt-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                      {user.startupName}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-2 flex items-center space-x-3">
                                  <div className="flex items-center text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                    <FiCalendar className="w-3 h-3 mr-1 text-indigo-500" />
                                    <span className="font-medium">{user.totalBookings}</span>
                                  </div>
                                  <div className="flex items-center text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                    <FiClock className="w-3 h-3 mr-1 text-indigo-500" />
                                    <span className="font-medium">{user.totalHours.toFixed(1)}h</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Statistics Section - 7 columns */}
                <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                  {/* Overall Statistics Card */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">Overall Statistics</h4>
                        <p className="text-xs text-gray-500 mt-1">{analyticsData.selectedMonth}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-indigo-100 p-2 rounded-lg">
                            <FiCalendar className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600">Total Bookings</p>
                            <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
                              {analyticsData.userStats
                                .filter(user => userTypeTab === 'incubated' ? user.role === 'incubated' : user.role === 'external')
                                .reduce((sum, user) => sum + user.totalBookings, 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <FiClock className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600">Total Hours</p>
                            <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
                              {analyticsData.userStats
                                .filter(user => userTypeTab === 'incubated' ? user.role === 'incubated' : user.role === 'external')
                                .reduce((sum, user) => sum + user.totalHours, 0).toFixed(1)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Breakdown Card */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                      <h4 className="text-base font-semibold text-gray-900">Status Breakdown</h4>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-yellow-400 mr-1"></div>
                          <span className="text-xs text-gray-600">Pending</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-green-400 mr-1"></div>
                          <span className="text-xs text-gray-600">Approved</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-red-400 mr-1"></div>
                          <span className="text-xs text-gray-600">Rejected</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {analyticsData.userStats
                        .filter(user => userTypeTab === 'incubated' ? user.role === 'incubated' : user.role === 'external')
                        .map((user, index) => (
                          <div key={index} className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                  {user.name.charAt(0)}
                                </div>
                                <div>
                                  <h5 className="text-sm font-medium text-gray-900">{user.name}</h5>
                                  <p className="text-xs text-gray-500">{user.totalBookings} bookings</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              {/* Status Bars */}
                              <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">Pending</span>
                                    <span className="font-semibold text-gray-900">{user.statusBreakdown.pending.count}</span>
                                  </div>
                                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                                      style={{ 
                                        width: user.totalBookings > 0 
                                          ? `${(user.statusBreakdown.pending.count / user.totalBookings) * 100}%`
                                          : '0%',
                                        minWidth: user.statusBreakdown.pending.count > 0 ? '4px' : '0'
                                      }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">Approved</span>
                                    <span className="font-semibold text-gray-900">{user.statusBreakdown.approved.count}</span>
                                  </div>
                                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-green-400 rounded-full transition-all duration-500"
                                      style={{ 
                                        width: user.totalBookings > 0
                                          ? `${(user.statusBreakdown.approved.count / user.totalBookings) * 100}%`
                                          : '0%',
                                        minWidth: user.statusBreakdown.approved.count > 0 ? '4px' : '0'
                                      }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">Rejected</span>
                                    <span className="font-semibold text-gray-900">{user.statusBreakdown.rejected.count}</span>
                                  </div>
                                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-red-400 rounded-full transition-all duration-500"
                                      style={{ 
                                        width: user.totalBookings > 0
                                          ? `${(user.statusBreakdown.rejected.count / user.totalBookings) * 100}%`
                                          : '0%',
                                        minWidth: user.statusBreakdown.rejected.count > 0 ? '4px' : '0'
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Recent Activity Card */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-lg">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Recent Activity</h4>
                    <div className="space-y-3">
                      {analyticsData.userStats
                        .filter(user => userTypeTab === 'incubated' ? user.role === 'incubated' : user.role === 'external')
                        .map((user, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <div className="h-6 w-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center text-white font-bold text-xs">
                                {user.name.charAt(0)}
                              </div>
                              <h5 className="text-sm font-medium text-gray-900">{user.name}</h5>
                            </div>
                            <div className="space-y-1.5">
                              {user.bookings.slice(0, 2).map((booking, idx) => (
                                <div key={idx} className="bg-gray-50 p-2 rounded-lg">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-gray-900">{booking.room?.name}</span>
                                    <span className={`mt-1 sm:mt-0 px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                                      booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(booking.date).toLocaleDateString()} • {booking.startTime} - {booking.endTime}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove();
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject();
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FiCalendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{booking.room?.name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-full ${
                    isCompleted
                      ? 'bg-blue-100 text-blue-800'
                      : booking.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : booking.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {isCompleted ? 'Completed' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                  {booking.user?.startupName && (
                    <span className="px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full">
                      {booking.user.startupName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <FiCalendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-900">
                  {new Date(booking.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Date</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <FiClock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-900">{booking.startTime} - {booking.endTime}</p>
                <p className="text-xs sm:text-sm text-gray-500">Time</p>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 sm:p-4 bg-gray-50 rounded-xl mb-4">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
              <FiUsers className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-900">{booking.user?.name}</p>
              <p className="text-xs sm:text-sm text-gray-500">{booking.user?.email}</p>
            </div>
          </div>

          {booking.purpose && (
            <div className="flex items-start space-x-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <FiInfo className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1">Purpose</p>
                <p className="text-xs sm:text-sm text-gray-600 italic">
                  {booking.purpose}
                </p>
              </div>
            </div>
          )}
        </div>

        {booking.status === 'pending' && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:ml-4">
            <button
              onClick={handleApprove}
              disabled={isApproving || isRejecting}
              className="group flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApproving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-xs sm:text-sm font-medium">Approving...</span>
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm font-medium">Approve</span>
                </>
              )}
            </button>
            <button
              onClick={handleReject}
              disabled={isApproving || isRejecting}
              className="group flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRejecting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-xs sm:text-sm font-medium">Rejecting...</span>
                </>
              ) : (
                <>
                  <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm font-medium">Reject</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 