import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Crown, Award, Shield, Sparkles } from 'lucide-react';
import { calculateLevelInfo } from '@/components/lib/levels';

// 称号系统 - 根据等级解锁不同的称号和权限
const getUserTitle = (level) => {
  if (level >= 20) return { name: "方言活化石", color: "bg-gradient-to-r from-purple-500 to-pink-500 text-white", icon: Crown };
  if (level >= 16) return { name: "方言传承者", color: "bg-gradient-to-r from-amber-400 to-orange-500 text-white", icon: Award };
  if (level >= 12) return { name: "方言守护者", color: "bg-gradient-to-r from-blue-400 to-indigo-500 text-white", icon: Shield };
  if (level >= 8) return { name: "方言达人", color: "bg-gradient-to-r from-green-400 to-teal-500 text-white", icon: Sparkles };
  if (level >= 4) return { name: "方言新秀", color: "bg-gradient-to-r from-yellow-400 to-amber-500 text-white", icon: Star };
  return null;
};

// 等级特权系统
const getLevelPerks = (level) => {
  const perks = [];
  if (level >= 3) perks.push("审核权限");
  if (level >= 5) perks.push("推荐录音");
  if (level >= 8) perks.push("创建提示语");
  if (level >= 12) perks.push("方言专家标识");
  if (level >= 16) perks.push("社区导师权限");
  if (level >= 20) perks.push("终身荣誉会员");
  return perks;
};

export default function LevelProgress({ user }) {
  if (!user) return null;

  const { level, xp, progress, xpToNextLevel } = calculateLevelInfo(user.total_xp || 0);
  const userTitle = getUserTitle(level);
  const levelPerks = getLevelPerks(level);
  const nextLevelPerks = getLevelPerks(level + 1);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Star className="w-5 h-5" />
          等级进度
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-3xl font-bold text-orange-800 bg-orange-100 border-2 border-orange-200 rounded-full w-16 h-16 flex items-center justify-center">
            {level}
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-orange-900">{xp} XP</p>
            <p className="text-sm text-orange-600">总经验值</p>
          </div>
        </div>

        {/* 用户称号 */}
        {userTitle && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge className={`${userTitle.color} text-lg px-4 py-2 shadow-lg`}>
              <userTitle.icon className="w-4 h-4 mr-2" />
              {userTitle.name}
            </Badge>
          </div>
        )}

        <div>
          <Progress value={progress} className="bg-orange-100 [&>div]:bg-gradient-to-r [&>div]:from-orange-400 [&>div]:to-amber-500" />
          <p className="text-center text-sm text-orange-600 mt-2">
            {level < 20 ? `${xpToNextLevel} XP 到下一级` : "已满级"}
          </p>
        </div>

        {/* 当前等级特权 */}
        {levelPerks.length > 0 && (
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">🎖️ 当前特权</h4>
            <div className="flex flex-wrap gap-1">
              {levelPerks.map(perk => (
                <Badge key={perk} className="bg-green-100 text-green-700 text-xs">
                  {perk}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 下一等级特权预览 */}
        {nextLevelPerks.length > levelPerks.length && level < 20 && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">🔮 升级可解锁</h4>
            <div className="flex flex-wrap gap-1">
              {nextLevelPerks.filter(perk => !levelPerks.includes(perk)).map(perk => (
                <Badge key={perk} className="bg-blue-100 text-blue-700 text-xs">
                  {perk}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {user.is_reviewer && (
          <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">您已是社区审核员</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}