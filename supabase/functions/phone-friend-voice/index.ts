import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function getAIResponse(question: string, answerA: string, answerB: string, answerC: string, answerD: string, correctAnswer: string): Promise<string> {
  const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  
  if (!anthropicApiKey && !openaiApiKey) {
    return "Ho ho ho! Well now, let me check my list here. I'm thinking it might be one of the middle options, my dear friend!";
  }

  const prompt = `You are Santa Claus being called during a game show "Who Wants to Be a Christmasaire". The contestant has called you for help with this question:

Question: ${question}
A) ${answerA}
B) ${answerB}
C) ${answerC}
D) ${answerD}

The correct answer is ${correctAnswer}.

Respond as Santa Claus - jovial, warm, and festive. Start with "Ho ho ho!" or a Christmas greeting. Think out loud in Santa's character, show some reasoning, maybe express gentle uncertainty, then lean toward the correct answer. Keep it under 50 words, sound natural and jolly. Don't use any special formatting or markdown. Be encouraging and add Christmas spirit!`;

  try {
    if (openaiApiKey) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{
            role: "user",
            content: prompt,
          }],
          max_tokens: 150,
        }),
      });
      const data = await response.json();
      return data.choices[0].message.content;
    } else {
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
    }
  } catch (error) {
    console.error("AI Error:", error);
    return `Ho ho ho! Let me think about this one. Looking at my list, I'm quite confident the answer is ${correctAnswer}. Yes indeed, I'd go with ${correctAnswer}. Merry Christmas!`;
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
  <Say voice="Polly.Matthew" language="en-US">Ho ho ho! This is Santa, but I don't have any question information. Please try again, my dear!</Say>
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
  <Say voice="Polly.Matthew" language="en-US">${aiResponse.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c] || c))}</Say>
  <Pause length="1"/>
  <Say voice="Polly.Matthew" language="en-US">Good luck and Merry Christmas!</Say>
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
  <Say voice="Polly.Matthew" language="en-US">Ho ho ho! Sorry, I'm having trouble at the North Pole right now. Good luck with your answer!</Say>
  <Hangup/>
</Response>`;

    return new Response(errorTwiml, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/xml" },
    });
  }
});