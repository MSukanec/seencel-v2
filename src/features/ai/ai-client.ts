"use server";

import OpenAI from "openai";

// ============================================================================
// Singleton OpenAI Client
// ============================================================================

let client: OpenAI | null = null;

function getClient(): OpenAI {
    if (!client) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("OPENAI_API_KEY is not configured. Add it to .env.local");
        }
        client = new OpenAI({ apiKey });
    }
    return client;
}

// ============================================================================
// Core AI Functions
// ============================================================================

/**
 * Send a chat completion request to OpenAI.
 * This is the low-level building block — all AI features use this.
 */
export async function chatCompletion<T = string>({
    systemPrompt,
    userPrompt,
    model = "gpt-4o-mini",
    maxTokens = 4096,
    temperature = 0.1,
    responseFormat,
}: {
    systemPrompt: string;
    userPrompt: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    /** When set to 'json', forces JSON output */
    responseFormat?: "json" | "text";
}): Promise<{
    data: T;
    tokensUsed: { input: number; output: number; total: number };
    model: string;
}> {
    const openai = getClient();

    const response = await openai.chat.completions.create({
        model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature,
        ...(responseFormat === "json" ? { response_format: { type: "json_object" } } : {}),
    });

    const content = response.choices[0]?.message?.content ?? "";
    const usage = response.usage;

    // Parse JSON if requested
    let parsed: T;
    if (responseFormat === "json") {
        try {
            parsed = JSON.parse(content) as T;
        } catch {
            throw new Error(`AI returned invalid JSON: ${content.slice(0, 200)}`);
        }
    } else {
        parsed = content as T;
    }

    return {
        data: parsed,
        tokensUsed: {
            input: usage?.prompt_tokens ?? 0,
            output: usage?.completion_tokens ?? 0,
            total: usage?.total_tokens ?? 0,
        },
        model: response.model,
    };
}
