// src/models/KeywordResponse.js
const mongoose = require('mongoose');

const keywordResponseSchema = new mongoose.Schema({
  keyword: {
    type: String,
    required: true,
    unique: true,
    lowercase: true // Sempre salva a palavra-chave em minúsculas
  },
  response: {
    type: String,
    required: true
  }
});

const KeywordResponse = mongoose.model('KeywordResponse', keywordResponseSchema);

module.exports = KeywordResponse;