# src/algorithm/preference_engine.py - User preference learning engine

import json
import os
from typing import Dict, List
from ..models import Menu

class PreferenceEngine:
    """Learns and adapts to user preferences over time"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.preferences_file = f"user_preferences_{user_id}.json"
        self.preferences = self._load_preferences()
    
    def _load_preferences(self) -> Dict:
        """Load user preferences from file"""
        if os.path.exists(self.preferences_file):
            try:
                with open(self.preferences_file, 'r') as f:
                    return json.load(f)
            except:
                pass
        
        return {
            'food_scores': {},  # individual food ratings
            'category_preferences': {},  # category preferences  
            'meal_preferences': {},  # meal-type preferences
            'rejection_list': [],  # foods to avoid
            'successful_combinations': [],  # good food pairings
            'total_ratings': 0,
            'avg_rating': 3.0,
            'dietary_patterns': {}  # learned eating patterns
        }
    
    def _save_preferences(self):
        """Save preferences to file"""
        try:
            with open(self.preferences_file, 'w') as f:
                json.dump(self.preferences, f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save preferences: {e}")
    
    def record_feedback(self, menu: Menu, rating: int, meal_type: str = None):
        """Record user feedback on a menu"""
        # Update overall stats
        self.preferences['total_ratings'] += 1
        total = self.preferences['total_ratings']
        current_avg = self.preferences['avg_rating']
        self.preferences['avg_rating'] = ((current_avg * (total - 1)) + rating) / total
        
        # Update individual food scores
        for item in menu.items:
            food_name = item.food.name
            if food_name not in self.preferences['food_scores']:
                self.preferences['food_scores'][food_name] = {'total': 0, 'count': 0}
            
            self.preferences['food_scores'][food_name]['total'] += rating
            self.preferences['food_scores'][food_name]['count'] += 1
            
            # Update category preferences
            category = item.food.category
            if category not in self.preferences['category_preferences']:
                self.preferences['category_preferences'][category] = {'total': 0, 'count': 0}
            
            self.preferences['category_preferences'][category]['total'] += rating
            self.preferences['category_preferences'][category]['count'] += 1
        
        # Update meal-type preferences
        if meal_type:
            if meal_type not in self.preferences['meal_preferences']:
                self.preferences['meal_preferences'][meal_type] = {'total': 0, 'count': 0}
            
            self.preferences['meal_preferences'][meal_type]['total'] += rating
            self.preferences['meal_preferences'][meal_type]['count'] += 1
        
        # Track rejections and successes
        if rating <= 2:
            # Add foods to rejection consideration
            for item in menu.items:
                food_name = item.food.name
                if food_name not in self.preferences['rejection_list']:
                    # Only add to rejection if consistently rated poorly
                    food_score = self.get_food_score(food_name)
                    if food_score < 2.5:
                        self.preferences['rejection_list'].append(food_name)
        
        elif rating >= 4:
            # Track successful combinations
            food_names = [item.food.name for item in menu.items]
            if len(food_names) > 1:
                combination = sorted(food_names)
                if combination not in self.preferences['successful_combinations']:
                    self.preferences['successful_combinations'].append(combination)
        
        self._save_preferences()
    
    def get_food_score(self, food_name: str) -> float:
        """Get preference score for a specific food"""
        if food_name in self.preferences['food_scores']:
            scores = self.preferences['food_scores'][food_name]
            return scores['total'] / scores['count']
        return self.preferences['avg_rating']  # Default to user's average
    
    def get_category_score(self, category: str) -> float:
        """Get preference score for a food category"""
        if category in self.preferences['category_preferences']:
            scores = self.preferences['category_preferences'][category]
            return scores['total'] / scores['count']
        return self.preferences['avg_rating']
    
    def is_rejected(self, food_name: str) -> bool:
        """Check if food is in rejection list"""
        return food_name in self.preferences['rejection_list']
    
    def get_successful_combinations(self) -> List[List[str]]:
        """Get list of successful food combinations"""
        return self.preferences['successful_combinations']
    
    def get_preferences_summary(self) -> Dict:
        """Get summary of learned preferences"""
        # Top liked foods
        top_foods = []
        for food, scores in self.preferences['food_scores'].items():
            avg_score = scores['total'] / scores['count']
            if scores['count'] >= 2 and avg_score >= 4:  # Well-rated foods
                top_foods.append((food, avg_score))
        
        top_foods.sort(key=lambda x: x[1], reverse=True)
        
        # Top categories
        top_categories = []
        for category, scores in self.preferences['category_preferences'].items():
            avg_score = scores['total'] / scores['count']
            if scores['count'] >= 3:
                top_categories.append((category, avg_score))
        
        top_categories.sort(key=lambda x: x[1], reverse=True)
        
        return {
            'total_ratings': self.preferences['total_ratings'],
            'average_rating': self.preferences['avg_rating'],
            'top_liked_foods': top_foods[:5],
            'top_categories': top_categories[:5],
            'rejected_foods': self.preferences['rejection_list'],
            'successful_combinations': len(self.preferences['successful_combinations'])
        } 