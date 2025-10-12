// src/pages/support/SupportCompanyDemoPage.tsx

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

const BASE_URL = 'https://hrms-app-deploy-production.up.railway.app/v1/support';

// ---------------------- Helper functions ----------------------

// Convert 12-hour time + AM/PM to 24-hour format, then to UTC string for backend
const toUTCTimeString = (time12hr: string, period: string) => {
  if (!time12hr) return '';
  const [hours, minutes] = time12hr.split(':').map(Number);
  let hours24 = hours;
  
  // Convert to 24-hour format
  if (period === 'PM' && hours !== 12) {
    hours24 = hours + 12;
  } else if (period === 'AM' && hours === 12) {
    hours24 = 0;
  }
  
  const date = new Date();
  date.setHours(hours24, minutes, 0, 0);
  return date.toISOString().substr(11, 8);
};

// Convert UTC string → local time in 12-hour format with AM/PM
const formatLocalTime = (utcTimeStr: string) => {
  if (!utcTimeStr) return '';
  const date = new Date(`1970-01-01T${utcTimeStr}Z`);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

// Convert DOC (YYYY-MM-DD) in UTC → local display
const formatLocalDate = (utcDateStr: string) => {
  if (!utcDateStr) return '';
  const date = new Date(utcDateStr + 'T00:00:00Z');
  return date.toLocaleDateString();
};

// -----------------------------------------------------------------

const SupportCompanyDemoPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
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

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch all companies
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/cmp`);
      setCompanies(res.data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Create company
  const handleSubmit = async () => {
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
      alert('Company created successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Error creating company: ' + (err.message || 'Unknown error'));
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
  };

  const handleViewDetails = async (companyEmail: string) => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/cmp/${encodeURIComponent(companyEmail)}`);
      setSelectedCompany(res.data);
      setModalOpen(true);
    } catch (err: any) {
      console.error(err);
      alert('Error fetching company details: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (companyEmail: string) => {
    if (!window.confirm(`Are you sure you want to delete company: ${companyEmail}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      await axios.delete(`${BASE_URL}/cmp/${encodeURIComponent(companyEmail)}`);
      alert('Company deleted successfully!');
      await fetchCompanies();
    } catch (err: any) {
      console.error(err);
      alert('Error deleting company: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ backgroundColor: '#f5f7fa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
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

        {/* Create Company Form */}
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
              {/* Basic Information */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 2 }}>
                  Basic Information
                </Typography>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField 
                  label="Company Email" 
                  fullWidth 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField 
                  label="Company Name" 
                  fullWidth 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Date of Creation"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={doc}
                  onChange={(e) => setDoc(e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField 
                  label="About Company" 
                  fullWidth 
                  value={about} 
                  onChange={(e) => setAbout(e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              
              {/* Departments */}
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
                  value={departments} 
                  onChange={(e) => setDepartments(e.target.value)}
                  placeholder="e.g., HR, IT, Finance, Sales"
                  helperText="Enter department names separated by commas"
                  variant="outlined"
                  size="small"
                  multiline
                  rows={2}
                />
              </Grid>
              
              {/* Working Hours */}
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
                    value={lastCheckIn}
                    onChange={(e) => setLastCheckIn(e.target.value)}
                    variant="outlined"
                    size="small"
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
                <FormHelperText>Last allowed time for check-in</FormHelperText>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
                  Begin Check-Out Time *
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    type="time"
                    fullWidth
                    value={beginCheckOut}
                    onChange={(e) => setBeginCheckOut(e.target.value)}
                    variant="outlined"
                    size="small"
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
                <FormHelperText>Earliest time for check-out</FormHelperText>
              </Grid>
              
              {/* Company Details */}
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
                  value={regNumber} 
                  onChange={(e) => setRegNumber(e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField 
                  label="PAN Number" 
                  fullWidth 
                  value={pan} 
                  onChange={(e) => setPan(e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField 
                  label="Company Type" 
                  fullWidth 
                  value={companyType} 
                  onChange={(e) => setCompanyType(e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              
              {/* Actions */}
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
                    onClick={() => (window.location.href = '/login')}
                    sx={{ px: 4 }}
                  >
                    Skip
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Paper>

        {/* All Companies Table */}
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: '#f8f9fa', px: 3, py: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" fontWeight={500}>
              All Companies ({companies.length})
            </Typography>
          </Box>
          <CardContent sx={{ p: 0 }}>
            {loading && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>Loading...</Typography>
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
                      <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Company Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date Created</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Departments</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {companies.map((cmp) => (
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

        {/* Modal for Company Details */}
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
      </Container>
    </Box>
  );
};

export default SupportCompanyDemoPage;