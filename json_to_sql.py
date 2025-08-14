import json

# Carga el JSON
with open('logica_dba.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

sql_lines = []

# Crea las tablas
sql_lines.append("""
CREATE TABLE IF NOT EXISTS estandares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    area VARCHAR(100),
    nivel VARCHAR(10),
    enunciado TEXT,
    ejemplo TEXT
);

CREATE TABLE IF NOT EXISTS evidencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estandar_id INT,
    evidencia TEXT,
    FOREIGN KEY (estandar_id) REFERENCES estandares(id)
);
""")

for entry in data:
    area = entry.get('area', None)
    nivel = entry.get('nivel', None)
    enunciado = entry.get('enunciado', None)
    ejemplo = entry.get('ejemplo', None)
    evidencias = entry.get('evidencias_de_aprendizaje', [])

    # Solo inserta en estandares si tiene area, nivel y enunciado
    if area and nivel and enunciado:
        # Escapa comillas simples
        area_sql = area.replace("'", "''")
        nivel_sql = nivel.replace("'", "''")
        enunciado_sql = enunciado.replace("'", "''")
        ejemplo_sql = (ejemplo or '').replace("'", "''")
        sql_lines.append(f"INSERT INTO estandares (area, nivel, enunciado, ejemplo) VALUES ('{area_sql}', '{nivel_sql}', '{enunciado_sql}', '{ejemplo_sql}');")
        sql_lines.append("SET @estandar_id = LAST_INSERT_ID();")
        for evidencia in evidencias:
            evidencia_sql = evidencia.replace("'", "''")
            sql_lines.append(f"INSERT INTO evidencias (estandar_id, evidencia) VALUES (@estandar_id, '{evidencia_sql}');")
    elif ejemplo:  # Si solo hay ejemplo, puedes guardarlo en estandares sin área/otros campos
        ejemplo_sql = ejemplo.replace("'", "''")
        sql_lines.append(f"INSERT INTO estandares (ejemplo) VALUES ('{ejemplo_sql}');")

# Guarda el resultado en un archivo .sql
with open('logica_dba.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print("¡Conversión completada! Revisa el archivo logica_dba.sql.")