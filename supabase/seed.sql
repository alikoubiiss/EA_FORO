-- ============================================================
--  Spotter · datos de ejemplo del foro
--  Autores y publicaciones inventados para llenar el foro.
--  Es aditivo e idempotente (ids fijos + on conflict do nothing):
--  no toca los temas que ya existan. Las fechas son relativas a
--  "ahora", así que el foro siempre parece reciente.
--  Para quitarlo todo:  delete from public.profiles
--    where id::text like 'a0000000-0000-0000-0000-%';
--  (sus publicaciones caen en cascada).
-- ============================================================

insert into public.profiles (id, username, created_at) values
  ('a0000000-0000-0000-0000-000000000001', 'marc_gym',         now() - interval '70 days'),
  ('a0000000-0000-0000-0000-000000000002', 'aina.fit',         now() - interval '65 days'),
  ('a0000000-0000-0000-0000-000000000003', 'jordi_pesas',      now() - interval '60 days'),
  ('a0000000-0000-0000-0000-000000000004', 'nuria_trains',     now() - interval '58 days'),
  ('a0000000-0000-0000-0000-000000000005', 'sergi_deadlift',   now() - interval '55 days'),
  ('a0000000-0000-0000-0000-000000000006', 'carla_entrena',    now() - interval '50 days'),
  ('a0000000-0000-0000-0000-000000000007', 'pau_hipertrofia',  now() - interval '48 days'),
  ('a0000000-0000-0000-0000-000000000008', 'ines.moves',       now() - interval '45 days'),
  ('a0000000-0000-0000-0000-000000000009', 'dani_calistenia',  now() - interval '40 days'),
  ('a0000000-0000-0000-0000-000000000010', 'equipo_spotter',   now() - interval '90 days')
on conflict (id) do nothing;

-- ---------------- Temas ----------------
insert into public.threads (id, title, body, category, attachment, author_id, pinned, score, created_at) values

('b0000000-0000-0000-0000-000000000001',
 'Bienvenida al foro de Spotter: cómo sacarle partido',
 $$Aquí puedes leer rutinas, consejos de técnica, marcas y novedades, sin cuenta y sin registrarte.

Los temas los publica el equipo de Spotter. Cada categoría tiene su rincón: **Rutinas** para planes de entrenamiento, **Técnica** para ejecución y movilidad, **Progreso y marcas** para estancamientos y récords, **Nutrición** para comida y recuperación, y **La app** para novedades y sugerencias.

Las rutinas y marcas adjuntas calculan el volumen y el 1RM estimado con la fórmula de Epley. Nunca entrenas solo.$$,
 'app', null, 'a0000000-0000-0000-0000-000000000010', true, 31, now() - interval '21 days'),

('b0000000-0000-0000-0000-000000000002',
 'Push/Pull/Legs de cinco días: así organizo el día de pierna',
 $$Llevo cuatro meses con este PPL de cinco días (empuje, tirón y pierna, más torso y pierna el fin de semana). Mi objetivo es ganar masa sin pasar de una hora por sesión.

El día de pierna es el que más se me alarga y a veces acabo con las piernas tan cargadas que el día siguiente de tirón rindo peor. Os dejo el día de pierna A. La prensa solo la meto cuando bajo el peso de la sentadilla, y así el tirón del día siguiente va mucho mejor.$$,
 'rutinas',
 '{"type":"routine","name":"Pierna A","items":[{"ex":"Sentadilla trasera","sets":4,"reps":6,"kg":100},{"ex":"Prensa de piernas","sets":3,"reps":10,"kg":180},{"ex":"Peso muerto rumano","sets":3,"reps":8,"kg":90},{"ex":"Curl femoral tumbado","sets":3,"reps":12,"kg":40},{"ex":"Elevación de gemelos","sets":4,"reps":15,"kg":80}]}'::jsonb,
 'a0000000-0000-0000-0000-000000000001', false, 14, now() - interval '12 days'),

