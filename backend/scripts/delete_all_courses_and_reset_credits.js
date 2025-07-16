// Script to delete all courses and reset all user credits (points)
import pool from '../db.js';

async function deleteAllCoursesAndResetCredits() {
  const client = await pool.connect();
  try {
    console.log('Starting deletion of all courses and reset of user credits...');
    await client.query('BEGIN');

    // Delete from course_enrollments if exists
    try {
      await client.query('DELETE FROM course_enrollments');
      console.log('Deleted all course enrollments.');
    } catch (e) {
      console.log('course_enrollments table does not exist or error:', e.message);
    }

    // Delete from student_courses if exists
    try {
      await client.query('DELETE FROM student_courses');
      console.log('Deleted all student_courses.');
    } catch (e) {
      console.log('student_courses table does not exist or error:', e.message);
    }

    // Delete from courses
    await client.query('DELETE FROM courses');
    console.log('Deleted all courses.');

    // Reset all user points/credits to 0
    await client.query('UPDATE user_points SET balance = 0');
    console.log('Reset all user points/credits to 0.');

    await client.query('COMMIT');
    console.log('All courses deleted and user credits reset successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during deletion/reset:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

deleteAllCoursesAndResetCredits(); 