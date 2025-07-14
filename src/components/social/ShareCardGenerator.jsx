import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareCardGenerator({ user, badge, onClose }) {
  const [copied, setCopied] = useState(false);
  
  // Generate the share link
  const shareLink = `${window.location.origin}/Badges?invite=${user.id}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('链接已复制到剪贴板！');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('复制失败，请手动复制链接');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white border-2 border-orange-200 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-orange-900">分享我的徽章</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-orange-600 hover:text-orange-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Badge Display */}
          <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
              {badge.icon && <badge.icon className="w-8 h-8 text-white" />}
            </div>
            <h3 className="font-bold text-orange-900 text-lg mb-1">{badge.title}</h3>
            <p className="text-sm text-orange-700">{badge.subtitle}</p>
          </div>

          {/* Share Message */}
          <div className="text-center">
            <p className="text-gray-700 mb-4">
              我在Wu无言引擎获得了新徽章！快来看看我的成就吧 🏆
            </p>
          </div>

          {/* Share Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">分享链接</label>
            <div className="flex gap-2">
              <Input
                value={shareLink}
                readOnly
                className="flex-1 bg-gray-50 border-gray-300 text-sm"
              />
              <Button
                onClick={handleCopy}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                size="sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p>• 复制链接分享给朋友</p>
            <p>• 他们点击链接后会看到你的徽章页面</p>
            <p>• 鼓励更多人加入方言保护行动！</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}