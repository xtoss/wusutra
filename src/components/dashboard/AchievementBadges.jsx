
import React, { useState, useEffect } from "react";
import { Achievement } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Award, Crown, Zap, ShieldCheck } from "lucide-react";

export default function AchievementBadges({ user }) {
  const [userAchievements, setUserAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const achievements = [
    {
      id: "first_recording",
      name: "初次尝试",
      description: "完成第一次录音",
      icon: Star,
      threshold: 1,
      color: "bg-yellow-100 text-yellow-800"
    },
    {
      id: "dedicated_contributor",
      name: "积极贡献者",
      description: "完成10次录音",
      icon: Award,
      threshold: 10,
      color: "bg-blue-100 text-blue-800"
    },
    {
      id: "milestone_13",
      name: "百尺竿头",
      description: "完成13次录音",
      icon: Zap,
      threshold: 13,
      color: "bg-green-100 text-green-800"
    },
    {
      id: "milestone_15",
      name: "更进一步",
      description: "完成15次录音",
      icon: Zap,
      threshold: 15,
      color: "bg-green-100 text-green-800"
    },
    {
      id: "milestone_17",
      name: "坚持不懈",
      description: "完成17次录音",
      icon: ShieldCheck,
      threshold: 17,
      color: "bg-teal-100 text-teal-800"
    },
    {
      id: "milestone_20",
      name: "中坚力量",
      description: "完成20次录音",
      icon: ShieldCheck,
      threshold: 20,
      color: "bg-teal-100 text-teal-800"
    },
    {
      id: "dialect_expert",
      name: "方言专家",
      description: "完成50次录音",
      icon: Trophy,
      threshold: 50,
      color: "bg-purple-100 text-purple-800"
    },
    {
      id: "community_leader",
      name: "社区领袖",
      description: "完成100次录音",
      icon: Crown,
      threshold: 100,
      color: "bg-orange-100 text-orange-800"
    }
  ];

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
    }
    setIsLoading(false);
  };

  const userRecordings = user?.total_recordings || 0;

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
          <div className="animate-pulse space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-16 bg-orange-100 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Trophy className="w-5 h-5" />
          成就徽章 ({userAchievements.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {achievements.map((achievement) => {
            const isUnlocked = userAchievements.includes(achievement.id);
            const Icon = achievement.icon;

            return (
              <div
                key={achievement.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  isUnlocked
                    ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  isUnlocked ? 'bg-gradient-to-r from-orange-400 to-amber-500' : 'bg-gray-300'
                }`}>
                  <Icon className={`w-5 h-5 ${isUnlocked ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${isUnlocked ? 'text-orange-900' : 'text-gray-500'}`}>
                    {achievement.name}
                  </p>
                  <p className={`text-sm ${isUnlocked ? 'text-orange-600' : 'text-gray-400'}`}>
                    {achievement.description}
                  </p>
                </div>
                {isUnlocked && (
                  <Badge className={achievement.color}>
                    已解锁
                  </Badge>
                )}
                {!isUnlocked && (
                  <Badge variant="outline" className="border-gray-300 text-gray-500">
                    {userRecordings}/{achievement.threshold}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
