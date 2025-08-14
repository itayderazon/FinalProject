# Simple catalog integration - just send product ID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import logging
from typing import Optional
from src.api.constants import NODE_BASE_URL, HTTP_TIMEOUT_SECONDS


router = APIRouter()
logger = logging.getLogger(__name__)

class AddProductRequest(BaseModel):
    product_id: str
    portion_grams: float = 100.0

class ProductResponse(BaseModel):
    success: bool
    product_id: str
    name: str
    portion_grams: float
    calories: float
    protein: float
    carbs: float
    fat: float
    estimated_price: Optional[float] = None

@router.post("/add-product")
async def add_product_to_menu(request: AddProductRequest):
    """Add a product from catalog to menu by product ID"""
    try:
        # Fetch product from Node.js server
        node_url = f"{NODE_BASE_URL}/api/products/item-code/{request.product_id}"
        
        response = requests.get(node_url, timeout=HTTP_TIMEOUT_SECONDS)
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail=f"Product {request.product_id} not found")
        
        product_data = response.json()
        
        if not product_data.get('success'):
            raise HTTPException(status_code=404, detail=f"Product {request.product_id} not found")
        
        product = product_data['product']
        
        # Calculate nutrition for portion size
        portion_factor = request.portion_grams / 100.0
        
        # Extract nutrition (look for various possible field names)
        base_calories = float(product.get('calories', product.get('energy', 0)))
        base_protein = float(product.get('protein', 0))
        base_carbs = float(product.get('carbs', product.get('carbohydrates', 0)))
        base_fat = float(product.get('fat', product.get('total_fat', 0)))
        
        # Calculate for portion
        calories = base_calories * portion_factor
        protein = base_protein * portion_factor
        carbs = base_carbs * portion_factor
        fat = base_fat * portion_factor
        
        # Estimate price if available
        estimated_price = None
        if 'priceStats' in product and product['priceStats']:
            min_price = product['priceStats'].get('minPrice')
            if min_price:
                estimated_price = (min_price / 100.0) * request.portion_grams
        
        return ProductResponse(
            success=True,
            product_id=request.product_id,
            name=product.get('name', 'Unknown Product'),
            portion_grams=request.portion_grams,
            calories=calories,
            protein=protein,
            carbs=carbs,
            fat=fat,
            estimated_price=estimated_price
        )
        
    except requests.RequestException as e:
        logger.error(f"Failed to fetch product {request.product_id}: {e}")
        raise HTTPException(status_code=503, detail="Catalog service unavailable")
    except Exception as e:
        logger.error(f"Error processing product {request.product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_products(query: str = "", limit: int = 20):
    """Search products in catalog"""
    try:
        # Search products in Node.js server
        node_url = f"{NODE_BASE_URL}/api/products/search"
        params = {'q': query, 'limit': limit}
        
        response = requests.get(node_url, params=params, timeout=HTTP_TIMEOUT_SECONDS)
        if response.status_code != 200:
            raise HTTPException(status_code=503, detail="Catalog service unavailable")
        
        data = response.json()
        
        if not data.get('success'):
            return {"success": False, "error": "Search failed"}
        
        # Simplify the product data
        products = []
        for product in data.get('products', []):
            products.append({
                'product_id': product.get('item_code', product.get('id')),
                'name': product.get('name', ''),
                'category': product.get('category', ''),
                'has_nutrition': bool(product.get('calories', 0) > 0),
                'min_price': product.get('priceStats', {}).get('minPrice') if product.get('priceStats') else None
            })
        
        return {
            "success": True,
            "query": query,
            "products": products,
            "total": len(products)
        }
        
    except requests.RequestException as e:
        logger.error(f"Failed to search products: {e}")
        raise HTTPException(status_code=503, detail="Catalog service unavailable")
    except Exception as e:
        logger.error(f"Error searching products: {e}")
        raise HTTPException(status_code=500, detail=str(e))

catalog_router = router 