# Chatbot de Agendamento para WhatsApp

Este é um chatbot multifuncional para WhatsApp, desenvolvido para gerenciar agendamentos de clientes, processar pagamentos e oferecer ferramentas de administração via comandos. O projeto foi construído do zero, integrando diversas APIs e um banco de dados para criar uma solução robusta.

##  Funcionalidades

  - **✅ Respostas Automáticas:** Responde a palavras-chave pré-definidas (`ajuda`, `preço`, etc.).
  - **✅ Cadastro de Clientes:** Salva automaticamente o contato de novos clientes que enviam a primeira mensagem.
  - **✅ Sistema de Agendamento:** Conduz uma conversa de múltiplos passos para agendar um horário para o cliente.
  - **✅ Integração com Banco de Dados:** Utiliza MongoDB para persistir dados de clientes, agendamentos, turmas e presenças.
  - **✅ Painel de Administrador via Comandos:** Permite que usuários marcados como "admin" executem comandos especiais:
      - `/listar`: Lista todos os agendamentos salvos no banco de dados.
      - `/novaturma <nome>`: Cria uma nova turma.
      - `/presenca <turma> : <cliente>`: Registra a presença de um cliente em uma turma.
  - **✅ Geração de Pagamentos:** Após um agendamento bem-sucedido, gera e envia um link de pagamento exclusivo via Mercado Pago.

##  Tecnologias Utilizadas

  - **Backend:** [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/)
  - **Banco de Dados:** [MongoDB](https://www.mongodb.com/) com [Mongoose](https://mongoosejs.com/)
  - **API de WhatsApp:** [Twilio WhatsApp API](https://www.twilio.com/whatsapp)
  - **API de Pagamentos:** [Mercado Pago SDK](https://www.mercadopago.com.br/developers)
  - **Túnel de Desenvolvimento:** [Ngrok](https://ngrok.com/)
  - **Utilitários:** `dotenv`, `date-fns`, `date-fns-tz`

## ⚙️ Configuração e Instalação

Siga os passos abaixo para configurar e rodar o projeto localmente.

### Pré-requisitos

  - [Node.js](https://nodejs.org/) (versão LTS recomendada)
  - [Git](https://git-scm.com/)
  - Uma conta gratuita no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
  - Uma conta de testes na [Twilio](https://www.twilio.com/)
  - Uma conta de desenvolvedor no [Mercado Pago](https://www.mercadopago.com.br/developers)
  - [Ngrok](https://ngrok.com/) instalado e configurado com seu authtoken.

### Passos de Instalação

1.  **Clone o repositório:**

    ```bash
    git clone https://github.com/tthiagonobre/chatbot-whatsapp.git
    cd chatbot-whatsapp
    ```

2.  **Instale as dependências:**

    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo chamado `.env` na raiz do projeto e preencha com suas chaves de API, seguindo o modelo abaixo:

    ```
    # Credenciais do MongoDB Atlas
    MONGO_URI="sua_string_de_conexao_completa"

    # Credenciais da Twilio
    TWILIO_ACCOUNT_SID="seu_account_sid_da_twilio"
    TWILIO_AUTH_TOKEN="seu_auth_token_da_twilio"

    # Credenciais do Mercado Pago (Teste)
    MERCADO_PAGO_ACCESS_TOKEN="seu_access_token_de_teste_do_mp"
    ```

4.  **(Opcional) Popule o Banco de Dados:**
    Para cadastrar as palavras-chave iniciais (`ajuda`, `preço`, `horário`), execute o script `seed.js` uma vez:

    ```bash
    node seed.js
    ```

##  Executando a Aplicação

Para que o chatbot funcione, você precisa de **dois terminais** rodando simultaneamente na pasta do projeto.

1.  **Terminal 1: Inicie o Servidor Node.js**

    ```bash
    node src/index.js
    ```

    *Você deverá ver as mensagens de "Servidor rodando..." e "Conexão com o MongoDB...".*

2.  **Terminal 2: Inicie o Túnel Ngrok**
    Use o comando com o seu domínio estático que você criou.

    ```bash
    ngrok http 3000 --domain=seu-dominio-estatico.ngrok-free.dev
    ```

3.  **Configuração Final:**

      * Copie a URL `https` do Ngrok (ex: `https://seu-dominio-estatico.ngrok-free.dev`).
      * Cole essa URL no painel da Twilio, na configuração do Sandbox do WhatsApp, no campo **"WHEN A MESSAGE COMES IN"**, adicionando `/webhook` no final.
      * Salve a configuração na Twilio.

##  Comandos do Chatbot

### Para Clientes

  - `ajuda`: Lista os serviços disponíveis.
  - `preço`: Informa o valor do serviço.
  - `horário`: Informa o horário de funcionamento.
  - `agendar`: Inicia o fluxo de agendamento de um horário.

### Para Administradores

*(Apenas para usuários com `isAdmin: true` no banco de dados)*

  - `/listar`: Retorna uma lista de todos os agendamentos registrados.
  - `/novaturma <Nome da Turma>`: Cria uma nova turma no sistema.
  - `/presenca <Nome da Turma> : <Nome do Cliente>`: Registra a presença de um cliente em uma turma.

##  Próximos Passos (Melhorias Futuras)

  - [ ] Implementar o webhook do Mercado Pago para confirmar pagamentos e atualizar o status do agendamento de `pending` para `confirmed`.
  - [ ] Criar mais comandos de administrador (ex: `/cancelar_agendamento`).
  - [ ] Fazer o deploy da aplicação em um servidor na nuvem (ex: Render, Heroku) para que funcione 24/7.
  - [ ] Adicionar um comando de admin para promover outros usuários a administradores.