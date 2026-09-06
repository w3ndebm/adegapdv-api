require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db-postgres');

const app = express();
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/status', (req, res) => {
  res.json({ status: 'API online com PostgreSQL!' });
});

// Cadastrar usuário pendente
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

// Listar usuários pendentes
app.get('/pendentes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE ativo = false');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));