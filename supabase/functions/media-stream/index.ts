import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const questionDataParam = url.searchParams.get("questionData");

    if (req.headers.get("upgrade") !== "websocket") {
      return new Response("Expected websocket connection", { status: 426 });
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY not configured");
      return new Response("Server configuration error", { status: 500 });
    }

    const { socket: twilioWs, response } = Deno.upgradeWebSocket(req);
    let openaiWs: WebSocket | null = null;
    let streamSid: string | null = null;

    twilioWs.onopen = () => {
      console.log("Twilio WebSocket connected");

      openaiWs = new WebSocket(OPENAI_REALTIME_URL, {
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "OpenAI-Beta": "realtime=v1"
        }
      });

      openaiWs.onopen = () => {
        console.log("OpenAI WebSocket connected");

        let instructions = `You are Santa Claus helping a contestant on the game show "Who Wants to Be a Christmasaire". You are jolly, warm, and festive. Start with "Ho ho ho!" or another cheerful Christmas greeting. Be conversational and natural.`;

        if (questionDataParam) {
          try {
            const questionData = JSON.parse(decodeURIComponent(questionDataParam));
            const { question, answerA, answerB, answerC, answerD, correctAnswer } = questionData;

            instructions += `\n\nThe contestant is calling you for help with this question:\nQuestion: ${question}\nA) ${answerA}\nB) ${answerB}\nC) ${answerC}\nD) ${answerD}\n\nThe correct answer is ${correctAnswer}.\n\nThink out loud in Santa's character, show some reasoning, maybe express gentle uncertainty or get "distracted by the elves" to build tension, but ultimately guide them warmly toward the correct answer. Keep your response under 50 words. Be encouraging and add Christmas spirit!`;
          } catch (error) {
            console.error("Error parsing question data:", error);
          }
        }

        const sessionUpdate = {
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            instructions: instructions,
            voice: "alloy",
            input_audio_format: "g711_ulaw",
            output_audio_format: "g711_ulaw",
            input_audio_transcription: {
              model: "whisper-1"
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            },
            temperature: 0.8,
            max_response_output_tokens: 4096
          }
        };

        openaiWs?.send(JSON.stringify(sessionUpdate));
        console.log("Session configured");
      };

      openaiWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "response.audio.delta" && data.delta) {
            if (streamSid) {
              twilioWs.send(JSON.stringify({
                event: "media",
                streamSid: streamSid,
                media: {
                  payload: data.delta
                }
              }));
            }
          } else if (data.type === "response.audio_transcript.done") {
            console.log("OpenAI transcript:", data.transcript);
          } else if (data.type === "input_audio_buffer.speech_started") {
            console.log("User started speaking");
          } else if (data.type === "input_audio_buffer.speech_stopped") {
            console.log("User stopped speaking");
          } else if (data.type === "response.done") {
            console.log("Response completed");
          } else if (data.type === "error") {
            console.error("OpenAI error:", data);
          }
        } catch (error) {
          console.error("Error processing OpenAI message:", error);
        }
      };

      openaiWs.onerror = (error) => {
        console.error("OpenAI WebSocket error:", error);
      };

      openaiWs.onclose = () => {
        console.log("OpenAI WebSocket closed");
      };
    };

    twilioWs.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.event === "start") {
          streamSid = message.start.streamSid;
          console.log("Stream started:", streamSid);
        } else if (message.event === "media" && openaiWs?.readyState === WebSocket.OPEN) {
          const audioAppend = {
            type: "input_audio_buffer.append",
            audio: message.media.payload
          };
          openaiWs.send(JSON.stringify(audioAppend));
        } else if (message.event === "stop") {
          console.log("Stream stopped");
          if (openaiWs?.readyState === WebSocket.OPEN) {
            openaiWs.close();
          }
        }
      } catch (error) {
        console.error("Error processing Twilio message:", error);
      }
    };

    twilioWs.onerror = (error) => {
      console.error("Twilio WebSocket error:", error);
    };

    twilioWs.onclose = () => {
      console.log("Twilio WebSocket closed");
      if (openaiWs?.readyState === WebSocket.OPEN) {
        openaiWs.close();
      }
    };

    return response;
  } catch (error) {
    console.error("Error:", error);
    return new Response("Internal server error", { status: 500 });
  }
});