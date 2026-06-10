import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import CreatePatient from './pages/CreatePatient'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/create-patient" element={<CreatePatient />} />
      </Route>
    </Routes>
  )
}

export default App
