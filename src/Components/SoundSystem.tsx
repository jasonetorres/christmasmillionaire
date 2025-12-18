import { useEffect, useRef } from 'react';

class GameSoundSystem {
  private audioContext: AudioContext | null = null;
  private backgroundMusic: OscillatorNode | null = null;
  private musicGain: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(frequency: number, duration: number, volume: number = 0.3) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playQuestionAppear() {
    if (!this.audioContext) return;
    const notes = [523.25, 587.33, 659.25, 783.99];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 0.2), i * 100);
    });
  }

  playAnswerSelect() {
    this.playTone(400, 0.1, 0.15);
  }

  playCorrectAnswer() {
    if (!this.audioContext) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 0.25), i * 80);
    });
  }

  playWrongAnswer() {
    if (!this.audioContext) return;
    this.playTone(200, 0.5, 0.3);
    setTimeout(() => this.playTone(150, 0.5, 0.3), 100);
  }

  playLifelineActivate() {
    if (!this.audioContext) return;
    const notes = [659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 0.2), i * 60);
    });
  }

  playMillionDollarWin() {
    if (!this.audioContext) return;
    const celebrationNotes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50, 1318.51, 1046.50];
    celebrationNotes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.4, 0.3), i * 120);
    });
  }

  playTimerTick() {
    this.playTone(800, 0.05, 0.1);
  }

  playTimerWarning() {
    this.playTone(1000, 0.1, 0.2);
  }

  startTensionMusic() {
    if (!this.audioContext || this.backgroundMusic) return;

    this.musicGain = this.audioContext.createGain();
    this.musicGain.connect(this.audioContext.destination);
    this.musicGain.gain.value = 0.05;

    this.backgroundMusic = this.audioContext.createOscillator();
    this.backgroundMusic.type = 'sine';
    this.backgroundMusic.frequency.value = 110;
    this.backgroundMusic.connect(this.musicGain);
    this.backgroundMusic.start();

    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.value = 20;
    lfo.frequency.value = 0.5;
    lfo.connect(lfoGain);
    lfoGain.connect(this.backgroundMusic.frequency);
    lfo.start();
  }

  stopTensionMusic() {
    if (this.backgroundMusic && this.musicGain) {
      this.musicGain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext!.currentTime + 0.5
      );
      setTimeout(() => {
        this.backgroundMusic?.stop();
        this.backgroundMusic = null;
        this.musicGain = null;
      }, 500);
    }
  }
}

export const soundSystem = new GameSoundSystem();

interface SoundSystemProps {
  gameStatus?: string;
  showCorrect?: boolean;
  selectedAnswer?: string | null;
  correctAnswer?: string;
  activeLifeline?: string | null;
  currentLevel?: number;
}

export function SoundSystemController({
  gameStatus,
  showCorrect,
  selectedAnswer,
  correctAnswer,
  activeLifeline,
  currentLevel,
}: SoundSystemProps) {
  const prevShowCorrect = useRef(showCorrect);
  const prevActiveLifeline = useRef(activeLifeline);
  const prevGameStatus = useRef(gameStatus);

  useEffect(() => {
    if (gameStatus === 'question_shown' && prevGameStatus.current !== 'question_shown') {
      soundSystem.playQuestionAppear();
      soundSystem.startTensionMusic();
    }

    if (gameStatus !== 'question_shown' && prevGameStatus.current === 'question_shown') {
      soundSystem.stopTensionMusic();
    }

    prevGameStatus.current = gameStatus;
  }, [gameStatus]);

  useEffect(() => {
    if (showCorrect && !prevShowCorrect.current) {
      soundSystem.stopTensionMusic();
      if (selectedAnswer === correctAnswer) {
        if (currentLevel && currentLevel >= 15) {
          soundSystem.playMillionDollarWin();
        } else {
          soundSystem.playCorrectAnswer();
        }
      } else {
        soundSystem.playWrongAnswer();
      }
    }
    prevShowCorrect.current = showCorrect;
  }, [showCorrect, selectedAnswer, correctAnswer, currentLevel]);

  useEffect(() => {
    if (activeLifeline && !prevActiveLifeline.current) {
      soundSystem.playLifelineActivate();
    }
    prevActiveLifeline.current = activeLifeline;
  }, [activeLifeline]);

  return null;
}
