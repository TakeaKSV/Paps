import mongoose from 'mongoose';

const quotationItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  unit_price: { type: Number, required: true },
  subtotal: { type: Number, required: true }
});

const quotationSchema = new mongoose.Schema({
  quotation_number: { type: String, unique: true },
  date: { type: String, required: true },
  valid_until: { type: String, required: true },
  client_name: { type: String, default: 'Cliente' },
  client_email: { type: String },
  client_phone: { type: String },
  client_address: { type: String },
  items: [quotationItemSchema],
  subtotal: { type: Number, required: true },
  includeIVA: { type: Boolean, default: true },
  iva: { type: Number, default: 0 },
  includeManoObra: { type: Boolean, default: false },
  manoObra: { type: Number, default: 0 },
  manoObraPercentage: { type: Number },
  subtotalWithManoObra: { type: Number, default: 0 },
  total: { type: Number, required: true },
  notes: { type: String },
  quotation_type: { type: String, default: 'instalacion_riego' },
  status: {
    type: String, 
    enum: ['pendiente', 'enviada', 'aceptada', 'rechazada'], 
    default: 'pendiente' 
  },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  owner_info: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    phone: String,
    rfc: String,
    companyName: String,
    companyAddress: String,
    signatureName: String,
    signatureTitle: String
  }
}, {
  timestamps: true
});

// Pre-save hook para generar número de cotización ÚNICO
quotationSchema.pre('save', async function(next) {
  if (this.isNew && !this.quotation_number) {
    const year = new Date().getFullYear();
    
    // Buscar el último número usado este año
    const lastQuotation = await mongoose.model('Quotation')
      .findOne({ quotation_number: new RegExp(`^COT-${year}-`) })
      .sort({ quotation_number: -1 })
      .limit(1);
    
    let nextNumber = 1;
    if (lastQuotation && lastQuotation.quotation_number) {
      const lastNumber = parseInt(lastQuotation.quotation_number.split('-')[2]);
      nextNumber = lastNumber + 1;
    }
    
    this.quotation_number = `COT-${year}-${String(nextNumber).padStart(4, '0')}`;
    console.log(`📋 Número de cotización generado: ${this.quotation_number}`);
  }
  next();
});

export default mongoose.model('Quotation', quotationSchema);