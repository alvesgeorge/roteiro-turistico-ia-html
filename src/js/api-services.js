// api-services.js - Serviços de API para geração de roteiros

class ApiServices {
  constructor() {
    this.cache = new Map();
    this.rateLimiters = {
      groq: new RateLimiter(CONFIG.RATE_LIMIT.GROQ, 60000),
      geoapify: new RateLimiter(CONFIG.RATE_LIMIT.GEOAPIFY, 86400000),
      nominatim: new RateLimiter(CONFIG.RATE_LIMIT.NOMINATIM, 1000)
    };
    
    console.log('🔧 ApiServices inicializado');
  }

  // === BUSCAR DESTINOS ===
  async buscarDestinos(query) {
    try {
      console.log('🔍 Buscando destinos para:', query);

      const cacheKey = `destinos_${query}`;
      if (this.cache.has(cacheKey)) {
        console.log('📦 Usando dados do cache');
        return this.cache.get(cacheKey);
      }

      // Tentar Geoapify primeiro
      if (CONFIG.GEOAPIFY_API_KEY && CONFIG.GEOAPIFY_API_KEY !== 'sua_chave_geoapify_aqui') {
        try {
          if (!this.rateLimiters.geoapify.canMakeRequest()) {
            throw new Error('Rate limit excedido para Geoapify');
          }

          const url = `${CONFIG.GEOAPIFY_API_URL}?text=${encodeURIComponent(query)}&apiKey=${CONFIG.GEOAPIFY_API_KEY}&limit=5`;
          const response = await fetch(url);
          
          if (response.ok) {
            const data = await response.json();
            const destinos = this.processarDestinos(data);
            this.cache.set(cacheKey, destinos);
            return destinos;
          }
        } catch (error) {
          console.warn('⚠️ Geoapify falhou:', error.message);
        }
      }

      // Fallback para destinos brasileiros populares
      return this.obterDestinosBrasil(query);

    } catch (error) {
      console.error('❌ Erro ao buscar destinos:', error);
      return this.obterDestinosBrasil(query);
    }
  }

