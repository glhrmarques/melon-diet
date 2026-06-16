import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha: password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao fazer login')
        return
      }

      localStorage.setItem('user', JSON.stringify(data))
      navigate('/')
    } catch (err) {
      setError('Servidor indisponível. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.formsWrapper}>
          <div style={styles.header}>
            <div style={styles.logo}>🍈</div>
            <h1 style={styles.title}>Acesso nutricionista</h1>
            <p style={styles.subtitle}>
              Dieta fácil de seguir e seja o orgulho do nutri.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="email">
                E-mail de acesso
              </label>
              <input
                style={styles.input}
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="password">
                Senha
              </label>
              <input
                style={styles.input}
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <div style={styles.actions}>
              <button type="submit" style={styles.submitBtn} disabled={loading}>
                {loading ? 'Entrando...' : 'Continuar'}
              </button>
              <a href="#" style={styles.forgotLink}>
                Esqueceu a senha?
              </a>
            </div>
          </form>
        </div>

        <button
          type="button"
          style={styles.patientBtn}
          onClick={() => {}}
        >
          Acessar como paciente
        </button>
      </div>

      <div style={styles.rightPanel} />
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
  },
  leftPanel: {
    width: 493,
    minWidth: 493,
    display: 'flex',
    flexDirection: 'column',
    gap: 40,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 64,
    background: '#fff',
    overflow: 'hidden',
  },
  formsWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logo: {
    width: 50,
    height: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 32,
  },
  title: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 32,
    fontWeight: 700,
    color: '#000',
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 16,
    fontWeight: 400,
    color: '#a0a0a0',
    textAlign: 'center',
    width: '100%',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    width: '100%',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    width: '100%',
  },
  label: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 12,
    fontWeight: 500,
    color: '#000',
  },
  input: {
    width: '100%',
    height: 48,
    border: '1px solid #a0a0a0',
    borderRadius: 16,
    padding: '0 16px',
    fontSize: 14,
    outline: 'none',
    fontFamily: "'Poppins', sans-serif",
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    alignItems: 'flex-start',
    width: '100%',
  },
  submitBtn: {
    width: 365,
    height: 48,
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: 16,
    fontSize: 16,
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
    cursor: 'pointer',
    textAlign: 'center',
  },
  forgotLink: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: '#000',
    textDecoration: 'underline',
    textAlign: 'center',
    width: '100%',
    cursor: 'pointer',
  },
  patientBtn: {
    width: '100%',
    height: 48,
    background: '#f6f2ef',
    color: '#000',
    border: 'none',
    borderRadius: 16,
    fontSize: 16,
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
    cursor: 'pointer',
    textAlign: 'center',
  },
  error: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 14,
    color: '#e53935',
    textAlign: 'center',
    margin: 0,
    width: '100%',
  },
  rightPanel: {
    flex: 1,
    background: '#c8ffec',
    minHeight: '100vh',
  },
}

export default Login
