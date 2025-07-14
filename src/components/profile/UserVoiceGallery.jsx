
import React, { useState, useEffect, useRef } from "react";
import { DialectRecord, VoiceVote, User as B44User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThumbsUp, ThumbsDown, Play, Pause, Volume2, TrendingUp, Mic } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { createCompatibleAudioElement } from "@/components/lib/audioUtils";

const VoiceCard = ({ recording, playingId, onPlay, onVote, userVotes }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="p-4 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-lg font-medium text-gray-900 mb-2">{recording.transcript}</p>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="border-gray-300">{recording.duration}s</Badge>
              <span className="text-xs text-gray-500">{format(new Date(recording.created_date), 'yyyy/MM/dd')}</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
             <Button variant="outline" size="icon" onClick={() => onPlay(recording.id, recording.audio_url)} className="w-12 h-12 rounded-full border-gray-300">
              {playingId === recording.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-end pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onVote(recording.id, 'upvote')} className={`flex items-center gap-1.5 ${userVotes[recording.id] === 'upvote' ? 'text-green-600 bg-green-50' : 'text-gray-500 hover:text-green-600'}`}>
              <ThumbsUp className="w-4 h-4" /> {recording.upvotes || 0}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onVote(recording.id, 'downvote')} className={`flex items-center gap-1.5 ${userVotes[recording.id] === 'downvote' ? 'text-red-600 bg-red-50' : 'text-gray-500 hover:text-red-600'}`}>
              <ThumbsDown className="w-4 h-4" /> {recording.downvotes || 0}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};


