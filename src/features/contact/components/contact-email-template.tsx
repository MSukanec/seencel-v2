import * as React from 'react';

interface ContactEmailTemplateProps {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country: string;
    subject: string;
    message: string;
}

export function ContactEmailTemplate({
    firstName,
    lastName,
    email,
    phone,
    country,
    subject,
    message,
}: Readonly<ContactEmailTemplateProps>) {
    return (
        <div style={{ fontFamily: 'sans-serif', padding: '20px', color: '#333' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
                Nuevo Mensaje de Contacto
            </h1>

            <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <p style={{ margin: '5px 0' }}><strong>De:</strong> {firstName} {lastName}</p>
                <p style={{ margin: '5px 0' }}><strong>Email:</strong> {email}</p>
                {phone && <p style={{ margin: '5px 0' }}><strong>Teléfono:</strong> {phone}</p>}
                <p style={{ margin: '5px 0' }}><strong>País:</strong> {country}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Asunto: {subject}</h2>
            </div>

            <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', backgroundColor: '#fff' }}>
                <h3 style={{ marginTop: 0, fontSize: '16px' }}>Mensaje:</h3>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{message}</p>
            </div>

            <p style={{ fontSize: '12px', color: '#666', marginTop: '30px' }}>
                Este email fue enviado desde el formulario de contacto de Seencel.
            </p>
        </div>
    );
}

