import { GAME_CONFIG } from '../constants/config';

export const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

export const loadAudio = async (url: string): Promise<AudioBuffer | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error(`Error decoding audio data for ${url}:`, error);
    return null;
  }
};

export const assetsPromise = Promise.all([
  loadAudio(GAME_CONFIG.SOUNDS.CAPTURE),
  loadAudio(GAME_CONFIG.SOUNDS.BGM),
]).then(([capture, bgm]) => ({ capture, bgm }));

let bgmSource: AudioBufferSourceNode | null = null;
const bgmFilter = audioCtx.createBiquadFilter();
const bgmGainNode = audioCtx.createGain();
bgmFilter.type = 'lowpass';
bgmFilter.frequency.setValueAtTime(20000, audioCtx.currentTime);
bgmGainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
bgmFilter.connect(bgmGainNode);
bgmGainNode.connect(audioCtx.destination);

export const startBGM = (buffer: AudioBuffer | null) => {
  if (!buffer || bgmSource) return;
  const play = () => {
    if (bgmSource) return;
    bgmSource = audioCtx.createBufferSource();
    bgmSource.buffer = buffer;
    bgmSource.loop = true;
    bgmSource.connect(bgmFilter);
    bgmSource.start(0);
  };
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(play);
  } else {
    play();
  }
};

export const stopBGM = () => {
  if (bgmSource) {
    try { bgmSource.stop(); } catch (e) {}
    bgmSource = null;
  }
};

export const playSound = (buffer: AudioBuffer | null, duration?: number, offset: number = 0) => {
  if (!buffer || audioCtx.state === 'suspended') return;
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start(0, offset, duration);
};

export const setBGMMuffled = (muffled: boolean) => {
  const freq = muffled ? 600 : 20000;
  if (audioCtx.state !== 'closed') {
    bgmFilter.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.1);
  }
};

export const setBGMVolume = (volume: number) => {
  bgmGainNode.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.05);
};