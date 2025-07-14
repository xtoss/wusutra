import React, { useState } from 'react';
import { User, DialectRecord } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, ArrowRight, Gift, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function AccountUpgrade({ anonymousUser, onUpgradeComplete }) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showBenefits, setShowBenefits] = useState(true);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      // 触发Google登录流程
      const loginUrl = await User.loginWithRedirect(
        `${window.location.origin}/upgrade-complete?anonymous_id=${anonymousUser.id}`
      );
      
      // 用户将被重定向到Google登录页面
      window.location.href = loginUrl;
      
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error("账户升级失败，请重试");
      setIsUpgrading(false);
    }
  };

  const benefits = [
    { icon: Award, title: "解锁成就系统", desc: "获得徽章、等级和经验值" },
    { icon: UserCheck, title: "审核员权限", desc: "3级后可参与录音审核" },
    { icon: Gift, title: "个人统计", desc: "查看详细的贡献数据" },
    { icon: ArrowRight, title: "排行榜", desc: "与其他用户比拼贡献度" }
  ];

  return (
    <AnimatePresence>
      {showBenefits && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <Card className="max-w-md w-full bg-white shadow-2xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl text-gray-900">
                升级您的账户
              </CardTitle>
              <p className="text-gray-600">
                亲爱的 {anonymousUser.anonymous_name}，您已贡献了 {anonymousUser.total_recordings} 条录音！
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">升级后您将获得：</h4>
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <benefit.icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{benefit.title}</p>
                      <p className="text-xs text-gray-600">{benefit.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-800 font-medium">
                  🎉 您的所有录音将自动保留并获得相应的经验值和成就！
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowBenefits(false)}
                  className="flex-1"
                  disabled={isUpgrading}
                >
                  稍后再说
                </Button>
                <Button
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  {isUpgrading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      升级中...
                    </div>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      立即升级
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}