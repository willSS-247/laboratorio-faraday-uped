import { RenderizadorCampo } from './RenderizadorCampo.js';

export class LienzoLaboratorio {
  #canvas;
  #ctx;
  #renderizadorCampo;
  #anchoLogico;
  #altoLogico;
  #escalaPxPorCm;

  constructor(canvasElemento) {
    this.#canvas = canvasElemento;
    this.#ctx = canvasElemento.getContext('2d');
    this.#renderizadorCampo = new RenderizadorCampo();
    this.#anchoLogico = 820;
    this.#altoLogico = 340;
    this.#escalaPxPorCm = 20;
    this.#configurarResolucionNitida();
  }

  #configurarResolucionNitida() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.#canvas.width = this.#anchoLogico * dpr;
    this.#canvas.height = this.#altoLogico * dpr;
    this.#ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  get origenX() {
    return this.#anchoLogico / 2;
  }

  get origenY() {
    return this.#altoLogico * 0.48;
  }

  pixelAPosicionCm(clientX) {
    const rect = this.#canvas.getBoundingClientRect();
    const escalaX = this.#anchoLogico / rect.width;
    const xCanvas = (clientX - rect.left) * escalaX;
    return (xCanvas - this.origenX) / this.#escalaPxPorCm;
  }

  contienePuntoEnIman(clientX, clientY, iman) {
    const rect = this.#canvas.getBoundingClientRect();
    const xCanvas = (clientX - rect.left) * (this.#anchoLogico / rect.width);
    const yCanvas = (clientY - rect.top) * (this.#altoLogico / rect.height);

    const centroImanX = this.origenX + iman.posicionX * this.#escalaPxPorCm;
    const medioLargoPx = (iman.longitudCm * this.#escalaPxPorCm) / 2 + 10;
    const medioAltoPx = 28;

    return (
      Math.abs(xCanvas - centroImanX) <= medioLargoPx &&
      Math.abs(yCanvas - this.origenY) <= medioAltoPx
    );
  }

  renderizar(iman, bobina, telemetria, deltaTiempoS) {
    const ctx = this.#ctx;
    const origenX = this.origenX;
    const origenY = this.origenY;

    ctx.clearRect(0, 0, this.#anchoLogico, this.#altoLogico);

    this.#dibujarMesaYRegla(ctx, origenX, origenY);
    this.#renderizadorCampo.dibujarLineasCampoMagnetico(ctx, iman, origenX, origenY, this.#escalaPxPorCm);

    // Capa 1: Espiras traseras de la bobina (detrás del imán)
    this.#dibujarCapaBobina(ctx, bobina, origenX, origenY, false);

    // Capa 2: Imán dipolar pasando por el eje central
    this.#dibujarIman(ctx, iman, origenX, origenY);

    // Capa 3: Espiras frontales y terminales al galvanómetro (delante del imán)
    this.#dibujarCapaBobina(ctx, bobina, origenX, origenY, true);
    this.#dibujarTerminalesCircuito(ctx, bobina, origenX, origenY);

    // Capa 4: Vectores animados de corriente inducida y polos de oposición (Ley de Lenz)
    this.#renderizadorCampo.dibujarVectoresCorrienteLenz(
      ctx,
      bobina,
      telemetria.lenz,
      telemetria.corrienteMa,
      origenX,
      origenY,
      this.#escalaPxPorCm,
      deltaTiempoS
    );
  }

  #dibujarMesaYRegla(ctx, origenX, origenY) {
    // Eje óptico / magnético central
    ctx.save();
    ctx.strokeStyle = 'rgba(139, 155, 176, 0.22)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(24, origenY);
    ctx.lineTo(this.#anchoLogico - 24, origenY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Regla graduada inferior en centímetros
    const yRegla = this.#altoLogico - 42;
    ctx.fillStyle = '#192029';
    ctx.fillRect(24, yRegla, this.#anchoLogico - 48, 28);
    ctx.strokeStyle = '#2a3441';
    ctx.strokeRect(24, yRegla, this.#anchoLogico - 48, 28);

    ctx.font = '500 10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let cm = -18; cm <= 18; cm++) {
      const x = origenX + cm * this.#escalaPxPorCm;
      const esMayor = cm % 5 === 0 || cm === 0;
      const altoMarca = esMayor ? 10 : 5;

      ctx.strokeStyle = cm === 0 ? '#f59e0b' : '#5c6c80';
      ctx.lineWidth = cm === 0 ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(x, yRegla);
      ctx.lineTo(x, yRegla + altoMarca);
      ctx.stroke();

      if (esMayor) {
        ctx.fillStyle = cm === 0 ? '#f59e0b' : '#8b9bb0';
        ctx.fillText(`${cm}`, x, yRegla + 12);
      }
    }

    ctx.restore();
  }

  #dibujarIman(ctx, iman, origenX, origenY) {
    const centroX = origenX + iman.posicionX * this.#escalaPxPorCm;
    const largoPx = iman.longitudCm * this.#escalaPxPorCm;
    const altoPx = 38;
    const mitadLargo = largoPx / 2;
    const mitadAlto = altoPx / 2;

    const izqEsSur = iman.polaridadNorteDerecha;
    const colorIzq = izqEsSur ? '#2b7de9' : '#d94336';
    const colorDer = izqEsSur ? '#d94336' : '#2b7de9';
    const letraIzq = izqEsSur ? 'S' : 'N';
    const letraDer = izqEsSur ? 'N' : 'S';

    ctx.save();

    // Sombra sutil sobre la mesa
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.fillRect(centroX - mitadLargo + 3, origenY - mitadAlto + 5, largoPx, altoPx);

    // Mitad izquierda
    ctx.fillStyle = colorIzq;
    ctx.fillRect(centroX - mitadLargo, origenY - mitadAlto, mitadLargo, altoPx);

    // Mitad derecha
    ctx.fillStyle = colorDer;
    ctx.fillRect(centroX, origenY - mitadAlto, mitadLargo, altoPx);

    // Borde metálico y línea divisoria central
    ctx.strokeStyle = '#e6edf3';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(centroX - mitadLargo, origenY - mitadAlto, largoPx, altoPx);

    ctx.beginPath();
    ctx.moveTo(centroX, origenY - mitadAlto);
    ctx.lineTo(centroX, origenY + mitadAlto);
    ctx.stroke();

    // Etiquetas N / S
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 15px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letraIzq, centroX - mitadLargo * 0.5, origenY);
    ctx.fillText(letraDer, centroX + mitadLargo * 0.5, origenY);

    ctx.restore();
  }

  #dibujarCapaBobina(ctx, bobina, origenX, origenY, esFrontal) {
    const centroX = origenX + bobina.posicionX * this.#escalaPxPorCm;
    const anchoPx = bobina.anchoCm * this.#escalaPxPorCm;
    const radioVertical = 56;
    const radioHorizontal = 14;
    const espirasVisibles = Math.min(22, Math.max(6, Math.round(bobina.espiras / 40)));
    const paso = anchoPx / espirasVisibles;
    const inicioX = centroX - anchoPx / 2;

    ctx.save();
    ctx.lineWidth = esFrontal ? 4.2 : 3.6;
    ctx.lineCap = 'round';

    for (let i = 0; i < espirasVisibles; i++) {
      const x = inicioX + (i + 0.5) * paso;
      ctx.strokeStyle = esFrontal ? '#e89b5a' : '#7c461b';

      ctx.beginPath();
      if (esFrontal) {
        // Semielipse derecha (pasa por delante del imán)
        ctx.ellipse(x, origenY, radioHorizontal, radioVertical, 0, -Math.PI / 2, Math.PI / 2);
      } else {
        // Semielipse izquierda (pasa por detrás del imán)
        ctx.ellipse(x, origenY, radioHorizontal, radioVertical, 0, Math.PI / 2, (3 * Math.PI) / 2);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  #dibujarTerminalesCircuito(ctx, bobina, origenX, origenY) {
    const centroX = origenX + bobina.posicionX * this.#escalaPxPorCm;
    const anchoPx = bobina.anchoCm * this.#escalaPxPorCm;
    const yBase = origenY + 56;
    const yConexion = origenY + 94;

    ctx.save();
    ctx.strokeStyle = '#c87533';
    ctx.lineWidth = 3;

    // Conductores bajando hacia el galvanómetro externo
    ctx.beginPath();
    ctx.moveTo(centroX - anchoPx * 0.45, yBase);
    ctx.lineTo(centroX - anchoPx * 0.45, yConexion);
    ctx.lineTo(centroX - 18, yConexion);

    ctx.moveTo(centroX + anchoPx * 0.45, yBase);
    ctx.lineTo(centroX + anchoPx * 0.45, yConexion);
    ctx.lineTo(centroX + 18, yConexion);
    ctx.stroke();

    // Borne de conexión
    ctx.fillStyle = '#1e2631';
    ctx.strokeStyle = '#e89b5a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centroX, yConexion, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = '700 12px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('G', centroX, yConexion);

    ctx.restore();
  }
}