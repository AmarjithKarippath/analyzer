# Quick Start Guide - P&L Report API

Get up and running in 5 minutes!

## Step 1: Install Dependencies (1 minute)

```bash
pip install -r requirements.txt
```

## Step 2: Start the Server (1 minute)

```bash
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

## Step 3: Upload Your CSV File (1 minute)

Option A - Using Python:
```python
from client import PnLReportClient

client = PnLReportClient()
result = client.upload_csv('pnl_report_v2.csv')
print(result)
```

Option B - Using cURL:
```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@pnl_report_v2.csv"
```

## Step 4: Get Statistics (1 minute)

```python
from client import PnLReportClient

client = PnLReportClient()
client.upload_csv('pnl_report_v2.csv')
client.print_statistics()
```

Output:
```
============================================================
                P&L REPORT STATISTICS
============================================================

DAILY METRICS:
------------------------------------------------------------
Total Profitable Days:      145
Total Loss Days:            55
Total Traded Days:          200
Maximum Profit Per Day:     ₹ 15000.50
Maximum Loss Per Day:       ₹ -8500.25
Average Profit Per Day:     ₹ 2500.75
Average Loss Per Day:       ₹ -1200.30

TRADE METRICS:
------------------------------------------------------------
Total Trades:               5000
Min Trades Per Day:         5
Max Trades Per Day:         45
Average Trades Per Day:     25.00

SUMMARY:
------------------------------------------------------------
Total P&L:                  ₹ 312500.00
Win Rate:                   72.50%
Profit Factor:              3.45

============================================================
```

## Step 5: View Interactive API Docs (1 minute)

Open in your browser:
```
http://localhost:8000/docs
```

## What's Next?

### Check Out the APIs

```python
from client import PnLReportClient

client = PnLReportClient()
client.upload_csv('pnl_report_v2.csv')

# 1. Get daily P&L data
pivot = client.get_pivot_data()
print(f"Total days: {pivot['total_records']}")

# 2. Get distribution data
dist = client.get_distribution_data(bins=20)
print(f"Distribution bins: {len(dist['distribution'])}")

# 3. Get top days
top = client.get_top_days(top_n=10)
print(f"Best day: {top['top_profitable_days']['data'][0]}")

# 4. Get raw data
raw = client.get_raw_data(limit=50)
print(f"Raw records: {raw['returned_records']}")

# 5. Get summary
summary = client.get_summary()
print(f"Date range: {summary['date_range']}")
```

## Common Tasks

### Task 1: Export All Data to JSON

```python
import json
from client import PnLReportClient

client = PnLReportClient()
client.upload_csv('pnl_report_v2.csv')

# Collect all data
all_data = {
    'statistics': client.get_statistics(),
    'pivot_data': client.get_pivot_data(),
    'top_days': client.get_top_days(),
    'distribution': client.get_distribution_data(),
    'summary': client.get_summary()
}

# Save to file
with open('pnl_analysis.json', 'w') as f:
    json.dump(all_data, f, indent=2)

print("Data saved to pnl_analysis.json")
```

### Task 2: Create a Simple Report

```python
from client import PnLReportClient

client = PnLReportClient()
client.upload_csv('pnl_report_v2.csv')

stats = client.get_statistics()

report = f"""
P&L ANALYSIS REPORT
==================

Key Metrics:
- Total P&L: ₹ {stats['summary']['total_pnl']:.2f}
- Win Rate: {stats['summary']['win_rate_percentage']:.2f}%
- Profitable Days: {stats['daily_metrics']['profitable_days']}
- Loss Days: {stats['daily_metrics']['loss_days']}
- Best Day: ₹ {stats['daily_metrics']['max_profit_per_day']:.2f}
- Worst Day: ₹ {stats['daily_metrics']['max_loss_per_day']:.2f}

Trade Stats:
- Total Trades: {stats['trade_metrics']['total_trades']}
- Avg Trades/Day: {stats['trade_metrics']['average_trades_per_day']:.2f}
"""

print(report)

# Save to file
with open('pnl_report.txt', 'w') as f:
    f.write(report)
