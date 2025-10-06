// src/models/Class.js
const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true // Não permitir duas turmas com o mesmo nome
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Class = mongoose.model('Class', classSchema);

module.exports = Class;