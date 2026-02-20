import type { SoundId } from './sounds.js';
import { SOUND_PATHS } from './sounds.js';

const SETTINGS_KEY = 'gobbo-market-settings';
const SFX_BASE = 'assets/sounds/Cute UI _ Interact Sound Effects Pack/AUDIO/';
const MUSIC_BASE = 'assets/sounds/music/';
const TRACKS_MANIFEST = 'assets/sounds/music/tracks.json';

interface SoundSettings {
  masterVolume: number;
  musicVolume: number;
  muted: boolean;
  selectedTrackIndex: number;
}

const DEFAULT_SETTINGS: SoundSettings = {
  masterVolume: 0.7,
  musicVolume: 0.5,
  muted: false,
  selectedTrackIndex: 0,
};

export class SoundManager {
  private masterVolume = DEFAULT_SETTINGS.masterVolume;
  private musicVolume = DEFAULT_SETTINGS.musicVolume;
  private muted = DEFAULT_SETTINGS.muted;
  private selectedTrackIndex = DEFAULT_SETTINGS.selectedTrackIndex;
  private musicTracks: string[] = [];
  private musicElement: HTMLAudioElement | null = null;
  private loopElements: Map<string, HTMLAudioElement> = new Map();
  private baseUrl: string;
  private lastSliderPreviewAt = 0;

  constructor() {
    this.baseUrl = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '') + '/';
  }

  private get fullSfxBase(): string {
    return this.baseUrl + SFX_BASE;
  }

  private get fullMusicBase(): string {
    return this.baseUrl + MUSIC_BASE;
  }

  loadSettings(): void {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<SoundSettings>;
      if (typeof parsed.masterVolume === 'number') this.masterVolume = Math.max(0, Math.min(1, parsed.masterVolume));
      if (typeof parsed.musicVolume === 'number') this.musicVolume = Math.max(0, Math.min(1, parsed.musicVolume));
      if (typeof parsed.muted === 'boolean') this.muted = parsed.muted;
      if (typeof parsed.selectedTrackIndex === 'number') this.selectedTrackIndex = Math.max(0, parsed.selectedTrackIndex);
    } catch {
      // ignore
    }
  }

  saveSettings(): void {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          masterVolume: this.masterVolume,
          musicVolume: this.musicVolume,
          muted: this.muted,
          selectedTrackIndex: this.selectedTrackIndex,
        })
      );
    } catch {
      // ignore
    }
  }

  setMasterVolume(value: number): void {
    this.masterVolume = Math.max(0, Math.min(1, value));
    this.applyMusicVolume();
  }

  setMusicVolume(value: number): void {
    this.musicVolume = Math.max(0, Math.min(1, value));
    this.applyMusicVolume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyMusicVolume();
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  getMuted(): boolean {
    return this.muted;
  }

  play(soundId: SoundId, options?: { volume?: number }): void {
    if (this.muted) return;
    const path = SOUND_PATHS[soundId];
    if (!path) return;
    const url = this.fullSfxBase + path;
    try {
      const audio = new Audio(url);
      const vol = options?.volume ?? 1;
      audio.volume = Math.min(1, this.masterVolume * vol);
      audio.play().catch(() => {
        // Autoplay policy or missing file - ignore
      });
    } catch {
      // ignore
    }
  }

  playLoop(soundId: SoundId, options?: { volume?: number }): void {
    if (this.muted) return;
    this.stopLoop(soundId);
    const path = SOUND_PATHS[soundId];
    if (!path) return;
    const url = this.fullSfxBase + path;
    try {
      const audio = new Audio(url);
      audio.loop = true;
      const vol = options?.volume ?? 1;
      audio.volume = Math.min(1, this.masterVolume * vol);
      this.loopElements.set(soundId, audio);
      audio.play().catch(() => {
        this.loopElements.delete(soundId);
      });
    } catch {
      // ignore
    }
  }

  stopLoop(soundId: SoundId): void {
    const audio = this.loopElements.get(soundId);
    if (audio) {
      audio.pause();
      audio.src = '';
      this.loopElements.delete(soundId);
    }
  }

  playSliderPreview(): void {
    const now = performance.now();
    if (now - this.lastSliderPreviewAt < 180) return;
    this.lastSliderPreviewAt = now;
    this.play('ui_hover', { volume: 0.4 });
  }

  async fetchMusicTracks(): Promise<string[]> {
    if (this.musicTracks.length > 0) return this.musicTracks;
    try {
      const res = await fetch(this.baseUrl + TRACKS_MANIFEST);
      if (!res.ok) return [];
      const arr = (await res.json()) as unknown;
      if (!Array.isArray(arr)) return [];
      this.musicTracks = arr.filter((x): x is string => typeof x === 'string');
      return this.musicTracks;
    } catch {
      return [];
    }
  }

  getMusicTracks(): string[] {
    return [...this.musicTracks];
  }

  async startBackgroundMusic(): Promise<void> {
    const tracks = await this.fetchMusicTracks();
    if (tracks.length === 0) return;
    const idx = Math.min(this.selectedTrackIndex, tracks.length - 1);
    this.selectedTrackIndex = idx;
    await this.playMusicByIndex(idx);
  }

  async playMusicByFilename(filename: string): Promise<void> {
    const tracks = await this.fetchMusicTracks();
    const idx = tracks.indexOf(filename);
    if (idx < 0) return;
    this.selectedTrackIndex = idx;
    this.saveSettings();
    await this.playMusicByIndex(idx);
  }

  async playNextTrack(): Promise<void> {
    const tracks = await this.fetchMusicTracks();
    if (tracks.length === 0) return;
    this.selectedTrackIndex = (this.selectedTrackIndex + 1) % tracks.length;
    this.saveSettings();
    await this.playMusicByIndex(this.selectedTrackIndex);
  }

  async playPrevTrack(): Promise<void> {
    const tracks = await this.fetchMusicTracks();
    if (tracks.length === 0) return;
    this.selectedTrackIndex = this.selectedTrackIndex <= 0 ? tracks.length - 1 : this.selectedTrackIndex - 1;
    this.saveSettings();
    await this.playMusicByIndex(this.selectedTrackIndex);
  }

  getSelectedTrackIndex(): number {
    return this.selectedTrackIndex;
  }

  stopMusic(): void {
    if (this.musicElement) {
      this.musicElement.pause();
      this.musicElement.src = '';
      this.musicElement = null;
    }
  }

  private async playMusicByIndex(index: number): Promise<void> {
    const tracks = await this.fetchMusicTracks();
    const filename = tracks[index];
    if (!filename) return;
    this.stopMusic();
    const url = this.fullMusicBase + encodeURIComponent(filename);
    const audio = new Audio();
    audio.loop = true;
    audio.muted = this.muted;
    this.applyMusicVolumeToElement(audio);
    audio.src = url;
    this.musicElement = audio;
    audio.play().catch(() => {
      // Autoplay or missing file
    });
    audio.addEventListener('error', () => {
      if (this.musicElement === audio) {
        this.musicElement = null;
        // Try next track
        if (tracks.length > 1) {
          this.selectedTrackIndex = (index + 1) % tracks.length;
          this.playMusicByIndex(this.selectedTrackIndex);
        }
      }
    });
  }

  private applyMusicVolume(): void {
    this.applyMusicVolumeToElement(this.musicElement);
  }

  private applyMusicVolumeToElement(el: HTMLAudioElement | null): void {
    if (!el) return;
    el.muted = this.muted;
    el.volume = this.masterVolume * this.musicVolume;
  }
}

export const soundManager = new SoundManager();
