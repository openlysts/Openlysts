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