import { Iman } from './modelo/Iman.js';
import { Bobina } from './modelo/Bobina.js';
import { MotorFaraday } from './modelo/MotorFaraday.js';
import { LienzoLaboratorio } from './vista/LienzoLaboratorio.js';
import { Galvanometro } from './vista/Galvanometro.js';
import { GraficadorTiempoReal } from './vista/GraficadorTiempoReal.js';
import { SintetizadorAudio } from './vista/SintetizadorAudio.js';
import { ErrorFisicoException } from './excepciones/ErrorFisicoException.js';
import { ejecutarPruebasFisicas } from './pruebas/SuiteFisicaTests.js';

class AplicacionLaboratorioFaraday {
  #iman;
  #bobina;
  #motor;
  #lienzo;
  #galvanometro;
  #graficador;
  #audio;

  #osciladorActivo;
  #frecuenciaHz;
  #faseOscilador;
  #arrastrandoIman;
  #offsetArrastreCm;
  #ultimoTiempoMs;
  #registrosBitacora;
  #dom;

  constructor() {
    this.#iman = new Iman(-12, 0.45);
    this.#bobina = new Bobina(250, 12.0, 15.0);
    this.#motor = new MotorFaraday(this.#iman, this.#bobina);

    this.#cachearElementosDom();

    this.#lienzo = new LienzoLaboratorio(this.#dom.canvasLaboratorio);
    this.#galvanometro = new Galvanometro(this.#dom.canvasGalvanometro, 150);
    this.#graficador = new GraficadorTiempoReal(this.#dom.canvasOsciloscopio, 220);
    this.#audio = new SintetizadorAudio();

    this.#osciladorActivo = false;
    this.#frecuenciaHz = 0.60;
    this.#faseOscilador = 0;
    this.#arrastrandoIman = false;
    this.#offsetArrastreCm = 0;
    this.#ultimoTiempoMs = performance.now();
    this.#registrosBitacora = [];

    this.#registrarEventos();
    this.#ejecutarVerificacionInicial();
    this.#iniciarBucle();
  }

