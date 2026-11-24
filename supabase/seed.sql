-- ============================================================
--  Spotter · datos de ejemplo del foro
--  Autores, temas y respuestas inventados para llenar el foro.
--  Es aditivo e idempotente (ids fijos + on conflict do nothing):
--  no toca los temas que ya existan. Las fechas son relativas a
--  "ahora", así que el foro siempre parece reciente.
--  Para quitarlo todo:  delete from public.profiles
--    where id::text like 'a0000000-0000-0000-0000-%';
--  (los temas y respuestas caen en cascada).
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
 $$Aquí puedes leer rutinas, dudas de técnica, marcas y novedades, sin cuenta y sin registrarte.

Los temas los publica el equipo de Spotter. Cada categoría tiene su rincón: **Rutinas** para planes de entrenamiento, **Técnica** para ejecución y movilidad, **Progreso y marcas** para estancamientos y récords, **Nutrición** para comida y recuperación, y **La app** para dudas y sugerencias.

Las rutinas y marcas adjuntas calculan el volumen y el 1RM estimado con la fórmula de Epley. Nunca entrenas solo.$$,
 'app', null, 'a0000000-0000-0000-0000-000000000010', true, 31, now() - interval '21 days'),

('b0000000-0000-0000-0000-000000000002',
 'Push/Pull/Legs de cinco días: ¿me sobra volumen de pierna?',
 $$Llevo cuatro meses con este PPL de cinco días (empuje, tirón y pierna, más torso y pierna el fin de semana). Mi objetivo es ganar masa sin pasar de una hora por sesión.

El día de pierna es el que más se me alarga y a veces acabo con las piernas tan cargadas que el día siguiente de tirón rindo peor. Os dejo el día de pierna A. ¿Quitaríais algo o lo dejáis tal cual?$$,
 'rutinas',
 '{"type":"routine","name":"Pierna A","items":[{"ex":"Sentadilla trasera","sets":4,"reps":6,"kg":100},{"ex":"Prensa de piernas","sets":3,"reps":10,"kg":180},{"ex":"Peso muerto rumano","sets":3,"reps":8,"kg":90},{"ex":"Curl femoral tumbado","sets":3,"reps":12,"kg":40},{"ex":"Elevación de gemelos","sets":4,"reps":15,"kg":80}]}'::jsonb,
 'a0000000-0000-0000-0000-000000000001', false, 14, now() - interval '12 days'),

('b0000000-0000-0000-0000-000000000003',
 'Cuerpo completo en 3 días para volver tras seis meses sin entrenar',
 $$Vuelvo al gimnasio después de medio año parada por trabajo. Tengo tiempo para tres sesiones de 60 minutos a la semana y quiero algo sencillo para no abandonar a las dos semanas.

Mi idea es alternar A/B/A una semana y B/A/B la siguiente, con sentadilla o prensa, un empuje, un tirón y algo de core en cada sesión. ¿Veis algún fallo o me falta algo?$$,
 'rutinas', null, 'a0000000-0000-0000-0000-000000000002', false, 8, now() - interval '9 days'),

('b0000000-0000-0000-0000-000000000004',
 'Peso muerto: se me redondea la zona lumbar al final de la serie',
 $$En las primeras repeticiones la espalda va neutra, pero en las dos o tres últimas noto que la zona lumbar se redondea, sobre todo con 110 kg o más. Hago series de 5.

Me grabé de lado y se ve claro. ¿Es cuestión de fuerza, de técnica o de ambas? No quiero lesionarme por insistir.$$,
 'tecnica', null, 'a0000000-0000-0000-0000-000000000003', false, 19, now() - interval '16 days'),

('b0000000-0000-0000-0000-000000000005',
 'Movilidad de tobillo para sentadilla profunda: qué me funcionó',
 $$Durante meses no conseguía bajar de paralelo sin que se me levantaran los talones. Lo que me ha funcionado, tres veces por semana y cinco minutos antes de entrenar:

**1.** Rodilla a la pared, dos series de 10 por lado, alejando el pie un poco cada semana.
**2.** Sentadilla goblet con pausa de 5 segundos abajo.
**3.** Estirar gemelos con la rodilla flexionada, 30 segundos.

En tres semanas bajé unos 4 cm más. ¿Alguien más lo ha probado?$$,
 'tecnica', null, 'a0000000-0000-0000-0000-000000000008', false, 11, now() - interval '14 days'),

