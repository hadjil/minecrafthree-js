// TextureFactory.ts

import * as THREE from 'three';
import { blocks } from './blocks'; // Asumo que 'blocks' contiene la definición de colores e IDs

export class TextureFactory {
    static generateTextureAtlas() {
        const canvas = document.createElement('canvas');
        // Usar un canvas más grande (e.g., 256x256) es a menudo mejor para mipmaps
        // Pero mantendremos el tamaño original para tu configuración: 32 x (número de bloques)
        const ctx = canvas.getContext('2d', { willReadFrequently: true }); 
        
        const blockSize = 32;
        const blockCount = Object.keys(blocks).length;
        
        canvas.width = blockSize;
        canvas.height = blockSize * blockCount;

        // ⚠️ Nota: Una pequeña línea de margen (padding) entre bloques en el atlas 
        // y el ajuste de UVs en tu código de geometría es la mejor defensa contra 
        // artefactos de "costura". Aquí solo podemos arreglar el filtro.

        Object.values(blocks).forEach((block) => {
            const y = block.id * blockSize;
            
            // Lógica especial para el bloque Grass_Side_Dirt
            if (block.name === 'Grass_Side_Dirt') {
                // Dibujar la base de tierra para los lados
                ctx.fillStyle = '#' + blocks.dirt.color.toString(16).padStart(6, '0');
                ctx.fillRect(0, y, blockSize, blockSize);
                this._applyProceduralDetail(ctx, 'Dirt', 0, y, blockSize); // Aplicar ruido a la tierra

                // Dibujar la franja de pasto en la parte superior (aproximadamente el 1/4 superior)
                const grassTopHeight = Math.floor(blockSize / 4); 
                ctx.fillStyle = '#' + blocks.grass.color.toString(16).padStart(6, '0');
                ctx.fillRect(0, y, blockSize, grassTopHeight);
                // Aplicar ruido de pasto solo a la franja superior
                this._applyProceduralDetail(ctx, 'Grass', 0, y, blockSize, grassTopHeight); 

            } else {
                // Lógica normal para otros bloques (pasto puro, tierra pura, etc.)
                ctx.fillStyle = '#' + block.color.toString(16).padStart(6, '0');
                ctx.fillRect(0, y, blockSize, blockSize);
                this._applyProceduralDetail(ctx, block.name, 0, y, blockSize);
            }
        });

        const texture = new THREE.CanvasTexture(canvas);
        
        // 🚀 OPTIMIZACIÓN DE RENDIMIENTO Y CALIDAD DE PIXELADO
        texture.magFilter = THREE.NearestFilter; // Mantiene los píxeles grandes de cerca
        
        // ✅ CORRECCIÓN: Usar Mipmaps para la distancia (reduce artefactos de costura y aliasing).
        texture.minFilter = THREE.NearestMipmapNearestFilter; 
        
        // Generar Mipmaps y actualizar la textura para que Three.js los use
        texture.generateMipmaps = true;
        texture.needsUpdate = true;
        
        texture.colorSpace = THREE.SRGBColorSpace;
        
        return { texture, blockSize, blockCount };
    }

    // Acepta un parámetro 'height' opcional para pintar solo una sección vertical
    static _applyProceduralDetail(ctx, type, x, y, size, height = size) { 
        const noise = (strength = 0.25) => {
            // Asegura que solo se procese el área definida por 'size' y 'height'
            const imageData = ctx.getImageData(x, y, size, height); 
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const grain = (Math.random() - 0.5) * strength * 255; 
                data[i] += grain;     // R
                data[i+1] += grain;   // G
                data[i+2] += grain;   // B
            }
            ctx.putImageData(imageData, x, y); 
        };

        if (type === 'Grass') {
            noise(0.08); 
            ctx.fillStyle = '#4da832'; 
            for(let i=0; i<10; i++) {
                ctx.fillRect(x + Math.random()*size, y + Math.random()*height, 2, 2); 
            }
        } else if (type === 'Dirt') {
            noise(0.20); 
        } else if (type === 'Stone') {
            noise(0.25); 
            ctx.strokeStyle = '#666666';
            ctx.beginPath();
            ctx.moveTo(x + 5, y + 5); ctx.lineTo(x + 10, y + 10);
            ctx.stroke();
        } else if (type === 'Coal Ore') {
            noise(0.25); 
            ctx.fillStyle = '#000000'; 
            ctx.fillRect(x+8, y+8, 6, 6);
            ctx.fillRect(x+20, y+15, 5, 5);
            ctx.fillRect(x+5, y+20, 4, 4);
        } else if (type === 'Iron Ore') {
            noise(0.18); 
            ctx.fillStyle = '#eebbaa'; 
            ctx.fillRect(x+10, y+5, 6, 4);
            ctx.fillRect(x+15, y+20, 5, 7);
        } else {
             // Si el tipo no tiene un detalle procedural específico, aplicar ruido general
             noise(0.1);
        }
    }
}