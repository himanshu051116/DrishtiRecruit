type StructuredCall = {
  name: string;
  schema: Record<string, unknown>;
  instructions: string;
  input: string;
};

function outputText(payload: unknown): string {
  if (!payload || typeof payload !== "object") throw new Error("Invalid AI response payload");
  const response = payload as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  throw new Error("Structured AI response did not contain output text");
}

export function isOpenAIEnabled() {
  return process.env.AI_PROVIDER === "openai" && Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL);
}

/**
 * Optional production adapter. The default hackathon/local mode remains deterministic.
 * `store:false` is intentional because inputs can contain candidate personal data.
 */
export async function callOpenAIStructured<T>({ name, schema, instructions, input }: StructuredCall): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey || !model) throw new Error("OPENAI_API_KEY and OPENAI_MODEL are required when AI_PROVIDER=openai");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "authorization": `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      store: false,
      input: [
        { role: "developer", content: [{ type: "input_text", text: instructions }] },
        { role: "user", content: [{ type: "input_text", text: input }] },
      ],
      text: { format: { type: "json_schema", name, strict: true, schema } },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI provider error ${response.status}: ${detail.slice(0, 500)}`);
  }
  return JSON.parse(outputText(await response.json())) as T;
}
