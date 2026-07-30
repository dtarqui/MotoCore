# Cliente API generado (OpenAPI)

Este directorio es el destino de `schema.d.ts`, generado automáticamente desde el `swagger.json` del backend con [`openapi-typescript`](https://openapi-ts.dev/).

## Por qué

Hoy los tipos de request/response de cada módulo (`ClientDto`, `MotorcycleDto`, etc.) se replican a mano en cada `types.ts` del frontend. Generar los tipos desde el propio contrato OpenAPI del backend evita que ambos lados se desincronicen silenciosamente cuando alguien cambia un DTO en C# y olvida actualizar el `types.ts` correspondiente.

## Cómo generarlo

1. Levanta el backend en modo desarrollo (`dotnet run --project backend/src/MotoCore.Api`), que expone el spec en `https://localhost:7222/swagger/v1/swagger.json`.
2. Desde `frontend/`, corre:
   ```bash
   npm run generate:api-types
   ```
   Esto crea/actualiza `src/shared/api/schema.d.ts` con los tipos de todos los DTOs y endpoints expuestos por Swagger.
3. Si tu backend corre en otra URL/puerto, edita la URL en el script `generate:api-types` de `package.json`.

## Cómo usarlo (a futuro)

Con `schema.d.ts` generado, los `types.ts` de cada módulo pueden importar directamente los tipos del contrato en vez de redeclararlos:

```ts
import type { components } from '@/shared/api/schema'

export type Client = components['schemas']['ClientDto']
```

**Estado actual**: el tooling (`openapi-typescript` como devDependency + script `generate:api-types`) está listo, pero el archivo `schema.d.ts` todavía no se generó ni se migraron los `types.ts` existentes — requiere tener el backend corriendo localmente para producir el spec. Migrar módulo por módulo (empezando por el más simple, `clientes`) es un buen primer paso incremental.
