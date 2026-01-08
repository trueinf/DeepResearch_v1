import os
import logging
from supabase import create_client, Client
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class SupabaseClient:
    def __init__(self, url: str, key: str):
        self.url = url
        self.key = key
        try:
            self.client: Client = create_client(url, key)
            logger.info("Supabase client created successfully")
        except Exception as e:
            logger.error(f"Failed to create Supabase client: {e}")
            raise

    def get_slide_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a slide job by ID"""
        try:
            response = self.client.table("slide_jobs").select("*").eq("id", job_id).single().execute()
            if hasattr(response, 'data') and response.data:
                return response.data
            return None
        except Exception as e:
            logger.error(f"Error fetching slide job {job_id}: {e}")
            return None

    def update_slide_job(self, job_id: str, payload: dict) -> bool:
        """Update a slide job"""
        try:
            response = self.client.table("slide_jobs").update(payload).eq("id", job_id).execute()
            logger.info(f"Updated job {job_id}: {payload}")
            return True
        except Exception as e:
            logger.error(f"Error updating slide job {job_id}: {e}")
            return False

    def upload_ppt_bytes(self, job_id: str, data: bytes, bucket: str = None, filename: str = None) -> Optional[str]:
        """
        Upload PPTX bytes to Supabase Storage
        Returns the public URL if successful
        """
        if not bucket:
            bucket = os.environ.get("SUPABASE_PPT_BUCKET", "ppt-results")
        if not filename:
            filename = f"{job_id}.pptx"
        
        try:
            # Upload file
            response = self.client.storage.from_(bucket).upload(
                filename,
                data,
                file_options={"content-type": "application/vnd.openxmlformats-officedocument.presentationml.presentation"}
            )
            
            # Get public URL
            public_url = self.client.storage.from_(bucket).get_public_url(filename)
            logger.info(f"Uploaded PPT to {public_url}")
            return public_url
        except Exception as e:
            logger.error(f"Error uploading PPT for job {job_id}: {e}")
            return None

