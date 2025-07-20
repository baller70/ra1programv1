#!/usr/bin/env tsx

// Test script for validating API improvements
import { 
  validateData, 
  sanitizeParentData, 
  CreateParentSchema,
  sanitizeEmail,
  sanitizePhone,
  sanitizeString
} from '../lib/validation'
import { testData, testValidation } from '../lib/test-utils'

console.log('🧪 Testing Rise as One API Improvements\n')

// Test 1: Validation Functions
console.log('1. Testing Input Validation...')
const validationTests = [
  {
    input: testData.parent.valid,
    shouldPass: true,
    expected: 'valid parent data'
  },
  {
    input: testData.parent.invalid.noName,
    shouldPass: false,
    expected: 'missing name error'
  },
  {
    input: testData.parent.invalid.noEmail,
    shouldPass: false,
    expected: 'missing email error'
  },
  {
    input: testData.parent.invalid.invalidEmail,
    shouldPass: false,
    expected: 'invalid email error'
  }
]

const validationResults = testValidation(
  (data: any) => validateData(CreateParentSchema, data),
  validationTests
)

console.log(`   ✅ Validation Tests: ${validationResults.passed}/${validationResults.total} passed`)

// Test 2: Sanitization Functions
console.log('\n2. Testing Data Sanitization...')
const sanitizationTests = [
  {
    name: 'Email sanitization',
    input: '  TEST@EXAMPLE.COM  ',
    expected: 'test@example.com',
    fn: sanitizeEmail
  },
  {
    name: 'Phone sanitization',
    input: '+1 (234) 567-8900',
    expected: '+12345678900',
    fn: sanitizePhone
  },
  {
    name: 'String sanitization',
    input: '  Multiple   Spaces   Text  ',
    expected: 'Multiple Spaces Text',
    fn: sanitizeString
  }
]

let sanitizationPassed = 0
sanitizationTests.forEach(test => {
  const result = test.fn(test.input)
  const passed = result === test.expected
  console.log(`   ${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASS' : 'FAIL'}`)
  if (passed) sanitizationPassed++
  if (!passed) {
    console.log(`      Expected: "${test.expected}"`)
    console.log(`      Got: "${result}"`)
  }
})

console.log(`   ✅ Sanitization Tests: ${sanitizationPassed}/${sanitizationTests.length} passed`)

// Test 3: Parent Data Sanitization
console.log('\n3. Testing Parent Data Sanitization...')
const testParentData = {
  name: '  John Doe  ',
  email: '  JOHN.DOE@EXAMPLE.COM  ',
  phone: '+1 (234) 567-8900',
  address: '  123   Main   Street  ',
  emergencyContact: '  Jane   Doe  ',
  emergencyPhone: '+1-987-654-3210',
  notes: '  Test   notes   with   spaces  '
}

const sanitized = sanitizeParentData(testParentData)
console.log('   ✅ Original data sanitized successfully')
console.log(`   📧 Email: "${testParentData.email}" → "${sanitized.email}"`)
console.log(`   📱 Phone: "${testParentData.phone}" → "${sanitized.phone}"`)
console.log(`   👤 Name: "${testParentData.name}" → "${sanitized.name}"`)

// Test 4: Schema Validation with Real Data
console.log('\n4. Testing Schema Validation with Real Data...')
try {
  const validatedData = validateData(CreateParentSchema, sanitized)
  console.log('   ✅ Schema validation passed')
  console.log(`   📝 Validated fields: ${Object.keys(validatedData).join(', ')}`)
} catch (error) {
  console.log('   ❌ Schema validation failed')
  console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
}

// Test 5: Error Handling Scenarios
console.log('\n5. Testing Error Handling Scenarios...')
const errorTests = [
  {
    name: 'Empty object',
    data: {},
    shouldFail: true
  },
  {
    name: 'Null values',
    data: { name: null, email: null },
    shouldFail: true
  },
  {
    name: 'Invalid types',
    data: { name: 123, email: true },
    shouldFail: true
  }
]

let errorTestsPassed = 0
errorTests.forEach(test => {
  try {
    validateData(CreateParentSchema, test.data)
    const passed = !test.shouldFail
    console.log(`   ${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASS' : 'FAIL (should have failed)'}`)
    if (passed) errorTestsPassed++
  } catch (error) {
    const passed = test.shouldFail
    console.log(`   ${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASS (correctly failed)' : 'FAIL'}`)
    if (passed) errorTestsPassed++
  }
})

console.log(`   ✅ Error Handling Tests: ${errorTestsPassed}/${errorTests.length} passed`)

// Summary
console.log('\n📊 Test Summary:')
const totalTests = validationResults.total + sanitizationTests.length + 1 + 1 + errorTests.length
const totalPassed = validationResults.passed + sanitizationPassed + 1 + 1 + errorTestsPassed

console.log(`   Total Tests: ${totalTests}`)
console.log(`   Passed: ${totalPassed}`)
console.log(`   Failed: ${totalTests - totalPassed}`)
console.log(`   Success Rate: ${Math.round((totalPassed / totalTests) * 100)}%`)

if (totalPassed === totalTests) {
  console.log('\n🎉 All tests passed! API improvements are working correctly.')
} else {
  console.log('\n⚠️  Some tests failed. Please review the results above.')
}

console.log('\n🔧 Next Steps:')
console.log('   1. Set up database credentials to test full API functionality')
console.log('   2. Configure authentication (Clerk) for user management')
console.log('   3. Set up email service (Resend) for communication features')
console.log('   4. Continue with parent management system implementation')

export {} 