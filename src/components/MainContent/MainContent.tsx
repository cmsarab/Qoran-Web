import React from 'react';
import { Box, Paper, Grid, Typography, IconButton } from '@mui/material';
import { PlayArrow, Pause, VolumeUp, VolumeOff } from '@mui/icons-material';
import QuranDisplay from '../QuranDisplay/QuranDisplay';
import AudioControls from '../AudioControls/AudioControls';

interface QuranVerse {
  arabic: string;
  translations: {
    language: string;
    text: string;
    fontSize: number;
  }[];
  tafseer: {
    name: string;
    text: string;
  }[];
}

interface Reciter {
  id: string;
  name: string;
  audioUrl: string;
  language: string;
}

const MainContent = () => {
  // بيانات عرض تجريبية
  const sampleVerse: QuranVerse = {
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    translations: [
      {
        language: 'الإنجليزية',
        text: 'In the name of Allah, the Most Gracious, the Most Merciful.',
        fontSize: 16,
      },
      {
        language: 'الأردية',
        text: 'اللہ تعالیٰ کے نام سے، جو بڑا رحم کرتا ہے، جو بڑا رحم کرتا ہے۔',
        fontSize: 16,
      },
    ],
    tafseer: [
      {
        name: 'تفسير ابن كثير',
        text: 'هذا هو البسملة التي هي آية في كل سورة من القرآن إلا سورة التوبة، وهي من أعظم ما يبدأ به العمل في الدنيا والآخرة.',
      },
      {
        name: 'تفسير السعدي',
        text: 'باسم الله الذي هو مبدأ كل خير، ومرجع كل حسن، وسبب كل نجاح، وسبب كل رحمة.',
      },
    ],
  };

  // بيانات المقرئين
  const reciters: Reciter[] = [
    {
      id: '1',
      name: 'عبدالباسط عبد الصمد',
      audioUrl: 'https://example.com/audio/abdulbasit/verse1.mp3',
      language: 'العربية',
    },
    {
      id: '2',
      name: 'محمد صديق المنشاوي',
      audioUrl: 'https://example.com/audio/manshawi/verse1.mp3',
      language: 'العربية',
    },
    {
      id: '3',
      name: 'محمود خليل الحصري',
      audioUrl: 'https://example.com/audio/hosary/verse1.mp3',
      language: 'العربية',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* محرك البحث */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" align="center" sx={{ mb: 2 }}>
          البحث في القرآن الكريم
        </Typography>
        {/* سيتم إضافة منطق البحث لاحقاً */}
      </Paper>

      {/* عرض الآيات */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" align="center" sx={{ mb: 2 }}>
          سورة الفاتحة
        </Typography>
        <QuranDisplay verse={sampleVerse} />
      </Paper>

      {/* وحدة الصوت والتلاوات */}
      <AudioControls verseId="1" reciters={reciters} />
    </Box>
  );
};

export default MainContent;
