# src/services/catalog_service.py - Service for catalog integration

import asyncio
import aiohttp
import logging
from typing import List, Optional, Dict, Any, Union
from src.models.catalog import CatalogItem, PortionSpecification, CatalogMenuItem
from src.models.nutrition import NutritionInfo

logger = logging.getLogger(__name__)

class CatalogService:
    """Service for integrating with external product catalog"""
    
    def __init__(self, node_server_url: str = "http://localhost:3001"):
        self.node_server_url = node_server_url.rstrip('/')
        self.session = None
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request to Node.js server"""
        if not self.session:
            self.session = aiohttp.ClientSession()
            
        url = f"{self.node_server_url}/api{endpoint}"
        
        try:
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return data
                else:
                    logger.error(f"API request failed: {response.status} - {url}")
                    return {"success": False, "error": f"HTTP {response.status}"}
        except Exception as e:
            logger.error(f"Request failed to {url}: {e}")
            return {"success": False, "error": str(e)}
    
    def _parse_nutrition(self, product_data: Dict) -> Optional[NutritionInfo]:
        """Parse nutrition information from product data"""
        try:
            # Check for direct nutrition fields
            if 'nutrition' in product_data:
                nutrition = product_data['nutrition']
                return NutritionInfo(
                    calories=float(nutrition.get('calories', 0)),
                    protein=float(nutrition.get('protein', 0)),
                    carbs=float(nutrition.get('carbs', 0)),
                    fat=float(nutrition.get('fat', 0))
                )
            
            # Check for individual nutrition fields
            calories = product_data.get('calories', product_data.get('energy', 0))
            protein = product_data.get('protein', 0)
            carbs = product_data.get('carbs', product_data.get('carbohydrates', 0))
            fat = product_data.get('fat', product_data.get('total_fat', 0))
            
            if any([calories, protein, carbs, fat]):
                return NutritionInfo(
                    calories=float(calories),
                    protein=float(protein),
                    carbs=float(carbs),
                    fat=float(fat)
                )
            
            return None
        except (ValueError, TypeError) as e:
            logger.warning(f"Failed to parse nutrition data: {e}")
            return None
    
    def _create_catalog_item(self, product_data: Dict) -> CatalogItem:
        """Create CatalogItem from product data"""
        nutrition = self._parse_nutrition(product_data)
        
        # Parse price statistics
        price_stats = {}
        if 'priceStats' in product_data or 'price_stats' in product_data:
            stats = product_data.get('priceStats', product_data.get('price_stats', {}))
            if stats and isinstance(stats, dict):
                price_stats = {
                    'minPrice': stats.get('minPrice', stats.get('min_price')),
                    'maxPrice': stats.get('maxPrice', stats.get('max_price')),
                    'avgPrice': stats.get('avgPrice', stats.get('avg_price')),
                    'storeCount': stats.get('storeCount', stats.get('store_count', 0))
                }
        
        return CatalogItem(
            item_code=product_data.get('item_code', product_data.get('itemCode', '')),
            name=product_data.get('name', ''),
            category=product_data.get('category', product_data.get('category_name', '')),
            subcategory=product_data.get('subcategory', product_data.get('subcategory_name', '')),
            brand=product_data.get('brand', product_data.get('manufacturer', '')),
            description=product_data.get('description', ''),
            nutrition_per_100g=nutrition,
            price_stats=price_stats,
            allergens=product_data.get('allergens', [])
        )
    
    async def search_catalog(self, query: str, filters: Optional[Dict] = None) -> List[CatalogItem]:
        """Search products in the catalog"""
        params = {'q': query}
        if filters:
            params.update(filters)
        
        response = await self._make_request('/products/search', params)
        
        if not response.get('success', False):
            logger.error(f"Catalog search failed: {response.get('error', 'Unknown error')}")
            return []
        
        products = response.get('products', [])
        catalog_items = []
        
        for product in products:
            try:
                item = self._create_catalog_item(product)
                catalog_items.append(item)
            except Exception as e:
                logger.warning(f"Failed to create catalog item from {product.get('name', 'unknown')}: {e}")
        
        return catalog_items
    
    async def get_catalog_item(self, item_code: str) -> Optional[CatalogItem]:
        """Get a specific catalog item by item code"""
        response = await self._make_request(f'/products/item-code/{item_code}')
        
        if not response.get('success', False):
            return None
        
        product = response.get('product')
        if not product:
            return None
        
        try:
            return self._create_catalog_item(product)
        except Exception as e:
            logger.error(f"Failed to create catalog item for {item_code}: {e}")
            return None
    
    async def get_catalog_categories(self) -> Dict[str, List[str]]:
        """Get available categories and subcategories"""
        response = await self._make_request('/products/categories')
        
        if not response.get('success', False):
            return {}
        
        return response.get('categories', {})
    
    async def get_menu_eligible_items(self, category: Optional[str] = None, 
                                    min_nutrition: bool = True) -> List[CatalogItem]:
        """Get items eligible for menu inclusion"""
        params = {}
        if category:
            params['category'] = category
        if min_nutrition:
            params['has_nutrition'] = 'true'
        
        all_items = await self.search_catalog('', params)
        return [item for item in all_items if item.is_menu_eligible()]
    
    def create_portion_specification(self, grams: float, description: Optional[str] = None,
                                   min_grams: Optional[float] = None, 
                                   max_grams: Optional[float] = None) -> PortionSpecification:
        """Create a portion specification with validation"""
        return PortionSpecification(grams, description, min_grams, max_grams)
    
    def create_catalog_menu_item(self, catalog_item: CatalogItem, 
                               portion: PortionSpecification) -> CatalogMenuItem:
        """Create a menu item from catalog item and portion specification"""
        return CatalogMenuItem(catalog_item, portion)
    
    async def get_recommended_portions(self, item_code: str) -> List[PortionSpecification]:
        """Get recommended portion sizes for a catalog item"""
        catalog_item = await self.get_catalog_item(item_code)
        if not catalog_item:
            return []
        
        # Generate portion recommendations based on category
        category = catalog_item.category.lower()
        subcategory = catalog_item.subcategory.lower()
        
        portions = []
        
        # Category-based portion recommendations
        if 'מעדנים' in category or 'dairy' in category.lower():
            portions = [
                PortionSpecification(150, "מנה בינונית"),
                PortionSpecification(100, "מנה קטנה"),
                PortionSpecification(200, "מנה גדולה")
            ]
        elif 'בשר' in category or 'meat' in category.lower():
            portions = [
                PortionSpecification(120, "מנה סטנדרטית"),
                PortionSpecification(80, "מנה קטנה"),
                PortionSpecification(150, "מנה גדולה")
            ]
        elif 'ירקות' in category or 'vegetables' in category.lower():
            portions = [
                PortionSpecification(200, "מנה בינונית"),
                PortionSpecification(150, "מנה קטנה"),
                PortionSpecification(300, "מנה גדולה")
            ]
        elif 'פירות' in category or 'fruits' in category.lower():
            portions = [
                PortionSpecification(150, "פרי בינוני"),
                PortionSpecification(100, "פרי קטן"),
                PortionSpecification(200, "פרי גדול")
            ]
        else:
            # Default portions
            portions = [
                PortionSpecification(100, "מנה סטנדרטית"),
                PortionSpecification(75, "מנה קטנה"),
                PortionSpecification(150, "מנה גדולה")
            ]
        
        return portions

class SyncCatalogService:
    """Synchronous wrapper for CatalogService"""
    
    def __init__(self, node_server_url: str = "http://localhost:3001"):
        self.catalog_service = CatalogService(node_server_url)
    
    def search_catalog(self, query: str, filters: Optional[Dict] = None) -> List[CatalogItem]:
        """Synchronous catalog search"""
        return asyncio.run(self._async_search(query, filters))
    
    async def _async_search(self, query: str, filters: Optional[Dict] = None) -> List[CatalogItem]:
        """Async helper for search"""
        async with self.catalog_service as service:
            return await service.search_catalog(query, filters)
    
    def get_catalog_item(self, item_code: str) -> Optional[CatalogItem]:
        """Synchronous get catalog item"""
        return asyncio.run(self._async_get_item(item_code))
    
    async def _async_get_item(self, item_code: str) -> Optional[CatalogItem]:
        """Async helper for get item"""
        async with self.catalog_service as service:
            return await service.get_catalog_item(item_code)
    
    def get_menu_eligible_items(self, category: Optional[str] = None) -> List[CatalogItem]:
        """Synchronous get menu eligible items"""
        return asyncio.run(self._async_get_eligible(category))
    
    async def _async_get_eligible(self, category: Optional[str] = None) -> List[CatalogItem]:
        """Async helper for get eligible items"""
        async with self.catalog_service as service:
            return await service.get_menu_eligible_items(category)
    
    def get_recommended_portions(self, item_code: str) -> List[PortionSpecification]:
        """Synchronous get recommended portions"""
        return asyncio.run(self._async_get_portions(item_code))
    
    async def _async_get_portions(self, item_code: str) -> List[PortionSpecification]:
        """Async helper for get portions"""
        async with self.catalog_service as service:
            return await service.get_recommended_portions(item_code) 