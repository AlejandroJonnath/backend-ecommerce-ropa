import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReservedStock1791020564145 implements MigrationInterface {
    name = 'AddReservedStock1791020564145'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variants" ADD "reserved_stock" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD CONSTRAINT "chk_product_variant_reserved_not_greater_stock" CHECK (reserved_stock <= stock)`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD CONSTRAINT "chk_product_variant_reserved_stock" CHECK (reserved_stock >= 0)`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD CONSTRAINT "chk_product_variant_stock" CHECK (stock >= 0)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT "chk_product_variant_stock"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT "chk_product_variant_reserved_stock"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT "chk_product_variant_reserved_not_greater_stock"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN "reserved_stock"`);
    }

}
