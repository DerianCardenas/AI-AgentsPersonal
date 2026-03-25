# Proyecto: Ecommerce — Plataforma de Comercio Electrónico con Panel Administrativo

## Descripción general

Plataforma de comercio electrónico que permite a usuarios explorar un catálogo de productos con filtros avanzados y paginación, gestionar un carrito de compras persistente, y simular un proceso de checkout completo. Complementada con un panel administrativo que permite crear, editar y eliminar productos, gestionar inventario en tiempo real y controlar el ciclo de vida de órdenes mediante estados bien definidos (pending, paid, shipped, delivered, cancelled). Backend en .NET encargado de toda la lógica de negocio y persistencia en PostgreSQL. Inicialmente consumiendo datos desde Fake Store API pero evolucionando hacia un sistema completamente autogestionado internamente. Incluye sistema de logs para auditoría de acciones administrativas y eventos del sistema. Integración opcional con ChatGPT para recomendaciones de productos, análisis de comportamiento de usuarios y generación automática de descripciones.

## Siglas del proyecto

SIGLAS: ECOMM

## Usuarios del sistema

- **Cliente (Customer)**: Exploración del catálogo, carrito de compras, historial de órdenes, reviews
- **Administrador (Admin)**: Gestión completa de productos (CRUD), control de inventario, gestión de órdenes, reportes de ventas, gestión de usuarios
- **Super Administrador (Super Admin)**: Todas las permisos de Admin + gestión de administradores, configuración del sistema, acceso a logs
- **Invitado (Guest)**: Solo lectura del catálogo, carrito temporal (localStorage)

---

## Stack tecnológico

### Frontend
Vue 3 + TypeScript + Vuetify (componentes Material Design) + Pinia (estado) + Vue Router + Axios

### Backend
.NET 8 / C# + Entity Framework Core + Clean Architecture + JWT para autenticación + Middleware de logging

### Base de datos
PostgreSQL 15+ (será configurada localmente por el agente DBA)

### Testing
- Unitarias Backend: xUnit + Moq
- Unitarias Frontend: Vitest + Vue Test Utils
- Integración: Vitest + MSW (Mock Service Worker)
- E2E: Playwright

### Otros
- Autenticación: JWT (Access Token + Refresh Token)
- IA: ChatGPT API para recomendaciones y análisis (opcional)
- Integración: Fake Store API en MVP, evoluciona a BD completamente propia
- Logging: Middleware que registra acciones administrativas y eventos en audit_logs
- Caché: Redis para caché de catálogo (futuro)

---

## Repositorios

back-repo:  /home/derian/Documentos/DerianProyectos/06-Ecommerce/Backend
front-repo: /home/derian/Documentos/DerianProyectos/06-Ecommerce/Frontend
db-repo:    /home/derian/Documentos/DerianProyectos/06-Ecommerce/BD
test-repo:  /home/derian/Documentos/DerianProyectos/06-Ecommerce/Test

---

## Estructura de carpetas

### back-repo/
```
src/
  Domain/
    Entities/
      Product/       → Product, Category, ProductImage
      Order/         → Order, OrderItem, OrderStatus enum
      User/          → User, Role, UserProfile
      Audit/         → AuditLog entity
    ValueObjects/    → Money, ProductSku, etc
    Interfaces/      → repositorio y servicio contracts
  Application/
    DTOs/
      Request/       → CreateProductDto, UpdateInventoryDto
      Response/      → ProductDto, OrderDto, CartDto
    Services/
      ProductService/        → CRUD y búsqueda
      OrderService/          → lógica de órdenes
      CartService/           → gestión del carrito
      RecommendationService/ → integración ChatGPT
    UseCases/        → handlers de comandos (cuando se use CQRS)
    Validators/      → FluentValidation para DTOs
  Infrastructure/
    Persistence/
      Migrations/    → versionado de esquema BD
      Repositories/  → genéricos y específicos
      DbContext.cs   → configuración de EF
    Identity/        → autenticación JWT
    ExternalApis/    → cliente de Fake Store API (MVP)
    ChatGpt/         → integración OpenAI
    Logging/         → middleware y servicio de auditoría
  API/
    Controllers/
      ProductsController    → GET, POST, PUT, DELETE
      OrdersController      → órdenes del usuario
      AdminController       → gestión administrativa
      CartController        → operaciones del carrito
    Middlewares/     → autenticación, logging, manejo de errores
    Extensions/      → configuración de servicios
    ErrorHandling/   → response estandarizado
tests/
  Unit/              → servicios, validadores, cálculos
  Integration/       → con BD y APIs externas
```

