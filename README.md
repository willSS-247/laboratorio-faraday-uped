# Laboratorio Virtual de Física III: Ley de Inducción de Faraday y Ley de Lenz

Simulador interactivo de mesa de laboratorio universitaria desarrollado en **HTML5, CSS3 y JavaScript moderno (ES6 Modules)** con renderizado en **Canvas 2D** y síntesis sonora **Web Audio API**, sin librerías externas pesadas.

## Fundamento Físico Implementado

1. **Flujo Magnético Axial ($\Phi_B$):**
   $$\Phi_B(x) = \pm B \cdot A \cdot \left(1 + \left(\frac{x}{\sigma}\right)^2\right)^{-3/2}$$
   Modela la variación continua del flujo magnético que atraviesa el área transversal $A$ del solenoide conforme el imán dipolar de campo $B$ se desplaza a lo largo del eje axial $x$.

2. **Ley de Inducción de Faraday-Lenz ($\varepsilon$):**
   $$\varepsilon = -N \frac{d\Phi_B}{dt}$$
   Calcula la fuerza electromotriz inducida proporcional al número de espiras $N$ y a la rapidez de cambio del flujo magnético, generando una corriente $I = \frac{\varepsilon}{R}$ cuyo campo magnético inducido se opone al movimiento del imán.

## Arquitectura del Proyecto

* `index.html` y `css/`: Interfaz tipo *Workbench* de laboratorio industrial con tokens de diseño, galvanómetro de cero central, osciloscopio de doble trazo y bitácora experimental.
* `js/excepciones/ErrorFisicoException.js`: Validación de rangos físicos operativos.
* `js/interfaces/Medible.js`: Contrato polimórfico para los componentes del banco de pruebas.
* `js/modelo/`: Clases encapsuladas (`ComponenteLaboratorio`, `Iman`, `Bobina`, `MotorFaraday`).
* `js/vista/`: Renderizado por capas de profundidad (`LienzoLaboratorio`, `RenderizadorCampo`), instrumentación analógica/digital (`Galvanometro`, `GraficadorTiempoReal`) y retroalimentación sonora (`SintetizadorAudio`).
* `js/pruebas/SuiteFisicaTests.js`: Pruebas unitarias automatizadas que verifican equilibrio estático ($\varepsilon = 0$), proporcionalidad lineal con $N$, inversión de polaridad y signo negativo de Lenz.

## Ejecución y Despliegue en GitHub Pages

1. **Local (VS Code):** Abrir la carpeta del proyecto y ejecutar con **Live Server** (requerido para módulos ES6).
2. **Publicación Web (GitHub Pages):**
   * Subir el repositorio a GitHub.
   * Ir a **Settings → Pages → Build and deployment**.
   * Seleccionar la rama `main` y carpeta `/ (root)` y guardar. El enlace público quedará activo para abrirse desde cualquier computadora o teléfono sin descargas.