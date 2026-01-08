const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sport: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  address: { type: String, required: true },
  
  price: { type: Number }, // Cijena po satu u eurima
  description: { type: String },
  
  // Slike terena
  images: [{
    filename: { type: String },
    filepath: { type: String },
    isPrimary: { type: Boolean, default: false }
  }],
  
  // Sadržaji
  facilities: [{ type: String }],
  
  // Lokacija (za Google Maps)
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  
  // Dostupnost
  availability: {
    type: String,
    enum: ['Dostupno', 'Rezervirano', 'Nedostupno'],
    default: 'Dostupno'
  },
  
  // Ocjene
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Metadata
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-calculate average rating
fieldSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating = (total / this.reviews.length).toFixed(1);
  }
  this.updatedAt = new Date();
  next();
});
// Indexi
fieldSchema.index({ sport: 1 });
fieldSchema.index({ city: 1 });
fieldSchema.index({ availability: 1 });
fieldSchema.index({ rating: -1 });
fieldSchema.index({ addedBy: 1 });
fieldSchema.index({ name: 'text', description: 'text' });
fieldSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 }); // Geospatial
module.exports = mongoose.model('Field', fieldSchema);