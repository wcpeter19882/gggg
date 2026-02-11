"""Serper.dev search tool for web and image search.

Uses serper.dev API for Google search results.
API key should be set in SERPER_API_KEY environment variable.
"""
import os
import requests
from pathlib import Path
from typing import Any, Optional
import hashlib
import logging

logger = logging.getLogger(__name__)

SERPER_API_KEY = os.environ.get("SERPER_API_KEY")
SERPER_WEB_URL = "https://google.serper.dev/search"
SERPER_IMAGE_URL = "https://google.serper.dev/images"


def _get_api_key() -> str:
    """Get API key from environment, raising error if not set."""
    if not SERPER_API_KEY:
        raise ValueError("SERPER_API_KEY environment variable not set. Add it to .env file.")
    return SERPER_API_KEY


def search_web(query: str, num_results: int = 10) -> list[dict[str, Any]]:
    """Perform web search using serper.dev API.
    
    Args:
        query: Search query string
        num_results: Number of results to return (default 10)
        
    Returns:
        List of search results with title, link, snippet
    """
    headers = {
        "X-API-KEY": _get_api_key(),
        "Content-Type": "application/json",
    }
    
    payload = {
        "q": query,
        "num": num_results,
    }
    
    try:
        response = requests.post(SERPER_WEB_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        results = []
        
        # Extract knowledge graph if available
        if data.get("knowledgeGraph"):
            kg = data["knowledgeGraph"]
            results.append({
                "title": kg.get("title", ""),
                "link": kg.get("website", kg.get("descriptionLink", "")),
                "snippet": kg.get("description", ""),
                "source": "Knowledge Graph",
                "attributes": kg.get("attributes", {}),
            })
        
        # Extract organic results
        for item in data.get("organic", []):
            results.append({
                "title": item.get("title", ""),
                "link": item.get("link", ""),
                "snippet": item.get("snippet", ""),
                "position": item.get("position", 0),
                "date": item.get("date"),
                "attributes": item.get("attributes", {}),
            })
        
        # Extract People Also Ask if relevant
        for paa in data.get("peopleAlsoAsk", [])[:3]:
            results.append({
                "title": paa.get("question", ""),
                "link": paa.get("link", ""),
                "snippet": paa.get("snippet", ""),
                "source": "People Also Ask",
            })
        
        return results[:num_results]
        
    except requests.RequestException as e:
        logger.error(f"Serper web search failed: {e}")
        return []
    except Exception as e:
        logger.error(f"Serper web search error: {e}")
        return []


def search_images(
    query: str, 
    top_n: int = 5, 
    output_folder: Optional[str] = None,
    min_width: int = 800,
    min_height: int = 600,
) -> list[dict[str, Any]]:
    """Perform image search using serper.dev API and optionally download images.
    
    Args:
        query: Search query string
        top_n: Number of images to return
        output_folder: If provided, download images to this folder/images/
        min_width: Minimum image width to consider
        min_height: Minimum image height to consider
        
    Returns:
        List of image results with metadata and optionally local filename
    """
    headers = {
        "X-API-KEY": _get_api_key(),
        "Content-Type": "application/json",
    }
    
    payload = {
        "q": query,
        "num": top_n * 2,  # Request more to filter by size
    }
    
    try:
        response = requests.post(SERPER_IMAGE_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        results = []
        
        for item in data.get("images", []):
            # Filter by minimum dimensions
            width = item.get("imageWidth", 0)
            height = item.get("imageHeight", 0)
            
            if width < min_width or height < min_height:
                continue
            
            result = {
                "title": item.get("title", ""),
                "image_url": item.get("imageUrl", ""),
                "width": width,
                "height": height,
                "source": item.get("source", ""),
                "domain": item.get("domain", ""),
                "link": item.get("link", ""),
                "thumbnail_url": item.get("thumbnailUrl", ""),
            }
            
            # Download image if output folder provided
            if output_folder and result["image_url"]:
                downloaded = _download_image(
                    result["image_url"],
                    output_folder,
                    query,
                    len(results) + 1,
                )
                if downloaded:
                    result["filename"] = downloaded
                    result["local_path"] = str(Path(output_folder) / "images" / downloaded)
            
            results.append(result)
            
            if len(results) >= top_n:
                break
        
        return results
        
    except requests.RequestException as e:
        logger.error(f"Serper image search failed: {e}")
        return []
    except Exception as e:
        logger.error(f"Serper image search error: {e}")
        return []


def _download_image(url: str, output_folder: str, query: str, index: int) -> Optional[str]:
    """Download image to output folder.
    
    Args:
        url: Image URL to download
        output_folder: Project folder (will create images/ subfolder)
        query: Search query (used for filename)
        index: Image index (used for filename)
        
    Returns:
        Filename if successful, None otherwise
    """
    images_dir = Path(output_folder) / "images"
    images_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate filename from query
    safe_query = "".join(c if c.isalnum() or c in " -_" else "" for c in query)
    safe_query = safe_query.replace(" ", "_")[:30]
    
    # Determine extension from URL
    ext = ".jpg"
    url_lower = url.lower()
    if ".png" in url_lower:
        ext = ".png"
    elif ".gif" in url_lower:
        ext = ".gif"
    elif ".webp" in url_lower:
        ext = ".webp"
    elif ".svg" in url_lower:
        ext = ".svg"
    
    # Create unique filename
    url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
    filename = f"{safe_query}_{index:02d}_{url_hash}{ext}"
    filepath = images_dir / filename
    
    try:
        response = requests.get(url, timeout=15, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        response.raise_for_status()
        
        # Verify it's actually an image
        content_type = response.headers.get("Content-Type", "")
        if not content_type.startswith("image/"):
            logger.warning(f"Not an image: {url} ({content_type})")
            return None
        
        # Check minimum size (skip tiny images)
        if len(response.content) < 5000:  # 5KB minimum
            logger.warning(f"Image too small: {url} ({len(response.content)} bytes)")
            return None
        
        filepath.write_bytes(response.content)
        logger.info(f"Downloaded: {filename} ({len(response.content)} bytes)")
        return filename
        
    except Exception as e:
        logger.warning(f"Failed to download {url}: {e}")
        return None


def search_web_batch(queries: list[str], num_results: int = 5) -> dict[str, list[dict]]:
    """Perform multiple web searches.
    
    Args:
        queries: List of search queries
        num_results: Results per query
        
    Returns:
        Dict mapping query -> results
    """
    results = {}
    for query in queries:
        results[query] = search_web(query, num_results)
    return results
