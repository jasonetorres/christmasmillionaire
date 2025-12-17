import Fastify from 'fastify';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import fastifyFormBody from '@fastify/formbody';
import fastifyWs from '@fastify/websocket';

dotenv.config();

const { OPENAI_API_KEY, PORT = 5050 } = process.env;

if (!OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY in .env file');
    process.exit(1);
}

const fastify = Fastify();
fastify.register(fastifyFormBody);
fastify.register(fastifyWs);

// Santa's Persona
const VOICE = 'alloy';
const SYSTEM_MESSAGE = `You are a jolly Santa Claus helping a contestant on "Who Wants to Be a Christmasaire". 
You are warm, festive, and a bit jolly (Ho ho ho!). 
You have been given the question and the correct answer. 
Guide the contestant through your thought process, maybe mention the reindeer or the North Pole, 
and eventually lead them toward the correct answer with festive encouragement.`;

// The Unified Route: Handles both plain HTTP (for testing) and WebSocket (for Twilio)
fastify.route({
    method: ['GET', 'POST'],
    url: '/media-stream',
    handler: async (request, reply) => {
        console.log('HTTP Handshake: Bridge is reachable!');
        return { status: "Santa Bridge is active. Send a WebSocket to start the stream." };
    },
    wsHandler: (connection, req) => {
        console.log('--- SUCCESS: Twilio connected to Media Stream ---');

        let streamSid = null;

        // 1. Extract questionData from the URL query string so Santa has context
        const url = new URL(req.url, `http://${req.headers.host}`);
        const questionDataParam = url.searchParams.get('questionData');
        let dynamicInstructions = SYSTEM_MESSAGE;

        if (questionDataParam) {
            try {
                const questionData = JSON.parse(decodeURIComponent(questionDataParam));
                dynamicInstructions += `\n\nHELP THE CONTESTANT WITH THIS QUESTION:
                Question: ${questionData.question}
                A) ${questionData.answerA}
                B) ${questionData.answerB}
                C) ${questionData.answerC}
                D) ${questionData.answerD}
                The correct answer is ${questionData.correctAnswer}. Guide them there warmly and stay in character!`;
            } catch (e) {
                console.error("Failed to parse question data", e);
            }
        }

        // 2. Connect to OpenAI Realtime API using the latest stable preview model
        const openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                "OpenAI-Beta": "realtime=v1"
            }
        });

        // 3. Initialize the AI Session with context-aware instructions
        const initializeSession = () => {
            console.log('OpenAI connection opened. Initializing session...');
            const sessionUpdate = {
                type: 'session.update',
                session: {
                    turn_detection: { type: 'server_vad' },
                    input_audio_format: 'g711_ulaw',
                    output_audio_format: 'g711_ulaw',
                    voice: VOICE,
                    instructions: dynamicInstructions,
                    modalities: ["text", "audio"],
                    temperature: 0.8,
                }
            };
            openaiWs.send(JSON.stringify(sessionUpdate));
        };

        openaiWs.on('open', initializeSession);

        // 4. Relay OpenAI Audio -> Twilio
        openaiWs.on('message', (data) => {
            try {
                const response = JSON.parse(data);
                if (response.type === 'response.audio.delta' && response.delta) {
                    const audioDelta = {
                        event: 'media',
                        streamSid: streamSid,
                        media: { payload: response.delta }
                    };
                    connection.send(JSON.stringify(audioDelta));
                }
            } catch (err) { console.error('Error processing OpenAI message:', err); }
        });

        // 5. Relay Twilio Audio -> OpenAI
        connection.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                if (data.event === 'start') {
                    streamSid = data.start.streamSid;
                    console.log('Stream started:', streamSid);
                } else if (data.event === 'media') {
                    const audioAppend = {
                        type: 'input_audio_buffer.append',
                        audio: data.media.payload
                    };
                    if (openaiWs.readyState === WebSocket.OPEN) {
                        openaiWs.send(JSON.stringify(audioAppend));
                    }
                }
            } catch (err) { console.error('Error processing Twilio message:', err); }
        });

        connection.on('close', () => {
            if (openaiWs.readyState === WebSocket.OPEN) openaiWs.close();
            console.log('Call ended');
        });
    }
});

fastify.listen({ port: parseInt(PORT), host: '0.0.0.0' }, (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Santa Bridge is live on port ${PORT}`);
});