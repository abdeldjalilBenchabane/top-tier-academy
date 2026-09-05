// Debug timezone shift issue
import { convertDatetimeLocalToUTC } from './utils/timezone.js';

console.log('🔍 DEBUGGING TIMEZONE SHIFT ISSUE');
console.log('=================================\n');

// Test with your exact scenario
const userSelectedTime = '2025-08-25T02:00'; // 2 AM on Aug 25, 2025
console.log(`👤 User selects: ${userSelectedTime} (2 AM on Aug 25, 2025)`);

// Step 1: Check system timezone
console.log('\n1️⃣ SYSTEM TIMEZONE INFO:');
console.log('   Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('   Offset:', new Date().getTimezoneOffset() / 60, 'hours');
console.log('   Current time:', new Date().toLocaleString());
console.log('   Current UTC:', new Date().toISOString());

// Step 2: Test the conversion
console.log('\n2️⃣ TIMEZONE CONVERSION TEST:');
try {
  const utcTime = convertDatetimeLocalToUTC(userSelectedTime);
  const localDate = new Date(userSelectedTime);
  const utcDate = new Date(utcTime);
  
  console.log(`   Input (local): ${userSelectedTime}`);
  console.log(`   UTC stored: ${utcTime}`);
  console.log(`   Local display: ${utcDate.toLocaleTimeString()}`);
  console.log(`   Expected: ${localDate.toLocaleTimeString()}`);
  
  const timeDiff = Math.abs(utcDate.getTime() - localDate.getTime()) / (1000 * 60 * 60);
  console.log(`   Time difference: ${timeDiff} hours`);
  
  if (timeDiff > 0) {
    console.log(`   ⚠️  SHIFT DETECTED: ${timeDiff} hour(s)`);
  } else {
    console.log(`   ✅ No shift detected`);
  }
  
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
}

// Step 3: Test different times
console.log('\n3️⃣ TESTING DIFFERENT TIMES:');
const testTimes = [
  '2025-08-25T02:00', // 2 AM
  '2025-08-25T03:00', // 3 AM
  '2025-08-25T14:00', // 2 PM
  '2025-08-25T00:00', // Midnight
];

testTimes.forEach(testTime => {
  try {
    const utcTime = convertDatetimeLocalToUTC(testTime);
    const localDate = new Date(testTime);
    const utcDate = new Date(utcTime);
    
    console.log(`   ${testTime} → ${utcDate.toLocaleTimeString()} (${utcTime})`);
  } catch (error) {
    console.log(`   ${testTime} → ERROR: ${error.message}`);
  }
});

// Step 4: Check if this is a DST issue
console.log('\n4️⃣ DAYLIGHT SAVING TIME CHECK:');
const janDate = new Date('2025-01-15T02:00');
const augDate = new Date('2025-08-25T02:00');
console.log(`   January 15, 2025 2 AM offset: ${janDate.getTimezoneOffset() / 60} hours`);
console.log(`   August 25, 2025 2 AM offset: ${augDate.getTimezoneOffset() / 60} hours`);

if (Math.abs(janDate.getTimezoneOffset() - augDate.getTimezoneOffset()) > 0) {
  console.log(`   ⚠️  DST difference detected!`);
} else {
  console.log(`   ✅ No DST difference`);
}

console.log('\n5️⃣ POSSIBLE SOLUTIONS:');
console.log('   A. If the shift is consistent (always +1 hour):');
console.log('      - Your VPS might be in a different timezone');
console.log('      - Check your VPS timezone: date && timedatectl');
console.log('   B. If the shift varies:');
console.log('      - This might be a DST (Daylight Saving Time) issue');
console.log('      - The conversion function might need adjustment');
console.log('   C. If no shift in tests but shift in app:');
console.log('      - The frontend might be applying additional conversion');
console.log('      - Check if the backend is actually using the updated code');

console.log('\n📋 NEXT STEPS:');
console.log('1. Check your VPS timezone: date && timedatectl');
console.log('2. Restart your server after any timezone changes');
console.log('3. Test creating a live session again');
console.log('4. Check server logs for timezone conversion messages');
