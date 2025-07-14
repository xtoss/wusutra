
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Zap, CheckCircle, Mic, GitBranch, Bot, Hourglass, FileAudio } from 'lucide-react';
import { DialectRecord, TrainingLog } from '@/api/entities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { DIALECTS } from "../components/lib/dialects";


const TRAINING_THRESHOLD = 1000;


const UpgradedView = ({ dialect }) => {
    // This view is now hardcoded for the "江阴话" example.
    // In a real scenario, this would be dynamic based on dialect props.
    return (
        <div className="mt-6">
            <div className="relative flex items-center justify-center mb-12">
              <div className="w-full h-px bg-gray-300"></div>
              <div className="absolute bg-teal-500 text-white rounded-full p-2 ring-4 ring-green-100">
                <ArrowRight className="w-6 h-6" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Before */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="h-full border-gray-300">
                  <CardHeader>
                    <CardTitle className="text-gray-500">之前</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                      基于通用模型，对江阴话的特色词汇和语调识别存在较多偏差。
                    </p>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Mic className="w-4 h-4 text-gray-500" />
                        <span className="font-mono text-sm text-gray-700">"今朝吃刀样" (音频)</span>
                      </div>
                      <p className="font-semibold text-red-600">识别结果: "今早迟到呀"</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-semibold text-green-600">正确文本: "今天吃什么"</p>
                    </div>
                    <div className="pt-4 border-t">
                        <h4 className="font-semibold text-gray-700 mb-2">主要问题</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            <li>"刀样" 误识别为 "两个无耦合的字"</li>
                            <li>音调和方言特有词汇理解错误</li>
                        </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* After */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="h-full border-green-400 border-2 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-green-600">现在 (v2.1.0-jiangyin)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-green-800">
                      经过社区 <span className="font-bold">1k+</span> 条高质量录音的训练，模型已能精准识别。
                    </p>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Mic className="w-4 h-4 text-green-700" />
                        <span className="font-mono text-sm text-green-800">"Gnin-iue u-zo..." (音频)</span>
                      </div>
                      <p className="font-semibold text-green-600">识别结果: "今天吃什么"</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                        <p className="font-semibold text-green-600 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5"/>
                            与正确文本完全匹配
                        </p>
                    </div>
                    <div className="pt-4 border-t">
                        <h4 className="font-semibold text-green-700 mb-2">显著提升</h4>
                        <ul className="list-disc list-inside text-sm text-green-600 space-y-1">
                            <li>准确识别特定短语</li>
                            <li>对江阴话特有发音的适应性增强</li>
                            <li>整体识别准确率提升</li>
                        </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
        </div>
    );
};

const ProgressView = ({ dialect, stats }) => {
    if (!stats) return <p className="p-4 text-center">正在加载...</p>;
    
    return (
        <div className="p-4 space-y-4 text-center max-w-md mx-auto mt-6">
            <Hourglass className="w-12 h-12 mx-auto text-indigo-400" />
            <h3 className="text-xl font-semibold text-indigo-800">{dialect} 模型正在训练中...</h3>
            <p className="text-4xl font-bold text-indigo-700">{stats.newRecordings}</p>
            <p className="text-sm text-indigo-600 mb-2">/ {TRAINING_THRESHOLD} 条新录音</p>
            <Progress value={(stats.newRecordings / TRAINING_THRESHOLD) * 100} className="bg-indigo-100 [&>div]:bg-indigo-500" />
            <p className="mt-2 text-sm text-indigo-800">
                还需要 <span className="font-bold">{Math.max(0, TRAINING_THRESHOLD - stats.newRecordings)}</span> 条录音即可完成本次训练
            </p>
        </div>
    );
};

export default function UpgradeComplete() {
    const [stats, setStats] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTrainingStats = async () => {
            setIsLoading(true);
            try {
                const [approvedRecords, trainingLogs] = await Promise.all([
                    DialectRecord.filter({ is_approved: true }),
                    TrainingLog.list()
                ]);

                const logsByDialect = trainingLogs.reduce((acc, log) => {
                    if (!acc[log.dialect] || new Date(log.training_date) > new Date(acc[log.dialect].training_date)) {
                        acc[log.dialect] = log;
                    }
                    return acc;
                }, {});

                const recordsByDialect = approvedRecords.reduce((acc, record) => {
                    if (!acc[record.dialect]) acc[record.dialect] = [];
                    acc[record.dialect].push(record);
                    return acc;
                }, {});

                const dialectStats = {};
                DIALECTS.forEach(dialect => {
                    const lastLog = logsByDialect[dialect];
                    const totalApproved = recordsByDialect[dialect]?.length || 0;
                    const newRecordings = lastLog ? totalApproved - lastLog.recordings_count : totalApproved;
                    
                    dialectStats[dialect] = {
                        newRecordings: Math.max(0, newRecordings),
                        totalApproved,
                        isUpgraded: dialect === "江阴话", // Hardcoded for example
                        modelVersion: lastLog?.model_version,
                    };
                });
                
                setStats(dialectStats);

            } catch (error) {
                console.error("Error fetching training stats:", error);
                toast.error("加载训练数据失败");
            }
            setIsLoading(false);
        };
        fetchTrainingStats();
    }, []);

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-green-50 to-teal-50">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-block bg-green-100 text-green-700 p-3 rounded-full mb-4">
                        <Zap className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        无言引擎训练成果
                    </h1>
                    <p className="text-lg text-gray-600">
                        感谢社区的每一次贡献，共同见证“无言引擎”的进化。
                    </p>
                </motion.div>

                <Tabs defaultValue="江阴话" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
                        {DIALECTS.slice(0, 5).map(dialect => (
                            <TabsTrigger key={dialect} value={dialect}>{dialect}</TabsTrigger>
                        ))}
                    </TabsList>
                    {DIALECTS.slice(0, 5).map(dialect => (
                        <TabsContent key={dialect} value={dialect}>
                            {isLoading ? (
                                <p>加载中...</p>
                            ) : stats[dialect]?.isUpgraded ? (
                                <UpgradedView dialect={dialect} />
                            ) : (
                                <ProgressView dialect={dialect} stats={stats[dialect]} />
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </div>
    );
};
