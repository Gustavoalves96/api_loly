import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuffetsController } from './buffets.controller';
import { BuffetsService } from './buffets.service';
import { Buffet } from './buffet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Buffet])],
  controllers: [BuffetsController],
  providers: [BuffetsService],
})
export class BuffetsModule {}
