/* ALIVE Boy — Root Component */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LockScreenComponent } from './components/lock-screen/lock-screen.component';
import { AliveScreenComponent } from './components/alive-screen/alive-screen.component';

@Component({
  selector: 'boy-root',
  standalone: true,
  imports: [CommonModule, LockScreenComponent, AliveScreenComponent],
  template: `
    @if (!unlocked) {
      <boy-lock-screen (unlock)="onUnlock()"></boy-lock-screen>
    } @else {
      <boy-alive-screen></boy-alive-screen>
    }
  `
})
export class App {
  unlocked = false;

  onUnlock(): void {
    this.unlocked = true;
  }
}
