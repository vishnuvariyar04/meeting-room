'use client'

import { useState } from 'react'
import { FiEdit2, FiTrash2, FiCalendar, FiClock, FiUsers, FiInfo, FiCheck, FiImage } from 'react-icons/fi'
import BookRoomModal from './modals/BookRoomModal'
import EditRoomModal from './modals/EditRoomModal'

export default function Room({ room, onEdit, onDelete, isAdmin = false }) {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const handleEdit = async (updatedRoom) => {
    await onEdit(updatedRoom)
    setIsEditModalOpen(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {room.images && room.images.length > 0 ? (
        <div className="relative h-48 bg-gray-100">
          <img
            src={room.images[selectedImageIndex]}
            alt={`${room.name} - Image ${selectedImageIndex + 1}`}
            className="w-full h-full object-cover"
          />
          {room.images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {room.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    selectedImageIndex === index ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="h-48 bg-gray-100 flex items-center justify-center">
          <FiImage className="w-12 h-12 text-gray-400" />
        </div>
      )}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{room.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{room.description}</p>
          </div>
          {isAdmin && (
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <FiEdit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete(room._id)}
                className="p-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <FiTrash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {isAdmin ? (
          // Admin View - Focus on amenities and basic info
          <div className="space-y-4">
            <div className="flex items-center text-gray-600">
              <FiUsers className="w-5 h-5 mr-2" />
              <span>Capacity: {room.capacity} people</span>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FiInfo className="w-4 h-4 mr-1" />
                Amenities
              </h4>
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
        ) : (
          // User View - Comprehensive room info
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center text-gray-600">
                <FiUsers className="w-5 h-5 mr-2" />
                <span>Capacity: {room.capacity} people</span>
              </div>
              <div className="flex items-center text-gray-600">
                <FiClock className="w-5 h-5 mr-2" />
                <span>Available Slots: {room.availableTimeSlots?.length || 0}</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FiInfo className="w-4 h-4 mr-1" />
                Room Features
              </h4>
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

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FiCalendar className="w-4 h-4 mr-1" />
                Available Time Slots
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {room.availableTimeSlots?.slice(0, 6).map((slot, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs text-center"
                  >
                    {slot.startTime}
                  </span>
                ))}
                {room.availableTimeSlots?.length > 6 && (
                  <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-full text-xs text-center">
                    +{room.availableTimeSlots.length - 6} more
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsBookModalOpen(true)}
              className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center"
            >
              <FiCalendar className="w-5 h-5 mr-2" />
              Book Room
            </button>
          </div>
        )}
      </div>

      <BookRoomModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        room={room}
      />

      <EditRoomModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onEdit={handleEdit}
        room={room}
      />
    </div>
  )
} 