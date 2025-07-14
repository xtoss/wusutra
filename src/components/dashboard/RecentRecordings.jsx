
import React, { useState, useEffect, useRef } from "react";
import { DialectRecord, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { createCompatibleAudioElement } from "@/components/lib/audioUtils";
import { toast } from "sonner";

export default function RecentRecordings() {
  const [recordings, setRecordings] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    // Initialize player
    try {
      audioPlayerRef.current = createCompatibleAudioElement();
      audioPlayerRef.current.onended = () => setPlayingId(null);
      audioPlayerRef.current.onerror = (e) => {
        const errorMsg = e.target.error ? e.target.error.message : "Unknown audio error";
        console.error(`Audio error in RecentRecordings: ${errorMsg}`, `Src: ${e.target.src}`);
        toast.error("音频播放出错");
        setPlayingId(null);
      };
    } catch (error) {
      console.error('Failed to initialize RecentRecordings audio player:', error);
    }

    // Call loadCurrentUser and then loadRecordings within the effect to ensure currentUser is available
    const init = async () => {
      await loadCurrentUser();
      // loadRecordings will be called again after currentUser is set in state,
      // so calling it here might be redundant or could cause a flicker if not handled carefully.
      // Better to rely on loadRecordings being called after currentUser state updates,
      // or pass currentUser directly to loadRecordings if it's not state-dependent.
      // For now, let's keep loadRecordings after loadCurrentUser in this useEffect.
      loadRecordings();
    };
    init();

    // Cleanup
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.onerror = null;
        audioPlayerRef.current.onended = null;
        audioPlayerRef.current.src = '';
        audioPlayerRef.current = null;
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // This useEffect watches currentUser and reloads recordings if it changes.
  // This is a more robust way to ensure loadRecordings uses the latest currentUser.
  useEffect(() => {
    // Only reload recordings if currentUser has been initialized (not null initially)
    // or if it changes from a previous value.
    if (currentUser !== null || isLoading) { // isLoading check prevents initial double-load if currentUser is null
        loadRecordings();
    }
  }, [currentUser]);


  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.log("No user logged in or error fetching user:", error);
      setCurrentUser(null); // Ensure currentUser is null if not logged in or error
    }
  };

  const loadRecordings = async () => {
    setIsLoading(true); // Set loading true before fetching
    try {
      const data = await DialectRecord.list('-created_date', 20); // Fetch up to 20 to allow filtering

      // Filter recordings based on user type
      let filteredRecordings = data.filter(record => !record.soft_deleted);

      // We use the `currentUser` from the component state, which is updated by `loadCurrentUser`.
      // It's important that `loadCurrentUser` has completed before `loadRecordings` relies on it.
      // The `useEffect` dependency on `currentUser` helps with this.
      if (currentUser?.is_admin || currentUser?.is_reviewer) {
        // Admins and reviewers see all non-soft-deleted recordings
        setRecordings(filteredRecordings.slice(0, 10)); // Still show only 10 in UI
      } else {
        // Regular users see only approved recordings
        const approvedRecordings = filteredRecordings.filter(record => record.is_approved);
        setRecordings(approvedRecordings.slice(0, 10)); // Still show only 10 in UI
      }
    } catch (error) {
      console.error("Error loading recordings:", error);
      toast.error("加载录音失败");
      setRecordings([]); // Clear recordings on error
    }
    setIsLoading(false);
  };

  const playAudio = async (id, audioUrl) => {
    const player = audioPlayerRef.current;
    if (!player) {
      console.error('RecentRecordings audio player not initialized');
      return;
    }

    if (playingId === id) {
      try {
        player.pause();
        setPlayingId(null);
      } catch (error) {
        console.error('Error pausing in RecentRecordings:', error);
      }
    } else {
      try {
        if (player.src !== audioUrl) {
          player.src = audioUrl;
          player.load();
        }

        const playPromise = player.play();
        if (playPromise !== undefined) {
          await playPromise; // Await the promise returned by play()
          setPlayingId(id);
        }
      } catch (error) {
        console.error('RecentRecordings play failed:', error.message);
        toast.error("播放失败，请重试");
        setPlayingId(null);
      }
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Clock className="w-5 h-5" />
          最近录音
          {(currentUser?.is_admin || currentUser?.is_reviewer) && (
            <Badge variant="outline" className="text-xs">
              管理视图
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-orange-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-orange-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-8 text-orange-600">
            <p>还没有录音记录</p>
            <p className="text-sm mt-1">开始您的第一次录音吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-orange-900 truncate">
                    {recording.transcript}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                      {recording.dialect}
                    </Badge>
                    <span className="text-xs text-orange-600">
                      {formatDuration(recording.duration || 0)}
                    </span>
                    <span className="text-xs text-orange-500">
                      {format(new Date(recording.created_date), 'MM/dd HH:mm')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {recording.is_approved ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => playAudio(recording.id, recording.audio_url)}
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                  >
                    {playingId === recording.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
