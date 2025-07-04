// roteiro-storage.js - Sistema de armazenamento local

class RoteiroStorage {
  constructor() {
    this.storageKey = 'roteiros-turisticos';
    this.favoritosKey = 'favoritos-locais';
    this.configKey = 'roteiro-config';
    this.cache = Utils.criarCache(300000); // 5 minutos
    
    this.init();
  }

  init() {
    // Verificar suporte ao localStorage
    if (!this.verificarSuporte()) {
      console.warn('⚠️ localStorage não suportado');
      return;
    }

    // Migrar dados antigos se necessário
    this.migrarDados();
    
    debug('💾 Sistema de armazenamento inicializado');
  }

  verificarSuporte() {
    try {
      const teste = '__storage_test__';
      localStorage.setItem(teste, teste);
      localStorage.removeItem(teste);
      return true;
    } catch (e) {
      return false;
    }
  }

  // === ROTEIROS ===

  salvarRoteiro(roteiro) {
    try {
      const roteiros = this.obterRoteiros();
      const novoRoteiro = {
        id: Utils.gerarId(),
        ...roteiro,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
        versao: '1.0'
      };
      
      roteiros.push(novoRoteiro);
      this.salvarDados(this.storageKey, roteiros);
      
      // Limpar cache
      this.cache.delete('roteiros');
      
      debug('💾 Roteiro salvo:', novoRoteiro.id);
      return novoRoteiro;
    } catch (error) {
      console.error('Erro ao salvar roteiro:', error);
      throw new Error('Não foi possível salvar o roteiro');
    }
  }

  obterRoteiros() {
    try {
      // Verificar cache primeiro
      const cached = this.cache.get('roteiros');
      if (cached) return cached;
      
      const roteiros = this.obterDados(this.storageKey, []);
      
      // Salvar no cache
      this.cache.set('roteiros', roteiros);
      
      return roteiros;
    } catch (error) {
      console.error('Erro ao obter roteiros:', error);
      return [];
    }
  }

  obterRoteiroPorId(id) {
    const roteiros = this.obterRoteiros();
    return roteiros.find(r => r.id === id);
  }

  atualizarRoteiro(id, dadosAtualizados) {
    try {
      const roteiros = this.obterRoteiros();
      const index = roteiros.findIndex(r => r.id === id);
      
      if (index === -1) {
        throw new Error('Roteiro não encontrado');
      }
      
      roteiros[index] = {
        ...roteiros[index],
        ...dadosAtualizados,
        dataAtualizacao: new Date().toISOString()
      };
      
      this.salvarDados(this.storageKey, roteiros);
      this.cache.delete('roteiros');
      
      debug('💾 Roteiro atualizado:', id);
      return roteiros[index];
    } catch (error) {
      console.error('Erro ao atualizar roteiro:', error);
      throw error;
    }
  }

  deletarRoteiro(id) {
    try {
      const roteiros = this.obterRoteiros();
      const novosRoteiros = roteiros.filter(r => r.id !== id);
      
      this.salvarDados(this.storageKey, novosRoteiros);
      this.cache.delete('roteiros');
      
      debug('💾 Roteiro deletado:', id);
      return true;
    } catch (error) {
      console.error('Erro ao deletar roteiro:', error);
      throw new Error('Não foi possível deletar o roteiro');
    }
  }

  // === FAVORITOS ===

  adicionarFavorito(local) {
    try {
      const favoritos = this.obterFavoritos();
      
      // Verificar se já existe
      if (favoritos.find(f => f.id === local.id)) {
        debug('💾 Local já está nos favoritos:', local.id);
        return false;
      }
      
      const novoFavorito = {
        ...local,
        id: local.id || Utils.gerarId(),
        dataAdicao: new Date().toISOString()
      };
      
      favoritos.push(novoFavorito);
      this.salvarDados(this.favoritosKey, favoritos);
      this.cache.delete('favoritos');
      
      debug('💾 Favorito adicionado:', novoFavorito.id);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar favorito:', error);
      throw new Error('Não foi possível adicionar aos favoritos');
    }
  }

  obterFavoritos() {
    try {
      const cached = this.cache.get('favoritos');
      if (cached) return cached;
      
      const favoritos = this.obterDados(this.favoritosKey, []);
      this.cache.set('favoritos', favoritos);
      
      return favoritos;
    } catch (error) {
      console.error('Erro ao obter favoritos:', error);
      return [];
    }
  }

  removerFavorito(localId) {
    try {
      const favoritos = this.obterFavoritos();
      const novosFavoritos = favoritos.filter(f => f.id !== localId);
      
      this.salvarDados(this.favoritosKey, novosFavoritos);
      this.cache.delete('favoritos');
      
      debug('💾 Favorito removido:', localId);
      return true;
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      throw new Error('Não foi possível remover dos favoritos');
    }
  }

  isFavorito(localId) {
    const favoritos = this.obterFavoritos();
    return favoritos.some(f => f.id === localId);
  }

  // === CONFIGURAÇÕES ===

  salvarConfiguracao(config) {
    try {
      const configAtual = this.obterConfiguracao();
      const novaConfig = {
        ...configAtual,
        ...config,
        dataAtualizacao: new Date().toISOString()
      };
      
      this.salvarDados(this.configKey, novaConfig);
      this.cache.delete('config');
      
      debug('💾 Configuração salva');
      return novaConfig;
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      throw new Error('Não foi possível salvar a configuração');
    }
  }

  obterConfiguracao() {
    try {
      const cached = this.cache.get('config');
      if (cached) return cached;
      
      const config = this.obterDados(this.configKey, {
        tema: 'claro',
        idioma: 'pt-BR',
        unidadeMoeda: 'BRL',
        unidadeDistancia: 'km',
        notificacoes: true,
        localizacaoAutomatica: false
      });
      
      this.cache.set('config', config);
      return config;
    } catch (error) {
      console.error('Erro ao obter configuração:', error);
      return {};
    }
  }

