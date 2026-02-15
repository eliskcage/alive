/* ALIVE Boy — Senses Service
   Camera, accelerometer, battery — environmental awareness */

import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SensorySignature } from '../models/genome.model';

export interface SensoryState {
  brightness: number;
  color: [number, number, number];
  motion: number;
  volume: number;
  shake: number;
  pitch: number;
}

@Injectable({ providedIn: 'root' })
export class SensesService {
  state$ = new BehaviorSubject<SensoryState>({
    brightness: 0.5, color: [0.5, 0.5, 0.5], motion: 0, volume: 0, shake: 0, pitch: 0
  });

  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx2d: CanvasRenderingContext2D | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private senseInterval: any = null;
  private lastAccel = { x: 0, y: 0, z: 0 };

  constructor(private zone: NgZone) {}

  start(): void {
    this.startCamera();
    this.startMotion();
    this.startMic();
    this.zone.runOutsideAngular(() => {
      this.senseInterval = setInterval(() => this.sample(), 500);
    });
  }

  stop(): void {
    if (this.senseInterval) clearInterval(this.senseInterval);
    if (this.video && this.video.srcObject) {
      (this.video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  }

  getSnapshot(): SensorySignature {
    const s = this.state$.value;
    return {
      brightness: s.brightness,
      color: [...s.color] as [number, number, number],
      motion: s.motion,
      volume: s.volume,
      shake: s.shake,
      pitch: s.pitch
    };
  }

  private startCamera(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 32;
    this.canvas.height = 32;
    this.ctx2d = this.canvas.getContext('2d');
    this.video = document.createElement('video');
    this.video.setAttribute('playsinline', '');
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment', width: 64, height: 64 } })
      .then(stream => {
        this.video!.srcObject = stream;
        this.video!.play();
      })
      .catch(() => { /* no camera */ });
  }

  private startMotion(): void {
    window.addEventListener('devicemotion', (e) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const dx = (a.x || 0) - this.lastAccel.x;
      const dy = (a.y || 0) - this.lastAccel.y;
      const dz = (a.z || 0) - this.lastAccel.z;
      const shake = Math.sqrt(dx * dx + dy * dy + dz * dz);
      this.lastAccel = { x: a.x || 0, y: a.y || 0, z: a.z || 0 };
      const s = this.state$.value;
      s.shake = Math.min(1, shake / 20);
      s.motion = Math.min(1, Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2) / 15);
      this.state$.next(s);
    });
  }

  private startMic(): void {
    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then(stream => {
        this.audioCtx = new AudioContext();
        const source = this.audioCtx.createMediaStreamSource(stream);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);
      })
      .catch(() => { /* no mic */ });
  }

  private sample(): void {
    const s = { ...this.state$.value };

    // Camera
    if (this.video && this.ctx2d && this.video.readyState >= 2) {
      this.ctx2d.drawImage(this.video, 0, 0, 32, 32);
      const data = this.ctx2d.getImageData(0, 0, 32, 32).data;
      let r = 0, g = 0, b = 0, bright = 0;
      const pixels = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]; g += data[i + 1]; b += data[i + 2];
        bright += (data[i] + data[i + 1] + data[i + 2]) / 3;
      }
      s.color = [r / pixels / 255, g / pixels / 255, b / pixels / 255];
      s.brightness = bright / pixels / 255;
    }

    // Mic
    if (this.analyser) {
      const freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(freqData);
      let sum = 0, maxIdx = 0, maxVal = 0;
      for (let i = 0; i < freqData.length; i++) {
        sum += freqData[i];
        if (freqData[i] > maxVal) { maxVal = freqData[i]; maxIdx = i; }
      }
      s.volume = Math.min(1, sum / freqData.length / 128);
      s.pitch = maxIdx / freqData.length;
    }

    this.state$.next(s);
  }
}
