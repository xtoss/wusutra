import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { UserPlus, AlertTriangle } from 'lucide-react';

export default function InviteUserForm({ onUserInvited }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("请输入有效的邮箱地址");
      return;
    }
    
    // Simple email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("邮箱格式不正确");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 注意：用户邀请功能需要 base44 平台支持
      // 目前 base44 可能还没有提供用户邀请的 API 接口
      // 这里我们先记录邀请请求，等平台支持后再实现真正的邀请功能
      
      toast.info(`邀请功能正在开发中。请手动分享应用链接给 ${email}`);
      
      // 暂时的解决方案：生成邀请链接让管理员手动发送
      const inviteLink = window.location.origin;
      const message = `
邮箱: ${email}
邀请链接: ${inviteLink}
时间: ${new Date().toLocaleString('zh-CN')}

请手动发送以下邀请邮件:
---
主题: Wu无言引擎邀请
内容: 
您好！

我邀请您加入Wu无言引擎，一起保护和传承珍贵的方言文化。

访问链接: ${inviteLink}

---
      `;
      
      console.log("用户邀请请求:", message);
      
      setEmail('');
      if (onUserInvited) {
        onUserInvited();
      }
    } catch (error) {
      console.error("Error with invite:", error);
      toast.error("邀请功能暂时不可用，请稍后重试");
    }
    
    setIsSubmitting(false);
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <UserPlus className="w-5 h-5" />
          邀请新用户
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">邀请功能说明</p>
              <p>邀请功能需要平台邮件服务支持。目前请手动分享应用链接。</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-orange-800">用户邮箱</label>
            <Input 
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="请输入被邀请人的邮箱地址" 
              className="border-orange-300 focus:ring-orange-500"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md"
          >
            {isSubmitting ? '处理中...' : '记录邀请请求'}
          </Button>
        </form>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800 text-center">
            当前方案：记录邀请请求，生成邀请信息供手动发送。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}