// filtros-roteiro.js - Sistema de filtros avançados

class FiltrosRoteiro {
  constructor() {
    this.filtros = {
      orcamento: 'todos',
      duracao: 'todos',
      acessibilidade: false,
      transporte: 'todos',
      idade: 'todos',
      interesses: [],
      clima: 'todos',
      epoca: 'todos',
      grupo: 'todos'
    };
    
    this.filtrosAtivos = new Set();
    this.callbacks = [];
    
    this.init();
  }

  init() {
    // Carregar filtros salvos
    this.carregarFiltrosSalvos();
    debug('🔍 Sistema de filtros inicializado');
  }

  // === GERENCIAMENTO DE FILTROS ===

  definirFiltro(chave, valor) {
    const valorAnterior = this.filtros[chave];
    this.filtros[chave] = valor;
    
    // Atualizar filtros ativos
    if (this.isFiltroAtivo(chave, valor)) {
      this.filtrosAtivos.add(chave);
    } else {
      this.filtrosAtivos.delete(chave);
    }
    
    // Salvar filtros
    this.salvarFiltros();
    
    // Notificar callbacks
    this.notificarMudanca(chave, valor, valorAnterior);
    
    debug('🔍 Filtro definido:', chave, valor);
  }

  obterFiltro(chave) {
    return this.filtros[chave];
  }

  obterFiltros() {
    return { ...this.filtros };
  }

  obterFiltrosAtivos() {
    const ativos = {};
    this.filtrosAtivos.forEach(chave => {
      ativos[chave] = this.filtros[chave];
    });
    return ativos;
  }

  limparFiltros() {
    const filtrosAnteriores = { ...this.filtros };
    
    this.filtros = {
      orcamento: 'todos',
      duracao: 'todos',
      acessibilidade: false,
      transporte: 'todos',
      idade: 'todos',
      interesses: [],
      clima: 'todos',
      epoca: 'todos',
      grupo: 'todos'
    };
    
    this.filtrosAtivos.clear();
    this.salvarFiltros();
    
    // Notificar mudança
    this.notificarMudanca('todos', null, filtrosAnteriores);
    
    debug('🔍 Filtros limpos');
  }

  // === INTERFACE DE FILTROS ===

  criarInterfaceFiltros() {
    return `
      <div class="filtros-avancados">
        <div class="filtros-header">
          <h3>🔍 Filtros Avançados</h3>
          <div class="filtros-actions">
            <button class="btn-filtro-limpar" onclick="window.filtros.limparFiltros()">
              Limpar Tudo
            </button>
            <span class="filtros-contador">${this.filtrosAtivos.size} filtro(s) ativo(s)</span>
          </div>
        </div>

        <div class="filtros-grid">
          ${this.criarFiltroOrcamento()}
          ${this.criarFiltroDuracao()}
          ${this.criarFiltroTransporte()}
          ${this.criarFiltroIdade()}
          ${this.criarFiltroGrupo()}
          ${this.criarFiltroClima()}
          ${this.criarFiltroEpoca()}
        </div>

        <div class="filtros-especiais">
          ${this.criarFiltroAcessibilidade()}
          ${this.criarFiltroInteresses()}
        </div>

        <div class="filtros-footer">
          <button class="btn-aplicar-filtros" onclick="window.filtros.aplicarFiltros()">
            <i data-lucide="filter"></i>
            Aplicar Filtros
          </button>
        </div>
      </div>
    `;
  }

  criarFiltroOrcamento() {
    return `
      <div class="filtro-grupo">
        <label for="filtro-orcamento">💰 Orçamento por pessoa/dia</label>
        <select id="filtro-orcamento" onchange="window.filtros.definirFiltro('orcamento', this.value)">
          <option value="todos" ${this.filtros.orcamento === 'todos' ? 'selected' : ''}>
            Todos os orçamentos
          </option>
          <option value="economico" ${this.filtros.orcamento === 'economico' ? 'selected' : ''}>
            Econômico (até R$ 100)
          </option>
          <option value="medio" ${this.filtros.orcamento === 'medio' ? 'selected' : ''}>
            Médio (R$ 100-300)
          </option>
          <option value="alto" ${this.filtros.orcamento === 'alto' ? 'selected' : ''}>
            Alto (R$ 300-500)
          </option>
          <option value="luxo" ${this.filtros.orcamento === 'luxo' ? 'selected' : ''}>
            Luxo (R$ 500+)
          </option>
        </select>
      </div>
    `;
  }

