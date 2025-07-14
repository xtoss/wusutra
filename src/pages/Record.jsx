
import React, { useState, useEffect, useRef } from "react";
import { User, DialectRecord, DailyPrompt, Achievement } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Award,
  UserPlus,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  Lightbulb,
  ArrowRight,
  Zap,
  Copy,
  Heart, // Added Heart icon
  Target, // Added Target icon
  BookOpen // Added BookOpen icon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { getSupportedMimeType, getFileExtension, createCompatibleAudioElement } from "@/components/lib/audioUtils";
import { achievementsList } from "../components/lib/achievements";
import { DIALECTS } from "../components/lib/dialects";

export default function Record() {
  // 用户状态
  const [user, setUser] = useState(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  // 录音状态
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [mimeType, setMimeType] = useState(null);

  // 播放状态
  const [isPlaying, setIsPlaying] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // 表单状态
  const [transcript, setTranscript] = useState("");
  const [selectedDialect, setSelectedDialect] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 新增：ASR识别状态
  const [asrResult, setAsrResult] = useState(null);
  const [isAsrProcessing, setIsAsrProcessing] = useState(false);
  const [asrError, setAsrError] = useState(null);

  // 提示词相关
  const [prompts, setPrompts] = useState([]);
  const [isPromptsLoading, setIsPromptsLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  // 媒体引用
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const playbackIntervalRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  // 成就系统
  const [showAchievement, setShowAchievement] = useState(null);
  const [userAchievements, setUserAchievements] = useState([]);

  // 初始化用户数据
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);

        // 预选用户的偏好方言
        if (userData.preferred_dialect) {
          setSelectedDialect(userData.preferred_dialect);
        }

        // 加载用户已有的成就
        const achievements = await Achievement.filter({ user_id: userData.id });
        setUserAchievements(achievements);

      } catch (error) {
        console.log("User not logged in or error loading user data");
        setUser(null);
      }
      setIsUserLoading(false);
    };

    loadUser();
  }, []);

  // 加载提示词数据
  useEffect(() => {
    const loadPrompts = async () => {
      setIsPromptsLoading(true);
      try {
        const promptsData = await DailyPrompt.list('-created_date', 100);
        setPrompts(promptsData);
      } catch (e) {
        console.error("Failed to load prompts", e);
        setPrompts([]);
      }
      setIsPromptsLoading(false);
    };
    loadPrompts();
  }, []);

  // 清理资源
  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // 检查成就
  const checkAchievements = async (newTotalRecordings) => {
    if (!user) return;

    const unlockedAchievementIds = userAchievements.map(a => a.achievement_id);

    for (const achievement of achievementsList) {
      if (unlockedAchievementIds.includes(achievement.id)) continue;

      let shouldUnlock = false;

      // 检查录音数量成就
      if (achievement.type !== 'streak' && achievement.type !== 'special' && achievement.type !== 'review' && achievement.type !== 'variety' && achievement.type !== 'votes' && achievement.type !== 'daily' && achievement.type !== 'level') {
        shouldUnlock = newTotalRecordings >= achievement.threshold;
      }

      if (shouldUnlock) {
        try {
          // 创建成就记录
          await Achievement.create({
            user_id: user.id,
            achievement_id: achievement.id,
            unlocked_at: new Date().toISOString()
          });

          // 显示成就通知
          setShowAchievement(achievement);

          // 更新本地成就列表
          setUserAchievements(prev => [...prev, {
            user_id: user.id,
            achievement_id: achievement.id,
            unlocked_at: new Date().toISOString()
          }]);

          console.log(`🏆 Achievement unlocked: ${achievement.name}`);

        } catch (error) {
          console.error("Error creating achievement:", error);
        }
      }
    }
  };

  // 新增：调用ASR识别API
  const performAsrRecognition = async (audioBlob) => {
    setIsAsrProcessing(true);
    setAsrError(null);
    setAsrResult(null);

    try {
      // 创建FormData用于上传音频文件
      const formData = new FormData();
      const audioFile = new File([audioBlob], 'recording.wav', { type: audioBlob.type });
      formData.append('audio', audioFile);

      // 调用外部ASR API
      const response = await fetch('https://fa1d6b2a6a70.ngrok-free.app/transcribe', {
        method: 'POST',
        body: formData,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      const result = await response.json();

      if (response.ok) {
        setAsrResult({
          text: result.text || "",
          language: result.language || null,
          confidence: result.confidence || null
        });
        toast.success("AI识别完成！");
      } else {
        setAsrError(result.error || "识别失败");
        toast.error("AI识别失败（这很正常！）");
      }

    } catch (error) {
      console.error("ASR API Error:", error);
      setAsrError("网络错误或服务不可用");
      toast.error("AI识别服务暂时不可用");
    } finally {
      setIsAsrProcessing(false);
    }
  };

  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const supportedMimeType = getSupportedMimeType();
      setMimeType(supportedMimeType);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: supportedMimeType });
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => { // Changed to async to await ASR
        const audioBlob = new Blob(audioChunks, { type: supportedMimeType });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));

        // 停止所有音频轨道
        stream.getTracks().forEach(track => track.stop());

        // 新增：录音完成后自动进行ASR识别
        await performAsrRecognition(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // 开始计时
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Error starting recording:", error);
      if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
        toast.error("麦克风权限被拒绝", {
          description: "请在浏览器设置中允许本网站访问您的麦克风，然后重试。",
          duration: 6000,
        });
      } else {
        toast.error("无法开始录音", {
          description: `发生未知错误，请刷新页面或检查您的设备。(${error.name})`,
          duration: 6000,
        });
      }
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      // 关键修复：录音停止后，将录音时长直接设置为播放时长
      setDuration(recordingTime);
    }
  };

  // 重新录音
  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    setPlaybackTime(0);
    setDuration(0); // 重置时确保duration也清零
    setSelectedPrompt(null);
    setTranscript(""); // Also clear transcript on reset

    // 重置ASR相关状态
    setAsrResult(null);
    setAsrError(null);
    setIsAsrProcessing(false);

    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }
  };

  // 播放/暂停音频
  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    } else {
      audioRef.current.play();
      setIsPlaying(true);

      // 开始更新播放进度
      playbackIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setPlaybackTime(audioRef.current.currentTime);
        }
      }, 100);
    }
  };

  // 音频加载完成
  const handleAudioLoad = () => {
    if (audioRef.current) {
      // The duration might be loaded async, so setting it here
      // This is less critical now that `setDuration(recordingTime)` is used
      // after `stopRecording`, but good practice to keep.
      // We prioritize `recordingTime` for actual submission.
      if (duration === 0) { // Only set if not already set by recording time
        setDuration(audioRef.current.duration);
      }
    }
  };

  // 音频播放结束
  const handleAudioEnd = () => {
    setIsPlaying(false);
    setPlaybackTime(0);
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }
  };

  // 提交录音
  const handleSubmit = async () => {
    if (!audioBlob || !transcript.trim() || !selectedDialect) {
      toast.error("请填写所有必填字段");
      return;
    }

    setIsSubmitting(true);

    try {
      // 创建文件对象
      const extension = getFileExtension(mimeType);
      const fileName = `recording_${Date.now()}.${extension}`;
      const audioFile = new File([audioBlob], fileName, { type: mimeType });

      // Upload audio file
      const { file_url } = await UploadFile({ file: audioFile });
      console.log("Audio uploaded:", file_url);

      // Use the actual recorded duration, not the playback duration
      const actualDuration = recordingTime || duration || 0;

      // Create recording record
      const recordingData = {
        audio_url: file_url,
        transcript: transcript.trim(),
        dialect: selectedDialect,
        user_id: user?.id || null,
        duration: actualDuration,
        quality_score: 5,
        is_approved: false,
        prompt_id: selectedPrompt ? selectedPrompt.id : null
      };

      await DialectRecord.create(recordingData);

      // Update user stats
      if (user) {
        const newRecordingCount = (user.total_recordings || 0) + 1;
        const newXP = (user.total_xp || 0) + 10;
        const newLevel = Math.floor(newXP / 100) + 1;

        await User.updateMyUserData({
          total_recordings: newRecordingCount,
          total_xp: newXP,
          level: newLevel,
          last_contribution_date: new Date().toISOString().split('T')[0]
        });

        // Update local user state
        setUser(prev => ({
          ...prev,
          total_recordings: newRecordingCount,
          total_xp: newXP,
          level: newLevel,
          last_contribution_date: new Date().toISOString().split('T')[0]
        }));

        // Check achievements
        await checkAchievements(newRecordingCount);

        // Trigger global user update event
        window.dispatchEvent(new CustomEvent('userUpdated'));
      }

      toast.success("录音提交成功！");

      // Reset form
      setTranscript("");
      resetRecording();

    } catch (error) {
      console.error("Error submitting recording:", error);
      toast.error("提交失败，请重试");
    }

    setIsSubmitting(false);
  };

  // 格式化时间
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) {
      return "0:00";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 处理提示词选择
  const handlePromptSelect = (prompt) => {
    setTranscript(prompt.prompt_text);
    setSelectedPrompt(prompt);
    toast.info(`已选用提示："${prompt.prompt_text}"`);
  };

  // 获取过滤后的提示词
  const getFilteredPrompts = () => {
    if (!prompts || prompts.length === 0) return [];
    return prompts.filter(p =>
      !selectedDialect || p.dialect === selectedDialect || p.dialect === "其他"
    );
  };

  // 复制ASR识别结果到输入框
  const copyAsrToInput = () => {
    if (asrResult?.text) {
      setTranscript(asrResult.text);
      toast.info("已复制识别结果到输入框");
    }
  };

  // 显示登录页面
  if (isUserLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-orange-200 rounded-full"></div>
          <div className="h-6 bg-orange-200 rounded w-48"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-orange-900 mb-2">保护家乡方言</h1>
            <p className="text-orange-600">用您的声音为AI训练贡献数据</p>
          </motion.div>

          <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
            <CardContent className="p-6 text-center">
              <Button
                onClick={() => User.loginWithRedirect(window.location.href)}
                className="w-full bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white shadow-lg text-lg py-6"
                size="lg"
              >
                <UserPlus className="w-5 h-5 mr-3" />
                立即登录
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const filteredPrompts = getFilteredPrompts();

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题和说明 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-orange-900 mb-4">
            🎙️ 方言数据贡献
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-4xl mx-auto">
            <div className="flex items-start gap-3">
              <Target className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-blue-900 mb-2">您的任务：帮助训练方言AI模型</h3>
                <p className="text-sm text-blue-700 mb-2">
                  主流AI无法识别您家乡的独特方言。您的贡献将从零开始，为您的家乡建立独一无二的语音数据库。
                </p>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>1. 先选择方言</strong> → 告诉我们您要录制哪种方言</p>
                  <p><strong>2. 录制语音</strong> → 用方言朗读文字（AI会尝试识别，通常会失败😊）</p>
                  <p><strong>3. 输入正确文字</strong> → 告诉我们您刚才说的标准文字是什么</p>
                  <p className="text-blue-600 mt-2">💡 <strong>重点：</strong>您的数据将用于训练更好的方言识别AI！</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* 步骤1：选择方言 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="order-1"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  选择方言
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dialect">您要录制哪种方言？ *</Label>
                  <Select value={selectedDialect} onValueChange={setSelectedDialect}>
                    <SelectTrigger className="border-orange-300 focus:ring-orange-500">
                      <SelectValue placeholder="请先选择方言" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIALECTS.map(dialect => (
                        <SelectItem key={dialect} value={dialect}>
                          {dialect}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDialect && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-800 font-medium">
                        已选择：{selectedDialect}
                      </span>
                    </div>
                  </div>
                )}

                {!selectedDialect && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      <span className="text-amber-800 text-sm">
                        请先选择方言，再进行录音
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* 步骤2：录音控制 */}
          <motion.div
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="order-2"
          >
            <Card className={`backdrop-blur-sm shadow-lg h-full ${
              selectedDialect
                ? 'bg-white/80 border-orange-200'
                : 'bg-gray-50/80 border-gray-200'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-700">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    selectedDialect
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-400 text-white'
                  }`}>2</div>
                  录制语音
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!selectedDialect && (
                  <div className="text-center py-8 text-gray-500">
                    <Mic className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>请先选择方言</p>
                  </div>
                )}

                {selectedDialect && (
                  <>
                    {/* 录音按钮 */}
                    <div className="flex justify-center">
                      <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isSubmitting}
                        className={`
                          w-20 h-20 rounded-full shadow-lg transition-all duration-300
                          ${isRecording
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                            : 'bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600'
                          }
                        `}
                      >
                        {isRecording ? (
                          <MicOff className="w-8 h-8 text-white" />
                        ) : (
                          <Mic className="w-8 h-8 text-white" />
                        )}
                      </Button>
                    </div>

                    {/* 录音时间显示 */}
                    <div className="text-center">
                      <p className="text-2xl font-mono text-orange-900">
                        {formatTime(recordingTime)}
                      </p>
                      <p className="text-sm text-orange-600">
                        {isRecording ? "正在录音中..." : "点击开始录音"}
                      </p>
                    </div>

                    {/* 音频播放器 */}
                    {audioUrl && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center gap-4">
                          <Button
                            onClick={togglePlayback}
                            variant="outline"
                            className="border-orange-300 text-orange-700 hover:bg-orange-50"
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            onClick={resetRecording}
                            variant="outline"
                            className="border-orange-300 text-orange-700 hover:bg-orange-50"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-orange-600">
                            <span>{formatTime(playbackTime)}</span>
                            <span>{formatTime(duration)}</span>
                          </div>
                          <div className="w-full bg-orange-100 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-orange-400 to-amber-500 h-2 rounded-full transition-all duration-100"
                              style={{ width: `${duration > 0 ? (playbackTime / duration) * 100 : 0}%` }}
                            />
                          </div>
                        </div>

                        <audio
                          ref={audioRef}
                          src={audioUrl}
                          onLoadedMetadata={handleAudioLoad}
                          onEnded={handleAudioEnd}
                          className="hidden"
                        />
                      </div>
                    )}

                    {/* AI识别结果 */}
                    {(isAsrProcessing || asrResult || asrError) && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                          <Zap className="w-4 h-4" />
                          AI识别尝试 (展示当前能力)
                        </div>

                        {isAsrProcessing && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              <span className="text-sm text-blue-700">AI正在尝试识别...</span>
                            </div>
                          </div>
                        )}

                        {asrResult && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Zap className="w-4 h-4 text-yellow-600" />
                                  <span className="text-sm font-medium text-yellow-700">AI猜测结果</span>
                                  {asrResult.language && (
                                    <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700 bg-yellow-100">
                                      {asrResult.language}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-yellow-800 font-medium">
                                  "{asrResult.text}"
                                </p>
                                <p className="text-xs text-yellow-600 mt-1">
                                  （通常不准确，这就是为什么需要您的输入！）
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={copyAsrToInput}
                                className="shrink-0 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                使用
                              </Button>
                            </div>
                          </div>
                        )}

                        {asrError && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-700">
                                AI识别失败（很正常！这正是需要改进的地方）
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* 步骤3：输入正确文字 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="order-3 lg:order-3"
          >
            <Card className={`backdrop-blur-sm shadow-lg h-full ${
              audioBlob && selectedDialect
                ? 'bg-white/80 border-orange-200'
                : 'bg-gray-50/80 border-gray-200'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-700">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    audioBlob && selectedDialect
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-400 text-white'
                  }`}>3</div>
                  输入正确文字
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!(audioBlob && selectedDialect) && (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>请先完成录音</p>
                  </div>
                )}

                {audioBlob && selectedDialect && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="transcript">您刚才说的标准文字是什么？ *</Label>
                        {asrResult && !isAsrProcessing && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={copyAsrToInput}
                            className="text-xs h-6 px-2 text-orange-600 hover:bg-orange-50"
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            使用AI猜测
                          </Button>
                        )}
                      </div>
                      <Input
                        id="transcript"
                        placeholder="输入您刚才用方言说的标准文字..."
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        className="border-orange-300 focus:ring-orange-500"
                      />
                      {selectedPrompt && (
                        <p className="text-sm text-orange-600">
                          已选用提示: "{selectedPrompt.prompt_text}" ({selectedPrompt.dialect})
                        </p>
                      )}
                    </div>

                    <div className="pt-4">
                      <Button
                        onClick={handleSubmit}
                        disabled={!audioBlob || !transcript.trim() || !selectedDialect || isSubmitting}
                        className="w-full bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white shadow-lg"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            贡献数据中...
                          </div>
                        ) : (
                          <>
                            <Heart className="w-4 h-4 mr-2" />
                            贡献训练数据
                          </>
                        )}
                      </Button>
                    </div>

                    {(!audioBlob || !transcript.trim() || !selectedDialect) && (
                      <div className="flex items-center gap-2 text-orange-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>请完成所有步骤</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* 推荐短语面板 - 放在最后 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="order-4 lg:col-span-2 xl:col-span-3"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <Lightbulb className="w-5 h-5" />
                  推荐录制内容
                  {selectedDialect && (
                    <Badge className="bg-orange-100 text-orange-700">
                      {selectedDialect}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isPromptsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-3" />
                    <p className="text-orange-600">正在加载推荐内容...</p>
                  </div>
                ) : !selectedDialect ? (
                  <div className="text-center py-8 text-orange-600">
                    <p>请先选择方言查看推荐内容</p>
                  </div>
                ) : filteredPrompts.length === 0 ? (
                  <div className="text-center py-8 text-orange-600">
                    <p>该方言暂无推荐内容</p>
                    <p className="text-sm mt-1 text-orange-500">您可以录制任何{selectedDialect}内容。</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredPrompts.slice(0, 6).map((prompt) => (
                      <div
                        key={prompt.id}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          selectedPrompt?.id === prompt.id
                            ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white border-orange-400'
                            : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 hover:border-orange-300'
                        }`}
                        onClick={() => handlePromptSelect(prompt)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium mb-1 ${
                              selectedPrompt?.id === prompt.id ? 'text-white' : 'text-orange-900'
                            }`}>
                              {prompt.prompt_text}
                            </p>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant="secondary"
                                className={`text-xs ${
                                  selectedPrompt?.id === prompt.id
                                    ? 'bg-white/20 text-white border-white/30'
                                    : 'bg-orange-100 text-orange-700 border-orange-300'
                                }`}
                              >
                                {prompt.category}
                              </Badge>
                            </div>
                          </div>
                          <ArrowRight className={`w-4 h-4 ${
                            selectedPrompt?.id === prompt.id ? 'text-white' : 'text-orange-600'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* 成就解锁通知 */}
        <AnimatePresence>
          {showAchievement && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowAchievement(null)}
            >
              <Card className="bg-white max-w-md mx-4 border-4 border-yellow-400 shadow-2xl">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    🎉 成就解锁！
                  </h3>
                  <h4 className="text-xl font-semibold text-yellow-700 mb-2">
                    {showAchievement.name}
                  </h4>
                  <p className="text-gray-600 mb-4">
                    {showAchievement.description}
                  </p>
                  <Button
                    onClick={() => setShowAchievement(null)}
                    className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    太棒了！
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
