# Práctica MongoDB: Rastro

Entrega de diseño y consultas en MongoDB para una aplicación de segunda mano.

## Estructura de archivos
- `rastro.js`: Script principal con los ejercicios B2 a B7 listos para ejecutarse en `mongosh`.
- `carga_inicial.js`: Script auxiliar con los datos iniciales de B1.
- `respuestas.md`: Razonamientos de la Parte A, predicciones/resultados de B4, y respuestas a las cuestiones teóricas.

## Instrucciones de ejecución

1. Levantar el servicio de MongoDB (mediante Docker Compose o contenedor de clase):
   ```bash
   docker compose up -d
   ```

2. Cargar los datos iniciales (B1):
   ```bash
   docker exec -i mongodb-practica mongosh -u admin -p admin_dev_123 --authenticationDatabase admin < carga_inicial.js
   ```

3. Ejecutar el script de ejercicios:
   ```bash
   docker exec -i mongodb-practica mongosh -u admin -p admin_dev_123 --authenticationDatabase admin < rastro.js
   ```

