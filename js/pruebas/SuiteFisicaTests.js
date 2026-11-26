import { Iman } from '../modelo/Iman.js';
import { Bobina } from '../modelo/Bobina.js';
import { MotorFaraday } from '../modelo/MotorFaraday.js';
import { ErrorFisicoException } from '../excepciones/ErrorFisicoException.js';

function afirmar(condicion, mensaje) {
  if (!condicion) {
    throw new Error(`Fallo en prueba: ${mensaje}`);
  }
}

export function ejecutarPruebasFisicas() {
  const resultados = [];

  // Prueba 1: Validación de excepciones físicas
  let excepcionCapturada = false;
  try {
    new Bobina(-50, 12, 15);
  } catch (error) {
    excepcionCapturada = error instanceof ErrorFisicoException;
  }
  afirmar(excepcionCapturada, 'Debe lanzar ErrorFisicoException con espiras negativas');
  resultados.push('OK - Excepción de límites físicos');

  // Prueba 2: Imán en reposo -> FEM = 0
  const imanReposo = new Iman(-8, 0.5);
  const bobinaBase = new Bobina(200, 10, 10);
  const motorReposo = new MotorFaraday(imanReposo, bobinaBase);
  motorReposo.actualizarPaso(0.016);
  afirmar(Math.abs(motorReposo.femInducidaV) < 1e-9, 'Con imán en reposo la FEM debe ser exactamente 0 V');
  resultados.push('OK - FEM nula en equilibrio estático');

  // Prueba 3: Ley de Lenz (acercamiento de polo Norte genera oposición)
  const imanMovil = new Iman(-6, 0.5);
  const bobina = new Bobina(300, 12, 15);
  const motor = new MotorFaraday(imanMovil, bobina);
  imanMovil.moverA(-4, 0.02);
  motor.actualizarPaso(0.02);
  afirmar(motor.femInducidaV < 0, 'Al aumentar flujo positivo (N acercándose), la FEM debe ser negativa');
  afirmar(motor.obtenerEstadoLenz().poloInducidoIzquierda === 'S' || motor.obtenerEstadoLenz().sentidoCorriente < 0, 'Debe oponerse al incremento de flujo');
  resultados.push('OK - Signo negativo de Ley de Lenz');

  // Prueba 4: Proporcionalidad lineal con el número de espiras N
  const imanA = new Iman(-6, 0.5);
  const motorN100 = new MotorFaraday(imanA, new Bobina(100, 10, 10));
  imanA.moverA(-5, 0.02);
  motorN100.actualizarPaso(0.02);

  const imanB = new Iman(-6, 0.5);
  const motorN200 = new MotorFaraday(imanB, new Bobina(200, 10, 10));
  imanB.moverA(-5, 0.02);
  motorN200.actualizarPaso(0.02);

  const proporcion = motorN200.femInducidaV / motorN100.femInducidaV;
  afirmar(Math.abs(proporcion - 2.0) < 1e-6, 'Duplicar espiras N debe duplicar exactamente la FEM');
  resultados.push('OK - Proporcionalidad lineal ε ∝ N');

  // Prueba 5: Inversión de polaridad invierte el signo de la FEM
  const imanInvertido = new Iman(-6, 0.5);
  imanInvertido.invertirPolaridad();
  const motorInv = new MotorFaraday(imanInvertido, new Bobina(100, 10, 10));
  imanInvertido.moverA(-5, 0.02);
  motorInv.actualizarPaso(0.02);
  afirmar(Math.abs(motorInv.femInducidaV + motorN100.femInducidaV) < 1e-6, 'Invertir polaridad debe invertir el signo de ε');
  resultados.push('OK - Simetría por inversión de polaridad');

  return resultados;
}