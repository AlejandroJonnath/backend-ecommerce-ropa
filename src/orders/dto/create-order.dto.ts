import {
    ArrayMinSize,
    IsArray,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
    @IsUUID()
    productVariantId: string;

    @IsInt()
    @Min(1)
    quantity: number;
}

export class CreateOrderDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];

    @IsString()
    @MaxLength(200)
    shippingRecipientName: string;

    @IsString()
    @MaxLength(20)
    shippingPhone: string;

    @IsString()
    @MaxLength(100)
    shippingProvince: string;

    @IsString()
    @MaxLength(100)
    shippingCity: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    shippingParish?: string;

    @IsString()
    @MaxLength(255)
    shippingStreet: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    shippingReference?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    shippingPostalCode?: string;
}