import React, { useState, useEffect } from "react";
import { User, DialectRecord, LeaderboardEntry } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trophy, Clock, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function LeaderboardManager() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [stats, setStats] = useState({
    totalEntries: 0,
    lastUpdate: null
  });

  useEffect(() => {
    loadStats();
    
    // Auto-refresh every 30 seconds if enabled
    let interval = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        updateLeaderboard();
      }, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadStats = async () => {
    try {
      const entries = await LeaderboardEntry.list('-last_updated', 1);
      setStats({
        totalEntries: entries.length,
        lastUpdate: entries.length > 0 ? entries[0].last_updated : null
      });
    } catch (error) {
      console.error("Error loading leaderboard stats:", error);
    }
  };

  const updateLeaderboard = async () => {
    setIsUpdating(true);
    try {
      console.log("🔄 Starting leaderboard update...");
      
      // Step 1: Get all users
      const allUsers = await User.list('-total_recordings', 500);
      console.log(`📊 Loaded ${allUsers.length} users`);
      
      // Step 2: Get today's recordings
      const today = new Date().toISOString().split('T')[0];
      const allRecordings = await DialectRecord.list('-created_date', 1000);
      
      // Calculate today's stats
      const todayStats = {};
      allRecordings.forEach(record => {
        const recordDate = new Date(record.created_date).toISOString().split('T')[0];
        if (recordDate === today && record.user_id) {
          todayStats[record.user_id] = (todayStats[record.user_id] || 0) + 1;
        }
      });
      
      console.log(`📅 Found ${Object.keys(todayStats).length} users with recordings today`);
      
      // Step 3: Filter valid users for leaderboard
      const validUsers = allUsers.filter(user => 
        !user.is_anonymous && (user.total_recordings || 0) > 0
      );
      
      // Step 4: Sort and rank users
      const sortedByTotal = [...validUsers].sort((a, b) => (b.total_recordings || 0) - (a.total_recordings || 0));
      const sortedByLevel = [...validUsers].sort((a, b) => (b.level || 1) - (a.level || 1) || (b.total_xp || 0) - (a.total_xp || 0));
      const todayUsers = validUsers
        .filter(user => todayStats[user.id] > 0)
        .sort((a, b) => (todayStats[b.id] || 0) - (todayStats[a.id] || 0));
      
      console.log(`🏆 Total leaderboard: ${sortedByTotal.length} users`);
      console.log(`📅 Today leaderboard: ${todayUsers.length} users`);
      console.log(`⭐ Level leaderboard: ${sortedByLevel.length} users`);
      
      // Step 5: Clear old entries
      const oldEntries = await LeaderboardEntry.list();
      for (const entry of oldEntries) {
        await LeaderboardEntry.delete(entry.id);
      }
      console.log(`🗑️ Cleared ${oldEntries.length} old entries`);
      
      // Step 6: Create new entries
      const newEntries = [];
      const processedUsers = new Set();
      
      // Add users from total ranking
      sortedByTotal.forEach((user, index) => {
        if (index < 50) { // Top 50 only
          newEntries.push({
            user_id: user.id,
            user_name: user.display_name || user.full_name || user.email,
            user_email: user.email,
            user_level: user.level || 1,
            total_recordings: user.total_recordings || 0,
            total_xp: user.total_xp || 0,
            today_recordings: todayStats[user.id] || 0,
            current_streak: user.current_streak || 0,
            is_anonymous: user.is_anonymous || false,
            rank_total: index + 1,
            rank_today: todayUsers.findIndex(u => u.id === user.id) + 1 || null,
            last_updated: new Date().toISOString()
          });
          processedUsers.add(user.id);
        }
      });
      
      // Add users from today ranking if not already included
      todayUsers.forEach((user, index) => {
        if (index < 20 && !processedUsers.has(user.id)) { // Top 20 today
          const totalRank = sortedByTotal.findIndex(u => u.id === user.id) + 1;
          newEntries.push({
            user_id: user.id,
            user_name: user.display_name || user.full_name || user.email,
            user_email: user.email,
            user_level: user.level || 1,
            total_recordings: user.total_recordings || 0,
            total_xp: user.total_xp || 0,
            today_recordings: todayStats[user.id] || 0,
            current_streak: user.current_streak || 0,
            is_anonymous: user.is_anonymous || false,
            rank_total: totalRank || null,
            rank_today: index + 1,
            last_updated: new Date().toISOString()
          });
          processedUsers.add(user.id);
        }
      });

      // Add users from level ranking if not already included
      sortedByLevel.forEach((user, index) => {
        if (index < 30 && !processedUsers.has(user.id)) { // Top 30 by level
          const totalRank = sortedByTotal.findIndex(u => u.id === user.id) + 1;
          const todayRank = todayUsers.findIndex(u => u.id === user.id) + 1;
          newEntries.push({
            user_id: user.id,
            user_name: user.display_name || user.full_name || user.email,
            user_email: user.email,
            user_level: user.level || 1,
            total_recordings: user.total_recordings || 0,
            total_xp: user.total_xp || 0,
            today_recordings: todayStats[user.id] || 0,
            current_streak: user.current_streak || 0,
            is_anonymous: user.is_anonymous || false,
            rank_total: totalRank || null,
            rank_today: todayRank || null,
            last_updated: new Date().toISOString()
          });
        }
      });
      
      // Bulk create new entries
      for (const entry of newEntries) {
        await LeaderboardEntry.create(entry);
      }
      
      console.log(`✅ Created ${newEntries.length} leaderboard entries`);
      
      setLastUpdateTime(new Date());
      await loadStats();
      
      toast.success(`排行榜更新完成！处理了 ${newEntries.length} 个条目`);
      
    } catch (error) {
      console.error("❌ Error updating leaderboard:", error);
      toast.error("更新排行榜失败: " + error.message);
    }
    setIsUpdating(false);
  };

  return (
    <Card className="bg-white border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Trophy className="w-5 h-5" />
          排行榜管理
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">排行榜条目</span>
            </div>
            <p className="text-xl font-bold text-blue-900">{stats.totalEntries}</p>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">最后更新</span>
            </div>
            <p className="text-sm text-green-700">
              {stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleString('zh-CN') : '从未更新'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={updateLeaderboard}
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                更新中...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                立即更新
              </>
            )}
          </Button>
          
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            className={autoRefresh ? "bg-green-600 hover:bg-green-700 text-white" : ""}
          >
            {autoRefresh ? "停止自动刷新" : "启用自动刷新"}
          </Button>
        </div>

        {autoRefresh && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                自动刷新已启用，每30秒更新一次排行榜数据
              </span>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• 排行榜包含总录音数前50名、今日录音数前20名和等级前30名</p>
          <p>• 建议定期更新以保持数据准确性</p>
        </div>
      </CardContent>
    </Card>
  );
}