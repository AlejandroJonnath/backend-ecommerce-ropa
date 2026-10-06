import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryIndexes1791255709427 implements MigrationInterface {
    name = 'AddCategoryIndexes1791255709427'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "idx_categories_active_name" ON "categories"  ("is_active", "name") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_categories_active_name"`);
    }

}
