///
/// Copyright © 2024 ThingsBoard, Inc.
///

import { CollectionViewer, DataSource, SelectionModel } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, of, ReplaySubject } from 'rxjs';
import { catchError, map, publishReplay, refCount, take, tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import {
  AttributeData,
  AttributeScope,
  isClientSideTelemetryType,
  TelemetrySubscriber,
  TelemetryType,
  PageLink,
  EntityId,
  emptyPageData,
  PageData
} from '@shared/public-api';
import { AttributeService, TelemetryWebsocketService } from '@core/public-api';
import { NgZone } from '@angular/core';

export class AttributeDatasource implements DataSource<AttributeData> {

  private attributesSubject = new BehaviorSubject<AttributeData[]>([]);
  private pageDataSubject = new BehaviorSubject<PageData<AttributeData>>(emptyPageData<AttributeData>());

  public pageData$ = this.pageDataSubject.asObservable();

  public selection = new SelectionModel<AttributeData>(true, []);

  private allAttributes: Observable<Array<AttributeData>>;
  private telemetrySubscriber: TelemetrySubscriber;

  constructor(private attributeService: AttributeService,
              private telemetryWsService: TelemetryWebsocketService,
              private zone: NgZone,
              private translate: TranslateService) {}

  connect(collectionViewer: CollectionViewer): Observable<AttributeData[] | ReadonlyArray<AttributeData>> {
    return this.attributesSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.attributesSubject.complete();
    this.pageDataSubject.complete();
    if (this.telemetrySubscriber) {
      this.telemetrySubscriber.unsubscribe();
      this.telemetrySubscriber = null;
    }
  }

  loadAttributes(entityId: EntityId, attributesScope: TelemetryType,
                 pageLink: PageLink, reload: boolean = false): Observable<PageData<AttributeData>> {
    if (reload) {
      this.allAttributes = null;
      if (this.telemetrySubscriber) {
        this.telemetrySubscriber.unsubscribe();
        this.telemetrySubscriber = null;
      }
    }
    this.selection.clear();
    const result = new ReplaySubject<PageData<AttributeData>>();
    this.fetchAttributes(entityId, attributesScope, pageLink).pipe(
      catchError(() => of(emptyPageData<AttributeData>())),
    ).subscribe(
      (pageData) => {
        this.attributesSubject.next(pageData.data);
        this.pageDataSubject.next(pageData);
        result.next(pageData);
      }
    );
    return result;
  }

  fetchAttributes(entityId: EntityId, attributesScope: TelemetryType,
                  pageLink: PageLink): Observable<PageData<AttributeData>> {
    return this.getAllAttributes(entityId, attributesScope).pipe(
      map((data) => {
        const filteredData = data.filter(attrData => attrData.lastUpdateTs !== 0);
        return pageLink.filterData(filteredData);
      })
    );
  }

  getAllAttributes(entityId: EntityId, attributesScope: TelemetryType): Observable<Array<AttributeData>> {
    if (!this.allAttributes) {
      let attributesObservable: Observable<Array<AttributeData>>;
      if (isClientSideTelemetryType.get(attributesScope)) {
        this.telemetrySubscriber = TelemetrySubscriber.createEntityAttributesSubscription(
          this.telemetryWsService, entityId, attributesScope, this.zone);
        this.telemetrySubscriber.subscribe();
        attributesObservable = this.telemetrySubscriber.attributeData$();
      } else {
        attributesObservable = this.attributeService.getEntityAttributes(entityId, attributesScope as AttributeScope);
      }
      this.allAttributes = attributesObservable.pipe(
        publishReplay(1),
        refCount()
      );
    }
    return this.allAttributes;
  }

  isAllSelected(): Observable<boolean> {
    const numSelected = this.selection.selected.length;
    return this.attributesSubject.pipe(
      map((attributes) => numSelected === attributes.length)
    );
  }

  isEmpty(): Observable<boolean> {
    return this.attributesSubject.pipe(
      map((attributes) => !attributes.length)
    );
  }

  total(): Observable<number> {
    return this.pageDataSubject.pipe(
      map((pageData) => pageData.totalElements)
    );
  }

  masterToggle() {
    this.attributesSubject.pipe(
      tap((attributes) => {
        const numSelected = this.selection.selected.length;
        if (numSelected === attributes.length) {
          this.selection.clear();
        } else {
          attributes.forEach(row => {
            this.selection.select(row);
          });
        }
      }),
      take(1)
    ).subscribe();
  }

}
