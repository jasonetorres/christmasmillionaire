import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";

Deno.serve(async (req: Request) => {
  try {
    if (req.headers.get("upgrade") !== "websocket") {
      return new Response("Expected websocket connection", { status: 426 });
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY not configured");
      return new Response("Server configuration error", { status: 500 });
    }

    const { socket: clientWs, response } = Deno.upgradeWebSocket(req);
    let openaiWs: WebSocket | null = null;
    let sessionConfigured = false;

    clientWs.onopen = () => {
      console.log("Client WebSocket connected");

      openaiWs = new WebSocket(OPENAI_REALTIME_URL, {
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "OpenAI-Beta": "realtime=v1"
        }
      });

      openaiWs.onopen = () => {
        console.log("OpenAI WebSocket connected");
      };

      openaiWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "session.created") {
            console.log("Session created");
          } else if (data.type === "session.updated") {
            console.log("Session updated");
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "session.ready" }));
            }
          } else if (data.type === "response.audio.delta" && data.delta) {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: "audio.delta",
                audio: data.delta
              }));
            }
          } else if (data.type === "response.audio_transcript.done") {
            console.log("OpenAI transcript:", data.transcript);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: "transcript",
                text: data.transcript
              }));
            }
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
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.close();
        }
      };
    };

    clientWs.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "session.config" && !sessionConfigured) {
          sessionConfigured = true;
          const questionData = message.questionData;

          let instructions = `You are Santa Claus helping a contestant on the game show "Who Wants to Be a Christmasaire". You are jolly, warm, and festive. Start with "Ho ho ho!" or another cheerful Christmas greeting. Be conversational and natural.`;

          if (questionData) {
            instructions += `\n\nThe contestant is calling you for help with this question:\nQuestion: ${questionData.question}\nA) ${questionData.answerA}\nB) ${questionData.answerB}\nC) ${questionData.answerC}\nD) ${questionData.answerD}\n\nThe correct answer is ${questionData.correctAnswer}.\n\nThink out loud in Santa's character, show some reasoning, maybe express gentle uncertainty or get "distracted by the elves" to build tension, but ultimately guide them warmly toward the correct answer. Keep your response concise. Be encouraging and add Christmas spirit!`;
          }

          const sessionUpdate = {
            type: "session.update",
            session: {
              modalities: ["text", "audio"],
              instructions: instructions,
              voice: "alloy",
              input_audio_format: "pcm16",
              output_audio_format: "pcm16",
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

          if (openaiWs?.readyState === WebSocket.OPEN) {
            openaiWs.send(JSON.stringify(sessionUpdate));
            console.log("Session configured with Santa persona");
          }
        } else if (message.type === "audio.input" && openaiWs?.readyState === WebSocket.OPEN) {
          const audioAppend = {
            type: "input_audio_buffer.append",
            audio: message.audio
          };
          openaiWs.send(JSON.stringify(audioAppend));
        }
      } catch (error) {
        console.error("Error processing client message:", error);
      }
    };

    clientWs.onerror = (error) => {
      console.error("Client WebSocket error:", error);
    };

    clientWs.onclose = () => {
      console.log("Client WebSocket closed");
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