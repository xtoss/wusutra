import React, { useState, useEffect } from "react";
import { DialectRecord } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Globe } from "lucide-react";

export default function DialectStats() {
  const [dialectStats, setDialectStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDialectStats();
  }, []);

  const loadDialectStats = async () => {
    try {
      const allRecordings = await DialectRecord.list('-created_date', 1000);
      const stats = {};
      
      allRecordings.forEach(record => {
        if (stats[record.dialect]) {
          stats[record.dialect]++;
        } else {
          stats[record.dialect] = 1;
        }
      });

      const sortedStats = Object.entries(stats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

      setDialectStats(sortedStats);
    } catch (error) {
      console.error("Error loading dialect stats:", error);
    }
    setIsLoading(false);
  };

  const totalRecordings = dialectStats.reduce((sum, [, count]) => sum + count, 0);
  const maxCount = dialectStats.length > 0 ? dialectStats[0][1] : 0;

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <BarChart3 className="w-5 h-5" />
          方言统计
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-orange-200 rounded w-1/2 mb-2"></div>
                <div className="h-2 bg-orange-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : dialectStats.length === 0 ? (
          <div className="text-center py-8 text-orange-600">
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无数据统计</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dialectStats.map(([dialect, count]) => (
              <div key={dialect} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-orange-900">{dialect}</span>
                  <span className="text-sm text-orange-600">{count} 条</span>
                </div>
                <Progress 
                  value={(count / maxCount) * 100} 
                  className="bg-orange-100 [&>div]:bg-gradient-to-r [&>div]:from-orange-400 [&>div]:to-amber-500"
                />
              </div>
            ))}
            <div className="pt-3 border-t border-orange-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-orange-600">总计录音</span>
                <span className="font-bold text-orange-900">{totalRecordings} 条</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}