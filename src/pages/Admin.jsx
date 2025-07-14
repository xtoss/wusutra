
import React, { useState, useEffect } from "react";
import { DialectRecord, User, DailyPrompt, Feedback } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Settings, Download, Users as UsersIcon, Mic, FileText, Play, Check, X, ShieldOff, Trash2,
  Star, StarOff, RotateCcw, User as UserIcon, MessageSquare, Edit
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import AddPromptForm from "../components/admin/AddPromptForm";
import InviteUserForm from "../components/admin/InviteUserForm";
import LeaderboardManager from "../components/admin/LeaderboardManager";
import UserSyncManager from "../components/admin/UserSyncManager"; // New import

export default function Admin() {
  const [recordings, setRecordings] = useState([]);
  const [users, setUsers] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // --- Data Loading Functions ---
  const loadRecordings = async () => {
    setIsLoadingRecordings(true);
    try {
      const recordingsData = await DialectRecord.list('-created_date', 100);
      setRecordings(recordingsData);
    } catch (error) {
      console.error("Error loading recordings:", error);
      toast.error("加载录音数据失败");
    } finally {
      setIsLoadingRecordings(false);
    }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const usersData = await User.list();
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("加载用户数据失败");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadPrompts = async () => {
    setIsLoadingPrompts(true);
    try {
      const promptsData = await DailyPrompt.list('-created_date', 50);
      setPrompts(promptsData);
    } catch (error) {
      console.error("Error loading prompts:", error);
      toast.error("加载提示数据失败");
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  const loadFeedback = async () => {
    setIsLoadingFeedback(true);
    try {
      const feedbackData = await Feedback.list('-created_date', 100);
      setFeedback(feedbackData);
    } catch (error) {
      console.error("Error loading feedback:", error);
      toast.error("加载意见反馈数据失败");
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const loadAdminData = async () => {
    setIsLoadingPage(true);
    try {
      const me = await User.me();
      setCurrentUser(me);

      // Check admin permissions
      if (!me.is_admin) {
        toast.error("您没有管理员权限");
        setIsLoadingPage(false);
        return;
      }

      // Load data sequentially with delays to avoid rate limiting
      await loadRecordings();
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadUsers();
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadPrompts();
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadFeedback();

    } catch (error) {
      if (error.message?.includes('429') || error.response?.status === 429) {
        toast.error("管理面板加载过于频繁，请稍后刷新");
      } else {
        console.error("Error loading admin data:", error);
        toast.error("加载管理数据失败");
      }
    }
    setIsLoadingPage(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAdminData();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // --- Action Handlers ---
  const handleUserAction = async (userId, action) => {
    if (!currentUser) return toast.error("无法获取当前用户信息，请刷新重试");
    const user = users.find(u => u.id === userId);
    if (!user) return toast.error("用户未找到");

    try {
      switch (action) {
        case 'makeReviewer':
          await User.update(userId, { is_reviewer: true });
          toast.success(`${user.full_name || user.email} 已设置为审核员`);
          break;
        case 'removeReviewer':
          await User.update(userId, { is_reviewer: false });
          toast.success(`已移除 ${user.full_name || user.email} 的审核员权限`);
          break;
        case 'makeAdmin':
          await User.update(userId, { is_admin: true });
          toast.success(`${user.full_name || user.email} 已设置为管理员`);
          break;
        case 'removeAdmin':
          if (userId === currentUser.id) {
            toast.error("无法移除自己的管理员权限");
            return;
          }
          await User.update(userId, { is_admin: false });
          toast.success(`已移除 ${user.full_name || user.email} 的管理员权限`);
          break;
        default:
          console.warn("Unknown user action:", action);
          return;
      }
      loadUsers(); // Refresh users list
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("操作失败，请重试");
    }
  };

  const handleRecordingAction = async (recordingId, action) => {
    if (!currentUser) return toast.error("无法获取当前用户信息，请刷新重试");
    try {
      const updateData = {};
      switch (action) {
        case 'approve':
          updateData.is_approved = true;
          updateData.reviewed_by = currentUser.id;
          updateData.reviewed_at = new Date().toISOString();
          await DialectRecord.update(recordingId, updateData);
          toast.success("录音已批准");
          break;
        case 'reject':
          updateData.is_approved = false;
          updateData.reviewed_by = currentUser.id;
          updateData.reviewed_at = new Date().toISOString();
          await DialectRecord.update(recordingId, updateData);
          toast.success("录音已拒绝");
          break;
        case 'feature':
          updateData.is_featured = true;
          await DialectRecord.update(recordingId, updateData);
          toast.success("录音已设为推荐");
          break;
        case 'unfeature':
          updateData.is_featured = false;
          await DialectRecord.update(recordingId, updateData);
          toast.success("录音已取消推荐");
          break;
        case 'softDelete':
          updateData.soft_deleted = true;
          updateData.deleted_by = currentUser.id;
          updateData.deleted_at = new Date().toISOString();
          await DialectRecord.update(recordingId, updateData);
          toast.success("录音已软删除");
          break;
        case 'restore':
          updateData.soft_deleted = false;
          updateData.deleted_by = null; // Clear deleted_by on restore
          updateData.deleted_at = null; // Clear deleted_at on restore
          await DialectRecord.update(recordingId, updateData);
          toast.success("录音已恢复");
          break;
        default:
          console.warn("Unknown recording action:", action);
          return;
      }
      loadRecordings(); // Refresh recordings list
    } catch (error) {
      console.error("Error updating recording:", error);
      toast.error("操作失败，请重试");
    }
  };

  const handleFeedbackStatusChange = async (feedbackId, newStatus) => {
    if (!currentUser?.is_admin) return toast.error("需要管理员权限");
    try {
      await Feedback.update(feedbackId, { status: newStatus });
      toast.success("反馈状态更新成功");
      loadFeedback(); // Refresh the list
    } catch (error) {
      console.error("Error updating feedback status:", error);
      toast.error("状态更新失败");
    }
  };

  const exportData = async () => {
    try {
      const approvedRecordings = recordings.filter(r => r.is_approved && !r.soft_deleted);
      const exportData = approvedRecordings.map(record => ({
        text: record.transcript,
        dialect: record.dialect,
        audio_url: record.audio_url,
        duration: record.duration,
        created_date: record.created_date,
        user_id: record.user_id
      }));

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dialect_corpus_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("数据导出成功");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("导出失败");
    }
  };

  const getStatus = (recording) => {
    if (recording.is_approved) {
      return { text: '已通过', className: 'bg-green-100 text-green-800' };
    }
    if (recording.is_approved === false && recording.reviewed_by) {
      return { text: '已拒绝', className: 'bg-red-100 text-red-800' };
    }
    return { text: '待审核', className: 'bg-yellow-100 text-yellow-800' };
  };

  const filteredRecordings = recordings.filter(recording => {
    // Only show active (non-soft-deleted) recordings by default
    if (recording.soft_deleted) return false;

    const isApproved = recording.is_approved === true;
    const isRejected = recording.is_approved === false && !!recording.reviewed_by;
    const isPending = recording.is_approved === false && !recording.reviewed_by;

    const matchesFilter = filter === "all" ||
      (filter === "approved" && isApproved) ||
      (filter === "pending" && isPending) ||
      (filter === "rejected" && isRejected);

    const matchesSearch = !searchQuery ||
      (recording.transcript || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (recording.dialect || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const stats = {
    totalRecordings: recordings.filter(r => !r.soft_deleted).length,
    approvedRecordings: recordings.filter(r => r.is_approved && !r.soft_deleted).length,
    pendingRecordings: recordings.filter(r => !r.is_approved && !r.reviewed_by && !r.soft_deleted).length,
    rejectedRecordings: recordings.filter(r => !r.is_approved && r.reviewed_by && !r.soft_deleted).length,
    deletedRecordings: recordings.filter(r => r.soft_deleted).length,
    totalUsers: users.length,
    activeUsers: users.filter(u => u.total_recordings > 0).length
  };

  if (isLoadingPage) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
          <CardContent className="text-center py-12">
            <ShieldOff className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">需要登录</h3>
            <p className="text-gray-600 mb-4">请先登录以访问管理面板</p>
            <Button
              onClick={() => User.loginWithRedirect(window.location.href)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              立即登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser.is_admin) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <Card className="bg-white/80 backdrop-blur-sm border-red-200 shadow-lg">
          <CardContent className="text-center py-12">
            <ShieldOff className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h3 className="text-lg font-medium text-red-900 mb-2">权限不足</h3>
            <p className="text-red-600 mb-4">只有管理员才能访问此页面</p>
            <p className="text-sm text-red-500">当前用户: {currentUser.email}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Common components for reuse in desktop and mobile views
  const RecordingsManager = () => (
    <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="text-gray-900">录音数据管理</CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="搜索录音..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 border-gray-300 focus:ring-blue-500"
            />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32 border-gray-300 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="approved">已通过</SelectItem>
                <SelectItem value="pending">待审核</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingRecordings ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p>加载录音数据...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>转录文本</TableHead>
                  <TableHead>方言</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>时长</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecordings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      没有符合条件的录音。
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecordings.map((recording) => (
                    <TableRow key={recording.id}>
                      <TableCell className="max-w-xs truncate">
                        {recording.transcript}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-700">
                          {recording.dialect}
                        </Badge>
                      </TableCell>
                      <TableCell>{recording.user_id || '匿名'}</TableCell>
                      <TableCell>
                        {recording.duration ? `${recording.duration.toFixed(1)}s` : '-'}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const status = getStatus(recording);
                          return <Badge className={status.className}>{status.text}</Badge>;
                        })()}
                        {recording.is_featured && (
                          <Badge className="ml-2 bg-purple-100 text-purple-700">推荐</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(recording.audio_url, '_blank')}
                            className="text-blue-600 hover:text-blue-700"
                            title="播放录音"
                          >
                            <Play className="w-4 h-4" />
                          </Button>

                          {/* Approve/Reject actions (only for pending/unreviewed) */}
                          {!recording.reviewed_by && (recording.is_approved === undefined || recording.is_approved === null || recording.is_approved === false) ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRecordingAction(recording.id, 'approve')}
                                className="text-green-600 hover:text-green-700"
                                title="批准"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRecordingAction(recording.id, 'reject')}
                                className="text-red-600 hover:text-red-700"
                                title="拒绝"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : null}

                          {/* Feature/Unfeature actions (only for approved and not soft deleted) */}
                          {recording.is_approved && !recording.soft_deleted ? (
                            recording.is_featured ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRecordingAction(recording.id, 'unfeature')}
                                className="text-purple-600 hover:text-purple-700"
                                title="取消推荐"
                              >
                                <StarOff className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRecordingAction(recording.id, 'feature')}
                                className="text-yellow-600 hover:text-yellow-700"
                                title="设为推荐"
                              >
                                <Star className="w-4 h-4" />
                              </Button>
                            )
                          ) : null}

                          {/* Soft delete/Restore actions */}
                          {recording.soft_deleted ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRecordingAction(recording.id, 'restore')}
                              className="text-orange-600 hover:text-orange-700"
                              title="恢复"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRecordingAction(recording.id, 'softDelete')}
                              className="text-gray-600 hover:text-gray-800"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const UsersManager = () => (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg mt-6">
        <CardHeader>
          <CardTitle className="text-gray-900">用户列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
              <p>加载用户数据...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>等级</TableHead>
                    <TableHead>录音数</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        没有用户数据。
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="头像" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <UserIcon className="w-4 h-4 text-gray-500" />
                              </div>
                            )}
                            <span className="font-medium">{user.display_name || user.full_name || "未设置"}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">等级 {user.level || 1}</Badge>
                        </TableCell>
                        <TableCell>{user.total_recordings || 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {user.is_admin && (
                              <Badge className="bg-red-100 text-red-800">管理员</Badge>
                            )}
                            {user.is_reviewer && (
                              <Badge className="bg-blue-100 text-blue-800">审核员</Badge>
                            )}
                            {user.is_anonymous && (
                              <Badge className="bg-gray-100 text-gray-800">匿名</Badge>
                            )}
                            {!user.is_admin && !user.is_reviewer && !user.is_anonymous && (
                              <Badge className="bg-gray-100 text-gray-600">普通用户</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            {!user.is_anonymous && (
                              user.is_reviewer ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUserAction(user.id, 'removeReviewer')}
                                >
                                  取消审核员
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUserAction(user.id, 'makeReviewer')}
                                >
                                  设为审核员
                                </Button>
                              )
                            )}

                            {!user.is_anonymous && user.id !== currentUser.id && (
                              user.is_admin ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUserAction(user.id, 'removeAdmin')}
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                  移除管理员
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUserAction(user.id, 'makeAdmin')}
                                  className="text-green-600 border-green-300 hover:bg-green-50"
                                >
                                  设为管理员
                                </Button>
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );

  const PromptsManager = () => (
    <>
      <AddPromptForm onPromptAdded={loadPrompts} />
      <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg mt-6">
        <CardHeader>
          <CardTitle className="text-gray-900">提示短语列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingPrompts ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
              <p>加载提示数据...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>短语内容</TableHead>
                    <TableHead>方言</TableHead>
                    <TableHead>类别</TableHead>
                    <TableHead>难度</TableHead>
                    <TableHead>状态</TableHead>
                    {/* <TableHead>操作</TableHead> Add actions here later if needed */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prompts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        没有提示短语。
                      </TableCell>
                    </TableRow>
                  ) : (
                    prompts.map((prompt) => (
                      <TableRow key={prompt.id}>
                        <TableCell>{prompt.prompt_text}</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-700">
                            {prompt.dialect}
                          </Badge>
                        </TableCell>
                        <TableCell>{prompt.category}</TableCell>
                        <TableCell>
                          <Badge className={`${
                            prompt.difficulty === '简单' ? 'bg-green-100 text-green-800' :
                              prompt.difficulty === '中等' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                            {prompt.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${
                            prompt.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}>
                            {prompt.is_active ? '启用' : '禁用'}
                          </Badge>
                        </TableCell>
                        {/* <TableCell>
                          {/* Add prompt actions like edit/delete here */}
                        {/* </TableCell> */}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );

  const FeedbackManager = () => (
    <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <MessageSquare className="w-5 h-5" />
          意见反馈管理
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingFeedback ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p>加载反馈数据...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>内容</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>提交者</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      暂无反馈。
                    </TableCell>
                  </TableRow>
                ) : (
                  feedback.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell className="max-w-sm truncate">{item.content}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={item.status} onValueChange={(newStatus) => handleFeedbackStatusChange(item.id, newStatus)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">待处理</SelectItem>
                            <SelectItem value="in_progress">处理中</SelectItem>
                            <SelectItem value="resolved">已解决</SelectItem>
                            <SelectItem value="closed">已关闭</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{item.contact_email || '匿名'}</TableCell>
                      <TableCell>
                        {/* Future actions can be added here */}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const InviteManager = () => <InviteUserForm onUserInvited={loadUsers} />;

  const SyncTools = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <LeaderboardManager />
      <UserSyncManager />
    </div>
  );


  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                管理面板
              </h1>
              <p className="text-gray-600 text-lg">
                管理录音数据、用户和系统设置
              </p>
              <p className="text-sm text-gray-500 mt-1">
                管理员: {currentUser.full_name || currentUser.email}
              </p>
            </div>
            <Button
              onClick={exportData}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
            >
              <Download className="w-4 h-4 mr-2" />
              导出数据
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-400 to-blue-600 text-white border-0">
            <CardContent className="p-4 text-center">
              <Mic className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalRecordings}</p>
              <p className="text-sm opacity-90">总录音</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-400 to-green-600 text-white border-0">
            <CardContent className="p-4 text-center">
              <Check className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.approvedRecordings}</p>
              <p className="text-sm opacity-90">已审核</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0">
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.pendingRecordings}</p>
              <p className="text-sm opacity-90">待审核</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-400 to-red-600 text-white border-0">
            <CardContent className="p-4 text-center">
              <X className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.rejectedRecordings}</p>
              <p className="text-sm opacity-90">已拒绝</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-400 to-purple-600 text-white border-0">
            <CardContent className="p-4 text-center">
              <UsersIcon className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-sm opacity-90">总用户</p>
            </CardContent>
          </Card>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block space-y-6">
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-white border">
              <TabsTrigger value="users">用户管理</TabsTrigger>
              <TabsTrigger value="recordings">录音管理</TabsTrigger>
              <TabsTrigger value="prompts">提示管理</TabsTrigger>
              <TabsTrigger value="feedback">意见反馈</TabsTrigger>
              <TabsTrigger value="invite">邀请用户</TabsTrigger>
            </TabsList>
            <TabsContent value="users">
              <UsersManager />
            </TabsContent>
            <TabsContent value="recordings">
              <RecordingsManager />
            </TabsContent>
            <TabsContent value="prompts">
              <PromptsManager />
            </TabsContent>
            <TabsContent value="feedback">
              <FeedbackManager />
            </TabsContent>
            <TabsContent value="invite">
              <InviteManager />
            </TabsContent>
          </Tabs>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <SyncTools />
          </motion.div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">用户</TabsTrigger>
              <TabsTrigger value="recordings">录音</TabsTrigger>
              <TabsTrigger value="tools">工具</TabsTrigger>
            </TabsList>
            <TabsContent value="users">
              <UsersManager />
            </TabsContent>
            <TabsContent value="recordings">
              <RecordingsManager />
            </TabsContent>
            <TabsContent value="tools" className="space-y-4">
              <PromptsManager />
              <FeedbackManager />
              <InviteManager />
              <SyncTools />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
