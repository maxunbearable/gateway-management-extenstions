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

import { Pipe, PipeTransform } from '@angular/core';
import {
  OPCUaSourceType,
  SourceType
} from '../models/public-api';
import { MappingValueType } from '../../../shared/models/public-api';

@Pipe({
  name: 'getConnectorMappingHelpLink',
  standalone: true,
})
export class ConnectorMappingHelpLinkPipe implements PipeTransform {
  transform(field: string, sourceType: SourceType | OPCUaSourceType, sourceTypes?: Array<SourceType | OPCUaSourceType | MappingValueType> ): string {
    if (!sourceTypes || sourceTypes?.includes(OPCUaSourceType.PATH)) {
      if (sourceType !== OPCUaSourceType.CONST) {
        return `widget/lib/gateway/${field}-${sourceType}_fn`;
      } else {
        return;
      }
    } else if (field === 'attributes' || field === 'timeseries') {
      return 'widget/lib/gateway/attributes_timeseries_expressions_fn';
    }
    return 'widget/lib/gateway/expressions_fn';
  }
}
