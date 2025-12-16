import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  phoneNumber: string;
  question: string;
  answerA: string;
  answerB: string;
  answerC: string;
  answerD: string;
  correctAnswer: string;
}

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
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      return new Response(
        JSON.stringify({ 
          error: "Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your Supabase dashboard.",
          setupInstructions: "Go to Supabase Dashboard > Project Settings > Edge Functions > Add the following secrets: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, ANTHROPIC_API_KEY"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body: RequestBody = await req.json();
    const { phoneNumber, question, answerA, answerB, answerC, answerD, correctAnswer } = body;

    const aiResponse = await getAIResponse(question, answerA, answerB, answerC, answerD, correctAnswer);

    const questionData = encodeURIComponent(JSON.stringify({
      question,
      answerA,
      answerB,
      answerC,
      answerD,
      correctAnswer,
      aiResponse,
    }));

    const voiceUrl = `${supabaseUrl}/functions/v1/phone-friend-voice?questionData=${questionData}`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Calls.json`;
    const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const formData = new URLSearchParams();
    formData.append("To", phoneNumber);
    formData.append("From", twilioPhoneNumber);
    formData.append("Url", voiceUrl);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      throw new Error(`Twilio error: ${JSON.stringify(twilioData)}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        callSid: twilioData.sid,
        status: twilioData.status,
        aiResponse: aiResponse
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});