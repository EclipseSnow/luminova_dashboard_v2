import requests
import time
from datetime import datetime, timedelta
import hmac
import hashlib
import os
from dotenv import load_dotenv
import pandas as pd

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

def get_futures_account_snapshot(days=7):
    endpoint = '/sapi/v1/accountSnapshot'
    
    # Calculate time range
    end_time = int(time.time() * 1000)
    start_time = end_time - (days * 24 * 60 * 60 * 1000)
    
    # Build query parameters
    params = {
        'type': 'FUTURES',
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
            all_assets = []
            all_positions = []
            
            for snapshot in data['snapshotVos']:
                date = datetime.fromtimestamp(snapshot['updateTime']/1000)
                date_str = date.strftime('%Y-%m-%d')
                
                # Process assets
                for asset in snapshot['data']['assets']:
                    all_assets.append({
                        'Date': date_str,
                        'Asset': asset['asset'],
                        'Wallet Balance': float(asset['walletBalance']),
                        'Margin Balance': float(asset['marginBalance'])
                    })
                
                # Process positions
                for position in snapshot['data']['position']:
                    all_positions.append({
                        'Date': date_str,
                        'Symbol': position['symbol'],
                        'Position Amount': float(position.get('positionAmount', 0)),
                        'Entry Price': float(position.get('entryPrice', 0)),
                        'Mark Price': float(position.get('markPrice', 0)),
                        'Unrealized Profit': float(position.get('unRealizedProfit', 0))
                    })
            
            # Convert to DataFrames
            assets_df = pd.DataFrame(all_assets)
            positions_df = pd.DataFrame(all_positions)
            
            return assets_df, positions_df
        else:
            print(f"Error: {data['msg']}")
            return None, None
    else:
        print(f"Request failed with status code: {response.status_code}")
        return None, None

if __name__ == "__main__":
    assets_df, positions_df = get_futures_account_snapshot()
    print("Assets DataFrame:")
    print(assets_df)
    print("\nPositions DataFrame:")
    print(positions_df)
