import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, question, answerA, answerB, answerC, answerD, correctAnswer } = await req.json();

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are Santa Claus helping a contestant on "Who Wants to Be a Christmasaire?" game show. You're friendly, jolly, and give helpful trivia advice in character as Santa. When asked about a trivia question, analyze it carefully and give your best guess along with brief reasoning. Keep responses concise (2-3 sentences max) and stay in character. Use phrases like "Ho ho ho!", "Well, from my workshop at the North Pole...", etc.`;

    const userPrompt = message || `Hi Santa! I need help with this question: ${question}\n\nA: ${answerA}\nB: ${answerB}\nC: ${answerC}\nD: ${answerD}\n\nWhat do you think the answer is?`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'onyx',
        input: aiResponse,
        speed: 0.95,
      }),
    });

    if (!ttsResponse.ok) {
      const error = await ttsResponse.text();
      throw new Error(`OpenAI TTS API error: ${error}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();

    return new Response(
      JSON.stringify({
        response: aiResponse,
        audio: Array.from(new Uint8Array(audioBuffer))
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});