import pool from '../db.js';

class NotificationService {
  // Create a new notification
  static async createNotification(userId, type, title, message, metadata = null) {
    try {
      const result = await pool.query(`
        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [userId, type, title, message, metadata]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notifications for a user
  static async getUserNotifications(userId, limit = 50) {
    try {
      const result = await pool.query(`
        SELECT * FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `, [userId, limit]);
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  // Get unread notifications count for a user
  static async getUnreadCount(userId) {
    try {
      const result = await pool.query(`
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_id = $1 AND is_read = FALSE
      `, [userId]);
      
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const result = await pool.query(`
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE id = $1 AND user_id = $2 
        RETURNING *
      `, [notificationId, userId]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      const result = await pool.query(`
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE user_id = $1 AND is_read = FALSE
        RETURNING *
      `, [userId]);
      
      return result.rows;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId, userId) {
    try {
      const result = await pool.query(`
        DELETE FROM notifications 
        WHERE id = $1 AND user_id = $2 
        RETURNING *
      `, [notificationId, userId]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Notification types and their default messages
  static getNotificationTypes() {
    return {
      LIVE_SESSION_APPROVED: {
        type: 'live_session_approved',
        title: 'Live Session Approved',
        defaultMessage: 'Your live session has been approved by the admin.'
      },
      LIVE_SESSION_REJECTED: {
        type: 'live_session_rejected',
        title: 'Live Session Rejected',
        defaultMessage: 'Your live session has been rejected by the admin.'
      },
      QUIZ_CREATED: {
        type: 'quiz_created',
        title: 'New Quiz Created',
        defaultMessage: 'A new quiz has been created and requires approval.'
      },
      QUIZ_APPROVED: {
        type: 'quiz_approved',
        title: 'Quiz Approved',
        defaultMessage: 'Your quiz has been approved by the admin.'
      },
      QUIZ_REJECTED: {
        type: 'quiz_rejected',
        title: 'Quiz Rejected',
        defaultMessage: 'Your quiz has been rejected by the admin.'
      },
      COURSE_APPROVED: {
        type: 'course_approved',
        title: 'Course Approved',
        defaultMessage: 'Your course has been approved by the admin.'
      },
      COURSE_REJECTED: {
        type: 'course_rejected',
        title: 'Course Rejected',
        defaultMessage: 'Your course has been rejected by the admin.'
      },
      LIVE_SESSION_STARTING: {
        type: 'live_session_starting',
        title: 'Live Session Starting',
        defaultMessage: 'A live session you purchased is starting soon.'
      },
      POINTS_PURCHASED: {
        type: 'points_purchased',
        title: 'Points Purchased',
        defaultMessage: 'Your points purchase was successful.'
      },
      POINTS_SPENT: {
        type: 'points_spent',
        title: 'Points Spent',
        defaultMessage: 'You have spent points on a live session.'
      },
      SYSTEM_MESSAGE: {
        type: 'system_message',
        title: 'System Message',
        defaultMessage: 'You have received a system message.'
      },
      LIVE_SECTION_CREATED: {
        type: 'live_section_created',
        title: 'New Live Section Created',
        defaultMessage: 'A new live section has been created and requires approval.'
      },
      LIVE_SECTION_APPROVED: {
        type: 'live_section_approved',
        title: 'Live Section Approved',
        defaultMessage: 'Your live section has been approved by the admin.'
      },
      LIVE_SECTION_REJECTED: {
        type: 'live_section_rejected',
        title: 'Live Section Rejected',
        defaultMessage: 'Your live section has been rejected by the admin.'
      },
      PRIVATE_CLASS_STARTING: {
        type: 'private_class_starting',
        title: 'Private Class Starting',
        defaultMessage: 'Your private class is starting soon.'
      },
      POINT_CODE_USED: {
        type: 'point_code_used',
        title: 'Point Code Used',
        defaultMessage: 'A student has used a point code.'
      }
    };
  }

  // Helper method to create notifications for common events
  static async notifyLiveSessionApproved(userId, sessionTitle) {
    const notificationType = this.getNotificationTypes().LIVE_SESSION_APPROVED;
    return await this.createNotification(
      userId,
      notificationType.type,
      notificationType.title,
      `Your live session "${sessionTitle}" has been approved.`,
      { sessionTitle }
    );
  }

  static async notifyLiveSessionRejected(userId, sessionTitle, reason = null) {
    const notificationType = this.getNotificationTypes().LIVE_SESSION_REJECTED;
    const message = reason 
      ? `Your live session "${sessionTitle}" has been rejected. Reason: ${reason}`
      : `Your live session "${sessionTitle}" has been rejected.`;
    
    return await this.createNotification(
      userId,
      notificationType.type,
      notificationType.title,
      message,
      { sessionTitle, reason }
    );
  }

  static async notifyQuizCreated(quizId, quizTitle, professorName, professorId, adminId) {
    return await this.createNotification(
      adminId,
      'quiz_created',
      'New Quiz Created',
      `Professor ${professorName} has created a new quiz "${quizTitle}" that requires approval.`,
      { quizId, quizTitle, professorName, professorId }
    );
  }

  static async notifyQuizApproved(userId, quizTitle, adminName) {
    return await this.createNotification(
      userId,
      'quiz_approved',
      'Quiz Approved',
      `The quiz "${quizTitle}" has been approved by ${adminName}.`,
      { quizTitle, adminName }
    );
  }

  static async notifyPointCodeUsed(codeId, code, points, userName, userId, adminId) {
    return await this.createNotification(
      adminId,
      'point_code_used',
      'Point Code Used',
      `Student ${userName} has used point code "${code}" to redeem ${points} points.`,
      { codeId, code, points, userName, userId }
    );
  }

  static async notifyQuizRejected(userId, quizTitle, reason = null) {
    const notificationType = this.getNotificationTypes().QUIZ_REJECTED;
    const message = reason 
      ? `Your quiz "${quizTitle}" has been rejected. Reason: ${reason}`
      : `Your quiz "${quizTitle}" has been rejected.`;
    
    return await this.createNotification(
      userId,
      notificationType.type,
      notificationType.title,
      message,
      { quizTitle, reason }
    );
  }

  static async notifyPointsPurchased(userId, points, amount) {
    const notificationType = this.getNotificationTypes().POINTS_PURCHASED;
    return await this.createNotification(
      userId,
      notificationType.type,
      notificationType.title,
      `You have successfully purchased ${points} points for ${amount} DZD.`,
      { points, amount }
    );
  }

  static async notifyLiveSessionStarting(userId, sessionTitle, startTime) {
    const notificationType = this.getNotificationTypes().LIVE_SESSION_STARTING;
    return await this.createNotification(
      userId,
      notificationType.type,
      notificationType.title,
      `Your live session "${sessionTitle}" is starting at ${startTime}.`,
      { sessionTitle, startTime }
    );
  }

  static async notifyPrivateClassStarting(userId, classTitle, otherPartyName, startTime) {
    return await this.createNotification(
      userId,
      'private_class_starting',
      'Private Class Starting',
      `Your private class "${classTitle}" with ${otherPartyName} is starting at ${startTime}.`,
      { classTitle, otherPartyName, startTime }
    );
  }

  // Private Class Notifications
  static async notifyPrivateClassRequestReceived(teacherId, studentName, requestData) {
    return await this.createNotification(
      teacherId,
      'private_class_request',
      'New Private Class Request',
      `You have received a new private class request from ${studentName} for ${requestData.subject}.`,
      { studentName, requestData }
    );
  }

  static async notifyPrivateClassApproved(studentId, teacherName, requestData) {
    return await this.createNotification(
      studentId,
      'private_class_approved',
      'Private Class Request Approved',
      `Your private class request for ${requestData.subject} has been approved by ${teacherName}. Please complete the payment.`,
      { teacherName, requestData }
    );
  }

  static async notifyPrivateClassRejected(studentId, teacherName, requestData, rejectionReason) {
    const message = rejectionReason 
      ? `Your private class request for ${requestData.subject} has been rejected by ${teacherName}. Reason: ${rejectionReason}`
      : `Your private class request for ${requestData.subject} has been rejected by ${teacherName}.`;
    
    return await this.createNotification(
      studentId,
      'private_class_rejected',
      'Private Class Request Rejected',
      message,
      { teacherName, requestData, rejectionReason }
    );
  }

  static async notifyPrivateClassPurchased(studentId, teacherName, requestData, pointsUsed) {
    return await this.createNotification(
      studentId,
      'private_class_purchased',
      'Private Class Purchased',
      `You have successfully purchased a private class with ${teacherName} for ${requestData.subject}. ${pointsUsed} points have been deducted.`,
      { teacherName, requestData, pointsUsed }
    );
  }

  static async notifyPrivateClassPaymentReceived(teacherId, studentName, requestData, pointsUsed) {
    return await this.createNotification(
      teacherId,
      'private_class_payment_received',
      'Payment Received for Private Class',
      `${studentName} has paid ${pointsUsed} points for the private class in ${requestData.subject}.`,
      { studentName, requestData, pointsUsed }
    );
  }

  static async notifyPrivateClassTimeUpdated(studentId, teacherName, requestData, newTime) {
    return await this.createNotification(
      studentId,
      'private_class_time_updated',
      'Private Class Time Updated',
      `Your private class with ${teacherName} for ${requestData.subject} has been rescheduled to ${newTime}.`,
      { teacherName, requestData, newTime }
    );
  }

  // Course Purchase Notifications
  static async notifyCoursePurchased(courseId, courseTitle, studentName, studentId, price, courseType = 'course') {
    try {
      // Get course creator (professor)
      const courseResult = await pool.query(
        'SELECT created_by FROM courses WHERE id = $1',
        [courseId]
      );

      if (courseResult.rows.length === 0) {
        console.error('Course not found for notification:', courseId);
        return;
      }

      const professorId = courseResult.rows[0].created_by;

      // Get all admin users
      const adminResult = await pool.query(
        'SELECT id FROM users WHERE role = $1',
        ['admin']
      );

      const adminIds = adminResult.rows.map(row => row.id);

      // Create notifications for professor and admins
      const notifications = [];

      // Professor notification
      if (professorId) {
        notifications.push({
          user_id: professorId,
          type: 'course_purchased',
          title: 'Course Purchased',
          message: `Student ${studentName} has purchased your course "${courseTitle}" for ${price} points.`,
          metadata: JSON.stringify({
            course_id: courseId,
            course_title: courseTitle,
            student_name: studentName,
            student_id: studentId,
            price: price,
            course_type: courseType
          })
        });
      }

      // Admin notifications
      adminIds.forEach(adminId => {
        notifications.push({
          user_id: adminId,
          type: 'course_purchased',
          title: 'Course Purchase',
          message: `Student ${studentName} has purchased course "${courseTitle}" for ${price} points.`,
          metadata: JSON.stringify({
            course_id: courseId,
            course_title: courseTitle,
            student_name: studentName,
            student_id: studentId,
            price: price,
            course_type: courseType
          })
        });
      });

      // Create all notifications
      for (const notification of notifications) {
        await this.createNotification(
          notification.user_id,
          notification.type,
          notification.title,
          notification.message,
          JSON.parse(notification.metadata)
        );
      }

      console.log(`✅ Course purchase notifications sent for course ${courseId}`);
    } catch (error) {
      console.error('Error notifying course purchase:', error);
    }
  }

  // Live Session Purchase Notifications
  static async notifyLiveSessionPurchased(sessionId, sessionTitle, professorName, studentName, studentId, price) {
    try {
      // Get all admin users
      const adminResult = await pool.query(
        'SELECT id FROM users WHERE role = $1',
        ['admin']
      );

      const adminIds = adminResult.rows.map(row => row.id);

      // Get professor ID from session
      const sessionResult = await pool.query(
        'SELECT professor_id FROM live_sessions WHERE id = $1',
        [sessionId]
      );

      let professorId = null;
      if (sessionResult.rows.length > 0) {
        professorId = sessionResult.rows[0].professor_id;
      }

      // Create notifications for professor and admins
      const notifications = [];

      // Professor notification
      if (professorId) {
        notifications.push({
          user_id: professorId,
          type: 'live_session_purchased',
          title: 'Live Session Purchased',
          message: `Student ${studentName} has purchased your live session "${sessionTitle}" for ${price} points.`,
          metadata: JSON.stringify({
            session_id: sessionId,
            session_title: sessionTitle,
            student_name: studentName,
            student_id: studentId,
            price: price
          })
        });
      }

      // Admin notifications
      adminIds.forEach(adminId => {
        notifications.push({
          user_id: adminId,
          type: 'live_session_purchased',
          title: 'Live Session Purchase',
          message: `Student ${studentName} has purchased live session "${sessionTitle}" for ${price} points.`,
          metadata: JSON.stringify({
            session_id: sessionId,
            session_title: sessionTitle,
            student_name: studentName,
            student_id: studentId,
            price: price
          })
        });
      });

      // Create all notifications
      for (const notification of notifications) {
        await this.createNotification(
          notification.user_id,
          notification.type,
          notification.title,
          notification.message,
          JSON.parse(notification.metadata)
        );
      }

      console.log(`✅ Live session purchase notifications sent for session ${sessionId}`);
    } catch (error) {
      console.error('Error notifying live session purchase:', error);
    }
  }

  // Course Creation Notifications
  static async notifyCourseCreated(courseId, courseTitle, professorName, professorId) {
    try {
      // Get all admin users
      const adminResult = await pool.query(
        'SELECT id FROM users WHERE role = $1',
        ['admin']
      );

      const adminIds = adminResult.rows.map(row => row.id);

      // Create notifications for admins
      const notifications = [];

      // Admin notifications
      adminIds.forEach(adminId => {
        notifications.push({
          user_id: adminId,
          type: 'course_created',
          title: 'New Course Created',
          message: `Professor ${professorName} has created a new course "${courseTitle}" that requires approval.`,
          metadata: JSON.stringify({
            course_id: courseId,
            course_title: courseTitle,
            professor_name: professorName,
            professor_id: professorId
          })
        });
      });

      // Create all notifications
      for (const notification of notifications) {
        await this.createNotification(
          notification.user_id,
          notification.type,
          notification.title,
          notification.message,
          JSON.parse(notification.metadata)
        );
      }

      console.log(`✅ Course creation notifications sent for course ${courseId}`);
    } catch (error) {
      console.error('Error notifying course creation:', error);
    }
  }

  // Course Approval Notifications
  static async notifyCourseApproved(courseId, courseTitle, professorId, professorName, adminName) {
    try {
      // Create notification for professor
      await this.createNotification(
        professorId,
        'course_approved',
        'Course Approved',
        `Your course "${courseTitle}" has been approved by ${adminName}.`,
        {
          course_id: courseId,
          course_title: courseTitle,
          admin_name: adminName
        }
      );

      console.log(`✅ Course approval notification sent for course ${courseId}`);
    } catch (error) {
      console.error('Error notifying course approval:', error);
    }
  }

  // Course Rejection Notifications
  static async notifyCourseRejected(courseId, courseTitle, professorId, professorName, adminName, reason) {
    try {
      const message = reason 
        ? `Your course "${courseTitle}" has been rejected by ${adminName}. Reason: ${reason}`
        : `Your course "${courseTitle}" has been rejected by ${adminName}.`;

      // Create notification for professor
      await this.createNotification(
        professorId,
        'course_rejected',
        'Course Rejected',
        message,
        {
          course_id: courseId,
          course_title: courseTitle,
          admin_name: adminName,
          reason: reason
        }
      );

      console.log(`✅ Course rejection notification sent for course ${courseId}`);
    } catch (error) {
      console.error('Error notifying course rejection:', error);
    }
  }

  // Live Session Creation Notifications
  static async notifyLiveSessionCreated(sessionId, sessionTitle, professorName, professorId) {
    try {
      // Get all admin users
      const adminResult = await pool.query(
        'SELECT id FROM users WHERE role = $1',
        ['admin']
      );

      const adminIds = adminResult.rows.map(row => row.id);

      // Create notifications for admins
      const notifications = [];

      // Admin notifications
      adminIds.forEach(adminId => {
        notifications.push({
          user_id: adminId,
          type: 'live_session_created',
          title: 'New Live Session Created',
          message: `Professor ${professorName} has created a new live session "${sessionTitle}" that requires approval.`,
          metadata: JSON.stringify({
            session_id: sessionId,
            session_title: sessionTitle,
            professor_name: professorName,
            professor_id: professorId
          })
        });
      });

      // Create all notifications
      for (const notification of notifications) {
        await this.createNotification(
          notification.user_id,
          notification.type,
          notification.title,
          notification.message,
          JSON.parse(notification.metadata)
        );
      }

      console.log(`✅ Live session creation notifications sent for session ${sessionId}`);
    } catch (error) {
      console.error('Error notifying live session creation:', error);
    }
  }

  // Live Session Approval Notifications
  static async notifyLiveSessionApproved(sessionId, sessionTitle, professorId, professorName, adminName) {
    try {
      // Create notification for professor
      await this.createNotification(
        professorId,
        'live_session_approved',
        'Live Session Approved',
        `Your live session "${sessionTitle}" has been approved by ${adminName}.`,
        {
          session_id: sessionId,
          session_title: sessionTitle,
          admin_name: adminName
        }
      );

      console.log(`✅ Live session approval notification sent for session ${sessionId}`);
    } catch (error) {
      console.error('Error notifying live session approval:', error);
    }
  }

  // Live Session Rejection Notifications
  static async notifyLiveSessionRejected(sessionId, sessionTitle, professorId, professorName, adminName, reason) {
    try {
      const message = reason 
        ? `Your live session "${sessionTitle}" has been rejected by ${adminName}. Reason: ${reason}`
        : `Your live session "${sessionTitle}" has been rejected by ${adminName}.`;

      // Create notification for professor
      await this.createNotification(
        professorId,
        'live_session_rejected',
        'Live Session Rejected',
        message,
        {
          session_id: sessionId,
          session_title: sessionTitle,
          admin_name: adminName,
          reason: reason
        }
      );

      console.log(`✅ Live session rejection notification sent for session ${sessionId}`);
    } catch (error) {
      console.error('Error notifying live session rejection:', error);
    }
  }

  // Live Section Notifications
  static async notifyLiveSectionCreated(sectionId, sectionTitle, professorName, professorId) {
    try {
      // Get all admin users
      const adminResult = await pool.query(
        'SELECT id FROM users WHERE role = $1',
        ['admin']
      );

      const adminIds = adminResult.rows.map(row => row.id);

      // Create notifications for admins
      const notifications = [];

      // Admin notifications
      adminIds.forEach(adminId => {
        notifications.push({
          user_id: adminId,
          type: 'live_section_created',
          title: 'New Live Section Created',
          message: `Professor ${professorName} has created a new live section "${sectionTitle}" that requires approval.`,
          metadata: JSON.stringify({
            section_id: sectionId,
            section_title: sectionTitle,
            professor_name: professorName,
            professor_id: professorId
          })
        });
      });

      // Create all notifications
      for (const notification of notifications) {
        await this.createNotification(
          notification.user_id,
          notification.type,
          notification.title,
          notification.message,
          JSON.parse(notification.metadata)
        );
      }

      console.log(`✅ Live section creation notifications sent for section ${sectionId}`);
    } catch (error) {
      console.error('Error notifying live section creation:', error);
    }
  }

  static async notifyLiveSectionApproved(sectionId, sectionTitle, professorId, professorName, adminName) {
    try {
      // Create notification for professor
      await this.createNotification(
        professorId,
        'live_section_approved',
        'Live Section Approved',
        `Your live section "${sectionTitle}" has been approved by ${adminName}.`,
        {
          section_id: sectionId,
          section_title: sectionTitle,
          admin_name: adminName
        }
      );

      console.log(`✅ Live section approval notification sent for section ${sectionId}`);
    } catch (error) {
      console.error('Error notifying live section approval:', error);
    }
  }

  static async notifyLiveSectionRejected(sectionId, sectionTitle, professorId, professorName, adminName, reason) {
    try {
      const message = reason 
        ? `Your live section "${sectionTitle}" has been rejected by ${adminName}. Reason: ${reason}`
        : `Your live section "${sectionTitle}" has been rejected by ${adminName}.`;

      // Create notification for professor
      await this.createNotification(
        professorId,
        'live_section_rejected',
        'Live Section Rejected',
        message,
        {
          section_id: sectionId,
          section_title: sectionTitle,
          admin_name: adminName,
          reason: reason
        }
      );

      console.log(`✅ Live section rejection notification sent for section ${sectionId}`);
    } catch (error) {
      console.error('Error notifying live section rejection:', error);
    }
  }
}

export default NotificationService; 