
import React, { useState, useEffect } from "react";
import { User, Achievement, UserPublicProfile } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon, MapPin, Award, Star, Trophy, Mic, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import UserVoiceGallery from "../components/profile/UserVoiceGallery";
import { achievementsList } from "../components/lib/achievements";

const getUserTitle = (level) => {
  if (level >= 20) return { name: "方言活化石", color: "bg-gradient-to-r from-purple-500 to-pink-500 text-white", IconComponent: Trophy };
  if (level >= 16) return { name: "方言传承者", color: "bg-gradient-to-r from-amber-400 to-orange-500 text-white", IconComponent: Award };
  if (level >= 12) return { name: "方言守护者", color: "bg-gradient-to-r from-blue-400 to-indigo-500 text-white", IconComponent: Star };
  if (level >= 8) return { name: "方言达人", color: "bg-gradient-to-r from-green-400 to-teal-500 text-white", IconComponent: Mic };
  if (level >= 4) return { name: "方言新秀", color: "bg-gradient-to-r from-yellow-400 to-amber-500 text-white", IconComponent: Star };
  return null;
};

export default function PublicProfile() {
  const [targetUser, setTargetUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userAchievements, setUserAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let loggedInUser = null;
      try {
        loggedInUser = await User.me();
        setCurrentUser(loggedInUser);
      } catch (e) {
        console.log("Not logged in");
      }

      const urlParams = new URLSearchParams(window.location.search);
      const userId = urlParams.get('userId');
      
      if (!userId) {
        setError("缺少用户ID参数");
        setIsLoading(false);
        return;
      }

      if (!loggedInUser) {
        setError("login_required");
        setIsLoading(false);
        return;
      }

      // **核心修复：查询公开视图而不是User表**
      const profiles = await UserPublicProfile.filter({ user_id: userId });
      
      if (profiles.length === 0) {
        setError("用户不存在或尚未同步。请联系管理员。");
        setIsLoading(false);
        return;
      }

      const foundProfile = profiles[0];
      setTargetUser(foundProfile);

      const achievements = await Achievement.filter({ user_id: userId });
      setUserAchievements(achievements);

    } catch (err) {
      console.error("Error loading profile data:", err);
      setError(err.message || "加载用户信息时出错，请刷新重试。");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-orange-600">正在加载用户信息...</p>
        </div>
      </div>
    );
  }

  if (error === "login_required") {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
            <CardContent className="text-center py-12">
              <UserPlus className="w-16 h-16 mx-auto mb-4 text-orange-400" />
              <h3 className="text-lg font-medium text-orange-900 mb-2">需要登录</h3>
              <p className="text-orange-600 mb-4">请先登录以查看用户资料</p>
              <Button 
                onClick={() => User.loginWithRedirect(window.location.href)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                立即登录
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Card className="bg-white/80 backdrop-blur-sm border-red-200 shadow-lg">
            <CardContent className="text-center py-12">
              <UserIcon className="w-16 h-16 mx-auto mb-4 text-red-400" />
              <h3 className="text-lg font-medium text-red-900 mb-2">无法找到用户</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button 
                onClick={() => window.history.back()}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                返回上一页
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">未找到用户信息</p>
        </div>
      </div>
    );
  }

  const userTitle = getUserTitle(targetUser.level || 1);
  const unlockedBadges = achievementsList.filter(achievement => 
    userAchievements.some(ua => ua.achievement_id === achievement.id)
  );

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-white border-gray-200 shadow-lg">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-900 flex items-center justify-center ring-4 ring-gray-100">
                    {targetUser.avatar_url ? (
                      <img 
                        src={targetUser.avatar_url} 
                        alt="头像" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-12 h-12 text-white" />
                    )}
                  </div>
                  
                  <div className="text-center mt-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {targetUser.display_name || targetUser.full_name || "用户"}
                    </h1>
                    
                    {userTitle && (
                      <Badge className={`${userTitle.color} mt-2`}>
                        <userTitle.IconComponent className="w-3 h-3 mr-1" />
                        {userTitle.name}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  {targetUser.bio && (
                    <p className="text-gray-600 mb-4">{targetUser.bio}</p>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-gray-900">{targetUser.level || 1}</div>
                      <div className="text-sm text-gray-600">等级</div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-gray-900">{targetUser.total_recordings || 0}</div>
                      <div className="text-sm text-gray-600">录音数</div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-gray-900">{targetUser.total_xp || 0}</div>
                      <div className="text-sm text-gray-600">经验值</div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-gray-900">{unlockedBadges.length}</div>
                      <div className="text-sm text-gray-600">徽章数</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                    {targetUser.location && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {targetUser.location}
                      </Badge>
                    )}
                    {targetUser.preferred_dialect && (
                      <Badge variant="outline">
                        {targetUser.preferred_dialect}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 徽章展示 */}
        {unlockedBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-white border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  获得的徽章 ({unlockedBadges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {unlockedBadges.map((badge) => {
                    // The icon is a component, so it must be capitalized to be rendered as JSX
                    const IconComponent = badge.icon;
                    return (
                      <div key={badge.id} className="text-center p-4 bg-gray-50 rounded-lg flex flex-col items-center justify-start">
                        <div className="text-4xl mb-2 text-amber-500 h-10 w-10 flex items-center justify-center">
                          <IconComponent className="w-10 h-10" />
                        </div>
                        <div className="font-medium text-sm mt-2">{badge.name}</div>
                        <div className="text-xs text-gray-500 mt-1 h-8">
                          {badge.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 录音作品展示 */}
        <UserVoiceGallery userId={targetUser.id} />
      </div>
    </div>
  );
}
