
import React, { useState, useEffect } from "react";
import { User, Achievement } from "@/api/entities";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import BadgeSystem from "../components/gamification/BadgeSystem";
import LevelGuide from "../components/gamification/LevelGuide";

export default function Badges() {
  const [user, setUser] = useState(null);
  const [userAchievements, setUserAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查是否有邀请参数，如果存在，立即重定向到公共资料页
    const urlParams = new URLSearchParams(window.location.search);
    const inviteUserId = urlParams.get('invite');
    if (inviteUserId) {
      window.location.href = createPageUrl(`PublicProfile?userId=${inviteUserId}`);
      return; // 停止执行此组件的其余部分
    }
    
    // 如果不是邀请链接，正常加载当前用户信息
    loadUserAndAchievements();
  }, []);

  const loadUserAndAchievements = async () => {
    setIsLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      if (userData?.id) {
        const achievements = await Achievement.filter({ user_id: userData.id });
        setUserAchievements(achievements);
      }
    } catch (error) {
      console.error("Error loading user and achievements:", error);
      // 用户未登录或权限不足
      setUser(null);
    }
    setIsLoading(false);
  };

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
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-orange-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-60 bg-orange-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Trophy className="w-16 h-16 mx-auto mb-4 text-orange-400" />
            <h1 className="text-3xl font-bold text-orange-900 mb-2">荣誉殿堂</h1>
            <p className="text-orange-600 text-lg">登录后查看您的成就和等级进度</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
              <CardContent className="p-6 text-center space-y-4">
                <div className="text-sm text-orange-600">
                  登录后您可以：
                </div>
                <ul className="text-sm text-orange-700 space-y-2">
                  <li>• 查看已解锁的成就徽章</li>
                  <li>• 跟踪等级和经验进度</li>
                  <li>• 分享您的成就到社交媒体</li>
                  <li>• 参与社区排行榜</li>
                </ul>
                <Button
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white shadow-lg"
                  size="lg"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  立即登录查看
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-orange-900 mb-4">
            荣誉殿堂
          </h1>
        </motion.div>

        <Tabs defaultValue="badges" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm border border-orange-200">
            <TabsTrigger value="badges" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              徽章
            </TabsTrigger>
            <TabsTrigger value="levels" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              等级
            </TabsTrigger>
          </TabsList>

          <TabsContent value="badges">
            <BadgeSystem user={user} userAchievements={userAchievements} />
          </TabsContent>

          <TabsContent value="levels">
            <LevelGuide user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
