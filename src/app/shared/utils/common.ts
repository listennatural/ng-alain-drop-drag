import { UploadFile } from 'ng-zorro-antd';
import { HttpParams } from '@angular/common/http';
import { Rsa } from './rsa';
import MD5 from './md5';

/**
 * 转化成RMB元字符串
 * @param digits 当数字类型时，允许指定小数点后数字的个数，默认2位小数
 */
// tslint:disable-next-line:no-any
export function yuan(value: any, digits: number = 2): string {
  if (typeof value === 'number') {
    value = value.toFixed(digits);
  }
  return `&yen ${value}`;
}

/**
 * base64转为 blob 用于 formData 传输
 */
export function base64ToBlob(base64: string): Blob {
  base64 = base64.substring(base64.indexOf(',') + 1);
  const binary = atob(base64);
  const array = [];
  for (let i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  return new Blob([new Uint8Array(array)], { type: 'image/png' });
}

/**
 * 处理字符串中的特殊字符
 */
export function customEscape(str: string) {
  return str
    .replace(/\+/g, '%2B')
    .replace(/\?/g, '%3F')
    .replace(/&/g, '%26');
}

/**
 * 特殊字符反处理
 */
export function customNotEscape(str: string) {
  return str
    .replace(/%2B/g, '+')
    .replace(/%3F/g, '?')
    .replace(/%26/g, '&');
}

/**
 * 获取随机字符串
 */
export function nonstr(len: number) {
  len = len || 16;
  const $chars = 'QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890';
  const maxPos = $chars.length;
  let pwd = '';
  for (let i = 0; i < len; i++) {
    pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return pwd;
}

/**
 * 是否为空
 */
export function isNull(data: any): boolean {
  if (data === null || data === undefined || data === '') {
    return true;
  }

  data = '' + data;

  if (data.trim() === '') {
    return true;
  }

  return false;
}

/**
 * json 是否为空
 */
export function isNullJson(data: any): boolean {
  if (isNull(data)) {
    return true;
  }

  data = JSON.stringify(data);

  if (data === '{}') {
    return true;
  }

  return false;
}

/**
 * 获取指定文件的base64编码
 * file: 文件
 * callback 要求只有一个参数且参数类型为 string 的一个函数, 该参数会转入文件base64编码
 */
export function getBase64(file: File, callback: (base64: string) => void): void {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result!.toString()));
  reader.readAsDataURL(file);
}

/**
 * 创建文件列表中的单个文件
 */
export function createUploadFile(file: File | UploadFile, base: string): UploadFile {
  return {
    uid: '' + new Date().getTime(),
    url: base,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

/**
 * 创建文件列表中的单个文件
 * @param url  文件网络路径
 */
export function createUploadFileInfo(url: string): UploadFile {
  const uid = new Date().getTime() + nonstr(3);
  let fileName: string;
  // 处理 url
  if (url.indexOf('?') === -1) {
    fileName = url.substring(url.lastIndexOf('/') + 1);
    url += '?uid=' + uid;
  } else {
    fileName = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('?'));
    url += '&uid=' + uid;
  }

  return {
    uid,
    url,
    name: nonstr(6),
    size: 1,
    type: 'image/png',
    filename: fileName,
  };
}

/**
 * 创建上传文件 originFileObj
 */
export function createUploadFileByOriginFileObj(uploadFile: UploadFile, file: File): UploadFile {
  return {
    ...uploadFile,
    originFileObj: file,
  };
}

/**
 * 是否为网络路径
 */
export function isWebUrl(url: string): boolean {
  // 不为空 且 http开头
  if (!isNull(url) && url.startsWith('http')) {
    return true;
  }
  return false;
}

/**
 * 使用 source 中的字段值  替换 target 中对应的字段值， 忽略空值
 */
export function extend(source: any, target: any): any {
  for (const d in source) {
    if (source[d]) {
      // 如果值不为空
      target[d] = source[d];
    }
  }

  return target;
}

/**
 * 返回上一级路径 例如 /quartz/ask/detail 返回 /quartz/ask
 * @param url 路径
 */
export function backUpOndeLevel(url: string) {
  url = url.substring(0, url.lastIndexOf('/'));
  return url;
}

/**
 * 转为boolean
 */
export function toBoolean(flag: any): boolean {
  if (isNull(flag) || !flag || flag + '' === 'false' || flag + '' === '0') {
    return false;
  }
  return true;
}

/**
 * 参数 签名 处理
 * @param escape 是否处理密文
 */
export function paramsRsa(params: FormData | HttpParams | any): string {
  // key 为空 不需要 签名
  if (isNull(localStorage.getItem('key'))) {
    return '';
  }

  let keys = [];

  // 获取参数 key 数组
  if (params instanceof FormData) {
    params.forEach((val: any, key: string) => {
      keys.push(key);
    });
  } else if (params instanceof HttpParams) {
    keys = params.keys();
  } else {
    // 获取对象的 key 列表
    Object.entries(params).map(([key, val]) => {
      keys.push(key);
    });
  }

  // key 排序
  keys.sort();
  let sign = '';

  // 拼接明文
  keys.forEach((val: any) => {
    if (val !== 'sign' && !String(val).endsWith('File')) {
      if (params instanceof FormData || params instanceof HttpParams) {
        sign += '&' + val + '=' + params.get(val);
      } else {
        sign += '&' + val + '=' + params[val];
      }
    }
  });

  // 获取密文
  return MD5.encrypt(sign.substring(1));
}

/**
 * 普通参数 转为  formData 数据
 */
export function objToFormData(params: any): FormData {
  const formData = new FormData();
  // 设置参数
  Object.keys(params).forEach((key: string) => {
    formData.append(key, params[key]);
  });

  return formData;
}

/**
 * 从 uploadFile 中获取文件
 */
export function getFileByUploadFile(uploadFile: UploadFile | any): File {
  if (uploadFile.originFileObj) {
    return uploadFile.originFileObj;
  }
  return uploadFile;
}

/**
 * 十进制转百分比
 */
export function percent(val: number): string {
  return `${((isNaN(val) ? 0 : val) * 100).toFixed(2)}%`;
}

/**
 * 处理密码
 */
export function encryptPassword(password: string): string {
  let md5 = password;
  // md5 处理次数
  const count = 5;

  for (let i = 0; i < count; i++) {
    md5 = MD5.encrypt(md5);
  }
  return md5;
}
