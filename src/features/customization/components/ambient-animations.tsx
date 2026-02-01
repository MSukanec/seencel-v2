"use client";

import { useEffect, useRef, useMemo } from "react";
import type { ExtractedColor } from "../types/palette";

/**
 * Ambient Animations Component
 * 
 * Animaciones sutiles de fondo que "respiran" con la paleta.
 * Partículas, ondas, y movimientos orgánicos.
 */

type AnimationType = 'particles' | 'waves' | 'gradient' | 'orbs';

interface AmbientAnimationsProps {
    /** Extracted colors to use for animations */
    colors?: ExtractedColor[];
    /** Type of animation */
    type?: AnimationType;
    /** Animation intensity (0-1) */
    intensity?: number;
    /** Whether animations are enabled */
    enabled?: boolean;
}

export function AmbientAnimations({
    colors = [],
    type = 'orbs',
    intensity = 0.5,
    enabled = true
}: AmbientAnimationsProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    // Get palette colors or defaults
    const paletteColors = useMemo(() => {
        if (colors.length === 0) {
            return ['#e8e4df', '#d4cfc7', '#c9c2b8', '#beb5a9'];
        }
        return colors.slice(0, 4).map(c => c.hex);
    }, [colors]);

    useEffect(() => {
        if (!enabled || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const updateSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        updateSize();
        window.addEventListener('resize', updateSize);

        // Animation based on type
        if (type === 'orbs') {
            return animateOrbs(ctx, canvas, paletteColors, intensity, animationRef);
        } else if (type === 'waves') {
            return animateWaves(ctx, canvas, paletteColors, intensity, animationRef);
        } else if (type === 'particles') {
            return animateParticles(ctx, canvas, paletteColors, intensity, animationRef);
        }

        return () => {
            window.removeEventListener('resize', updateSize);
            cancelAnimationFrame(animationRef.current);
        };
    }, [enabled, type, paletteColors, intensity]);

    if (!enabled) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{
                opacity: 0.4 * intensity,
                mixBlendMode: 'soft-light'
            }}
        />
    );
}

// ============================================
// ORBS ANIMATION - Floating soft spheres
// ============================================
function animateOrbs(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    colors: string[],
    intensity: number,
    animationRef: React.MutableRefObject<number>
) {
    const orbs: Orb[] = [];
    const numOrbs = Math.floor(3 + intensity * 4);

    // Create orbs
    for (let i = 0; i < numOrbs; i++) {
        orbs.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 100 + Math.random() * 200,
            color: colors[i % colors.length],
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            phase: Math.random() * Math.PI * 2
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const orb of orbs) {
            // Update position with gentle floating
            orb.x += orb.vx + Math.sin(Date.now() * 0.0005 + orb.phase) * 0.2;
            orb.y += orb.vy + Math.cos(Date.now() * 0.0004 + orb.phase) * 0.2;

            // Wrap around screen
            if (orb.x < -orb.radius) orb.x = canvas.width + orb.radius;
            if (orb.x > canvas.width + orb.radius) orb.x = -orb.radius;
            if (orb.y < -orb.radius) orb.y = canvas.height + orb.radius;
            if (orb.y > canvas.height + orb.radius) orb.y = -orb.radius;

            // Breathing effect
            const breathe = 1 + Math.sin(Date.now() * 0.001 + orb.phase) * 0.1;
            const currentRadius = orb.radius * breathe;

            // Draw gradient orb
            const gradient = ctx.createRadialGradient(
                orb.x, orb.y, 0,
                orb.x, orb.y, currentRadius
            );
            gradient.addColorStop(0, orb.color + '40');
            gradient.addColorStop(0.5, orb.color + '20');
            gradient.addColorStop(1, orb.color + '00');

            ctx.beginPath();
            ctx.arc(orb.x, orb.y, currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => cancelAnimationFrame(animationRef.current);
}

interface Orb {
    x: number;
    y: number;
    radius: number;
    color: string;
    vx: number;
    vy: number;
    phase: number;
}

// ============================================
// WAVES ANIMATION - Gentle flowing waves
// ============================================
function animateWaves(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    colors: string[],
    intensity: number,
    animationRef: React.MutableRefObject<number>
) {
    let time = 0;

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        time += 0.005;

        const numWaves = 3;
        for (let w = 0; w < numWaves; w++) {
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);

            const waveHeight = 30 + intensity * 50;
            const waveFreq = 0.003 + w * 0.001;
            const yBase = canvas.height * 0.7 + w * 40;

            for (let x = 0; x <= canvas.width; x += 5) {
                const y = yBase +
                    Math.sin(x * waveFreq + time + w) * waveHeight +
                    Math.sin(x * waveFreq * 2 + time * 1.5) * (waveHeight * 0.3);
                ctx.lineTo(x, y);
            }

            ctx.lineTo(canvas.width, canvas.height);
            ctx.closePath();

            const gradient = ctx.createLinearGradient(0, yBase - waveHeight, 0, canvas.height);
            gradient.addColorStop(0, colors[w % colors.length] + '30');
            gradient.addColorStop(1, colors[w % colors.length] + '05');
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => cancelAnimationFrame(animationRef.current);
}

// ============================================
// PARTICLES ANIMATION - Floating dust/sparkles
// ============================================
function animateParticles(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    colors: string[],
    intensity: number,
    animationRef: React.MutableRefObject<number>
) {
    interface Particle {
        x: number;
        y: number;
        size: number;
        color: string;
        vy: number;
        vx: number;
        alpha: number;
        alphaDir: number;
    }

    const particles: Particle[] = [];
    const numParticles = Math.floor(20 + intensity * 40);

    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 2 + Math.random() * 4,
            color: colors[i % colors.length],
            vy: -0.2 - Math.random() * 0.3,
            vx: (Math.random() - 0.5) * 0.2,
            alpha: Math.random(),
            alphaDir: Math.random() > 0.5 ? 0.01 : -0.01
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha += p.alphaDir;

            if (p.alpha <= 0 || p.alpha >= 1) p.alphaDir *= -1;
            if (p.y < -10) {
                p.y = canvas.height + 10;
                p.x = Math.random() * canvas.width;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color + Math.floor(p.alpha * 99).toString(16).padStart(2, '0');
            ctx.fill();
        }

        animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => cancelAnimationFrame(animationRef.current);
}
