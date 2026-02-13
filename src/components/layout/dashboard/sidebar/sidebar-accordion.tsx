"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavGroup, NavItem } from "@/hooks/use-sidebar-navigation";

interface SidebarAccordionGroupsProps {
    groups: NavGroup[];
    renderItem: (item: NavItem, idx: number) => React.ReactNode;
    isExpanded: boolean;
    activePath: string;
}

export function SidebarAccordionGroups({
    groups,
    renderItem,
    isExpanded,
    activePath,
}: SidebarAccordionGroupsProps) {
    // Single accordion open at a time
    const [openGroup, setOpenGroup] = React.useState<string>(() => {
        for (const group of groups) {
            if (group.standalone) continue;
            if (group.defaultOpen || group.items.some(item => activePath === item.href)) {
                return group.id;
            }
        }
        return "";
    });

    // Auto-open the group containing the active item on navigation
    React.useEffect(() => {
        for (const group of groups) {
            if (group.standalone) continue;
            if (group.items.some(item => activePath === item.href) && openGroup !== group.id) {
                setOpenGroup(group.id);
            }
        }
    }, [activePath, groups]);

    // Filter out empty groups
    const visibleGroups = groups.filter(g => g.items.length > 0);

    // When sidebar is collapsed, show all items flat (no accordion UI)
    if (!isExpanded) {
        let idx = 0;
        return (
            <>
                {visibleGroups.flatMap(group =>
                    group.items.map(item => renderItem(item, idx++))
                )}
            </>
        );
    }

    // When sidebar is expanded, show accordion groups as cards
    let idx = 0;
    return (
        <AccordionPrimitive.Root
            type="single"
            collapsible
            value={openGroup}
            onValueChange={setOpenGroup}
            className="flex flex-col gap-1.5"
        >
            {visibleGroups.map(group => {
                if (group.standalone) {
                    return group.items.map(item => (
                        <React.Fragment key={`s-${idx}`}>
                            {renderItem(item, idx++)}
                        </React.Fragment>
                    ));
                }

                const itemElements = group.items.map(item => renderItem(item, idx++));

                return (
                    <AccordionPrimitive.Item
                        key={group.id}
                        value={group.id}
                        className={cn(
                            "rounded-lg",
                            "bg-sidebar-accent/50",
                            "border border-sidebar-border/40",
                        )}
                        style={{
                            boxShadow: "0 1px 3px 0 rgba(0,0,0,0.12), inset 0 1px 0 0 rgba(255,255,255,0.06)",
                        }}
                    >
                        {/* Accordion trigger */}
                        <AccordionPrimitive.Header className="flex">
                            <AccordionPrimitive.Trigger
                                className={cn(
                                    "flex items-center justify-between w-full",
                                    "px-2.5 py-2 rounded-lg",
                                    "text-[12px] font-bold text-sidebar-foreground/70",
                                    "hover:text-sidebar-foreground/90 transition-all cursor-pointer",
                                    "[&[data-state=open]>svg]:rotate-180"
                                )}
                            >
                                <span>{group.label}</span>
                                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40 transition-transform duration-200" />
                            </AccordionPrimitive.Trigger>
                        </AccordionPrimitive.Header>

                        {/* Accordion content */}
                        <AccordionPrimitive.Content
                            className={cn(
                                "overflow-hidden",
                                "data-[state=closed]:animate-accordion-up",
                                "data-[state=open]:animate-accordion-down"
                            )}
                        >
                            <div className="flex flex-col gap-0.5 px-0.5 pb-1">
                                {itemElements}
                            </div>
                        </AccordionPrimitive.Content>
                    </AccordionPrimitive.Item>
                );
            })}
        </AccordionPrimitive.Root>
    );
}
