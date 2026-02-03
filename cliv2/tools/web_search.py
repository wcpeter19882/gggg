"""Web search tool for research workflow.

Wraps available search APIs or returns empty results.
"""
from typing import List, Dict, Any
import logging
import os

logger = logging.getLogger("cliv2.tools.web_search")


def search_web(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    """Execute web search and return results.
    
    Tries available search backends in order:
    1. Tavily API (if TAVILY_API_KEY is set)
    2. SerpApi (if SERP_API_KEY is set) - serpapi.com
    3. Serper API (if SERPER_API_KEY is set) - serper.dev
    4. Returns empty results (no mock data)
    
    Args:
        query: Search query string
        max_results: Maximum number of results to return
        
    Returns:
        List of search results with title, url, snippet
    """
    # Try Tavily API
    tavily_key = os.environ.get("TAVILY_API_KEY")
    if tavily_key:
        try:
            return _search_tavily(query, tavily_key, max_results)
        except Exception as e:
            logger.warning(f"Tavily search failed: {e}")
    
    # Try SerpApi (serpapi.com) - different from Serper
    serpapi_key = os.environ.get("SERP_API_KEY")
    if serpapi_key:
        try:
            return _search_serpapi(query, serpapi_key, max_results)
        except Exception as e:
            logger.warning(f"SerpApi search failed: {e}")
    
    # Try Serper API (serper.dev)
    serper_key = os.environ.get("SERPER_API_KEY")
    if serper_key:
        try:
            return _search_serper(query, serper_key, max_results)
        except Exception as e:
            logger.warning(f"Serper search failed: {e}")
    
    # No search API available
    logger.info(f"No web search API configured for query: {query[:50]}...")
    return []


def _search_tavily(query: str, api_key: str, max_results: int) -> List[Dict[str, Any]]:
    """Search using Tavily API."""
    import requests
    
    response = requests.post(
        "https://api.tavily.com/search",
        json={
            "api_key": api_key,
            "query": query,
            "max_results": max_results,
        },
        timeout=10,
    )
    response.raise_for_status()
    
    data = response.json()
    return [
        {
            "title": r.get("title", ""),
            "url": r.get("url", ""),
            "snippet": r.get("content", ""),
        }
        for r in data.get("results", [])
    ]


def _search_serpapi(query: str, api_key: str, max_results: int) -> List[Dict[str, Any]]:
    """Search using SerpApi (serpapi.com)."""
    import requests
    
    response = requests.get(
        "https://serpapi.com/search",
        params={
            "api_key": api_key,
            "q": query,
            "num": max_results,
            "engine": "google",
        },
        timeout=15,
    )
    response.raise_for_status()
    
    data = response.json()
    results = []
    for r in data.get("organic_results", [])[:max_results]:
        results.append({
            "title": r.get("title", ""),
            "url": r.get("link", ""),
            "snippet": r.get("snippet", ""),
        })
    return results


def _search_serper(query: str, api_key: str, max_results: int) -> List[Dict[str, Any]]:
    """Search using Serper API."""
    import requests
    
    response = requests.post(
        "https://google.serper.dev/search",
        headers={"X-API-KEY": api_key},
        json={"q": query, "num": max_results},
        timeout=10,
    )
    response.raise_for_status()
    
    data = response.json()
    return [
        {
            "title": r.get("title", ""),
            "url": r.get("link", ""),
            "snippet": r.get("snippet", ""),
        }
        for r in data.get("organic", [])
    ]
