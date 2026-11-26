export class Medible {
  constructor() {
    if (new.target === Medible) {
      throw new TypeError('Medible es un contrato de interfaz y no puede instanciarse directamente.');
    }
  }

  obtenerLectura() {
    throw new Error('La clase que implementa Medible debe sobrescribir obtenerLectura().');
  }

  reiniciar() {
    throw new Error('La clase que implementa Medible debe sobrescribir reiniciar().');
  }
}