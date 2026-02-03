"""Image search tool for research workflow.

Wraps available image search APIs or returns empty results.
"""
from typing import List, Dict, Any
import logging
import os
from pathlib import Path

logger = logging.getLogger("cliv2.tools.image_search")


def search_images(
    query: str, 
    top_n: int = 3, 
    output_folder: str = ""
) -> List[Dict[str, Any]]:
    """Execute image search and download results.
    
    Tries available image search backends in order:
    1. SerpApi Images (if SERP_API_KEY is set) - serpapi.com
    2. Serper Images API (if SERPER_API_KEY is set) - serper.dev
    3. Returns empty results (no mock data)
    
    Args:
        query: Search query string
        top_n: Number of images to return
        output_folder: Directory to save images
        
    Returns:
        List of image metadata with filename, dimensions, aspect_ratio
    """
    # Try SerpApi (serpapi.com)
    serpapi_key = os.environ.get("SERP_API_KEY")
    if serpapi_key:
        try:
            return _search_serpapi_images(query, serpapi_key, top_n, output_folder)
        except Exception as e:
            logger.warning(f"SerpApi image search failed: {e}")
    
    # Try Serper Images API (serper.dev)
    serper_key = os.environ.get("SERPER_API_KEY")
    if serper_key:
        try:
            return _search_serper_images(query, serper_key, top_n, output_folder)
        except Exception as e:
            logger.warning(f"Serper image search failed: {e}")
    
    # No image search API available
    logger.info(f"No image search API configured for query: {query[:50]}...")
    return []


def _search_serpapi_images(
    query: str, 
    api_key: str, 
    top_n: int, 
    output_folder: str
) -> List[Dict[str, Any]]:
    """Search and download images using SerpApi (serpapi.com)."""
    import requests
    import hashlib
    
    # Search for images using Google Images engine
    response = requests.get(
        "https://serpapi.com/search",
        params={
            "api_key": api_key,
            "q": query,
            "tbm": "isch",  # Image search
            "num": top_n,
            "engine": "google_images",
        },
        timeout=15,
    )
    response.raise_for_status()
    
    data = response.json()
    images = data.get("images_results", [])[:top_n]
    
    results = []
    output_path = Path(output_folder) / "images" if output_folder else None
    if output_path:
        output_path.mkdir(parents=True, exist_ok=True)
    
    for img in images:
        img_url = img.get("original", "") or img.get("thumbnail", "")
        if not img_url:
            continue
        
        # Generate filename from query and URL
        hash_suffix = hashlib.md5(img_url.encode()).hexdigest()[:8]
        safe_query = "".join(c if c.isalnum() else "_" for c in query[:30])
        filename = f"{safe_query}_{hash_suffix}.jpg"
        
        # Try to download image
        saved = False
        if output_path:
            try:
                img_response = requests.get(img_url, timeout=10, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                })
                img_response.raise_for_status()
                
                # Validate image size: skip error images (<2KB) and oversized (>1MB)
                content_length = len(img_response.content)
                if content_length < 2048:
                    logger.warning(f"Skipping error image (too small: {content_length} bytes): {filename}")
                    continue
                if content_length > 1024 * 1024:
                    logger.warning(f"Skipping oversized image ({content_length // 1024}KB): {filename}")
                    continue
                
                filepath = output_path / filename
                filepath.write_bytes(img_response.content)
                saved = True
                logger.debug(f"Downloaded: {filename} ({content_length // 1024}KB)")
            except Exception as e:
                logger.warning(f"Failed to download image: {e}")
        
        # Only include successfully downloaded images
        if not saved:
            continue
        
        # Get dimensions from SerpApi response
        width = img.get("original_width", 0)
        height = img.get("original_height", 0)
        
        # Calculate aspect ratio
        aspect = _calculate_aspect_ratio(width, height)
        
        results.append({
            "filename": filename,
            "url": img_url,
            "width": width,
            "height": height,
            "aspect_ratio": aspect,
            "snippet": img.get("title", ""),
            "source": img.get("source", ""),
        })
    
    return results


def _calculate_aspect_ratio(width: int, height: int) -> str:
    """Calculate aspect ratio category from dimensions."""
    if not width or not height:
        return "unknown"
    ratio = width / height
    if ratio >= 1.7:
        return "16:9"
    elif ratio >= 1.3:
        return "4:3"
    elif ratio >= 0.9:
        return "1:1"
    elif ratio >= 0.7:
        return "3:4"
    else:
        return "9:16"


def _search_serper_images(
    query: str, 
    api_key: str, 
    top_n: int, 
    output_folder: str
) -> List[Dict[str, Any]]:
    """Search and download images using Serper API."""
    import requests
    import hashlib
    
    # Search for images
    response = requests.post(
        "https://google.serper.dev/images",
        headers={"X-API-KEY": api_key},
        json={"q": query, "num": top_n},
        timeout=10,
    )
    response.raise_for_status()
    
    data = response.json()
    images = data.get("images", [])[:top_n]
    
    results = []
    output_path = Path(output_folder) / "images" if output_folder else None
    if output_path:
        output_path.mkdir(parents=True, exist_ok=True)
    
    for img in images:
        img_url = img.get("imageUrl", "")
        if not img_url:
            continue
        
        # Generate filename from query and URL
        hash_suffix = hashlib.md5(img_url.encode()).hexdigest()[:8]
        safe_query = "".join(c if c.isalnum() else "_" for c in query[:30])
        filename = f"{safe_query}_{hash_suffix}.jpg"
        
        # Try to download image
        saved = False
        if output_path:
            try:
                img_response = requests.get(img_url, timeout=10)
                img_response.raise_for_status()
                
                filepath = output_path / filename
                filepath.write_bytes(img_response.content)
                saved = True
                logger.debug(f"Downloaded: {filename}")
            except Exception as e:
                logger.warning(f"Failed to download image: {e}")
        
        # Only include successfully downloaded images
        if not saved:
            continue
        
        # Get dimensions
        width = img.get("imageWidth", 0)
        height = img.get("imageHeight", 0)
        
        # Calculate aspect ratio
        aspect = _calculate_aspect_ratio(width, height)
        
        results.append({
            "filename": filename,
            "url": img_url,
            "width": width,
            "height": height,
            "aspect_ratio": aspect,
            "snippet": img.get("title", ""),
            "source": img.get("source", ""),
        })
    
    return results
