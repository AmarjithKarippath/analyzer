# Frontend Files Index

Complete list of all React frontend files and their purposes.

## 📁 File Structure

```
frontend/
├── Configuration Files
│   ├── frontend-package.json    → package.json (dependencies)
│   ├── vite.config.js           → Vite build configuration
│   └── index.html               → HTML entry point
│
├── Source Files
│   ├── main.jsx                 → React app entry point
│   ├── App.jsx                  → Main app component
│   └── index.css                → Global styles
│
├── Components
│   ├── components/
│   │   ├── FileUpload.jsx       → CSV file upload component
│   │   ├── FileUpload.css
│   │   │
│   │   ├── Dashboard.jsx        → Main dashboard layout
│   │   ├── Dashboard.css
│   │   │
│   │   ├── StatisticsCards.jsx  → Metric cards component
│   │   ├── StatisticsCards.css
│   │   │
│   │   ├── Charts.jsx           → Data visualization charts
│   │   ├── Charts.css
│   │   │
│   │   ├── TopDaysTable.jsx     → Best/worst days table
│   │   ├── TopDaysTable.css
│   │   │
│   │   ├── LoadingSpinner.jsx   → Loading indicator
│   │   ├── LoadingSpinner.css
│   │   │
│   │   ├── ErrorAlert.jsx       → Error notification
│   │   └── ErrorAlert.css
│
└── Documentation
    ├── FRONTEND_README.md       → Frontend setup guide
    └── COMPLETE_SETUP_GUIDE.md  → Full setup instructions
```

## 📄 File Descriptions

### Configuration Files

#### `frontend-package.json` (→ rename to `package.json`)
**Purpose:** Node.js dependencies and build scripts

**Key Dependencies:**
- react & react-dom (18.2.0) - UI framework
- axios (1.6.0) - HTTP client
- recharts (2.10.0) - Charts
- lucide-react (0.294.0) - Icons
- date-fns (2.30.0) - Date utilities

**Scripts:**
```json
{
  "dev": "vite",           // Start dev server
  "build": "vite build",   // Build for production
  "preview": "vite preview" // Preview build
}
```

---

#### `vite.config.js`
**Purpose:** Vite build tool configuration

**Includes:**
- React plugin
- Development server on port 3000
- Production build optimization
- Console logging removed in production
- Minification enabled

---

#### `index.html`
**Purpose:** Main HTML file

**Contains:**
- Meta tags for responsive design
- Theme color setting
- Root div for React
- Script reference to main.jsx

---

### Source Files

#### `main.jsx`
**Purpose:** React app entry point

**Does:**
- Renders React app to #root element
- Imports App component
- Sets up strict mode

---

#### `App.jsx`
**Purpose:** Main application component

**Responsibilities:**
- File upload handling
- API communication
- State management
- Routes between upload and dashboard
- Error handling

**Key Functions:**
```jsx
handleFileUpload(file)    // Upload handler
fetchStatistics()         // Get data from API
handleNewFile()          // Reset to upload screen
```

**State:**
- isLoading - Loading indicator
- error - Error messages
- fileLoaded - Upload status
- stats - Statistics data
- summary - Data overview

---

#### `index.css`
**Purpose:** Global styles

**Includes:**
- CSS variables
- Font configuration
- Scrollbar styling
- Focus styles
- Accessibility rules

---

### Components

#### `FileUpload.jsx` & `FileUpload.css`
**Purpose:** CSV file upload interface

**Features:**
- Drag-and-drop support
- Click to browse
- File validation
- File size display
- Requirements info
- Loading state

**Props:**
```jsx
onFileUpload(file)  // Callback when file uploaded
isLoading           // Show loading state
```

**Validation:**
- File type: .csv only
- Column validation: "Buy Date", "P&L Amt (₹)"

---

#### `Dashboard.jsx` & `Dashboard.css`
**Purpose:** Main dashboard layout

