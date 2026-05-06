# P&L Report API - Complete Usage Guide

## Quick Start

### 1. Installation & Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

The API will be available at `http://localhost:8001`

### 2. Interactive API Documentation

Open your browser and go to:
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

## Using the API

### Method 1: Python Client (Recommended)

The easiest way to interact with the API:

```python
from client import PnLReportClient

# Initialize client
client = PnLReportClient()

# Upload CSV
result = client.upload_csv('pnl_report_v2.csv')
print(f"Uploaded: {result['message']}")

# Get statistics
stats = client.get_statistics()
print(f"Total P&L: ₹{stats['summary']['total_pnl']}")
print(f"Win Rate: {stats['summary']['win_rate_percentage']}%")

# Get top days
top = client.get_top_days(top_n=10)
print("Top profitable day:", top['top_profitable_days']['data'][0])

# Print formatted report
client.print_statistics()
client.print_top_days(top_n=5)
```

### Method 2: cURL (Command Line)

```bash
# Upload a CSV file
curl -X POST http://localhost:8001/upload \
  -H "accept: application/json" \
  -F "file=@pnl_report_v2.csv"

# Get statistics
curl -X GET http://localhost:8001/statistics

# Get pivot data
curl -X GET http://localhost:8001/pivot-data

# Get distribution
curl -X GET "http://localhost:8001/distribution-data?bins=30"

# Get top days
curl -X GET "http://localhost:8001/top-days?top_n=10"

# Get summary
curl -X GET http://localhost:8001/summary

# Health check
curl -X GET http://localhost:8001/health
```

### Method 3: JavaScript/Node.js

```javascript
const BASE_URL = 'http://localhost:8001';

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (data) options.body = JSON.stringify(data);
  
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  return response.json();
}

// Upload CSV
async function uploadCSV(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData
  });
  return response.json();
}

// Get statistics
const stats = await apiCall('/statistics');
console.log('Profitable Days:', stats.daily_metrics.profitable_days);
console.log('Total P&L:', stats.summary.total_pnl);

// Get pivot data
const pivotData = await apiCall('/pivot-data');
console.log('Daily P&L:', pivotData.data);

// Visualize with Chart.js
const ctx = document.getElementById('pnlChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: pivotData.data.map(d => d.date),
    datasets: [{
      label: 'Daily P&L',
      data: pivotData.data.map(d => d.pnl_amount),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  }
});
```

### Method 4: Python with Requests

```python
import requests
import pandas as pd

BASE_URL = 'http://localhost:8001'

# Upload file
with open('pnl_report_v2.csv', 'rb') as f:
    files = {'file': f}
    response = requests.post(f'{BASE_URL}/upload', files=files)
    print(response.json())

# Get all statistics
response = requests.get(f'{BASE_URL}/statistics')
stats = response.json()

# Create a nice display
print("\n" + "="*50)
print("P&L ANALYSIS REPORT")
print("="*50)
print(f"\nDays:")
print(f"  Profitable: {stats['daily_metrics']['profitable_days']}")
print(f"  Loss Days: {stats['daily_metrics']['loss_days']}")
print(f"  Total: {stats['daily_metrics']['total_traded_days']}")

print(f"\nP&L:")
print(f"  Total: ₹ {stats['summary']['total_pnl']:.2f}")
print(f"  Max Profit: ₹ {stats['daily_metrics']['max_profit_per_day']:.2f}")
print(f"  Max Loss: ₹ {stats['daily_metrics']['max_loss_per_day']:.2f}")
print(f"  Win Rate: {stats['summary']['win_rate_percentage']:.2f}%")

print(f"\nTrades:")
print(f"  Total: {stats['trade_metrics']['total_trades']}")
print(f"  Avg per day: {stats['trade_metrics']['average_trades_per_day']:.2f}")

# Get pivot data and create DataFrame
response = requests.get(f'{BASE_URL}/pivot-data')
pivot_data = response.json()['data']
df = pd.DataFrame(pivot_data)
df['date'] = pd.to_datetime(df['date'])
print(f"\nDaily P&L Summary:\n{df.head()}")

# Get distribution
response = requests.get(f'{BASE_URL}/distribution-data?bins=20')
dist = response.json()
print(f"\nP&L Distribution ({dist['bins']} bins):")
for bin_data in dist['distribution'][:5]:
    print(f"  {bin_data['bin']}: {bin_data['frequency']} days")
```

## Common Use Cases

### Use Case 1: Get Daily Performance Summary

```python
from client import PnLReportClient

client = PnLReportClient()

# Upload file
client.upload_csv('pnl_report_v2.csv')

# Get statistics
stats = client.get_statistics()

# Display summary
daily = stats['daily_metrics']
print(f"""
Daily Performance Summary:
- Profitable Days: {daily['profitable_days']}
- Loss Days: {daily['loss_days']}
- Best Day: ₹ {daily['max_profit_per_day']:.2f}
- Worst Day: ₹ {daily['max_loss_per_day']:.2f}
""")
```

### Use Case 2: Analyze Best and Worst Trading Days

```python
from client import PnLReportClient

client = PnLReportClient()
client.upload_csv('pnl_report_v2.csv')

# Get top performing days
top_days = client.get_top_days(top_n=10)

print("Top 10 Best Trading Days:")
for i, day in enumerate(top_days['top_profitable_days']['data'], 1):
    print(f"{i}. {day['date']}: ₹ {day['pnl_amount']:.2f}")

print("\nTop 10 Worst Trading Days:")
for i, day in enumerate(top_days['top_loss_days']['data'], 1):
    print(f"{i}. {day['date']}: ₹ {day['pnl_amount']:.2f}")
```

