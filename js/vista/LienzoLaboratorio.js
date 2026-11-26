import { RenderizadorCampo } from './RenderizadorCampo.js';

export class LienzoLaboratorio {
  #canvas;
  #ctx;
  #anchoLogico;
  #altoLogico;
  #escalaPxPorCm;
  #origenX;
  #origenY;
  #renderizadorCampo;
  #arrastrandoIman;
  #offsetArrastreX;

  constructor(canvasElemento) {
    this.#canvas = canvasElemento;
    this.#ctx = canvasElemento.getContext('2d');
    this.#anchoLogico = 1280;
    this.#altoLogico = 720;
    this.#escalaPxPorCm = 24;
    this.#origenX = this.#anchoLogico * 0.56;
    this.#origenY = this.#altoLogico * 0.52;
    this.#renderizadorCampo = new RenderizadorCampo();
    this.#arrastrandoIman = false;
    this.#offsetArrastreX = 0;

    this.#configurarResolucionNitida();
  }

  #configurarResolucionNitida() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.#canvas.width = this.#anchoLogico * dpr;
    this.#canvas.height = this.#altoLogico * dpr;
    this.#ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  contienePuntoEnIman(clienteX, clienteY, iman) {
    const rect = this.#canvas.getBoundingClientRect();
    const xPx = ((clienteX - rect.left) / rect.width) * this.#anchoLogico;
    const yPx = ((clienteY - rect.top) / rect.height) * this.#altoLogico;

    const centroImanPx = this.#origenX + iman.posicionX * this.#escalaPxPorCm;
    const mitadLargoPx = (iman.longitudCm * this.#escalaPxPorCm) / 2 + 18;
    const mitadAltoPx = 32;

    return (
      Math.abs(xPx - centroImanPx) <= mitadLargoPx &&
      Math.abs(yPx - this.#origenY) <= mitadAltoPx
    );
  }

  pixelAPosicionCm(clienteX) {
    const rect = this.#canvas.getBoundingClientRect();
    const xPx = ((clienteX - rect.left) / rect.width) * this.#anchoLogico;
    return (xPx - this.#origenX) / this.#escalaPxPorCm;
  }

  vincularInteraccionIman(iman, alIniciarArrastre, alMoverIman) {
    const obtenerCoordenadaLogicaX = (evento) => {
      const rect = this.#canvas.getBoundingClientRect();
      return ((evento.clientX - rect.left) / rect.width) * this.#anchoLogico;
    };

    this.#canvas.addEventListener('pointerdown', (evento) => {
      if (this.contienePuntoEnIman(evento.clientX, evento.clientY, iman)) {
        const xPx = obtenerCoordenadaLogicaX(evento);
        const centroImanPx = this.#origenX + iman.posicionX * this.#escalaPxPorCm;
        this.#arrastrandoIman = true;
        this.#offsetArrastreX = xPx - centroImanPx;
        this.#canvas.setPointerCapture(evento.pointerId);
        if (typeof alIniciarArrastre === 'function') {
          alIniciarArrastre();
        }
      }
    });

    this.#canvas.addEventListener('pointermove', (evento) => {
      if (!this.#arrastrandoIman) return;
      const xPx = obtenerCoordenadaLogicaX(evento) - this.#offsetArrastreX;
      const nuevaPosicionCm = (xPx - this.#origenX) / this.#escalaPxPorCm;
      if (typeof alMoverIman === 'function') {
        alMoverIman(nuevaPosicionCm);
      }
    });

    const finalizarArrastre = (evento) => {
      if (!this.#arrastrandoIman) return;
      this.#arrastrandoIman = false;
      if (this.#canvas.hasPointerCapture(evento.pointerId)) {
        this.#canvas.releasePointerCapture(evento.pointerId);
      }
    };

    this.#canvas.addEventListener('pointerup', finalizarArrastre);
    this.#canvas.addEventListener('pointercancel', finalizarArrastre);
  }

  #resolverEstadoLenz(motorFaraday) {
    if (typeof motorFaraday.obtenerEstadoLenz === 'function') {
      return motorFaraday.obtenerEstadoLenz();
    }
    if (typeof motorFaraday.determinarLeyLenz === 'function') {
      return motorFaraday.determinarLeyLenz();
    }
    if (motorFaraday.estadoLenz) {
      return motorFaraday.estadoLenz;
    }

    const corriente = motorFaraday.corrienteInducidaMa || 0;
    const hayInduccion = Math.abs(corriente) > 0.25;
    const sentidoCorriente = corriente >= 0 ? 1 : -1;
    const poloInducidoIzquierda = sentidoCorriente > 0 ? 'N' : 'S';
    const poloInducidoDerecha = sentidoCorriente > 0 ? 'S' : 'N';

    return {
      hayInduccion,
      sentidoCorriente,
      poloInducidoIzquierda,
      poloInducidoDerecha
    };
  }

