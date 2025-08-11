import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
} from '@mui/material';
import { Language, Login, Logout, Search } from '@mui/icons-material';

const Header = () => {
  const handleSearch = () => {
    // TODO: إضافة منطق البحث
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          القرآن الكريم
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton color="inherit" onClick={handleSearch}>
            <Search />
          </IconButton>
          <Button color="inherit" startIcon={<Language />}>
            العربية
          </Button>
          <Button color="inherit" startIcon={<Login />}>
            تسجيل الدخول
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
