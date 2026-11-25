# Spotter · Foro

Foro de la comunidad de Spotter, una app de gimnasio. Proyecto de la
asignatura Enginyeria d'Aplicacions (EETAC).

**Es de solo lectura y público**: cualquiera puede entrar y leer, sin
registrarse ni iniciar sesión. Los temas y respuestas los publica el
administrador directamente en la base de datos. Solo hay publicaciones, sin
respuestas. Pueden llevar
adjunta una rutina o una marca personal; el foro calcula el volumen y el
1RM estimado con la fórmula de Epley.

La interfaz sigue la línea gráfica de Spotter v1 (tema oscuro por
defecto, claro si el sistema lo pide; Spotter Display + Hanken Grotesk).

---

## Cómo está montado

| Capa | Tecnología | Dónde |
|---|---|---|
| Interfaz | HTML, CSS y JavaScript sin framework (módulos ES) | `index.html`, `css/`, `js/app.js` |
| Acceso a datos (solo lectura) | Cliente de Supabase | `js/data.js` |
| Base de datos | Supabase (PostgreSQL) | `supabase/schema.sql`, `supabase/seed.sql` |
| Hosting | Vercel, desplegado desde GitHub | `vercel.json` |

No hay proceso de compilación: los archivos se sirven tal cual.

```
spotter/
├─ index.html            Cabecera, menú de categorías y contenedor principal
├─ vercel.json           Cabeceras de seguridad y URLs limpias
├─ assets/               Logos (oscuro/claro), símbolo e icono de app
├─ fonts/                Spotter Display (Regular y Bold)
├─ css/styles.css        Estilos y tokens de la línea gráfica
├─ js/
│  ├─ config.js          URL y clave pública de Supabase
│  ├─ data.js            Única capa que habla con la base de datos (solo lecturas)
│  └─ app.js             Estado, renderizado y eventos
└─ supabase/
   ├─ schema.sql         Tablas, lectura pública y tiempo real
   └─ seed.sql           Autores y publicaciones de ejemplo (inventados)
```

---

## Seguridad: quién puede escribir

La clave `anon` de `js/config.js` es pública por diseño. Lo que protege
los datos es la base de datos:

- Las tres tablas (`profiles`, `threads`, `replies`) tienen RLS activado
  y **solo una política de lectura**. No existe ninguna de escritura.
- Además, a los roles `anon` y `authenticated` se les ha retirado el
  permiso `INSERT/UPDATE/DELETE/TRUNCATE`.
- Resultado: desde el navegador solo se puede leer. Quien accede a la
  base (SQL Editor, panel de Supabase o el servidor MCP) escribe sin
  restricciones porque salta RLS.

La clave `service_role` no debe salir nunca del panel de Supabase.

---

## Puesta en marcha

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor** ejecuta `supabase/schema.sql` y, si quieres datos de
   ejemplo, `supabase/seed.sql`. Ambos son idempotentes.
3. Pon la URL y la clave publicable en `js/config.js`
   (Project Settings → API).
4. Servidor local: `python -m http.server 5500` y abre
   `http://localhost:5500`.
5. Despliegue: importa el repositorio en Vercel. No hace falta configurar
   nada más.

---

## Cómo añadir contenido

Desde el SQL Editor de Supabase (o pidiéndoselo a Claude):

```sql
-- 1. Un autor (nombre público)
insert into public.profiles (username) values ('nuevo_autor');

-- 2. Un tema (category: rutinas, tecnica, progreso, nutricion, app, general)
insert into public.threads (title, body, category, author_id)
values ('Título del tema', 'Texto. Usa **negrita** si quieres.', 'general',
        (select id from public.profiles where username = 'nuevo_autor'));
```

- **Adjuntos** (`attachment`, JSON):
  `{"type":"pr","ex":"Sentadilla","kg":120,"reps":3}` o
  `{"type":"routine","name":"Empuje A","items":[{"ex":"Press banca","sets":4,"reps":6,"kg":70}]}`.
- **Fijar un tema**: `update public.threads set pinned = true where id = '…';`
- **Votos**: son un número (`score`) en cada publicación, no hay votos
  de usuarios.
- Las pestañas abiertas reciben los cambios sin recargar (tiempo real).

La tabla `replies` sigue en el esquema, pero la web no la usa.
