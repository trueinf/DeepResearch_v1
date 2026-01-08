/**
 * Test script for deep-Research-gemini Edge Function
 * 
 * Usage:
 * 1. Make sure you have deployed the function to Supabase
 * 2. Update SUPABASE_URL and SUPABASE_ANON_KEY below
 * 3. Run: node test-deep-research.js
 */

const SUPABASE_URL = 'https://vvrulvxeaejxhwnafwrq.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key-here' // Replace with your anon key

async function startDeepResearch() {
  console.log('🚀 Starting Deep Research...\n')
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/deep-Research-gemini`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      originalQuery: 'Research the economic impact of semaglutide on global healthcare systems.',
      clarifyingAnswers: 'Focus on global market (US, EU, Asia), include 2019–2025 data, cover pharmaceutical revenue trends, and reference peer-reviewed sources.',
      researchId: 'test-research-001'
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('❌ Error starting research:', error)
    return null
  }

  const data = await response.json()
  console.log('✅ Research started!')
  console.log('Response ID:', data.responseId)
  console.log('Status:', data.status)
  console.log('\n⏳ Polling for completion...\n')
  
  return data.responseId
}

async function checkStatus(responseId) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/deep-Research-gemini?responseId=${responseId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('❌ Error checking status:', error)
    return null
  }

  return await response.json()
}

async function pollUntilComplete(responseId, maxAttempts = 120) {
  let attempts = 0
  
  while (attempts < maxAttempts) {
    attempts++
    console.log(`Attempt ${attempts}/${maxAttempts}...`)
    
    const status = await checkStatus(responseId)
    
    if (!status) {
      console.error('❌ Failed to check status')
      break
    }

    console.log('Status:', status.status)
    
    if (status.status === 'completed') {
      console.log('\n✅ Research completed!\n')
      console.log('📊 Report Summary:')
      console.log(`   Key Findings: ${status.report?.keyFindings?.length || 0}`)
      console.log(`   Sources: ${status.report?.sources?.length || 0}`)
      console.log('\n📝 First Finding:')
      if (status.report?.keyFindings?.[0]) {
        console.log('   ', status.report.keyFindings[0].text.substring(0, 200) + '...')
      }
      console.log('\n🔗 First Source:')
      if (status.report?.sources?.[0]) {
        console.log('   ', status.report.sources[0].url)
      }
      return status
    } else if (status.status === 'failed') {
      console.error('❌ Research failed:', status.error)
      return null
    } else {
      // Still processing, wait 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
  
  console.error('❌ Timeout: Research took too long')
  return null
}

async function main() {
  try {
    // Start research
    const responseId = await startDeepResearch()
    
    if (!responseId) {
      console.error('Failed to start research')
      process.exit(1)
    }

    // Poll for completion
    const result = await pollUntilComplete(responseId)
    
    if (result) {
      console.log('\n✅ Test completed successfully!')
      process.exit(0)
    } else {
      console.error('\n❌ Test failed')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Test error:', error)
    process.exit(1)
  }
}

// Run the test
main()

