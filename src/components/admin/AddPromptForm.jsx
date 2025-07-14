
import React, { useState, useEffect } from 'react';
import { DailyPrompt, User } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { PlusCircle } from 'lucide-react';
import { DIALECTS } from '@/components/lib/dialects';

const CATEGORIES = ["日常对话", "数字", "颜色", "食物", "家庭", "天气", "时间", "问候"];
const DIFFICULTIES = ["简单", "中等", "困难"];

export default function AddPromptForm({ onPromptAdded }) {
  const [promptText, setPromptText] = useState('');
  const [dialect, setDialect] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('简单');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canAddPrompts, setCanAddPrompts] = useState(false);
  const [userLevel, setUserLevel] = useState(1);

  useEffect(() => {
    checkUserPermissions();
  }, []);

  const checkUserPermissions = async () => {
    try {
      const user = await User.me();
      const level = user.level || 1;
      setUserLevel(level);
      
      // 8级或管理员可以添加提示词
      const hasPermission = level >= 8 || user.is_admin;
      setCanAddPrompts(hasPermission);
    } catch (error) {
      console.error("Error checking user permissions:", error);
      setCanAddPrompts(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!promptText || !dialect || !category) {
      toast.error("请填写所有必填字段");
      return;
    }
    setIsSubmitting(true);
    try {
      await DailyPrompt.create({
        prompt_text: promptText,
        dialect,
        category,
        difficulty,
        is_active: true
      });
      toast.success("短语添加成功");
      // Reset form
      setPromptText('');
      setDialect('');
      setCategory('');
      setDifficulty('简单');
      // Notify parent to refresh list
      if (onPromptAdded) {
        onPromptAdded();
      }
    } catch (error) {
      console.error("Error adding prompt:", error);
      toast.error("添加失败");
    }
    setIsSubmitting(false);
  };

  if (!canAddPrompts) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
        <CardContent className="text-center py-8">
          <PlusCircle className="w-12 h-12 mx-auto mb-3 text-orange-300" />
          <h3 className="font-medium text-orange-900 mb-2">需要8级权限</h3>
          <p className="text-orange-600 text-sm">
            当前等级: {userLevel} | 达到8级后可创建提示短语
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <PlusCircle className="w-5 h-5" />
          添加新的提示短语
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-orange-800">短语内容</label>
            <Textarea value={promptText} onChange={(e) => setPromptText(e.target.value)} placeholder="例如：今天天气怎么样？" className="border-orange-300 focus:ring-orange-500"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-orange-800">方言</label>
              <Select value={dialect} onValueChange={setDialect}>
                <SelectTrigger className="border-orange-300 focus:ring-orange-500"><SelectValue placeholder="选择方言" /></SelectTrigger>
                <SelectContent>{DIALECTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-orange-800">类别</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="border-orange-300 focus:ring-orange-500"><SelectValue placeholder="选择类别" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-orange-800">难度</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="border-orange-300 focus:ring-orange-500"><SelectValue /></SelectTrigger>
                <SelectContent>{DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white shadow-md">
            {isSubmitting ? '添加中...' : '确认添加'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
