'use client';

/**
 * HealthBlob - Blob SVG Animado
 * 
 * Blob orgánico que cambia de forma y velocidad de animación
 * según el puntaje de salud del proyecto.
 * 
 * - Score alto (≥80): Verde, forma suave, animación lenta
 * - Score medio (60-79): Amarillo, ondulante, animación media
 * - Score bajo (<60): Violeta, puntas irregulares, animación rápida
 */

import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface HealthBlobProps {
    /** Puntaje de salud (0-100) */
    score: number;
    /** Tamaño del blob */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Mostrar el score dentro del blob */
    showScore?: boolean;
    /** Clases adicionales */
    className?: string;
}

// Configuración de colores por rango de score
const getColorConfig = (score: number) => {
    if (score >= 80) {
        return {
            primary: '#22c55e', // green-500
            secondary: '#16a34a', // green-600
            glow: 'rgba(34, 197, 94, 0.3)',
            textColor: 'text-green-500',
        };
    }
    if (score >= 60) {
        return {
            primary: '#eab308', // yellow-500
            secondary: '#ca8a04', // yellow-600
            glow: 'rgba(234, 179, 8, 0.3)',
            textColor: 'text-yellow-500',
        };
    }
    return {
        primary: '#6366f1', // indigo-500
        secondary: '#4f46e5', // indigo-600
        glow: 'rgba(99, 102, 241, 0.3)',
        textColor: 'text-indigo-500',
    };
};

// Velocidad de animación inversamente proporcional al score
const getAnimationDuration = (score: number) => {
    // Score 100 = 5s (muy lento, tranquilo)
    // Score 0 = 1s (muy rápido, agitado)
    const duration = 1 + (score / 100) * 4;
    return `${duration.toFixed(1)}s`;
};

// Paths del blob - varían según el estado
const BLOB_PATHS = {
    // Saludable: formas circulares y suaves
    healthy: [
        "M45,-59.7C58.7,-52.8,70.4,-40.3,76.2,-25.4C82,-10.5,81.8,6.8,76.4,22.3C71,37.8,60.5,51.5,47,61.4C33.5,71.3,16.8,77.5,0.3,77.1C-16.2,76.7,-32.3,69.7,-45.4,59.4C-58.5,49.1,-68.6,35.5,-73.5,20.1C-78.4,4.7,-78.2,-12.5,-72.3,-27.1C-66.4,-41.7,-54.8,-53.7,-41.3,-60.7C-27.8,-67.7,-12.4,-69.6,1.8,-72C16,-74.4,31.3,-66.6,45,-59.7Z",
        "M42.8,-56.6C55.9,-49.8,66.8,-37.5,72.9,-22.8C79,-8.1,80.3,9,75.3,24C70.3,39,59,51.9,45.4,60.7C31.8,69.5,15.9,74.2,0.2,73.9C-15.5,73.6,-31,68.3,-44.4,59.4C-57.8,50.5,-69.1,38,-74.4,23.1C-79.7,8.2,-79,-9.1,-72.9,-23.7C-66.8,-38.3,-55.3,-50.2,-42.1,-57C-28.9,-63.8,-14.5,-65.5,0.6,-66.3C15.7,-67.1,29.7,-63.4,42.8,-56.6Z",
    ],
    // Atención: formas ondulantes
    warning: [
        "M38.5,-50.2C50.5,-43.4,61.3,-32.5,67.2,-19C73.1,-5.5,74.1,10.6,68.7,24.3C63.3,38,51.5,49.3,38.1,56.6C24.7,63.9,9.7,67.2,-4.5,66C-18.7,64.8,-32.1,59.1,-44.2,50.5C-56.3,41.9,-67.1,30.4,-71.5,16.6C-75.9,2.8,-73.9,-13.3,-67.1,-27C-60.3,-40.7,-48.7,-52,-35.8,-58.4C-22.9,-64.8,-8.7,-66.3,3.1,-70.5C14.9,-74.7,26.5,-57,38.5,-50.2Z",
        "M44.1,-57.1C56.5,-49.4,65.3,-35.5,70.1,-20.2C74.9,-4.9,75.7,11.8,70.4,26.6C65.1,41.4,53.7,54.3,40,62.5C26.3,70.7,10.3,74.2,-5.2,72.3C-20.7,70.4,-35.7,63.1,-48.3,52.5C-60.9,41.9,-71.1,28,-74.8,12.4C-78.5,-3.2,-75.7,-20.5,-67.4,-34.9C-59.1,-49.3,-45.3,-60.8,-31,-66.3C-16.7,-71.8,-1.9,-71.3,9.2,-65.5C20.3,-59.7,31.7,-64.8,44.1,-57.1Z",
    ],
    // Crítico: formas con puntas irregulares
    critical: [
        "M35.4,-46.7C46.2,-38.7,55.4,-28.3,61.6,-15.2C67.8,-2.1,71,13.7,66.5,27.1C62,40.5,49.8,51.5,36.1,58.5C22.4,65.5,7.2,68.5,-8.5,68.1C-24.2,67.7,-40.4,63.9,-52.2,54.3C-64,44.7,-71.4,29.3,-73.6,13.4C-75.8,-2.5,-72.8,-18.9,-65.1,-32.7C-57.4,-46.5,-45,-57.7,-31.7,-64.5C-18.4,-71.3,-4.2,-73.7,6.8,-68.4C17.8,-63.1,24.6,-54.7,35.4,-46.7Z",
        "M42.3,-53.9C54.4,-46.1,63.5,-32.8,68.1,-17.8C72.7,-2.8,72.8,13.9,66.7,27.9C60.6,41.9,48.3,53.2,34.4,60.3C20.5,67.4,5,70.3,-10.8,68.7C-26.6,67.1,-42.7,61,-54.4,50.1C-66.1,39.2,-73.4,23.5,-75.2,7C-77,-9.5,-73.3,-26.8,-63.9,-40.3C-54.5,-53.8,-39.4,-63.5,-24.1,-69.9C-8.8,-76.3,6.7,-79.4,20,-74.8C33.3,-70.2,44.4,-57.9,42.3,-53.9Z",
    ],
};

