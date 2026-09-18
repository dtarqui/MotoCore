import type { ZodTypeAny } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AUDIT_ACTIONS } from './lib/audit.js';
import { ROLES } from './types.js';
import { createClientSchema, updateClientSchema } from './modules/clients/clients.schemas.js';
import { registerSchema } from './modules/identity/identity.schemas.js';
import {
  createPartSchema,
  DIRECT_MOVEMENT_TYPES,
  MOVEMENT_TYPES,
  movementSchema,
  transferSchema,
  updatePartSchema,
} from './modules/inventory/inventory.schemas.js';
import { inviteMemberSchema, updateRoleSchema } from './modules/members/members.schemas.js';
import { createOrganizationSchema, updateOrganizationSchema } from './modules/organizations/organizations.schemas.js';
import {
  assignMemberSchema,
  createWorkshopSchema,
  updateWorkshopSchema,
} from './modules/workshops/workshops.schemas.js';

/**
 * DESCRIPCIÓN OPENAPI 3.1 DE LA INTERFAZ — §7 del contrato, entregable del
 * objetivo específico 3.
 *
 * **Deriva del contrato y no lo sustituye**: ante cualquier discrepancia manda
 * el documento, y esto se corrige. Para que la descripción no se desincronice
 * del código, los cuerpos de petición se generan a partir de los **mismos
 * esquemas Zod** que validan cada operación: cambiar un esquema cambia la
 * descripción, sin que nadie tenga que acordarse.
 *
 * El documento se escribe en `server/openapi.json` con `npm run openapi`, y una
 * prueba de contrato comprueba que el archivo publicado coincide con lo que
 * este módulo genera. No se expone como ruta: la superficie pública de la
 * interfaz son el registro y la comprobación de disponibilidad, y nada más
 * ([Seguridad](../../docs/ingenieria/06-seguridad.md)).
 */

type Json = Record<string, unknown>;

/** Esquema de entrada, tomado del DTO que valida la operación. */
function fromZod(schema: ZodTypeAny): Json {
  const json = zodToJsonSchema(schema, { $refStrategy: 'none', errorMessages: false }) as Json;
  delete json.$schema;
  return json;
}

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const uuid = { type: 'string', format: 'uuid' } as const;
const timestamp = { type: 'string', format: 'date-time' } as const;
const nullableString = { type: ['string', 'null'] } as const;
const nullableTimestamp = { type: ['string', 'null'], format: 'date-time' } as const;
const nullableNumber = { type: ['number', 'null'] } as const;

/**
 * CATÁLOGO DE ERRORES — §4 del contrato. Es **cerrado**: la interfaz no emite
 * ningún código fuera de esta tabla, y la descripción la publica entera para
 * que un consumidor pueda programar contra ella.
 */
export const ERROR_CATALOG: Record<string, { status: number; when: string }> = {
  'auth.missing_token': { status: 401, when: 'Falta la credencial' },
  'auth.invalid_token': { status: 401, when: 'Credencial inválida o expirada' },
  'auth.email_already_registered': { status: 409, when: 'El correo ya tiene cuenta (RF-101)' },
  'auth.registration_failed': { status: 500, when: 'El registro no pudo completarse entero; no queda nada aplicado' },
  'organization.missing_active_org': { status: 400, when: 'Falta X-Org-Id' },
  'organization.access_denied': { status: 403, when: 'Sin membresía activa en la organización indicada' },
  'organization.insufficient_permissions': {
    status: 403,
    when: 'El rol no habilita la operación sobre la organización',
  },
  'organization.not_found': { status: 404, when: 'La organización no existe o el solicitante no es miembro' },
  'workshop.missing_active_workshop': { status: 400, when: 'Falta X-Workshop-Id' },
  'workshop.not_found': { status: 404, when: 'El taller no existe o no pertenece a la organización activa' },
  'workshop.duplicate_name': { status: 409, when: 'Ya existe un taller con ese nombre en la organización (RF-301)' },
  'workshop.insufficient_permissions': { status: 403, when: 'Solo el Owner administra talleres' },
  'member.not_found': {
    status: 404,
    when: 'No hay cuenta con ese correo, o no es miembro de la organización (RF-401)',
  },
  'member.already_active': { status: 409, when: 'La persona ya es miembro activo' },
  'member.owner_role_forbidden': { status: 403, when: 'Se intentó invitar o promover a owner (RF-402)' },
  'member.owner_protected': { status: 403, when: 'Se intentó cambiar el rol del propietario o removerlo (RF-405)' },
  'member.insufficient_permissions': { status: 403, when: 'Solo el Owner gestiona miembros (RF-406)' },
  'client.not_found': { status: 404, when: 'El cliente no existe o pertenece a otra organización' },
  'client.duplicate_email': { status: 409, when: 'Correo repetido dentro de la organización (RF-503)' },
  'client.insufficient_permissions': { status: 403, when: 'El rol no permite crear ni modificar clientes (RF-505)' },
  'inventory.part_not_found': { status: 404, when: 'El repuesto no existe o pertenece a otro taller' },
  'inventory.duplicate_part_number': { status: 409, when: 'Número de parte repetido en el taller (RF-603)' },
  'inventory.invalid_movement_type': { status: 400, when: 'Tipo de movimiento no registrable directamente (RF-604)' },
  'inventory.invalid_quantity': { status: 400, when: 'Cantidad ausente, nula o negativa' },
  'inventory.insufficient_stock': { status: 409, when: 'El movimiento dejaría la existencia en negativo (RF-606)' },
  'inventory.cross_organization_transfer': {
    status: 403,
    when: 'Destino de transferencia fuera de la organización (RF-608)',
  },
  'inventory.same_workshop_transfer': { status: 400, when: 'Origen y destino son el mismo taller' },
  'inventory.insufficient_permissions': {
    status: 403,
    when: 'El rol no permite administrar el catálogo ni transferir (RF-609)',
  },
  'audit.insufficient_permissions': { status: 403, when: 'Solo el Owner consulta la auditoría (RF-704)' },
  'validation.invalid_body': {
    status: 400,
    when: 'La entrada no satisface el esquema; el detalle acompaña por campo (RNF-205)',
  },
  'server.error': { status: 500, when: 'Fallo inesperado del servidor. No transporta detalle interno' },
};

