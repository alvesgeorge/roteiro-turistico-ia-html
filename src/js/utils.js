// utils.js - Funções utilitárias

// Função debug local caso CONFIG não esteja disponível
function debug(...args) {
  if (typeof window !== 'undefined' && window.CONFIG && window.CONFIG.DEBUG_MODE) {
    console.log('[DEBUG]', ...args);
  } else if (typeof window === 'undefined') {
    // Para Node.js
    console.log('[DEBUG]', ...args);
  }
}

// Tornar debug global se não existir
if (typeof window !== 'undefined' && typeof window.debug === 'undefined') {
  window.debug = debug;
}

class Utils {
  // === FORMATAÇÃO DE DADOS ===

  static formatarData(data, formato = 'dd/mm/yyyy') {
    try {
      const date = new Date(data);
      
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const ano = date.getFullYear();
      const horas = String(date.getHours()).padStart(2, '0');
      const minutos = String(date.getMinutes()).padStart(2, '0');
      
      switch (formato) {
        case 'dd/mm/yyyy':
          return `${dia}/${mes}/${ano}`;
        case 'dd/mm/yyyy hh:mm':
          return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
        case 'yyyy-mm-dd':
          return `${ano}-${mes}-${dia}`;
        default:
          return date.toLocaleDateString('pt-BR');
      }
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  }

  static formatarMoeda(valor, moeda = 'BRL') {
    try {
      const numero = typeof valor === 'string' ? parseFloat(valor.replace(/[^\d,.-]/g, '').replace(',', '.')) : valor;
      
      if (isNaN(numero)) {
        return 'R$ 0,00';
      }
      
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: moeda
      }).format(numero);
    } catch (error) {
      console.error('Erro ao formatar moeda:', error);
      return 'R$ 0,00';
    }
  }

  static formatarTempo(segundos) {
    try {
      const horas = Math.floor(segundos / 3600);
      const minutos = Math.floor((segundos % 3600) / 60);
      const segs = segundos % 60;
      
      if (horas > 0) {
        return `${horas}h ${minutos}min`;
      } else if (minutos > 0) {
        return `${minutos}min`;
      } else {
        return `${segs}s`;
      }
    } catch (error) {
      console.error('Erro ao formatar tempo:', error);
      return '0s';
    }
  }

  // === MANIPULAÇÃO DE STRINGS ===

  static capitalizar(texto) {
    if (typeof texto !== 'string') return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  }

  static capitalizarPalavras(texto) {
    if (typeof texto !== 'string') return '';
    return texto.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  static truncar(texto, limite = 100, sufixo = '...') {
    if (typeof texto !== 'string') return '';
    if (texto.length <= limite) return texto;
    return texto.substring(0, limite) + sufixo;
  }

  // Escapar HTML de forma mais robusta
  static escaparHTML(texto) {
    if (typeof texto !== 'string') {
      texto = String(texto || '');
    }
    
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  // Escapar dados para uso em atributos HTML
  static escaparAtributo(texto) {
    if (typeof texto !== 'string') {
      texto = String(texto || '');
    }
    
    return texto
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Remover acentos
  static removerAcentos(texto) {
    if (typeof texto !== 'string') return '';
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Slug para URLs
  static criarSlug(texto) {
    if (typeof texto !== 'string') return '';
    return this.removerAcentos(texto)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // === VALIDAÇÕES ===

  static validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  static validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    
    return resto === parseInt(cpf.charAt(10));
  }

  static validarTelefone(telefone) {
    const regex = /^(\(?\d{2}\)?\s?)?(\d{4,5})-?(\d{4})$/;
    return regex.test(telefone.replace(/\s/g, ''));
  }

  // === UTILITÁRIOS DE ARRAY ===

  static embaralhar(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  static removerDuplicados(array, chave = null) {
    if (chave) {
      const seen = new Set();
      return array.filter(item => {
        const valor = item[chave];
        if (seen.has(valor)) {
          return false;
        }
        seen.add(valor);
        return true;
      });
    }
    return [...new Set(array)];
  }

  static agruparPor(array, chave) {
    return array.reduce((grupos, item) => {
      const valor = item[chave];
      if (!grupos[valor]) {
        grupos[valor] = [];
      }
      grupos[valor].push(item);
      return grupos;
    }, {});
  }

  // === UTILITÁRIOS DE OBJETO ===

  static clonarProfundo(obj) {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (error) {
      console.error('Erro ao clonar objeto:', error);
      return obj;
    }
  }

  static mesclarObjetos(...objetos) {
    return Object.assign({}, ...objetos);
  }

  static obterValorAninhado(obj, caminho, valorPadrao = null) {
    try {
      return caminho.split('.').reduce((atual, chave) => atual?.[chave], obj) ?? valorPadrao;
    } catch (error) {
      return valorPadrao;
    }
  }

  // === UTILITÁRIOS DE PERFORMANCE ===

  static debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  static throttle(func, delay) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, delay);
      }
    };
  }

  // === UTILITÁRIOS DE CACHE ===

  static criarCache(ttl = 300000) { // 5 minutos por padrão
    const cache = new Map();
    
    return {
      get: (chave) => {
        const item = cache.get(chave);
        if (!item) return null;
        
        if (Date.now() > item.expira) {
          cache.delete(chave);
          return null;
        }
        
        return item.valor;
      },
      
      set: (chave, valor) => {
        cache.set(chave, {
          valor,
          expira: Date.now() + ttl
        });
      },
      
      delete: (chave) => {
        cache.delete(chave);
      },
      
      clear: () => {
        cache.clear();
      },
      
      size: () => cache.size
    };
  }

  // === RATE LIMITING ===

  static rateLimiter(limite, janela) {
    const requisicoes = [];
    
    return {
      podeExecutar: () => {
        const agora = Date.now();
        
        // Remover requisições antigas
        while (requisicoes.length > 0 && requisicoes[0] <= agora - janela) {
          requisicoes.shift();
        }
        
        if (requisicoes.length < limite) {
          requisicoes.push(agora);
          return true;
        }
        
        return false;
      },
      
      tempoEspera: () => {
        if (requisicoes.length === 0) return 0;
        return Math.max(0, requisicoes[0] + janela - Date.now());
      }
    };
  }

  // === UTILITÁRIOS DE REDE ===

  static async fazerRequisicao(url, opcoes = {}) {
    try {
      const configuracao = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        ...opcoes
      };
      
      const response = await fetch(url, configuracao);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('Erro na requisição:', error);
      throw error;
    }
  }

  // === UTILITÁRIOS DE LOCALIZAÇÃO ===

  static async obterLocalizacao() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            precisao: position.coords.accuracy
          });
        },
        (error) => {
          reject(new Error(`Erro de geolocalização: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }

  static calcularDistancia(lat1, lng1, lat2, lng2) {
    const R = 6371; // Raio da Terra em km
    const dLat = this.grausParaRadianos(lat2 - lat1);
    const dLng = this.grausParaRadianos(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.grausParaRadianos(lat1)) * Math.cos(this.grausParaRadianos(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static grausParaRadianos(graus) {
    return graus * (Math.PI / 180);
  }

  // === UTILITÁRIOS DE ARQUIVO ===

  static async lerArquivo(arquivo) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(arquivo);
    });
  }

  static downloadArquivo(conteudo, nomeArquivo, tipo = 'text/plain') {
    try {
      const blob = new Blob([conteudo], { type: tipo });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      throw error;
    }
  }

  // === UTILITÁRIOS DE CLIPBOARD ===

  static async copiarTexto(texto) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(texto);
        return true;
      }
      
      // Fallback para navegadores mais antigos
      const textarea = document.createElement('textarea');
      textarea.value = texto;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      
      document.body.appendChild(textarea);
      textarea.select();
      
      const sucesso = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      return sucesso;
    } catch (error) {
      console.error('Erro ao copiar texto:', error);
      return false;
    }
  }

  // === UTILITÁRIOS DE NÚMERO ===

  static gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static numeroAleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static extrairValor(texto) {
    if (typeof texto !== 'string') return 0;
    const match = texto.match(/[\d.,]+/);
    if (!match) return 0;
    return parseFloat(match[0].replace(',', '.'));
  }

  // === UTILITÁRIOS DE DISPOSITIVO ===

  static isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  static isTablet() {
    return /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
  }

  static isDesktop() {
    return !this.isMobile() && !this.isTablet();
  }

  // === UTILITÁRIOS DE TEMPO ===

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static timeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), ms)
      )
    ]);
  }

  // === UTILITÁRIOS DE URL ===

  static obterParametroURL(nome) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(nome);
  }

  static definirParametroURL(nome, valor) {
    const url = new URL(window.location);
    url.searchParams.set(nome, valor);
    window.history.pushState({}, '', url);
  }

  static removerParametroURL(nome) {
    const url = new URL(window.location);
    url.searchParams.delete(nome);
    window.history.pushState({}, '', url);
  }
}

// Exportar classe
if (typeof window !== 'undefined') {
  window.Utils = Utils;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}

// Log para verificar se o arquivo foi carregado
console.log('✅ utils.js carregado');