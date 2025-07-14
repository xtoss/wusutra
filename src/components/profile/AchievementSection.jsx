
import React, { useState, useEffect } from "react";
import { Achievement } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Award, Crown, Zap, ShieldCheck, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { achievementsList } from "../lib/achievements";

export default function AchievementSection({ user }) {
  const [userAchievements, setUserAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 使用统一的成就列表，并筛选出和录音数量相关的成就
  const achievements = achievementsList.filter(a => !a.type || a.type === 'recording');

  useEffect(() => {
    loadUserAchievements();
  }, [user?.id]);

  useEffect(() => {
    const handleStatsUpdate = () => {
      loadUserAchievements();
    };

    window.addEventListener('statsUpdated', handleStatsUpdate);
    return () => {
      window.removeEventListener('statsUpdated', handleStatsUpdate);
    };
  }, []);

  const loadUserAchievements = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    try {
      const achievementRecords = await Achievement.filter({ user_id: user.id });
      setUserAchievements(achievementRecords.map(a => a.achievement_id));
    } catch (error) {
      console.error("Error loading achievements:", error);
      // For users who might not have access to Achievement entity, still show achievements based on their stats
      console.log("Fallback: showing achievements based on user stats");
      setUserAchievements([]); // Set to empty to allow calculated achievements to be used
    }
    setIsLoading(false);
  };

  const userRecordings = user?.total_recordings || 0;
  
  // Calculate which achievements should be unlocked based on recordings count
  const calculatedUnlockedAchievements = achievements.filter(a => userRecordings >= a.threshold).map(a => a.id);
  
  // Use either loaded achievements or calculated ones (for users like anonymous who might not have Achievement records)
  const effectiveUnlockedAchievements = userAchievements.length > 0 ? userAchievements : calculatedUnlockedAchievements;
  
  const unlockedCount = effectiveUnlockedAchievements.length;
  const totalCount = achievements.length;

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <Trophy className="w-5 h-5" />
            成就徽章 (...)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-24 bg-orange-100 rounded-lg"></div>
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
            <Trophy className="w-5 h-5" />
            成就徽章
          </div>
          <Badge className="bg-gradient-to-r from-orange-400 to-amber-500 text-white">
            {unlockedCount}/{totalCount}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((achievement, index) => {
            const isUnlocked = effectiveUnlockedAchievements.includes(achievement.id);
            const Icon = achievement.icon;
            const progress = achievement.threshold > 0 ? Math.min((userRecordings / achievement.threshold) * 100, 100) : 0;

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                  isUnlocked
                    ? `bg-gradient-to-br from-orange-50 to-amber-50 ${achievement.borderColor} shadow-lg hover:shadow-xl`
                    : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-80'
                }`}
              >
                <div className="text-center space-y-3">
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
                    isUnlocked 
                      ? 'bg-gradient-to-r from-orange-400 to-amber-500 shadow-lg' 
                      : 'bg-gray-300'
                  }`}>
                    {isUnlocked ? (
                      <Icon className="w-6 h-6 text-white" />
                    ) : (
                      <Lock className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  
                  <div>
                    <h4 className={`font-semibold text-sm ${
                      isUnlocked ? 'text-orange-900' : 'text-gray-500'
                    }`}>
                      {achievement.name}
                    </h4>
                    <p className={`text-xs mt-1 ${
                      isUnlocked ? 'text-orange-600' : 'text-gray-400'
                    }`}>
                      {achievement.description}
                    </p>
                  </div>

                  {isUnlocked ? (
                    <Badge className={`${achievement.color} text-xs`}>
                      已解锁
                    </Badge>
                  ) : (
                    <div className="space-y-1">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-orange-400 to-amber-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {userRecordings}/{achievement.threshold}
                      </p>
                    </div>
                  )}
                </div>

                {isUnlocked && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {unlockedCount === 0 && (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-orange-300" />
            <p className="text-orange-600 mb-2">还没有解锁任何成就</p>
            <p className="text-sm text-orange-500">开始录音来获得第一个徽章吧！</p>
          </div>
        )}

        {unlockedCount > 0 && unlockedCount < totalCount && (
          <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
            <p className="text-center text-sm text-orange-700">
              继续加油！还有 <strong>{totalCount - unlockedCount}</strong> 个成就等待解锁
            </p>
          </div>
        )}

        {unlockedCount === totalCount && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <p className="text-center text-sm text-green-700 font-medium">
              🎉 恭喜！您已经解锁了所有成就！
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
