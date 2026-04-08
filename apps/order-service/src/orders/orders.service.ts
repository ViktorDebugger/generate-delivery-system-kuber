import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { buildListRepoArgs } from '../common/list-query/list-query.util';
import { ValidationMessages } from '../common/validation/messages';
import { ClientRepository } from '../clients/client.repository';
import type {
  OrderEntity,
  OrderResponse,
  OrderWithSenderResponse,
} from '../domain/entities';
import { CatalogClient } from '../integration/catalog.client';
import { FleetClient } from '../integration/fleet.client';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { UpdateOrderDto } from './dto/update-order.dto';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import {
  OrderDeliveryStatus,
  type OrderDeliveryStatusValue,
  canTransitionOrderStatus,
  normalizeOrderStatus,
} from './order-delivery-status';
import { OrderRepository } from './order.repository';

const ORDER_SORT_PAIRS = [
  ['id', 'id'],
  ['ordernumber', 'orderNumber'],
  ['order_number', 'orderNumber'],
  ['weight', 'weight'],
  ['status', 'status'],
  ['createdat', 'createdAt'],
  ['created_at', 'createdAt'],
] as const;

@Injectable()
export class OrdersService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly clients: ClientRepository,
    private readonly catalog: CatalogClient,
    private readonly fleet: FleetClient,
  ) {}

  async findAll(
    status: string | undefined,
    page = 0,
    size = 10,
    sort?: string,
    order?: string,
  ): Promise<OrderResponse[]> {
    const args = buildListRepoArgs(
      page,
      size,
      sort,
      order,
      ORDER_SORT_PAIRS,
      'id',
    );
    const items = await this.orders.listOrders({
      ...args,
      status: status !== undefined && status !== '' ? status : undefined,
    });
    return items.map((e) => this.toResponse(e));
  }

  async findOne(id: string): Promise<OrderResponse> {
    const entity = await this.orders.getOrder(id);
    if (!entity) {
      throw new NotFoundException(`Замовлення з ID ${id} не знайдено`);
    }
    return this.toResponse(entity);
  }

  async findOneWithSender(id: string): Promise<OrderWithSenderResponse> {
    const entity = await this.orders.getOrder(id);
    if (!entity) {
      throw new NotFoundException(`Замовлення з ID ${id} не знайдено`);
    }
    const sender = await this.clients.getClient(entity.senderId);
    if (!sender) {
      throw new NotFoundException(
        `Клієнт-відправник з ID ${entity.senderId} не знайдено`,
      );
    }
    return { ...this.toResponse(entity), sender };
  }

  async create(dto: CreateOrderDto): Promise<OrderResponse> {
    await this.assertSenderReceiverExist(dto.senderId, dto.receiverId);
    const productIds = this.resolveProductIds(dto.productIds);
    await this.catalog.assertProductsExist(productIds);
    const requestedUpper = dto.status?.trim().toUpperCase();

    if (requestedUpper === OrderDeliveryStatus.CANCELLED) {
      const entity: OrderEntity = {
        id: randomUUID(),
        orderNumber: dto.orderNumber,
        weight: dto.weight,
        status: OrderDeliveryStatus.CANCELLED,
        senderId: dto.senderId,
        receiverId: dto.receiverId,
        courierId: undefined,
        estimatedArrivalTime: dto.estimatedArrivalTime,
        productIds,
      };
      await this.orders.saveOrder(entity);
      return this.toResponse(entity);
    }

    if (
      requestedUpper === OrderDeliveryStatus.IN_TRANSIT ||
      requestedUpper === OrderDeliveryStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'Початковий статус не може бути IN_TRANSIT або DELIVERED',
      );
    }

    let courierId = dto.courierId?.trim() || undefined;
    let status: OrderDeliveryStatusValue;

    if (courierId) {
      await this.assertCourierAvailableForAssignment(courierId);
      if (
        requestedUpper === OrderDeliveryStatus.ASSIGNED ||
        requestedUpper === OrderDeliveryStatus.CREATED ||
        requestedUpper === undefined
      ) {
        status = OrderDeliveryStatus.ASSIGNED;
      } else {
        throw new BadRequestException(ValidationMessages.order.statusInvalid);
      }
    } else {
      const picked = await this.fleet.pickAvailableCourierId();
      if (picked) {
        courierId = picked;
        status = OrderDeliveryStatus.ASSIGNED;
      } else {
        if (requestedUpper === OrderDeliveryStatus.ASSIGNED) {
          throw new BadRequestException(
            'Немає вільного кур’єра для призначення',
          );
        }
        courierId = undefined;
        status = OrderDeliveryStatus.CREATED;
      }
    }

    const entity: OrderEntity = {
      id: randomUUID(),
      orderNumber: dto.orderNumber,
      weight: dto.weight,
      status,
      senderId: dto.senderId,
      receiverId: dto.receiverId,
      courierId,
      estimatedArrivalTime: dto.estimatedArrivalTime,
      productIds,
    };
    await this.orders.saveOrder(entity);
    return this.toResponse(entity);
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderResponse> {
    return this.update(id, { status: dto.status });
  }

  async update(id: string, dto: UpdateOrderDto): Promise<OrderResponse> {
    const existing = await this.orders.getOrder(id);
    if (!existing) {
      throw new NotFoundException(`Замовлення з ID ${id} не знайдено`);
    }
    const senderId = dto.senderId ?? existing.senderId;
    const receiverId = dto.receiverId ?? existing.receiverId;
    await this.assertSenderReceiverExist(senderId, receiverId);

    let existingNorm: OrderDeliveryStatusValue;
    try {
      existingNorm = normalizeOrderStatus(existing.status);
    } catch {
      throw new BadRequestException(
        `Замовлення має некоректний збережений статус: ${existing.status}`,
      );
    }

    const nextCourierId =
      dto.courierId !== undefined
        ? dto.courierId.trim() || undefined
        : existing.courierId;

    if (dto.courierId !== undefined && nextCourierId) {
      await this.assertCourierAvailableForAssignment(nextCourierId);
    }

    if (
      existing.courierId &&
      !nextCourierId &&
      (existingNorm === OrderDeliveryStatus.ASSIGNED ||
        existingNorm === OrderDeliveryStatus.IN_TRANSIT)
    ) {
      throw new BadRequestException(
        'Не можна прибрати кур’єра з активного замовлення',
      );
    }

    let targetNorm: OrderDeliveryStatusValue;

    if (
      dto.courierId !== undefined &&
      nextCourierId &&
      existingNorm === OrderDeliveryStatus.CREATED &&
      !existing.courierId
    ) {
      if (dto.status === undefined) {
        if (
          !canTransitionOrderStatus(
            existing.status,
            OrderDeliveryStatus.ASSIGNED,
          )
        ) {
          throw new BadRequestException(
            `Заборонений перехід статусу з ${existingNorm} на ${OrderDeliveryStatus.ASSIGNED}`,
          );
        }
        targetNorm = OrderDeliveryStatus.ASSIGNED;
      } else {
        targetNorm = this.parseStatusOrThrow(dto.status);
        if (!canTransitionOrderStatus(existing.status, dto.status)) {
          throw new BadRequestException(
            `Заборонений перехід статусу з ${existingNorm} на ${targetNorm}`,
          );
        }
      }
    } else if (dto.status !== undefined) {
      targetNorm = this.parseStatusOrThrow(dto.status);
      if (!canTransitionOrderStatus(existing.status, dto.status)) {
        throw new BadRequestException(
          `Заборонений перехід статусу з ${existingNorm} на ${targetNorm}`,
        );
      }
    } else {
      targetNorm = existingNorm;
    }

    if (
      nextCourierId &&
      targetNorm === OrderDeliveryStatus.CREATED &&
      existingNorm === OrderDeliveryStatus.CREATED
    ) {
      if (
        !canTransitionOrderStatus(existing.status, OrderDeliveryStatus.ASSIGNED)
      ) {
        throw new BadRequestException(
          `Заборонений перехід статусу з ${existingNorm} на ${OrderDeliveryStatus.ASSIGNED}`,
        );
      }
      targetNorm = OrderDeliveryStatus.ASSIGNED;
    }

    let productIds: string[];
    if (dto.productIds !== undefined) {
      productIds = this.resolveProductIds(dto.productIds);
      await this.catalog.assertProductsExist(productIds);
    } else {
      productIds = existing.productIds;
    }

    const entity: OrderEntity = {
      id,
      orderNumber: dto.orderNumber ?? existing.orderNumber,
      weight: dto.weight ?? existing.weight,
      status: targetNorm,
      senderId,
      receiverId,
      courierId: nextCourierId,
      estimatedArrivalTime:
        dto.estimatedArrivalTime !== undefined
          ? dto.estimatedArrivalTime
          : existing.estimatedArrivalTime,
      productIds,
    };
    await this.orders.saveOrder(entity);
    return this.toResponse(entity);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.orders.getOrder(id);
    if (!existing) {
      throw new NotFoundException(`Замовлення з ID ${id} не знайдено`);
    }
    await this.orders.deleteOrder(id);
  }

  private resolveProductIds(ids: string[] | undefined): string[] {
    if (ids === undefined || ids.length === 0) {
      return [];
    }
    const out: string[] = [];
    const seen = new Set<string>();
    for (const id of ids) {
      const t = id.trim();
      if (t !== '' && !seen.has(t)) {
        seen.add(t);
        out.push(t);
      }
    }
    return out;
  }

  private async assertSenderReceiverExist(
    senderId: string,
    receiverId: string,
  ): Promise<void> {
    const [sender, receiver] = await Promise.all([
      this.clients.getClient(senderId),
      this.clients.getClient(receiverId),
    ]);
    if (!sender) {
      throw new BadRequestException(
        `Клієнт-відправник з ID ${senderId} не знайдено`,
      );
    }
    if (!receiver) {
      throw new BadRequestException(
        `Клієнт-отримувач з ID ${receiverId} не знайдено`,
      );
    }
  }

  private parseStatusOrThrow(raw: string): OrderDeliveryStatusValue {
    try {
      return normalizeOrderStatus(raw);
    } catch {
      throw new BadRequestException(ValidationMessages.order.statusInvalid);
    }
  }

  private async assertCourierAvailableForAssignment(
    courierId: string,
  ): Promise<void> {
    await this.fleet.requireCourierAssignable(courierId);
  }

  private toResponse(entity: OrderEntity): OrderResponse {
    return {
      id: entity.id,
      orderNumber: entity.orderNumber,
      weight: entity.weight,
      status: entity.status,
      senderId: entity.senderId,
      receiverId: entity.receiverId,
      courierId: entity.courierId,
      estimatedArrivalTime: entity.estimatedArrivalTime,
      products: entity.productIds.map((pid) => ({ id: pid })),
    };
  }
}