/** Respuestas de error de una operación, agrupadas por estado (§2.7: Problem Details). */
function errors(codes: string[]): Json {
  const byStatus = new Map<number, string[]>();
  for (const code of codes) {
    const entry = ERROR_CATALOG[code];
    if (!entry) throw new Error(`Código fuera del catálogo del contrato: ${code}`);
    byStatus.set(entry.status, [...(byStatus.get(entry.status) ?? []), code]);
  }

  const responses: Json = {};
  for (const [status, list] of [...byStatus.entries()].sort((a, b) => a[0] - b[0])) {
    responses[String(status)] = {
      description: list.map((code) => `\`${code}\` — ${ERROR_CATALOG[code]!.when}`).join('; '),
      content: {
        'application/problem+json': {
          schema: ref('Problem'),
          examples: Object.fromEntries(
            list.map((code) => [
              code,
              { value: { type: 'about:blank', title: code, status, detail: ERROR_CATALOG[code]!.when } },
            ]),
          ),
        },
      },
    };
  }
  return responses;
}

/** Códigos que puede emitir cualquier operación autenticada. */
const AUTH_ERRORS = ['auth.missing_token', 'auth.invalid_token', 'server.error'];
const ORG_CONTEXT_ERRORS = [...AUTH_ERRORS, 'organization.missing_active_org', 'organization.access_denied'];
const WORKSHOP_CONTEXT_ERRORS = [...ORG_CONTEXT_ERRORS, 'workshop.missing_active_workshop', 'workshop.not_found'];

const json = (schema: Json | { $ref: string }) => ({ 'application/json': { schema } });

const ok = (description: string, schema: Json | { $ref: string }) => ({ description, content: json(schema) });
const created = ok;

const objectOf = (properties: Json, required?: string[]) => ({
  type: 'object',
  properties,
  ...(required ? { required } : {}),
});

const collection = (key: string, item: string) => objectOf({ [key]: { type: 'array', items: ref(item) } }, [key]);

