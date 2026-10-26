(function () {
  'use strict';

  // ============================================================
  // 1. Configurações (as mesmas ideias do coracao_idiomas.py)
  // ============================================================
  var PARA = 'Para você';             // nome escrito no envelope
  var COR = [232, 183, 90];            // dourado final (r, g, b)
  var COR_DA_PISCADA = [255, 255, 255];// a frase nasce nessa cor
  var DURACAO_PISCADA_MS = 380;
  var MS_POR_FRASE_CONTORNO = 40;
  var MS_POR_FRASE_RECHEIO = 18;
  var PAUSA_ENTRE_ETAPAS_MS = 300;
  var FRASE_FINAL = 'Jesus ama você';
  var ESPACO_ENTRE_PALAVRAS = 0.9;     // em "letras" (multiplica o tamanho da fonte)
  var ESPACO_ENTRE_LINHAS = 0.2;

  // "Jesus te ama" em 20 idiomas
  var FRASES = [
    'Jesus loves you',            // inglês
    'Jesus te ama',               // português
    'Jesús te ama',               // espanhol
    "Jésus t'aime",               // francês
    'Gesù ti ama',                // italiano
    'Jesus liebt dich',           // alemão
    'Jezus houdt van jou',        // holandês
    'Jesus älskar dig',           // sueco
    'Jezus cię kocha',            // polonês
    'Иисус любит тебя',           // russo
    "Ο Ιησούς σ' αγαπά",          // grego
    'İsa seni seviyor',           // turco
    'イエスはあなたを愛しています',    // japonês
    '예수님은 당신을 사랑합니다',      // coreano
    '耶稣爱你',                    // chinês
    'यीशु तुमसे प्यार करता है',        // hindi
    'Yesus mengasihimu',          // indonésio
    'Isus te iubește',            // romeno
    'Mahal ka ni Hesus',          // filipino
    'Iesus te amat'               // latim
  ];

  var reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('addr').textContent = PARA;

  // ============================================================
  // 2. A forma da cruz
  //    Um polígono de 12 cantos, em "unidades" (y cresce pra cima).
  //    A escala e a posição na tela vêm depois, no planejar().
  // ============================================================
  var BRACO = 3.2;          // metade da grossura das duas traves
  var CRUZ = [
    [-BRACO, 15], [BRACO, 15],          // topo
    [BRACO, 9.4], [12, 9.4],            // braço direito, em cima
    [12, 3], [BRACO, 3],                // braço direito, embaixo
    [BRACO, -17], [-BRACO, -17],        // pé
    [-BRACO, 3], [-12, 3],              // braço esquerdo, embaixo
    [-12, 9.4], [-BRACO, 9.4]           // braço esquerdo, em cima
  ];
  var CENTRO_DA_CRUZ = 6.2;  // altura onde as traves se cruzam

  // Onde uma linha horizontal na altura y cruza o contorno.
  // Devolve os trechos [inicio, fim] que ficam DENTRO da cruz.
  function cortesNaAltura(poligono, y) {
    var xs = [];
    for (var i = 0; i < poligono.length; i++) {
      var a = poligono[i], b = poligono[(i + 1) % poligono.length];
      if ((a[1] > y) !== (b[1] > y)) xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
    }
    xs.sort(function (p, q) { return p - q; });
    var trechos = [];
    for (var k = 0; k + 1 < xs.length; k += 2) trechos.push([xs[k], xs[k + 1]]);
    return trechos;
  }

  function embaralhar(lista) {
    for (var i = lista.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = lista[i]; lista[i] = lista[j]; lista[j] = t;
    }
    return lista;
  }

  // ============================================================
  // 3. Planejar as posições (sem desenhar ainda)
  //    Em JS o y do canvas cresce pra BAIXO; no turtle crescia pra cima.
  // ============================================================
  function planejar(ctx, larguraTela, alturaTela) {
    // escala da forma na tela
    // a cruz mede 24 x 32 unidades; sobra espaço embaixo pra frase final
    var escala = Math.min(larguraTela * 0.9 / 24, alturaTela * 0.68 / 32);
    var tamanho = Math.max(7, Math.round(escala * 0.36));       // fonte acompanha a tela
    ctx.font = 'bold ' + tamanho + 'px Arial, "Noto Sans", sans-serif';
    var alturaLinha = tamanho * 1.25;

    var cx = larguraTela / 2, cy = alturaTela * 0.39;
    var forma = CRUZ.map(function (p) { return [cx + p[0] * escala, cy - p[1] * escala]; });
    var ys = forma.map(function (p) { return p[1]; });
    var topo = Math.min.apply(null, ys), base = Math.max.apply(null, ys);

    var borda = [], miolo = [], espaco = tamanho * ESPACO_ENTRE_PALAVRAS;
    for (var y = topo + alturaLinha * 0.6; y < base; y += alturaLinha + tamanho * ESPACO_ENTRE_LINHAS) {
      cortesNaAltura(forma, y).forEach(function (trecho) {
        var disponivel = trecho[1] - trecho[0], linha = [], usado = 0;
        for (var n = 0; n < 60; n++) {
          var texto = FRASES[Math.floor(Math.random() * FRASES.length)];
          var w = ctx.measureText(texto).width;
          var extra = linha.length ? espaco : 0;
          if (usado + extra + w <= disponivel) { linha.push([texto, w]); usado += extra + w; }
        }
        if (!linha.length) return;
        // justificar: espalha a sobra entre as palavras
        var sobra = disponivel - usado, gap, x;
        if (linha.length > 1 && sobra / (linha.length - 1) < espaco * 3) {
          gap = espaco + sobra / (linha.length - 1); x = trecho[0];
        } else { gap = espaco; x = trecho[0] + sobra / 2; }
        linha.forEach(function (item, k) {
          var frase = { x: x + item[1] / 2, y: y, texto: item[0] };
          (k === 0 || k === linha.length - 1 ? borda : miolo).push(frase);
          x += item[1] + gap;
        });
      });
    }

    // borda em ordem de caneta: do topo da cruz, sentido horário
    var centroY = cy - CENTRO_DA_CRUZ * escala;
    borda.sort(function (a, b) {
      var ang = function (f) { var v = Math.atan2(f.x - cx, centroY - f.y); return v < 0 ? v + 2 * Math.PI : v; };
      return ang(a) - ang(b);
    });
    return { borda: borda, miolo: embaralhar(miolo), fonte: ctx.font, baseDaCruz: base };
  }

  // ============================================================
  // 4. Desenhar: cada frase nasce branca e esfria até o vermelho.
  //    No canvas não dá pra "mudar a cor" de algo já desenhado,
  //    então redesenhamos a tela inteira a cada quadro.
  // ============================================================
  var tela = document.getElementById('tela'), ctx = tela.getContext('2d');
  var plano = null, agenda = [], inicio = 0, rodando = false;

  function ajustarTela() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    tela.width = Math.round(innerWidth * dpr); tela.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function montarAgenda() {
    plano = planejar(ctx, innerWidth, innerHeight);
    agenda = []; var t = 0;
    plano.borda.forEach(function (f) { agenda.push({ f: f, t: t }); t += MS_POR_FRASE_CONTORNO; });
    t += PAUSA_ENTRE_ETAPAS_MS;
    plano.miolo.forEach(function (f) { agenda.push({ f: f, t: t }); t += MS_POR_FRASE_RECHEIO; });
  }

  function mistura(a, b, k) {
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * k) + ',' + Math.round(a[1] + (b[1] - a[1]) * k) + ',' + Math.round(a[2] + (b[2] - a[2]) * k) + ')';
  }

  function quadro(agora) {
    var decorrido = reduzir ? 1e9 : agora - inicio;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.font = plano.fonte; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var terminou = true;
    for (var i = 0; i < agenda.length; i++) {
      var idade = decorrido - agenda[i].t;
      if (idade < 0) { terminou = false; continue; }
      var k = Math.min(1, idade / DURACAO_PISCADA_MS);
      if (k < 1) terminou = false;
      ctx.fillStyle = mistura(COR_DA_PISCADA, COR, k);
      ctx.fillText(agenda[i].f.texto, agenda[i].f.x, agenda[i].f.y);
    }
    if (!terminou) requestAnimationFrame(quadro);
    else {
      rodando = false;
      var f = document.getElementById('final');
      f.textContent = FRASE_FINAL;
      f.style.top = (plano.baseDaCruz + Math.max(18, innerHeight * 0.04)) + 'px';
      requestAnimationFrame(function () { f.classList.add('show'); });
      var b = document.getElementById('again'); b.hidden = false; requestAnimationFrame(function () { b.classList.add('show'); }); }
  }

  function comecar() {
    ajustarTela(); montarAgenda();
    inicio = performance.now(); rodando = true;
    requestAnimationFrame(quadro);
  }

  // ============================================================
  // 5. A carta
  // ============================================================
  document.getElementById('seal').addEventListener('click', function () {
    document.getElementById('env').classList.add('open');
    document.getElementById('hint').textContent = '';
    setTimeout(function () { document.getElementById('stage').classList.add('gone'); }, reduzir ? 0 : 1000);
    setTimeout(comecar, reduzir ? 0 : 1600);
  });

  document.getElementById('again').addEventListener('click', function () {
    var b = document.getElementById('again'); b.classList.remove('show'); b.hidden = true;
    document.getElementById('final').classList.remove('show');
    comecar();
  });

  // girou o celular? refaz a cruz no tamanho novo
  var timer;
  window.addEventListener('resize', function () {
    if (!plano) return;
    clearTimeout(timer);
    timer = setTimeout(function () { if (!rodando) { ajustarTela(); montarAgenda(); inicio = performance.now() - 1e9; requestAnimationFrame(quadro); } }, 200);
  });
})();
