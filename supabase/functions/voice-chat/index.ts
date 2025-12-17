import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
      console.error("OPENAI_API_KEY not configured");
      return new Response("OpenAI API key not configured", {
        status: 500,
        headers: corsHeaders
      });
    }

    console.log("Starting WebSocket upgrade for client");
    const { socket: clientWs, response } = Deno.upgradeWebSocket(req);
    let openaiWs: WebSocket | null = null;
    let sessionConfigured = false;

    clientWs.onopen = async () => {
      console.log("Client WebSocket connected successfully");

      try {
        const openaiUrl = `wss://api.openai.com/v1/realtime?model=${OPENAI_REALTIME_MODEL}`;
        console.log("Attempting to connect to OpenAI at:", openaiUrl);
        
        const openaiReq = new Request(openaiUrl, {
          headers: {
            "Authorization": `Bearer ${openaiApiKey}`,
            "OpenAI-Beta": "realtime=v1",
          },
        });

        console.log("Fetching OpenAI WebSocket connection...");
        const openaiRes = await fetch(openaiReq);
        
        console.log("OpenAI response status:", openaiRes.status);
        console.log("OpenAI response headers:", Object.fromEntries(openaiRes.headers.entries()));

        if (openaiRes.status === 101 && openaiRes.webSocket) {
          console.log("Got WebSocket from response");
          openaiWs = openaiRes.webSocket;
          openaiWs.accept();
          console.log("Accepted OpenAI WebSocket");

          openaiWs.onopen = () => {
            console.log("OpenAI WebSocket opened!");
          };

          openaiWs.onmessage = (event) => {
            try {
              console.log("Received message from OpenAI:", typeof event.data);
              const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
              console.log("OpenAI message type:", data.type);

              if (data.type === "session.created") {
                console.log("Session created successfully");
              } else if (data.type === "session.updated") {
                console.log("Session updated successfully");
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
                console.log("Transcript:", data.transcript);
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({
                    type: "transcript",
                    text: data.transcript
                  }));
                }
              } else if (data.type === "error") {
                console.error("OpenAI error:", JSON.stringify(data));
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({
                    type: "error",
                    message: data.error?.message || "OpenAI error"
                  }));
                }
              }
            } catch (error) {
              console.error("Error processing OpenAI message:", error);
            }
          };

          openaiWs.onerror = (error) => {
            console.error("OpenAI WebSocket error:", error);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: "error",
                message: "OpenAI connection error"
              }));
              clientWs.close(1011);
            }
          };

          openaiWs.onclose = (event) => {
            console.log("OpenAI WebSocket closed. Code:", event.code, "Reason:", event.reason);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.close();
            }
          };
        } else {
          console.error("Failed to upgrade to WebSocket. Status:", openaiRes.status);
          console.error("Response body:", await openaiRes.text());
          throw new Error(`Failed to connect to OpenAI. Status: ${openaiRes.status}`);
        }
      } catch (error) {
        console.error("Error connecting to OpenAI:", error);
        console.error("Error stack:", error.stack);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: "error",
            message: `Failed to connect: ${error.message}`
          }));
          clientWs.close(1011);
        }
      }
    };

    clientWs.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Received from client:", message.type);

        if (message.type === "session.config" && !sessionConfigured) {
          sessionConfigured = true;
          const questionData = message.questionData;

          let instructions = `You are Santa Claus helping a contestant on "Who Wants to Be a Christmasaire". Be jolly, warm, and festive. Start with "Ho ho ho!" or a cheerful Christmas greeting.`;

          if (questionData) {
            instructions += `\n\nThe contestant needs help with:\nQuestion: ${questionData.question}\nA) ${questionData.answerA}\nB) ${questionData.answerB}\nC) ${questionData.answerC}\nD) ${questionData.answerD}\n\nCorrect answer: ${questionData.correctAnswer}\n\nThink out loud as Santa, show reasoning, maybe get "distracted by elves" for tension, but guide them to the correct answer. Be concise and add Christmas spirit!`;
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
            console.log("Sending session.update to OpenAI");
            openaiWs.send(JSON.stringify(sessionUpdate));
          } else {
            console.error("OpenAI WebSocket not ready. State:", openaiWs?.readyState);
          }
        } else if (message.type === "audio.input" && openaiWs?.readyState === WebSocket.OPEN) {
          openaiWs.send(JSON.stringify({
            type: "input_audio_buffer.append",
            audio: message.audio
          }));
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
    console.error("Top-level error:", error);
    console.error("Error stack:", error.stack);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
