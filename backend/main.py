from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
from typing import Optional
from datetime import datetime
from collections import defaultdict
import calendar as _calendar
import json

app = FastAPI(title="P&L Report API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to store the processed dataframe
processed_data = {
    "df": None,
    "pivot_df": None,
    "file_loaded": False
}


RANGE_TO_DAYS = {
    "1w": 7,
    "1m": 30,
    "3m": 90,
    "6m": 180,
    "all": None,
}


def filter_df_by_range(df: pd.DataFrame, range_key: Optional[str]):
    """Filter trades dataframe by a named lookback window anchored at max trade date."""
    if not range_key or range_key == "all":
        return df
    if range_key not in RANGE_TO_DAYS:
        raise HTTPException(status_code=400, detail=f"Invalid range '{range_key}'. Use one of: 1w,1m,3m,6m,all")
    days = RANGE_TO_DAYS[range_key]
    if days is None:
        return df
    anchor = df['Buy Date'].max()
    cutoff = anchor - pd.Timedelta(days=days - 1)
    return df[df['Buy Date'] >= cutoff]


def build_pivot(df: pd.DataFrame):
    return df.pivot_table(index='Buy Date', values='P&L Amt (₹)', aggfunc='sum')


class PandasEncoder(json.JSONEncoder):
    """Custom JSON encoder for pandas objects"""
    def default(self, obj):
        if pd.isna(obj):
            return None
        if isinstance(obj, (pd.Timestamp, datetime)):
            return obj.isoformat()
        if isinstance(obj, (pd.Int64Dtype, pd.Float64Dtype)):
            return float(obj) if isinstance(obj, (int, float)) else obj
        return super().default(obj)


@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    """
    Upload and process CSV file
    """
    try:
        # Read the uploaded file
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents), sep=',')

        # Convert 'Buy Date' to datetime objects
        df['Buy Date'] = pd.to_datetime(df['Buy Date'], format='%d %b %Y')

        # Create pivot table with 'Buy Date' as index and sum of 'P&L Amt (₹)'
        pivot_df = df.pivot_table(
            index='Buy Date',
            values='P&L Amt (₹)',
            aggfunc='sum'
        )

        # Store processed data globally
        processed_data["df"] = df
        processed_data["pivot_df"] = pivot_df
        processed_data["file_loaded"] = True

        return {
            "status": "success",
            "message": f"File '{file.filename}' uploaded and processed successfully",
            "rows_loaded": len(df),
            "date_range": {
                "start": df['Buy Date'].min().isoformat(),
                "end": df['Buy Date'].max().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")


@app.get("/statistics")
async def get_statistics(range_key: Optional[str] = Query("all", alias="range")):
    """
    Get all calculated P&L statistics (all print data as JSON)
    """
    if not processed_data["file_loaded"]:
        raise HTTPException(status_code=400, detail="No data loaded. Please upload a CSV file first.")

    df = filter_df_by_range(processed_data["df"], range_key)
    if len(df) == 0:
        return {
            "daily_metrics": {"profitable_days": 0, "loss_days": 0, "total_traded_days": 0,
                              "max_profit_per_day": 0, "max_loss_per_day": 0,
                              "average_profit_per_day": 0, "average_loss_per_day": 0},
            "trade_metrics": {"total_trades": 0, "min_trades_per_day": 0,
                              "max_trades_per_day": 0, "average_trades_per_day": 0},
            "summary": {"total_pnl": 0, "win_rate_percentage": 0, "profit_factor": 0},
            "range": range_key,
        }
    pivot_df = build_pivot(df)

    # Calculate metrics
    profitable_days = int((pivot_df['P&L Amt (₹)'] > 0).sum())
    loss_days = int((pivot_df['P&L Amt (₹)'] < 0).sum())
    total_traded_days = len(pivot_df)

    max_profit_per_day = float(pivot_df['P&L Amt (₹)'].max())
    max_loss_per_day = float(pivot_df['P&L Amt (₹)'].min())

    profitable_mask = pivot_df['P&L Amt (₹)'] > 0
    loss_mask = pivot_df['P&L Amt (₹)'] < 0

    average_profit_per_day = float(pivot_df[profitable_mask]['P&L Amt (₹)'].mean()) if profitable_mask.sum() > 0 else 0
    average_loss_per_day = float(pivot_df[loss_mask]['P&L Amt (₹)'].mean()) if loss_mask.sum() > 0 else 0

    total_trades = len(df)
    trades_per_day = df.groupby('Buy Date').size()

    min_trades_per_day = int(trades_per_day.min())
    max_trades_per_day = int(trades_per_day.max())
    average_trades_per_day = float(trades_per_day.mean())

    # Calculate additional metrics
    total_pnl = float(pivot_df['P&L Amt (₹)'].sum())
    win_rate = (profitable_days / total_traded_days * 100) if total_traded_days > 0 else 0

    return {
        "daily_metrics": {
            "profitable_days": profitable_days,
            "loss_days": loss_days,
            "total_traded_days": total_traded_days,
            "max_profit_per_day": round(max_profit_per_day, 2),
            "max_loss_per_day": round(max_loss_per_day, 2),
            "average_profit_per_day": round(average_profit_per_day, 2),
            "average_loss_per_day": round(average_loss_per_day, 2)
        },
        "trade_metrics": {
            "total_trades": total_trades,
            "min_trades_per_day": min_trades_per_day,
            "max_trades_per_day": max_trades_per_day,
            "average_trades_per_day": round(average_trades_per_day, 2)
        },
        "summary": {
            "total_pnl": round(total_pnl, 2),
            "win_rate_percentage": round(win_rate, 2),
            "profit_factor": round(abs(pivot_df[profitable_mask]['P&L Amt (₹)'].sum() / pivot_df[loss_mask]['P&L Amt (₹)'].sum()), 2) if loss_mask.sum() > 0 else 0
        }
    }


@app.get("/pivot-data")
async def get_pivot_data(range_key: Optional[str] = Query("all", alias="range")):
    """
    Get pivot table data (for line plot visualization)
    """
    if not processed_data["file_loaded"]:
        raise HTTPException(status_code=400, detail="No data loaded. Please upload a CSV file first.")

    df = filter_df_by_range(processed_data["df"], range_key)
    pivot_df = build_pivot(df) if len(df) else pd.DataFrame(columns=['P&L Amt (₹)'])

    # Convert to list of dictionaries
    data = []
    for date, value in pivot_df['P&L Amt (₹)'].items():
        data.append({
            "date": date.strftime('%Y-%m-%d'),
            "pnl_amount": round(float(value), 2)
        })

    return {
        "total_records": len(data),
        "data": data
    }


@app.get("/distribution-data")
async def get_distribution_data(bins: int = 20, range_key: Optional[str] = Query("all", alias="range")):
    """
    Get histogram distribution data (daily P&L distribution)
    """
    if not processed_data["file_loaded"]:
        raise HTTPException(status_code=400, detail="No data loaded. Please upload a CSV file first.")

    df = filter_df_by_range(processed_data["df"], range_key)
    if len(df) == 0:
        return {"total_records": 0, "bins": bins, "distribution": []}
    pivot_df = build_pivot(df)
    pnl_values = pivot_df['P&L Amt (₹)'].values

    import numpy as np
    if len(pnl_values) == 1 or pnl_values.min() == pnl_values.max():
        bin_edges = np.linspace(float(pnl_values.min()) - 1, float(pnl_values.max()) + 1, bins + 1)
    else:
        bin_edges = np.linspace(float(pnl_values.min()), float(pnl_values.max()), bins + 1)
    counts, _ = np.histogram(pnl_values, bins=bin_edges)

    data = []
    for i in range(len(bin_edges) - 1):
        bin_label = f"{bin_edges[i]:.2f} to {bin_edges[i+1]:.2f}"
        data.append({
            "bin": bin_label,
            "bin_start": round(float(bin_edges[i]), 2),
            "bin_end": round(float(bin_edges[i+1]), 2),
            "frequency": int(counts[i]),
        })

    return {
        "total_records": len(pnl_values),
        "bins": bins,
        "distribution": data
    }


@app.get("/top-days")
async def get_top_days(top_n: int = 5, range_key: Optional[str] = Query("all", alias="range")):
    """
    Get top profitable and loss-making days
    """
    if not processed_data["file_loaded"]:
        raise HTTPException(status_code=400, detail="No data loaded. Please upload a CSV file first.")

    df = filter_df_by_range(processed_data["df"], range_key)
    if len(df) == 0:
        return {"top_profitable_days": {"count": 0, "data": []},
                "top_loss_days": {"count": 0, "data": []}}
    pivot_df = build_pivot(df)

    # Get top profitable days
    top_profitable = pivot_df.nlargest(top_n, 'P&L Amt (₹)')
    profitable_data = []
    for date, pnl in top_profitable['P&L Amt (₹)'].items():
        profitable_data.append({
            "date": date.strftime('%Y-%m-%d'),
            "pnl_amount": round(float(pnl), 2)
        })

    # Get top loss days
    top_loss = pivot_df.nsmallest(top_n, 'P&L Amt (₹)')
    loss_data = []
    for date, pnl in top_loss['P&L Amt (₹)'].items():
        loss_data.append({
            "date": date.strftime('%Y-%m-%d'),
            "pnl_amount": round(float(pnl), 2)
        })

    return {
        "top_profitable_days": {
            "count": len(profitable_data),
            "data": profitable_data
        },
        "top_loss_days": {
            "count": len(loss_data),
            "data": loss_data
        }
    }


@app.get("/calendar-data")
async def get_calendar_data(months: int = 2, end_date: Optional[str] = None):
    """
    Get a daily calendar summary of trades for the last `months` months.
    Each day reports total P&L, trade count, and per-trade win rate.
    Also returns weekly aggregates and per-month meta for rendering a calendar grid.
    """
    if not processed_data["file_loaded"]:
        raise HTTPException(status_code=400, detail="No data loaded. Please upload a CSV file first.")

    df = processed_data["df"]

    if end_date:
        try:
            anchor = pd.to_datetime(end_date)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid end_date; expected YYYY-MM-DD")
    else:
        anchor = df['Buy Date'].max()

    months = max(1, min(int(months), 12))

    anchor_month_start = anchor.replace(day=1)
    start_month = anchor_month_start - pd.DateOffset(months=months - 1)
    next_month = anchor_month_start + pd.DateOffset(months=1)

    window_df = df[(df['Buy Date'] >= start_month) & (df['Buy Date'] < next_month)].copy()

    daily_groups = window_df.groupby(window_df['Buy Date'].dt.normalize())
    daily_summary = {}
    for day, group in daily_groups:
        pnl_series = group['P&L Amt (₹)']
        trades = int(len(group))
        wins = int((pnl_series > 0).sum())
        win_rate = round((wins / trades * 100), 2) if trades > 0 else 0.0
        daily_summary[day.strftime('%Y-%m-%d')] = {
            "pnl": round(float(pnl_series.sum()), 2),
            "trades": trades,
            "wins": wins,
            "win_rate": win_rate,
        }

    months_payload = []
    cursor = start_month
    while cursor < next_month:
        year = int(cursor.year)
        month = int(cursor.month)
        days_in_month = _calendar.monthrange(year, month)[1]

        days = []
        for d in range(1, days_in_month + 1):
            date = pd.Timestamp(year=year, month=month, day=d)
            key = date.strftime('%Y-%m-%d')
            entry = daily_summary.get(key)
            days.append({
                "date": key,
                "day": d,
                "weekday": int(date.weekday()),  # Monday=0..Sunday=6
                "pnl": entry["pnl"] if entry else None,
                "trades": entry["trades"] if entry else 0,
                "wins": entry["wins"] if entry else 0,
                "win_rate": entry["win_rate"] if entry else None,
            })

        # Weekly aggregates: group by ISO week within the month
        week_buckets = defaultdict(lambda: {"pnl": 0.0, "trades": 0, "wins": 0, "trading_days": 0, "dates": []})
        for d_entry in days:
            if d_entry["pnl"] is None:
                continue
            week_no = pd.Timestamp(d_entry["date"]).isocalendar().week
            bucket = week_buckets[int(week_no)]
            bucket["pnl"] += d_entry["pnl"]
            bucket["trades"] += d_entry["trades"]
            bucket["wins"] += d_entry["wins"]
            bucket["trading_days"] += 1
            bucket["dates"].append(d_entry["date"])

        # Order weeks as they appear in the month (by row index)
        first_weekday = pd.Timestamp(year=year, month=month, day=1).weekday()
        weeks = []
        # Build week index for each day so we can label them Week 1, 2, ...
        week_index_map = {}
        for d_entry in days:
            row = (first_weekday + d_entry["day"] - 1) // 7
            week_index_map.setdefault(row, []).append(d_entry)

        for row_idx in sorted(week_index_map.keys()):
            row_days = week_index_map[row_idx]
            row_pnl = sum((d["pnl"] or 0) for d in row_days)
            row_trades = sum(d["trades"] for d in row_days)
            row_wins = sum(d["wins"] for d in row_days)
            row_trading_days = sum(1 for d in row_days if d["pnl"] is not None)
            weeks.append({
                "week_number": row_idx + 1,
                "pnl": round(float(row_pnl), 2),
                "trades": row_trades,
                "wins": row_wins,
                "trading_days": row_trading_days,
                "win_rate": round((row_wins / row_trades * 100), 2) if row_trades > 0 else None,
            })

        month_pnl = sum((d["pnl"] or 0) for d in days)
        month_trades = sum(d["trades"] for d in days)
        month_wins = sum(d["wins"] for d in days)
        month_trading_days = sum(1 for d in days if d["pnl"] is not None)

        months_payload.append({
            "year": year,
            "month": month,
            "month_name": _calendar.month_name[month],
            "first_weekday": first_weekday,  # Monday=0..Sunday=6
            "days_in_month": days_in_month,
            "days": days,
            "weeks": weeks,
            "summary": {
                "pnl": round(float(month_pnl), 2),
                "trades": month_trades,
                "wins": month_wins,
                "trading_days": month_trading_days,
                "win_rate": round((month_wins / month_trades * 100), 2) if month_trades > 0 else None,
            },
        })

        cursor = (cursor + pd.DateOffset(months=1)).replace(day=1)

    return {
        "range": {
            "start": start_month.strftime('%Y-%m-%d'),
            "end": (next_month - pd.Timedelta(days=1)).strftime('%Y-%m-%d'),
        },
        "months": months_payload,
    }


@app.get("/raw-data")
async def get_raw_data(limit: Optional[int] = 100):
    """
    Get raw dataframe data (first N rows)
    """
    if not processed_data["file_loaded"]:
        raise HTTPException(status_code=400, detail="No data loaded. Please upload a CSV file first.")

    df = processed_data["df"]

    # Convert to list of dictionaries
    if limit:
        data_df = df.head(limit)
    else:
        data_df = df

    return {
        "total_records": len(df),
        "returned_records": len(data_df),
        "data": data_df.to_dict(orient='records')
    }


@app.get("/summary")
async def get_summary():
    """
    Get overall summary of loaded data
    """
    if not processed_data["file_loaded"]:
        raise HTTPException(status_code=400, detail="No data loaded. Please upload a CSV file first.")

    df = processed_data["df"]
    pivot_df = processed_data["pivot_df"]

    return {
        "file_status": "loaded",
        "total_records": len(df),
        "total_days": len(pivot_df),
        "date_range": {
            "start": df['Buy Date'].min().strftime('%Y-%m-%d'),
            "end": df['Buy Date'].max().strftime('%Y-%m-%d')
        },
        "columns": list(df.columns),
        "available_endpoints": [
            "/upload",
            "/statistics",
            "/pivot-data",
            "/distribution-data",
            "/top-days",
            "/calendar-data",
            "/raw-data",
            "/summary"
        ]
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "data_loaded": processed_data["file_loaded"]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
