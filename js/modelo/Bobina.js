import { ComponenteLaboratorio } from './ComponenteLaboratorio.js';
import { Medible } from '../interfaces/Medible.js';
import { ErrorFisicoException } from '../excepciones/ErrorFisicoException.js';

export class Bobina extends ComponenteLaboratorio {
  #espiras;
  #areaCm2;
  #resistenciaOhm;
  #anchoCm;

  constructor(espiras = 250, areaCm2 = 12.0, resistenciaOhm = 15.0) {
    super('Solenoide de Cobre', 0, 0);
    this.#anchoCm = 5.4;
    this.espiras = espiras;
    this.areaCm2 = areaCm2;
    this.resistenciaOhm = resistenciaOhm;
  }

  get espiras() {
    return this.#espiras;
  }

  set espiras(n) {
    if (!Number.isInteger(n) || n < 1 || n > 5000) {
      throw new ErrorFisicoException(
        'El número de espiras debe ser un entero entre 1 y 5000.',
        'espiras',
        n
      );
    }
    this.#espiras = n;
  }

  get areaCm2() {
    return this.#areaCm2;
  }

  set areaCm2(cm2) {
    if (!Number.isFinite(cm2) || cm2 <= 0 || cm2 > 200) {
      throw new ErrorFisicoException(
        'El área transversal debe estar entre 0.5 cm² y 200 cm².',
        'areaCm2',
        cm2
      );
    }
    this.#areaCm2 = cm2;
  }

  get areaM2() {
    return this.#areaCm2 * 1e-4;
  }

  get resistenciaOhm() {
    return this.#resistenciaOhm;
  }

  set resistenciaOhm(ohms) {
    if (!Number.isFinite(ohms) || ohms <= 0 || ohms > 10000) {
      throw new ErrorFisicoException(
        'La resistencia del circuito debe ser mayor a 0 Ω.',
        'resistenciaOhm',
        ohms
      );
    }
    this.#resistenciaOhm = ohms;
  }

  get anchoCm() {
    return this.#anchoCm;
  }

  obtenerLectura() {
    return {
      componente: this.nombre,
      espiras: this.#espiras,
      areaCm2: this.#areaCm2,
      resistenciaOhm: this.#resistenciaOhm
    };
  }

  reiniciar() {
    this.espiras = 250;
    this.areaCm2 = 12.0;
    this.resistenciaOhm = 15.0;
  }
}

Object.assign(Bobina.prototype, {
  _contratoMedible: Medible.prototype
});