### Use Case 3: Export Data for Further Analysis

```python
import json
from client import PnLReportClient

client = PnLReportClient()
client.upload_csv('pnl_report_v2.csv')

# Get all data
statistics = client.get_statistics()
pivot_data = client.get_pivot_data()
distribution = client.get_distribution_data()
top_days = client.get_top_days()

# Create comprehensive report
report = {
    'statistics': statistics,
    'daily_pnl': pivot_data['data'],
    'distribution': distribution['distribution'],
    'top_days': top_days
}

# Save to JSON
with open('pnl_report.json', 'w') as f:
    json.dump(report, f, indent=2)

print("Report saved to pnl_report.json")
```

### Use Case 4: Real-time Monitoring Dashboard

```python
from client import PnLReportClient
import time

client = PnLReportClient()

def monitor_pnl():
    """Monitor P&L in real-time"""
    client.upload_csv('pnl_report_v2.csv')
    
    while True:
        try:
            # Get current statistics
            stats = client.get_statistics()
            
            # Display current status
            print(f"\n[{time.strftime('%H:%M:%S')}] P&L Status:")
            print(f"  Total P&L: ₹ {stats['summary']['total_pnl']:.2f}")
            print(f"  Win Rate: {stats['summary']['win_rate_percentage']:.2f}%")
            print(f"  Profitable Days: {stats['daily_metrics']['profitable_days']}")
            
            # Wait before next check
            time.sleep(60)
            
        except Exception as e:
            print(f"Error: {e}")
            break

# Run monitoring
monitor_pnl()
```

### Use Case 5: Generate HTML Report

```python
from client import PnLReportClient

client = PnLReportClient()
client.upload_csv('pnl_report_v2.csv')

stats = client.get_statistics()
top_days = client.get_top_days(5)
summary = client.get_summary()

html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>P&L Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .metric {{ display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ccc; }}
        table {{ border-collapse: collapse; width: 100%; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
    </style>
</head>
<body>
    <h1>P&L Analysis Report</h1>
    
    <h2>Summary</h2>
    <p>Data Range: {summary['date_range']['start']} to {summary['date_range']['end']}</p>
    <p>Total Records: {summary['total_records']}</p>
    <p>Trading Days: {summary['total_days']}</p>
    
    <h2>Key Metrics</h2>
    <div class="metric">
        <strong>Total P&L:</strong><br>₹ {stats['summary']['total_pnl']:.2f}
    </div>
    <div class="metric">
        <strong>Win Rate:</strong><br>{stats['summary']['win_rate_percentage']:.2f}%
    </div>
    <div class="metric">
        <strong>Profitable Days:</strong><br>{stats['daily_metrics']['profitable_days']}
    </div>
    
    <h2>Top 5 Best Days</h2>
    <table>
        <tr><th>Date</th><th>P&L Amount</th></tr>
        {''.join(f"<tr><td>{day['date']}</td><td>₹ {day['pnl_amount']:.2f}</td></tr>" 
                 for day in top_days['top_profitable_days']['data'])}
    </table>
    
    <h2>Top 5 Worst Days</h2>
    <table>
        <tr><th>Date</th><th>P&L Amount</th></tr>
        {''.join(f"<tr><td>{day['date']}</td><td>₹ {day['pnl_amount']:.2f}</td></tr>" 
                 for day in top_days['top_loss_days']['data'])}
    </table>
</body>
</html>
"""

with open('pnl_report.html', 'w') as f:
    f.write(html)

print("HTML report generated: pnl_report.html")
```

## Docker Usage

### Build and Run with Docker

```bash
# Build the image
docker build -t pnl-api .

# Run the container
docker run -p 8001:8001 pnl-api

# Or use docker-compose
docker-compose up -d
```

### Access from Docker Container

If running other services in Docker:

```bash
# Docker service name is 'pnl-api'
curl http://pnl-api:8001/health
```

## Performance Tips

1. **Batch Operations**: Request multiple data types at once
2. **Caching**: Results are cached in memory for the session
3. **Limit Query Results**: Use `limit` parameter for raw data queries
4. **Bins Parameter**: Adjust `bins` in distribution queries (10-50 recommended)

## Troubleshooting

### Port Already in Use

```bash
# Use a different port
uvicorn main:app --port 8001
```

### File Upload Errors

- Ensure CSV has correct column names: `Buy Date` and `P&L Amt (₹)`
- Check date format: Should be parseable by pandas (DD MM YY recommended)
- Verify file encoding is UTF-8

### API Not Responding

```bash
# Check health
curl http://localhost:8001/health

# Check if file is loaded
curl http://localhost:8001/summary
```

### Memory Issues with Large Files

- Process data in batches
- Consider implementing database persistence
- Use pagination for data retrieval

## API Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (e.g., no file loaded) |
| 404 | Endpoint not found |
| 500 | Server error |

## Next Steps

1. Deploy to production (see Production Deployment section)
2. Add database persistence
3. Implement caching layer
4. Add WebSocket for real-time updates
5. Create frontend dashboard

## Support & Issues

For issues or feature requests, check the main README.md file.
