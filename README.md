# Spotter Foro

Foro de la comunidad de dSpotter, una app de gimnasio. Proyecto de la
asignatura Enginyeria d'Aplicacions (EETAC).

Los usuarios abren temas, responden, votan y marcan una respuesta como
solución. Los temas pueden llevar adjunta una rutina de entrenamiento o
una marca personal, y el foro calcula el 1RM estimado.

---

## Cómo está montado

| Capa | Tecnología | Dónde |
|---|---|---|
| Interfaz | HTML, CSS y JavaScript sin framework (módulos ES) | `index.html`, `css/`, `js/app.js` |
| Acceso a datos | Cliente de Supabase | `js/data.js` |
| Base de datos y autenticación | Supabase (PostgreSQL) | `supabase/schema.sql` |
| Hosting | Vercel, desplegado desde GitHub | `vercel.json` |

No hay proceso de compilación: los archivos se sirven tal cual. Por eso
el proyecto arranca con un servidor estático cualquiera y se despliega
sin configurar nada en Vercel.

### Estructura

```
spotter/
├─ index.html            La página: cabecera, barra de categorías, diálogo de nuevo tema
├─ vercel.json           Cabeceras de seguridad y URLs limpias
├─ assets/logo.svg       Logo
├─ css/styles.css        Todos los estilos, con modo claro y oscuro
├─ js/
│  ├─ config.js          URL y clave pública de Supabase (lo rellenas tú)
│  ├─ data.js            Única capa que habla con la base de datos
│  └─ app.js             Estado, renderizado y eventos
└─ supabase/schema.sql   Tablas, políticas de seguridad y tiempo real
```

La separación entre `data.js` y `app.js` es deliberada: `app.js` no
sabe que existe Supabase. Si mañana cambiáis de base de datos, solo hay
que reescribir `data.js`.

---

## Puesta en marcha

### 1. Base de datos

1. Crea un proyecto en [supabase.com](https://supabase.com). Elige la
   región de Frankfurt o París y guarda la contraseña que te genera.
2. Abre **SQL Editor**, pega el contenido de `supabase/schema.sql` y
   pulsa **Run**.
3. En **Authentication → Providers**, deja activado *Email*. Si quieres
   entrada con Google, actívalo también.
4. En **Authentication → URL Configuration**, añade a *Redirect URLs*
   `http://localhost:5500` para probar en local y, más tarde, la URL de
   Vercel.

Durante el desarrollo puede molestar tener que confirmar el correo de
cada cuenta de prueba: en **Authentication → Sign In / Providers**
puedes desactivar *Confirm email* temporalmente. Vuelve a activarlo
antes de entregar.

### 2. Claves

En **Project Settings → API** copia la *Project URL* y la clave
*anon public*, y pégalas en `js/config.js`.

> La clave `anon` es pública por diseño: viaja al navegador de cada
> visitante y se puede leer en el código fuente de cualquier web hecha
> con Supabase. Lo que protege los datos son las políticas RLS de
> `schema.sql`, no esconderla. La que no debe salir nunca del panel es
> la clave `service_role`.

### 3. Probar en local

Los módulos ES no funcionan abriendo el archivo con doble clic; hace
falta un servidor. Cualquiera de estos vale:

```bash
python3 -m http.server 5500
# o, con Node instalado:
npx serve .
```

Y abre `http://localhost:5500`.

En VS Code, la extensión *Live Server* hace lo mismo con un botón.

### 4. Publicar en Vercel

1. Sube la carpeta a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com), entra con GitHub y pulsa
   **Add New → Project**. Importa el repositorio.
3. Vercel detecta que es un sitio estático. No toques *Build Command*
   ni *Output Directory*. Pulsa **Deploy**.
4. Copia la URL resultante y añádela en Supabase, en **Authentication →
   URL Configuration**, como *Site URL* y como *Redirect URL*.

A partir de aquí, cada `git push` a la rama principal se publica solo, y
cada rama o pull request recibe su propia URL de vista previa.

### 5. Hacerte moderador

Regístrate primero en la web. Luego, en el SQL Editor de Supabase:

```sql
update public.profiles set role = 'moderator'
where id = (select id from auth.users where email = 'tu@correo.com');
```

Los moderadores pueden fijar temas arriba y borrar contenido ajeno.

---

## Decisiones técnicas que conviene poder defender

**Seguridad a nivel de fila.** Todas las tablas tienen RLS activado. El
navegador habla directamente con PostgREST, sin backend propio, así que
las reglas de quién puede leer y escribir viven en la base de datos.
Cada política está comentada en `schema.sql`.

**Contadores por relación.** En vez de guardar un campo
`numero_de_votos` que hay que mantener sincronizado, las consultas
piden `votes(count)` y `replies(count)`. PostgREST resuelve el conteo
en la misma llamada aprovechando las claves foráneas. Menos código y
sin riesgo de descuadres.

**Un voto es una fila.** Dos índices únicos parciales garantizan un voto
por persona y objeto. El intento de votar dos veces devuelve el error
`23505` de PostgreSQL, que la interfaz ignora silenciosamente.

**Tiempo real.** Las tablas están en la publicación
`supabase_realtime`, así que Supabase envía los cambios por WebSocket.
Al recibir uno, la interfaz vuelve a pedir los datos en lugar de
aplicar el cambio a mano: es algo menos eficiente, pero elimina toda
una clase de errores de sincronización.

**Respuesta optimista en los votos.** El contador sube en pantalla antes
de que el servidor conteste, porque esperar medio segundo para ver un
`+1` se nota mucho. Si la escritura falla, la siguiente recarga corrige
el número.

**Borrado en cascada.** Al borrar un tema desaparecen sus respuestas y
sus votos, y al borrar una cuenta desaparece todo lo suyo. Lo resuelve
el `on delete cascade` del esquema, no el código de la aplicación.

---

## Límites conocidos

- El plan gratuito de Supabase pausa el proyecto tras una semana sin
  actividad. Se reactiva desde el panel en un minuto, pero conviene
  entrar unos días antes de una demostración.
- La búsqueda filtra en el navegador sobre los 400 temas ya cargados.
  Para un foro grande habría que usar la búsqueda de texto completo de
  PostgreSQL.
- No hay paginación: se cargan los 400 temas más recientes.
- El formato de texto es mínimo: negrita con `**` y enlaces
  automáticos. El HTML se escapa siempre antes de insertarlo, para
  evitar inyección de scripts.

---

## Posibles mejoras

Notificaciones por correo con Edge Functions, subida de fotos de
progreso con Supabase Storage, etiquetas además de categorías,
menciones con `@`, y un ranking mensual de quién más ayuda.
