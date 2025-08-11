import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Grid,
  Paper,
  Button,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiMenuItem,
  Slider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Add, Remove, ExpandMore, Favorite, FavoriteBorder } from '@mui/icons-material';

interface Translation {
  language: string;
  text: string;
  fontSize: number;
}

interface Tafseer {
  name: string;
  text: string;
}

interface QuranVerse {
  arabic: string;
  translations: Translation[];
  tafseer: Tafseer[];
}

interface UserPreferences {
  favoriteTranslation: number;
  textDirection: 'rtl' | 'ltr';
  fontSize: { [key: string]: number };
}

const QuranDisplay = ({ verse }: { verse: QuranVerse }) => {
  const [selectedTranslation, setSelectedTranslation] = useState(0);
  const [selectedTafseer, setSelectedTafseer] = useState(0);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'merged'>('side-by-side');
  const [textDirection, setTextDirection] = useState<'rtl' | 'ltr'>('rtl');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    favoriteTranslation: -1,
    textDirection: 'rtl',
    fontSize: verse.translations.reduce(
      (acc, trans) => ({ ...acc, [trans.language]: 16 }),
      {}
    ),
  });

  const handleFontSizeChange = (language: string, newSize: number) => {
    setPreferences(prev => ({
      ...prev,
      fontSize: { ...prev.fontSize, [language]: newSize },
    }));
  };

  const handleFavoriteTranslation = (index: number) => {
    setPreferences(prev => ({
      ...prev,
      favoriteTranslation: prev.favoriteTranslation === index ? -1 : index,
    }));
  };

  const getFontSizeForLanguage = (language: string) => {
    return preferences.fontSize[language] || 16;
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      {/* عرض النص العربي */}
      <Typography
        variant="h6"
        align="right"
        sx={{ mb: 2, fontSize: getFontSizeForLanguage('arabic') }}
      >
        {verse.arabic}
      </Typography>

      {/* تبويبات الترجمات مع خيارات */}
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={selectedTranslation}
          onChange={(_, newValue) => setSelectedTranslation(newValue)}
        >
          {verse.translations.map((t, index) => (
            <Tab
              key={index}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>{t.language}</Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavoriteTranslation(index);
                    }}
                  >
                    {preferences.favoriteTranslation === index ? (
                      <Favorite color="error" />
                    ) : (
                      <FavoriteBorder />
                    )}
                  </IconButton>
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* خيارات الترجمة */}
      <Box sx={{ mb: 2 }}>
        <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
          <ExpandMore />
        </IconButton>
        <Menu
          open={Boolean(menuAnchor)}
          anchorEl={menuAnchor}
          onClose={() => setMenuAnchor(null)}
        >
          {/* تغيير اتجاه النص */}
          <FormControlLabel
            control={
              <Switch
                checked={textDirection === 'rtl'}
                onChange={(e) => setTextDirection(e.target.checked ? 'rtl' : 'ltr')}
              />
            }
            label="النص من اليمين إلى اليسار"
          />

          {/* تخصيص حجم الخط */}
          {verse.translations.map((trans, index) => (
            <Box key={index} sx={{ p: 2 }}>
              <Typography variant="subtitle2">
                حجم الخط لـ {trans.language}:
              </Typography>
              <Slider
                value={getFontSizeForLanguage(trans.language)}
                onChange={(_, value) =>
                  handleFontSizeChange(trans.language, value as number)
                }
                min={12}
                max={32}
                step={1}
                valueLabelDisplay="auto"
              />
            </Box>
          ))}
        </Menu>
      </Box>

      {/* عرض الترجمة المحددة */}
      <Typography
        variant="body1"
        align={textDirection === 'rtl' ? 'right' : 'left'}
        sx={{
          mb: 3,
          fontSize: getFontSizeForLanguage(verse.translations[selectedTranslation].language),
        }}
      >
        {verse.translations[selectedTranslation]?.text}
      </Typography>

      {/* تبويبات التفسير */}
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={selectedTafseer}
          onChange={(_, newValue) => setSelectedTafseer(newValue)}
        >
          {verse.tafseer.map((t, index) => (
            <Tab key={index} label={t.name} />
          ))}
        </Tabs>
      </Box>

      {/* عرض التفسير المحدد */}
      <Typography
        variant="body1"
        align={textDirection === 'rtl' ? 'right' : 'left'}
      >
        {verse.tafseer[selectedTafseer]?.text}
      </Typography>

      {/* زر تغيير عرض النص */}
      <Box sx={{ mt: 2 }}>
        <Button
          onClick={() => setViewMode(viewMode === 'side-by-side' ? 'merged' : 'side-by-side')}
          variant="outlined"
          size="small"
        >
          {viewMode === 'side-by-side' ? 'عرض مدمج' : 'عرض جانبي'}
        </Button>
      </Box>
    </Paper>
  );
};

export default QuranDisplay;