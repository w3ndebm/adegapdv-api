(async function sincronizarDados() {
  console.log('🔄 Iniciando sincronização...');

  const usuariosLocal = JSON.parse(localStorage.getItem('mt_usuarios') || '[]');
  const estabelecimentosLocal = JSON.parse(localStorage.getItem('mt_estabelecimentos') || '[]');

  for (const estab of estabelecimentosLocal) {
    try {
      await fetch('https://adegapdv-api.onrender.com/estabelecimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(estab)
      });
      console.log(`✅ Estabelecimento "${estab.nome}" salvo`);
    } catch (e) {
      console.error(`❌ Erro ao salvar "${estab.nome}"`);
    }
  }

  for (const user of usuariosLocal) {
    try {
      await fetch('https://adegapdv-api.onrender.com/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      console.log(`✅ Usuário "${user.nome}" salvo`);
    } catch (e) {
      console.error(`❌ Erro ao salvar "${user.nome}"`);
    }
  }

  console.log('✅ Sincronização concluída!');
})();
