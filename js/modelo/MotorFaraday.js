import { ErrorFisicoException } from '../excepciones/ErrorFisicoException.js';

export class MotorFaraday {
  #iman;
  #bobina;
  #tiempoTranscurridoS;
  #flujoAnteriorWb;
  #flujoActualWb;
  #femInducidaV;
  #corrienteInducidaA;
  #anchoCaracteristicoCm;

  constructor(iman, bobina) {
    if (!iman || !bobina) {
      throw new ErrorFisicoException('El motor físico requiere instancias válidas de Iman y Bobina.');
    }
    this.#iman = iman;
    this.#bobina = bobina;
    this.#anchoCaracteristicoCm = 4.6;
    this.reiniciar();
  }

  get tiempoTranscurridoS() {
    return this.#tiempoTranscurridoS;
  }

  get flujoMagneticoWb() {
    return this.#flujoActualWb;
  }

  get flujoMagneticoMwb() {
    return this.#flujoActualWb * 1000;
  }

  get femInducidaV() {
    return this.#femInducidaV;
  }

  get corrienteInducidaA() {
    return this.#corrienteInducidaA;
  }

  get corrienteInducidaMa() {
    return this.#corrienteInducidaA * 1000;
  }

  calcularFlujoEnPosicion(posicionImanCm) {
    const distanciaRelativaCm = posicionImanCm - this.#bobina.posicionX;
    const u = distanciaRelativaCm / this.#anchoCaracteristicoCm;
    const perfilAcoplamiento = Math.pow(1 + u * u, -1.5);
    const flujoMaximoWb = this.#iman.campoMagnetico * this.#bobina.areaM2;
    return this.#iman.signoPolaridad * flujoMaximoWb * perfilAcoplamiento;
  }

  actualizarPaso(deltaTiempoS) {
    if (!Number.isFinite(deltaTiempoS) || deltaTiempoS <= 0) {
      return this.obtenerEstadoTelemetria();
    }

    const dtSeguro = Math.min(deltaTiempoS, 0.05);
    this.#tiempoTranscurridoS += dtSeguro;

    const nuevoFlujoWb = this.calcularFlujoEnPosicion(this.#iman.posicionX);
    const derivadaFlujoWbS = (nuevoFlujoWb - this.#flujoAnteriorWb) / dtSeguro;

    this.#femInducidaV = -this.#bobina.espiras * derivadaFlujoWbS;
    this.#corrienteInducidaA = this.#femInducidaV / this.#bobina.resistenciaOhm;

    this.#flujoAnteriorWb = nuevoFlujoWb;
    this.#flujoActualWb = nuevoFlujoWb;

    return this.obtenerEstadoTelemetria();
  }

  sincronizarFlujoEstatico() {
    const flujoActual = this.calcularFlujoEnPosicion(this.#iman.posicionX);
    this.#flujoAnteriorWb = flujoActual;
    this.#flujoActualWb = flujoActual;
    this.#femInducidaV = 0;
    this.#corrienteInducidaA = 0;
  }

  obtenerEstadoLenz() {
    const umbralCorrienteA = 1e-5;
    if (Math.abs(this.#corrienteInducidaA) < umbralCorrienteA) {
      return {
        hayInduccion: false,
        sentidoCorriente: 0,
        poloInducidoIzquierda: null,
        poloInducidoDerecha: null
      };
    }

    const sentido = Math.sign(this.#corrienteInducidaA);
    return {
      hayInduccion: true,
      sentidoCorriente: sentido,
      poloInducidoIzquierda: sentido > 0 ? 'N' : 'S',
      poloInducidoDerecha: sentido > 0 ? 'S' : 'N'
    };
  }

  obtenerEstadoTelemetria() {
    return {
      tiempoS: this.#tiempoTranscurridoS,
      posicionCm: this.#iman.posicionX,
      velocidadCmS: this.#iman.velocidadX,
      flujoMwb: this.flujoMagneticoMwb,
      femV: this.#femInducidaV,
      corrienteMa: this.corrienteInducidaMa,
      lenz: this.obtenerEstadoLenz()
    };
  }

  reiniciar() {
    this.#tiempoTranscurridoS = 0;
    this.#iman.reiniciar();
    this.sincronizarFlujoEstatico();
  }
}