/**
 * Test script to check which Gemini models are available for your API key
 * Run: node test-gemini-models.js
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE'

async function testGeminiModels() {
  console.log('🔍 Testing Gemini API Key and Available Models...\n')
  
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
    console.error('❌ GEMINI_API_KEY not set!')
    console.log('\nSet it as environment variable:')
    console.log('  Windows: $env:GEMINI_API_KEY="your_key"')
    console.log('  Then run: node test-gemini-models.js')
    process.exit(1)
  }

  console.log(`✅ API Key found (length: ${GEMINI_API_KEY.length})`)
  console.log('📋 Testing model names...\n')

  // List of model names to test
  const modelsToTest = [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-pro-latest',
    'gemini-1.5-pro-latest',
    'gemini-1.5-pro',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-pro',
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash-lite',
  ]

  const availableModels = []
  const failedModels = []

  // First, try to list all available models
  console.log('1️⃣ Fetching list of all available models...')
  try {
    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`)
    if (listResponse.ok) {
      const listData = await listResponse.json()
      const allModels = listData.models?.map(m => m.name?.replace('models/', '') || m.name) || []
      console.log(`   ✅ Found ${allModels.length} available models\n`)
      console.log('   Available models:')
      allModels.forEach(m => {
        console.log(`      • ${m}`)
        availableModels.push(m)
      })
      console.log('')
    } else {
      console.log(`   ❌ Failed to list models: ${listResponse.status}`)
    }
  } catch (error) {
    console.log(`   ❌ Error listing models: ${error.message}`)
  }

  // Test each model with a simple request
  console.log('2️⃣ Testing individual models...\n')
  for (const modelName of modelsToTest) {
    try {
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`
      const testResponse = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Say "test" in one word' }]
          }]
        })
      })

      if (testResponse.ok) {
        const data = await testResponse.json()
        console.log(`   ✅ ${modelName} - WORKS!`)
        if (!availableModels.includes(modelName)) {
          availableModels.push(modelName)
        }
      } else {
        const errorText = await testResponse.text()
        console.log(`   ❌ ${modelName} - FAILED (${testResponse.status})`)
        failedModels.push({ model: modelName, status: testResponse.status, error: errorText })
      }
    } catch (error) {
      console.log(`   ❌ ${modelName} - ERROR: ${error.message}`)
      failedModels.push({ model: modelName, error: error.message })
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 SUMMARY')
  console.log('='.repeat(60))
  
  if (availableModels.length > 0) {
    console.log('\n✅ WORKING MODELS:')
    availableModels.forEach(m => console.log(`   • ${m}`))
    console.log('\n💡 RECOMMENDATION:')
    console.log(`   Use: ${availableModels[0]}`)
    console.log(`   Update your code to use this model name.`)
  } else {
    console.log('\n❌ NO WORKING MODELS FOUND!')
    console.log('\nPossible issues:')
    console.log('   1. API key is invalid or expired')
    console.log('   2. API key doesn\'t have access to Gemini models')
    console.log('   3. Check your Google Cloud billing/quota')
    console.log('   4. Verify API key at: https://aistudio.google.com/')
  }

  if (failedModels.length > 0) {
    console.log('\n❌ FAILED MODELS:')
    failedModels.forEach(f => {
      console.log(`   • ${f.model} (${f.status || 'error'})`)
    })
  }

  console.log('\n' + '='.repeat(60))
}

testGeminiModels().catch(console.error)

