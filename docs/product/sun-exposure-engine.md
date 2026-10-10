# Sun Exposure Engine

> **Status.** This is the partner pitch — the target, not a description of the
> app. Its figures are illustrative. What is actually built is listed under
> *Sun Exposure Engine* in [`AGENTS.md`](../../AGENTS.md), and the gaps in
> [`roadmap.md`](roadmap.md). It is pitch copy: anything taken from it into the
> UI must first meet the health-language rule in `AGENTS.md` (inform, never
> prescribe).

> De datos meteorológicos a decisiones inteligentes  
> Presentación para socios · Demo en vivo: Parque del Turia, València

---

## El problema — Recibes datos. ¿Qué haces con ellos?

Hoy las apps muestran UV, temperatura o nubosidad… y dejan al usuario solo ante la decisión.

**Dato crudo, sin respuesta:**
- UV 7
- 28°C
- Nubes 40%

**Las preguntas reales del usuario:**
- ¿Es buen momento para salir?
- ¿Cuánto tiempo debería quedarme?
- ¿Voy a quemarme?
- ¿Estoy obteniendo vitamina D?

---

## Cómo funciona — De señales sueltas a un plan de exposición

| Entradas | Engine | Salidas |
|---|---|---|
| Entorno (UV, clima, aire) + tu perfil (piel, cuerpo) | **Sun Exposure Engine** — Cálculo personalizado en tiempo real | 4 cuentas atrás · Sun Quality Score · recomendación |

> *El usuario ya no interpreta datos: recibe una decisión clara.*

---

## El núcleo del motor — Todo nace de cuatro variables

No son cuatro datos más: son la combinación mínima que necesita el motor para razonar sobre tu exposición.

| Variable | Descripción |
|---|---|
| **Tiempo de exposición** | Cuánto tiempo planeas estar al sol |
| **Fototipo de piel** | Tu sensibilidad real ante el UV |
| **Exposición corporal** | Qué parte del cuerpo queda al sol |
| **Tiempo hasta enrojecimiento** | El límite fisiológico de hoy, ahora |

**Cuatro entradas → un solo motor de decisión**

---

## De variables a acción inteligente

El motor cruza esas cuatro entradas y las convierte en cuatro decisiones simultáneas, no en un solo dato suelto.

| Módulo | Resultado | Descripción |
|---|---|---|
| **Vitamina D** | 12 min | Hasta tu dosis óptima |
| **Bronceado** | 35 min | Hasta el nivel esperado |
| **Quemadura** | 47 min | Hasta el enrojecimiento |
| **Sol restante** | 9 min | Antes de perder el sol directo |

---

## Personalización — Una respuesta solar para cada persona

El motor cruza el entorno con tu perfil: cambia tu piel o tu ropa y todos los cálculos se recalibran.

### El entorno
- Índice UV
- Temperatura
- Nubosidad
- Calidad del aire
- Humedad
- Polen

### Tú
- **Fototipo de piel** — Tipos I a VI (Tipo III en el ejemplo)
- **Área expuesta** — Cara · Torso · Piernas · Cuerpo completo

> *Estas dos variables —piel y área expuesta— se combinan con el tiempo de exposición.*

---

## Módulo: Vitamina D *(novedad)*

**No es sí o no: hay un mínimo y un óptimo.**

El motor distingue la dosis mínima útil de la dosis óptima, y te dice exactamente cuánto te falta.

| Hito | Tiempo |
|---|---|
| Dosis mínima | 8 min |
| Dosis óptima | 15 min |

**Estado actual del ejemplo:** 75% alcanzada · faltan 4 min para dosis óptima.

---

## Módulo: Bronceado *(novedad)*

**Del nivel de hoy a un plan de varios días.**

Ahora el motor estima tu bronceado actual y lo proyecta: cuántas sesiones para el resultado que buscas.

**Escala de niveles:** Suave · Ligero · Medio · Intenso · Máx.

**Nivel esperado en la sesión del ejemplo:** Moderado (nivel medio)

**Proyección a 3 días** — 45 min/día:
- Día 1 → 45 min
- Día 2 → 45 min
- Día 3 → 45 min → bronceado ligero acumulado

> *Un objetivo, no una foto fija: el bronceado se planifica.*

---

## Módulo: Quemadura

**El límite fisiológico, calculado al minuto.**

