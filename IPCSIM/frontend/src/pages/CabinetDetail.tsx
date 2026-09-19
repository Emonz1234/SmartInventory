import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { cabinetAPI } from '@api/cabinet'
import { systemAPI } from '@api/system'
import { Box, Typography, Grid, Card, CardContent, Stack, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Divider, Skeleton } from '@mui/material'
import { PlayArrow, Pause, Air, ArrowBack, Storage, Refresh, CheckCircle, Timeline } from '@mui/icons-material'
import { useState } from 'react'
import { OperationModal } from '@components/OperationModal'
import { formatDateTime, parseVietnamDate } from '@utils/date'

export const CabinetDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [currentOperation, setCurrentOperation] = useState<'open' | 'close' | 'ventilate' | null>(null)
  const [currentRackId, setCurrentRackId] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'open' | 'close' | null>(null)
  const [confirmRackId, setConfirmRackId] = useState<number | null>(null)

  const q = useQuery({
    queryKey: ['cabinet', id, 'racks'],
    queryFn: async () => {
      const resp = await cabinetAPI.getRacks(Number(id))
      return resp.data
    }
  })

  const cabinetQuery = useQuery({
    queryKey: ['cabinets', 'list'],
    queryFn: async () => {
      const resp = await cabinetAPI.list()
      return resp.data
    },
    refetchInterval: 2000
  })

  const racks: any[] = q.data ?? []
  const cabinet = (cabinetQuery.data ?? []).find((item: any) => String(item.id) === String(id))
  const isCabinetActive = String(cabinet?.status ?? '').toLowerCase() === 'active'

  const [breakdownError, setBreakdownError] = useState<string | null>(null)
  const [breakdownRackId, setBreakdownRackId] = useState<number | null>(null)

  const openMut: any = useMutation({
    mutationFn: async (rackId: number) => cabinetAPI.openRack(rackId),
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Failed to open rack due to an active breakdown.'
      setBreakdownError(message)
    }
  })

  const closeMut: any = useMutation({
    mutationFn: async (rackId: number) => cabinetAPI.closeRack(rackId),
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Failed to close rack due to an active breakdown.'
      setBreakdownError(message)
    }
  })

  const ventilateMut: any = useMutation({ mutationFn: async (cabinetId: number) => cabinetAPI.ventilateCabinet(cabinetId) })

  const clearBreakdownMut: any = useMutation({
    mutationFn: async (rackId: number) => cabinetAPI.clearRackBreakdown(rackId),
    onSuccess: () => {
      setBreakdownError(null)
      setBreakdownRackId(null)
      q.refetch()
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Failed to clear breakdown flag.'
      setBreakdownError(message)
    }
  })

  const checkBreakdown = async (rackId: number) => {
    try {
      const resp = await systemAPI.getBreakdownStatus(rackId)
      const data = resp.data
      const active = data?.active ?? false
      const reasons = []
      if (data?.is_obstructed) reasons.push('Obstructed')
      if (data?.is_skewed) reasons.push('Skewed')
      if (data?.is_overload_motor) reasons.push('Overload')
      return {
        active,
        message: reasons.length > 0 ? reasons.join(', ') : 'Breakdown detected'
      }
    } catch (err) {
      console.error('Failed to fetch breakdown status', err)
      return { active: false, message: '' }
    }
  }

  const handleOpen = async (rackId: number) => {
    if (!isCabinetActive) return
    setBreakdownError(null)
    setBreakdownRackId(null)
    const { active, message } = await checkBreakdown(rackId)
    if (active) {
      setBreakdownRackId(rackId)
      setBreakdownError(`Rack ${rackId} has an active breakdown (${message}). Please clear the issue before opening.`)
      return
    }
    setConfirmAction('open')
    setConfirmRackId(rackId)
    setConfirmOpen(true)
  }

  const handleClose = async (rackId: number) => {
    if (!isCabinetActive) return
    setBreakdownError(null)
    setBreakdownRackId(null)
    const { active, message } = await checkBreakdown(rackId)
    if (active) {
      setBreakdownRackId(rackId)
      setBreakdownError(`Rack ${rackId} has an active breakdown (${message}). Please clear the issue before closing.`)
      return
    }
    setConfirmAction('close')
    setConfirmRackId(rackId)
    setConfirmOpen(true)
  }

  const executeRackAction = async () => {
    if (!isCabinetActive || !confirmRackId || !confirmAction) return
    setActionLoading(confirmRackId)
    setCurrentRackId(confirmRackId)
    setCurrentOperation(confirmAction)
    setModalOpen(true)
    setConfirmOpen(false)

    try {
      if (confirmAction === 'open') {
        await openMut.mutateAsync(confirmRackId)
      } else {
        await closeMut.mutateAsync(confirmRackId)
      }
      q.refetch()
    } catch (error) {
      setModalOpen(false)
    } finally {
      setActionLoading(null)
      setConfirmAction(null)
      setConfirmRackId(null)
    }
  }

  const isRackOpened = (rack: any) => rack.status?.toLowerCase().includes('open')
  const isRackClosed = (rack: any) => rack.status?.toLowerCase().includes('closed')

  const handleVentilate = async () => {
    if (!id || !isCabinetActive) return
    setActionLoading(-1)
    setCurrentRackId(null)
    setCurrentOperation('ventilate')
    setModalOpen(true)
    try {
      await ventilateMut.mutateAsync(Number(id))
      // Modal will close automatically after success
      q.refetch()
    } finally {
      setActionLoading(null)
    }
  }

  const latestRackUpdated = () => {
    const lastUpdated = racks
      .map((rack) => rack.updated_at || rack.last_updated)
      .filter(Boolean)
      .sort((a, b) => {
        const aTime = parseVietnamDate(a)?.getTime() ?? 0
        const bTime = parseVietnamDate(b)?.getTime() ?? 0
        return aTime - bTime
      })
      .pop()

    return formatDateTime(lastUpdated)
  }

  const openRackCount = racks.filter((rack) => isRackOpened(rack)).length
  const movingRackCount = racks.filter((rack) => ['opening', 'closing', 'moving', 'ventilating'].includes(String(rack.status ?? '').toLowerCase())).length
  const closedRackCount = racks.filter((rack) => isRackClosed(rack)).length
  const getRackStatusColor = (status: string) => {
    const normalized = status.toLowerCase()
    if (normalized.includes('open')) return 'success'
    if (normalized.includes('moving') || normalized.includes('opening') || normalized.includes('closing') || normalized.includes('ventilating')) return 'warning'
    if (normalized.includes('closed')) return 'info'
    return 'default'
  }

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2, px: 0 }}>Back to cabinets</Button>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', letterSpacing: '-0.02em' }}>Cabinet {id}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>Rack group control and real-time movement status.</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={cabinetQuery.isLoading ? 'Checking status...' : isCabinetActive ? 'Active' : 'Inactive'} color={isCabinetActive ? 'success' : 'default'} />
          <Button variant="contained" color="info" startIcon={<Air />} onClick={handleVentilate} disabled={actionLoading !== null || !isCabinetActive} sx={{ minHeight: 44 }}>
          {actionLoading === -1 ? 'Ventilating...' : 'Ventilate cabinet'}
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}><Card sx={{ borderTop: '3px solid', borderColor: 'primary.main' }}><CardContent><Stack direction="row" justifyContent="space-between"><Box><Typography variant="body2" color="text.secondary">Total racks</Typography><Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5 }}>{racks.length || '--'}</Typography></Box><Storage color="primary" sx={{ fontSize: 34 }} /></Stack></CardContent></Card></Grid>
        <Grid item xs={12} sm={6} md={3}><Card sx={{ borderTop: '3px solid', borderColor: 'success.main' }}><CardContent><Stack direction="row" justifyContent="space-between"><Box><Typography variant="body2" color="text.secondary">Opened</Typography><Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5 }}>{openRackCount}</Typography></Box><CheckCircle color="success" sx={{ fontSize: 34 }} /></Stack></CardContent></Card></Grid>
        <Grid item xs={12} sm={6} md={3}><Card sx={{ borderTop: '3px solid', borderColor: 'info.main' }}><CardContent><Stack direction="row" justifyContent="space-between"><Box><Typography variant="body2" color="text.secondary">Closed</Typography><Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5 }}>{closedRackCount}</Typography></Box><Storage color="info" sx={{ fontSize: 34 }} /></Stack></CardContent></Card></Grid>
        <Grid item xs={12} sm={6} md={3}><Card sx={{ borderTop: '3px solid', borderColor: 'warning.main' }}><CardContent><Stack direction="row" justifyContent="space-between"><Box><Typography variant="body2" color="text.secondary">In motion</Typography><Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5 }}>{movingRackCount}</Typography></Box><Timeline color="warning" sx={{ fontSize: 34 }} /></Stack></CardContent></Card></Grid>
      </Grid>

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1} sx={{ mb: 2 }}>
        <Box><Typography variant="h6" sx={{ fontWeight: 'bold' }}>Rack overview</Typography><Typography variant="body2" color="text.secondary">Select an action for an individual rack.</Typography></Box>
        <Chip icon={<Refresh />} label={`Updated: ${latestRackUpdated()}`} size="small" variant="outlined" />
      </Stack>

      {breakdownError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={breakdownRackId ? (
            <Button
              size="small"
              color="inherit"
              onClick={() => clearBreakdownMut.mutate(breakdownRackId)}
              disabled={clearBreakdownMut.isLoading}
            >
              Fixed
            </Button>
          ) : null}
        >
          {breakdownError}
        </Alert>
      )}

      {!cabinetQuery.isLoading && !isCabinetActive && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Cabinet {id} is inactive. Rack operations are disabled until the simulation group is running.
        </Alert>
      )}

      {q.isLoading ? (
        <Grid container spacing={2}>{Array.from({ length: 6 }).map((_, index) => <Grid item xs={12} sm={6} md={4} lg={2} key={index}><Skeleton variant="rounded" height={250} /></Grid>)}</Grid>
      ) : q.isError ? (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => q.refetch()}>Retry</Button>}>Unable to load racks for this cabinet.</Alert>
      ) : (
      <Grid container spacing={2}>
        {racks.map((rack) => {
          const rackStatus = rack.status ?? 'Unknown'
          return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={rack.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderTop: '4px solid', borderColor: `${getRackStatusColor(rackStatus)}.main` }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                  <Box><Typography variant="h6" sx={{ fontWeight: 'bold' }}>{rack.rack_name || rack.rack_code || rack.code}</Typography><Typography variant="caption" color="text.secondary">Rack ID: {rack.id}</Typography></Box>
                  <Chip label={rackStatus} size="small" color={getRackStatusColor(rackStatus)} />
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1}>
                  <Box><Typography variant="caption" color="text.secondary">Position</Typography><Typography variant="body1" sx={{ fontWeight: 'bold' }}>{rack.position ?? '--'}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Last update</Typography><Typography variant="body2">{formatDateTime(rack.last_updated)}</Typography></Box>
                </Stack>
              </CardContent>
              <CardContent sx={{ pt: 0 }}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    size="small"
                    onClick={() => handleOpen(rack.id)}
                    disabled={!isCabinetActive || actionLoading !== null || isRackOpened(rack) || rack.status === 'Opening' || rack.status === 'Moving' || rack.status === 'Ventilating'}
                    sx={{ flex: 1, minHeight: 40 }}
                  >
                    Open
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Pause />}
                    size="small"
                    onClick={() => handleClose(rack.id)}
                    disabled={!isCabinetActive || actionLoading !== null || isRackClosed(rack) || rack.status === 'Closing' || rack.status === 'Moving' || rack.status === 'Ventilating'}
                    sx={{ flex: 1, minHeight: 40 }}
                  >
                    Close
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          )
        })}
      </Grid>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{confirmAction === 'open' ? 'Confirm Open Rack' : 'Confirm Close Rack'}</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {confirmAction === 'open' ? 'open' : 'close'} rack {confirmRackId}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={executeRackAction}
            variant="contained"
            color={confirmAction === 'open' ? 'success' : 'primary'}
            disabled={actionLoading !== null}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <OperationModal
        open={modalOpen}
        cabinetId={Number(id)}
        rackId={currentRackId}
        operation={currentOperation}
        cabinetCode={`Cabinet ${id}`}
        racks={racks}
        onClose={() => {
          setModalOpen(false)
          setCurrentOperation(null)
          setCurrentRackId(null)
        }}
      />
    </Box>
  )
}
