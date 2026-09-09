import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkStateService } from '../services/network-state.service';
import { PatientStateService } from '../services/patient-state.service';
import { ThemeService } from '../services/theme.service';
import { HardwareTelemetryService } from '../services/hardware/hardware-telemetry.service';
import { GamificationService } from '../services/gamification.service';
import { WalkthroughTourService } from '../services/walkthrough-tour.service';
import { SessionStateService } from '../services/session-state.service';
import { PocketgullIconComponent } from './shared/pocketgull-icon.component';
import { PocketgullBrandMarkComponent } from './shared/pocketgull-brand-mark.component';
import { AmbientFlowPlayerComponent } from './shared/ambient-flow-player.component';
import { ConsoleIntegrityBadgeComponent } from './console-integrity-badge.component';
import { AmbientFlowSoundscapeService } from '../services/ambient-flow-soundscape.service';
import { NavigationShellService } from '../services/navigation-shell.service';

@Component({
  selector: 'app-main-header-nav',
  standalone: true,
  imports: [
    CommonModule,
    PocketgullIconComponent,
    PocketgullBrandMarkComponent,
    AmbientFlowPlayerComponent,
    ConsoleIntegrityBadgeComponent
  ],
  template: `
    <!-- Navbar: Pure utility & theme harmony -->
    <nav class="theme-nav-bar h-14 flex items-center justify-between px-3 sm:px-6 shrink-0 z-50 no-print relative">
      <div class="flex items-center gap-3 min-w-0">
        <a href="/" class="flex items-center gap-2.5 shrink-0 cursor-pointer group select-none">
          <app-pocketgull-brand-mark size="sm" [showSubtext]="false" />
        </a>

        <!-- System Status Indicator (Accessible Button) -->
        <button type="button" class="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-zinc-900 rounded-md border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-all cursor-pointer group relative no-print shrink-0" 
             (click)="network.toggleForceOffline()"
             [title]="network.isOnline() ? 'Click to simulate offline' : 'Click to disable offline override'">
          <div class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full rounded-full status-dot opacity-75" 
                  [style.background-color]="network.isOnline() ? 'var(--spectral-stable)' : 'var(--spectral-critical)'"
                  [class.animate-ping]="network.isOnline()"
                  style="will-change: transform, opacity;"></span>
            <span class="relative inline-flex rounded-full status-dot h-2 w-2"
                  [style.background-color]="network.isOnline() ? 'var(--spectral-stable)' : 'var(--spectral-critical)'"></span>
          </div>
          <span class="text-xs font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-widest">{{ network.isOnline() ? 'System Ready' : (network.forceOffline() ? 'App Forced Offline' : 'System Offline') }}</span>
        </button>

        <!-- Ambient Flow Background Music Quick Indicator (Desktop) -->
        <div class="hidden xl:flex items-center gap-2">
          <button 
            type="button" 
            (click)="showAmbientPlayer.set(!showAmbientPlayer())"
            [class.bg-teal-500/20]="soundscapeService.isPlaying()"
            [class.text-teal-700]="soundscapeService.isPlaying()"
            [class.dark:text-teal-300]="soundscapeService.isPlaying()"
            [class.border-teal-500/50]="soundscapeService.isPlaying()"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 hover:bg-teal-100 dark:hover:bg-teal-900/50 rounded-md text-xs font-bold uppercase tracking-wider transition shadow-xs focus:ring-2 focus:ring-teal-500/50 outline-none cursor-pointer shrink-0"
            title="Toggle Ambient Flow Soundscape & Offline Binaural Focus Music">
            <span [class.animate-pulse]="soundscapeService.isPlaying()">{{ soundscapeService.isPlaying() ? '🎶' : '🎵' }}</span>
            <span>{{ soundscapeService.isPlaying() ? 'Flow: ' + soundscapeService.activePreset().carrierFreqHz + 'Hz' : 'Ambient Flow' }}</span>
          </button>
        </div>
      </div>

      <!-- Right Nav Action Suite -->
      <div class="flex items-center gap-2 shrink-0">
        <app-console-integrity-badge class="hidden lg:inline-flex" />

        <!-- 🌟 Clinical Apps & Portals Hub Dropdown Button (Desktop) -->
        <div class="relative hidden md:block">
          <button 
            type="button" 
            id="btn-apps-hub-trigger"
            (click)="isAppsHubOpen.set(!isAppsHubOpen())"
            aria-label="Open Apps and Clinical Portals Hub"
            [class.bg-emerald-500/20]="isAppsHubOpen()"
            [class.border-emerald-500/60]="isAppsHubOpen()"
            class="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-zinc-800/80 rounded-xs text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer">
            <span class="text-xs">✨</span>
            <span>Apps &amp; Portals</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-zinc-500 transition-transform duration-200" [class.rotate-180]="isAppsHubOpen()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>

          <!-- Apps Hub Popover Grid -->
          @if (isAppsHubOpen()) {
            <!-- Backdrop click-away -->
            <div class="fixed inset-0 z-40 bg-black/20" (click)="isAppsHubOpen.set(false)"></div>

            <div class="absolute right-0 top-full mt-1.5 w-[440px] z-50 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-3 animate-in fade-in slide-in-from-top-1 duration-150 font-mono text-xs">
              <div class="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                <div class="flex items-center gap-2">
                  <span class="text-[11px] font-bold tracking-widest uppercase text-zinc-500">POCKETGULL WORKSTATION HUB</span>
                </div>
                <span class="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 border border-emerald-300 dark:border-emerald-800">[24 CLINICAL MODULES]</span>
              </div>

              <!-- Categorized Grid -->
              <div class="grid grid-cols-2 gap-3 pt-2.5">
                <!-- Section: Clinical Intelligence & AI -->
                <div class="space-y-1">
                  <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block px-1">🧠 Clinical AI</span>
                  <button type="button" (click)="openTuringSuite.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">🧮</span>
                    <div>
                      <div>Turing Diagnostic Suite</div>
                      <div class="text-[10px] text-zinc-400 font-normal">Cellular Automata &amp; Petri Nets</div>
                    </div>
                  </button>
                  <button type="button" (click)="openSocraticRounds.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">👨‍⚕️</span>
                    <div>
                      <div>Socratic Rounds</div>
                      <div class="text-[10px] text-zinc-400 font-normal">House M.D. Multi-Agent CDS</div>
                    </div>
                  </button>
                  <button type="button" (click)="openBarrowsWorkbench.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">🔬</span>
                    <div>
                      <div>Dr. Barrows Workbench</div>
                      <div class="text-[10px] text-zinc-400 font-normal">PBL Inquiry &amp; Doctor Prep</div>
                    </div>
                  </button>
                  <button type="button" (click)="openKneeHologram.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">🩻</span>
                    <div>
                      <div>3D Joint Hologram</div>
                      <div class="text-[10px] text-zinc-400 font-normal">Three.js Tri-Plane Slicer</div>
                    </div>
                  </button>
                  <button type="button" (click)="openSmartHealthPass.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">📱</span>
                    <div>
                      <div>SMART Health Pass</div>
                      <div class="text-[10px] text-zinc-400 font-normal">Cryptographic FHIR R4 QR</div>
                    </div>
                  </button>
                  <button type="button" (click)="openSocraticIntake.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">✨</span>
                    <div>
                      <div>Socratic Intake</div>
                      <div class="text-[10px] text-zinc-400 font-normal">FIFE Question Engine</div>
                    </div>
                  </button>
                  <button type="button" (click)="openModelGarden.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">🌿</span>
                    <div>
                      <div>Model Garden</div>
                      <div class="text-[10px] text-zinc-400 font-normal">Vertex AI Registries</div>
                    </div>
                  </button>
                  <button type="button" (click)="openEncryptedVault.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">🔐</span>
                    <div>
                      <div>Encrypted Vault</div>
                      <div class="text-[10px] text-zinc-400 font-normal">AES-GCM-256 Vault</div>
                    </div>
                  </button>
                  <button type="button" (click)="openSmartFhirSync.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">🏥</span>
                    <div>
                      <div>SMART on FHIR</div>
                      <div class="text-[10px] text-zinc-400 font-normal">EHR Sync Bridge</div>
                    </div>
                  </button>
                </div>

                <!-- Section: Global & Community Health -->
                <div class="space-y-1">
                  <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block px-1">🌍 Global Health</span>
                  <button type="button" (click)="openGlobalHealth.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">🌐</span>
                    <div>
                      <div>Global Health</div>
                      <div class="text-[10px] text-zinc-400 font-normal">WHO SDG 3.4 &amp; ICD-11</div>
                    </div>
                  </button>
                  <button type="button" (click)="openCompanionSync.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">📱</span>
                    <div>
                      <div>Sync Companion</div>
                      <div class="text-[10px] text-zinc-400 font-normal">Mobile QR Launch</div>
                    </div>
                  </button>
                  <button type="button" (click)="openPatientPortal.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">🩺</span>
                    <div>
                      <div>Patient Portal</div>
                      <div class="text-[10px] text-zinc-400 font-normal">Self-Service Access</div>
                    </div>
                  </button>
                  <button type="button" (click)="openArticles.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">📰</span>
                    <div>
                      <div>Knowledge Hub</div>
                      <div class="text-[10px] text-zinc-400 font-normal">SNO-10 &amp; Articles</div>
                    </div>
                  </button>
                  <button type="button" (click)="openResearchDividend.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">🧬</span>
                    <div>
                      <div>Data Dividend</div>
                      <div class="text-[10px] text-zinc-400 font-normal">NIH / LunaDNA Registry</div>
                    </div>
                  </button>
                </div>

                <!-- Section: Focus, Telemetry & Wellness -->
                <div class="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block px-1">🎵 Wellness</span>
                  <button type="button" (click)="openBioNetworkQr.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">🎵</span>
                    <div>
                      <div>Bio-Network HUD</div>
                      <div class="text-[10px] text-zinc-400 font-normal">Haptic Sound Engine</div>
                    </div>
                  </button>
                  <button type="button" (click)="triggerSomaticGrounding.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">🧘</span>
                    <div>
                      <div>Somatic Grounding</div>
                      <div class="text-[10px] text-zinc-400 font-normal">Box Breathing Pacer</div>
                    </div>
                  </button>
                  <button type="button" (click)="openAmbientLivingSpace.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">🏡</span>
                    <div>
                      <div>Living Room Ambient</div>
                      <div class="text-[10px] text-zinc-400 font-normal">Dieter Rams Display Mode</div>
                    </div>
                  </button>
                  <button type="button" (click)="openHumanDignityPact.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">🕊️</span>
                    <div>
                      <div>Dignity Charter</div>
                      <div class="text-[10px] text-zinc-400 font-normal">Human Rights & Autonomy</div>
                    </div>
                  </button>
                  <button type="button" (click)="openTypefaceSite.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">🔤</span>
                    <div>
                      <div>Typeface Suite</div>
                      <div class="text-[10px] text-zinc-400 font-normal">William Caslon Fonts</div>
                    </div>
                  </button>
                </div>

                <!-- Section: Enterprise & Operations -->
                <div class="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block px-1">🏢 Enterprise</span>
                  <button type="button" (click)="openComplianceCertificate.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">📜</span>
                    <div>
                      <div>Statutory Certificate</div>
                      <div class="text-[10px] text-zinc-400 font-normal">HIPAA, FDA &amp; NIST Audit</div>
                    </div>
                  </button>
                  <button type="button" (click)="openSupportTicket.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">📬</span>
                    <div>
                      <div>AI Support Portal</div>
                      <div class="text-[10px] text-zinc-400 font-normal">Autonomous Ticketing</div>
                    </div>
                  </button>
                  <button type="button" (click)="openTalentHrPortal.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">💼</span>
                    <div>
                      <div>Executive Demo</div>
                      <div class="text-[10px] text-zinc-400 font-normal">Health System ROI</div>
                    </div>
                  </button>
                  <button type="button" (click)="openBillingDashboard.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">💳</span>
                    <div>
                      <div>Billing &amp; Pricing</div>
                      <div class="text-[10px] text-zinc-400 font-normal">Usage &amp; Plans</div>
                    </div>
                  </button>
                  <button type="button" (click)="openDoctorShiftDemo.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">🏥</span>
                    <div>
                      <div>Hospital Shift Demo</div>
                      <div class="text-[10px] text-zinc-400 font-normal">Physician Pilot & HHS § 1557</div>
                    </div>
                  </button>
                  <button type="button" (click)="navShell?.openCmsSuperbill(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">📋</span>
                    <div>
                      <div>CMS RPM Superbill Claim</div>
                      <div class="text-[10px] text-zinc-400 font-normal">CPT 99453/99454 16-Day Telemetry</div>
                    </div>
                  </button>
                  <button type="button" (click)="navShell?.openTrajectoryReader(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">⚡</span>
                    <div>
                      <div>Rapid Trajectory & Speed Reader</div>
                      <div class="text-[10px] text-zinc-400 font-normal">Past / Present / Future Arc (650 WPM)</div>
                    </div>
                  </button>
                  <button type="button" (click)="openGreenRoom.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">🌿</span>
                    <div>
                      <div>Green Room Lounge</div>
                      <div class="text-[10px] text-zinc-400 font-normal">Clinician Debrief & Reflection</div>
                    </div>
                  </button>
                  <button type="button" (click)="openPatentClaims.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">⚖️</span>
                    <div>
                      <div>Patent &amp; IP Registry</div>
                      <div class="text-[10px] text-zinc-400 font-normal">200 Claims &amp; Clauses</div>
                    </div>
                  </button>
                  <button type="button" (click)="openAustereHud.emit(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">🛡️</span>
                    <div>
                      <div>Austere Research Profile</div>
                      <div class="text-[10px] text-zinc-400 font-normal">Zero-Egress HIPAA Safe Harbor HUD</div>
                    </div>
                  </button>
                  <button type="button" (click)="openMdcpHub(); isAppsHubOpen.set(false)" class="w-full text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                    <span class="text-sm">📋</span>
                    <div>
                      <div>MDCP Clinical &amp; Standards Hub</div>
                      <div class="text-[10px] text-teal-600 dark:text-teal-400 font-normal">Pediatric Waiver • CarePlan • IEEE 11073 • ITA</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Live AI Agent Consult Trigger (Always visible on mobile & desktop) -->
        <button (click)="state.toggleLiveAgent(!state.isLiveAgentActive())"
                id="tour-voice-agent-trigger"
                aria-label="AI Agent"
                class="group shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xs border transition-colors text-xs font-mono font-bold uppercase tracking-widest cursor-pointer shadow-xs"
                [class.bg-gray-800]="state.isLiveAgentActive()"
                [class.dark:bg-white]="state.isLiveAgentActive()"
                [class.border-gray-800]="state.isLiveAgentActive()"
                [class.dark:border-white]="state.isLiveAgentActive()"
                [class.text-white]="state.isLiveAgentActive()"
                [class.dark:text-[#111111]]="state.isLiveAgentActive()"
                [class.bg-white/80]="!state.isLiveAgentActive()"
                [class.dark:bg-zinc-900]="!state.isLiveAgentActive()"
                [class.border-gray-300]="!state.isLiveAgentActive()"
                [class.dark:border-zinc-700]="!state.isLiveAgentActive()"
                [class.text-gray-700]="!state.isLiveAgentActive()"
                [class.dark:text-zinc-300]="!state.isLiveAgentActive()">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" x2="12" y1="19" y2="22"/>
          </svg>
          <span class="text-[11px]">AI Agent</span>
        </button>

        <!-- Desktop Action Buttons (Hidden on mobile) -->
        <div class="hidden md:flex items-center gap-2 font-mono">
          <button (click)="state.toggleResearchFrame()"
                  id="tour-research-frame-trigger"
                  aria-label="Research"
                  class="group shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xs border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-bold uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer bg-white/80 dark:bg-zinc-900">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m0 18c-2.29 0-4.43-.78-6.14-2.1C4.6 16.5 4 14.83 4 12c0-1.5.3-2.91.86-4.22L16.22 19.14A7.92 7.92 0 0 1 12 20m7.14-2.1C20.4 16.5 21 14.83 21 12c0-1.5-.3-2.91-.86-4.22L8.78 19.14C10.09 20.7 11.97 21.5 14 21.5c1.47 0 2.87-.42 4.14-1.14Z"/></svg>
            <span>Research</span>
          </button>

          <!-- Theme Toggle -->
          <button (click)="theme.cycleTheme()" 
                  id="tour-theme-trigger"
                  aria-label="Toggle Theme"
                  [title]="'Cycle Theme (Current: ' + theme.currentTheme() + ')'"
                  class="group shrink-0 p-2 border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xs transition-colors text-gray-500 dark:text-zinc-400 cursor-pointer flex items-center gap-1 bg-white/80 dark:bg-zinc-900">
            @switch (theme.currentTheme()) {
               @case ('dark') {
                 <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 transition-transform group-hover:rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>   
               }
               @case ('light') {
                 <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 transition-transform group-hover:animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
               }
               @case ('spark') {
                 <span class="text-xs">✨</span>
               }
               @case ('system') {
                 <span class="text-xs">💻</span>
               }
               @default { <span class="text-xs">🎨</span> }
            }
          </button>

          <!-- Font Size Scale Toggle -->
          <button (click)="theme.cycleTextSizeScale()"
                  aria-label="Toggle Font Size & Text Legibility Scale"
                  [title]="'Text Size Scale: ' + theme.textSizeScale() + ' (Click to cycle A / A+ / A++)'"
                  class="px-2.5 py-1.5 rounded-xs transition font-mono text-xs font-black cursor-pointer bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center gap-1 shrink-0 shadow-xs">
            <span>🔤</span>
            <span>
              @switch (theme.textSizeScale()) {
                @case ('standard') { A }
                @case ('large') { A+ }
                @case ('extra-large') { A++ }
                @default { A }
              }
            </span>
          </button>
        </div>

        <!-- Mobile Navigation Menu Toggle Button (Visible on screens < xl) -->
        <button 
          type="button"
          (click)="isMobileMenuOpen.set(!isMobileMenuOpen())"
          class="xl:hidden flex items-center justify-center p-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700 active:scale-95 transition cursor-pointer shadow-xs min-h-[44px] min-w-[44px]"
          aria-label="Open Mobile Navigation Menu">
          @if (isMobileMenuOpen()) {
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          } @else {
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16"/></svg>
          }
        </button>
      </div>
    </nav>

    <!-- Mobile Drawer Overlay & Slide-out Menu -->
    @if (isMobileMenuOpen()) {
      <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm xl:hidden animate-in fade-in duration-200"
           (click)="isMobileMenuOpen.set(false)">
      </div>

      <div class="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] z-50 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 p-5 shadow-2xl flex flex-col justify-between overflow-y-auto xl:hidden animate-in slide-in-from-right duration-300 overscroll-contain">
        <div class="space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div class="flex items-center gap-2">
              <app-pocketgull-icon name="seagull" />
              <span class="text-base font-bold text-zinc-900 dark:text-zinc-100 font-pocketgull-inter">PocketGull Navigation</span>
            </div>
            <button type="button" (click)="isMobileMenuOpen.set(false)" class="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white active:scale-95 cursor-pointer" aria-label="Close Mobile Menu">
              ✕
            </button>
          </div>

          <!-- Clinical Navigation Links (Fitts's Law 48px+ touch targets) -->
          <div class="space-y-2.5">
            <!-- MDCP Governance Hub -->
            <button type="button" (click)="openMdcpHub(); isMobileMenuOpen.set(false);" class="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition cursor-pointer">
              <span class="text-base">📋</span> <span>MDCP Governance Hub</span>
            </button>

            <!-- Ambient Flow Background Music Player -->
            <button type="button" (click)="showAmbientPlayer.set(true); isMobileMenuOpen.set(false);" class="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition cursor-pointer">
              <span class="text-base">🎵</span> <span>Ambient Flow Music Player</span>
            </button>

            <button type="button" (click)="openSocraticRounds.emit(); isMobileMenuOpen.set(false);" class="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition cursor-pointer">
              <span class="text-base">👨‍⚕️</span> <span>Socratic Rounds (House M.D.)</span>
            </button>

            <button type="button" (click)="openKneeHologram.emit(); isMobileMenuOpen.set(false);" class="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800 font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition cursor-pointer">
              <span class="text-base">🩻</span> <span>3D Joint Hologram HUD</span>
            </button>

            <button type="button" (click)="openResearchDividend.emit(); isMobileMenuOpen.set(false);" class="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition cursor-pointer">
              <span class="text-base">🧬</span> <span>Ethical Research Dividend</span>
            </button>

            <button type="button" (click)="openSocraticIntake.emit(); isMobileMenuOpen.set(false);" class="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition cursor-pointer">
              <span class="text-base">✨</span> <span>Socratic Intake Studio</span>
            </button>

            <button type="button" (click)="openCompanionSync.emit(); isMobileMenuOpen.set(false);" class="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition cursor-pointer">
              <span class="text-base">📱</span> <span>Sync Mobile Companion</span>
            </button>

            <button type="button" (click)="openPatientPortal.emit(); isMobileMenuOpen.set(false);" class="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition cursor-pointer">
              <span class="text-base">🩺</span> <span>Patient Self-Service Portal</span>
            </button>

            <button type="button" (click)="openModelGarden.emit(); isMobileMenuOpen.set(false);" class="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition cursor-pointer">
              <span class="text-base">🌿</span> <span>Vertex AI Model Garden</span>
            </button>

            <button type="button" (click)="openSupportTicket.emit(); isMobileMenuOpen.set(false);" class="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition cursor-pointer">
              <span class="text-base">📬</span> <span>Autonomous AI Support</span>
            </button>

            <button type="button" (click)="openBioNetworkQr.emit(); isMobileMenuOpen.set(false);" class="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800 font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition cursor-pointer">
              <span class="text-base">🎵</span> <span>Bio-Network &amp; Audio HUD</span>
            </button>

            <button type="button" (click)="openTalentHrPortal.emit(); isMobileMenuOpen.set(false);" class="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition cursor-pointer">
              <span class="text-base">🤝</span> <span>Join Team &amp; Talent Hub</span>
            </button>

            <button type="button" (click)="openBillingDashboard.emit(); isMobileMenuOpen.set(false);" class="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition cursor-pointer">
              <span class="text-base">💳</span> <span>Billing &amp; Subscription</span>
            </button>

            <button type="button" (click)="openAustereHud.emit(); isMobileMenuOpen.set(false);" class="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition cursor-pointer">
              <span class="text-base">🛡️</span> <span>Austere Research Profile HUD</span>
            </button>

            <button type="button" (click)="triggerSomaticGrounding.emit(); isMobileMenuOpen.set(false);" class="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition cursor-pointer">
              <span class="text-base">🧘</span> <span>Somatic Grounding</span>
            </button>
          </div>

          <!-- Quick Theme & Display Toggles -->
          <div class="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <div class="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Display &amp; Accessibility</div>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" (click)="theme.cycleTheme()" class="min-h-[44px] py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer">
                <span>🎨 {{ theme.currentTheme() }}</span>
              </button>
              <button type="button" (click)="theme.cycleTextSizeScale()" class="min-h-[44px] py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer">
                <span>🔤 {{ theme.textSizeScale() }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Lock Session Footer Button -->
        <div class="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button type="button" (click)="session.lock(); isMobileMenuOpen.set(false);" class="w-full min-h-[48px] py-3.5 bg-zinc-900 dark:bg-zinc-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer shadow-md">
            <span>🔒</span> <span>Lock Session</span>
          </button>
        </div>
      </div>
    }

    <!-- Floating Ambient Flow Player Popover -->
    @if (showAmbientPlayer()) {
      <div class="fixed top-16 right-4 sm:right-6 z-[9999] animate-in fade-in slide-in-from-top-2 duration-200 max-w-[92vw]">
        <div class="relative">
          <button 
            type="button"
            (click)="showAmbientPlayer.set(false)"
            class="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-xs font-bold border border-zinc-700 cursor-pointer shadow-lg"
            title="Close Player"
          >
            ✕
          </button>
          <app-ambient-flow-player />
        </div>
      </div>
    }
  `
})
export class MainHeaderNavComponent {
  network = inject(NetworkStateService);
  state = inject(PatientStateService);
  theme = inject(ThemeService);
  hardware = inject(HardwareTelemetryService);
  game = inject(GamificationService);
  tour = inject(WalkthroughTourService);
  session = inject(SessionStateService);
  soundscapeService = inject(AmbientFlowSoundscapeService);
  navShell = inject(NavigationShellService, { optional: true });