### front-repo/
```
src/
  components/
    common/          → Button, Card, Modal, Loader, Pagination
    product/         → ProductCard, ProductFilter, ProductImage
    admin/           → ProductForm, InventoryTable, OrderStatus
    cart/            → CartItem, CartSummary, CheckoutForm
  views/
    Home.vue         → landing con destacados
    ProductCatalog.vue     → catálogo con filtros y paginación
    ProductDetail.vue      → detalle de producto
    Cart.vue         → carrito de compras
    Checkout.vue     → proceso de compra
    OrderHistory.vue       → historial de órdenes del usuario
    AdminDashboard.vue     → panel principal admin
    AdminProducts.vue      → gestión de productos
    AdminOrders.vue        → gestión de órdenes
    AdminReports.vue       → reportes de ventas
  stores/
    auth.ts          → autenticación
    cart.ts          → carrito (sincronizado con backend)
    products.ts      → catálogo cacheado
    orders.ts        → órdenes del usuario
    admin.ts         → estado del panel admin
  services/
    api.ts           → cliente HTTP con interceptores
    auth.ts          → login, logout, refresh
    product.ts       → llamadas a /products
    order.ts         → llamadas a /orders
    admin.ts         → llamadas a endpoints administrativos
  router/
    index.ts         → rutas públicas y protegidas
  utils/
    formatters.ts    → formatear moneda, fechas
    validators.ts    → validaciones locales
tests/
  unit/              → componentes, stores, utils
  integration/       → flujos de compra
```

### db-repo/
```
migrations/
  001_initial_schema.sql    → usuarios, productos, categorías
  002_orders_schema.sql     → órdenes, items de orden
  003_inventory_schema.sql  → stock, alertas de bajo inventario
  004_audit_schema.sql      → tabla audit_logs
  005_indexes.sql           → índices de performance
  006_constraints.sql       → relaciones y validaciones
seeds/
  initial_categories.sql    → categorías estándar
  initial_products.sql      → productos de prueba
docs/
  ER_diagram.md             → diagrama entidad-relación
  order_flow.md             → flujo de estados de orden
  api_requirements.md       → especificación de campos
```

### test-repo/
```
e2e/
  user_flow.spec.ts              → navegar catálogo, agregar al carrito
  checkout.spec.ts               → proceso completo de compra
  order_management.spec.ts       → visualizar órdenes, rastreo
  admin_products.spec.ts         → crear, editar, eliminar productos
  admin_orders.spec.ts           → gestión de estados de órdenes
  admin_reports.spec.ts          → generación de reportes
regression/
  catalog_filters.spec.ts        → filtros siguen funcionando
  inventory_sync.spec.ts         → sincronización de stock
  payment_flow.spec.ts           → flujo de pago (mock)
```

---

## Convenciones de código

### Nomenclatura — Base de datos
- snake_case para tablas y columnas
- Prefijo `tbl_` opcional (tbl_product, tbl_order)
- Prefijo `idx_` para índices
- Prefijo `fk_` para foreign keys
- Tablas: product, order, order_item, category, user, product_image, audit_log

