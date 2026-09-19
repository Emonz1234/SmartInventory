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
  Chip,
  CircularProgress,
  Grid,
  Divider,
  Skeleton
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { systemAPI } from '@api/system'
import { formatDateTime } from '@utils/date'
import { ErrorOutline, ReportProblem, CheckCircle, Tune, Build } from '@mui/icons-material'

export const Breakdown = () => {
  const [filterRack, setFilterRack] = useState('')

  const breakdownQuery = useQuery({
    queryKey: ['breakdownData'],
    queryFn: async () => {
      const resp = await systemAPI.getBreakdownData(100)
      return resp.data.data
    },
    refetchInterval: 5000
  })

  const isLoading = breakdownQuery.isLoading
  const breakdownLogs: any[] = breakdownQuery.data ?? []

  const latestByRack = new Map<number, any>()
  for (const log of breakdownLogs) {
    const rackId = Number(log.rack_id)
    if (!latestByRack.has(rackId)) latestByRack.set(rackId, log)
  }

  const currentRackStatuses = Array.from(latestByRack.values())
  const getErrorNames = (log: any) => [
    log.is_obstructed && 'Obstructed',
    log.is_skewed && 'Skewed',
    log.is_overload_motor && 'Motor overload'
  ].filter(Boolean) as string[]

  const filteredLogs = currentRackStatuses.filter((log) =>
    filterRack.trim() === '' ? true : String(log.rack_id) === filterRack.trim()
  )
  const activeErrors = currentRackStatuses.filter((log) => getErrorNames(log).length > 0).length
  const fixedRacks = currentRackStatuses.filter((log) => getErrorNames(log).length === 0).length
  const affectedRacks = activeErrors

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={1} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', letterSpacing: '-0.02em' }}>Breakdown Events</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>Monitor rack faults and maintenance signals.</Typography>
        </Box>
        <Chip icon={<ErrorOutline />} label={activeErrors ? `${activeErrors} alerts detected` : 'System clear'} color={activeErrors ? 'error' : 'success'} variant="outlined" />
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}><Card sx={{ borderTop: '3px solid', borderColor: 'error.main' }}><CardContent><Stack direction="row" justifyContent="space-between"><Box><Typography variant="body2" color="text.secondary">Fault events</Typography><Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5 }}>{activeErrors}</Typography><Typography variant="caption" color="text.secondary">Events with one or more flags</Typography></Box><ReportProblem color="error" sx={{ fontSize: 34 }} /></Stack></CardContent></Card></Grid>
        <Grid item xs={12} sm={4}><Card sx={{ borderTop: '3px solid', borderColor: 'warning.main' }}><CardContent><Stack direction="row" justifyContent="space-between"><Box><Typography variant="body2" color="text.secondary">Affected racks</Typography><Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5 }}>{affectedRacks}</Typography><Typography variant="caption" color="text.secondary">Unique racks requiring attention</Typography></Box><Build color="warning" sx={{ fontSize: 34 }} /></Stack></CardContent></Card></Grid>
        <Grid item xs={12} sm={4}><Card sx={{ borderTop: '3px solid', borderColor: 'success.main' }}><CardContent><Stack direction="row" justifyContent="space-between"><Box><Typography variant="body2" color="text.secondary">Fixed racks</Typography><Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5 }}>{fixedRacks}</Typography><Typography variant="caption" color="text.secondary">Latest report has no fault</Typography></Box><CheckCircle color="success" sx={{ fontSize: 34 }} /></Stack></CardContent></Card></Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}><Tune color="action" /><Box><Typography variant="h6" sx={{ fontWeight: 'bold' }}>Breakdown filter</Typography><Typography variant="body2" color="text.secondary">Filter alerts by rack ID.</Typography></Box></Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Filter by Rack ID"
              value={filterRack}
              onChange={(e) => setFilterRack(e.target.value)}
              size="small"
              type="number"
              sx={{ minWidth: 200 }}
            />
            <Button variant="outlined" onClick={() => setFilterRack('')}>
              Clear
            </Button>
            <Chip label={`Racks tracked: ${currentRackStatuses.length}`} />
            <Chip label={`Shown: ${filteredLogs.length}`} color="primary" />
          </Stack>
        </CardContent>
      </Card>

      {isLoading ? (
        <TableContainer component={Paper} variant="outlined"><Table><TableBody>{Array.from({ length: 6 }).map((_, index) => <TableRow key={index}><TableCell colSpan={6}><Skeleton /></TableCell></TableRow>)}</TableBody></Table></TableContainer>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 620 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Rack ID</TableCell>
                <TableCell>Error type</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No breakdown status found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const errorNames = getErrorNames(log)
                  const hasError = errorNames.length > 0
                  return (
                    <TableRow key={log.id}>
                      <TableCell>{formatDateTime(log.created_at)}</TableCell>
                      <TableCell>{log.rack_id ?? '--'}</TableCell>
                      <TableCell>
                        {hasError ? (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {errorNames.map((name) => <Chip key={name} label={name} size="small" color="error" />)}
                          </Stack>
                        ) : <Typography variant="body2" color="success.main">No active error</Typography>}
                      </TableCell>
                      <TableCell><Chip label={hasError ? 'ERROR' : 'FIXED'} size="small" color={hasError ? 'error' : 'success'} /></TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Card sx={{ mt: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Breakdown history</Typography>
              <Typography variant="body2" color="text.secondary">All recorded fault and recovery reports, including repeated reports from the simulator.</Typography>
            </Box>
            <Chip label={`${breakdownLogs.filter((log) => filterRack.trim() === '' || String(log.rack_id) === filterRack.trim()).length} records`} size="small" variant="outlined" />
          </Stack>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Reported at</TableCell>
                  <TableCell>Rack ID</TableCell>
                  <TableCell>Error type</TableCell>
                  <TableCell>Status at report</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {breakdownLogs.filter((log) => filterRack.trim() === '' || String(log.rack_id) === filterRack.trim()).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No breakdown history found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : breakdownLogs
                  .filter((log) => filterRack.trim() === '' || String(log.rack_id) === filterRack.trim())
                  .map((log) => {
                    const errorNames = getErrorNames(log)
                    const hasError = errorNames.length > 0
                    return (
                      <TableRow key={`history-${log.id}`} hover>
                        <TableCell>{formatDateTime(log.created_at)}</TableCell>
                        <TableCell>{log.rack_id ?? '--'}</TableCell>
                        <TableCell>
                          {hasError ? (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              {errorNames.map((name) => <Chip key={`${log.id}-${name}`} label={name} size="small" color="error" variant="outlined" />)}
                            </Stack>
                          ) : <Typography variant="body2" color="success.main">No active error</Typography>}
                        </TableCell>
                        <TableCell><Chip label={hasError ? 'ERROR' : 'FIXED'} size="small" color={hasError ? 'error' : 'success'} /></TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  )
}
