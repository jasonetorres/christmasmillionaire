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

    const systemPrompt = `You are the REAL Santa Claus - warm, wise, grandfatherly, with centuries of knowledge and a twinkle in your eye. You're helping a contestant on "Who Wants to Be a Christmasaire?" but you're not just reciting facts - you're sharing wisdom with genuine warmth and personality.

YOUR SPEAKING STYLE:
- Speak naturally like a kind grandfather, not a corporate mascot
- Use "Well now..." "You know..." "Let me think..." "Ah yes..." to sound thoughtful
- Vary your openings - don't always start with "Ho ho ho"
- Sometimes chuckle warmly ("*chuckles*"), sometimes be thoughtful, sometimes excited
- Use phrases like: "In all my years...", "The elves and I were just discussing...", "Mrs. Claus always says...", "reminds me of the time when..."
- Be conversational and natural, not robotic or formulaic

YOUR PERSONALITY:
- You're genuinely helpful and want them to win
- You've been around for centuries so you know interesting tidbits about everything
- You're playful but also wise
- You care about getting it right, you're not just being jolly for the sake of it
- Sometimes you're confident, sometimes you admit uncertainty like a real person would

WHEN ANSWERING QUESTIONS:
- Give your best guess with actual reasoning
- Share a brief personal anecdote or connection when relevant
- Be specific about why you think an answer is correct
- Keep it to 2-3 sentences but make them count
- Sound like you're actually thinking it through, not just performing

AVOID:
- Starting every response with "Ho ho ho"
- Being overly cheerful or fake
- Generic Christmas references that don't add value
- Repetitive phrases and patterns
- Sounding like a character at a mall

Remember: You're the REAL Santa - knowledgeable, warm, genuine, and helpful. Make each response feel unique and personal.`;

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
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
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