import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagnosticScan } from '../services/patient.types';

@Component({
    selector: 'app-patient-scans',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      @for(scan of scans(); track scan.id) {
        <div class="bg-white border rounded-lg overflow-hidden flex flex-col hover:border-gray-300 transition-colors shadow-sm group">
          @if (scan.imageUrl) {
             <div class="h-40 bg-gray-100 relative overflow-hidden flex-shrink-0 border-b border-gray-100">
               <!-- Subtle zoom effect on hover -->
               <img [src]="scan.imageUrl" [alt]="scan.title" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
               <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
               
               <!-- View Fullscreen Button -->
               <div class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button class="bg-white/90 backdrop-blur text-gray-800 p-1.5 rounded shadow-sm hover:bg-white transition-colors cursor-pointer" title="View Scan">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                  </button>
               </div>

               <div class="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border"
                 [class.bg-green-50]="scan.status === 'Normal'" [class.text-green-700]="scan.status === 'Normal'" [class.border-green-200]="scan.status === 'Normal'"
                 [class.bg-red-50]="scan.status === 'Abnormal'" [class.text-red-700]="scan.status === 'Abnormal'" [class.border-red-200]="scan.status === 'Abnormal'"
                 [class.bg-yellow-50]="scan.status === 'Pending'" [class.text-yellow-700]="scan.status === 'Pending'" [class.border-yellow-200]="scan.status === 'Pending'"
                 [class.bg-blue-50]="scan.status === 'Reviewed'" [class.text-blue-700]="scan.status === 'Reviewed'" [class.border-blue-200]="scan.status === 'Reviewed'"
               >
                 {{ scan.status }}
               </div>
             </div>
          } @else {
             <div class="h-40 bg-[#F9FAFB] flex items-center justify-center relative overflow-hidden flex-shrink-0 border-b border-gray-100">
               <div class="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-2">
                 <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
               </div>
               <div class="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border"
                 [class.bg-green-50]="scan.status === 'Normal'" [class.text-green-700]="scan.status === 'Normal'" [class.border-green-200]="scan.status === 'Normal'"
                 [class.bg-red-50]="scan.status === 'Abnormal'" [class.text-red-700]="scan.status === 'Abnormal'" [class.border-red-200]="scan.status === 'Abnormal'"
                 [class.bg-yellow-50]="scan.status === 'Pending'" [class.text-yellow-700]="scan.status === 'Pending'" [class.border-yellow-200]="scan.status === 'Pending'"
                 [class.bg-blue-50]="scan.status === 'Reviewed'" [class.text-blue-700]="scan.status === 'Reviewed'" [class.border-blue-200]="scan.status === 'Reviewed'"
               >
                 {{ scan.status }}
               </div>
             </div>
          }
          
          <div class="p-4 flex flex-col flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1C1C1C] text-white uppercase tracking-[0.15em] shadow-sm">{{ scan.type }}</span>
              <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{{ scan.date }}</span>
            </div>
            <h4 class="text-sm font-bold text-[#1C1C1C] leading-tight mb-2 uppercase tracking-wide">{{ scan.title }}</h4>
            <p class="text-xs text-gray-600 line-clamp-3 leading-relaxed flex-1 font-light">{{ scan.description }}</p>
          </div>
        </div>
      } @empty {
        <div class="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
           <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><polyline points="14 2 14 8 20 8"/></svg>
           <p class="text-xs font-bold uppercase tracking-[0.15em] text-gray-500">No Scans or Diagnostics Available</p>
           <p class="text-[10px] uppercase tracking-widest text-gray-400 mt-1">Patient records empty</p>
        </div>
      }
    </div>
  `
})
export class PatientScansComponent {
    scans = input<DiagnosticScan[]>([]);
}
