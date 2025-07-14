import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, Award, Shield, Crown, Sparkles, Bot, Settings, Plus, Users, Zap } from 'lucide-react';
import { calculateLevelInfo } from '@/components/lib/levels';

const levelData = [
  {
    level: 1,
    name: "初学者",
    xp: 0,
    icon: Star,
    color: "bg-gray-100 text-gray-800",
    perks: ["基础录音功能", "查看排行榜", "获得徽章"],
    description: "欢迎来到Wu无言引擎！"
  },
  {
    level: 4,
    name: "方言新秀",
    xp: 300,
    icon: Award,
    color: "bg-green-100 text-green-800",
    perks: ["解锁方言新秀称号", "参与社区投票", "收藏推荐录音"],
    description: "已具备基本的方言保护意识"
  },
  {
    level: 8,
    name: "方言达人",
    xp: 1800,
    icon: Plus,
    color: "bg-blue-100 text-blue-800",
    perks: ["创建提示词", "推荐优质录音", "社区管理权限"],
    description: "可以为社区贡献提示词内容"
  },
  {
    level: 12,
    name: "方言守护者",
    xp: 6800,
    icon: Shield,
    color: "bg-purple-100 text-purple-800",
    perks: ["方言专家标识", "审核录音权限", "指导新用户"],
    description: "拥有专业的方言知识和审核能力"
  },
  {
    level: 16,
    name: "方言传承者",
    xp: 21000,
    icon: Users,
    color: "bg-amber-100 text-amber-800",
    perks: ["社区导师权限", "举办方言活动", "培养新传承人"],
    description: "致力于方言文化的传承和发展"
  },
  {
    level: 20,
    name: "方言活化石",
    xp: 60000,
    icon: Crown,
    color: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
    perks: ["终身荣誉会员", "AI模型训练权限", "共同管理社区"],
    description: "拥有最高荣誉，可以训练专属方言AI模型"
  }
];

export default function LevelGuide({ user }) {
  const userLevel = user?.level || 1;
  const { level, xp, progress } = calculateLevelInfo(user?.total_xp || 0);

  return (
    <div className="space-y-6">
      {/* 当前等级状态 */}
      {user && (
        <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Star className="w-5 h-5" />
              当前等级状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-orange-800 bg-orange-100 border-2 border-orange-200 rounded-full w-16 h-16 flex items-center justify-center">
                  {level}
                </div>
                <div>
                  <p className="text-xl font-bold text-orange-900">{levelData.find(l => l.level <= level)?.name || '初学者'}</p>
                  <p className="text-sm text-orange-600">{xp} XP</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-orange-600 mb-1">进度</p>
                <Progress value={progress} className="w-32 bg-orange-100 [&>div]:bg-gradient-to-r [&>div]:from-orange-400 [&>div]:to-amber-500" />
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="font-medium text-orange-800 mb-2">🔓 当前权限</h4>
              <div className="flex flex-wrap gap-2">
                {levelData.filter(l => l.level <= level).map(levelInfo => 
                  levelInfo.perks.map(perk => (
                    <Badge key={perk} className="bg-orange-100 text-orange-700 text-xs">
                      {perk}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 等级详情 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {levelData.map((levelInfo) => {
          const IconComponent = levelInfo.icon;
          const isUnlocked = userLevel >= levelInfo.level;
          const isCurrent = userLevel === levelInfo.level;
          
          return (
            <Card 
              key={levelInfo.level} 
              className={`
                transition-all duration-300 border-2
                ${isCurrent 
                  ? 'bg-gradient-to-br from-orange-100 to-amber-100 border-orange-400 shadow-lg' 
                  : isUnlocked 
                    ? 'bg-white/80 backdrop-blur-sm border-green-200 shadow-md' 
                    : 'bg-gray-50 border-gray-200 opacity-70'
                }
              `}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      ${isUnlocked ? 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-600'}
                    `}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">等级 {levelInfo.level}</h3>
                      <Badge className={levelInfo.color}>{levelInfo.name}</Badge>
                    </div>
                  </div>
                  {isCurrent && (
                    <Badge className="bg-orange-500 text-white">当前</Badge>
                  )}
                  {isUnlocked && !isCurrent && (
                    <Badge className="bg-green-500 text-white">已解锁</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{levelInfo.description}</p>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">解锁功能:</p>
                  <div className="flex flex-wrap gap-1">
                    {levelInfo.perks.map((perk, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className={`text-xs ${
                          isUnlocked 
                            ? 'border-green-300 text-green-700' 
                            : 'border-gray-300 text-gray-500'
                        }`}
                      >
                        {perk}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  需要经验值: {levelInfo.xp.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AI模型训练特别说明 */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-purple-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Bot className="w-5 h-5" />
            AI模型训练权限说明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-purple-700">
              达到<strong>等级20（方言活化石）</strong>后，您将获得最高荣誉权限：
            </p>
            <div className="bg-purple-100 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="text-purple-800 font-medium">训练专属方言AI模型</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-600" />
                <span className="text-purple-800 font-medium">微调模型参数</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-purple-600" />
                <span className="text-purple-800 font-medium">共同管理社区</span>
              </div>
            </div>
            <p className="text-sm text-purple-600">
              您的贡献将直接影响AI模型的训练效果，帮助保护和传承珍贵的方言文化。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}