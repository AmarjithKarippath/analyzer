# P&L Report FastAPI Backend

A comprehensive FastAPI backend service for parsing and analyzing P&L (Profit and Loss) trading data. All print and plot data are served as JSON through separate, well-organized endpoints.

## Features

- **CSV File Upload**: Upload and process P&L CSV files
- **Statistics API**: Get all calculated metrics (profitable days, losses, averages, etc.)
- **Pivot Data API**: Get daily P&L aggregated data (for line plot visualization)
- **Distribution Data API**: Get histogram bin data showing P&L distribution
- **Top Days API**: Get top 5 profitable and loss-making days
- **Raw Data API**: Access raw dataframe records
- **Summary API**: Get overall file and data summary

## Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

## Running the Server

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

The API will be available at `http://localhost:8001`
Interactive API docs at `http://localhost:8001/docs`

## API Endpoints

### 1. **POST /upload**
Upload and process a CSV file.

**Request:**
```bash
curl -X POST "http://localhost:8001/upload" \
  -H "accept: application/json" \
  -F "file=@pnl_report_v2.csv"
```

**Response:**
```json
{
  "status": "success",
  "message": "File 'pnl_report_v2.csv' uploaded and processed successfully",
  "rows_loaded": 1000,
  "date_range": {
    "start": "2024-01-01T00:00:00",
    "end": "2024-12-31T00:00:00"
  }
}
```

---

### 2. **GET /statistics**
Get all calculated P&L statistics (all print data from the original script).

**Request:**
```bash
curl -X GET "http://localhost:8001/statistics" \
  -H "accept: application/json"
```

**Response:**
```json
{
  "daily_metrics": {
    "profitable_days": 145,
    "loss_days": 55,
    "total_traded_days": 200,
    "max_profit_per_day": 15000.50,
    "max_loss_per_day": -8500.25,
    "average_profit_per_day": 2500.75,
    "average_loss_per_day": -1200.30
  },
  "trade_metrics": {
    "total_trades": 5000,
    "min_trades_per_day": 5,
    "max_trades_per_day": 45,
    "average_trades_per_day": 25.00
  },
  "summary": {
    "total_pnl": 312500.00,
    "win_rate_percentage": 72.50,
    "profit_factor": 3.45
  }
}
```

---

### 3. **GET /pivot-data**
Get daily P&L pivot table data (for line plot visualization).

**Request:**
```bash
curl -X GET "http://localhost:8001/pivot-data" \
  -H "accept: application/json"
```

**Response:**
```json
{
  "total_records": 200,
  "data": [
    {
      "date": "2024-01-01",
      "pnl_amount": 2500.50
    },
    {
      "date": "2024-01-02",
      "pnl_amount": -1200.75
    },
    {
      "date": "2024-01-03",
      "pnl_amount": 3600.25
    }
  ]
}
```

---

### 4. **GET /distribution-data**
Get histogram distribution data showing P&L amount frequency distribution.

**Request:**
```bash
curl -X GET "http://localhost:8001/distribution-data?bins=20" \
  -H "accept: application/json"
```

**Response:**
```json
{
  "total_records": 200,
  "bins": 20,
  "distribution": [
    {
      "bin": "-8500.00 to -7000.00",
      "bin_start": -8500.00,
      "bin_end": -7000.00,
      "frequency": 2
    },
    {
      "bin": "-7000.00 to -5500.00",
      "bin_start": -7000.00,
      "bin_end": -5500.00,
      "frequency": 5
    },
    {
      "bin": "13500.00 to 15000.50",
      "bin_start": 13500.00,
      "bin_end": 15000.50,
      "frequency": 3
    }
  ]
}
```

---

### 5. **GET /top-days**
Get top profitable and loss-making days.

**Request:**
```bash
curl -X GET "http://localhost:8001/top-days?top_n=5" \
  -H "accept: application/json"
```

