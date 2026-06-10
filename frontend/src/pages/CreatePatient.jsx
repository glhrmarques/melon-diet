import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function CreatePatient() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    age: '',
    cellphone: '',
    email: '',
    weight: '0',
  })

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const res = await fetch('/addPatient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      navigate('/')
    } else {
      alert('Falha ao cadastrar paciente')
    }
  }

  return (
    <div style={styles.content}>
      <button style={styles.backBtn} onClick={() => navigate(-1)}>
        &#8592;
      </button>
      <h1 style={styles.title}>Adicionar paciente</h1>

      <form onSubmit={handleSubmit}>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="name">Nome do paciente</label>
            <input
              style={styles.input}
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="age">Idade</label>
            <input
              style={styles.input}
              type="number"
              id="age"
              name="age"
              min="0"
              value={form.age}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="cellphone">Celular</label>
            <input
              style={styles.input}
              type="tel"
              id="cellphone"
              name="cellphone"
              value={form.cellphone}
              onChange={handleChange}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="email">E-mail</label>
            <input
              style={styles.input}
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div style={styles.formFooter}>
          <button type="submit" style={styles.submitBtn}>
            Confirmar cadastro
          </button>
        </div>
      </form>
    </div>
  )
}

const styles = {
  content: {
    padding: '2rem 240px',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: '1px solid #ddd',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1.1rem',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#111',
    marginBottom: '2rem',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: '#111',
    marginBottom: '0.5rem',
  },
  input: {
    width: '100%',
    height: 48,
    padding: '0 1rem',
    border: '1px solid #ddd',
    borderRadius: 16,
    fontSize: '0.95rem',
    outline: 'none',
  },
  formFooter: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '1.5rem 240px',
    background: '#fff',
    borderTop: '1px solid #eee',
  },
  submitBtn: {
    padding: '0.85rem 2rem',
    background: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: 16,
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
}

export default CreatePatient
