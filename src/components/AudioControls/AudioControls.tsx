import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiMenuItem,
  Chip,
  CircularProgress,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  QueueMusic,
  ExpandMore,
  Loop,
  SkipNext,
  SkipPrevious,
  Speed,
  Download,
  Favorite,
  FavoriteBorder,
  Add,
  Remove,
} from '@mui/icons-material';
import WaveSurfer from 'wavesurfer.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.js';
import { createCache, useCache } from 'react-cache';
import { AudioCache } from 'html5-audio-cache';

interface Reciter {
  id: string;
  name: string;
  audioUrl: string;
  language: string;
}

interface AudioControlsProps {
  verseId: string;
  reciters: Reciter[];
  onFavoriteChange?: (reciterId: string) => void;
}

const audioCache = new AudioCache();
const cache = createCache();

const AudioControls = ({ verseId, reciters, onFavoriteChange }: AudioControlsProps) => {
  const [currentReciter, setCurrentReciter] = useState<Reciter | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [speed, setSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [regionStart, setRegionStart] = useState(0);
  const [regionEnd, setRegionEnd] = useState(0);
  const [isRegionLooping, setIsRegionLooping] = useState(false);
  const [isRegionMenuOpen, setIsRegionMenuOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (currentReciter) {
      const audio = audioRef.current;
      if (audio) {
        audio.src = currentReciter.audioUrl;
        audio.volume = volume;
        audio.playbackRate = speed;
      }
    }
  }, [currentReciter, volume, speed]);

  useEffect(() => {
    if (waveSurferRef.current) {
      waveSurferRef.current.setPlaybackRate(speed);
    }
  }, [speed]);

  useEffect(() => {
    const wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: '#3f51b5',
      progressColor: '#1976d2',
      height: 50,
      plugins: [
        TimelinePlugin.create({
          container: '#timeline',
          height: 20,
        }),
        RegionsPlugin.create({
          dragSelection: {
            slop: 10,
          },
        }),
      ],
    });

    waveSurferRef.current = wavesurfer;

    return () => {
      if (wavesurfer) {
        wavesurfer.destroy();
      }
    };
  }, []);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
        if (waveSurferRef.current) {
          waveSurferRef.current.pause();
        }
      } else {
        audio.play().catch((error) => {
          console.error('Error playing audio:', error);
        });
        if (waveSurferRef.current) {
          waveSurferRef.current.play();
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (_: any, newValue: number | number[]) => {
    const newVolume = newValue as number;
    setVolume(newVolume / 100);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume / 100;
    }
  };

  const handleSpeedChange = (_: any, newValue: number | number[]) => {
    const newSpeed = newValue as number;
    setSpeed(newSpeed);
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = newSpeed;
    }
    if (waveSurferRef.current) {
      waveSurferRef.current.setPlaybackRate(newSpeed);
    }
  };

  const handleReciterSelect = (reciter: Reciter) => {
    setCurrentReciter(reciter);
    setIsPlaying(true);
    setMenuAnchor(null);
    if (waveSurferRef.current) {
      waveSurferRef.current.load(reciter.audioUrl);
      // تحميل الصوت في الكاش
      audioCache.load(reciter.audioUrl);
    }
  };

  const handleLoopToggle = () => {
    setIsLooping(!isLooping);
    const audio = audioRef.current;
    if (audio) {
      audio.loop = !isLooping;
    }
  };

  const handleRegionLoopToggle = () => {
    setIsRegionLooping(!isRegionLooping);
    if (waveSurferRef.current) {
      const regions = waveSurferRef.current.regions.list;
      Object.values(regions).forEach(region => {
        region.loop = isRegionLooping;
      });
    }
  };

  const handleDownload = async () => {
    if (!currentReciter) return;

    setIsDownloading(true);
    try {
      const audioBlob = await fetch(currentReciter.audioUrl).then(res => res.blob());
      const url = window.URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentReciter.name}-verse-${verseId}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      // حفظ في الكاش
      cache.set(currentReciter.audioUrl, audioBlob);
    } catch (error) {
      console.error('Error downloading audio:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    if (onFavoriteChange) {
      onFavoriteChange(currentReciter?.id || '');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h6">الصوت والتلاوات</Typography>
        <IconButton
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          color="primary"
        >
          <ExpandMore />
        </IconButton>
      </Box>

      <Menu
        open={Boolean(menuAnchor)}
        anchorEl={menuAnchor}
        onClose={() => setMenuAnchor(null)}
      >
        {reciters.map((reciter) => (
          <MenuItem
            key={reciter.id}
            onClick={() => handleReciterSelect(reciter)}
          >
            <Chip
              label={reciter.name}
              color={currentReciter?.id === reciter.id ? 'primary' : 'default'}
            />
          </MenuItem>
        ))}
      </Menu>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* التحكم في التشغيل/الإيقاف */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            color="primary"
            onClick={handlePlayPause}
            disabled={isLoading}
          >
            {isLoading ? (
              <CircularProgress size={24} />
            ) : isPlaying ? (
              <Pause />
            ) : (
              <PlayArrow />
            )}
          </IconButton>
          <IconButton
            color="primary"
            onClick={handleLoopToggle}
          >
            <Loop color={isLooping ? 'primary' : 'inherit'} />
          </IconButton>
          <IconButton
            color="primary"
            onClick={handleRegionLoopToggle}
            disabled={!regionStart || !regionEnd}
          >
            <Loop color={isRegionLooping ? 'primary' : 'inherit'} />
          </IconButton>
          <IconButton
            color="primary"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download />
          </IconButton>
          <IconButton
            color="primary"
            onClick={handleFavorite}
          >
            {isFavorite ? <Favorite color="error" /> : <FavoriteBorder />}
          </IconButton>
          <Typography variant="body2">
            {formatTime(currentTime)} / {formatTime(duration)}
          </Typography>
          <Box sx={{ flex: 1 }}>
            <div id="waveform" />
            <div id="timeline" />
          </Box>
        </Box>

        {/* التحكم في الصوت */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2">الصوت: {Math.round(volume * 100)}%</Typography>
          <Slider
            value={volume * 100}
            onChange={handleVolumeChange}
            min={0}
            max={100}
            step={1}
            size="small"
          />
          <IconButton
            color="primary"
            onClick={() => setVolume(0)}
          >
            <VolumeOff />
          </IconButton>
          <IconButton
            color="primary"
            onClick={() => setVolume(1)}
          >
            <VolumeUp />
          </IconButton>
        </Box>

        {/* التحكم في السرعة */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2">السرعة: {speed}x</Typography>
          <Slider
            value={speed}
            onChange={handleSpeedChange}
            min={0.5}
            max={2}
            step={0.1}
            size="small"
          />
        </Box>

        {/* تحديد منطقة التكرار */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setIsRegionMenuOpen(true)}
          >
            تحديد منطقة التكرار
          </Button>
          <Typography variant="body2">
            {regionStart ? `من ${formatTime(regionStart)} إلى ${formatTime(regionEnd)}` : 'لم يتم تحديد منطقة'}
          </Typography>
        </Box>
      </Box>

      <audio
        ref={audioRef}
        onCanPlay={() => {
          setIsLoading(false);
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onPlay={() => setIsLoading(false)}
        onPause={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        onTimeUpdate={(e) => {
          if (e.target) {
            setCurrentTime(e.target.currentTime);
          }
        }}
      />

      {/* حوار تحديد منطقة التكرار */}
      <Dialog open={isRegionMenuOpen} onClose={() => setIsRegionMenuOpen(false)}>
        <DialogTitle>تحديد منطقة التكرار</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="بداية المنطقة"
              type="time"
              value={formatTime(regionStart)}
              onChange={(e) => {
                const time = e.target.value;
                const [minutes, seconds] = time.split(':').map(Number);
                setRegionStart(minutes * 60 + seconds);
              }}
              fullWidth
            />
            <TextField
              label="نهاية المنطقة"
              type="time"
              value={formatTime(regionEnd)}
              onChange={(e) => {
                const time = e.target.value;
                const [minutes, seconds] = time.split(':').map(Number);
                setRegionEnd(minutes * 60 + seconds);
              }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsRegionMenuOpen(false)}>إلغاء</Button>
          <Button
            onClick={() => {
              if (waveSurferRef.current && regionStart < regionEnd) {
                waveSurferRef.current.addRegion({
                  start: regionStart,
                  end: regionEnd,
                  color: 'rgba(255, 0, 0, 0.1)',
                  loop: isRegionLooping,
                });
              }
              setIsRegionMenuOpen(false);
            }}
            color="primary"
          >
            تأكيد
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AudioControls;
