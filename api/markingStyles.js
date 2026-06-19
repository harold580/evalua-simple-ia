/**
 * Base de datos y análisis de las 50 formas comunes de marcar exámenes de opción múltiple.
 * Este archivo se comparte entre la interfaz de usuario (frontend) y los servicios de evaluación de IA (backend).
 */

export const markingStyles = [
  // --- ALTA COMPATIBILIDAD (BAJO RIESGO) ---
  {
    id: 1,
    nombre: "Relleno Completo de Burbuja",
    categoria: "Burbujas y Casillas",
    compatibilidad: "alta",
    descripcion: "El óvalo o casilla de respuesta está completamente sombreado de color oscuro sin salirse excesivamente del borde.",
    riesgoExplicacion: "Ninguno significativo. Es el estándar ideal para sistemas OMR convencionales e IA.",
    recomendacion: "Forma más recomendada para garantizar una evaluación 100% precisa."
  },
  {
    id: 2,
    nombre: "Relleno Parcial (Centro Sólido)",
    categoria: "Burbujas y Casillas",
    compatibilidad: "alta",
    descripcion: "El centro del óvalo está sombreado pero los bordes quedan vacíos.",
    riesgoExplicacion: "Bajo riesgo. La IA reconoce fácilmente la concentración de pigmento en el centro.",
    recomendacion: "Seguro de usar siempre que el contraste de la marca sea fuerte."
  },
  {
    id: 5,
    nombre: "Cruz Completa (X)",
    categoria: "Cruces y Marcas",
    compatibilidad: "alta",
    descripcion: "Una cruz limpia cuyas líneas se cruzan en el centro y tocan o rozan los bordes de la burbuja.",
    riesgoExplicacion: "Muy bajo. La cruz es un patrón geométrico altamente reconocible para modelos de visión.",
    recomendacion: "Excelente alternativa si no se quiere rellenar toda la burbuja."
  },
  {
    id: 8,
    nombre: "Cotejo o Visto (✓) Interno",
    categoria: "Cruces y Marcas",
    compatibilidad: "alta",
    descripcion: "Una marca de verificación (palomita/visto) limpia y dibujada completamente dentro de los límites del óvalo.",
    riesgoExplicacion: "Bajo. Representa una selección afirmativa inequívoca.",
    recomendacion: "Usar un trazo firme para evitar confusión con garabatos fortuitos."
  },
  {
    id: 10,
    nombre: "Círculo de Envoltura Externo",
    categoria: "Subrayados y Círculos",
    compatibilidad: "alta",
    descripcion: "Un círculo dibujado a mano alzada alrededor de la burbuja o casilla completa sin tapar la letra.",
    riesgoExplicacion: "Muy bajo. El modelo detecta el círculo contenedor como un marcador de selección.",
    recomendacion: "Asegurarse de que el círculo no toque o invada las opciones adyacentes."
  },
  {
    id: 11,
    nombre: "Círculo sobre la Letra",
    categoria: "Subrayados y Círculos",
    compatibilidad: "alta",
    descripcion: "Un círculo estrecho dibujado directamente alrededor de la letra identificadora de la opción (ej. 'A').",
    riesgoExplicacion: "Muy bajo. La envoltura de caracteres es un patrón clásico de selección manual.",
    recomendacion: "Mantener el trazo delgado pero visible para no tapar la letra por completo."
  },
  {
    id: 12,
    nombre: "Encuadre Rectangular",
    categoria: "Subrayados y Círculos",
    compatibilidad: "alta",
    descripcion: "Un rectángulo o caja dibujado a mano que encierra por completo la opción elegida.",
    riesgoExplicacion: "Bajo. Los bordes rectos son fácilmente delimitables por el análisis visual.",
    recomendacion: "Evitar que las esquinas del rectángulo toquen las filas de arriba o abajo."
  },
  {
    id: 23,
    nombre: "Sombreado Diagonal Rápido",
    categoria: "Burbujas y Casillas",
    compatibilidad: "alta",
    descripcion: "Líneas diagonales paralelas dibujadas rápidamente dentro de la burbuja.",
    riesgoExplicacion: "Bajo. Aumenta la densidad general de la burbuja, lo que delata la selección.",
    recomendacion: "Procurar hacer al menos 3 o 4 líneas para que la densidad sea evidente."
  },
  {
    id: 31,
    nombre: "Letra Escrita en Recuadro",
    categoria: "Anotaciones y Escritura",
    compatibilidad: "alta",
    descripcion: "Escribir explícitamente la letra seleccionada ('A', 'B', etc.) en un espacio designado al margen de la pregunta.",
    riesgoExplicacion: "Muy bajo si la caligrafía es clara. Los modelos OCR actuales leen letras aisladas con alta precisión.",
    recomendacion: "Es una de las formas más seguras si el formato del examen lo prevé."
  },
  {
    id: 32,
    nombre: "Resumen Escrito de Respuesta",
    categoria: "Anotaciones y Escritura",
    compatibilidad: "alta",
    descripcion: "Copiar textualmente la palabra o frase de la respuesta en una línea en blanco al final de la pregunta.",
    riesgoExplicacion: "Bajo. La IA lee el texto y lo asocia directamente con la opción del examen.",
    recomendacion: "Escribir con letra legible y evitar tachaduras sobre el texto escrito."
  },
  {
    id: 40,
    nombre: "Tinta de Contraste Alternativo",
    categoria: "Marcas Especiales",
    compatibilidad: "alta",
    descripcion: "Marcar la respuesta con bolígrafo de tinta roja, verde, morada o rosa brillante en lugar del clásico azul o negro.",
    riesgoExplicacion: "Bajo para modelos a color (como Llama 3.2 Vision). La diferencia cromática resalta la marca de inmediato.",
    recomendacion: "Excelente para diferenciar las respuestas del texto preimpreso del examen."
  },

  // --- MEDIA COMPATIBILIDAD (RIESGO MODERADO) ---
  {
    id: 3,
    nombre: "Relleno Espiral Interno",
    categoria: "Burbujas y Casillas",
    compatibilidad: "media",
    descripcion: "Relleno realizado trazando un espiral de adentro hacia afuera, dejando notables espacios vacíos.",
    riesgoExplicacion: "Riesgo moderado. Si el trazo es muy fino, la IA podría interpretar la casilla como vacía o con un garabato accidental.",
    recomendacion: "Usar bolígrafo grueso o presionar más el lápiz al realizar el espiral."
  },
  {
    id: 4,
    nombre: "Relleno de Bordes Internos",
    categoria: "Burbujas y Casillas",
    compatibilidad: "media",
    descripcion: "Solo se colorea la circunferencia interior del óvalo, dejando el centro vacío.",
    riesgoExplicacion: "Riesgo moderado. Al dejar el centro vacío, un análisis simplificado de densidad podría catalogarlo como no marcado.",
    recomendacion: "Es preferible rellenar el centro o cruzar con una línea."
  },
  {
    id: 6,
    nombre: "Cruz Pequeña Interna",
    categoria: "Cruces y Marcas",
    compatibilidad: "media",
    descripcion: "Una cruz 'X' muy pequeña dibujada en el centro del óvalo sin tocar sus paredes.",
    riesgoExplicacion: "Riesgo moderado. En imágenes de baja resolución o con ruido, la X pequeña puede confundirse con suciedad o una mota en el papel.",
    recomendacion: "Dibujar la cruz de forma que ocupe al menos el 70% del tamaño del óvalo."
  },
  {
    id: 7,
    nombre: "Cruz Gigante Excedente",
    categoria: "Cruces y Marcas",
    compatibilidad: "media",
    descripcion: "Una cruz 'X' muy grande que excede los límites de la casilla, extendiéndose hacia opciones contiguas.",
    riesgoExplicacion: "Riesgo moderado. Las aspas de la cruz pueden pisar otras opciones, haciendo pensar a la IA que se marcaron múltiples respuestas.",
    recomendacion: "Controlar el tamaño del trazo para no invadir las respuestas de arriba, abajo o de los lados."
  },
  {
    id: 9,
    nombre: "Cotejo o Visto (✓) Sobresaliente",
    categoria: "Cruces y Marcas",
    compatibilidad: "media",
    descripcion: "Un check donde el trazo largo sobresale significativamente de la burbuja hacia arriba o a la derecha.",
    riesgoExplicacion: "Riesgo moderado. La extensión del trazo puede invadir la opción superior o la pregunta siguiente, causando errores de asignación.",
    recomendacion: "Limitar la marca de verificación al recuadro de la opción."
  },
  {
    id: 13,
    nombre: "Encuadre Triangular",
    categoria: "Subrayados y Círculos",
    compatibilidad: "media",
    descripcion: "Dibujar un triángulo hecho a mano alrededor de la opción.",
    riesgoExplicacion: "Riesgo moderado. Los triángulos irregulares pueden deformarse en la imagen y ser interpretados como tachaduras o manchas.",
    recomendacion: "Preferir círculos o rectángulos que envuelvan la opción completa."
  },
  {
    id: 14,
    nombre: "Subrayado de Letra",
    categoria: "Subrayados y Círculos",
    compatibilidad: "media",
    descripcion: "Una línea horizontal dibujada directamente debajo de la letra de la opción.",
    riesgoExplicacion: "Riesgo moderado. En imágenes ligeramente inclinadas o de baja resolución, la línea puede confundirse con el borde del recuadro o la separación de filas.",
    recomendacion: "Asegurarse de hacer una línea gruesa y bien pegada a la letra."
  },
  {
    id: 15,
    nombre: "Subrayado de Texto de Respuesta",
    categoria: "Subrayados y Círculos",
    compatibilidad: "media",
    descripcion: "Una línea horizontal dibujada debajo del enunciado completo de la respuesta.",
    riesgoExplicacion: "Riesgo moderado. Similar al subrayado de letra, pero al ser más largo puede rozar marcas de preguntas adyacentes.",
    recomendacion: "Subrayar únicamente la palabra clave o la letra identificativa."
  },
  {
    id: 16,
    nombre: "Tachado Vertical",
    categoria: "Tachados y Líneas",
    compatibilidad: "media",
    descripcion: "Una sola línea vertical que corta de arriba a abajo la letra o la burbuja.",
    riesgoExplicacion: "Riesgo moderado. Podría confundirse con el número '1', una barra '/', o un trazo de escritura descartado.",
    recomendacion: "Evitar trazos verticales simples aislados; usar cruces en su lugar."
  },
  {
    id: 17,
    nombre: "Tachado Horizontal",
    categoria: "Tachados y Líneas",
    compatibilidad: "media",
    descripcion: "Una línea horizontal simple dibujada directamente sobre el texto o la burbuja.",
    riesgoExplicacion: "Riesgo moderado. La IA puede interpretarlo como que la opción ha sido descartada o eliminada (tachada para anularla) en lugar de seleccionada.",
    recomendacion: "No usar líneas horizontales únicas sobre la opción si no se quiere anular."
  },
  {
    id: 18,
    nombre: "Línea Diagonal (Slash)",
    categoria: "Tachados y Líneas",
    compatibilidad: "media",
    descripcion: "Una barra oblicua simple (/) que atraviesa la letra o casilla.",
    riesgoExplicacion: "Riesgo moderado. Un solo trazo diagonal puede ser malinterpretado como un raspón accidental del lápiz si es muy tenue.",
    recomendacion: "Hacer el trazo lo suficientemente largo y oscuro para que sea intencional."
  },
  {
    id: 19,
    nombre: "Línea Retrodiagonal (Backslash)",
    categoria: "Tachados y Líneas",
    compatibilidad: "media",
    descripcion: "Una barra invertida simple (\\) que cruza la opción.",
    riesgoExplicacion: "Riesgo moderado. Similar a la línea diagonal común; tiene riesgo de pasar desapercibida si el trazo es fino.",
    recomendacion: "Hacer trazo grueso o cruzar con otra diagonal para formar una X."
  },
  {
    id: 20,
    nombre: "Tachado Doble",
    categoria: "Tachados y Líneas",
    compatibilidad: "media",
    descripcion: "Dos líneas horizontales o diagonales paralelas que cruzan la opción.",
    riesgoExplicacion: "Riesgo moderado. Altamente propenso a interpretarse como anulación voluntaria de la opción (descarte).",
    recomendacion: "Es común en alumnos que cambian de opinión; la IA debe ser muy analítica para discernir si es selección o descarte."
  },
  {
    id: 21,
    nombre: "Punto Central Grueso",
    categoria: "Burbujas y Casillas",
    compatibilidad: "media",
    descripcion: "Un punto redondo y denso en el centro geométrico del óvalo.",
    riesgoExplicacion: "Riesgo moderado. Deja la mayor parte de la burbuja vacía, lo que puede confundir a la IA si busca un sombreado general.",
    recomendacion: "Garantizar que el punto cubra al menos el 50% de la superficie interna."
  },
  {
    id: 22,
    nombre: "Puntos Múltiples Internos",
    categoria: "Burbujas y Casillas",
    compatibilidad: "media",
    descripcion: "Varios puntos pequeños (punteado) distribuidos dentro del óvalo.",
    riesgoExplicacion: "Riesgo moderado. La textura punteada puede interpretarse como ruido de impresión o suciedad óptica.",
    recomendacion: "Unir los puntos con un trazo sólido continuo."
  },
  {
    id: 24,
    nombre: "Cuadrícula Interna (Cross-hatching)",
    categoria: "Burbujas y Casillas",
    compatibilidad: "media",
    descripcion: "Un sombreado tipo red o malla cruzada dibujado dentro del óvalo.",
    riesgoExplicacion: "Riesgo moderado. La textura puede confundirse con interferencias si la resolución de la foto es baja.",
    recomendacion: "Asegurar que los trazos de la red sean firmes e intensos."
  },
  {
    id: 25,
    nombre: "Flecha Indicadora",
    categoria: "Marcas Especiales",
    compatibilidad: "media",
    descripcion: "Una flecha dibujada fuera del examen que apunta directamente a la casilla u opción de respuesta.",
    riesgoExplicacion: "Riesgo moderado. La flecha es un elemento flotante; si se dibuja muy lejos de la opción, la IA no asociará el señalamiento.",
    recomendacion: "Dibujar la punta de la flecha tocando el borde exterior de la opción deseada."
  },
  {
    id: 26,
    nombre: "Resaltador sobre Letra",
    categoria: "Marcas Especiales",
    compatibilidad: "media",
    descripcion: "Uso de marcador fluorescente (amarillo, verde, rosa) directamente sobre la letra.",
    riesgoExplicacion: "Riesgo moderado. Si la cámara tiene balances de blanco agresivos o filtra el contraste, el color brillante del resaltador puede desvanecerse en la foto digital.",
    recomendacion: "Usar resaltadores oscuros o complementar con un contorno de bolígrafo negro."
  },
  {
    id: 27,
    nombre: "Resaltador de Fila Completa",
    categoria: "Marcas Especiales",
    compatibilidad: "media",
    descripcion: "Sombreado completo de la línea de respuesta usando un marcador translúcido.",
    riesgoExplicacion: "Riesgo moderado. Similar al resaltado de letra, pero al abarcar más área puede deslavar el contraste general de la fila en imágenes mal iluminadas.",
    recomendacion: "Confirmar que el texto del examen permanezca perfectamente legible tras el sombreado."
  },
  {
    id: 28,
    nombre: "Asterisco (*) Adyacente",
    categoria: "Marcas Especiales",
    compatibilidad: "media",
    descripcion: "Un asterisco dibujado al lado de la respuesta seleccionada.",
    riesgoExplicacion: "Riesgo moderado. Puede interpretarse como un símbolo de anotación o nota al pie en lugar de un indicador de selección activa.",
    recomendacion: "Mantener el asterisco cerca de la opción y no añadir otros símbolos en la misma hoja."
  },
  {
    id: 29,
    nombre: "Asterisco (*) Interno",
    categoria: "Marcas Especiales",
    compatibilidad: "media",
    descripcion: "Un asterisco dibujado dentro de la casilla u óvalo.",
    riesgoExplicacion: "Riesgo moderado. Al tener múltiples líneas cruzadas finas, puede parecer ruido gráfico si la captura está borrosa.",
    recomendacion: "Cruzar las líneas con trazos gruesos y decididos."
  },
  {
    id: 30,
    nombre: "Texto Confirmatorio al Lado",
    categoria: "Anotaciones y Escritura",
    compatibilidad: "media",
    descripcion: "Escribir palabras como 'SÍ', 'SI', 'OK' o 'ESTA' al lado de la opción elegida.",
    riesgoExplicacion: "Riesgo moderado. La IA debe segmentar la escritura a mano y procesar el significado semántico para entender que es una marca de aceptación.",
    recomendacion: "No abusar de las notas manuscritas; acompañarlas siempre de un marcado físico en la casilla."
  },
  {
    id: 33,
    nombre: "Encerrar y Tachar el Resto",
    categoria: "Marcas de Corrección",
    compatibilidad: "media",
    descripcion: "Encerrar en un círculo la opción elegida y marcar con X todas las demás opciones de la misma pregunta.",
    riesgoExplicacion: "Riesgo moderado. Si la IA no lee el contexto completo, verá múltiples marcas en la misma pregunta y podría anularla por doble marcado.",
    recomendacion: "Tener cuidado de que las 'X' de descarte no parezcan marcas de selección."
  },
  {
    id: 36,
    nombre: "Estrella Interna",
    categoria: "Marcas Especiales",
    compatibilidad: "media",
    descripcion: "Dibujar una pequeña estrella de 5 puntas dentro de la casilla de respuesta.",
    riesgoExplicacion: "Riesgo moderado. Su forma compleja puede deformarse en fotos pixeladas y asimilarse a un borrón o defecto del papel.",
    recomendacion: "Dibujar una forma geométrica más simple como círculo o cruz."
  },
  {
    id: 37,
    nombre: "Símbolos Especiales (Carita / Signo +)",
    categoria: "Marcas Especiales",
    compatibilidad: "media",
    descripcion: "Dibujar un signo más (+), un check estilizado o una carita feliz dentro de la burbuja.",
    riesgoExplicacion: "Riesgo moderado. Depende fuertemente de la capacidad interpretativa de la IA para discernir que un símbolo amigable equivale a una selección.",
    recomendacion: "Evitar dibujos y limitarse a marcas convencionales."
  },
  {
    id: 38,
    nombre: "Sombreado Desbordado (Messy)",
    categoria: "Burbujas y Casillas",
    compatibilidad: "media",
    descripcion: "Un coloreado rápido que se sale notablemente de los límites físicos del óvalo.",
    riesgoExplicacion: "Riesgo moderado. Al desbordarse, puede invadir el espacio de la opción contigua de la derecha o izquierda, induciendo a error de lectura.",
    recomendacion: "Intentar colorear manteniendo el trazo dentro del contorno."
  },
  {
    id: 44,
    nombre: "Línea de Conexión de Columnas",
    categoria: "Tachados y Líneas",
    compatibilidad: "media",
    descripcion: "Trazar una línea continua desde la pregunta hasta una columna de letras al costado.",
    riesgoExplicacion: "Riesgo moderado. Si la línea se tuerce ligeramente o tiembla, puede terminar apuntando a la opción de arriba o abajo.",
    recomendacion: "Dibujar líneas rectas perfectas (usando regla de preferencia) y marcar con un punto la llegada."
  },
  {
    id: 45,
    nombre: "Paréntesis de Envoltura",
    categoria: "Subrayados y Círculos",
    compatibilidad: "media",
    descripcion: "Dibujar paréntesis o corchetes alrededor de la opción elegida, ej. (A) o [A].",
    riesgoExplicacion: "Riesgo moderado. Las dos líneas curvas laterales pueden interpretarse como marcas de dos letras distintas si no se analizan como par.",
    recomendacion: "Cerrar los paréntesis para formar un óvalo completo alrededor de la letra."
  },
  {
    id: 46,
    nombre: "Encerrar Número y Letra",
    categoria: "Subrayados y Círculos",
    compatibilidad: "media",
    descripcion: "Dibujar un círculo continuo que abarca tanto el número indicador de pregunta como la letra de respuesta.",
    riesgoExplicacion: "Riesgo moderado. El círculo sobredimensionado puede colisionar con las letras de las preguntas vecinas.",
    recomendacion: "Limitar la envoltura únicamente a la letra de la opción elegida."
  },
  {
    id: 50,
    nombre: "Garabato o Rayón Rápido",
    categoria: "Burbujas y Casillas",
    compatibilidad: "media",
    descripcion: "Un trazo rápido en forma de zigzag u ondas rápidas que rellena parcialmente la casilla.",
    riesgoExplicacion: "Riesgo moderado. La falta de un patrón geométrico claro puede ser interpretado como una marca accidental o descarte fallido.",
    recomendacion: "Hacer un trazo cruzado (X) en lugar de movimientos libres ondulados."
  },

  // --- BAJA COMPATIBILIDAD (ALTO RIESGO) ---
  {
    id: 34,
    nombre: "Tachar Incorrectas (Dejar Vacía la Correcta)",
    categoria: "Tachados y Líneas",
    compatibilidad: "baja",
    descripcion: "El estudiante tacha con una X o barra todas las opciones incorrectas y deja intacta la que considera correcta.",
    riesgoExplicacion: "Riesgo crítico. Los motores visuales interpretan las marcas físicas como las opciones elegidas. Si la correcta queda limpia, la IA asumirá que el estudiante marcó todas las incorrectas o que dejó la pregunta en blanco.",
    recomendacion: "Totalmente desaconsejado. Siempre se debe marcar físicamente la respuesta seleccionada."
  },
  {
    id: 35,
    nombre: "Líneas sobre Incorrectas (Dejar Vacía la Correcta)",
    categoria: "Tachados y Líneas",
    compatibilidad: "baja",
    descripcion: "Igual al anterior, pero usando líneas oblicuas (/) sobre las incorrectas para descartarlas, dejando la correcta vacía.",
    riesgoExplicacion: "Riesgo crítico. Mismo comportamiento problemático de inversión lógica. La IA detectará marcas en las incorrectas y anulará el examen.",
    recomendacion: "Evitar esquemas de descarte físico que dejen la respuesta elegida sin marcas directas."
  },
  {
    id: 39,
    nombre: "Marca con Lápiz muy Tenue",
    categoria: "Marcas Especiales",
    compatibilidad: "baja",
    descripcion: "Una marca realizada con lápiz duro (ej. 2H, 3H) que deja un trazo muy claro, grisáceo y de bajo contraste.",
    riesgoExplicacion: "Riesgo crítico. En fotos con iluminación no uniforme o sombras, el trazo tenue desaparece por completo ante los algoritmos de binarización y procesamiento de imagen.",
    recomendacion: "Usar lápices blandos (tipo 2B o HB) o bolígrafos de tinta gel o estándar oscura."
  },
  {
    id: 41,
    nombre: "Corrección por Cruzamiento (X y Círculo)",
    categoria: "Marcas de Corrección",
    compatibilidad: "baja",
    descripcion: "Tachar con una X gruesa una opción previamente marcada por error, y encerrar en un círculo la nueva opción elegida.",
    riesgoExplicacion: "Riesgo crítico. La IA detecta dos opciones marcadas físicamente. Distinguir cuál marca es la 'anulación' y cuál la 'selección' requiere un análisis de alta complejidad y contexto.",
    recomendacion: "Si se comete un error, es preferible borrar completamente con goma o escribir una nota textual aclaratoria clara."
  },
  {
    id: 42,
    nombre: "Texto de Rectificación (Anotación 'NO')",
    categoria: "Marcas de Corrección",
    compatibilidad: "baja",
    descripcion: "Marcar dos burbujas pero escribir la palabra 'NO' o 'ERROR' con una flecha apuntando a la opción descartada.",
    riesgoExplicacion: "Riesgo crítico. Aunque para un humano es evidente, la IA puede omitir la lectura del texto manuscrito pequeño y determinar que hay una doble marca inválida.",
    recomendacion: "Evitar marcas múltiples en la misma fila de preguntas. Si no se puede borrar, solicitar una hoja de respuestas nueva."
  },
  {
    id: 43,
    nombre: "Borrado Parcial Incompleto (Ghosting)",
    categoria: "Marcas de Corrección",
    compatibilidad: "baja",
    descripcion: "Borrar una marca de lápiz pero dejar una mancha o sombra gris visible, mientras se marca otra opción fuertemente.",
    riesgoExplicacion: "Riesgo crítico. La sombra residual (efecto fantasma) puede tener la suficiente densidad para que la IA la compute como una segunda marca activa.",
    recomendacion: "Borrar a fondo sin dejar residuos oscuros. Usar gomas de borrar de migajón de buena calidad."
  },
  {
    id: 47,
    nombre: "Mancha de Tinta Intencional (Borrón)",
    categoria: "Marcas Especiales",
    compatibilidad: "baja",
    descripcion: "Presionar y restregar el bolígrafo hasta crear un borrón denso que suele deformar el papel y emborronar el texto de la letra.",
    riesgoExplicacion: "Riesgo crítico. Los borrones masivos pueden interpretarse como un intento de tachar y anular la opción, o arruinar la legibilidad de la letra subyacente.",
    recomendacion: "Limitar el marcado a trazos definidos. No amontonar tinta innecesariamente."
  },
  {
    id: 48,
    nombre: "Espiral de Fila Completa",
    categoria: "Burbujas y Casillas",
    compatibilidad: "baja",
    descripcion: "Un trazo continuo en espiral que pasa por encima de varias opciones hasta detenerse o enfatizarse en la elegida.",
    riesgoExplicacion: "Riesgo crítico. La línea continua conecta visualmente múltiples burbujas. La IA detectará marcas superpuestas en toda la fila de la pregunta.",
    recomendacion: "No conectar las opciones con trazos de tránsito; marcar únicamente la casilla final."
  },
  {
    id: 49,
    nombre: "Numeración de Orden de Prioridad",
    categoria: "Anotaciones y Escritura",
    compatibilidad: "baja",
    descripcion: "Escribir números ('1', '2', '3') encima o dentro de las burbujas para denotar preferencia (ej. escribir '1' sobre la elegida).",
    riesgoExplicacion: "Riesgo crítico. La presencia de múltiples números escritos sobre las opciones crea marcas físicas en varias casillas. La IA se confundirá entre los números y anulará por selección múltiple.",
    recomendacion: "No realizar ninguna anotación numérica dentro de las casillas reservadas para marcar."
  }
];

