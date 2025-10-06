// seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const KeywordResponse = require('./src/models/KeywordResponse');

const mongoUri = process.env.MONGO_URI;

const responses = [
  { keyword: 'ajuda', response: 'Olá! Nossos serviços são: Agendamento, Pagamento e Suporte. Em que posso ajudar?' },
  { keyword: 'preço', response: 'O valor do nosso serviço principal é R$ 50,00.' },
  { keyword: 'horário', response: 'Nosso horário de funcionamento é de Segunda a Sexta, das 9h às 18h.' }
];

mongoose.connect(mongoUri)
  .then(() => {
    console.log('Conectado ao MongoDB para seeding...');
    return KeywordResponse.deleteMany({}); // Limpa as respostas antigas
  })
  .then(() => {
    console.log('Respostas antigas deletadas. Inserindo novas...');
    return KeywordResponse.insertMany(responses); // Insere as novas
  })
  .then(() => {
    console.log('Seeding concluído com sucesso!');
    mongoose.connection.close(); // Fecha a conexão
  })
  .catch(error => {
    console.error('Erro durante o seeding:', error);
    mongoose.connection.close();
  });