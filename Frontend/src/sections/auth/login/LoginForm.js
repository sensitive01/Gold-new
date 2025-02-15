import { useState, forwardRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { useSelector, useDispatch } from 'react-redux';
import * as Yup from 'yup';
// @mui
import {
  Stack,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Button,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { LoadingButton } from '@mui/lab';
// components
import Iconify from '../../../components/iconify';
import { login } from '../../../features/authSlice';
import { loginApi, getUserTypeApi, verifyLoginOtp } from '../../../apis/auth';

// ----------------------------------------------------------------------

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [userType, setUserType] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState('');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isDisable, setIsDisable] = useState(false);
  const [error, setError] = useState(null);
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  if (auth.isAuthenticated === true) {
    if (auth.user.userType === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    }
    if (auth.user.userType === 'hr') {
      return <Navigate to="/hr/dashboard" />;
    }
    if (auth.user.userType === 'accounts') {
      return <Navigate to="/accounts/dashboard" />;
    }
    if (auth.user.userType === 'branch') {
      return <Navigate to="/branch/dashboard" />;
    }
    return <Navigate to="/404" />;
  }

  function AlertComponent(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  }

  const Alert = forwardRef(AlertComponent);

  return (
    <>
      <Snackbar
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={notify.open}
        onClose={() => {
          setNotify({ ...notify, open: false });
        }}
        autoHideDuration={3000}
      >
        <Alert
          onClose={() => {
            setNotify({ ...notify, open: false });
          }}
          severity={notify.severity}
          sx={{ width: '100%', color: 'white' }}
        >
          {notify.message}
        </Alert>
      </Snackbar>
      <Stack spacing={3}>
        {error && (
          <Typography
            sx={{
              textAlign: 'center',
              color: 'red',
            }}
          >
            {error}
          </Typography>
        )}

        <TextField
          name="username"
          label={'Username'}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        {step === 2 && userType !== 'branch' && (
          <TextField
            name="password"
            label={'Password'}
            type={showPassword ? 'text' : 'password'}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        )}
        {step === 2 && userType === 'branch' && (
          <TextField
            name="otp"
            label={'OTP'}
            type={'text'}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
        )}
      </Stack>

      {/* <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ my: 2 }}>
        <Link variant="subtitle2" underline="hover">
          Forgot password?
        </Link>
      </Stack> */}

      {step === 1 ? (
        <LoadingButton
          fullWidth
          size="large"
          type="button"
          variant="contained"
          loading={isDisable}
          loadingIndicator={<CircularProgress color="inherit" size={16} />}
          sx={{ my: 2 }}
          onClick={() => {
            if (!username) {
              setNotify({
                open: true,
                message: 'Please enter username',
                severity: 'error',
              });
            } else {
              setIsDisable(true);
              setError('');
              getUserTypeApi({ username })
                .then((data) => {
                  if (data.status === true) {
                    setUserType(data.data.userType);
                    if (data.data.userType === 'branch') {
                      loginApi({ username, password: 'no-password' })
                        .then((data) => {
                          if (data.status === true) {
                            setToken(data.data.token);
                            setOtp(data.data.otp ?? '');
                            setStep(2);
                          } else {
                            setStep(1);
                            setError(data.message);
                          }
                          setIsDisable(false);
                        })
                        .catch((err) => {
                          setIsDisable(false);
                          setStep(1);
                          setError(err.message);
                        });
                    } else {
                      setIsDisable(false);
                      setStep(2);
                    }
                  } else {
                    setIsDisable(false);
                    setError(data.message);
                  }
                })
                .catch((err) => {
                  setIsDisable(false);
                  setError(err.message);
                });
            }
          }}
        >
          <span>Next</span>
        </LoadingButton>
      ) : (
        <LoadingButton
          fullWidth
          size="large"
          variant="contained"
          loading={isDisable}
          loadingIndicator={<CircularProgress color="inherit" size={16} />}
          sx={{ my: 2 }}
          onClick={() => {
            setIsDisable(true);
            setError(null);
            if (userType === 'branch') {
              // Verify otp
              verifyLoginOtp({ token, otp })
                .then((data) => {
                  if (data.status === true) {
                    dispatch(login(data.data));
                  } else {
                    setError(data.message);
                  }
                  setIsDisable(false);
                })
                .catch((err) => {
                  setIsDisable(false);
                  setError(err.message);
                });
            } else {
              loginApi({ username, password })
                .then((data) => {
                  if (data.status === true) {
                    dispatch(login(data.data));
                  } else {
                    setError(data.message);
                  }
                  setIsDisable(false);
                })
                .catch((err) => {
                  setError(err.message);
                  setIsDisable(false);
                });
            }
          }}
        >
          Login
        </LoadingButton>
      )}
    </>
  );
}
