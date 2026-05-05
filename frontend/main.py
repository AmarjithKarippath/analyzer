from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
import io
from typing import Optional
from datetime import datetime
import json

app = FastAPI(title="P&L Report API", version="1.0.0")

# Global variable to store the processed dataframe
processed_data = {
    "df": None,
    "pivot_df": None,
    "file_loaded": False
}


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
        df['Buy Date'] = pd.to_datetime(df['Buy Date'], format='%d %m %y')

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
async def get_statistics():
    """
    Get all calculated P&L statistics (all print data as JSON)
    """
    if not processed_data["file_loaded"]:
        raise HTTPException(status_code=400, detail="No data loaded. Please upload a CSV file first.")

    df = processed_data["df"]
    pivot_df = processed_data["pivot_df"]

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
async def get_pivot_data():
    """
    Get pivot table data (for line plot visualization)
    """
    if not processed_data["file_loaded"]:
        raise HTTPException(status_code=400, detail="No data loaded. Please upload a CSV file first.")

    pivot_df = processed_data["pivot_df"]

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
async def get_distribution_data(bins: int = 20):
    """
    Get histogram distribution data (daily P&L distribution)
    """
    if not processed_data["file_loaded"]:
        raise HTTPException(status_code=400, detail="No data loaded. Please upload a CSV file first.")

    pivot_df = processed_data["pivot_df"]
    pnl_values = pivot_df['P&L Amt (₹)'].values

    # Create histogram
    counts, bin_edges = pd.cut(pnl_values, bins=bins, retbins=True, include_lowest=True)
    distribution = counts.value_counts().sort_index()

    # Format distribution data
    data = []
    for i in range(len(bin_edges) - 1):
        bin_label = f"{bin_edges[i]:.2f} to {bin_edges[i+1]:.2f}"
        count = int(distribution[pd.Interval(bin_edges[i], bin_edges[i+1])]) if pd.Interval(bin_edges[i], bin_edges[i+1]) in distribution.index else 0
        data.append({
            "bin": bin_label,
            "bin_start": round(float(bin_edges[i]), 2),
            "bin_end": round(float(bin_edges[i+1]), 2),
            "frequency": count
        })

    return {
        "total_records": len(pnl_values),
        "bins": bins,
        "distribution": data
    }


@app.get("/top-days")
async def get_top_days(top_n: int = 5):
    """
    Get top profitable and loss-making days
    """
    if not processed_data["file_loaded"]:
        raise HTTPException(status_code=400, detail="No data loaded. Please upload a CSV file first.")

    pivot_df = processed_data["pivot_df"]

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
