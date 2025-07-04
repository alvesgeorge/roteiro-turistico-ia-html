// app.js - Aplicação principal

// Verificar se todas as dependências estão disponíveis
function verificarDependencias() {
  const dependencias = {
    'CONFIG': typeof CONFIG !== 'undefined',
    'ApiServices': typeof ApiServices !== 'undefined',
    'MapaRoteiro': typeof MapaRoteiro !== 'undefined'
  };
  
  const faltando = Object.entries(dependencias)
    .filter(([nome, disponivel]) => !disponivel)
    .map(([nome]) => nome);
  
  if (faltando.length > 0) {
    console.error('❌ Dependências faltando:', faltando);
    throw new Error(`Dependências não carregadas: ${faltando.join(', ')}`);
  }
  
  return true;
}

class App {
  constructor() {
    // Verificar dependências antes de inicializar
    verificarDependencias();
    
    this.roteiroAtual = null;
    this.mapaRoteiro = null;
    this.apiServices = null;
    this.destinoSelecionado = null;
    this.isGenerating = false;
    
    console.log('🚀 Inicializando Roteiro IA...');
    this.init();
  }

  async init() {
    try {
      // Inicializar componentes
      await this.inicializarComponentes();
      
      // Configurar eventos
      this.configurarEventos();
      
      // Inicializar interface
      this.inicializarInterface();
      
      console.log('✅ Aplicação inicializada com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao inicializar aplicação:', error);
      this.tratarErro(error);
    }
  }

  async inicializarComponentes() {
    try {
      // Inicializar API services
      this.apiServices = new ApiServices();
      
      // Inicializar mapa
      this.mapaRoteiro = new MapaRoteiro('mapa');
      
      // Aguardar DOM e inicializar mapa
      this.aguardarInicializacao();
      
      console.log('✅ Componentes inicializados');
      
    } catch (error) {
      console.error('Erro ao inicializar componentes:', error);
      throw error;
    }
  }

  // Aguardar inicialização do mapa
  async aguardarInicializacao() {
    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }
    