('b0000000-0000-0000-0000-000000000006',
 'Nuevo récord: 180 kg × 3 en peso muerto tras 14 semanas',
 $$Después de catorce semanas con una progresión lenta (de 160 a 180 kg en series de 3), por fin salió limpio. Nada de heroicidades: dos kilos más por semana y una semana de descarga cada cuarta.

Lo que más me ha ayudado: dormir siete horas y media como mínimo y no tocar el peso muerto más de una vez por semana.$$,
 'progreso',
 '{"type":"pr","ex":"Peso muerto","kg":180,"reps":3}'::jsonb,
 'a0000000-0000-0000-0000-000000000005', false, 27, now() - interval '5 days'),

('b0000000-0000-0000-0000-000000000007',
 'Estancado en 100 kg de press banca desde hace dos meses',
 $$Llevo ocho semanas atascado en 100 kg × 5. Entreno el pecho dos veces por semana, duermo bien y como en un ligero superávit.

He probado a subir el peso un día y fallar, y a bajarlo y hacer más repeticiones, pero no avanzo. ¿Qué cambiaríais?$$,
 'progreso', null, 'a0000000-0000-0000-0000-000000000007', false, 17, now() - interval '18 days'),

('b0000000-0000-0000-0000-000000000008',
 '¿Cuánta proteína necesito de verdad si entreno cuatro días?',
 $$Veo cifras para todos los gustos: desde 1,2 g por kilo hasta 2,5 g. Peso 62 kg, entreno cuatro días con pesas y quiero ganar algo de músculo sin pasarme con las calorías.

¿Con cuántos gramos diarios os sentís bien y cómo los repartís?$$,
 'nutricion', null, 'a0000000-0000-0000-0000-000000000006', false, 15, now() - interval '13 days'),

('b0000000-0000-0000-0000-000000000009',
 'Qué como antes de entrenar a las 7 de la mañana',
 $$Entreno antes de ir a trabajar y me levanto a las 6. No soporto entrenar en ayunas, pero tampoco me entra una comida completa a esa hora.

Ahora tomo un plátano y un café y a veces me quedo sin energía a media sesión. ¿Qué os funciona que sea ligero y rápido?$$,
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
 '¿Entrenáis con música o en silencio?',
 $$Llevo semanas probando a entrenar sin auriculares y noto que me concentro más en las series pesadas, pero me aburro en el cardio.

¿Qué hacéis vosotros? ¿Tenéis alguna lista que os funcione para las series difíciles?$$,
 'general', null, 'a0000000-0000-0000-0000-000000000004', false, 12, now() - interval '10 days'),

('b0000000-0000-0000-0000-000000000013',
 'Mi primer mes en el gimnasio: lo que me hubiera gustado saber',
 $$Acabo de cumplir un mes yendo tres días a la semana. Algunas cosas que me habría gustado saber antes:

**1.** Apuntar todo desde el primer día, aunque sean series ridículas. Dentro de seis semanas agradecerás tener datos.
**2.** Las agujetas del segundo día son normales y no significan que lo estés haciendo mal.
**3.** Preguntar cuando no sepas usar una máquina. Nadie te juzga y evitas lesiones.

¿Qué añadiríais vosotros?$$,
 'general', null, 'a0000000-0000-0000-0000-000000000006', false, 23, now() - interval '22 days'),

('b0000000-0000-0000-0000-000000000014',
 'Progresión de dominadas desde cero: plan de ocho semanas',
 $$Hace dos meses no hacía ni una dominada. Este es el plan que he seguido, dos días por semana, con la semana 1 de ejemplo. Cada semana añado una repetición a las excéntricas o paso a una goma más fina.

Hoy hice mi primera dominada limpia. Dejo la semana 1 por si a alguien le sirve.$$,
 'rutinas',
 '{"type":"routine","name":"Dominadas · semana 1","items":[{"ex":"Dominada con goma gruesa","sets":4,"reps":3,"kg":0},{"ex":"Excéntrica de 5 segundos","sets":3,"reps":3,"kg":0},{"ex":"Remo invertido","sets":3,"reps":8,"kg":0},{"ex":"Colgado activo (segundos)","sets":3,"reps":20,"kg":0},{"ex":"Face pull","sets":3,"reps":15,"kg":15}]}'::jsonb,
 'a0000000-0000-0000-0000-000000000009', false, 13, now() - interval '6 days'),

