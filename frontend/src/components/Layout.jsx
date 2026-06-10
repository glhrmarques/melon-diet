import { Outlet } from 'react-router-dom'

function Layout() {
  return (
    <>
      <header style={styles.header}>
        <span style={styles.logo}>NUTRI</span>
      </header>
      <Outlet />
    </>
  )
}

const styles = {
  header: {
    height: 72,
    display: 'flex',
    alignItems: 'center',
    padding: '0 240px',
    background: '#fff',
    borderBottom: '1px solid #eee',
  },
  logo: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#111',
  },
}

export default Layout
