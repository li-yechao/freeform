import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { GraphQLModule } from '@nestjs/graphql'
import { MongooseModule } from '@nestjs/mongoose'
import { ApplicationModule } from './application/application.module'
import { AuthModule } from './auth/auth.module'
import { FormModule } from './form/form.module'
import { RecordModule } from './record/record.module'
@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.env.local', '.env'] }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: true,
      context: ({ req }) => ({ headers: req.headers }),
    }),
    FormModule,
    AuthModule,
    ApplicationModule,
    RecordModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
