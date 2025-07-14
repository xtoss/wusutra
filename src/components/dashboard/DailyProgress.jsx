import React, { useState, useEffect } from "react";
import { DialectRecord } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Flame, TrendingUp } from "lucide-react";

export default function DailyProgress({ user }) {
  const [todaysRecordings, setTodaysRecordings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const dailyTarget = 3;

  const loadTodaysRecordings = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Get all recordings from today
      const today = new Date().toISOString().split('T')[0];
      const allRecordings = await DialectRecord.list('-created_date', 200);
      
      // Filter recordings for today and current user
      const todayUserRecordings = allRecordings.filter(recording => {
        const recordingDate = new Date(recording.created_date).toISOString().split('T')[0];
        return recordingDate === today && recording.user_id === user.id;
      });
      
      setTodaysRecordings(todayUserRecordings);
      console.log(`Found ${todayUserRecordings.length} recordings for today for user ${user.id}`);
    } catch (error) {
      console.error("Error loading today's recordings:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadTodaysRecordings();
  }, [user]);

  useEffect(() => {
    const handleStatsUpdate = () => {
      console.log("Stats update event received, reloading today's recordings");
      loadTodaysRecordings();
    };

    const handleRecordingAdded = () => {
      console.log("Recording added event received, reloading today's recordings");
      loadTodaysRecordings();
    };

    window.addEventListener('statsUpdated', handleStatsUpdate);
    window.addEventListener('recordingAdded', handleRecordingAdded);

    return () => {
      window.removeEventListener('statsUpdated', handleStatsUpdate);
      window.removeEventListener('recordingAdded', handleRecordingAdded);
    };
  }, [user]);

  const progressPercentage = todaysRecordings.length > 0 ? Math.min((todaysRecordings.length / dailyTarget) * 100, 100) : 0;
  const remainingRecordings = Math.max(0, dailyTarget - todaysRecordings.length);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-orange-400 to-amber-500 text-white border-0 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6" />
              今日进度
            </div>
            <div className="animate-pulse bg-white/20 h-6 w-12 rounded"></div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse bg-white/20 h-2 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-orange-400 to-amber-500 text-white border-0 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6" />
            今日进度
          </div>
          <Badge className="bg-white/20 text-white border-white/30">
            {todaysRecordings.length}/{dailyTarget}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>完成度</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="bg-white/20 [&>div]:bg-white"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-sm">连续天数</span>
            </div>
            <p className="text-2xl font-bold">{user?.current_streak || 0}</p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">总积分</span>
            </div>
            <p className="text-2xl font-bold">{user?.total_xp || 0}</p>
          </div>
        </div>
        
        {remainingRecordings > 0 ? (
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-sm opacity-90">
              还需录制 <span className="font-bold">{remainingRecordings}</span> 条语音完成今日目标
            </p>
          </div>
        ) : (
          <div className="bg-green-500/20 rounded-lg p-3 text-center border border-green-400/30">
            <p className="text-sm font-medium">
              🎉 今日目标已完成！继续加油！
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}