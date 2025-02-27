import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';
import * as Xml2js from 'xml2js';

@Injectable()
export class AppService {
  appId = 'wx93f555b291bc23cc'
  token = 'AzWechat031927zzz'
  key = 'Az77777777777777777777777777777777777777777'
  private ticket?: string;
  constructor(
    private readonly httpService: HttpService,
  ) { }

  // 计算 SHA1 签名
  private getSHA1(token: string, timestamp: string, nonce: string, encrypt: string): string {
    const str = [token, timestamp, nonce, encrypt].join('');
    return crypto.createHash('sha1').update(str).digest('hex');
  }

  // AES 解密
  private decryptAES(encrypted: string, appid: string): string {
    console.log('this.key', this.key.length);

    // 1. 解码 EncodingAESKey，并生成 AES 密钥
    const aesKey = Buffer.from(`${this.key}`, 'base64');
    console.log('aesKey', aesKey, aesKey.length);

    // 2. 解码加密消息
    const TmpMsg = Buffer.from(encrypted, 'base64');
    console.log('TmpMsg', TmpMsg, TmpMsg.length);

    // 3. 提取 IV（前 16 字节）
    const iv = TmpMsg.slice(0, 16);
    // 4. 提取密文（其余部分）
    // const ciphertext = TmpMsg.slice(17);

    // 5. 创建解密器，并解密数据
    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
    console.log('decipher', decipher, '\niv', iv.length, iv);

    const decrypted = Buffer.concat([
      decipher.update(TmpMsg),
      decipher.final()]);
    console.log('decrypted', decrypted.toString());

    // 6. 解析消息
    const msgLen = decrypted.readUInt32BE(16);
    const message = decrypted.slice(20, 20 + msgLen).toString();
    const receivedAppid = decrypted.slice(20 + msgLen).toString();
    console.log('msgLen', { msgLen, message, receivedAppid })

    // 7. 验证 appid 是否匹配
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
      console.log('decryptMsg sPostData——raw:', sPostData);  // 调试打印
      const parsedData = await parser.parseStringPromise(sPostData);
      console.log('Parsed Data:', parsedData);  // 调试打印

      // 确保 Encrypt 存在
      const encrypt = parsedData?.xml?.Encrypt?.[0].split('\n')?.[0];
      console.log('decryptMsg encrypt:', encrypt);  // 调试打印
      if (!encrypt) {
        throw new Error('Missing Encrypt field in the XML');
      }

      console.log('decryptMsg getSHA1:', this.token, sTimeStamp, sNonce, encrypt);  // 调试打印
      // 验证签名
      const signature = this.getSHA1(this.token, sTimeStamp, sNonce, encrypt);
      console.log(`decryptMsg signature: ${signature !== sMsgSignature}\n`, signature, sMsgSignature);  // 调试打印

      if (signature !== sMsgSignature) {
        throw new Error('Invalid signature');
      }

      // 解密消息
      const decryptedMessage = this.decryptAES(encrypt, this.appId);
      const newTicket = this.parseXml(decryptedMessage);

      if (typeof newTicket === 'string') {
        if (newTicket !== this.ticket) {
          this.alert(`[WECHAT] moron.icu - recieve new ticket\nold ticket: ${this.ticket}\nnew ticket: ${newTicket}`)
          this.ticket = newTicket
        }
      }
      return newTicket
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

  /**
   * 解析 XML 字符串并提取指定字段
   * @param xmlString XML 字符串
   * @returns 提取字段后的对象
   */
  async parseXml(xmlString: string) {
    console.log('parseXml start')
    const parser = new Xml2js.Parser();
    console.log('parseXml parser')

    try {
      // 解析 XML 字符串为 JavaScript 对象
      const result = await parser.parseStringPromise(xmlString);
      console.log('parseXml result', result)

      // 获取指定字段
      // const toUserName = result.xml.ToUserName[0];  // 获取 ToUserName
      // const fromUserName = result.xml.FromUserName[0];  // 获取 FromUserName
      // const createTime = result.xml.CreateTime[0];  // 获取 CreateTime
      // const msgType = result.xml.MsgType[0];  // 获取 MsgType
      // const content = result.xml.Content[0];  // 获取 Content
      // const msgId = result.xml.MsgId[0];  // 获取 MsgId

      // 返回所需字段
      return result?.xml?.ComponentVerifyTicket?.[0]
    } catch (error) {
      console.error('XML Parsing Error:', error);
      throw new Error('Error parsing XML');
    }
  }

  getTicket() {
    return this.ticket
  }

  getHello(): string {
    return 'Service Alive';
  }


  async alert(content: string) {
    try {
      await firstValueFrom(
        this.httpService.post('https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=ff0f99a4-b610-4f68-80a1-9d13571cbe35', {
          msgtype: 'text',
          text: {
            // mentioned_list: [],
            content: `${content}`,
          },
        }),
      );
    } catch (error) {
      console.error(`[AlertService]${error?.toString()}`, error);
      // this.logger.error(error);
    }
  }
}
