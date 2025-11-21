import { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Box,
  Container,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  Snackbar,
  Alert,
  CircularProgress,
  TableSortLabel,
  InputLabel,
} from '@mui/material';
import { Visibility, Delete, Business, Add } from '@mui/icons-material';
import axios from 'axios';
import Grid from '@mui/material/Grid';

interface CompanyDetails {
  regNumber: string;
  pan: string;
  companyType: string;
}

interface Company {
  email: string;
  name: string;
  doc: string;
  about: string;
  departments: string[];
  lastAllowedCheckInTime: string;
  beginCheckOutTime: string;
  details: CompanyDetails;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

type SortField = 'email' | 'name' | 'doc' | 'departments';
type SortOrder = 'asc' | 'desc';

const BASE_URL = 'https://hrms.brchub.me/v1/support';

// ---------------------- Helper functions ----------------------

const toUTCTimeString = (time12hr: string, period: string) => {
  if (!time12hr) return '';
  const [hours, minutes] = time12hr.split(':').map(Number);
  let hours24 = hours;
  
  if (period === 'PM' && hours !== 12) {
    hours24 = hours + 12;
  } else if (period === 'AM' && hours === 12) {
    hours24 = 0;
  }
  
  const date = new Date();
  date.setHours(hours24, minutes, 0, 0);
  return date.toISOString().substr(11, 8);
};

const formatLocalTime = (utcTimeStr: string) => {
  if (!utcTimeStr) return '';
  const date = new Date(`1970-01-01T${utcTimeStr}Z`);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

const formatLocalDate = (utcDateStr: string) => {
  if (!utcDateStr) return '';
  const date = new Date(utcDateStr + 'T00:00:00Z');
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const validatePAN = (pan: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  return panRegex.test(pan);
};

// Company Types - All major types in India
const COMPANY_TYPES = [
  'Private Limited (Pvt Ltd)',
  'Public Limited (Ltd)',
  'Limited Liability Partnership (LLP)',
  'One Person Company (OPC)',
  'Partnership Firm',
  'Sole Proprietorship',
  'Non-Governmental Organization (NGO)',
  'Section 8 Company (Non-Profit)',
  'Trust',
  'Society',
  'Hindu Undivided Family (HUF)',
  'Producer Company',
  'Nidhi Company',
  'Foreign Company',
  'Joint Venture',
  'Cooperative Society',
];

// -----------------------------------------------------------------

const SupportCompanyDemoPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [doc, setDoc] = useState('');
  const [about, setAbout] = useState('');
  const [departments, setDepartments] = useState('');
  const [lastCheckIn, setLastCheckIn] = useState('');
  const [lastCheckInPeriod, setLastCheckInPeriod] = useState('AM');
  const [beginCheckOut, setBeginCheckOut] = useState('');
  const [beginCheckOutPeriod, setBeginCheckOutPeriod] = useState('PM');
  const [regNumber, setRegNumber] = useState('');
  const [pan, setPan] = useState('');
  const [companyType, setCompanyType] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const showSnackbar = (message: string, severity: SnackbarState['severity']) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const extractErrorMessage = (err: any): string => {
    if (err.response?.data?.details) {
      return err.response.data.details;
    }
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
    if (err.response?.data?.error) {
      return err.response.data.error;
    }
    return err.message || 'An unknown error occurred';
  };

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/cmp`);
      setCompanies(res.data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      const errorMsg = extractErrorMessage(err);
      setError(errorMsg);
      showSnackbar(`Failed to fetch companies: ${errorMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSort = (field: SortField) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const sortedCompanies = [...companies].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'email':
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'doc':
        aValue = new Date(a.doc).getTime();
        bValue = new Date(b.doc).getTime();
        break;
      case 'departments':
        aValue = a.departments.length;
        bValue = b.departments.length;
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }

    if (aValue < bValue) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = 'Invalid email format (must contain @ and domain)';
    
    if (!name.trim()) newErrors.name = 'Company name is required';
    if (!doc) newErrors.doc = 'Date of creation is required';
    if (!about.trim()) newErrors.about = 'About company is required';
    if (!departments.trim()) newErrors.departments = 'At least one department is required';
    if (!lastCheckIn) newErrors.lastCheckIn = 'Last check-in time is required';
    if (!beginCheckOut) newErrors.beginCheckOut = 'Begin check-out time is required';
    if (!regNumber.trim()) newErrors.regNumber = 'Registration number is required';
    
    if (!pan.trim()) {
      newErrors.pan = 'PAN number is required';
    } else if (!validatePAN(pan)) {
      newErrors.pan = 'Invalid PAN format. Use: ABCDE1234F (5 letters, 4 digits, 1 letter)';
    }
    
    if (!companyType.trim()) newErrors.companyType = 'Company type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePANChange = (value: string) => {
    const upperValue = value.toUpperCase().slice(0, 10);
    
    let formattedValue = '';
    for (let i = 0; i < upperValue.length; i++) {
      const char = upperValue[i];
      if (i < 5) {
        if (/[A-Z]/.test(char)) formattedValue += char;
      } else if (i < 9) {
        if (/[0-9]/.test(char)) formattedValue += char;
      } else {
        if (/[A-Z]/.test(char)) formattedValue += char;
      }
    }
    
    setPan(formattedValue);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showSnackbar('Please fill in all required fields correctly', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const departmentsArray = departments
        .split(',')
        .map(dept => dept.trim())
        .filter(dept => dept.length > 0);
      
      const payload = {
        email,
        name,
        doc,
        about,
        departments: departmentsArray,
        lastAllowedCheckInTime: toUTCTimeString(lastCheckIn, lastCheckInPeriod),
        beginCheckOutTime: toUTCTimeString(beginCheckOut, beginCheckOutPeriod),
        details: {
          regNumber,
          pan,
          companyType,
        },
      };
      
      const res = await axios.post(`${BASE_URL}/create/cmp`, payload);
      console.log('Company created:', res.data);
      await fetchCompanies();
      clearForm();
      showSnackbar('Company created successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      const errorMsg = extractErrorMessage(err);
      showSnackbar(`Error creating company: ${errorMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setEmail('');
    setName('');
    setDoc('');
    setAbout('');
    setDepartments('');
    setLastCheckIn('');
    setLastCheckInPeriod('AM');
    setBeginCheckOut('');
    setBeginCheckOutPeriod('PM');
    setRegNumber('');
    setPan('');
    setCompanyType('');
    setErrors({});
  };

  const handleViewDetails = async (companyEmail: string) => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/cmp/${encodeURIComponent(companyEmail)}`);
      setSelectedCompany(res.data);
      setModalOpen(true);
    } catch (err: any) {
      console.error(err);
      const errorMsg = extractErrorMessage(err);
      showSnackbar(`Error fetching company details: ${errorMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (companyEmail: string) => {
    setCompanyToDelete(companyEmail);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      setDeleteModalOpen(false);
      await axios.delete(`${BASE_URL}/cmp/${encodeURIComponent(companyToDelete)}`);
      showSnackbar('Company deleted successfully!', 'success');
      await fetchCompanies();
    } catch (err: any) {
      console.error(err);
      const errorMsg = extractErrorMessage(err);
      showSnackbar(`Error deleting company: ${errorMsg}`, 'error');
    } finally {
      setLoading(false);
      setCompanyToDelete('');
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setCompanyToDelete('');
  };

  return (
    <Box sx={{ backgroundColor: '#f5f7fa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Business sx={{ fontSize: 32, color: '#1976d2' }} />
            <Typography variant="h4" fontWeight={600} color="#1a1a1a">
              Orvexa Support / Company Management
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Create and manage company profiles, departments, and settings
          </Typography>
        </Box>

        <Paper elevation={2} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: '#1976d2', px: 3, py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Add sx={{ color: 'white' }} />
              <Typography variant="h6" color="white" fontWeight={500}>
                Create New Company
              </Typography>
            </Box>
          </Box>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 2 }}>
                  Basic Information
                </Typography>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField 
                  label="Company Email" 
                  fullWidth 
                  required
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  variant="outlined"
                  size="small"
                  error={!!errors.email}
                  helperText={errors.email}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField 
                  label="Company Name" 
                  fullWidth 
                  required
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  variant="outlined"
                  size="small"
                  error={!!errors.name}
                  helperText={errors.name}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Date of Creation"
                  type="date"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={doc}
                  onChange={(e) => setDoc(e.target.value)}
                  variant="outlined"
                  size="small"
                  error={!!errors.doc}
                  helperText={errors.doc}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField 
                  label="About Company" 
                  fullWidth 
                  required
                  value={about} 
                  onChange={(e) => setAbout(e.target.value)}
                  variant="outlined"
                  size="small"
                  error={!!errors.about}
                  helperText={errors.about}
                />
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 2 }}>
                  Departments
                </Typography>
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <TextField 
                  label="Departments" 
                  fullWidth 
                  required
                  value={departments} 
                  onChange={(e) => setDepartments(e.target.value)}
                  placeholder="e.g., HR, IT, Finance, Sales"
                  helperText={errors.departments || "Enter department names separated by commas"}
                  variant="outlined"
                  size="small"
                  multiline
                  rows={2}
                  error={!!errors.departments}
                />
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 2 }}>
                  Working Hours Configuration
                </Typography>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
                  Last Allowed Check-In Time *
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    type="time"
                    fullWidth
                    required
                    value={lastCheckIn}
                    onChange={(e) => setLastCheckIn(e.target.value)}
                    variant="outlined"
                    size="small"
                    error={!!errors.lastCheckIn}
                    inputProps={{
                      step: 60
                    }}
                  />
                  <FormControl size="small" sx={{ minWidth: 90 }}>
                    <Select
                      value={lastCheckInPeriod}
                      onChange={(e) => setLastCheckInPeriod(e.target.value)}
                    >
                      <MenuItem value="AM">AM</MenuItem>
                      <MenuItem value="PM">PM</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <FormHelperText error={!!errors.lastCheckIn}>
                  {errors.lastCheckIn || 'Last allowed time for check-in'}
                </FormHelperText>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
                  Begin Check-Out Time *
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    type="time"
                    fullWidth
                    required
                    value={beginCheckOut}
                    onChange={(e) => setBeginCheckOut(e.target.value)}
                    variant="outlined"
                    size="small"
                    error={!!errors.beginCheckOut}
                    inputProps={{
                      step: 60
                    }}
                  />
                  <FormControl size="small" sx={{ minWidth: 90 }}>
                    <Select
                      value={beginCheckOutPeriod}
                      onChange={(e) => setBeginCheckOutPeriod(e.target.value)}
                    >
                      <MenuItem value="AM">AM</MenuItem>
                      <MenuItem value="PM">PM</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <FormHelperText error={!!errors.beginCheckOut}>
                  {errors.beginCheckOut || 'Earliest time for check-out'}
                </FormHelperText>
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 2 }}>
                  Legal Details
                </Typography>
              </Grid>
              
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField 
                  label="Registration Number" 
                  fullWidth 
                  required
                  value={regNumber} 
                  onChange={(e) => setRegNumber(e.target.value)}
                  variant="outlined"
                  size="small"
                  error={!!errors.regNumber}
                  helperText={errors.regNumber}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField 
                  label="PAN Number" 
                  fullWidth 
                  required
                  value={pan} 
                  onChange={(e) => handlePANChange(e.target.value)}
                  variant="outlined"
                  size="small"
                  error={!!errors.pan}
                  helperText={errors.pan || "Format: ABCDE1234F"}
                  placeholder="ABCDE1234F"
                  inputProps={{
                    maxLength: 10,
                    style: { textTransform: 'uppercase' }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl 
                  fullWidth 
                  required
                  variant="outlined"
                  size="small"
                  error={!!errors.companyType}
                >
                  <InputLabel>Company Type</InputLabel>
                  <Select
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                    label="Company Type"
                  >
                    {COMPANY_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.companyType}</FormHelperText>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleSubmit} 
                    disabled={loading}
                    startIcon={<Add />}
                    sx={{ px: 4 }}
                  >
                    Create Company
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={clearForm}
                    sx={{ px: 4 }}
                  >
                    Clear Form
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Paper>

        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: '#f8f9fa', px: 3, py: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" fontWeight={500}>
              All Companies ({companies.length})
            </Typography>
          </Box>
          <CardContent sx={{ p: 0 }}>
            {loading && (
              <Box sx={{ 
                p: 8, 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}>
                <CircularProgress size={48} />
                <Typography color="text.secondary">Loading companies...</Typography>
              </Box>
            )}
            {error && (
              <Box sx={{ p: 3 }}>
                <Typography color="error">{error}</Typography>
              </Box>
            )}
            {!loading && !error && (
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <TableSortLabel
                          active={sortField === 'email'}
                          direction={sortField === 'email' ? sortOrder : 'asc'}
                          onClick={() => handleSort('email')}
                        >
                          Email
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <TableSortLabel
                          active={sortField === 'name'}
                          direction={sortField === 'name' ? sortOrder : 'asc'}
                          onClick={() => handleSort('name')}
                        >
                          Company Name
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <TableSortLabel
                          active={sortField === 'doc'}
                          direction={sortField === 'doc' ? sortOrder : 'asc'}
                          onClick={() => handleSort('doc')}
                        >
                          Date Created
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <TableSortLabel
                          active={sortField === 'departments'}
                          direction={sortField === 'departments' ? sortOrder : 'asc'}
                          onClick={() => handleSort('departments')}
                        >
                          Departments
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedCompanies.map((cmp) => (
                      <TableRow 
                        key={cmp.email}
                        sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}
                      >
                        <TableCell>{cmp.email}</TableCell>
                        <TableCell>
                          <Typography fontWeight={500}>{cmp.name}</Typography>
                        </TableCell>
                        <TableCell>{formatLocalDate(cmp.doc)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 300 }}>
                            {cmp.departments && cmp.departments.length > 0 ? (
                              cmp.departments.map((dept, index) => (
                                <Chip 
                                  key={index} 
                                  label={dept} 
                                  size="small"
                                  sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }}
                                />
                              ))
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                No departments
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Tooltip title="View Details">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleViewDetails(cmp.email)}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Company">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteCompany(cmp.email)}
                                disabled={loading}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </CardContent>
        </Paper>

        <Dialog 
          open={modalOpen} 
          onClose={() => setModalOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Business color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Company Details
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {selectedCompany && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    EMAIL
                  </Typography>
                  <Typography variant="body1">{selectedCompany.email}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    COMPANY NAME
                  </Typography>
                  <Typography variant="body1">{selectedCompany.name}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    DATE OF CREATION
                  </Typography>
                  <Typography variant="body1">{formatLocalDate(selectedCompany.doc)}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    ABOUT
                  </Typography>
                  <Typography variant="body1">{selectedCompany.about}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                    DEPARTMENTS
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {selectedCompany.departments && selectedCompany.departments.length > 0 ? (
                      selectedCompany.departments.map((dept, index) => (
                        <Chip 
                          key={index} 
                          label={dept} 
                          size="small"
                          sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }}
                        />
                      ))
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No departments
                      </Typography>
                    )}
                  </Box>
                </Box>
                
                <Divider />
                
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    LAST ALLOWED CHECK-IN
                  </Typography>
                  <Typography variant="body1">{formatLocalTime(selectedCompany.lastAllowedCheckInTime)}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    BEGIN CHECK-OUT
                  </Typography>
                  <Typography variant="body1">{formatLocalTime(selectedCompany.beginCheckOutTime)}</Typography>
                </Box>
                
                <Divider />
                
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    REGISTRATION NUMBER
                  </Typography>
                  <Typography variant="body1">{selectedCompany.details.regNumber}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    PAN NUMBER
                  </Typography>
                  <Typography variant="body1">{selectedCompany.details.pan}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    COMPANY TYPE
                  </Typography>
                  <Typography variant="body1">{selectedCompany.details.companyType}</Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
            <Button onClick={() => setModalOpen(false)} variant="contained">
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog 
          open={deleteModalOpen} 
          onClose={cancelDelete}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle sx={{ bgcolor: '#fff3e0', borderBottom: '1px solid #ffb74d', pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Delete sx={{ color: '#f57c00', fontSize: 28 }} />
              <Typography variant="h6" fontWeight={600} color="#e65100">
                Confirm Delete
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ mt: 3, mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to delete this company?
            </Typography>
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: '#f5f5f5', 
              borderRadius: 1,
              borderLeft: '4px solid #f57c00'
            }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                COMPANY EMAIL
              </Typography>
              <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                {companyToDelete}
              </Typography>
            </Box>
            <Alert severity="warning" sx={{ mt: 2 }}>
              This action cannot be undone. All company data will be permanently removed.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#fafafa', gap: 1 }}>
            <Button 
              onClick={cancelDelete} 
              variant="outlined"
              color="inherit"
              sx={{ px: 3 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete} 
              variant="contained"
              color="error"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <Delete />}
              sx={{ px: 3 }}
            >
              {loading ? 'Deleting...' : 'Delete Company'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default SupportCompanyDemoPage;