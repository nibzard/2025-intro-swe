const Field = require('../models/Field');
const fs = require('fs');
const path = require('path');

// Dohvati sve terene
exports.getFields = async (req, res) => {
  try {
    const { sport, city, country } = req.query;
    
    const query = {};
    if (sport) query.sport = sport;
    if (city) query.city = city;
    if (country) query.country = country;

    const fields = await Field.find(query)
      .populate('addedBy', 'username avatar')
      .sort({ createdAt: -1 });

    res.json(fields);
  } catch (error) {
    console.error('Get fields error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dohvati jedan teren
exports.getField = async (req, res) => {
  try {
    const { fieldId } = req.params;

    const field = await Field.findById(fieldId)
      .populate('addedBy', 'username avatar')
      .populate('reviews.user', 'username avatar');

    if (!field) {
      return res.status(404).json({ message: 'Teren ne postoji' });
    }

    res.json(field);
  } catch (error) {
    console.error('Get field error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Kreiraj novi teren (sa slikama)
exports.createField = async (req, res) => {
  try {
    const userId = req.user.id;
    const fieldData = JSON.parse(req.body.data); // Data je JSON string

    // Validacija
    if (!fieldData.name || !fieldData.sport || !fieldData.city || !fieldData.address) {
      // Obriši uploadane slike ako validacija faila
      if (req.files) {
        req.files.forEach(file => fs.unlinkSync(file.path));
      }
      return res.status(400).json({ message: 'Popuni sva obavezna polja!' });
    }

    // Dodaj slike
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        images.push({
          filename: file.filename,
          filepath: file.path,
          isPrimary: index === 0 // Prva slika je primary
        });
      });
    }

    const field = new Field({
      ...fieldData,
      images,
      addedBy: userId
    });

    await field.save();
    await field.populate('addedBy', 'username avatar');

    res.status(201).json({ 
      message: 'Teren uspješno dodan!', 
      field 
    });
  } catch (error) {
    console.error('Create field error:', error);
    // Obriši uploadane slike u slučaju greške
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Dodaj recenziju
exports.addReview = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Ocjena mora biti između 1 i 5!' });
    }

    const field = await Field.findById(fieldId);
    
    if (!field) {
      return res.status(404).json({ message: 'Teren ne postoji' });
    }

    // Provjeri je li već ostavio recenziju
    const existingReview = field.reviews.find(
      r => r.user.toString() === userId
    );

    if (existingReview) {
      return res.status(400).json({ message: 'Već si ostavio recenziju!' });
    }

    // Dodaj recenziju
    field.reviews.push({
      user: userId,
      rating,
      comment,
      createdAt: new Date()
    });

    await field.save();
    await field.populate('reviews.user', 'username avatar');

    res.json({ 
      message: 'Recenzija dodana!', 
      field 
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Obriši teren
exports.deleteField = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const userId = req.user.id;

    const field = await Field.findById(fieldId);
    
    if (!field) {
      return res.status(404).json({ message: 'Teren ne postoji' });
    }

    // Provjeri je li dodavač
    if (field.addedBy.toString() !== userId) {
      return res.status(403).json({ message: 'Nemaš pravo obrisati ovaj teren!' });
    }

    // Obriši slike
    field.images.forEach(img => {
      if (fs.existsSync(img.filepath)) {
        fs.unlinkSync(img.filepath);
      }
    });

    await Field.findByIdAndDelete(fieldId);

    res.json({ message: 'Teren obrisan!' });
  } catch (error) {
    console.error('Delete field error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;