('b0000000-0000-0000-0000-000000000015',
 '¿Cómo registráis la fatiga entre sesiones?',
 $$Apunto series, repeticiones y cargas, pero no sé cómo anotar lo cansada que llego a cada sesión. A veces fallo una serie y no sé si es mala técnica, poco sueño o fatiga acumulada.

¿Usáis alguna escala sencilla, como del 1 al 10, o dejáis una nota al lado de la sesión?$$,
 'progreso', null, 'a0000000-0000-0000-0000-000000000002', false, 5, now() - interval '2 days')

on conflict (id) do nothing;

-- ---------------- Respuestas ----------------
insert into public.replies (id, thread_id, author_id, body, score, created_at) values

-- 1 · bienvenida
('c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001',
 $$Genial tener un sitio donde ver rutinas completas con series, repeticiones y cargas. Lo del 1RM estimado en las marcas está muy bien.$$, 5, now() - interval '20 days 18 hours'),
('c0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002',
 $$¿Habrá categoría para movilidad y calentamiento? Ahora mismo lo metería en Técnica, que encaja bastante bien.$$, 3, now() - interval '20 days 6 hours'),
('c0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000010',
 $$Por ahora Técnica cubre movilidad y calentamiento. Si vemos que hay mucho contenido, lo separamos.$$, 4, now() - interval '19 days 20 hours'),

-- 2 · PPL
('c0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000005',
 $$Yo quitaría la prensa. Con sentadilla pesada y peso muerto rumano ya tienes cuádriceps y cadena posterior cubiertos. Pasarías de 17 a 14 series y el día de tirón lo notarías.$$, 9, now() - interval '11 days 16 hours'),
('c0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000008',
 $$Antes de tocar nada, mira cuánto descansas entre series. Si en la sentadilla descansas dos minutos y medio o tres, el día se alarga solo. Yo uso temporizador y me ahorra casi diez minutos.$$, 6, now() - interval '11 days 9 hours'),
('c0000000-0000-0000-0000-000000000006','b0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001',
 $$Probé a quitar la prensa dos semanas y el tirón del día siguiente mejoró mucho. Me quedo sin ella y la meto solo cuando bajo el peso de la sentadilla.$$, 7, now() - interval '9 days 20 hours'),

-- 3 · cuerpo completo
('c0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000006',
 $$Plan muy razonable. Empieza con cargas ligeras las dos primeras semanas aunque te sientas fuerte: el músculo vuelve rápido, los tendones tardan más.$$, 5, now() - interval '8 days 14 hours'),
('c0000000-0000-0000-0000-000000000008','b0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000003',
 $$Añade algo de trabajo de glúteo y espalda alta si pasas muchas horas sentada. El remo con mancuerna y el puente de glúteo cuestan poco tiempo.$$, 4, now() - interval '8 days 5 hours'),

-- 4 · peso muerto lumbar
('c0000000-0000-0000-0000-000000000009','b0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000005',
 $$Es muy típico: la fatiga te quita la tensión del dorsal. Dos cambios que me ayudaron: bajar el peso un 10 % y **bloquear los dorsales** antes de despegar, como si quisieras guardar un lápiz bajo cada axila. Si aun así se redondea en la repetición 3, detén la serie ahí.$$, 12, now() - interval '15 days 15 hours'),
('c0000000-0000-0000-0000-000000000010','b0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000008',
 $$Mira también la posición de salida. Si empiezas con las caderas muy bajas, la espalda acaba trabajando de más. Sube un poco las caderas y nota los isquios tensos antes de tirar.$$, 6, now() - interval '15 days 8 hours'),
