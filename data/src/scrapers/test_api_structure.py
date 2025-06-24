import requests
import json

def test_api_structure(item_code="7290000408316"):  # User provided barcode
    """
    Test API call to see the actual structure of Rami Levy response
    """
    url = "https://www.rami-levy.co.il/api/items"
    
    payload = {
        "ids": item_code,
        "type": "barcode"
    }
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Referer': f'https://www.rami-levy.co.il/he?item={item_code}'
    }
    
    try:
        print(f"Making API call for item: {item_code}")
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        print("=" * 80)
        print("FULL API RESPONSE STRUCTURE:")
        print("=" * 80)
        print(data)
        
        return data
        
    except Exception as e:
        print(f"Error making API call: {e}")
        return None

if __name__ == "__main__":
    # Test with the specific item code provided by user
    result = test_api_structure("7290000408316")
    if result:
        print(f"\n✅ Successfully got data for 7290000408316")
    else:
        print(f"❌ Failed to get data for 7290000408316")
    
    print("\n" + "=" * 80)
    print("Analysis complete! Use this structure info to update NutData.py")
    print("=" * 80) 