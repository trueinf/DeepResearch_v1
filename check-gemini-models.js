/**
 * Utility script to check which Gemini models are available for your API key
 * 
 * Usage:
 * 1. Set your GEMINI_API_KEY in the script below
 * 2. Run: node check-gemini-models.js
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE'

async function checkAvailableModels() {
  console.log('🔍 Checking available Gemini models for your API key...\n')
  
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
    console.error('❌ Please set GEMINI_API_KEY environment variable or update the script')
    console.log('\nTo run: GEMINI_API_KEY=your_key node check-gemini-models.js')
    process.exit(1)
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`)
    
    if (!response.ok) {
      console.error(`❌ Error fetching models: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      process.exit(1)
    }

    const data = await response.json()
    const models = data.models || []

    console.log(`✅ Found ${models.length} available models:\n`)

    // Categorize models
    const proModels = []
    const flashModels = []
    const otherModels = []

    models.forEach(model => {
      const name = model.name?.replace('models/', '') || model.name
      const displayName = model.displayName || name
      
      if (name.includes('pro')) {
        proModels.push({ name, displayName, description: model.description || '' })
      } else if (name.includes('flash')) {
        flashModels.push({ name, displayName, description: model.description || '' })
      } else {
        otherModels.push({ name, displayName, description: model.description || '' })
      }
    })

    // Display Pro models
    if (proModels.length > 0) {
      console.log('📊 PRO MODELS (Best Quality):')
      proModels.forEach(m => {
        const recommended = m.name.includes('1.5-pro') ? ' ⭐ RECOMMENDED' : ''
        console.log(`   • ${m.name}${recommended}`)
        if (m.description) console.log(`     ${m.description}`)
      })
      console.log('')
    }

    // Display Flash models
    if (flashModels.length > 0) {
      console.log('⚡ FLASH MODELS (Faster):')
      flashModels.forEach(m => {
        const recommended = m.name.includes('1.5-flash') ? ' ⭐ RECOMMENDED' : ''
        console.log(`   • ${m.name}${recommended}`)
        if (m.description) console.log(`     ${m.description}`)
      })
      console.log('')
    }

    // Display other models
    if (otherModels.length > 0) {
      console.log('🔧 OTHER MODELS:')
      otherModels.forEach(m => {
        console.log(`   • ${m.name}`)
        if (m.description) console.log(`     ${m.description}`)
      })
      console.log('')
    }

    // Recommendations
    console.log('💡 RECOMMENDATIONS:')
    
    const has15Pro = proModels.some(m => m.name.includes('1.5-pro') && !m.name.includes('latest'))
    const has15Flash = flashModels.some(m => m.name.includes('1.5-flash') && !m.name.includes('latest'))
    const has30Pro = proModels.some(m => m.name.includes('3.0-pro') || m.name.includes('3-pro'))

    if (has15Pro) {
      console.log('   ✅ Use: gemini-1.5-pro (Most reliable, widely available)')
    } else if (has15Flash) {
      console.log('   ✅ Use: gemini-1.5-flash (Fast, good quality)')
    } else if (has30Pro) {
      console.log('   ⚠️  Use: gemini-3.0-pro-preview (May have regional restrictions)')
    } else {
      console.log('   ⚠️  Check available models above and use the most appropriate one')
    }

    console.log('\n📝 To use in your project:')
    console.log('   1. Update supabase/functions/deep-Research-gemini/index.ts')
    console.log('   2. Set the model name in the modelNames array')
    console.log('   3. Deploy to Supabase')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkAvailableModels()