('c0000000-0000-0000-0000-000000000011','b0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000003',
 $$Gracias a los dos. Bajé a 100 kg, fijé los dorsales y paré las series en 4 repeticiones. Esta semana me he grabado otra vez y la espalda va neutra de principio a fin.$$, 4, now() - interval '9 days 3 hours'),

-- 5 · movilidad tobillo
('c0000000-0000-0000-0000-000000000012','b0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000007',
 $$Yo añadí una cuña de 1 cm bajo los talones mientras mejoraba la movilidad y me fue genial para ir ganando profundidad sin forzar la rodilla.$$, 3, now() - interval '13 days 11 hours'),
('c0000000-0000-0000-0000-000000000013','b0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000009',
 $$El ejercicio de rodilla a la pared me cambió también las sentadillas búlgaras. Muy recomendable.$$, 2, now() - interval '13 days 2 hours'),

-- 6 · récord peso muerto
('c0000000-0000-0000-0000-000000000014','b0000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000001',
 $$Brutal. ¿Usas correas en las series pesadas o vas con agarre libre?$$, 4, now() - interval '4 days 20 hours'),
('c0000000-0000-0000-0000-000000000015','b0000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000005',
 $$Agarre libre hasta 160. Por encima uso correas para que el antebrazo no limite el trabajo de espalda.$$, 2, now() - interval '4 days 12 hours'),
('c0000000-0000-0000-0000-000000000016','b0000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000006',
 $$Enhorabuena. Esa idea de dos kilos por semana la voy a copiar para mi sentadilla.$$, 3, now() - interval '4 days 4 hours'),

-- 7 · estancado en banca
('c0000000-0000-0000-0000-000000000017','b0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000005',
 $$Prueba a variar el rango de repeticiones: un día pesado de 3 a 5 reps y otro de volumen de 8 a 12 con menos peso. Y añade un press con pausa de un segundo en el pecho; te enseñará dónde falla la barra.$$, 8, now() - interval '17 days 16 hours'),
('c0000000-0000-0000-0000-000000000018','b0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000002',
 $$¿Cómo está tu tríceps? Muchas veces el estancamiento en banca es de tríceps. Meter fondos y extensiones dos veces a la semana me desbloqueó.$$, 3, now() - interval '17 days 7 hours'),
('c0000000-0000-0000-0000-000000000019','b0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000008',
 $$Y revisa los hombros: si los llevas adelante al bajar la barra pierdes fuerza. Escápulas juntas y abajo.$$, 2, now() - interval '16 days 20 hours'),
('c0000000-0000-0000-0000-000000000020','b0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000007',
 $$Actualizo: hice lo del press con pausa y subí el tríceps. Esta semana 102,5 kg × 5. Poco, pero se mueve.$$, 5, now() - interval '12 days 3 hours'),

-- 8 · proteína
('c0000000-0000-0000-0000-000000000021','b0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000004',
 $$La mayoría de estudios sitúan el punto útil entre 1,6 y 2,2 g por kilo. Con 62 kg, entre 100 y 135 g. Yo me quedo en 1,8 y reparto en cuatro comidas de 25 a 30 g.$$, 7, now() - interval '12 days 18 hours'),
('c0000000-0000-0000-0000-000000000022','b0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000009',
 $$No te obsesiones con el reparto exacto. Lo importante es llegar al total del día; el reparto pesa bastante menos.$$, 4, now() - interval '12 days 8 hours'),
('c0000000-0000-0000-0000-000000000023','b0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000006',
 $$Gracias. Voy a probar con 110 g en cuatro comidas y lo mantengo un mes antes de tocarlo.$$, 3, now() - interval '11 days 22 hours'),

-- 10 · sugerencia duplicar rutina
('c0000000-0000-0000-0000-000000000024','b0000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000010',
 $$Gracias por la sugerencia, Dani. La apuntamos para valorarla. Lo de las variantes por si la máquina está ocupada también nos parece interesante.$$, 9, now() - interval '7 days 15 hours'),
('c0000000-0000-0000-0000-000000000025','b0000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000001',
 $$Apoyo lo de duplicar. Ahora mismo lo copio y pego a mano en las notas.$$, 3, now() - interval '7 days 6 hours'),

