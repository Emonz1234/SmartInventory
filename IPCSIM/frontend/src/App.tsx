import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@components/Layout/Layout'
import { Dashboard, Inventory, Cabinets, CabinetDetail, Transactions, Breakdown, Environment, Logs, Operation, System, Maintenance } from '@pages/index'

const queryClient = new QueryClient()

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0077a3' },
    secondary: { main: '#ff4081' },
    background: { default: '#f1f8f7', paper: '#ffffff' }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minHeight: 64,
          borderRadius: 8,
          paddingLeft: 20,
          paddingRight: 20
        }
      }
    }
  }
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/cabinets" element={<Cabinets />} />
              <Route path="/cabinets/:id" element={<CabinetDetail />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/breakdown" element={<Breakdown />} />
              <Route path="/environment" element={<Environment />} />
              <Route path="/operation" element={<Operation />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/system" element={<System />} />
              <Route path="/maintenance" element={<Maintenance />} />
            </Routes>
          </Layout>
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
