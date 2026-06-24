export type WimuMetricLanguage = "en" | "es";

export type WimuMetricDefinition = {
  definition: Record<WimuMetricLanguage, string>;
  label: Record<WimuMetricLanguage, string>;
  source: string;
  unit: string;
};

const metadataDefinition = (label: string, spanishLabel: string, detail: string, spanishDetail: string): WimuMetricDefinition => ({
  definition: {
    en: detail,
    es: spanishDetail,
  },
  label: {
    en: label,
    es: spanishLabel,
  },
  source: "AMS source field",
  unit: "-",
});

export const wimuMetricDefinitions: Record<string, WimuMetricDefinition> = {
  accelerations: {
    definition: {
      en: "Total number of acceleration actions detected during the session, drill, or task.",
      es: "Numero total de aceleraciones detectadas durante la sesion, drill o tarea.",
    },
    label: { en: "Accelerations", es: "Aceleraciones" },
    source: "SPRO v985 - Accelerations",
    unit: "count",
  },
  avgAcceleration: {
    definition: {
      en: "Average intensity of acceleration actions.",
      es: "Valor promedio de la intensidad de las aceleraciones.",
    },
    label: { en: "Average acceleration", es: "Aceleracion promedio" },
    source: "SPRO v985 - Accelerations",
    unit: "m/s²",
  },
  avgDeceleration: {
    definition: {
      en: "Average intensity of deceleration actions.",
      es: "Valor promedio de la intensidad de las desaceleraciones.",
    },
    label: { en: "Average deceleration", es: "Desaceleracion promedio" },
    source: "SPRO v985 - Accelerations",
    unit: "m/s²",
  },
  avgLandingG: {
    definition: {
      en: "Average landing intensity across all jumps.",
      es: "Promedio de la intensidad en el aterrizaje de todos los saltos realizados.",
    },
    label: { en: "Average landing", es: "Aterrizaje promedio" },
    source: "SPRO v985 - Step-Jump",
    unit: "G",
  },
  avgSpeedKmh: {
    definition: {
      en: "Average player speed over the session.",
      es: "Valor promedio de la velocidad durante la sesion.",
    },
    label: { en: "Average speed", es: "Velocidad promedio" },
    source: "SPRO v985 - High Sprint Efforts",
    unit: "km/h",
  },
  avgTakeoffG: {
    definition: {
      en: "Average take-off intensity across all jumps.",
      es: "Promedio de la intensidad del despegue de todos los saltos realizados.",
    },
    label: { en: "Average take-off", es: "Despegue promedio" },
    source: "SPRO v985 - Step-Jump",
    unit: "G",
  },
  date: metadataDefinition("Date", "Fecha", "Recorded date assigned to the WIMU/GPS daily row.", "Fecha registrada asignada a la fila diaria WIMU/GPS."),
  decelerations: {
    definition: {
      en: "Total number of deceleration actions detected during the session, drill, or task.",
      es: "Numero total de desaceleraciones detectadas durante la sesion, drill o tarea.",
    },
    label: { en: "Decelerations", es: "Desaceleraciones" },
    source: "SPRO v985 - Accelerations",
    unit: "count",
  },
  distanceAcceleration: {
    definition: {
      en: "Distance accumulated while the player is in acceleration actions.",
      es: "Distancia acumulada mientras el jugador realiza acciones de aceleracion.",
    },
    label: { en: "Acceleration distance", es: "Distancia en aceleracion" },
    source: "SPRO v985 - Accelerations",
    unit: "m",
  },
  distanceDeceleration: {
    definition: {
      en: "Distance accumulated while the player is in deceleration actions.",
      es: "Distancia acumulada mientras el jugador realiza acciones de desaceleracion.",
    },
    label: { en: "Deceleration distance", es: "Distancia en desaceleracion" },
    source: "SPRO v985 - Accelerations",
    unit: "m",
  },
  distancePerMinute: {
    definition: {
      en: "Total distance normalized by playing or session minutes.",
      es: "Distancia total normalizada por minutos de juego o sesion.",
    },
    label: { en: "Distance per minute", es: "Distancia por minuto" },
    source: "AMS derived WIMU/GPS field",
    unit: "m/min",
  },
  dsl: {
    definition: {
      en: "Dynamic Stress Load: weighted impact count above 2G.",
      es: "Dynamic Stress Load. Numero de impactos ponderados por encima de 2G.",
    },
    label: { en: "Dynamic Stress Load", es: "Carga dinamica de estres" },
    source: "SPRO v985 - Load",
    unit: "AU",
  },
  edi: {
    definition: {
      en: "Equivalent Distance Index: the stable-speed grass distance represented by the total energy cost divided by total distance.",
      es: "Indice EDI: distancia equivalente a velocidad estable en cesped usando la energia total gastada, dividida entre la distancia total recorrida.",
    },
    label: { en: "Equivalent Distance Index", es: "Indice de distancia equivalente" },
    source: "SPRO v985 - Load",
    unit: "-",
  },
  energyExpenditure: {
    definition: {
      en: "Total energy expenditure associated with activities that include accelerations or decelerations.",
      es: "Gasto energetico total asociado a actividades que incluyan aceleraciones o desaceleraciones.",
    },
    label: { en: "Energy expenditure", es: "Gasto energetico" },
    source: "SPRO v985 - Load",
    unit: "kcal",
  },
  explosiveDistance: {
    definition: {
      en: "Total distance covered with acceleration greater than 1.12 m/s².",
      es: "Distancia total recorrida con una aceleracion mayor a 1,12 m/s².",
    },
    label: { en: "Explosive distance", es: "Distancia explosiva" },
    source: "SPRO v985 - Distance",
    unit: "m",
  },
  fftAvgFreq: {
    definition: {
      en: "Average vibration frequency recorded during the session or drill.",
      es: "Valor medio de la frecuencia de vibracion durante la sesion o drill.",
    },
    label: { en: "FFT average frequency", es: "Frecuencia FFT promedio" },
    source: "SPRO v985 - FFT",
    unit: "Hz",
  },
  fftHzAvgAcc: {
    definition: {
      en: "Average value from multiplying acceleration by instantaneous vibration frequency.",
      es: "Valor medio de los valores obtenidos de multiplicar la aceleracion por la frecuencia de vibracion instantanea.",
    },
    label: { en: "FFT Hz x G average", es: "FFT Hz x G promedio" },
    source: "SPRO v985 - FFT",
    unit: "Hz G",
  },
  fftHzMaxAcc: {
    definition: {
      en: "Maximum value from multiplying acceleration by instantaneous vibration frequency.",
      es: "Valor maximo de los valores obtenidos de multiplicar la aceleracion por la frecuencia de vibracion instantanea.",
    },
    label: { en: "FFT Hz x G max", es: "FFT Hz x G maximo" },
    source: "SPRO v985 - FFT",
    unit: "Hz G",
  },
  fftMaxFreq: {
    definition: {
      en: "Maximum vibration frequency reached during the session or drill.",
      es: "Frecuencia maxima de vibracion alcanzada durante la sesion o drill.",
    },
    label: { en: "FFT max frequency", es: "Frecuencia FFT maxima" },
    source: "SPRO v985 - FFT",
    unit: "Hz",
  },
  highIntensityAccelerations: {
    definition: {
      en: "Number of high-intensity acceleration actions.",
      es: "Numero de aceleraciones de alta intensidad.",
    },
    label: { en: "High-intensity accelerations", es: "Aceleraciones de alta intensidad" },
    source: "SPRO v985 - Accelerations",
    unit: "count",
  },
  highIntensityDecelerations: {
    definition: {
      en: "Number of high-intensity deceleration actions.",
      es: "Numero de desaceleraciones de alta intensidad.",
    },
    label: { en: "High-intensity decelerations", es: "Desaceleraciones de alta intensidad" },
    source: "SPRO v985 - Accelerations",
    unit: "count",
  },
  hibd: {
    definition: {
      en: "High Intensity Braking Distance: distance covered with deceleration greater than 2 m/s².",
      es: "Distancia de frenado de alta intensidad: distancia recorrida con una desaceleracion mayor a 2 m/s².",
    },
    label: { en: "High-intensity braking distance", es: "Distancia de frenado de alta intensidad" },
    source: "SPRO v985 - Distance",
    unit: "m",
  },
  hmlDistance: {
    definition: {
      en: "Distance covered above the high metabolic load threshold, default above 25.5 W/kg.",
      es: "Distancia recorrida por encima del umbral de alta potencia metabolica, por defecto 25,5 W/kg.",
    },
    label: { en: "High metabolic load distance", es: "Distancia de alta carga metabolica" },
    source: "SPRO v985 - Load",
    unit: "m",
  },
  horizontalImpacts: {
    definition: {
      en: "Total number of impacts produced in the horizontal plane.",
      es: "Numero total de impactos producidos en el plano horizontal.",
    },
    label: { en: "Horizontal impacts", es: "Impactos horizontales" },
    source: "SPRO v985 - Horizontal Impacts",
    unit: "count",
  },
  hrAvg: {
    definition: {
      en: "Average heart rate value while HR signal is present.",
      es: "Valor promedio de la frecuencia cardiaca cuando existe senal de HR.",
    },
    label: { en: "Average HR", es: "FC promedio" },
    source: "SPRO v985 - Heart Rate",
    unit: "bpm",
  },
  hrDuration: {
    definition: {
      en: "Effective duration where HR signal exists.",
      es: "Duracion de tiempo efectivo donde ha existido senal de HR.",
    },
    label: { en: "HR duration", es: "Duracion FC" },
    source: "SPRO v985 - Heart Rate",
    unit: "hh:mm:ss",
  },
  hrMax: {
    definition: {
      en: "Maximum heart rate reached.",
      es: "Valor maximo de frecuencia cardiaca alcanzado.",
    },
    label: { en: "Maximum HR", es: "FC maxima" },
    source: "SPRO v985 - Heart Rate",
    unit: "bpm",
  },
  hrPercentageMax: {
    definition: {
      en: "Average heart-rate percentage relative to the player's maximum heart rate.",
      es: "Porcentaje del valor promedio de la frecuencia cardiaca respecto a la frecuencia cardiaca maxima.",
    },
    label: { en: "HR percentage of max", es: "FC porcentaje maximo" },
    source: "SPRO v985 - Heart Rate",
    unit: "%",
  },
  hsrAbsDistance: {
    definition: {
      en: "Distance covered above the absolute HSR threshold, default 21 km/h.",
      es: "Distancia total recorrida con una velocidad superior al umbral HSR Absoluto, por defecto 21 km/h.",
    },
    label: { en: "HSR absolute distance", es: "Distancia HSR absoluta" },
    source: "SPRO v985 - High Sprint Efforts",
    unit: "m",
  },
  hsrRelDistance: {
    definition: {
      en: "Distance covered above the relative HSR threshold, default 75.5% of the player's maximum speed.",
      es: "Distancia total recorrida con una velocidad superior al umbral HSR Relativo, por defecto 75,5% de la velocidad maxima del jugador.",
    },
    label: { en: "HSR relative distance", es: "Distancia HSR relativa" },
    source: "SPRO v985 - High Sprint Efforts",
    unit: "m",
  },
  jumpsCount: {
    definition: {
      en: "Total number of jumps detected.",
      es: "Numero total de saltos detectados.",
    },
    label: { en: "Jumps count", es: "Numero de saltos" },
    source: "SPRO v985 - Step-Jump",
    unit: "count",
  },
  jumpsPerMinute: {
    definition: {
      en: "Jump count normalized by session minutes.",
      es: "Numero de saltos normalizado por minutos de sesion.",
    },
    label: { en: "Jumps per minute", es: "Saltos por minuto" },
    source: "AMS derived WIMU/GPS field",
    unit: "count/min",
  },
  maxAcceleration: {
    definition: {
      en: "Maximum acceleration value reached.",
      es: "Valor de la maxima aceleracion alcanzada.",
    },
    label: { en: "Maximum acceleration", es: "Aceleracion maxima" },
    source: "SPRO v985 - Accelerations",
    unit: "m/s²",
  },
  maxDeceleration: {
    definition: {
      en: "Maximum deceleration value reached.",
      es: "Valor de la maxima desaceleracion alcanzada.",
    },
    label: { en: "Maximum deceleration", es: "Desaceleracion maxima" },
    source: "SPRO v985 - Accelerations",
    unit: "m/s²",
  },
  maxSpeedKmh: {
    definition: {
      en: "Maximum speed reached.",
      es: "Velocidad maxima alcanzada.",
    },
    label: { en: "Maximum speed", es: "Velocidad maxima" },
    source: "SPRO v985 - High Sprint Efforts",
    unit: "km/h",
  },
  metabolicPowerAvg: {
    definition: {
      en: "Average metabolic power developed during the session.",
      es: "Valor promedio de la potencia metabolica desarrollada.",
    },
    label: { en: "Average metabolic power", es: "Potencia metabolica promedio" },
    source: "SPRO v985 - Load",
    unit: "W/kg",
  },
  minutes: {
    definition: {
      en: "Session, drill, or task duration normalized to minutes.",
      es: "Duracion de la sesion, drill o tarea normalizada a minutos.",
    },
    label: { en: "Minutes", es: "Minutos" },
    source: "SPRO v985 - Duration",
    unit: "min",
  },
  playerLoad: {
    definition: {
      en: "Total Player Load index showing accumulated movement across the three movement axes.",
      es: "Valor total del indice Player Load. Muestra la acumulacion de movimiento en los 3 ejes de movimiento.",
    },
    label: { en: "Player Load", es: "Player Load" },
    source: "SPRO v985 - Load",
    unit: "AU",
  },
  playerLoadAp: {
    definition: {
      en: "Player Load in the anteroposterior plane.",
      es: "Valor del indice Player Load en el plano anteroposterior.",
    },
    label: { en: "Player Load AP", es: "Player Load AP" },
    source: "SPRO v985 - Load",
    unit: "AU",
  },
  playerLoadHorizontal: {
    definition: {
      en: "Player Load index in the horizontal axis.",
      es: "Valor del indice Player Load en el eje horizontal.",
    },
    label: { en: "Player Load horizontal", es: "Player Load horizontal" },
    source: "SPRO v985 - Load",
    unit: "AU",
  },
  playerLoadMl: {
    definition: {
      en: "Player Load in the mediolateral plane.",
      es: "Valor del indice Player Load en el plano mediolateral.",
    },
    label: { en: "Player Load ML", es: "Player Load ML" },
    source: "SPRO v985 - Load",
    unit: "AU",
  },
  playerLoadVertical: {
    definition: {
      en: "Player Load index in the vertical axis.",
      es: "Valor del indice Player Load en el eje vertical.",
    },
    label: { en: "Player Load vertical", es: "Player Load vertical" },
    source: "SPRO v985 - Load",
    unit: "AU",
  },
  rollupSourceTask: metadataDefinition("Rollup source task", "Tarea fuente rollup", "Original WIMU task group used to build the daily rollup.", "Grupo de tarea WIMU original usado para construir el rollup diario."),
  rpeCentral: {
    definition: {
      en: "General rating of perceived exertion on a 1 to 10 scale.",
      es: "Percepcion subjetiva del esfuerzo general en escala de 1 a 10.",
    },
    label: { en: "RPE central", es: "RPE central" },
    source: "SPRO v985 - RPE",
    unit: "1-10",
  },
  rpePeripheral: {
    definition: {
      en: "Peripheral rating of perceived exertion on a 1 to 10 scale.",
      es: "Percepcion subjetiva del esfuerzo periferico en escala de 1 a 10.",
    },
    label: { en: "RPE peripheral", es: "RPE periferico" },
    source: "SPRO v985 - RPE",
    unit: "1-10",
  },
  sourceCreatedAt: metadataDefinition("Source created at", "Creado en fuente", "Timestamp when the source row was created or exported.", "Marca de tiempo cuando la fila fuente fue creada o exportada."),
  sourcePlayerName: metadataDefinition("Source player name", "Nombre fuente del jugador", "Player name as received from the source system.", "Nombre del jugador recibido desde el sistema fuente."),
  sourceSessionId: metadataDefinition("Source session ID", "ID sesion fuente", "WIMU/source identifier for the session.", "Identificador WIMU/fuente de la sesion."),
  speedZone0To7: speedZoneDefinition("0-7 km/h"),
  speedZone14To21: speedZoneDefinition("14-21 km/h"),
  speedZone21To25: speedZoneDefinition("21-25 km/h"),
  speedZone25To30: speedZoneDefinition("25-30 km/h"),
  speedZone30To50: speedZoneDefinition("30-50 km/h"),
  speedZone7To14: speedZoneDefinition("7-14 km/h"),
  sprintAbsAvgDuration: {
    definition: {
      en: "Average duration of actions above the absolute sprint threshold.",
      es: "Duracion promedio de las acciones por encima del umbral de Sprint Absoluto.",
    },
    label: { en: "Sprint absolute average duration", es: "Duracion promedio sprint absoluto" },
    source: "SPRO v985 - High Sprint Efforts",
    unit: "ms",
  },
  sprintCount: {
    definition: {
      en: "Number of times the player was above the absolute sprint threshold, default 24 km/h.",
      es: "Numero de veces que el jugador ha estado a una velocidad superior al umbral de Sprint Absoluto, por defecto 24 km/h.",
    },
    label: { en: "Sprint count", es: "Numero de sprints" },
    source: "SPRO v985 - High Sprint Efforts",
    unit: "count",
  },
  sprintDistance: {
    definition: {
      en: "Distance covered above the absolute sprint threshold, default 24 km/h.",
      es: "Distancia total recorrida con una velocidad superior al umbral de Sprint Absoluto, por defecto 24 km/h.",
    },
    label: { en: "Sprint distance", es: "Distancia sprint" },
    source: "SPRO v985 - High Sprint Efforts",
    unit: "m",
  },
  stepBalance: {
    definition: {
      en: "Right-left step intensity asymmetry. A negative value indicates the right leg is dominant.",
      es: "Descompensacion entre la intensidad de pasos de derecha e izquierda. Un valor negativo indica que la pierna derecha es dominante.",
    },
    label: { en: "Step balance", es: "Balance de pasos" },
    source: "SPRO v985 - Step-Jump",
    unit: "%",
  },
  stepsCount: {
    definition: {
      en: "Total number of steps.",
      es: "Numero total de pasos.",
    },
    label: { en: "Steps count", es: "Numero de pasos" },
    source: "SPRO v985 - Step-Jump",
    unit: "count",
  },
  stepsPerMinute: {
    definition: {
      en: "Step count normalized by session minutes.",
      es: "Numero de pasos normalizado por minutos de sesion.",
    },
    label: { en: "Steps per minute", es: "Pasos por minuto" },
    source: "AMS derived WIMU/GPS field",
    unit: "count/min",
  },
  team: metadataDefinition("Team", "Equipo", "Team attached to the WIMU/GPS row.", "Equipo asociado a la fila WIMU/GPS."),
  totalDistance: {
    definition: {
      en: "Total distance covered.",
      es: "Distancia total recorrida.",
    },
    label: { en: "Total distance", es: "Distancia total" },
    source: "SPRO v985 - Distance",
    unit: "m",
  },
  wellnessDoms: {
    definition: {
      en: "Muscle soreness wellness response on a 1 to 5 scale.",
      es: "Dolor muscular registrado en bienestar en escala de 1 a 5.",
    },
    label: { en: "Wellness DOMS", es: "Bienestar dolor muscular" },
    source: "SPRO v985 - RPE",
    unit: "1-5",
  },
  wellnessFatigue: {
    definition: {
      en: "Fatigue wellness response on a 1 to 5 scale.",
      es: "Cansancio registrado en bienestar en escala de 1 a 5.",
    },
    label: { en: "Wellness fatigue", es: "Bienestar cansancio" },
    source: "SPRO v985 - RPE",
    unit: "1-5",
  },
  wellnessMood: {
    definition: {
      en: "Mood wellness response on a 1 to 5 scale.",
      es: "Estado de animo registrado en bienestar en escala de 1 a 5.",
    },
    label: { en: "Wellness mood", es: "Bienestar animo" },
    source: "SPRO v985 - RPE",
    unit: "1-5",
  },
  wellnessSleep: {
    definition: {
      en: "Sleep quality wellness response on a 1 to 5 scale.",
      es: "Calidad del sueno registrada en bienestar en escala de 1 a 5.",
    },
    label: { en: "Wellness sleep", es: "Bienestar sueno" },
    source: "SPRO v985 - RPE",
    unit: "1-5",
  },
  wellnessStress: {
    definition: {
      en: "Stress wellness response on a 1 to 5 scale.",
      es: "Estado de estres registrado en bienestar en escala de 1 a 5.",
    },
    label: { en: "Wellness stress", es: "Bienestar estres" },
    source: "SPRO v985 - RPE",
    unit: "1-5",
  },
  wimuFullName: metadataDefinition("WIMU full name", "Nombre completo WIMU", "Player full name as stored in WIMU.", "Nombre completo del jugador guardado en WIMU."),
  wimuPlayerId: metadataDefinition("WIMU player ID", "ID jugador WIMU", "WIMU identifier for the athlete.", "Identificador WIMU del atleta."),
  wimuPosition: metadataDefinition("WIMU position", "Posicion WIMU", "Position label received from WIMU.", "Etiqueta de posicion recibida desde WIMU."),
  wimuShirtNumber: metadataDefinition("WIMU shirt number", "Numero camiseta WIMU", "Shirt number received from WIMU.", "Numero de camiseta recibido desde WIMU."),
  wimuTeamId: metadataDefinition("WIMU team ID", "ID equipo WIMU", "WIMU identifier for the team.", "Identificador WIMU del equipo."),
  amsId: metadataDefinition("AMS ID", "ID AMS", "Internal AMS athlete identifier used to join sources.", "Identificador interno AMS del atleta usado para conectar fuentes."),
  cleanPlayerName: metadataDefinition("Clean player name", "Nombre limpio del jugador", "Standardized athlete name after source cleaning.", "Nombre estandarizado del atleta despues de la limpieza de fuentes."),
};

function speedZoneDefinition(zone: string): WimuMetricDefinition {
  return {
    definition: {
      en: `Distance covered in the absolute speed zone ${zone}.`,
      es: `Distancia total recorrida en la zona de velocidad absoluta ${zone}.`,
    },
    label: {
      en: `Speed zone ${zone}`,
      es: `Zona velocidad ${zone}`,
    },
    source: "SPRO v985 - Distance",
    unit: "m",
  };
}

export function getWimuMetricDefinition(key: string): WimuMetricDefinition {
  return wimuMetricDefinitions[key] ?? {
    definition: {
      en: "Source WIMU/GPS field available in the cleaned feed. Definition pending review against the full variable dictionary.",
      es: "Campo fuente WIMU/GPS disponible en el feed limpio. Definicion pendiente de revisar contra el diccionario completo de variables.",
    },
    label: {
      en: humanizeMetricKey(key),
      es: humanizeMetricKey(key),
    },
    source: "WIMU/GPS source field",
    unit: "-",
  };
}

export function humanizeMetricKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
