import { TextField, FormControl, InputLabel, Select, MenuItem, Card, Grid, styled } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { PickersDay, StaticDatePicker } from '@mui/x-date-pickers';
import moment from 'moment';
import { getLeaveById, updateLeave } from '../../../apis/hr/leave';
import { getEmployee } from '../../../apis/hr/employee';

const CustomPickersDay = styled(PickersDay, {
  shouldForwardProp: (prop) => prop !== 'selected',
})(({ theme, selected }) => ({
  ...(selected && {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    '&:hover, &:focus': {
      backgroundColor: theme.palette.primary.dark,
    },
    borderTopLeftRadius: '50%',
    borderBottomLeftRadius: '50%',
    borderTopRightRadius: '50%',
    borderBottomRightRadius: '50%',
  }),
}));

function UpdateLeave(props) {
  const [employees, setEmloyees] = useState([]);

  useEffect(() => {
    getEmployee().then((data) => {
      setEmloyees(data.data);
    });
  }, []);

  // Form validation
  const schema = Yup.object({
    employee: Yup.string().required('Employee Id is required'),
    leaveType: Yup.string().required('Leave type is required'),
    dates: Yup.array().required('Dates is required'),
    note: Yup.string().required('Note is required'),
  });

  const initialValues = {
    employee: '',
    leaveType: '',
    dates: [],
    note: '',
  };

  const { handleSubmit, handleChange, handleBlur, values, touched, errors, setValues, resetForm } = useFormik({
    initialValues: { ...initialValues },
    validationSchema: schema,
    onSubmit: (values) => {
      const payload = {
        employee: values.employee,
        leaveType: values.leaveType,
        dates: values.dates.map((date) => date.format('YYYY-MM-DD')),
        note: values.note,
      };
      updateLeave(props.id, payload).then((data) => {
        if (data.status === false) {
          props.setNotify({
            open: true,
            message: 'Leave not updated',
            severity: 'error',
          });
        } else {
          props.setToggleContainer(false);
          props.setNotify({
            open: true,
            message: 'Leave updated',
            severity: 'success',
          });
        }
      });
    },
  });

  const renderPickerDay = (date, selectedDates, pickersDayProps) => {
    if (!values.dates) {
      return <PickersDay {...pickersDayProps} />;
    }
    const selected = values.dates.find((item) => item?.isSame(moment(date)));
    return <CustomPickersDay {...pickersDayProps} disableMargin selected={selected} />;
  };

  useEffect(() => {
    setValues(initialValues);
    resetForm();
    if (props.id) {
      getLeaveById(props.id).then((data) => {
        const payload = {
          ...data.data,
          employee: data.data.employee?._id,
          dates: data.data.dates?.map((item) => moment(moment(item).format('YYYY-MM-DD'))),
        };
        setValues(payload ?? {});
      });
    }
  }, [props.id]);

  return (
    <Card sx={{ p: 4, my: 4 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e);
        }}
        autoComplete="off"
        encType="multipart/form-data"
      >
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.employee && errors.employee && true}>
              <InputLabel id="select-label">Select employee</InputLabel>
              <Select
                labelId="select-label"
                id="select"
                label={touched.employee && errors.employee ? errors.employee : 'Select employee'}
                name="employee"
                value={values.employee}
                onBlur={handleBlur}
                onChange={(e) => {
                  setValues({ ...values, employee: e.target.value });
                  handleChange(e);
                }}
              >
                {employees.map((e) => (
                  <MenuItem value={e._id}>{e.employeeId} {e.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="leaveType"
              value={values.leaveType}
              error={touched.leaveType && errors.leaveType && true}
              label={touched.leaveType && errors.leaveType ? errors.leaveType : 'Leave Type'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <LocalizationProvider dateAdapter={AdapterMoment} fullWidth>
              <StaticDatePicker
                displayStaticWrapperAs="desktop"
                name="dates"
                error={touched.dates && errors.dates && true}
                label={touched.dates && errors.dates ? errors.dates : 'Dates'}
                value={values.dates}
                onChange={(newValue) => {
                  const array = [...values.dates];
                  const date = newValue;
                  const index = array.findIndex((item) => item?.isSame(moment(date)));
                  if (index >= 0) {
                    array.splice(index, 1);
                  } else {
                    array.push(date);
                  }
                  setValues({ ...values, dates: array });
                }}
                renderDay={renderPickerDay}
                renderInput={(params) => <TextField {...params} />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="note"
              value={values.note}
              error={touched.note && errors.note && true}
              label={touched.note && errors.note ? errors.note : 'Note'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <LoadingButton size="large" type="submit" variant="contained">
              Save
            </LoadingButton>
          </Grid>
        </Grid>
      </form>
    </Card>
  );
}

export default UpdateLeave;
