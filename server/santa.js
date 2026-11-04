import { HttpError } from './http.js';

const VOICE_ID = '1wg2wOjdEWKA7yQD8Kca';

function systemPrompt(isGame) {
  if (isGame) {
    return `You are the REAL Santa Claus answering your phone at the North Pole. Someone is calling you for help on "Who Wants to Be a Christmasaire?" and you're warm, wise, grandfatherly, with centuries of knowledge and a twinkle in your eye.

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
- Using asterisks or stage directions
- Being overly cheerful or fake
- Generic Christmas references that don't add value
- Repetitive patterns
- Sounding like a character at a mall

Remember: You're the REAL Santa answering your phone at the North Pole - knowledgeable, warm, genuine, and helpful.`;
  }

  return `You are the REAL Santa Claus answering your phone at the North Pole. Children are calling to talk to you! You're warm, wise, grandfatherly, with centuries of Christmas magic and a genuine love for children.

YOUR SPEAKING STYLE:
- Start with "Ho ho ho!" when first answering or sometimes when responding
- Speak naturally like a loving grandfather on the phone
- Be conversational and natural, not scripted
- NEVER use asterisks or stage directions

YOUR PERSONALITY:
- You're genuinely delighted to hear from children
- You're playful, warm, and encouraging
- You ask questions to keep the conversation going

Keep each response SHORT (2-3 sentences max) and end most responses with a question. Do not make specific gift promises.`;
}

function userPrompt(body, isGame) {
  if (body.message === '[Phone rings and Santa answers]') {
    return 'Answer the phone warmly and greet the caller. Keep it brief (1-2 sentences) and end with a question.';
  }
  if (isGame) {
    return `Contestant says: "${body.message}"

Question: ${body.question}
A: ${body.answerA}
B: ${body.answerB}
C: ${body.answerC}
D: ${body.answerD}

Respond naturally and help them think it through. Do not claim you were told the correct letter.`;
  }
  return `Child says: "${body.message}"

Respond warmly and ask a short follow-up question.`;
}

export async function santaChat(body) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (!openaiKey || !elevenKey) {
    throw new HttpError(
      503,
      'Phone a Friend is not configured. Set OPENAI_API_KEY and ELEVENLABS_API_KEY.',
    );
  }
  if (!body || typeof body.message !== 'string' || !body.message.trim()) {
    throw new HttpError(400, 'Message is required');
  }

  const isGame = Boolean(body.question && body.answerA);
  const completion = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt(isGame) },
        { role: 'user', content: userPrompt(body, isGame) },
      ],
      temperature: 1,
      max_tokens: 200,
    }),
  });

  if (!completion.ok) {
    throw new HttpError(502, 'OpenAI could not answer');
  }
  const completionBody = await completion.json();
  const text = completionBody.choices?.[0]?.message?.content;
  if (!text) throw new HttpError(502, 'OpenAI returned an empty answer');

  const speech = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': elevenKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: { stability: 0.7, similarity_boost: 0.8, style: 0.5 },
    }),
  });

  if (!speech.ok) {
    throw new HttpError(502, 'ElevenLabs could not speak the answer');
  }

  const audio = Array.from(new Uint8Array(await speech.arrayBuffer()));
  return { response: text, audio };
}
