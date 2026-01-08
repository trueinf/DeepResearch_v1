// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface CreatePPTJobRequest {
  framework_id?: string
  research_id?: string
  report?: any
  slides?: any[]
  template?: string
  template_drive_id?: string
  ppt_plan?: any
  presentation_style?: 'executive' | 'technical' | 'visual' | 'academic'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: CreatePPTJobRequest = await req.json()
    const { framework_id, research_id, report, slides, template, template_drive_id, ppt_plan, presentation_style } = body

    // Build ppt_plan from available data
    let final_ppt_plan = ppt_plan

    // If slides are provided, convert to ppt_plan format
    if (slides && !ppt_plan) {
      final_ppt_plan = {
        slides: slides.map((slide, index) => ({
          layout: slide.layout || 'title_and_bullets',
          target_slide_index: index,
          placeholders: {
            '{{TITLE}}': slide.title || '',
            '{{SUBTITLE}}': slide.subtitle || '',
            '{{CONTENT}}': slide.bullets?.join('\n') || '',
            ...(slide.left_bullets && { '{{LEFT_CONTENT}}': slide.left_bullets.join('\n') }),
            ...(slide.right_bullets && { '{{RIGHT_CONTENT}}': slide.right_bullets.join('\n') }),
          },
          ...(slide.imageData && {
            image: {
              url: slide.imageData.url,
              position: slide.imageData.position || 'right',
              description: slide.imageData.description
            }
          })
        }))
      }
    }

    // If report is provided but no slides, create basic structure
    if (report && !slides && !ppt_plan) {
      final_ppt_plan = {
        slides: [
          {
            layout: 'title',
            target_slide_index: 0,
            placeholders: {
              '{{TITLE}}': report.topic || 'Research Report',
              '{{SUBTITLE}}': `Generated ${new Date().toLocaleDateString()}`
            }
          },
          {
            layout: 'title_and_bullets',
            target_slide_index: 1,
            placeholders: {
              '{{TITLE}}': 'Executive Summary',
              '{{CONTENT}}': report.executiveSummary || ''
            }
          }
        ]
      }
    }

    if (!final_ppt_plan) {
      return new Response(
        JSON.stringify({ error: 'Missing ppt_plan, slides, or report data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Level-6 renderer webhook URL from env (optional)
    const rendererWebhookUrl = Deno.env.get('LEVEL6_RENDERER_WEBHOOK_URL')

    // Insert job into slide_jobs table
    const { data: job, error: insertError } = await supabase
      .from('slide_jobs')
      .insert({
        user_id: user.id,
        framework_id: framework_id || null,
        research_id: research_id || null,
        ppt_plan: final_ppt_plan,
        template: template || 'default',
        template_drive_id: template_drive_id || null,
        presentation_style: presentation_style || 'executive',
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating job:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create job', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Notify Level-6 renderer if webhook URL is configured
    if (rendererWebhookUrl && job) {
      try {
        const webhookResponse = await fetch(rendererWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: job.id,
            template_drive_id: template_drive_id || null
          })
        })

        if (!webhookResponse.ok) {
          console.warn('Webhook call failed, but job created:', await webhookResponse.text())
        }
      } catch (webhookError) {
        console.warn('Webhook call error, but job created:', webhookError)
        // Don't fail the request if webhook fails - job can be processed later
      }
    }

    return new Response(
      JSON.stringify({ 
        job_id: job.id,
        status: 'pending',
        message: 'Job created successfully. Poll slide_jobs table for status updates.'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in create-ppt-job:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