  // === ESTATÍSTICAS ===

  obterEstatisticas() {
    try {
      const roteiros = this.obterRoteiros();
      const favoritos = this.obterFavoritos();
      
      const stats = {
        totalRoteiros: roteiros.length,
        totalFavoritos: favoritos.length,
        roteirosPorTipo: this.contarPorTipo(roteiros),
        destinosMaisVisitados: this.contarDestinos(roteiros),
        ultimaAtividade: this.obterUltimaAtividade(roteiros),
        espacoUtilizado: this.calcularEspacoUtilizado()
      };
      
      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {};
    }
  }

  contarPorTipo(roteiros) {
    const tipos = {};
    roteiros.forEach(roteiro => {
      const tipo = roteiro.tipo || 'outros';
      tipos[tipo] = (tipos[tipo] || 0) + 1;
    });
    return tipos;
  }

  contarDestinos(roteiros) {
    const destinos = {};
    roteiros.forEach(roteiro => {
      const destino = roteiro.destino;
      if (destino) {
        destinos[destino] = (destinos[destino] || 0) + 1;
      }
    });
    
    return Object.entries(destinos)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([destino, count]) => ({ destino, count }));
  }

  obterUltimaAtividade(roteiros) {
    if (roteiros.length === 0) return null;
    
    const ultimoRoteiro = roteiros.reduce((ultimo, atual) => {
      const dataAtual = new Date(atual.dataAtualizacao || atual.dataCriacao);
      const dataUltimo = new Date(ultimo.dataAtualizacao || ultimo.dataCriacao);
      return dataAtual > dataUltimo ? atual : ultimo;
    });
    
    return {
      tipo: 'roteiro_criado',
      data: ultimoRoteiro.dataAtualizacao || ultimoRoteiro.dataCriacao,
      destino: ultimoRoteiro.destino
    };
  }

  calcularEspacoUtilizado() {
    try {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length;
        }
      }
      return {
        bytes: total,
        kb: (total / 1024).toFixed(2),
        mb: (total / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      return { bytes: 0, kb: 0, mb: 0 };
    }
  }

  // === BACKUP E RESTORE ===

  exportarDados() {
    try {
      const dados = {
        roteiros: this.obterRoteiros(),
        favoritos: this.obterFavoritos(),
        configuracao: this.obterConfiguracao(),
        versao: '1.0',
        dataExportacao: new Date().toISOString()
      };
      
      const json = JSON.stringify(dados, null, 2);
      const nomeArquivo = `roteiro-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      Utils.downloadArquivo(json, nomeArquivo, 'application/json');
      
      debug('💾 Dados exportados');
      return true;
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      throw new Error('Não foi possível exportar os dados');
    }
  }

  async importarDados(arquivo) {
    try {
      const texto = await this.lerArquivo(arquivo);
      const dados = JSON.parse(texto);
      
      // Validar estrutura
      if (!this.validarBackup(dados)) {
        throw new Error('Arquivo de backup inválido');
      }
      
      // Confirmar importação
      const confirmar = confirm(
        'Isso irá substituir todos os dados atuais. Deseja continuar?'
      );
      
      if (!confirmar) return false;
      
      // Importar dados
      if (dados.roteiros) {
        this.salvarDados(this.storageKey, dados.roteiros);
      }
      
      if (dados.favoritos) {
        this.salvarDados(this.favoritosKey, dados.favoritos);
      }
      
      if (dados.configuracao) {
        this.salvarDados(this.configKey, dados.configuracao);
      }
      
      // Limpar cache
      this.cache.clear();
      
      debug('💾 Dados importados');
      return true;
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      throw new Error('Não foi possível importar os dados');
    }
  }

  lerArquivo(arquivo) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(arquivo);
    });
  }

  validarBackup(dados) {
    return dados && 
           typeof dados === 'object' && 
           dados.versao && 
           (dados.roteiros || dados.favoritos || dados.configuracao);
  }

  // === LIMPEZA ===

  limparDados() {
    try {
      const confirmar = confirm(
        'Isso irá apagar todos os roteiros e favoritos. Deseja continuar?'
      );
      
      if (!confirmar) return false;
      
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.favoritosKey);
      localStorage.removeItem(this.configKey);
      
      this.cache.clear();
      
      debug('💾 Dados limpos');
      return true;
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      throw new Error('Não foi possível limpar os dados');
    }
  }

  limparCache() {
    this.cache.clear();
    debug('💾 Cache limpo');
  }

  // === MÉTODOS PRIVADOS ===

  salvarDados(chave, dados) {
    try {
      const json = JSON.stringify(dados);
      localStorage.setItem(chave, json);
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('Armazenamento local cheio');
      }
      throw error;
    }
  }

  obterDados(chave, padrao = null) {
    try {
      const dados = localStorage.getItem(chave);
      return dados ? JSON.parse(dados) : padrao;
    } catch (error) {
      console.error('Erro ao obter dados:', error);
      return padrao;
    }
  }

  migrarDados() {
    // Implementar migrações futuras se necessário
    const versaoAtual = '1.0';
    const versaoArmazenada = this.obterDados('versao-dados', '1.0');
    
    if (versaoArmazenada !== versaoAtual) {
      debug('💾 Migração de dados necessária');
      // Implementar lógica de migração
      this.salvarDados('versao-dados', versaoAtual);
    }
  }
}

// Exportar classe
if (typeof window !== 'undefined') {
  window.RoteiroStorage = RoteiroStorage;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RoteiroStorage;
}
