import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function Home() {
  const [patients, setPatients] = useState([])

  useEffect(() => {
    fetch('/allPatients')
      .then((res) => res.json())
      .then((data) => setPatients(data || []))
      .catch(() => setPatients([]))
  }, [])

  return (
    <div style={styles.content}>
      <div style={styles.titleRow}>
        <h1 style={styles.pageTitle}>Meus pacientes</h1>
        <Link to="/create-patient" style={styles.addBtn}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M5.25 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM2.25 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM18.75 7.5a.75.75 0 0 0-1.5 0v2.25H15a.75.75 0 0 0 0 1.5h2.25v2.25a.75.75 0 0 0 1.5 0v-2.25H21a.75.75 0 0 0 0-1.5h-2.25V7.5Z" />
          </svg>
        </Link>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Nome</th>
            <th style={styles.th}>Idade</th>
            <th style={styles.th}>Celular</th>
            <th style={styles.th}>E-mail</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p, i) => (
            <tr key={i} style={styles.tr}>
              <td style={styles.td}>{p.name}</td>
              <td style={styles.td}>{p.age}</td>
              <td style={styles.td}>{p.cellphone}</td>
              <td style={styles.td}>{p.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  content: {
    padding: '2rem 240px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 32,
    fontWeight: 700,
    color: '#111',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 16,
    background: '#111',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '2rem',
  },
  th: {
    textAlign: 'left',
    padding: '0.85rem 1rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: '1px solid #eee',
  },
  td: {
    textAlign: 'left',
    padding: '0.85rem 1rem',
    fontSize: '0.95rem',
    color: '#111',
    borderBottom: '1px solid #f5f5f5',
  },
  tr: {},
}

export default Home
