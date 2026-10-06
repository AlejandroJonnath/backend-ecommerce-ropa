import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import {
    Repository,
} from 'typeorm';

import {
    InjectRepository,
} from '@nestjs/typeorm';

import {
    Category,
} from './entities/category.entity.js';

import {
    CreateCategoryDto,
} from './dto/create-category.dto.js';

import {
    UpdateCategoryDto,
} from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepository:
            Repository<Category>,
    ) { }

    /**
     * Obtiene todas las categorías activas.
     *
     * Esta operación es pública y será utilizada
     * principalmente por el catálogo.
     */
    async findAll(): Promise<Category[]> {
        return this.categoryRepository.find({
            where: {
                isActive: true,
            },
            order: {
                name: 'ASC',
            },
        });
    }

    /**
     * Obtiene todas las categorías.
     *
     * Pensado principalmente para administración.
     */
    async findAllForAdmin(): Promise<Category[]> {
        return this.categoryRepository.find({
            order: {
                name: 'ASC',
            },
        });
    }

    /**
     * Obtiene una categoría activa por ID.
     */
    async findOne(
        id: string,
    ): Promise<Category> {
        const category =
            await this.categoryRepository.findOne({
                where: {
                    id,
                    isActive: true,
                },
            });

        if (!category) {
            throw new NotFoundException(
                'La categoría no existe o está inactiva.',
            );
        }

        return category;
    }

    /**
     * Obtiene una categoría por ID para administración.
     *
     * A diferencia de findOne(), también permite
     * encontrar categorías inactivas.
     */
    async findOneForAdmin(
        id: string,
    ): Promise<Category> {
        const category =
            await this.categoryRepository.findOne({
                where: {
                    id,
                },
            });

        if (!category) {
            throw new NotFoundException(
                'La categoría no existe.',
            );
        }

        return category;
    }

    /**
     * Crea una categoría.
     */
    async create(
        dto: CreateCategoryDto,
    ): Promise<Category> {
        const name =
            dto.name.trim();

        const slug =
            dto.slug.trim().toLowerCase();

        /**
         * Comprobamos el slug antes de intentar
         * guardar la categoría.
         *
         * Aun así, la base de datos mantiene
         * la restricción UNIQUE como última defensa.
         */
        const existingSlug =
            await this.categoryRepository.findOne({
                where: {
                    slug,
                },
            });

        if (existingSlug) {
            throw new ConflictException(
                'Ya existe una categoría con ese slug.',
            );
        }

        const category =
            this.categoryRepository.create({
                name,

                slug,

                description:
                    dto.description?.trim() ??
                    null,

                imageUrl:
                    dto.imageUrl?.trim() ??
                    null,

                isActive: true,
            });

        try {
            return await this.categoryRepository.save(
                category,
            );
        } catch (error) {
            /**
             * La restricción UNIQUE de PostgreSQL
             * sigue siendo la protección definitiva
             * contra condiciones de carrera.
             */
            if (
                this.isUniqueViolation(error)
            ) {
                throw new ConflictException(
                    'Ya existe una categoría con ese slug.',
                );
            }

            throw error;
        }
    }

    /**
     * Actualiza una categoría.
     */
    async update(
        id: string,
        dto: UpdateCategoryDto,
    ): Promise<Category> {
        const category =
            await this.findOneForAdmin(id);

        if (dto.name !== undefined) {
            category.name =
                dto.name.trim();
        }

        if (dto.slug !== undefined) {
            const slug =
                dto.slug.trim().toLowerCase();

            /**
             * Solo comprobamos si realmente
             * cambió el slug.
             */
            if (
                slug !== category.slug
            ) {
                const existingSlug =
                    await this.categoryRepository.findOne({
                        where: {
                            slug,
                        },
                    });

                if (
                    existingSlug &&
                    existingSlug.id !== id
                ) {
                    throw new ConflictException(
                        'Ya existe una categoría con ese slug.',
                    );
                }

                category.slug =
                    slug;
            }
        }

        if (
            dto.description !== undefined
        ) {
            category.description =
                dto.description.trim();
        }

        if (
            dto.imageUrl !== undefined
        ) {
            category.imageUrl =
                dto.imageUrl.trim();
        }

        try {
            return await this.categoryRepository.save(
                category,
            );
        } catch (error) {
            if (
                this.isUniqueViolation(error)
            ) {
                throw new ConflictException(
                    'Ya existe una categoría con ese slug.',
                );
            }

            throw error;
        }
    }

    /**
     * Desactiva una categoría.
     *
     * No eliminamos físicamente el registro.
     */
    async deactivate(
        id: string,
    ): Promise<Category> {
        const category =
            await this.findOneForAdmin(id);

        if (!category.isActive) {
            return category;
        }

        category.isActive = false;

        return this.categoryRepository.save(
            category,
        );
    }

    /**
     * Reactiva una categoría.
     */
    async activate(
        id: string,
    ): Promise<Category> {
        const category =
            await this.findOneForAdmin(id);

        if (category.isActive) {
            return category;
        }

        category.isActive = true;

        return this.categoryRepository.save(
            category,
        );
    }

    /**
     * Detecta una violación de UNIQUE
     * de PostgreSQL.
     */
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
            error as {
                code?: string;
            };

        return (
            databaseError.code === '23505'
        );
    }
}