**Sections:**
1. Header - Title, date range, action buttons
2. Statistics cards - Key metrics
3. Charts - Data visualization
4. Top days - Best/worst performing days
5. Summary - Data overview

**Props:**
```jsx
stats      // Statistics data from API
summary    // Data overview
onNewFile  // Callback to upload new file
isLoading  // Loading indicator
```

**Features:**
- Header with refresh button
- Section layout
- Responsive grid
- Loading spinner
- Error boundary ready

---

#### `StatisticsCards.jsx` & `StatisticsCards.css`
**Purpose:** Display metric cards

**Displays 8 Cards:**
1. Total P&L - Total profit/loss
2. Win Rate - Percentage of winning days
3. Profit Factor - Win/loss ratio
4. Best Day - Maximum profit
5. Worst Day - Maximum loss
6. Avg Daily Win - Average winning day
7. Avg Daily Loss - Average losing day
8. Total Trades - Total number of trades

**Features:**
- Color-coded cards (success, danger, primary, info)
- Icon for each metric
- Formatted currency values
- Hover effects
- Responsive grid

**Props:**
```jsx
stats  // Statistics data object
```

---

#### `Charts.jsx` & `Charts.css`
**Purpose:** Interactive data visualization

**4 Chart Types:**

1. **Daily P&L Area Chart**
   - Shows daily P&L over time
   - Gradient fill
   - Interactive tooltip

2. **Cumulative P&L Line Chart**
   - Shows running total
   - Multiple line types
   - Customizable legend

3. **P&L Distribution Bar Chart**
   - Shows frequency distribution
   - 20 bins by default
   - Interactive hover

4. **Win/Loss Pie Chart**
   - Profitable vs losing days
   - Percentage display
   - Color-coded

**Features:**
- Responsive containers
- Custom tooltips
- Formatted currency display
- Interactive hover
- Smooth animations

**Props:**
```jsx
pivotData        // Daily P&L data
distributionData // Histogram data
stats            // Statistics for labels
```

---

#### `TopDaysTable.jsx` & `TopDaysTable.css`
**Purpose:** Display best and worst trading days

**Two Tables:**
1. **Top Profitable Days** - Best 5 days
2. **Top Loss-Making Days** - Worst 5 days

**Features:**
- Rank badges (1-5)
- Formatted dates
- Color-coded amounts (green/red)
- Responsive design
- Sorted by performance

**Props:**
```jsx
topDays  // Top days data from API
```

**Data Format:**
```jsx
{
  top_profitable_days: {
    count: 5,
    data: [{ date, pnl_amount }, ...]
  },
  top_loss_days: {
    count: 5,
    data: [{ date, pnl_amount }, ...]
  }
}
```

---

#### `LoadingSpinner.jsx` & `LoadingSpinner.css`
**Purpose:** Show loading indicator

**Features:**
- Overlay effect
- Spinner animation
- Custom message
- Auto-dismiss option

**Props:**
```jsx
message = "Loading..." // Custom loading message
```

---

#### `ErrorAlert.jsx` & `ErrorAlert.css`
**Purpose:** Display error messages

**Features:**
- Toast notification style
- Auto-dismiss after 5 seconds
- Close button
- Error icon
- Slide-in animation

**Props:**
```jsx
error = { title, message }  // Error data
onClose()                   // Close callback
```

---

## 🎨 Styling System

### Global Colors
```css
--primary: #6366f1
--success: #10b981
--danger: #ef4444
--warning: #f59e0b
--info: #3b82f6
```

### Responsive Breakpoints
```css
1024px - Tablet landscape
768px  - Tablet portrait
480px  - Mobile phones
```

### CSS Architecture
- **Component-scoped CSS** - Each component has its own CSS file
- **CSS Variables** - For consistent theming
- **Flexbox & Grid** - For responsive layouts
- **Transitions** - Smooth animations
- **Media Queries** - Mobile-first design

---

## 🚀 Component Usage Flow

