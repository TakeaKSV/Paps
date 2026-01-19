import React, { useState } from 'react';
import { FileText, List, Droplets, LogOut } from 'lucide-react';
import QuotationAI from './components/QuotationAI';
import QuotationsList from './components/QuotationsList';
import Login from './components/Login';
import { useAuth } from './context/AuthContext';

function App() {
  const [activeView, setActiveView] = useState('create');
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' }}>
        <div style={{ background: 'white', padding: '24px 32px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(15,23,42,0.1)', fontWeight: '600', color: '#0f172a' }}>
          Verificando sesión...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' }}>
      <nav style={{
        background: 'white',
        borderBottom: '2px solid #0ea5e9',
        padding: '16px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }}>
          <Droplets size={32} style={{ color: '#0ea5e9' }} />
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#0369a1',
              margin: 0
            }}>
              Cotizador IA - {user.companyName}
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>{user.companyAddress}</p>
          </div>

          <button
            onClick={() => setActiveView('create')}
            style={{
              padding: '10px 20px',
              background: activeView === 'create' ? 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)' : 'white',
              color: activeView === 'create' ? 'white' : '#0ea5e9',
              border: '2px solid #0ea5e9',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              transition: 'all 0.3s'
            }}
          >
            <FileText size={18} />
            Nueva Cotización
          </button>
          <button
            onClick={() => setActiveView('list')}
            style={{
              padding: '10px 20px',
              background: activeView === 'list' ? 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)' : 'white',
              color: activeView === 'list' ? 'white' : '#0ea5e9',
              border: '2px solid #0ea5e9',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              transition: 'all 0.3s'
            }}
          >
            <List size={18} />
            Mis Cotizaciones
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>{user.signatureName}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{user.signatureTitle || 'Ejecutivo de ventas'}</div>
              <div style={{ fontSize: '12px', color: '#0ea5e9', fontWeight: '600' }}>{user.rfc}</div>
            </div>
            <button
              onClick={logout}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: 'none',
                background: '#fee2e2',
                color: '#b91c1c',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '600'
              }}
            >
              <LogOut size={16} />
              Salir
            </button>
          </div>
        </div>
      </nav>

      <div style={{ padding: '20px' }}>
        {activeView === 'create' ? (
          <QuotationAI onQuotationSaved={() => setActiveView('list')} />
        ) : (
          <QuotationsList />
        )}
      </div>
    </div>
  );
}

export default App;
