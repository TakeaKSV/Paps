import React, { useState, useEffect } from 'react';
import { Trash2, Download, ChevronDown, ChevronUp, Calendar, DollarSign, User, Droplets, Edit2, X, Check, Save, Plus } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { registerBankGothic } from '../utils/pdfFonts';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const QuotationsList = () => {
  const { user, logout } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Estados para edición
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleUnauthorized = async () => {
    alert('Tu sesión expiró. Inicia nuevamente.');
    await logout();
  };

  const getOwnerInfo = (quotation) => {
    if (quotation?.owner_info) return quotation.owner_info;
    if (!user) return null;
    return {
      name: user.name,
      email: user.email,
      phone: user.phone,
      companyName: user.companyName,
      companyAddress: user.companyAddress,
      rfc: user.rfc,
      signatureName: user.signatureName,
      signatureTitle: user.signatureTitle
    };
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const response = await fetch(`${API_URL}/quotations?limit=100`, { credentials: 'include' });
      if (response.status === 401 || response.status === 403) {
        await handleUnauthorized();
        return;
      }
      const data = await response.json();
      setQuotations(data.quotations || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuotation = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta cotización?')) return;
    
    try {
      const response = await fetch(`${API_URL}/quotations/${id}`, { method: 'DELETE', credentials: 'include' });
      if (response.status === 401 || response.status === 403) {
        await handleUnauthorized();
        return;
      }
      fetchQuotations();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/quotations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      if (response.status === 401 || response.status === 403) {
        await handleUnauthorized();
        return;
      }
      fetchQuotations();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Iniciar edición
  const startEdit = (quotation) => {
    setEditingId(quotation._id);
    setEditingData({
      client_name: quotation.client_name,
      client_email: quotation.client_email || '',
      client_phone: quotation.client_phone || '',
      client_address: quotation.client_address || '',
      items: [...quotation.items],
      includeIVA: quotation.includeIVA !== false,
      includeManoObra: quotation.includeManoObra || false,
      manoObra: quotation.manoObra || 0,
      notes: quotation.notes || ''
    });
    setExpandedId(quotation._id);
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  // Guardar edición
  const saveEdit = async () => {
    if (!editingData || !editingId) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/quotations/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editingData)
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          await handleUnauthorized();
          return;
        }
        throw new Error('Error al actualizar cotización');
      }

      await fetchQuotations();
      setEditingId(null);
      setEditingData(null);
      alert('✅ Cotización actualizada exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al actualizar la cotización');
    } finally {
      setIsSaving(false);
    }
  };

  // Actualizar item en edición
  const updateEditingItem = (index, field, value) => {
    const newItems = [...editingData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'quantity' || field === 'unit_price' ? parseFloat(value) || 0 : value
    };
    
    // Recalcular subtotal del item
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].subtotal = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setEditingData({
      ...editingData,
      items: newItems
    });
  };

  // Eliminar item en edición
  const deleteEditingItem = (index) => {
    const newItems = editingData.items.filter((_, i) => i !== index);
    setEditingData({
      ...editingData,
      items: newItems
    });
  };

  // Agregar producto en blanco
  const addNewProduct = () => {
    const newProduct = {
      description: '',
      quantity: 1,
      unit: 'pieza',
      unit_price: 0,
      subtotal: 0
    };
    
    setEditingData({
      ...editingData,
      items: [...editingData.items, newProduct]
    });
  };

  const downloadQuotation = (quotation) => {
  const numeroALetras = (numero) => {
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    const convertirGrupo = (n) => {
      if (n === 0) return '';
      if (n < 10) return unidades[n];
      if (n >= 10 && n < 20) return especiales[n - 10];
      if (n >= 20 && n < 100) {
        const dec = Math.floor(n / 10);
        const uni = n % 10;
        if (n === 20) return 'VEINTE';
        if (uni === 0) return decenas[dec];
        return decenas[dec] + ' Y ' + unidades[uni];
      }
      if (n >= 100 && n < 1000) {
        const cen = Math.floor(n / 100);
        const resto = n % 100;
        return (n === 100 ? 'CIEN' : centenas[cen]) + (resto > 0 ? ' ' + convertirGrupo(resto) : '');
      }
      return '';
    };

    const partes = numero.toFixed(2).split('.');
    let entero = parseInt(partes[0]);
    const centavos = partes[1];

    if (entero === 0) return `CERO PESOS ${centavos}/100 M.N.`;

    let resultado = '';
    
    if (entero >= 1000000) {
      const millones = Math.floor(entero / 1000000);
      resultado += (millones === 1 ? 'UN MILLÓN ' : convertirGrupo(millones) + ' MILLONES ');
      entero = entero % 1000000;
    }
    
    if (entero >= 1000) {
      const miles = Math.floor(entero / 1000);
      resultado += (miles === 1 ? 'MIL ' : convertirGrupo(miles) + ' MIL ');
      entero = entero % 1000;
    }
    
    if (entero > 0) {
      resultado += convertirGrupo(entero) + ' ';
    }

    return resultado.trim() + ` PESOS ${centavos}/100 M.N.`;
  };

  const totalEnLetras = numeroALetras(quotation.total);
  const fechaActual = quotation.date ? quotation.date.toUpperCase() : new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
  const quotationNumber = quotation.quotation_number || 'BORRADOR';
  const ownerInfo = getOwnerInfo(quotation) || {};
  const companyName = (ownerInfo.companyName || 'Sistemas de Riego para Jardines').toUpperCase();
  const companyAddress = (ownerInfo.companyAddress || 'PROPORCIONA TU DIRECCIÓN FISCAL').toUpperCase();
  const ownerRfc = `RFC ${ (ownerInfo.rfc || 'RFC DESCONOCIDO').toUpperCase() }`;
  const signatureName = (ownerInfo.signatureName || ownerInfo.name || 'Representante Autorizado').toUpperCase();
  const signatureTitle = ownerInfo.signatureTitle ? ownerInfo.signatureTitle.toUpperCase() : '';

  // Cargar logo primero
  const logoImg = new Image();
  logoImg.crossOrigin = 'anonymous';
  logoImg.src = '/logo/Imagen1.jpg';
  
  logoImg.onload = () => {
    // Crear documento PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    registerBankGothic(doc);

    let yPos = 20;

    // AGREGAR LOGO
    try {
      doc.addImage(logoImg, 'JPEG', 15, 15, 25, 25);
    } catch (error) {
      console.warn('No se pudo agregar el logo:', error);
    }

    // HEADER
    doc.setFontSize(13);
    doc.setFont('BankGothicLtBT', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(companyName, 105, yPos, { align: 'center' });
    
    // DIRECCIÓN Y RFC - Fuente más estrecha
    yPos += 7;
    doc.setFontSize(8.5);
    doc.setFont('BankGothicLtBT', 'normal');
    doc.setTextColor(132, 150, 176);
    doc.text(companyAddress, 105, yPos, { align: 'center' });
    
    yPos += 4;
    doc.text(ownerRfc, 105, yPos, { align: 'center' });
    
    // FECHA
    yPos += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(fechaActual, 200, yPos, { align: 'right' });
    
    // CLIENTE
    yPos += 8;
    doc.setFontSize(10);
    doc.text((quotation.client_name || 'A QUIEN CORRESPONDA').toUpperCase(), 15, yPos);
    
    yPos += 5;
    doc.text('P R E S E N T E.', 15, yPos);
    
    // INTRO
    yPos += 8;
    doc.setFontSize(9.5);
    const introText = `Por medio de la presente me permito dirigir la siguiente cotización para la instalación del sistema de riego${quotation.client_address ? ' en ' + quotation.client_address : ''}. Queda como sigue:`;
    const splitIntro = doc.splitTextToSize(introText, 180);
    doc.text(splitIntro, 15, yPos);
    
    yPos += (splitIntro.length * 5) + 5;

    // TABLA DE PRODUCTOS
    const tableData = quotation.items.map((item, index) => [
      (index + 1).toString(),
      item.quantity.toString(),
      item.description,
      item.unit,
      '$' + item.unit_price.toLocaleString('es-MX', { minimumFractionDigits: 2 }),
      '$' + item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })
    ]);

    // Agregar mano de obra si aplica
    if (quotation.includeManoObra) {
      tableData.push([
        (quotation.items.length + 1).toString(),
        '1',
        'Instalación incluye: una cuadrilla de personal, apertura de cepas, instalación de tuberías, instalación de válvulas, conexiones eléctricas y aspersores. (incluye gastos indirectos)',
        'servicio',
        'Instalación',
        '$' + (quotation.manoObra || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })
      ]);
    }

    autoTable(doc, {
      startY: yPos,
      head: [['N°', 'CANTIDAD', 'CONCEPTO', 'UNIDAD', 'PRECIO UNITARIO', 'TOTAL']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [231, 230, 230],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [0, 0, 0]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'left', cellWidth: 73 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 28 },
        5: { halign: 'right', cellWidth: 30 }
      },
      didParseCell: function(data) {
        // Colorear fila de mano de obra
        if (quotation.includeManoObra && data.row.index === tableData.length - 1) {
          data.cell.styles.fillColor = [255, 249, 230];
        }
      }
    });

    yPos = doc.lastAutoTable.finalY + 3;

    // SUBTOTALES
    const subtotalY = yPos;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    
    // Subtotal
    doc.text('Subtotal', 140, subtotalY, { align: 'right' });
    doc.text('$' + (quotation.subtotalWithManoObra || quotation.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 }), 195, subtotalY, { align: 'right' });
    
    // IVA
    if (quotation.includeIVA !== false) {
      doc.text('IVA.', 140, subtotalY + 5, { align: 'right' });
      doc.text('$' + quotation.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 }), 195, subtotalY + 5, { align: 'right' });
    }
    
    // Total
    const totalY = quotation.includeIVA !== false ? subtotalY + 10 : subtotalY + 5;
    doc.setFillColor(231, 230, 230);
    doc.rect(125, totalY - 4, 70, 7, 'F');
    doc.text('total', 140, totalY, { align: 'right' });
    doc.text('$' + quotation.total.toLocaleString('es-MX', { minimumFractionDigits: 2 }), 195, totalY, { align: 'right' });

    yPos = totalY + 8;

    // TOTAL EN LETRAS
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    const totalLetrasText = `SON: ${totalEnLetras}`;
    const splitTotal = doc.splitTextToSize(totalLetrasText, 180);
    doc.text(splitTotal, 15, yPos);

    // FIRMA
    const firmaY = yPos + 25;
    doc.setLineWidth(0.5);
    doc.line(65, firmaY, 150, firmaY);
    doc.setFontSize(10);
    doc.text(signatureName, 107.5, firmaY + 5, { align: 'center' });
    if (signatureTitle) {
      doc.setFontSize(9);
      doc.text(signatureTitle, 107.5, firmaY + 10, { align: 'center' });
    }

    // GUARDAR PDF
    doc.save(`Cotizacion-${quotationNumber}.pdf`);
  };

  // Si la imagen no carga, generar PDF sin logo
  logoImg.onerror = () => {
    console.warn('No se pudo cargar el logo, generando PDF sin logo');
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    registerBankGothic(doc);

    let yPos = 20;

    // HEADER (sin logo)
    doc.setFontSize(11);
    doc.setFont('BankGothicLtBT', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(companyName, 105, yPos, { align: 'center' });
    
    yPos += 6;
    doc.setFontSize(9);
    doc.setTextColor(132, 150, 176);
    doc.text(companyAddress, 105, yPos, { align: 'center' });
    
    yPos += 4;
    doc.text(ownerRfc, 105, yPos, { align: 'center' });
    
    // FECHA
    yPos += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(fechaActual, 200, yPos, { align: 'right' });
    
    // CLIENTE
    yPos += 8;
    doc.setFontSize(10);
    doc.text((quotation.client_name || 'A QUIEN CORRESPONDA').toUpperCase(), 15, yPos);
    
    yPos += 5;
    doc.text('P R E S E N T E.', 15, yPos);
    
    // INTRO
    yPos += 8;
    doc.setFontSize(9.5);
    const introText = `Por medio de la presente me permito dirigir la siguiente cotización para la instalación del sistema de riego${quotation.client_address ? ' en ' + quotation.client_address : ''}. Queda como sigue:`;
    const splitIntro = doc.splitTextToSize(introText, 180);
    doc.text(splitIntro, 15, yPos);
    
    yPos += (splitIntro.length * 5) + 5;

    // TABLA DE PRODUCTOS
    const tableData = quotation.items.map((item, index) => [
      (index + 1).toString(),
      item.quantity.toString(),
      item.description,
      item.unit,
      '$' + item.unit_price.toLocaleString('es-MX', { minimumFractionDigits: 2 }),
      '$' + item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })
    ]);

    if (quotation.includeManoObra) {
      tableData.push([
        (quotation.items.length + 1).toString(),
        '1',
        'Instalación incluye: una cuadrilla de personal, apertura de cepas, instalación de tuberías, instalación de válvulas, conexiones eléctricas y aspersores. (incluye gastos indirectos)',
        'servicio',
        'Instalación',
        '$' + (quotation.manoObra || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })
      ]);
    }

    autoTable(doc, {
      startY: yPos,
      head: [['N°', 'CANTIDAD', 'CONCEPTO', 'UNIDAD', 'PRECIO UNITARIO', 'TOTAL']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [231, 230, 230],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [0, 0, 0]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'left', cellWidth: 73 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 28 },
        5: { halign: 'right', cellWidth: 30 }
      },
      didParseCell: function(data) {
        if (quotation.includeManoObra && data.row.index === tableData.length - 1) {
          data.cell.styles.fillColor = [255, 249, 230];
        }
      }
    });

    yPos = doc.lastAutoTable.finalY + 3;

    const subtotalY = yPos;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    
    doc.text('Subtotal', 140, subtotalY, { align: 'right' });
    doc.text('$' + (quotation.subtotalWithManoObra || quotation.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 }), 195, subtotalY, { align: 'right' });
    
    if (quotation.includeIVA !== false) {
      doc.text('IVA.', 140, subtotalY + 5, { align: 'right' });
      doc.text('$' + quotation.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 }), 195, subtotalY + 5, { align: 'right' });
    }
    
    const totalY = quotation.includeIVA !== false ? subtotalY + 10 : subtotalY + 5;
    doc.setFillColor(231, 230, 230);
    doc.rect(125, totalY - 4, 70, 7, 'F');
    doc.text('total', 140, totalY, { align: 'right' });
    doc.text('$' + quotation.total.toLocaleString('es-MX', { minimumFractionDigits: 2 }), 195, totalY, { align: 'right' });

    yPos = totalY + 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    const totalLetrasText = `SON: ${totalEnLetras}`;
    const splitTotal = doc.splitTextToSize(totalLetrasText, 180);
    doc.text(splitTotal, 15, yPos);

    const firmaY = yPos + 25;
    doc.setLineWidth(0.5);
    doc.line(65, firmaY, 150, firmaY);
    doc.setFontSize(10);
    doc.text(signatureName, 107.5, firmaY + 5, { align: 'center' });
    if (signatureTitle) {
      doc.setFontSize(9);
      doc.text(signatureTitle, 107.5, firmaY + 10, { align: 'center' });
    }

    doc.save(`Cotizacion-${quotationNumber}.pdf`);
  };
};

  const filteredQuotations = quotations.filter(q => 
    filterStatus === 'all' || q.status === filterStatus
  );

  const statusColors = {
    pendiente: { bg: '#FEF3C7', text: '#92400E', label: 'Pendiente' },
    enviada: { bg: '#DBEAFE', text: '#1E40AF', label: 'Enviada' },
    aceptada: { bg: '#D1FAE5', text: '#065F46', label: 'Aceptada' },
    rechazada: { bg: '#FEE2E2', text: '#991B1B', label: 'Rechazada' }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ fontSize: '18px', color: '#64748b' }}>Cargando cotizaciones...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)', padding: '32px', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <Droplets size={48} />
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>Cotizaciones Guardadas</h1>
              <p style={{ margin: '8px 0 0 0', opacity: 0.95 }}>Gestiona tus cotizaciones de sistemas de riego</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Total Cotizaciones</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{filteredQuotations.length}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => setFilterStatus('all')} style={{ padding: '10px 20px', border: filterStatus === 'all' ? '2px solid #0ea5e9' : '2px solid #e2e8f0', borderRadius: '8px', background: filterStatus === 'all' ? '#eff6ff' : 'white', color: filterStatus === 'all' ? '#0ea5e9' : '#64748b', cursor: 'pointer', fontWeight: '600' }}>
              Todas ({quotations.length})
            </button>
            {Object.keys(statusColors).map(status => (
              <button key={status} onClick={() => setFilterStatus(status)} style={{ padding: '10px 20px', border: filterStatus === status ? '2px solid #0ea5e9' : '2px solid #e2e8f0', borderRadius: '8px', background: filterStatus === status ? '#eff6ff' : 'white', color: filterStatus === status ? '#0ea5e9' : '#64748b', cursor: 'pointer', fontWeight: '600' }}>
                {statusColors[status].label} ({quotations.filter(q => q.status === status).length})
              </button>
            ))}
          </div>

          {filteredQuotations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <Droplets size={64} style={{ margin: '0 auto 20px', opacity: 0.3 }} />
              <p style={{ fontSize: '18px' }}>No hay cotizaciones para mostrar</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {filteredQuotations.map(quotation => (
                <div key={quotation._id} style={{ border: '2px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', transition: 'all 0.2s' }}>
                  <div style={{ padding: '20px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>{quotation.quotation_number}</h3>
                        <span style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', background: statusColors[quotation.status].bg, color: statusColors[quotation.status].text }}>
                          {statusColors[quotation.status].label}
                        </span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', color: '#64748b', fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={16} />
                          <span>{quotation.client_name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={16} />
                          <span>{quotation.date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <DollarSign size={16} />
                          <span style={{ fontWeight: '700', color: '#0ea5e9', fontSize: '16px' }}>${quotation.total.toLocaleString('es-MX')}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select value={quotation.status} onChange={(e) => updateStatus(quotation._id, e.target.value)} style={{ padding: '8px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', outline: 'none' }}>
                        <option value="pendiente">Pendiente</option>
                        <option value="enviada">Enviada</option>
                        <option value="aceptada">Aceptada</option>
                        <option value="rechazada">Rechazada</option>
                      </select>
                      
                      {editingId !== quotation._id && (
                        <button onClick={() => startEdit(quotation)} style={{ padding: '10px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} title="Editar">
                          <Edit2 size={18} />
                        </button>
                      )}
                      
                      <button onClick={() => downloadQuotation(quotation)} style={{ padding: '10px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} title="Descargar PDF">
                        <Download size={18} />
                      </button>

                      <button onClick={() => setExpandedId(expandedId === quotation._id ? null : quotation._id)} style={{ padding: '10px', background: '#64748b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        {expandedId === quotation._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>

                      <button onClick={() => deleteQuotation(quotation._id)} style={{ padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {expandedId === quotation._id && (
                    <div style={{ padding: '24px', background: 'white', borderTop: '2px solid #e2e8f0' }}>
                      {editingId === quotation._id ? (
                        // MODO EDICIÓN
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0ea5e9' }}>✏️ Editando Cotización</h4>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={cancelEdit} disabled={isSaving} style={{ padding: '10px 20px', background: '#64748b', color: 'white', border: 'none', borderRadius: '8px', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                                <X size={18} />
                                Cancelar
                              </button>
                              <button onClick={saveEdit} disabled={isSaving} style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                                {isSaving ? <Save size={18} className="spin" /> : <Check size={18} />}
                                {isSaving ? 'Guardando...' : 'Guardar'}
                              </button>
                            </div>
                          </div>

                          {/* Datos del cliente */}
                          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                            <h5 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#1e293b' }}>Datos del Cliente</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Nombre</label>
                                <input type="text" value={editingData.client_name} onChange={(e) => setEditingData({...editingData, client_name: e.target.value})} style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }} />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Email</label>
                                <input type="email" value={editingData.client_email} onChange={(e) => setEditingData({...editingData, client_email: e.target.value})} style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }} />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Teléfono</label>
                                <input type="tel" value={editingData.client_phone} onChange={(e) => setEditingData({...editingData, client_phone: e.target.value})} style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }} />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Dirección</label>
                                <input type="text" value={editingData.client_address} onChange={(e) => setEditingData({...editingData, client_address: e.target.value})} style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }} />
                              </div>
                            </div>
                          </div>

                          {/* Productos CON BOTÓN AGREGAR */}
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <h5 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Productos</h5>
                              <button 
                                onClick={addNewProduct} 
                                style={{ 
                                  padding: '8px 16px', 
                                  background: '#10b981', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '6px', 
                                  cursor: 'pointer', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '6px', 
                                  fontSize: '13px', 
                                  fontWeight: '600' 
                                }}
                              >
                                <Plus size={16} />
                                Agregar Producto
                              </button>
                            </div>
                            
                            {editingData.items.map((item, idx) => (
                              <div key={idx} style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '12px', border: '2px solid #e2e8f0' }}>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Descripción</label>
                                    <input 
                                      type="text" 
                                      value={item.description} 
                                      onChange={(e) => updateEditingItem(idx, 'description', e.target.value)} 
                                      placeholder="Ej: Controlador Rain Bird 4 estaciones"
                                      style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }} 
                                    />
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Cantidad</label>
                                      <input 
                                        type="number" 
                                        value={item.quantity} 
                                        onChange={(e) => updateEditingItem(idx, 'quantity', e.target.value)} 
                                        style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }} 
                                      />
                                    </div>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Unidad</label>
                                      <select
                                        value={item.unit}
                                        onChange={(e) => updateEditingItem(idx, 'unit', e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                                      >
                                        <option value="pieza">pieza</option>
                                        <option value="metro">metro</option>
                                        <option value="servicio">servicio</option>
                                        <option value="litro">litro</option>
                                        <option value="caja">caja</option>
                                        <option value="rollo">rollo</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Precio Unit.</label>
                                      <input 
                                        type="number" 
                                        step="0.01"
                                        value={item.unit_price} 
                                        onChange={(e) => updateEditingItem(idx, 'unit_price', e.target.value)} 
                                        style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }} 
                                      />
                                    </div>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Subtotal</label>
                                      <div style={{ padding: '10px', background: '#e2e8f0', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', textAlign: 'right' }}>
                                        ${item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => deleteEditingItem(idx)} 
                                      style={{ 
                                        padding: '10px', 
                                        background: '#ef4444', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '6px', 
                                        cursor: 'pointer' 
                                      }} 
                                      title="Eliminar"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {editingData.items.length === 0 && (
                              <div style={{ 
                                padding: '40px', 
                                textAlign: 'center', 
                                background: '#f8fafc', 
                                borderRadius: '8px', 
                                border: '2px dashed #e2e8f0',
                                color: '#64748b'
                              }}>
                                <p style={{ margin: 0, fontSize: '14px' }}>
                                  No hay productos. Click en "Agregar Producto" para añadir uno.
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Notas */}
                          <div style={{ marginTop: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Notas</label>
                            <textarea value={editingData.notes} onChange={(e) => setEditingData({...editingData, notes: e.target.value})} rows={3} style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', resize: 'vertical' }} />
                          </div>
                        </div>
                      ) : (
                        // MODO VISTA
                        <div>
                          <h4 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px', color: '#0ea5e9' }}>Productos:</h4>
                          
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                              <tr style={{ background: '#f1f5f9' }}>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Descripción</th>
                                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', width: '80px' }}>Cant.</th>
                                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', width: '80px' }}>Unidad</th>
                                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e2e8f0', width: '120px' }}>P. Unit.</th>
                                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e2e8f0', width: '120px' }}>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {quotation.items.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '12px' }}>{item.description}</td>
                                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>{item.quantity}</td>
                                  <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>{item.unit}</td>
                                  <td style={{ padding: '12px', textAlign: 'right' }}>${item.unit_price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#0ea5e9' }}>${item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {quotation.notes && (
                            <div style={{ marginTop: '20px', padding: '16px', background: '#FFF9E6', borderLeft: '4px solid #F4A100', borderRadius: '8px' }}>
                              <strong style={{ display: 'block', marginBottom: '8px', color: '#92400E' }}>Notas:</strong>
                              <p style={{ margin: 0, color: '#78350F', fontSize: '13px', lineHeight: 1.6 }}>{quotation.notes}</p>
                            </div>
                          )}

                          {(quotation.client_email || quotation.client_phone || quotation.client_address) && (
                            <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                              <strong style={{ display: 'block', marginBottom: '12px', color: '#1e293b' }}>Información de Contacto:</strong>
                              <div style={{ display: 'grid', gap: '8px', fontSize: '13px', color: '#64748b' }}>
                                {quotation.client_email && <div><strong>Email:</strong> {quotation.client_email}</div>}
                                {quotation.client_phone && <div><strong>Teléfono:</strong> {quotation.client_phone}</div>}
                                {quotation.client_address && <div><strong>Dirección:</strong> {quotation.client_address}</div>}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default QuotationsList;