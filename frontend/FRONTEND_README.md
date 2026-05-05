# P&L Dashboard Frontend

A modern, responsive React.js dashboard for analyzing P&L (Profit and Loss) trading data. Built with Vite, Recharts, and modern CSS.

## 🎨 Features

✨ **Modern UI Design** - Clean, professional interface inspired by trading dashboards  
📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile  
📊 **Interactive Charts** - Real-time visualization with Recharts  
📈 **Performance Metrics** - Display 8 key statistics cards  
📉 **Multiple Visualizations** - Line charts, area charts, bar charts, pie charts  
⚡ **Fast Performance** - Built with Vite for instant hot module replacement  
🎯 **File Upload** - Drag-and-drop CSV file upload  
🔄 **Real-time Data** - Automatic data fetching and refreshing  

## 📋 Project Structure

```
frontend/
├── index.html              # HTML entry point
├── main.jsx               # React app entry point
├── App.jsx                # Main app component
├── App.css                # App styles
├── index.css              # Global styles
├── vite.config.js         # Vite configuration
├── package.json           # Dependencies
└── components/
    ├── FileUpload.jsx     # CSV file upload component
    ├── FileUpload.css
    ├── Dashboard.jsx      # Main dashboard component
    ├── Dashboard.css
    ├── StatisticsCards.jsx # Metrics cards
    ├── StatisticsCards.css
    ├── Charts.jsx         # Chart visualizations
    ├── Charts.css
    ├── TopDaysTable.jsx   # Best/worst days table
    ├── TopDaysTable.css
    ├── LoadingSpinner.jsx # Loading indicator
    ├── LoadingSpinner.css
    ├── ErrorAlert.jsx     # Error notification
    └── ErrorAlert.css
```

## 🚀 Quick Start

### 1. Installation

```bash
# Install dependencies
npm install
```

### 2. Start Development Server

```bash
# Run development server on http://localhost:3000
npm run dev
```

### 3. Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

## 📦 Dependencies

### Production
- **react** (18.2.0) - UI library
- **react-dom** (18.2.0) - React DOM rendering
- **axios** (1.6.0) - HTTP client
- **recharts** (2.10.0) - Charting library
- **lucide-react** (0.294.0) - Icon library
- **date-fns** (2.30.0) - Date utilities
- **classnames** (2.3.2) - Class utilities

### Development
- **vite** (5.0.0) - Build tool
- **@vitejs/plugin-react** (4.2.0) - React plugin
- **tailwindcss** (3.3.0) - Utility CSS
- **eslint** & **eslint-plugin-react** - Code linting

## 🔌 API Integration

The frontend communicates with the FastAPI backend on `http://localhost:8000`.

### Endpoints Used

- `POST /upload` - Upload CSV file
- `GET /statistics` - Get all metrics
- `GET /pivot-data` - Get daily P&L data
- `GET /distribution-data` - Get P&L distribution
- `GET /top-days` - Get best/worst days
- `GET /summary` - Get data overview

### Configure API URL

Edit `App.jsx` to change the API URL:

```jsx
const API_BASE_URL = 'http://localhost:8000'; // Change this
```

Or use environment variable:

```jsx
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

Create `.env` file:
```
VITE_API_URL=http://your-api-url:8000
```

## 🎨 Components Guide

### FileUpload Component
Handles CSV file uploads with drag-and-drop support.

**Features:**
- Drag-and-drop file upload
- File type validation
- File size display
- Upload requirements display

### Dashboard Component
Main dashboard layout with header and content sections.

**Features:**
- Statistics cards
- Performance charts
- Top days table
- Data summary
- Refresh button
- New file button

### StatisticsCards Component
Displays 8 key performance metrics in card format.

**Metrics:**
- Total P&L
- Win Rate
- Profit Factor
- Best Day
- Worst Day
- Average Daily Win
- Average Daily Loss
- Total Trades

### Charts Component
Interactive charts for data visualization.

**Charts:**
- Daily P&L area chart
- Cumulative P&L line chart
- P&L distribution bar chart
- Win/Loss pie chart

### TopDaysTable Component
Tables showing best and worst trading days.

**Features:**
- Rank badges
- Formatted dates
- Color-coded amounts
- Responsive table design

## 🎯 Color Scheme

```css
Primary: #6366f1 (Indigo)
Primary Dark: #4f46e5
Primary Light: #818cf8

