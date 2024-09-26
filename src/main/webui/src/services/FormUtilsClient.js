import { supportedLanguages } from "../Constants";

const GITHUB_PREFIX = 'https://github.com/';

export const GetGitHubLanguages = (repoUrl) => {
  if (!repoUrl.startsWith(GITHUB_PREFIX)) {
    return Promise.resolve([]);
  }
  const repo = repoUrl.replace(GITHUB_PREFIX, '');
  const params = new URLSearchParams({
    'repository': repo
  });

  return fetch(`/form/git-languages?${params}`)
    .then(response => response.json())
    .then(data => {
        const valid = supportedLanguages.map(i => i.value);
        return data.filter(l => valid.includes(l));
    }).catch(_ => []);
}