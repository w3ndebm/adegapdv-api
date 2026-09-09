require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db-postgres');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// CRIAÇÃO AUTOMÁTICA DAS TABELAS
// ==========================================

async function criarTabelas() {
  const client = await pool.connect();
  try {
    console.log('🔄 Criando tabelas...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        estabelecimento_id INTEGER,
        cargo VARCHAR(50) NOT NULL,
        ativo BOOLEAN DEFAULT true,
        criado_por INTEGER,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela "usuarios" criada/verificada');

    await client.query(`
      CREATE TABLE IF NOT EXISTS estabelecimentos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cnpj VARCHAR(20),
        endereco TEXT,
        telefone VARCHAR(20),
        plano VARCHAR(50) DEFAULT 'basico',
        ativo BOOLEAN DEFAULT true,
        data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        configuracao JSONB
      )
    `);
    console.log('✅ Tabela "estabelecimentos" criada/verificada');

    await client.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id SERIAL PRIMARY KEY,
        estabelecimento_id INTEGER NOT NULL,
        nome VARCHAR(255) NOT NULL,
        categoria VARCHAR(100),
        custo DECIMAL(10,2),
        preco DECIMAL(10,2),
        estoque INTEGER DEFAULT 0,
        imagem TEXT,
        FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabela "produtos" criada/verificada');

    await client.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        estabelecimento_id INTEGER NOT NULL,
        data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        operador VARCHAR(255),
        tipo_consumo VARCHAR(50),
        itens JSONB,
        total DECIMAL(10,2),
        status_pagamento VARCHAR(50),
        forma_pagamento VARCHAR(50),
        valor_recebido DECIMAL(10,2),
        troco DECIMAL(10,2),
        FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabela "pedidos" criada/verificada');

    await client.query(`
      CREATE TABLE IF NOT EXISTS comandas (
        id SERIAL PRIMARY KEY,
        estabelecimento_id INTEGER NOT NULL,
        num_comanda INTEGER NOT NULL,
        num_mesa INTEGER,
        identificacao VARCHAR(255),
        itens JSONB,
        narguile BOOLEAN DEFAULT false,
        tempo_total_minutos INTEGER,
        tempo_restante INTEGER,
        FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabela "comandas" criada/verificada');

    await client.query(`
      CREATE TABLE IF NOT EXISTS movimentacoes (
        id SERIAL PRIMARY KEY,
        estabelecimento_id INTEGER NOT NULL,
        data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tipo VARCHAR(50),
        valor DECIMAL(10,2),
        motivo TEXT,
        operador VARCHAR(255),
        FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabela "movimentacoes" criada/verificada');

    await client.query(`
      CREATE TABLE IF NOT EXISTS fechamentos (
        id SERIAL PRIMARY KEY,
        estabelecimento_id INTEGER NOT NULL,
        data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        operador VARCHAR(255),
        valor_contado DECIMAL(10,2),
        FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabela "fechamentos" criada/verificada');

    await client.query(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        id SERIAL PRIMARY KEY,
        estabelecimento_id INTEGER NOT NULL,
        chave VARCHAR(100),
        valor JSONB,
        FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabela "configuracoes" criada/verificada');

    console.log('✅ Todas as tabelas foram criadas/verificadas com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
  } finally {
    client.release();
  }
}

// ==========================================
// ROTA DE TESTE
// ==========================================

app.get('/status', (req, res) => {
  res.json({ status: 'API online com PostgreSQL!' });
});

// ==========================================
// ROTA PARA CRIAR TABELAS (VIA GET)
// ==========================================

app.get('/criar-tabelas', async (req, res) => {
  const client = await pool.connect();
  try {
    console.log('🔄 Criando tabelas via rota...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        estabelecimento_id INTEGER,
        cargo VARCHAR(50) NOT NULL,
        ativo BOOLEAN DEFAULT true,
        criado_por INTEGER,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS estabelecimentos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cnpj VARCHAR(20),
        endereco TEXT,
        telefone VARCHAR(20),
        plano VARCHAR(50) DEFAULT 'basico',
        ativo BOOLEAN DEFAULT true,
        data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        configuracao JSONB
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id SERIAL PRIMARY KEY,
        estabelecimento_id INTEGER NOT NULL,
        nome VARCHAR(255) NOT NULL,
        categoria VARCHAR(100),
        custo DECIMAL(10,2),
        preco DECIMAL(10,2),
        estoque INTEGER DEFAULT 0,
        imagem TEXT,
        FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id) ON DELETE CASCADE
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        estabelecimento_id INTEGER NOT NULL,
        data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        operador VARCHAR(255),
        tipo_consumo VARCHAR(50),
        itens JSONB,
        total DECIMAL(10,2),
        status_pagamento VARCHAR(50),
        forma_pagamento VARCHAR(50),
        valor_recebido DECIMAL(10,2),
        troco DECIMAL(10,2),
        FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id) ON DELETE CASCADE
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS comandas (
        id SERIAL PRIMARY KEY,
        estabelecimento_id INTEGER NOT NULL,
        num_comanda INTEGER NOT NULL,
        num_mesa INTEGER,
        identificacao VARCHAR(255),
        itens JSONB,
        narguile BOOLEAN DEFAULT false,
        tempo_total_minutos INTEGER,
        tempo_restante INTEGER,
        FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id) ON DELETE CASCADE
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS movimentacoes (
        id SERIAL PRIMARY KEY,
        estabelecimento_id INTEGER NOT NULL,
        data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tipo VARCHAR(50),
        valor DECIMAL(10,2),
        motivo TEXT,
        operador VARCHAR(255),
        FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id) ON DELETE CASCADE
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS fechamentos (
        id SERIAL PRIMARY KEY,
        estabelecimento_id INTEGER NOT NULL,
        data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        operador VARCHAR(255),
        valor_contado DECIMAL(10,2),
        FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id) ON DELETE CASCADE
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        id SERIAL PRIMARY KEY,
        estabelecimento_id INTEGER NOT NULL,
        chave VARCHAR(100),
        valor JSONB,
        FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id) ON DELETE CASCADE
      )
    `);

    res.json({ success: true, message: '✅ Todas as tabelas foram criadas com sucesso!' });

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// ==========================================
// USUÁRIOS
// ==========================================

// Listar todos os usuários
app.get('/usuarios', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        nome,
        email,
        senha,
        estabelecimento_id AS "estabelecimentoId",
        cargo,
        ativo,
        criado_por AS "criadoPor"
      FROM usuarios
      ORDER BY id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Buscar usuário por ID
app.get('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar usuário
app.post('/usuarios', async (req, res) => {
  const { nome, email, senha, estabelecimentoId, cargo, ativo, criadoPor } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO usuarios (nome, email, senha, estabelecimento_id, cargo, ativo, criado_por) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nome, email, senha, estabelecimentoId, cargo, ativo !== undefined ? ativo : true, criadoPor || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Erro ao criar usuário:', err);
    res.status(500).json({ error: err.message });
  }
});

// Atualizar usuário (CORRIGIDO - preserva valores existentes)
app.put('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, email, senha, estabelecimentoId, cargo, ativo } = req.body;
  
  try {
    // Buscar o usuário existente
    const resultExistente = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    
    if (resultExistente.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const user = resultExistente.rows[0];
    
    // 🔥 IMPORTANTE: Preservar valores existentes se não forem fornecidos
    const nomeFinal = nome !== undefined ? nome : user.nome;
    const emailFinal = email !== undefined ? email : user.email;
    const senhaFinal = senha !== undefined ? senha : user.senha;
    const estabelecimentoIdFinal = estabelecimentoId !== undefined ? estabelecimentoId : user.estabelecimento_id;
    const cargoFinal = cargo !== undefined ? cargo : user.cargo;
    const ativoFinal = ativo !== undefined ? ativo : user.ativo;
    
    const result = await pool.query(
      `UPDATE usuarios 
       SET nome = $1, 
           email = $2, 
           senha = $3, 
           estabelecimento_id = $4, 
           cargo = $5, 
           ativo = $6
       WHERE id = $7 
       RETURNING *`,
      [nomeFinal, emailFinal, senhaFinal, estabelecimentoIdFinal, cargoFinal, ativoFinal, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Erro ao atualizar usuário:', err);
    res.status(500).json({ error: err.message });
  }
});

// Deletar usuário
app.delete('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ESTABELECIMENTOS
// ==========================================

// Listar todos os estabelecimentos
app.get('/estabelecimentos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM estabelecimentos ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar estabelecimento por ID
app.get('/estabelecimentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM estabelecimentos WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Estabelecimento não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar estabelecimento
app.post('/estabelecimentos', async (req, res) => {
  const { nome, cnpj, endereco, telefone, plano, ativo, configuracao } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO estabelecimentos (nome, cnpj, endereco, telefone, plano, ativo, configuracao) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nome, cnpj, endereco, telefone, plano, ativo !== undefined ? ativo : true, configuracao || {}]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar estabelecimento
app.put('/estabelecimentos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, cnpj, endereco, telefone, plano, ativo, configuracao } = req.body;
  try {
    const result = await pool.query(
      `UPDATE estabelecimentos 
       SET nome = $1, cnpj = $2, endereco = $3, telefone = $4, plano = $5, ativo = $6, configuracao = $7
       WHERE id = $8 RETURNING *`,
      [nome, cnpj, endereco, telefone, plano, ativo, configuracao, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Estabelecimento não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar estabelecimento
app.delete('/estabelecimentos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM estabelecimentos WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Estabelecimento não encontrado' });
    }
    res.json({ message: 'Estabelecimento deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PENDENTES
// ==========================================

// Listar pendentes
app.get('/pendentes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        nome,
        email,
        senha,
        estabelecimento_id AS "estabelecimentoId",
        cargo,
        ativo,
        criado_por AS "criadoPor"
      FROM usuarios
      WHERE ativo = false
      ORDER BY id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar pendentes:', error);
    res.status(500).json({ error: 'Erro ao buscar pendentes' });
  }
});

// Criar pendente
app.post('/pendentes', async (req, res) => {
  const { nome, email, senha, estabelecimentoId, cargo } = req.body;
  try {
    const cargoFinal = cargo || 'cliente';
    const estabelecimentoFinal = estabelecimentoId || null;
    
    const result = await pool.query(
      `INSERT INTO usuarios (nome, email, senha, estabelecimento_id, cargo, ativo) 
       VALUES ($1, $2, $3, $4, $5, false) RETURNING *`,
      [nome, email, senha, estabelecimentoFinal, cargoFinal]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Erro ao criar pendente:', err);
    res.status(500).json({ error: err.message });
  }
});

// Deletar pendente
app.delete('/pendentes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM usuarios WHERE id = $1 AND ativo = false RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pendente não encontrado' });
    }
    res.json({ message: 'Pendente removido com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// LOGIN (UMA ÚNICA ROTA - SEM DUPLICAÇÃO)
// ==========================================

app.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    console.log('🔐 Tentativa de login:', email);

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        error: 'E-mail e senha são obrigatórios'
      });
    }

    const result = await pool.query(`
      SELECT
        id,
        nome,
        email,
        senha,
        estabelecimento_id AS "estabelecimentoId",
        cargo,
        ativo,
        criado_por AS "criadoPor"
      FROM usuarios
      WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
      LIMIT 1
    `, [email]);

    if (result.rows.length === 0) {
      console.log('❌ Usuário não encontrado:', email);
      return res.status(401).json({
        success: false,
        error: 'Usuário ou senha incorretos'
      });
    }

    const usuario = result.rows[0];

    console.log('👤 Usuário encontrado:', usuario.nome);
    console.log('🏢 Estabelecimento:', usuario.estabelecimentoId);
    console.log('👔 Cargo:', usuario.cargo);
    console.log('✅ Ativo:', usuario.ativo);

    if (!usuario.ativo) {
      return res.status(403).json({
        success: false,
        error: 'Usuário ainda não foi aprovado'
      });
    }

    if (String(usuario.senha) !== String(senha)) {
      console.log('❌ Senha incorreta para:', email);
      return res.status(401).json({
        success: false,
        error: 'Usuário ou senha incorretos'
      });
    }

    delete usuario.senha;

    console.log('✅ LOGIN REALIZADO COM SUCESSO:', usuario.nome);

    res.json({
      success: true,
      usuario: usuario
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno ao realizar login'
    });
  }
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

const PORT = process.env.PORT || 3000;

criarTabelas().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Rotas disponíveis:`);
    console.log(`   GET  /status`);
    console.log(`   GET  /criar-tabelas`);
    console.log(`   GET  /usuarios`);
    console.log(`   POST /usuarios`);
    console.log(`   PUT  /usuarios/:id`);
    console.log(`   DELETE /usuarios/:id`);
    console.log(`   GET  /estabelecimentos`);
    console.log(`   POST /estabelecimentos`);
    console.log(`   PUT  /estabelecimentos/:id`);
    console.log(`   DELETE /estabelecimentos/:id`);
    console.log(`   GET  /pendentes`);
    console.log(`   POST /pendentes`);
    console.log(`   DELETE /pendentes/:id`);
    console.log(`   POST /login`);
  });
});