Success: #10b981 (Emerald)
Danger: #ef4444 (Red)
Warning: #f59e0b (Amber)
Info: #3b82f6 (Blue)

Gray 50: #f9fafb
Gray 900: #111827
```

## 📱 Responsive Design

The dashboard is fully responsive with breakpoints at:
- **1024px** - Tablet landscape
- **768px** - Tablet portrait
- **480px** - Mobile

All components adapt to screen size with appropriate adjustments to:
- Grid layouts
- Font sizes
- Padding and spacing
- Chart dimensions

## ⚙️ Configuration

### Vite Configuration (`vite.config.js`)

```js
- Port: 3000
- Host: localhost
- Output: dist/
- Minification: enabled
- Console removal: enabled
```

### Build Output

Production builds are optimized for:
- Minimal bundle size
- Fast loading times
- No console logs in production
- Source maps disabled

## 🔍 Development Tips

### Enable Source Maps (Development)

```js
// In vite.config.js
build: {
  sourcemap: true, // Enable for debugging
}
```

### API Proxy for Development

```js
// In vite.config.js
server: {
  proxy: {
    '/api': 'http://localhost:8000'
  }
}
```

### Environment Variables

Create `.env.local` for development:

```
VITE_API_URL=http://localhost:8000
VITE_DEBUG=true
```

Access in components:
```jsx
const apiUrl = import.meta.env.VITE_API_URL;
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Use different port
npm run dev -- --port 3001
```

### API Connection Issues

1. Check if backend is running on `http://localhost:8000`
2. Verify CORS is enabled on backend
3. Check browser console for error messages
4. Ensure backend and frontend are on same machine or CORS is configured

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear vite cache
rm -rf dist
npm run build
```

### Chart Not Displaying

- Ensure data is loaded (check Network tab in DevTools)
- Verify API endpoints are returning data
- Check browser console for JavaScript errors

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized assets.

### Deploy to Static Hosting

**Vercel:**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
# Drag and drop dist/ folder to Netlify
```

**GitHub Pages:**
```bash
# Build and push dist/ to gh-pages branch
```

### Environment Configuration for Production

Create production environment file:

```env
# .env.production
VITE_API_URL=https://api.yourdomain.com
```

## 📊 Performance Optimization

### Bundle Size
- Chunk splitting enabled
- Code minification enabled
- Dead code elimination
- Tree shaking enabled

### Runtime Performance
- React.StrictMode for development warnings
- Lazy loading for chart rendering
- Efficient re-renders with proper key props
- Debounced API calls

### Network
- Axios caching configuration
- Compressed responses
- CDN ready

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Recharts Documentation](https://recharts.org)
- [Lucide Icons](https://lucide.dev)

## 🤝 Contributing

To extend the dashboard:

1. Create new component in `components/` folder
2. Add component styles in CSS file
3. Import and use in Dashboard
4. Test responsiveness
5. Update this README

## 📝 File Format

### CSV Requirements

Your CSV file must have these columns:
- **Buy Date** - Format: DD MM YY (e.g., 01 01 24)
- **P&L Amt (₹)** - Numeric values

Example:
```csv
Buy Date,Ticker,Quantity,P&L Amt (₹)
01 01 24,INFY,100,500.50
02 01 24,TCS,50,-200.25
```

## 🔐 Security Notes

- No sensitive data is stored in local storage
- API calls go directly to backend
- HTTPS recommended for production
- Implement authentication as needed

## 📞 Support

For issues or feature requests:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Check API backend is running
4. Verify network connectivity

## 📄 License

This project is part of the P&L Report Suite. See main project for license information.

---

**Happy analyzing!** 📊
