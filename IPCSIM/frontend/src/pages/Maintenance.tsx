import { Box, Card, CardContent, Typography, Button, Stack, TextField, Alert } from '@mui/material'
import { useAuthStore } from '@store/authStore'
import { Warning } from '@mui/icons-material'

export const Maintenance = () => {
  const canAccess = useAuthStore((s) => s.canAccess)

  if (!canAccess('MAINTENANCE')) {
    return (
      <Box>
        <Alert severity="error">Access Denied: This section is for Maintenance personnel only</Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Hardware Maintenance
      </Typography>

      {/* Rack Control */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" /> Manual Rack Control
          </Typography>
          <Stack spacing={2}>
            <TextField label="Rack Code" defaultValue="A-R01" fullWidth size="small" />
            <TextField label="Speed" type="number" defaultValue="50" fullWidth size="small" />
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" fullWidth>
                Move Left
              </Button>
              <Button variant="outlined" fullWidth>
                Stop
              </Button>
              <Button variant="outlined" fullWidth>
                Move Right
              </Button>
              <Button variant="outlined" fullWidth>
                Home
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Diagnostics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            System Diagnostics
          </Typography>
          <Stack spacing={1}>
            <Button variant="outlined" fullWidth>
              Test Serial Communication
            </Button>
            <Button variant="outlined" fullWidth>
              Check Sensor Calibration
            </Button>
            <Button variant="outlined" fullWidth>
              Verify Database Integrity
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Firmware */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Firmware Update
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Current firmware version: v1.2.3
          </Typography>
          <Button variant="contained" fullWidth>
            Check for Updates
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}