  today = new Date();
  isMobileMenuOpen = signal<boolean>(false);
  isAppsHubOpen = signal<boolean>(false);
  showAmbientPlayer = signal<boolean>(false);

  openTuringSuite = output<void>();
  openSocraticRounds = output<void>();
  openBarrowsWorkbench = output<void>();
  openKneeHologram = output<void>();
  openSmartHealthPass = output<void>();
  openSocraticIntake = output<void>();
  openModelGarden = output<void>();
  openTalentHrPortal = output<void>();
  openCompanionSync = output<void>();
  openBioNetworkQr = output<void>();
  openBillingDashboard = output<void>();
  openApiPricing = output<void>();
  openPatientPortal = output<void>();
  openClinicianOnboarding = output<void>();
  openTypefaceSite = output<void>();
  openDocsStudy = output<void>();
  openSupportTicket = output<void>();
  openComplianceCertificate = output<void>();
  openEncryptedVault = output<void>();
  openSmartFhirSync = output<void>();
  openGlobalHealth = output<void>();
  openArticles = output<void>();
  openResearchDividend = output<void>();
  openPatentClaims = output<void>();
  openAmbientLivingSpace = output<void>();
  openHumanDignityPact = output<void>();
  openDoctorShiftDemo = output<void>();
  openGreenRoom = output<void>();
  openAustereHud = output<void>();
  triggerSomaticGrounding = output<void>();

  openMdcpHub(): void {
    this.navShell?.openMdcpHub();
  }
}



