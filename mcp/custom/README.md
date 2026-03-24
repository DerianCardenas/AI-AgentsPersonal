# mcp/custom/

Servidores MCP propios — se crean cuando necesitas conectar a algo que no existe en los servidores oficiales.

---

## ¿Cuándo crear uno?

Cuando ningún servidor oficial cubre lo que necesitas. Ejemplos:
- Conectarte a la API de un sistema propio (SEMOV, un ERP, etc.)
- Exponer lógica de negocio específica como tools para los agentes
- Integrar con un servicio que no tiene MCP oficial

---

## Cómo crear un servidor MCP custom

### 1. Instala el SDK

```bash
npm install @modelcontextprotocol/sdk
```

### 2. Crea el archivo del servidor

La estructura siempre es la misma:
- **Declaras** las tools disponibles (`tools/list`)
- **Implementas** qué hace cada tool cuando el agente la llama (`tools/call`)
- **Arrancas** el servidor

### 3. Ejemplo completo — servidor para un sistema de inventario

```typescript
// mcp/custom/inventario-server.ts

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Pool } from "pg";

// Conexión a la BD del proyecto
const db = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Inicializa el servidor con nombre y versión
const server = new Server(
  { name: "inventario-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ─────────────────────────────────────────
// PASO 1: DECLARAS las tools disponibles
// El agente verá esta lista y decidirá cuál usar
// ─────────────────────────────────────────
server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "consultar_producto",
      description: "Consulta el stock y datos de un producto por su ID o nombre",
      inputSchema: {
        type: "object",
        properties: {
          id:     { type: "number", description: "ID del producto (opcional)" },
          nombre: { type: "string", description: "Nombre del producto (opcional)" }
        }
        // ninguno es required — acepta uno u otro
      }
    },
    {
      name: "listar_productos_bajo_stock",
      description: "Lista todos los productos cuyo stock está por debajo del mínimo",
      inputSchema: {
        type: "object",
        properties: {
          limite: {
            type: "number",
            description: "Cantidad mínima de stock. Por defecto: 10"
          }
        }
      }
    },
    {
      name: "registrar_venta",
      description: "Registra una venta y descuenta el stock correspondiente",
      inputSchema: {
        type: "object",
        properties: {
          producto_id: { type: "number", description: "ID del producto vendido" },
          cantidad:    { type: "number", description: "Cantidad vendida" },
          cliente:     { type: "string", description: "Nombre del cliente" }
        },
        required: ["producto_id", "cantidad"]
      }
    }
  ]
}));

// ─────────────────────────────────────────
// PASO 2: IMPLEMENTAS qué hace cada tool
// El agente llama a una tool, aquí defines qué pasa
// ─────────────────────────────────────────
server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {

    case "consultar_producto": {
      const query = args.id
        ? "SELECT * FROM productos WHERE id = $1"
        : "SELECT * FROM productos WHERE nombre ILIKE $1";
      const param = args.id ?? `%${args.nombre}%`;

      const result = await db.query(query, [param]);

      if (result.rows.length === 0) {
        return {
          content: [{ type: "text", text: "Producto no encontrado." }]
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }]
      };
    }

    case "listar_productos_bajo_stock": {
      const limite = args.limite ?? 10;
      const result = await db.query(
        "SELECT id, nombre, stock, stock_minimo FROM productos WHERE stock < $1 ORDER BY stock ASC",
        [limite]
      );

      return {
        content: [{
          type: "text",
          text: result.rows.length === 0
            ? "Todos los productos tienen stock suficiente."
            : JSON.stringify(result.rows, null, 2)
        }]
      };
    }

    case "registrar_venta": {
      // Verificar stock disponible antes de vender
      const stockResult = await db.query(
        "SELECT stock FROM productos WHERE id = $1",
        [args.producto_id]
      );

      if (stockResult.rows.length === 0) {
        return {
          content: [{ type: "text", text: `Error: producto ${args.producto_id} no existe.` }]
        };
      }

      const stockActual = stockResult.rows[0].stock;
      if (stockActual < args.cantidad) {
        return {
          content: [{
            type: "text",
            text: `Error: stock insuficiente. Disponible: ${stockActual}, solicitado: ${args.cantidad}`
          }]
        };
      }

      // Registrar venta y actualizar stock en una transacción
      await db.query("BEGIN");
      await db.query(
        "INSERT INTO ventas (producto_id, cantidad, cliente, fecha) VALUES ($1, $2, $3, NOW())",
        [args.producto_id, args.cantidad, args.cliente ?? "Sin nombre"]
      );
      await db.query(
        "UPDATE productos SET stock = stock - $1 WHERE id = $2",
        [args.cantidad, args.producto_id]
      );
      await db.query("COMMIT");

      return {
        content: [{
          type: "text",
          text: `Venta registrada. Stock actualizado: ${stockActual - args.cantidad} unidades restantes.`
        }]
      };
    }

    default:
      throw new Error(`Tool desconocida: ${name}`);
  }
});

// ─────────────────────────────────────────
// PASO 3: ARRANCAS el servidor
// Siempre es exactamente esto — no cambia
// ─────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("inventario-server corriendo"); // stderr para no interferir con stdout
```

### 4. Compílalo

```bash
npx tsc mcp/custom/inventario-server.ts --outDir mcp/custom/dist --esModuleInterop --module commonjs
```

### 5. Regístralo en config.json

```json
{
  "mcpServers": {
    "inventario": {
      "command": "node",
      "args": ["/home/TU_USUARIO/agents/mcp/custom/dist/inventario-server.js"],
      "env": {
        "DATABASE_URL": "postgresql://usuario:password@localhost:5432/inventario_db"
      }
    }
  }
}
```

### 6. Asígnalo al agente que lo necesita

En el orquestador, agregas `inventario` a la lista de MCPs del agente correspondiente:

```typescript
const mcpPorAgente = {
  backend: ["filesystem", "git", "brave-search", "inventario"], // ← aquí
  tester:  ["filesystem", "git", "postgres", "inventario"],     // ← y aquí
};
```

---

## Regla de nomenclatura para archivos custom

```
{nombre-del-sistema}-server.ts
Ejemplos:
  semov-server.ts
  inventario-server.ts
  notificaciones-server.ts
```

---

## Fuente oficial

Para más detalles sobre el SDK:
https://modelcontextprotocol.io/docs/concepts/servers
