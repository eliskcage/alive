/* ALIVE Boy — Lock Screen
   WebAuthn biometric auth — geometric styling */

import { Component, Output, EventEmitter } from '@angular/core';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'boy-lock-screen',
  standalone: true,
  template: `
    <div class="lock-screen">
      <div class="grid-bg"></div>
      <div class="lock-title">ALIVE <span class="boy-label">BOY</span></div>
      <div class="hex-zone" (click)="login()">
        <div class="hex-inner"></div>
        <div class="hex-pulse"></div>
      </div>
      @if (showRegister) {
        <button class="register-btn" (click)="register()">
          <span class="reg-dot"></span>
        </button>
      }
      <div class="lock-hint">{{ hint }}</div>
    </div>
  `,
  styles: [`
    .lock-screen {
      position: fixed; inset: 0;
      background: #0a0e1a;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      z-index: 1000;
      overflow: hidden;
    }
    .grid-bg {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    .lock-title {
      font-family: monospace;
      font-size: 14px;
      color: rgba(0,212,255,0.4);
      letter-spacing: 8px;
      margin-bottom: 40px;
      z-index: 1;
    }
    .boy-label {
      color: #00ff88;
      font-weight: bold;
    }
    .hex-zone {
      width: 120px; height: 120px;
      position: relative;
      cursor: pointer;
      z-index: 1;
    }
    .hex-inner {
      position: absolute; inset: 10px;
      background: radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%);
      border: 2px solid rgba(0,212,255,0.3);
      border-radius: 50%;
      clip-path: polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%);
    }
    .hex-pulse {
      position: absolute; inset: 0;
      border: 1px solid rgba(0,212,255,0.15);
      border-radius: 50%;
      clip-path: polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%);
      animation: hexPulse 2.5s ease-in-out infinite;
    }
    @keyframes hexPulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.15); opacity: 0; }
    }
    .register-btn {
      position: absolute;
      top: calc(50% - 100px);
      background: none; border: none;
      cursor: pointer; padding: 10px;
      z-index: 2;
    }
    .reg-dot {
      display: block;
      width: 16px; height: 16px;
      background: #00ff88;
      border-radius: 50%;
      box-shadow: 0 0 12px #00ff88;
      animation: regPulse 1.5s ease-in-out infinite;
    }
    @keyframes regPulse {
      0%, 100% { box-shadow: 0 0 8px #00ff88; }
      50% { box-shadow: 0 0 20px #00ff88; }
    }
    .lock-hint {
      margin-top: 30px;
      font-family: monospace;
      font-size: 11px;
      color: rgba(0,212,255,0.3);
      z-index: 1;
    }
  `]
})
export class LockScreenComponent {
  @Output() unlock = new EventEmitter<void>();
  hint = 'touch to authenticate';
  showRegister = !localStorage.getItem('alive_boy_registered');

  constructor(private audio: AudioService) {}

  async login(): Promise<void> {
    try {
      const optRes = await fetch('/alive/auth.php?op=login-options');
      const opts = await optRes.json();
      if (opts.error) { this.hint = opts.error; return; }
      opts.challenge = this.base64urlToUint8(opts.challenge);
      for (const cred of opts.allowCredentials) {
        cred.id = this.base64urlToUint8(cred.id);
      }
      const assertion = await navigator.credentials.get({ publicKey: opts }) as PublicKeyCredential;
      const response = assertion.response as AuthenticatorAssertionResponse;
      const verifyRes = await fetch('/alive/auth.php?op=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: assertion.id,
          rawId: this.uint8ToBase64url(new Uint8Array(assertion.rawId)),
          response: {
            authenticatorData: this.uint8ToBase64url(new Uint8Array(response.authenticatorData)),
            clientDataJSON: this.uint8ToBase64url(new Uint8Array(response.clientDataJSON)),
            signature: this.uint8ToBase64url(new Uint8Array(response.signature))
          }
        })
      });
      const result = await verifyRes.json();
      if (result.success) {
        this.killRegisterBtn();
        this.audio.soundUnlock();
        this.unlock.emit();
      } else {
        this.hint = 'auth failed — tap green dot to register';
        this.showRegister = true;
      }
    } catch (e: any) {
      this.hint = 'auth: ' + (e.message || e.name || String(e));
      this.showRegister = true;
    }
  }

  async register(): Promise<void> {
    try {
      this.hint = 'registering...';
      const optRes = await fetch('/alive/auth.php?op=register-options');
      if (!optRes.ok) { this.hint = 'reg options: HTTP ' + optRes.status; return; }
      const opts = await optRes.json();
      if (opts.error) { this.hint = 'reg opts: ' + opts.error; return; }
      opts.challenge = this.base64urlToUint8(opts.challenge);
      opts.user.id = this.base64urlToUint8(opts.user.id);
      this.hint = 'waiting for biometric...';
      const credential = await navigator.credentials.create({ publicKey: opts }) as PublicKeyCredential;
      if (!credential) { this.hint = 'no credential returned'; return; }
      const response = credential.response as AuthenticatorAttestationResponse;
      const pubKey = (response as any).getPublicKey ? this.uint8ToBase64url(new Uint8Array((response as any).getPublicKey())) : '';
      this.hint = 'verifying...';
      const regRes = await fetch('/alive/auth.php?op=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: credential.id,
          rawId: this.uint8ToBase64url(new Uint8Array(credential.rawId)),
          response: {
            attestationObject: this.uint8ToBase64url(new Uint8Array(response.attestationObject)),
            clientDataJSON: this.uint8ToBase64url(new Uint8Array(response.clientDataJSON)),
            publicKey: pubKey
          }
        })
      });
      const result = await regRes.json();
      if (result.success) {
        this.killRegisterBtn();
        this.audio.soundUnlock();
        this.hint = 'registered!';
        setTimeout(() => this.unlock.emit(), 500);
      } else {
        this.hint = 'reg fail: ' + (result.error || JSON.stringify(result));
      }
    } catch (e: any) {
      this.hint = 'reg: ' + (e.message || e.name || String(e));
    }
  }

  private killRegisterBtn(): void {
    localStorage.setItem('alive_boy_registered', 'true');
    this.showRegister = false;
  }

  private base64urlToUint8(str: string): Uint8Array {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    const bin = atob(str);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }

  private uint8ToBase64url(arr: Uint8Array): string {
    let bin = '';
    for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}
