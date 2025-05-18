'use client'

import { useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { FiX, FiHome, FiUsers, FiInfo, FiImage, FiUpload } from 'react-icons/fi'

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
    description: '',
    capacity: '',
    amenities: [],
    images: []
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || '',
        description: room.description || '',
        capacity: room.capacity || '',
        amenities: room.amenities || [],
        images: room.images || []
      })
    }
  }, [room])

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, data.url]
      }))
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Failed to upload image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await onEdit(room._id, {
        ...formData,
        capacity: parseInt(formData.capacity)
      })
      onClose()
    } catch (error) {
      console.error('Error updating room:', error)
      setError('Failed to update room. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAmenityChange = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold text-gray-900"
                  >
                    Edit Room
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Room Name
                      </label>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiHome className="h-5 w-5 text-indigo-500" />
                        </div>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors duration-200"
                          placeholder="Enter room name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Capacity
                      </label>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUsers className="h-5 w-5 text-indigo-500" />
                        </div>
                        <input
                          type="number"
                          required
                          min="1"
                          value={formData.capacity}
                          onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                          className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors duration-200"
                          placeholder="Enter room capacity"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Description
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                        <FiInfo className="h-5 w-5 text-indigo-500" />
                      </div>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        required
                        className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors duration-200 resize-none"
                        placeholder="Enter room description"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Room Images
                    </label>
                    <div className="space-y-4">
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-indigo-200 rounded-xl cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FiUpload className="w-10 h-10 mb-3 text-indigo-500" />
                            <p className="mb-2 text-sm font-medium text-indigo-600">
                              <span>Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-indigo-500">PNG, JPG or JPEG (MAX. 5MB)</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                          />
                        </label>
                      </div>
                      {formData.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-4">
                          {formData.images.map((image, index) => (
                            <div key={index} className="relative group rounded-xl overflow-hidden">
                              <img
                                src={image}
                                alt={`Room image ${index + 1}`}
                                className="w-full h-40 object-cover transform group-hover:scale-105 transition-transform duration-300"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Amenities
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {DEFAULT_AMENITIES.map((amenity) => (
                        <label
                          key={amenity}
                          className={`flex items-center space-x-3 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                            formData.amenities.includes(amenity)
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.amenities.includes(amenity)}
                            onChange={() => handleAmenityChange(amenity)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className={`text-sm font-medium ${
                            formData.amenities.includes(amenity)
                              ? 'text-indigo-700'
                              : 'text-gray-700'
                          }`}>{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-3">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || uploadingImage}
                      className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
} 