  criarFiltroDuracao() {
    return `
      <div class="filtro-grupo">
        <label for="filtro-duracao">⏱️ Duração da viagem</label>
        <select id="filtro-duracao" onchange="window.filtros.definirFiltro('duracao', this.value)">
          <option value="todos" ${this.filtros.duracao === 'todos' ? 'selected' : ''}>
            Qualquer duração
          </option>
          <option value="meio-dia" ${this.filtros.duracao === 'meio-dia' ? 'selected' : ''}>
            Meio dia
          </option>
          <option value="1-dia" ${this.filtros.duracao === '1-dia' ? 'selected' : ''}>
            1 dia
          </option>
          <option value="2-3-dias" ${this.filtros.duracao === '2-3-dias' ? 'selected' : ''}>
            2-3 dias
          </option>
          <option value="semana" ${this.filtros.duracao === 'semana' ? 'selected' : ''}>
            1 semana
          </option>
          <option value="quinzena" ${this.filtros.duracao === 'quinzena' ? 'selected' : ''}>
            2 semanas
          </option>
          <option value="mes" ${this.filtros.duracao === 'mes' ? 'selected' : ''}>
            1 mês ou mais
          </option>
        </select>
      </div>
    `;
  }

  criarFiltroTransporte() {
    return `
      <div class="filtro-grupo">
        <label for="filtro-transporte">🚗 Transporte preferido</label>
        <select id="filtro-transporte" onchange="window.filtros.definirFiltro('transporte', this.value)">
          <option value="todos" ${this.filtros.transporte === 'todos' ? 'selected' : ''}>
            Qualquer transporte
          </option>
          <option value="pe" ${this.filtros.transporte === 'pe' ? 'selected' : ''}>
            A pé
          </option>
          <option value="bicicleta" ${this.filtros.transporte === 'bicicleta' ? 'selected' : ''}>
            Bicicleta
          </option>
          <option value="publico" ${this.filtros.transporte === 'publico' ? 'selected' : ''}>
            Transporte público
          </option>
          <option value="carro" ${this.filtros.transporte === 'carro' ? 'selected' : ''}>
            Carro próprio
          </option>
          <option value="uber" ${this.filtros.transporte === 'uber' ? 'selected' : ''}>
            Uber/Taxi
          </option>
          <option value="aviao" ${this.filtros.transporte === 'aviao' ? 'selected' : ''}>
            Avião (viagens longas)
          </option>
        </select>
      </div>
    `;
  }

  criarFiltroIdade() {
    return `
      <div class="filtro-grupo">
        <label for="filtro-idade">👥 Faixa etária</label>
        <select id="filtro-idade" onchange="window.filtros.definirFiltro('idade', this.value)">
          <option value="todos" ${this.filtros.idade === 'todos' ? 'selected' : ''}>
            Todas as idades
          </option>
          <option value="criancas" ${this.filtros.idade === 'criancas' ? 'selected' : ''}>
            Com crianças (0-12 anos)
          </option>
          <option value="adolescentes" ${this.filtros.idade === 'adolescentes' ? 'selected' : ''}>
            Com adolescentes (13-17 anos)
          </option>
          <option value="jovens" ${this.filtros.idade === 'jovens' ? 'selected' : ''}>
            Jovens adultos (18-30 anos)
          </option>
          <option value="adultos" ${this.filtros.idade === 'adultos' ? 'selected' : ''}>
            Adultos (31-60 anos)
          </option>
          <option value="idosos" ${this.filtros.idade === 'idosos' ? 'selected' : ''}>
            Idosos (60+ anos)
          </option>
        </select>
      </div>
    `;
  }

