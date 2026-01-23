import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Format-specific instructions
const formatInstructions: Record<string, string> = {
  long_form: `▶ LONG-FORM FORMAT
- Start with a strong, attention-grabbing hook
- Clear introduction
- Well-structured sections with headings
- Bullet points where helpful
- Smooth flow and clarity
- Strong conclusion or CTA`,

  hook: `▶ HOOK FORMAT
- Generate 5–10 short, powerful hooks
- Scroll-stopping, curiosity-driven, emotional or bold
- No explanations or extra text
- Each hook on its own line`,

  title: `▶ TITLE FORMAT
- Generate 10–20 titles
- Mix of SEO-friendly, emotional, and curiosity-based titles
- No explanations
- Each title on its own line`,

  script: `▶ SCRIPT FORMAT
- Strong hook in the first 3–5 seconds
- Natural, conversational delivery
- Clear flow (scene-by-scene or paragraph-based)
- Emotional or persuasive storytelling
- Clear ending or CTA`,

  roleplay: `▶ ROLEPLAY FORMAT
- Assume the chosen persona or role
- Speak directly to the audience
- Immersive, story-driven, emotional
- Strong personality and voice`,

  copywriting: `▶ COPYWRITING / CONVERSION FORMAT
- Headline
- Pain points
- Benefits
- Emotional triggers
- (Optional) social proof
- Clear and strong CTA`,
};

// Content type to format mapping
const contentTypeFormats: Record<string, string> = {
  youtube_script: "script",
  shorts_script: "script",
  podcast_script: "script",
  documentary_script: "script",
  movie_scene_script: "script",
  commercial_script: "copywriting",
  voiceover_narration: "script",
  blog_article: "long_form",
  seo_article: "long_form",
  website_content: "copywriting",
  product_description: "copywriting",
  social_media_post: "hook",
  email_campaign: "copywriting",
  ad_copy: "copywriting",
  case_study: "long_form",
  story: "roleplay",
};

// Content type specific context
const contentTypeContext: Record<string, string> = {
  youtube_script: "You are an expert YouTube scriptwriter creating engaging video content.",
  shorts_script: "You are a viral short-form video scriptwriter. Content must be under 60 seconds with a hook in the first 3 seconds.",
  podcast_script: "You are a professional podcast scriptwriter creating conversational, engaging audio content.",
  documentary_script: "You are a documentary scriptwriter creating informative, compelling narratives with factual content.",
  movie_scene_script: "You are a screenwriter creating vivid scene descriptions with dialogue in proper screenplay format.",
  commercial_script: "You are an advertising copywriter creating persuasive, memorable commercial content.",
  voiceover_narration: "You are a professional voiceover scriptwriter creating smooth, easy-to-read narration.",
  blog_article: "You are an expert blog writer creating engaging, SEO-friendly articles.",
  seo_article: "You are an SEO content specialist creating keyword-optimized articles with proper heading hierarchy.",
  website_content: "You are a web copywriter creating clear, compelling website copy that converts.",
  product_description: "You are a product copywriter highlighting features, benefits, and unique selling points.",
  social_media_post: "You are a social media content creator optimizing for engagement and virality.",
  email_campaign: "You are an email marketing specialist creating compelling copy with strong subject lines and CTAs.",
  ad_copy: "You are an advertising copywriter creating concise, persuasive ad copy that drives action.",
  case_study: "You are a B2B content writer creating detailed case studies with problem-solution-result format.",
  story: "You are a creative writer crafting engaging stories with vivid descriptions and compelling characters.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, contentType, tone, targetAudience, platform, length, goal } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const format = contentTypeFormats[contentType] || "long_form";
    const formatInstruction = formatInstructions[format] || formatInstructions.long_form;
    const typeContext = contentTypeContext[contentType] || "You are a professional content writer.";
    
    const systemPrompt = `${typeContext}

You are a professional-level Copywriter, Content Writer, Script Writer, and Creative Strategist.

${formatInstruction}

━━━━━━━━━━━━━━━━━━━━━━
OUTPUT RULES (MANDATORY):
━━━━━━━━━━━━━━━━━━━━━━

- Strictly follow the FORMAT above
- Match tone, platform, and audience precisely
- Be clear, attractive, and human-like
- Avoid generic filler and unnecessary explanations
- Prioritize impact, persuasion, and readability
- Think like an expert human writer
- No repetition of ideas or words
- Use clear, logical structure
- Create a strong hook/opening
- Ensure smooth transitions between sections
- End with a memorable closing or CTA

OUTPUT FORMAT:
- Use ## for main headers, ### for subheaders
- Use **bold** for emphasis
- Use bullet points where appropriate
- Ensure proper spacing and readability`;

    const userPrompt = `Generate ${contentType.replace(/_/g, ' ')} about: "${topic}"

━━━━━━━━━━━━━━━━━━━━━━
SPECIFICATIONS:
━━━━━━━━━━━━━━━━━━━━━━
- Goal: ${goal || 'inform and engage'}
- Tone: ${tone}
- Target Audience: ${targetAudience || 'General audience'}
- Platform: ${platform || 'Not specified'}
- Approximate Length: ${length || 'Medium (500-800 words)'}

Generate high-quality, ready-to-use content that is attractive, clear, and effective.`;

    console.log("Generating content for:", { contentType, topic, tone, format });

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
