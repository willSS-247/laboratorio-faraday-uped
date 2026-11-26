export class RenderizadorCampo {
  #faseAnimacionCorriente;

  constructor() {
    this.#faseAnimacionCorriente = 0;
  }

  dibujarLineasCampoMagnetico(ctx, iman, origenX, origenY, escalaPxPorCm) {
    const centroX = origenX + iman.posicionX * escalaPxPorCm;
    const largoPx = iman.longitudCm * escalaPxPorCm;
    const poloDerechoEsNorte = iman.polaridadNorteDerecha;
    const direccionCampo = poloDerechoEsNorte ? 1 : -1;

    const intensidadNormalizada = Math.min(1, iman.campoMagnetico / 1.5);
    const cantidadLineas = 4 + Math.round(intensidadNormalizada * 4);
    const opacidad = 0.16 + intensidadNormalizada * 0.28;

    ctx.save();
    ctx.strokeStyle = `rgba(56, 189, 248, ${opacidad.toFixed(3)})`;
    ctx.fillStyle = `rgba(56, 189, 248, ${(opacidad + 0.15).toFixed(3)})`;
    ctx.lineWidth = 1.25;

    for (let i = 1; i <= cantidadLineas; i++) {
      const factor = i / cantidadLineas;
      const dispersionY = (24 + factor * 82) * (0.8 + intensidadNormalizada * 0.35);
      const extensionX = largoPx * (0.72 + factor * 0.65);

      for (const signoVertical of [-1, 1]) {
        const yBucle = origenY + signoVertical * dispersionY;
        const xSalida = centroX + direccionCampo * (largoPx * 0.48);
        const xEntrada = centroX - direccionCampo * (largoPx * 0.48);

        ctx.beginPath();
        ctx.moveTo(xSalida, origenY + signoVertical * (factor * 14));
        ctx.bezierCurveTo(
          centroX + direccionCampo * extensionX,
          yBucle,
          centroX - direccionCampo * extensionX,
          yBucle,
          xEntrada,
          origenY + signoVertical * (factor * 14)
        );
        ctx.stroke();

        this.#dibujarPuntaFlecha(
          ctx,
          centroX,
          yBucle * 0.75 + origenY * 0.25,
          direccionCampo < 0 ? 0 : Math.PI
        );
      }
    }

    ctx.restore();
  }

  dibujarVectoresCorrienteLenz(ctx, bobina, estadoLenz, corrienteMa, origenX, origenY, escalaPxPorCm, deltaTiempoS) {
    if (!estadoLenz.hayInduccion) {
      return;
    }

    const magnitudMa = Math.abs(corrienteMa);
    const intensidadVisual = Math.min(1, magnitudMa / 120);
    const velocidadFlujo = Math.min(14, 1.5 + intensidadVisual * 11);

    this.#faseAnimacionCorriente =
      (this.#faseAnimacionCorriente + estadoLenz.sentidoCorriente * velocidadFlujo * deltaTiempoS) % 1;
    if (this.#faseAnimacionCorriente < 0) {
      this.#faseAnimacionCorriente += 1;
    }

    const centroBobinaX = origenX + bobina.posicionX * escalaPxPorCm;
    const anchoBobinaPx = bobina.anchoCm * escalaPxPorCm;
    const radioVerticalPx = 56;
    const espirasVisibles = Math.min(14, Math.max(5, Math.round(bobina.espiras / 55)));
    const pasoEspira = anchoBobinaPx / espirasVisibles;
    const inicioX = centroBobinaX - anchoBobinaPx / 2;

    ctx.save();
    ctx.fillStyle = `rgba(245, 158, 11, ${(0.45 + intensidadVisual * 0.55).toFixed(2)})`;

    for (let i = 0; i < espirasVisibles; i += 2) {
      const xEspira = inicioX + (i + 0.5) * pasoEspira;
      const yPortador = origenY + (this.#faseAnimacionCorriente * 2 - 1) * (radioVerticalPx * 0.72);
      const anguloFlecha = estadoLenz.sentidoCorriente > 0 ? Math.PI / 2 : -Math.PI / 2;

      this.#dibujarPuntaFlecha(ctx, xEspira + 9, yPortador, anguloFlecha, 5.5);
    }

    this.#dibujarIndicadorPolosInducidos(
      ctx,
      centroBobinaX,
      anchoBobinaPx,
      origenY - radioVerticalPx - 22,
      estadoLenz
    );

    ctx.restore();
  }

  #dibujarIndicadorPolosInducidos(ctx, centroX, anchoPx, posY, estadoLenz) {
    ctx.font = '600 11px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const etiquetas = [
      { texto: `Polo Ind.: ${estadoLenz.poloInducidoIzquierda}`, x: centroX - anchoPx * 0.65, polo: estadoLenz.poloInducidoIzquierda },
      { texto: `Polo Ind.: ${estadoLenz.poloInducidoDerecha}`, x: centroX + anchoPx * 0.65, polo: estadoLenz.poloInducidoDerecha }
    ];

    for (const item of etiquetas) {
      ctx.fillStyle = item.polo === 'N' ? 'rgba(217, 67, 54, 0.22)' : 'rgba(43, 125, 233, 0.22)';
      ctx.strokeStyle = item.polo === 'N' ? '#d94336' : '#2b7de9';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.roundRect(item.x - 48, posY - 11, 96, 22, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#e6edf3';
      ctx.fillText(item.texto, item.x, posY);
    }
  }

  #dibujarPuntaFlecha(ctx, x, y, anguloRad, tamano = 5) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(anguloRad);
    ctx.beginPath();
    ctx.moveTo(tamano, 0);
    ctx.lineTo(-tamano, -tamano * 0.65);
    ctx.lineTo(-tamano * 0.6, 0);
    ctx.lineTo(-tamano, tamano * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}