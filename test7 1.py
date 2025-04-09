import requests
import hmac
import hashlib
import datetime
import csv
from scipy.stats import norm
import pandas as pd
import numpy as np
from datetime import datetime
# Binance API 配置
API_KEY = "nXzkkaX3W978Ie0N6oXzyMNA6a7GG01cGSdL9T2SztYONzSzevpcCmsNGMhqBM5A"
SECRET_KEY = "NmFmmkcCNtARYzvJlDEHoFzX7BFFSY83RkkBnN8eu1HwXIivzafTiKVszHMMFogT"
BASE_URL = "https://api.binance.com"
FUTURES_URL = "https://fapi.binance.com"  # 期货 API 需要单独的 URL
HISTORY_FILE = "net_worth_history.csv"
def create_signature(query_string: str) -> str:
   """使用 SECRET_KEY 生成 HMAC SHA256 签名"""
   return hmac.new(
       SECRET_KEY.encode("utf-8"),
       query_string.encode("utf-8"),
       hashlib.sha256
   ).hexdigest()
def get_server_time():
   """获取 Binance 服务器时间（毫秒）"""
   url = f"{BASE_URL}/api/v3/time"
   response = requests.get(url)
   data = response.json()
   return data["serverTime"]
def get_asset_price(symbol):
   """获取指定交易对的最新市场价格"""
   url = f"{BASE_URL}/api/v3/ticker/price?symbol={symbol}"
   response = requests.get(url)
   data = response.json()
   if "price" in data:
       return float(data["price"])
   else:
       print(f"⚠️ 获取 {symbol} 价格失败:", data)
       return 0
def get_total_net_worth():
   """获取 Binance 账户的每日总净值（期货 + 现货 + 理财）"""
   timestamp = get_server_time()
   params = f"timestamp={timestamp}"
   signature = create_signature(params)
   # 获取期货账户净值
   futures_url = f"{FUTURES_URL}/fapi/v2/account?{params}&signature={signature}"
   headers = {"X-MBX-APIKEY": API_KEY}
   futures_response = requests.get(futures_url, headers=headers)
   futures_data = futures_response.json()
   if futures_response.status_code != 200:
       print(f"❌ 获取期货账户净值失败: {futures_data}")
       return None
   futures_net_worth = float(futures_data["totalWalletBalance"])  # 期货账户权益
   # 获取现货账户和理财账户净值
   spot_url = f"{BASE_URL}/api/v3/account?{params}&signature={signature}"
   spot_response = requests.get(spot_url, headers=headers)
   spot_data = spot_response.json()
   if "balances" not in spot_data:
       print(f"❌ 获取现货账户净值失败: {spot_data}")
       return None
   # **合并 LD 资产到现货资产（临时实验，后续删除）**
   spot_net_worth = {}
   for asset in spot_data["balances"]:
       asset_name = asset["asset"]
       total_amount = float(asset["free"]) + float(asset["locked"])
       if total_amount > 0:
           if asset_name.startswith("LD"):  # **合并 LD 资产**
               real_asset = asset_name[2:]
               spot_net_worth[real_asset] = spot_net_worth.get(real_asset, 0) + total_amount
           else:
               spot_net_worth[asset_name] = spot_net_worth.get(asset_name, 0) + total_amount
   # 计算总 USDT 计价净值
   spot_net_worth_usdt = 0
   for asset, amount in spot_net_worth.items():
       if asset == "USDT":
           spot_net_worth_usdt += amount
       else:
           price = get_asset_price(asset + "USDT")
           spot_net_worth_usdt += amount * price
   total_net_worth = spot_net_worth_usdt + futures_net_worth
   print(f"✅ 计算出的总净值: {total_net_worth:.2f} USDT (现货+理财: {spot_net_worth_usdt:.2f} USDT, 期货: {futures_net_worth:.2f} USDT)")
   return total_net_worth
def save_net_worth_to_csv(net_worth):
   """将每日净值保存到 CSV 文件"""
   date = datetime.now().strftime("%Y-%m-%d")
   with open(HISTORY_FILE, "a", newline="") as f:
       writer = csv.writer(f)
       writer.writerow([date, net_worth])
   print(f"✅ 已存储 {date} 的净值数据: {net_worth:.2f} USDT")


