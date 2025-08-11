import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Link,
  Paper,
} from '@mui/material';
import {
  Facebook,
  Twitter,
  Instagram,
  GitHub,
  Email,
  Phone,
} from '@mui/icons-material';

const Footer = () => {
  return (
    <Paper sx={{ bgcolor: 'background.paper', p: 3, mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
        <IconButton color="primary">
          <Facebook />
        </IconButton>
        <IconButton color="primary">
          <Twitter />
        </IconButton>
        <IconButton color="primary">
          <Instagram />
        </IconButton>
        <IconButton color="primary">
          <GitHub />
        </IconButton>
      </Box>

      <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 2 }}>
        للتواصل معنا:
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Link href="mailto:info@quran.com" color="inherit">
          <IconButton>
            <Email />
          </IconButton>
        </Link>
        <Link href="tel:+1234567890" color="inherit">
          <IconButton>
            <Phone />
          </IconButton>
        </Link>
      </Box>

      <Typography variant="body2" align="center" color="text.secondary">
        جميع الحقوق محفوظة © {new Date().getFullYear()}
      </Typography>
    </Paper>
  );
};

export default Footer;
