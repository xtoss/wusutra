
import React, { useState } from "react";
import { Feedback, User } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const FEEDBACK_CATEGORIES = [
  { value: "dialect_request", label: "方言支持请求" },
  { value: "bug_report", label: "错误报告" },
  { value: "feature_request", label: "功能建议" },
  { value: "other", label: "其他" }
];

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    contact_email: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
      toast.error("请填写所有必填字段");
      return;
    }

    setIsSubmitting(true);
    try {
      let userId = null;
      let userEmail = null;
      
      try {
        const user = await User.me();
        userId = user.id;
        userEmail = user.email;
      } catch (error) {
        // User not logged in, will submit as anonymous
        console.log("Submitting feedback as anonymous user");
      }

      // Create feedback record
      const feedbackRecord = await Feedback.create({
        user_id: userId,
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        contact_email: formData.contact_email.trim() || userEmail || null,
        status: "pending"
      });

      console.log("Feedback created:", feedbackRecord);

      // The email sending functionality has been removed as it was causing errors.
      // Feedback is now managed within the Admin Panel.
      // The original email sending code block has been removed here.

      toast.success("反馈提交成功！我们会尽快处理。");
      
      // Reset form
      setFormData({
        title: "",
        content: "",
        category: "",
        contact_email: ""
      });
      
    } catch (error) {
      console.error("Error submitting feedback:", error);
      if (error.message?.includes('429') || error.response?.status === 429) {
        toast.error("提交过于频繁，请稍后再试");
      } else {
        toast.error("提交失败，请重试");
      }
    }
    setIsSubmitting(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-orange-900 mb-2 hidden md:block">
            意见反馈
          </h1>
          <p className="text-orange-600 text-lg text-center md:text-left">
            有想法？遇到问题？随时告诉我们。
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="category">反馈类型 *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                    <SelectTrigger className="border-orange-300 focus:ring-orange-500">
                      <SelectValue placeholder="选择反馈类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {FEEDBACK_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">标题 *</Label>
                  <Input
                    id="title"
                    placeholder="简要描述您的反馈"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="border-orange-300 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">详细内容 *</Label>
                  <Textarea
                    id="content"
                    placeholder="请详细描述您的反馈内容..."
                    value={formData.content}
                    onChange={(e) => handleChange('content', e.target.value)}
                    className="border-orange-300 focus:ring-orange-500 min-h-[100px] md:min-h-[150px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">联系邮箱（可选）</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    placeholder="如需回复，请留下您的邮箱"
                    value={formData.contact_email}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                    className="border-orange-300 focus:ring-orange-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white shadow-lg"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      提交中...
                    </div>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      提交反馈
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
