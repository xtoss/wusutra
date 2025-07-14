import { Trophy, Star, Award, Crown, Zap, ShieldCheck, Flame, Heart, Target, Diamond, Gem, Sparkles, Rocket, Medal, Users, Globe } from "lucide-react";

export const achievementsList = [
    // 录音数量成就
    {
      id: "first_recording",
      name: "初次尝试",
      description: "完成第一次录音",
      icon: Star,
      threshold: 1,
      color: "bg-yellow-100 text-yellow-800",
      borderColor: "border-yellow-300"
    },
    {
      id: "getting_started",
      name: "初入门径",
      description: "完成5次录音",
      icon: Target,
      threshold: 5,
      color: "bg-blue-100 text-blue-800",
      borderColor: "border-blue-300"
    },
    {
      id: "dedicated_contributor",
      name: "积极贡献者",
      description: "完成10次录音",
      icon: Award,
      threshold: 10,
      color: "bg-green-100 text-green-800",
      borderColor: "border-green-300"
    },
    {
      id: "milestone_25",
      name: "小有成就",
      description: "完成25次录音",
      icon: Medal,
      threshold: 25,
      color: "bg-purple-100 text-purple-800",
      borderColor: "border-purple-300"
    },
    {
      id: "milestone_50",
      name: "方言专家",
      description: "完成50次录音",
      icon: Trophy,
      threshold: 50,
      color: "bg-orange-100 text-orange-800",
      borderColor: "border-orange-300"
    },
    {
      id: "milestone_100",
      name: "社区领袖",
      description: "完成100次录音",
      icon: Crown,
      threshold: 100,
      color: "bg-red-100 text-red-800",
      borderColor: "border-red-300"
    },
    {
      id: "milestone_200",
      name: "文化守护者",
      description: "完成200次录音",
      icon: ShieldCheck,
      threshold: 200,
      color: "bg-indigo-100 text-indigo-800",
      borderColor: "border-indigo-300"
    },
    {
      id: "milestone_500",
      name: "方言大师",
      description: "完成500次录音",
      icon: Diamond,
      threshold: 500,
      color: "bg-pink-100 text-pink-800",
      borderColor: "border-pink-300"
    },
    {
      id: "milestone_1000",
      name: "传承之光",
      description: "完成1000次录音",
      icon: Gem,
      threshold: 1000,
      color: "bg-cyan-100 text-cyan-800",
      borderColor: "border-cyan-300"
    },
    
    // 连续性成就
    {
      id: "week_streak",
      name: "七日坚持",
      description: "连续7天录音",
      icon: Flame,
      threshold: 7,
      color: "bg-orange-100 text-orange-800",
      borderColor: "border-orange-300",
      type: "streak",
      isHonorBadge: true,
      gradient: "bg-gradient-to-br from-orange-400 to-red-500"
    },
    {
      id: "month_streak",
      name: "月度坚持",
      description: "连续30天录音",
      icon: Rocket,
      threshold: 30,
      color: "bg-red-100 text-red-800",
      borderColor: "border-red-300",
      type: "streak"
    },
    
    // 特殊成就
    {
      id: "reviewer_unlock",
      name: "审核之眼",
      description: "解锁审核员身份",
      icon: ShieldCheck,
      threshold: 1,
      color: "bg-green-100 text-green-800",
      borderColor: "border-green-300",
      type: "special",
      isHonorBadge: true,
      gradient: "bg-gradient-to-br from-green-400 to-teal-500"
    },
    {
      id: "community_helper",
      name: "社区助手",
      description: "审核通过50个录音",
      icon: Users,
      threshold: 50,
      color: "bg-teal-100 text-teal-800",
      borderColor: "border-teal-300",
      type: "review"
    },
    {
      id: "dialect_explorer",
      name: "方言探索者",
      description: "录制3种不同方言",
      icon: Globe,
      threshold: 3,
      color: "bg-violet-100 text-violet-800",
      borderColor: "border-violet-300",
      type: "variety",
      isHonorBadge: true,
      gradient: "bg-gradient-to-br from-violet-400 to-indigo-600"
    },
    {
      id: "quality_master",
      name: "品质大师",
      description: "获得100个赞",
      icon: Heart,
      threshold: 100,
      color: "bg-rose-100 text-rose-800",
      borderColor: "border-rose-300",
      type: "votes",
      isHonorBadge: true,
      gradient: "bg-gradient-to-br from-rose-400 to-pink-500"
    },
    {
      id: "speed_demon",
      name: "效率之王",
      description: "单日录制10个录音",
      icon: Zap,
      threshold: 10,
      color: "bg-yellow-100 text-yellow-800",
      borderColor: "border-yellow-300",
      type: "daily"
    },
    {
      id: "legend",
      name: "传奇人物",
      description: "达到20级",
      icon: Sparkles,
      threshold: 20,
      color: "bg-gradient-to-r from-purple-400 to-pink-400 text-white",
      borderColor: "border-purple-300",
      type: "level",
      isHonorBadge: true,
      gradient: "bg-gradient-to-br from-purple-500 to-pink-600"
    }
  ];