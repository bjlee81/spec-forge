import type { DesignIR, DataModel, DataField } from '@figma-codegen/design-parser';

export interface DatabaseSchema {
    tables: TableDefinition[];
    sql: string;
}

export interface TableDefinition {
    name: string;
    columns: ColumnDefinition[];
    primaryKey: string;
    foreignKeys: ForeignKey[];
    indexes: IndexDefinition[];
}

export interface ColumnDefinition {
    name: string;
    type: string;
    nullable: boolean;
    unique: boolean;
    defaultValue?: string;
}

export interface ForeignKey {
    column: string;
    references: { table: string; column: string };
}

export interface IndexDefinition {
    name: string;
    columns: string[];
    unique: boolean;
}

/**
 * Design IR에서 Database Schema를 생성합니다.
 */
export class SchemaGenerator {
    generate(ir: DesignIR): DatabaseSchema {
        const tables = ir.dataModels.map(model => this.modelToTable(model));
        const sql = this.generateSQL(tables);

        return { tables, sql };
    }

    private modelToTable(model: DataModel): TableDefinition {
        const columns: ColumnDefinition[] = [
            // ID 컬럼 자동 추가
            { name: 'id', type: 'BIGINT AUTO_INCREMENT', nullable: false, unique: true },
            // 모델 필드 → 컬럼 변환
            ...model.fields
                .filter(f => f.name !== 'id')
                .map(f => this.fieldToColumn(f)),
            // 감사 컬럼
            { name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, defaultValue: 'CURRENT_TIMESTAMP' },
            { name: 'updated_at', type: 'TIMESTAMP', nullable: false, unique: false, defaultValue: 'CURRENT_TIMESTAMP' },
        ];

        const foreignKeys: ForeignKey[] = model.relations.map(rel => ({
            column: rel.foreignKey || `${rel.targetModel.toLowerCase()}_id`,
            references: { table: this.toSnakeCase(rel.targetModel), column: 'id' },
        }));

        return {
            name: this.toSnakeCase(model.name),
            columns,
            primaryKey: 'id',
            foreignKeys,
            indexes: model.fields
                .filter(f => f.unique)
                .map(f => ({
                    name: `idx_${this.toSnakeCase(model.name)}_${this.toSnakeCase(f.name)}`,
                    columns: [this.toSnakeCase(f.name)],
                    unique: true,
                })),
        };
    }

    private fieldToColumn(field: DataField): ColumnDefinition {
        return {
            name: this.toSnakeCase(field.name),
            type: this.fieldTypeToSQLType(field.type),
            nullable: !field.required,
            unique: field.unique || false,
            defaultValue: field.defaultValue,
        };
    }

    private fieldTypeToSQLType(type: string): string {
        switch (type) {
            case 'STRING': return 'VARCHAR(255)';
            case 'TEXT': return 'TEXT';
            case 'INTEGER': return 'INT';
            case 'FLOAT': return 'DECIMAL(10,2)';
            case 'BOOLEAN': return 'BOOLEAN';
            case 'DATE': return 'DATE';
            case 'DATETIME': return 'TIMESTAMP';
            case 'EMAIL': return 'VARCHAR(320)';
            case 'URL': return 'VARCHAR(2048)';
            case 'PASSWORD': return 'VARCHAR(255)';
            case 'ENUM': return 'VARCHAR(50)';
            case 'JSON': return 'JSON';
            default: return 'VARCHAR(255)';
        }
    }

    generateSQL(tables: TableDefinition[]): string {
        return tables.map(t => this.tableToSQL(t)).join('\n\n');
    }

    private tableToSQL(table: TableDefinition): string {
        const columns = table.columns.map(c => {
            let def = `  ${c.name} ${c.type}`;
            if (!c.nullable) def += ' NOT NULL';
            if (c.unique && c.name !== 'id') def += ' UNIQUE';
            if (c.defaultValue) def += ` DEFAULT ${c.defaultValue}`;
            return def;
        });

        columns.push(`  PRIMARY KEY (${table.primaryKey})`);

        for (const fk of table.foreignKeys) {
            columns.push(
                `  FOREIGN KEY (${fk.column}) REFERENCES ${fk.references.table}(${fk.references.column})`
            );
        }

        let sql = `CREATE TABLE IF NOT EXISTS ${table.name} (\n${columns.join(',\n')}\n);`;

        for (const idx of table.indexes) {
            sql += `\nCREATE ${idx.unique ? 'UNIQUE ' : ''}INDEX ${idx.name} ON ${table.name} (${idx.columns.join(', ')});`;
        }

        return sql;
    }

    private toSnakeCase(str: string): string {
        return str
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '')
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
    }
}
