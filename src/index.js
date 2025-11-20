// src/index.js
require('dotenv').config();

const express = require('express');
const twilio = require('twilio');
const mongoose = require('mongoose');
const { parse, isValid, format } = require('date-fns');
const { fromZonedTime, utcToZonedTime } = require('date-fns-tz');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

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
const serverUrl = process.env.SERVER_URL;

const twilioClient = twilio(accountSid, authToken);
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 3000;

const mpClient = new MercadoPagoConfig({ accessToken: mpAccessToken });

mongoose.connect(mongoUri)
  .then(() => console.log('Conexão com o MongoDB estabelecida com sucesso!'))
  .catch((error) => console.error('Erro ao conectar com o MongoDB:', error));

// --- Rota do Webhook do WhatsApp ---
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

    if (clientInDb.isAdmin && userMessage.startsWith('/')) {
      console.log(`Comando de admin recebido: ${userMessage}`);
      const parts = userMessage.split(' ');
      const command = parts[0].toLowerCase();
      const commandBody = parts.slice(1).join(' ');

      if (command === '/listar') {
        const appointments = await Appointment.find({}).populate('client');
        if (appointments.length === 0) {
          responseBody = 'Nenhum agendamento encontrado.';
        } else {
          responseBody = '📅 Agendamentos Encontrados:\n\n';
          appointments.forEach(apt => {
            const localDate = utcToZonedTime(apt.appointmentDate, 'America/Sao_Paulo');
            const formattedDate = format(localDate, 'dd/MM/yyyy \'às\' HH:mm');
            responseBody += `Cliente: ${apt.client.profileName}\nData: ${formattedDate}\nStatus: ${apt.status}\n---\n`;
          });
        }
      } else if (command === '/novaturma') {
        const className = commandBody;
        if (!className) {
          responseBody = 'Uso incorreto. Formato: /novaturma <Nome da Turma>';
        } else {
          const existingClass = await Class.findOne({ name: className });
          if (existingClass) {
            responseBody = `A turma "${className}" já existe.`;
          } else {
            const newClass = new Class({ name: className });
            await newClass.save();
            responseBody = `✅ Turma "${className}" criada com sucesso!`;
          }
        }
      } else if (command === '/presenca') {
        const [className, clientNameToRegister] = commandBody.split(':').map(s => s.trim());
        if (!className || !clientNameToRegister) {
          responseBody = 'Uso incorreto. Formato: /presenca <Nome da Turma> : <Nome do Cliente>';
        } else {
          const classToAttend = await Class.findOne({ name: className });
          const clientToRegister = await Client.findOne({ profileName: clientNameToRegister });
          if (!classToAttend) {
            responseBody = `Erro: A turma "${className}" não foi encontrada.`;
          } else if (!clientToRegister) {
            responseBody = `Erro: O cliente "${clientNameToRegister}" não foi encontrado.`;
          } else {
            const newAttendance = new Attendance({ client: clientToRegister._id, class: classToAttend._id });
            await newAttendance.save();
            responseBody = `✅ Presença registrada para ${clientToRegister.profileName} na turma ${classToAttend.name}.`;
          }
        }
      } else {
        responseBody = 'Comando de admin não reconhecido.';
      }

    } else if (clientInDb.conversationState === 'awaiting_date') {
      const parsedDate = parse(userMessage, "dd/MM/yyyy 'às' HH:mm", new Date());
      if (isValid(parsedDate)) {
        const newAppointment = new Appointment({ client: clientInDb._id, appointmentDate: fromZonedTime(parsedDate, 'America/Sao_Paulo') });
        await newAppointment.save();
        console.log('Novo agendamento salvo!');

        const preference = new Preference(mpClient);
        const mpResponse = await preference.create({
          body: {
            items: [{
              id: newAppointment._id.toString(),
              title: 'Agendamento de Serviço',
              quantity: 1,
              currency_id: 'BRL',
              unit_price: 50.00,
            }],
            payer: { name: profileName },
            external_reference: newAppointment._id.toString(),
            notification_url: `${serverUrl}/mp-webhook`,
          }
        });
        
        const paymentLink = mpResponse.init_point;
        console.log('Link de pagamento gerado:', paymentLink);
        responseBody = `Agendamento pré-confirmado! Para confirmar, realize o pagamento no link a seguir: ${paymentLink}`;
        
        clientInDb.conversationState = 'idle';
        await clientInDb.save();
      } else {
        responseBody = "Formato de data inválido. Tente novamente (DD/MM/AAAA às HH:MM).";
      }

    } else {
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
    console.error('Ocorreu um erro no webhook do WhatsApp:', error);
    responseBody = 'Ocorreu um erro ao processar sua mensagem. Tente novamente.';
  }
  
  twilioClient.messages
    .create({ body: responseBody, from: req.body.To, to: sender });

  res.status(200).send();
});


// --- NOVA ROTA: WEBHOOK DO MERCADO PAGO ---
app.post('/mp-webhook', async (req, res) => {
  console.log('--- Notificação do Mercado Pago Recebida ---');
  console.log('Query:', req.query);
  console.log('Body:', req.body);

  const topic = req.query.topic || req.body.topic;

  try {
    if (topic === 'payment') {
      const paymentId = req.query.id || req.body.data.id;
      console.log('Processando pagamento ID:', paymentId);
      
      const paymentClient = new Payment(mpClient);
      const payment = await paymentClient.get({ id: paymentId });
      
      console.log('Detalhes do pagamento:', payment);

      const appointmentId = payment.external_reference;
      
      if (payment.status === 'approved') {
        await Appointment.findByIdAndUpdate(appointmentId, { status: 'confirmed' });
        console.log(`✅ Agendamento ${appointmentId} confirmado!`);
      } else if (payment.status === 'cancelled' || payment.status === 'rejected') {
        await Appointment.findByIdAndUpdate(appointmentId, { status: 'cancelled' });
        console.log(`❌ Agendamento ${appointmentId} cancelado ou falhou.`);
      }
    }
  } catch (error) {
    console.error('Erro ao processar webhook do Mercado Pago:', error);
  }

  res.status(200).send();
});


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${3000}`);
});