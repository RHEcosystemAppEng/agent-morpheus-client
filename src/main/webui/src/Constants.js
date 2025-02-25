export const supportedLanguages = [
  {
    value: 'Go',
    children: 'Go'
  },
  {
    value: 'Python',
    children: 'Python'
  },
  {
    value: 'Dockerfile',
    children: 'Dockerfile'
  },
  {
    value: 'Java',
    children: 'Java'
  },
  {
    value: 'TypeScript',
    children: 'TypeScript'
  },
  {
    value: 'JavaScript',
    children: 'JavaScript'
  },
];

export const metadataColors = {
  "batch_id": "blue",
  "user": "orange",
  "vulnId": "red"
};

export const getMetadataColor = (field) => {
  if(metadataColors[field] !== undefined) {
    return metadataColors[field];
  }
  return "grey";
}