  criarFiltroGrupo() {
    return `
      <div class="filtro-grupo">
        <label for="filtro-grupo">👨‍👩‍👧‍👦 Tipo de grupo</label>
        <select id="filtro-grupo" onchange="window.filtros.definirFiltro('grupo', this.value)">
          <option value="todos" ${this.filtros.grupo === 'todos' ? 'selected' : ''}>
            Qualquer grupo
          </option>
          <option value="solo" ${this.filtros.grupo === 'solo' ? 'selected' : ''}>
            Viagem solo
          </option>
          <option value="casal" ${this.filtros.grupo === 'casal' ? 'selected' : ''}>
            Casal
          </option>
          <option value="familia" ${this.filtros.grupo === 'familia' ? 'selected' : ''}>
            Família
          </option>
          <option value="amigos" ${this.filtros.grupo === 'amigos' ? 'selected' : ''}>
            Grupo de amigos
          </option>
          <option value="trabalho" ${this.filtros.grupo === 'trabalho' ? 'selected' : ''}>
            Viagem de trabalho
          </option>
        </select>
      </div>
    `;
  }

  criarFiltroClima() {
    return `
      <div class="filtro-grupo">
        <label for="filtro-clima">🌤️ Clima preferido</label>
        <select id="filtro-clima" onchange="window.filtros.definirFiltro('clima', this.value)">
          <option value="todos" ${this.filtros.clima === 'todos' ? 'selected' : ''}>
            Qualquer clima
          </option>
          <option value="tropical" ${this.filtros.clima === 'tropical' ? 'selected' : ''}>
            Tropical (quente e úmido)
          </option>
          <option value="seco" ${this.filtros.clima === 'seco' ? 'selected' : ''}>
            Seco (quente e seco)
          </option>
          <option value="temperado" ${this.filtros.clima === 'temperado' ? 'selected' : ''}>
            Temperado (ameno)
          </option>
          <option value="frio" ${this.filtros.clima === 'frio' ? 'selected' : ''}>
            Frio (baixas temperaturas)
          </option>
          <option value="montanha" ${this.filtros.clima === 'montanha' ? 'selected' : ''}>
            Montanha (altitude)
          </option>
        </select>
      </div>
    `;
  }

  criarFiltroEpoca() {
    return `
      <div class="filtro-grupo">
        <label for="filtro-epoca">📅 Época do ano</label>
        <select id="filtro-epoca" onchange="window.filtros.definirFiltro('epoca', this.value)">
          <option value="todos" ${this.filtros.epoca === 'todos' ? 'selected' : ''}>
            Qualquer época
          </option>
          <option value="verao" ${this.filtros.epoca === 'verao' ? 'selected' : ''}>
            Verão (Dez-Mar)
          </option>
          <option value="outono" ${this.filtros.epoca === 'outono' ? 'selected' : ''}>
            Outono (Mar-Jun)
          </option>
          <option value="inverno" ${this.filtros.epoca === 'inverno' ? 'selected' : ''}>
            Inverno (Jun-Set)
          </option>
          <option value="primavera" ${this.filtros.epoca === 'primavera' ? 'selected' : ''}>
            Primavera (Set-Dez)
          </option>
          <option value="alta-temporada" ${this.filtros.epoca === 'alta-temporada' ? 'selected' : ''}>
            Alta temporada
          </option>
          <option value="baixa-temporada" ${this.filtros.epoca === 'baixa-temporada' ? 'selected' : ''}>
            Baixa temporada
          </option>
        </select>
      </div>
    `;
  }

  criarFiltroAcessibilidade() {
    return `
      <div class="filtro-especial">
        <label class="filtro-checkbox">
          <input type="checkbox" id="filtro-acessibilidade" 
                 ${this.filtros.acessibilidade ? 'checked' : ''}
                 onchange="window.filtros.definirFiltro('acessibilidade', this.checked)">
          <span class="checkmark"></span>
          ♿ Locais acessíveis para cadeirantes
        </label>
      </div>
    `;
  }

