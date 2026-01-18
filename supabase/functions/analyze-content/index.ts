import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!content || content.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Content must be at least 50 characters long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert content quality analyzer. Analyze the provided content and score it across multiple dimensions.

ANALYSIS PARAMETERS:
1. Clarity (0-10): How clear and understandable is the content?
2. Structure (0-10): Is the content well-organized with logical flow?
3. Engagement (0-10): How engaging and interesting is the content?
4. Grammar (0-10): How correct is the grammar, spelling, and punctuation?
5. Originality (0-10): How original and unique is the content?
6. Flow (0-10): How smooth are the transitions between ideas?
7. Audience Relevance (0-10): How well does it connect with the target audience?

Calculate an overall score as a weighted average.

You MUST respond using the analyze_content function.`;

    console.log("Analyzing content, length:", content.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this content:\n\n${content}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_content",
              description: "Return detailed quality analysis scores for the content",
              parameters: {
                type: "object",
                properties: {
                  overall_score: { type: "number", description: "Overall quality score 0-10" },
                  clarity_score: { type: "number", description: "Clarity score 0-10" },
                  structure_score: { type: "number", description: "Structure score 0-10" },
                  engagement_score: { type: "number", description: "Engagement score 0-10" },
                  grammar_score: { type: "number", description: "Grammar score 0-10" },
                  originality_score: { type: "number", description: "Originality score 0-10" },
                  flow_score: { type: "number", description: "Flow score 0-10" },
                  audience_relevance_score: { type: "number", description: "Audience relevance score 0-10" },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of 3-5 content strengths"
                  },
                  improvements: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of 3-5 specific improvement suggestions"
                  },
                  explanation: { type: "string", description: "Brief overall assessment (2-3 sentences)" }
                },
                required: ["overall_score", "clarity_score", "structure_score", "engagement_score", "grammar_score", "originality_score", "flow_score", "audience_relevance_score", "strengths", "improvements", "explanation"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_content" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to analyze content");
    }

    const data = await response.json();
    console.log("Analysis response:", JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("Invalid response from AI");
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-content error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
