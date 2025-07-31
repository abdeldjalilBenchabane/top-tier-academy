# Notification System

## Overview

The notification system provides real-time notifications to users about various events in the platform, such as live session approvals, quiz results, points purchases, and system messages.

## Features

- **Real-time notifications** with unread count badge
- **Multiple notification types** (live sessions, quizzes, points, system messages)
- **Mark as read** functionality
- **Delete notifications** 
- **Mark all as read** option
- **Automatic notifications** for various platform events
- **Responsive design** with dropdown interface

## Database Schema

The notifications are stored in the `notifications` table:

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Notification Types

### 1. Live Session Notifications
- `live_session_created` - When a professor creates a new live session (notifies admins)
- `live_session_approved` - When a live session is approved by admin
- `live_session_rejected` - When a live session is rejected by admin
- `live_session_starting` - When a purchased session is about to start

### 2. Quiz Notifications
- `quiz_created` - When a professor creates a new quiz (notifies admins)
- `quiz_approved` - When a quiz is approved by admin (notifies professor and students)
- `quiz_rejected` - When a quiz is rejected by admin

### 3. Point Code Notifications
- `point_code_used` - When a student uses a point code (notifies admins)

### 4. Course Notifications
- `course_created` - When a professor creates a new course (notifies admins)
- `course_approved` - When a course is approved by admin
- `course_rejected` - When a course is rejected by admin
- `course_purchased` - When a student purchases a course (notifies professor and admin)
- `live_session_purchased` - When a student purchases a live session (notifies professor and admin)

### 5. Points Notifications
- `points_purchased` - When points are successfully purchased
- `points_spent` - When points are spent on courses/sessions

### 6. Private Class Notifications
- `private_class_request` - When a student sends a private class request to a teacher
- `private_class_approved` - When a teacher approves a private class request
- `private_class_rejected` - When a teacher rejects a private class request
- `private_class_purchased` - When a student purchases a private class
- `private_class_payment_received` - When a teacher receives payment for a private class
- `private_class_time_updated` - When a teacher updates the time for a private class

### 7. System Notifications
- `system_message` - General system announcements

## Backend Implementation

### Notification Service (`backend/services/notificationService.js`)

The notification service provides methods to:
- Create notifications
- Get user notifications
- Get unread count
- Mark notifications as read
- Delete notifications
- Helper methods for common notification types

### API Endpoints

#### GET `/api/notifications`
Get all notifications for the authenticated user.

#### PATCH `/api/notifications/:id/read`
Mark a specific notification as read.

#### PATCH `/api/notifications/mark-all-read`
Mark all notifications as read for the user.

#### DELETE `/api/notifications/:id`
Delete a specific notification.

#### POST `/api/notifications` (Admin only)
Create a new notification (admin only).

## Frontend Implementation

### Notification Bell Component (`src/components/ui/NotificationBell.tsx`)

The notification bell component provides:
- Real-time notification count badge
- Dropdown with notification list
- Mark as read functionality
- Delete notification functionality
- Mark all as read option
- Auto-refresh every 30 seconds

### Integration

The notification bell is integrated into the navbar (`src/components/navigation/Navbar.tsx`) and appears for all authenticated users.

## Automatic Notifications

The system automatically sends notifications for:

### 1. Live Session Creation and Approval
When professors create live sessions, admins receive notifications and emails. When admins approve or reject live sessions, professors receive notifications and emails.

**Location**: `backend/routes/live-sessions.js`
- Live session creation: `POST /api/professors/:professorId/live-sessions`
- Live session approval: `PATCH /api/live-sessions/:id/approve`
- Live session rejection: `PATCH /api/live-sessions/:id/reject`

### 2. Points Purchase
When a user successfully purchases points, they receive a notification.

**Location**: `backend/routes/payments.js`
- Webhook: `POST /api/payments/webhook`
- Admin purchase: `POST /api/points/admin/buy-for-student`

### 3. Private Class Requests
When students submit private class requests, teachers receive notifications and emails. When teachers approve/reject requests, students receive notifications and emails.

**Location**: `backend/routes/private-class-requests.js`
- Request creation: `POST /api/private-class-requests`
- Status update: `PATCH /api/private-class-requests/:requestId/status`
- Purchase: `POST /api/private-class-requests/:requestId/purchase`

### 4. Course Creation and Approval
When professors assign paths to their courses (material or language), admins receive notifications and emails. When admins approve or reject courses, professors receive notifications and emails.

