// src/index.js
require('dotenv').config();

const express = require('express');
const twilio = require('twilio');
const mongoose = require('mongoose');
const { parse, isValid, format } = require('date-fns');
const { fromZonedTime, utcToZonedTime } = require('date-fns-tz');
const { MercadoPagoConfig, Preference } = require('mercadopago'); // NOVA IMPORTAÇÃO

const Client = require('./models/Client');
const KeywordResponse = require('./models/KeywordResponse');
const Appointment = require('./models/Appointment');
const Class = require('./models/Class');
const Attendance = require('./models/Attendance');

// --- Configurações ---
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const mongoUri = process.env.MONGO_URI;
const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

const twilioClient = twilio(accountSid, authToken);
const app = express();
app.use(express.urlencoded({ extended: true }));
const PORT = 3000;

// NOVO CLIENTE DO MERCADO PAGO
const mpClient = new MercadoPagoConfig({ accessToken: mpAccessToken });

// Conexão com o MongoDB
mongoose.connect(mongoUri)
  .then(() => console.log('Conexão com o MongoDB estabelecida com sucesso!'))
  .catch((error) => console.error('Erro ao conectar com o MongoDB:', error));

// --- Rota do Webhook Principal ---
app.post('/webhook', async (req, res) => {
  const sender = req.body.From;
  const profileName = req.body.ProfileName;
  const userMessage = req.body.Body.trim();
  const lowerCaseMessage = userMessage.toLowerCase();
  
  let responseBody = "Desculpe, não entendi. Digite 'ajuda' para ver as opções.";

  try {
    let clientInDb = await Client.findOne({ phoneNumber: sender });
    if (!clientInDb) {
      clientInDb = new Client({ phoneNumber: sender, profileName: profileName });
      await clientInDb.save();
      console.log('Novo cliente salvo!');
    }
    
    // Lógica de agendamento
    if (clientInDb.conversationState === 'awaiting_date') {
      const parsedDate = parse(userMessage, "dd/MM/yyyy 'às' HH:mm", new Date());

      if (isValid(parsedDate)) {
        const newAppointment = new Appointment({
          client: clientInDb._id,
          appointmentDate: fromZonedTime(parsedDate, 'America/Sao_Paulo'),
        });
        await newAppointment.save();
        console.log('Novo agendamento salvo!');

        // --- LÓGICA DE PAGAMENTO CORRIGIDA ---
        const preference = new Preference(mpClient);
        const mpResponse = await preference.create({
          body: {
            items: [
              {
                id: newAppointment._id.toString(), // ID do agendamento
                title: 'Agendamento de Serviço',
                quantity: 1,
                currency_id: 'BRL',
                unit_price: 50.00
              }
            ],
            payer: { name: profileName },
            // As back_urls e notification_url são importantes para o próximo passo, mas por enquanto podem ficar assim.
          }
        });
        
        const paymentLink = mpResponse.init_point;
        console.log('Link de pagamento gerado:', paymentLink);
        responseBody = `Agendamento pré-confirmado! Para confirmar, realize o pagamento no link a seguir: ${paymentLink}`;
        
        clientInDb.conversationState = 'idle';
        await clientInDb.save();
      } else {
        responseBody = "Formato de data inválido. Por favor, tente novamente (DD/MM/AAAA às HH:MM).";
      }

    } else { // Lógica para estado 'idle' (admin e keywords)
        // ... (todo o seu código de admin e palavras-chave que já funciona entra aqui, sem mudanças)
        // Por simplicidade, vou colar apenas o 'agendar' e a keyword
        if (lowerCaseMessage === 'agendar') {
            responseBody = 'Ótimo! Para qual dia e hora você gostaria de agendar? (formato: DD/MM/AAAA às HH:MM)';
            clientInDb.conversationState = 'awaiting_date';
            await clientInDb.save();
        } else {
            const keywordResponse = await KeywordResponse.findOne({ keyword: lowerCaseMessage });
            if (keywordResponse) {
                responseBody = keywordResponse.response;
            }
        }
    }
  } catch (error) {
    console.error('Ocorreu um erro:', error);
    responseBody = 'Ocorreu um erro ao processar sua mensagem. Tente novamente.';
  }
  
  // Envio da resposta final
  twilioClient.messages
    .create({ body: responseBody, from: req.body.To, to: sender })
    .then(message => console.log(`Resposta enviada para ${profileName}`))
    .catch(error => console.error('Erro ao enviar resposta:', error));

  res.status(200).send();
});


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});