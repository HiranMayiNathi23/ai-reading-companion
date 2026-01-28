"""
OCR service using pytesseract for text extraction.
All processing is done in-memory - no files are saved.
"""
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import io
import os
from typing import Optional

# Configure Tesseract path for Windows (default installation location)
if os.name == 'nt':  # Windows
    tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    if os.path.exists(tesseract_path):
        pytesseract.pytesseract.tesseract_cmd = tesseract_path


def preprocess_image(image: Image.Image) -> Image.Image:
    """
    Preprocess image for better OCR results.
    
    Steps:
    1. Convert to grayscale
    2. Increase contrast
    3. Apply slight sharpening
    4. Resize if too small
    """
    # Convert to grayscale
    if image.mode != 'L':
        image = image.convert('L')
    
    # Resize if image is small (OCR works better on larger images)
    width, height = image.size
    if width < 1000:
        scale = 1500 / width
        new_size = (int(width * scale), int(height * scale))
        image = image.resize(new_size, Image.Resampling.LANCZOS)
    
    # Increase contrast
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(1.5)
    
    # Increase sharpness
    enhancer = ImageEnhance.Sharpness(image)
    image = enhancer.enhance(1.5)
    
    # Apply slight blur to reduce noise, then sharpen
    image = image.filter(ImageFilter.MedianFilter(size=1))
    
    return image


def extract_text_from_image(image_bytes: bytes) -> Optional[str]:
    """
    Extract English text from an image using OCR.
    
    Args:
        image_bytes: Raw image data (JPG/PNG)
    
    Returns:
        Extracted text string, or None if extraction fails
    
    Note:
        - Processing is done entirely in-memory
        - No image data is saved to disk
    """
    try:
        # Load image from bytes (in-memory)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary (handles PNG with alpha)
        if image.mode in ('RGBA', 'LA', 'P'):
            image = image.convert('RGB')
        
        # Preprocess image for better OCR
        processed_image = preprocess_image(image)
        
        # Perform OCR with English language
        # PSM 3 = Fully automatic page segmentation (default)
        # PSM 6 = Assume a single uniform block of text
        # OEM 3 = Default, based on what is available
        text = pytesseract.image_to_string(
            processed_image,
            lang='eng',
            config='--oem 3 --psm 3'  # Fully automatic page segmentation
        )
        
        # Clean up the extracted text
        text = text.strip()
        
        # Close the images to free memory
        image.close()
        processed_image.close()
        
        return text if text else None
        
    except Exception as e:
        print(f"[OCR] Error extracting text: {e}")
        return None


def validate_image(image_bytes: bytes) -> tuple[bool, str]:
    """
    Validate that the uploaded file is a valid image.
    
    Args:
        image_bytes: Raw file data
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        
        # Check format
        if image.format not in ('JPEG', 'PNG', 'JPG'):
            return False, f"Unsupported format: {image.format}. Use JPG or PNG."
        
        # Check size (max 10MB)
        if len(image_bytes) > 10 * 1024 * 1024:
            return False, "Image too large. Maximum size is 10MB."
        
        # Check dimensions (reasonable book page size)
        width, height = image.size
        if width < 100 or height < 100:
            return False, "Image too small. Minimum 100x100 pixels."
        if width > 10000 or height > 10000:
            return False, "Image too large. Maximum 10000x10000 pixels."
        
        image.close()
        return True, ""
        
    except Exception as e:
        return False, f"Invalid image file: {str(e)}"
