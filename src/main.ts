import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 使用 body-parser 来解析 XML 请求体
  app.use(bodyParser.text({ type: 'text/xml' }));
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
