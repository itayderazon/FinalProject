# Simple Catalog Integration

## 🏗️ **Overview**

A simple system to add products from your catalog to the menu by just sending the product ID and portion size. No complex models or async operations - just straightforward HTTP requests.

### Key Components

1. **Simple API** (`src/api/routes/catalog.py`)
   - `/api/catalog/add-product` - Add product by ID with portion
   - `/api/catalog/search` - Search products in catalog
   - Simple request/response models

2. **Integration** (`src/api/server.py`)
   - Catalog router integrated into main FastAPI application

---

## 🔌 **API Endpoints**

### **Search Products**
```http
GET /api/catalog/search?query=milk&limit=10
```

**Response:**
```json
{
  "success": true,
  "query": "milk",
  "products": [
    {
      "product_id": "12345",
      "name": "חלב 3% טרה",
      "category": "מעדנים",
      "has_nutrition": true,
      "min_price": 5.90
    }
  ],
  "total": 1
}
```

### **Add Product to Menu**
```http
POST /api/catalog/add-product
```

**Request:**
```json
{
  "product_id": "12345",
  "portion_grams": 200
}
```

**Response:**
```json
{
  "success": true,
  "product_id": "12345",
  "name": "חלב 3% טרה",
  "portion_grams": 200,
  "calories": 128,
  "protein": 6.4,
  "carbs": 9.6,
  "fat": 6.0,
  "estimated_price": 11.80
}
```

---

## 💻 **Code Examples**

### **Using the Catalog Service**

```python
from src.services.catalog_service import CatalogService

async def example_usage():
    async with CatalogService() as catalog:
        # Search for dairy products
        items = await catalog.search_catalog("חלב", {"category": "מעדנים"})
        
        # Get specific item
        milk = await catalog.get_catalog_item("12345")
        
        # Get recommended portions
        portions = await catalog.get_recommended_portions("12345")
        
        # Create menu item
        portion = catalog.create_portion_specification(200, "כוס גדולה")
        menu_item = catalog.create_catalog_menu_item(milk, portion)
        
        print(f"Menu item: {menu_item}")
        print(f"Nutrition: {menu_item.get_nutrition()}")
        print(f"Cost: ${menu_item.get_estimated_cost():.2f}")
```

### **Synchronous Usage**

```python
from src.services.catalog_service import SyncCatalogService

def sync_example():
    catalog = SyncCatalogService()
    
    # Search products
    items = catalog.search_catalog("bread")
    
    # Get item details
    bread = catalog.get_catalog_item("67890")
    
    # Get portions
    portions = catalog.get_recommended_portions("67890")
```

### **Integration with Existing Menu System**

```python
from src.models.menu import Menu
from src.services.catalog_service import SyncCatalogService

def create_menu_from_catalog():
    catalog = SyncCatalogService()
    menu = Menu()
    
    # Add catalog items to existing menu
    milk = catalog.get_catalog_item("12345")
    portion = catalog.catalog_service.create_portion_specification(200)
    catalog_menu_item = catalog.catalog_service.create_catalog_menu_item(milk, portion)
    
    # Convert to regular menu item
    menu_item = catalog_menu_item.to_menu_item()
    menu.add_item(menu_item)
    
    return menu
```

---

## ⚙️ **Configuration**

### **Environment Variables**

```bash
# Node.js server URL for catalog integration
NODE_SERVER_URL=http://localhost:3001

# Database configuration (if needed)
DATABASE_URL=postgresql://user:pass@localhost/db
```

### **Service Configuration**

```python
# config.py
CATALOG_CONFIG = {
    'node_server_url': 'http://localhost:3001',
    'timeout': 30,
    'max_retries': 3,
    'default_portions': {
        'dairy': [100, 150, 200],
        'meat': [80, 120, 150],
        'vegetables': [150, 200, 300],
        'fruits': [100, 150, 200]
    }
}
```

---

## 🔄 **Error Handling**

### **Common Error Scenarios**

