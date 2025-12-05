import React, { useState } from 'react';
import QuotationAI from './components/QuotationAI';
import QuotationsList from './components/QuotationsList';
import { FileText, List, Droplets } from 'lucide-react';

function App() {
  const [activeView, setActiveView] = useState('create');

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
          <h1 style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#0369a1',
            flex: 1
          }}>
            Cotizador IA - Riego Ornamental
          </h1>
          <button
            onClick={() => setActiveView('create')}
            style={{
              padding: '10px 20px',
              background: activeView === 'create' ? 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)' : 'white',
              color: activeView === 'create' ? 'white' : '#0ea5e9',
              border: `2px solid #0ea5e9`,
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
              border: `2px solid #0ea5e9`,
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