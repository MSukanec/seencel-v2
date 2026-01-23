"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Link2,
    Quote,
    Code,
    Undo,
    Redo
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface RichTextEditorProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    minHeight?: string;
    maxHeight?: string;
    className?: string;
    autoFocus?: boolean;
}

interface ToolbarButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
}

function ToolbarButton({ icon, label, onClick, active, disabled }: ToolbarButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-8 w-8 p-0",
                        active && "bg-muted text-foreground"
                    )}
                    onClick={onClick}
                    disabled={disabled}
                >
                    {icon}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    );
}

export function RichTextEditor({
    value = "",
    onChange,
    placeholder = "Escribe aquí...",
    disabled = false,
    minHeight = "120px",
    maxHeight = "400px",
    className,
    autoFocus = false,
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isEmpty, setIsEmpty] = useState(!value);

    // Initialize content
    useEffect(() => {
        if (editorRef.current && value) {
            editorRef.current.innerHTML = value;
            setIsEmpty(false);
        }
    }, []);

    const handleInput = useCallback(() => {
        if (editorRef.current && onChange) {
            const html = editorRef.current.innerHTML;
            const textContent = editorRef.current.textContent || "";
            setIsEmpty(textContent.trim() === "");
            onChange(html === "<br>" ? "" : html);
        }
    }, [onChange]);

    const execCommand = useCallback((command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleInput();
    }, [handleInput]);

    const handleBold = () => execCommand("bold");
    const handleItalic = () => execCommand("italic");
    const handleUnorderedList = () => execCommand("insertUnorderedList");
    const handleOrderedList = () => execCommand("insertOrderedList");
    const handleQuote = () => execCommand("formatBlock", "blockquote");
    const handleCode = () => {
        const selection = window.getSelection();
        if (selection && selection.toString()) {
            execCommand("insertHTML", `<code>${selection.toString()}</code>`);
        }
    };
    const handleUndo = () => execCommand("undo");
    const handleRedo = () => execCommand("redo");

    const handleLink = () => {
        const url = prompt("Ingresa la URL:");
        if (url) {
            execCommand("createLink", url);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Tab") {
            e.preventDefault();
            execCommand("insertHTML", "&nbsp;&nbsp;&nbsp;&nbsp;");
        }

        // Shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case "b":
                    e.preventDefault();
                    handleBold();
                    break;
                case "i":
                    e.preventDefault();
                    handleItalic();
                    break;
                case "k":
                    e.preventDefault();
                    handleLink();
                    break;
                case "z":
                    e.preventDefault();
                    if (e.shiftKey) {
                        handleRedo();
                    } else {
                        handleUndo();
                    }
                    break;
            }
        }
    };

    return (
        <div className={cn(
            "rounded-lg border bg-background transition-colors",
            isFocused && "ring-2 ring-ring ring-offset-2 ring-offset-background",
            disabled && "opacity-50 cursor-not-allowed",
            className
        )}>
            {/* Toolbar */}
            <TooltipProvider delayDuration={200}>
                <div className="flex items-center gap-0.5 px-2 py-1.5 border-b bg-muted/30">
                    <ToolbarButton
                        icon={<Bold className="h-4 w-4" />}
                        label="Negrita (Ctrl+B)"
                        onClick={handleBold}
                        disabled={disabled}
                    />
                    <ToolbarButton
                        icon={<Italic className="h-4 w-4" />}
                        label="Cursiva (Ctrl+I)"
                        onClick={handleItalic}
                        disabled={disabled}
                    />
                    <div className="w-px h-5 bg-border mx-1" />
                    <ToolbarButton
                        icon={<List className="h-4 w-4" />}
                        label="Lista"
                        onClick={handleUnorderedList}
                        disabled={disabled}
                    />
                    <ToolbarButton
                        icon={<ListOrdered className="h-4 w-4" />}
                        label="Lista numerada"
                        onClick={handleOrderedList}
                        disabled={disabled}
                    />
                    <div className="w-px h-5 bg-border mx-1" />
                    <ToolbarButton
                        icon={<Quote className="h-4 w-4" />}
                        label="Cita"
                        onClick={handleQuote}
                        disabled={disabled}
                    />
                    <ToolbarButton
                        icon={<Code className="h-4 w-4" />}
                        label="Código"
                        onClick={handleCode}
                        disabled={disabled}
                    />
                    <ToolbarButton
                        icon={<Link2 className="h-4 w-4" />}
                        label="Enlace (Ctrl+K)"
                        onClick={handleLink}
                        disabled={disabled}
                    />
                    <div className="flex-1" />
                    <ToolbarButton
                        icon={<Undo className="h-4 w-4" />}
                        label="Deshacer (Ctrl+Z)"
                        onClick={handleUndo}
                        disabled={disabled}
                    />
                    <ToolbarButton
                        icon={<Redo className="h-4 w-4" />}
                        label="Rehacer (Ctrl+Shift+Z)"
                        onClick={handleRedo}
                        disabled={disabled}
                    />
                </div>
            </TooltipProvider>

            {/* Editor */}
            <div className="relative">
                <div
                    ref={editorRef}
                    contentEditable={!disabled}
                    className={cn(
                        "px-3 py-2 outline-none overflow-y-auto",
                        "prose prose-sm dark:prose-invert max-w-none",
                        "prose-p:my-2 prose-ul:my-2 prose-ol:my-2",
                        "prose-blockquote:border-l-2 prose-blockquote:pl-4 prose-blockquote:italic",
                        "prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
                        "[&_a]:text-primary [&_a]:underline"
                    )}
                    style={{ minHeight, maxHeight }}
                    onInput={handleInput}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    autoFocus={autoFocus}
                    suppressContentEditableWarning
                />
                {isEmpty && !isFocused && (
                    <div
                        className="absolute top-2 left-3 text-muted-foreground pointer-events-none"
                    >
                        {placeholder}
                    </div>
                )}
            </div>
        </div>
    );
}

// Read-only renderer for displaying rich content
interface RichTextRendererProps {
    content: string | Record<string, unknown>;
    className?: string;
}

export function RichTextRenderer({ content, className }: RichTextRendererProps) {
    // Handle different content formats
    const getHtmlContent = (): string => {
        if (typeof content === "string") {
            return content;
        }

        const contentObj = content as Record<string, unknown>;

        // Try different possible field names
        if (contentObj.html && typeof contentObj.html === "string") {
            return contentObj.html;
        }

        if (contentObj.text && typeof contentObj.text === "string") {
            return contentObj.text;
        }

        if (contentObj.content && typeof contentObj.content === "string") {
            return contentObj.content;
        }

        // If it's a complex object (like TipTap JSON), return empty or handle specially
        if (contentObj.type === "doc" && contentObj.content) {
            // This is TipTap JSON format, would need a full parser
            return "<p><em>Contenido en formato no soportado</em></p>";
        }

        // Fallback: stringify but clean it up
        return "";
    };

    const htmlContent = getHtmlContent();

    return (
        <div
            className={cn(
                "prose prose-sm dark:prose-invert max-w-none",
                "prose-p:my-2 prose-ul:my-2 prose-ol:my-2",
                "prose-blockquote:border-l-2 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground",
                "prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
                "[&_a]:text-primary [&_a]:underline hover:[&_a]:opacity-80",
                "[&_img]:rounded-lg [&_img]:max-w-full",
                className
            )}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
}


