import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Stack,
  CircularProgress,
  Chip,
  Grid,
  Divider,
  Skeleton
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { systemAPI } from '@api/system'
import { OperationSnapshot } from '../types'
import { formatDateTime } from '@utils/date'
import { PlayCircle, StopCircle, Timeline, Tune, Visibility } from '@mui/icons-material'

export const Operation = () => {
  const [rackFilter, setRackFilter] = useState('')

  const operationQuery = useQuery({
    queryKey: ['operationData'],
    queryFn: async () => {
      const resp = await systemAPI.getOperationData(100)
      return resp.data.data as OperationSnapshot[]
    },
    staleTime: 10000
  })

  const operationLogs: OperationSnapshot[] = operationQuery.data ?? []
  const filteredLogs = operationLogs.filter((entry) =>
    rackFilter === '' ? true : String(entry.rack_id) === rackFilter
  )

  // Summaries: build endpoint events (open/close) and dedupe consecutive identical actions per rack
  const endpointEventsRaw = operationLogs
    .filter((e) => e.is_endpoint)
    .map((e) => ({
      id: e.id,
      rack_id: e.rack_id ?? -1,
      timestamp: e.created_at,
      action: e.displacement && Number(e.displacement) > 0 ? 'open' as const : 'close' as const
    }))

  // Group by rack_id
  const grouped: Record<number, Array<typeof endpointEventsRaw[number]>> = {}
  endpointEventsRaw.forEach((ev) => {
    const rid = ev.rack_id ?? -1
    if (!grouped[rid]) grouped[rid] = []
    grouped[rid].push(ev)
  })

  // For each rack, sort by timestamp desc and remove consecutive same-action duplicates
  let dedupedPerRack: Array<typeof endpointEventsRaw[number]> = []
  Object.values(grouped).forEach((events) => {
    events.sort((a, b) => (b.timestamp ?? '').localeCompare(a.timestamp ?? ''))
    let prevAction: string | null = null
    for (const ev of events) {
      if (ev.action === prevAction) continue
      dedupedPerRack.push(ev)
      prevAction = ev.action
    }
  })

  // Sort across racks by timestamp desc and limit
  const endpointEvents = dedupedPerRack.sort((a, b) => (b.timestamp ?? '').localeCompare(a.timestamp ?? ''))
  const endpointEventsLimited = endpointEvents.slice(0, 200)
  const openCount = endpointEvents.filter((event) => event.action === 'open').length
  const closeCount = endpointEvents.filter((event) => event.action === 'close').length
  const activeRackCount = new Set(operationLogs.map((entry) => entry.rack_id)).size

  const [selected, setSelected] = useState<null | { id: number; rack_id: number; timestamp: string | null; action: 'open' | 'close' }>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={1} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', letterSpacing: '-0.02em' }}>Operation Logs</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>Track rack movement, endpoint events and machine state.</Typography>
        </Box>
        <Chip icon={<Timeline />} label={`${operationLogs.length} snapshots`} color="primary" variant="outlined" />
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}><Card sx={{ borderTop: '3px solid', borderColor: 'primary.main' }}><CardContent><Typography variant="body2" color="text.secondary">Racks reporting</Typography><Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5 }}>{activeRackCount}</Typography><Typography variant="caption" color="text.secondary">Unique racks in current logs</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={4}><Card sx={{ borderTop: '3px solid', borderColor: 'success.main' }}><CardContent><Stack direction="row" justifyContent="space-between"><Box><Typography variant="body2" color="text.secondary">Open endpoints</Typography><Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5 }}>{openCount}</Typography></Box><PlayCircle color="success" sx={{ fontSize: 34 }} /></Stack></CardContent></Card></Grid>
        <Grid item xs={12} sm={4}><Card sx={{ borderTop: '3px solid', borderColor: 'info.main' }}><CardContent><Stack direction="row" justifyContent="space-between"><Box><Typography variant="body2" color="text.secondary">Close endpoints</Typography><Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5 }}>{closeCount}</Typography></Box><StopCircle color="info" sx={{ fontSize: 34 }} /></Stack></CardContent></Card></Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}><Tune color="action" /><Box><Typography variant="h6" sx={{ fontWeight: 'bold' }}>Rack filter</Typography><Typography variant="body2" color="text.secondary">Inspect completed movement events for one rack.</Typography></Box></Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Filter by Rack ID"
              type="number"
              size="small"
              value={rackFilter}
              onChange={(e) => setRackFilter(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <Button variant="outlined" onClick={() => setRackFilter('')}>
              Clear
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {operationQuery.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Recent Open/Close Operations
              </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 560 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Rack</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>View</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {endpointEventsLimited.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No completed open/close operations.
                        </TableCell>
                      </TableRow>
                    ) : (
                      endpointEventsLimited.map((ev) => (
                        <TableRow key={ev.id} hover>
                          <TableCell>{formatDateTime(ev.timestamp)}</TableCell>
                          <TableCell>{ev.rack_id}</TableCell>
                          <TableCell><Chip label={ev.action === 'open' ? 'Opened' : 'Closed'} size="small" color={ev.action === 'open' ? 'success' : 'info'} /></TableCell>
                          <TableCell>
                            <Button size="small" startIcon={<Visibility />} onClick={() => { setSelected(ev as any); setDetailOpen(true) }}>
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Detail view for selected operation */}
          <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="lg" fullWidth>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Operation Detail - Rack {selected?.rack_id} ({selected?.action})
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Movement Speed</TableCell>
                      <TableCell>Displacement</TableCell>
                      <TableCell>Hard Locked</TableCell>
                      <TableCell>Endpoint</TableCell>
                      <TableCell>State</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(operationLogs.filter(l => l.rack_id === selected?.rack_id) || []).map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell>{formatDateTime(log.created_at)}</TableCell>
                        <TableCell>{log.movement_speed ?? '--'}</TableCell>
                        <TableCell>{log.displacement ?? '--'}</TableCell>
                        <TableCell>{log.is_hard_locked ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{log.is_endpoint ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{log.state != null ? log.state : '--'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button onClick={() => setDetailOpen(false)}>Close</Button>
              </Box>
            </Box>
          </Dialog>
        </Box>
      )}
    </Box>
  )
}
