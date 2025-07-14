import React, { useState, useEffect } from "react";
import { User, UserPublicProfile } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function UserSyncManager() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState({ userCount: 0, profileCount: 0 });

  const loadStats = async () => {
    try {
      const users = await User.list();
      const profiles = await UserPublicProfile.list();
      setStats({ userCount: users.length, profileCount: profiles.length });
    } catch (error) {
      console.error("Error loading sync stats:", error);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    toast.info("正在开始同步用户数据...");

    try {
      const allUsers = await User.list();
      const existingProfiles = await UserPublicProfile.list();
      const profileMap = new Map(existingProfiles.map(p => [p.user_id, p]));

      let createdCount = 0;
      let updatedCount = 0;

      for (const user of allUsers) {
        if (user.is_anonymous) continue; // 不同步匿名用户

        const profileData = {
          user_id: user.id,
          display_name: user.display_name || user.full_name || user.email,
          bio: user.bio || "",
          avatar_url: user.avatar_url || "",
          location: user.location || "",
          preferred_dialect: user.preferred_dialect || "",
          level: user.level || 1,
          total_xp: user.total_xp || 0,
          total_recordings: user.total_recordings || 0,
        };

        const existingProfile = profileMap.get(user.id);

        if (existingProfile) {
          // 更新已存在的视图
          await UserPublicProfile.update(existingProfile.id, profileData);
          updatedCount++;
        } else {
          // 创建新的视图
          await UserPublicProfile.create(profileData);
          createdCount++;
        }
      }

      toast.success("同步完成！", {
        description: `新增 ${createdCount} 条，更新 ${updatedCount} 条。`,
      });

    } catch (error) {
      console.error("Error during user sync:", error);
      toast.error("同步失败", { description: error.message });
    }

    await loadStats();
    setIsSyncing(false);
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Users className="w-5 h-5" />
          用户公开视图同步
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-sm font-medium text-gray-600">主表用户数</p>
            <p className="text-xl font-bold text-gray-900">{stats.userCount}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-600">公开视图数</p>
            <p className="text-xl font-bold text-blue-900">{stats.profileCount}</p>
          </div>
        </div>

        {stats.userCount !== stats.profileCount && (
           <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <p className="text-sm text-yellow-800">
              主表和视图数量不一致，建议立即同步以确保数据最新。
            </p>
          </div>
        )}

        <Button onClick={handleSync} disabled={isSyncing} className="w-full">
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              正在同步...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              立即同步
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}