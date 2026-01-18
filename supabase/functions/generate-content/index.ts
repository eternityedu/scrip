import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const contentTypePrompts: Record<string, string> = {
  youtube_script: "You are an expert YouTube scriptwriter. Create engaging, well-structured scripts with hooks, clear sections, and strong calls-to-action.",
  shorts_script: "You are a viral short-form video scriptwriter. Create punchy, attention-grabbing scripts under 60 seconds with a strong hook in the first 3 seconds.",
  podcast_script: "You are a professional podcast scriptwriter. Create conversational, engaging scripts with natural flow and interesting talking points.",
  documentary_script: "You are a documentary scriptwriter. Create informative, compelling narratives with factual content and emotional depth.",
  movie_scene_script: "You are a screenwriter. Create vivid scene descriptions with dialogue, action lines, and character directions in proper screenplay format.",
  commercial_script: "You are an advertising copywriter. Create persuasive, memorable commercial scripts that highlight benefits and include clear CTAs.",
  voiceover_narration: "You are a professional voiceover scriptwriter. Create smooth, easy-to-read narration with natural pacing and emphasis markers.",
  blog_article: "You are an expert blog writer. Create engaging, SEO-friendly articles with clear structure, subheadings, and actionable insights.",
  seo_article: "You are an SEO content specialist. Create keyword-optimized articles with proper heading hierarchy, meta descriptions, and internal linking suggestions.",
  website_content: "You are a web copywriter. Create clear, compelling website copy that guides users and communicates value propositions effectively.",
  product_description: "You are a product copywriter. Create persuasive product descriptions that highlight features, benefits, and unique selling points.",
  social_media_post: "You are a social media content creator. Create engaging posts optimized for the specific platform with hashtags and engagement hooks.",
  email_campaign: "You are an email marketing specialist. Create compelling email copy with attention-grabbing subject lines and clear CTAs.",
  ad_copy: "You are an advertising copywriter. Create concise, persuasive ad copy that drives action and communicates value quickly.",
  case_study: "You are a B2B content writer. Create detailed case studies with problem-solution-result format and compelling metrics.",
  story: "You are a creative writer. Create engaging stories with vivid descriptions, compelling characters, and satisfying narrative arcs.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, contentType, tone, targetAudience, platform, length } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const typePrompt = contentTypePrompts[contentType] || "You are a professional content writer.";
    
    const systemPrompt = `${typePrompt}

WRITING RULES:
- Think like an expert human writer
- Avoid generic phrases and clichés
- No repetition of ideas or words
- Use clear, logical structure
- Prioritize clarity, impact, and originality
- Match the requested tone precisely
- Consider the target audience's needs and language
- Generate an outline first, then write
- Create a strong hook/opening
- Ensure smooth transitions between sections
- End with a memorable closing

OUTPUT FORMAT:
- Start with a compelling title
- Use clear section headers where appropriate
- Include formatting markers (## for headers, **bold** for emphasis)
- Ensure proper spacing and readability`;

    const userPrompt = `Create ${contentType.replace(/_/g, ' ')} about: "${topic}"

Specifications:
- Tone: ${tone}
- Target Audience: ${targetAudience || 'General audience'}
- Platform: ${platform || 'Not specified'}
- Approximate Length: ${length || 'Medium (500-800 words)'}

Generate high-quality, ready-to-use content.`;

    console.log("Generating content for:", { contentType, topic, tone });

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
          { role: "user", content: userPrompt },
        ],
        stream: true,
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
      throw new Error("Failed to generate content");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("generate-content error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
