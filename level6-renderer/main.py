import os
import logging
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from renderer import process_job
from supabase_client import SupabaseClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Level-6 Slides Renderer",
    description="Google Slides PPTX renderer microservice",
    version="1.0.0"
)

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment")

supabase = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)
logger.info("Supabase client initialized")

class JobRequest(BaseModel):
    job_id: str
    template_drive_id: str = None

@app.post("/run-job")
async def run_job(req: JobRequest, background_tasks: BackgroundTasks):
    """
    Enqueue a slide job for processing.
    The job will be processed in the background.
    """
    logger.info(f"Received job request: {req.job_id}")
    
    # Verify job exists
    job = supabase.get_slide_job(req.job_id)
    if not job:
        logger.error(f"Job not found: {req.job_id}")
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check if already processing or done
    if job.get('status') in ['processing', 'done']:
        logger.warning(f"Job {req.job_id} already in status: {job.get('status')}")
        return {
            "status": job.get('status'),
            "job_id": req.job_id,
            "message": f"Job is already {job.get('status')}"
        }
    
    # Add background task
    background_tasks.add_task(process_job, req.job_id, req.template_drive_id)
    logger.info(f"Job {req.job_id} enqueued for processing")
    
    return {
        "status": "enqueued",
        "job_id": req.job_id,
        "message": "Job processing started"
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "level6-renderer"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Level-6 Slides Renderer",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "run_job": "/run-job"
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("LEVEL6_RENDERER_PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)