  renderizar(motorFaraday, deltaTiempoS) {
    const ctx = this.#ctx;
    const iman = motorFaraday.iman;
    const bobina = motorFaraday.bobina;
    const estadoLenz = this.#resolverEstadoLenz(motorFaraday);

    ctx.clearRect(0, 0, this.#anchoLogico, this.#altoLogico);

    this.#dibujarFondoYRegla(ctx);
    this.#dibujarSoporteBobina(ctx, bobina);
    this.#dibujarEspirasBobina(ctx, bobina, false);

    this.#renderizadorCampo.dibujarLineasCampoMagnetico(
      ctx,
      iman,
      this.#origenX,
      this.#origenY,
      this.#escalaPxPorCm
    );
    this.#dibujarIman(ctx, iman);

    this.#dibujarEspirasBobina(ctx, bobina, true);
    this.#renderizadorCampo.dibujarVectoresCorrienteLenz(
      ctx,
      bobina,
      estadoLenz,
      motorFaraday.corrienteInducidaMa,
      this.#origenX,
      this.#origenY,
      this.#escalaPxPorCm,
      deltaTiempoS
    );
  }

  #dibujarFondoYRegla(ctx) {
    ctx.save();

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    const pasoCuadricula = 30;
    for (let x = 0; x <= this.#anchoLogico; x += pasoCuadricula) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.#altoLogico);
      ctx.stroke();
    }
    for (let y = 0; y <= this.#altoLogico; y += pasoCuadricula) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.#anchoLogico, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(40, this.#origenY);
    ctx.lineTo(this.#anchoLogico - 40, this.#origenY);
    ctx.stroke();
    ctx.setLineDash([]);

    const yRegla = this.#altoLogico - 96;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(60, yRegla - 10, this.#anchoLogico - 120, 28, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = '500 11px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let cm = -24; cm <= 18; cm++) {
      const x = this.#origenX + cm * this.#escalaPxPorCm;
      if (x < 75 || x > this.#anchoLogico - 75) continue;

      const esPrincipal = cm % 5 === 0;
      const esOrigen = cm === 0;

      ctx.strokeStyle = esOrigen ? '#b45309' : esPrincipal ? '#475569' : '#94a3b8';
      ctx.lineWidth = esOrigen ? 1.8 : 1;
      ctx.beginPath();
      ctx.moveTo(x, yRegla - 10);
      ctx.lineTo(x, yRegla - 10 + (esPrincipal ? 10 : 5));
      ctx.stroke();

      if (esPrincipal) {
        ctx.fillStyle = esOrigen ? '#b45309' : '#475569';
        ctx.fillText(`${cm}`, x, yRegla + 2);
      }
    }

    ctx.restore();
  }

  #dibujarSoporteBobina(ctx, bobina) {
    const centroX = this.#origenX + bobina.posicionX * this.#escalaPxPorCm;
    const anchoPx = bobina.anchoCm * this.#escalaPxPorCm;
    const baseY = this.#origenY + 62;

    ctx.save();
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(centroX - anchoPx / 2 - 14, baseY, anchoPx + 28, 12, 3);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centroX - anchoPx / 2 + 4, this.#origenY + 58);
    ctx.lineTo(centroX - anchoPx / 2 + 4, baseY + 26);
    ctx.lineTo(centroX - 20, baseY + 26);

    ctx.moveTo(centroX + anchoPx / 2 - 4, this.#origenY + 58);
    ctx.lineTo(centroX + anchoPx / 2 - 4, baseY + 26);
    ctx.lineTo(centroX + 20, baseY + 26);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(centroX, baseY + 26, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#92400e';
    ctx.font = '700 11px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('G', centroX, baseY + 26);
    ctx.restore();
  }

  #dibujarIman(ctx, iman) {
    const centroX = this.#origenX + iman.posicionX * this.#escalaPxPorCm;
    const largoPx = iman.longitudCm * this.#escalaPxPorCm;
    const altoPx = 42;
    const xInicio = centroX - largoPx / 2;
    const yInicio = this.#origenY - altoPx / 2;
    const mitadAncho = largoPx / 2;

    const poloDerechoEsNorte = iman.polaridadNorteDerecha;
    const etiquetaIzq = poloDerechoEsNorte ? 'S' : 'N';
    const etiquetaDer = poloDerechoEsNorte ? 'N' : 'S';

    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    const gradIzq = ctx.createLinearGradient(0, yInicio, 0, yInicio + altoPx);
    if (poloDerechoEsNorte) {
      gradIzq.addColorStop(0, '#3b82f6');
      gradIzq.addColorStop(0.45, '#1d4ed8');
      gradIzq.addColorStop(1, '#1e3a8a');
    } else {
      gradIzq.addColorStop(0, '#ef4444');
      gradIzq.addColorStop(0.45, '#dc2626');
      gradIzq.addColorStop(1, '#991b1b');
    }
    ctx.fillStyle = gradIzq;
    ctx.beginPath();
    ctx.roundRect(xInicio, yInicio, mitadAncho, altoPx, [4, 0, 0, 4]);
    ctx.fill();

    const gradDer = ctx.createLinearGradient(0, yInicio, 0, yInicio + altoPx);
    if (poloDerechoEsNorte) {
      gradDer.addColorStop(0, '#ef4444');
      gradDer.addColorStop(0.45, '#dc2626');
      gradDer.addColorStop(1, '#991b1b');
    } else {
      gradDer.addColorStop(0, '#3b82f6');
      gradDer.addColorStop(0.45, '#1d4ed8');
      gradDer.addColorStop(1, '#1e3a8a');
    }
    ctx.fillStyle = gradDer;
    ctx.beginPath();
    ctx.roundRect(xInicio + mitadAncho, yInicio, mitadAncho, altoPx, [0, 4, 4, 0]);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(xInicio, yInicio, largoPx, altoPx, 4);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centroX, yInicio);
    ctx.lineTo(centroX, yInicio + altoPx);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 15px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(etiquetaIzq, xInicio + mitadAncho * 0.5, this.#origenY);
    ctx.fillText(etiquetaDer, xInicio + mitadAncho * 1.5, this.#origenY);

    ctx.restore();
  }

  #dibujarEspirasBobina(ctx, bobina, capaFrontal) {
    const centroX = this.#origenX + bobina.posicionX * this.#escalaPxPorCm;
    const anchoPx = bobina.anchoCm * this.#escalaPxPorCm;
    const radioVerticalPx = 58;
    const radioHorizontalPx = 14;
    const espirasVisibles = Math.min(18, Math.max(6, Math.round(bobina.espiras / 50)));
    const pasoEspira = anchoPx / espirasVisibles;
    const inicioX = centroX - anchoPx / 2;

    ctx.save();
    const gradCobre = ctx.createLinearGradient(0, this.#origenY - radioVerticalPx, 0, this.#origenY + radioVerticalPx);
    if (capaFrontal) {
      gradCobre.addColorStop(0, '#92400e');
      gradCobre.addColorStop(0.35, '#f59e0b');
      gradCobre.addColorStop(0.7, '#d97706');
      gradCobre.addColorStop(1, '#78350f');
    } else {
      gradCobre.addColorStop(0, '#78350f');
      gradCobre.addColorStop(0.5, '#b45309');
      gradCobre.addColorStop(1, '#451a03');
    }

    ctx.strokeStyle = gradCobre;
    ctx.lineWidth = capaFrontal ? 4.8 : 4.2;
    ctx.lineCap = 'round';

    for (let i = 0; i < espirasVisibles; i++) {
      const xEspira = inicioX + (i + 0.5) * pasoEspira;
      ctx.beginPath();
      if (capaFrontal) {
        ctx.ellipse(xEspira, this.#origenY, radioHorizontalPx, radioVerticalPx, 0, -Math.PI / 2, Math.PI / 2);
      } else {
        ctx.ellipse(xEspira, this.#origenY, radioHorizontalPx, radioVerticalPx, 0, Math.PI / 2, (Math.PI * 3) / 2);
      }
      ctx.stroke();
    }

    ctx.restore();
  }
}