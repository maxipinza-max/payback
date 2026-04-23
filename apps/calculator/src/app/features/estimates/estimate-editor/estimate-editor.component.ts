import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { EstimateStore } from '../../../core/services/estimate.store';
import { StorageService } from '../../../core/services/storage.service';
import { PhaseItemComponent } from '../phase-item/phase-item.component';
import { EstimateSummaryComponent } from '../estimate-summary/estimate-summary.component';
import { CURRENCIES, SupportedCurrency } from '@kaufmann-lab-calculator/shared-types';

@Component({
  selector: 'app-estimate-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PhaseItemComponent, EstimateSummaryComponent],
  templateUrl: './estimate-editor.component.html',
  styleUrl: './estimate-editor.component.scss',
})
export class EstimateEditorComponent implements OnInit {
  store = inject(EstimateStore);
  route = inject(ActivatedRoute);
  router = inject(Router);
  storage = inject(StorageService);

  currencies = Object.entries(CURRENCIES) as [SupportedCurrency, any][];
  form!: FormGroup;
  saved = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.load(id);
    } else {
      this.store.new();
    }

    const e = this.store.estimate();
    this.form = new FormGroup({
      name: new FormControl(e.name),
      client: new FormControl(e.client ?? ''),
      description: new FormControl(e.description ?? ''),
      globalHourlyRate: new FormControl(e.globalHourlyRate),
      currency: new FormControl(e.currency),
    });

    this.form.valueChanges.subscribe((v) => {
      this.store.updateHeader(v);
      this.saved = false;
    });
  }

  get estimate() { return this.store.estimate(); }

  addPhase(): void {
    this.store.addPhase();
  }

  saveEstimate(): void {
    this.store.save();
    this.saved = true;
    if (this.router.url === '/estimates/new') {
      this.router.navigate(['/estimates', this.estimate.id]);
    }
  }

  exportJson(): void {
    this.storage.exportJson(this.estimate);
  }
}