**Location**: `backend/routes/courses.js`
- Course path assignment: `PUT /api/courses/:id/assign-material`, `PUT /api/courses/:id/create-material`, `PUT /api/courses/:id/language-path`
- Course approval: `PUT /api/courses/:id/approve`
- Course rejection: `PUT /api/courses/:id/reject`

### 5. Quiz Management
When professors create quizzes and admins approve them, notifications and emails are sent to relevant parties.

**Location**: `backend/routes/quizzes.js`
- Quiz creation: `POST /api/quizzes` (notifies all admins)
- Quiz approval: `PATCH /api/quizzes/admin/quizzes/:id/approve` (notifies professor and enrolled students)

### 6. Point Code Usage
When students use point codes to redeem points, admins receive notifications and emails.

**Location**: `backend/routes/pointCodes.js`
- Point code redemption: `POST /api/point-codes/codes/redeem` (notifies all admins)

### 7. Course Purchases
When students purchase courses or live sessions, professors and admins receive notifications and emails.

**Location**: `backend/routes/points.js` and `backend/routes/live-sessions.js`
- Course purchase: `POST /api/points/buy-course`
- Live session purchase: `POST /api/live-sessions/:sessionId/purchase`

## Usage Examples

### Creating a Notification (Backend)

```javascript
import NotificationService from '../services/notificationService.js';

// Create a simple notification
await NotificationService.createNotification(
  userId,
  'system_message',
  'System Maintenance',
  'The platform will be under maintenance tonight.',
  { maintenanceTime: '2:00 AM to 4:00 AM' }
);

// Use helper methods for common notifications
await NotificationService.notifyLiveSessionApproved(userId, sessionTitle);
await NotificationService.notifyPointsPurchased(userId, points, amount);
await NotificationService.notifyQuizCreated(quizId, quizTitle, professorName, professorId, adminId);
await NotificationService.notifyQuizApproved(userId, quizTitle, adminName);
await NotificationService.notifyPointCodeUsed(codeId, code, points, userName, userId, adminId);
await NotificationService.notifyPrivateClassRequestReceived(teacherId, studentName, requestData);
await NotificationService.notifyPrivateClassApproved(studentId, teacherName, requestData);
await NotificationService.notifyPrivateClassRejected(studentId, teacherName, requestData, rejectionReason);
await NotificationService.notifyPrivateClassPurchased(studentId, teacherName, requestData, pointsUsed);
await NotificationService.notifyPrivateClassPaymentReceived(teacherId, studentName, requestData, pointsUsed);
await NotificationService.notifyPrivateClassTimeUpdated(studentId, teacherName, requestData, newTime);
```

### Using the Notification Bell (Frontend)

The notification bell is automatically available in the navbar for all authenticated users. Users can:

1. Click the bell icon to see notifications
2. Click the checkmark to mark as read
3. Click the trash icon to delete
4. Click "Mark all as read" to mark all notifications as read

## Styling

The notification bell uses Tailwind CSS classes and includes:
- Badge for unread count
- Dropdown menu with notifications
- Hover effects
- Responsive design
- Icons for different notification types

## Testing

To test the notification system:

1. **Backend**: The system automatically sends notifications for various events
2. **Frontend**: The notification bell appears in the navbar for authenticated users
3. **Manual Testing**: You can create test notifications using the notification service

## Future Enhancements

Potential improvements:
- Push notifications for mobile
- Email notifications
- Notification preferences per user
- Notification categories and filtering
- Real-time updates using WebSockets
- Notification templates
- Bulk operations (mark multiple as read, delete multiple)

## Troubleshooting

### Common Issues

1. **Notifications not appearing**: Check if the user is authenticated and the API is responding
2. **Badge not updating**: The component auto-refreshes every 30 seconds
3. **Database errors**: Ensure the notifications table has all required columns

### Debug Commands

```bash
# Check notifications table structure
psql -d tth_database -c "\d notifications"

# Check recent notifications
psql -d tth_database -c "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;"

# Check unread count for a user
psql -d tth_database -c "SELECT COUNT(*) FROM notifications WHERE user_id = 1 AND is_read = FALSE;"
```

## Security

- Notifications are user-specific (users can only see their own notifications)
- Admin endpoints require admin role verification
- All endpoints require authentication
- SQL injection protection through parameterized queries 