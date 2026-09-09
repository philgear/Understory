import { Injectable, signal } from '@angular/core';

export type MainTabType = 'chart' | 'analysis' | 'intake' | 'directory' | 'research' | 'tasks' | 'settings';

@Injectable({
  providedIn: 'root'
})
export class NavigationShellService {
  /** Active main shell tab. Defaults to clinical chart. */
  readonly activeTab = signal<MainTabType>('chart');

  /** Modal visibility states. */
  readonly showGlossaryModal = signal<boolean>(false);
  readonly showCompanionSyncModal = signal<boolean>(false);
  readonly showFhirCallback = signal<boolean>(false);
  readonly showApiKeyModal = signal<boolean>(false);
  readonly showPatientDirectoryModal = signal<boolean>(false);
  readonly showDictationModal = signal<boolean>(false);
  readonly showBarrowsWorkbenchModal = signal<boolean>(false);
  readonly showComplianceCertificateModal = signal<boolean>(false);
  readonly showCmsSuperbillModal = signal<boolean>(false);
  readonly showTrajectoryReaderModal = signal<boolean>(false);
  readonly showAustereHudModal = signal<boolean>(false);
  readonly showMdcpHubModal = signal<boolean>(false);

  /**
   * Switches active main tab.
   */
  public selectTab(tab: MainTabType): void {
    this.activeTab.set(tab);
  }

  /**
   * Toggles modal overlays.
   */
  public openGlossary(): void { this.showGlossaryModal.set(true); }
  public closeGlossary(): void { this.showGlossaryModal.set(false); }

  public openCompanionSync(): void { this.showCompanionSyncModal.set(true); }
  public closeCompanionSync(): void { this.showCompanionSyncModal.set(false); }

  public openApiKeyModal(): void { this.showApiKeyModal.set(true); }
  public closeApiKeyModal(): void { this.showApiKeyModal.set(false); }

  public openDictation(): void { this.showDictationModal.set(true); }
  public closeDictation(): void { this.showDictationModal.set(false); }

  public openBarrowsWorkbench(): void { this.showBarrowsWorkbenchModal.set(true); }
  public closeBarrowsWorkbench(): void { this.showBarrowsWorkbenchModal.set(false); }

  public openComplianceCertificate(): void { this.showComplianceCertificateModal.set(true); }
  public closeComplianceCertificate(): void { this.showComplianceCertificateModal.set(false); }

  public openCmsSuperbill(): void { this.showCmsSuperbillModal.set(true); }
  public closeCmsSuperbill(): void { this.showCmsSuperbillModal.set(false); }

  public openTrajectoryReader(): void { this.showTrajectoryReaderModal.set(true); }
  public closeTrajectoryReader(): void { this.showTrajectoryReaderModal.set(false); }

  public openAustereHud(): void { this.showAustereHudModal.set(true); }
  public closeAustereHud(): void { this.showAustereHudModal.set(false); }

  public openMdcpHub(): void { this.showMdcpHubModal.set(true); }
  public closeMdcpHub(): void { this.showMdcpHubModal.set(false); }

  /**
   * Resets active shell tab to 'chart', closes all active modal overlays, and returns home.
   */
  public navigateWayBackHome(): void {
    this.activeTab.set('chart');
    this.showGlossaryModal.set(false);
    this.showCompanionSyncModal.set(false);
    this.showFhirCallback.set(false);
    this.showApiKeyModal.set(false);
    this.showPatientDirectoryModal.set(false);
    this.showDictationModal.set(false);
    this.showBarrowsWorkbenchModal.set(false);
    this.showComplianceCertificateModal.set(false);
    this.showCmsSuperbillModal.set(false);
    this.showTrajectoryReaderModal.set(false);
    this.showAustereHudModal.set(false);
    this.showMdcpHubModal.set(false);
  }
}
