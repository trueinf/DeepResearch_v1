import os
import json
import time
import logging
from gdrive_helpers import (
    get_services, copy_template, replace_all_text,
    create_sheet_with_data, add_chart_to_sheet,
    insert_sheets_chart, insert_image, export_presentation_as_pptx
)
from supabase_client import SupabaseClient
from utils import inches_to_emu

logger = logging.getLogger(__name__)

# Initialize services
try:
    slides_service, drive_service, sheets_service = get_services()
except Exception as e:
    logger.error(f"Failed to initialize Google services: {e}")
    slides_service = drive_service = sheets_service = None

# Initialize Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment")

supabase = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)

def process_job(job_id: str, template_drive_id: str = None):
    """
    Process a slide job:
    1. Fetch job from Supabase
    2. Copy Google Slides template
    3. Replace placeholders
    4. Insert charts/images if needed
    5. Export as PPTX
    6. Upload to Supabase Storage
    7. Update job status
    """
    logger.info(f"Processing job {job_id}")
    
    # Fetch job
    job = supabase.get_slide_job(job_id)
    if not job:
        raise RuntimeError(f"Job not found: {job_id}")
    
    # Update status to processing
    supabase.update_slide_job(job_id, {"status": "processing"})
    
    # Get slide plan
    slide_plan = job.get("slide_plan") or job.get("ppt_plan") or {}
    if isinstance(slide_plan, str):
        try:
            slide_plan = json.loads(slide_plan)
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON in slide_plan for job {job_id}")
            supabase.update_slide_job(job_id, {
                "status": "failed",
                "error_message": "Invalid slide_plan JSON"
            })
            return None
    
    if not slide_plan or not slide_plan.get("slides"):
        logger.error(f"No slides in plan for job {job_id}")
        supabase.update_slide_job(job_id, {
            "status": "failed",
            "error_message": "No slides in plan"
        })
        return None
    
    # Get template ID
    template_id = (
        template_drive_id or
        job.get("template_drive_id") or
        os.environ.get("DEFAULT_TEMPLATE_DRIVE_ID")
    )
    
    if not template_id:
        logger.error(f"No template specified for job {job_id}")
        supabase.update_slide_job(job_id, {
            "status": "failed",
            "error_message": "No template specified"
        })
        return None
    
    try:
        # Copy template
        new_title = f"ppt_job_{job_id}_{int(time.time())}"
        new_presentation = copy_template(drive_service, template_id, new_title)
        presentation_id = new_presentation['id']
        logger.info(f"Created presentation {presentation_id}")
        
        # Get slide metadata
        slides_metadata = slides_service.presentations().get(
            presentationId=presentation_id
        ).execute()
        page_ids = [s['objectId'] for s in slides_metadata.get('slides', [])]
        
        if not page_ids:
            raise RuntimeError("Template has no slides")
        
        # Collect all replacements
        all_replacements = {}
        for slide_config in slide_plan.get("slides", []):
            placeholders = slide_config.get("placeholders", {})
            all_replacements.update(placeholders)
        
        # Replace text placeholders
        if all_replacements:
            replace_all_text(slides_service, presentation_id, all_replacements)
            logger.info(f"Replaced {len(all_replacements)} placeholders")
        
        # Process each slide configuration
        for slide_config in slide_plan.get("slides", []):
            slide_index = min(
                slide_config.get('target_slide_index', 0),
                len(page_ids) - 1
            )
            page_object_id = page_ids[slide_index]
            
            # Insert chart if specified
            if 'chart_spec' in slide_config:
                chart_spec = slide_config['chart_spec']
                try:
                    # Create sheet with data
                    sheet_title = f"chart_job_{job_id}_{int(time.time())}"
                    spreadsheet_id = create_sheet_with_data(
                        sheets_service,
                        sheet_title,
                        chart_spec['data']
                    )
                    
                    # Add chart to sheet
                    row_count = len(chart_spec['data'])
                    chart_spec['rowCount'] = row_count
                    chart_id = add_chart_to_sheet(sheets_service, spreadsheet_id, chart_spec)
                    
                    # Insert chart into slide
                    emu = {
                        "x": inches_to_emu(slide_config.get('x', 1.0)),
                        "y": inches_to_emu(slide_config.get('y', 2.0)),
                        "width": inches_to_emu(slide_config.get('width', 8.0)),
                        "height": inches_to_emu(slide_config.get('height', 4.0))
                    }
                    insert_sheets_chart(
                        slides_service,
                        presentation_id,
                        page_object_id,
                        spreadsheet_id,
                        chart_id,
                        emu
                    )
                    logger.info(f"Inserted chart into slide {slide_index}")
                except Exception as e:
                    logger.error(f"Error inserting chart: {e}")
                    # Continue with other slides
            
            # Insert image if specified
            if 'image' in slide_config:
                image_config = slide_config['image']
                try:
                    image_url = image_config.get('url')
                    if image_url:
                        position = image_config.get('position', 'right')
                        # Default positions
                        positions = {
                            'left': {'x': 0.5, 'y': 2.0, 'width': 3.5, 'height': 3.0},
                            'right': {'x': 5.0, 'y': 2.0, 'width': 3.5, 'height': 3.0},
                            'center': {'x': 2.0, 'y': 2.0, 'width': 6.0, 'height': 3.5}
                        }
                        pos = positions.get(position, positions['right'])
                        
                        emu = {
                            "x": inches_to_emu(pos['x']),
                            "y": inches_to_emu(pos['y']),
                            "width": inches_to_emu(pos['width']),
                            "height": inches_to_emu(pos['height'])
                        }
                        insert_image(
                            slides_service,
                            presentation_id,
                            page_object_id,
                            image_url,
                            emu
                        )
                        logger.info(f"Inserted image into slide {slide_index}")
                except Exception as e:
                    logger.error(f"Error inserting image: {e}")
                    # Continue with other slides
        
        # Export as PPTX
        pptx_bytes = export_presentation_as_pptx(drive_service, presentation_id)
        
        # Upload to Supabase Storage
        public_url = supabase.upload_ppt_bytes(job_id, pptx_bytes)
        
        if not public_url:
            raise RuntimeError("Failed to upload PPTX to storage")
        
        # Update job status
        supabase.update_slide_job(job_id, {
            "status": "done",
            "final_ppt_url": public_url
        })
        
        logger.info(f"Job {job_id} completed successfully: {public_url}")
        return public_url
        
    except Exception as e:
        logger.error(f"Error processing job {job_id}: {e}", exc_info=True)
        supabase.update_slide_job(job_id, {
            "status": "failed",
            "error_message": str(e)
        })
        raise

