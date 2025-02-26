import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as Xml2js from 'xml2js';

@Injectable()
export class AppService {
  appId = 'wx93f555b291bc23cc'
  token = 'AzWechat031927zzz'
  key = 'Az77777777777777777777777777777777777777777'
  // 计算 SHA1 签名
  private getSHA1(token: string, timestamp: string, nonce: string, encrypt: string): string {
    const str = [token, timestamp, nonce, encrypt].sort().join('');
    return crypto.createHash('sha1').update(str).digest('hex');
  }

  // AES 解密
  private decryptAES(encrypted: string, appid: string): string {
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, Buffer.from(encrypted.slice(0, 16), 'base64'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted.slice(16), 'base64')), decipher.final()]);
    const msgLen = decrypted.readUInt32BE(16);
    const message = decrypted.slice(20, 20 + msgLen).toString();
    const receivedAppid = decrypted.slice(20 + msgLen).toString();
    if (receivedAppid !== appid) {
      throw new Error('AppID mismatch');
    }
    return message;
  }

  // AES 加密
  private encryptAES(message: string, appid: string): string {
    const random = crypto.randomBytes(16);
    const msg = Buffer.from(message);
    const msgLen = Buffer.alloc(4);
    msgLen.writeUInt32BE(msg.length, 0);
    const fullMessage = Buffer.concat([random, msgLen, msg, Buffer.from(appid)]);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key, random);
    const encrypted = Buffer.concat([cipher.update(fullMessage), cipher.final()]);
    return encrypted.toString('base64');
  }

  // 解密消息
  async decryptMsg(sPostData: string, sMsgSignature: string, sTimeStamp: string, sNonce: string): Promise<any> {
    try {
      const parser = new Xml2js.Parser();
      const parsedData = await parser.parseStringPromise(sPostData);
      console.log('Parsed Data:', parsedData);  // 调试打印
  
      // 确保 Encrypt 存在
      const encrypt = parsedData?.xml?.Encrypt?.[0];
      if (!encrypt) {
        throw new Error('Missing Encrypt field in the XML');
      }
  
      // 验证签名
      const signature = this.getSHA1(this.token, sTimeStamp, sNonce, encrypt);
      if (signature !== sMsgSignature) {
        throw new Error('Invalid signature');
      }
  
      // 解密消息
      const decryptedMessage = this.decryptAES(encrypt, this.appId);
      return decryptedMessage;
    } catch (error) {
      console.error('Error in decryptMsg:', error.message);
      throw error;  // 重新抛出错误
    }
  }


  // 加密消息
  async encryptMsg(sReplyMsg: string, sNonce: string, timestamp?: string): Promise<any> {
    if (!timestamp) {
      timestamp = String(Math.floor(Date.now() / 1000));
    }

    const encrypt = this.encryptAES(sReplyMsg, this.appId);

    const signature = this.getSHA1(this.token, timestamp, sNonce, encrypt);

    const builder = new Xml2js.Builder();
    const xml = builder.buildObject({
      xml: {
        Encrypt: encrypt,
        MsgSignature: signature,
        TimeStamp: timestamp,
        Nonce: sNonce,
      },
    });

    return xml;
  }

  getHello(): string {
    return 'Service Alive';
  }
}
