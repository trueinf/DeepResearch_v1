import time
import random
import logging
from functools import wraps

logger = logging.getLogger(__name__)

def retry_with_backoff(max_attempts=5, base_delay=0.5, max_delay=60):
    """
    Decorator for retrying functions with exponential backoff
    """
    def decorator(fn):
        @wraps(fn)
        def inner(*args, **kwargs):
            attempt = 0
            last_exception = None
            while attempt < max_attempts:
                try:
                    return fn(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    attempt += 1
                    if attempt >= max_attempts:
                        logger.error(f"Function {fn.__name__} failed after {max_attempts} attempts: {e}")
                        raise
                    
                    # Calculate sleep time with exponential backoff
                    sleep = min(max_delay, base_delay * (2 ** (attempt - 1)) + random.random())
                    logger.warning(f"Function {fn.__name__} failed (attempt {attempt}/{max_attempts}), retrying in {sleep:.2f}s: {e}")
                    time.sleep(sleep)
            
            # Should never reach here, but just in case
            if last_exception:
                raise last_exception
        return inner
    return decorator

def inches_to_emu(inches: float) -> int:
    """Convert inches to EMU (English Metric Units) for Google Slides"""
    return int(inches * 914400)

def cm_to_emu(cm: float) -> int:
    """Convert centimeters to EMU"""
    return int(cm * 360000)

def emu_to_inches(emu: int) -> float:
    """Convert EMU to inches"""
    return emu / 914400

def emu_to_cm(emu: int) -> float:
    """Convert EMU to centimeters"""
    return emu / 360000

