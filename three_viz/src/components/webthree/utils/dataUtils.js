export async function readAndProcessData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const rawData = await response.text();
    return processData(rawData);
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
}

export function processData(rawData) {
  const data = rawData.trim().split(/\s+/).map(Number);
  const numGroups = data[0];
  const result = [];

  let index = 1;

  for (let i = 0; i < numGroups; i++) {
    const numPoints = data[index++];
    const numTriangles = data[index++];

    const vertices = [];
    for (let j = 0; j < numPoints; j++) {
      const x = data[index++];
      const y = data[index++];
      const z = data[index++];
      vertices.push(x, y, z);
    }

    const indices = [];
    for (let j = 0; j < numTriangles; j++) {
      const a = data[index++];
      const b = data[index++];
      const c = data[index++];
      indices.push(a, b, c);
    }

    result.push({ vertices, indices });
  }

  return result;
}
