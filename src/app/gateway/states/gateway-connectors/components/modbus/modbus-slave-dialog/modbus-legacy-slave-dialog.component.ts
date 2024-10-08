///
/// Copyright © 2024 ThingsBoard, Inc.
///

import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  FormBuilder,
} from '@angular/forms';
import {
  LegacySlaveConfig,
  ModbusProtocolType,
  ModbusSlaveInfo,
  GatewayPortTooltipPipe
} from '../../../../../shared/public-api';
import { SharedModule } from '@shared/public-api';
import { CommonModule } from '@angular/common';
import { ModbusValuesComponent } from '../modbus-values/modbus-values.component';
import { ModbusSecurityConfigComponent } from '../modbus-security-config/modbus-security-config.component';
import { Store } from '@ngrx/store';
import { AppState } from '@core/public-api';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  ReportStrategyComponent
} from '../../report-strategy/report-strategy.component';
import {
  ModbusSlaveDialogAbstract
} from './modbus-slave-dialog.abstract';

@Component({
  selector: 'tb-modbus-legacy-slave-dialog',
  templateUrl: './modbus-slave-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    ModbusValuesComponent,
    ModbusSecurityConfigComponent,
    GatewayPortTooltipPipe,
    ReportStrategyComponent,
  ],
  styleUrls: ['./modbus-slave-dialog.component.scss'],
})
export class ModbusLegacySlaveDialogComponent extends ModbusSlaveDialogAbstract<ModbusLegacySlaveDialogComponent, LegacySlaveConfig> {

  constructor(
    protected fb: FormBuilder,
    protected store: Store<AppState>,
    protected router: Router,
    @Inject(MAT_DIALOG_DATA) public data: ModbusSlaveInfo,
    public dialogRef: MatDialogRef<ModbusLegacySlaveDialogComponent, LegacySlaveConfig>,
  ) {
    super(fb, store, router, data, dialogRef);
  }

  protected override getSlaveResultData(): LegacySlaveConfig {
    const { values, type, serialPort, ...rest } = this.slaveConfigFormGroup.value;
    const slaveResult = { ...rest, type, ...values };

    if (type === ModbusProtocolType.Serial) {
      slaveResult.port = serialPort;
    }

    return slaveResult;
  }

  protected override addFieldsToFormGroup(): void {
    this.slaveConfigFormGroup.addControl('sendDataOnlyOnChange', this.fb.control(false));
  }
}