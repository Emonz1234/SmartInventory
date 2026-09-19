import { Box, Card, CardContent, Typography, Stack, TextField, Button, Divider, Chip } from '@mui/material'
import { useAuthStore } from '@store/authStore'

export const System = () => {
  const user = useAuthStore((s) => s.user)
  const canAccess = useAuthStore((s) => s.canAccess)

  if (!canAccess('MAINTENANCE')) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          Access Denied: This section is for Maintenance personnel only
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        System Settings
      </Typography>

      {/* Database Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Database Configuration
          </Typography>
          <Stack spacing={2}>
            <TextField label="Database Host" defaultValue="localhost" fullWidth size="small" />
            <TextField label="Database Port" defaultValue="3306" fullWidth size="small" />
            <TextField label="Database Name" defaultValue="ipcsim" fullWidth size="small" />
            <Button variant="contained" size="small">
              Test Connection
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Serial Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Serial Port Configuration
          </Typography>
          <Stack spacing={2}>
            <TextField label="Port" defaultValue="COM1" fullWidth size="small" />
            <TextField label="Baud Rate" defaultValue="9600" fullWidth size="small" />
            <TextField label="Timeout (ms)" defaultValue="5000" fullWidth size="small" />
            <Button variant="contained" size="small">
              Connect Serial
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Network Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Network Configuration
          </Typography>
          <Stack spacing={2}>
            <TextField label="Server Host" defaultValue="localhost" fullWidth size="small" />
            <TextField label="Server Port" defaultValue="8000" fullWidth size="small" />
            <TextField label="Sync Interval (s)" defaultValue="60" fullWidth size="small" />
          </Stack>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* System Info */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            System Information
          </Typography>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>App Version:</Typography>
              <Chip label="0.1.0" size="small" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Python Version:</Typography>
              <Chip label="3.12" size="small" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Database Status:</Typography>
              <Chip label="Connected" size="small" color="success" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Uptime:</Typography>
              <Typography>2d 14h 23m</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
