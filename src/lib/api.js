import { localClient } from '@/api/localClient';

export async function queryRepos(params) {
  const res = await localClient.functions.invoke('queryRepositories', params);
  return res;
}

export async function runIngestion() {
  const res = await localClient.functions.invoke('runIngestion', {});
  return res;
}

export async function recalculateScores() {
  const res = await localClient.functions.invoke('recalculateScores', {});
  return res;
}

export async function reclassifyRepos() {
  const res = await localClient.functions.invoke('reclassifyRepos', {});
  return res;
}

export async function getRepoVideos(repoName) {
  const res = await localClient.functions.invoke('getRepoVideos', { repoName });
  return res;
}

export async function getRepoReadme(fullName, defaultBranch = 'main') {
  const res = await localClient.functions.invoke('getRepoReadme', { fullName, defaultBranch });
  return res;
}

export async function getSimilarRepos(fullName) {
  const res = await localClient.functions.invoke('getSimilarRepos', { fullName });
  return res;
}

export async function getRepoHistory(id) {
  const res = await localClient.functions.invoke('getRepoHistory', { id });
  return res;
}

export async function translateText(text, targetLang = 'en') {
  const res = await localClient.functions.invoke('translateText', { text, targetLang });
  return res;
}