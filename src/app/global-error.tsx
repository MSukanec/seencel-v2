"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

// Construction themed funny messages (hardcoded - no translations to avoid crashes)
const constructionMessages = [
    { emoji: "🏗️", text: "Se nos cayó la mezcla" },
    { emoji: "🚧", text: "Estamos en obra (y algo salió mal)" },
    { emoji: "📐", text: "El plano estaba al revés" },
    { emoji: "🧱", text: "Nos falta un ladrillo para terminar" },
    { emoji: "🚜", text: "La excavadora tocó un cable" },
    { emoji: "🔨", text: "Martillamos donde no era" },
    { emoji: "🔩", text: "Se nos perdió un tornillo importante" },
    { emoji: "👷", text: "El arquitecto está revisando qué pasó" },
];

/**
 * Global Error Boundary
 * This catches errors in root layout and other critical places.
 * IMPORTANT: Must NOT use useTranslations or any hooks that could fail!
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
    // Pick a random message (stable between re-renders using error as seed)
    const messageIndex = error.message.length % constructionMessages.length;
    const randomMessage = constructionMessages[messageIndex];

    useEffect(() => {
        // Log to error tracking service
        console.error("Global Error:", error);
    }, [error]);

    return (
        <html>
            <body>
                <div style={{
                    minHeight: '100vh',
                    backgroundColor: '#0a0a0a',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    textAlign: 'center',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: '#fafafa'
                }}>
                    <div style={{ maxWidth: '28rem', width: '100%' }}>
                        {/* Visual Element - Giant 500 with emoji */}
                        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <div style={{
                                fontSize: '10rem',
                                fontWeight: 'bold',
                                color: 'rgba(255,255,255,0.1)',
                                lineHeight: 1,
                                userSelect: 'none'
                            }}>
                                500
                            </div>
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                padding: '1rem',
                                borderRadius: '9999px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                            }}>
                                <span style={{ fontSize: '3rem' }}>🚧</span>
                            </div>
                        </div>

                        {/* Fun Message */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                                {randomMessage.emoji}
                            </div>
                            <h1 style={{
                                fontSize: '1.875rem',
                                fontWeight: 'bold',
                                background: 'linear-gradient(to right, #eab308, #ea580c)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                marginBottom: '0.5rem'
                            }}>
                                ¡Alto la obra!
                            </h1>
                            <p style={{ fontSize: '1.125rem', color: '#a1a1aa', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                                "{randomMessage.text}"
                            </p>
                            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
                                Ha ocurrido un error inesperado. Nuestro equipo de ingenieros ya está revisando los planos.
                            </p>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
                            <button
                                onClick={() => reset()}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    backgroundColor: '#fafafa',
                                    color: '#0a0a0a',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e4e4e7'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                            >
                                🔄 Reintentar
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    backgroundColor: 'transparent',
                                    color: '#a1a1aa',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.color = '#fafafa';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#a1a1aa';
                                }}
                            >
                                🏠 Ir al Inicio
                            </button>
                        </div>

                        {/* Error ID for support */}
                        {error.digest && (
                            <div style={{
                                marginTop: '2rem',
                                paddingTop: '1.5rem',
                                borderTop: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <p style={{ fontSize: '0.75rem', color: '#52525b' }}>
                                    ID del error:{' '}
                                    <code style={{
                                        fontFamily: 'monospace',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.25rem',
                                        color: '#ef4444'
                                    }}>
                                        {error.digest}
                                    </code>
                                </p>
                            </div>
                        )}

                        {/* Fun footer */}
                        <div style={{
                            marginTop: '2rem',
                            fontSize: '0.75rem',
                            color: 'rgba(255,255,255,0.3)',
                            fontFamily: 'monospace',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}>
                            <span>🏗️</span>
                            <span>Error 500 • Obra detenida temporalmente</span>
                            <span>🔨</span>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
