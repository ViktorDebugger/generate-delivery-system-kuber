import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ORDER_DELIVERY_STATUS_VALUES } from '../order-delivery-status';
import { ValidationMessages } from '../../common/validation/messages';

export class CreateOrderDto {
  @IsNotEmpty({ message: ValidationMessages.order.orderNumberRequired })
  @IsString({ message: ValidationMessages.order.orderNumberString })
  orderNumber!: string;

  @IsNumber({}, { message: ValidationMessages.typeNumber })
  @IsPositive({ message: ValidationMessages.order.weightPositive })
  weight!: number;

  @IsOptional()
  @IsString({ message: ValidationMessages.order.statusString })
  @IsIn(ORDER_DELIVERY_STATUS_VALUES, {
    message: ValidationMessages.order.statusInvalid,
  })
  status?: string;

  @IsNotEmpty({ message: ValidationMessages.order.senderIdRequired })
  @IsString({ message: ValidationMessages.order.senderIdString })
  senderId!: string;

  @IsNotEmpty({ message: ValidationMessages.order.receiverIdRequired })
  @IsString({ message: ValidationMessages.order.receiverIdString })
  receiverId!: string;

  @IsOptional()
  @IsString({ message: ValidationMessages.order.courierIdString })
  courierId?: string;

  @IsOptional()
  @IsString({ message: ValidationMessages.order.estimatedArrivalString })
  estimatedArrivalTime?: string;

  @IsOptional()
  @IsArray({ message: ValidationMessages.typeArray })
  @IsString({ each: true, message: ValidationMessages.product.productIdString })
  productIds?: string[];
}
