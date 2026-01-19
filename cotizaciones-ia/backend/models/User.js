import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  rfc: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  companyName: { type: String, required: true },
  companyAddress: { type: String, required: true },
  signatureName: { type: String, required: true },
  signatureTitle: { type: String, default: '' },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'sales'], default: 'sales' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);
