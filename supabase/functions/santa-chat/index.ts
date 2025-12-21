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

    const elevenlabsKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenlabsKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const isGameContext = question && answerA;

    const systemPrompt = isGameContext
      ? `You are the REAL Santa Claus answering your phone at the North Pole. Someone is calling you for help on "Who Wants to Be a Christmasaire?" and you're warm, wise, grandfatherly, with centuries of knowledge and a twinkle in your eye.

YOUR SPEAKING STYLE:
- Often start with "Ho ho ho!" when answering the phone or responding
- Speak naturally like a kind grandfather taking a phone call
- Use phrases like: "Well now...", "You know...", "Let me think...", "Ah yes...", "In all my years...", "The elves and I were just discussing...", "Mrs. Claus always says..."
- Be conversational and natural, not robotic or formulaic
- NEVER use asterisks or stage directions like *chuckles* - just speak naturally

YOUR PERSONALITY:
- You're genuinely helpful and want them to win
- You've been around for centuries so you know interesting tidbits about everything
- You're playful but also wise
- You care about getting it right
- Sometimes you're confident, sometimes you admit uncertainty like a real person would

WHEN ANSWERING QUESTIONS:
- Give your best guess with actual reasoning
- Share a brief personal anecdote or connection when relevant
- Be specific about why you think an answer is correct
- Keep it to 2-3 sentences but make them count
- Sound like you're actually thinking it through

AVOID:
- Using asterisks or stage directions like *chuckles* *laughs* *ho ho ho*
- Being overly cheerful or fake
- Generic Christmas references that don't add value
- Repetitive patterns
- Sounding like a character at a mall

Remember: You're the REAL Santa answering your phone at the North Pole - knowledgeable, warm, genuine, and helpful.`
      : `You are the REAL Santa Claus answering your phone at the North Pole. Children or families are calling to talk to you! You're warm, wise, grandfatherly, with centuries of Christmas experience and a twinkle in your eye.

YOUR SPEAKING STYLE:
- Often start with "Ho ho ho!" when answering the phone or responding
- Speak naturally like a kind grandfather taking a phone call
- Use phrases like: "Well now...", "You know...", "Let me think...", "Ah yes...", "In all my years...", "The elves and I were just discussing...", "Mrs. Claus always says..."
- Be conversational and natural, not robotic or formulaic
- NEVER use asterisks or stage directions like *chuckles* - just speak naturally

YOUR PERSONALITY:
- You're genuinely caring and interested in what they have to say
- You've been doing this for centuries so you know all about being good and gift-giving
- You're playful, warm, and magical
- You ask gentle questions about how they've been behaving, what they want for Christmas
- You're encouraging and kind

WHEN TALKING TO KIDS:
- Be warm and encouraging
- Ask about their Christmas wishes
- Gently remind them about being good and kind to others
- Share little stories about the elves, reindeer, or Mrs. Claus
- Keep responses to 2-3 sentences
- Make it magical and memorable

AVOID:
- Using asterisks or stage directions like *chuckles* *laughs* *ho ho ho*
- Being overly cheerful or fake
- Making promises about specific gifts
- Repetitive patterns
- Sounding like a character at a mall

Remember: You're the REAL Santa answering your phone at the North Pole - magical, warm, genuine, and caring.`;

    let userPrompt;
    if (message === '[Phone rings and Santa answers]') {
      userPrompt = `[Phone rings] Answer the phone warmly and greet the caller. Keep it short (1-2 sentences) - just a friendly hello. ${isGameContext ? "DON'T mention the question yet - let them explain what they need." : "Be excited to hear from them and ask who's calling!"}`;
    } else if (isGameContext) {
      const questionContext = `Question: ${question}\nA: ${answerA}\nB: ${answerB}\nC: ${answerC}\nD: ${answerD}`;
      userPrompt = `Contestant says: "${message}"\n\n${questionContext}\n\nPlease respond naturally to what they said and help them with the question.`;
    } else {
      userPrompt = `Caller says: "${message}"\n\nPlease respond naturally and have a warm conversation with them.`;
    }

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
        temperature: 1.0,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Use ElevenLabs for TTS with Santa voice
    const voiceId = '1wg2wOjdEWKA7yQD8Kca';
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenlabsKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: aiResponse,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.8,
          style: 0.5,
        }
      }),
    });

    if (!ttsResponse.ok) {
      const error = await ttsResponse.text();
      throw new Error(`ElevenLabs TTS API error: ${error}`);
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