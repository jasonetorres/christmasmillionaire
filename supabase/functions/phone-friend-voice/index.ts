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
        const url = new URL(req.url);
        const questionDataParam = url.searchParams.get("questionData");

        if (!questionDataParam) {
            const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew" language="en-US">Ho ho ho! This is Santa, but I don't have any question information. Please try again, my dear!</Say>
  <Hangup/>
</Response>`;

            return new Response(errorTwiml, {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "text/xml" },
            });
        }

        /**
         * REAL-TIME CONFIGURATION
         * Replace 'YOUR_REALTIME_BRIDGE_URL' with your dedicated WebSocket server address.
         * Example: 'wss://your-ngrok-url.ngrok-free.app/media-stream'
         */
        const REALTIME_BRIDGE_URL = Deno.env.get("REALTIME_BRIDGE_URL") || "YOUR_REALTIME_BRIDGE_URL";

        // Construct the stream URL with the question context so Santa knows what to talk about
        const wsUrl = `${REALTIME_BRIDGE_URL}?questionData=${encodeURIComponent(questionDataParam)}`;

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew" language="en-US">Ho ho ho! Connecting you to the North Pole now. Hold on tight!</Say>
  <Connect>
    <Stream url="${wsUrl}" />
  </Connect>
  <Pause length="30" />
</Response>`;

        return new Response(twiml, {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "text/xml" },
        });
    } catch (error) {
        console.error("Error:", error);
        const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew" language="en-US">Ho ho ho! Sorry, the blizzards are making the phone lines act up. Good luck with your answer!</Say>
  <Hangup/>
</Response>`;

        return new Response(errorTwiml, {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "text/xml" },
        });
    }
});