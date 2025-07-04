// ui-components.js - Componentes de interface do usuário

class UIComponents {
  
  // === LOADING STATES ===

  static mostrarLoading(containerId, mensagem = 'Carregando...') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>${mensagem}</p>
      </div>
    `;
  }

  static mostrarLoadingOverlay(mostrar = true, mensagem = 'Carregando...') {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) return;
    
    if (mostrar) {
      overlay.querySelector('h3').textContent = mensagem;
      overlay.style.display = 'flex';
    } else {
      overlay.style.display = 'none';
    }
  }

  static mostrarSkeletonCards(containerId, quantidade = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let skeletonHTML = '';
    
    for (let i = 0; i < quantidade; i++) {
      skeletonHTML += `
        <div class="skeleton-card">
          <div class="skeleton-image"></div>
          <div class="skeleton-content">
            <div class="skeleton-title"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
          </div>
        </div>
      `;
    }
    
    container.innerHTML = skeletonHTML;
  }

  // === MENSAGENS DE ERRO ===

  static mostrarErro(containerId, mensagem, tentarNovamente = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h3>Ops! Algo deu errado</h3>
        <p>${mensagem}</p>
        ${tentarNovamente ? `
          <button class="btn-retry" onclick="${tentarNovamente}">
            Tentar Novamente
          </button>
        ` : ''}
      </div>
    `;
  }

  static mostrarErroConfiguracao(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
      <div class="error-config">
        <h3>⚙️ Configuração Necessária</h3>
        <p>Para usar o Roteiro IA, você precisa configurar as chaves das APIs:</p>
        <ul>
          <li><strong>Groq AI</strong> - Para geração de roteiros</li>
          <li><strong>Geoapify</strong> - Para busca de destinos</li>
          <li><strong>Unsplash</strong> - Para imagens dos locais</li>
        </ul>
        <p>Veja o arquivo <code>README.md</code> para instruções detalhadas.</p>
        <button class="btn-primary" onclick="window.open('https://github.com/seu-usuario/roteiro-turistico-ia#configuração-das-apis', '_blank')">
          Ver Instruções
        </button>
      </div>
    `;
  }

  // === TOAST NOTIFICATIONS ===

  static mostrarToast(mensagem, tipo = 'success', duracao = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    
    const icones = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icones[tipo] || icones.info}</span>
        <span class="toast-message">${mensagem}</span>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animação de entrada
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remover automaticamente
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentElement) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, duracao);
    
    return toast;
  }

  // === MODAIS ===

  static criarModal(titulo, conteudo, botoes = []) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>${titulo}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-content">
          ${conteudo}
        </div>
        <div class="modal-footer">
          ${botoes.map(botao => `
            <button class="btn-${botao.tipo || 'secondary'}" onclick="${botao.acao}">
              ${botao.texto}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    return modal;
  }

  static mostrarConfirmacao(titulo, mensagem, callback) {
    const modal = this.criarModal(titulo, `<p>${mensagem}</p>`, [
      {
        texto: 'Cancelar',
        tipo: 'secondary',
        acao: 'this.closest(".modal-overlay").remove()'
      },
      {
        texto: 'Confirmar',
        tipo: 'primary',
        acao: `(${callback})(); this.closest(".modal-overlay").remove();`
      }
    ]);
    
    return modal;
  }

  // === FORMULÁRIOS ===

  static criarFormulario(campos, onSubmit) {
    let formHTML = '<form class="form-dinamico">';
    
    campos.forEach(campo => {
      formHTML += `
        <div class="form-group">
          <label for="${campo.id}">${campo.label}</label>
          ${this.criarCampoFormulario(campo)}
        </div>
      `;
    });
    
    formHTML += `
      <div class="form-actions">
        <button type="submit" class="btn-primary">Salvar</button>
        <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
      </div>
    </form>`;
    
    const container = document.createElement('div');
    container.innerHTML = formHTML;
    
    const form = container.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const dados = new FormData(form);
      const objeto = Object.fromEntries(dados);
      onSubmit(objeto);
    });
    
    return container.innerHTML;
  }

  static criarCampoFormulario(campo) {
    switch (campo.tipo) {
      case 'text':
      case 'email':
      case 'url':
        return `<input type="${campo.tipo}" id="${campo.id}" name="${campo.id}" 
                placeholder="${campo.placeholder || ''}" 
                ${campo.obrigatorio ? 'required' : ''}>`;
      
      case 'textarea':
        return `<textarea id="${campo.id}" name="${campo.id}" 
                placeholder="${campo.placeholder || ''}" 
                ${campo.obrigatorio ? 'required' : ''}></textarea>`;
      
      case 'select':
        let options = '';
        campo.opcoes.forEach(opcao => {
          options += `<option value="${opcao.valor}">${opcao.texto}</option>`;
        });
        return `<select id="${campo.id}" name="${campo.id}" ${campo.obrigatorio ? 'required' : ''}>${options}</select>`;
      
      case 'checkbox':
        return `<input type="checkbox" id="${campo.id}" name="${campo.id}" value="1">`;
      
      default:
        return `<input type="text" id="${campo.id}" name="${campo.id}">`;
    }
  }

  // === LISTAS E CARDS ===

  static criarCard(dados) {
    return `
      <div class="card" data-id="${dados.id || ''}">
        ${dados.imagem ? `
          <div class="card-image">
            <img src="${dados.imagem}" alt="${dados.titulo}" loading="lazy">
          </div>
        ` : ''}
        <div class="card-content">
          <h4 class="card-title">${dados.titulo}</h4>
          ${dados.subtitulo ? `<p class="card-subtitle">${dados.subtitulo}</p>` : ''}
          ${dados.descricao ? `<p class="card-description">${dados.descricao}</p>` : ''}
          ${dados.detalhes ? `
            <div class="card-details">
              ${dados.detalhes.map(detalhe => `
                <div class="detail-item">
                  <i data-lucide="${detalhe.icone}"></i>
                  <span>${detalhe.texto}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${dados.acoes ? `
            <div class="card-actions">
              ${dados.acoes.map(acao => `
                <button class="btn-${acao.tipo || 'secondary'}" onclick="${acao.acao}">
                  ${acao.icone ? `<i data-lucide="${acao.icone}"></i>` : ''}
                  ${acao.texto}
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  static criarLista(itens, template) {
    return itens.map(item => template(item)).join('');
  }

  // === PAGINAÇÃO ===

  static criarPaginacao(paginaAtual, totalPaginas, onPageChange) {
    if (totalPaginas <= 1) return '';
    
    let paginacao = '<div class="paginacao">';
    
    // Botão anterior
    if (paginaAtual > 1) {
      paginacao += `
        <button class="btn-paginacao" onclick="${onPageChange}(${paginaAtual - 1})">
          <i data-lucide="chevron-left"></i>
        </button>
      `;
    }
    
    // Números das páginas
    const inicio = Math.max(1, paginaAtual - 2);
    const fim = Math.min(totalPaginas, paginaAtual + 2);
    
    for (let i = inicio; i <= fim; i++) {
      paginacao += `
        <button class="btn-paginacao ${i === paginaAtual ? 'active' : ''}" 
                onclick="${onPageChange}(${i})">
          ${i}
        </button>
      `;
    }
    
    // Botão próximo
    if (paginaAtual < totalPaginas) {
      paginacao += `
        <button class="btn-paginacao" onclick="${onPageChange}(${paginaAtual + 1})">
          <i data-lucide="chevron-right"></i>
        </button>
      `;
    }
    
    paginacao += '</div>';
    return paginacao;
  }

  // === BUSCA E FILTROS ===

  static criarBarraBusca(placeholder, onSearch) {
    return `
      <div class="barra-busca">
        <input type="text" placeholder="${placeholder}" 
               oninput="Utils.debounce(${onSearch}, 300)(this.value)">
        <i data-lucide="search"></i>
      </div>
    `;
  }

  static criarFiltroRapido(opcoes, onFilter) {
    return `
      <div class="filtro-rapido">
        ${opcoes.map(opcao => `
          <button class="btn-filtro" data-filtro="${opcao.valor}" 
                  onclick="${onFilter}('${opcao.valor}')">
            ${opcao.texto}
          </button>
        `).join('')}
      </div>
    `;
  }

  // === ESTADOS VAZIOS ===

  static mostrarEstadoVazio(containerId, titulo, mensagem, acao = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
      <div class="estado-vazio">
        <div class="estado-vazio-icon">📭</div>
        <h3>${titulo}</h3>
        <p>${mensagem}</p>
        ${acao ? `
          <button class="btn-primary" onclick="${acao.callback}">
            ${acao.texto}
          </button>
        ` : ''}
      </div>
    `;
  }

  // === UTILITÁRIOS ===

  static atualizarIcones() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  static scrollParaElemento(elementId, comportamento = 'smooth') {
    const elemento = document.getElementById(elementId);
    if (elemento) {
      elemento.scrollIntoView({ behavior: comportamento });
    }
  }

  static toggleVisibilidade(elementId, mostrar = null) {
    const elemento = document.getElementById(elementId);
    if (!elemento) return;
    
    if (mostrar === null) {
      elemento.style.display = elemento.style.display === 'none' ? 'block' : 'none';
    } else {
      elemento.style.display = mostrar ? 'block' : 'none';
    }
  }

  static adicionarClasse(elementId, classe) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
      elemento.classList.add(classe);
    }
  }

  static removerClasse(elementId, classe) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
      elemento.classList.remove(classe);
    }
  }

  static alternarClasse(elementId, classe) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
      elemento.classList.toggle(classe);
    }
  }

  // === ANIMAÇÕES ===

  static animarEntrada(elemento, tipo = 'fadeIn') {
    if (typeof elemento === 'string') {
      elemento = document.getElementById(elemento);
    }
    
    if (elemento) {
      elemento.classList.add(tipo);
    }
  }

  static animarSaida(elemento, callback = null) {
    if (typeof elemento === 'string') {
      elemento = document.getElementById(elemento);
    }
    
    if (elemento) {
      elemento.style.opacity = '0';
      elemento.style.transform = 'translateY(-20px)';
      
      setTimeout(() => {
        if (callback) callback();
      }, 300);
    }
  }
}

// Exportar classe
if (typeof window !== 'undefined') {
  window.UIComponents = UIComponents;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIComponents;
}