('b0000000-0000-0000-0000-000000000003',
 'Cuerpo completo en 3 días para volver tras seis meses sin entrenar',
 $$Vuelvo al gimnasio después de medio año parada por trabajo. Tengo tiempo para tres sesiones de 60 minutos a la semana y quiero algo sencillo para no abandonar a las dos semanas.

Mi idea es alternar A/B/A una semana y B/A/B la siguiente, con sentadilla o prensa, un empuje, un tirón y algo de core en cada sesión. Las dos primeras semanas voy con cargas ligeras: el músculo vuelve rápido, pero los tendones tardan más.$$,
 'rutinas', null, 'a0000000-0000-0000-0000-000000000002', false, 8, now() - interval '9 days'),

('b0000000-0000-0000-0000-000000000004',
 'Peso muerto: cómo dejé de redondear la zona lumbar',
 $$En las últimas repeticiones de mis series de 5 se me redondeaba la zona lumbar, sobre todo con 110 kg o más. Grabarme de lado me ayudó a verlo claro.

Tres cambios lo arreglaron: bajar a 100 kg, **bloquear los dorsales** antes de despegar, como si quisiera guardar un lápiz bajo cada axila, y cortar la serie en cuanto la espalda deja de estar neutra.$$,
 'tecnica', null, 'a0000000-0000-0000-0000-000000000003', false, 19, now() - interval '16 days'),

('b0000000-0000-0000-0000-000000000005',
 'Movilidad de tobillo para sentadilla profunda: qué me funcionó',
 $$Durante meses no conseguía bajar de paralelo sin que se me levantaran los talones. Lo que me ha funcionado, tres veces por semana y cinco minutos antes de entrenar:

**1.** Rodilla a la pared, dos series de 10 por lado, alejando el pie un poco cada semana.
**2.** Sentadilla goblet con pausa de 5 segundos abajo.
**3.** Estirar gemelos con la rodilla flexionada, 30 segundos.

En tres semanas bajé unos 4 cm más.$$,
 'tecnica', null, 'a0000000-0000-0000-0000-000000000008', false, 11, now() - interval '14 days'),

('b0000000-0000-0000-0000-000000000006',
 'Nuevo récord: 180 kg × 3 en peso muerto tras 14 semanas',
 $$Después de catorce semanas con una progresión lenta (de 160 a 180 kg en series de 3), por fin salió limpio. Nada de heroicidades: dos kilos más por semana y una semana de descarga cada cuarta.

Lo que más me ha ayudado: dormir siete horas y media como mínimo y no tocar el peso muerto más de una vez por semana.$$,
 'progreso',
 '{"type":"pr","ex":"Peso muerto","kg":180,"reps":3}'::jsonb,
 'a0000000-0000-0000-0000-000000000005', false, 27, now() - interval '5 days'),

('b0000000-0000-0000-0000-000000000007',
 'Cómo salí del estancamiento en 100 kg de press banca',
 $$Estuve ocho semanas atascado en 100 kg × 5, entrenando pecho dos veces por semana. Subir el peso y fallar no servía de nada.

Lo que funcionó: un día pesado de 3 a 5 repeticiones y otro de volumen de 8 a 12, un press con pausa de un segundo en el pecho y más trabajo de tríceps. Cuatro semanas después hice 102,5 kg × 5. Poco, pero se mueve.$$,
 'progreso', null, 'a0000000-0000-0000-0000-000000000007', false, 17, now() - interval '18 days'),

('b0000000-0000-0000-0000-000000000008',
 'Cuánta proteína tomo entrenando cuatro días',
 $$Se ven cifras para todos los gustos, pero para ganar músculo suele bastar con **entre 1,6 y 2,2 g por kilo** al día.

Peso 62 kg y me quedo en unos 110 g repartidos en cuatro comidas. Lo importante es llegar al total del día; el reparto exacto pesa bastante menos.$$,
 'nutricion', null, 'a0000000-0000-0000-0000-000000000006', false, 15, now() - interval '13 days'),

('b0000000-0000-0000-0000-000000000009',
 'Qué como antes de entrenar a las 7 de la mañana',
 $$Entreno antes de ir a trabajar y me levanto a las 6. No me sienta bien entrenar en ayunas, pero a esa hora tampoco me entra una comida completa.

Lo que mejor me va es algo ligero unos 40 minutos antes: un plátano con un yogur, o una tostada con miel, y un vaso de agua. El desayuno fuerte lo dejo para después.$$,
 'nutricion', null, 'a0000000-0000-0000-0000-000000000004', false, 4, now() - interval '3 days'),

