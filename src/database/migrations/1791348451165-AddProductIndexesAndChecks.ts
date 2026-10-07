import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductIndexesAndChecks1791348451165 implements MigrationInterface {
    name = 'AddProductIndexesAndChecks1791348451165'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_product_images_product_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_is_active"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_category_id"`);
        await queryRunner.query(`CREATE INDEX "idx_product_images_product_position" ON "product_images"  ("product_id", "position") `);
        await queryRunner.query(`CREATE INDEX "idx_products_active_name" ON "products"  ("is_active", "name") `);
        await queryRunner.query(`CREATE INDEX "idx_products_active_created_at" ON "products"  ("is_active", "created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_products_category_active" ON "products"  ("category_id", "is_active") `);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "chk_product_base_price" CHECK (base_price >= 0)`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD CONSTRAINT "chk_product_variant_price" CHECK (price IS NULL OR price >= 0)`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD CONSTRAINT "chk_product_variant_cost" CHECK (cost >= 0)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT "chk_product_variant_cost"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT "chk_product_variant_price"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "chk_product_base_price"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_category_active"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_active_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_active_name"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_images_product_position"`);
        await queryRunner.query(`CREATE INDEX "idx_products_category_id" ON "products" USING btree ("category_id") `);
        await queryRunner.query(`CREATE INDEX "idx_products_is_active" ON "products" USING btree ("is_active") `);
        await queryRunner.query(`CREATE INDEX "idx_products_created_at" ON "products" USING btree ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_product_images_product_id" ON "product_images" USING btree ("product_id") `);
    }

}
