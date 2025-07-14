import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BadgeCard from '../badges/BadgeCard';
import ShareCardGenerator from '../social/ShareCardGenerator';
import { achievementsList } from '../lib/achievements';

export default function BadgeSystem({ user, userAchievements = [] }) {
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [showShareCard, setShowShareCard] = useState(null);

  useEffect(() => {
    if (user && userAchievements) {
      const unlockedAchievementIds = userAchievements.map(a => a.achievement_id);
      
      const badges = achievementsList
        .filter(achievement => unlockedAchievementIds.includes(achievement.id))
        .map(achievement => {
          const userAchievementRecord = userAchievements.find(ua => ua.achievement_id === achievement.id);
          return {
            id: achievement.id,
            title: achievement.name,
            subtitle: achievement.description,
            description: `解锁于: ${new Date(userAchievementRecord.unlocked_at).toLocaleDateString()}`,
            achievement: achievement.description,
            icon: achievement.icon,
            gradient: achievement.gradient || 'bg-gradient-to-br from-orange-400 to-amber-500',
          };
        });
        
      setUnlockedBadges(badges);
    }
  }, [user, userAchievements]);

  const handleShareBadge = (badge) => {
    setShowShareCard(badge);
  };

  if (!user) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
        <CardContent className="text-center py-12">
            <p>正在加载用户信息...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {unlockedBadges.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
          <CardContent className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-orange-300" />
            <h3 className="text-lg font-medium text-orange-900 mb-2">还没有徽章</h3>
            <p className="text-orange-600 mb-4">开始录音来获得你的第一个徽章吧！</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {unlockedBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="relative group cursor-pointer"
                onClick={() => handleShareBadge(badge)}
              >
                <BadgeCard badge={badge} user={user} />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <div className="bg-white/90 text-orange-900 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    <span className="font-medium">分享徽章</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {showShareCard && (
        <ShareCardGenerator
          user={user}
          badge={showShareCard}
          onClose={() => setShowShareCard(null)}
        />
      )}
    </div>
  );
}