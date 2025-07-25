// Simple script to check environment variables
console.log('=== Environment Variables Check ===');
console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
console.log('RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length || 0);
console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL);
console.log('NODE_ENV:', process.env.NODE_ENV);

if (!process.env.RESEND_API_KEY) {
  console.log('\n❌ RESEND_API_KEY is missing!');
  console.log('Please add it to your .env.local file:');
  console.log('RESEND_API_KEY=your_api_key_here');
} else {
  console.log('\n✅ RESEND_API_KEY is configured');
}

if (!process.env.RESEND_FROM_EMAIL) {
  console.log('\n⚠️  RESEND_FROM_EMAIL is missing (will use default)');
  console.log('Consider adding it to your .env.local file:');
  console.log('RESEND_FROM_EMAIL="RA1 Basketball <noreply@yourdomain.com>"');
} else {
  console.log('\n✅ RESEND_FROM_EMAIL is configured');
}

console.log('\n=== Current working directory ===');
console.log(process.cwd());

console.log('\n=== Looking for .env files ===');
const fs = require('fs');
const path = require('path');

const envFiles = ['.env.local', '.env', '.env.development'];
envFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ Found: ${file}`);
  } else {
    console.log(`❌ Not found: ${file}`);
  }
}); 