**Response:**
```json
{
  "top_profitable_days": {
    "count": 5,
    "data": [
      {
        "date": "2024-06-15",
        "pnl_amount": 15000.50
      },
      {
        "date": "2024-05-20",
        "pnl_amount": 14200.75
      },
      {
        "date": "2024-07-10",
        "pnl_amount": 13800.00
      },
      {
        "date": "2024-04-05",
        "pnl_amount": 12500.25
      },
      {
        "date": "2024-08-12",
        "pnl_amount": 11800.00
      }
    ]
  },
  "top_loss_days": {
    "count": 5,
    "data": [
      {
        "date": "2024-03-01",
        "pnl_amount": -8500.25
      },
      {
        "date": "2024-02-15",
        "pnl_amount": -7200.50
      },
      {
        "date": "2024-09-10",
        "pnl_amount": -6500.75
      },
      {
        "date": "2024-10-20",
        "pnl_amount": -5800.00
      },
      {
        "date": "2024-11-05",
        "pnl_amount": -4500.25
      }
    ]
  }
}
```

---

### 6. **GET /raw-data**
Get raw dataframe records (first N rows).

**Request:**
```bash
curl -X GET "http://localhost:8001/raw-data?limit=10" \
  -H "accept: application/json"
```

**Response:**
```json
{
  "total_records": 1000,
  "returned_records": 10,
  "data": [
    {
      "Buy Date": "2024-01-01",
      "P&L Amt (₹)": 500.50,
      "... other columns": "..."
    }
  ]
}
```

---

### 7. **GET /summary**
Get overall summary and metadata about loaded data.

**Request:**
```bash
curl -X GET "http://localhost:8001/summary" \
  -H "accept: application/json"
```

**Response:**
```json
{
  "file_status": "loaded",
  "total_records": 1000,
  "total_days": 200,
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-12-31"
  },
  "columns": ["Buy Date", "P&L Amt (₹)", "..."],
  "available_endpoints": [
    "/upload",
    "/statistics",
    "/pivot-data",
    "/distribution-data",
    "/top-days",
    "/raw-data",
    "/summary"
  ]
}
```

---

### 8. **GET /health**
Health check endpoint.

**Request:**
```bash
curl -X GET "http://localhost:8001/health" \
  -H "accept: application/json"
```

**Response:**
```json
{
  "status": "healthy",
  "data_loaded": true
}
```

---

## Usage Example (Python Client)

```python
import requests
import json

BASE_URL = "http://localhost:8001"

# 1. Upload CSV file
with open('pnl_report_v2.csv', 'rb') as f:
    files = {'file': f}
    response = requests.post(f"{BASE_URL}/upload", files=files)
    print("Upload Status:", response.json())

# 2. Get statistics
response = requests.get(f"{BASE_URL}/statistics")
stats = response.json()
print(f"Profitable Days: {stats['daily_metrics']['profitable_days']}")
print(f"Total P&L: {stats['summary']['total_pnl']}")

# 3. Get pivot data for visualization
response = requests.get(f"{BASE_URL}/pivot-data")
pivot_data = response.json()
print(f"Total Days: {pivot_data['total_records']}")

# 4. Get distribution data
response = requests.get(f"{BASE_URL}/distribution-data?bins=20")
distribution = response.json()
print(f"Distribution bins: {distribution['bins']}")

# 5. Get top days
response = requests.get(f"{BASE_URL}/top-days?top_n=5")
top_days = response.json()
print("Top Profitable Day:", top_days['top_profitable_days']['data'][0])

# 6. Get raw data
response = requests.get(f"{BASE_URL}/raw-data?limit=100")
raw_data = response.json()
print(f"Raw records returned: {raw_data['returned_records']}")
```

## CSV Format Requirements

The uploaded CSV file should have at minimum:
- `Buy Date` column (format: DD MM YY or similar parseable format)
- `P&L Amt (₹)` column (numeric values)

Example CSV structure:
```
Buy Date,Ticker,Quantity,P&L Amt (₹),Other Columns...
01 01 24,INFY,100,500.50,...
02 01 24,TCS,50,-200.25,...
```

## Notes

- File upload is required before accessing statistics and data endpoints
- Data is stored in memory during the session
- For production use, consider adding database persistence
- All monetary values are rounded to 2 decimal places in responses
- Dates are returned in ISO format (YYYY-MM-DD)

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200 OK` - Successful request
- `400 Bad Request` - Invalid input or file format
- `500 Internal Server Error` - Server error

Error responses include detailed messages:
```json
{
  "detail": "Error message describing what went wrong"
}
```

## Future Enhancements

- Database persistence
- Multiple file support
- Data caching
- Advanced filtering options
- Export to various formats (CSV, Excel, PDF)
- Real-time data updates via WebSocket
