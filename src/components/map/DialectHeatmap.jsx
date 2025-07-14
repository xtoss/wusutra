
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DialectRecord } from "@/api/entities";
import { Globe, MapPin, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// 中国主要方言区域坐标映射
const DIALECT_REGIONS = {
  "江阴话": { name: "江阴", lat: 31.9, lng: 120.3, province: "江苏" },
  "南京话": { name: "南京", lat: 32.1, lng: 118.8, province: "江苏" },
  "六合话": { name: "六合", lat: 32.35, lng: 118.83, province: "江苏" },
  "合肥话": { name: "合肥", lat: 31.8, lng: 117.2, province: "安徽" },
  "上海话": { name: "上海", lat: 31.2, lng: 121.5, province: "上海" },
  "苏州话": { name: "苏州", lat: 31.3, lng: 120.6, province: "江苏" },
  "南通话": { name: "南通", lat: 32.0, lng: 120.9, province: "江苏" },
  "常州话": { name: "常州", lat: 31.8, lng: 119.9, province: "江苏" },
  "温州话": { name: "温州", lat: 28.0, lng: 120.7, province: "浙江" },
  "宁波话": { name: "宁波", lat: 29.9, lng: 121.5, province: "浙江" },
  "台州话": { name: "台州", lat: 28.7, lng: 121.4, province: "浙江" },
  "北京话": { name: "北京", lat: 39.9, lng: 116.4, province: "北京" },
  "成都话": { name: "成都", lat: 30.7, lng: 104.1, province: "四川" }
  // “其他” 不设具体坐标，建议在使用时特殊处理
};

export default function DialectHeatmap() {
  const [dialectStats, setDialectStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDialectStats();
  }, []);

  const loadDialectStats = async () => {
    try {
      const recordings = await DialectRecord.list('-created_date', 500);
      
      // 统计各方言的录音数量
      const stats = {};
      recordings.forEach(record => {
        if (record.dialect && DIALECT_REGIONS[record.dialect]) {
          if (!stats[record.dialect]) {
            stats[record.dialect] = {
              count: 0,
              region: DIALECT_REGIONS[record.dialect],
              recentCount: 0
            };
          }
          stats[record.dialect].count++;
          
          // 统计最近7天的录音
          const recordDate = new Date(record.created_date);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          if (recordDate >= weekAgo) {
            stats[record.dialect].recentCount++;
          }
        }
      });
      
      setDialectStats(stats);
    } catch (error) {
      console.error("Error loading dialect stats:", error);
      toast.error("加载方言统计失败");
    }
    setIsLoading(false);
  };

  const getHeatColor = (count) => {
    if (count > 200) return '#b91c1c'; // red-800
    if (count > 100) return '#ea580c'; // orange-600
    if (count > 50) return '#f97316';  // orange-500
    if (count > 10) return '#fbbf24';  // amber-400
    if (count > 0) return '#a3e635';   // lime-400
    return '#d1d5db'; // gray-300
  };

  const getRadius = (count) => {
    if (count > 200) return 30;
    if (count > 100) return 25;
    if (count > 50) return 20;
    if (count > 10) return 15;
    if (count > 0) return 10;
    return 5;
  };

  const totalRecordings = Object.values(dialectStats).reduce((sum, stat) => sum + stat.count, 0);
  const activeRegions = Object.keys(dialectStats).length;

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <Globe className="w-5 h-5" />
            方言贡献地图
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-orange-200 rounded-lg"></div>
            <div className="grid grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-orange-100 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-orange-900">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            方言贡献地图
          </div>
          <div className="flex gap-2">
            <Badge className="bg-orange-100 text-orange-800">
              {activeRegions} 个地区
            </Badge>
            <Badge className="bg-green-100 text-green-800">
              {totalRecordings} 条录音
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full bg-gray-200 rounded-lg overflow-hidden">
          <MapContainer center={[34.0, 108.9]} zoom={4} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {Object.entries(dialectStats).map(([dialect, stat]) => (
              <CircleMarker
                key={dialect}
                center={[stat.region.lat, stat.region.lng]}
                pathOptions={{ 
                  color: getHeatColor(stat.count),
                  fillColor: getHeatColor(stat.count), 
                  fillOpacity: 0.7 
                }}
                radius={getRadius(stat.count)}
              >
                <Popup>
                  <div className="font-sans">
                    <h4 className="font-bold text-base mb-1">{stat.region.name} ({dialect})</h4>
                    <p>总贡献: <span className="font-bold">{stat.count}</span> 条</p>
                    <p>本周新增: <span className="font-bold">{stat.recentCount}</span> 条</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}
