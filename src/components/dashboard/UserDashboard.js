'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { FiCalendar, FiClock, FiUsers, FiInfo, FiCheck, FiImage, FiChevronLeft, FiChevronRight, FiHome, FiList } from 'react-icons/fi'
import * as React from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import dayjs from 'dayjs'
import Image from 'next/image'

// Helper function to calculate hours between two times
const calculateHours = (startTime, endTime) => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  return (endTotalMinutes - startTotalMinutes) / 60;
};

export default function UserDashboard() {
  const { data: session } = useSession()
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('book')
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [availableRooms, setAvailableRooms] = useState([])
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([])
  const [error, setError] = useState(null)
  const [purpose, setPurpose] = useState({})
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [roomDate, setRoomDate] = useState(dayjs())
  const [roomAvailableSlots, setRoomAvailableSlots] = useState([])
  const [roomPurpose, setRoomPurpose] = useState('')
  const [roomSelectedSlots, setRoomSelectedSlots] = useState([])
  const [showAvailableRooms, setShowAvailableRooms] = useState(false)
  const [showRoomDetails, setShowRoomDetails] = useState(false)
  const [roomFilters, setRoomFilters] = useState({
    capacity: '',
    amenities: [],
    searchQuery: ''
  })
  const [activeImageIndices, setActiveImageIndices] = useState({})
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'))

  useEffect(() => {
    fetchRooms()
    fetchBookings()
  }, [])

  const fetchAvailableRooms = useCallback(async () => {
    try {
      const response = await fetch('/api/rooms/available', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate.format('YYYY-MM-DD'),
          timeSlots: selectedTimeSlots
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to fetch available rooms')
      }
      const data = await response.json()
      setAvailableRooms(data)
    } catch (error) {
      console.error('Error fetching available rooms:', error)
      setError('Failed to load available rooms')
    }
  }, [selectedDate, selectedTimeSlots])

  useEffect(() => {
    if (selectedDate && selectedTimeSlots.length > 0) {
      fetchAvailableRooms()
    }
  }, [selectedDate, selectedTimeSlots, fetchAvailableRooms])

  useEffect(() => {
    if (selectedRoom) {
      fetchRoomTimeSlots(selectedRoom._id, roomDate)
    }
  }, [roomDate, selectedRoom])

  useEffect(() => {
    if (activeTab === 'rooms') {
      setRoomFilters({
        capacity: '',
        amenities: [],
        searchQuery: ''
      })
    }
  }, [activeTab])

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

  const fetchRoomTimeSlots = async (roomId, date) => {
    try {
      const response = await fetch('/api/rooms/time-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          date: date.format('YYYY-MM-DD')
        }),
      })
      if (!response.ok) throw new Error('Failed to fetch time slots')
      const data = await response.json()
      
      // Filter out past slots for today
      const now = new Date()
      const isToday = date.format('YYYY-MM-DD') === now.toISOString().split('T')[0]
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()

      const filteredSlots = data.filter(slot => {
        if (!isToday) return true
        
        const [slotHour, slotMinute] = slot.startTime.split(':').map(Number)
        if (slotHour < currentHour) return false
        if (slotHour === currentHour && slotMinute <= currentMinute) return false
        return true
      })

      setRoomAvailableSlots(filteredSlots)
    } catch (error) {
      setRoomAvailableSlots([])
    }
  }

  const generateTimeSlots = () => {
    const slots = []
    const now = new Date()
    const isToday = selectedDate.format('YYYY-MM-DD') === now.toISOString().split('T')[0]
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    for (let hour = 9; hour < 18; hour++) {
      // For today's slots, check if the slot is in the past or within 30 minutes
      if (isToday) {
        // Calculate if the slot is within 30 minutes from now
        const slotTime = hour * 60 // Convert hour to minutes
        const currentTimeInMinutes = currentHour * 60 + currentMinute
        const timeUntilSlot = slotTime - currentTimeInMinutes

        if (timeUntilSlot <= 30) { // Changed from < to <= to be more precise
          continue // Skip slots that are 30 minutes or less away
        }
      }

      // Add first half-hour slot
      if (!(isToday && hour === currentHour && currentMinute >= 0 && currentMinute < 30)) {
        slots.push({
          startTime: `${hour.toString().padStart(2, '0')}:00`,
          endTime: `${hour.toString().padStart(2, '0')}:30`
        })
      }

      // Add second half-hour slot
      if (hour < 17 && !(isToday && hour === currentHour && currentMinute >= 30)) {
        slots.push({
          startTime: `${hour.toString().padStart(2, '0')}:30`,
          endTime: `${(hour + 1).toString().padStart(2, '0')}:00`
        })
      }
    }
    return slots
  }

  const handleTimeSlotSelect = (slot) => {
    setSelectedTimeSlots(prev => {
      const isSelected = prev.some(s => s.startTime === slot.startTime)
      if (isSelected) {
        return prev.filter(s => s.startTime !== slot.startTime)
      }
      return [...prev, slot]
    })
  }

  const handleBookRoom = async (roomId) => {
    try {
      if (!purpose[roomId]?.trim()) {
        alert('Please provide a purpose for the booking')
        return
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          roomId,
          date: selectedDate.format('YYYY-MM-DD'),
          timeSlots: selectedTimeSlots,
          purpose: purpose[roomId].trim()
        }),
      })

      if (response.ok) {
        const booking = await response.json()
        fetchBookings()
        setSelectedTimeSlots([])
        setAvailableRooms([])
        setPurpose({})
        if (booking.status === 'approved') {
          alert('Room booked successfully!')
        } else if (booking.status === 'pending') {
          alert('Booking request sent! Admin approval needed.')
        } else {
          alert('Booking submitted.')
        }
      } else {
        const error = await response.json()
        alert(error.message || 'Error booking room')
      }
    } catch (error) {
      console.error('Error booking room:', error)
      alert('Error booking room')
    }
  }

  const sortedSelected = [...selectedTimeSlots].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  )
  const rangeStart = sortedSelected[0]?.startTime
  const rangeEnd = sortedSelected[sortedSelected.length - 1]?.endTime

  const isSlotInRange = (slot) => {
    if (!rangeStart || !rangeEnd) return false
    return slot.startTime >= rangeStart && slot.endTime <= rangeEnd
  }

  const handleSelectRoom = (room) => {
    setSelectedRoom(room)
    setRoomSelectedSlots([])
    setRoomPurpose('')
    setShowRoomDetails(true)
    fetchRoomTimeSlots(room._id, roomDate)
  }

  const handleRoomSlotSelect = (slot) => {
    setRoomSelectedSlots(prev => {
      const isSelected = prev.some(
        s => s.startTime === slot.startTime && s.endTime === slot.endTime
      )
      if (isSelected) {
        return prev.filter(
          s => !(s.startTime === slot.startTime && s.endTime === slot.endTime)
        )
      }
      return [...prev, slot]
    })
  }

  const handleBookSelectedRoom = async () => {
    if (!roomPurpose.trim()) {
      alert('Please provide a purpose for the booking')
      return
    }
    if (roomSelectedSlots.length === 0) {
      alert('Please select at least one time slot')
      return
    }
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        roomId: selectedRoom._id,
        date: roomDate.format('YYYY-MM-DD'),
        timeSlots: roomSelectedSlots,
        purpose: roomPurpose.trim()
      }),
    })
    if (response.ok) {
      const booking = await response.json()
      fetchBookings()
      setSelectedRoom(null)
      setRoomSelectedSlots([])
      setRoomPurpose('')
      setRoomAvailableSlots([])
      if (booking.status === 'approved') {
        alert('Room booked successfully!')
      } else if (booking.status === 'pending') {
        alert('Booking request sent! Admin approval needed.')
      } else {
        alert('Booking submitted.')
      }
    } else {
      const error = await response.json()
      alert(error.message || 'Error booking room')
    }
  }

  const getFilteredRooms = () => {
    return rooms.filter(room => {
      // Filter by capacity
      if (roomFilters.capacity && room.capacity < parseInt(roomFilters.capacity)) {
        return false
      }

      // Filter by amenities
      if (roomFilters.amenities.length > 0) {
        const hasAllAmenities = roomFilters.amenities.every(amenity => 
          room.amenities.includes(amenity)
        )
        if (!hasAllAmenities) return false
      }

      // Filter by search query
      if (roomFilters.searchQuery) {
        const query = roomFilters.searchQuery.toLowerCase()
        const matchesName = room.name.toLowerCase().includes(query)
        const matchesDescription = room.description.toLowerCase().includes(query)
        const matchesAmenities = room.amenities.some(amenity => 
          amenity.toLowerCase().includes(query)
        )
        if (!matchesName && !matchesDescription && !matchesAmenities) {
          return false
        }
      }

      return true
    })
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

  const getMonthlyBookedHours = () => {
    if (!selectedMonth) return '0.0';
    
    const [year, month] = selectedMonth.split('-');
    const firstDayOfMonth = dayjs(`${year}-${month}-01`);
    const lastDayOfMonth = firstDayOfMonth.endOf('month');

    const monthlyBookings = bookings.filter(booking => {
      const bookingDate = dayjs(booking.date);
      return bookingDate.isAfter(firstDayOfMonth.subtract(1, 'day')) && 
             bookingDate.isBefore(lastDayOfMonth.add(1, 'day')) &&
             (booking.status === 'pending' || booking.status === 'approved');
    });

    let totalHours = 0;
    monthlyBookings.forEach(booking => {
      totalHours += calculateHours(booking.startTime, booking.endTime);
    });

    return totalHours.toFixed(1);
  };

  const getFilteredBookings = () => {
    if (!selectedMonth) return bookings;
    
    const [year, month] = selectedMonth.split('-');
    const startDate = dayjs(`${year}-${month}-01`);
    const endDate = startDate.endOf('month');
    
    return bookings.filter(booking => {
      const bookingDate = dayjs(booking.date);
      return bookingDate.isAfter(startDate.subtract(1, 'day')) && bookingDate.isBefore(endDate.add(1, 'day'));
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative">
                  <Image 
                    src="/Fiire_logo.jpeg" 
                    alt="Fiire Logo" 
                    width={44}
                    height={44}
                    className="object-contain sm:w-14 sm:h-14 rounded-xl shadow-sm"
                    priority
                  />
                  <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-200/50"></div>
                </div>
                <div className="h-10 sm:h-12 w-px bg-gradient-to-b from-gray-200 to-gray-100"></div>
              </div>
              <div className="flex-1 sm:flex-none">
                <div className="flex items-center justify-between sm:block">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
                    User Dashboard
                  </h1>
                  <button
                    onClick={() => signOut()}
                    className="sm:hidden group flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-[#FFF5EB] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B00] transition-all duration-200 shadow-sm hover:shadow text-xs"
                  >
                    <span className="font-medium text-gray-700 group-hover:text-[#FF6B00] transition-colors">Sign out</span>
                    <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#FF6B00] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-xs sm:text-sm text-gray-600">
                    Welcome back, <span className="font-semibold text-[#FF6B00]">{session?.user?.name}</span>
                  </p>
                  <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-[#FF6B00] to-[#FF8F3F] text-white rounded-full shadow-sm">
                    {session?.user?.role === 'incubated' ? 'Incubated User' : 'External User'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="hidden sm:flex group items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-gray-200 rounded-lg hover:bg-[#FFF5EB] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B00] transition-all duration-200 shadow-sm hover:shadow text-xs sm:text-sm"
            >
              <span className="font-medium text-gray-700 group-hover:text-[#FF6B00] transition-colors">Sign out</span>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 group-hover:text-[#FF6B00] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-2 border border-gray-100">
            <nav className="flex space-x-2">
              <button
                onClick={() => setActiveTab('book')}
                className={`${
                  activeTab === 'book'
                    ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF8F3F] text-white'
                    : 'text-gray-500 hover:text-[#FF6B00] hover:bg-[#FFF5EB]'
                } px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center space-x-2`}
              >
                <FiCalendar className="w-4 h-4" />
                <span>Book a Room</span>
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`${
                  activeTab === 'bookings'
                    ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF8F3F] text-white'
                    : 'text-gray-500 hover:text-[#FF6B00] hover:bg-[#FFF5EB]'
                } px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center space-x-2`}
              >
                <FiList className="w-4 h-4" />
                <span>My Bookings</span>
              </button>
              <button
                onClick={() => setActiveTab('rooms')}
                className={`${
                  activeTab === 'rooms'
                    ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF8F3F] text-white'
                    : 'text-gray-500 hover:text-[#FF6B00] hover:bg-[#FFF5EB]'
                } px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center space-x-2`}
              >
                <FiImage className="w-4 h-4" />
                <span>All Rooms</span>
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'book' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="relative overflow-hidden">
              {/* Calendar and Time Selection Section */}
              <div className={`transition-all duration-500 ease-in-out ${
                showAvailableRooms ? 'opacity-0 -translate-x-full absolute inset-0' : 'opacity-100 translate-x-0'
              }`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Date</h2>
                    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateCalendar
                          value={selectedDate}
                          onChange={(newDate) => setSelectedDate(newDate)}
                          minDate={dayjs()}
                          sx={{
                            width: '100%',
                            '.MuiPickersCalendarHeader-root': {
                              marginBottom: '16px',
                              padding: '0 8px'
                            },
                            '.MuiPickersCalendarHeader-label': {
                              color: '#111827',
                              fontWeight: 600,
                              fontSize: '1.1rem'
                            },
                            '.MuiPickersDay-root': {
                              color: '#374151',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              margin: '2px',
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              '&:hover': {
                                backgroundColor: '#FFF5EB',
                                color: '#FF6B00'
                              },
                              '&.Mui-selected': {
                                backgroundColor: '#FF6B00',
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: '#FF8F3F'
                                }
                              },
                              '&.Mui-disabled': {
                                color: '#9CA3AF'
                              }
                            },
                            '.MuiPickersDay-today': {
                              border: '2px solid #FF6B00',
                              color: '#FF6B00',
                              '&.Mui-selected': {
                                color: 'white'
                              }
                            },
                            '.MuiPickersCalendarHeader-switchHeader': {
                              marginTop: '8px'
                            },
                            '.MuiPickersArrowSwitcher-root': {
                              margin: '0 8px'
                            },
                            '.MuiPickersArrowSwitcher-button': {
                              color: '#FF6B00',
                              '&:hover': {
                                backgroundColor: '#FFF5EB'
                              }
                            },
                            '.MuiPickersCalendarHeader-labelContainer': {
                              marginLeft: '4px',
                              marginRight: '4px'
                            }
                          }}
                        />
                      </LocalizationProvider>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Time Slots</h2>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {generateTimeSlots().map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => handleTimeSlotSelect(slot)}
                          className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                            isSlotInRange(slot)
                              ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF8F3F] text-white shadow-md'
                              : 'bg-white text-gray-700 hover:bg-[#FFF5EB] hover:text-[#FF6B00] border border-gray-200 hover:border-[#FFE4CC] shadow-sm hover:shadow'
                          }`}
                        >
                          <div className="flex items-center justify-center space-x-1">
                            <FiClock className={`w-4 h-4 ${
                              isSlotInRange(slot) ? 'text-white' : 'text-[#FF6B00]'
                            }`} />
                            <span>{slot.startTime} - {slot.endTime}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedTimeSlots.length > 0 && (
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-[#FFF5EB] to-[#FFE4CC] p-4 rounded-xl border border-[#FFE4CC]/50">
                          <h3 className="text-sm font-medium text-[#FF6B00] mb-2 flex items-center">
                            <FiClock className="w-4 h-4 mr-2" />
                            Selected Time Slots
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-4 py-2 bg-white text-[#FF6B00] rounded-lg text-sm font-medium shadow-sm border border-[#FFE4CC]">
                              {sortedSelected[0]?.startTime} - {sortedSelected[sortedSelected.length - 1]?.endTime}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            fetchAvailableRooms()
                            setShowAvailableRooms(true)
                          }}
                          className="w-full py-3 bg-gradient-to-r from-[#FF6B00] to-[#FF8F3F] text-white rounded-xl hover:from-[#FF8F3F] hover:to-[#FF6B00] transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center justify-center space-x-2"
                        >
                          <FiCheck className="w-5 h-5" />
                          <span>Show Available Rooms</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Available Rooms Section */}
              <div className={`transition-all duration-500 ease-in-out ${
                showAvailableRooms ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full absolute inset-0'
              }`}>
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => {
                      setSelectedTimeSlots([])
                      setAvailableRooms([])
                      setShowAvailableRooms(false)
                    }}
                    className="mr-4 p-2 text-gray-600 hover:text-[#FF6B00] transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Available Rooms</h2>
                    <div className="mt-2">
                      <span className="px-4 py-2 bg-gradient-to-r from-[#FFF5EB] to-[#FFE4CC] text-[#FF6B00] rounded-xl text-sm font-medium flex items-center shadow-sm">
                        <FiClock className="w-4 h-4 mr-2 text-[#FF8F3F]" />
                        {selectedTimeSlots[0]?.startTime} - {selectedTimeSlots[selectedTimeSlots.length - 1]?.endTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Filters for Available Rooms */}
                <div className="mb-6 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Capacity Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Minimum Capacity
                      </label>
                      <div className="relative">
                      <select
                        value={roomFilters.capacity}
                        onChange={(e) => setRoomFilters(prev => ({ ...prev, capacity: e.target.value }))}
                          className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FFE4CC] transition-all duration-200 appearance-none cursor-pointer hover:border-[#FF6B00]/50"
                          style={{
                            WebkitAppearance: 'none',
                            MozAppearance: 'none'
                          }}
                        >
                          <option value="" className="py-3 px-4 text-gray-500 bg-white hover:bg-[#FFF5EB] hover:text-[#FF6B00] focus:bg-[#FFF5EB] focus:text-[#FF6B00] selected:bg-[#FFF5EB] selected:text-[#FF6B00] [&:hover]:bg-[#FFF5EB] [&:hover]:text-[#FF6B00] [&:focus]:bg-[#FFF5EB] [&:focus]:text-[#FF6B00] [&:active]:bg-[#FFF5EB] [&:active]:text-[#FF6B00] [&:checked]:bg-[#FFF5EB] [&:checked]:text-[#FF6B00]">Any Capacity</option>
                          <option value="2" className="py-3 px-4 text-gray-700 bg-white hover:bg-[#FFF5EB] hover:text-[#FF6B00] focus:bg-[#FFF5EB] focus:text-[#FF6B00] selected:bg-[#FFF5EB] selected:text-[#FF6B00] [&:hover]:bg-[#FFF5EB] [&:hover]:text-[#FF6B00] [&:focus]:bg-[#FFF5EB] [&:focus]:text-[#FF6B00] [&:active]:bg-[#FFF5EB] [&:active]:text-[#FF6B00] [&:checked]:bg-[#FFF5EB] [&:checked]:text-[#FF6B00]">2+ people</option>
                          <option value="4" className="py-3 px-4 text-gray-700 bg-white hover:bg-[#FFF5EB] hover:text-[#FF6B00] focus:bg-[#FFF5EB] focus:text-[#FF6B00] selected:bg-[#FFF5EB] selected:text-[#FF6B00] [&:hover]:bg-[#FFF5EB] [&:hover]:text-[#FF6B00] [&:focus]:bg-[#FFF5EB] [&:focus]:text-[#FF6B00] [&:active]:bg-[#FFF5EB] [&:active]:text-[#FF6B00] [&:checked]:bg-[#FFF5EB] [&:checked]:text-[#FF6B00]">4+ people</option>
                          <option value="6" className="py-3 px-4 text-gray-700 bg-white hover:bg-[#FFF5EB] hover:text-[#FF6B00] focus:bg-[#FFF5EB] focus:text-[#FF6B00] selected:bg-[#FFF5EB] selected:text-[#FF6B00] [&:hover]:bg-[#FFF5EB] [&:hover]:text-[#FF6B00] [&:focus]:bg-[#FFF5EB] [&:focus]:text-[#FF6B00] [&:active]:bg-[#FFF5EB] [&:active]:text-[#FF6B00] [&:checked]:bg-[#FFF5EB] [&:checked]:text-[#FF6B00]">6+ people</option>
                          <option value="8" className="py-3 px-4 text-gray-700 bg-white hover:bg-[#FFF5EB] hover:text-[#FF6B00] focus:bg-[#FFF5EB] focus:text-[#FF6B00] selected:bg-[#FFF5EB] selected:text-[#FF6B00] [&:hover]:bg-[#FFF5EB] [&:hover]:text-[#FF6B00] [&:focus]:bg-[#FFF5EB] [&:focus]:text-[#FF6B00] [&:active]:bg-[#FFF5EB] [&:active]:text-[#FF6B00] [&:checked]:bg-[#FFF5EB] [&:checked]:text-[#FF6B00]">8+ people</option>
                          <option value="10" className="py-3 px-4 text-gray-700 bg-white hover:bg-[#FFF5EB] hover:text-[#FF6B00] focus:bg-[#FFF5EB] focus:text-[#FF6B00] selected:bg-[#FFF5EB] selected:text-[#FF6B00] [&:hover]:bg-[#FFF5EB] [&:hover]:text-[#FF6B00] [&:focus]:bg-[#FFF5EB] [&:focus]:text-[#FF6B00] [&:active]:bg-[#FFF5EB] [&:active]:text-[#FF6B00] [&:checked]:bg-[#FFF5EB] [&:checked]:text-[#FF6B00]">10+ people</option>
                      </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                          <svg className="w-5 h-5 text-[#FF6B00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Amenities Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Amenities
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['Projector', 'Whiteboard', 'TV', 'Video Conferencing', 'Coffee Machine'].map((amenity) => (
                          <button
                            key={amenity}
                            onClick={() => {
                              setRoomFilters(prev => ({
                                ...prev,
                                amenities: prev.amenities.includes(amenity)
                                  ? prev.amenities.filter(a => a !== amenity)
                                  : [...prev.amenities, amenity]
                              }))
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                              roomFilters.amenities.includes(amenity)
                                ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF8F3F] text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-[#FFF5EB] hover:text-[#FF6B00]'
                            }`}
                          >
                            {amenity}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="flex items-end">
                      <button
                        onClick={() => setRoomFilters({
                          capacity: '',
                          amenities: [],
                          searchQuery: ''
                        })}
                        className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-[#FFF5EB] hover:text-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#FF6B00] transition-all duration-200 shadow-sm"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Available Rooms</h2>
                      <p className="mt-1 text-sm text-gray-500">Select a room for your meeting</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {availableRooms
                      .filter(room => {
                        if (roomFilters.capacity && room.capacity < parseInt(roomFilters.capacity)) {
                          return false
                        }
                        if (roomFilters.amenities.length > 0) {
                          const hasAllAmenities = roomFilters.amenities.every(amenity => 
                            room.amenities.includes(amenity)
                          )
                          if (!hasAllAmenities) return false
                        }
                        return true
                      })
                      .map((room) => (
                        <div
                          key={room._id}
                          className={`group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 ${
                            !room.isAvailable ? 'opacity-60 grayscale' : ''
                          }`}
                        >
                          {room.images && room.images.length > 0 ? (
                            <div className="relative h-56 overflow-hidden">
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
                            <div className="h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <FiImage className="w-16 h-16 text-gray-400" />
                            </div>
                          )}
                          <div className="p-6 flex flex-col h-[calc(100%-14rem)]">
                            <div className="flex justify-between items-start mb-4">
                          <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{room.name}</h3>
                                <div className="flex items-center">
                                  <span className="px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg text-sm font-medium flex items-center shadow-sm border border-blue-100">
                                    <FiUsers className="w-4 h-4 mr-1.5 text-blue-500" />
                                    {room.capacity} people
                              </span>
                            </div>
                              </div>
                            </div>
                            <p className="text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">{room.description}</p>
                            <div className="space-y-3 mb-6">
                              <h4 className="font-medium text-gray-900">Amenities</h4>
                              <div className="flex flex-wrap gap-2 min-h-[2rem]">
                                {room.amenities.map((amenity, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1.5 bg-gradient-to-r from-[#FFF5EB] to-[#FFE4CC] text-[#FF6B00] rounded-lg text-sm font-medium flex items-center shadow-sm hover:shadow-md transition-all duration-200 border border-[#FFE4CC]/50 hover:border-[#FF6B00]/20"
                                >
                                    <FiCheck className="w-4 h-4 mr-1.5 text-[#FF8F3F]" />
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          </div>
                          {room.isAvailable && (
                              <div className="mt-auto">
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`purpose-${room._id}`}>
                                  Purpose
                                </label>
                                <textarea
                                  id={`purpose-${room._id}`}
                                  value={purpose[room._id] || ''}
                                  onChange={(e) => setPurpose(prev => ({ ...prev, [room._id]: e.target.value }))}
                                  placeholder="Describe your meeting purpose"
                                  rows={3}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FFE4CC] bg-white text-gray-900 placeholder-gray-500 transition resize-none"
                                />
                              </div>
                              <button
                              onClick={() => handleBookRoom(room._id)}
                                  className="w-full py-3 bg-gradient-to-r from-[#FF6B00] to-[#FF8F3F] text-white rounded-xl hover:from-[#FF8F3F] hover:to-[#FF6B00] transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                              >
                                <FiCheck className="inline-block mr-2" />
                                Book Now
                              </button>
                            </div>
                          )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">My Bookings</h2>
                <p className="mt-1 text-sm text-gray-500">View and manage your meeting room bookings</p>
              </div>
              <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="relative w-full sm:w-auto">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FFE4CC] transition-all duration-200 appearance-none cursor-pointer hover:border-[#FF6B00]/50"
                    style={{
                      WebkitAppearance: 'none',
                      MozAppearance: 'none'
                    }}
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const currentYear = dayjs().year();
                      const date = dayjs().year(currentYear).month(i);
                      return (
                        <option key={date.format('YYYY-MM')} value={date.format('YYYY-MM')}>
                          {date.format('MMMM YYYY')}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-5 h-5 text-[#FF6B00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div className="w-full sm:w-auto bg-gradient-to-r from-[#FFF5EB] to-[#FFE4CC] px-4 sm:px-6 py-3 rounded-xl shadow-sm border border-[#FFE4CC]/50">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <FiClock className="w-5 h-5 text-[#FF6B00]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#FF6B00]">Monthly Booking Hours</p>
                      <p className="text-base sm:text-lg font-bold text-gray-900">
                        {getMonthlyBookedHours()} / 8 hours
                        <span className="text-xs sm:text-sm font-normal text-gray-500 ml-2">
                          ({dayjs(selectedMonth).format('MMMM YYYY')})
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {getFilteredBookings().length === 0 ? (
              <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FFF5EB] mb-4 sm:mb-6">
                  <FiCalendar className="w-8 h-8 sm:w-10 sm:h-10 text-[#FF6B00]" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Bookings Found</h3>
                <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto px-4">No bookings found for the selected month. Try selecting a different month or make a new booking.</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {getFilteredBookings().map((booking) => (
                  <div
                    key={booking._id}
                    className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 sm:gap-6">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#FFF5EB] to-[#FFE4CC] rounded-xl flex items-center justify-center">
                                <FiHome className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF6B00]" />
                              </div>
                              <div>
                                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                  {booking.room?.name}
                                </h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-full ${
                                    booking.status === 'approved' && new Date(`${booking.date}T${booking.endTime}`) < new Date()
                                      ? 'bg-blue-100 text-blue-800'
                                      : booking.status === 'approved'
                                      ? 'bg-green-100 text-green-800'
                                      : booking.status === 'rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {booking.status === 'approved' && new Date(`${booking.date}T${booking.endTime}`) < new Date()
                                      ? 'Completed'
                                      : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-[#FFF5EB] rounded-lg flex items-center justify-center">
                                <FiCalendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF6B00]" />
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
                              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-[#FFF5EB] rounded-lg flex items-center justify-center">
                                <FiClock className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF6B00]" />
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-900">{booking.startTime} - {booking.endTime}</p>
                                <p className="text-xs sm:text-sm text-gray-500">Time</p>
                              </div>
                            </div>
                          </div>

                          {booking.purpose && (
                            <div className="flex items-start space-x-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-[#FFF5EB] rounded-lg flex items-center justify-center">
                                <FiInfo className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF6B00]" />
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="relative overflow-hidden">
              {/* Rooms List Section */}
              <div className={`transition-all duration-500 ease-in-out ${
                showRoomDetails ? 'opacity-0 -translate-x-full absolute inset-0' : 'opacity-100 translate-x-0'
              }`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h2 className="text-2xl font-semibold text-gray-800">All Rooms</h2>
                  
                  {/* Search Bar */}
                  <div className="w-full sm:w-80 relative">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search rooms by name, description, or amenities..."
                        value={roomFilters.searchQuery}
                        onChange={(e) => setRoomFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors duration-200 shadow-sm hover:border-gray-300"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filters Section */}
                <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Capacity Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Minimum Capacity
                      </label>
                      <div className="relative">
                      <select
                        value={roomFilters.capacity}
                        onChange={(e) => setRoomFilters(prev => ({ ...prev, capacity: e.target.value }))}
                          className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FFE4CC] transition-all duration-200 appearance-none cursor-pointer hover:border-[#FF6B00]/50"
                          style={{
                            WebkitAppearance: 'none',
                            MozAppearance: 'none'
                          }}
                        >
                          <option value="" className="py-3 px-4 text-gray-500 bg-white hover:bg-[#FFF5EB] hover:text-[#FF6B00] focus:bg-[#FFF5EB] focus:text-[#FF6B00] selected:bg-[#FFF5EB] selected:text-[#FF6B00] [&:hover]:bg-[#FFF5EB] [&:hover]:text-[#FF6B00] [&:focus]:bg-[#FFF5EB] [&:focus]:text-[#FF6B00] [&:active]:bg-[#FFF5EB] [&:active]:text-[#FF6B00] [&:checked]:bg-[#FFF5EB] [&:checked]:text-[#FF6B00]">Any Capacity</option>
                          <option value="2" className="py-3 px-4 text-gray-700 bg-white hover:bg-[#FFF5EB] hover:text-[#FF6B00] focus:bg-[#FFF5EB] focus:text-[#FF6B00] selected:bg-[#FFF5EB] selected:text-[#FF6B00] [&:hover]:bg-[#FFF5EB] [&:hover]:text-[#FF6B00] [&:focus]:bg-[#FFF5EB] [&:focus]:text-[#FF6B00] [&:active]:bg-[#FFF5EB] [&:active]:text-[#FF6B00] [&:checked]:bg-[#FFF5EB] [&:checked]:text-[#FF6B00]">2+ people</option>
                          <option value="4" className="py-3 px-4 text-gray-700 bg-white hover:bg-[#FFF5EB] hover:text-[#FF6B00] focus:bg-[#FFF5EB] focus:text-[#FF6B00] selected:bg-[#FFF5EB] selected:text-[#FF6B00] [&:hover]:bg-[#FFF5EB] [&:hover]:text-[#FF6B00] [&:focus]:bg-[#FFF5EB] [&:focus]:text-[#FF6B00] [&:active]:bg-[#FFF5EB] [&:active]:text-[#FF6B00] [&:checked]:bg-[#FFF5EB] [&:checked]:text-[#FF6B00]">4+ people</option>
                          <option value="6" className="py-3 px-4 text-gray-700 bg-white hover:bg-[#FFF5EB] hover:text-[#FF6B00] focus:bg-[#FFF5EB] focus:text-[#FF6B00] selected:bg-[#FFF5EB] selected:text-[#FF6B00] [&:hover]:bg-[#FFF5EB] [&:hover]:text-[#FF6B00] [&:focus]:bg-[#FFF5EB] [&:focus]:text-[#FF6B00] [&:active]:bg-[#FFF5EB] [&:active]:text-[#FF6B00] [&:checked]:bg-[#FFF5EB] [&:checked]:text-[#FF6B00]">6+ people</option>
                          <option value="8" className="py-3 px-4 text-gray-700 bg-white hover:bg-[#FFF5EB] hover:text-[#FF6B00] focus:bg-[#FFF5EB] focus:text-[#FF6B00] selected:bg-[#FFF5EB] selected:text-[#FF6B00] [&:hover]:bg-[#FFF5EB] [&:hover]:text-[#FF6B00] [&:focus]:bg-[#FFF5EB] [&:focus]:text-[#FF6B00] [&:active]:bg-[#FFF5EB] [&:active]:text-[#FF6B00] [&:checked]:bg-[#FFF5EB] [&:checked]:text-[#FF6B00]">8+ people</option>
                          <option value="10" className="py-3 px-4 text-gray-700 bg-white hover:bg-[#FFF5EB] hover:text-[#FF6B00] focus:bg-[#FFF5EB] focus:text-[#FF6B00] selected:bg-[#FFF5EB] selected:text-[#FF6B00] [&:hover]:bg-[#FFF5EB] [&:hover]:text-[#FF6B00] [&:focus]:bg-[#FFF5EB] [&:focus]:text-[#FF6B00] [&:active]:bg-[#FFF5EB] [&:active]:text-[#FF6B00] [&:checked]:bg-[#FFF5EB] [&:checked]:text-[#FF6B00]">10+ people</option>
                      </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                          <svg className="w-5 h-5 text-[#FF6B00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Amenities Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Amenities
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['Projector', 'Whiteboard', 'TV', 'Video Conferencing', 'Coffee Machine'].map((amenity) => (
                          <button
                            key={amenity}
                            onClick={() => {
                              setRoomFilters(prev => ({
                                ...prev,
                                amenities: prev.amenities.includes(amenity)
                                  ? prev.amenities.filter(a => a !== amenity)
                                  : [...prev.amenities, amenity]
                              }))
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              roomFilters.amenities.includes(amenity)
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                            }`}
                          >
                            {amenity}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="flex items-end">
                      <button
                        onClick={() => setRoomFilters({
                          capacity: '',
                          amenities: [],
                          searchQuery: ''
                        })}
                        className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rooms Grid */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {getFilteredRooms().map(room => (
                    <div
                      key={room._id}
                      className={`group flex flex-col justify-between h-full bg-white border border-gray-200 rounded-2xl shadow-sm p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer ${
                        selectedRoom && selectedRoom._id === room._id ? 'border-[#FF6B00] ring-2 ring-[#FFE4CC]' : ''
                      }`}
                      onClick={() => handleSelectRoom(room)}
                    >
                      {room.images && room.images.length > 0 ? (
                        <div className="relative h-56 mb-6 rounded-xl overflow-hidden group">
                          <img
                            src={room.images[activeImageIndices[room._id] || 0]}
                            alt={`${room.name} - Room Image ${(activeImageIndices[room._id] || 0) + 1}`}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                          />
                          {room.images.length > 1 && (
                            <>
                              <button
                                onClick={(e) => handlePrevImage(room._id, e)}
                                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <FiChevronLeft className="w-5 h-5" />
                              </button>
                              <button
                                onClick={(e) => handleNextImage(room._id, e)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
                        <div className="h-56 mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:from-gray-200 group-hover:to-gray-300 transition-all duration-300">
                          <FiImage className="w-16 h-16 text-gray-400 group-hover:text-gray-500 transition-colors" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#FF6B00] transition-colors">{room.name}</h3>
                        <p className="text-gray-600 text-sm mb-4 italic border-l-4 border-[#FFE4CC] pl-3 group-hover:border-[#FF6B00] transition-colors">
                          {room.description}
                        </p>
                        <div className="flex items-center text-gray-600 mb-4">
                          <span className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg text-sm font-medium flex items-center shadow-sm border border-blue-100 group-hover:from-blue-100 group-hover:to-indigo-100 transition-all duration-300">
                            <FiUsers className="w-4 h-4 mr-1.5 text-blue-500" />
                            {room.capacity} people
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {room.amenities.map((amenity, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-gradient-to-r from-[#FFF5EB] to-[#FFE4CC] text-[#FF6B00] rounded-lg text-sm font-medium flex items-center shadow-sm hover:shadow-md transition-all duration-200 border border-[#FFE4CC]/50 hover:border-[#FF6B00]/20"
                            >
                              <FiCheck className="w-4 h-4 mr-1.5 text-[#FF8F3F]" />
                              {amenity}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRoom(room);
                          }}
                          className="w-full py-2.5 bg-gradient-to-r from-[#FF6B00] to-[#FF8F3F] text-white rounded-xl hover:from-[#FF8F3F] hover:to-[#FF6B00] transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center justify-center space-x-2"
                        >
                          <FiCalendar className="w-4 h-4" />
                          <span>Book This Room</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* No Results Message */}
                {getFilteredRooms().length === 0 && (
                  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#FFF5EB] mb-6">
                      <FiInfo className="w-10 h-10 text-[#FF6B00]" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Rooms Found</h3>
                    <p className="text-gray-500">Try adjusting your filters or search query.</p>
                  </div>
                )}
              </div>

              {/* Room Details Section */}
              <div className={`transition-all duration-500 ease-in-out ${
                showRoomDetails ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full absolute inset-0'
              }`}>
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => {
                      setSelectedRoom(null)
                      setRoomSelectedSlots([])
                      setRoomPurpose('')
                      setShowRoomDetails(false)
                    }}
                    className="mr-4 p-2 text-gray-600 hover:text-gray-900"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      Book: {selectedRoom?.name}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Select a date and time to book this room
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Date</h3>
                    {selectedRoom?.images && selectedRoom.images.length > 0 && (
                      <div className="mb-4">
                        <div className="relative h-64 rounded-lg overflow-hidden group">
                          <img
                            src={selectedRoom.images[activeImageIndices[selectedRoom._id] || 0]}
                            alt={`${selectedRoom.name} - Room Image ${(activeImageIndices[selectedRoom._id] || 0) + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {selectedRoom.images.length > 1 && (
                            <>
                              <button
                                onClick={(e) => handlePrevImage(selectedRoom._id, e)}
                                className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <FiChevronLeft className="w-6 h-6" />
                              </button>
                              <button
                                onClick={(e) => handleNextImage(selectedRoom._id, e)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <FiChevronRight className="w-6 h-6" />
                              </button>
                              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                                {selectedRoom.images.map((_, index) => (
                                  <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                                      (activeImageIndices[selectedRoom._id] || 0) === index ? 'bg-white' : 'bg-white/50'
                                    }`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateCalendar
                          value={roomDate}
                          onChange={setRoomDate}
                          minDate={dayjs()}
                          sx={{
                            width: '100%',
                            '.MuiPickersCalendarHeader-root': {
                              marginBottom: '16px',
                              padding: '0 8px'
                            },
                            '.MuiPickersCalendarHeader-label': {
                              color: '#111827',
                              fontWeight: 600,
                              fontSize: '1.1rem'
                            },
                            '.MuiPickersDay-root': {
                              color: '#374151',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              margin: '2px',
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              '&:hover': {
                                backgroundColor: '#FFF5EB',
                                color: '#FF6B00'
                              },
                              '&.Mui-selected': {
                                backgroundColor: '#FF6B00',
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: '#FF8F3F'
                                }
                              },
                              '&.Mui-disabled': {
                                color: '#9CA3AF'
                              }
                            },
                            '.MuiPickersDay-today': {
                              border: '2px solid #FF6B00',
                              color: '#FF6B00',
                              '&.Mui-selected': {
                                color: 'white'
                              }
                            },
                            '.MuiPickersCalendarHeader-switchHeader': {
                              marginTop: '8px'
                            },
                            '.MuiPickersArrowSwitcher-root': {
                              margin: '0 8px'
                            },
                            '.MuiPickersArrowSwitcher-button': {
                              color: '#FF6B00',
                              '&:hover': {
                                backgroundColor: '#FFF5EB'
                              }
                            },
                            '.MuiPickersCalendarHeader-labelContainer': {
                              marginLeft: '4px',
                              marginRight: '4px'
                            }
                          }}
                        />
                      </LocalizationProvider>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Time Slots</h3>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {roomAvailableSlots.length === 0 && (
                        <div className="col-span-3 text-center py-8 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FFF5EB] mb-3">
                            <FiClock className="w-6 h-6 text-[#FF6B00]" />
                          </div>
                          <p className="text-gray-500">No available slots for this date.</p>
                        </div>
                      )}
                      {roomAvailableSlots.map((slot, idx) => (
                        <button
                          key={idx}
                          onClick={() => slot.isAvailable && handleRoomSlotSelect(slot)}
                          className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                            !slot.isAvailable
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : roomSelectedSlots.some(
                                  s => s.startTime === slot.startTime && s.endTime === slot.endTime
                                )
                              ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF8F3F] text-white shadow-md'
                              : 'bg-white text-gray-700 hover:bg-[#FFF5EB] hover:text-[#FF6B00] border border-gray-200 hover:border-[#FFE4CC] shadow-sm hover:shadow'
                          }`}
                          disabled={!slot.isAvailable}
                        >
                          <div className="flex items-center justify-center space-x-1">
                            <FiClock className={`w-4 h-4 ${
                              roomSelectedSlots.some(
                                s => s.startTime === slot.startTime && s.endTime === slot.endTime
                              ) ? 'text-white' : 'text-[#FF6B00]'
                            }`} />
                            <span>{slot.startTime} - {slot.endTime}</span>
                          </div>
                          {!slot.isAvailable && (
                            <span className="block text-xs mt-1 text-gray-400">(Booked)</span>
                          )}
                        </button>
                      ))}
                    </div>
                    {roomSelectedSlots.length > 0 && (
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-[#FFF5EB] to-[#FFE4CC] p-4 rounded-xl border border-[#FFE4CC]/50">
                          <h3 className="text-sm font-medium text-[#FF6B00] mb-2 flex items-center">
                            <FiClock className="w-4 h-4 mr-2" />
                            Selected Time Slots
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-4 py-2 bg-white text-[#FF6B00] rounded-lg text-sm font-medium shadow-sm border border-[#FFE4CC]">
                              {roomSelectedSlots[0]?.startTime} - {roomSelectedSlots[roomSelectedSlots.length - 1]?.endTime}
                            </span>
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="roomPurpose">
                            Meeting Purpose
                          </label>
                          <textarea
                            id="roomPurpose"
                            value={roomPurpose}
                            onChange={e => setRoomPurpose(e.target.value)}
                            placeholder="Describe your meeting purpose..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-gray-900 placeholder-gray-500 transition resize-none"
                          />
                        </div>
                        <button
                          onClick={handleBookSelectedRoom}
                          className="w-full py-3 bg-gradient-to-r from-[#FF6B00] to-[#FF8F3F] text-white rounded-xl hover:from-[#FF8F3F] hover:to-[#FF6B00] transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center justify-center space-x-2"
                        >
                          <FiCheck className="w-5 h-5" />
                          <span>Book Selected Slot(s)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 