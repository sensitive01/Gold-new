import { Helmet } from 'react-helmet-async';
// @mui
import { Box, Container, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
// hooks
import useResponsive from '../hooks/useResponsive';
// components
// sections
import { LoginForm } from '../sections/auth/login';

// ----------------------------------------------------------------------

const StyledRoot = styled('div')(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    display: 'flex',
  },
}));

const StyledSection = styled('div')(({ theme }) => ({
  width: '100%',
  maxWidth: 840,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  boxShadow: theme.customShadows.card,
  backgroundColor: theme.palette.background.default,
}));

const StyledContent = styled('div')(({ theme }) => ({
  maxWidth: 480,
  margin: 'auto',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  flexDirection: 'column',
  padding: theme.spacing(12, 0),
}));

// ----------------------------------------------------------------------

export default function LoginPage() {
  const mdUp = useResponsive('up', 'md');

  return (
    <>
      <Helmet>
        <title> Login | Gold Billing </title>
      </Helmet>

      <StyledRoot>
        {/* <Logo
          sx={{
            position: 'fixed',
            top: { xs: 16, sm: 24, md: 40 },
            left: { xs: 16, sm: 24, md: 40 },
          }}
        /> */}

        {mdUp && (
          <StyledSection>
            {/* <Typography variant="h3" sx={{ px: 5, mt: 10, mb: 5 }}>
              Hi, Welcome Back
            </Typography> */}
            <img src="/assets/login.jpg" alt="login" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </StyledSection>
        )}

        <Container maxWidth="sm">
          <StyledContent>
            <Box
              component="div"
              sx={{
                width: 96,
                height: 96,
                display: 'inline-flex',
                mx: 'auto',
                mb: 5,
              }}
            >
              <img alt="Logo" src="/assets/logo.png" />
            </Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 5 }}>
              Sign in to Continue
            </Typography>

            {/* <Typography variant="body2" sx={{ mb: 5 }}>
              Don’t have an account? <Link variant="subtitle2">Get started</Link>
            </Typography> */}

            <LoginForm />
          </StyledContent>
        </Container>
      </StyledRoot>
    </>
  );
}
