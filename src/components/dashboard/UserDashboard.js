'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { FiCalendar, FiClock, FiUsers, FiInfo, FiCheck } from 'react-icons/fi'
import * as React from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import dayjs from 'dayjs'

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

  useEffect(() => {
    fetchRooms()
    fetchBookings()
  }, [])

  useEffect(() => {
    if (selectedDate && selectedTimeSlots.length > 0) {
      fetchAvailableRooms()
    }
  }, [selectedDate, selectedTimeSlots])

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

  const fetchAvailableRooms = async () => {
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
      // For today's slots, check if the slot is in the past
      if (isToday) {
        if (hour < currentHour || (hour === currentHour && currentMinute >= 30)) {
          continue // Skip past slots
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Dashboard</h1>
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
                onClick={() => setActiveTab('book')}
                className={`${
                  activeTab === 'book'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Book a Room
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`${
                  activeTab === 'bookings'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                My Bookings
              </button>
              <button
                onClick={() => setActiveTab('rooms')}
                className={`${
                  activeTab === 'rooms'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                All Rooms
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'book' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
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
                        />
                      </LocalizationProvider>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Time Slots</h2>
                    <div className="grid grid-cols-3 gap-2 mb-6">
                      {generateTimeSlots().map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => handleTimeSlotSelect(slot)}
                          className={`p-2 rounded-md text-sm ${
                            isSlotInRange(slot)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {slot.startTime} - {slot.endTime}
                        </button>
                      ))}
                    </div>
                    {selectedTimeSlots.length > 0 && (
                      <div className="space-y-4">
                        <div className="bg-indigo-50 p-4 rounded-lg">
                          <h3 className="text-sm font-medium text-indigo-800 mb-2">Selected Time:</h3>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                              {sortedSelected[0]?.startTime} - {sortedSelected[sortedSelected.length - 1]?.endTime}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            fetchAvailableRooms()
                            setShowAvailableRooms(true)
                          }}
                          className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Show Available Rooms
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
                    className="mr-4 p-2 text-gray-600 hover:text-gray-900"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Available Rooms</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Selected Time: {selectedTimeSlots[0]?.startTime} - {selectedTimeSlots[selectedTimeSlots.length - 1]?.endTime}
                    </p>
                  </div>
                </div>

                {/* Filters for Available Rooms */}
                <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Capacity Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Minimum Capacity
                      </label>
                      <select
                        value={roomFilters.capacity}
                        onChange={(e) => setRoomFilters(prev => ({ ...prev, capacity: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                      >
                        <option value="">Any Capacity</option>
                        <option value="2">2+ people</option>
                        <option value="4">4+ people</option>
                        <option value="6">6+ people</option>
                        <option value="8">8+ people</option>
                        <option value="10">10+ people</option>
                      </select>
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

                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mb-6">
                  <h2 className="text-xl font-bold text-indigo-700 border-l-4 border-indigo-200 pl-3 mb-4">Available Rooms</h2>
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
                          className={`flex flex-col justify-between h-full bg-white border border-gray-200 rounded-2xl shadow-md p-6 transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl ${
                            !room.isAvailable ? 'opacity-60 grayscale' : ''
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-bold text-gray-900">
                                {room.name}
                                {!room.isAvailable && (
                                  <span className="ml-2 text-xs font-semibold text-red-500">(Booked)</span>
                                )}
                              </h3>
                              <span className="inline-block px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full font-medium">
                                Capacity: {room.capacity}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3 italic border-l-4 border-indigo-200 pl-3">
                              {room.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {room.amenities.map((amenity, idx) => (
                                <span
                                  key={idx}
                                  className="flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold shadow-sm"
                                >
                                  <svg className="w-3 h-3 mr-1 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" />
                                  </svg>
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          </div>
                          {room.isAvailable && (
                            <div className="mt-4">
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
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-gray-900 placeholder-gray-500 transition resize-none"
                                />
                              </div>
                              <button
                                onClick={() => handleBookRoom(room._id)}
                                className="w-full py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold rounded-lg shadow-md hover:from-indigo-600 hover:to-blue-600 transition"
                              >
                                <FiCheck className="inline-block mr-2" />
                                Book Now
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">My Bookings</h2>
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
                  <FiCalendar className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Yet</h3>
                <p className="text-gray-500">Start by booking a room for your next meeting.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {bookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 mr-3">
                              {booking.room?.name}
                            </h3>
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                booking.status === 'approved' && new Date(`${booking.date}T${booking.endTime}`) < new Date()
                                  ? 'bg-blue-100 text-blue-800'
                                  : booking.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : booking.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {booking.status === 'approved' && new Date(`${booking.date}T${booking.endTime}`) < new Date()
                                ? 'Completed'
                                : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="flex items-center text-gray-600">
                              <FiCalendar className="w-5 h-5 mr-2 text-indigo-500" />
                              <span>{new Date(booking.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <FiClock className="w-5 h-5 mr-2 text-indigo-500" />
                              <span>{booking.startTime} - {booking.endTime}</span>
                            </div>
                          </div>
                          {booking.purpose && (
                            <div className="mt-4">
                              <div className="flex items-start">
                                <FiInfo className="w-5 h-5 mr-2 text-indigo-500 mt-1" />
                                <p className="text-gray-600 text-sm italic">
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
                      <select
                        value={roomFilters.capacity}
                        onChange={(e) => setRoomFilters(prev => ({ ...prev, capacity: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                      >
                        <option value="">Any Capacity</option>
                        <option value="2">2+ people</option>
                        <option value="4">4+ people</option>
                        <option value="6">6+ people</option>
                        <option value="8">8+ people</option>
                        <option value="10">10+ people</option>
                      </select>
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
                      className={`flex flex-col justify-between h-full bg-white border border-gray-200 rounded-2xl shadow-md p-6 transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer ${
                        selectedRoom && selectedRoom._id === room._id ? 'border-indigo-500 ring-2 ring-indigo-200' : ''
                      }`}
                      onClick={() => handleSelectRoom(room)}
                    >
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{room.name}</h3>
                        <p className="text-gray-600 text-sm mb-3 italic border-l-4 border-indigo-200 pl-3">
                          {room.description}
                        </p>
                        <div className="flex items-center text-gray-600 mt-2">
                          <FiUsers className="w-5 h-5 mr-2" />
                          <span>Capacity: {room.capacity} people</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {room.amenities.map((amenity, idx) => (
                            <span
                              key={idx}
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

                {/* No Results Message */}
                {getFilteredRooms().length === 0 && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
                      <FiInfo className="w-8 h-8 text-indigo-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Rooms Found</h3>
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
                    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateCalendar
                          value={roomDate}
                          onChange={setRoomDate}
                          minDate={dayjs()}
                        />
                      </LocalizationProvider>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Time Slots</h3>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {roomAvailableSlots.length === 0 && (
                        <span className="text-gray-500 col-span-3">No available slots for this date.</span>
                      )}
                      {roomAvailableSlots.map((slot, idx) => (
                        <button
                          key={idx}
                          onClick={() => slot.isAvailable && handleRoomSlotSelect(slot)}
                          className={`p-2 rounded-md text-sm ${
                            !slot.isAvailable
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : roomSelectedSlots.some(
                                  s => s.startTime === slot.startTime && s.endTime === slot.endTime
                                )
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          disabled={!slot.isAvailable}
                        >
                          {slot.startTime} - {slot.endTime}
                          {!slot.isAvailable && ' (Booked)'}
                        </button>
                      ))}
                    </div>
                    {roomSelectedSlots.length > 0 && (
                      <div className="space-y-4">
                        <div className="bg-indigo-50 p-4 rounded-lg">
                          <h3 className="text-sm font-medium text-indigo-800 mb-2">Selected Time:</h3>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                              {roomSelectedSlots[0]?.startTime} - {roomSelectedSlots[roomSelectedSlots.length - 1]?.endTime}
                            </span>
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="roomPurpose">
                            Purpose
                          </label>
                          <textarea
                            id="roomPurpose"
                            value={roomPurpose}
                            onChange={e => setRoomPurpose(e.target.value)}
                            placeholder="Describe your meeting purpose"
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-gray-900 placeholder-gray-500 transition resize-none"
                          />
                        </div>
                        <button
                          onClick={handleBookSelectedRoom}
                          className="w-full py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold rounded-lg shadow-md hover:from-indigo-600 hover:to-blue-600 transition"
                        >
                          <FiCheck className="inline-block mr-2" />
                          Book Selected Slot(s)
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