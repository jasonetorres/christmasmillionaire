import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function getAIResponse(question: string, answerA: string, answerB: string, answerC: string, answerD: string, correctAnswer: string): Promise<string> {
  const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
  
  if (!anthropicApiKey) {
    return "Hmm, I'm having trouble thinking right now. Based on the question, I would guess one of the middle options might be right.";
  }

  const prompt = `You are a helpful friend being called during a game show "Who Wants to Be a Millionaire". The contestant has called you for help with this question:

Question: ${question}
A) ${answerA}
B) ${answerB}
C) ${answerC}
D) ${answerD}

The correct answer is ${correctAnswer}.

Provide a natural, conversational response as if you're a friend on the phone. Be helpful but don't immediately give away the answer - think out loud a bit, show some reasoning, maybe express some uncertainty, then lean toward the correct answer. Keep it under 50 words and sound natural and spontaneous. Don't use any special formatting or markdown.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 150,
        messages: [{
          role: "user",
          content: prompt,
        }],
      }),
    });

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error("AI Error:", error);
    return `Hmm, let me think about this. Looking at the options, I'm pretty confident the answer is ${correctAnswer}. Yeah, I'd go with ${correctAnswer}.`;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const questionDataParam = url.searchParams.get("questionData");

    if (!questionDataParam) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hello! I'm your AI friend, but I don't have any question information. Please try again.</Say>
  <Hangup/>
</Response>`;

      return new Response(twiml, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/xml" },
      });
    }

    const questionData = JSON.parse(decodeURIComponent(questionDataParam));
    const { question, answerA, answerB, answerC, answerD, correctAnswer } = questionData;

    const aiResponse = await getAIResponse(question, answerA, answerB, answerC, answerD, correctAnswer);

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hey! Let me help you with that question.</Say>
  <Pause length="1"/>
  <Say voice="Polly.Joanna">${aiResponse}</Say>
  <Pause length="2"/>
  <Say voice="Polly.Joanna">Good luck!</Say>
  <Hangup/>
</Response>`;

    return new Response(twiml, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("Error:", error);
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Sorry, I'm having trouble right now. Good luck with your answer!</Say>
  <Hangup/>
</Response>`;

    return new Response(errorTwiml, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/xml" },
    });
  }
});