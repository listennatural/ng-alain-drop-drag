import { ChangeDetectionStrategy, Component, HostListener, ChangeDetectorRef } from '@angular/core';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { _HttpClient } from '@delon/theme';

@Component({
  selector: 'header-storage-network',
  template: `
    <i nz-icon nzType="tool"></i>
    {{ 'menu.clear.local.storage' | translate }}
  `,
  // tslint:disable-next-line: no-host-metadata-property
  host: {
    '[class.d-block]': 'true',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderStorageNetworkComponent {
  constructor(
    private modalSrv: NzModalService,
    private messageSrv: NzMessageService,
    private httpClient: _HttpClient,
    public msg: NzMessageService,
    private cdr: ChangeDetectorRef,
  ) {}

  @HostListener('click')
  _click() {
    this.modalSrv.confirm({
      nzTitle: '确定清理网络缓存?',
      nzOnOk: () => {
        this.messageSrv.success('清理完成!');
      },
    });
  }
}
