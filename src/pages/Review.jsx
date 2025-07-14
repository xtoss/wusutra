
import React, { useState, useEffect, useRef } from "react";
import { DialectRecord, User as B44User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Play, Pause, ShieldCheck, FileAudio } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { calculateLevelInfo } from "@/components/lib/levels";
import { createCompatibleAudioElement } from "@/components/lib/audioUtils";

export default function Review() {
  const [pendingRecordings, setPendingRecordings] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    // Add a small delay to avoid immediate rate limiting
    const timer = setTimeout(() => {
      loadReviewData();
    }, 500); // Changed from 1000ms to 500ms
    
    try {
      audioPlayerRef.current = createCompatibleAudioElement();
      audioPlayerRef.current.onended = () => setPlayingId(null);
      audioPlayerRef.current.onerror = (e) => {
        const errorMsg = e.target.error ? e.target.error.message : "Unknown audio error";
        console.error(`Audio error in Review page: ${errorMsg}`);
        toast.error("音频播放失败");
        setPlayingId(null);
      };
    } catch (error) {
      console.error('Failed to initialize audio player:', error);
    }

    return () => {
      clearTimeout(timer);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.onerror = null;
        audioPlayerRef.current.onended = null;
        audioPlayerRef.current.src = '';
        audioPlayerRef.current = null;
      }
    };
  }, []);

  const loadReviewData = async () => {
    try {
      const user = await B44User.me();
      console.log('Current user:', user);
      
      if (!user.is_reviewer) {
        console.log('User is not a reviewer');
        setCurrentUser(user);
        setIsLoading(false);
        return;
      }
      
      setCurrentUser(user);
      
      console.log('Loading all recordings...');
      const allRecordings = await DialectRecord.list('-created_date', 100);
      console.log('All recordings loaded:', allRecordings.length);
      
      // 只显示真正待审核的录音：is_approved为false或null/undefined且没有reviewed_by（即从未被审核过）
      const pendingOnly = allRecordings.filter(r => {
        const isPending = (r.is_approved === false || r.is_approved === null || r.is_approved === undefined) && !r.reviewed_by;
        console.log(`Recording ${r.id}: approved=${r.is_approved}, reviewed_by=${r.reviewed_by}, pending=${isPending}`);
        return isPending;
      });
      
      console.log('Pending recordings for review:', pendingOnly.length);
      setPendingRecordings(pendingOnly);
      
    } catch (error) {
      console.error("Error loading review data:", error);
      if (error.message?.includes('429') || error.response?.status === 429) {
        toast.error("数据加载过于频繁，请稍后刷新");
      } else if (error.message?.includes('Unauthorized') || error.response?.status === 401) {
        toast.error("请先登录以访问审核功能");
      } else {
        toast.error("加载审核数据失败，请刷新重试");
      }
    }
    setIsLoading(false);
  };
  
  const handleReview = async (recording, isApproved) => {
    try {
      console.log(`Reviewing recording ${recording.id}: ${isApproved ? 'approve' : 'reject'}`);
      
      // If audio is playing, pause it
      if (playingId === recording.id && audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        setPlayingId(null);
      }

      // Update the recording
      await DialectRecord.update(recording.id, {
        is_approved: isApproved,
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString(),
      });

      // Update reviewer's XP and potentially level
      const newXp = (currentUser.total_xp || 0) + 5;
      const { level: newLevel } = calculateLevelInfo(newXp);
      const isNowReviewer = newLevel >= 3;

      await B44User.updateMyUserData({
        total_xp: newXp,
        level: newLevel,
        is_reviewer: currentUser.is_reviewer || isNowReviewer,
      });

      toast.success(`录音已${isApproved ? '批准' : '拒绝'}。获得 5 经验值！`);
      setPendingRecordings(prev => prev.filter(r => r.id !== recording.id));

      // Refresh current user data
      const updatedUser = await B44User.me();
      setCurrentUser(updatedUser);

    } catch (error) {
      console.error("Error processing review:", error);
      toast.error("审核失败，请重试");
    }
  };
  
  const playAudio = async (id, audioUrl) => {
    const player = audioPlayerRef.current;
    if (!player) return;

    if (playingId === id) {
      player.pause();
      setPlayingId(null);
    } else {
      try {
        if (player.src !== audioUrl) {
          player.src = audioUrl;
          // No need for player.load() for modern browsers, setting src is usually enough before play()
        }
        // If another audio is playing, pause it first
        if (playingId && playingId !== id) {
          player.pause();
        }
        await player.play();
        setPlayingId(id);
      } catch (error) {
        console.error("Audio play failed:", error);
        toast.error("播放失败，请重试");
        setPlayingId(null);
      }
    }
  };

  const handleLogin = async () => {
    try {
      await B44User.login();
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("登录跳转失败，请重试。");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-900 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-orange-600">正在加载审核数据...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen p-8 text-center">
        <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-orange-400" />
        <h1 className="text-2xl font-bold text-orange-900">需要登录</h1>
        <p className="text-orange-600 mb-4">审核功能仅对登录用户开放。</p>
        <Button 
          onClick={handleLogin}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          立即登录
        </Button>
      </div>
    );
  }

  if (!currentUser?.is_reviewer) {
    return (
      <div className="min-h-screen p-8 text-center">
        <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-orange-400" />
        <h1 className="text-2xl font-bold text-orange-900">需要审核权限</h1>
        <p className="text-orange-600">达到3级后即可解锁审核功能。</p>
        <p className="text-orange-500 text-sm mt-2">当前等级: {currentUser?.level || 1}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-orange-900 mb-2">录音审核</h1>
          <p className="text-orange-600 text-lg">帮助我们验证方言录音的质量，为社区做贡献。</p>
          <p className="text-orange-500 text-sm mt-2">当前等级: {currentUser.level} | 总XP: {currentUser.total_xp || 0}</p>
        </motion.div>
        
        <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <FileAudio className="w-5 h-5" />
              待审核列表 ({pendingRecordings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRecordings.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="hidden md:table-header-group">
                    <TableRow>
                      <TableHead>转录文本</TableHead>
                      <TableHead>方言</TableHead>
                      <TableHead>用户</TableHead>
                      <TableHead>时长</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRecordings.map((recording) => (
                      <TableRow key={recording.id} className="flex flex-col md:table-row p-2 md:p-0 mb-2 md:mb-0 border rounded-lg md:border-b">
                        
                        {/* Mobile: Buttons on left */}
                        <TableCell className="md:hidden flex items-center justify-between pb-2 border-b md:border-none">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => playAudio(recording.id, recording.audio_url)}
                              className="text-blue-600 hover:text-blue-700 h-8 w-8"
                              title={playingId === recording.id ? "暂停" : "播放录音"}
                            >
                              {playingId === recording.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleReview(recording, true)}
                              className="text-green-600 hover:text-green-700 h-8 w-8"
                              title="批准"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleReview(recording, false)}
                              className="text-red-600 hover:text-red-700 h-8 w-8"
                              title="拒绝"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                           <Badge className="bg-orange-100 text-orange-700">
                            {recording.dialect}
                          </Badge>
                        </TableCell>

                        <TableCell className="font-medium pt-2 md:pt-4">
                          {recording.transcript}
                        </TableCell>

                        {/* Desktop: Dialect and Duration */}
                        <TableCell className="hidden md:table-cell">
                          <Badge className="bg-orange-100 text-orange-700">
                            {recording.dialect}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-gray-500">{recording.user_id || '匿名'}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-gray-500">{recording.duration}s</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge className="bg-yellow-100 text-yellow-800">待审核</Badge>
                        </TableCell>
                        
                        {/* Desktop: Buttons on right */}
                        <TableCell className="hidden md:table-cell text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => playAudio(recording.id, recording.audio_url)}
                              className="text-blue-600 hover:text-blue-700 h-8 w-8"
                              title={playingId === recording.id ? "暂停" : "播放录音"}
                            >
                              {playingId === recording.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleReview(recording, true)}
                              className="text-green-600 hover:text-green-700 h-8 w-8"
                              title="批准"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleReview(recording, false)}
                              className="text-red-600 hover:text-red-700 h-8 w-8"
                              title="拒绝"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>

                        {/* Mobile: Duration at bottom */}
                        <TableCell className="md:hidden text-xs text-gray-500 pt-2 text-right">
                          时长: {recording.duration}s
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-orange-600">
                <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>太棒了！所有录音都已审核完毕。</p>
                <p className="text-sm text-orange-500 mt-2">
                  刷新页面检查是否有新的录音需要审核
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
