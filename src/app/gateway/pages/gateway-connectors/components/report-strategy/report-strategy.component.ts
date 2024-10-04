///
/// Copyright © 2024 ThingsBoard, Inc.
///

import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  Input,
  OnDestroy,
} from '@angular/core';
import { Subject } from 'rxjs';
import {
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  UntypedFormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {
  ReportStrategyConfig,
  ReportStrategyDefaultValue,
  ReportStrategyType,
  ReportStrategyTypeTranslationsMap, TruncateWithTooltipDirective
} from '../../../../shared/public-api';
import { filter, takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { coerceBoolean, coerceNumber, SharedModule } from '@shared/public-api';

@Component({
  selector: 'tb-report-strategy',
  templateUrl: './report-strategy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ReportStrategyComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ReportStrategyComponent),
      multi: true
    }
  ],
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    TruncateWithTooltipDirective,
  ]
})
export class ReportStrategyComponent implements ControlValueAccessor, OnDestroy {

  @coerceBoolean()
  @Input() isExpansionMode = false;

  @coerceNumber()
  @Input() defaultValue = ReportStrategyDefaultValue.Key;

  reportStrategyFormGroup: UntypedFormGroup;
  showStrategyControl: FormControl<boolean>;

  readonly reportStrategyTypes = Object.values(ReportStrategyType);
  readonly ReportTypeTranslateMap = ReportStrategyTypeTranslationsMap;
  readonly ReportStrategyType = ReportStrategyType;

  private onChange: (value: ReportStrategyConfig) => void;
  private onTouched: () => void;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    this.showStrategyControl = this.fb.control(false);

    this.reportStrategyFormGroup = this.fb.group({
      type: [{ value: ReportStrategyType.OnReportPeriod, disabled: true }, []],
      reportPeriod: [{ value: this.defaultValue, disabled: true }, [Validators.required]],
    });

    this.observeStrategyFormChange();
    this.observeStrategyToggle();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  writeValue(reportStrategyConfig: ReportStrategyConfig): void {
    if (this.isExpansionMode) {
      this.showStrategyControl.setValue(!!reportStrategyConfig, {emitEvent: false});
    }
    if (reportStrategyConfig) {
      this.reportStrategyFormGroup.enable({emitEvent: false});
    }
    const { type = ReportStrategyType.OnReportPeriod, reportPeriod = this.defaultValue } = reportStrategyConfig ?? {};
    this.reportStrategyFormGroup.setValue({ type, reportPeriod }, {emitEvent: false});
    this.onTypeChange(type);
  }

  validate(): ValidationErrors | null {
    return this.reportStrategyFormGroup.valid || this.reportStrategyFormGroup.disabled ? null : {
      reportStrategyForm: { valid: false }
    };
  }

  registerOnChange(fn: (value: ReportStrategyConfig) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  private observeStrategyFormChange(): void {
    this.reportStrategyFormGroup.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((value) => {
      this.onChange(value);
      this.onTouched();
    });

    this.reportStrategyFormGroup.get('type').valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => this.onTypeChange(type));
  }

  private observeStrategyToggle(): void {
    this.showStrategyControl.valueChanges
      .pipe(takeUntil(this.destroy$), filter(() => this.isExpansionMode))
      .subscribe(enable => {
        if (enable) {
          this.reportStrategyFormGroup.enable({emitEvent: false});
          this.reportStrategyFormGroup.get('reportPeriod').addValidators(Validators.required);
          this.onChange(this.reportStrategyFormGroup.value);
        } else {
          this.reportStrategyFormGroup.disable({emitEvent: false});
          this.reportStrategyFormGroup.get('reportPeriod').removeValidators(Validators.required);
          this.onChange(null);
        }
        this.reportStrategyFormGroup.updateValueAndValidity({emitEvent: false});
      });
  }

  private onTypeChange(type: ReportStrategyType): void {
    const reportPeriodControl = this.reportStrategyFormGroup.get('reportPeriod');

    if (type === ReportStrategyType.OnChange) {
      reportPeriodControl.disable({emitEvent: false});
    } else if (!this.isExpansionMode || this.showStrategyControl.value) {
      reportPeriodControl.enable({emitEvent: false});
    }
  }
}
