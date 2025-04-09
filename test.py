import requests
import time
from datetime import datetime, timedelta
import hmac
import hashlib
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_KEY = os.getenv('BINANCE_API_KEY')
API_SECRET = os.getenv('BINANCE_API_SECRET')
BASE_URL = 'https://api.binance.com'

def get_signature(query_string):
    return hmac.new(
        API_SECRET.encode('utf-8'),
        query_string.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

def get_account_snapshot(days=7):
    endpoint = '/sapi/v1/accountSnapshot'
    
    # Calculate time range
    end_time = int(time.time() * 1000)  # current time in milliseconds
    start_time = end_time - (days * 24 * 60 * 60 * 1000)  # subtract days in milliseconds
    
    # Build query parameters
    params = {
        'type': 'SPOT',
        'startTime': start_time,
        'endTime': end_time,
        'timestamp': end_time
    }
    
    # Create query string
    query_string = '&'.join([f'{key}={params[key]}' for key in params])
    
    # Get signature
    signature = get_signature(query_string)
    
    # Add signature to parameters
    params['signature'] = signature
    
    # Set up headers
    headers = {
        'X-MBX-APIKEY': API_KEY
    }
    
    # Make request
    response = requests.get(
        f'{BASE_URL}{endpoint}',
        params=params,
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        if data['code'] == 200:
            # Process and print each day's snapshot
            for snapshot in data['snapshotVos']:
                date = datetime.fromtimestamp(snapshot['updateTime']/1000)
                balances = snapshot['data']['balances']
                total_btc = snapshot['data']['totalAssetOfBtc']
                
                print(f"\nDate: {date.strftime('%Y-%m-%d')}")
                print(f"Total Assets (BTC): {total_btc}")
                print("Balances:")
                for balance in balances:
                    if float(balance['free']) > 0 or float(balance['locked']) > 0:
                        print(f"  {balance['asset']}: Free={balance['free']}, Locked={balance['locked']}")
        else:
            print(f"Error: {data['msg']}")
    else:
        print(f"Request failed with status code: {response.status_code}")

if __name__ == "__main__":
    get_account_snapshot()
