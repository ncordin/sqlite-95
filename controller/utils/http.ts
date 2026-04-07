export function useIndex(path: string, index: string) {
  return path === '' || path.slice(-1) === '/' ? `${path}${index}` : path;
}

export function make404(description: string, path: string) {
  console.log(`🔴 404 (${description}): ${displayPath(path)}`);
  return new Response(`404 (${description})`, { status: 404 });
}

export async function serveStaticFile(pathToFile: string, description: string) {
  const file = Bun.file(pathToFile);

  if ((await file.exists()) === false) {
    return make404(description, pathToFile);
  }

  console.log(`📄 ${description} ${displayPath(pathToFile)}`);
  return new Response(file);
}

export function joinPrefix(prefix: string, path: string) {
  const parts = [...prefix.split('/'), ...path.split('/')];
  const joined = parts.filter((part) => part).join('/');

  return joined ? `/${joined}/` : '/';
}

function removeCommunBeginning(a: string, b: string) {
  let currentIndex = 0;

  while (
    a[currentIndex + 1] &&
    a[currentIndex + 1] === b[currentIndex + 1] &&
    currentIndex < 255
  ) {
    currentIndex++;
  }

  return a.slice(currentIndex);
}

export function displayPath(path: string) {
  return removeCommunBeginning(path, Bun.main);
}
