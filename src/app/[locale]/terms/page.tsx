import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { getUserProfile } from "@/features/users/queries";
import {
    FileText, Shield, Scale, AlertCircle, CheckCircle2, Mail,
    User, Key, Database, CreditCard, Lock, Globe, Gavel,
    RefreshCw, AlertTriangle, HelpCircle, Zap, BookOpen
} from "lucide-react";

export const metadata = {
    title: "Términos de Servicio | Seencel",
    description: "Términos y condiciones de uso de la plataforma Seencel para gestión de proyectos de construcción.",
};

export default async function TermsPage() {
    const { profile } = await getUserProfile().catch(() => ({ profile: null }));
    const lastUpdated = "Enero 2026";

    return (
        <div className="flex min-h-screen flex-col bg-background selection:bg-primary/10">
            <Header variant="public" user={profile} />

            <main className="flex-1 pt-8 md:pt-12">
                <div className="container px-4 md:px-6 mx-auto py-12 md:py-20 max-w-4xl">
                    {/* Header */}
                    <div className="mb-12 text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-balance">
                            Términos de Servicio
                        </h1>
                        <p className="text-muted-foreground text-lg mb-8">
                            Última actualización: {lastUpdated}
                        </p>
                        <div className="bg-muted/30 p-6 rounded-xl border border-border/50">
                            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-lg">
                                Sujeto a estos Términos de Servicio (este "Acuerdo"), Seencel S.A. ("Seencel", "nosotros", "nos" y/o "nuestro")
                                proporciona acceso a los Servicios de Seencel. Al usar o acceder a los Servicios, reconoces que has leído,
                                comprendido y aceptas estar sujeto a este Acuerdo.
                            </p>
                        </div>
                        <div className="mt-6 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                            <p className="text-amber-800 dark:text-amber-200 text-sm font-medium flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                <span>
                                    <strong>IMPORTANTE:</strong> Si aceptas este Acuerdo en nombre de una empresa u otra entidad legal,
                                    declaras tener la autoridad para vincular dicha entidad a este Acuerdo.
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="w-full h-px bg-border/50 mb-12" />

                    {/* Table of Contents */}
                    <nav className="mb-12 p-6 bg-card border rounded-xl">
                        <h2 className="font-bold text-lg mb-4">Índice</h2>
                        <ol className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground list-decimal list-inside">
                            {[
                                "Definiciones",
                                "Edad y Elegibilidad",
                                "Licencia de Uso",
                                "Tu Contenido",
                                "Planes y Suscripciones",
                                "Uso Aceptable",
                                "Academia y Cursos",
                                "Seguridad y Cumplimiento",
                                "Protección de Datos",
                                "Restricciones de Uso",
                                "Soporte",
                                "Comunicaciones Electrónicas",
                                "Declaraciones y Garantías",
                                "Indemnización",
                                "Confidencialidad",
                                "Pagos",
                                "Vigencia y Terminación",
                                "Limitación de Responsabilidad",
                                "Ley Aplicable y Disputas",
                                "Disposiciones Generales"
                            ].map((item, i) => (
                                <li key={i} className="hover:text-primary transition-colors">{item}</li>
                            ))}
                        </ol>
                    </nav>

                    {/* Sections */}
                    <div className="space-y-16">

                        {/* 1. Definiciones */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <FileText className="h-6 w-6 text-primary" />
                                1. Definiciones
                            </h2>
                            <div className="mt-6 space-y-4">
                                <div className="bg-muted/40 p-4 rounded-lg border">
                                    <p className="font-semibold text-foreground">"Servicios"</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Significa, colectivamente, cualquier producto o servicio proporcionado por Seencel, incluyendo
                                        la plataforma de gestión de proyectos de construcción, herramientas financieras, gestión de
                                        materiales, subcontratos, mano de obra, y cualquier funcionalidad relacionada.
                                    </p>
                                </div>
                                <div className="bg-muted/40 p-4 rounded-lg border">
                                    <p className="font-semibold text-foreground">"Tu Contenido"</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Significa todo software, código, datos, información, texto, contenido, archivos y otros
                                        materiales que subas, publiques o transmitas en conexión con los Servicios.
                                    </p>
                                </div>
                                <div className="bg-muted/40 p-4 rounded-lg border">
                                    <p className="font-semibold text-foreground">"Organización"</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Significa una empresa constructora, contratista, o entidad comercial que utiliza los
                                        Servicios para gestionar sus proyectos de construcción.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 2. Edad y Elegibilidad */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <User className="h-6 w-6 text-primary" />
                                2. Edad y Elegibilidad
                            </h2>
                            <p className="text-muted-foreground mt-4 leading-relaxed">
                                Certificas que eres una persona de al menos <strong>16 años de edad</strong>. Los Servicios solo pueden
                                ser usados o accedidos a través de un dispositivo electrónico controlado por ti en todo momento.
                            </p>
                            <ul className="list-disc pl-5 mt-4 space-y-2 text-muted-foreground">
                                <li>Una cuenta válida de Seencel solo puede ser creada si proporcionas información válida en el proceso de registro</li>
                                <li>Debes actualizar regularmente dicha información para asegurar su precisión</li>
                                <li>Eres responsable de mantener la confidencialidad de las credenciales de inicio de sesión asociadas con tu cuenta</li>
                                <li>Cada usuario debe tener credenciales únicas que no deben ser compartidas</li>
                                <li>Eres responsable de todas las actividades que ocurran bajo tu cuenta</li>
                            </ul>
                        </section>

                        {/* 3. Licencia de Uso */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <Key className="h-6 w-6 text-primary" />
                                3. Licencia de Uso Temporal
                            </h2>
                            <p className="text-muted-foreground mt-4 leading-relaxed">
                                Durante el período en que estés autorizado a usar los Servicios, y sujeto a tu cumplimiento con
                                los términos de este Acuerdo, se te concede una licencia personal, no sublicenciable, no exclusiva,
                                no transferible y limitada para usar los Servicios para tus propósitos comerciales internos o
                                personales según la capacidad de servicio de tu cuenta.
                            </p>
                            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 mt-4">
                                <p className="text-sm font-medium">
                                    Cualquier derecho no expresamente otorgado aquí está reservado. No se otorga ninguna licencia
                                    o derecho de usar ninguna marca comercial de Seencel o de terceros en conexión con los Servicios.
                                </p>
                            </div>
                        </section>

                        {/* 4. Tu Contenido */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <Database className="h-6 w-6 text-primary" />
                                4. Tu Contenido
                            </h2>
                            <p className="text-muted-foreground mt-4 leading-relaxed">
                                Eres el único responsable de todo el contenido que subas a los Servicios ("Tu Contenido"),
                                incluyendo pero no limitado a:
                            </p>
                            <ul className="grid sm:grid-cols-2 gap-2 list-none pl-0 mt-4">
                                {[
                                    "Datos de proyectos y tareas",
                                    "Información financiera y presupuestos",
                                    "Registros de materiales y proveedores",
                                    "Datos de contactos y clientes",
                                    "Documentos y archivos adjuntos",
                                    "Registros de mano de obra",
                                    "Contratos y subcontratos",
                                    "Comunicaciones del equipo"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-muted-foreground mt-6">
                                Al publicar Tu Contenido en los Servicios, otorgas a Seencel una licencia mundial, no exclusiva,
                                libre de regalías, para usar, copiar, modificar, reproducir, almacenar y procesar Tu Contenido
                                <strong> únicamente según sea necesario para proporcionar los Servicios</strong> y para proteger
                                los Servicios contra fraude, malware y amenazas de seguridad.
                            </p>
                        </section>

                        {/* 5. Planes */}
                        <section className="bg-card border rounded-xl p-8 space-y-6">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <CreditCard className="h-6 w-6 text-primary" />
                                5. Planes y Suscripciones
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-background p-4 rounded-lg border">
                                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-green-500" />
                                        Plan Gratuito
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Ofrecemos un plan gratuito a nuestra sola discreción. Podemos cambiar las condiciones
                                        o descontinuar el plan gratuito en cualquier momento. Nos reservamos el derecho de
                                        deshabilitar o eliminar cualquier proyecto en el plan gratuito con o sin previo aviso.
                                    </p>
                                </div>
                                <div className="bg-background p-4 rounded-lg border">
                                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-primary" />
                                        Planes de Pago
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Las suscripciones de pago se renuevan automáticamente por períodos sucesivos iguales
                                        al período inicial, a menos que canceles antes de la fecha de renovación.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                                    <strong>Política de Reembolsos:</strong> Todas las tarifas no son reembolsables,
                                    excepto como se indique expresamente en este Acuerdo.
                                </p>
                            </div>
                        </section>

                        {/* 6. Uso Aceptable */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <AlertCircle className="h-6 w-6 text-primary" />
                                6. Uso Aceptable
                            </h2>
                            <p className="text-muted-foreground mt-4">
                                Tu uso de los Servicios debe cumplir con nuestras políticas de uso aceptable.
                                Te comprometes a <strong>no</strong> utilizar los Servicios para:
                            </p>
                            <ul className="list-disc pl-5 mt-4 space-y-2 text-muted-foreground">
                                <li>Actividades ilegales, fraudulentas o engañosas</li>
                                <li>Infringir derechos de propiedad intelectual de terceros</li>
                                <li>Transmitir malware, virus o código malicioso</li>
                                <li>Acosar, amenazar o intimidar a otros usuarios</li>
                                <li>Interferir con el funcionamiento normal de los Servicios</li>
                                <li>Intentar obtener acceso no autorizado a sistemas o datos</li>
                                <li>Recopilar datos de otros usuarios sin su consentimiento</li>
                                <li>Usar los Servicios para enviar spam o comunicaciones no solicitadas</li>
                            </ul>
                            <p className="text-muted-foreground mt-4">
                                Seencel puede monitorear el uso de los Servicios utilizando herramientas que detectan
                                patrones de abuso, y puede prohibir cualquier uso que considere violatorio de estas políticas.
                            </p>
                        </section>

                        {/* 7. Academia */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <BookOpen className="h-6 w-6 text-primary" />
                                7. Academia y Cursos
                            </h2>
                            <p className="text-muted-foreground mt-4 leading-relaxed">
                                Seencel puede ofrecer cursos educativos y contenido de capacitación a través de la
                                Academia Seencel ("Cursos"). Al adquirir acceso a un Curso:
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 mt-6">
                                <div className="bg-muted/40 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-sm mb-2">Acceso y Duración</h4>
                                    <p className="text-xs text-muted-foreground">
                                        El acceso a los Cursos está sujeto a la duración especificada al momento de la compra.
                                        El acceso puede ser limitado en tiempo según el tipo de curso adquirido.
                                    </p>
                                </div>
                                <div className="bg-muted/40 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-sm mb-2">Propiedad Intelectual</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Todo el contenido de los Cursos es propiedad de Seencel. No puedes copiar, distribuir,
                                        modificar o crear obras derivadas del contenido sin autorización.
                                    </p>
                                </div>
                            </div>
                            <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4">
                                <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                                    <strong>Sin Reembolsos:</strong> Las compras de Cursos no son reembolsables una vez
                                    que se haya otorgado acceso al contenido del curso.
                                </p>
                            </div>
                        </section>

                        {/* 8. Seguridad */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <Shield className="h-6 w-6 text-primary" />
                                8. Seguridad y Cumplimiento
                            </h2>
                            <p className="text-muted-foreground mt-4">
                                Debes configurar Tu Contenido de manera que la transmisión, almacenamiento o uso no exponga
                                datos personales sin el consentimiento apropiado según la ley aplicable.
                            </p>
                            <ul className="list-disc pl-5 mt-4 space-y-2 text-muted-foreground">
                                <li>Seencel implementa copias de seguridad regulares, pero también debes mantener tus propias copias de seguridad</li>
                                <li>Si identificas cualquier incidente de seguridad real o sospechado, debes reportarlo inmediatamente a contacto@seencel.com</li>
                                <li>Seencel no será responsable por accesos no autorizados atribuibles a configuraciones incorrectas de tu parte</li>
                            </ul>
                        </section>

                        {/* 9. Protección de Datos */}
                        <section className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-8">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-blue-900 dark:text-blue-100 mb-6">
                                <Lock className="h-6 w-6" />
                                9. Protección de Datos
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Ubicación de los Datos</h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        Tus datos son almacenados en servidores seguros ubicados en <strong>AWS sa-east-1 (São Paulo, Brasil)</strong>,
                                        proporcionando baja latencia para usuarios en América del Sur.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Uso de Tus Datos</h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        Conservas todos los derechos sobre Tus Datos. Seencel puede usar y divulgar Tus Datos
                                        únicamente en la medida necesaria para proporcionar los Servicios y para seguridad.
                                        <strong> No venderemos, divulgaremos ni compartiremos Tus Datos con terceros</strong> para
                                        otros propósitos.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Datos Agregados</h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        Seencel puede recopilar y analizar datos anónimos y agregados relacionados con el uso
                                        y rendimiento de los Servicios para mejorar nuestros productos y servicios.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 10. Restricciones */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <AlertTriangle className="h-6 w-6 text-primary" />
                                10. Restricciones de Uso
                            </h2>
                            <p className="text-muted-foreground mt-4">
                                No podrás, directa o indirectamente:
                            </p>
                            <ul className="list-disc pl-5 mt-4 space-y-2 text-muted-foreground">
                                <li>Sublicenciar, revender, alquilar, arrendar, transferir o explotar comercialmente los Servicios a terceros</li>
                                <li>Realizar ingeniería inversa, descompilar o intentar descubrir el código fuente de los Servicios</li>
                                <li>Modificar o crear obras derivadas basadas en los Servicios</li>
                                <li>Eliminar o alterar avisos de derechos de propiedad de Seencel</li>
                                <li>Violar cualquier ley o regulación aplicable en conexión con el uso de los Servicios</li>
                                <li>Usar los Servicios para beneficio de terceros sin autorización</li>
                            </ul>
                        </section>

                        {/* 11. Soporte */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <HelpCircle className="h-6 w-6 text-primary" />
                                11. Soporte
                            </h2>
                            <p className="text-muted-foreground mt-4">
                                Sujeto a los términos de este Acuerdo, Seencel puede proporcionar servicios de soporte técnico
                                remoto comercialmente razonables durante el horario comercial normal. El nivel de soporte puede
                                variar según el plan de suscripción.
                            </p>
                        </section>

                        {/* 12. Comunicaciones */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <Mail className="h-6 w-6 text-primary" />
                                12. Comunicaciones Electrónicas
                            </h2>
                            <p className="text-muted-foreground mt-4">
                                Al usar los Servicios, consientes recibir comunicaciones electrónicas de Seencel. Estas pueden incluir:
                            </p>
                            <ul className="list-disc pl-5 mt-4 space-y-2 text-muted-foreground">
                                <li>Avisos sobre tarifas y cargos aplicables</li>
                                <li>Información transaccional relacionada con los Servicios</li>
                                <li>Notificaciones sobre actualizaciones de los Servicios</li>
                                <li>Alertas que requieren respuesta o acción</li>
                            </ul>
                            <p className="text-muted-foreground mt-4">
                                Tu dirección de correo electrónico debe mantenerse actualizada y con un usuario activo en todo momento.
                            </p>
                        </section>

                        {/* 13. Garantías */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <CheckCircle2 className="h-6 w-6 text-primary" />
                                13. Declaraciones y Garantías
                            </h2>
                            <p className="text-muted-foreground mt-4">
                                Declaras y garantizas que:
                            </p>
                            <ul className="list-disc pl-5 mt-4 space-y-2 text-muted-foreground">
                                <li>Eres propietario de Tu Contenido o has obtenido todos los permisos necesarios</li>
                                <li>Tu Contenido no viola derechos de propiedad intelectual de terceros</li>
                                <li>Tu Contenido no es difamatorio, obsceno, ilegal, amenazante u ofensivo</li>
                                <li>Usarás los Servicios únicamente en cumplimiento con las leyes aplicables</li>
                            </ul>
                        </section>

                        {/* 14. Indemnización */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <Scale className="h-6 w-6 text-primary" />
                                14. Indemnización
                            </h2>
                            <p className="text-muted-foreground mt-4">
                                Indemnizarás y mantendrás indemne a Seencel contra cualquier reclamo, acción o demanda,
                                incluyendo honorarios legales razonables, que surjan de:
                            </p>
                            <ul className="list-disc pl-5 mt-4 space-y-2 text-muted-foreground">
                                <li>Tu incumplimiento de este Acuerdo</li>
                                <li>Cualquier reclamo de infracción relacionado con Tu Contenido</li>
                                <li>Tu acceso, uso o mal uso de los Servicios</li>
                            </ul>
                        </section>

                        {/* 15. Confidencialidad */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <Lock className="h-6 w-6 text-primary" />
                                15. Confidencialidad y Propiedad Intelectual
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6 mt-6">
                                <div className="bg-muted/40 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-sm mb-2">Propiedad de Seencel</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Seencel conserva todos los derechos sobre los Servicios, incluyendo mejoras,
                                        modificaciones y toda la propiedad intelectual relacionada.
                                    </p>
                                </div>
                                <div className="bg-muted/40 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-sm mb-2">Retroalimentación</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Cualquier sugerencia que proporciones sobre los Servicios puede ser utilizada
                                        por Seencel sin compensación ni obligación hacia ti.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 16. Pagos */}
                        <section className="bg-card border rounded-xl p-8 space-y-6">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <CreditCard className="h-6 w-6 text-primary" />
                                16. Pagos
                            </h2>
                            <p className="text-muted-foreground">
                                Los pagos se procesan a través de proveedores de pago seguros (MercadoPago, PayPal)
                                en la moneda especificada al momento de la compra.
                            </p>
                            <ul className="space-y-2">
                                {[
                                    "Serás cobrado automáticamente según el ciclo de facturación seleccionado",
                                    "Declaras que toda la información de pago proporcionada es verdadera y precisa",
                                    "Debes actualizar tu información de pago si hay cambios",
                                    "Si el pago no puede procesarse, podemos suspender o terminar tu acceso",
                                    "Seencel puede cambiar precios con previo aviso; los cambios aplican en el siguiente período"
                                ].map((item, i) => (
                                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* 17. Terminación */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <RefreshCw className="h-6 w-6 text-primary" />
                                17. Vigencia y Terminación
                            </h2>
                            <p className="text-muted-foreground mt-4">
                                Este Acuerdo entrará en vigor al aceptarlo y continuará mientras uses los Servicios.
                            </p>
                            <div className="grid md:grid-cols-2 gap-6 mt-6">
                                <div className="bg-muted/40 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-sm mb-2">Terminación por Tu Parte</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Puedes cancelar tu cuenta en cualquier momento desde la configuración de tu perfil
                                        o contactando a soporte. La cancelación será efectiva al inicio del siguiente período.
                                    </p>
                                </div>
                                <div className="bg-muted/40 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-sm mb-2">Terminación por Seencel</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Podemos terminar o suspender tu cuenta inmediatamente si incumples este Acuerdo,
                                        con 10 días de aviso para incumplimientos subsanables (2 días para falta de pago).
                                    </p>
                                </div>
                            </div>
                            <p className="text-muted-foreground mt-4">
                                <strong>Efecto de la Terminación:</strong> Todo Tu Contenido puede ser eliminado permanentemente
                                tras la terminación de tu cuenta. Debes exportar tus datos antes de cancelar.
                            </p>
                        </section>

                        {/* 18. Limitación de Responsabilidad */}
                        <section className="bg-zinc-950 text-zinc-50 rounded-2xl p-8 shadow-xl">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight mb-6">
                                <Scale className="h-6 w-6 text-amber-400" />
                                18. Exención de Garantías y Limitación de Responsabilidad
                            </h2>
                            <div className="space-y-6">
                                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                                    <p className="text-sm text-zinc-300 uppercase tracking-wide font-medium">
                                        LOS SERVICIOS SE PROPORCIONAN "TAL CUAL" Y SEENCEL RENUNCIA A TODAS LAS GARANTÍAS,
                                        EXPRESAS O IMPLÍCITAS, INCLUYENDO GARANTÍAS DE COMERCIABILIDAD, IDONEIDAD PARA UN
                                        PROPÓSITO PARTICULAR Y NO INFRACCIÓN.
                                    </p>
                                </div>
                                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                                    <p className="text-sm text-zinc-300 uppercase tracking-wide font-medium">
                                        SEENCEL NO SERÁ RESPONSABLE POR DAÑOS INDIRECTOS, ESPECIALES, INCIDENTALES,
                                        CONSECUENTES O PUNITIVOS, NI POR PÉRDIDA DE DATOS, BENEFICIOS O INGRESOS.
                                    </p>
                                </div>
                                <p className="text-xs text-zinc-500 italic border-t border-zinc-800 pt-4">
                                    Las limitaciones anteriores aplican en la máxima medida permitida por la ley aplicable.
                                    Algunas jurisdicciones no permiten la exclusión de ciertas garantías, por lo que algunas
                                    limitaciones pueden no aplicar en tu caso.
                                </p>
                            </div>
                        </section>

                        {/* 19. Ley Aplicable */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <Globe className="h-6 w-6 text-primary" />
                                19. Ley Aplicable y Resolución de Disputas
                            </h2>
                            <p className="text-muted-foreground mt-4">
                                Este Acuerdo se regirá e interpretará de acuerdo con las leyes aplicables internacionalmente
                                reconocidas, sin referencia a principios de conflicto de leyes.
                            </p>
                            <div className="bg-muted/40 p-4 rounded-lg border mt-4">
                                <h4 className="font-semibold text-sm mb-2">Resolución de Disputas</h4>
                                <p className="text-sm text-muted-foreground">
                                    Cualquier disputa que surja de o en relación con este Acuerdo será resuelta primero
                                    mediante negociación de buena fe entre las partes. Si la disputa no puede resolverse
                                    mediante negociación dentro de los 30 días, cualquiera de las partes puede iniciar
                                    procedimientos legales en los tribunales competentes.
                                </p>
                            </div>
                        </section>

                        {/* 20. Disposiciones Generales */}
                        <section className="prose dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                                <Gavel className="h-6 w-6 text-primary" />
                                20. Disposiciones Generales
                            </h2>
                            <ul className="list-disc pl-5 mt-4 space-y-2 text-muted-foreground">
                                <li><strong>Modificaciones:</strong> Seencel puede modificar este Acuerdo notificándote por correo electrónico o mediante un aviso en el sitio web</li>
                                <li><strong>Divisibilidad:</strong> Si alguna disposición es inválida, las demás permanecerán en vigor</li>
                                <li><strong>Cesión:</strong> No puedes ceder este Acuerdo sin el consentimiento previo de Seencel</li>
                                <li><strong>Acuerdo Completo:</strong> Este Acuerdo constituye el entendimiento completo entre las partes</li>
                                <li><strong>Renuncia:</strong> La falta de ejercicio de cualquier derecho no constituye una renuncia al mismo</li>
                                <li><strong>Fuerza Mayor:</strong> Seencel no será responsable por demoras causadas por eventos fuera de su control razonable</li>
                            </ul>
                        </section>

                        {/* Contacto */}
                        <div className="bg-primary/5 rounded-2xl p-8 md:p-12 text-center border border-primary/10 space-y-6">
                            <h2 className="text-2xl font-bold tracking-tight">¿Tienes Preguntas?</h2>
                            <p className="text-muted-foreground max-w-lg mx-auto">
                                Si tienes preguntas sobre estos Términos de Servicio, no dudes en contactarnos.
                            </p>
                            <div className="flex justify-center">
                                <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20" asChild>
                                    <a href="mailto:contacto@seencel.com">
                                        <Mail className="mr-2 h-4 w-4" />
                                        contacto@seencel.com
                                    </a>
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Responderemos a tu consulta en un plazo de 48 horas hábiles.
                            </p>
                        </div>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