-- 11 · 1RM
('c0000000-0000-0000-0000-000000000026','b0000000-0000-0000-0000-000000000011','a0000000-0000-0000-0000-000000000001',
 $$Muy útil. Siempre usaba tablas de porcentajes a ojo y esto lo deja mucho más claro.$$, 6, now() - interval '3 days 18 hours'),
('c0000000-0000-0000-0000-000000000027','b0000000-0000-0000-0000-000000000011','a0000000-0000-0000-0000-000000000005',
 $$Con series de 3 me ha clavado bastante lo que luego he levantado de verdad. Con series de 12 me daba 15 kg de más.$$, 4, now() - interval '3 days 9 hours'),

-- 12 · música
('c0000000-0000-0000-0000-000000000028','b0000000-0000-0000-0000-000000000012','a0000000-0000-0000-0000-000000000009',
 $$Música para calentar y cardio, silencio en las series pesadas. Me ayuda a oír cómo respiro y a contar bien las repeticiones.$$, 4, now() - interval '9 days 20 hours'),
('c0000000-0000-0000-0000-000000000029','b0000000-0000-0000-0000-000000000012','a0000000-0000-0000-0000-000000000002',
 $$Yo siempre con música. Sin ella me distraigo mirando el móvil entre series.$$, 3, now() - interval '9 days 12 hours'),
('c0000000-0000-0000-0000-000000000030','b0000000-0000-0000-0000-000000000012','a0000000-0000-0000-0000-000000000003',
 $$Un solo auricular puesto: oigo la música, pero también al compañero si me pide algo.$$, 2, now() - interval '9 days 4 hours'),
('c0000000-0000-0000-0000-000000000031','b0000000-0000-0000-0000-000000000012','a0000000-0000-0000-0000-000000000006',
 $$Pódcast en el cardio de zona 2. Se me pasa la hora sin darme cuenta.$$, 5, now() - interval '8 days 22 hours'),

-- 13 · primer mes
('c0000000-0000-0000-0000-000000000032','b0000000-0000-0000-0000-000000000013','a0000000-0000-0000-0000-000000000003',
 $$Añadiría: dormir bien. Se nota más que cualquier suplemento.$$, 6, now() - interval '21 days 14 hours'),
('c0000000-0000-0000-0000-000000000033','b0000000-0000-0000-0000-000000000013','a0000000-0000-0000-0000-000000000008',
 $$Y calentar siempre, aunque sean cinco minutos. Las primeras semanas me lo saltaba y lo pagaba en las rodillas.$$, 4, now() - interval '21 days 3 hours'),

-- 14 · dominadas
('c0000000-0000-0000-0000-000000000034','b0000000-0000-0000-0000-000000000014','a0000000-0000-0000-0000-000000000008',
 $$Enhorabuena por la primera dominada. Las excéntricas son oro. Yo añadí colgados con las escápulas activas y me ayudó a engancharme mejor.$$, 4, now() - interval '5 days 17 hours'),
('c0000000-0000-0000-0000-000000000035','b0000000-0000-0000-0000-000000000014','a0000000-0000-0000-0000-000000000005',
 $$Plan sensato. Cuida la frecuencia: dos días está bien; tres seguidos suele acabar en dolor de codo.$$, 3, now() - interval '5 days 8 hours')

on conflict (id) do nothing;

-- ---------------- Última actividad = última respuesta (o la creación) ----------------
update public.threads t
   set last_activity = coalesce((select max(r.created_at) from public.replies r where r.thread_id = t.id), t.created_at)
 where t.id::text like 'b0000000-0000-0000-0000-%';

-- ---------------- Respuestas marcadas como solución ----------------
update public.threads set solved_reply_id = 'c0000000-0000-0000-0000-000000000004' where id = 'b0000000-0000-0000-0000-000000000002';
update public.threads set solved_reply_id = 'c0000000-0000-0000-0000-000000000009' where id = 'b0000000-0000-0000-0000-000000000004';
update public.threads set solved_reply_id = 'c0000000-0000-0000-0000-000000000017' where id = 'b0000000-0000-0000-0000-000000000007';
update public.threads set solved_reply_id = 'c0000000-0000-0000-0000-000000000021' where id = 'b0000000-0000-0000-0000-000000000008';
