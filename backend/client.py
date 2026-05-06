"""
Python client for P&L Report API
Simplifies interaction with the FastAPI backend
"""

import requests
from typing import Optional, Dict, Any
import json


class PnLReportClient:
    """Client for P&L Report API"""

    def __init__(self, base_url: str = "http://localhost:8001"):
        """
        Initialize the client

        Args:
            base_url: Base URL of the API server
        """
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()

    def upload_csv(self, file_path: str) -> Dict[str, Any]:
        """
        Upload a CSV file for processing

        Args:
            file_path: Path to the CSV file

        Returns:
            Response containing upload status
        """
        with open(file_path, 'rb') as f:
            files = {'file': f}
            response = self.session.post(f"{self.base_url}/upload", files=files)
            response.raise_for_status()
            return response.json()

    def get_statistics(self) -> Dict[str, Any]:
        """
        Get all calculated P&L statistics

        Returns:
            Dictionary containing daily metrics, trade metrics, and summary
        """
        response = self.session.get(f"{self.base_url}/statistics")
        response.raise_for_status()
        return response.json()

    def get_pivot_data(self) -> Dict[str, Any]:
        """
        Get daily P&L pivot table data

        Returns:
            Dictionary containing daily P&L aggregated data
        """
        response = self.session.get(f"{self.base_url}/pivot-data")
        response.raise_for_status()
        return response.json()

    def get_distribution_data(self, bins: int = 20) -> Dict[str, Any]:
        """
        Get histogram distribution data

        Args:
            bins: Number of bins for histogram

        Returns:
            Dictionary containing distribution data
        """
        response = self.session.get(
            f"{self.base_url}/distribution-data",
            params={'bins': bins}
        )
        response.raise_for_status()
        return response.json()

    def get_top_days(self, top_n: int = 5) -> Dict[str, Any]:
        """
        Get top profitable and loss-making days

        Args:
            top_n: Number of top days to return

        Returns:
            Dictionary containing top profitable and loss days
        """
        response = self.session.get(
            f"{self.base_url}/top-days",
            params={'top_n': top_n}
        )
        response.raise_for_status()
        return response.json()

    def get_raw_data(self, limit: Optional[int] = 100) -> Dict[str, Any]:
        """
        Get raw dataframe records

        Args:
            limit: Number of records to return (None for all)

        Returns:
            Dictionary containing raw data
        """
        params = {}
        if limit is not None:
            params['limit'] = limit

        response = self.session.get(
            f"{self.base_url}/raw-data",
            params=params
        )
        response.raise_for_status()
        return response.json()

    def get_summary(self) -> Dict[str, Any]:
        """
        Get overall summary of loaded data

        Returns:
            Dictionary containing data summary and metadata
        """
        response = self.session.get(f"{self.base_url}/summary")
        response.raise_for_status()
        return response.json()

    def health_check(self) -> Dict[str, Any]:
        """
        Check if API is healthy and has data loaded

        Returns:
            Dictionary containing health status
        """
        response = self.session.get(f"{self.base_url}/health")
        response.raise_for_status()
        return response.json()

    def print_statistics(self) -> None:
        """Print all statistics in a formatted way"""
        try:
            stats = self.get_statistics()

            print("\n" + "="*60)
            print("P&L REPORT STATISTICS".center(60))
            print("="*60)

            print("\nDAILY METRICS:")
            print("-" * 60)
            daily = stats['daily_metrics']
            print(f"Total Profitable Days:      {daily['profitable_days']}")
            print(f"Total Loss Days:            {daily['loss_days']}")
            print(f"Total Traded Days:          {daily['total_traded_days']}")
            print(f"Maximum Profit Per Day:     ₹ {daily['max_profit_per_day']:.2f}")
            print(f"Maximum Loss Per Day:       ₹ {daily['max_loss_per_day']:.2f}")
            print(f"Average Profit Per Day:     ₹ {daily['average_profit_per_day']:.2f}")
            print(f"Average Loss Per Day:       ₹ {daily['average_loss_per_day']:.2f}")

            print("\nTRADE METRICS:")
            print("-" * 60)
            trades = stats['trade_metrics']
            print(f"Total Trades:               {trades['total_trades']}")
            print(f"Min Trades Per Day:         {trades['min_trades_per_day']}")
            print(f"Max Trades Per Day:         {trades['max_trades_per_day']}")
            print(f"Average Trades Per Day:     {trades['average_trades_per_day']:.2f}")

            print("\nSUMMARY:")
            print("-" * 60)
            summary = stats['summary']
            print(f"Total P&L:                  ₹ {summary['total_pnl']:.2f}")
            print(f"Win Rate:                   {summary['win_rate_percentage']:.2f}%")
            print(f"Profit Factor:              {summary['profit_factor']:.2f}")

            print("\n" + "="*60 + "\n")

        except Exception as e:
            print(f"Error fetching statistics: {e}")

    def print_top_days(self, top_n: int = 5) -> None:
        """Print top profitable and loss-making days"""
        try:
            data = self.get_top_days(top_n)

            print("\n" + "="*60)
            print(f"TOP {top_n} PROFITABLE DAYS".center(60))
            print("="*60)

            for i, day in enumerate(data['top_profitable_days']['data'], 1):
                print(f"{i}. {day['date']} → ₹ {day['pnl_amount']:.2f}")

            print("\n" + "="*60)
            print(f"TOP {top_n} LOSS-MAKING DAYS".center(60))
            print("="*60)

            for i, day in enumerate(data['top_loss_days']['data'], 1):
                print(f"{i}. {day['date']} → ₹ {day['pnl_amount']:.2f}")

            print("\n" + "="*60 + "\n")

        except Exception as e:
            print(f"Error fetching top days: {e}")


# Example usage
if __name__ == "__main__":
    # Initialize client
    client = PnLReportClient(base_url="http://localhost:8001")

    try:
        # Check health
        print("Checking API health...")
        health = client.health_check()
        print(f"API Status: {health['status']}")

        # Upload file
        print("\nUploading CSV file...")
        upload_result = client.upload_csv('pnl_report_v2.csv')
        print(f"Upload Status: {upload_result['status']}")
        print(f"Rows Loaded: {upload_result['rows_loaded']}")

        # Get and print statistics
        print("\nFetching statistics...")
        client.print_statistics()

        # Get and print top days
        print("Fetching top days...")
        client.print_top_days(top_n=5)

        # Get summary
        print("Getting data summary...")
        summary = client.get_summary()
        print(f"Total Records: {summary['total_records']}")
        print(f"Total Trading Days: {summary['total_days']}")
        print(f"Date Range: {summary['date_range']['start']} to {summary['date_range']['end']}")

        # Get pivot data
        print("\nFetching pivot data...")
        pivot = client.get_pivot_data()
        print(f"Total Daily Records: {pivot['total_records']}")
        print(f"First 3 days: {pivot['data'][:3]}")

        # Get distribution data
        print("\nFetching distribution data...")
        dist = client.get_distribution_data(bins=20)
        print(f"Bins: {dist['bins']}")
        print(f"Distribution records: {len(dist['distribution'])}")
        print(f"First 3 bins: {dist['distribution'][:3]}")

    except Exception as e:
        print(f"Error: {e}")
