import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Brackets, Repository } from 'typeorm';

import { Category } from '../categories/entities/category.entity.js';
import { Color } from '../colors/entities/color.entity.js';
import { Size } from '../sizes/entities/size.entity.js';

import { CreateProductDto } from './dto/create-product.dto.js';
import { CreateProductVariantDto } from './dto/create-product-variant.dto.js';
import { QueryProductsDto } from './dto/query-products.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto.js';

import { Product } from './entities/product.entity.js';
import { ProductVariant } from './entities/product-variant.entity.js';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,

        @InjectRepository(ProductVariant)
        private readonly productVariantRepository: Repository<ProductVariant>,

        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,

        @InjectRepository(Size)
        private readonly sizeRepository: Repository<Size>,

        @InjectRepository(Color)
        private readonly colorRepository: Repository<Color>,
    ) { }

    async findAll(query: QueryProductsDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const sortBy = query.sortBy ?? 'createdAt';
        const sortOrder = query.sortOrder ?? 'DESC';

        const queryBuilder = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.images', 'image')
            .where('product.is_active = true')
            .andWhere('category.is_active = true');

        if (query.categoryId) {
            queryBuilder.andWhere(
                'product.category_id = :categoryId',
                {
                    categoryId: query.categoryId,
                },
            );
        }

        if (query.search?.trim()) {
            const search = query.search
                .trim()
                .replace(/[%_]/g, '\\$&');

            queryBuilder.andWhere(
                new Brackets((qb) => {
                    qb.where(
                        'product.name ILIKE :search',
                        {
                            search: `%${search}%`,
                        },
                    ).orWhere(
                        'product.description ILIKE :search',
                        {
                            search: `%${search}%`,
                        },
                    );
                }),
            );
        }

        const sortColumn = this.getSortColumn(sortBy);

        queryBuilder
            .orderBy(sortColumn, sortOrder)
            .addOrderBy('product.id', 'ASC')
            .skip(skip)
            .take(limit);

        const [products, total] =
            await queryBuilder.getManyAndCount();

        return {
            data: products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage:
                    page < Math.ceil(total / limit),
                hasPreviousPage: page > 1,
            },
        };
    }

    async findAllForAdmin(query: QueryProductsDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const sortBy = query.sortBy ?? 'createdAt';
        const sortOrder = query.sortOrder ?? 'DESC';

        const queryBuilder = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.images', 'image');

        if (query.categoryId) {
            queryBuilder.andWhere(
                'product.category_id = :categoryId',
                {
                    categoryId: query.categoryId,
                },
            );
        }

        if (query.search?.trim()) {
            const search = query.search
                .trim()
                .replace(/[%_]/g, '\\$&');

            queryBuilder.andWhere(
                new Brackets((qb) => {
                    qb.where(
                        'product.name ILIKE :search',
                        {
                            search: `%${search}%`,
                        },
                    ).orWhere(
                        'product.description ILIKE :search',
                        {
                            search: `%${search}%`,
                        },
                    );
                }),
            );
        }

        const sortColumn = this.getSortColumn(sortBy);

        queryBuilder
            .orderBy(sortColumn, sortOrder)
            .addOrderBy('product.id', 'ASC')
            .skip(skip)
            .take(limit);

        const [products, total] =
            await queryBuilder.getManyAndCount();

        return {
            data: products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage:
                    page < Math.ceil(total / limit),
                hasPreviousPage: page > 1,
            },
        };
    }

    async findOne(id: string): Promise<Product> {
        const product = await this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect(
                'product.category',
                'category',
            )
            .leftJoinAndSelect(
                'product.images',
                'image',
            )
            .leftJoinAndSelect(
                'product.variants',
                'variant',
            )
            .leftJoinAndSelect(
                'variant.size',
                'size',
            )
            .leftJoinAndSelect(
                'variant.color',
                'color',
            )
            .where('product.id = :id', { id })
            .andWhere('product.is_active = true')
            .andWhere('category.is_active = true')
            .andWhere(
                '(variant.id IS NULL OR variant.is_active = true)',
            )
            .getOne();

        if (!product) {
            throw new NotFoundException(
                'El producto no existe o está inactivo.',
            );
        }

        return product;
    }

    async findOneForAdmin(
        id: string,
    ): Promise<Product> {
        const product = await this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect(
                'product.category',
                'category',
            )
            .leftJoinAndSelect(
                'product.images',
                'image',
            )
            .leftJoinAndSelect(
                'product.variants',
                'variant',
            )
            .leftJoinAndSelect(
                'variant.size',
                'size',
            )
            .leftJoinAndSelect(
                'variant.color',
                'color',
            )
            .where('product.id = :id', { id })
            .getOne();

        if (!product) {
            throw new NotFoundException(
                'El producto no existe.',
            );
        }

        return product;
    }

    async create(
        dto: CreateProductDto,
    ): Promise<Product> {
        const name = dto.name.trim();
        const slug = dto.slug.trim().toLowerCase();
        const basePrice = dto.basePrice.trim();

        const category =
            await this.categoryRepository.findOne({
                where: {
                    id: dto.categoryId,
                    isActive: true,
                },
            });

        if (!category) {
            throw new NotFoundException(
                'La categoría no existe o está inactiva.',
            );
        }

        const existingSlug =
            await this.productRepository.findOne({
                where: { slug },
            });

        if (existingSlug) {
            throw new ConflictException(
                'Ya existe un producto con ese slug.',
            );
        }

        const product =
            this.productRepository.create({
                categoryId: dto.categoryId,
                name,
                slug,
                description:
                    dto.description?.trim() ?? null,
                basePrice,
                isActive: true,
            });

        try {
            const savedProduct =
                await this.productRepository.save(
                    product,
                );

            return this.findOneForAdmin(
                savedProduct.id,
            );
        } catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new ConflictException(
                    'Ya existe un producto con ese slug.',
                );
            }

            throw error;
        }
    }

    async update(
        id: string,
        dto: UpdateProductDto,
    ): Promise<Product> {
        const product =
            await this.findOneForAdmin(id);

        if (dto.categoryId !== undefined) {
            const category =
                await this.categoryRepository.findOne({
                    where: {
                        id: dto.categoryId,
                        isActive: true,
                    },
                });

            if (!category) {
                throw new NotFoundException(
                    'La categoría no existe o está inactiva.',
                );
            }

            product.categoryId = dto.categoryId;
        }

        if (dto.name !== undefined) {
            product.name = dto.name.trim();
        }

        if (dto.slug !== undefined) {
            const slug =
                dto.slug.trim().toLowerCase();

            if (slug !== product.slug) {
                const existingSlug =
                    await this.productRepository.findOne({
                        where: { slug },
                    });

                if (
                    existingSlug &&
                    existingSlug.id !== id
                ) {
                    throw new ConflictException(
                        'Ya existe un producto con ese slug.',
                    );
                }

                product.slug = slug;
            }
        }

        if (dto.description !== undefined) {
            product.description =
                dto.description.trim();
        }

        if (dto.basePrice !== undefined) {
            product.basePrice =
                dto.basePrice.trim();
        }

        try {
            await this.productRepository.save(
                product,
            );

            return this.findOneForAdmin(
                product.id,
            );
        } catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new ConflictException(
                    'Ya existe un producto con ese slug.',
                );
            }

            throw error;
        }
    }

    async deactivate(
        id: string,
    ): Promise<Product> {
        const product =
            await this.findOneForAdmin(id);

        if (!product.isActive) {
            return product;
        }

        product.isActive = false;

        return this.productRepository.save(
            product,
        );
    }

    async activate(
        id: string,
    ): Promise<Product> {
        const product =
            await this.findOneForAdmin(id);

        if (product.isActive) {
            return product;
        }

        const category =
            await this.categoryRepository.findOne({
                where: {
                    id: product.categoryId,
                    isActive: true,
                },
            });

        if (!category) {
            throw new ConflictException(
                'No puedes activar el producto porque su categoría está inactiva.',
            );
        }

        product.isActive = true;

        return this.productRepository.save(
            product,
        );
    }

    async findVariants(
        productId: string,
    ): Promise<ProductVariant[]> {
        await this.ensureProductExists(
            productId,
        );

        return this.productVariantRepository.find({
            where: { productId },
            relations: {
                size: true,
                color: true,
            },
            order: {
                sku: 'ASC',
            },
        });
    }

    async findVariant(
        productId: string,
        variantId: string,
    ): Promise<ProductVariant> {
        const variant =
            await this.productVariantRepository.findOne({
                where: {
                    id: variantId,
                    productId,
                },
                relations: {
                    size: true,
                    color: true,
                    product: true,
                },
            });

        if (!variant) {
            throw new NotFoundException(
                'La variante no existe para este producto.',
            );
        }

        return variant;
    }

    async createVariant(
        productId: string,
        dto: CreateProductVariantDto,
    ): Promise<ProductVariant> {
        const product =
            await this.ensureProductExists(
                productId,
            );

        if (!product.isActive) {
            throw new ConflictException(
                'No puedes agregar variantes a un producto inactivo.',
            );
        }

        const size =
            await this.sizeRepository.findOne({
                where: {
                    id: dto.sizeId,
                    isActive: true,
                },
            });

        if (!size) {
            throw new NotFoundException(
                'La talla no existe o está inactiva.',
            );
        }

        const color =
            await this.colorRepository.findOne({
                where: {
                    id: dto.colorId,
                    isActive: true,
                },
            });

        if (!color) {
            throw new NotFoundException(
                'El color no existe o está inactivo.',
            );
        }

        const sku = dto.sku.trim();

        const existingSku =
            await this.productVariantRepository.findOne({
                where: { sku },
            });

        if (existingSku) {
            throw new ConflictException(
                'Ya existe una variante con ese SKU.',
            );
        }

        const existingCombination =
            await this.productVariantRepository.findOne({
                where: {
                    productId,
                    sizeId: dto.sizeId,
                    colorId: dto.colorId,
                },
            });

        if (existingCombination) {
            throw new ConflictException(
                'Ya existe una variante con esa combinación de talla y color.',
            );
        }

        const variant =
            this.productVariantRepository.create({
                productId,
                sizeId: dto.sizeId,
                colorId: dto.colorId,
                sku,
                price:
                    dto.price?.trim() ?? null,
                cost: dto.cost.trim(),

                // Toda variante nueva comienza sin stock.
                // Las entradas deben registrarse mediante Inventory.
                stock: 0,

                reservedStock: 0,
                isActive: true,
            });

        try {
            const savedVariant =
                await this.productVariantRepository.save(
                    variant,
                );

            return this.findVariant(
                productId,
                savedVariant.id,
            );
        } catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new ConflictException(
                    'El SKU o la combinación de talla y color ya existe.',
                );
            }

            throw error;
        }
    }

    async updateVariant(
        productId: string,
        variantId: string,
        dto: UpdateProductVariantDto,
    ): Promise<ProductVariant> {
        const variant =
            await this.findVariant(
                productId,
                variantId,
            );

        if (dto.sizeId !== undefined) {
            const size =
                await this.sizeRepository.findOne({
                    where: {
                        id: dto.sizeId,
                        isActive: true,
                    },
                });

            if (!size) {
                throw new NotFoundException(
                    'La talla no existe o está inactiva.',
                );
            }

            variant.sizeId = dto.sizeId;
        }

        if (dto.colorId !== undefined) {
            const color =
                await this.colorRepository.findOne({
                    where: {
                        id: dto.colorId,
                        isActive: true,
                    },
                });

            if (!color) {
                throw new NotFoundException(
                    'El color no existe o está inactivo.',
                );
            }

            variant.colorId = dto.colorId;
        }

        if (dto.sku !== undefined) {
            const sku = dto.sku.trim();

            if (sku !== variant.sku) {
                const existingSku =
                    await this.productVariantRepository.findOne({
                        where: { sku },
                    });

                if (
                    existingSku &&
                    existingSku.id !== variant.id
                ) {
                    throw new ConflictException(
                        'Ya existe una variante con ese SKU.',
                    );
                }

                variant.sku = sku;
            }
        }

        if (dto.price !== undefined) {
            variant.price = dto.price.trim();
        }

        if (dto.cost !== undefined) {
            variant.cost = dto.cost.trim();
        }

        const duplicateCombination =
            await this.productVariantRepository.findOne({
                where: {
                    productId,
                    sizeId: variant.sizeId,
                    colorId: variant.colorId,
                },
            });

        if (
            duplicateCombination &&
            duplicateCombination.id !== variant.id
        ) {
            throw new ConflictException(
                'Ya existe otra variante con esa combinación de talla y color.',
            );
        }

        try {
            await this.productVariantRepository.save(
                variant,
            );

            return this.findVariant(
                productId,
                variantId,
            );
        } catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new ConflictException(
                    'El SKU o la combinación de talla y color ya existe.',
                );
            }

            throw error;
        }
    }

    async deactivateVariant(
        productId: string,
        variantId: string,
    ): Promise<ProductVariant> {
        const variant =
            await this.findVariant(
                productId,
                variantId,
            );

        if (!variant.isActive) {
            return variant;
        }

        if (variant.reservedStock > 0) {
            throw new ConflictException(
                'No puedes desactivar una variante que tiene stock reservado.',
            );
        }

        variant.isActive = false;

        return this.productVariantRepository.save(
            variant,
        );
    }

    async activateVariant(
        productId: string,
        variantId: string,
    ): Promise<ProductVariant> {
        const variant =
            await this.findVariant(
                productId,
                variantId,
            );

        if (variant.isActive) {
            return variant;
        }

        const product =
            await this.ensureProductExists(
                productId,
            );

        if (!product.isActive) {
            throw new ConflictException(
                'No puedes activar una variante de un producto inactivo.',
            );
        }

        const size =
            await this.sizeRepository.findOne({
                where: {
                    id: variant.sizeId,
                    isActive: true,
                },
            });

        if (!size) {
            throw new ConflictException(
                'No puedes activar la variante porque su talla está inactiva.',
            );
        }

        const color =
            await this.colorRepository.findOne({
                where: {
                    id: variant.colorId,
                    isActive: true,
                },
            });

        if (!color) {
            throw new ConflictException(
                'No puedes activar la variante porque su color está inactivo.',
            );
        }

        variant.isActive = true;

        return this.productVariantRepository.save(
            variant,
        );
    }

    private async ensureProductExists(
        productId: string,
    ): Promise<Product> {
        const product =
            await this.productRepository.findOne({
                where: {
                    id: productId,
                },
            });

        if (!product) {
            throw new NotFoundException(
                'El producto no existe.',
            );
        }

        return product;
    }

    private getSortColumn(
        sortBy:
            | 'name'
            | 'price'
            | 'createdAt',
    ): string {
        switch (sortBy) {
            case 'name':
                return 'product.name';

            case 'price':
                return 'product.base_price';

            case 'createdAt':
            default:
                return 'product.created_at';
        }
    }

    private isUniqueViolation(
        error: unknown,
    ): boolean {
        if (
            typeof error !== 'object' ||
            error === null
        ) {
            return false;
        }

        const databaseError =
            error as { code?: string };

        return databaseError.code === '23505';
    }
}