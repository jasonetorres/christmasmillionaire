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

// Santa's Persona and Realtime Config
const VOICE = 'alloy';
const SYSTEM_MESSAGE = `You are a jolly Santa Claus helping a contestant on "Who Wants to Be a Christmasaire". 
You are warm, festive, and a bit jolly (Ho ho ho!). 
You have been given the question and the correct answer. 
Guide the contestant through your thought process, maybe mention the reindeer or the North Pole, 
and eventually lead them toward the correct answer with festive encouragement.`;

fastify.register(async (fastify) => {
    fastify.get('/media-stream', { websocket: true }, (connection, req) => {
        console.log('Twilio connected to Media Stream');

        let streamSid = null;

        // Connect to OpenAI Realtime API
        const openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                "OpenAI-Beta": "realtime=v1"
            }
        });

        // Initialize the AI Session
        const initializeSession = () => {
            const sessionUpdate = {
                type: 'session.update',
                session: {
                    turn_detection: { type: 'server_vad' },
                    input_audio_format: 'g711_ulaw',
                    output_audio_format: 'g711_ulaw',
                    voice: VOICE,
                    instructions: SYSTEM_MESSAGE,
                    modalities: ["text", "audio"],
                    temperature: 0.8,
                }
            };
            openaiWs.send(JSON.stringify(sessionUpdate));
        };

        openaiWs.on('open', initializeSession);

        // Relay OpenAI Audio -> Twilio
        openaiWs.on('message', (data) => {
            const response = JSON.parse(data);
            if (response.type === 'response.audio.delta' && response.delta) {
                const audioDelta = {
                    event: 'media',
                    streamSid: streamSid,
                    media: { payload: response.delta }
                };
                connection.send(JSON.stringify(audioDelta));
            }
        });

        // Relay Twilio Audio -> OpenAI
        connection.on('message', (message) => {
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
        });

        connection.on('close', () => {
            if (openaiWs.readyState === WebSocket.OPEN) openaiWs.close();
            console.log('Call ended');
        });
    });
});

fastify.listen({ port: PORT }, (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Santa Bridge is live on port ${PORT}`);
});