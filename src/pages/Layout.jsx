

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User as B44User } from "@/api/entities";
import { Mic, Trophy, User, Settings, Home, MessageSquare, ShieldCheck, X, Menu, Award, Map, LogOut, Bot, Zap } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { toast } from 'react-hot-toast'; // Added toast import

const navigationItems = [
  { title: "主页", url: createPageUrl("Dashboard"), icon: Home },
  { title: "录音室", url: createPageUrl("Record"), icon: Mic },
  { title: "排行榜", url: createPageUrl("Leaderboard"), icon: Trophy },
  { title: "荣誉徽章", url: createPageUrl("Badges"), icon: Award },
  { title: "模型训练", url: createPageUrl("TrainingCountdown"), icon: Bot },
  { title: "训练成果", url: createPageUrl("UpgradeComplete"), icon: Zap },
  { title: "方言地图", url: createPageUrl("RegionalMap"), icon: Map },
  { title: "录音审核", url: createPageUrl("Review"), icon: ShieldCheck, reviewerOnly: true },
  { title: "我的资料", url: createPageUrl("Profile"), icon: User },
  { title: "意见反馈", url: createPageUrl("Feedback"), icon: MessageSquare },
  { title: "管理面板", url: createPageUrl("Admin"), icon: Settings, adminOnly: true },
];

export default function Layout({ children, currentPageName }) {
    const location = useLocation();
    const [currentUser, setCurrentUser] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const loadUser = async () => {
        try {
            const userData = await B44User.me();
            setCurrentUser(userData);
        } catch (e) {
            setCurrentUser(null);
        }
    };

    useEffect(() => {
        loadUser();
        window.addEventListener('userUpdated', loadUser);
        window.addEventListener('statsUpdated', loadUser);
        return () => {
          window.removeEventListener('userUpdated', loadUser);
          window.removeEventListener('statsUpdated', loadUser);
        }
    }, []);
    
    useEffect(() => {
        loadUser();
    }, [location]);

    const handleLogout = async () => {
        try {
            await B44User.logout();
            setCurrentUser(null);
            window.location.href = '/';
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const handleLogin = async () => {
      try {
        await B44User.login(); // Changed to B44User.login()
      } catch (error) {
        console.error("Login failed:", error);
        toast.error("登录跳转失败，请重试。");
      }
    };

    return (
        <div className="min-h-screen bg-white">
            <style jsx>{`
                :root {
                    --sidebar-background: 255 255 255;
                    --sidebar-foreground: 31 41 55;
                    --sidebar-primary: 17 24 39;
                    --sidebar-primary-foreground: 255 255 255;
                    --sidebar-accent: 243 244 246;
                    --sidebar-accent-foreground: 31 41 55;
                    --sidebar-border: 229 231 235;
                }
            `}</style>
            
            <div className="hidden lg:flex">
                <SidebarProvider>
                    <Sidebar className="border-r border-gray-200 bg-white">
                        <SidebarHeader className="p-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/63de0ea9e_ChatGPTImageJul9202509_33_28PM.png" alt="Wu Sutra Logo" className="w-10 h-10 object-contain" />
                                <div>
                                    <h1 className="text-lg font-bold text-gray-900">无言</h1>
                                    <p className="text-xs text-gray-500">保护珍贵的方言文化</p>
                                </div>
                            </div>
                        </SidebarHeader>
                        
                        <SidebarContent className="p-4">
                            <SidebarGroup>
                                <SidebarGroupLabel className="text-gray-600 font-medium">导航</SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {navigationItems.map((item) => {
                                            if (item.reviewerOnly && (!currentUser || !currentUser.is_reviewer)) {
                                                return null;
                                            }
                                            if (item.adminOnly && (!currentUser || !currentUser.is_admin)) {
                                                return null;
                                            }
                                            
                                            const isActive = location.pathname.includes(item.url.replace('/', '')) && item.url !== '/';
                                            const isHomeActive = item.url === '/' && location.pathname === '/';
                                            
                                            return (
                                                <SidebarMenuItem key={item.title}>
                                                    <SidebarMenuButton asChild className={`
                                                        transition-all duration-200 hover:bg-gray-100 rounded-lg mb-1
                                                        ${(isActive || isHomeActive) ? 'bg-gray-900 text-white hover:bg-gray-800' : 'text-gray-700 hover:text-gray-900'}
                                                    `}>
                                                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                                                            <item.icon className="w-5 h-5" />
                                                            <span className="font-medium">{item.title}</span>
                                                        </Link>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            );
                                        })}

                                        {/* Logout Button */}
                                        {currentUser && (
                                            <SidebarMenuItem>
                                                <SidebarMenuButton asChild className="transition-all duration-200 hover:bg-red-50 rounded-lg mb-1 text-red-600 hover:text-red-700">
                                                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-left">
                                                        <LogOut className="w-5 h-5" />
                                                        <span className="font-medium">退出登录</span>
                                                    </button>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        )}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        </SidebarContent>
                        
                        <SidebarFooter className="p-4 border-t border-gray-100">
                            {currentUser ? (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {currentUser.level || 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate text-sm">
                                            {currentUser.display_name || currentUser.full_name || currentUser.email}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {currentUser.total_xp || 0} XP
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Button 
                                        onClick={handleLogin} // Changed onClick
                                        className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                                        size="sm"
                                    >
                                        登录
                                    </Button>
                                    <p className="text-xs text-gray-500 mt-2">登录以查看资料</p>
                                </div>
                            )}
                        </SidebarFooter>
                    </Sidebar>
                    
                    <main className="flex-1">
                        {children}
                    </main>
                </SidebarProvider>
            </div>

            <div className="lg:hidden">
                <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/63de0ea9e_ChatGPTImageJul9202509_33_28PM.png" alt="Wu Sutra Logo" className="w-8 h-8 object-contain" />
                        <h1 className="text-lg font-bold text-gray-900">无言</h1>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {isMobileMenuOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="bg-white w-80 h-full p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-4">
                                {currentUser ? (
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-6">
                                        <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold">
                                            {currentUser.level || 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">
                                                {currentUser.display_name || currentUser.full_name || currentUser.email}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {currentUser.total_xp || 0} XP
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-xl mb-6 text-center">
                                        <Button 
                                            onClick={handleLogin} // Changed onClick
                                            className="w-full bg-gray-900 hover:bg-gray-800 text-white mb-2"
                                        >
                                            登录
                                        </Button>
                                    </div>
                                )}
                                
                                {navigationItems.map((item) => {
                                    if (item.reviewerOnly && (!currentUser || !currentUser.is_reviewer)) {
                                        return null;
                                    }
                                    if (item.adminOnly && (!currentUser || !currentUser.is_admin)) {
                                        return null;
                                    }
                                    
                                    const isActive = location.pathname.includes(item.url.replace('/', '')) && item.url !== '/';
                                    const isHomeActive = item.url === '/' && location.pathname === '/';
                                    
                                    return (
                                        <Link
                                            key={item.title}
                                            to={item.url}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`
                                                flex items-center gap-4 p-4 rounded-xl transition-all duration-200
                                                ${(isActive || isHomeActive) ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}
                                            `}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-medium">{item.title}</span>
                                        </Link>
                                    );
                                })}

                                {/* Mobile Logout Button */}
                                {currentUser && (
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-red-600 hover:bg-red-50 w-full text-left"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        <span className="font-medium">退出登录</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <main className="min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
}

