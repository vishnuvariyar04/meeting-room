'use client'

import { useState, useEffect } from 'react'

const DEFAULT_AMENITIES = [
  'Projector',
  'Whiteboard',
  'Power Sockets',
  'WiFi',
  'Air Conditioning',
  'Video Conferencing',
  'Coffee Machine',
  'Water Dispenser',
]

export default function EditRoomModal({ isOpen, onClose, onEdit, room }) {
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    description: '',
    amenities: [],
    timeSlots: [],
  })

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name,
        capacity: room.capacity,
        description: room.description,
        amenities: room.amenities || [],
        timeSlots: room.availableTimeSlots,
      })
    }
  }, [room])

  const handleSubmit = (e) => {
    e.preventDefault()
    onEdit(room._id, formData)
  }

  const handleAddTimeSlot = () => {
    setFormData({
      ...formData,
      timeSlots: [
        ...formData.timeSlots,
        { startTime: '09:00', endTime: '10:00' },
      ],
    })
  }

  const handleRemoveTimeSlot = (index) => {
    setFormData({
      ...formData,
      timeSlots: formData.timeSlots.filter((_, i) => i !== index),
    })
  }

  const handleTimeSlotChange = (index, field, value) => {
    const newTimeSlots = [...formData.timeSlots]
    newTimeSlots[index] = { ...newTimeSlots[index], [field]: value }
    setFormData({ ...formData, timeSlots: newTimeSlots })
  }

  const handleAmenityChange = (amenity) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.includes(amenity)
        ? formData.amenities.filter((a) => a !== amenity)
        : [...formData.amenities, amenity],
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Edit Room</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter room name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter room capacity"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows="3"
              placeholder="Enter room description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amenities
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_AMENITIES.map((amenity) => (
                <label key={amenity} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => handleAmenityChange(amenity)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Available Time Slots
              </label>
              <button
                type="button"
                onClick={handleAddTimeSlot}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Add Time Slot
              </button>
            </div>
            <div className="space-y-2">
              {formData.timeSlots.map((slot, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => handleTimeSlotChange(index, 'startTime', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => handleTimeSlotChange(index, 'endTime', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTimeSlot(index)}
                    className="text-red-600 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 