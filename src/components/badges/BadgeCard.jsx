import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Crown, Award, Shield, Gem, Flame, Heart } from "lucide-react";

export default function BadgeCard({ badge, user, isShareable = false }) {
  const IconComponent = badge.icon || Trophy;
  const shareUrl = `${window.location.origin}/join?ref=${user.id}`;
  const encodedShareUrl = encodeURIComponent(shareUrl);

  return (
    <Card className={`relative overflow-hidden ${isShareable ? 'w-96 h-64' : 'w-80 h-60'} ${badge.gradient || 'bg-gradient-to-br from-orange-400 to-amber-500'} text-white border-0 shadow-xl`}>
      <div className="absolute inset-0 bg-black/10"></div>
      <CardContent className="relative z-10 p-6 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{badge.title}</h3>
                <p className="text-sm text-white/90">{badge.subtitle}</p>
              </div>
            </div>
            <p className="text-sm text-white/80 mb-3">{badge.description}</p>
            <Badge className="bg-white/20 text-white border-white/30">
              {badge.achievement}
            </Badge>
          </div>
          {isShareable && (
            <div className="bg-white/90 p-2 rounded-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodedShareUrl}&bgcolor=ffffff&color=000000&qzone=1`}
                alt="分享二维码"
                width="60"
                height="60"
              />
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt="用户头像" 
                className="w-8 h-8 rounded-full border-2 border-white/50"
              />
            ) : (
              <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{user.level || 1}</span>
              </div>
            )}
            <span className="text-sm font-medium text-white">{user.full_name || user.email}</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/80">等级</p>
            <p className="text-lg font-bold text-white">{user.level || 1}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}