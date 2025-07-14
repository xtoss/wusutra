
import React, { useState, useEffect } from "react";
import { LeaderboardEntry, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, Crown, TrendingUp, UserPlus, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { DIALECTS } from "../components/lib/dialects";
import { toast } from "react-hot-toast"; // Added toast import

export default function Leaderboard() {
  const [totalRankings, setTotalRankings] = useState([]);
  const [todayRankings, setTodayRankings] = useState([]);
  const [levelRankings, setLevelRankings] = useState([]);
  const [dialectRankings, setDialectRankings] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    loadCurrentUser();
    loadLeaderboardData();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userData = await User.me();
      setCurrentUser(userData);
    } catch (error) {
      console.log("User not logged in");
    }
  };

  const loadLeaderboardData = async () => {
    try {
      console.log("🏆 Loading leaderboard data from LeaderboardEntry...");
      
      // Load all leaderboard entries
      const allEntries = await LeaderboardEntry.list('-last_updated', 100);
      
      // Filter out invalid guest entries
      const validEntries = allEntries.filter(entry => entry.user_id && !entry.user_id.startsWith('guest_'));
      console.log(`✅ Loaded ${allEntries.length} total entries, ${validEntries.length} are valid.`);
      
      if (validEntries.length === 0) {
        console.log("⚠️ No valid leaderboard entries found");
        setTotalRankings([]);
        setTodayRankings([]);
        setLevelRankings([]);
        setDialectRankings({});
        setIsLoading(false);
        return;
      }
      
      // Get last update time from the first valid entry
      setLastUpdate(validEntries[0]?.last_updated);
      
      // Filter and sort for total rankings using valid entries
      const totalRanked = validEntries
        .filter(entry => entry.rank_total && entry.total_recordings > 0)
        .sort((a, b) => a.rank_total - b.rank_total)
        .slice(0, 10);
      
      console.log(`🏆 Total rankings: ${totalRanked.length} users`);
      setTotalRankings(totalRanked);
      
      // Filter and sort for today rankings using valid entries
      const todayRanked = validEntries
        .filter(entry => entry.rank_today && entry.today_recordings > 0)
        .sort((a, b) => a.rank_today - b.rank_today)
        .slice(0, 10);
      
      console.log(`📅 Today rankings: ${todayRanked.length} users`);
      setTodayRankings(todayRanked);

      // Create level rankings
      const levelRanked = validEntries
        .filter(entry => entry.user_level && entry.user_level > 1)
        .sort((a, b) => (b.user_level - a.user_level) || (b.total_xp - a.total_xp))
        .slice(0, 20);
      
      console.log(`⭐ Level rankings: ${levelRanked.length} users`);
      setLevelRankings(levelRanked);

      // Create dialect-based rankings (simulated for now)
      const dialectRanks = {};
      DIALECTS.forEach(dialect => {
        // For now, we'll use a subset of total rankings for each dialect
        // In a real implementation, this would be based on actual dialect-specific data
        dialectRanks[dialect] = validEntries
          .filter(entry => entry.total_recordings > 0 && entry.dialect === dialect) // Filter by dialect
          .sort((a, b) => b.total_recordings - a.total_recordings)
          .slice(0, 5);
      });
      setDialectRankings(dialectRanks);
      
    } catch (error) {
      console.error("❌ Error loading leaderboard:", error);
    }
    setIsLoading(false);
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return <Crown className="w-6 h-6 text-yellow-500" />;
      case 1: return <Trophy className="w-6 h-6 text-gray-400" />;
      case 2: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <Medal className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRankColor = (index) => {
    switch (index) {
      case 0: return "from-yellow-400 to-amber-500";
      case 1: return "from-gray-300 to-gray-400";
      case 2: return "from-amber-400 to-orange-500";
      default: return "from-blue-400 to-indigo-500";
    }
  };

  const UserCard = ({ entry, index, showTodayCount = false, showLevel = false }) => (
    <Link to={createPageUrl(`PublicProfile?userId=${entry.user_id}`)}>
      <Card className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-0 bg-gradient-to-r ${getRankColor(index)} text-white`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {showLevel ? (
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold">{entry.user_level}</span>
                </div>
              ) : (
                <>
                  {getRankIcon(index)}
                  <span className="text-2xl font-bold">
                    #{showTodayCount ? entry.rank_today : entry.rank_total}
                  </span>
                </>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate">
                {entry.user_name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-white/20 text-white border-white/30">
                  等级 {entry.user_level}
                </Badge>
                {showLevel ? (
                  <span className="text-sm opacity-90">
                    {entry.total_xp} XP
                  </span>
                ) : (
                  <span className="text-sm opacity-90">
                    {showTodayCount 
                      ? `今日 ${entry.today_recordings} 录音` 
                      : `总计 ${entry.total_recordings} 录音`
                    }
                  </span>
                )}
              </div>
              {entry.current_streak > 0 && (
                <div className="text-xs opacity-75 mt-1">
                  连续 {entry.current_streak} 天
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const handleLogin = async () => {
    try {
      await User.login();
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("登录跳转失败，请重试。");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-purple-200 rounded w-1/3 mx-auto"></div>
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-purple-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-purple-900 mb-2">
            🏆 贡献排行榜
          </h1>
          
          {lastUpdate && (
            <div className="mt-4">
              <span className="text-sm text-purple-600">
                最后更新: {new Date(lastUpdate).toLocaleString('zh-CN')}
              </span>
            </div>
          )}
        </motion.div>

        {!currentUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-800">加入我们!</h3>
                <p className="text-sm text-blue-700">登录后开始录音，你也可以出现在排行榜上</p>
              </div>
              <Button
                onClick={handleLogin}
                className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                立即登录
              </Button>
            </div>
          </motion.div>
        )}

        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border border-purple-200">
            <TabsTrigger value="today" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              今日活跃榜
            </TabsTrigger>
            <TabsTrigger value="level" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              等级排行榜
            </TabsTrigger>
            <TabsTrigger value="total" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              总贡献榜
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {todayRankings.length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
                  <CardContent className="text-center py-12">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">今日暂无活跃用户</h3>
                    <p className="text-gray-500">成为今天第一个录音的用户！</p>
                    <Button
                      onClick={() => window.location.href = createPageUrl("Record")}
                      className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      立即录音
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                todayRankings.map((entry, index) => (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <UserCard entry={entry} index={index} showTodayCount={true} />
                  </motion.div>
                ))
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="level">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {levelRankings.length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
                  <CardContent className="text-center py-12">
                    <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">暂无等级排行数据</h3>
                    <p className="text-gray-500">积极录音提升等级吧！</p>
                    <Button
                      onClick={() => window.location.href = createPageUrl("Record")}
                      className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      开始录音
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                levelRankings.map((entry, index) => (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <UserCard entry={entry} index={index} showLevel={true} />
                  </motion.div>
                ))
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="total">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-white/60 backdrop-blur-sm">
                  <TabsTrigger value="all">全部方言</TabsTrigger>
                  <TabsTrigger value="粤语">粤语</TabsTrigger>
                  <TabsTrigger value="上海话">上海话</TabsTrigger>
                  <TabsTrigger value="江阴话">江阴话</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {totalRankings.slice(0, 10).map((entry, index) => (
                    <motion.div
                      key={entry.user_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <UserCard entry={entry} index={index} />
                    </motion.div>
                  ))}
                  {totalRankings.length === 0 && (
                    <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
                      <CardContent className="text-center py-12">
                        <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-700 mb-2">暂无排行数据</h3>
                        <p className="text-gray-500">排行榜数据需要管理员更新</p>
                        <Button
                          onClick={() => window.location.href = createPageUrl("Record")}
                          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          开始录音
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Explicitly map for these dialects to match TabsTrigger values */}
                {["粤语", "上海话", "江阴话"].map(dialect => (
                  <TabsContent key={dialect} value={dialect} className="space-y-4">
                    {dialectRankings[dialect]?.slice(0, 5).map((entry, index) => (
                      <motion.div
                        key={entry.user_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <UserCard entry={entry} index={index} />
                      </motion.div>
                    )) || (
                      <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
                        <CardContent className="text-center py-12">
                          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-medium text-gray-700 mb-2">暂无{dialect}排行数据</h3>
                          <p className="text-gray-500">成为第一个录制{dialect}的用户！</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
