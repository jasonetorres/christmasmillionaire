import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { WebSocket as WSClient } from "npm:ws@8.18.0";

const OPENAI_REALTIME_MODEL = "gpt-4o-realtime-preview-2024-12-17";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.headers.get("upgrade") !== "websocket") {
      return new Response("Expected websocket connection", {
        status: 426,
        headers: corsHeaders
      });
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY not configured in edge function secrets");
      return new Response("OpenAI API key not configured. Please set OPENAI_API_KEY in your Supabase project secrets.", {
        status: 500,
        headers: corsHeaders
      });
    }

    console.log("Upgrading to WebSocket connection");
    const { socket: clientWs, response } = Deno.upgradeWebSocket(req);
    let openaiWs: any = null;
    let sessionConfigured = false;

    clientWs.onopen = async () => {
      console.log("Client WebSocket connected");

      try {
        const openaiUrl = `wss://api.openai.com/v1/realtime?model=${OPENAI_REALTIME_MODEL}`;

        openaiWs = new WSClient(openaiUrl, {
          headers: {
            "Authorization": `Bearer ${openaiApiKey}`,
            "OpenAI-Beta": "realtime=v1"
          }
        });

        openaiWs.on('open', () => {
          console.log("OpenAI WebSocket connected");
        });

        openaiWs.on('message', (data: any) => {
          try {
            const message = JSON.parse(data.toString());

            if (message.type === "session.created") {
              console.log("Session created");
            } else if (message.type === "session.updated") {
              console.log("Session updated");
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: "session.ready" }));
              }
            } else if (message.type === "response.audio.delta" && message.delta) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({
                  type: "audio.delta",
                  audio: message.delta
                }));
              }
            } else if (message.type === "response.audio_transcript.done") {
              console.log("OpenAI transcript:", message.transcript);
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({
                  type: "transcript",
                  text: message.transcript
                }));
              }
            } else if (message.type === "input_audio_buffer.speech_started") {
              console.log("User started speaking");
            } else if (message.type === "input_audio_buffer.speech_stopped") {
              console.log("User stopped speaking");
            } else if (message.type === "response.done") {
              console.log("Response completed");
            } else if (message.type === "error") {
              console.error("OpenAI error:", message);
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({
                  type: "error",
                  message: message.error?.message || "OpenAI error occurred"
                }));
              }
            }
          } catch (error) {
            console.error("Error processing OpenAI message:", error);
          }
        });

        openaiWs.on('error', (error: any) => {
          console.error("OpenAI WebSocket error:", error);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              type: "error",
              message: "Failed to connect to OpenAI. Please verify your API key has access to the Realtime API."
            }));
            clientWs.close(1011, "OpenAI connection failed");
          }
        });

        openaiWs.on('close', (code: number, reason: string) => {
          console.log("OpenAI WebSocket closed. Code:", code, "Reason:", reason);
          if (code !== 1000) {
            console.error("OpenAI closed with error. Code:", code);
          }
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close();
          }
        });
      } catch (error) {
        console.error("Error creating OpenAI WebSocket:", error);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: "error",
            message: `Failed to connect to OpenAI: ${error.message}`
          }));
          clientWs.close(1011, "Failed to connect to OpenAI");
        }
      }
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

          if (openaiWs && openaiWs.readyState === 1) {
            openaiWs.send(JSON.stringify(sessionUpdate));
            console.log("Session configured with Santa persona");
          } else {
            console.error("OpenAI WebSocket not ready for session config");
          }
        } else if (message.type === "audio.input" && openaiWs && openaiWs.readyState === 1) {
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
      if (openaiWs && openaiWs.readyState === 1) {
        openaiWs.close();
      }
    };

    return response;
  } catch (error) {
    console.error("Error in voice-chat function:", error);
    return new Response(JSON.stringify({ error: "Internal server error", details: String(error) }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
