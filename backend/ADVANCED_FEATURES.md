# Advanced Features & Extensions

This document covers advanced usage, customization, and extension options for the P&L Report API.

## 1. Custom Data Processing

### Extending the API with Custom Metrics

```python
# In main.py, add custom calculation functions

def calculate_risk_metrics(pivot_df):
    """Calculate advanced risk metrics"""
    returns = pivot_df['P&L Amt (₹)'].pct_change().dropna()
    
    sharpe_ratio = returns.mean() / returns.std() * np.sqrt(252)
    max_drawdown = (pivot_df['P&L Amt (₹)'].cumsum().expanding().max() 
                   - pivot_df['P&L Amt (₹)'].cumsum()).max()
    
    return {
        'sharpe_ratio': float(sharpe_ratio),
        'max_drawdown': float(max_drawdown),
        'volatility': float(returns.std() * np.sqrt(252))
    }

@app.get("/risk-metrics")
async def get_risk_metrics():
    """Get advanced risk metrics"""
    if not processed_data["file_loaded"]:
        raise HTTPException(status_code=400, detail="No data loaded")
    
    pivot_df = processed_data["pivot_df"]
    metrics = calculate_risk_metrics(pivot_df)
    return metrics
```

### Custom Filtering and Aggregation

```python
@app.get("/statistics-by-weekday")
async def get_statistics_by_weekday():
    """Get statistics broken down by day of week"""
    if not processed_data["file_loaded"]:
        raise HTTPException(status_code=400, detail="No data loaded")
    
    pivot_df = processed_data["pivot_df"]
    pivot_df['weekday'] = pivot_df.index.day_name()
    
    stats_by_weekday = {}
    for weekday in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']:
        weekday_data = pivot_df[pivot_df['weekday'] == weekday]['P&L Amt (₹)']
        
        stats_by_weekday[weekday] = {
            'count': len(weekday_data),
            'profitable': int((weekday_data > 0).sum()),
            'loss': int((weekday_data < 0).sum()),
            'avg_pnl': float(weekday_data.mean()),
            'max_pnl': float(weekday_data.max()),
            'min_pnl': float(weekday_data.min())
        }
    
    return {'by_weekday': stats_by_weekday}
```

## 2. Real-time Data Processing

### WebSocket Support for Live Updates

```python
from fastapi import WebSocket
import asyncio

@app.websocket("/ws/statistics")
async def websocket_statistics(websocket: WebSocket):
    """WebSocket endpoint for real-time statistics"""
    await websocket.accept()
    
    try:
        while True:
            if processed_data["file_loaded"]:
                stats = get_statistics_data()
                await websocket.send_json(stats)
            
            await asyncio.sleep(5)  # Update every 5 seconds
    except Exception as e:
        await websocket.close(code=1000)
```

### JavaScript Client for WebSocket

```javascript
// Real-time statistics updates
const socket = new WebSocket('ws://localhost:8000/ws/statistics');

socket.onmessage = (event) => {
    const stats = JSON.parse(event.data);
    updateDashboard(stats);
};

socket.onerror = (error) => {
    console.error('WebSocket error:', error);
};
```

## 3. Database Integration

### SQLAlchemy Setup for Persistence

```python
from sqlalchemy import create_engine, Column, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Database setup
DATABASE_URL = "sqlite:///./pnl_data.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Define models
class DailyPnL(Base):
    __tablename__ = "daily_pnl"
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, unique=True)
    pnl_amount = Column(Float)
    trades = Column(Integer)
    profitable_trades = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# Save data to database
def save_to_database(pivot_df):
    """Persist pivot data to database"""
    db = SessionLocal()
    
    for date, pnl in pivot_df['P&L Amt (₹)'].items():
        db_record = DailyPnL(date=date, pnl_amount=pnl)
        db.merge(db_record)
    
    db.commit()
    db.close()
```

## 4. Advanced Visualization Support

### Return Data Optimized for Chart Libraries

```python
@app.get("/chart-data/candlestick")
async def get_candlestick_data():
    """Get data formatted for candlestick charts"""
    if not processed_data["file_loaded"]:
        raise HTTPException(status_code=400, detail="No data loaded")
    
    df = processed_data["df"]
    
    # Group by date and calculate OHLC
    daily_data = df.groupby('Buy Date')['P&L Amt (₹)'].agg([
        ('open', 'first'),
        ('high', 'max'),
        ('low', 'min'),
        ('close', 'last')
    ])
    
    candlestick_data = []
    for date, row in daily_data.iterrows():
        candlestick_data.append({
            'time': date.isoformat(),
            'open': float(row['open']),
            'high': float(row['high']),
            'low': float(row['low']),
            'close': float(row['close'])
        })
    
    return {'data': candlestick_data}

@app.get("/chart-data/correlation-matrix")
async def get_correlation_matrix():
    """Get correlation matrix for multiple metrics"""
    if not processed_data["file_loaded"]:
        raise HTTPException(status_code=400, detail="No data loaded")
    
    df = processed_data["df"]
    
    # Select numeric columns
    numeric_df = df.select_dtypes(include=['number'])
    correlation = numeric_df.corr()
    
    return {
        'correlation': correlation.to_dict(),
        'columns': list(numeric_df.columns)
    }
```

## 5. Export Capabilities

### Multi-format Export

