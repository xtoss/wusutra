
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User as UserIcon, MapPin, Award, Edit3, Save, X, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import LevelProgress from "../components/profile/LevelProgress";
import AchievementSection from "../components/profile/AchievementSection";
import { DIALECTS } from "../components/lib/dialects";

const TITLES = {
  4: { name: "方言新秀", color: "bg-green-100 text-green-800" },
  8: { name: "方言达人", color: "bg-blue-100 text-blue-800" },
  12: { name: "方言守护者", color: "bg-purple-100 text-purple-800" },
  16: { name: "方言传承者", color: "bg-amber-100 text-amber-800" },
  20: { name: "方言活化石", color: "bg-red-100 text-red-800" },
};

const getUserTitle = (level) => {
  let currentTitle = null;
  for (const lvl in TITLES) {
    if (level >= parseInt(lvl, 10)) {
      currentTitle = TITLES[lvl];
    }
  }
  return currentTitle;
};


export default function Profile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [editForm, setEditForm] = useState({ // Initialize with useState, not direct assignment
    display_name: "",
    preferred_dialect: "",
    location: "",
    bio: ""
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await User.me();
      console.log("Loaded user data:", userData);
      setUser(userData);
      setEditForm({
        display_name: userData.display_name || userData.full_name || "",
        preferred_dialect: userData.preferred_dialect || "",
        location: userData.location || "",
        bio: userData.bio || ""
      });
    } catch (error) {
      if (error.response?.status !== 401 && !error.message?.includes('401')) {
        console.error("Error loading user data:", error);
      } else {
        console.log("User not logged in, cannot view profile.");
      }
      setUser(null);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    try {
      console.log("Saving profile data:", editForm);

      await User.updateMyUserData(editForm);

      console.log("Profile updated successfully");

      setUser(prev => ({ ...prev, ...editForm }));
      setIsEditing(false);

      toast.success("资料更新成功！");

      setTimeout(async () => {
        try {
          const updatedUser = await User.me();
          console.log("Reloaded user data after save:", updatedUser);
          setUser(updatedUser);
          setEditForm({
            display_name: updatedUser.display_name || updatedUser.full_name || "",
            preferred_dialect: updatedUser.preferred_dialect || "",
            location: updatedUser.location || "",
            bio: updatedUser.bio || ""
          });
        } catch (error) {
          console.error("Error reloading user data:", error);
        }
      }, 1000);

    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("更新失败，请重试");
    }
  };

  const handleCancel = () => {
    setEditForm({
      display_name: user?.display_name || user?.full_name || "",
      preferred_dialect: user?.preferred_dialect || "",
      location: user?.location || "",
      bio: user?.bio || ""
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setAvatarError('');

    if (!file.type.startsWith('image/')) {
      setAvatarError("请选择图片文件 (JPG, PNG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("图片大小不能超过 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      console.log("Uploading avatar file...");

      const { file_url } = await UploadFile({ file });
      console.log("Avatar uploaded to:", file_url);

      await User.updateMyUserData({ avatar_url: file_url });
      console.log("Avatar URL saved to profile");

      setUser(prev => ({ ...prev, avatar_url: file_url }));

      setAvatarError('');

      toast.success("头像更新成功！");

      window.dispatchEvent(new CustomEvent('userUpdated'));

    } catch (error) {
      console.error("Error uploading avatar:", error);
      setAvatarError("头像上传失败，请重试");
      toast.error("头像上传失败，请重试");
    }
    setIsUploadingAvatar(false);
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
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:col-span-2 space-y-6">
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <UserIcon className="w-16 h-16 mx-auto text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-800">请先登录</h1>
          <p className="text-gray-500">登录后才能查看和编辑您的个人资料。</p>
          <Button
            onClick={handleLogin}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            立即登录
          </Button>
        </div>
      </div>
    );
  }

  const userTitle = getUserTitle(user.level || 1);

  // Re-pasting the full card components to be used in both desktop and mobile views
  const ProfileCard = (
    <Card className="bg-white border-gray-200 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-gray-900 mb-2">个人资料</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
            className="text-gray-600 hover:text-gray-700 hover:bg-gray-100"
          >
            {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-900 flex items-center justify-center ring-4 ring-gray-100">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="头像"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-12 h-12 text-white" />
              )}
            </div>
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <label
              htmlFor="avatar-upload"
              className={`absolute inset-0 rounded-full flex items-center justify-center bg-black/50 text-white cursor-pointer transition-opacity duration-300 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                id="avatar-upload"
                disabled={isUploadingAvatar}
              />
              <div className="text-center">
                <Upload className="w-5 h-5 mx-auto" />
                <span className="text-xs mt-1">
                  {isUploadingAvatar ? "上传中..." : "更换头像"}
                </span>
              </div>
            </label>
          </div>

          {avatarError && (
            <p className="text-xs text-red-500 mt-2 text-center">
              {avatarError}
            </p>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="display_name">显示昵称</Label>
              <Input
                id="display_name"
                value={editForm.display_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                className="border-gray-300 focus:ring-gray-500"
                placeholder="请输入您的显示昵称"
              />
            </div>
            <div>
              <Label htmlFor="location">所在地区</Label>
              <Input
                id="location"
                value={editForm.location}
                onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                className="border-gray-300 focus:ring-gray-500"
                placeholder="请输入您的所在地区"
              />
            </div>
            <div>
              <Label htmlFor="preferred_dialect">偏好方言</Label>
              <Select
                value={editForm.preferred_dialect}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, preferred_dialect: value }))}
              >
                <SelectTrigger className="border-gray-300 focus:ring-gray-500">
                  <SelectValue placeholder="选择您的方言" />
                </SelectTrigger>
                <SelectContent>
                  {DIALECTS.map(dialect => (
                    <SelectItem key={dialect} value={dialect}>{dialect}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bio">个人简介</Label>
              <Textarea
                id="bio"
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                className="border-gray-300 focus:ring-gray-500"
                placeholder="介绍一下自己吧"
                rows={3}
              />
            </div>
            <Button
              onClick={handleSave}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              保存更改
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg">
              {user?.display_name || user?.full_name || user?.email || "未设置姓名"}
            </h3>

            {userTitle && (
              <Badge className={`${userTitle.color} mx-auto flex items-center justify-center gap-1.5 w-fit`}>
                <Award className="w-3 h-3" />
                {userTitle.name}
              </Badge>
            )}

            <p className="text-sm text-gray-600 px-4">
              {user?.bio || <span className="italic text-gray-400">这位用户很神秘，什么也没留下。</span>}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <p className="text-sm text-gray-600">{user?.email}</p>
              {user?.location && (
                <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {user.location}
                </div>
              )}
              {user?.preferred_dialect && (
                <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                  {user.preferred_dialect}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const LevelProgressCard = <LevelProgress user={user} />;

  const StatsCard = (
    <Card className="bg-white border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-gray-900">贡献统计</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">总录音数</span>
          <span className="font-bold text-gray-900">{user?.total_recordings || 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">总经验值</span>
          <span className="font-bold text-gray-900">{user?.total_xp || 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">连续天数</span>
          <span className="font-bold text-gray-900">{user?.current_streak || 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">当前等级</span>
          <Badge className="bg-gray-900 text-white">
            等级 {user?.level || 1}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  const ActivityCard = (
    <Card className="bg-white border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-gray-900">活动记录</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">注册时间</span>
          <span className="font-medium text-gray-900">
            {user?.created_date ? new Date(user.created_date).toLocaleDateString('zh-CN') : '--'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">最后贡献</span>
          <span className="font-medium text-gray-900">
            {user?.last_contribution_date || '--'}
          </span>
        </div>
        {user?.is_reviewer && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">审核员</Badge>
              <span className="text-sm text-green-700">您拥有审核权限</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const AchievementSectionComponent = <AchievementSection user={user} />;


  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                我的资料
              </h1>
              <p className="text-gray-600 text-lg">
                管理您的个人信息和偏好设置
              </p>
            </div>
          </div>
        </motion.div>

        {/* Desktop View */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1 space-y-6">
              {ProfileCard}
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 space-y-6">
              {LevelProgressCard}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {StatsCard}
                {ActivityCard}
              </div>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            {AchievementSectionComponent}
          </motion.div>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/70 backdrop-blur-sm border border-orange-200 shadow-sm">
              <TabsTrigger value="profile">我的资料</TabsTrigger>
              <TabsTrigger value="progress">贡献与等级</TabsTrigger>
              <TabsTrigger value="achievements">我的成就</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="mt-4">
              {ProfileCard}
            </TabsContent>
            <TabsContent value="progress" className="mt-4 space-y-4">
              {LevelProgressCard}
              {StatsCard}
              {ActivityCard}
            </TabsContent>
            <TabsContent value="achievements" className="mt-4">
              {AchievementSectionComponent}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
