import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Badge,
  Divider,
  Tooltip,
  Switch,
  FormControlLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import {
  Download,
  Close,
  PlayArrow,
  Pause,
  Delete,
  CheckCircle,
  Error,
  Refresh,
  DeleteForever,
  Zip,
  VolumeDown,
  VolumeUp,
  Sort,
} from '@mui/icons-material';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { useCache } from 'react-cache';
import { openDB } from 'idb';
import JSZip from 'jszip';
import { save } from 'react-jszip';

interface Reciter {
  id: string;
  name: string;
  language: string;
}

interface DownloadItem {
  verseId: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  downloadedBytes: number;
  totalBytes: number;
  lastModified: number;
  quality: 'low' | 'high';
}

interface BatchDownloadProps {
  open: boolean;
  onClose: () => void;
  reciters: Reciter[];
  defaultReciter?: string;
  onDownloadComplete?: (reciterId: string, verses: string[]) => void;
}

const DOWNLOAD_DB_NAME = 'quran-downloads';
const DOWNLOAD_STORE_NAME = 'downloads';

const BatchDownload = ({ open, onClose, reciters, defaultReciter, onDownloadComplete }: BatchDownloadProps) => {
  const [selectedReciter, setSelectedReciter] = useState<string>(defaultReciter || reciters[0]?.id || '');
  const [versesInput, setVersesInput] = useState('');
  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalProgress, setTotalProgress] = useState(0);
  const [cache] = useCache();
  const [resumeItems, setResumeItems] = useState<DownloadItem[]>([]);
  const [downloadAsZip, setDownloadAsZip] = useState(false);
  const [audioQuality, setAudioQuality] = useState<'low' | 'high'>('high');
  const [sortVerses, setSortVerses] = useState(true);

  useEffect(() => {
    loadSavedDownloads();
  }, []);

  const parseVerses = (input: string): string[] => {
    const verses = input.split(',').map(v => v.trim());
    const parsedVerses: string[] = [];

    verses.forEach(verse => {
      if (verse.includes('-')) {
        const [start, end] = verse.split('-').map(Number);
        for (let i = start; i <= end; i++) {
          parsedVerses.push(i.toString());
        }
      } else if (verse) {
        parsedVerses.push(verse);
      }
    });

    return sortVerses ? [...new Set(parsedVerses)].sort((a, b) => Number(a) - Number(b)) : [...new Set(parsedVerses)];
  };

  const loadSavedDownloads = async () => {
    try {
      const db = await openDB(DOWNLOAD_DB_NAME, 1, {
        upgrade(db) {
          db.createObjectStore(DOWNLOAD_STORE_NAME, { keyPath: 'verseId' });
        },
      });

      const tx = db.transaction(DOWNLOAD_STORE_NAME, 'readonly');
      const store = tx.objectStore(DOWNLOAD_STORE_NAME);
      const downloads = await store.getAll();
      
      const activeDownloads = downloads.filter((d: DownloadItem) => 
        d.status === 'downloading' || d.status === 'pending'
      );

      setResumeItems(activeDownloads);
    } catch (error) {
      console.error('Error loading saved downloads:', error);
    }
  };

  const saveDownloadProgress = async (item: DownloadItem) => {
    try {
      const db = await openDB(DOWNLOAD_DB_NAME, 1);
      const tx = db.transaction(DOWNLOAD_STORE_NAME, 'readwrite');
      const store = tx.objectStore(DOWNLOAD_STORE_NAME);
      await store.put(item);
      await tx.done;
    } catch (error) {
      console.error('Error saving download progress:', error);
    }
  };

  const removeDownload = async (verseId: string) => {
    try {
      const db = await openDB(DOWNLOAD_DB_NAME, 1);
      const tx = db.transaction(DOWNLOAD_STORE_NAME, 'readwrite');
      const store = tx.objectStore(DOWNLOAD_STORE_NAME);
      await store.delete(verseId);
      await tx.done;

      setResumeItems(prev => prev.filter(item => item.verseId !== verseId));
    } catch (error) {
      console.error('Error removing download:', error);
    }
  };

  const startDownload = async () => {
    if (!selectedReciter) return;

    const verses = parseVerses(versesInput);
    if (verses.length === 0) {
      setError('الرجاء إدخال أرقام الآيات');
      return;
    }

    setError(null);
    setIsDownloading(true);

    const newItems = verses.map(verse => ({
      verseId: verse,
      status: 'pending',
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      lastModified: Date.now(),
      quality: audioQuality,
    }));

    setDownloadItems(newItems);

    const downloadPromises = newItems.map((item) => {
      return new Promise<void>(async (resolve) => {
        try {
          setDownloadItems(prev => 
            prev.map(i => 
              i.verseId === item.verseId ? { ...i, status: 'downloading' } : i
            )
          );

          const audioUrl = await getAudioUrl(selectedReciter, item.verseId, item.quality);
          
          const response = await axios.get(audioUrl, {
            responseType: 'blob',
            headers: {
              'Range': `bytes=${item.downloadedBytes}-`,
            },
            onDownloadProgress: (progressEvent) => {
              const totalBytes = progressEvent.total + item.downloadedBytes;
              const currentBytes = progressEvent.loaded + item.downloadedBytes;
              const progress = Math.round((currentBytes / totalBytes) * 100);

              const updatedItem = {
                ...item,
                progress,
                downloadedBytes: currentBytes,
                totalBytes,
                lastModified: Date.now(),
              };

              setDownloadItems(prev => 
                prev.map(i => 
                  i.verseId === item.verseId ? updatedItem : i
                )
              );
              saveDownloadProgress(updatedItem);
            },
          });

          cache.set(`${selectedReciter}-${item.verseId}-${item.quality}`, response.data);

          if (downloadAsZip) {
            // إضافة الملف إلى ZIP
            const zip = new JSZip();
            const fileName = `quran-${selectedReciter}-${item.verseId}-${item.quality}.mp3`;
            zip.file(fileName, response.data);
            
            // حفظ ZIP بعد اكتمال جميع التحميلات
            if (newItems.every(i => i.progress === 100)) {
              await zip.generateAsync({ type: 'blob' }).then((content) => {
                saveAs(content, `quran-${selectedReciter}-${audioQuality}-verses.zip`);
              });
            }
          } else {
            // حفظ الملف محلياً
            saveAs(new Blob([response.data]), `quran-${selectedReciter}-${item.verseId}-${item.quality}.mp3`);
          }

          setDownloadItems(prev => 
            prev.map(i => 
              i.verseId === item.verseId ? { ...i, status: 'completed' } : i
            )
          );

          const completedItems = downloadItems.filter(i => i.status === 'completed').length;
          setTotalProgress(Math.round((completedItems / verses.length) * 100));

          resolve();
        } catch (err) {
          console.error(`Error downloading verse ${item.verseId}:`, err);
          setDownloadItems(prev => 
            prev.map(i => 
              i.verseId === item.verseId ? {
                ...i,
                status: 'failed',
                error: err instanceof Error ? err.message : 'حدث خطأ أثناء التحميل'
              } : i
            )
          );
          resolve();
        }
      });
    });

    await Promise.all(downloadPromises);
    setIsDownloading(false);

    if (onDownloadComplete) {
      onDownloadComplete(selectedReciter, verses);
    }
  };

  const getAudioUrl = async (reciterId: string, verseId: string, quality: 'low' | 'high'): Promise<string> => {
    return `https://api.example.com/quran/audio/${reciterId}/verse/${verseId}?quality=${quality}`;
  };

  const handleReciterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedReciter(event.target.value as string);
  };

  const handleVersesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVersesInput(event.target.value);
  };

  const handleAudioQualityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAudioQuality(event.target.value as 'low' | 'high');
  };

  const getStatusColor = (status: DownloadItem['status']) => {
    switch (status) {
      case 'pending':
        return 'inherit';
      case 'downloading':
        return 'primary';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'inherit';
    }
  };

  const getStatusIcon = (status: DownloadItem['status']) => {
    switch (status) {
      case 'pending':
        return <PlayArrow />;
      case 'downloading':
        return <CircularProgress size={20} />;
      case 'completed':
        return <CheckCircle />;
      case 'failed':
        return <Error />;
      default:
        return null;
    }
  };

  const renderDownloadList = () => (
    <List>
      {downloadItems.map((item) => (
        <ListItem key={item.verseId}>
          <ListItemText
            primary={`الآية ${item.verseId}`}
            secondary={item.error || ''}
          />
          <ListItemSecondaryAction>
            <Badge
              badgeContent={item.progress}
              color={getStatusColor(item.status)}
              max={100}
            >
              {getStatusIcon(item.status)}
            </Badge>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>تحميل التلاوات بالدفعة</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>المقرئ</InputLabel>
            <Select
              value={selectedReciter}
              onChange={handleReciterChange}
              label="المقرئ"
            >
              {reciters.map((reciter) => (
                <MenuItem key={reciter.id} value={reciter.id}>
                  {reciter.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>جودة الصوت</InputLabel>
            <Select
              value={audioQuality}
              onChange={handleAudioQualityChange}
              label="جودة الصوت"
            >
              <MenuItem value="high">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VolumeUp /> جودة عالية (320 kbps)
                </Box>
              </MenuItem>
              <MenuItem value="low">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VolumeDown /> جودة منخفضة (128 kbps)
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={downloadAsZip}
                onChange={(e) => setDownloadAsZip(e.target.checked)}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Zip /> تنزيل كملف ZIP واحد
              </Box>
            }
          />

          <FormControlLabel
            control={
              <Switch
                checked={sortVerses}
                onChange={(e) => setSortVerses(e.target.checked)}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Sort /> ترتيب الآيات من الأولى إلى الأخيرة
              </Box>
            }
          />

          <TextField
            fullWidth
            multiline
            rows={4}
            label="أرقام الآيات"
            placeholder="مثال: 1, 2, 3-5, 10-20"
            value={versesInput}
            onChange={handleVersesChange}
            helperText="يمكنك إدخال أرقام الآيات منفصلة بفاصلة أو نطاق باستخدام -"
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {isDownloading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">
                التقدم الإجمالي: {totalProgress}%
              </Typography>
              {renderDownloadList()}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button
          onClick={startDownload}
          variant="contained"
          color="primary"
          disabled={isDownloading || !versesInput.trim()}
          startIcon={isDownloading ? <CircularProgress size={20} /> : <Download />}
        >
          {isDownloading ? 'جاري التحميل...' : 'بدء التحميل'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchDownload;
