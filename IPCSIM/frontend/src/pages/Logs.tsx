import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  TextField,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { systemAPI } from '@api/system'
import { formatDateTime, parseVietnamDate } from '@utils/date'

const LOG_TYPES = [
  { value: 'ALL', label: 'All' },
  { value: 'OPERATION', label: 'Operation' },
  { value: 'BREAKDOWN', label: 'Breakdown' }
]

// Format datetime string from backend (already in UTC+7)
export const Logs = () => {
  const [filterType, setFilterType] = useState('ALL')
  const [filterRack, setFilterRack] = useState('')

  const operationQuery = useQuery({
    queryKey: ['operationLogs'],
    queryFn: async () => {
      const resp = await systemAPI.getOperationData(100)
      return resp.data.data
    }
  })

  const breakdownQuery = useQuery({
    queryKey: ['breakdownLogs'],
    queryFn: async () => {
      const resp = await systemAPI.getBreakdownData(100)
      return resp.data.data
    }
  })

  const isLoading = operationQuery.isLoading || breakdownQuery.isLoading
  const operationLogs = operationQuery.data ?? []
  const breakdownLogs = breakdownQuery.data ?? []

  const events = [
    ...(filterType === 'ALL' || filterType === 'OPERATION'
      ? operationLogs.map((event: any) => ({
          id: `op-${event.id}`,
          timestamp: event.created_at,
          type: 'OPERATION',
          rack_id: event.rack_id,
          action: `Movement speed ${event.movement_speed}, displacement ${event.displacement}, state ${event.state ?? 'N/A'}`,
          status: 'OK'
        }))
      : []),
    ...(filterType === 'ALL' || filterType === 'BREAKDOWN'
      ? breakdownLogs.map((event: any) => ({
          id: `br-${event.id}`,
          timestamp: event.created_at,
          type: 'BREAKDOWN',
          rack_id: event.rack_id,
          action: `Obstructed ${event.is_obstructed}, skewed ${event.is_skewed}, overload ${event.is_overload_motor}`,
          status: event.is_obstructed || event.is_skewed || event.is_overload_motor ? 'ALERT' : 'OK'
        }))
      : [])
  ].sort((a, b) => {
    const aDate = parseVietnamDate(a.timestamp)?.getTime() ?? 0
    const bDate = parseVietnamDate(b.timestamp)?.getTime() ?? 0
    return bDate - aDate
  })

  const filtered = events.filter((log) => (filterRack === '' || String(log.rack_id) === filterRack))

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Operation History
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Event Type</InputLabel>
              <Select
                value={filterType}
                label="Event Type"
                onChange={(e) => setFilterType(e.target.value)}
              >
                {LOG_TYPES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Rack ID"
              type="number"
              size="small"
              value={filterRack}
              onChange={(e) => setFilterRack(e.target.value)}
              sx={{ minWidth: 180 }}
            />

            <Button variant="outlined" onClick={() => { setFilterType('ALL'); setFilterRack('') }}>
              Clear
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Timestamp</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Rack</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{log.type}</TableCell>
                  <TableCell>{log.rack_id ?? '--'}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell sx={{ color: log.status === 'OK' ? 'green' : 'red' }}>
                    {log.status}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
