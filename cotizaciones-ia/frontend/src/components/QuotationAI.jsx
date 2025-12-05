import React, { useState, useRef, useEffect } from 'react';
import { Send, Download, Loader2, Save, CheckCircle, Droplets, Mic, MicOff, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const API_URL = 'http://localhost:5000/api';

const QuotationAI = ({ onQuotationSaved }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const messagesEndRef = useRef(null);

  const productCatalog = {
    "controlador 4 estaciones rain bird": { price: 2762.00, unit: "pieza", description: "Controlador de 4 estaciones Rain Bird", category: "Automatización" },
    "controlador rain bird": { price: 2762.00, unit: "pieza", description: "Controlador de 4 estaciones Rain Bird", category: "Automatización" },
    "contactor siemens": { price: 894.00, unit: "pieza", description: "Contactor Siemens", category: "Eléctrico" },
    "caja para contactor": { price: 298.00, unit: "pieza", description: "Caja para contactor", category: "Eléctrico" },
    "válvula solenoide 1": { price: 498.40, unit: "pieza", description: "Válvula Solenoide 1\"", category: "Válvulas" },
    "válvula solenoide 1\"": { price: 498.40, unit: "pieza", description: "Válvula Solenoide 1\"", category: "Válvulas" },
    "registro circular 6": { price: 107.35, unit: "pieza", description: "Registro circular de 6\"", category: "Válvulas" },
    "registro circular 6\"": { price: 107.35, unit: "pieza", description: "Registro circular de 6\"", category: "Válvulas" },
    "tubería pvc hco 1": { price: 17.81, unit: "metro", description: "Tubería PVC Hidráulico 1\"", category: "Tuberías" },
    "tubería pvc hco 1\"": { price: 17.81, unit: "metro", description: "Tubería PVC Hidráulico 1\"", category: "Tuberías" },
    "tubería pvc 1": { price: 17.81, unit: "metro", description: "Tubería PVC Hidráulico 1\"", category: "Tuberías" },
    "tubería 1": { price: 17.81, unit: "metro", description: "Tubería PVC Hidráulico 1\"", category: "Tuberías" },
    "aspersor unispray rain bird": { price: 43.10, unit: "pieza", description: "Aspersor Unispray Rain Bird", category: "Aspersores" },
    "aspersor rain bird": { price: 43.10, unit: "pieza", description: "Aspersor Unispray Rain Bird", category: "Aspersores" },
    "unispray": { price: 43.10, unit: "pieza", description: "Aspersor Unispray Rain Bird", category: "Aspersores" },
    "boquilla van": { price: 29.53, unit: "pieza", description: "Boquilla Van", category: "Aspersores" },
    "boquillas van": { price: 29.53, unit: "pieza", description: "Boquilla Van", category: "Aspersores" },
    "manguera flexible swing pipe": { price: 24.81, unit: "metro", description: "Manguera flexible Swing Pipe", category: "Mangueras" },
    "swing pipe": { price: 24.81, unit: "metro", description: "Manguera flexible Swing Pipe", category: "Mangueras" },
    "manguera swing pipe": { price: 24.81, unit: "metro", description: "Manguera flexible Swing Pipe", category: "Mangueras" },
    "codo 90 inserción 1/2": { price: 6.50, unit: "pieza", description: "Codo 90° x inserción 1/2\"", category: "Accesorios" },
    "codo 90 1/2": { price: 6.50, unit: "pieza", description: "Codo 90° x inserción 1/2\"", category: "Accesorios" },
    "codo 1 x 90": { price: 8.16, unit: "pieza", description: "Codo 1\" x 90°", category: "Accesorios" },
    "codo 90 1": { price: 8.16, unit: "pieza", description: "Codo 1\" x 90°", category: "Accesorios" },
    "codo 1\" 90°": { price: 8.16, unit: "pieza", description: "Codo 1\" x 90°", category: "Accesorios" },
    "codo 1 x 45": { price: 7.95, unit: "pieza", description: "Codo 1\" x 45°", category: "Accesorios" },
    "codo 45 1": { price: 7.95, unit: "pieza", description: "Codo 1\" x 45°", category: "Accesorios" },
    "codo 1\" 45°": { price: 7.95, unit: "pieza", description: "Codo 1\" x 45°", category: "Accesorios" },
    "cople pvc 1": { price: 7.18, unit: "pieza", description: "Cople PVC 1\"", category: "Accesorios" },
    "cople 1": { price: 7.18, unit: "pieza", description: "Cople PVC 1\"", category: "Accesorios" },
    "adaptador macho 1 pvc": { price: 13.76, unit: "pieza", description: "Adaptador macho 1\" PVC", category: "Accesorios" },
    "adaptador macho 1": { price: 13.76, unit: "pieza", description: "Adaptador macho 1\" PVC", category: "Accesorios" },
    "adaptador 1": { price: 13.76, unit: "pieza", description: "Adaptador macho 1\" PVC", category: "Accesorios" },
    "tee pvc 1 x 1 x 1/2": { price: 17.10, unit: "pieza", description: "Tee PVC 1\" x 1\" x 1/2\"", category: "Accesorios" },
    "tee 1 x 1 x 1/2": { price: 17.10, unit: "pieza", description: "Tee PVC 1\" x 1\" x 1/2\"", category: "Accesorios" },
    "tee lisa 1": { price: 10.50, unit: "pieza", description: "Tee lisa 1\"", category: "Accesorios" },
    "tee 1": { price: 10.50, unit: "pieza", description: "Tee lisa 1\"", category: "Accesorios" },
    "tapón 1 pvc": { price: 7.30, unit: "pieza", description: "Tapón 1\" PVC", category: "Accesorios" },
    "tapón 1": { price: 7.30, unit: "pieza", description: "Tapón 1\" PVC", category: "Accesorios" },
    "limpiador weld on 1/2 litro": { price: 194.00, unit: "pieza", description: "Limpiador Weld On 1/2 litro", category: "Adhesivos" },
    "limpiador weld on": { price: 194.00, unit: "pieza", description: "Limpiador Weld On 1/2 litro", category: "Adhesivos" },
    "limpiador": { price: 194.00, unit: "pieza", description: "Limpiador Weld On 1/2 litro", category: "Adhesivos" },
    "pegamento weld on 747 1/2 litro": { price: 217.00, unit: "pieza", description: "Pegamento Weld On 747 1/2 litro", category: "Adhesivos" },
    "pegamento weld on 747": { price: 217.00, unit: "pieza", description: "Pegamento Weld On 747 1/2 litro", category: "Adhesivos" },
    "pegamento weld on": { price: 217.00, unit: "pieza", description: "Pegamento Weld On 747 1/2 litro", category: "Adhesivos" },
    "pegamento": { price: 217.00, unit: "pieza", description: "Pegamento Weld On 747 1/2 litro", category: "Adhesivos" },
    "cinta de aislar": { price: 34.00, unit: "pieza", description: "Cinta de aislar", category: "Adhesivos" },
    "cinta aislar": { price: 34.00, unit: "pieza", description: "Cinta de aislar", category: "Adhesivos" },
    "teflón 3/4": { price: 38.00, unit: "pieza", description: "Teflón 3/4\"", category: "Adhesivos" },
    "teflon": { price: 38.00, unit: "pieza", description: "Teflón 3/4\"", category: "Adhesivos" },
    "cable calibre 18": { price: 4.98, unit: "metro", description: "Cable calibre 18", category: "Eléctrico" },
    "cable cal 18": { price: 4.98, unit: "metro", description: "Cable calibre 18", category: "Eléctrico" },
    "cable cal. 18": { price: 4.98, unit: "metro", description: "Cable calibre 18", category: "Eléctrico" },
    "cable": { price: 4.98, unit: "metro", description: "Cable calibre 18", category: "Eléctrico" },
    "poliducto 3/4": { price: 7.50, unit: "metro", description: "Poliducto 3/4\"", category: "Eléctrico" },
    "poliducto": { price: 7.50, unit: "metro", description: "Poliducto 3/4\"", category: "Eléctrico" },
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.lang = 'es-MX';
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Error de reconocimiento de voz:', event.error);
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    const validUntil = new Date(today.getTime() + 30*24*60*60*1000);
    
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

  useEffect(() => {
    if (currentQuotation) {
      setCurrentQuotation(recalculateTotals(currentQuotation));
    }
  }, [includeIVA, includeManoObra, manoObraType, manoObraPercentage, manoObraCustom]);

  const deleteItem = (index) => {
    if (!currentQuotation) return;
    
    const newItems = currentQuotation.items.filter((_, i) => i !== index);
    
    if (newItems.length === 0) {
      setCurrentQuotation(null);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '✅ Cotización eliminada. Puedes empezar una nueva.'
      }]);
    } else {
      const updatedQuotation = {
        ...currentQuotation,
        items: newItems
      };
      setCurrentQuotation(recalculateTotals(updatedQuotation));
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `✅ Producto eliminado. Quedan ${newItems.length} productos.`
      }]);
    }
  };

  const startEditItem = (index) => {
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
    
    const updatedQuotation = {
      ...currentQuotation,
      items: newItems
    };
    
    setCurrentQuotation(recalculateTotals(updatedQuotation));
    setEditingItemIndex(null);
    setEditingItem(null);
    
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: '✅ Producto actualizado correctamente.'
    }]);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!input.trim() || isLoading) return;

  const userMessage = input.trim();
  setInput('');
  
  setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
  setIsLoading(true);

  try {
    const response = await fetch(`${API_URL}/quotations/generate-with-ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userMessage,
        productCatalog,
        currentItems: currentQuotation ? currentQuotation.items : []
      })
    });

    const responseText = await response.text();
    console.log('Respuesta del servidor:', responseText);

    let quotationData;
    try {
      quotationData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error al parsear JSON:', parseError);
      throw new Error('El servidor no devolvió un JSON válido.');
    }

    if (response.status === 503 && quotationData.retryable) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ La API está experimentando mucho tráfico en este momento. Por favor espera 10-15 segundos y vuelve a intentarlo.',
        isError: true,
        retryable: true
      }]);
      setIsLoading(false);
      return;
    }

    if (!response.ok) {
      console.error('Error del servidor:', quotationData);
      throw new Error(quotationData.message || 'Error al generar cotización');
    }

    // MANEJAR ELIMINACIÓN DE PRODUCTOS
    if (quotationData.action === 'delete') {
      if (currentQuotation && currentQuotation.items) {
        const newItems = currentQuotation.items.filter((_, index) => index !== quotationData.itemIndex);
        
        if (newItems.length === 0) {
          setCurrentQuotation(null);
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: '✅ Producto eliminado. La cotización quedó vacía. Puedes empezar una nueva.'
          }]);
        } else {
          const updatedQuotation = {
            ...currentQuotation,
            items: newItems
          };
          const recalculatedQuotation = recalculateTotals(updatedQuotation);
          setCurrentQuotation(recalculatedQuotation);
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: quotationData.message || `✅ Producto eliminado. Quedan ${newItems.length} productos.`,
            quotation: recalculatedQuotation
          }]);
        }
      }
      setIsLoading(false);
      return;
    }

    // MANEJAR AGREGADO DE PRODUCTOS
    if (quotationData.success) {
      if (currentQuotation && currentQuotation.items && currentQuotation.items.length > 0) {
        const combinedQuotation = {
          ...quotationData,
          items: [...currentQuotation.items, ...quotationData.items]
        };
        const recalculatedQuotation = recalculateTotals(combinedQuotation);
        setCurrentQuotation(recalculatedQuotation);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `✅ Productos agregados a la cotización existente. Total de productos: ${recalculatedQuotation.items.length}`,
          quotation: recalculatedQuotation
        }]);
      } else {
        const recalculatedQuotation = recalculateTotals(quotationData);
        setCurrentQuotation(recalculatedQuotation);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '✅ Cotización generada. Ajusta las opciones de IVA y mano de obra si lo necesitas.',
          quotation: recalculatedQuotation
        }]);
      }
    } else {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: quotationData.message || 'Necesito más información para generar la cotización.'
      }]);
    }

  } catch (error) {
    console.error('Error:', error);
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: '❌ ' + error.message,
      isError: true
    }]);
  } finally {
    setIsLoading(false);
  }
};

  const saveQuotation = async () => {
    if (!currentQuotation) return;
    
    setIsSaving(true);
    try {
      console.log('📤 Guardando cotización:', currentQuotation);
      
      const response = await fetch(`${API_URL}/quotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
          status: 'pendiente'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        throw new Error(errorData.message || 'Error al guardar');
      }

      const saved = await response.json();
      console.log('✅ Cotización guardada:', saved);
      
      setCurrentQuotation(prev => ({
        ...prev,
        quotation_number: saved.quotation_number,
        _id: saved._id
      }));
      
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `✅ Cotización ${saved.quotation_number} guardada exitosamente en la base de datos.`
      }]);

      if (onQuotationSaved) {
        setTimeout(() => onQuotationSaved(), 2000);
      }

    } catch (error) {
      console.error('❌ Error completo:', error);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ Error al guardar: ${error.message}. Revisa la consola del navegador y del backend.`
      }]);
      
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

    // Crear documento PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    let yPos = 15;

    // LOGO (cargar desde public)
    const logoImg = new Image();
    logoImg.src = '/logo/Imagen1.jpg';
    logoImg.onload = () => {
      doc.addImage(logoImg, 'JPEG', 15, yPos, 25, 25);
      
      // HEADER
      yPos = 20;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Sistemas de Riego para Jardines', 105, yPos, { align: 'center' });
      
      yPos += 6;
      doc.setFontSize(9);
      doc.setTextColor(132, 150, 176);
      doc.text('PROL. URREA 119 FRACC. CHAPULTEPEC, DURANGO, DGO.', 105, yPos, { align: 'center' });
      
      yPos += 4;
      doc.text('RFC SAVC750926K28', 105, yPos, { align: 'center' });
      
      // FECHA
      yPos += 12;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(fechaActual, 200, yPos, { align: 'right' });
      
      // CLIENTE
      yPos += 8;
      doc.setFontSize(10);
      doc.text((clientInfo.name || 'A QUIEN CORRESPONDA').toUpperCase(), 15, yPos);
      
      yPos += 5;
      doc.text('P R E S E N T E.', 15, yPos);
      
      // INTRO
      yPos += 8;
      doc.setFontSize(9.5);
      const introText = `Por medio de la presente me permito dirigir la siguiente cotización para la instalación del sistema de riego${clientInfo.address ? ' en ' + clientInfo.address : ''}. Queda como sigue:`;
      const splitIntro = doc.splitTextToSize(introText, 180);
      doc.text(splitIntro, 15, yPos);
      
      yPos += (splitIntro.length * 5) + 5;

      // TABLA DE PRODUCTOS
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
          'Instalación incluye: una cuadrilla de personal, apertura de cepas, instalación de tuberías, instalación de válvulas, conexiones eléctricas y aspersores. (incluye gastos indirectos)',
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
        didParseCell: function(data) {
          if (includeManoObra && data.row.index === tableData.length - 1) {
            data.cell.styles.fillColor = [255, 249, 230];
          }
        }
      });

      yPos = doc.lastAutoTable.finalY + 3;

      // SUBTOTALES
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
      doc.text('ING. CESAR ALEJANDRO SARMIENTO VELASQUEZ.', 107.5, firmaY + 5, { align: 'center' });

      // GUARDAR PDF
      doc.save(`Cotizacion-${quotationNumber}.pdf`);
    };

    // Si la imagen no carga, continuar sin logo
    logoImg.onerror = () => {
      console.warn('No se pudo cargar el logo');
      // Continuar generando PDF sin logo...
    };
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: currentQuotation ? '1fr 1fr' : '1fr',
        minHeight: '80vh'
      }}>
        {/* CHAT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: currentQuotation ? '1px solid #e2e8f0' : 'none' }}>
          <div style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)', padding: '24px', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Droplets size={40} />
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>Cotizador IA - Sistemas de Riego</h2>
                <p style={{ margin: '6px 0 0 0', opacity: 0.95, fontSize: '14px' }}>Especializado en tuberías, aspersores, bombas y automatización</p>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#f8fafc' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <Droplets size={56} style={{ margin: '0 auto 20px', color: '#0ea5e9' }} />
                <h3 style={{ fontSize: '20px', marginBottom: '12px', color: '#1e293b' }}>¡Bienvenido al Cotizador de Sistemas de Riego!</h3>
                <p style={{ marginBottom: '24px', lineHeight: 1.6 }}>Describe lo que necesitas y generaré una cotización profesional.</p>
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', textAlign: 'left', maxWidth: '450px', margin: '0 auto', fontSize: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '12px', color: '#0ea5e9', fontSize: '15px' }}>📝 Ejemplos:</p>
                  <ul style={{ paddingLeft: '20px', color: '#475569', lineHeight: 1.8 }}>
                    <li>"1 controlador rain bird y 3 válvulas"</li>
                    <li>"10 aspersores unispray"</li>
                    <li>"50 metros de tubería de 1 pulgada"</li>
                  </ul>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} style={{ marginBottom: '16px', display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '80%', padding: '14px 18px', borderRadius: '14px', background: msg.role === 'user' ? 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)' : 'white', color: msg.role === 'user' ? 'white' : '#1e293b', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', lineHeight: 1.5 }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0ea5e9', padding: '12px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontWeight: '500' }}>Generando cotización...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: 'white' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Escuchando..." : "Ej: 1 controlador rain bird, 3 válvulas solenoides..."}
                style={{
                  flex: 1,
                  padding: '14px 18px',
                  border: isListening ? '2px solid #10b981' : '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={(e) => !isListening && (e.target.style.borderColor = '#0ea5e9')}
                onBlur={(e) => !isListening && (e.target.style.borderColor = '#e2e8f0')}
                disabled={isLoading}
              />

              <button
                type="button"
                onClick={toggleListening}
                disabled={isLoading}
                style={{
                  padding: '14px 20px',
                  background: isListening ? '#10b981' : '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                style={{
                  padding: '14px 28px',
                  background: isLoading || !input.trim() ? '#cbd5e1' : 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                {isLoading ? <Loader2 size={18} /> : currentQuotation ? <Plus size={18} /> : <Send size={18} />}
                {isLoading ? 'Procesando...' : currentQuotation ? 'Agregar' : 'Enviar'}
              </button>
            </div>
          </form>
        </div>

        {/* PREVIEW COLUMN */}
        {currentQuotation && (
          <div style={{ background: '#f8fafc', padding: '24px', overflowY: 'auto' }}>
            {/* INFO CLIENTE */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '8px' }}>👤 Información del Cliente</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
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
                        <input type="radio" checked={manoObraType === 'percentage'} onChange={() => setManoObraType('percentage')} name="manoObraType" style={{ cursor: 'pointer' }} />
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
                        <input type="radio" checked={manoObraType === 'custom'} onChange={() => setManoObraType('custom')} name="manoObraType" style={{ cursor: 'pointer' }} />
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
                {currentQuotation.items.map((item, idx) => (
                  <div key={idx} style={{
                    background: editingItemIndex === idx ? '#fffbeb' : '#f8fafc',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: editingItemIndex === idx ? '2px solid #f59e0b' : '1px solid #e2e8f0'
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
                            <button onClick={() => startEditItem(idx)} style={{ padding: '6px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Editar">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => deleteItem(idx)} style={{ padding: '6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Eliminar">
                              <Trash2 size={16} />
                            </button>
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

export default QuotationAI;