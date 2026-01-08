import os
import io
import base64
import logging
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from googleapiclient.errors import HttpError
from utils import retry_with_backoff, inches_to_emu

logger = logging.getLogger(__name__)

SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/presentations',
    'https://www.googleapis.com/auth/spreadsheets'
]

def get_services():
    """Initialize Google API services"""
    sa_path = os.environ.get("GCP_SERVICE_ACCOUNT_JSON")
    sa_json_base64 = os.environ.get("GCP_SERVICE_ACCOUNT_JSON_BASE64")
    
    if sa_json_base64:
        # Decode base64 JSON
        json_content = base64.b64decode(sa_json_base64).decode('utf-8')
        creds = service_account.Credentials.from_service_account_info(
            eval(json_content) if isinstance(eval(json_content), dict) else json.loads(json_content),
            scopes=SCOPES
        )
    elif sa_path:
        creds = service_account.Credentials.from_service_account_file(sa_path, scopes=SCOPES)
    else:
        raise RuntimeError("Set GCP_SERVICE_ACCOUNT_JSON or GCP_SERVICE_ACCOUNT_JSON_BASE64")
    
    slides_service = build('slides', 'v1', credentials=creds)
    drive_service = build('drive', 'v3', credentials=creds)
    sheets_service = build('sheets', 'v4', credentials=creds)
    
    logger.info("Google API services initialized")
    return slides_service, drive_service, sheets_service

@retry_with_backoff()
def copy_template(drive_service, template_id: str, new_title: str) -> dict:
    """Copy a Google Slides template"""
    try:
        body = {'name': new_title}
        result = drive_service.files().copy(fileId=template_id, body=body).execute()
        logger.info(f"Copied template {template_id} to {result['id']}")
        return result
    except HttpError as e:
        logger.error(f"Error copying template: {e}")
        raise

@retry_with_backoff()
def replace_all_text(slides_service, presentation_id: str, replacements: dict) -> dict:
    """Replace placeholder text in presentation"""
    if not replacements:
        return {}
    
    requests = []
    for token, value in replacements.items():
        requests.append({
            'replaceAllText': {
                'containsText': {
                    'text': token,
                    'matchCase': True
                },
                'replaceText': str(value)
            }
        })
    
    if requests:
        try:
            body = {'requests': requests}
            result = slides_service.presentations().batchUpdate(
                presentationId=presentation_id,
                body=body
            ).execute()
            logger.info(f"Replaced {len(requests)} text placeholders")
            return result
        except HttpError as e:
            logger.error(f"Error replacing text: {e}")
            raise
    return {}

@retry_with_backoff()
def create_sheet_with_data(sheets_service, title: str, data: list) -> str:
    """Create a Google Sheet with data and return spreadsheet ID"""
    try:
        spreadsheet = {'properties': {'title': title}}
        sheet = sheets_service.spreadsheets().create(body=spreadsheet).execute()
        ssid = sheet['spreadsheetId']
        
        if data:
            body = {'values': data}
            sheets_service.spreadsheets().values().update(
                spreadsheetId=ssid,
                range='A1',
                valueInputOption='RAW',
                body=body
            ).execute()
        
        logger.info(f"Created sheet {ssid} with {len(data)} rows")
        return ssid
    except HttpError as e:
        logger.error(f"Error creating sheet: {e}")
        raise

