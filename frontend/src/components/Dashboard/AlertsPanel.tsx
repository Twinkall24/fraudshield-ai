import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as ResolveIcon,
  Assignment as AssignIcon,
} from '@mui/icons-material';
import { alertsAPI } from '../../services/api';
import { Alert } from '../../types';
import { useRole } from '../../hooks/useRole';
import { useAuth } from '../../contexts/AuthContext';

export const AlertsPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const { canModifyAlerts } = useRole();
  const { user } = useAuth();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await alertsAPI.getAll({ status: 'open', limit: 10 });
      setAlerts(response.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const handleAlertClick = (alert: Alert) => {
    if (!canModifyAlerts) return;
    setSelectedAlert(alert);
    setStatus(alert.status);
    setNotes('');
    setDialogOpen(true);
  };

  const handleUpdateAlert = async () => {
    if (!selectedAlert) return;

    try {
      await alertsAPI.update(selectedAlert.id, {
        status,
        resolution_notes: notes,
        assigned_to: user?.id,
      });
      
      setDialogOpen(false);
      fetchAlerts();
    } catch (error) {
      console.error('Error updating alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'info';
    }
  };

  return (
    <>
      <Paper sx={{ p: 2, height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Active Alerts
          </Typography>
          <Chip label={`${alerts.length} Open`} color="error" size="small" />
        </Box>

        {alerts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No active alerts
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {alerts.map((alert) => (
              <ListItem
                key={alert.id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  cursor: canModifyAlerts ? 'pointer' : 'default',
                  '&:hover': canModifyAlerts ? {
                    bgcolor: 'action.hover',
                  } : {},
                }}
                onClick={() => handleAlertClick(alert)}
              >
                <WarningIcon 
                  color={getSeverityColor(alert.severity)} 
                  sx={{ mr: 2 }} 
                />
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {alert.title}
                      </Typography>
                      <Chip 
                        label={alert.severity.toUpperCase()} 
                        size="small" 
                        color={getSeverityColor(alert.severity)}
                      />
                    </Box>
                  }
                  secondary={alert.description}
                />
                {canModifyAlerts && (
                  <IconButton size="small" color="primary">
                    <AssignIcon />
                  </IconButton>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Update Alert Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Alert</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              select
              fullWidth
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="investigating">Investigating</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="false_positive">False Positive</MenuItem>
            </TextField>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Investigation Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your investigation notes here..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateAlert}>
            Update Alert
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};