  criarFiltroInteresses() {
    const interessesDisponiveis = [
      { id: 'arte', nome: '🎨 Arte e Cultura', categoria: 'cultural' },
      { id: 'historia', nome: '🏛️ História', categoria: 'cultural' },
      { id: 'arquitetura', nome: '🏗️ Arquitetura', categoria: 'cultural' },
      { id: 'museus', nome: '🖼️ Museus', categoria: 'cultural' },
      { id: 'gastronomia', nome: '🍽️ Gastronomia', categoria: 'gastronomico' },
      { id: 'vida-noturna', nome: '🌃 Vida Noturna', categoria: 'entretenimento' },
      { id: 'compras', nome: '🛍️ Compras', categoria: 'entretenimento' },
      { id: 'natureza', nome: '🌿 Natureza', categoria: 'aventura' },
      { id: 'praia', nome: '🏖️ Praia', categoria: 'relaxamento' },
      { id: 'montanha', nome: '⛰️ Montanha', categoria: 'aventura' },
      { id: 'esportes', nome: '⚽ Esportes', categoria: 'aventura' },
      { id: 'wellness', nome: '🧘 Wellness/Spa', categoria: 'relaxamento' },
      { id: 'fotografia', nome: '📸 Fotografia', categoria: 'hobby' },
      { id: 'musica', nome: '🎵 Música', categoria: 'entretenimento' },
      { id: 'festivais', nome: '🎪 Festivais', categoria: 'entretenimento' },
      { id: 'religioso', nome: '⛪ Turismo Religioso', categoria: 'cultural' }
    ];

    let html = `
      <div class="filtro-interesses">
        <h4>🎯 Interesses Específicos</h4>
        <div class="interesses-grid">
    `;

    interessesDisponiveis.forEach(interesse => {
      const checked = this.filtros.interesses.includes(interesse.id) ? 'checked' : '';
      html += `
        <label class="interesse-item">
          <input type="checkbox" value="${interesse.id}" ${checked}
                 onchange="window.filtros.toggleInteresse('${interesse.id}')">
          <span class="interesse-nome">${interesse.nome}</span>
        </label>
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  // === MÉTODOS DE FILTRO ===

  toggleInteresse(interesseId) {
    const interesses = [...this.filtros.interesses];
    const index = interesses.indexOf(interesseId);
    
    if (index > -1) {
      interesses.splice(index, 1);
    } else {
      interesses.push(interesseId);
    }
    
    this.definirFiltro('interesses', interesses);
  }

  aplicarFiltros() {
    // Notificar que os filtros foram aplicados
    this.notificarAplicacao();
    
    // Fechar interface de filtros
    const container = document.getElementById('filtros-container');
    if (container) {
      container.style.display = 'none';
    }
    
    debug('🔍 Filtros aplicados');
  }

  // === VALIDAÇÃO DE FILTROS ===

  isFiltroAtivo(chave, valor) {
    if (chave === 'acessibilidade') {
      return valor === true;
    }
    
    if (chave === 'interesses') {
      return Array.isArray(valor) && valor.length > 0;
    }
    
    return valor !== 'todos' && valor !== null && valor !== undefined;
  }

  validarFiltros(roteiro) {
    const filtrosAtivos = this.obterFiltrosAtivos();
    
    // Se não há filtros ativos, aceita tudo
    if (Object.keys(filtrosAtivos).length === 0) {
      return true;
    }
    
    // Aplicar cada filtro
    for (const [chave, valor] of Object.entries(filtrosAtivos)) {
      if (!this.aplicarFiltroIndividual(roteiro, chave, valor)) {
        return false;
      }
    }
    
    return true;
  }

  aplicarFiltroIndividual(roteiro, chave, valor) {
    switch (chave) {
      case 'orcamento':
        return this.validarOrcamento(roteiro, valor);
      
      case 'duracao':
        return this.validarDuracao(roteiro, valor);
      
      case 'transporte':
        return this.validarTransporte(roteiro, valor);
      
      case 'acessibilidade':
        return this.validarAcessibilidade(roteiro, valor);
      
      case 'interesses':
        return this.validarInteresses(roteiro, valor);
      
      case 'idade':
        return this.validarIdade(roteiro, valor);
      
      case 'grupo':
        return this.validarGrupo(roteiro, valor);
      
      default:
        return true;
    }
  }

  validarOrcamento(roteiro, faixa) {
    if (!roteiro.custoTotal) return true;
    
    const custo = Utils.extrairValor(roteiro.custoTotal);
    const faixas = {
      economico: { min: 0, max: 100 },
      medio: { min: 100, max: 300 },
      alto: { min: 300, max: 500 },
      luxo: { min: 500, max: Infinity }
    };
    
    const limite = faixas[faixa];
    return limite && custo >= limite.min && custo <= limite.max;
  }

  validarDuracao(roteiro, duracao) {
    const duracaoRoteiro = parseInt(roteiro.duracao) || 1;
    
    const mapeamento = {
      'meio-dia': [0.5, 0.5],
      '1-dia': [1, 1],
      '2-3-dias': [2, 3],
      'semana': [7, 7],
      'quinzena': [14, 14],
      'mes': [30, Infinity]
    };
    
    const [min, max] = mapeamento[duracao] || [0, Infinity];
    return duracaoRoteiro >= min && duracaoRoteiro <= max;
  }

  validarTransporte(roteiro, transporte) {
    if (!roteiro.atividades) return true;
    
    return roteiro.atividades.some(atividade => 
      atividade.transporte && 
      atividade.transporte.toLowerCase().includes(transporte.toLowerCase())
    );
  }

  validarAcessibilidade(roteiro, requerAcessibilidade) {
    if (!requerAcessibilidade) return true;
    
    // Verificar se o roteiro menciona acessibilidade
    const textoCompleto = JSON.stringify(roteiro).toLowerCase();
    const termosAcessibilidade = [
      'acessível', 'cadeirante', 'rampa', 'elevador', 
      'acessibilidade', 'deficiente', 'mobilidade'
    ];
    
    return termosAcessibilidade.some(termo => textoCompleto.includes(termo));
  }

  validarInteresses(roteiro, interesses) {
    if (!interesses || interesses.length === 0) return true;
    
    const textoRoteiro = JSON.stringify(roteiro).toLowerCase();
    
    return interesses.some(interesse => {
      const termosInteresse = this.obterTermosInteresse(interesse);
      return termosInteresse.some(termo => textoRoteiro.includes(termo));
    });
  }

  validarIdade(roteiro, idade) {
    const textoRoteiro = JSON.stringify(roteiro).toLowerCase();
    
    const termosIdade = {
      criancas: ['criança', 'infantil', 'família', 'playground', 'parque'],
      adolescentes: ['jovem', 'aventura', 'esporte', 'atividade'],
      jovens: ['noturna', 'balada', 'bar', 'festa'],
      adultos: ['cultural', 'histórico', 'museu', 'arte'],
      idosos: ['tranquilo', 'relaxante', 'confortável', 'acessível']
    };
    
    const termos = termosIdade[idade] || [];
    return termos.some(termo => textoRoteiro.includes(termo));
  }

  validarGrupo(roteiro, grupo) {
    const textoRoteiro = JSON.stringify(roteiro).toLowerCase();
    
    const termosGrupo = {
      solo: ['individual', 'pessoal', 'contemplação'],
      casal: ['romântico', 'íntimo', 'casal', 'dois'],
      familia: ['família', 'criança', 'infantil', 'grupo'],
      amigos: ['grupo', 'diversão', 'compartilhar'],
      trabalho: ['executivo', 'negócios', 'corporativo']
    };
    
    const termos = termosGrupo[grupo] || [];
    return termos.some(termo => textoRoteiro.includes(termo));
  }

  obterTermosInteresse(interesse) {
    const mapeamento = {
      arte: ['arte', 'artístico', 'galeria', 'exposição'],
      historia: ['histórico', 'história', 'patrimônio', 'monumento'],
      arquitetura: ['arquitetura', 'construção', 'edifício', 'prédio'],
      museus: ['museu', 'acervo', 'exposição', 'coleção'],
      gastronomia: ['restaurante', 'comida', 'culinária', 'gastronômico'],
      'vida-noturna': ['noturna', 'bar', 'balada', 'festa'],
      compras: ['shopping', 'loja', 'mercado', 'compras'],
      natureza: ['natureza', 'parque', 'verde', 'natural'],
      praia: ['praia', 'mar', 'oceano', 'litoral'],
      montanha: ['montanha', 'serra', 'trilha', 'altitude'],
      esportes: ['esporte', 'atividade', 'aventura', 'físico'],
      wellness: ['spa', 'relaxamento', 'bem-estar', 'massagem'],
      fotografia: ['fotografia', 'foto', 'paisagem', 'vista'],
      musica: ['música', 'show', 'concerto', 'musical'],
      festivais: ['festival', 'evento', 'celebração', 'festa'],
      religioso: ['igreja', 'templo', 'religioso', 'sagrado']
    };
    
    return mapeamento[interesse] || [interesse];
  }

  // === PERSISTÊNCIA ===

  salvarFiltros() {
    try {
      localStorage.setItem('roteiro-filtros', JSON.stringify(this.filtros));
    } catch (error) {
      console.error('Erro ao salvar filtros:', error);
    }
  }

  carregarFiltrosSalvos() {
    try {
      const filtrosSalvos = localStorage.getItem('roteiro-filtros');
      if (filtrosSalvos) {
        this.filtros = { ...this.filtros, ...JSON.parse(filtrosSalvos) };
        
        // Atualizar filtros ativos
        Object.entries(this.filtros).forEach(([chave, valor]) => {
          if (this.isFiltroAtivo(chave, valor)) {
            this.filtrosAtivos.add(chave);
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar filtros salvos:', error);
    }
  }

  // === CALLBACKS ===

  adicionarCallback(evento, callback) {
    this.callbacks.push({ evento, callback });
  }

  notificarMudanca(chave, valor, valorAnterior) {
    this.callbacks.forEach(({ evento, callback }) => {
      if (evento === 'mudanca' || evento === 'todos') {
        try {
          callback({ chave, valor, valorAnterior, filtros: this.filtros });
        } catch (error) {
          console.error('Erro no callback de filtro:', error);
        }
      }
    });
  }

  notificarAplicacao() {
    this.callbacks.forEach(({ evento, callback }) => {
      if (evento === 'aplicacao' || evento === 'filtrosAplicados') {
        try {
          callback(this.obterFiltrosAtivos());
        } catch (error) {
          console.error('Erro no callback de aplicação:', error);
        }
      }
    });
  }

  // === MÉTODOS PÚBLICOS PARA EVENTOS ===

  temFiltrosAtivos() {
    return this.filtrosAtivos.size > 0;
  }

  validarAtividade(atividade) {
    return this.validarFiltros({ atividades: [atividade] });
  }

  obterResumoFiltros() {
    const ativos = this.obterFiltrosAtivos();
    const resumo = [];
    
    Object.entries(ativos).forEach(([chave, valor]) => {
      if (chave === 'interesses' && Array.isArray(valor)) {
        resumo.push(`${valor.length} interesse(s)`);
      } else if (chave === 'acessibilidade' && valor) {
        resumo.push('Acessível');
      } else if (valor !== 'todos') {
        resumo.push(`${chave}: ${valor}`);
      }
    });
    
    return resumo.join(', ') || 'Nenhum filtro ativo';
  }
}

// Funções globais para eventos HTML
function aplicarFiltros() {
  if (window.filtros) {
    window.filtros.aplicarFiltros();
  }
}

// Exportar classe
if (typeof window !== 'undefined') {
  window.FiltrosRoteiro = FiltrosRoteiro;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FiltrosRoteiro;
}