@retry_with_backoff()
def add_chart_to_sheet(sheets_service, spreadsheet_id: str, chart_spec: dict) -> int:
    """Add a chart to a Google Sheet and return chart ID"""
    try:
        sheet_id = chart_spec.get('sheetId', 0)
        row_count = chart_spec.get('rowCount', len(chart_spec.get('data', [])))
        x_col = chart_spec.get('x_col', 0)
        
        chart_request = {
            "addChart": {
                "chart": {
                    "spec": {
                        "title": chart_spec.get("title", ""),
                        "basicChart": {
                            "chartType": chart_spec.get("type", "LINE").upper(),
                            "legendPosition": "BOTTOM_LEGEND",
                            "domains": [{
                                "domain": {
                                    "sourceRange": {
                                        "sources": [{
                                            "sheetId": sheet_id,
                                            "startRowIndex": 0,
                                            "endRowIndex": row_count,
                                            "startColumnIndex": x_col,
                                            "endColumnIndex": x_col + 1
                                        }]
                                    }
                                }
                            }],
                            "series": []
                        }
                    }
                }
            }
        }
        
        # Add series
        series_list = []
        for s in chart_spec.get("series", []):
            series_list.append({
                "series": {
                    "sourceRange": {
                        "sources": [{
                            "sheetId": sheet_id,
                            "startRowIndex": 0,
                            "endRowIndex": row_count,
                            "startColumnIndex": s.get("col"),
                            "endColumnIndex": s.get("col") + 1
                        }]
                    }
                },
                "targetAxis": "LEFT_AXIS"
            })
        
        chart_request["addChart"]["chart"]["spec"]["basicChart"]["series"] = series_list
        
        batch = {"requests": [chart_request]}
        resp = sheets_service.spreadsheets().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body=batch
        ).execute()
        
        chart_id = resp['replies'][0]['addChart']['chart']['chartId']
        logger.info(f"Added chart {chart_id} to sheet")
        return chart_id
    except HttpError as e:
        logger.error(f"Error adding chart: {e}")
        raise

@retry_with_backoff()
def insert_sheets_chart(slides_service, presentation_id: str, page_object_id: str, 
                        spreadsheet_id: str, chart_id: int, emu_transform: dict) -> dict:
    """Insert a Google Sheets chart into a slide"""
    import time
    import random
    
    try:
        object_id = f'chart_{int(time.time()*1000)}_{random.randint(1,9999)}'
        req = {
            'createSheetsChart': {
                'objectId': object_id,
                'spreadsheetId': spreadsheet_id,
                'chartId': chart_id,
                'elementProperties': {
                    'pageObjectId': page_object_id,
                    'size': {
                        'height': {'magnitude': emu_transform.get('height'), 'unit': 'EMU'},
                        'width': {'magnitude': emu_transform.get('width'), 'unit': 'EMU'}
                    },
                    'transform': {
                        'scaleX': 1,
                        'scaleY': 1,
                        'translateX': emu_transform.get('x'),
                        'translateY': emu_transform.get('y'),
                        'unit': 'EMU'
                    }
                }
            }
        }
        body = {'requests': [req]}
        result = slides_service.presentations().batchUpdate(
            presentationId=presentation_id,
            body=body
        ).execute()
        logger.info(f"Inserted chart into slide {page_object_id}")
        return result
    except HttpError as e:
        logger.error(f"Error inserting chart: {e}")
        raise

@retry_with_backoff()
def insert_image(slides_service, presentation_id: str, page_object_id: str,
                 image_url: str, emu_transform: dict) -> dict:
    """Insert an image into a slide"""
    import time
    import random
    
    try:
        object_id = f'image_{int(time.time()*1000)}_{random.randint(1,9999)}'
        req = {
            'createImage': {
                'objectId': object_id,
                'url': image_url,
                'elementProperties': {
                    'pageObjectId': page_object_id,
                    'size': {
                        'height': {'magnitude': emu_transform.get('height'), 'unit': 'EMU'},
                        'width': {'magnitude': emu_transform.get('width'), 'unit': 'EMU'}
                    },
                    'transform': {
                        'scaleX': 1,
                        'scaleY': 1,
                        'translateX': emu_transform.get('x'),
                        'translateY': emu_transform.get('y'),
                        'unit': 'EMU'
                    }
                }
            }
        }
        body = {'requests': [req]}
        result = slides_service.presentations().batchUpdate(
            presentationId=presentation_id,
            body=body
        ).execute()
        logger.info(f"Inserted image into slide {page_object_id}")
        return result
    except HttpError as e:
        logger.error(f"Error inserting image: {e}")
        raise

@retry_with_backoff()
def export_presentation_as_pptx(drive_service, presentation_id: str) -> bytes:
    """Export a Google Slides presentation as PPTX bytes"""
    try:
        request = drive_service.files().export_media(
            fileId=presentation_id,
            mimeType='application/vnd.openxmlformats-officedocument.presentationml.presentation'
        )
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()
        fh.seek(0)
        pptx_bytes = fh.read()
        logger.info(f"Exported presentation {presentation_id} as PPTX ({len(pptx_bytes)} bytes)")
        return pptx_bytes
    except HttpError as e:
        logger.error(f"Error exporting presentation: {e}")
        raise

