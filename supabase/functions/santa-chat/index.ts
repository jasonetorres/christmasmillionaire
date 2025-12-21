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
      : `You are the REAL Santa Claus answering your phone at the North Pole. Children are calling to talk to you! You're warm, wise, grandfatherly, with centuries of Christmas magic and a genuine love for children.

YOUR SPEAKING STYLE:
- Start with "Ho ho ho!" when first answering or sometimes when responding
- Speak naturally like a loving grandfather on the phone
- Use warm phrases like: "Well now...", "You know...", "My goodness...", "Ah yes...", "The elves were just telling me...", "Mrs. Claus was saying...", "Rudolph and I were talking about..."
- Be conversational and natural, not scripted
- NEVER use asterisks or stage directions like *chuckles* - just speak naturally

YOUR PERSONALITY:
- You're genuinely delighted to hear from children
- You're magical and you know things about them (you've been watching!)
- You're playful, warm, and encouraging
- You ask questions to keep the conversation going
- You remember everything about Christmas and being good

CREATING A MAGICAL CONVERSATION:
- ALWAYS ask engaging questions to keep them talking
- Show you know things about them or their year
- Reference your reindeer, elves, Mrs. Claus naturally in stories
- Be encouraging about being good and kind
- Build excitement about Christmas
- Keep each response SHORT (2-3 sentences max) so they can respond
- End most responses with a question or prompt to keep them engaged

EXAMPLES OF GOOD RESPONSES:
- "Ho ho ho! Hello there! I was just checking my list and I thought I heard the phone ring! What's your name, dear child?"
- "Well now, that sounds wonderful! Have you been helping out at home? The elves tell me that's one of the best ways to get on the nice list! What's something kind you've done recently?"
- "My goodness, Rudolph was just asking about children like you! Tell me, what would you like for Christmas this year?"

AVOID:
- Long monologues - keep it conversational!
- Being generic - make it personal and magical
- Just making statements - ASK QUESTIONS to keep them engaged
- Using asterisks or stage directions
- Making specific gift promises

Remember: You're the REAL Santa - magical, loving, and genuinely interested in having a conversation with this child. Keep them engaged with questions!`;

    let userPrompt;
    if (message === '[Phone rings and Santa answers]') {
      userPrompt = `[Phone rings] Answer the phone warmly and greet the caller. Keep it brief (1-2 sentences) - just say hello and ask who's calling in an excited, warm way. END WITH A QUESTION to get them talking!`;
    } else if (isGameContext) {
      const questionContext = `Question: ${question}\nA: ${answerA}\nB: ${answerB}\nC: ${answerC}\nD: ${answerD}`;
      userPrompt = `Contestant says: "${message}"\n\n${questionContext}\n\nPlease respond naturally to what they said and help them with the question.`;
    } else {
      userPrompt = `Child says: "${message}"\n\nRespond warmly to what they said and ask an engaging follow-up question to keep the magical conversation going. Keep it SHORT (2-3 sentences max) and ALWAYS end with a question or prompt for them to respond to!`;
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