import { useState } from 'react'
import { Box, Card, CardContent, Typography, Grid, LinearProgress, Stack, Chip, Skeleton, Divider, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { environmentAPI } from '@api/environment'
import { cabinetAPI } from '@api/cabinet'
import { formatDateTime, formatTimeShort, parseVietnamDate } from '@utils/date'


const normalizeSmokeValue = (value: any) => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'number') return value === 0 ? 0 : 1

  const normalized = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'có', 'co', 'alert', 'detected', 'on'].includes(normalized)) return 1
  if (['0', 'false', 'no', 'không', 'khong', 'ok', 'safe', 'off', 'none'].includes(normalized)) return 0
  return null
}

const EnvironmentMetric = ({ label, value, unit, min, max, suffix = '' }: any) => {
  const percentage = value == null ? 0 : ((Number(value) - min) / (max - min)) * 100
  return (
    <Box>
      <Typography variant="caption" color="textSecondary" display="block">
        {label}
      </Typography>
      <Typography variant="h6" sx={{ my: 0.5 }}>
        {value != null ? `${value} ${suffix}` : '--'}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={Math.min(100, Math.max(0, percentage))}
        sx={{ height: 6, borderRadius: 4 }}
      />
      <Typography variant="caption" color="textSecondary">
        Range: {min} - {max} {unit}
      </Typography>
    </Box>
  )
}

const RackEnvironmentCard = ({ rack, snapshot }: { rack: any; snapshot: any }) => {
  const smokeValue = normalizeSmokeValue(snapshot?.smoke_detected ?? snapshot?.smoke)

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6">{rack.rack_name || rack.rack_code || `Rack ${rack.id}`}</Typography>
            <Typography variant="caption" color="textSecondary">ID: {rack.id}</Typography>
          </Box>
          <Chip
            size="small"
            label={smokeValue === 1 ? 'SMOKE ALERT' : smokeValue === 0 ? 'SAFE' : 'NO DATA'}
            color={smokeValue === 1 ? 'error' : smokeValue === 0 ? 'success' : 'default'}
          />
        </Stack>
        <Stack spacing={1.5}>
          <EnvironmentMetric label="Temperature" value={snapshot?.temperature} unit="°C" min={-10} max={60} suffix="°C" />
          <EnvironmentMetric label="Humidity" value={snapshot?.humidity} unit="%" min={0} max={100} suffix="%" />
          <EnvironmentMetric label="Weight" value={snapshot?.weight} unit="kg" min={0} max={500} suffix="kg" />
        </Stack>
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="caption" color="textSecondary">
          Updated: {formatDateTime(snapshot?.created_at)}
        </Typography>
      </CardContent>
    </Card>
  )
}

export const Environment = () => {
  const [selectedCabinetId, setSelectedCabinetId] = useState('all')

  const racksQuery = useQuery({
    queryKey: ['environment', 'racks'],
    queryFn: async () => {
      const cabinetsResponse = await cabinetAPI.list()
      const cabinets: any[] = cabinetsResponse.data ?? []
      const rackGroups = await Promise.all(
        cabinets.map(async (cabinet) => {
          const racksResponse = await cabinetAPI.getRacks(cabinet.id)
          return { cabinet, racks: racksResponse.data ?? [] }
        })
      )
      return rackGroups
    },
    refetchInterval: 2000,
    staleTime: 1000
  })

  const historyQuery = useQuery({
    queryKey: ['environment', 'history', 24],
    queryFn: async () => {
      const resp = await environmentAPI.history(24)
      return resp.data.data
    },
    refetchInterval: 5000
  })

  const isLoading = racksQuery.isLoading || historyQuery.isLoading
  const hasTrendData = Array.isArray(historyQuery.data) && historyQuery.data.length > 0
  const latestByRack = new Map<number, any>()
  for (const item of historyQuery.data ?? []) {
    if (!latestByRack.has(item.rack_id)) latestByRack.set(item.rack_id, item)
  }
  const visibleRackGroups = (racksQuery.data ?? []).filter(({ cabinet }) =>
    selectedCabinetId === 'all' || String(cabinet.id) === selectedCabinetId
  )

  const trendData = hasTrendData
    ? [...historyQuery.data]
        .sort((a: any, b: any) => {
          const aTime = parseVietnamDate(a.created_at)?.getTime() ?? 0
          const bTime = parseVietnamDate(b.created_at)?.getTime() ?? 0
          return aTime - bTime
        })
        .map((item: any) => ({
          timestamp: item.created_at ? formatTimeShort(item.created_at) : item.timestamp,
          temperature: item.temperature,
          humidity: item.humidity,
          weight: item.weight,
          smoke: normalizeSmokeValue(item.smoke_detected ?? item.smoke)
        }))
    : []

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Environment Monitoring
      </Typography>

      {racksQuery.data?.length ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Filter by cabinet group</Typography>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 280 } }}>
            <InputLabel id="environment-cabinet-filter-label">Cabinet group</InputLabel>
            <Select
              labelId="environment-cabinet-filter-label"
              value={selectedCabinetId}
              label="Cabinet group"
              onChange={(event) => setSelectedCabinetId(event.target.value)}
            >
              <MenuItem value="all">All groups</MenuItem>
              {racksQuery.data.map(({ cabinet }) => (
                <MenuItem key={cabinet.id} value={String(cabinet.id)}>
                  {cabinet.cabinet_name || cabinet.cabinet_code || `Cabinet ${cabinet.id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      ) : null}

      {isLoading ? (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rounded" height={280} />
            </Grid>
          ))}
        </Grid>
      ) : visibleRackGroups.length ? (
        visibleRackGroups.map(({ cabinet, racks }) => (
          <Box key={cabinet.id} sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 2 }}>
              <Typography variant="h6">{cabinet.cabinet_name || cabinet.cabinet_code || `Cabinet ${cabinet.id}`}</Typography>
              <Typography variant="body2" color="textSecondary">{racks.length} racks</Typography>
            </Stack>
            <Grid container spacing={2}>
              {racks.map((rack: any) => (
                <Grid item xs={12} sm={6} md={4} key={rack.id}>
                  <RackEnvironmentCard rack={rack} snapshot={latestByRack.get(rack.id)} />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      ) : (
        <Typography color="textSecondary" sx={{ mb: 4 }}>No racks available.</Typography>
      )}

      {/* Trends */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Temperature & Humidity (24h)
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" width="100%" height={300} />
              ) : hasTrendData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" minTickGap={20} />
                    <YAxis yAxisId="left" unit="°C" />
                    <YAxis yAxisId="right" orientation="right" unit="%" />
                    <Tooltip formatter={(value: any, name: string) => [`${value}`, name]} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ff7300" name="Temperature (°C)" dot={false} strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#0088fe" name="Humidity (%)" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="textSecondary">No environment trend data available yet.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Weight & Smoke (24h)
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" width="100%" height={300} />
              ) : hasTrendData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" minTickGap={20} />
                    <YAxis unit="kg" />
                    <Tooltip formatter={(value: any, name: string) => [`${value}`, name]} />
                    <Legend />
                    <Line type="monotone" dataKey="weight" stroke="#00c49f" name="Weight (kg)" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="smoke" stroke="#ff0000" name="Smoke" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="textSecondary">No environment trend data available yet.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
