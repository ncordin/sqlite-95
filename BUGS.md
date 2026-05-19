🔴 Critique 1 — Troncature silencieuse des strings (encode.ts:52)

case 'string':  
 if (useEscaper) {  
 parameters.push((value as string).slice(0, field.maxLength)); // BUG ! (example null)
return '?';  
 }

Si tu insères/cherches une string plus longue que field.maxLength, elle est silencieusement tronquée.  
 Pas d'erreur, pas de warning, juste de la donnée perdue ou une lookup qui ne match pas.

C'est ce qui m'avait fait soupçonner le bug d'origine. Faut soit throw si overflow, soit log warning,  
 jamais silencieux. Le commentaire BUG ! du dev d'origine semble pointer là.

🔴 Critique 2 — increment() interpole le value en SQL brut (table.ts:142-153)

increment: (fieldName, value) => {  
 const escapedField = encodeName(String(fieldName));  
 return next({  
 sets: [..., { fieldName: ..., value: { _SQL: `${escapedField} + ${value}` } }],  
 });  
 }

value est interpolé directement dans la SQL. TypeScript dit "c'est un number", mais à runtime, si  
 quelqu'un passe "1; DROP TABLE accounts; --" (typage cassé, JSON externe, etc.), tu as une injection
SQL.

Fix trivial : Math.trunc(value) ou Number(value) || 0 avant interpolation, ou utiliser un paramètre ?  
 comme pour les strings.

🟠 Sérieux 4 — JSON.parse non protégé (callController.ts:60)

const bodyText = await request.text();  
 body = bodyText ? JSON.parse(bodyText) : {}; // TODO pkoi pas de try ?

Le commentaire du dev d'origine pose lui-même la question. Un client envoyant du JSON malformé fait  
 crasher le handler. Selon le runtime, ça peut soit retourner une 500 nue (avec stacktrace), soit  
 propager côté Bun. Un attaquant peut spammer du JSON invalide pour générer des erreurs et polluer tes  
 logs / monitoring.

Fix : try { body = JSON.parse(bodyText); } catch { return 400 réponse propre; }.

🟠 Sérieux 5 — Pas de try/catch autour du controller (callController.ts:154)

return Promise.resolve(controller(controllerRequest, controllerResponse))  
 .then((value) => { /_ ... _/ });

Pas de .catch(). Si un controller throw (synchronement ou async), l'erreur remonte et selon ce qui  
 l'attrape en amont, l'utilisateur peut voir une 500 avec stacktrace exposée. Tu devrais avoir un catch
global qui log et retourne une 500 propre.

🟠 Sérieux 6 — decode.ts peut retourner undefined typé comme valeur

function decode(value: unknown, field: AnyField) {  
 if (value === null) return null;  
 if (value === undefined) return undefined;
...  
 }

Si un champ est absent du résultat (colonne ajoutée en base mais pas en schéma, SELECT partiel, etc.),
tu obtiens { field: undefined }. Mais ton type TS dit field: string. Mensonge typé → bug subtil partout
dans les consumers. Devrait au moins throw ou retourner la valeur par défaut du field.

---

🟡 Mineurs mais à connaître

- encode.ts:45 — parseInt(value, 10) peut produire NaN → SQL devient WHERE id = NaN qui plante.
  Préférable d'utiliser Number() + check isFinite, ou throw clair sur invalide.
- encode.ts:73 (encodeName) — pas d'escape des backticks dans les noms de colonnes. Si jamais un nom de
  champ contient une backtick (improbable mais possible si dynamique), SQL cassée.
- bun.ts affectedRows — utilise SELECT CHANGES() après le run. Tant que run() reste synchrone côté Bun,
  OK. Si Bun bascule en async un jour, ça pète silencieusement. La clause RETURNING est plus sûre.
- bun.ts:10 — database est un singleton module-level. initDatabase appelé deux fois leak la première
  connexion (pas de .close()). Mineur, init n'est appelé qu'une fois en pratique.
- admin-router/api/download.ts:13 — Bun.file(fileName) avec fileName potentiellement undefined si  
  filter ne trouve rien.
