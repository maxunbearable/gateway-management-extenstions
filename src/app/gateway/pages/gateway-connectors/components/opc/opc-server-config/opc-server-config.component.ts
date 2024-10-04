///
/// Copyright © 2024 ThingsBoard, Inc.
///

import { AfterViewInit, ChangeDetectionStrategy, Component, forwardRef, Input, OnDestroy } from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  UntypedFormGroup,
  ValidationErrors,
  Validator,
  Validators
} from '@angular/forms';
import {
  noLeadTrailSpacesRegex,
  SecurityPolicy,
  SecurityPolicyTypes,
  ServerConfig, TruncateWithTooltipDirective
} from '../../../../../shared/public-api';
import { SharedModule, HOUR, coerceBoolean } from '@shared/public-api';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  SecurityConfigComponent
} from '../../security-config/security-config.component';

@Component({
  selector: 'tb-opc-server-config',
  templateUrl: './opc-server-config.component.html',
  styleUrls: ['./opc-server-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OpcServerConfigComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => OpcServerConfigComponent),
      multi: true
    }
  ],
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    SecurityConfigComponent,
    TruncateWithTooltipDirective,
  ]
})
export class OpcServerConfigComponent implements ControlValueAccessor, Validator, AfterViewInit, OnDestroy {

  @Input()
  @coerceBoolean()
  hideNewFields: boolean = false;

  securityPolicyTypes = SecurityPolicyTypes;
  serverConfigFormGroup: UntypedFormGroup;

  onChange!: (value: string) => void;
  onTouched!: () => void;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    this.serverConfigFormGroup = this.fb.group({
      url: ['', [Validators.required, Validators.pattern(noLeadTrailSpacesRegex)]],
      timeoutInMillis: [1000, [Validators.required, Validators.min(1000)]],
      scanPeriodInMillis: [HOUR, [Validators.required, Validators.min(1000)]],
      pollPeriodInMillis: [5000, [Validators.required, Validators.min(50)]],
      enableSubscriptions: [true, []],
      subCheckPeriodInMillis: [100, [Validators.required, Validators.min(100)]],
      showMap: [false, []],
      security: [SecurityPolicy.BASIC128, []],
      identity: []
    });

    this.serverConfigFormGroup.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((value) => {
      this.onChange(value);
      this.onTouched();
    });
  }

  ngAfterViewInit(): void {
    if (this.hideNewFields) {
      this.serverConfigFormGroup.get('pollPeriodInMillis').disable({emitEvent: false});
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  validate(): ValidationErrors | null {
    return this.serverConfigFormGroup.valid ? null : {
      serverConfigFormGroup: { valid: false }
    };
  }

  writeValue(serverConfig: ServerConfig): void {
    const {
      timeoutInMillis = 1000,
      scanPeriodInMillis = HOUR,
      pollPeriodInMillis = 5000,
      enableSubscriptions = true,
      subCheckPeriodInMillis = 100,
      showMap = false,
      security = SecurityPolicy.BASIC128,
      identity = {},
    } = serverConfig;

    this.serverConfigFormGroup.reset({
      ...serverConfig,
      timeoutInMillis,
      scanPeriodInMillis,
      pollPeriodInMillis,
      enableSubscriptions,
      subCheckPeriodInMillis,
      showMap,
      security,
      identity,
    }, { emitEvent: false });
  }
}
