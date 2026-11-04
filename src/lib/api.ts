import { useCallback, useEffect, useState } from 'react';
import { GameState, TriviaQuestion } from '../types';

export interface VoteCounts {
  A: number;
  B: number;
  C: number;
  D: number;
}

export interface ReactionEvent {
  id: string;
  emoji: string;
  created_at: string;
}

export interface LiveGame extends Omit<GameState, 'current_question'> {
  current_question: TriviaQuestion | null;
}

export interface GameSnapshot {
  game: LiveGame | null;
  votes: VoteCounts;
  reactions: ReactionEvent[];
}

const HOST_CODE_KEY = 'christmasaire-host-code';

export function getHostCode() {
  return sessionStorage.getItem(HOST_CODE_KEY) || '';
}

export function setHostCode(code: string) {
  sessionStorage.setItem(HOST_CODE_KEY, code);
}

export function clearHostCode() {
  sessionStorage.removeItem(HOST_CODE_KEY);
}

async function readJson(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || 'Request failed') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function fetchState(): Promise<GameSnapshot> {
  return readJson(await fetch('/api/state'));
}

export async function hostAction(action: string, payload: Record<string, unknown> = {}): Promise<GameSnapshot> {
  return readJson(await fetch('/api/host', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-host-code': getHostCode(),
    },
    body: JSON.stringify({ action, ...payload }),
  }));
}

export async function castVote(vote: 'A' | 'B' | 'C' | 'D'): Promise<GameSnapshot> {
  return readJson(await fetch('/api/votes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vote }),
  }));
}

export async function sendReaction(emoji: string): Promise<GameSnapshot> {
  return readJson(await fetch('/api/reactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emoji }),
  }));
}

export async function hangUpPhone() {
  await fetch('/api/phone/hangup', { method: 'POST' });
}

export async function askSanta(body: Record<string, unknown>) {
  return readJson(await fetch('/api/santa-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })) as { response?: string; audio?: number[]; error?: string };
}

export function useGameState() {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setSnapshot(await fetchState());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the game');
    }
  }, []);

  useEffect(() => {
    reload();
    const id = window.setInterval(reload, 2000);
    return () => window.clearInterval(id);
  }, [reload]);

  return { snapshot, error, reload, setSnapshot };
}
