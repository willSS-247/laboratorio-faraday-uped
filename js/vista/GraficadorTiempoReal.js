export class GraficadorTiempoReal {
  #canvas;
  #ctx;
  #anchoLogico;
  #altoLogico;
  #capacidadMuestras;
  #historialFlujo;
  #historialFem;

  constructor(canvasElemento, capacidadMuestras = 220) {
    this.#canvas = canvasElemento;
    this.#ctx = canvasElemento.getContext('2d');
    this.#anchoLogico = 320;
    this.#altoLogico = 170;
    this.#capacidadMuestras = capacidadMuestras;
    this.#historialFlujo = new Array(capacidadMuestras).fill(0);
    this.#historialFem = new Array(capacidadMuestras).fill(0);
    this.#configurarResolucionNitida();
  }

  #configurarResolucionNitida() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.#canvas.width = this.#anchoLogico * dpr;
    this.#canvas.height = this.#altoLogico * dpr;
    this.#ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  registrarYRenderizar(flujoMwb, femV) {
    this.#historialFlujo.push(flujoMwb);
    this.#historialFlujo.shift();

    this.#historialFem.push(femV);
    this.#historialFem.shift();

    this.#dibujarOsciloscopio();
  }

  #dibujarOsciloscopio() {
    const ctx = this.#ctx;
    const ancho = this.#anchoLogico;
    const alto = this.#altoLogico;
    const centroY = alto / 2;

    ctx.clearRect(0, 0, ancho, alto);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ancho, alto);

    // Retícula graduada estilo papel científico
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    const columnas = 8;
    const filas = 4;
    for (let c = 1; c < columnas; c++) {
      const x = (ancho / columnas) * c;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, alto);
      ctx.stroke();
    }
    for (let f = 1; f < filas; f++) {
      const y = (alto / filas) * f;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ancho, y);
      ctx.stroke();
    }

    // Eje cero central marcado
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, centroY);
    ctx.lineTo(ancho, centroY);
    ctx.stroke();

    const maxFlujo = Math.max(1.2, ...this.#historialFlujo.map(Math.abs));
    const maxFem = Math.max(0.8, ...this.#historialFem.map(Math.abs));
    const amplitudPx = alto * 0.41;

    this.#trazarCurva(ctx, this.#historialFlujo, maxFlujo, amplitudPx, centroY, '#0369a1', 1.8);
    this.#trazarCurva(ctx, this.#historialFem, maxFem, amplitudPx, centroY, '#b45309', 2.0);

    ctx.restore();
  }

  #trazarCurva(ctx, datos, escalaMaxima, amplitudPx, centroY, color, grosor) {
    const pasoX = this.#anchoLogico / (this.#capacidadMuestras - 1);

    ctx.strokeStyle = color;
    ctx.lineWidth = grosor;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    for (let i = 0; i < datos.length; i++) {
      const x = i * pasoX;
      const normalizado = Math.max(-1, Math.min(1, datos[i] / escalaMaxima));
      const y = centroY - normalizado * amplitudPx;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  reiniciar() {
    this.#historialFlujo.fill(0);
    this.#historialFem.fill(0);
    this.#dibujarOsciloscopio();
  }
}