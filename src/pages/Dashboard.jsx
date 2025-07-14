
import React, { useState, useEffect } from "react";
import { User, DialectRecord, Achievement } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mic,
  Trophy,
  Users,
  TrendingUp,
  Calendar,
  UserPlus,
  Chrome,
  ArrowRight,
  Map,
  Home, // New icon
  BarChart3, // New icon
  Award // New icon
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import DailyProgress from "../components/dashboard/DailyProgress";
import RecentRecordings from "../components/dashboard/RecentRecordings";
import AchievementBadges from "../components/dashboard/AchievementBadges";
import DialectStats from "../components/dashboard/DialectStats";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRecordings: 0,
    dialectCount: 0
  });

  const [isEmailLogging, setIsEmailLogging] = useState(false);

  useEffect(() => {
    loadUser();
    loadGlobalStats();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      if (error.response?.status !== 401 && !error.message?.includes('401')) {
        console.error("Error loading user:", error);
      } else {
        console.log("User not logged in, showing login options");
      }
      setUser(null);
    }
    setIsLoading(false);
  };

  const loadGlobalStats = async () => {
    try {
      const recordings = await DialectRecord.list('-created_date', 1000);
      const dialectSet = new Set(recordings.map(r => r.dialect).filter(Boolean));
      setStats(prev => ({
        ...prev,
        totalRecordings: recordings.length,
        dialectCount: dialectSet.size
      }));
    } catch (error) {
      if (error.response?.status !== 401 && !error.message?.includes('401')) {
        console.error("Error loading stats:", error);
        toast.error("加载统计数据失败，部分信息可能无法显示。");
      } else {
        console.log("Cannot load stats while not logged in, using defaults");
        setStats({
          totalRecordings: 0,
          dialectCount: 0
        });
      }
    }
  };

  const handleQuickExperience = async () => {
    setIsEmailLogging(true);
    try {
      await User.login();
    } catch (error) {
      console.error("❌ Login failed:", error);
      toast.error("跳转登录页面失败，请重试");
    }
    setIsEmailLogging(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-orange-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-orange-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-start justify-center p-4 pt-16">
        <div className="max-w-md w-full space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-orange-900 mb-2">无言</h1>
            <p className="text-orange-600 text-lg">让家乡的声音被世界听懂</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-orange-900 text-xl">🚀 极速匿名体验</CardTitle>
                <p className="text-orange-600 text-sm">
                  无需注册，一键开始录制方言
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleQuickExperience}
                  disabled={isEmailLogging}
                  className="w-full bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white shadow-lg text-lg py-6"
                  size="lg"
                >
                  {isEmailLogging ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      启动中...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-3" />
                      立即开始体验
                    </>
                  )}
                </Button>

                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-center">
                  <p className="text-xs text-blue-700">
                    可免费使用共享账号登录，下一页请输入以下信息：
                  </p>
                  <div className="mt-2 space-y-1">
                      <p className="text-sm font-mono text-blue-800 bg-blue-100 rounded px-2 py-1 inline-block">
                        email: guest@wusutra.com
                      </p>
                       <p className="text-sm font-mono text-blue-800 bg-blue-100 rounded px-2 py-1 inline-block">
                        password: 12341234
                      </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-4"
          >
            <Card className="bg-white/60 backdrop-blur-sm border-orange-200">
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-orange-600">{stats.totalRecordings}</div>
                <div className="text-xs text-orange-700">录音总数</div>
              </CardContent>
            </Card>
            <Card className="bg-white/60 backdrop-blur-sm border-orange-200">
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-orange-600">{stats.dialectCount}</div>
                <p className="text-xs text-orange-700">方言种类</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Desktop View */}
      <div className="hidden lg:block p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-orange-900 mb-2">
                  欢迎回来，{user.display_name || user.full_name || user.email}！
                </h1>
                <p className="text-orange-600 text-lg">
                  继续您的方言保护之旅
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8"
          >
            <Link to={createPageUrl("Record")}>
              <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-orange-900 mb-2">开始录音</h3>
                  <p className="text-sm text-orange-600">录制方言短语</p>
                </CardContent>
              </Card>
            </Link>

            <Link to={createPageUrl("Leaderboard")}>
              <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-orange-900 mb-2">排行榜</h3>
                  <p className="text-sm text-orange-600">查看贡献排名</p>
                </CardContent>
              </Card>
            </Link>

            <Link to={createPageUrl("RegionalMap")}>
              <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Map className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-orange-900 mb-2">方言地图</h3>
                  <p className="text-sm text-orange-600">探索方言分布</p>
                </CardContent>
              </Card>
            </Link>

            {/* Admin Page Entry - Restored */}
            {user?.is_admin && ( // Conditionally render if user has is_admin property
              <Link to={createPageUrl("Admin")}>
                <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-orange-900 mb-2">管理后台</h3>
                    <p className="text-sm text-orange-600">管理用户和数据</p>
                  </CardContent>
                </Card>
              </Link>
            )}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 space-y-6"
            >
              <DailyProgress user={user} />
              <RecentRecordings />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <AchievementBadges user={user} />
              <DialectStats />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-orange-900">
              欢迎, {user.display_name || user.full_name || user.email}!
            </h1>
            <p className="text-orange-600 text-sm">
              继续您的方言保护之旅
            </p>
          </div>

          <Tabs defaultValue="home" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur-sm border border-orange-200">
              <TabsTrigger value="home" className="flex-col h-auto py-2">
                <Home className="w-5 h-5 mb-1" />
                <span className="text-xs">主页</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex-col h-auto py-2">
                <TrendingUp className="w-5 h-5 mb-1" />
                <span className="text-xs">进度</span>
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex-col h-auto py-2">
                <Award className="w-5 h-5 mb-1" />
                <span className="text-xs">成就</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex-col h-auto py-2">
                <BarChart3 className="w-5 h-5 mb-1" />
                <span className="text-xs">统计</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="home" className="mt-4 space-y-4 pb-16">
              <Link to={createPageUrl("Record")}>
                <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-center"> <Mic className="w-5 h-5 text-white" /> </div>
                    <div> <h3 className="font-semibold text-orange-900">开始录音</h3> <p className="text-sm text-orange-600">录制方言短语</p> </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to={createPageUrl("Leaderboard")}>
                <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center"> <Trophy className="w-5 h-5 text-white" /> </div>
                    <div> <h3 className="font-semibold text-orange-900">排行榜</h3> <p className="text-sm text-orange-600">查看贡献排名</p> </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to={createPageUrl("RegionalMap")}>
                <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center"> <Map className="w-5 h-5 text-white" /> </div>
                    <div> <h3 className="font-semibold text-orange-900">方言地图</h3> <p className="text-sm text-orange-600">探索方言分布</p> </div>
                  </CardContent>
                </Card>
              </Link>
              {user?.is_admin && ( // Conditionally render Admin link for mobile
                <Link to={createPageUrl("Admin")}>
                  <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-center"> <Users className="w-5 h-5 text-white" /> </div>
                      <div> <h3 className="font-semibold text-orange-900">管理后台</h3> <p className="text-sm text-orange-600">管理用户和数据</p> </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </TabsContent>

            <TabsContent value="progress" className="mt-4 space-y-4 pb-16">
               <DailyProgress user={user} />
               <RecentRecordings />
            </TabsContent>

            <TabsContent value="achievements" className="mt-4 pb-16">
               <AchievementBadges user={user} />
            </TabsContent>
            
            <TabsContent value="stats" className="mt-4 pb-16">
               <DialectStats />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
