# Complete Setup Guide - P&L Dashboard (Frontend + Backend)

Complete guide to set up and run both the FastAPI backend and React frontend.

## 📦 Project Structure

```
pnl-dashboard/
├── backend/                    # FastAPI Backend
│   ├── main.py
│   ├── client.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── docs/                       # Documentation
    ├── README.md
    ├── FRONTEND_README.md
    └── COMPLETE_SETUP_GUIDE.md
```

## 🚀 Option 1: Quick Start (Local Development)

### Prerequisites

- Python 3.8+ (for backend)
- Node.js 16+ (for frontend)
- npm or yarn
- Git (optional)

### Step 1: Setup Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
python main.py
```

Backend runs on: `http://localhost:8001`

### Step 2: Setup Frontend

In a **new terminal**:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: `http://localhost:3001`

### Step 3: Use the Dashboard

1. Open browser: `http://localhost:3001`
2. Upload your CSV file
3. View analytics and statistics

---

## 🐳 Option 2: Docker (Recommended for Production)

### Prerequisites

- Docker installed
- Docker Compose installed

### Setup with Docker Compose

1. **Create docker-compose.yml** in root directory:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
    ports:
      - "8001:8001"
    environment:
      - PYTHONUNBUFFERED=1
    volumes:
      - ./data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
    ports:
      - "3001:3001"
    environment:
      - VITE_API_URL=http://localhost:8001
    depends_on:
      - backend
    networks:
      - pnl-network

networks:
  pnl-network:
    driver: bridge
```

2. **Build and run**:

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services available at:
- Frontend: `http://localhost:3001`
- Backend: `http://localhost:8001`
- API Docs: `http://localhost:8001/docs`

---

## 🔧 Option 3: Individual Setup

### Backend Only

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Access at: `http://localhost:8001/docs`

### Frontend Only (with external backend)

```bash
cd frontend

# Update API URL
# Edit src/App.jsx:
# const API_BASE_URL = 'http://your-backend-url:8001';

npm install
npm run dev
```

---

## 📋 Configuration

### Backend Configuration

Edit `backend/main.py`:

```python
# Change host/port
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

Or use environment variables:

```bash
export API_HOST=0.0.0.0
export API_PORT=8001
```

### Frontend Configuration

Edit `frontend/vite.config.js`:

```js
export default defineConfig({
  server: {
    port: 3001,
    host: 'localhost',
  },
})
```

### API Connection

Edit `frontend/src/App.jsx`:

```jsx
const API_BASE_URL = 'http://localhost:8001';

// Or use environment variable:
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
```

Create `.env`:
```
VITE_API_URL=http://localhost:8001
```

---

## ✅ Verification Checklist

### Backend Check

```bash
# Test API is running
curl http://localhost:8001/health

# Expected response:
# {"status":"healthy","data_loaded":false}

# View API documentation
# Visit: http://localhost:8001/docs
```

### Frontend Check

```bash
# Frontend should open automatically
# Visit: http://localhost:3001

# Check browser console for errors
# Press F12 to open developer tools
```

### Full Integration Test

1. **Open dashboard**: `http://localhost:3001`
2. **Upload CSV file** with columns:
   - Buy Date (DD MM YY format)
   - P&L Amt (₹)
3. **Verify statistics load** (should see metrics cards)
4. **Check charts render** (area chart, bar chart, pie chart)
5. **View top days table** (best and worst days)

---

## 🔗 API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/upload` | POST | Upload CSV file |
| `/statistics` | GET | Get all metrics |
| `/pivot-data` | GET | Get daily P&L data |
| `/distribution-data` | GET | Get distribution |
| `/top-days` | GET | Get best/worst days |
| `/raw-data` | GET | Get raw records |
| `/summary` | GET | Get overview |
| `/health` | GET | Health check |
| `/docs` | GET | Swagger UI |

---

## 🐛 Troubleshooting

### Backend Issues

#### Port 8001 Already in Use

```bash
# Find process using port 8001
lsof -i :8001  # macOS/Linux
netstat -ano | findstr :8001  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
python main.py --port 8001
```

#### Module Not Found

```bash
# Reinstall requirements
pip install --upgrade -r requirements.txt

# Or use pip cache clean
pip cache purge
pip install -r requirements.txt
```

#### CORS Issues

