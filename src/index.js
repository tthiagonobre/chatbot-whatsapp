// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

const express = require('express');
const twilio = require('twilio');

// Pega as credenciais da Twilio do arquivo .env
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Inicia o cliente da Twilio
const client = twilio(accountSid, authToken);

const app = express();
app.use(express.urlencoded({ extended: true }));

const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Servidor do Chatbot está no ar!');
});

app.post('/webhook', (req, res) => {
  console.log('Mensagem recebida:', req.body.Body);

  const sender = req.body.From; // Número de quem enviou
  const twilioNumber = req.body.To; // Seu número da Twilio
  const messageBody = "Obrigado por sua mensagem! Recebemos: '" + req.body.Body + "'";

  // Envia uma resposta via Twilio
  client.messages
    .create({
      body: messageBody,
      from: twilioNumber,
      to: sender
    })
    .then(message => console.log('Resposta enviada! SID:', message.sid))
    .catch(error => console.error('Erro ao enviar resposta:', error));

  res.status(200).send();
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});