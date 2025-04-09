import requests
import pandas as pd
import time
import hmac
import hashlib
from urllib.parse import urlencode

api_key = 'nXzkkaX3W978Ie0N6oXzyMNA6a7GG01cGSdL9T2SztYONzSzevpcCmsNGMhqBM5A'
api_secret = 'NmFmmkcCNtARYzvJlDEHoFzX7BFFSY83RkkBnN8eu1HwXIivzafTiKVszHMMFogT'
base_url = 'https://api.binance.com'

def get_account_snapshot(type, startTime, endTime, limit=7):
    endpoint = '/sapi/v1/accountSnapshot'
    timestamp = int(time.time() * 1000)

    params = {
        'type': type,
        'startTime': startTime,
        'endTime': endTime,
        'limit': limit,
        'timestamp': timestamp
    }

    query_string = urlencode(params)
    signature = hmac.new(api_secret.encode(), query_string.encode(), hashlib.sha256).hexdigest()

    headers = {
        'X-MBX-APIKEY': api_key
    }

    url = f"{base_url}{endpoint}?{query_string}&signature={signature}"

    response = requests.get(url, headers=headers)

    return response.json()

# Define the time window
start_time = int(pd.Timestamp('2025-03-20 12:00:00', tz='UTC').timestamp() * 1000)
end_time = int(pd.Timestamp('2025-03-20 12:05:00', tz='UTC').timestamp() * 1000)

snapshot = get_account_snapshot('FUTURES', start_time, end_time)

# Check if the snapshot contains data
if snapshot['code'] == 200 and snapshot['snapshotVos']:
    assets = snapshot['snapshotVos'][0]['data']['assets']
    df_assets = pd.DataFrame(assets)
    df_assets.to_csv('futures_account_snapshot_20Mar2025.csv', index=False)
    print("Exported successfully to futures_account_snapshot_20Mar2025.csv")
else:
    print("Error fetching snapshot or no data available:", snapshot)