Add CORS configuration to backend `main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Frontend Issues

#### Node Modules Corrupted

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Or with yarn
rm -rf node_modules yarn.lock
yarn install
```

#### Port 3001 Already in Use

```bash
# Use different port
npm run dev -- --port 3001
```

#### API Connection Error

1. **Check backend is running**:
   ```bash
   curl http://localhost:8001/health
   ```

2. **Check API URL in App.jsx**:
   ```jsx
   console.log('API URL:', API_BASE_URL);
   ```

3. **Check browser console** (F12) for errors

4. **Verify CORS headers** in Network tab

### File Upload Issues

#### "Column not found" Error

Ensure CSV has:
- Column named exactly: `Buy Date`
- Column named exactly: `P&L Amt (₹)`
- Date format: DD MM YY (e.g., 01 01 24)

#### "Invalid file format" Error

- File must be `.csv` extension
- Use comma separator (`,`)
- UTF-8 encoding

---

## 📊 CSV Template

Create a sample file to test:

```csv
Buy Date,Ticker,Quantity,P&L Amt (₹)
01 01 24,INFY,100,500.50
02 01 24,TCS,50,-200.25
03 01 24,WIPRO,75,300.00
04 01 24,INFY,100,1200.75
05 01 24,TCS,50,-150.00
```

---

## 🚀 Production Deployment

### Backend Deployment (Heroku)

```bash
# Create Procfile
echo "web: gunicorn -w 4 -b 0.0.0.0:\$PORT main:app" > Procfile

# Deploy
heroku create your-app-name
git push heroku main
```

### Frontend Deployment (Vercel)

```bash
npm install -g vercel
vercel --prod
```

### Deployment Checklist

- [ ] Update API URL in frontend for production
- [ ] Enable HTTPS
- [ ] Setup environment variables
- [ ] Configure CORS for production domain
- [ ] Enable authentication if needed
- [ ] Setup monitoring and logging
- [ ] Test file upload size limits
- [ ] Verify error handling
- [ ] Setup backup for data
- [ ] Create deployment documentation

---

## 📝 Environment Variables

### Backend `.env`

```env
API_HOST=0.0.0.0
API_PORT=8001
ENVIRONMENT=development
DEBUG=True
CORS_ORIGINS=http://localhost:3001,http://localhost:8080
DATABASE_URL=sqlite:///./pnl_data.db
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:8001
VITE_DEBUG=true
```

---

## 🔐 Security Checklist

- [ ] Use HTTPS in production
- [ ] Implement authentication
- [ ] Validate file uploads
- [ ] Sanitize input data
- [ ] Setup CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable CSRF protection
- [ ] Implement rate limiting
- [ ] Setup logging and monitoring
- [ ] Regular dependency updates

---

## 📚 Documentation Files

- **README.md** - Backend API reference
- **FRONTEND_README.md** - Frontend setup and usage
- **QUICKSTART.md** - 5-minute quick start
- **USAGE_GUIDE.md** - Detailed usage examples
- **ADVANCED_FEATURES.md** - Advanced customization
- **INDEX.md** - File structure and navigation
- **COMPLETE_SETUP_GUIDE.md** - This file

---

## 🆘 Getting Help

### Check These Resources First

1. **API Documentation**: `http://localhost:8001/docs`
2. **Browser Console**: Press F12 to view errors
3. **Backend Logs**: Check terminal where backend is running
4. **Frontend Console**: Check React console for warnings
5. **Network Tab**: Check API calls in browser DevTools

### Common Commands

```bash
# View backend logs
tail -f backend_logs.txt

# Clear cache
rm -rf node_modules dist __pycache__
npm cache clean --force

# Test API endpoint
curl -X POST http://localhost:8001/upload -F "file=@data.csv"

# Check open ports
lsof -i -P -n  # macOS/Linux
```

---

## 🎯 Next Steps

1. **Setup** - Follow Option 1, 2, or 3 above
2. **Upload** - Upload your CSV file
3. **Explore** - Check out the dashboard features
4. **Customize** - Modify components as needed
5. **Deploy** - Push to production

---

## 📞 Support Resources

- FastAPI Docs: https://fastapi.tiangolo.com
- React Docs: https://react.dev
- Vite Docs: https://vitejs.dev
- Recharts Docs: https://recharts.org

---

**You're all set!** 🎉 Start analyzing your P&L data now.
