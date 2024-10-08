///
/// Copyright © 2024 ThingsBoard, Inc.
///

import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { DataKeyType, PageLink, Direction, SortOrder } from '@shared/public-api';
import { WidgetContext } from '@home/models/widget-component.models';
import { GatewayLogData, LogLink, GatewayStatus } from '../../shared/models/gateway.models';

@Component({
  selector: 'tb-gateway-logs',
  templateUrl: './gateway-logs.component.html',
  styleUrls: ['./gateway-logs.component.scss']
})
export class GatewayLogsComponent implements OnInit, AfterViewInit {

  pageLink: PageLink;

  dataSource: MatTableDataSource<GatewayLogData>;

  displayedColumns = ['ts', 'status', 'message'];

  @Input()
  ctx: WidgetContext;

  @Input()
  dialogRef: MatDialogRef<any>;

  @ViewChild('searchInput') searchInputField: ElementRef;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  textSearchMode: boolean;

  logLinks: Array<LogLink>;

  activeLink: LogLink;

  gatewayLogLinks: Array<LogLink> = [
    {
      name: 'General',
      key: 'LOGS'
    }, {
      name: 'Service',
      key: 'SERVICE_LOGS'
    },
    {
      name: 'Connection',
      key: 'CONNECTION_LOGS'
    }, {
      name: 'Storage',
      key: 'STORAGE_LOGS'
    },
    {
      key: 'EXTENSIONS_LOGS',
      name: 'Extension'
    }];


  constructor() {
    const sortOrder: SortOrder = {property: 'ts', direction: Direction.DESC};
    this.pageLink = new PageLink(10, 0, null, sortOrder);
    this.dataSource = new MatTableDataSource<GatewayLogData>([]);
  }

  ngOnInit(): void {
    this.updateWidgetTitle();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.ctx.defaultSubscription.onTimewindowChangeFunction = timewindow => {
      this.ctx.defaultSubscription.options.timeWindowConfig = timewindow;
      this.ctx.defaultSubscription.updateDataSubscriptions();
      return timewindow;
    };
    if (this.ctx.settings.isConnectorLog && this.ctx.settings.connectorLogState) {
      const connector = this.ctx.stateController.getStateParams()[this.ctx.settings.connectorLogState];
      this.logLinks = [{
        key: `${connector.key}_LOGS`,
        name: 'Connector',
        filterFn: (attrData) => !attrData.message.includes(`_converter.py`)
      }, {
        key: `${connector.key}_LOGS`,
        name: 'Converter',
        filterFn: (attrData) => attrData.message.includes(`_converter.py`)
      }];
    } else {
      this.logLinks = this.gatewayLogLinks;
    }
    this.activeLink = this.logLinks[0];
    this.changeSubscription();
  }

  private updateWidgetTitle(): void {
    if (this.ctx.settings.isConnectorLog && this.ctx.settings.connectorLogState) {
      const widgetTitle = this.ctx.widgetConfig.title;
      const titlePlaceholder = '${connectorName}';
      if (widgetTitle.includes(titlePlaceholder)) {
        const connector = this.ctx.stateController.getStateParams()[this.ctx.settings.connectorLogState];
        this.ctx.widgetTitle = widgetTitle.replace(titlePlaceholder, connector.key);
      }
    }
  }


  private updateData() {
    if (this.ctx.defaultSubscription.data.length && this.ctx.defaultSubscription.data[0]) {
      let attrData = this.ctx.defaultSubscription.data[0].data.map(data => {
        const result = {
          ts: data[0],
          key: this.activeLink.key,
          message: data[1],
          status: 'INVALID LOG FORMAT' as GatewayStatus
        };

        try {
          result.message = /\[(.*)/.exec(data[1])[0];
        } catch (e) {
          result.message = data[1];
        }

        try {
          result.status = data[1].match(/\|(\w+)\|/)[1];
        } catch (e) {
          result.status = 'INVALID LOG FORMAT' as GatewayStatus;
        }

        return result;
      });
      if (this.activeLink.filterFn) {
        attrData = attrData.filter(data => this.activeLink.filterFn(data));
      }
      this.dataSource.data = attrData;
    }
  }

  onTabChanged(link: LogLink) {
    this.activeLink = link;
    this.changeSubscription();
  }

  statusClass(status: GatewayStatus): string {
    switch (status) {
      case GatewayStatus.DEBUG:
        return 'status status-debug';
      case GatewayStatus.WARNING:
        return 'status status-warning';
      case GatewayStatus.ERROR:
      case GatewayStatus.EXCEPTION:
        return 'status status-error';
      default:
        return 'status status-info';
    }
  }

  statusClassMsg(status?: GatewayStatus): string {
    if (status === GatewayStatus.EXCEPTION) {
      return 'msg-status-exception';
    }
  }

  trackByLogTs(_: number, log: GatewayLogData): number {
    return log.ts;
  }

  private changeSubscription() {
    if (this.ctx.datasources && this.ctx.datasources[0].entity && this.ctx.defaultSubscription.options.datasources) {
      this.ctx.defaultSubscription.options.datasources[0].dataKeys = [{
        name: this.activeLink.key,
        type: DataKeyType.timeseries,
        settings: {}
      }];
      this.ctx.defaultSubscription.unsubscribe();
      this.ctx.defaultSubscription.updateDataSubscriptions();
      this.ctx.defaultSubscription.callbacks.onDataUpdated = () => {
        this.updateData();
      };
    }
  }
}