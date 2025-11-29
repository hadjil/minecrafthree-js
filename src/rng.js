/**
 * Clase RNG (Random Number Generator)
 * Implementa un generador de números pseudoaleatorios basado en el estado interno (m_w y m_z).
 * Es útil para escenarios donde se necesita aleatoriedad reproducible (determinística) usando una semilla.
 */
export class RNG {
    // 🎲 Estado interno (Registros de 32 bits)
    // Estos valores iniciales se mezclan con la semilla en el constructor.
    m_w = 123456789;
    m_z = 987654321;
    
    // 🟦 Máscara de 32 bits (0xFFFFFFFF)
    // Se utiliza para garantizar que el resultado de operaciones aritméticas en JavaScript (que usa floats de 64 bits)
    // se trunque o "enmascare" para comportarse como un entero sin signo de 32 bits.
    mask = 0xFFFFFFFF;

    /**
     * Constructor que inicializa el estado del generador usando una semilla.
     * @param {number} seed - La semilla inicial. Un mismo valor de 'seed' siempre producirá la misma secuencia aleatoria.
     */
    constructor(seed) {
        // Inicializa los registros m_w y m_z combinando los valores iniciales con la semilla.
        // La operación '& this.mask' fuerza el resultado a ser un entero de 32 bits sin signo.
        this.m_w = (123456789 + seed) & this.mask;
        this.m_z = (987654321 - seed) & this.mask;
    }

    /**
     * Retorna un número pseudoaleatorio en el rango [0, 1) (0 inclusivo, 1 exclusivo).
     * El corazón del algoritmo de generación.
     * @returns {number} Un número aleatorio normalizado.
     */
    random() {
        // 🔄 Paso 1: Actualizar el estado m_z
        // (this.m_z & 65535) aísla los 16 bits inferiores.
        // (this.m_z >> 16) obtiene los 16 bits superiores (actúa como el 'carry' o acarreo).
        // El estado se actualiza combinando la multiplicación de los 16 bits inferiores con los 16 bits superiores.
        this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & this.mask;
        
        // 🔄 Paso 2: Actualizar el estado m_w
        // Mismo principio que m_z, pero usando un multiplicador diferente (18000) y el otro registro de estado.
        this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & this.mask;
        
        // 💡 Paso 3: Combinar y Obtener Resultado
        // Combina el estado de m_z y m_w para producir un nuevo valor pseudoaleatorio de 32 bits.
        // (this.m_z << 16) desplaza m_z a la izquierda 16 bits (posiciona en la parte superior).
        // (this.m_w & 65535) aísla la parte inferior de m_w.
        // >>> 0 convierte el resultado a un entero sin signo de 32 bits.
        let result = ((this.m_z << 16) + (this.m_w & 65535)) >>> 0;
        
        // ⬇️ Paso 4: Normalización
        // Divide el entero de 32 bits por el máximo valor posible (2^32 = 4,294,967,296)
        // para escalarlo al rango [0, 1).
        result /= 4294967296;
        
        return result;
    }
}