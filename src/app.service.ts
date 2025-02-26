import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as xml2js from 'xml2js';
import * as querystring from 'querystring';

@Injectable()
export class AppService {
  private token = 'AzWechat031927zzz'; // 消息校验 Token
  private aesKey = 'Az77777777777777777777777777777777777777777'; // 消息加解密 Key

  async processMessage(xmlData: any, query: any): Promise<string> {
    const parsedXml = await this.parseXml(xmlData);
    const { Encrypt } = parsedXml.xml;

    // 验证签名
    if (!this.verifySignature(query, Encrypt)) {
      throw new Error('Invalid signature');
    }

    // 解密消息
    const decryptedMsg = this.decryptMessage(Encrypt);

    // 处理解密后的消息
    const response = this.handleMessage(decryptedMsg);

    // 加密响应
    const encryptedResponse = this.encryptMessage(response);

    return this.buildXmlResponse(encryptedResponse, query);
  }

  private async parseXml(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      xml2js.parseString(data, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  }

  private verifySignature(query: any, encrypt: string): boolean {
    const { timestamp, nonce, msg_signature } = query;
    const params = [timestamp, nonce, this.token, encrypt].sort();
    const signature = crypto.createHash('sha1').update(params.join('')).digest('hex');
    return signature === msg_signature;
  }

  private decryptMessage(encrypt: string): string {
    const aesKey = Buffer.from(this.aesKey + '=', 'base64');
    const encryptedData = Buffer.from(encrypt, 'base64');
    const iv = encryptedData.slice(0, 16);
    const cipherText = encryptedData.slice(16);

    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
    decipher.setAutoPadding(true);

    const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
    const randomLen = decrypted.readUInt32BE(0);
    const msgLen = decrypted.readUInt32BE(16);
    const msg = decrypted.slice(20, 20 + msgLen).toString();
    const appid = decrypted.slice(20 + msgLen).toString();

    return msg;
  }

  private handleMessage(msg: string): string {
    // 处理消息逻辑，返回响应内容
    return `<xml><demo_resp><![CDATA[good luck]]></demo_resp></xml>`;
  }

  private encryptMessage(msg: string): string {
    const aesKey = Buffer.from(this.aesKey + '=', 'base64');
    const iv = crypto.randomBytes(16);
    const random = crypto.randomBytes(16);
    const msgLen = Buffer.alloc(4);
    msgLen.writeUInt32BE(msg.length, 0);
    const fullStr = Buffer.concat([random, msgLen, Buffer.from(msg), Buffer.from('wx134c8103faa5a59e')]);

    const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
    const encrypted = Buffer.concat([cipher.update(fullStr), cipher.final()]);
    return Buffer.concat([iv, encrypted]).toString('base64');
  }

  private buildXmlResponse(encrypt: string, query: any): string {
    const { timestamp, nonce } = query;
    const msgSignature = this.generateSignature(this.token, timestamp, nonce, encrypt);
    return `<xml>
      <Encrypt><![CDATA[${encrypt}]]></Encrypt>
      <MsgSignature><![CDATA[${msgSignature}]]></MsgSignature>
      <TimeStamp>${timestamp}</TimeStamp>
      <Nonce><![CDATA[${nonce}]]></Nonce>
    </xml>`;
  }

  private generateSignature(token: string, timestamp: string, nonce: string, encrypt: string): string {
    const params = [timestamp, nonce, token, encrypt].sort();
    return crypto.createHash('sha1').update(params.join('')).digest('hex');
  }

  getHello(): string {
    return 'Service Alive';
  }
}
