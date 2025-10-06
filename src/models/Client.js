const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  profileName: {
    type: String,
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  conversationState: {
    type: String,
    default: 'idle' // 'idle' = ocioso, esperando um comando
  },
  isAdmin: {
    type: Boolean,
    default: false // Por padrão ninguem é admin
  }
});

const Client = mongoose.model('Client', clientSchema);
module.exports = Client;