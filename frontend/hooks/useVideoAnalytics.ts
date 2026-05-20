'use client';
import { useRef, useCallback, useEffect } from 'react';
import api from '@/lib/api';

interface VideoAnalyticsOptions {
  lessonId: string;
  courseId: string;
  heartbeatInterval?: number; // ms, default 15s
}

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  return 'Other';
}

export function useVideoAnalytics({ lessonId, courseId, heartbeatInterval = 15000 }: VideoAnalyticsOptions) {
  const sessionId = useRef<string | null>(null);
  const stats = useRef({
    duration_seconds: 0,
    max_position_seconds: 0,
    play_count: 0,
    pause_count: 0,
    seek_forward_count: 0,
    seek_backward_count: 0,
    replay_count: 0,
    speed_changes: 0,
    last_speed: 1.0,
    fullscreen_count: 0,
    buffer_count: 0,
    completed: false,
  });
  const lastTime = useRef(0);
  const isPlaying = useRef(false);
  const watchStart = useRef<number | null>(null);
  const eventQueue = useRef<any[]>([]);
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);

  // Start session
  const startSession = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      const { data } = await api.post('/analytics/video/session', {
        lesson_id: lessonId,
        course_id: courseId,
        video_total_seconds: Math.round(videoElement.duration || 0),
        device_type: getDeviceType(),
        browser: getBrowserName(),
      });
      sessionId.current = data.session_id;
    } catch {}
  }, [lessonId, courseId]);

  // Send heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!sessionId.current) return;
    try {
      await api.put(`/analytics/video/session/${sessionId.current}`, stats.current);
    } catch {}
    // Flush event queue
    if (eventQueue.current.length > 0) {
      const events = [...eventQueue.current];
      eventQueue.current = [];
      try {
        await api.post('/analytics/video/events-batch', { events });
      } catch {}
    }
  }, []);

  // Queue an event
  const queueEvent = useCallback((type: string, fromSec: number, toSec: number, data?: any) => {
    eventQueue.current.push({
      session_id: sessionId.current,
      lesson_id: lessonId,
      event_type: type,
      from_seconds: Math.round(fromSec),
      to_seconds: Math.round(toSec),
      data: data || {},
    });
  }, [lessonId]);

  // Attach to video element
  const attachToVideo = useCallback((video: HTMLVideoElement) => {
    if (!video) return;

    const onLoadedMetadata = () => startSession(video);

    const onPlay = () => {
      stats.current.play_count++;
      isPlaying.current = true;
      watchStart.current = Date.now();
      queueEvent('play', video.currentTime, video.currentTime);
    };

    const onPause = () => {
      stats.current.pause_count++;
      isPlaying.current = false;
      if (watchStart.current) {
        stats.current.duration_seconds += Math.round((Date.now() - watchStart.current) / 1000);
        watchStart.current = null;
      }
      queueEvent('pause', video.currentTime, video.currentTime);
    };

    const onSeeking = () => {
      const from = lastTime.current;
      const to = video.currentTime;
      if (to > from + 2) {
        stats.current.seek_forward_count++;
        queueEvent('seek_forward', from, to);
      } else if (to < from - 2) {
        stats.current.seek_backward_count++;
        queueEvent('seek_backward', from, to);
        if (to < 3) {
          stats.current.replay_count++;
          queueEvent('replay', from, to);
        }
      }
    };

    const onTimeUpdate = () => {
      lastTime.current = video.currentTime;
      stats.current.max_position_seconds = Math.max(
        stats.current.max_position_seconds,
        Math.round(video.currentTime)
      );
      // Check completion (≥80% watched)
      if (!stats.current.completed && video.duration > 0 &&
          video.currentTime / video.duration >= 0.8) {
        stats.current.completed = true;
      }
    };

    const onRateChange = () => {
      stats.current.speed_changes++;
      stats.current.last_speed = video.playbackRate;
      queueEvent('speed_change', video.currentTime, video.currentTime, { speed: video.playbackRate });
    };

    const onWaiting = () => {
      stats.current.buffer_count++;
      queueEvent('buffer', video.currentTime, video.currentTime);
    };

    const onEnded = () => {
      stats.current.completed = true;
      if (watchStart.current) {
        stats.current.duration_seconds += Math.round((Date.now() - watchStart.current) / 1000);
        watchStart.current = null;
      }
      queueEvent('ended', video.currentTime, video.currentTime);
      sendHeartbeat();
    };

    const onFullscreenChange = () => {
      if (document.fullscreenElement) {
        stats.current.fullscreen_count++;
        queueEvent('fullscreen', video.currentTime, video.currentTime);
      }
    };

    // Tab visibility
    const onVisibility = () => {
      if (document.hidden) {
        queueEvent('tab_hidden', video.currentTime, video.currentTime);
      } else {
        queueEvent('tab_visible', video.currentTime, video.currentTime);
      }
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('seeking', onSeeking);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ratechange', onRateChange);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('ended', onEnded);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('visibilitychange', onVisibility);

    // If video already loaded
    if (video.readyState >= 1 && !sessionId.current) {
      startSession(video);
    }

    // Start heartbeat
    heartbeatTimer.current = setInterval(sendHeartbeat, heartbeatInterval);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('seeking', onSeeking);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ratechange', onRateChange);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('ended', onEnded);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('visibilitychange', onVisibility);
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      // Final heartbeat
      if (isPlaying.current && watchStart.current) {
        stats.current.duration_seconds += Math.round((Date.now() - watchStart.current) / 1000);
      }
      sendHeartbeat();
    };
  }, [startSession, sendHeartbeat, queueEvent, heartbeatInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    };
  }, []);

  return { attachToVideo, sessionId };
}
