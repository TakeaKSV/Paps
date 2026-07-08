import React from 'react';
import {
  Droplets,
  Sprout,
  Leaf,
  Wrench,
  Sparkles,
  CheckCircle,
  Clock,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  FileText
} from 'lucide-react';

const COMPANY = {
  name: 'Jardineria Ornamental',
  tagline: 'Sistemas de riego y jardinería profesional',
  phone: '(618) 123-4567',
  email: 'jardineriaornamental1@gmail.com',
  address: 'Durango, Dgo., México'
};

const services = [
  {
    icon: Droplets,
    title: 'Sistemas de riego',
    description: 'Diseño e instalación de riego por aspersión, goteo y microaspersión para residencias, comercios y áreas verdes de cualquier tamaño.'
  },
  {
    icon: Sprout,
    title: 'Jardinería y paisajismo',
    description: 'Creación y mantenimiento de jardines, instalación de pasto natural y sintético, diseño de áreas verdes y paisajismo integral.'
  },
  {
    icon: Wrench,
    title: 'Mantenimiento y reparación',
    description: 'Reparación de fugas, sustitución de aspersores y válvulas, ajuste de programadores y mantenimiento preventivo de tu sistema.'
  },
  {
    icon: Sparkles,
    title: 'Automatización inteligente',
    description: 'Programadores, sensores de lluvia y humedad, y control desde tu celular para regar solo cuando tu jardín lo necesita.'
  }
];

const benefits = [
  {
    icon: Clock,
    title: 'Cotización en minutos',
    description: 'Nuestro cotizador con inteligencia artificial genera un presupuesto detallado al instante, sin esperas ni visitas innecesarias.'
  },
  {
    icon: CheckCircle,
    title: 'Precios transparentes',
    description: 'Cada cotización desglosa materiales, accesorios y mano de obra, para que sepas exactamente qué estás pagando.'
  },
  {
    icon: ShieldCheck,
    title: 'Trabajo garantizado',
    description: 'Instalaciones con materiales de primera calidad y garantía por escrito en todos nuestros trabajos.'
  }
];

const Landing = ({ onEnter }) => {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' }}>
      {/* Barra de navegación */}
      <nav className="landing-nav" style={{
        background: 'white',
        borderBottom: '2px solid #0ea5e9',
        padding: '16px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Droplets size={32} style={{ color: '#0ea5e9' }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0369a1' }}>{COMPANY.name}</span>
          </div>
          <button
            onClick={onEnter}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            <FileText size={18} />
            Cotizador IA
          </button>
        </div>
      </nav>

      {/* Hero */}
      <header style={{ padding: '72px 24px 56px', textAlign: 'center' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'white',
            borderRadius: '999px',
            padding: '8px 18px',
            marginBottom: '24px',
            boxShadow: '0 4px 14px rgba(14,165,233,0.15)',
            color: '#0369a1',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            <Leaf size={16} style={{ color: '#16a34a' }} />
            Riego, jardinería y todo lo relacionado
          </div>

          <h1 className="landing-title" style={{
            fontSize: '44px',
            lineHeight: 1.15,
            margin: '0 0 20px',
            color: '#0f172a',
            fontWeight: '800'
          }}>
            Tu jardín siempre verde,{' '}
            <span style={{ color: '#0ea5e9' }}>sin desperdiciar una gota</span>
          </h1>

          <p style={{ fontSize: '18px', color: '#475569', margin: '0 0 32px', lineHeight: 1.6 }}>
            Instalamos sistemas de riego automatizados y creamos espacios verdes a tu medida.
            Obtén tu cotización al instante con nuestro asistente de inteligencia artificial.
          </p>

          <div className="landing-cta" style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={onEnter}
              style={{
                padding: '16px 28px',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontWeight: '700',
                fontSize: '16px',
                boxShadow: '0 10px 30px rgba(14,165,233,0.35)'
              }}
            >
              <Sparkles size={20} />
              Cotizar con IA
              <ArrowRight size={20} />
            </button>
            <a
              href={`tel:${COMPANY.phone.replace(/[^\d+]/g, '')}`}
              style={{
                padding: '16px 28px',
                background: 'white',
                color: '#0ea5e9',
                border: '2px solid #0ea5e9',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontWeight: '700',
                fontSize: '16px',
                textDecoration: 'none'
              }}
            >
              <Phone size={20} />
              {COMPANY.phone}
            </a>
          </div>
        </div>
      </header>

      {/* Servicios */}
      <section style={{ padding: '32px 24px 56px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '30px', color: '#0f172a', margin: '0 0 8px' }}>
            Nuestros servicios
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', margin: '0 0 36px', fontSize: '16px' }}>
            Soluciones completas para tus áreas verdes
          </p>

          <div className="landing-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px'
          }}>
            {services.map(({ icon: Icon, title, description }) => (
              <div key={title} style={{
                background: 'white',
                borderRadius: '16px',
                padding: '28px 24px',
                boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                border: '1px solid #e0f2fe'
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: '#e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0ea5e9',
                  marginBottom: '16px'
                }}>
                  <Icon size={26} />
                </div>
                <h3 style={{ fontSize: '18px', margin: '0 0 10px', color: '#0f172a' }}>{title}</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios / Cotizador IA */}
      <section style={{ padding: '56px 24px', background: 'white' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '30px', color: '#0f172a', margin: '0 0 8px' }}>
            ¿Por qué cotizar con nosotros?
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', margin: '0 0 36px', fontSize: '16px' }}>
            Tecnología de inteligencia artificial al servicio de tu jardín
          </p>

          <div className="landing-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px'
          }}>
            {benefits.map(({ icon: Icon, title, description }) => (
              <div key={title} style={{ textAlign: 'center', padding: '12px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  margin: '0 auto 16px'
                }}>
                  <Icon size={28} />
                </div>
                <h3 style={{ fontSize: '18px', margin: '0 0 10px', color: '#0f172a' }}>{title}</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section style={{ padding: '64px 24px', textAlign: 'center' }}>
        <div style={{
          maxWidth: '760px',
          margin: '0 auto',
          background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
          borderRadius: '20px',
          padding: '48px 32px',
          color: 'white',
          boxShadow: '0 16px 45px rgba(14,165,233,0.35)'
        }}>
          <h2 style={{ fontSize: '28px', margin: '0 0 12px', color: 'white' }}>
            ¿Listo para transformar tu jardín?
          </h2>
          <p style={{ margin: '0 0 28px', fontSize: '16px', opacity: 0.95 }}>
            Genera tu cotización personalizada en minutos con nuestro asistente inteligente.
          </p>
          <button
            onClick={onEnter}
            style={{
              padding: '16px 32px',
              background: 'white',
              color: '#0369a1',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '700',
              fontSize: '16px'
            }}
          >
            <Sparkles size={20} />
            Comenzar cotización
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Pie de página */}
      <footer style={{ background: '#0f172a', color: '#cbd5e1', padding: '40px 24px' }}>
        <div className="landing-footer" style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Droplets size={26} style={{ color: '#38bdf8' }} />
            <div>
              <div style={{ fontWeight: '700', color: 'white' }}>{COMPANY.name}</div>
              <div style={{ fontSize: '13px' }}>{COMPANY.tagline}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={16} style={{ color: '#38bdf8' }} />
              {COMPANY.phone}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} style={{ color: '#38bdf8' }} />
              {COMPANY.email}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} style={{ color: '#38bdf8' }} />
              {COMPANY.address}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '13px', color: '#64748b' }}>
          © {new Date().getFullYear()} {COMPANY.name}. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
