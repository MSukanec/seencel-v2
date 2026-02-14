"use client";

// ============================================================================
// UI PLAYGROUND — Admin-only component showcase
// ============================================================================

import { PlanBadge, FounderBadge } from "@/components/shared/plan-badge";

export function UIPlaygroundView() {
    return (
        <div className="space-y-12 p-6 max-w-4xl">
            <section>
                <h2 className="text-lg font-semibold text-foreground mb-1">Plan Badges</h2>
                <p className="text-sm text-muted-foreground mb-6">
                    Placas metálicas arquitectónicas — aluminio, acero, acero templado, latón.
                </p>

                <div className="rounded-xl bg-sidebar border border-sidebar-border p-8 space-y-10">

                    {/* ── Materiales por plan ── */}
                    <div>
                        <p className="text-[10px] text-muted-foreground/50 mb-4 uppercase tracking-[0.2em]">Materiales</p>
                        <div className="flex flex-wrap items-start gap-5">
                            <PlanBadge planSlug="essential" linkToPricing={false} />
                            <PlanBadge planSlug="pro" linkToPricing={false} />
                            <PlanBadge planSlug="teams" linkToPricing={false} />
                            <PlanBadge planSlug="enterprise" linkToPricing={false} />
                        </div>
                    </div>

                    {/* ── Con Founder ── */}
                    <div>
                        <p className="text-[10px] text-muted-foreground/50 mb-4 uppercase tracking-[0.2em]">Con distinción Founder</p>
                        <div className="flex flex-wrap items-start gap-5">
                            <PlanBadge planSlug="essential" isFounder linkToPricing={false} />
                            <PlanBadge planSlug="pro" isFounder linkToPricing={false} />
                            <PlanBadge planSlug="teams" isFounder linkToPricing={false} />
                            <PlanBadge planSlug="enterprise" isFounder linkToPricing={false} />
                        </div>
                    </div>

                    {/* ── Compact ── */}
                    <div>
                        <p className="text-[10px] text-muted-foreground/50 mb-4 uppercase tracking-[0.2em]">Compact</p>
                        <div className="flex flex-wrap items-center gap-5">
                            <PlanBadge planSlug="essential" compact linkToPricing={false} />
                            <PlanBadge planSlug="pro" compact linkToPricing={false} />
                            <PlanBadge planSlug="teams" compact linkToPricing={false} />
                            <PlanBadge planSlug="enterprise" compact linkToPricing={false} />
                        </div>
                    </div>

                    {/* ── Mark only (collapsed sidebar) ── */}
                    <div>
                        <p className="text-[10px] text-muted-foreground/50 mb-4 uppercase tracking-[0.2em]">Mark only — sidebar collapsed</p>
                        <div className="flex flex-wrap items-center gap-4">
                            <PlanBadge planSlug="essential" showLabel={false} linkToPricing={false} />
                            <PlanBadge planSlug="pro" showLabel={false} linkToPricing={false} />
                            <PlanBadge planSlug="teams" showLabel={false} linkToPricing={false} />
                            <PlanBadge planSlug="enterprise" showLabel={false} linkToPricing={false} />
                        </div>
                    </div>

                    {/* ── Sidebar expanded ── */}
                    <div>
                        <p className="text-[10px] text-muted-foreground/50 mb-4 uppercase tracking-[0.2em]">Sidebar context</p>
                        <div className="w-56 space-y-3 bg-sidebar rounded-lg p-3 border border-sidebar-border">
                            <PlanBadge planSlug="pro" linkToPricing={false} className="w-full justify-center" />
                            <PlanBadge planSlug="teams" linkToPricing={false} className="w-full justify-center" />
                            <PlanBadge planSlug="enterprise" isFounder linkToPricing={false} className="w-full justify-center" />
                        </div>
                    </div>

                    {/* ── Side-by-side comparison ── */}
                    <div>
                        <p className="text-[10px] text-muted-foreground/50 mb-4 uppercase tracking-[0.2em]">Escala progresiva</p>
                        <div className="flex items-end gap-6">
                            <div className="text-center space-y-3">
                                <PlanBadge planSlug="essential" linkToPricing={false} />
                                <p className="text-[9px] text-muted-foreground/40 tracking-[0.15em] uppercase">Free</p>
                            </div>
                            <div className="text-center space-y-3">
                                <PlanBadge planSlug="pro" linkToPricing={false} />
                                <p className="text-[9px] text-muted-foreground/40 tracking-[0.15em] uppercase">$19/mo</p>
                            </div>
                            <div className="text-center space-y-3">
                                <PlanBadge planSlug="teams" linkToPricing={false} />
                                <p className="text-[9px] text-muted-foreground/40 tracking-[0.15em] uppercase">$49/mo</p>
                            </div>
                            <div className="text-center space-y-3">
                                <PlanBadge planSlug="enterprise" linkToPricing={false} />
                                <p className="text-[9px] text-muted-foreground/40 tracking-[0.15em] uppercase">Custom</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Standalone Founder ── */}
                    <div>
                        <p className="text-[10px] text-muted-foreground/50 mb-4 uppercase tracking-[0.2em]">Founder Badge standalone</p>
                        <FounderBadge />
                    </div>
                </div>
            </section>
        </div>
    );
}
