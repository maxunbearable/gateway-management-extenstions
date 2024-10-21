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

import {
  DevicesConfigMapping,
  ExpressionType,
  LegacyDevicesConfigMapping,
  SocketBasicConfig_v3_5_3,
  SocketConfig,
  SocketLegacyBasicConfig,
} from '../models/public-api';

export class SocketVersionMappingUtil {

  static mapSocketToUpgradedVersion(config: SocketLegacyBasicConfig): SocketConfig {
    const { devices, ...socket } = config ?? {} as SocketLegacyBasicConfig;
    return socket;
  }

  static mapSocketToDowngradedVersion(config: SocketBasicConfig_v3_5_3): SocketLegacyBasicConfig {
    const { devices, socket } = config ?? {};
    return {
      ...socket,
      devices: this.mapDevicesToDowngradedVersion(devices ?? []),
    }
  }

  static mapDevicesToUpgradedVersion(config: SocketLegacyBasicConfig): DevicesConfigMapping[] {
    return config.devices?.map(device => ({
      ...device,
      attributeRequests: device.attributeRequests?.map(request => ({
        ...request,
        requestExpressionSource: this.getExpressionSource(request.requestExpression),
        attributeNameExpressionSource: this.getExpressionSource(request.attributeNameExpression),
      })) ?? []
    })) ?? [] as DevicesConfigMapping[];
  }

  static mapDevicesToDowngradedVersion(devices: DevicesConfigMapping[]): LegacyDevicesConfigMapping[] {
    return devices.map(device => ({
      ...device,
      attributeRequests: device.attributeRequests?.map(({requestExpressionSource, attributeNameExpressionSource, ...request}) => request) ?? []
    })) as DevicesConfigMapping[];
  }

  static getExpressionSource(expression: string): ExpressionType {
    return expression.includes('${') || expression.includes('[') ? ExpressionType.Expression : ExpressionType.Constant;
  }
}