export default function UserVoiceGallery({ userId }) {
  const [userVoicesByDialect, setUserVoicesByDialect] = useState({});
  const [dialects, setDialects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    // Initialize the single audio player instance for this component
    try {
      audioPlayerRef.current = createCompatibleAudioElement();
      audioPlayerRef.current.onended = () => {
        setPlayingId(null);
      };
      audioPlayerRef.current.onerror = (e) => {
        const errorMsg = e.target.error ? e.target.error.message : "Unknown audio error";
        console.error(`Audio error in UserVoiceGallery: ${errorMsg}`, `Src: ${e.target.src}`);
        toast.error("音频播放失败");
        setPlayingId(null);
      };
    } catch (error) {
      console.error('Failed to initialize UserVoiceGallery audio player:', error);
    }
    
    if (!userId) return;
    
    loadCurrentUser();
    loadUserVoices();

    // Cleanup on unmount
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.onerror = null;
        audioPlayerRef.current.onended = null;
        audioPlayerRef.current.src = ''; 
        audioPlayerRef.current = null;
      }
    };
  }, [userId]);

  const loadCurrentUser = async () => {
    try {
      const userData = await B44User.me();
      setCurrentUser(userData);
      
      const votes = await VoiceVote.filter({ user_id: userData.id });
      const voteMap = {};
      votes.forEach(vote => {
        voteMap[vote.recording_id] = vote.vote_type;
      });
      setUserVotes(voteMap);
    } catch (error) {
      console.log("Current user not logged in or error fetching data.");
    }
  };

  const loadUserVoices = async () => {
    setIsLoading(true);
    try {
      const recordings = await DialectRecord.filter({ user_id: userId, is_approved: true }, '-created_date');
      
      const groupedByDialect = recordings.reduce((acc, recording) => {
        const dialect = recording.dialect || '其他';
        if (!acc[dialect]) {
          acc[dialect] = [];
        }
        acc[dialect].push(recording);
        return acc;
      }, {});

      setUserVoicesByDialect(groupedByDialect);
      // Sort dialects alphabetically, but keep '其他' (Other) at the end if it exists
      const sortedDialects = Object.keys(groupedByDialect).sort((a, b) => {
          if (a === '其他') return 1;
          if (b === '其他') return -1;
          return a.localeCompare(b);
      });
      setDialects(sortedDialects);
      
    } catch (error) {
      console.error("Error loading user voices:", error);
    }
    setIsLoading(false);
  };

  const handleVote = async (recordingId, voteType) => {
    if (!currentUser) {
      toast.error("请先登录再投票");
      return;
    }
  
    // Define variables in the outer scope for rollback
    let targetDialect = null;
    let originalVote = null;
    let originalUpvotes = 0;
    let originalDownvotes = 0;
    let currentRecording = null;
  
    // Find the recording and its dialect to store its original state
    for (const dialect in userVoicesByDialect) {
      const found = userVoicesByDialect[dialect].find(r => r.id === recordingId);
      if (found) {
        currentRecording = found;
        targetDialect = dialect;
        break;
      }
    }
  
    if (!currentRecording) {
      console.error("Could not find the recording to vote on.");
      return;
    }
  
    // Store original state for potential rollback
    originalUpvotes = currentRecording.upvotes || 0;
    originalDownvotes = currentRecording.downvotes || 0;
    originalVote = userVotes[recordingId] || null;
  
    // --- Optimistic UI Update ---
    const getOptimisticState = () => {
        let newUp = originalUpvotes;
        let newDown = originalDownvotes;
        let newVote = originalVote;

        if (originalVote === voteType) { // Undoing a vote
            newVote = null;
            if (voteType === 'upvote') newUp--;
            else newDown--;
        } else { // New vote or changing vote
            newVote = voteType;
            if (voteType === 'upvote') {
                newUp++;
                if (originalVote === 'downvote') newDown--; // Was downvoted before
            } else { // downvote
                newDown++;
                if (originalVote === 'upvote') newUp--; // Was upvoted before
            }
        }
        return { 
            upvotes: Math.max(0, newUp), 
            downvotes: Math.max(0, newDown),
            vote: newVote
        };
    }
    
    const optimisticState = getOptimisticState();

    setUserVotes(prev => ({...prev, [recordingId]: optimisticState.vote}));
    setUserVoicesByDialect(prev => ({
      ...prev,
      [targetDialect]: prev[targetDialect].map(rec =>
        rec.id === recordingId
          ? { ...rec, upvotes: optimisticState.upvotes, downvotes: optimisticState.downvotes }
          : rec
      )
    }));
  
    // --- API Calls ---
    try {
      const existingVote = await VoiceVote.filter({ 
        user_id: currentUser.id, 
        recording_id: recordingId 
      }).then(res => res[0]);
  
      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Undo vote on server
          await VoiceVote.delete(existingVote.id);
        } else {
          // Change vote on server
          await VoiceVote.update(existingVote.id, { vote_type: voteType });
        }
      } else {
        // Create new vote on server
        await VoiceVote.create({ 
          user_id: currentUser.id, 
          recording_id: recordingId, 
          vote_type: voteType 
        });
      }
  
      // Update the recording's total counts on server for consistency
      await DialectRecord.update(recordingId, { 
        upvotes: optimisticState.upvotes, 
        downvotes: optimisticState.downvotes 
      });
  
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("投票失败，正在撤销操作");
      
      // --- Rollback optimistic UI update on error ---
      setUserVotes(prev => ({...prev, [recordingId]: originalVote}));
      setUserVoicesByDialect(prev => ({
        ...prev,
        [targetDialect]: prev[targetDialect].map(rec =>
          rec.id === recordingId
            ? { ...rec, upvotes: originalUpvotes, downvotes: originalDownvotes }
            : rec
        )
      }));
    }
  };

  const playAudio = async (id, audioUrl) => {
    const player = audioPlayerRef.current;
    if (!player) {
      console.error('UserVoiceGallery audio player not initialized');
      return;
    }

    if (playingId === id) {
      try {
        player.pause();
        setPlayingId(null);
      } catch (error) {
        console.error('Error pausing UserVoiceGallery audio:', error);
      }
    } else {
      try {
        if (player.src !== audioUrl) {
          player.src = audioUrl;
          player.load();
        }
        
        const playPromise = player.play();
        if (playPromise !== undefined) {
          await playPromise;
          setPlayingId(id);
        } else {
          setPlayingId(id); 
        }
      } catch (error) {
        console.error('UserVoiceGallery play failed:', error.message);
        toast.error("播放失败，请重试");
        setPlayingId(null);
      }
    }
  };
  
  if (isLoading) {
    return (
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Mic className="w-5 h-5" />
              个人语音作品
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
             {Array(3).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="rounded-full bg-gray-300 h-12 w-12"></div>
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Mic className="w-5 h-5" />
          个人语音作品
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dialects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Volume2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>该用户还没有公开的语音作品。</p>
          </div>
        ) : (
          <Tabs defaultValue={dialects[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 h-auto flex-wrap gap-1 p-1">
              {dialects.map(dialect => (
                <TabsTrigger key={dialect} value={dialect} className="flex-1 min-w-[80px] text-sm py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-white rounded-md">
                  {dialect}
                </TabsTrigger>
              ))}
            </TabsList>
            {dialects.map(dialect => (
              <TabsContent key={dialect} value={dialect} className="mt-4">
                <div className="space-y-4">
                  {userVoicesByDialect[dialect].map((recording, index) => (
                    <VoiceCard 
                      key={recording.id}
                      recording={recording}
                      playingId={playingId}
                      onPlay={playAudio}
                      onVote={handleVote}
                      userVotes={userVotes}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