/**
 * Bloque de directrices estructurado para el prompt de la IA.
 * Explica con precisión cómo evaluar los exámenes de acuerdo a estas 50 formas de marcar,
 * previniendo falsos negativos e interpretaciones erróneas.
 */
export const markingStylesPrompt = `
⚠️ ANÁLISIS DE MÚLTIPLES ESTILOS DE MARCACIÓN DE EXÁMENES (50 FORMAS DE MARCAR):
Para evaluar de manera justa e hiper-precisa las respuestas del estudiante, debes tener en cuenta que los alumnos usan diversas formas de marcar la respuesta seleccionada. No debes catalogar automáticamente como 'incorrecta' o 'invalida' una respuesta por usar una marca no tradicional. Analiza la intención real del estudiante considerando la siguiente clasificación de estilos de marcación y sus riesgos asociados:

1. MARCAS CONVENCIONALES (ALTA COMPATIBILIDAD):
   - Relleno completo u óvalo sombreado (Estilo 1, 2, 23).
   - Cruz (X) limpia dentro de la casilla o burbuja (Estilo 5).
   - Cotejo o Visto (✓) limpio dentro de la burbuja (Estilo 8).
   - Círculo trazado alrededor de la letra o la burbuja (Estilo 10, 11).
   - Cajas o rectángulos envolventes (Estilo 12).
   - Letra de respuesta escrita textualmente en un recuadro o línea dedicada (Estilo 31, 32).
   * REGLA: Estas marcas deben interpretarse directamente como la opción elegida del estudiante.

2. MARCAS INDIRECTAS O SUTILES (COMPATIBILIDAD MEDIA):
   - Subrayados (línea debajo de la letra o del texto de la opción - Estilos 14, 15).
   - Tachados simples (líneas diagonales /, contradiagonales \\, o una línea horizontal sobre la opción - Estilos 16, 17, 18, 19).
   - Flechas indicadoras que apuntan a una opción (Estilo 25).
   - Resaltados fluorescentes que cubren la letra o la fila entera (Estilos 26, 27).
   - Asteriscos (*), estrellas u otros signos menores dentro o al lado de la burbuja (Estilos 28, 29, 36, 37).
   - Garabatos rápidos u ondulados que llenan parcialmente el espacio (Estilos 3, 4, 6, 21, 22, 24, 50).
   - Selección por envoltura de paréntesis (ej. [A] o (A) - Estilo 45).
   * REGLA: Si observas una única marca de este tipo en una pregunta (y las demás opciones están limpias), debes considerarla como la OPCIÓN SELECCIONADA por el estudiante. No declares la respuesta vacía o errónea por el hecho de estar subrayada o tachada si no hay otra marca que compita.

3. PATRONES COMPLEJOS Y DE CORRECCIÓN (BAJA COMPATIBILIDAD / ALTO RIESGO DE ERROR):
   - Lógica de Descarte Inversa (Estilos 34, 35): El estudiante tacha todas las opciones incorrectas y deja LIMPIA la correcta.
     * CÓMO DETECTARLO: Si ves que en casi todas las preguntas hay 3 opciones tachadas con X/líneas y una sola opción perfectamente intacta y vacía, el estudiante está usando esta lógica. Debes interpretar la opción VACÍA como la seleccionada y NO declarar la pregunta como inválida por selección múltiple.
   - Correcciones Manuales (Estilos 41, 42, 43): El estudiante se equivocó y tachó fuertemente una opción anterior (con una X grande o borrón) y encerró otra en un círculo, o escribió anotaciones como 'NO', 'ERROR', 'ESTA NO' al lado.
     * CÓMO DETECTARLO: No declares de inmediato 'selección múltiple/incorrecta'. Analiza si un trazo es visiblemente más denso o está sobrescrito para anularlo, o si hay texto manuscrito aclaratorio. Toma como opción elegida la que está encerrada en un círculo o la que no tiene la marca de anulación.
   - Marcas muy tenues (Estilo 39): Sombreado a lápiz muy claro que casi no se nota.
     * CÓMO DETECTARLO: Examina con alto nivel de contraste el fondo de los óvalos. Si hay un ligero oscurecimiento consistente en comparación con las opciones vacías, considéralo marcado.
   - Líneas de Conexión o Espirales Continuos (Estilos 44, 48):
     * CÓMO DETECTARLO: Rastrea la trayectoria del trazo para ver en qué opción de respuesta finaliza o se asienta la línea. Esa será la elegida.

⚠️ INSTRUCCIONES DE RAZONAMIENTO PARA LA EVALUACIÓN:
En tu campo 'razonamiento_visual', para cada pregunta debes detallar brevemente qué tipo de marca detectaste basándote en esta clasificación (por ejemplo: 'El estudiante usó un círculo sobre la letra B', o 'Se detectó borrado incompleto en A pero una marca sólida en C, interpretándose C como la opción elegida'). Esto evitará falsas calificaciones y dará total transparencia al profesor.
`;
