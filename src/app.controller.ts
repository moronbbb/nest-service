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
    private readonly appService: AppService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/moron/test-ticket')
  async getMoronTicket() {
    return this.appService.getTicket()
  }

  @Get('/events/auth')
  async getEventsAuth(
    @Body() body: string, @Query() query: any,
    @Req() req: Request,
    @Res() res: Response
  ) {
    res.send('success')

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
    console.log('[GET]/events/auth', request)

    const decryptedMessage = await this.appService.decryptMsg(
      body?.trim(),
      query?.msg_signature,
      query?.timestamp,
      query?.nonce,
    );
    console.log('[GET]Decrypted Message:', decryptedMessage);
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
    res.send('success')

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

    console.log('/events/auth next', [
      body,
      query?.msg_signature,
      query?.timestamp,
      query?.nonce,])

    const decryptedMessage = await this.appService.decryptMsg(
      body?.trim(),
      query?.msg_signature,
      query?.timestamp,
      query?.nonce,
    );
    console.log('Decrypted Message:', decryptedMessage);
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
    return this.appService.getHello();
  }
}
