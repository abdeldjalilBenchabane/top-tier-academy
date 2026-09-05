import pool from '../db.js';
import NotificationService from './notificationService.js';
import { sendLiveSessionReminderEmailToStudent, sendLiveSessionReminderEmailToProfessor, sendPrivateClassReminderEmailToStudent, sendPrivateClassReminderEmailToProfessor } from './emailService.js';
import { formatTimeForDisplay, formatDateForDisplay } from '../utils/timezone.js';

class SessionReminderService {
  // Check for live sessions starting in 15 minutes
  static async checkLiveSessionReminders() {
    try {
      const now = new Date();
      const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
      
      // Get live sessions starting in the next 15 minutes
      const sessions = await pool.query(`
        SELECT 
          ls.id,
          ls.title,
          ls.start_time,
          ls.duration,
          ls.professor_id,
          u.name as professor_name,
          u.email as professor_email
        FROM live_sessions ls
        JOIN users u ON ls.professor_id = u.id
        WHERE ls.status = 'scheduled'
        AND ls.start_time BETWEEN $1 AND $2
        AND ls.is_approved = true
      `, [now.toISOString(), fifteenMinutesFromNow.toISOString()]);
      
      console.log(`🔔 Found ${sessions.rows.length} live sessions starting in 15 minutes`);
      
      for (const session of sessions.rows) {
        await this.sendLiveSessionReminders(session);
      }
    } catch (error) {
      console.error('Error checking live session reminders:', error);
    }
  }
  
  // Send reminders for a specific live session
  static async sendLiveSessionReminders(session) {
    try {
      // Get students who purchased this session
      const students = await pool.query(`
        SELECT 
          u.id,
          u.name,
          u.email
        FROM users u
        JOIN point_transactions pt ON u.id = pt.user_id
        WHERE pt.metadata->>'session_id' = $1
        AND pt.transaction_type = 'spend'
        AND pt.status = 'completed'
      `, [session.id]);
      
      console.log(`📧 Sending live session reminders for "${session.title}" to ${students.rows.length} students`);
      
      // Send notifications and emails to students
      for (const student of students.rows) {
        // Send notification
        await NotificationService.notifyLiveSessionStarting(
          student.id,
          session.title,
          formatTimeForDisplay(session.start_time) + " " + formatDateForDisplay(session.start_time)
        );
        
        // Send email
        await sendLiveSessionReminderEmailToStudent(
          student.email,
          student.name,
          session.title,
          session.professor_name,
          formatTimeForDisplay(session.start_time) + " " + formatDateForDisplay(session.start_time)
        );
      }
      
      // Send notification and email to professor
      await NotificationService.notifyLiveSessionStarting(
        session.professor_id,
        session.title,
        formatTimeForDisplay(session.start_time) + " " + formatDateForDisplay(session.start_time)
      );
      
      await sendLiveSessionReminderEmailToProfessor(
        session.professor_email,
        session.professor_name,
        session.title,
        formatTimeForDisplay(session.start_time) + " " + formatDateForDisplay(session.start_time)
      );
      
      console.log(`✅ Live session reminders sent for session ${session.id}`);
    } catch (error) {
      console.error(`Error sending live session reminders for session ${session.id}:`, error);
    }
  }
  
  // Check for private classes starting in 15 minutes
  static async checkPrivateClassReminders() {
    try {
      const now = new Date();
      const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
      
      // Get private classes starting in the next 15 minutes
      const privateClasses = await pool.query(`
        SELECT 
          pcr.id,
          pcr.title,
          pcr.scheduled_at,
          pcr.student_id,
          pcr.teacher_name,
          student.name as student_name,
          student.email as student_email,
          teacher.id as teacher_id,
          teacher.name as teacher_name,
          teacher.email as teacher_email
        FROM private_class_requests pcr
        JOIN users student ON pcr.student_id = student.id
        JOIN users teacher ON teacher.name = pcr.teacher_name
        WHERE pcr.status = 'approved'
        AND pcr.scheduled_at BETWEEN $1 AND $2
      `, [now.toISOString(), fifteenMinutesFromNow.toISOString()]);
      
      console.log(`🔔 Found ${privateClasses.rows.length} private classes starting in 15 minutes`);
      
      for (const privateClass of privateClasses.rows) {
        await this.sendPrivateClassReminders(privateClass);
      }
    } catch (error) {
      console.error('Error checking private class reminders:', error);
    }
  }
  
  // Send reminders for a specific private class
  static async sendPrivateClassReminders(privateClass) {
    try {
      console.log(`📧 Sending private class reminders for "${privateClass.title}"`);
      
      // Send notification and email to student
      await NotificationService.notifyPrivateClassStarting(
        privateClass.student_id,
        privateClass.title,
        privateClass.teacher_name,
        formatTimeForDisplay(privateClass.scheduled_at) + " " + formatDateForDisplay(privateClass.scheduled_at)
      );
      
      await sendPrivateClassReminderEmailToStudent(
        privateClass.student_email,
        privateClass.student_name,
        privateClass.title,
        privateClass.teacher_name,
        formatTimeForDisplay(privateClass.scheduled_at) + " " + formatDateForDisplay(privateClass.scheduled_at)
      );
      
      // Send notification and email to professor
      await NotificationService.notifyPrivateClassStarting(
        privateClass.teacher_id,
        privateClass.title,
        privateClass.student_name,
        formatTimeForDisplay(privateClass.scheduled_at) + " " + formatDateForDisplay(privateClass.scheduled_at)
      );
      
      await sendPrivateClassReminderEmailToProfessor(
        privateClass.teacher_email,
        privateClass.teacher_name,
        privateClass.title,
        privateClass.student_name,
        formatTimeForDisplay(privateClass.scheduled_at) + " " + formatDateForDisplay(privateClass.scheduled_at)
      );
      
      console.log(`✅ Private class reminders sent for class ${privateClass.id}`);
    } catch (error) {
      console.error(`Error sending private class reminders for class ${privateClass.id}:`, error);
    }
  }
  
  // Run all reminder checks
  static async runReminderChecks() {
    console.log('🕐 Running session reminder checks...');
    await this.checkLiveSessionReminders();
    await this.checkPrivateClassReminders();
    console.log('✅ Reminder checks completed');
  }
}

export default SessionReminderService; 