```

### Task 3: Visualize with Python

```python
import matplotlib.pyplot as plt
from client import PnLReportClient

client = PnLReportClient()
client.upload_csv('pnl_report_v2.csv')

# Get pivot data
pivot = client.get_pivot_data()

# Extract dates and values
dates = [d['date'] for d in pivot['data']]
pnl_values = [d['pnl_amount'] for d in pivot['data']]

# Create plot
plt.figure(figsize=(14, 6))
plt.plot(dates, pnl_values, marker='o', linestyle='-', linewidth=2)
plt.title('Daily P&L Over Time')
plt.xlabel('Date')
plt.ylabel('P&L Amount (₹)')
plt.xticks(rotation=45)
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('pnl_chart.png', dpi=150)
print("Chart saved to pnl_chart.png")
plt.show()
```

### Task 4: Get Insights

```python
from client import PnLReportClient

client = PnLReportClient()
client.upload_csv('pnl_report_v2.csv')

stats = client.get_statistics()
top_days = client.get_top_days(5)

# Analyze
print("\n=== QUICK INSIGHTS ===\n")

daily = stats['daily_metrics']
win_rate = stats['summary']['win_rate_percentage']

if win_rate > 60:
    print("✓ Good win rate! More wins than losses")
else:
    print("✗ Win rate below 60%. Focus on improving")

if daily['max_profit_per_day'] > abs(daily['max_loss_per_day']):
    print("✓ Your best days beat your worst days")
else:
    print("✗ Largest losses exceed largest gains")

best_day = top_days['top_profitable_days']['data'][0]
worst_day = top_days['top_loss_days']['data'][0]

print(f"\nBest: {best_day['date']} (+₹{best_day['pnl_amount']:.2f})")
print(f"Worst: {worst_day['date']} (₹{worst_day['pnl_amount']:.2f})")
```

## API Endpoints Summary

| Endpoint | Purpose |
|----------|---------|
| `POST /upload` | Upload CSV file |
| `GET /statistics` | Get all metrics |
| `GET /pivot-data` | Get daily P&L |
| `GET /distribution-data` | Get P&L distribution |
| `GET /top-days` | Get best/worst days |
| `GET /raw-data` | Get raw records |
| `GET /summary` | Get overview |
| `GET /health` | Check status |

## Troubleshooting

### Problem: "No data loaded"
**Solution:** Upload a CSV file first
```python
client.upload_csv('pnl_report_v2.csv')
```

### Problem: "Port 8000 already in use"
**Solution:** Use a different port
```bash
uvicorn main:app --port 8001
```

### Problem: "Column names not found"
**Solution:** Ensure CSV has these columns:
- `Buy Date` (format: DD MM YY)
- `P&L Amt (₹)` (numeric values)

### Problem: Date parsing error
**Solution:** Check date format in CSV. Should be: DD MM YY
```
01 01 24  # Jan 1, 2024
```

## Docker Quick Start

```bash
# Build
docker build -t pnl-api .

# Run
docker run -p 8000:8000 pnl-api

# Or use docker-compose
docker-compose up
```

## Next Steps

1. **Read Full Docs**: Check `README.md` for complete API reference
2. **Usage Examples**: See `USAGE_GUIDE.md` for more examples
3. **Advanced Features**: Check `ADVANCED_FEATURES.md` for extensions
4. **Customize**: Modify `main.py` to add custom metrics
5. **Deploy**: Use Docker or your preferred hosting

## Support

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health Check: http://localhost:8000/health

## Tips

💡 **Tip 1:** Use the Python client for easiest integration
```python
from client import PnLReportClient
client = PnLReportClient()
```

💡 **Tip 2:** Open Swagger UI for interactive testing
```
http://localhost:8000/docs
```

💡 **Tip 3:** Export data for visualization
```python
stats = client.get_statistics()
```

💡 **Tip 4:** Batch multiple requests efficiently
```python
stats = client.get_statistics()
pivot = client.get_pivot_data()
top = client.get_top_days()
```

---

**Happy analyzing!** 📊
