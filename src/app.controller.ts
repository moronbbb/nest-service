import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

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
  recieveEventsAuth(@Body() reqBody: any): string {
    this.alert(JSON.stringify(reqBody ?? ''))
    return this.appService.getHello();
  }

  @Post('/events/callback')
  recieveEventsCallback(@Body() reqBody: any): string {
    this.alert(JSON.stringify(reqBody ?? ''))
    return this.appService.getHello();
  }

}
