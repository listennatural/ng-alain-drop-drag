import * as JsEncryptModule from 'jsencrypt';

// rsa 加密
export class Rsa {
  /**
   * RSA最大加密明文大小
   * 245 长度明文加密异常
   */
  private static MAX_ENCRYPT_BLOCK = 245;
  /**
   * RSA最大解密密文大小
   */
  private static MAX_DECRYPT_BLOCK = 256;

  static encrypt(str: string, key: string): string {
    try {
      let crypt = new JsEncryptModule.JSEncrypt();
      crypt.setPublicKey(key);
      const cipher = crypt.encrypt(str);
      // 覆盖原值
      crypt = undefined;
      return cipher;
    } catch (e) {
      return '';
    }
  }

  static doEncrypt(crypt: any, plaintext: string, max: number): string {
    const inputLen = plaintext.length;
    const ciphers = [];
    let offSet = 0;
    let i = 0;

    // 使用分段加密
    while (inputLen - offSet > 0) {
      if (inputLen - offSet > max) {
        ciphers.push(crypt.encrypt(plaintext.substr(offSet, max)));
      } else {
        ciphers.push(crypt.encrypt(plaintext.substr(offSet, inputLen - offSet)));
      }
      i++;
      offSet = i * max;
    }

    return ciphers.join('');
  }

  static decrypt(str: string, key: string): string {
    try {
      const crypt = new JsEncryptModule.JSEncrypt();
      crypt.setPublicKey(key);
      return crypt.decrypt(str);
    } catch {
      return '';
    }
  }
}
