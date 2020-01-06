import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpErrorResponse,
  HttpEvent,
  HttpResponseBase,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { mergeMap, catchError } from 'rxjs/operators';
import { NzNotificationService } from 'ng-zorro-antd';
import { _HttpClient } from '@delon/theme';
import { environment } from '@env/environment';
import { DA_SERVICE_TOKEN, ITokenService } from '@delon/auth';
import { paramsRsa, customEscape, isNull, isNullJson } from '@shared';

const CODEMESSAGE = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};

/**
 * 默认HTTP拦截器，其注册细节见 `app.module.ts`
 */
@Injectable()
export class DefaultInterceptor implements HttpInterceptor {
  constructor(private injector: Injector) {}

  private get notification(): NzNotificationService {
    return this.injector.get(NzNotificationService);
  }

  private goTo(url: string) {
    setTimeout(() => this.injector.get(Router).navigateByUrl(url));
  }

  private checkStatus(ev: HttpResponseBase) {
    if ((ev.status >= 200 && ev.status < 300) || ev.status === 401) {
      return;
    }

    (ev as any).error.msg = (ev as any).error.msg || CODEMESSAGE[ev.status] || ev.statusText;
    this.notification.error(`请求错误`, (ev as any).error.msg);
  }

  private handleData(ev: HttpResponseBase, method: string): Observable<any> {
    // 可能会因为 `throw` 导出无法执行 `_HttpClient` 的 `end()` 操作
    if (ev.status > 0) {
      this.injector.get(_HttpClient).end();
    }
    this.checkStatus(ev);
    // 业务处理：一些通用操作
    switch (ev.status) {
      case 200:
        return of(ev);
      case 401:
        // 用户状态异常,需重新登录
        if (!isNullJson((this.injector.get(DA_SERVICE_TOKEN) as ITokenService).get())) {
          this.notification.error(CODEMESSAGE[401], '');
        }
        // 清空 token 信息
        (this.injector.get(DA_SERVICE_TOKEN) as ITokenService).clear();
        // 跳转到登录页
        this.goTo('/passport/login');
        break;
      case 403:
        // 权限异常,跳转到首页
        if (method.toLowerCase() === 'get') {
          this.goTo('/exception/403');
        }
        break;
      case 404:
        if (method.toLowerCase() === 'get') {
          this.goTo(`/exception/404`);
        }
        break;
      case 500:
        if (method.toLowerCase() === 'get') {
          this.goTo(`/exception/500`);
        }
        break;
      case 412:
        break;
      default:
        if (ev instanceof HttpErrorResponse) {
          // console.warn('未可知错误，大部分是由于后端不支持CORS或无效配置引起', ev);
        }
        break;
    }
    return throwError(ev);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 统一加上服务端前缀
    let url = req.url;
    // 获取原有请求头
    let headers: HttpHeaders = req.headers;
    let body = req.body || {};
    // 获取原有参数
    let params: HttpParams = req.params;

    // 如果请求你开头是 assets,表示请求本地资源
    if (url.startsWith('assets/')) {
      url = '/' + url;
    } else if (!url.startsWith('https://') && !url.startsWith('http://')) {
      // 前缀补上  /
      url = url.startsWith('/') ? url : '/' + url;

      // 如果已设置公司服务器，则指向公司服务器, 没有设置则添加 /server 启用代理 (未知原因，代理在服务器无效)
      url = isNull(environment.SERVER_URL) ? (url = '/server' + url) : (url = environment.SERVER_URL + url);

      if (body instanceof FormData) {
        // formData
        body.append('timestamp', new Date().getTime() + '');
        body.append('token', (this.injector.get(DA_SERVICE_TOKEN) as ITokenService).get().token);
        body.append('sign', paramsRsa(body));
      } else {
        // 如果是post请求
        if (req.method.toLowerCase() === 'post') {
          // 不是formData
          body.timestamp = new Date().getTime();
          body.token = body.token ? body.token : (this.injector.get(DA_SERVICE_TOKEN) as ITokenService).get().token;
          body.sign = paramsRsa(body);

          // 设置请求头
          headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

          // 参数处理
          let postBody = '';

          Object.entries(body).map(([key, val]) => {
            postBody += `${key}=${customEscape(String(val))}&`;
          });

          body = postBody;
        } else if (req.method.toLowerCase() === 'get') {
          // get 请求处理
          params = params.append('timestamp', new Date().getTime().toString());
          params = params.append('token', (this.injector.get(DA_SERVICE_TOKEN) as ITokenService).get().token);
          params = params.append('sign', customEscape(paramsRsa(params)));
        }
      }
    }

    // 生成新的请求
    const request = req.clone({
      url,
      body,
      headers,
      params,
    });

    return next.handle(request).pipe(
      mergeMap((event: any) => {
        // 允许统一对请求错误处理
        if (event instanceof HttpResponseBase) return this.handleData(event, request.method);
        // 若一切都正常，则后续操作
        return of(event);
      }),
      catchError((err: HttpErrorResponse) => this.handleData(err, request.method)),
    );
  }
}
