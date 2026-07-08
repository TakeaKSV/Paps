import React, { useState, useEffect } from 'react';
import { Download, Loader2, Save, CheckCircle, Droplets, Plus, Trash2, Edit2, X, Check, Link, ArrowLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';
import { registerBankGothic } from '../utils/pdfFonts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const QuotationManual = ({ onClose, onQuotationSaved }) => {
  const { user, logout } = useAuth();

  const [currentQuotation, setCurrentQuotation] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const [includeIVA, setIncludeIVA] = useState(true);
  const [includeManoObra, setIncludeManoObra] = useState(false);
  const [manoObraType, setManoObraType] = useState('percentage');
  const [manoObraPercentage, setManoObraPercentage] = useState('0.95');
  const [manoObraCustom, setManoObraCustom] = useState('');

  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [combiningFromIndex, setCombiningFromIndex] = useState(null);

  const [quotationType, setQuotationType] = useState('instalacion_riego');

  // Formulario para agregar un producto manualmente
  const [draft, setDraft] = useState({ description: '', quantity: 1, unit: 'pieza', unit_price: '' });

  const QUOTATION_TYPES = {
    instalacion_riego: {
      label: 'Instalación de sistema de riego',
      intro: (address) => `Por medio de la presente me permito dirigir la siguiente cotización para la instalación del sistema de riego${address ? ' en ' + address : ''}. Queda como sigue:`,
      manoObraLabel: 'Instalación de sistema de riego. Incluye: cuadrilla de personal especializado, apertura y relleno de cepas, suministro e instalación de tuberías, válvulas solenoides y de control, conexiones eléctricas, aspersores y difusores, pruebas de presión, programación del controlador y puesta en marcha. (incluye herramientas, equipo, maniobras y gastos indirectos)'
    },
    venta_material: {
      label: 'Venta de material / piezas',
      intro: (address) => `Por medio de la presente me permito enviar el material solicitado${address ? ' con destino a ' + address : ''}. Queda como sigue:`,
      manoObraLabel: 'Instalación de material solicitado. Incluye: mano de obra especializada, materiales de fijación y conexión, herramientas y equipo necesario, maniobras de carga, descarga y colocación, pruebas de funcionamiento y puesta en marcha. (incluye gastos indirectos)'
    },
    compra_tierra: {
      label: 'Compra de tierra',
      intro: (address) => `Por medio de la presente me permito presentar la siguiente cotización para el suministro de tierra${address ? ' en ' + address : ''}. Queda como sigue:`,
      manoObraLabel: 'Suministro, distribución y nivelación de tierra. Incluye: carga y transporte del material, descarga y maniobras en sitio, distribución y extendido con maquinaria, nivelación y compactación según especificaciones, retiro de sobrantes y limpieza del área. (incluye combustible, operador y gastos indirectos)'
    },
    mantenimiento: {
      label: 'Mantenimiento / servicio',
      intro: (address) => `Por medio de la presente me permito dirigir la siguiente cotización para el servicio de mantenimiento${address ? ' en ' + address : ''}. Queda como sigue:`,
      manoObraLabel: 'Servicio de mantenimiento y revisión. Incluye: mano de obra de técnicos especializados, materiales y refacciones de reposición, herramientas y equipo de diagnóstico, limpieza y calibración de componentes, pruebas de presión y funcionamiento, reporte técnico de actividades realizadas. (incluye traslados y gastos indirectos)'
    },
    otro: {
      label: 'Otro (cotización general)',
      intro: (address) => `Por medio de la presente me permito presentar la siguiente cotización${address ? ' para ' + address : ''}. Queda como sigue:`,
      manoObraLabel: 'Instalación y puesta en marcha. Incluye: mano de obra especializada, materiales complementarios, herramientas y equipo requerido, maniobras de instalación, pruebas de funcionamiento y entrega. (incluye gastos indirectos)'
    }
  };

  const buildOwnerInfo = () => {
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

  const recalculateTotals = (quotation) => {
    const subtotal = quotation.items.reduce((sum, item) => sum + item.subtotal, 0);

    let manoObraAmount = 0;
    if (includeManoObra) {
      if (manoObraType === 'percentage') {
        manoObraAmount = subtotal * parseFloat(manoObraPercentage);
      } else {
        manoObraAmount = parseFloat(manoObraCustom) || 0;
      }
    }

    const subtotalWithManoObra = subtotal + manoObraAmount;
    const iva = includeIVA ? subtotalWithManoObra * 0.16 : 0;
    const total = subtotalWithManoObra + iva;

    const today = new Date();
    const validUntil = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const formatDate = (date) => {
      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    };

    return {
      ...quotation,
      date: quotation.date || formatDate(today),
      valid_until: quotation.valid_until || formatDate(validUntil),
      subtotal,
      manoObra: manoObraAmount,
      subtotalWithManoObra,
      iva,
      total,
      includeIVA,
      includeManoObra,
      manoObraPercentage: manoObraType === 'percentage' ? parseFloat(manoObraPercentage) * 100 : null
    };
  };

  // Recalcular cuando cambian las opciones
  useEffect(() => {
    if (currentQuotation) {
      setCurrentQuotation(recalculateTotals(currentQuotation));
    }
  }, [includeIVA, includeManoObra, manoObraType, manoObraPercentage, manoObraCustom]);

  const addProduct = () => {
    if (!draft.description.trim()) {
      alert('Ingresa una descripción del producto o concepto.');
      return;
    }

    const quantity = parseFloat(draft.quantity) || 0;
    const unitPrice = parseFloat(draft.unit_price) || 0;

    const newItem = {
      description: draft.description.trim(),
      quantity,
      unit: draft.unit,
      unit_price: unitPrice,
      subtotal: quantity * unitPrice
    };

    const base = currentQuotation || { items: [], notes: '', owner_info: buildOwnerInfo() };
    const updated = { ...base, items: [...base.items, newItem] };
    setCurrentQuotation(recalculateTotals(updated));
    setDraft({ description: '', quantity: 1, unit: 'pieza', unit_price: '' });
  };

  const deleteItem = (index) => {
    if (!currentQuotation) return;

    const newItems = currentQuotation.items.filter((_, i) => i !== index);

    if (newItems.length === 0) {
      setCurrentQuotation(null);
    } else {
      setCurrentQuotation(recalculateTotals({ ...currentQuotation, items: newItems }));
    }
  };

  const startEditItem = (index) => {
    setCombiningFromIndex(null);
    setEditingItemIndex(index);
    setEditingItem({ ...currentQuotation.items[index] });
  };

  const cancelEditItem = () => {
    setEditingItemIndex(null);
    setEditingItem(null);
  };

  const saveEditItem = () => {
    if (!editingItem || editingItemIndex === null) return;

    const updatedItem = {
      ...editingItem,
      subtotal: editingItem.quantity * editingItem.unit_price
    };

    const newItems = [...currentQuotation.items];
    newItems[editingItemIndex] = updatedItem;

    setCurrentQuotation(recalculateTotals({ ...currentQuotation, items: newItems }));
    setEditingItemIndex(null);
    setEditingItem(null);
  };

  const doCombine = (sourceIndex, targetIndex) => {
    const items = currentQuotation.items;
    const sourceItem = items[sourceIndex];
    const targetItem = items[targetIndex];

    const incluyeIdx = targetItem.description.indexOf('Incluye:');
    const appendText = incluyeIdx !== -1
      ? targetItem.description.substring(incluyeIdx)
      : targetItem.description;

    const sourceDesc = sourceItem.description.trimEnd();
    const base = sourceDesc.endsWith('.') ? sourceDesc : sourceDesc + '.';
    const mergedDescription = base + ' ' + appendText;
    const mergedSubtotal = sourceItem.subtotal + targetItem.subtotal;

    const mergedItem = {
      ...sourceItem,
      description: mergedDescription,
      quantity: 1,
      unit_price: mergedSubtotal,
      subtotal: mergedSubtotal
    };

    const firstIdx = Math.min(sourceIndex, targetIndex);
    const newItems = items.filter((_, i) => i !== sourceIndex && i !== targetIndex);
    newItems.splice(firstIdx, 0, mergedItem);

    setCurrentQuotation(recalculateTotals({ ...currentQuotation, items: newItems }));
    setCombiningFromIndex(null);
  };

  const startCombine = (index) => {
    setEditingItemIndex(null);
    setEditingItem(null);
    if (currentQuotation.items.length === 2) {
      doCombine(index, index === 0 ? 1 : 0);
      return;
    }
    setCombiningFromIndex(index);
  };

  const cancelCombine = () => {
    setCombiningFromIndex(null);
  };

  const executeCombine = (targetIndex) => {
    if (combiningFromIndex === null || combiningFromIndex === targetIndex) return;
    doCombine(combiningFromIndex, targetIndex);
  };

  const saveQuotation = async () => {
    if (!currentQuotation) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/quotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          date: currentQuotation.date,
          valid_until: currentQuotation.valid_until,
          client_name: clientInfo.name || 'Cliente',
          client_email: clientInfo.email || null,
          client_phone: clientInfo.phone || null,
          client_address: clientInfo.address || null,
          items: currentQuotation.items,
          subtotal: currentQuotation.subtotal,
          includeIVA: includeIVA,
          iva: currentQuotation.iva,
          includeManoObra: includeManoObra,
          manoObra: currentQuotation.manoObra || 0,
          manoObraPercentage: manoObraType === 'percentage' ? parseFloat(manoObraPercentage) * 100 : null,
          subtotalWithManoObra: currentQuotation.subtotalWithManoObra,
          total: currentQuotation.total,
          notes: currentQuotation.notes || '',
          quotation_type: quotationType,
          status: 'pendiente'
        })
      });

      if (response.status === 401 || response.status === 403) {
        alert('Tu sesión expiró. Inicia nuevamente.');
        await logout();
        setIsSaving(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        throw new Error(errorData.message || 'Error al guardar');
      }

      const saved = await response.json();

      setCurrentQuotation(prev => ({
        ...prev,
        quotation_number: saved.quotation_number,
        _id: saved._id,
        owner_info: saved.owner_info || prev?.owner_info || buildOwnerInfo()
      }));

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);

      if (onQuotationSaved) {
        setTimeout(() => onQuotationSaved(), 1500);
      }
    } catch (error) {
      console.error('❌ Error completo:', error);
      alert('Error al guardar la cotización: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const downloadQuotation = () => {
    if (!currentQuotation) return;

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

    const totalEnLetras = numeroALetras(currentQuotation.total);
    const fechaActual = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
    const quotationNumber = currentQuotation.quotation_number || 'BORRADOR';
    const ownerInfo = currentQuotation.owner_info || buildOwnerInfo();
    const companyName = ownerInfo?.companyName || 'Sistemas de Riego para Jardines';
    const companyAddress = ownerInfo?.companyAddress || 'PROPORCIONA TU DIRECCIÓN FISCAL';
    const ownerRfc = ownerInfo?.rfc || 'RFC DESCONOCIDO';
    const signatureName = ownerInfo?.signatureName || ownerInfo?.name || 'Representante Autorizado';
    const signatureTitle = ownerInfo?.signatureTitle || '';

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    registerBankGothic(doc);

    let yPos = 15;

    const logoImg = new Image();
    logoImg.src = '/logo/Imagen1.jpg';
    logoImg.onload = () => {
      doc.addImage(logoImg, 'JPEG', 15, yPos, 25, 25);

      yPos = 20;
      doc.setFontSize(11);
      doc.setFont('BankGothicLtBT', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(companyName.toUpperCase(), 105, yPos, { align: 'center' });

      yPos += 6;
      doc.setFontSize(9);
      doc.setTextColor(132, 150, 176);
      doc.text(companyAddress.toUpperCase(), 105, yPos, { align: 'center' });

      yPos += 4;
      doc.text(`RFC ${ownerRfc.toUpperCase()}`, 105, yPos, { align: 'center' });

      yPos += 12;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text(fechaActual, 200, yPos, { align: 'right' });

      yPos += 8;
      doc.setFontSize(10);
      doc.text((clientInfo.name || 'A QUIEN CORRESPONDA').toUpperCase(), 15, yPos);

      yPos += 5;
      doc.text('P R E S E N T E.', 15, yPos);

      yPos += 8;
      doc.setFontSize(9.5);
      const introText = QUOTATION_TYPES[quotationType].intro(clientInfo.address);
      const splitIntro = doc.splitTextToSize(introText, 180);
      doc.text(splitIntro, 15, yPos);

      yPos += (splitIntro.length * 5) + 5;

      const tableData = currentQuotation.items.map((item, index) => [
        (index + 1).toString(),
        item.quantity.toString(),
        item.description,
        item.unit,
        '$' + item.unit_price.toLocaleString('es-MX', { minimumFractionDigits: 2 }),
        '$' + item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })
      ]);

      if (includeManoObra) {
        tableData.push([
          (currentQuotation.items.length + 1).toString(),
          '1',
          QUOTATION_TYPES[quotationType].manoObraLabel,
          'servicio',
          'Instalación',
          '$' + currentQuotation.manoObra.toLocaleString('es-MX', { minimumFractionDigits: 2 })
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
          1: { halign: 'center', cellWidth: 18 },
          2: { halign: 'left', cellWidth: 75 },
          3: { halign: 'center', cellWidth: 18 },
          4: { halign: 'right', cellWidth: 28 },
          5: { halign: 'right', cellWidth: 32 }
        },
        didParseCell: function (data) {
          if (includeManoObra && data.row.index === tableData.length - 1) {
            data.cell.styles.fillColor = [255, 249, 230];
          }
        }
      });

      yPos = doc.lastAutoTable.finalY + 3;

      const subtotalY = yPos;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');

      doc.text('Subtotal', 140, subtotalY, { align: 'right' });
      doc.text('$' + currentQuotation.subtotalWithManoObra.toLocaleString('es-MX', { minimumFractionDigits: 2 }), 195, subtotalY, { align: 'right' });

      if (includeIVA) {
        doc.text('IVA.', 140, subtotalY + 5, { align: 'right' });
        doc.text('$' + currentQuotation.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 }), 195, subtotalY + 5, { align: 'right' });
      }

      const totalY = includeIVA ? subtotalY + 10 : subtotalY + 5;
      doc.setFillColor(231, 230, 230);
      doc.rect(125, totalY - 4, 70, 7, 'F');
      doc.text('total', 140, totalY, { align: 'right' });
      doc.text('$' + currentQuotation.total.toLocaleString('es-MX', { minimumFractionDigits: 2 }), 195, totalY, { align: 'right' });

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
      doc.text(signatureName.toUpperCase(), 107.5, firmaY + 5, { align: 'center' });
      if (signatureTitle) {
        doc.setFontSize(9);
        doc.text(signatureTitle.toUpperCase(), 107.5, firmaY + 10, { align: 'center' });
      }

      doc.save(`Cotizacion-${quotationNumber}.pdf`);
    };

    logoImg.onerror = () => {
      console.warn('No se pudo cargar el logo');
    };
  };

  const hasItems = currentQuotation && currentQuotation.items.length > 0;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="qa-layout" style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: hasItems ? '1fr 1fr' : '1fr',
        minHeight: '80vh'
      }}>
        {/* COLUMNA DE CAPTURA MANUAL */}
        <div className="qa-chat" style={{ display: 'flex', flexDirection: 'column', borderRight: hasItems ? '1px solid #e2e8f0' : 'none' }}>
          <div style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)', padding: '24px', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Droplets size={40} />
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>Cotización Manual</h2>
                  <p style={{ margin: '6px 0 0 0', opacity: 0.95, fontSize: '14px' }}>Captura los conceptos a mano, sin usar la IA</p>
                </div>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '14px' }}
                >
                  <ArrowLeft size={18} />
                  Volver
                </button>
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#f8fafc' }}>
            {/* FORMULARIO AGREGAR PRODUCTO */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} /> Agregar Concepto
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Descripción *</label>
                  <input
                    type="text"
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') addProduct(); }}
                    placeholder="Ej: Controlador Rain Bird 4 estaciones"
                    style={{ width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Cantidad</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={draft.quantity}
                      onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
                      style={{ width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Unidad</label>
                    <select
                      value={draft.unit}
                      onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                      style={{ width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', background: 'white' }}
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
                      min="0"
                      step="0.01"
                      value={draft.unit_price}
                      onChange={(e) => setDraft({ ...draft, unit_price: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') addProduct(); }}
                      placeholder="0.00"
                      style={{ width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                </div>
                <button
                  onClick={addProduct}
                  style={{ padding: '14px 20px', background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600', fontSize: '14px' }}
                >
                  <Plus size={18} />
                  Agregar a la cotización
                </button>
              </div>
            </div>

            {!hasItems && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <Droplets size={56} style={{ margin: '0 auto 20px', color: '#0ea5e9' }} />
                <p style={{ lineHeight: 1.6 }}>Agrega tu primer concepto para ver la vista previa con las opciones de IVA y mano de obra.</p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA PREVIEW */}
        {hasItems && (
          <div className="qa-preview" style={{ background: '#f8fafc', padding: '24px', overflowY: 'auto' }}>
            {/* INFO CLIENTE */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '8px' }}>👤 Información del Cliente</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <select value={quotationType} onChange={(e) => setQuotationType(e.target.value)} style={{ padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', background: 'white', color: '#1e293b' }} onFocus={(e) => e.target.style.borderColor = '#0ea5e9'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}>
                  {Object.entries(QUOTATION_TYPES).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
                <div style={{ fontSize: '12px', color: '#94a3b8', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', fontStyle: 'italic' }}>
                  {QUOTATION_TYPES[quotationType].intro(clientInfo.address || '[dirección]')}
                </div>
                <input type="text" placeholder="Nombre del cliente *" value={clientInfo.name} onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })} style={{ padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = '#0ea5e9'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                <input type="email" placeholder="Email (opcional)" value={clientInfo.email} onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })} style={{ padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = '#0ea5e9'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                <input type="tel" placeholder="Teléfono (opcional)" value={clientInfo.phone} onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })} style={{ padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = '#0ea5e9'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                <input type="text" placeholder="Dirección (opcional)" value={clientInfo.address} onChange={(e) => setClientInfo({ ...clientInfo, address: e.target.value })} style={{ padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = '#0ea5e9'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
              </div>
            </div>

            {/* OPCIONES DE CÁLCULO */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '8px' }}>⚙️ Opciones de Cálculo</h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={includeIVA} onChange={(e) => setIncludeIVA(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>Incluir IVA (16%)</span>
                </label>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px' }}>
                  <input type="checkbox" checked={includeManoObra} onChange={(e) => setIncludeManoObra(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>Incluir Mano de Obra / Instalación</span>
                </label>

                {includeManoObra && (
                  <div style={{ marginLeft: '26px', display: 'grid', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <input type="radio" checked={manoObraType === 'percentage'} onChange={() => setManoObraType('percentage')} name="manoObraTypeManual" style={{ cursor: 'pointer' }} />
                        <span style={{ fontSize: '14px' }}>Porcentaje del subtotal</span>
                      </label>
                      {manoObraType === 'percentage' && (
                        <select value={manoObraPercentage} onChange={(e) => setManoObraPercentage(e.target.value)} style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', outline: 'none' }}>
                          <option value="0.95">95% del subtotal</option>
                          <option value="0.90">90% del subtotal</option>
                          <option value="0.85">85% del subtotal</option>
                          <option value="0.80">80% del subtotal</option>
                          <option value="0.75">75% del subtotal</option>
                          <option value="0.70">70% del subtotal</option>
                          <option value="0.65">65% del subtotal</option>
                          <option value="0.60">60% del subtotal</option>
                          <option value="0.50">50% del subtotal</option>
                        </select>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <input type="radio" checked={manoObraType === 'custom'} onChange={() => setManoObraType('custom')} name="manoObraTypeManual" style={{ cursor: 'pointer' }} />
                        <span style={{ fontSize: '14px' }}>Monto personalizado</span>
                      </label>
                      {manoObraType === 'custom' && (
                        <input type="number" placeholder="Ingresa el monto" value={manoObraCustom} onChange={(e) => setManoObraCustom(e.target.value)} style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', outline: 'none' }} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BOTONES */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button onClick={saveQuotation} disabled={isSaving || !clientInfo.name} style={{ flex: 1, padding: '14px 20px', background: isSaving || !clientInfo.name ? '#cbd5e1' : '#10b981', color: 'white', border: 'none', borderRadius: '10px', cursor: isSaving || !clientInfo.name ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600', fontSize: '14px' }}>
                {isSaving ? <Loader2 size={18} /> : showSaveSuccess ? <CheckCircle size={18} /> : <Save size={18} />}
                {isSaving ? 'Guardando...' : showSaveSuccess ? '¡Guardado!' : 'Guardar'}
              </button>
              <button onClick={downloadQuotation} style={{ flex: 1, padding: '14px 20px', background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600', fontSize: '14px' }}>
                <Download size={18} />
                Descargar PDF
              </button>
            </div>

            {/* PREVIEW CON EDITAR/ELIMINAR */}
            <div style={{ background: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
              <div style={{ borderBottom: '4px solid #0ea5e9', paddingBottom: '20px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#0ea5e9', margin: '0 0 6px 0' }}>COTIZACIÓN</h1>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}><strong>Sistemas de Riego Profesional</strong></p>
                </div>
                <Droplets size={48} style={{ color: '#0ea5e9' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
                <div style={{ background: '#f0f9ff', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #0ea5e9' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0369a1', textTransform: 'uppercase', marginBottom: '6px' }}>Número</div>
                  <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{currentQuotation.quotation_number || 'BORRADOR'}</div>
                </div>
                <div style={{ background: '#f0f9ff', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #0ea5e9' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0369a1', textTransform: 'uppercase', marginBottom: '6px' }}>Fecha</div>
                  <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{currentQuotation.date}</div>
                </div>
              </div>

              {/* TABLA CON BOTONES EDITAR/ELIMINAR */}
              <div style={{ marginBottom: '28px' }}>
                {combiningFromIndex !== null && (
                  <div style={{ background: '#fef9c3', border: '1px solid #eab308', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Link size={14} />
                    Selecciona el concepto con el que deseas combinar el elemento marcado en verde.
                  </div>
                )}
                {currentQuotation.items.map((item, idx) => (
                  <div key={idx} style={{
                    background: editingItemIndex === idx ? '#fffbeb'
                      : combiningFromIndex === idx ? '#f0fdf4'
                      : combiningFromIndex !== null ? '#fef9c3'
                      : '#f8fafc',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: editingItemIndex === idx ? '2px solid #f59e0b'
                      : combiningFromIndex === idx ? '2px solid #10b981'
                      : combiningFromIndex !== null ? '2px dashed #eab308'
                      : '1px solid #e2e8f0',
                    cursor: combiningFromIndex !== null && combiningFromIndex !== idx ? 'pointer' : 'default'
                  }}>
                    {editingItemIndex === idx ? (
                      // MODO EDICIÓN
                      <div>
                        <div style={{ display: 'grid', gap: '12px', marginBottom: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Descripción</label>
                            <input
                              type="text"
                              value={editingItem.description}
                              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                              style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Cantidad</label>
                              <input
                                type="number"
                                value={editingItem.quantity}
                                onChange={(e) => setEditingItem({ ...editingItem, quantity: parseFloat(e.target.value) || 0 })}
                                style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Unidad</label>
                              <input
                                type="text"
                                value={editingItem.unit}
                                onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}>Precio Unit.</label>
                              <input
                                type="number"
                                value={editingItem.unit_price}
                                onChange={(e) => setEditingItem({ ...editingItem, unit_price: parseFloat(e.target.value) || 0 })}
                                style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                              />
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={cancelEditItem} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
                            <X size={16} />
                            Cancelar
                          </button>
                          <button onClick={saveEditItem} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
                            <Check size={16} />
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      // MODO VISTA
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>{item.description}</div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                              <span style={{ fontWeight: '600' }}>{item.quantity}</span> {item.unit} × ${item.unit_price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0ea5e9', marginRight: '12px' }}>
                              ${item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </div>
                            {combiningFromIndex === idx ? (
                              <button onClick={cancelCombine} style={{ padding: '6px 10px', background: '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}>
                                <X size={14} /> Cancelar
                              </button>
                            ) : combiningFromIndex !== null ? (
                              <button onClick={() => executeCombine(idx)} style={{ padding: '6px 10px', background: '#eab308', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}>
                                <Link size={14} /> Combinar aquí
                              </button>
                            ) : (
                              <>
                                <button onClick={() => startEditItem(idx)} style={{ padding: '6px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Editar">
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={() => startCombine(idx)} style={{ padding: '6px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Combinar con otro concepto">
                                  <Link size={16} />
                                </button>
                                <button onClick={() => deleteItem(idx)} style={{ padding: '6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Eliminar">
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginLeft: 'auto', width: '300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0', fontSize: '14px' }}>
                  <span style={{ color: '#64748b' }}>Subtotal:</span>
                  <span style={{ fontWeight: '600' }}>${currentQuotation.subtotalWithManoObra.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                {includeIVA && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>IVA (16%):</span>
                    <span style={{ fontWeight: '600' }}>${currentQuotation.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderTop: '3px solid #0ea5e9', marginTop: '10px', fontSize: '20px', fontWeight: 'bold', color: '#0ea5e9' }}>
                  <span>TOTAL:</span>
                  <span>${currentQuotation.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default QuotationManual;