1. **Catalog Service Unavailable**
   ```json
   {
     "success": false,
     "error": "Catalog service unavailable",
     "error_code": "SERVICE_UNAVAILABLE"
   }
   ```

2. **Invalid Item Code**
   ```json
   {
     "success": false,
     "error": "Catalog item '99999' not found",
     "error_code": "ITEM_NOT_FOUND"
   }
   ```

3. **Invalid Portion Specification**
   ```json
   {
     "success": false,
     "error": "Invalid portion specification: 2000g exceeds maximum allowed",
     "error_code": "INVALID_PORTION"
   }
   ```

4. **Missing Nutrition Information**
   ```json
   {
     "success": true,
     "message": "Item added with warnings",
     "validation_warnings": [
       "Item has no nutrition information",
       "Item may not be suitable for menu inclusion"
     ]
   }
   ```

---

## 🚀 **Getting Started**

### **Installation**

1. **Install Dependencies**
   ```bash
   cd PythonServer
   pip install -r requirements.txt
   ```

2. **Start Node.js Server** (for catalog data)
   ```bash
   cd NodeServer
   npm install
   npm start
   ```

3. **Start Python Server**
   ```bash
   cd PythonServer
   python -m uvicorn src.api.server:app --reload --port 8000
   ```

### **Quick Test**

```bash
# Search catalog
curl "http://localhost:8000/api/catalog/search?query=milk&limit=5"

# Get item details
curl "http://localhost:8000/api/catalog/item/12345"

# Add item to menu
curl -X POST "http://localhost:8000/api/catalog/add-to-menu" \
  -H "Content-Type: application/json" \
  -d '{
    "item_code": "12345",
    "portion": {
      "grams": 200,
      "description": "כוס גדולה"
    }
  }'
```

---

## 🎯 **Best Practices**

### **Portion Specifications**
- **Small portions**: 50-100g for most items
- **Medium portions**: 100-200g for main items  
- **Large portions**: 200-500g for bulk items
- **Maximum limit**: 1000g per item

### **Error Handling**
- Always check `is_menu_eligible()` before adding to menu
- Validate nutrition information availability
- Handle async operations with proper exception catching
- Provide meaningful error messages to users

### **Performance**
- Use async context managers for catalog service
- Batch multiple operations when possible
- Cache frequently accessed items
- Set reasonable timeouts for external API calls

### **Data Validation**
- Validate item codes before processing
- Check portion size limits
- Ensure nutrition data completeness
- Verify price information availability

---

## 📊 **Monitoring & Logging**

The system includes comprehensive logging:

```python
import logging

# Enable detailed logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log examples:
# "Searching catalog: query='milk', category='מעדנים', limit=50"
# "Adding catalog item to menu: 12345 - 200g"
# "Created menu from 3 catalog items, total: 456 calories"
```

---

## 🔮 **Future Enhancements**

1. **Caching Layer**: Redis cache for frequently accessed items
2. **Batch Operations**: Bulk item processing with parallel requests  
3. **Smart Portions**: AI-based portion recommendations
4. **Nutrition Optimization**: Automatic portion adjustment for dietary goals
5. **Price Optimization**: Cost-effective menu suggestions
6. **Allergen Filtering**: Advanced dietary restriction support
7. **Inventory Integration**: Real-time availability checking

---

## 🆘 **Troubleshooting**

### **Common Issues**

**1. Module Import Errors**
```bash
# Ensure Python path includes project root
export PYTHONPATH="${PYTHONPATH}:/path/to/PythonServer"
```

**2. Async Context Issues**
```python
# Always use async context manager
async with CatalogService() as service:
    result = await service.search_catalog("query")
```

**3. Validation Errors**
```python
# Check item eligibility
if not item.is_menu_eligible():
    print("Item not suitable for menu")
```

This integration provides a robust, scalable solution for connecting your product catalog with the menu generation system while maintaining clean separation of concerns and comprehensive error handling. 