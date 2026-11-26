export class ErrorFisicoException extends Error {
  constructor(mensaje, parametro = 'desconocido', valorRecibido = null) {
    super(mensaje);
    this.name = 'ErrorFisicoException';
    this.parametro = parametro;
    this.valorRecibido = valorRecibido;
  }
}