  #cachearElementosDom() {
    this.#dom = {
      canvasLaboratorio: document.getElementById('canvas-laboratorio'),
      canvasGalvanometro: document.getElementById('canvas-galvanometro'),
      canvasOsciloscopio: document.getElementById('canvas-osciloscopio'),
      valPosicion: document.getElementById('val-posicion'),
      valVelocidad: document.getElementById('val-velocidad'),
      outFem: document.getElementById('out-fem'),
      outCorriente: document.getElementById('out-corriente'),
      outFlujo: document.getElementById('out-flujo'),
      btnOscilador: document.getElementById('btn-modo-oscilador'),
      btnInvertirPolos: document.getElementById('btn-invertir-polos'),
      btnCapturar: document.getElementById('btn-capturar-dato'),
      btnAudio: document.getElementById('btn-audio'),
      btnReiniciar: document.getElementById('btn-reiniciar'),
      btnLimpiarTabla: document.getElementById('btn-limpiar-tabla'),
      btnExportarCsv: document.getElementById('btn-exportar-csv'),
      cuerpoTabla: document.getElementById('cuerpo-tabla'),
      alertaError: document.getElementById('alerta-error'),
      sliders: {
        espiras: document.getElementById('slider-espiras'),
        campo: document.getElementById('slider-campo'),
        area: document.getElementById('slider-area'),
        resistencia: document.getElementById('slider-resistencia'),
        frecuencia: document.getElementById('slider-frecuencia')
      },
      displays: {
        espiras: document.getElementById('disp-espiras'),
        campo: document.getElementById('disp-campo'),
        area: document.getElementById('disp-area'),
        resistencia: document.getElementById('disp-resistencia'),
        frecuencia: document.getElementById('disp-frecuencia')
      }
    };
  }

  #ejecutarVerificacionInicial() {
    try {
      const pruebas = ejecutarPruebasFisicas();
      console.info('[Laboratorio Faraday UPED] Verificación TDD completada:', pruebas);
    } catch (error) {
      this.#mostrarError(error.message);
    }
  }

  #registrarEventos() {
    const canvas = this.#dom.canvasLaboratorio;

    canvas.addEventListener('pointerdown', (e) => {
      if (this.#lienzo.contienePuntoEnIman(e.clientX, e.clientY, this.#iman)) {
        if (this.#osciladorActivo) {
          this.#alternarOscilador(false);
        }
        this.#arrastrandoIman = true;
        this.#offsetArrastreCm = this.#iman.posicionX - this.#lienzo.pixelAPosicionCm(e.clientX);
        canvas.setPointerCapture(e.pointerId);
      }
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!this.#arrastrandoIman) return;
      try {
        const nuevaPosCm = this.#lienzo.pixelAPosicionCm(e.clientX) + this.#offsetArrastreCm;
        this.#iman.moverA(nuevaPosCm, 0.016);
      } catch (error) {
        this.#manejarExcepcion(error);
      }
    });

    const finalizarArrastre = (e) => {
      if (!this.#arrastrandoIman) return;
      this.#arrastrandoIman = false;
      this.#iman.detener();
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    };

    canvas.addEventListener('pointerup', finalizarArrastre);
    canvas.addEventListener('pointercancel', finalizarArrastre);

    // Controles de cinemática y polaridad
    this.#dom.btnOscilador.addEventListener('click', () => {
      this.#alternarOscilador(!this.#osciladorActivo);
    });

    this.#dom.btnInvertirPolos.addEventListener('click', () => {
      this.#iman.invertirPolaridad();
      this.#motor.sincronizarFlujoEstatico();
    });

    this.#dom.btnAudio.addEventListener('click', () => {
      const activo = this.#audio.alternarEstado();
      this.#dom.btnAudio.setAttribute('aria-pressed', String(activo));
      this.#dom.btnAudio.querySelector('span:last-child').textContent = activo ? 'Audio: ON' : 'Audio: OFF';
    });

    this.#dom.btnReiniciar.addEventListener('click', () => this.#reiniciarBanco());
    this.#dom.btnCapturar.addEventListener('click', () => this.#registrarLecturaBitacora());
    this.#dom.btnLimpiarTabla.addEventListener('click', () => this.#limpiarBitacora());
    this.#dom.btnExportarCsv.addEventListener('click', () => this.#exportarCsv());

    // Sliders de parámetros físicos con validación try-catch
    this.#dom.sliders.espiras.addEventListener('input', (e) => {
      this.#aplicarParametro(() => {
        const valor = Number.parseInt(e.target.value, 10);
        this.#bobina.espiras = valor;
        this.#dom.displays.espiras.textContent = `${valor}`;
      });
    }, { passive: true });

    this.#dom.sliders.campo.addEventListener('input', (e) => {
      this.#aplicarParametro(() => {
        const valor = Number.parseFloat(e.target.value);
        this.#iman.campoMagnetico = valor;
        this.#dom.displays.campo.textContent = `${valor.toFixed(2)} T`;
        this.#motor.sincronizarFlujoEstatico();
      });
    }, { passive: true });

    this.#dom.sliders.area.addEventListener('input', (e) => {
      this.#aplicarParametro(() => {
        const valor = Number.parseFloat(e.target.value);
        this.#bobina.areaCm2 = valor;
        this.#dom.displays.area.textContent = `${valor.toFixed(1)} cm²`;
        this.#motor.sincronizarFlujoEstatico();
      });
    }, { passive: true });

    this.#dom.sliders.resistencia.addEventListener('input', (e) => {
      this.#aplicarParametro(() => {
        const valor = Number.parseFloat(e.target.value);
        this.#bobina.resistenciaOhm = valor;
        this.#dom.displays.resistencia.textContent = `${valor.toFixed(1)} Ω`;
      });
    }, { passive: true });

    this.#dom.sliders.frecuencia.addEventListener('input', (e) => {
      const valor = Number.parseFloat(e.target.value);
      this.#frecuenciaHz = valor;
      this.#dom.displays.frecuencia.textContent = `${valor.toFixed(2)} Hz`;
    }, { passive: true });
  }

  #aplicarParametro(accion) {
    try {
      accion();
    } catch (error) {
      this.#manejarExcepcion(error);
    }
  }

  #alternarOscilador(activar) {
    this.#osciladorActivo = activar;
    this.#dom.btnOscilador.setAttribute('aria-pressed', String(activar));
    this.#dom.btnOscilador.textContent = activar
      ? 'Detener Oscilador Armónico'
      : 'Iniciar Oscilador Armónico';

    if (activar) {
      const amplitudCm = 13.5;
      const ratio = Math.max(-1, Math.min(1, this.#iman.posicionX / amplitudCm));
      this.#faseOscilador = Math.asin(ratio);
    } else {
      this.#iman.detener();
    }
  }

  #iniciarBucle() {
    const pasoFotograma = (tiempoActualMs) => {
      const deltaTiempoS = Math.min((tiempoActualMs - this.#ultimoTiempoMs) / 1000, 0.05);
      this.#ultimoTiempoMs = tiempoActualMs;

      if (this.#osciladorActivo && deltaTiempoS > 0) {
        const amplitudCm = 13.5;
        this.#faseOscilador += 2 * Math.PI * this.#frecuenciaHz * deltaTiempoS;
        const nuevaPosCm = amplitudCm * Math.sin(this.#faseOscilador);
        this.#iman.moverA(nuevaPosCm, deltaTiempoS);
      } else if (!this.#arrastrandoIman) {
        this.#iman.detener();
      }

      const telemetria = this.#motor.actualizarPaso(deltaTiempoS);

      this.#lienzo.renderizar(this.#iman, this.#bobina, telemetria, deltaTiempoS);
      this.#galvanometro.actualizarYRenderizar(telemetria.corrienteMa, deltaTiempoS);
      this.#graficador.registrarYRenderizar(telemetria.flujoMwb, telemetria.femV);
      this.#audio.actualizarConCorriente(telemetria.corrienteMa);
      this.#actualizarTelemetriaDom(telemetria);

      requestAnimationFrame(pasoFotograma);
    };

    requestAnimationFrame(pasoFotograma);
  }

  #actualizarTelemetriaDom(telemetria) {
    this.#dom.valPosicion.textContent = `${telemetria.posicionCm.toFixed(2)} cm`;
    this.#dom.valVelocidad.textContent = `${telemetria.velocidadCmS.toFixed(2)} cm/s`;
    this.#dom.outFem.textContent = `${telemetria.femV.toFixed(3)} V`;
    this.#dom.outCorriente.textContent = `${telemetria.corrienteMa.toFixed(2)} mA`;
    this.#dom.outFlujo.textContent = `${telemetria.flujoMwb.toFixed(3)} mWb`;
  }

  #registrarLecturaBitacora() {
    const estado = this.#motor.obtenerEstadoTelemetria();
    const fila = {
      numero: this.#registrosBitacora.length + 1,
      tiempoS: estado.tiempoS.toFixed(2),
      posicionCm: estado.posicionCm.toFixed(2),
      velocidadCmS: estado.velocidadCmS.toFixed(2),
      espiras: this.#bobina.espiras,
      campoT: this.#iman.campoMagnetico.toFixed(2),
      flujoMwb: estado.flujoMwb.toFixed(3),
      femV: estado.femV.toFixed(3),
      corrienteMa: estado.corrienteMa.toFixed(2)
    };

    this.#registrosBitacora.push(fila);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fila.numero}</td>
      <td>${fila.tiempoS}</td>
      <td>${fila.posicionCm}</td>
      <td>${fila.velocidadCmS}</td>
      <td>${fila.espiras}</td>
      <td>${fila.campoT}</td>
      <td>${fila.flujoMwb}</td>
      <td>${fila.femV}</td>
      <td>${fila.corrienteMa}</td>
    `;
    this.#dom.cuerpoTabla.prepend(tr);

    if (navigator.vibrate) {
      navigator.vibrate(18);
    }
  }

  #limpiarBitacora() {
    this.#registrosBitacora = [];
    this.#dom.cuerpoTabla.innerHTML = '';
  }

  #exportarCsv() {
    if (this.#registrosBitacora.length === 0) {
      this.#mostrarError('No hay lecturas registradas en la bitácora para exportar.');
      return;
    }

    const encabezados = ['Muestra', 'Tiempo_s', 'Posicion_cm', 'Velocidad_cm_s', 'Espiras_N', 'Campo_T', 'Flujo_mWb', 'FEM_V', 'Corriente_mA'];
    const lineas = this.#registrosBitacora.map((r) =>
      [r.numero, r.tiempoS, r.posicionCm, r.velocidadCmS, r.espiras, r.campoT, r.flujoMwb, r.femV, r.corrienteMa].join(',')
    );

    const contenidoCsv = [encabezados.join(','), ...lineas].join('\n');
    const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `bitacora_faraday_uped_${Date.now()}.csv`;
    enlace.click();

    URL.revokeObjectURL(url);
  }

  #reiniciarBanco() {
    this.#alternarOscilador(false);
    this.#bobina.reiniciar();
    this.#motor.reiniciar();
    this.#galvanometro.reiniciar();
    this.#graficador.reiniciar();

    this.#dom.sliders.espiras.value = String(this.#bobina.espiras);
    this.#dom.displays.espiras.textContent = `${this.#bobina.espiras}`;

    this.#dom.sliders.campo.value = String(this.#iman.campoMagnetico);
    this.#dom.displays.campo.textContent = `${this.#iman.campoMagnetico.toFixed(2)} T`;

    this.#dom.sliders.area.value = String(this.#bobina.areaCm2);
    this.#dom.displays.area.textContent = `${this.#bobina.areaCm2.toFixed(1)} cm²`;

    this.#dom.sliders.resistencia.value = String(this.#bobina.resistenciaOhm);
    this.#dom.displays.resistencia.textContent = `${this.#bobina.resistenciaOhm.toFixed(1)} Ω`;

    this.#frecuenciaHz = 0.60;
    this.#dom.sliders.frecuencia.value = '0.60';
    this.#dom.displays.frecuencia.textContent = '0.60 Hz';
  }

  #manejarExcepcion(error) {
    if (error instanceof ErrorFisicoException) {
      this.#mostrarError(`[${error.parametro}] ${error.message}`);
    } else {
      this.#mostrarError('Error inesperado en el motor de simulación.');
      console.error(error);
    }
  }

  #mostrarError(mensaje) {
    const alerta = this.#dom.alertaError;
    alerta.textContent = mensaje;
    alerta.hidden = false;
    clearTimeout(this._temporizadorAlerta);
    this._temporizadorAlerta = setTimeout(() => {
      alerta.hidden = true;
    }, 3800);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new AplicacionLaboratorioFaraday();
});