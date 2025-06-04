# src/filters/base_filter.py - Base filter class

class FoodFilter:
    """Base filter class for filtering foods"""
    
    def filter(self, foods):
        """Filter the list of foods. Override in subclasses."""
        return foods
    
    def __call__(self, foods):
        """Allow filter to be called as a function"""
        return self.filter(foods)

class FilterChain:
    """Chain multiple filters together"""
    
    def __init__(self, filters=None):
        self.filters = filters or []
    
    def add_filter(self, filter_instance):
        """Add a filter to the chain"""
        self.filters.append(filter_instance)
        return self
    
    def filter(self, foods):
        """Apply all filters in sequence"""
        result = foods
        for filter_instance in self.filters:
            result = filter_instance.filter(result)
        return result
    
    def __call__(self, foods):
        """Allow chain to be called as a function"""
        return self.filter(foods)