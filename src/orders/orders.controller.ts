import { Body, Controller, Post } from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto.js";
import { OrdersService } from "./orders.service.js";

@Controller('orders')
export class OrdersController {

    constructor(private readonly ordersService: OrdersService,) { }

    @Post()
    async createOrder(
        @Body() dto: CreateOrderDto,
    ) {

        /*
        De manera temporal voy a usar un UUID de prueba. Cuando implemente el JWT, este valor vendrá directamente del usuario autenticado
        */
        const userId = '00000000-0000-0000-0000-000000000001';

        return this.ordersService.createOrder(userId, dto);
    }
}