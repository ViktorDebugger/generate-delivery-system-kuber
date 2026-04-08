import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ValidationMessages } from '../../common/validation/messages';
import { ORDER_DELIVERY_STATUS_VALUES } from '../order-delivery-status';

export class UpdateOrderStatusDto {
  @IsNotEmpty({ message: ValidationMessages.order.statusString })
  @IsString({ message: ValidationMessages.order.statusString })
  @IsIn(ORDER_DELIVERY_STATUS_VALUES, {
    message: ValidationMessages.order.statusInvalid,
  })
  status!: string;
}
