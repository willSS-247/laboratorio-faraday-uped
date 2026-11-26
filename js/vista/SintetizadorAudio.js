export class SintetizadorAudio {
  #contextoAudio;
  #oscilador;
  #nodoGanancia;
  #habilitado;

  constructor() {
    this.#contextoAudio = null;
    this.#oscilador = null;
    this.#nodoGanancia = null;
    this.#habilitado = false;
  }

  get habilitado() {
    return this.#habilitado;
  }

  alternarEstado() {
    if (!this.#habilitado) {
      this.#iniciarMotorAudio();
      this.#habilitado = true;
    } else {
      this.#silenciarInmediato();
      this.#habilitado = false;
    }
    return this.#habilitado;
  }

  #iniciarMotorAudio() {
    if (!this.#contextoAudio) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.#contextoAudio = new AudioCtx();
      this.#oscilador = this.#contextoAudio.createOscillator();
      this.#nodoGanancia = this.#contextoAudio.createGain();

      this.#oscilador.type = 'sine';
      this.#oscilador.frequency.value = 220;
      this.#nodoGanancia.gain.value = 0;

      this.#oscilador.connect(this.#nodoGanancia);
      this.#nodoGanancia.connect(this.#contextoAudio.destination);
      this.#oscilador.start();
    }

    if (this.#contextoAudio.state === 'suspended') {
      this.#contextoAudio.resume();
    }
  }

  actualizarConCorriente(corrienteMa) {
    if (!this.#habilitado || !this.#contextoAudio || !this.#nodoGanancia) {
      return;
    }

    const ahora = this.#contextoAudio.currentTime;
    const magnitud = Math.abs(corrienteMa);

    if (magnitud < 0.8) {
      this.#nodoGanancia.gain.setTargetAtTime(0, ahora, 0.04);
      return;
    }

    const intensidad = Math.min(1, magnitud / 150);
    const frecuenciaHz = 190 + intensidad * 340 + (corrienteMa > 0 ? 25 : -25);
    const gananciaObjetivo = 0.015 + intensidad * 0.065;

    this.#oscilador.frequency.setTargetAtTime(frecuenciaHz, ahora, 0.03);
    this.#nodoGanancia.gain.setTargetAtTime(gananciaObjetivo, ahora, 0.03);
  }

  #silenciarInmediato() {
    if (this.#contextoAudio && this.#nodoGanancia) {
      this.#nodoGanancia.gain.setTargetAtTime(0, this.#contextoAudio.currentTime, 0.02);
    }
  }
}