/** Construye el documento OpenAPI 3.1 completo. */
export function buildOpenApiDocument(): Json {
  return {
    openapi: '3.1.0',
    info: {
      title: 'MotoCore — interfaz de programación',
      version: '1.0.0',
      summary: 'Gestión multiorganización jerárquica para el servicio de mantenimiento de motocicletas.',
      description: [
        'Interfaz REST del corte vertical: identidad, organizaciones, talleres, miembros, clientes',
        '(nivel organización), inventario (nivel taller) y el registro de auditoría.',
        '',
        'Esta descripción **deriva** del contrato de la interfaz y no lo sustituye: ante cualquier',
        'discrepancia manda el contrato (docs/ingenieria/10-contrato-api.md).',
        '',
        'Reglas que atraviesan toda la interfaz:',
        '',
        '- El identificador de la organización aparece en la ruta **solo cuando el recurso es la',
        '  organización misma**; todo lo interior a ella se resuelve por la cabecera `X-Org-Id`.',
        '- El servidor nunca asume un contexto por defecto: si falta una cabecera exigida, rechaza.',
        '- Las bajas lógicas auditadas se invocan con `POST /…/deactivate`; la revocación de un',
        '  vínculo, con `DELETE`.',
        '- Todo error sigue Problem Details (RFC 9457) con un código estable `modulo.razon`.',
      ].join('\n'),
      license: { name: 'Ver LICENSE del repositorio', identifier: 'MIT' },
    },
    servers: [
      { url: 'http://localhost:8787', description: 'Desarrollo' },
      {
        url: 'https://{despliegue}',
        description: 'Staging o producción',
        variables: { despliegue: { default: 'motocore-api.vercel.app' } },
      },
    ],
    tags: [
      {
        name: 'identidad',
        description: 'Registro y perfil. El inicio de sesión ocurre contra el proveedor de identidad (ADR-004)',
      },
      { name: 'organizaciones', description: 'Unidad de aislamiento. Único recurso con identificador en la ruta' },
      { name: 'talleres', description: 'Subdivisión operativa de la organización (ADR-006)' },
      { name: 'miembros', description: 'Membresías y roles, por organización' },
      { name: 'clientes', description: 'Nivel organización: visibles desde cualquier taller (RF-502)' },
      { name: 'inventario', description: 'Nivel taller: existencias propias de cada local (RF-602)' },
      { name: 'auditoría', description: 'Las seis acciones críticas; solo lectura y reservada al Owner (RF-704)' },
      { name: 'operación', description: 'Comprobación de disponibilidad' },
    ],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Credencial emitida por el proveedor de identidad. La interfaz la verifica, no la emite (ADR-004).',
        },
      },
      parameters: {
        OrgId: {
          name: 'X-Org-Id',
          in: 'header',
          required: true,
          schema: uuid,
          description: 'Organización activa. Se valida contra la membresía activa del solicitante (ADR-005).',
        },
        WorkshopId: {
          name: 'X-Workshop-Id',
          in: 'header',
          required: true,
          schema: uuid,
          description: 'Taller activo. Debe pertenecer a la organización activa (RF-303).',
        },
        Search: {
          name: 'search',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'Búsqueda parcial e insensible a mayúsculas sobre los campos identificatorios.',
        },
        IncludeInactive: {
          name: 'includeInactive',
          in: 'query',
          required: false,
          schema: { type: 'boolean' },
          description: 'Incluye los registros dados de baja; por omisión se excluyen.',
        },
        LowStock: {
          name: 'lowStock',
          in: 'query',
          required: false,
          schema: { type: 'boolean' },
          description: 'Restringe a los repuestos en o por debajo del mínimo (RF-607).',
        },
      },
      schemas: {
        ErrorCode: {
          type: 'string',
          description: 'Catálogo cerrado de códigos de error (§4 del contrato).',
          enum: Object.keys(ERROR_CATALOG),
        },
        Problem: {
          type: 'object',
          description: 'Problem Details for HTTP APIs (RFC 9457). El código estable viaja en `title`.',
          required: ['type', 'title', 'status', 'detail'],
          properties: {
            type: { type: 'string', const: 'about:blank' },
            title: ref('ErrorCode'),
            status: { type: 'integer' },
            detail: { type: 'string' },
            errors: {
              type: 'object',
              description: 'Detalle por campo de los errores de validación (RNF-205).',
              additionalProperties: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        Role: { type: 'string', enum: [...ROLES] },
        Profile: objectOf(
          { id: uuid, email: { type: 'string' }, first_name: { type: 'string' }, last_name: { type: 'string' } },
          ['id', 'email', 'first_name', 'last_name'],
        ),
        Organization: objectOf(
          {
            id: uuid,
            name: { type: 'string' },
            description: nullableString,
            address: nullableString,
            phone: nullableString,
            email: nullableString,
            owner_id: uuid,
            is_active: { type: 'boolean' },
            created_at: timestamp,
            updated_at: nullableTimestamp,
          },
          ['id', 'name', 'owner_id', 'is_active', 'created_at'],
        ),
        OrganizationMembership: objectOf({ role: ref('Role'), organization: ref('Organization') }, [
          'role',
          'organization',
        ]),
        Workshop: objectOf(
          {
            id: uuid,
            organization_id: uuid,
            name: { type: 'string' },
            address: nullableString,
            phone: nullableString,
            is_active: { type: 'boolean' },
            created_at: timestamp,
            updated_at: nullableTimestamp,
          },
          ['id', 'organization_id', 'name', 'is_active', 'created_at'],
        ),
        Assignment: objectOf(
          {
            id: uuid,
            organization_id: uuid,
            workshop_id: uuid,
            user_id: uuid,
            role: ref('Role'),
            is_active: { type: 'boolean', description: 'Estado de la membresía asignada.' },
            created_at: timestamp,
          },
          ['id', 'organization_id', 'workshop_id', 'user_id', 'role', 'is_active', 'created_at'],
        ),
        Member: objectOf(
          {
            user_id: uuid,
            role: ref('Role'),
            is_active: { type: 'boolean' },
            joined_at: timestamp,
            updated_at: nullableTimestamp,
            email: nullableString,
            first_name: nullableString,
            last_name: nullableString,
          },
          ['user_id', 'role', 'is_active', 'joined_at'],
        ),
        Client: objectOf(
          {
            id: uuid,
            organization_id: uuid,
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            email: nullableString,
            phone: nullableString,
            document_id: nullableString,
            address: nullableString,
            notes: nullableString,
            is_active: { type: 'boolean' },
            created_at: timestamp,
            updated_at: nullableTimestamp,
          },
          ['id', 'organization_id', 'first_name', 'last_name', 'is_active', 'created_at'],
        ),
        Part: objectOf(
          {
            id: uuid,
            organization_id: uuid,
            workshop_id: uuid,
            part_number: { type: 'string' },
            name: { type: 'string' },
            description: nullableString,
            brand: nullableString,
            category: nullableString,
            current_stock: {
              type: 'integer',
              description: 'Solo la cambian los movimientos: nunca se escribe directamente (RN-11).',
            },
            minimum_stock: { type: 'integer' },
            maximum_stock: { type: ['integer', 'null'] },
            unit_cost: nullableNumber,
            is_active: { type: 'boolean' },
            created_at: timestamp,
            updated_at: nullableTimestamp,
          },
          [
            'id',
            'organization_id',
            'workshop_id',
            'part_number',
            'name',
            'current_stock',
            'minimum_stock',
            'is_active',
            'created_at',
          ],
        ),
        Movement: objectOf(
          {
            id: uuid,
            organization_id: uuid,
            workshop_id: uuid,
            part_id: uuid,
            movement_type: { type: 'string', enum: [...MOVEMENT_TYPES] },
            quantity: { type: 'integer' },
            previous_stock: { type: 'integer' },
            new_stock: { type: 'integer' },
            unit_cost: nullableNumber,
            total_cost: nullableNumber,
            reference: nullableString,
            notes: nullableString,
            transfer_id: {
              type: ['string', 'null'],
              format: 'uuid',
              description: 'Vincula los dos movimientos de una transferencia; solo lo lleva ese tipo (RN-13).',
            },
            performed_by: { type: ['string', 'null'], format: 'uuid' },
            created_at: timestamp,
          },
          [
            'id',
            'organization_id',
            'workshop_id',
            'part_id',
            'movement_type',
            'quantity',
            'previous_stock',
            'new_stock',
            'created_at',
          ],
        ),
        AuditEntry: objectOf(
          {
            id: uuid,
            organization_id: uuid,
            workshop_id: { type: ['string', 'null'], format: 'uuid' },
            performed_by: { type: ['string', 'null'], format: 'uuid' },
            performed_by_profile: {
              oneOf: [ref('Profile'), { type: 'null' }],
              description: 'Nulo si la cuenta fue eliminada: la entrada sobrevive a su autor (RF-703).',
            },
            action: { type: 'string', enum: [...AUDIT_ACTIONS] },
            entity: { type: 'string' },
            entity_id: { type: ['string', 'null'], format: 'uuid' },
            details: { type: ['object', 'null'], additionalProperties: true },
            created_at: timestamp,
          },
          ['id', 'organization_id', 'action', 'entity', 'created_at'],
        ),
        RegisterRequest: fromZod(registerSchema),
        CreateOrganizationRequest: fromZod(createOrganizationSchema),
        UpdateOrganizationRequest: fromZod(updateOrganizationSchema),
        CreateWorkshopRequest: fromZod(createWorkshopSchema),
        UpdateWorkshopRequest: fromZod(updateWorkshopSchema),
        AssignMemberRequest: fromZod(assignMemberSchema),
        InviteMemberRequest: fromZod(inviteMemberSchema),
        UpdateRoleRequest: fromZod(updateRoleSchema),
        CreateClientRequest: fromZod(createClientSchema),
        UpdateClientRequest: fromZod(updateClientSchema),
        CreatePartRequest: fromZod(createPartSchema),
        UpdatePartRequest: fromZod(updatePartSchema),
        MovementRequest: {
          ...fromZod(movementSchema),
          description: `Tipos registrables directamente: ${DIRECT_MOVEMENT_TYPES.join(', ')}. El tipo transferencia no se acepta aquí: lo genera la transferencia entre talleres (RF-604).`,
        },
        TransferRequest: {
          ...fromZod(transferSchema),
          description:
            'El destino es el repuesto con el mismo número de parte en el taller receptor: es la misma pieza, con existencia propia en cada local (RF-608).',
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['operación'],
          operationId: 'health',
          summary: 'Comprobación de disponibilidad',
          description: 'Pública, junto con el registro: es la única superficie sin credencial (Seguridad).',
          security: [],
          responses: {
            '200': ok('El servicio responde', objectOf({ status: { type: 'string', const: 'ok' } }, ['status'])),
          },
        },
      },
      '/api/auth/register': {
        post: {
          tags: ['identidad'],
          operationId: 'register',
          summary: 'Registrar una cuenta con su primera organización y su primer taller',
          description:
            'RF-101. Los cuatro pasos ocurren en un solo acto: si alguno falla, no queda ninguno aplicado (ADR-007). La contraseña se valida antes de crear nada y nunca se persiste en el sistema (RNF-104).',
          security: [],
          requestBody: { required: true, content: json(ref('RegisterRequest')) },
          responses: {
            '201': created(
              'Cuenta creada',
              objectOf(
                {
                  user_id: uuid,
                  organization: ref('Organization'),
                  workshop: { oneOf: [ref('Workshop'), { type: 'null' }] },
                },
                ['user_id', 'organization'],
              ),
            ),
            ...errors(['validation.invalid_body', 'auth.email_already_registered', 'auth.registration_failed']),
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['identidad'],
          operationId: 'me',
          summary: 'Perfil de la cuenta y organizaciones donde tiene membresía activa',
          description: 'RF-104 y RF-202: las organizaciones salen de la membresía activa, no de quién las creó.',
          responses: {
            '200': ok(
              'Perfil y membresías',
              objectOf(
                {
                  user_id: uuid,
                  email: { type: 'string' },
                  profile: { oneOf: [ref('Profile'), { type: 'null' }] },
                  organizations: { type: 'array', items: ref('OrganizationMembership') },
                },
                ['user_id', 'email', 'organizations'],
              ),
            ),
            ...errors(AUTH_ERRORS),
          },
        },
      },
      '/api/organizations': {
        get: {
          tags: ['organizaciones'],
          operationId: 'listOrganizations',
          summary: 'Organizaciones de la cuenta, según su membresía activa',
          description: 'RF-202.',
          responses: {
            '200': ok('Organizaciones con el rol en cada una', collection('organizations', 'OrganizationMembership')),
            ...errors(AUTH_ERRORS),
          },
        },
        post: {
          tags: ['organizaciones'],
          operationId: 'createOrganization',
          summary: 'Crear una organización adicional',
          description:
            'RF-201. El solicitante queda como `owner`; el propietario sale de la credencial, nunca del cuerpo.',
          requestBody: { required: true, content: json(ref('CreateOrganizationRequest')) },
          responses: {
            '201': created(
              'Organización creada',
              objectOf({ organization: ref('Organization'), role: ref('Role') }, ['organization', 'role']),
            ),
            ...errors([...AUTH_ERRORS, 'validation.invalid_body']),
          },
        },
      },
      '/api/organizations/{orgId}': {
        parameters: [{ name: 'orgId', in: 'path', required: true, schema: uuid }],
        get: {
          tags: ['organizaciones'],
          operationId: 'getOrganization',
          summary: 'Datos de una organización donde la cuenta es miembro',
          responses: {
            '200': ok('Organización', objectOf({ organization: ref('Organization') }, ['organization'])),
            ...errors([...AUTH_ERRORS, 'organization.access_denied', 'organization.not_found']),
          },
        },
        patch: {
          tags: ['organizaciones'],
          operationId: 'updateOrganization',
          summary: 'Editar los datos de la organización (solo Owner)',
          description: 'RF-204. Acción auditada (RF-703).',
          requestBody: { required: true, content: json(ref('UpdateOrganizationRequest')) },
          responses: {
            '200': ok('Organización actualizada', objectOf({ organization: ref('Organization') }, ['organization'])),
            ...errors([
              ...AUTH_ERRORS,
              'organization.access_denied',
              'organization.insufficient_permissions',
              'organization.not_found',
              'validation.invalid_body',
            ]),
          },
        },
      },
      '/api/organizations/{orgId}/switch': {
        parameters: [{ name: 'orgId', in: 'path', required: true, schema: uuid }],
        post: {
          tags: ['organizaciones'],
          operationId: 'switchOrganization',
          summary: 'Activar una organización y confirmar el rol del solicitante',
          description:
            'RF-203. No cambia estado en el servidor: valida que la cuenta pueda operar sobre esa organización y devuelve su rol, para que el cliente lo envíe después en `X-Org-Id`.',
          responses: {
            '200': ok(
              'Organización activa y rol',
              objectOf({ organization: ref('Organization'), role: ref('Role') }, ['organization', 'role']),
            ),
            ...errors([...AUTH_ERRORS, 'organization.access_denied', 'organization.not_found']),
          },
        },
      },
      '/api/workshops': {
        parameters: [{ $ref: '#/components/parameters/OrgId' }],
        get: {
          tags: ['talleres'],
          operationId: 'listWorkshops',
          summary: 'Talleres de la organización activa',
          description: 'RF-302 y RF-305: por omisión, solo los activos.',
          parameters: [{ $ref: '#/components/parameters/IncludeInactive' }],
          responses: {
            '200': ok('Talleres', collection('workshops', 'Workshop')),
            ...errors(ORG_CONTEXT_ERRORS),
          },
        },
        post: {
          tags: ['talleres'],
          operationId: 'createWorkshop',
          summary: 'Crear un taller (solo Owner)',
          description: 'RF-301. El nombre es único por organización (RN-06).',
          requestBody: { required: true, content: json(ref('CreateWorkshopRequest')) },
          responses: {
            '201': created('Taller creado', objectOf({ workshop: ref('Workshop') }, ['workshop'])),
            ...errors([
              ...ORG_CONTEXT_ERRORS,
              'workshop.insufficient_permissions',
              'workshop.duplicate_name',
              'validation.invalid_body',
            ]),
          },
        },
      },
      '/api/workshops/{workshopId}': {
        parameters: [
          { $ref: '#/components/parameters/OrgId' },
          { name: 'workshopId', in: 'path', required: true, schema: uuid },
        ],
        get: {
          tags: ['talleres'],
          operationId: 'getWorkshop',
          summary: 'Datos de un taller de la organización activa',
          responses: {
            '200': ok('Taller', objectOf({ workshop: ref('Workshop') }, ['workshop'])),
            ...errors([...ORG_CONTEXT_ERRORS, 'workshop.not_found']),
          },
        },
        patch: {
          tags: ['talleres'],
          operationId: 'updateWorkshop',
          summary: 'Editar un taller (solo Owner)',
          requestBody: { required: true, content: json(ref('UpdateWorkshopRequest')) },
          responses: {
            '200': ok('Taller actualizado', objectOf({ workshop: ref('Workshop') }, ['workshop'])),
            ...errors([
              ...ORG_CONTEXT_ERRORS,
              'workshop.insufficient_permissions',
              'workshop.not_found',
              'workshop.duplicate_name',
              'validation.invalid_body',
            ]),
          },
        },
      },
      '/api/workshops/{workshopId}/deactivate': {
        parameters: [
          { $ref: '#/components/parameters/OrgId' },
          { name: 'workshopId', in: 'path', required: true, schema: uuid },
        ],
        post: {
          tags: ['talleres'],
          operationId: 'deactivateWorkshop',
          summary: 'Baja lógica del taller (solo Owner)',
          description: 'RF-305: deja de listarse como activo y su historial se conserva. Acción auditada (RF-703).',
          responses: {
            '200': ok('Taller desactivado', objectOf({ workshop: ref('Workshop') }, ['workshop'])),
            ...errors([...ORG_CONTEXT_ERRORS, 'workshop.insufficient_permissions', 'workshop.not_found']),
          },
        },
      },
      '/api/workshops/{workshopId}/assignments': {
        parameters: [
          { $ref: '#/components/parameters/OrgId' },
          { name: 'workshopId', in: 'path', required: true, schema: uuid },
        ],
        get: {
          tags: ['talleres'],
          operationId: 'listAssignments',
          summary: 'Miembros asignados al taller',
          description: 'RF-304. La asignación es operativa: no otorga ni restringe permisos (ADR-006).',
          responses: {
            '200': ok('Asignaciones', collection('assignments', 'Assignment')),
            ...errors([...ORG_CONTEXT_ERRORS, 'workshop.not_found']),
          },
        },
        post: {
          tags: ['talleres'],
          operationId: 'assignMember',
          summary: 'Asignar un miembro al taller (solo Owner)',
          description: 'RF-304. Es idempotente: `201` si crea la asignación, `200` si ya existía.',
          requestBody: { required: true, content: json(ref('AssignMemberRequest')) },
          responses: {
            '200': ok('La asignación ya existía', objectOf({ assignment: ref('Assignment') }, ['assignment'])),
            '201': created('Asignación creada', objectOf({ assignment: ref('Assignment') }, ['assignment'])),
            ...errors([
              ...ORG_CONTEXT_ERRORS,
              'workshop.insufficient_permissions',
              'workshop.not_found',
              'member.not_found',
              'validation.invalid_body',
            ]),
          },
        },
      },
      '/api/workshops/{workshopId}/assignments/{userId}': {
        parameters: [
          { $ref: '#/components/parameters/OrgId' },
          { name: 'workshopId', in: 'path', required: true, schema: uuid },
          { name: 'userId', in: 'path', required: true, schema: uuid },
        ],
        delete: {
          tags: ['talleres'],
          operationId: 'unassignMember',
          summary: 'Retirar la asignación, sin afectar la membresía (solo Owner)',
          responses: {
            '204': { description: 'Asignación retirada' },
            ...errors([
              ...ORG_CONTEXT_ERRORS,
              'workshop.insufficient_permissions',
              'workshop.not_found',
              'member.not_found',
            ]),
          },
        },
      },
      '/api/members': {
        parameters: [{ $ref: '#/components/parameters/OrgId' }],
        get: {
          tags: ['miembros'],
          operationId: 'listMembers',
          summary: 'Miembros de la organización activa, con rol y estado',
          description: 'RF-407. Por omisión, solo los activos.',
          parameters: [{ $ref: '#/components/parameters/IncludeInactive' }],
          responses: {
            '200': ok('Miembros', collection('members', 'Member')),
            ...errors(ORG_CONTEXT_ERRORS),
          },
        },
      },
      '/api/members/invite': {
        parameters: [{ $ref: '#/components/parameters/OrgId' }],
        post: {
          tags: ['miembros'],
          operationId: 'inviteMember',
          summary: 'Incorporar una cuenta existente (solo Owner)',
          description:
            'RF-401, RF-402 y RF-406. Reincorporar a quien fue removido **reactiva** su membresía con el nuevo rol, en lugar de duplicarla (RN-04). La búsqueda de la cuenta por correo se resuelve solo en el servidor (RNF-106). Acción auditada.',
          requestBody: { required: true, content: json(ref('InviteMemberRequest')) },
          responses: {
            '201': created('Miembro incorporado', objectOf({ member: ref('Member') }, ['member'])),
            ...errors([
              ...ORG_CONTEXT_ERRORS,
              'member.insufficient_permissions',
              'member.owner_role_forbidden',
              'member.not_found',
              'member.already_active',
              'validation.invalid_body',
            ]),
          },
        },
      },
      '/api/members/{userId}/role': {
        parameters: [
          { $ref: '#/components/parameters/OrgId' },
          { name: 'userId', in: 'path', required: true, schema: uuid },
        ],
        patch: {
          tags: ['miembros'],
          operationId: 'changeMemberRole',
          summary: 'Cambiar el rol de un miembro (solo Owner)',
          description: 'RF-403 y RF-405. Acción auditada.',
          requestBody: { required: true, content: json(ref('UpdateRoleRequest')) },
          responses: {
            '200': ok('Rol actualizado', objectOf({ member: ref('Member') }, ['member'])),
            ...errors([
              ...ORG_CONTEXT_ERRORS,
              'member.insufficient_permissions',
              'member.owner_role_forbidden',
              'member.owner_protected',
              'member.not_found',
              'validation.invalid_body',
            ]),
          },
        },
      },
      '/api/members/{userId}': {
        parameters: [
          { $ref: '#/components/parameters/OrgId' },
          { name: 'userId', in: 'path', required: true, schema: uuid },
        ],
        delete: {
          tags: ['miembros'],
          operationId: 'removeMember',
          summary: 'Revocar la membresía (solo Owner)',
          description:
            'RF-404 y RF-405. Es `DELETE` porque lo que se revoca es el vínculo entre la cuenta y la organización (§2.6). El acceso se pierde de inmediato. Acción auditada.',
          responses: {
            '204': { description: 'Membresía revocada' },
            ...errors([
              ...ORG_CONTEXT_ERRORS,
              'member.insufficient_permissions',
              'member.owner_protected',
              'member.not_found',
            ]),
          },
        },
      },
      '/api/clients': {
        parameters: [{ $ref: '#/components/parameters/OrgId' }],
        get: {
          tags: ['clientes'],
          operationId: 'listClients',
          summary: 'Clientes de la organización activa',
          description:
            'RF-502 y RF-504. No exige `X-Workshop-Id`, y esa ausencia es la evidencia del alcance por nivel: el cliente pertenece a la organización.',
          parameters: [{ $ref: '#/components/parameters/Search' }, { $ref: '#/components/parameters/IncludeInactive' }],
          responses: {
            '200': ok('Clientes', collection('clients', 'Client')),
            ...errors(ORG_CONTEXT_ERRORS),
          },
        },
        post: {
          tags: ['clientes'],
          operationId: 'createClient',
          summary: 'Registrar un cliente (Owner o Receptionist)',
          description: 'RF-501 y RF-503: el correo es único por organización y no colisiona entre organizaciones.',
          requestBody: { required: true, content: json(ref('CreateClientRequest')) },
          responses: {
            '201': created('Cliente registrado', objectOf({ client: ref('Client') }, ['client'])),
            ...errors([
              ...ORG_CONTEXT_ERRORS,
              'client.insufficient_permissions',
              'client.duplicate_email',
              'validation.invalid_body',
            ]),
          },
        },
      },
      '/api/clients/{clientId}': {
        parameters: [
          { $ref: '#/components/parameters/OrgId' },
          { name: 'clientId', in: 'path', required: true, schema: uuid },
        ],
        get: {
          tags: ['clientes'],
          operationId: 'getClient',
          summary: 'Datos de un cliente de la organización activa',
          responses: {
            '200': ok('Cliente', objectOf({ client: ref('Client') }, ['client'])),
            ...errors([...ORG_CONTEXT_ERRORS, 'client.not_found']),
          },
        },
        patch: {
          tags: ['clientes'],
          operationId: 'updateClient',
          summary: 'Editar los datos de contacto (Owner o Receptionist)',
          requestBody: { required: true, content: json(ref('UpdateClientRequest')) },
          responses: {
            '200': ok('Cliente actualizado', objectOf({ client: ref('Client') }, ['client'])),
            ...errors([
              ...ORG_CONTEXT_ERRORS,
              'client.insufficient_permissions',
              'client.not_found',
              'client.duplicate_email',
              'validation.invalid_body',
            ]),
          },
        },
      },
      '/api/clients/{clientId}/deactivate': {
        parameters: [
          { $ref: '#/components/parameters/OrgId' },
          { name: 'clientId', in: 'path', required: true, schema: uuid },
        ],
        post: {
          tags: ['clientes'],
          operationId: 'deactivateClient',
          summary: 'Baja lógica del cliente (Owner o Receptionist)',
          description:
            'RF-504: se excluye de los listados activos y el registro se conserva. Acción auditada (RF-703).',
          responses: {
            '200': ok('Cliente dado de baja', objectOf({ client: ref('Client') }, ['client'])),
            ...errors([...ORG_CONTEXT_ERRORS, 'client.insufficient_permissions', 'client.not_found']),
          },
        },
      },
      '/api/inventory/parts': {
        parameters: [{ $ref: '#/components/parameters/OrgId' }, { $ref: '#/components/parameters/WorkshopId' }],
        get: {
          tags: ['inventario'],
          operationId: 'listParts',
          summary: 'Repuestos del taller activo',
          description: 'RF-602 y RF-607.',
          parameters: [
            { $ref: '#/components/parameters/Search' },
            { $ref: '#/components/parameters/LowStock' },
            { $ref: '#/components/parameters/IncludeInactive' },
          ],
          responses: {
            '200': ok('Repuestos', collection('parts', 'Part')),
            ...errors(WORKSHOP_CONTEXT_ERRORS),
          },
        },
        post: {
          tags: ['inventario'],
          operationId: 'createPart',
          summary: 'Registrar un repuesto en el taller activo (Owner o Receptionist)',
          description:
            'RF-601 y RF-603. Con existencia inicial mayor que cero se genera automáticamente su movimiento de entrada (RN-12).',
          requestBody: { required: true, content: json(ref('CreatePartRequest')) },
          responses: {
            '201': created('Repuesto registrado', objectOf({ part: ref('Part') }, ['part'])),
            ...errors([
              ...WORKSHOP_CONTEXT_ERRORS,
              'inventory.insufficient_permissions',
              'inventory.duplicate_part_number',
              'validation.invalid_body',
            ]),
          },
        },
      },
      '/api/inventory/parts/{partId}': {
        parameters: [
          { $ref: '#/components/parameters/OrgId' },
          { $ref: '#/components/parameters/WorkshopId' },
          { name: 'partId', in: 'path', required: true, schema: uuid },
        ],
        get: {
          tags: ['inventario'],
          operationId: 'getPart',
          summary: 'Datos de un repuesto del taller activo',
          responses: {
            '200': ok('Repuesto', objectOf({ part: ref('Part') }, ['part'])),
            ...errors([...WORKSHOP_CONTEXT_ERRORS, 'inventory.part_not_found']),
          },
        },
        patch: {
          tags: ['inventario'],
          operationId: 'updatePart',
          summary: 'Editar el catálogo del repuesto (Owner o Receptionist)',
          description:
            'RF-601 y RF-609. **Nunca su existencia**: toda existencia debe poder reconstruirse desde su historial.',
          requestBody: { required: true, content: json(ref('UpdatePartRequest')) },
          responses: {
            '200': ok('Repuesto actualizado', objectOf({ part: ref('Part') }, ['part'])),
            ...errors([
              ...WORKSHOP_CONTEXT_ERRORS,
              'inventory.insufficient_permissions',
              'inventory.part_not_found',
              'validation.invalid_body',
            ]),
          },
        },
      },
      '/api/inventory/parts/{partId}/movements': {
        parameters: [
          { $ref: '#/components/parameters/OrgId' },
          { $ref: '#/components/parameters/WorkshopId' },
          { name: 'partId', in: 'path', required: true, schema: uuid },
        ],
        get: {
          tags: ['inventario'],
          operationId: 'listMovements',
          summary: 'Historial de movimientos del repuesto',
          description: 'RF-604: historial inmutable, del más reciente al más antiguo.',
          responses: {
            '200': ok('Movimientos', collection('movements', 'Movement')),
            ...errors([...WORKSHOP_CONTEXT_ERRORS, 'inventory.part_not_found']),
          },
        },
        post: {
          tags: ['inventario'],
          operationId: 'registerMovement',
          summary: 'Registrar un movimiento y recalcular la existencia',
          description:
            'RF-604 a RF-606, cualquier miembro. El cálculo y la actualización ocurren en una sola transacción del motor (ADR-007): compra y devolucion suman, venta y merma restan, ajuste fija un valor absoluto.',
          requestBody: { required: true, content: json(ref('MovementRequest')) },
          responses: {
            '201': created('Movimiento registrado', objectOf({ movement: ref('Movement') }, ['movement'])),
            ...errors([
              ...WORKSHOP_CONTEXT_ERRORS,
              'inventory.part_not_found',
              'inventory.invalid_movement_type',
              'inventory.invalid_quantity',
              'inventory.insufficient_stock',
              'validation.invalid_body',
            ]),
          },
        },
      },
      '/api/inventory/parts/{partId}/transfer': {
        parameters: [
          { $ref: '#/components/parameters/OrgId' },
          { $ref: '#/components/parameters/WorkshopId' },
          { name: 'partId', in: 'path', required: true, schema: uuid },
        ],
        post: {
          tags: ['inventario'],
          operationId: 'transferStock',
          summary: 'Transferir existencias a otro taller de la organización (solo Owner)',
          description:
            'RF-608 y RN-13: descuenta en el origen y suma en el destino en una sola transacción, con dos movimientos vinculados por `transfer_id`.',
          requestBody: { required: true, content: json(ref('TransferRequest')) },
          responses: {
            '201': created(
              'Transferencia registrada: salida y entrada',
              objectOf({ movements: { type: 'array', items: ref('Movement'), minItems: 2, maxItems: 2 } }, [
                'movements',
              ]),
            ),
            ...errors([
              ...WORKSHOP_CONTEXT_ERRORS,
              'inventory.insufficient_permissions',
              'inventory.part_not_found',
              'inventory.invalid_quantity',
              'inventory.same_workshop_transfer',
              'inventory.cross_organization_transfer',
              'inventory.insufficient_stock',
              'validation.invalid_body',
            ]),
          },
        },
      },
      '/api/audit': {
        parameters: [{ $ref: '#/components/parameters/OrgId' }],
        get: {
          tags: ['auditoría'],
          operationId: 'listAuditEntries',
          summary: 'Registro de acciones críticas de la organización activa (solo Owner)',
          description:
            'RF-703 y RF-704. Es la única lectura reservada a un rol, y la restricción se aplica también en el motor. El registro es de solo inserción: no se expone ninguna escritura.',
          parameters: [
            { name: 'action', in: 'query', required: false, schema: { type: 'string', enum: [...AUDIT_ACTIONS] } },
            { name: 'workshopId', in: 'query', required: false, schema: uuid },
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: { type: 'integer', minimum: 1, maximum: 500, default: 100 },
            },
          ],
          responses: {
            '200': ok('Entradas de auditoría', collection('entries', 'AuditEntry')),
            ...errors([...ORG_CONTEXT_ERRORS, 'audit.insufficient_permissions', 'validation.invalid_body']),
          },
        },
      },
    },
  };
}
