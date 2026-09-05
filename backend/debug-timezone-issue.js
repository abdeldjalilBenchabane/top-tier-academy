// Debug script to identify timezone issues
import { convertDatetimeLocalToUTC } from './utils/timezone.js';

console.log('🔍 TIMEZONE DEBUG SCRIPT');
console.log('========================\n');

// 1. Check system timezone
console.log('1️⃣ SYSTEM TIMEZONE INFO:');
console.log('   Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('   Offset:', new Date().getTimezoneOffset() / 60, 'hours');
console.log('   Current time:', new Date().toLocaleString());
console.log('   Current UTC:', new Date().toISOString());
console.log('');

// 2. Test the timezone conversion function
console.log('2️⃣ TESTING TIMEZONE CONVERSION:');
const testTimes = [
  '2024-01-15T03:00', // 3 AM
  '2024-01-15T15:00', // 3 PM
  '2024-01-15T00:00', // Midnight
];

testTimes.forEach(testTime => {
  console.log(`   Input: ${testTime}`);
  
  try {
    const utcTime = convertDatetimeLocalToUTC(testTime);
    const localDate = new Date(testTime);
    const utcDate = new Date(utcTime);
    
    console.log(`   UTC stored: ${utcTime}`);
    console.log(`   Local display: ${utcDate.toLocaleTimeString()}`);
    console.log(`   Expected: ${localDate.toLocaleTimeString()}`);
    console.log(`   Match: ${utcDate.toLocaleTimeString() === localDate.toLocaleTimeString() ? '✅' : '❌'}`);
    console.log('');
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    console.log('');
  }
});

// 3. Test the complete flow
console.log('3️⃣ COMPLETE FLOW TEST:');
const userSelectedTime = '2024-01-15T03:00';
console.log(`   User selects: ${userSelectedTime} (3 AM)`);

try {
  // Backend conversion
  const utcTime = convertDatetimeLocalToUTC(userSelectedTime);
  console.log(`   Backend stores: ${utcTime}`);
  
  // Frontend display
  const frontendDate = new Date(utcTime);
  console.log(`   Frontend displays: ${frontendDate.toLocaleTimeString()}`);
  
  // Check if correct
  const expectedTime = new Date(userSelectedTime).toLocaleTimeString();
  const actualTime = frontendDate.toLocaleTimeString();
  
  console.log(`   Expected: ${expectedTime}`);
  console.log(`   Actual: ${actualTime}`);
  console.log(`   Result: ${expectedTime === actualTime ? '✅ CORRECT' : '❌ WRONG'}`);
  
  if (expectedTime !== actualTime) {
    console.log(`   ⚠️  Time difference: ${Math.abs(frontendDate.getTime() - new Date(userSelectedTime).getTime()) / (1000 * 60 * 60)} hours`);
  }
} catch (error) {
  console.log(`   ❌ Error in flow: ${error.message}`);
}

console.log('\n4️⃣ DATABASE TIMESTAMP TEST:');
console.log('   If you have access to your database, check:');
console.log('   - What timezone is your database server set to?');
console.log('   - Are timestamps stored as TIMESTAMP or TIMESTAMPTZ?');
console.log('   - Check a recent live session record:');
console.log('     SELECT id, title, start_time, created_at FROM live_sessions ORDER BY created_at DESC LIMIT 1;');

console.log('\n5️⃣ FRONTEND TEST:');
console.log('   Open browser console and run:');
console.log('   new Date("2024-01-15T03:00").toLocaleTimeString()');
console.log('   new Date("2024-01-15T02:00:00.000Z").toLocaleTimeString()');

console.log('\n📋 NEXT STEPS:');
console.log('1. Run this script on your VPS');
console.log('2. Check your database timezone settings');
console.log('3. Verify the backend is actually using the updated code');
console.log('4. Check if there are any cached files or processes');
console.log('5. Restart your Node.js server after making changes');
