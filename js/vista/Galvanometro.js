export class Galvanometro {
  #canvas;
  #ctx;
  #anchoLogico;
  #altoLogico;
  #anguloActualRad;
  #velocidadAngular;
  #escalaMaximaMa;

  constructor(canvasElemento, escalaMaximaMa = 150) {
    this.#canvas = canvasElemento;
    this.#ctx = canvasElemento.getContext('2d');
    this.#anchoLogico = 320;
    this.#altoLogico = 190;
    this.#anguloActualRad = 0;
    this.#velocidadAngular = 0;
    this.#escalaMaximaMa = escalaMaximaMa;
    this.#configurarResolucionNitida();
  }

  #configurarResolucionNitida() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.#canvas.width = this.#anchoLogico * dpr;
    this.#canvas.height = this.#altoLogico * dpr;
    this.#ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  actualizarYRenderizar(corrienteMa, deltaTiempoS) {
    const dt = Math.min(deltaTiempoS || 0.016, 0.05);
    const amplitudMaximaRad = Math.PI * 0.36;

    const fraccion = Math.max(-1, Math.min(1, corrienteMa / this.#escalaMaximaMa));
    const anguloObjetivoRad = fraccion * amplitudMaximaRad;

    const frecuenciaNatural = 22;
    const factorAmortiguamiento = 0.85;
    const aceleracionAngular =
      frecuenciaNatural * frecuenciaNatural * (anguloObjetivoRad - this.#anguloActualRad) -
      2 * factorAmortiguamiento * frecuenciaNatural * this.#velocidadAngular;

    this.#velocidadAngular += aceleracionAngular * dt;
    this.#anguloActualRad += this.#velocidadAngular * dt;

    this.#dibujarCaratula(corrienteMa);
  }

  #dibujarCaratula(corrienteMa) {
    const ctx = this.#ctx;
    const centroX = this.#anchoLogico / 2;
    const pivoteY = this.#altoLogico - 26;
    const radioEscala = 126;
    const amplitudMaximaRad = Math.PI * 0.36;

    ctx.clearRect(0, 0, this.#anchoLogico, this.#altoLogico);

    // Fondo blanco de carátula de instrumento
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, this.#anchoLogico, this.#altoLogico);

    ctx.save();

    // Arco de espejo de paralaje sutil
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(centroX, pivoteY, radioEscala - 16, -Math.PI / 2 - amplitudMaximaRad, -Math.PI / 2 + amplitudMaximaRad);
    ctx.stroke();

    // Arco principal de escala
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(centroX, pivoteY, radioEscala, -Math.PI / 2 - amplitudMaximaRad, -Math.PI / 2 + amplitudMaximaRad);
    ctx.stroke();

    const totalDivisiones = 30;
    ctx.font = '600 10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= totalDivisiones; i++) {
      const t = i / totalDivisiones;
      const angulo = -Math.PI / 2 - amplitudMaximaRad + t * (2 * amplitudMaximaRad);
      const esCero = i === totalDivisiones / 2;
      const esPrincipal = i % 5 === 0;

      const rInterno = esPrincipal ? radioEscala - 12 : radioEscala - 6;
      const x1 = centroX + Math.cos(angulo) * rInterno;
      const y1 = pivoteY + Math.sin(angulo) * rInterno;
      const x2 = centroX + Math.cos(angulo) * radioEscala;
      const y2 = pivoteY + Math.sin(angulo) * radioEscala;

      ctx.strokeStyle = esCero ? '#b45309' : esPrincipal ? '#0f172a' : '#64748b';
      ctx.lineWidth = esCero ? 2 : esPrincipal ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      if (esPrincipal) {
        const valorMarca = Math.round(-this.#escalaMaximaMa + t * (2 * this.#escalaMaximaMa));
        const rTexto = radioEscala - 25;
        ctx.fillStyle = esCero ? '#b45309' : '#334155';
        ctx.fillText(`${valorMarca}`, centroX + Math.cos(angulo) * rTexto, pivoteY + Math.sin(angulo) * rTexto);
      }
    }

    // Etiqueta central de unidad física
    ctx.fillStyle = '#64748b';
    ctx.font = '600 11px "IBM Plex Mono", monospace';
    ctx.fillText('mA DC', centroX, pivoteY - 52);

    // Bornes indicadores de polaridad
    this.#dibujarBorne(ctx, 32, 26, '-', corrienteMa < -0.5, '#0369a1');
    this.#dibujarBorne(ctx, this.#anchoLogico - 32, 26, '+', corrienteMa > 0.5, '#b45309');

    // Aguja de precisión
    const anguloAguja = -Math.PI / 2 + this.#anguloActualRad;
    const puntaX = centroX + Math.cos(anguloAguja) * (radioEscala - 3);
    const puntaY = pivoteY + Math.sin(anguloAguja) * (radioEscala - 3);

    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centroX, pivoteY);
    ctx.lineTo(puntaX, puntaY);
    ctx.stroke();

    // Pivote central metálico
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centroX, pivoteY, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  #dibujarBorne(ctx, x, y, signo, activo, colorActivo) {
    ctx.save();
    ctx.fillStyle = activo ? colorActivo : '#f1f5f9';
    ctx.strokeStyle = activo ? colorActivo : '#94a3b8';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = activo ? '#ffffff' : '#475569';
    ctx.font = '700 12px "IBM Plex Mono", monospace';
    ctx.fillText(signo, x, y + 0.5);
    ctx.restore();
  }

  reiniciar() {
    this.#anguloActualRad = 0;
    this.#velocidadAngular = 0;
    this.#dibujarCaratula(0);
  }
}