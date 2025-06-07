import sgMail from '@sendgrid/mail'

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// Function to get base URL
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

export async function sendEmail({ to, subject, html }) {
  try {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      html,
    }

    await sgMail.send(msg)
    console.log('Email sent successfully')
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

// Email templates
const emailTemplates = {
  bookingConfirmation: (bookingDetails) => ({
    to: bookingDetails.userEmail,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Meeting Room Booking Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Booking Confirmation</h2>
        <p>Your meeting room has been successfully booked.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Room:</strong> ${bookingDetails.roomName}</p>
          <p><strong>Date:</strong> ${bookingDetails.date}</p>
          <p><strong>Time:</strong> ${bookingDetails.startTime} - ${bookingDetails.endTime}</p>
          <p><strong>Purpose:</strong> ${bookingDetails.purpose}</p>
        </div>
        <p>Thank you for using our meeting room booking system.</p>
      </div>
    `
  }),

  adminNotification: (bookingDetails) => ({
    to: process.env.ADMIN_EMAIL,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'New Room Booking Notification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Booking Notification</h2>
        <p>A new room has been booked.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Room:</strong> ${bookingDetails.roomName}</p>
          <p><strong>User:</strong> ${bookingDetails.userName}</p>
          <p><strong>Date:</strong> ${bookingDetails.date}</p>
          <p><strong>Time:</strong> ${bookingDetails.startTime} - ${bookingDetails.endTime}</p>
          <p><strong>Purpose:</strong> ${bookingDetails.purpose}</p>
        </div>
      </div>
    `
  }),

  approvalRequest: (bookingDetails) => ({
    to: process.env.ADMIN_EMAIL,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Room Booking Approval Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1a202c; margin-bottom: 20px;">New Booking Request</h2>
        <p style="color: #4a5568; margin-bottom: 15px;">A new booking request requires your approval:</p>
        
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <p style="margin: 5px 0;"><strong>Room:</strong> ${bookingDetails.roomName}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(bookingDetails.date).toLocaleDateString()}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${bookingDetails.startTime} - ${bookingDetails.endTime}</p>
          <p style="margin: 5px 0;"><strong>Purpose:</strong> ${bookingDetails.purpose}</p>
          <p style="margin: 5px 0;"><strong>Requested by:</strong> ${bookingDetails.userName}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/bookings/approve/${bookingDetails.bookingId}" 
             style="display: inline-block; background-color: #48bb78; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">
            Approve
          </a>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/bookings/reject/${bookingDetails.bookingId}" 
             style="display: inline-block; background-color: #f56565; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Reject
          </a>
        </div>
      </div>
    `
  }),

  approvalStatus: (bookingDetails, status) => ({
    to: bookingDetails.userEmail,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: `Booking ${status === 'approved' ? 'Approved' : 'Rejected'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1a202c; margin-bottom: 20px;">Booking ${status === 'approved' ? 'Approved' : 'Rejected'}</h2>
        <p style="color: #4a5568; margin-bottom: 15px;">Your booking request has been ${status}:</p>
        
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <p style="margin: 5px 0;"><strong>Room:</strong> ${bookingDetails.roomName}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(bookingDetails.date).toLocaleDateString()}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${bookingDetails.startTime} - ${bookingDetails.endTime}</p>
          <p style="margin: 5px 0;"><strong>Purpose:</strong> ${bookingDetails.purpose}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${status === 'approved' ? '#48bb78' : '#f56565'}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard" 
             style="display: inline-block; background-color: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Dashboard
          </a>
        </div>
      </div>
    `
  })
};

// Email sending functions
export const sendBookingConfirmation = async (userEmail, bookingDetails) => {
  const emailData = emailTemplates.bookingConfirmation({ ...bookingDetails, userEmail })
  return sendEmail(emailData)
}

export const sendAdminNotification = async (adminEmail, bookingDetails) => {
  const emailData = emailTemplates.adminNotification(bookingDetails)
  return sendEmail(emailData)
}

export const sendApprovalRequest = async (adminEmail, bookingDetails) => {
  const emailData = emailTemplates.approvalRequest(bookingDetails)
  return sendEmail(emailData)
}

export const sendApprovalStatus = async (userEmail, bookingDetails, status) => {
  const emailData = emailTemplates.approvalStatus({ ...bookingDetails, userEmail }, status)
  return sendEmail(emailData)
} 