// Seleccionar paths según score
const getPaths = (score: number) => {
    if (score >= 80) return BLOB_PATHS.healthy;
    if (score >= 60) return BLOB_PATHS.warning;
    return BLOB_PATHS.critical;
};

// Tamaños - texto más grande para mayor visibilidad
const SIZES = {
    sm: { container: 'w-12 h-12', text: 'text-sm font-extrabold' },
    md: { container: 'w-20 h-20', text: 'text-xl font-extrabold' },
    lg: { container: 'w-28 h-28', text: 'text-3xl font-extrabold' },
    xl: { container: 'w-40 h-40', text: 'text-5xl font-extrabold' },
};

export function HealthBlob({
    score,
    size = 'md',
    showScore = true,
    className,
}: HealthBlobProps) {
    const colors = useMemo(() => getColorConfig(score), [score]);
    const duration = useMemo(() => getAnimationDuration(score), [score]);
    const paths = useMemo(() => getPaths(score), [score]);
    const sizeConfig = SIZES[size];

    // Generar un ID único para el gradiente
    const gradientId = useMemo(() => `blob-gradient-${Math.random().toString(36).substr(2, 9)}`, []);

    return (
        <div
            className={cn(
                'relative flex items-center justify-center',
                sizeConfig.container,
                className
            )}
        >
            {/* Glow effect with pulse animation */}
            <div
                className="absolute inset-0 rounded-full blur-xl animate-pulse"
                style={{
                    backgroundColor: colors.glow,
                    animationDuration: duration,
                }}
            />

            {/* SVG Blob */}
            <svg
                viewBox="-100 -100 200 200"
                className="absolute inset-0 w-full h-full"
                style={{
                    filter: `drop-shadow(0 0 10px ${colors.glow})`,
                }}
            >
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={colors.primary} />
                        <stop offset="100%" stopColor={colors.secondary} />
                    </linearGradient>
                </defs>

                <path
                    fill={`url(#${gradientId})`}
                    className="animate-blob"
                    style={{
                        animationDuration: duration,
                        transformOrigin: 'center',
                    }}
                >
                    {/* Animación entre los dos paths */}
                    <animate
                        attributeName="d"
                        values={`${paths[0]};${paths[1]};${paths[0]}`}
                        dur={duration}
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                    />
                </path>
            </svg>

            {/* Score text - enhanced visibility */}
            {showScore && (
                <span
                    className={cn(
                        'relative z-10 flex items-center justify-center',
                        'rounded-full backdrop-blur-sm bg-background/30',
                        size === 'sm' && 'w-8 h-8',
                        size === 'md' && 'w-12 h-12',
                        size === 'lg' && 'w-16 h-16',
                        size === 'xl' && 'w-24 h-24',
                        sizeConfig.text,
                        colors.textColor
                    )}
                    style={{
                        textShadow: `0 0 15px ${colors.glow}, 0 0 30px ${colors.glow}`,
                    }}
                >
                    {Math.round(score)}
                </span>
            )}
        </div>
    );
}