  processarDestinos(data) {
    if (!data.features || data.features.length === 0) {
      return [];
    }

    return data.features.map(feature => ({
      nome: feature.properties.formatted,
      cidade: feature.properties.city || feature.properties.name,
      estado: feature.properties.state,
      pais: feature.properties.country,
      coordenadas: {
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0]
      }
    }));
  }

  obterDestinosBrasil(query) {
    const destinos = [
      { nome: 'São Paulo, SP, Brasil', cidade: 'São Paulo', estado: 'SP', pais: 'Brasil', coordenadas: { lat: -23.5505, lng: -46.6333 } },
      { nome: 'Rio de Janeiro, RJ, Brasil', cidade: 'Rio de Janeiro', estado: 'RJ', pais: 'Brasil', coordenadas: { lat: -22.9068, lng: -43.1729 } },
      { nome: 'Salvador, BA, Brasil', cidade: 'Salvador', estado: 'BA', pais: 'Brasil', coordenadas: { lat: -12.9714, lng: -38.5014 } },
      { nome: 'Brasília, DF, Brasil', cidade: 'Brasília', estado: 'DF', pais: 'Brasil', coordenadas: { lat: -15.8267, lng: -47.9218 } },
      { nome: 'Fortaleza, CE, Brasil', cidade: 'Fortaleza', estado: 'CE', pais: 'Brasil', coordenadas: { lat: -3.7319, lng: -38.5267 } },
      { nome: 'Belo Horizonte, MG, Brasil', cidade: 'Belo Horizonte', estado: 'MG', pais: 'Brasil', coordenadas: { lat: -19.9191, lng: -43.9386 } },
      { nome: 'Manaus, AM, Brasil', cidade: 'Manaus', estado: 'AM', pais: 'Brasil', coordenadas: { lat: -3.1190, lng: -60.0217 } },
      { nome: 'Curitiba, PR, Brasil', cidade: 'Curitiba', estado: 'PR', pais: 'Brasil', coordenadas: { lat: -25.4284, lng: -49.2733 } },
      { nome: 'Recife, PE, Brasil', cidade: 'Recife', estado: 'PE', pais: 'Brasil', coordenadas: { lat: -8.0476, lng: -34.8770 } },
      { nome: 'Porto Alegre, RS, Brasil', cidade: 'Porto Alegre', estado: 'RS', pais: 'Brasil', coordenadas: { lat: -30.0346, lng: -51.2177 } },
      { nome: 'Santos, SP, Brasil', cidade: 'Santos', estado: 'SP', pais: 'Brasil', coordenadas: { lat: -23.9336, lng: -46.3286 } },
      { nome: 'Santo André, SP, Brasil', cidade: 'Santo André', estado: 'SP', pais: 'Brasil', coordenadas: { lat: -23.6624, lng: -46.5319 } },
      { nome: 'Guarujá, SP, Brasil', cidade: 'Guarujá', estado: 'SP', pais: 'Brasil', coordenadas: { lat: -23.9931, lng: -46.2564 } },
      { nome: 'Campinas, SP, Brasil', cidade: 'Campinas', estado: 'SP', pais: 'Brasil', coordenadas: { lat: -22.9099, lng: -47.0626 } },
      { nome: 'Florianópolis, SC, Brasil', cidade: 'Florianópolis', estado: 'SC', pais: 'Brasil', coordenadas: { lat: -27.5954, lng: -48.5480 } }
    ];

    return destinos.filter(destino => 
      destino.nome.toLowerCase().includes(query.toLowerCase()) ||
      destino.cidade.toLowerCase().includes(query.toLowerCase())
    );
  }

  // === GERAR ROTEIRO ===
  async gerarRoteiro(dados) {
    console.log('🎯 Gerando roteiro para:', dados);
    
    // Validar dados recebidos
    if (!dados || !dados.destino) {
      throw new Error('Dados do roteiro são obrigatórios');
    }
    
    return await this.gerarRoteiroIA(dados);
  }

  async gerarRoteiroIA(dados) {
    let ultimoErro = null;
    let roteiro = null;
    
    // 1. TENTAR GEMINI PRIMEIRO (mais rápido e gratuito)
    if (CONFIG.GEMINI_API_KEY && CONFIG.GEMINI_API_KEY !== 'sua_chave_gemini_aqui') {
      try {
        console.log('🤖 Tentando Google Gemini com otimização geográfica...');
        roteiro = await this.tentarGemini(dados);
        console.log('✅ Gemini funcionou!');
      } catch (error) {
        ultimoErro = error.message;
        console.warn('⚠️ Gemini falhou:', error.message);
      }
    }
    
    // 2. FALLBACK PARA OLLAMA
    if (!roteiro && CONFIG.USE_OLLAMA) {
      try {
        console.log('🦙 Tentando Ollama...');
        roteiro = await this.tentarOllama(dados);
        console.log('✅ Ollama funcionou!');
      } catch (error) {
        ultimoErro = error.message;
        console.warn('⚠️ Ollama falhou:', error.message);
      }
    }
    
    // 3. FALLBACK PARA GROQ
    if (!roteiro && CONFIG.GROQ_API_KEY && CONFIG.GROQ_API_KEY !== 'sua_chave_groq_aqui') {
      const modelos = Object.values(CONFIG.AI_MODELS).filter(m => m.includes('llama') || m.includes('mixtral'));
      
      for (const modelo of modelos) {
        try {
          console.log(`📤 Tentando Groq com modelo: ${modelo}`);
          roteiro = await this.tentarGroq(modelo, dados);
          console.log('✅ Groq funcionou!');
          break;
        } catch (error) {
          ultimoErro = error.message;
          console.error(`❌ Erro com modelo ${modelo}:`, error);
          continue;
        }
      }
    }
    
    // 4. FALLBACK PARA ROTEIRO BÁSICO
    if (!roteiro) {
      console.log('🔄 Usando roteiro básico otimizado');
      roteiro = await this.gerarRoteiroBasicoOtimizado(dados);
    }
    
    // 5. VALIDAR LOCAIS REAIS
    try {
      console.log('🔍 Iniciando validação de locais reais...');
      
      const coordenadasCidade = await this.buscarCoordenadas(dados.destino);
      if (coordenadasCidade) {
        roteiro.coordenadas = coordenadasCidade;
      }
      
      // Validar locais reais
      for (const dia of roteiro.dias) {
        if (dia.atividades && dia.atividades.length > 0) {
          console.log(`🔍 Validando atividades do dia ${dia.dia}...`);
          dia.atividades = await this.validarLocaisReais(dia.atividades, dados.destino);
        }
      }
      
      // REOTIMIZAR APÓS VALIDAÇÃO
      roteiro = this.reotimizarRoteiro(roteiro);
      
      // VALIDAR OTIMIZAÇÃO FINAL
      roteiro = this.validarOtimizacaoGeografica(roteiro);
      
      console.log('✅ Validação e otimização completas');
      
    } catch (error) {
      console.error('❌ Erro na validação:', error);
    }
    
    return roteiro;
  }

  // === MÉTODOS DE IA ===

  async tentarGemini(dados) {
    if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY === 'sua_chave_gemini_aqui') {
      throw new Error('Gemini API key não configurada');
    }
    
    const prompt = this.criarPromptOtimizado(dados);
    
    const payload = {
      contents: [{
        parts: [{
          text: `Você é um especialista em turismo brasileiro. Crie roteiros detalhados com locais REAIS.

${prompt}

IMPORTANTE: Responda APENAS com JSON válido, sem texto adicional antes ou depois.`
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4000,
        topP: 0.8,
        topK: 40
      }
    };

    try {
      const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Resposta inválida do Gemini');
      }
      
      const texto = data.candidates[0].content.parts[0].text;
      console.log('✅ Resposta Gemini recebida');
      
      return this.processarRespostaGemini(texto, dados);
      
    } catch (error) {
      console.error('❌ Erro Gemini:', error);
      throw error;
    }
  }

  async tentarOllama(dados) {
    const prompt = this.criarPromptOtimizado(dados);
    
    const payload = {
      model: CONFIG.OLLAMA_MODEL,
      prompt: `Você é um especialista em turismo brasileiro. Crie roteiros detalhados e realistas com locais que realmente existem.

${prompt}

IMPORTANTE: Responda APENAS com JSON válido, sem texto adicional antes ou depois.`,
      stream: false,
      options: {
        temperature: 0.3,
        top_p: 0.9,
        num_predict: 4000
      }
    };

    try {
      const response = await fetch(CONFIG.OLLAMA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Ollama HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      console.log('✅ Resposta Ollama recebida');
      return this.processarRespostaOllama(data, dados);
      
    } catch (error) {
      if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
        throw new Error('Ollama não está rodando. Execute: ollama serve');
      }
      throw error;
    }
  }

  async tentarGroq(modelo, dados) {
    const prompt = this.criarPromptOtimizado(dados);
    
    const payload = {
      model: modelo,
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em turismo brasileiro. Responda APENAS com JSON válido e completo, sem texto adicional.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 6000,
      temperature: 0.3
    };

    const response = await fetch(CONFIG.GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      const roteiro = this.processarRoteiroIA(data, dados);
      console.log(`✅ Roteiro gerado com sucesso (${modelo})`);
      return roteiro;
    } else {
      const errorText = await response.text();
      throw new Error(`Groq erro ${response.status}: ${errorText}`);
    }
  }

  // === PROCESSAMENTO DE RESPOSTAS ===

  processarRespostaGemini(texto, dadosOriginais) {
    try {
      console.log('📝 Processando resposta Gemini...');
      
      let jsonMatch = texto.match(/{[\s\S]*}/);
      if (jsonMatch) {
        let jsonString = this.corrigirJsonIncompleto(jsonMatch[0]);
        const roteiro = JSON.parse(jsonString);
        
        if (!roteiro.dias || !Array.isArray(roteiro.dias)) {
          throw new Error('Estrutura de roteiro inválida');
        }
        
        return {
          ...roteiro,
          coordenadas: dadosOriginais.coordenadas,
          geradoEm: new Date().toISOString(),
          fonte: 'Google Gemini'
        };
      }
      
      throw new Error('JSON não encontrado na resposta do Gemini');
      
    } catch (error) {
      console.error('❌ Erro ao processar Gemini:', error);
      throw new Error(`Erro ao processar resposta do Gemini: ${error.message}`);
    }
  }

  processarRespostaOllama(data, dadosOriginais) {
    try {
      const conteudo = data.response.trim();
      console.log('📝 Processando resposta Ollama...');
      
      let jsonMatch = conteudo.match(/{[\s\S]*}/);
      if (jsonMatch) {
        let jsonString = this.corrigirJsonIncompleto(jsonMatch[0]);
        const roteiro = JSON.parse(jsonString);
        
        if (!roteiro.dias || !Array.isArray(roteiro.dias)) {
          throw new Error('Estrutura de roteiro inválida');
        }
        
        return {
          ...roteiro,
          coordenadas: dadosOriginais.coordenadas,
          geradoEm: new Date().toISOString(),
          fonte: 'Ollama'
        };
      }
      
      throw new Error('JSON não encontrado na resposta');
      
    } catch (error) {
      console.error('❌ Erro ao processar Ollama:', error);
      throw new Error(`Erro ao processar resposta: ${error.message}`);
    }
  }

  processarRoteiroIA(data, dadosOriginais) {
    try {
      const conteudo = data.choices[0].message.content.trim();
      console.log('🔍 Processando resposta da IA...');
      
      let jsonMatch = conteudo.match(/{[\s\S]*}/);
      if (jsonMatch) {
        let jsonString = this.corrigirJsonIncompleto(jsonMatch[0]);
        const roteiro = JSON.parse(jsonString);
        
        if (!roteiro.dias || !Array.isArray(roteiro.dias)) {
          throw new Error('Estrutura de roteiro inválida');
        }
        
        return {
          ...roteiro,
          coordenadas: dadosOriginais.coordenadas,
          geradoEm: new Date().toISOString(),
          fonte: 'Groq'
        };
      }
      
      throw new Error('Não foi possível extrair JSON válido da resposta');
      
    } catch (error) {
      console.error('❌ Erro ao processar roteiro da IA:', error);
      throw new Error(`Erro ao processar roteiro: ${error.message}`);
    }
  }

  // === ROTEIRO BÁSICO ===

  async gerarRoteiroBasicoOtimizado(dados) {
    const numDias = this.extrairNumeroDias(dados.duracao);
    const cidade = dados.destino.split(',')[0].trim();
    
    const roteiro = {
      titulo: `Roteiro Otimizado ${dados.destino} - ${numDias} dias`,
      destino: dados.destino,
      duracao: `${numDias} dias`,
      orcamento: dados.orcamento,
      resumo: 'Roteiro básico otimizado geograficamente',
      dias: [],
      fonte: 'Roteiro Básico Otimizado'
    };
    
    // Regiões organizadas por proximidade
    const regioes = [
      { nome: 'Centro', coordenadas: { lat: -23.6533, lng: -46.5279 } },
      { nome: 'Vila Assunção', coordenadas: { lat: -23.6400, lng: -46.5200 } },
      { nome: 'Jardim', coordenadas: { lat: -23.6600, lng: -46.5100 } }
    ];
    
    for (let i = 1; i <= numDias; i++) {
      const regiao = regioes[i - 1] || regioes[0];
      
      const dia = {
        dia: i,
        titulo: `${regiao.nome} - ${cidade}`,
        regiao: regiao.nome,
        coordenadas_regiao: regiao.coordenadas,
        atividades: this.gerarAtividadesOtimizadas(dados, i, cidade, regiao)
      };
      roteiro.dias.push(dia);
    }
    
    return roteiro;
  }

  gerarAtividadesOtimizadas(dados, dia, cidade, regiao) {
    const atividades = [];
    const interesses = dados.interesses.toLowerCase();
    
    // Coordenadas base da região
    const baseLat = regiao.coordenadas.lat;
    const baseLng = regiao.coordenadas.lng;
    
    // Gerar atividades próximas geograficamente
    atividades.push({
      horario: '08:30',
      nome: `Café da manhã - ${regiao.nome}`,
      tipo: 'cafe',
      descricao: 'Café da manhã local',
      custo: 'R$ 20,00',
      duracao: '1 hora',
      coordenadas: {
        lat: baseLat + (Math.random() - 0.5) * 0.01,
        lng: baseLng + (Math.random() - 0.5) * 0.01
      }
    });
    
    if (interesses.includes('cultura') || interesses.includes('história')) {
      atividades.push({
        horario: '10:00',
        nome: `Atração cultural - ${regiao.nome}`,
        tipo: 'atracao',
        descricao: 'Ponto turístico da região',
        custo: 'R$ 15,00',
        duracao: '2 horas',
        coordenadas: {
          lat: baseLat + (Math.random() - 0.5) * 0.008,
          lng: baseLng + (Math.random() - 0.5) * 0.008
        }
      });
    }
    
    atividades.push({
      horario: '12:30',
      nome: `Restaurante - ${regiao.nome}`,
      tipo: 'restaurante',
      descricao: 'Almoço na região',
      custo: 'R$ 45,00',
      duracao: '1.5 horas',
      coordenadas: {
        lat: baseLat + (Math.random() - 0.5) * 0.006,
        lng: baseLng + (Math.random() - 0.5) * 0.006
      }
    });
    
    return atividades;
  }

  // === VALIDAÇÃO DE LOCAIS REAIS ===

  async validarLocaisReais(atividades, cidade) {
    const atividadesValidadas = [];
    
    const coordenadasCidade = await this.buscarCoordenadas(cidade);
    
    console.log(`🔍 Validando ${atividades.length} atividades para ${cidade}`);
    console.log(`📍 Coordenadas da cidade: ${coordenadasCidade?.lat}, ${coordenadasCidade?.lng}`);
    
    for (let i = 0; i < atividades.length; i++) {
      const atividade = atividades[i];
      
      try {
        console.log(`🔍 Validando ${i + 1}/${atividades.length}: ${atividade.nome}`);
        
        // VALIDAR SE COORDENADAS ESTÃO PRÓXIMAS DA CIDADE
        if (atividade.coordenadas && coordenadasCidade) {
          const distanciaDaCidade = this.calcularDistancia(
            atividade.coordenadas, 
            coordenadasCidade
          );
          
          console.log(`📏 Distância da cidade: ${distanciaDaCidade.toFixed(2)}km`);
          
          // Se estiver muito longe (>50km), marcar como inválido
          if (distanciaDaCidade > 50) {
            console.warn(`⚠️ Atividade muito longe da cidade (${distanciaDaCidade.toFixed(2)}km)`);
            atividade.coordenadas = null; // Forçar nova busca
          }
        }
        
        // Buscar local real se não tiver coordenadas válidas
        if (!atividade.coordenadas) {
          const localReal = await this.buscarLocalReal(atividade.nome, cidade);
          
          if (localReal) {
            atividade.coordenadas = localReal.coordenadas;
            atividade.endereco = localReal.endereco;
            atividade.validado = true;
            atividade.fonte = localReal.fonte;
            
            console.log(`✅ ${i + 1}/${atividades.length} - Validado: ${atividade.nome}`);
          } else {
            // Buscar local similar
            const localSimilar = await this.buscarLocalSimilar(atividade.tipo, cidade);
            
            if (localSimilar) {
              atividade.nome = localSimilar.nome;
              atividade.coordenadas = localSimilar.coordenadas;
              atividade.endereco = localSimilar.endereco;
              atividade.validado = true;
              atividade.fonte = 'OpenStreetMap (similar)';
              
              console.log(`✅ ${i + 1}/${atividades.length} - Substituído: ${atividade.nome}`);
            } else {
              // Usar coordenadas da cidade como fallback
              atividade.coordenadas = {
                lat: coordenadasCidade.lat + (Math.random() - 0.5) * 0.01,
                lng: coordenadasCidade.lng + (Math.random() - 0.5) * 0.01
              };
              atividade.endereco = `${cidade} - Localização aproximada`;
              atividade.validado = false;
              atividade.fonte = 'Coordenadas aproximadas';
              
              console.warn(`⚠️ ${i + 1}/${atividades.length} - Coordenadas aproximadas: ${atividade.nome}`);
            }
          }
        }
        
        atividadesValidadas.push(atividade);
        
        // Delay para respeitar rate limit
        if (i < atividades.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`❌ Erro ao validar ${atividade.nome}:`, error);
        
        // Fallback com coordenadas da cidade
        atividade.coordenadas = coordenadasCidade ? {
          lat: coordenadasCidade.lat + (Math.random() - 0.5) * 0.01,
          lng: coordenadasCidade.lng + (Math.random() - 0.5) * 0.01
        } : null;
        atividade.validado = false;
        atividade.fonte = 'Erro na validação';
        
        atividadesValidadas.push(atividade);
      }
    }
    
    const validados = atividadesValidadas.filter(a => a.validado).length;
    console.log(`✅ Validação concluída: ${validados}/${atividades.length} locais validados`);
    
    return atividadesValidadas;
  }

  async buscarLocalReal(nomeLocal, cidade) {
    const query = `${nomeLocal} ${cidade}`;
    
    try {
      console.log(`🔍 Buscando local real: ${query}`);
      
      const params = new URLSearchParams({
        format: 'json',
        q: query,
        limit: '1',
        countrycodes: 'br',
        addressdetails: '1'
      });
      
      const url = `${CONFIG.NOMINATIM_API_URL}?${params}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Gerador-Roteiros/1.0 (contato@exemplo.com)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Nominatim HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const local = data[0];
        
        console.log(`✅ Local encontrado: ${local.display_name}`);
        
        return {
          nome: local.display_name.split(',')[0],
          coordenadas: {
            lat: parseFloat(local.lat),
            lng: parseFloat(local.lon)
          },
          endereco: local.display_name,
          validado: true,
          fonte: 'OpenStreetMap'
        };
      } else {
        console.warn(`⚠️ Nenhum local encontrado para: ${query}`);
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao buscar local real:', error);
      return null;
    }
  }

  async buscarLocalSimilar(tipo, cidade) {
    const tiposMap = {
      'cafe': 'padaria cafe cafeteria',
      'atracao': 'museu centro cultural igreja',
      'restaurante': 'restaurante lanchonete',
      'almoco': 'restaurante self service',
      'jantar': 'restaurante pizzaria',
      'hotel': 'hotel pousada',
      'shopping': 'shopping center',
      'parque': 'parque praça',
      'praia': 'praia beach',
      'igreja': 'igreja cathedral',
      'mercado': 'mercado supermercado'
    };
    
    const termoBusca = tiposMap[tipo] || 'estabelecimento comercial';
    
    const queries = [
      `${termoBusca} ${cidade}`,
      `${tipo} ${cidade}`,
      `${cidade} ${termoBusca}`,
      `comercio ${cidade}`
    ];
    
    for (const query of queries) {
      try {
        console.log(`🔍 Tentando busca: ${query}`);
        
        const params = new URLSearchParams({
          format: 'json',
          q: query,
          limit: '3',
          countrycodes: 'br'
        });
        
        const url = `${CONFIG.NOMINATIM_API_URL}?${params}`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Gerador-Roteiros/1.0 (contato@exemplo.com)'
          }
        });
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          const coordenadasCidade = await this.buscarCoordenadas(cidade);
          
          for (const local of data) {
            const coordenadasLocal = {
              lat: parseFloat(local.lat),
              lng: parseFloat(local.lon)
            };
            
            if (coordenadasCidade) {
              const distancia = this.calcularDistancia(coordenadasLocal, coordenadasCidade);
              
              if (distancia < 20) {
                console.log(`✅ Local similar encontrado: ${local.display_name} (${distancia.toFixed(2)}km)`);
                
                return {
                  nome: local.display_name.split(',')[0],
                  coordenadas: coordenadasLocal,
                  endereco: local.display_name,
                  validado: true,
                  fonte: 'OpenStreetMap'
                };
              }
            }
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Erro na busca ${query}:`, error);
      }
    }
    
    console.warn(`⚠️ Nenhum local similar encontrado para ${tipo} em ${cidade}`);
    return null;
  }

  async buscarCoordenadas(cidade) {
    try {
      console.log(`🗺️ Buscando coordenadas de: ${cidade}`);
      
      const params = new URLSearchParams({
        format: 'json',
        q: cidade,
        limit: '1',
        countrycodes: 'br'
      });
      
      const url = `${CONFIG.NOMINATIM_API_URL}?${params}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Gerador-Roteiros/1.0 (contato@exemplo.com)'
        }
      });
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const local = data[0];
        
        const coordenadas = {
          lat: parseFloat(local.lat),
          lng: parseFloat(local.lon)
        };
        
        console.log(`✅ Coordenadas encontradas: ${coordenadas.lat}, ${coordenadas.lng}`);
        return coordenadas;
      }
    } catch (error) {
      console.error('❌ Erro ao buscar coordenadas:', error);
    }
    
    return null;
  }

  // === OTIMIZAÇÃO GEOGRÁFICA ===

  reotimizarRoteiro(roteiro) {
    console.log('🔄 Reotimizando roteiro após validação...');
    
    for (const dia of roteiro.dias) {
      if (!dia.atividades || dia.atividades.length < 2) continue;
      
      const atividadesComCoordenadas = dia.atividades.filter(
        a => a.coordenadas && a.coordenadas.lat && a.coordenadas.lng
      );
      
      if (atividadesComCoordenadas.length < 2) continue;
      
      const atividadesOrdenadas = this.ordenarPorProximidade(atividadesComCoordenadas);
      
      const horariosBase = ['08:30', '10:00', '12:00', '14:00', '16:00', '18:00'];
      atividadesOrdenadas.forEach((atividade, index) => {
        if (horariosBase[index]) {
          atividade.horario = horariosBase[index];
        }
      });
      
      dia.atividades = atividadesOrdenadas;
      
      console.log(`✅ Dia ${dia.dia} reotimizado`);
    }
    
    return this.validarOtimizacaoGeografica(roteiro);
  }

  ordenarPorProximidade(atividades) {
    if (atividades.length <= 1) return atividades;
    
    const ordenadas = [atividades[0]];
    const restantes = atividades.slice(1);
    
    while (restantes.length > 0) {
      const ultima = ordenadas[ordenadas.length - 1];
      let maisProxima = 0;
      let menorDistancia = Infinity;
      
      restantes.forEach((atividade, index) => {
        const distancia = this.calcularDistancia(ultima.coordenadas, atividade.coordenadas);
        if (distancia < menorDistancia) {
          menorDistancia = distancia;
          maisProxima = index;
        }
      });
      
      ordenadas.push(restantes[maisProxima]);
      restantes.splice(maisProxima, 1);
    }
    
    return ordenadas;
  }

  validarOtimizacaoGeografica(roteiro) {
    console.log('🗺️ Validando otimização geográfica...');
    
    for (const dia of roteiro.dias) {
      if (!dia.atividades || dia.atividades.length < 2) continue;
      
      const coordenadas = dia.atividades
        .filter(a => a.coordenadas && a.coordenadas.lat && a.coordenadas.lng)
        .map(a => a.coordenadas);
      
      if (coordenadas.length < 2) continue;
      
      const distancias = [];
      for (let i = 0; i < coordenadas.length - 1; i++) {
        const dist = this.calcularDistancia(
          coordenadas[i], 
          coordenadas[i + 1]
        );
        distancias.push(dist);
      }
      
      const distanciaMaxima = Math.max(...distancias);
      const distanciaTotal = distancias.reduce((sum, d) => sum + d, 0);
      
      console.log(`📏 Dia ${dia.dia}:`);
      console.log(`  - Distância máxima entre atividades: ${distanciaMaxima.toFixed(2)}km`);
      console.log(`  - Distância total do dia: ${distanciaTotal.toFixed(2)}km`);
      
      dia.otimizacao = {
        distancia_maxima: `${distanciaMaxima.toFixed(2)}km`,
        distancia_total: `${distanciaTotal.toFixed(2)}km`,
        otimizado: distanciaMaxima <= 2.0
      };
      
      if (distanciaMaxima > 2.0) {
        console.warn(`⚠️ Dia ${dia.dia} não está bem otimizado (${distanciaMaxima.toFixed(2)}km)`);
      } else {
        console.log(`✅ Dia ${dia.dia} bem otimizado`);
      }
    }
    
    return roteiro;
  }

  // === UTILITÁRIOS ===

  criarPromptOtimizado(dados) {
    const diasNumero = this.extrairNumeroDias(dados.duracao);
    const cidade = dados.destino.split(',')[0].trim();
    
    return `Crie um roteiro turístico OTIMIZADO GEOGRAFICAMENTE de ${diasNumero} dias para ${dados.destino}.

ORÇAMENTO: ${dados.orcamento}
INTERESSES: ${dados.interesses}

REGRAS OBRIGATÓRIAS DE OTIMIZAÇÃO:
1. AGRUPE atividades por PROXIMIDADE GEOGRÁFICA no mesmo dia
2. NUNCA repita o mesmo estabelecimento
3. Use APENAS locais REAIS que existem em ${cidade}
4. Coordenadas PRECISAS e PRÓXIMAS entre si no mesmo dia
5. Horários LÓGICOS: café da manhã (8h-10h), almoço (12h-14h), jantar (18h-21h)
6. Máximo 1km de distância entre atividades do mesmo dia
7. Organize por REGIÕES: Centro, Bairros próximos, Periferia

ESTRUTURA JSON OBRIGATÓRIA:
{
  "titulo": "Roteiro Otimizado ${dados.destino} - ${diasNumero} dias",
  "destino": "${dados.destino}",
  "duracao": "${diasNumero} dias",
  "orcamento": "${dados.orcamento}",
  "resumo": "Roteiro otimizado geograficamente com locais próximos por dia",
  "dias": [
    {
      "dia": 1,
      "titulo": "Centro Histórico de ${cidade}",
      "regiao": "Centro",
      "atividades": [
        {
          "horario": "08:30",
          "nome": "Nome REAL e ESPECÍFICO do estabelecimento",
          "tipo": "cafe",
          "descricao": "Descrição específica do local",
          "duracao": "1 hora",
          "custo": "R$ 25,00",
          "endereco": "Endereço completo REAL",
          "coordenadas": {"lat": -23.xxxx, "lng": -46.xxxx},
          "dicas": "Dica útil sobre o local"
        }
      ]
    }
  ]
}

IMPORTANTE: 
- NUNCA repita estabelecimentos
- SEMPRE use nomes REAIS e específicos
- COORDENADAS devem estar próximas no mesmo dia
- Responda APENAS com JSON válido`;
  }

  calcularDistancia(coord1, coord2) {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLon = this.toRad(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI/180);
  }

  corrigirJsonIncompleto(jsonString) {
    try {
      JSON.parse(jsonString);
      return jsonString;
    } catch (error) {
      console.log('🔧 Tentando corrigir JSON incompleto...');
      
      let corrigido = jsonString;
      
      const primeiraChave = corrigido.indexOf('{');
      if (primeiraChave > 0) {
        corrigido = corrigido.substring(primeiraChave);
      }
      
      const abertas = (corrigido.match(/{/g) || []).length;
      const fechadas = (corrigido.match(/}/g) || []).length;
      const colchetesAbertos = (corrigido.match(/\[/g) || []).length;
      const colchetesFechados = (corrigido.match(/\]/g) || []).length;
      
      const colchetesFaltando = colchetesAbertos - colchetesFechados;
      if (colchetesFaltando > 0) {
        corrigido += ']'.repeat(colchetesFaltando);
      }
      
      const chavesFaltando = abertas - fechadas;
      if (chavesFaltando > 0) {
        corrigido += '}'.repeat(chavesFaltando);
      }
      
      corrigido = corrigido.replace(/,(\s*[}\]])/g, '$1');
      
      JSON.parse(corrigido);
      return corrigido;
    }
  }

  extrairNumeroDias(duracao) {
    const match = duracao.match(/(\d+)\s*dias?/i) || duracao.match(/(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  // === IMAGENS (DESABILITADAS) ===
  async buscarImagens(destino) {
    console.log('🖼️ Imagens desabilitadas temporariamente');
    return [];
  }

  // === AUXILIARES ===
  limparCache() {
    this.cache.clear();
    console.log('✅ Cache limpo');
  }
}

// === RATE LIMITER ===
class RateLimiter {
  constructor(maxTokens, windowMs) {
    this.maxTokens = maxTokens;
    this.windowMs = windowMs;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  canMakeRequest() {
    this.refillTokens();
    return this.tokens > 0;
  }

  refillTokens() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    
    if (timePassed >= this.windowMs) {
      this.tokens = this.maxTokens;
      this.lastRefill = now;
    }
  }

  get tokensRemaining() {
    this.refillTokens();
    return this.tokens;
  }
}

// === EXPORTAR ===
if (typeof window !== 'undefined') {
  window.ApiServices = ApiServices;
  window.RateLimiter = RateLimiter;
}

console.log('✅ api-services.js carregado e atualizado');