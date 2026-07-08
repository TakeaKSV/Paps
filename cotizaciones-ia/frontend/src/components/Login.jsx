import React, { useState } from 'react';
import { Droplets, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = ({ onBack }) => {
  const { login, error } = useAuth();
  const [form, setForm] = useState({ rfc: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLocalError(null);
    try {
      await login({
        rfc: form.rfc.trim(),
        password: form.password
      });
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: 'white', borderRadius: '18px', padding: '32px', boxShadow: '0 12px 45px rgba(14,165,233,0.25)' }}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: '#0ea5e9',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              padding: 0,
              marginBottom: '16px'
            }}
          >
            <ArrowLeft size={16} />
            Volver al inicio
          </button>
        )}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#e0f2fe', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
            <Droplets size={32} />
          </div>
          <h1 style={{ fontSize: '24px', margin: 0, color: '#0f172a' }}>Panel Seguro</h1>
          <p style={{ marginTop: '8px', color: '#475569', fontSize: '14px' }}>Ingresa tu RFC y contraseña para continuar</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>RFC</label>
            <input
              name="rfc"
              type="text"
              value={form.rfc}
              onChange={handleChange}
              placeholder=""
              style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '14px', textTransform: 'uppercase', boxSizing: 'border-box' }}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>Contraseña</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={{ width: '100%', padding: '14px 48px 14px 14px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' }}
                required
                disabled={isSubmitting}
              />
              <Lock size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          {(localError || error) && (
            <div style={{ background: '#fee2e2', borderRadius: '10px', padding: '12px', color: '#991b1b', fontSize: '13px', border: '1px solid #fecaca' }}>
              {localError || error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: isSubmitting ? '#bae6fd' : 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
              color: 'white',
              fontWeight: '700',
              fontSize: '15px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            {isSubmitting ? 'Verificando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
