import { createRoot } from 'react-dom/client'
import './lib/moduleRecovery'
import App from './App'
import { ModuleErrorBoundary } from './components/ModuleErrorBoundary'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Failed to find root element')
createRoot(root).render(
  <ModuleErrorBoundary><App /></ModuleErrorBoundary>
)