Cruza tu fototipo y tu exposición corporal con el UV de ahora para saber cuánto te queda antes del enrojecimiento.

**Ejemplo — Enrojecimiento en 47 min**

Factores del cálculo:
- UV de ahora: 2.9 · moderado
- Fototipo de piel: III · sensibilidad media
- Exposición corporal: Cuerpo completo
- Tiempo de exposición: 1 hora planeada

---

## Sun Quality Score

**Un único número que lo resume todo.**

Indicador global de 0 a 100 que combina cinco factores en una sola lectura.

**Ejemplo: 87 / 100 — Excelente para salir**

Factores:
- UV moderado
- Buena temperatura
- Baja nubosidad
- Buena calidad del aire
- Confort térmico óptimo

---

## Evolución del día — El sol cambia: el motor se adelanta

Previsión hora a hora y la ventana ideal del día para una exposición saludable.

| Hora | UV | Estado |
|---|---|---|
| 15:00 | 2.1 | Soleado |
| **16:00** | **2.9** | Soleado · **Ahora** |
| 17:00 | 2.4 | Parcialmente nublado |
| 18:00 | 1.6 | Nublado |
| 19:00 | 0.8 | Lluvia |

- **Sol restante:** este punto pierde el sol directo en **9 min**
- **Mejor momento del día:** hoy de **12:00 a 13:30** · IUV máx. 3.8

---

## Contexto ambiental — Todo lo que rodea a tu sesión

Más allá del UV, el motor pondera el confort y la calidad del entorno para validar si merece la pena salir.

**Confort térmico:** 23°C · Sensación 22°C · brisa suave 8 km/h → **Muy cómodo**

**Calidad ambiental:**

| Factor | Valor | Estado |
|---|---|---|
| Calidad del aire | 92/100 | Excelente |
| Polen | Bajo | Riesgo mínimo |
| Humedad | 45% | Óptimo |
| Radiación UV | 2.9 | Moderado |

---

## Ranking del lugar — Motor de negocio

**Cada spot tiene una nota. Y eso vale dinero.**

El mismo motor que guía al usuario puntúa y rankea los lugares: la base de la certificación de spots.

**Ejemplo:** Top 8% de los puntos solares de València hoy · **4.8 / 5**

Por qué importa:
- Una métrica objetiva y comparable para clasificar cada lugar al sol
- Base para certificar spots: las placas holográficas tipo "estrella Michelin"
- Datos agregados de exposición: futuro motor de acuerdos y partnerships

---

## La interfaz — El usuario solo toca dos cosas

Elige la hora y el tiempo de exposición. Personaliza piel y cuerpo una vez. El motor hace el resto.

**Controles del usuario:**
- Hora del día (ej. 16:50 · IUV 2.9)
- Tiempo de exposición (ej. 1 hora)

**Output automático — Parque del Turia:**
- Sun Quality Score: **87** · Excelente
- Vitamina D: **75%**
- Quemadura: **47 min**
- Bronceado: **Moderado**

---

## Caso real — Parque del Turia

**Una sesión, leída de principio a fin.**

**Entradas:**

| Parámetro | Valor |
|---|---|
| Hora | 16:50 |
| Índice UV | 2.9 |
| Fototipo | III |
| Área expuesta | Cuerpo |
| Exposición | 1 hora |

**Salidas del Engine:**

| Módulo | Resultado |
|---|---|
| Vitamina D | 75% · faltan 4 min |
| Bronceado | Moderado |
| Quemadura | 47 min |
| Sol restante | 9 min |
| Score | 87 · riesgo bajo · mejor ventana 12:00–13:30 |

---

## La diferencia — Otros muestran datos. Nosotros generamos decisiones.

| Apps tradicionales | Sun Exposure Engine |
|---|---|
| Muestran cifras sueltas | Cuatro variables, una sola lectura |
| Dejan la interpretación al usuario | Lo cruza con tu piel y tu cuerpo |
| "UV 2.9"… ¿y ahora qué? | Calcula vitamina D y bronceado al instante |
| Información, no acción | Acción clara, en tiempo real |

---

## La visión

> **Un asistente personal de exposición solar**

- **Cuándo salir**
- **Cuánto permanecer**
- **Cuándo protegerte**

---

*Sunspot · Sun Exposure Engine*