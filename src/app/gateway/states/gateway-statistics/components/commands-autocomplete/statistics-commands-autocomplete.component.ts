///
/// Copyright © 2016-2024 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import { Component, ElementRef, forwardRef, input, output, ViewChild } from '@angular/core';
import {
  ControlValueAccessor,
  UntypedFormBuilder,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { combineLatest, Observable, of, shareReplay, withLatestFrom } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { SharedModule, TruncatePipe } from '@shared/public-api';
import { GatewayConfigCommand } from '../../../../shared/models/public-api';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { isEqual } from '@core/public-api';

@Component({
  selector: 'tb-statistics-commands-autocomplete',
  templateUrl: './statistics-commands-autocomplete.component.html',
  styleUrls: ['./statistics-commands-autocomplete.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => StatisticsCommandsAutocompleteComponent),
    multi: true
  }],
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
  ]
})
export class StatisticsCommandsAutocompleteComponent implements ControlValueAccessor {

  @ViewChild('commandInput', { static: true }) commandInput: ElementRef;

  commands = input<GatewayConfigCommand[]>();

  onCreateNewClicked = output<GatewayConfigCommand>();
  onEditClicked = output<GatewayConfigCommand>();
  onDeleteClicked = output<GatewayConfigCommand>();

  selectStatisticsCommandControl = this.fb.control({});

  searchText$: Observable<string> = this.selectStatisticsCommandControl.valueChanges
      .pipe(
          map(value => value ? (typeof value === 'string' ? value : value?.attributeOnGateway) : ''),
          distinctUntilChanged(),
          shareReplay(1)
      );

  filteredCommands$: Observable<GatewayConfigCommand[]> = combineLatest([this.selectStatisticsCommandControl.valueChanges, toObservable(this.commands)])
      .pipe(
          debounceTime(150),
          tap(([value, commands]: [GatewayConfigCommand | string, GatewayConfigCommand[]]) => {
            const newValue = commands.find(command => command.attributeOnGateway === value || command.attributeOnGateway === (value as GatewayConfigCommand)?.attributeOnGateway) ?? null;
            if (typeof value !== 'string' || newValue?.attributeOnGateway === value) {
              this.selectStatisticsCommandControl.patchValue(newValue, { emitEvent: !isEqual(newValue, value) });
            }
          }),
          map(([_, commands]) => commands),
          withLatestFrom(this.searchText$),
          switchMap(([commands, value]) => of(commands.filter(command => command.attributeOnGateway.toLowerCase().includes(value?.toLowerCase() ?? '')))),
          shareReplay(1)
      );

  private onChanges = (_: GatewayConfigCommand | string) => {};

  constructor(public translate: TranslateService,
              public truncate: TruncatePipe,
              private fb: UntypedFormBuilder) {
    this.selectStatisticsCommandControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(value => this.onChanges(value));
  }

  registerOnChange(fn: (value: GatewayConfigCommand | string) => {}): void {
    this.onChanges = fn;
  }

  registerOnTouched(_: () => {}): void {}

  writeValue(value: GatewayConfigCommand | null): void {
    this.selectStatisticsCommandControl.patchValue(value);
  }

  displayCommandFn(command?: GatewayConfigCommand): string | null {
    return command ? command.attributeOnGateway : null;
  }

  clear(): void {
    this.selectStatisticsCommandControl.patchValue(null, { emitEvent: true });
    setTimeout(() => {
      this.commandInput.nativeElement.blur();
      this.commandInput.nativeElement.focus();
    }, 0);
  }

  onEditClick(event: MouseEvent): void {
    event.stopPropagation();
    this.onEditClicked.emit(this.selectStatisticsCommandControl.value);
  }

  onDeleteClick(event: MouseEvent): void {
    event.stopPropagation();
    this.onDeleteClicked.emit(this.selectStatisticsCommandControl.value);
  }

  onCreateNewClick(event: MouseEvent): void {
    event.stopPropagation();
    this.onCreateNewClicked.emit({ attributeOnGateway: this.selectStatisticsCommandControl.value } as GatewayConfigCommand);
  }
}
