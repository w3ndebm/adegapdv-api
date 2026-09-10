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
    console.log('🔄 Verificando/criando tabelas...');

    // IMPORTANTE: este schema é compatível com as tabelas que você já criou no Supabase.
    await client.query(`
      CREATE TABLE IF NOT EXISTS estabelecimentos (
        id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        nome TEXT NOT NULL,
        cnpj TEXT,
        endereco TEXT,
        telefone TEXT,
        plano TEXT DEFAULT 'basico',
        total_mesas INT DEFAULT 10,
        total_comandas INT DEFAULT 30,
        ativo BOOLEAN DEFAULT TRUE,
        criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        cargo TEXT DEFAULT 'atendente',
        estabelecimento_id BIGINT REFERENCES estabelecimentos(id),
        ativo BOOLEAN DEFAULT TRUE,
        criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
      )
    `);

    // Tabelas operacionais. Só são criadas se ainda não existirem.
    await client.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        estabelecimento_id BIGINT NOT NULL REFERENCES estabelecimentos(id) ON DELETE CASCADE,
        nome TEXT NOT NULL,
        categoria TEXT,
        custo DECIMAL(10,2),
        preco DECIMAL(10,2),
        estoque INTEGER DEFAULT 0,
        imagem TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        estabelecimento_id BIGINT NOT NULL REFERENCES estabelecimentos(id) ON DELETE CASCADE,
        data TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        operador TEXT,
        tipo_consumo TEXT,
        itens JSONB,
        total DECIMAL(10,2),
        status_pagamento TEXT,
        forma_pagamento TEXT,
        valor_recebido DECIMAL(10,2),
        troco DECIMAL(10,2)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS comandas (
        id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        estabelecimento_id BIGINT NOT NULL REFERENCES estabelecimentos(id) ON DELETE CASCADE,
        num_comanda INTEGER NOT NULL,
        num_mesa INTEGER,
        identificacao TEXT,
        itens JSONB,
        narguile BOOLEAN DEFAULT FALSE,
        tempo_total_minutos INTEGER,
        tempo_restante INTEGER
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS movimentacoes (
        id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        estabelecimento_id BIGINT NOT NULL REFERENCES estabelecimentos(id) ON DELETE CASCADE,
        data TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        tipo TEXT,
        valor DECIMAL(10,2),
        motivo TEXT,
        operador TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS fechamentos (
        id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        estabelecimento_id BIGINT NOT NULL REFERENCES estabelecimentos(id) ON DELETE CASCADE,
        data TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        operador TEXT,
        valor_contado DECIMAL(10,2)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        estabelecimento_id BIGINT NOT NULL REFERENCES estabelecimentos(id) ON DELETE CASCADE,
        chave TEXT,
        valor JSONB
      )
    `);

    console.log('✅ Banco verificado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar/verificar tabelas:', error);
    throw error;
  } finally {
    client.release();
  }
}
// ==========================================
// ROTA DE TESTE
// ==========================================

app.get('/status', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS agora, current_database() AS banco');
    res.json({
      success: true,
      status: 'online',
      banco: 'conectado',
      database: result.rows[0].banco,
      horarioBanco: result.rows[0].agora
    });
  } catch (error) {
    console.error('❌ Status/banco:', error);
    res.status(500).json({
      success: false,
      status: 'online',
      banco: 'erro',
      error: error.message
    });
  }
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
        NULL::BIGINT AS "criadoPor",
        criado_em AS "criadoEm"
      FROM usuarios
      ORDER BY id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/usuarios/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id, nome, email, senha,
        estabelecimento_id AS "estabelecimentoId",
        cargo, ativo, criado_em AS "criadoEm"
      FROM usuarios
      WHERE id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/usuarios', async (req, res) => {
  try {
    const { nome, email, senha, estabelecimentoId, cargo, ativo } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    const result = await pool.query(`
      INSERT INTO usuarios
        (nome, email, senha, estabelecimento_id, cargo, ativo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id, nome, email, estabelecimento_id AS "estabelecimentoId",
        cargo, ativo, criado_em AS "criadoEm"
    `, [
      nome.trim(),
      email.trim().toLowerCase(),
      senha,
      estabelecimentoId || null,
      cargo || 'atendente',
      ativo !== undefined ? ativo : true
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);

    if (error.code === '23505') {
      return res.status(409).json({ error: 'Este email já está cadastrado' });
    }

    res.status(500).json({ error: error.message });
  }
});

app.put('/usuarios/:id', async (req, res) => {
  try {
    const existente = await pool.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [req.params.id]
    );

    if (existente.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = existente.rows[0];
    const { nome, email, senha, estabelecimentoId, cargo, ativo } = req.body;

    const result = await pool.query(`
      UPDATE usuarios
      SET
        nome = $1,
        email = $2,
        senha = $3,
        estabelecimento_id = $4,
        cargo = $5,
        ativo = $6
      WHERE id = $7
      RETURNING
        id, nome, email, estabelecimento_id AS "estabelecimentoId",
        cargo, ativo, criado_em AS "criadoEm"
    `, [
      nome !== undefined ? nome : user.nome,
      email !== undefined ? email.trim().toLowerCase() : user.email,
      senha !== undefined ? senha : user.senha,
      estabelecimentoId !== undefined ? estabelecimentoId : user.estabelecimento_id,
      cargo !== undefined ? cargo : user.cargo,
      ativo !== undefined ? ativo : user.ativo,
      req.params.id
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/usuarios/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM usuarios WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ success: true, message: 'Usuário deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ESTABELECIMENTOS
// ==========================================

app.get('/estabelecimentos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id, nome, cnpj, endereco, telefone, plano,
        total_mesas AS "totalMesas",
        total_comandas AS "totalComandas",
        ativo,
        criado_em AS "criadoEm"
      FROM estabelecimentos
      ORDER BY id
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/estabelecimentos/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id, nome, cnpj, endereco, telefone, plano,
        total_mesas AS "totalMesas",
        total_comandas AS "totalComandas",
        ativo,
        criado_em AS "criadoEm"
      FROM estabelecimentos
      WHERE id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Estabelecimento não encontrado' });
    }

    const e = result.rows[0];
    e.configuracao = {
      totalMesas: e.totalMesas || 10,
      totalComandas: e.totalComandas || 30,
      corTema: 'emerald'
    };

    res.json(e);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/estabelecimentos', async (req, res) => {
  try {
    const {
      nome,
      cnpj,
      endereco,
      telefone,
      plano,
      ativo,
      totalMesas,
      totalComandas,
      configuracao
    } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome do estabelecimento é obrigatório' });
    }

    const config = configuracao || {};

    const result = await pool.query(`
      INSERT INTO estabelecimentos
        (nome, cnpj, endereco, telefone, plano, total_mesas, total_comandas, ativo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id, nome, cnpj, endereco, telefone, plano,
        total_mesas AS "totalMesas",
        total_comandas AS "totalComandas",
        ativo,
        criado_em AS "criadoEm"
    `, [
      nome.trim(),
      cnpj || null,
      endereco || null,
      telefone || null,
      plano || 'basico',
      Number(config.totalMesas ?? totalMesas ?? 10),
      Number(config.totalComandas ?? totalComandas ?? 30),
      ativo !== undefined ? ativo : true
    ]);

    const estabelecimento = result.rows[0];
    estabelecimento.configuracao = {
      totalMesas: estabelecimento.totalMesas,
      totalComandas: estabelecimento.totalComandas,
      corTema: config.corTema || 'emerald'
    };

    res.status(201).json(estabelecimento);
  } catch (error) {
    console.error('❌ Erro ao criar estabelecimento:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/estabelecimentos/:id', async (req, res) => {
  try {
    const existente = await pool.query(
      'SELECT * FROM estabelecimentos WHERE id = $1',
      [req.params.id]
    );

    if (existente.rows.length === 0) {
      return res.status(404).json({ error: 'Estabelecimento não encontrado' });
    }

    const e = existente.rows[0];
    const body = req.body || {};
    const config = body.configuracao || {};

    const result = await pool.query(`
      UPDATE estabelecimentos
      SET
        nome = $1,
        cnpj = $2,
        endereco = $3,
        telefone = $4,
        plano = $5,
        total_mesas = $6,
        total_comandas = $7,
        ativo = $8
      WHERE id = $9
      RETURNING
        id, nome, cnpj, endereco, telefone, plano,
        total_mesas AS "totalMesas",
        total_comandas AS "totalComandas",
        ativo,
        criado_em AS "criadoEm"
    `, [
      body.nome !== undefined ? body.nome : e.nome,
      body.cnpj !== undefined ? body.cnpj : e.cnpj,
      body.endereco !== undefined ? body.endereco : e.endereco,
      body.telefone !== undefined ? body.telefone : e.telefone,
      body.plano !== undefined ? body.plano : e.plano,
      Number(config.totalMesas ?? body.totalMesas ?? e.total_mesas ?? 10),
      Number(config.totalComandas ?? body.totalComandas ?? e.total_comandas ?? 30),
      body.ativo !== undefined ? body.ativo : e.ativo,
      req.params.id
    ]);

    const estabelecimento = result.rows[0];
    estabelecimento.configuracao = {
      totalMesas: estabelecimento.totalMesas,
      totalComandas: estabelecimento.totalComandas,
      corTema: config.corTema || 'emerald'
    };

    res.json(estabelecimento);
  } catch (error) {
    console.error('❌ Erro ao atualizar estabelecimento:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/estabelecimentos/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM estabelecimentos WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Estabelecimento não encontrado' });
    }

    res.json({ success: true, message: 'Estabelecimento deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// PENDENTES
// ==========================================

app.get('/pendentes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id, nome, email, senha,
        estabelecimento_id AS "estabelecimentoId",
        cargo, ativo, criado_em AS "criadoEm"
      FROM usuarios
      WHERE ativo = FALSE
      ORDER BY id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar pendentes:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/pendentes', async (req, res) => {
  try {
    const { nome, email, senha, estabelecimentoId, cargo } = req.body;

    const result = await pool.query(`
      INSERT INTO usuarios
        (nome, email, senha, estabelecimento_id, cargo, ativo)
      VALUES ($1, $2, $3, $4, $5, FALSE)
      RETURNING id, nome, email, estabelecimento_id AS "estabelecimentoId", cargo, ativo
    `, [
      nome,
      email.trim().toLowerCase(),
      senha,
      estabelecimentoId || null,
      cargo || 'cliente'
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao criar pendente:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/pendentes/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM usuarios WHERE id = $1 AND ativo = FALSE RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pendente não encontrado' });
    }

    res.json({ success: true, message: 'Pendente removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// LOGIN
// ==========================================

// ======================================================
// LOGIN
// ======================================================
app.post('/login', async (req, res) => {
  try {
    let { email, senha } = req.body;

    email = String(email || '').trim().toLowerCase();
    senha = String(senha || '').trim();

    console.log('');
    console.log('======================================');
    console.log('🔐 TENTATIVA DE LOGIN');
    console.log('📧 Email:', email);
    console.log('======================================');

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        codigo: 'CAMPOS_OBRIGATORIOS',
        error: 'E-mail e senha são obrigatórios'
      });
    }

    // ==================================================
    // BUSCA SOMENTE NA TABELA USUARIOS
    // NÃO USA total_mesas
    // NÃO USA total_comandas
    // NÃO USA configuracao
    // NÃO USA criado_por
    // ==================================================

    const result = await pool.query(`
      SELECT
        id,
        nome,
        email,
        senha,
        estabelecimento_id AS "estabelecimentoId",
        cargo,
        ativo
      FROM usuarios
      WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
      LIMIT 1
    `, [email]);

    if (result.rows.length === 0) {

      console.log('❌ EMAIL NÃO ENCONTRADO');

      return res.status(401).json({
        success: false,
        codigo: 'EMAIL_NAO_ENCONTRADO',
        error: 'E-mail ou senha incorretos'
      });
    }

    const usuario = result.rows[0];

    console.log('✅ USUÁRIO ENCONTRADO');
    console.log('👤 Nome:', usuario.nome);
    console.log('📧 Email:', usuario.email);
    console.log('👔 Cargo:', usuario.cargo);
    console.log('🏢 Estabelecimento:', usuario.estabelecimentoId);
    console.log('🟢 Ativo:', usuario.ativo);

    // ==================================================
    // VERIFICA USUÁRIO ATIVO
    // ==================================================

    if (usuario.ativo !== true) {

      console.log('❌ USUÁRIO INATIVO');

      return res.status(403).json({
        success: false,
        codigo: 'USUARIO_INATIVO',
        error: 'Este usuário está desativado'
      });
    }

    // ==================================================
    // VERIFICA SENHA
    // ==================================================

    if (String(usuario.senha) !== senha) {

      console.log('❌ SENHA INCORRETA');

      return res.status(401).json({
        success: false,
        codigo: 'SENHA_INCORRETA',
        error: 'E-mail ou senha incorretos'
      });
    }

    // ==================================================
    // SUPERA ADMIN
    // ==================================================

    if (usuario.cargo === 'super_admin') {

      console.log('👑 LOGIN COMO SUPER ADMIN');

      delete usuario.senha;

      return res.json({
        success: true,
        usuario: {
          ...usuario,
          estabelecimentoNome: 'Administração do Sistema'
        }
      });
    }

    // ==================================================
    // USUÁRIO DE ESTABELECIMENTO
    // ==================================================

    let estabelecimentoNome = 'Estabelecimento';

    if (usuario.estabelecimentoId) {

      try {

        const estabelecimentoResult = await pool.query(`
          SELECT
            id,
            nome
          FROM estabelecimentos
          WHERE id = $1
          LIMIT 1
        `, [usuario.estabelecimentoId]);

        if (estabelecimentoResult.rows.length > 0) {
          estabelecimentoNome =
            estabelecimentoResult.rows[0].nome;
        }

      } catch (erroEstabelecimento) {

        console.warn(
          '⚠️ Não foi possível buscar estabelecimento:',
          erroEstabelecimento.message
        );

        // Não impede o login
        estabelecimentoNome = 'Estabelecimento';
      }
    }

    // ==================================================
    // REMOVE SENHA
    // ==================================================

    delete usuario.senha;

    // ==================================================
    // LOGIN REALIZADO
    // ==================================================

    console.log('======================================');
    console.log('✅ LOGIN REALIZADO COM SUCESSO');
    console.log('👤', usuario.nome);
    console.log('======================================');

    return res.json({
      success: true,

      usuario: {
        ...usuario,
        estabelecimentoNome
      }
    });

  } catch (error) {

    console.error('');
    console.error('======================================');
    console.error('❌ ERRO NO LOGIN');
    console.error(error);
    console.error('======================================');

    return res.status(500).json({
      success: false,
      codigo: 'ERRO_SERVIDOR',
      error: error.message
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
    console.log(`   GET  /debug/banco`);
  });
});