### Nomenclatura — Backend
- PascalCase para clases y interfaces
- camelCase para métodos, propiedades, variables
- Sufijos: Service, Repository, Dto, Controller, Validator
- Métodos GET/POST/PUT/DELETE en controllers siguen convención HTTP
- Enums en singular: OrderStatus, ProductStatus, UserRole

### Nomenclatura — Frontend
- PascalCase para componentes Vue
- camelCase para data, métodos, computed
- Prefijo `The` para componentes únicos (TheHeader, TheFooter, TheSidebar)
- Prefijo `Admin` para componentes del panel administrativo (AdminProductForm)
- Prefijo `use` para composables (useCart, useAuth, useProducts)
- Directiva `v-` para directivas Vue

---

## Reglas de negocio importantes

1. **Catálogo público**: Cualquiera puede ver productos sin estar autenticado
2. **Carrito persistente**: Los usuarios autenticados tienen carrito permanente en BD, los guests usan localStorage
3. **Inventario**: Cada producto tiene stock real, no se vende más de lo disponible
4. **Estados de orden**: pending → paid → shipped → delivered (o cancelled en cualquier momento)
5. **Cancelación**: Órdenes paid/shipped/delivered solo Admin puede cancelar; pending puede cancelar el usuario
6. **Reembolsos**: Cuando se cancela orden paid, se marca como reembolso pendiente
7. **Alertas de stock**: Si producto baja a <10 unidades, notificar a Admin
8. **Precios**: Son inmutables en órdenes ya creadas (se guardan al momento de compra)
9. **Logs administrativos**: TODOS los cambios en productos, órdenes y usuarios quedan registrados
10. **Recomendaciones ChatGPT**: Basadas en historial de compra y tendencias (requiere API key activa)
11. **Busca y filtros**: Por categoría, rango de precio, rating, disponibilidad
12. **Paginación**: 12 productos por página en catálogo

---

## Entidades principales

- **Product**: identificador único, nombre, descripción, precio, stock, categoría, imágenes, rating, estado (activo/inactivo)
- **Category**: nombre, descripción, imagen/icono
- **ProductImage**: imágenes adicionales del producto (galería)
- **User**: email, contraseña, nombre, teléfono, rol, estado activo/inactivo, fecha creación
- **Order**: usuario, fecha creación, monto total, estado, dirección envío, dirección facturación
- **OrderItem**: referencia a order, producto, cantidad, precio unitario (al momento de compra)
- **AuditLog**: acción (CREATE/UPDATE/DELETE), tabla afectada, usuario admin, valores antiguos/nuevos, timestamp
- **Cart**: (temporal) usuario, lista de productos con cantidades, sincronizado con BD

---

## Ambientes

### Desarrollo
URL base API: http://localhost:5000
URL frontend:  http://localhost:3000
BD:            postgresql://usuario:password@localhost:5432/ecommerce_dev
Fake Store:    https://fakestoreapi.com/ (MVP)
ChatGPT:       key desde .env (modo test)

### Staging (futuro)
URL base API: https://staging.ecommerce.com/api
URL frontend:  https://staging.ecommerce.com
BD:            PostgreSQL en servidor staging

### Producción (futuro)
URL base API: https://api.ecommerce.com/api
URL frontend:  https://ecommerce.com
BD:            PostgreSQL managed RDS con réplica

---

## Notas adicionales

- El MVP usa Fake Store API para catalogo, evoluciona a sistema completamente propio
- Checkout es simulado (no hay integración real de pago, pero el flujo está modelado)
- Soft delete podría aplicarse a productos (archived) pero órdenes nunca se eliminan
- Las imágenes de productos se almacenan en BD como base64 o URLs externas (considerar CDN en futuro)
- Recomendaciones de ChatGPT son opcional, se activan solo en plan Premium (futuro)
- Performance crítica: queries de catálogo deben tener índices en price, category, createdAt
- El inventario se debe decrementar cuando la orden pasa a estado "paid" (no en pending)