('b0000000-0000-0000-0000-000000000010',
 'Sugerencia: duplicar una rutina de otro día',
 $$Tengo dos días de empuje muy parecidos y ahora mismo tengo que crear la segunda rutina desde cero. Sería muy útil poder duplicar una rutina y cambiar solo uno o dos ejercicios.

Otra idea: poder marcar un ejercicio como sustituible para saltar a una variante cuando la máquina está ocupada.$$,
 'app', null, 'a0000000-0000-0000-0000-000000000009', false, 21, now() - interval '8 days'),

('b0000000-0000-0000-0000-000000000011',
 'Cómo calcula la app el 1RM estimado (y cuándo fiarte de él)',
 $$El 1RM estimado usa la fórmula de Epley: **peso × (1 + repeticiones / 30)**. Con una sola repetición, el 1RM es el propio peso.

Ejemplo: 100 kg × 5 repeticiones da 116,7 kg. Funciona bien entre 2 y 8 repeticiones; por encima de 10 la estimación se vuelve optimista.

Úsalo para elegir cargas de trabajo, no para presumir de lo que levantarías un día bueno.$$,
 'app', null, 'a0000000-0000-0000-0000-000000000010', false, 18, now() - interval '4 days'),

('b0000000-0000-0000-0000-000000000012',
 'Música o silencio: cómo entreno según la sesión',
 $$Llevo unas semanas probando a entrenar sin auriculares y noto que me concentro más en las series pesadas: oigo cómo respiro y cuento mejor las repeticiones.

En el cardio es al revés y me aburro. Mi solución: silencio para las series difíciles y un pódcast para el cardio suave.$$,
 'general', null, 'a0000000-0000-0000-0000-000000000004', false, 12, now() - interval '10 days'),

('b0000000-0000-0000-0000-000000000013',
 'Mi primer mes en el gimnasio: lo que me hubiera gustado saber',
 $$Acabo de cumplir un mes yendo tres días a la semana. Algunas cosas que me habría gustado saber antes:

**1.** Apuntar todo desde el primer día, aunque sean series ridículas. Dentro de seis semanas agradecerás tener datos.
**2.** Las agujetas del segundo día son normales y no significan que lo estés haciendo mal.
**3.** Preguntar cuando no sepas usar una máquina. Nadie te juzga y evitas lesiones.
**4.** Dormir bien y calentar siempre, aunque sean cinco minutos.$$,
 'general', null, 'a0000000-0000-0000-0000-000000000006', false, 23, now() - interval '22 days'),

('b0000000-0000-0000-0000-000000000014',
 'Progresión de dominadas desde cero: plan de ocho semanas',
 $$Hace dos meses no hacía ni una dominada. Este es el plan que he seguido, dos días por semana, con la semana 1 de ejemplo. Cada semana añado una repetición a las excéntricas o paso a una goma más fina.

Hoy hice mi primera dominada limpia. Dejo la semana 1 por si a alguien le sirve.$$,
 'rutinas',
 '{"type":"routine","name":"Dominadas · semana 1","items":[{"ex":"Dominada con goma gruesa","sets":4,"reps":3,"kg":0},{"ex":"Excéntrica de 5 segundos","sets":3,"reps":3,"kg":0},{"ex":"Remo invertido","sets":3,"reps":8,"kg":0},{"ex":"Colgado activo (segundos)","sets":3,"reps":20,"kg":0},{"ex":"Face pull","sets":3,"reps":15,"kg":15}]}'::jsonb,
 'a0000000-0000-0000-0000-000000000009', false, 13, now() - interval '6 days'),

('b0000000-0000-0000-0000-000000000015',
 'Cómo anoto la fatiga entre sesiones',
 $$Además de series, repeticiones y cargas, ahora apunto **cómo llego a cada sesión** con una nota del 1 al 10, y las horas que he dormido.

Con unas semanas de datos es más fácil saber si una serie fallida viene de la técnica, del poco sueño o de la fatiga acumulada.$$,
 'progreso', null, 'a0000000-0000-0000-0000-000000000002', false, 5, now() - interval '2 days')

on conflict (id) do nothing;

-- ---------------- Fecha de actividad = fecha de publicación ----------------
update public.threads set last_activity = created_at
 where id::text like 'b0000000-0000-0000-0000-%';