def load_net_worth_history():
    """加载历史净值数据"""
    try:
        df = pd.read_csv(HISTORY_FILE, names=["Date", "NetWorth"])
        df["Date"] = pd.to_datetime(df["Date"])
        df["NetWorth"] = df["NetWorth"].astype(float)
        return df
    except FileNotFoundError:
        print("❌ 历史数据文件不存在，无法计算风控指标！")
        return None


def calculate_parametric_var(df, confidence_levels=[0.95, 0.99]):
   """计算方差-协方差方法的 VaR 和 ES"""
   df["Return"] = df["NetWorth"].pct_change()
   mean_return = df["Return"].mean()
   std_dev = df["Return"].std()
   var_results = {}
   es_results = {}
   for confidence in confidence_levels:
       z_score = norm.ppf(1 - confidence)
       var = mean_return + z_score * std_dev
       es = mean_return - (norm.pdf(z_score) / (1 - confidence)) * std_dev
       var_results[confidence] = var
       es_results[confidence] = es
       print(f"📉 VaR ({confidence*100}%): {var:.4f}")
       print(f"📉 ES ({confidence*100}%): {es:.4f}")
   return var_results, es_results


def calculate_max_drawdown(df):
    """计算最大回撤（Maximum Drawdown）"""
    df["Peak"] = df["NetWorth"].cummax()
    df["Drawdown"] = df["NetWorth"] / df["Peak"] - 1
    max_drawdown = df["Drawdown"].min()
    print(f"📉 最大回撤: {max_drawdown:.4f}")
    return max_drawdown


def calculate_sharpe_ratio(df, risk_free_rate=0.02):
    """计算夏普比率"""
    df["Return"] = df["NetWorth"].pct_change()
    excess_return = df["Return"].mean() - risk_free_rate / 365
    sharpe_ratio = excess_return / df["Return"].std()
    print(f"📈 夏普比率: {sharpe_ratio:.4f}")
    return sharpe_ratio

def calculate_sortino_ratio(df, target_return=0.02):
   # 1. 只筛选负收益率来计算下行风险（负收益的标准差）
   downside_risk = df.loc[df["Return"] < 0, "Return"].std()
   # 2. 若下行风险为空、NaN 或为 0，设置一个极小值防止除零错误
   if downside_risk is None or np.isnan(downside_risk) or downside_risk == 0:
       downside_risk = 0.0001  # 设定一个极小值防止除零错误
   # 计算平均收益率（或超额收益率），默认 target_return=0 表示无风险收益为0
   expected_return = df["Return"].mean()
   # 计算索提诺比率
   sortino_ratio = (expected_return - target_return) / downside_risk
   print(f"📈 索提诺比率: {sortino_ratio:.4f}")
   return sortino_ratio


def calculate_calmar_ratio(df):
   """计算卡玛比率（Calmar Ratio）"""
   return_rate = calculate_return_rate(df)
   max_drawdown = calculate_max_drawdown(df)
   calmar_ratio = return_rate / abs(max_drawdown) if max_drawdown != 0 else np.nan
   print(f"📈 卡玛比率: {calmar_ratio:.4f}")
   return calmar_ratio


def calculate_return_rate(df):
    """计算账户总回报率"""
    initial_value = df["NetWorth"].iloc[0]
    final_value = df["NetWorth"].iloc[-1]
    return_rate = (final_value - initial_value) / initial_value
    print(f"📈 总回报率: {return_rate:.4f}")
    return return_rate


def calculate_daily_return(df):
    """计算每日回报率变动"""
    df["DailyReturn"] = df["NetWorth"].pct_change()
    print("📊 每日回报率变动:")
    print(df[["Date", "DailyReturn"]].dropna())
    return df["DailyReturn"]


def run_risk_analysis():
    df = load_net_worth_history()
    if df is None:
        return
    calculate_parametric_var(df)
    calculate_max_drawdown(df)
    calculate_sharpe_ratio(df)
    calculate_sortino_ratio(df)
    calculate_calmar_ratio(df)
    calculate_return_rate(df)
    calculate_daily_return(df)


if __name__ == "__main__":
    total_net_worth = get_total_net_worth()
    if total_net_worth is not None:
        save_net_worth_to_csv(total_net_worth)
    run_risk_analysis()
