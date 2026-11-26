import { ErrorFisicoException } from '../excepciones/ErrorFisicoException.js';

export class ComponenteLaboratorio {
  #nombre;
  #posicionX;
  #posicionY;
  #activo;

  constructor(nombre, posicionX = 0, posicionY = 0) {
    if (new.target === ComponenteLaboratorio) {
      throw new TypeError('ComponenteLaboratorio es una clase base abstracta.');
    }
    this.#nombre = nombre;
    this.posicionX = posicionX;
    this.posicionY = posicionY;
    this.#activo = true;
  }

  get nombre() {
    return this.#nombre;
  }

  get posicionX() {
    return this.#posicionX;
  }

  set posicionX(valor) {
    if (!Number.isFinite(valor)) {
      throw new ErrorFisicoException('La posición axial debe ser un número finito.', 'posicionX', valor);
    }
    this.#posicionX = valor;
  }

  get posicionY() {
    return this.#posicionY;
  }

  set posicionY(valor) {
    if (!Number.isFinite(valor)) {
      throw new ErrorFisicoException('La posición vertical debe ser un número finito.', 'posicionY', valor);
    }
    this.#posicionY = valor;
  }

  get activo() {
    return this.#activo;
  }

  set activo(estado) {
    this.#activo = Boolean(estado);
  }
}