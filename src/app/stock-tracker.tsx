"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

type Stock = {
  id: string;
  stockName: string;
  purchasePrice: string;
  purchaseDate: string;
  timestamp: string;
};

export default function StocksTracker() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [currentStock, setCurrentStock] = useState<Partial<Stock>>({});
  const [currentDateTime, setCurrentDateTime] = useState("");

  useEffect(() => {
    const savedStocks = localStorage.getItem("stocksData");
    if (savedStocks) {
      setStocks(JSON.parse(savedStocks));
    }

    const updateDateTime = () => {
      const now = new Date();
      setCurrentDateTime(now.toLocaleString());
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("stocksData", JSON.stringify(stocks));
  }, [stocks]);

  const checkAlerts = useCallback(() => {
    stocks.forEach((stock) => {
      const days90 = calculateDaysRemaining(stock.purchaseDate, 90);
      const days180 = calculateDaysRemaining(stock.purchaseDate, 180);

      if (days90 === 0) {
        alert(`90 days have passed for ${stock.stockName}!`);
      }
      if (days180 === 0) {
        alert(`180 days have passed for ${stock.stockName}!`);
      }
    });
  }, [stocks]);

  useEffect(() => {
    const dailyCheck = setInterval(checkAlerts, 24 * 60 * 60 * 1000); // Check every 24 hours
    return () => clearInterval(dailyCheck);
  }, [checkAlerts]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentStock({ ...currentStock, [e.target.name]: e.target.value });
  };

  const calculateDaysRemaining = (purchaseDate: string, days: number) => {
    const purchase = new Date(purchaseDate);
    const target = new Date(purchase.getTime() + days * 24 * 60 * 60 * 1000);
    const now = new Date();
    const remaining = Math.ceil(
      (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return remaining > 0 ? remaining : 0;
  };

  const calculateProfitTargets = (price: string) => {
    const basePrice = Number.parseFloat(price);
    if (isNaN(basePrice)) return { target20: "0.00", target30: "0.00" };

    const target20 = (basePrice * 1.2).toFixed(2);
    const target30 = (basePrice * 1.4).toFixed(2);
    return { target20, target30 };
  };

  const createNewStock = () => {
    if (
      !currentStock.stockName ||
      !currentStock.purchasePrice ||
      !currentStock.purchaseDate
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const newStock: Stock = {
      ...(currentStock as Stock),
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
    };

    setStocks((prevStocks) => [...prevStocks, newStock]);
    setCurrentStock({});
  };

  const deleteAllStocks = () => {
    setStocks([]);
    localStorage.removeItem("stocksData");
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">StocksApp</h1>
        <p className="text-center mb-6 text-gray-600 dark:text-gray-400">
          {currentDateTime}
        </p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>New Stock Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stockName">Stock Name</Label>
                <Input
                  id="stockName"
                  name="stockName"
                  placeholder="Enter stock name"
                  value={currentStock.stockName || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <Input
                  id="purchasePrice"
                  name="purchasePrice"
                  type="number"
                  placeholder="Enter purchase price"
                  value={currentStock.purchasePrice || ""}
                  onChange={handleInputChange}
                />
                {currentStock.purchasePrice && (
                  <div className="text-sm text-muted-foreground mt-2">
                    <p>
                      20% Profit Target: $
                      {
                        calculateProfitTargets(currentStock.purchasePrice)
                          .target20
                      }
                    </p>
                    <p>
                      30% Profit Target: $
                      {
                        calculateProfitTargets(currentStock.purchasePrice)
                          .target30
                      }
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  name="purchaseDate"
                  type="date"
                  value={currentStock.purchaseDate || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <Button onClick={createNewStock} className="mt-6 w-full">
              Add New Stock
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stocks.map((stock) => {
            const days90 = calculateDaysRemaining(stock.purchaseDate, 90);
            const days180 = calculateDaysRemaining(stock.purchaseDate, 180);
            const { target20, target30 } = calculateProfitTargets(
              stock.purchasePrice
            );

            return (
              <Card key={stock.id} className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg">{stock.stockName}</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {stock.timestamp}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>
                      <strong>Purchase Price:</strong> ${stock.purchasePrice}
                    </p>
                    <p>
                      <strong>Purchase Date:</strong>{" "}
                      {new Date(stock.purchaseDate).toLocaleDateString()}
                    </p>

                    {days90 <= 5 && days90 > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>90 Days Alert</AlertTitle>
                        <AlertDescription>
                          Only {days90} days remaining until 90-day mark
                        </AlertDescription>
                      </Alert>
                    )}

                    {days180 <= 5 && days180 > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>180 Days Alert</AlertTitle>
                        <AlertDescription>
                          Only {days180} days remaining until 180-day mark
                        </AlertDescription>
                      </Alert>
                    )}

                    <p>
                      <strong>90 Days Counter:</strong> {days90} days remaining
                    </p>
                    <p>
                      <strong>180 Days Counter:</strong> {days180} days
                      remaining
                    </p>
                    <p className="hover:scale-105 bg-black text-white lg-rounded">
                      <strong>20% Target:</strong> <strong> ${target20}</strong>
                    </p>
                    <p>
                      <strong>40% Target:</strong> <strong>${target30} </strong>
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {stocks.length > 0 && (
          <div className="mt-8 text-center">
            <Button onClick={deleteAllStocks} variant="destructive">
              Clear All Stocks
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