```
App.jsx
├── FileUpload.jsx (Upload Screen)
│   └── handleFileUpload() → API /upload
│
└── Dashboard.jsx (Analysis Screen)
    ├── Header
    │   ├── Refresh Button → fetchDashboardData()
    │   └── New File Button → handleNewFile()
    │
    ├── StatisticsCards.jsx
    │   ├── Uses stats prop
    │   └── Displays 8 metrics
    │
    ├── Charts.jsx
    │   ├── Daily P&L Chart
    │   ├── Cumulative P&L Chart
    │   ├── Distribution Chart
    │   └── Win/Loss Pie Chart
    │
    ├── TopDaysTable.jsx
    │   ├── Top Profitable Days
    │   └── Top Loss-Making Days
    │
    └── Summary Section
        └── Data overview
```

---

## 📦 Installation Instructions

### For Development:

1. **Rename configuration file:**
   ```bash
   cp frontend-package.json package.json
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

---

## 🔄 API Integration

### Files that communicate with API:
- `App.jsx` - File upload and initial fetch
- `Dashboard.jsx` - Data fetching

### API Calls Made:

| Endpoint | Called From | Purpose |
|----------|------------|---------|
| POST /upload | App.jsx | Upload CSV |
| GET /statistics | App.jsx | Get metrics |
| GET /summary | App.jsx | Get overview |
| GET /top-days | Dashboard.jsx | Get best/worst days |
| GET /pivot-data | Dashboard.jsx | Get daily P&L |
| GET /distribution-data | Dashboard.jsx | Get distribution |

---

## 🎨 Component Props Summary

| Component | Props | Types |
|-----------|-------|-------|
| FileUpload | onFileUpload, isLoading | function, boolean |
| Dashboard | stats, summary, onNewFile, isLoading | object, object, function, boolean |
| StatisticsCards | stats | object |
| Charts | pivotData, distributionData, stats | object, object, object |
| TopDaysTable | topDays | object |
| LoadingSpinner | message | string |
| ErrorAlert | error, onClose | object, function |

---

## 🔧 Key Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.2.0 | UI Framework |
| Vite | 5.0.0 | Build Tool |
| Recharts | 2.10.0 | Charts |
| Axios | 1.6.0 | HTTP Client |
| Lucide React | 0.294.0 | Icons |
| Date-fns | 2.30.0 | Date Utils |

---

## 📝 Development Workflow

1. **Create Component**
   ```jsx
   // components/MyComponent.jsx
   export default function MyComponent() {
     return <div>Component</div>
   }
   ```

2. **Add Styles**
   ```css
   /* components/MyComponent.css */
   .component { }
   ```

3. **Import in Parent**
   ```jsx
   import MyComponent from './components/MyComponent'
   ```

4. **Pass Props**
   ```jsx
   <MyComponent prop={value} />
   ```

---

## 🚀 Building for Production

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview

# Output folder: dist/
```

---

## 📚 Quick Reference

### Common Commands
```bash
npm install           # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview build
npm run lint         # Run ESLint
```

### File Naming Convention
- Components: PascalCase (FileUpload.jsx)
- CSS files: match component name (FileUpload.css)
- Functions: camelCase (handleFileUpload)
- Constants: UPPER_SNAKE_CASE (API_BASE_URL)

### CSS Naming Convention
- Classes: kebab-case (.upload-zone)
- IDs: kebab-case (#root)
- Variables: --kebab-case (--primary-color)

---

## ✅ Quality Checklist

- [x] All components created
- [x] Styling complete
- [x] Responsive design implemented
- [x] API integration done
- [x] Error handling included
- [x] Loading states added
- [x] Documentation complete
- [x] Code comments added
- [x] Mobile-friendly
- [x] Accessibility considered

---

**Total Files: 22**
- Configuration: 3
- Source: 3
- Components: 14 (7 pairs)
- Documentation: 2

All files are ready for development! 🚀
