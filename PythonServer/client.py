# client.py - Simple menu generation client

import socket
import json

class MenuClient:
    def __init__(self, host='localhost', port=8888):
        self.host = host
        self.port = port
    
    def connect_to_server(self):
        """Connect to the menu server"""
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.connect((self.host, self.port))
            print(f"✅ Connected to menu server at {self.host}:{self.port}")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to server: {e}")
            return False
    
    def get_user_input(self):
        """Get menu request from user"""
        print("\n" + "="*50)
        print("🍽️ MENU GENERATOR CLIENT")
        print("="*50)
        
        try:
            calories = float(input("Enter target calories: "))
            protein = float(input("Enter target protein (g): "))
            carbs = float(input("Enter target carbs (g): "))
            fat = float(input("Enter target fat (g): "))
            
            print("\nAvailable meal types: breakfast, lunch, dinner, snacks")
            meal_type = input("Enter meal type (or press Enter for any): ").strip().lower()
            if meal_type not in ['breakfast', 'lunch', 'dinner', 'snacks']:
                meal_type = None
            
            num_items = input("Enter number of items (or press Enter for default): ").strip()
            if num_items:
                num_items = int(num_items)
            else:
                num_items = None
            
            return {
                'calories': calories,
                'protein': protein,
                'carbs': carbs,
                'fat': fat,
                'meal_type': meal_type,
                'num_items': num_items
            }
            
        except ValueError:
            raise ValueError("Please enter valid numbers")
    
    def send_request(self, request_data):
        """Send request to server and get response"""
        try:
            # Convert to JSON and send
            request_json = json.dumps(request_data, ensure_ascii=False)
            request_bytes = request_json.encode('utf-8')
            
            # Send length first, then data
            length = len(request_bytes)
            self.socket.send(length.to_bytes(4, byteorder='big'))
            self.socket.send(request_bytes)
            
            # Receive length first
            length_bytes = self.socket.recv(4)
            length = int.from_bytes(length_bytes, byteorder='big')
            
            # Then receive the actual data
            response_data = b''
            while len(response_data) < length:
                chunk = self.socket.recv(min(4096, length - len(response_data)))
                if not chunk:
                    break
                response_data += chunk
            
            # Decode and parse JSON
            response_text = response_data.decode('utf-8')
            return json.loads(response_text)
            
        except Exception as e:
            return {'success': False, 'error': f'Communication error: {str(e)}'}
    
    def display_response(self, response):
        """Display the server response"""
        if not response['success']:
            print(f"\n❌ Error: {response['error']}")
            return
        
        print(f"\n✅ Generated {len(response['menus'])} menu option(s)")
        print("=" * 60)
        
        for i, menu in enumerate(response['menus'], 1):
            print(f"\n📋 MENU OPTION #{i} (Score: {menu['score']:.3f})")
            print("-" * 40)
            
            for j, item in enumerate(menu['items'], 1):
                print(f"{j}. {item['name']} - {item['portion_grams']}g")
                print(f"   Category: {item['category']} → {item['subcategory']}")
                nutrition = item['nutrition']
                print(f"   {nutrition['calories']}cal, {nutrition['protein']}g protein, {nutrition['fat']}g fat")
            
            total = menu['total_nutrition']
            print(f"\n📊 TOTALS:")
            print(f"   Calories: {total['calories']}")
            print(f"   Protein: {total['protein']}g")
            print(f"   Carbs: {total['carbs']}g")
            print(f"   Fat: {total['fat']}g")
    
    def disconnect(self):
        """Disconnect from server"""
        if hasattr(self, 'socket'):
            self.socket.close()
            print("👋 Disconnected from server")
    
    def run(self):
        """Main client loop"""
        if not self.connect_to_server():
            return
        
        try:
            while True:
                try:
                    # Get user input
                    request_data = self.get_user_input()
                    
                    print("\n🔄 Sending request to server...")
                    
                    # Send request and get response
                    response = self.send_request(request_data)
                    
                    # Display response
                    self.display_response(response)
                    
                    # Ask for another request
                    another = input("\n🔄 Generate another menu? (y/n): ").strip().lower()
                    if another not in ['y', 'yes']:
                        break
                        
                except ValueError as e:
                    print(f"❌ Input error: {e}")
                except KeyboardInterrupt:
                    print("\n\n👋 Goodbye!")
                    break
                    
        finally:
            self.disconnect()

if __name__ == "__main__":
    client = MenuClient()
    client.run()