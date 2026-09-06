require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db-postgres');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// ROTA DE TESTE
// ==========================================
app.get('/status', (req, res) => {
  res.json({ status: 'API online com PostgreSQL!' });
});

// ==========================================
// USUÁRIOS
// ==========================================

// Listar todos os usuários
app.get('/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

// Atualizar usuário
app.put('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, email, senha, estabelecimentoId, cargo, ativo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE usuarios 
       SET nome = $1, email = $2, senha = $3, estabelecimento_id = $4, cargo = $5, ativo = $6
       WHERE id = $7 RETURNING *`,
      [nome, email, senha, estabelecimentoId, cargo, ativo, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
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
// PENDENTES (Cadastros aguardando aprovação)
// ==========================================

// Listar pendentes
app.get('/pendentes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE ativo = false');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar pendente
app.post('/pendentes', async (req, res) => {
  const { nome, email, senha, estabelecimentoId, cargo } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO usuarios (nome, email, senha, estabelecimento_id, cargo, ativo) 
       VALUES ($1, $2, $3, $4, $5, false) RETURNING *`,
      [nome, email, senha, estabelecimentoId, cargo]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
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
// INICIAR SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Rotas disponíveis:`);
  console.log(`   GET  /status`);
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
});