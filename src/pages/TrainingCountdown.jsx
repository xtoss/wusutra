
import React, { useState, useEffect } from 'react';
import { DialectRecord, TrainingLog } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Hourglass, CheckCircle, FileAudio, GitBranch } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { DIALECTS } from "../components/lib/dialects";

const TRAINING_THRESHOLD = 500; // 500条新录音触发训练
const TRAINING_INTERVAL_HOURS = 24; // 24小时触发一次训练

const CountdownTimer = ({ targetDate }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  if (!Object.keys(timeLeft).length) {
      return <span className="text-2xl font-bold text-green-600">即将开始...</span>
  }

  return (
    <div className="flex items-center gap-2 text-3xl font-mono text-purple-700">
        <span>{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-2xl">:</span>
        <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-2xl">:</span>
        <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
    </div>
  );
};

export default function TrainingCountdown() {
  const [stats, setStats] = useState({});
  const [globalTime, setGlobalTime] = useState({ nextTrainingDate: null, lastTrainingDate: null});
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
          if (!acc[record.dialect]) {
            acc[record.dialect] = [];
          }
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
            lastTrainingDate: lastLog?.training_date,
            modelVersion: lastLog?.model_version,
          };
        });

        setStats(dialectStats);
        
        const mostRecentLog = trainingLogs.reduce((latest, log) => {
            return latest && new Date(latest.training_date) > new Date(log.training_date) ? latest : log;
        }, null);

        const lastTrainingDate = mostRecentLog ? new Date(mostRecentLog.training_date) : new Date(0);
        const nextTrainingDate = new Date(lastTrainingDate.getTime() + TRAINING_INTERVAL_HOURS * 60 * 60 * 1000);
        setGlobalTime({ nextTrainingDate, lastTrainingDate });

      } catch (error) {
        console.error("Error fetching training stats:", error);
        toast.error("加载训练数据失败");
      }
      setIsLoading(false);
    };
    fetchTrainingStats();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
          <div className="h-8 bg-gray-300 rounded w-48"></div>
          <div className="h-24 bg-gray-300 rounded-lg w-full max-w-md"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Bot className="w-16 h-16 mx-auto mb-4 text-indigo-500" />
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-900 mb-2">
            无言引擎训练中心
          </h1>
          <p className="text-indigo-600 text-lg">
            您的每一次录音，都在塑造更智能的方言之声。
          </p>
        </motion.div>
        
        <Card className="mt-6 bg-indigo-50/50 border-indigo-200 text-left">
          <CardContent className="p-4">
            <h3 className="font-semibold text-indigo-900 mb-2">为什么您的贡献如此重要？</h3>
            <p className="text-sm text-indigo-700">
              主流AI能听懂普通话、粤语，但很少能识别您家乡独特的方言。您的每一次录音，都在为创建一个全新的、属于您家乡的语言模型添砖加瓦。这是从0到1的创造，每一条都至关重要。
            </p>
          </CardContent>
        </Card>

        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
        >
            <Card className="bg-white/70 backdrop-blur-sm border-purple-200 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2 text-purple-900">
                        <Hourglass className="w-5 h-5" />
                        全局周期训练倒计时
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    {globalTime.nextTrainingDate && <CountdownTimer targetDate={globalTime.nextTrainingDate} />}
                    <p className="text-sm text-purple-600 mt-2">下次自动训练时间</p>
                </CardContent>
            </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card className="bg-white/70 backdrop-blur-sm border-indigo-200 shadow-lg text-left">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <FileAudio className="w-5 h-5" />
                    各方言数据累积进度
                </CardTitle>
                <p className="text-sm text-indigo-600">每个方言累积500条新录音即可触发一次专门训练。</p>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue={DIALECTS[0]} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
                        {DIALECTS.slice(0, 5).map(dialect => (
                            <TabsTrigger key={dialect} value={dialect}>{dialect}</TabsTrigger>
                        ))}
                    </TabsList>
                    {DIALECTS.slice(0, 5).map(dialect => (
                        <TabsContent key={dialect} value={dialect}>
                            {stats[dialect] ? (
                                <div className="p-4 space-y-4">
                                    <p className="text-4xl font-bold text-indigo-700">{stats[dialect].newRecordings}</p>
                                    <p className="text-sm text-indigo-600 mb-2">/ {TRAINING_THRESHOLD} 条新录音</p>
                                    <Progress value={(stats[dialect].newRecordings / TRAINING_THRESHOLD) * 100} className="bg-indigo-100 [&>div]:bg-indigo-500" />
                                    <p className="mt-2 text-sm text-indigo-800">
                                        还需要 <span className="font-bold">{Math.max(0, TRAINING_THRESHOLD - stats[dialect].newRecordings)}</span> 条录音即可启动训练
                                    </p>
                                    {stats[dialect].modelVersion && (
                                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                            <GitBranch className="w-4 h-4 text-green-700" />
                                            <p className="text-sm text-green-800">
                                                当前线上模型版本: <span className="font-semibold">{stats[dialect].modelVersion}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p>暂无数据</p>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