```python
from fastapi.responses import FileResponse
import csv
from io import StringIO

@app.get("/export/csv")
async def export_csv():
    """Export all data as CSV"""
    if not processed_data["file_loaded"]:
        raise HTTPException(status_code=400, detail="No data loaded")
    
    pivot_df = processed_data["pivot_df"]
    
    # Create CSV
    csv_buffer = StringIO()
    pivot_df.to_csv(csv_buffer)
    
    return FileResponse(
        path=None,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=pnl_data.csv"}
    )

@app.get("/export/json")
async def export_json():
    """Export all statistics as JSON"""
    stats = get_statistics_data()
    return stats

@app.get("/export/excel")
async def export_excel():
    """Export data to Excel workbook"""
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill
    
    wb = Workbook()
    ws = wb.active
    
    # Add data
    pivot_df = processed_data["pivot_df"]
    for r_idx, (date, pnl) in enumerate(pivot_df['P&L Amt (₹)'].items(), 1):
        ws[f'A{r_idx}'] = date
        ws[f'B{r_idx}'] = pnl
        
        # Color negative values
        if pnl < 0:
            ws[f'B{r_idx}'].fill = PatternFill(start_color="FF0000", end_color="FF0000")
    
    wb.save('pnl_report.xlsx')
    return {'message': 'Excel file created'}
```

## 6. Authentication & Authorization

### JWT Authentication

```python
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from jose import JWTError, jwt
from datetime import datetime, timedelta

SECRET_KEY = "your-secret-key-change-this"
ALGORITHM = "HS256"

security = HTTPBearer()

def create_token(data: dict):
    """Create JWT token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def verify_token(credentials: HTTPAuthCredentials = Depends(security)):
    """Verify JWT token"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=403, detail="Invalid credentials")
    except JWTError:
        raise HTTPException(status_code=403, detail="Invalid token")
    return username

@app.post("/token")
async def login(username: str, password: str):
    """Get authentication token"""
    # Implement proper authentication
    if username == "user" and password == "password":
        token = create_token({"sub": username})
        return {"access_token": token, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/statistics", dependencies=[Depends(verify_token)])
async def get_statistics(current_user: str = Depends(verify_token)):
    """Protected endpoint"""
    # ... existing code ...
```

## 7. Caching & Performance Optimization

### Redis Caching

```python
import redis
import json

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def cache_get(key):
    """Get from cache"""
    value = redis_client.get(key)
    return json.loads(value) if value else None

def cache_set(key, value, expiry=3600):
    """Set in cache"""
    redis_client.setex(key, expiry, json.dumps(value))

@app.get("/statistics")
async def get_statistics():
    """Get statistics with caching"""
    # Check cache first
    cached = cache_get('statistics')
    if cached:
        return cached
    
    # Calculate if not cached
    if not processed_data["file_loaded"]:
        raise HTTPException(status_code=400, detail="No data loaded")
    
    stats = calculate_statistics()
    cache_set('statistics', stats)
    return stats
```

## 8. Rate Limiting

### Implement Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/statistics")
@limiter.limit("100/minute")
async def get_statistics(request: Request):
    """Rate limited endpoint"""
    # ... existing code ...
```

## 9. Monitoring & Metrics

### Prometheus Metrics Integration

```python
from prometheus_client import Counter, Histogram, generate_latest

# Define metrics
request_count = Counter(
    'api_requests_total',
    'Total API requests',
    ['method', 'endpoint']
)

request_duration = Histogram(
    'api_request_duration_seconds',
    'API request duration'
)

@app.middleware("http")
async def add_metrics(request: Request, call_next):
    """Middleware to track metrics"""
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    request_count.labels(method=request.method, endpoint=request.url.path).inc()
    request_duration.observe(duration)
    
    return response

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type="text/plain")
```

## 10. Async Processing for Large Files

### Background Tasks

```python
from fastapi import BackgroundTasks

@app.post("/upload-async")
async def upload_async(file: UploadFile, background_tasks: BackgroundTasks):
    """Upload file and process asynchronously"""
    filename = file.filename
    background_tasks.add_task(process_file_async, filename)
    
    return {
        "message": f"File {filename} queued for processing",
        "status": "processing"
    }

async def process_file_async(file_path: str):
    """Process file in background"""
    try:
        df = pd.read_csv(file_path)
        pivot_df = df.pivot_table(...)
        processed_data["df"] = df
        processed_data["pivot_df"] = pivot_df
        processed_data["file_loaded"] = True
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
```

## Deployment Considerations

### Production Checklist

- [ ] Use environment variables for configuration
- [ ] Implement proper error handling and logging
- [ ] Add authentication/authorization
- [ ] Enable CORS properly
- [ ] Setup database for persistence
- [ ] Implement caching strategy
- [ ] Add rate limiting
- [ ] Setup monitoring and alerts
- [ ] Use production WSGI server (Gunicorn)
- [ ] Setup SSL/HTTPS
- [ ] Implement backup strategy
- [ ] Add request/response logging
- [ ] Setup health checks
- [ ] Create runbooks for common issues

### Deployment Command (Gunicorn)

```bash
gunicorn -w 4 -b 0.0.0.0:8000 main:app
```

## Performance Optimization Tips

1. **Indexing**: Add database indexes on frequently queried fields
2. **Pagination**: Implement pagination for large datasets
3. **Compression**: Enable gzip compression for responses
4. **Caching**: Cache expensive computations
5. **Async**: Use async operations for I/O
6. **Batch Processing**: Process multiple requests together
7. **Connection Pooling**: Use connection pools for databases

## Testing & Quality Assurance

### Unit Tests

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_statistics_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/statistics")
        assert response.status_code == 400  # No data loaded
```

## Security Best Practices

1. Validate all inputs
2. Sanitize file uploads
3. Use HTTPS in production
4. Implement CORS carefully
5. Rotate secrets regularly
6. Log security events
7. Keep dependencies updated
8. Use environment variables for secrets
