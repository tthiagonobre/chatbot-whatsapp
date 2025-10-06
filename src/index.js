// Importa o framework Express
const express = require('express');

// Cria uma instância do aplicativo Express
const app = express();

// **NOVO**: Adiciona um middleware para o Express entender dados de formulário
// A Twilio envia os dados nesse formato
app.use(express.urlencoded({ extended: true }));

// Define a porta em que o servidor vai rodar. 3000 é um padrão comum.
const PORT = 3000;

// Rota principal para testar se o servidor está funcionando
app.get('/', (req, res) => {
  res.send('Servidor do Chatbot está no ar!');
});

// **NOVO**: Cria a rota do Webhook que vai receber as mensagens da Twilio
app.post('/webhook', (req, res) => {
  console.log('Mensagem recebida da Twilio!');
  console.log(req.body); // Mostra todos os dados que a Twilio enviou

  // Por enquanto, não vamos responder nada, apenas registrar a mensagem.
  res.status(200).send();
});

// Inicia o servidor e o faz "escutar" por requisições na porta definida
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});