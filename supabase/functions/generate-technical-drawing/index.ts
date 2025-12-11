import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DrawingRequest {
  drawingType: 'floor_plan' | 'elevation' | 'detail' | 'site_plan';
  roomArea: string;
  measurements: Record<string, number>;
  photos: Array<{ url: string; description: string }>;
  clientInfo: {
    mobilityAid?: string;
    wheelchairWidth?: number;
    wheelchairLength?: number;
    turningRadius?: number;
  };
  existingFeatures?: string;
  proposedModifications?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const requestData: DrawingRequest = await req.json();
    console.log("Generating technical drawing:", requestData.drawingType, "for", requestData.roomArea);

    const systemPrompt = `You are a technical drawing generator for home modification assessments in Australia. 
You create SVG technical drawings for NDIS submissions that comply with:
- National Construction Code (NCC)
- Livable Housing Design Standards (LHDS)
- AS 1428.1 (Design for access and mobility)

Generate clean, professional SVG drawings with:
1. Scale indicators (show scale ratio)
2. Dimension lines with measurements in mm
3. North arrow for floor plans
4. Clear labels for all elements
5. Compliance callouts (e.g., "850mm min clear width per AS 1428.1")
6. Hatching patterns for different materials
7. Symbols per Australian Standard conventions

IMPORTANT: Always use the calibrated measuring stick reference (25cm with 5cm alternating sections) if visible in photos for accurate scale.

Output ONLY valid SVG code. No markdown, no explanations. Just the raw <svg>...</svg> element.
Use a viewBox of "0 0 800 600" for consistent sizing.
Use semantic colors: #1a1a1a for lines, #f5f5f5 for backgrounds, #3b82f6 for dimensions, #ef4444 for non-compliant areas, #22c55e for compliant/proposed modifications.`;

    const userPrompt = buildUserPrompt(requestData);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let svgContent = data.choices?.[0]?.message?.content || "";
    
    // Clean up SVG content - extract just the SVG if wrapped in markdown
    svgContent = extractSvg(svgContent);
    
    console.log("Generated SVG length:", svgContent.length);

    return new Response(JSON.stringify({ 
      svg: svgContent,
      drawingType: requestData.drawingType,
      roomArea: requestData.roomArea
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating technical drawing:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Failed to generate drawing" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildUserPrompt(data: DrawingRequest): string {
  let prompt = `Generate a ${data.drawingType.replace('_', ' ')} technical drawing for: ${data.roomArea}\n\n`;

  if (data.measurements && Object.keys(data.measurements).length > 0) {
    prompt += "MEASUREMENTS:\n";
    for (const [key, value] of Object.entries(data.measurements)) {
      prompt += `- ${key}: ${value}mm\n`;
    }
    prompt += "\n";
  }

  if (data.clientInfo) {
    prompt += "CLIENT MOBILITY REQUIREMENTS:\n";
    if (data.clientInfo.mobilityAid) prompt += `- Primary mobility aid: ${data.clientInfo.mobilityAid}\n`;
    if (data.clientInfo.wheelchairWidth) prompt += `- Wheelchair width: ${data.clientInfo.wheelchairWidth}mm\n`;
    if (data.clientInfo.wheelchairLength) prompt += `- Wheelchair length: ${data.clientInfo.wheelchairLength}mm\n`;
    if (data.clientInfo.turningRadius) prompt += `- Turning radius required: ${data.clientInfo.turningRadius}mm\n`;
    prompt += "\n";
  }

  if (data.photos && data.photos.length > 0) {
    prompt += "PHOTO DESCRIPTIONS (for reference):\n";
    data.photos.forEach((photo, i) => {
      if (photo.description) {
        prompt += `${i + 1}. ${photo.description}\n`;
      }
    });
    prompt += "\n";
  }

  if (data.existingFeatures) {
    prompt += `EXISTING FEATURES:\n${data.existingFeatures}\n\n`;
  }

  if (data.proposedModifications) {
    prompt += `PROPOSED MODIFICATIONS:\n${data.proposedModifications}\n\n`;
  }

  prompt += `Include compliance callouts for AS 1428.1 and LHDS requirements relevant to ${data.roomArea}.`;

  return prompt;
}

function extractSvg(content: string): string {
  // Remove markdown code blocks if present
  let svg = content.replace(/```xml\n?/g, '').replace(/```svg\n?/g, '').replace(/```\n?/g, '');
  
  // Extract just the SVG element
  const svgMatch = svg.match(/<svg[\s\S]*<\/svg>/i);
  if (svgMatch) {
    return svgMatch[0];
  }
  
  // If no valid SVG found, return a placeholder
  return `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="600" fill="#f5f5f5"/>
    <text x="400" y="300" text-anchor="middle" fill="#666">Drawing generation in progress...</text>
  </svg>`;
}
