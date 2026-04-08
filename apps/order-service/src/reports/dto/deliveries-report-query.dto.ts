import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ValidationMessages } from '../../common/validation/messages';

export class DeliveriesReportQueryDto {
  @IsDateString({}, { message: ValidationMessages.report.dateFromInvalid })
  dateFrom!: string;

  @IsDateString({}, { message: ValidationMessages.report.dateToInvalid })
  dateTo!: string;

  @IsOptional()
  @IsString({ message: ValidationMessages.report.courierIdString })
  courierId?: string;

  @IsOptional()
  @IsString({ message: ValidationMessages.report.statusString })
  status?: string;
}