    // Aguardar um pouco mais para garantir que tudo carregou
    setTimeout(() => {
      this.inicializarMapa();
    }, 2000);
  }

  // Inicializar mapa
  inicializarMapa() {
    try {
      console.log('🗺️ Inicializando mapa...');
      
      const sucesso = this.mapaRoteiro.inicializar(); // Usar método correto
      
      if (sucesso) {
        console.log('✅ Mapa inicializado com sucesso');
      } else {
        console.warn('⚠️ Falha ao inicializar mapa');
      }
      
    } catch (error) {
      console.error('❌ Erro ao inicializar mapa:', error);
    }
  }

  configurarEventos() {
    // Evento de busca de destino
    const inputDestino = document.getElementById('destino');
    if (inputDestino) {
      inputDestino.addEventListener('input', (e) => {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.buscarDestinos(e);
        }, 300);
      });
      
      inputDestino.addEventListener('blur', () => {
        setTimeout(() => this.fecharAutocomplete(), 200);
      });
    }

    // Evento de geração de roteiro - IMPORTANTE!
    const btnGerar = document.getElementById('gerar-roteiro');
    if (btnGerar) {
      btnGerar.addEventListener('click', (e) => {
        e.preventDefault();
        this.gerarRoteiro();
      });
      console.log('✅ Evento do botão gerar roteiro configurado');
    } else {
      console.error('❌ Botão gerar-roteiro não encontrado');
    }

    // Fechar autocomplete ao clicar fora
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.busca-destino')) {
        this.fecharAutocomplete();
      }
    });

    console.log('✅ Eventos configurados');
  }

  inicializarInterface() {
    // Atualizar ícones
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Mostrar toast de boas-vindas
    setTimeout(() => {
      this.mostrarToast('Bem-vindo ao Roteiro IA! Digite um destino para começar.', 'info');
    }, 1000);

    console.log('✅ Interface inicializada');
  }

  // === BUSCA DE DESTINOS ===

  async buscarDestinos(event) {
    const query = event.target.value.trim();
    
    if (query.length < 3) {
      this.fecharAutocomplete();
      return;
    }

    try {
      const destinos = await this.apiServices.buscarDestinos(query);
      this.mostrarAutocomplete(destinos);
      
    } catch (error) {
      console.error('Erro ao buscar destinos:', error);
      this.mostrarToast('Erro ao buscar destinos', 'error');
    }
  }

  mostrarAutocomplete(destinos) {
    const container = document.getElementById('autocomplete-results');
    if (!container) return;
    
    if (destinos.length === 0) {
      container.style.display = 'none';
      return;
    }

    // Limpar container
    container.innerHTML = '';

    // Criar elementos de forma segura
    destinos.forEach((destino, index) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      
      // Criar conteúdo principal
      const main = document.createElement('div');
      main.className = 'autocomplete-main';
      main.textContent = destino.nome;
      
      // Criar conteúdo secundário
      const sub = document.createElement('div');
      sub.className = 'autocomplete-sub';
      sub.textContent = `${destino.pais}${destino.estado ? `, ${destino.estado}` : ''}`;
      
      // Adicionar evento de clique de forma segura
      item.addEventListener('click', () => {
        this.selecionarDestino(destino.nome, destino.coordenadas);
      });
      
      // Montar elemento
      item.appendChild(main);
      item.appendChild(sub);
      container.appendChild(item);
    });

    container.style.display = 'block';
  }

  selecionarDestino(nome, coordenadas) {
    try {
      document.getElementById('destino').value = nome;
      this.destinoSelecionado = { 
        nome: nome, 
        coordenadas: coordenadas 
      };
      this.fecharAutocomplete();
      
      console.log('🎯 Destino selecionado:', this.destinoSelecionado);
    } catch (error) {
      console.error('Erro ao selecionar destino:', error);
      this.mostrarToast('Erro ao selecionar destino', 'error');
    }
  }

  fecharAutocomplete() {
    const container = document.getElementById('autocomplete-results');
    if (container) {
      container.style.display = 'none';
    }
  }

  // === GERAÇÃO DE ROTEIRO ===

  async gerarRoteiro() {
    if (this.isGenerating) {
      this.mostrarToast('Aguarde, já estamos gerando um roteiro...', 'warning');
      return;
    }

    console.log('🚀 Iniciando geração de roteiro...');

    // Validar dados
    if (!this.destinoSelecionado) {
      this.mostrarToast('Por favor, selecione um destino', 'warning');
      document.getElementById('destino').focus();
      return;
    }

    const duracao = document.getElementById('duracao')?.value;
    const orcamento = document.getElementById('orcamento')?.value;
    const interesses = document.getElementById('interesses')?.value;

    console.log('📋 Dados do formulário:', {
      destino: this.destinoSelecionado,
      duracao,
      orcamento,
      interesses
    });

    if (!duracao) {
      this.mostrarToast('Por favor, selecione a duração da viagem', 'warning');
      document.getElementById('duracao').focus();
      return;
    }

    if (!orcamento) {
      this.mostrarToast('Por favor, selecione o orçamento', 'warning');
      document.getElementById('orcamento').focus();
      return;
    }

    if (!interesses) {
      this.mostrarToast('Por favor, selecione seus interesses', 'warning');
      document.getElementById('interesses').focus();
      return;
    }

    this.isGenerating = true;
    
    try {
      // Mostrar loading
      this.mostrarLoading();
      
      // Preparar dados
      const dadosRoteiro = {
        destino: this.destinoSelecionado.nome,
        coordenadas: this.destinoSelecionado.coordenadas,
        duracao: duracao,
        orcamento: orcamento,
        interesses: interesses
      };

      console.log('📤 Enviando dados para API:', dadosRoteiro);

      // Gerar roteiro
      const roteiro = await this.apiServices.gerarRoteiro(dadosRoteiro);
      
      console.log('📥 Roteiro recebido:', roteiro);
      
      // Processar e mostrar resultado
      this.roteiroAtual = roteiro;
      this.mostrarRoteiro(roteiro);
      
      // AGUARDAR MAPA ESTAR PRONTO
      await this.aguardarMapaPronto();
      
      // Adicionar marcadores ao mapa
      if (roteiro.dias && roteiro.dias.length > 0) {
        this.adicionarMarcadoresRoteiro(roteiro);
      }
      
      // Centralizar mapa
      if (roteiro.coordenadas) {
        this.mapaRoteiro.centralizarMapa(
          roteiro.coordenadas.lat, 
          roteiro.coordenadas.lng, 
          12
        );
      }
      
      console.log('🗺️ Mapa atualizado com sucesso');
      
      this.mostrarToast('Roteiro gerado com sucesso!', 'success');
      
    } catch (error) {
      console.error('Erro ao gerar roteiro:', error);
      this.mostrarToast('Erro ao gerar roteiro. Tente novamente.', 'error');
      
    } finally {
      this.esconderLoading();
      this.isGenerating = false;
    }
  }

  // Método para aguardar mapa estar pronto:
  async aguardarMapaPronto() {
    const maxTentativas = 10;
    let tentativas = 0;
    
    while (!this.mapaRoteiro.mapa && tentativas < maxTentativas) {
      console.log(`⏳ Aguardando mapa... (${tentativas + 1}/${maxTentativas})`);
      
      // Tentar inicializar novamente
      this.mapaRoteiro.inicializar();
      
      if (!this.mapaRoteiro.mapa) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      tentativas++;
    }
    
    if (this.mapaRoteiro.mapa) {
      console.log('✅ Mapa pronto para uso');
    } else {
      console.warn('⚠️ Timeout ao aguardar mapa');
    }
  }

  // Método para adicionar marcadores do roteiro (usando API correta):
  // Substituir o método adicionarMarcadoresRoteiro no app.js:
adicionarMarcadoresRoteiro(roteiro) {
  console.log('📍 Iniciando adição de marcadores...');
  
  if (!this.mapaRoteiro.inicializado) {
    console.warn('⚠️ Mapa não inicializado, tentando inicializar...');
    
    // Tentar inicializar o mapa
    const sucesso = this.mapaRoteiro.inicializar();
    if (!sucesso) {
      console.error('❌ Falha ao inicializar mapa');
      return;
    }
  }
  
  // Usar o método específico para roteiros do MapaRoteiro
  this.mapaRoteiro.adicionarMarcadoresRoteiro(roteiro);
  
  // Mostrar o container do mapa
  this.mostrarMapa();
  
  console.log('📍 Marcadores do roteiro adicionados');
}

  mostrarLoading() {
    const container = this.garantirElementoResultado();
    
    if (container) {
      container.innerHTML = `
        <div class="loading-roteiro">
          <div class="loading-spinner"></div>
          <h3>🤖 Gerando seu roteiro personalizado...</h3>
          <p>Isso pode levar alguns segundos. Estamos analisando as melhores opções para você!</p>
        </div>
      `;
      
      container.style.display = 'block';
      console.log('✅ Loading mostrado');
    } else {
      console.error('❌ Container resultado-roteiro não encontrado!');
    }
  }

  esconderLoading() {
    // O loading será substituído pelo resultado
  }

  // Substituir o método mostrarRoteiro no app.js por esta versão:
