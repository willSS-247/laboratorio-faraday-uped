import { ComponenteLaboratorio } from './ComponenteLaboratorio.js';
import { Medible } from '../interfaces/Medible.js';
import { ErrorFisicoException } from '../excepciones/ErrorFisicoException.js';

export class Iman extends ComponenteLaboratorio {
  #campoMagnetico;
  #polaridadNorteDerecha;
  #velocidadX;
  #longitudCm;
  #limiteMovimientoCm;

  constructor(posicionInicialCm = -12, campoMagnetico = 0.45) {
    super('Imán Dipolar de Barra', posicionInicialCm, 0);
    this.#limiteMovimientoCm = 18;
    this.#longitudCm = 6.0;
    this.campoMagnetico = campoMagnetico;
    this.#polaridadNorteDerecha = true;
    this.#velocidadX = 0;
  }

  get campoMagnetico() {
    return this.#campoMagnetico;
  }

  set campoMagnetico(teslas) {
    if (!Number.isFinite(teslas) || teslas <= 0 || teslas > 5.0) {
      throw new ErrorFisicoException(
        'El campo magnético debe estar entre 0.01 T y 5.00 T.',
        'campoMagnetico',
        teslas
      );
    }
    this.#campoMagnetico = teslas;
  }

  get polaridadNorteDerecha() {
    return this.#polaridadNorteDerecha;
  }

  get signoPolaridad() {
    return this.#polaridadNorteDerecha ? 1 : -1;
  }

  get velocidadX() {
    return this.#velocidadX;
  }

  get longitudCm() {
    return this.#longitudCm;
  }

  get limiteMovimientoCm() {
    return this.#limiteMovimientoCm;
  }

  invertirPolaridad() {
    this.#polaridadNorteDerecha = !this.#polaridadNorteDerecha;
  }

  moverA(nuevaPosicionCm, deltaTiempoS) {
    if (!Number.isFinite(nuevaPosicionCm)) {
      throw new ErrorFisicoException('Coordenada de desplazamiento inválida.', 'posicionX', nuevaPosicionCm);
    }
    const posicionAcotada = Math.max(
      -this.#limiteMovimientoCm,
      Math.min(this.#limiteMovimientoCm, nuevaPosicionCm)
    );

    if (deltaTiempoS > 0) {
      this.#velocidadX = (posicionAcotada - this.posicionX) / deltaTiempoS;
    } else {
      this.#velocidadX = 0;
    }

    this.posicionX = posicionAcotada;
  }

  detener() {
    this.#velocidadX = 0;
  }

  obtenerLectura() {
    return {
      componente: this.nombre,
      posicionCm: Number(this.posicionX.toFixed(3)),
      velocidadCmS: Number(this.#velocidadX.toFixed(3)),
      campoT: this.#campoMagnetico,
      orientacion: this.#polaridadNorteDerecha ? 'S -> N' : 'N -> S'
    };
  }

  reiniciar() {
    this.posicionX = -12;
    this.#velocidadX = 0;
    this.#polaridadNorteDerecha = true;
  }
}

Object.assign(Iman.prototype, {
  _contratoMedible: Medible.prototype
});