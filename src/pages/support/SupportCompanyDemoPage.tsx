// src/pages/support/SupportCompanyDemoPage.tsx

import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Card,
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
} from '@mui/material';
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
  lastAllowedCheckInTime: string;
  beginCheckOutTime: string;
  details: CompanyDetails;
}

const BASE_URL = 'https://hrms-app-deploy-production.up.railway.app/v1/support';

// ---------------------- Helper functions ----------------------

// Convert HH:mm:ss local → UTC string for backend
// Convert HH:mm (or HH:mm:ss) local → UTC string for backend
const toUTCTimeString = (localTime: string) => {
  if (!localTime) return '';
  const parts = localTime.split(':').map(Number);
  const hours = parts[0];
  const minutes = parts[1];
  const seconds = parts[2] ?? 0; // default seconds to 0
  const date = new Date();
  date.setHours(hours, minutes, seconds, 0);
  // convert to UTC "HH:mm:ss"
  return date.toISOString().substr(11, 8);
};


// Convert UTC string → local HH:mm:ss for display
const formatLocalTime = (utcTimeStr: string) => {
  if (!utcTimeStr) return '';
  const date = new Date(`1970-01-01T${utcTimeStr}Z`); // treat as UTC
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
  const [lastCheckIn, setLastCheckIn] = useState('');
  const [beginCheckOut, setBeginCheckOut] = useState('');
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
      const payload = {
        email,
        name,
        doc,
        about,
        lastAllowedCheckInTime: toUTCTimeString(lastCheckIn),
        beginCheckOutTime: toUTCTimeString(beginCheckOut),
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
    setLastCheckIn('');
    setBeginCheckOut('');
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

  return (
    <div style={{ padding: 24 }}>
      <Typography variant="h4" gutterBottom>
        Support / Company Management (Demo)
      </Typography>

      {/* Create Company Form */}
      <Card style={{ marginBottom: 24 }}>
        <CardContent>
          <Typography variant="h6">Create Company</Typography>
          <Grid container spacing={2} style={{ marginTop: 8 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Date of Creation (YYYY-MM-DD)"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={doc}
                onChange={(e) => setDoc(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="About" fullWidth value={about} onChange={(e) => setAbout(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Last Allowed Check-In Time (HH:mm:ss)"
                type="time"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={lastCheckIn}
                onChange={(e) => setLastCheckIn(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Begin Check-Out Time (HH:mm:ss)"
                type="time"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={beginCheckOut}
                onChange={(e) => setBeginCheckOut(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Reg Number" fullWidth value={regNumber} onChange={(e) => setRegNumber(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="PAN" fullWidth value={pan} onChange={(e) => setPan(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Company Type" fullWidth value={companyType} onChange={(e) => setCompanyType(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button variant="contained" color="primary" onClick={handleSubmit} disabled={loading}>
                Create Company
              </Button>
              <Button style={{ marginLeft: 12 }} onClick={() => (window.location.href = '/login')}>
                Skip
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* All Companies Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Companies
          </Typography>
          {loading && <Typography>Loading...</Typography>}
          {error && <Typography color="error">{error}</Typography>}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>DOC</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.map((cmp) => (
                <TableRow key={cmp.email}>
                  <TableCell>{cmp.email}</TableCell>
                  <TableCell>{cmp.name}</TableCell>
                  <TableCell>{formatLocalDate(cmp.doc)}</TableCell>
                  <TableCell>
                    <Button variant="outlined" size="small" onClick={() => handleViewDetails(cmp.email)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal for Company Details */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Company Details</DialogTitle>
        <DialogContent>
          {selectedCompany && (
            <>
              <Typography><b>Email:</b> {selectedCompany.email}</Typography>
              <Typography><b>Name:</b> {selectedCompany.name}</Typography>
              <Typography><b>DOC:</b> {formatLocalDate(selectedCompany.doc)}</Typography>
              <Typography><b>About:</b> {selectedCompany.about}</Typography>
              <Typography><b>Last Allowed Check-In:</b> {formatLocalTime(selectedCompany.lastAllowedCheckInTime)}</Typography>
              <Typography><b>Begin Check-Out:</b> {formatLocalTime(selectedCompany.beginCheckOutTime)}</Typography>
              <Typography><b>Reg Number:</b> {selectedCompany.details.regNumber}</Typography>
              <Typography><b>PAN:</b> {selectedCompany.details.pan}</Typography>
              <Typography><b>Company Type:</b> {selectedCompany.details.companyType}</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SupportCompanyDemoPage;