mostrarRoteiro(roteiro) {
  try {
    console.log('🎯 Exibindo roteiro:', roteiro.titulo);
    
    const container = this.garantirElementoResultado();
    if (!container) {
      throw new Error('Container de resultado não encontrado');
    }
    
    // Gerar HTML do roteiro
    const html = `
      <div class="roteiro-container">
        <div class="roteiro-header">
          <h2>${roteiro.titulo}</h2>
          <div class="roteiro-info">
            <span class="destino">📍 ${roteiro.destino}</span>
            <span class="duracao">📅 ${roteiro.duracao}</span>
            <span class="orcamento">💰 ${roteiro.orcamento}</span>
          </div>
          ${roteiro.resumo ? `<p class="resumo">${roteiro.resumo}</p>` : ''}
          ${roteiro.fonte ? `<small class="fonte-roteiro">Gerado por: ${roteiro.fonte}</small>` : ''}
        </div>
        
        <div class="dias-container">
          ${roteiro.dias.map(dia => `
            <div class="dia-card">
              <div class="dia-header">
                <h3>Dia ${dia.dia}</h3>
                ${dia.titulo ? `<span class="dia-titulo">${dia.titulo}</span>` : ''}
                ${dia.regiao ? `<span class="regiao">📍 ${dia.regiao}</span>` : ''}
                ${dia.otimizacao ? `
                  <div class="otimizacao-info">
                    <small>📏 Distância total: ${dia.otimizacao.distancia_total}</small>
                    ${dia.otimizacao.otimizado ? '<span class="otimizado">✅ Otimizado</span>' : '<span class="nao-otimizado">⚠️ Não otimizado</span>'}
                  </div>
                ` : ''}
              </div>
              <div class="atividades-container">
                ${this.renderizarAtividades(dia.atividades)}
              </div>
            </div>
          `).join('')}
        </div>
        
        ${roteiro.dicas_gerais && roteiro.dicas_gerais.length > 0 ? `
          <div class="dicas-gerais">
            <h3>💡 Dicas Gerais</h3>
            <ul>
              ${roteiro.dicas_gerais.map(dica => `<li>${dica}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div class="roteiro-acoes">
		  <button onclick="app.salvarRoteiro()" class="btn btn-secondary">
		    💾 Salvar Roteiro
		  </button>
		  <button onclick="app.exportarRoteiro()" class="btn btn-primary">
		    📄 Exportar PDF
		  </button>
		  <button onclick="app.exportarMarkdown()" class="btn btn-outline">
		    📝 Exportar MD
		  </button>
		  <button onclick="app.compartilharRoteiro()" class="btn btn-outline">
		    📤 Compartilhar
 				 </button>
</div>
      </div>
    `;
    
    container.innerHTML = html;
    container.style.display = 'block';
    
    // *** MOSTRAR O MAPA EXPLICITAMENTE ***
    this.mostrarMapa();
    
    // Scroll suave para o resultado
    container.scrollIntoView({ behavior: 'smooth' });
    
    console.log('✅ Roteiro exibido com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao mostrar roteiro:', error);
    this.mostrarErro(error.message);
  }
}

// Adicionar este método na classe App:
mostrarMapa() {
  console.log('🗺️ Forçando exibição do mapa...');
  
  const mapaContainer = document.getElementById('mapa-container');
  if (mapaContainer) {
    // Mostrar o container do mapa
    mapaContainer.style.display = 'block';
    mapaContainer.classList.add('show');
    
    console.log('✅ Container do mapa exibido');
    
    // Garantir que o mapa seja redimensionado
    setTimeout(() => {
      if (this.mapaRoteiro && this.mapaRoteiro.mapa) {
        this.mapaRoteiro.redimensionar();
        console.log('🔄 Mapa redimensionado');
      }
    }, 100);
  } else {
    console.error('❌ Container #mapa-container não encontrado');
  }
}

  // === GARANTIR QUE O ELEMENTO EXISTE ===
  garantirElementoResultado() {
    let container = document.getElementById('resultado-roteiro');
    
    if (!container) {
      console.log('🔧 Criando elemento resultado-roteiro...');
      
      // Encontrar onde inserir (após o formulário)
      const searchSection = document.querySelector('.search-section');
      if (searchSection) {
        // Criar a seção de resultado
        const resultadoSection = document.createElement('div');
        resultadoSection.className = 'container';
        resultadoSection.style.marginTop = '2rem';
        
        // Criar o container do resultado
        container = document.createElement('div');
        container.id = 'resultado-roteiro';
        container.className = 'resultado-roteiro';
        
        // Inserir na estrutura
        resultadoSection.appendChild(container);
        searchSection.parentNode.insertBefore(resultadoSection, searchSection.nextSibling);
        
        console.log('✅ Elemento resultado-roteiro criado');
      } else {
        console.error('❌ Não foi possível encontrar .search-section');
      }
    }
    
    return container;
  }

  // === RENDERIZAR ATIVIDADES ===
  renderizarAtividades(atividades) {
    if (!atividades || atividades.length === 0) {
      return '<p class="no-activities">Nenhuma atividade encontrada</p>';
    }
    
    return atividades.map(atividade => {
      const validadoIcon = atividade.validado ? '✅' : '⚠️';
      const validadoClass = atividade.validado ? 'validado' : 'nao-validado';
      const fonte = atividade.fonte ? `<small class="fonte">${atividade.fonte}</small>` : '';
      
      return `
        <div class="atividade ${validadoClass}">
          <div class="atividade-header">
            <span class="horario">${atividade.horario}</span>
            <span class="validacao">${validadoIcon}</span>
          </div>
          <h4 class="atividade-nome">${atividade.nome}</h4>
          <p class="atividade-descricao">${atividade.descricao}</p>
          <div class="atividade-detalhes">
            <span class="custo">💰 ${atividade.custo}</span>
            ${atividade.duracao ? `<span class="duracao">⏱️ ${atividade.duracao}</span>` : ''}
          </div>
          ${atividade.endereco ? `<p class="endereco">📍 ${atividade.endereco}</p>` : ''}
          ${fonte}
        </div>
      `;
    }).join('');
  }

  mostrarErro(mensagem) {
    console.error('❌ Erro:', mensagem);
    
    const container = this.garantirElementoResultado();
    if (container) {
      container.innerHTML = `
        <div class="erro-container">
          <div class="erro-icon">❌</div>
          <h3>Erro ao gerar roteiro</h3>
          <p>${mensagem}</p>
          <button onclick="location.reload()" class="btn-retry">
            Tentar Novamente
          </button>
        </div>
      `;
      container.style.display = 'block';
    }
    
    // Também mostrar toast de erro
    this.mostrarToast('Erro ao gerar roteiro: ' + mensagem, 'error');
  }

  mostrarToast(mensagem, tipo = 'info') {
    // Criar toast se não existir
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    
    // Configurar toast
    toast.textContent = mensagem;
    toast.className = `toast toast-${tipo} show`;
    
    // Remover após 5 segundos
    setTimeout(() => {
      toast.classList.remove('show');
    }, 5000);
  }

  // === AÇÕES DOS BOTÕES ===

  salvarRoteiro() {
    if (this.roteiroAtual) {
      // Salvar no localStorage
      const roteiros = JSON.parse(localStorage.getItem('roteiros') || '[]');
      roteiros.push({
        ...this.roteiroAtual,
        salvoEm: new Date().toISOString()
      });
      localStorage.setItem('roteiros', JSON.stringify(roteiros));
      
      this.mostrarToast('Roteiro salvo com sucesso!', 'success');
      console.log('✅ Roteiro salvo:', this.roteiroAtual);
    } else {
      this.mostrarToast('Nenhum roteiro para salvar', 'warning');
    }
  }

 // Adicionar este método na classe App:
async carregarJsPDF() {
  return new Promise((resolve, reject) => {
    if (typeof window.jsPDF !== 'undefined') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      console.log('✅ jsPDF carregado dinamicamente');
      resolve();
    };
    script.onerror = () => {
      console.error('❌ Erro ao carregar jsPDF');
      reject(new Error('Falha ao carregar jsPDF'));
    };
    document.head.appendChild(script);
  });
}

// Atualizar o método exportarRoteiro para carregar jsPDF se necessário:
async exportarRoteiro() {
  if (!this.roteiroAtual) {
    this.mostrarToast('Nenhum roteiro para exportar', 'warning');
    return;
  }

  try {
    this.mostrarToast('Preparando PDF...', 'info');
    
    // Carregar jsPDF se necessário
    if (typeof window.jsPDF === 'undefined') {
      await this.carregarJsPDF();
    }

    // ... resto do código do PDF ...
  } catch (error) {
    console.error('❌ Erro ao exportar PDF:', error);
    this.mostrarToast('Erro no PDF, exportando como Markdown...', 'warning');
    this.exportarMarkdown();
  }
}
// Método separado para exportar Markdown (como backup)
exportarMarkdown() {
  if (!this.roteiroAtual) {
    this.mostrarToast('Nenhum roteiro para exportar', 'warning');
    return;
  }

  try {
    const conteudo = `# ${this.roteiroAtual.titulo}

**Destino:** ${this.roteiroAtual.destino}
**Duração:** ${this.roteiroAtual.duracao}
**Orçamento:** ${this.roteiroAtual.orcamento}

## Resumo
${this.roteiroAtual.resumo || 'Roteiro personalizado gerado pela IA'}

## Atividades por Dia

${this.roteiroAtual.dias.map(dia => `
### Dia ${dia.dia}: ${dia.titulo || dia.regiao}

${dia.atividades.map(atividade => `
#### ${atividade.horario} - ${atividade.nome}
- **Duração:** ${atividade.duracao}
- **Custo:** ${atividade.custo}
- **Endereço:** ${atividade.endereco || 'Não informado'}
- **Descrição:** ${atividade.descricao}
${atividade.dicas ? `- **Dica:** ${atividade.dicas}` : ''}
`).join('\n')}
`).join('\n')}

## Dicas Gerais
${this.roteiroAtual.dicas_gerais ? this.roteiroAtual.dicas_gerais.map(dica => `- ${dica}`).join('\n') : 'Nenhuma dica adicional'}

---
*Roteiro gerado em ${new Date().toLocaleDateString('pt-BR')} pelo Roteiro IA*
    `;

    const blob = new Blob([conteudo], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roteiro-${this.roteiroAtual.destino.replace(/[^a-zA-Z0-9]/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.mostrarToast('Markdown exportado!', 'success');
    
  } catch (error) {
    console.error('❌ Erro ao exportar Markdown:', error);
    this.mostrarToast('Erro ao exportar arquivo', 'error');
  }
}

  compartilharRoteiro() {
    if (this.roteiroAtual && navigator.share) {
      navigator.share({
        title: this.roteiroAtual.titulo,
        text: `Confira este roteiro incrível para ${this.roteiroAtual.destino}!`,
        url: window.location.href
      }).then(() => {
        this.mostrarToast('Roteiro compartilhado!', 'success');
      }).catch(() => {
        this.copiarLinkRoteiro();
      });
    } else {
      this.copiarLinkRoteiro();
    }
  }

  copiarLinkRoteiro() {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      this.mostrarToast('Link copiado para a área de transferência!', 'success');
    }).catch(() => {
      this.mostrarToast('Não foi possível copiar o link', 'error');
    });
  }

  // === TRATAMENTO DE ERROS ===

  tratarErro(error) {
    console.error('Erro na aplicação:', error);
    
    const container = this.garantirElementoResultado();
    if (container) {
      container.innerHTML = `
        <div class="erro-aplicacao">
          <h3>❌ Ops! Algo deu errado</h3>
          <p>Ocorreu um erro inesperado. Tente recarregar a página.</p>
          <button onclick="location.reload()" class="btn btn-primary">
            Recarregar Página
          </button>
        </div>
      `;
    }
  }
}

// Exportar classe
if (typeof window !== 'undefined') {
  window.App = App;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}

// Log para verificar se o arquivo foi carregado
console.log('✅ app.js carregado');