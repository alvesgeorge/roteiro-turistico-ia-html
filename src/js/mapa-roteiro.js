// mapa-roteiro.js - Gerenciamento do mapa interativo

class MapaRoteiro {
  constructor(containerId = 'mapa') {
    this.containerId = containerId;
    this.mapa = null;
    this.marcadores = [];
    this.inicializado = false;
    this.tentativasInicializacao = 0;
    this.maxTentativas = 5;
    
    console.log(`🗺️ MapaRoteiro criado para container: ${containerId}`);
  }

  async inicializar() {
    console.log('🗺️ Inicializando mapa...');
    
    try {
      // Verificar se Leaflet está carregado
      if (typeof L === 'undefined') {
        console.warn('⚠️ Leaflet não carregado, tentando carregar...');
        await this.carregarLeaflet();
      }
      
      const container = document.getElementById(this.containerId);
      if (!container) {
        console.error(`❌ Container ${this.containerId} não encontrado`);
        return false;
      }

      // Verificar se o container tem dimensões
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        console.warn('⚠️ Container sem dimensões, aguardando...');
        
        if (this.tentativasInicializacao < this.maxTentativas) {
          this.tentativasInicializacao++;
          setTimeout(() => this.inicializar(), 1000);
          return false;
        }
      }

      // Verificar se o mapa já existe
      if (this.mapa) {
        console.log('🗺️ Mapa já existe, removendo...');
        this.destruir();
      }

      // Criar novo mapa
      this.mapa = L.map(this.containerId, {
        center: [-23.5505, -46.6333],
        zoom: 10,
        zoomControl: true,
        attributionControl: true
      });

      // Adicionar camada de tiles com fallback
      this.adicionarCamadaTiles();

      // Configurar eventos do mapa
      this.configurarEventos();

      this.inicializado = true;
      this.tentativasInicializacao = 0;
      console.log('✅ Mapa inicializado com sucesso');
      
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao inicializar mapa:', error);
      this.inicializado = false;
      
      // Tentar novamente se não excedeu o limite
      if (this.tentativasInicializacao < this.maxTentativas) {
        this.tentativasInicializacao++;
        console.log(`🔄 Tentativa ${this.tentativasInicializacao}/${this.maxTentativas} em 2 segundos...`);
        setTimeout(() => this.inicializar(), 2000);
      }
      
      return false;
    }
  }

  async carregarLeaflet() {
    return new Promise((resolve, reject) => {
      // Verificar se já está carregado
      if (typeof L !== 'undefined') {
        resolve();
        return;
      }

      // Carregar CSS se não existir
      if (!document.querySelector('link[href*="leaflet"]')) {
        const linkCSS = document.createElement('link');
        linkCSS.rel = 'stylesheet';
        linkCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        linkCSS.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        linkCSS.crossOrigin = '';
        document.head.appendChild(linkCSS);
      }

      // Carregar JS se não existir
      if (!document.querySelector('script[src*="leaflet"]')) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        
        script.onload = () => {
          console.log('✅ Leaflet carregado dinamicamente');
          resolve();
        };
        
        script.onerror = () => {
          console.error('❌ Erro ao carregar Leaflet');
          reject(new Error('Falha ao carregar Leaflet'));
        };
        
        document.head.appendChild(script);
      } else {
        // Script já existe, aguardar carregar
        const checkLeaflet = setInterval(() => {
          if (typeof L !== 'undefined') {
            clearInterval(checkLeaflet);
            resolve();
          }
        }, 100);
        
        // Timeout após 10 segundos
        setTimeout(() => {
          clearInterval(checkLeaflet);
          reject(new Error('Timeout ao aguardar Leaflet'));
        }, 10000);
      }
    });
  }

  adicionarCamadaTiles() {
    // Camada principal (OpenStreetMap)
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NYXBhIG7Do28gZGlzcG9uw612ZWw8L3RleHQ+PC9zdmc+'
    });

    tileLayer.addTo(this.mapa);

    // Evento de erro para tiles
    tileLayer.on('tileerror', (e) => {
      console.warn('⚠️ Erro ao carregar tile:', e);
    });
  }

  configurarEventos() {
    if (!this.mapa) return;

    // Evento quando o mapa está pronto
    this.mapa.whenReady(() => {
      console.log('🗺️ Mapa pronto para uso');
      this.redimensionar();
    });

    // Evento de erro
    this.mapa.on('error', (e) => {
      console.error('❌ Erro no mapa:', e);
    });

    // Evento de clique (para debug)
    this.mapa.on('click', (e) => {
      console.log(`📍 Clique no mapa: ${e.latlng.lat}, ${e.latlng.lng}`);
    });
  }

  adicionarMarcador(nome, lat, lng, popup = null, opcoes = {}) {
    if (!this.inicializado || !this.mapa) {
      console.warn('⚠️ Mapa não inicializado, não é possível adicionar marcador');
      return null;
    }

    try {
      // Validar coordenadas
      if (!this.validarCoordenadas(lat, lng)) {
        console.error(`❌ Coordenadas inválidas: ${lat}, ${lng}`);
        return null;
      }

      // Configurações padrão do marcador
      const configMarcador = {
        title: nome,
        alt: nome,
        ...opcoes
      };

      // Criar ícone personalizado se especificado
      if (opcoes.icone) {
        configMarcador.icon = this.criarIconePersonalizado(opcoes.icone);
      }

      const marcador = L.marker([lat, lng], configMarcador).addTo(this.mapa);
      
      // Adicionar popup se fornecido
      if (popup) {
        marcador.bindPopup(popup, {
          maxWidth: 300,
          className: 'popup-personalizado'
        });
      }

      // Armazenar marcador
      const itemMarcador = {
        nome: nome,
        marcador: marcador,
        coordenadas: { lat, lng },
        tipo: opcoes.tipo || 'default'
      };

      this.marcadores.push(itemMarcador);

      console.log(`📍 Marcador adicionado: ${nome} (${lat}, ${lng})`);
      return marcador;
      
    } catch (error) {
      console.error('❌ Erro ao adicionar marcador:', error);
      return null;
    }
  }

  criarIconePersonalizado(config) {
    const iconeConfig = {
      iconUrl: config.url || 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: config.size || [25, 41],
      iconAnchor: config.anchor || [12, 41],
      popupAnchor: config.popupAnchor || [1, -34],
      shadowSize: [41, 41]
    };

    return L.icon(iconeConfig);
  }

  validarCoordenadas(lat, lng) {
    return (
      typeof lat === 'number' && 
      typeof lng === 'number' &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180 &&
      !isNaN(lat) && !isNaN(lng)
    );
  }

  adicionarMarcadoresRoteiro(roteiro) {
    if (!roteiro || !roteiro.dias) {
      console.warn('⚠️ Roteiro inválido para adicionar marcadores');
      return;
    }

    console.log('📍 Adicionando marcadores do roteiro...');
    
    // Limpar marcadores existentes
    this.limparMarcadores();

    let totalMarcadores = 0;
    const cores = ['blue', 'red', 'green', 'orange', 'yellow', 'violet', 'grey', 'black'];

    roteiro.dias.forEach((dia, indiceDia) => {
      const cor = cores[indiceDia % cores.length];
      
      dia.atividades.forEach((atividade, indiceAtividade) => {
        if (this.validarCoordenadas(atividade.coordenadas?.lat, atividade.coordenadas?.lng)) {
          const nome = `Dia ${dia.dia}: ${atividade.nome}`;
          const popup = this.criarPopupAtividade(dia, atividade);
          
          const opcoes = {
            tipo: 'atividade',
            dia: dia.dia,
            icone: {
              url: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${cor}.png`
            }
          };

          this.adicionarMarcador(
            nome,
            atividade.coordenadas.lat,
            atividade.coordenadas.lng,
            popup,
            opcoes
          );

          totalMarcadores++;
        }
      });
    });

    console.log(`✅ ${totalMarcadores} marcadores adicionados ao mapa`);

    // Ajustar visualização se houver marcadores
    if (totalMarcadores > 0) {
      setTimeout(() => {
        this.ajustarVisualizacao();
      }, 500);
    }
  }

  criarPopupAtividade(dia, atividade) {
    const validadoIcon = atividade.validado ? '✅' : '⚠️';
    const validadoTexto = atividade.validado ? 'Validado' : 'Não validado';
    
    return `
      <div class="popup-atividade">
        <div class="popup-header">
          <h4>${atividade.nome}</h4>
          <span class="popup-dia">Dia ${dia.dia}</span>
        </div>
        
        <div class="popup-info">
          <div class="popup-item">
            <strong>⏰ Horário:</strong> ${atividade.horario}
          </div>
          
          <div class="popup-item">
            <strong>💰 Custo:</strong> ${atividade.custo}
          </div>
          
          ${atividade.duracao ? `
            <div class="popup-item">
              <strong>⏱️ Duração:</strong> ${atividade.duracao}
            </div>
          ` : ''}
          
          <div class="popup-item">
            <strong>📝 Descrição:</strong> ${atividade.descricao}
          </div>
          
          ${atividade.endereco ? `
            <div class="popup-item">
              <strong>📍 Endereço:</strong> ${atividade.endereco}
            </div>
          ` : ''}
          
          ${atividade.dicas ? `
            <div class="popup-item">
              <strong>💡 Dica:</strong> ${atividade.dicas}
            </div>
          ` : ''}
        </div>
        
        <div class="popup-footer">
          <span class="popup-validacao">
            ${validadoIcon} ${validadoTexto}
          </span>
          ${atividade.fonte ? `
            <small class="popup-fonte">${atividade.fonte}</small>
          ` : ''}
        </div>
      </div>
    `;
  }

  limparMarcadores() {
    console.log('🧹 Limpando marcadores...');
    
    this.marcadores.forEach(item => {
      if (item.marcador && this.mapa) {
        try {
          this.mapa.removeLayer(item.marcador);
        } catch (error) {
          console.warn('⚠️ Erro ao remover marcador:', error);
        }
      }
    });
    
    this.marcadores = [];
    console.log('✅ Marcadores limpos');
  }

  centralizarMapa(lat, lng, zoom = 13) {
    if (!this.inicializado || !this.mapa) {
      console.warn('⚠️ Mapa não inicializado para centralizar');
      return false;
    }

    try {
      if (!this.validarCoordenadas(lat, lng)) {
        console.error(`❌ Coordenadas inválidas para centralizar: ${lat}, ${lng}`);
        return false;
      }

      this.mapa.setView([lat, lng], zoom);
      console.log(`🎯 Mapa centralizado em: ${lat}, ${lng} (zoom: ${zoom})`);
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao centralizar mapa:', error);
      return false;
    }
  }

  ajustarVisualizacao() {
    if (!this.inicializado || !this.mapa || this.marcadores.length === 0) {
      console.warn('⚠️ Mapa não inicializado ou sem marcadores para ajustar');
      return false;
    }

    try {
      const marcadoresValidos = this.marcadores
        .map(item => item.marcador)
        .filter(marcador => marcador && marcador.getLatLng);

      if (marcadoresValidos.length === 0) {
        console.warn('⚠️ Nenhum marcador válido para ajustar visualização');
        return false;
      }

      const group = new L.featureGroup(marcadoresValidos);
      const bounds = group.getBounds();
      
      if (bounds.isValid()) {
        this.mapa.fitBounds(bounds.pad(0.1));
        console.log('🎯 Visualização ajustada para todos os marcadores');
        return true;
      } else {
        console.warn('⚠️ Bounds inválidos para ajustar visualização');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Erro ao ajustar visualização:', error);
      return false;
    }
  }

  redimensionar() {
    if (this.mapa) {
      setTimeout(() => {
        try {
          this.mapa.invalidateSize();
          console.log('🔄 Mapa redimensionado');
        } catch (error) {
          console.warn('⚠️ Erro ao redimensionar mapa:', error);
        }
      }, 100);
    }
  }

  obterEstatisticas() {
    return {
      inicializado: this.inicializado,
      totalMarcadores: this.marcadores.length,
      container: this.containerId,
      centro: this.mapa ? this.mapa.getCenter() : null,
      zoom: this.mapa ? this.mapa.getZoom() : null
    };
  }

  destruir() {
    console.log('🗑️ Destruindo mapa...');
    
    try {
      if (this.mapa) {
        this.limparMarcadores();
        this.mapa.remove();
        this.mapa = null;
      }
      
      this.inicializado = false;
      this.tentativasInicializacao = 0;
      console.log('✅ Mapa destruído com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao destruir mapa:', error);
    }
  }

  // Método para debug
  debug() {
    const stats = this.obterEstatisticas();
    console.log('🔍 Debug MapaRoteiro:', stats);
    return stats;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.MapaRoteiro = MapaRoteiro;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MapaRoteiro;
}

console.log('✅ mapa-roteiro.js carregado e atualizado');