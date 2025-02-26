import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';

@Controller()
export class AppController {
  appId = 'wx93f555b291bc23cc'
  token = 'AzWechat031927zzz'
  key = 'Az77777777777777777777777777777777777777777'
  constructor(
    private readonly httpService: HttpService,
    private readonly appService: AppService,
  ) { }

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

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/events/auth')
  getEventsAuth(): string {
    return this.appService.getHello();
  }

  @Get('/events/callback')
  getEventsCallback(): string {
    return this.appService.getHello();
  }


  @Post('/events/auth')
  async recieveEventsAuth(
    @Body() body: string, @Query() query: any,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const decryptedMessage = await this.appService.decryptMsg(
      body,
      query?.msg_signature,
      query?.timestamp,
      query?.nonce,
    );
    console.log('Decrypted Message:', decryptedMessage);

    const request = {
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
      cookies: req.cookies,
      host: req.host,
      ip: req.ip,
    }
    console.log('/events/auth', request)
    this.alert(JSON.stringify(
      {
        _api: '/events/auth',
        request,
        decryptedMessage
      }
    ))
  }

  @Post('/events/wx93f555b291bc23cc/callback')
  recieveEventsCallback(
    @Body() body: any,
    @Req() req: Request
  ): string {
    const request = {
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
      cookies: req.cookies,
      host: req.host,
      ip: req.ip,
    }
    console.log('/events/wx93f555b291bc23cc/callback', request)
    this.alert(JSON.stringify(
      {
        _api: '/events/wx93f555b291bc23cc/callback',
        body,
        request
      }
    ))
    return this.appService.getHello();
  }
}
