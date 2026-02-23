import { Component, ChangeDetectionStrategy, inject, signal, effect, viewChild, ElementRef, OnDestroy, AfterViewInit, Output, EventEmitter, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PatientStateService } from '../services/patient-state.service';

@Component({
    selector: 'app-body-3d-viewer',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div #canvasContainer class="w-full h-full relative cursor-grab active:cursor-grabbing">
      <div class="absolute bottom-2 left-2 flex flex-col gap-1 pointer-events-none">
        <span class="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Left Click: Select Part</span>
        <span class="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Right Click: Orbit</span>
      </div>
    </div>
  `,
    styles: [`
    :host { display: block; height: 100%; width: 100%; }
    canvas { outline: none; }
  `]
})
export class Body3DViewerComponent implements AfterViewInit, OnDestroy {
    private readonly state = inject(PatientStateService);
    private readonly canvasContainer = viewChild<ElementRef<HTMLDivElement>>('canvasContainer');

    @Output() partSelected = new EventEmitter<{ id: string, name: string }>();

    // Inputs for external control
    rotation = input<number>(0);
    zoom = input<number>(1);
    isInternal = input<boolean>(false);

    private renderer!: THREE.WebGLRenderer;
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private controls!: OrbitControls;
    private mannequinGroup!: THREE.Group;
    private parts: Map<string, THREE.Mesh> = new Map();
    private raycaster = new THREE.Raycaster();
    private mouse = new THREE.Vector2();
    private animationFrameId?: number;

    constructor() {
        // React to selection changes in the state
        effect(() => {
            const selectedId = this.state.selectedPartId();
            this.updatePartColors();
        });

        // React to issue changes (pain levels)
        effect(() => {
            const issues = this.state.issues();
            this.updatePartColors();
        });

        // React to internal/external view toggle
        effect(() => {
            const internal = this.isInternal();
            this.updateTransparency(internal);
        });
    }

    ngAfterViewInit() {
        this.initScene();
        this.createMannequin();
        this.startAnimation();
        this.setupInteractions();
    }

    ngOnDestroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.renderer.dispose();
    }

    private initScene() {
        const container = this.canvasContainer()!.nativeElement;
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff);

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 1.2, 5);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
        backLight.position.set(-5, 5, -5);
        this.scene.add(backLight);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 10;
        this.controls.target.set(0, 1, 0);
    }

    private createMannequin() {
        this.mannequinGroup = new THREE.Group();
        this.scene.add(this.mannequinGroup);

        // Common material
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0xfdfdfd,
            roughness: 0.5,
            metalness: 0.1,
            transparent: true,
            opacity: 0.9
        });

        // Head
        this.addPart('head', new THREE.SphereGeometry(0.25, 32, 24), baseMaterial, { y: 1.75 });

        // Neck
        this.addPart('neck', new THREE.CylinderGeometry(0.08, 0.1, 0.15), baseMaterial, { y: 1.55 });

        // Torso (Upper/Chest)
        this.addPart('chest', new THREE.BoxGeometry(0.5, 0.45, 0.3), baseMaterial, { y: 1.3 });

        // Abdomen
        this.addPart('abdomen', new THREE.BoxGeometry(0.45, 0.3, 0.28), baseMaterial, { y: 0.95 });

        // Pelvis
        this.addPart('pelvis', new THREE.BoxGeometry(0.48, 0.25, 0.3), baseMaterial, { y: 0.7 });

        // Arms
        // Right
        this.addPart('r_shoulder', new THREE.SphereGeometry(0.12, 16, 16), baseMaterial, { x: -0.32, y: 1.45 });
        this.addPart('r_arm', new THREE.CylinderGeometry(0.06, 0.05, 0.5), baseMaterial, { x: -0.42, y: 1.15, z: 0.05, rx: 0.1 });
        this.addPart('r_hand', new THREE.BoxGeometry(0.08, 0.15, 0.05), baseMaterial, { x: -0.5, y: 0.82, rx: 0.2 });

        // Left
        this.addPart('l_shoulder', new THREE.SphereGeometry(0.12, 16, 16), baseMaterial, { x: 0.32, y: 1.45 });
        this.addPart('l_arm', new THREE.CylinderGeometry(0.06, 0.05, 0.5), baseMaterial, { x: 0.42, y: 1.15, z: 0.05, rx: 0.1 });
        this.addPart('l_hand', new THREE.BoxGeometry(0.08, 0.15, 0.05), baseMaterial, { x: 0.5, y: 0.82, rx: 0.2 });

        // Legs
        // Right
        this.addPart('r_thigh', new THREE.CylinderGeometry(0.14, 0.1, 0.6), baseMaterial, { x: -0.18, y: 0.35 });
        this.addPart('r_shin', new THREE.CylinderGeometry(0.09, 0.06, 0.6), baseMaterial, { x: -0.18, y: -0.25 });
        this.addPart('r_foot', new THREE.BoxGeometry(0.15, 0.08, 0.25), baseMaterial, { x: -0.18, y: -0.58, z: 0.05 });

        // Left
        this.addPart('l_thigh', new THREE.CylinderGeometry(0.14, 0.1, 0.6), baseMaterial, { x: 0.18, y: 0.35 });
        this.addPart('l_shin', new THREE.CylinderGeometry(0.09, 0.06, 0.6), baseMaterial, { x: 0.18, y: -0.25 });
        this.addPart('l_foot', new THREE.BoxGeometry(0.15, 0.08, 0.25), baseMaterial, { x: 0.18, y: -0.58, z: 0.05 });

        this.updatePartColors();
    }

    private addPart(id: string, geometry: THREE.BufferGeometry, material: THREE.Material, pos: { x?: number, y?: number, z?: number, rx?: number, ry?: number, rz?: number }) {
        const mesh = new THREE.Mesh(geometry, material.clone());
        mesh.position.set(pos.x || 0, pos.y || 0, pos.z || 0);
        if (pos.rx) mesh.rotation.x = pos.rx;
        if (pos.ry) mesh.rotation.y = pos.ry;
        if (pos.rz) mesh.rotation.z = pos.rz;
        mesh.userData['id'] = id;
        this.mannequinGroup.add(mesh);
        this.parts.set(id, mesh);
    }

    private updatePartColors() {
        const selectedId = this.state.selectedPartId();
        const issues = this.state.issues();

        this.parts.forEach((mesh, id) => {
            const material = mesh.material as THREE.MeshStandardMaterial;
            const issuesForPart = issues[id] || [];
            const maxPain = issuesForPart.reduce((max, issue) => Math.max(max, issue.painLevel), 0);

            const isSelected = selectedId === id;

            // Base Visualization Styling (Industrial Rams / Tricorder feel)
            if (maxPain > 0) {
                // Warning state (Pain) - Use the UI's existing red/amber scale conceptually
                const intensity = maxPain / 10;
                material.color.setRGB(1, 1 - intensity * 0.6, 1 - intensity * 0.6); // Less saturated, muted red
            } else {
                // Default unselected state - strict minimalist white/gray
                material.color.setHex(0xfdfdfd);
            }

            // Selection Bracket Styling
            if (isSelected) {
                // "Task Bracketing" active state: Dark with high-contrast accent
                material.color.setHex(0x1C1C1C);       // Obsidian base
                material.emissive.setHex(0x76B362);    // Understory Green accent
                material.emissiveIntensity = 0.4;      // Glow effect indicating active focus
                material.opacity = 0.95;               // Solidify the selected part
            } else {
                // Normal/Inactive state
                material.emissive.setHex(0x000000);
                material.emissiveIntensity = 0;
                // Maintain transparency context
                material.opacity = this.isInternal() ? 0.2 : 0.85;
            }
        });
    }

    private updateTransparency(internal: boolean) {
        this.parts.forEach(mesh => {
            const material = mesh.material as THREE.MeshStandardMaterial;
            material.opacity = internal ? 0.3 : 0.9;
        });
    }

    private setupInteractions() {
        const canvas = this.renderer.domElement;

        let startX = 0;
        let startY = 0;

        canvas.addEventListener('pointerdown', (event: PointerEvent) => {
            if (event.button !== 0) return;
            startX = event.clientX;
            startY = event.clientY;
            console.log('Body3DViewer: pointerdown', { startX, startY });
        });

        canvas.addEventListener('pointerup', (event: PointerEvent) => {
            if (event.button !== 0) return;

            const deltaX = Math.abs(event.clientX - startX);
            const deltaY = Math.abs(event.clientY - startY);
            console.log('Body3DViewer: pointerup', { deltaX, deltaY, clientX: event.clientX, clientY: event.clientY });

            // Increase threshold to 10px to be more forgiving of slight movements
            if (deltaX < 10 && deltaY < 10) {
                const rect = canvas.getBoundingClientRect();
                this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                this.raycaster.setFromCamera(this.mouse, this.camera);
                const intersects = this.raycaster.intersectObjects(this.mannequinGroup.children, true);
                if (intersects.length > 0) {
                    // Find the mesh object that has the userData.id
                    let object: THREE.Object3D | null = intersects[0].object;
                    while (object && !object.userData['id']) {
                        object = object.parent;
                    }

                    if (object && object.userData['id']) {
                        const id = object.userData['id'];
                        const name = this.getPartName(id);
                        this.partSelected.emit({ id, name });
                    }
                }
            }
        });

        window.addEventListener('resize', () => {
            const container = this.canvasContainer()?.nativeElement;
            if (!container) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        });
    }

    private getPartName(id: string): string {
        const names: Record<string, string> = {
            'head': 'Head & Neck',
            'chest': 'Chest & Upper Torso',
            'abdomen': 'Abdomen & Stomach',
            'pelvis': 'Pelvis & Hips',
            'r_shoulder': 'Right Shoulder',
            'r_arm': 'Right Arm',
            'r_hand': 'Right Hand & Wrist',
            'l_shoulder': 'Left Shoulder',
            'l_arm': 'Left Arm',
            'l_hand': 'Left Hand & Wrist',
            'r_thigh': 'Right Thigh',
            'r_shin': 'Right Lower Leg',
            'r_foot': 'Right Foot',
            'l_thigh': 'Left Thigh',
            'l_shin': 'Left Lower Leg',
            'l_foot': 'Left Foot'
        };
        return names[id] || id;
    }

    private startAnimation() {
        const animate = () => {
            this.animationFrameId = requestAnimationFrame(animate);
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };
        animate();
    }
}
