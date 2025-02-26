import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';

@Controller()
export class AppController {
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
    @Req() req: Request,
    @Res() res: Response
  ) {

    const xmlData = req.body; // 获取原始 XML 数据
    const result = await this.appService.processMessage(xmlData, req.query);

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
    console
    console.log('/events/auth', request)
    this.alert(JSON.stringify(
      {
        _api: '/events/auth',
        result,
        request
      }
    ))

    res.type('text/xml'); // 设置响应类型为 XML
    res.send(result); // 返回处理后的 XML 响应
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
