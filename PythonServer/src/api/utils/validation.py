# src/api/utils/validation.py - Simple input validation

def validate_nutrition_request(request):
    """Validate nutrition calculation request"""
    errors = []
    
    # Check calories
    if not hasattr(request, 'calories') or request.calories is None:
        errors.append("calories is required")
    elif request.calories <= 0:
        errors.append("calories must be positive")
    elif request.calories > 5000:
        errors.append("calories cannot exceed 5000")
    
    # Check protein
    if not hasattr(request, 'protein') or request.protein is None:
        errors.append("protein is required")
    elif request.protein < 0:
        errors.append("protein cannot be negative")
    elif request.protein > 500:
        errors.append("protein cannot exceed 500g")
    
    # Check carbs
    if not hasattr(request, 'carbs') or request.carbs is None:
        errors.append("carbs is required")
    elif request.carbs < 0:
        errors.append("carbs cannot be negative")
    elif request.carbs > 1000:
        errors.append("carbs cannot exceed 1000g")
    
    # Check fat
    if not hasattr(request, 'fat') or request.fat is None:
        errors.append("fat is required")
    elif request.fat < 0:
        errors.append("fat cannot be negative")
    elif request.fat > 300:
        errors.append("fat cannot exceed 300g")
    
    # Check meal type if provided
    if hasattr(request, 'meal_type') and request.meal_type:
        allowed_types = ['breakfast', 'lunch', 'dinner', 'snack']
        if request.meal_type.lower() not in allowed_types:
            errors.append(f"meal_type must be one of: {allowed_types}")
    
    # Check num_items if provided
    if hasattr(request, 'num_items') and request.num_items is not None:
        if request.num_items <= 0:
            errors.append("num_items must be positive")
        elif request.num_items > 20:
            errors.append("num_items cannot exceed 20")
    
    return errors

def validate_user_profile_request(request):
    """Validate user profile request"""
    errors = []
    
    # Check height
    if not hasattr(request, 'height') or request.height is None:
        errors.append("height is required")
    elif request.height < 100 or request.height > 250:
        errors.append("height must be between 100 and 250 cm")
    
    # Check weight
    if not hasattr(request, 'weight') or request.weight is None:
        errors.append("weight is required")
    elif request.weight < 30 or request.weight > 300:
        errors.append("weight must be between 30 and 300 kg")
    
    # Check age
    if not hasattr(request, 'age') or request.age is None:
        errors.append("age is required")
    elif request.age < 13 or request.age > 120:
        errors.append("age must be between 13 and 120 years")
    
    # Check gender
    if not hasattr(request, 'gender') or not request.gender:
        errors.append("gender is required")
    elif request.gender.lower() not in ['male', 'female', 'other']:
        errors.append("gender must be 'male', 'female', or 'other'")
    
    # Check activity level
    if not hasattr(request, 'activity_level') or not request.activity_level:
        errors.append("activity_level is required")
    else:
        allowed_levels = ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active']
        if request.activity_level.lower() not in allowed_levels:
            errors.append(f"activity_level must be one of: {allowed_levels}")
    
    # Check dietary goal
    if not hasattr(request, 'dietary_goal') or not request.dietary_goal:
        errors.append("dietary_goal is required")
    elif request.dietary_goal.lower() not in ['maintain', 'lose', 'gain']:
        errors.append("dietary_goal must be 'maintain', 'lose', or 'gain'")
    
    return errors

def validate_search_query(query):
    """Validate search query"""
    errors = []
    
    if not query:
        errors.append("search query cannot be empty")
    elif len(query.strip()) < 2:
        errors.append("search query must be at least 2 characters")
    elif len(query) > 100:
        errors.append("search query cannot exceed 100 characters")
    
    return errors

def validate_price_comparison_request(request):
    """Validate price comparison request"""
    errors = []
    
    if not hasattr(request, 'menu_items') or not request.menu_items:
        errors.append("menu_items is required")
        return errors
    
    if not isinstance(request.menu_items, list):
        errors.append("menu_items must be a list")
        return errors
    
    if len(request.menu_items) == 0:
        errors.append("menu_items cannot be empty")
        return errors
    
    if len(request.menu_items) > 50:
        errors.append("menu_items cannot exceed 50 items")
    
    # Validate each menu item
    for i, item in enumerate(request.menu_items):
        if not isinstance(item, dict):
            errors.append(f"menu_items[{i}] must be an object")
            continue
        
        # Check item_code
        if 'item_code' not in item or not item['item_code']:
            errors.append(f"menu_items[{i}] missing item_code")
        
        # Check portion_grams
        if 'portion_grams' not in item:
            errors.append(f"menu_items[{i}] missing portion_grams")
        else:
            try:
                portion = float(item['portion_grams'])
                if portion <= 0:
                    errors.append(f"menu_items[{i}] portion_grams must be positive")
                elif portion > 2000:
                    errors.append(f"menu_items[{i}] portion_grams cannot exceed 2000g")
            except (ValueError, TypeError):
                errors.append(f"menu_items[{i}] portion_grams must be a number")
    
    return errors