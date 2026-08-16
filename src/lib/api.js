import { localClient } from '@/api/localClient';

export async function queryRepos(params) {
  const res = await localClient.functions.invoke('queryRepositories', params);
  return res.data;
}

export async function runIngestion() {
  const res = await localClient.functions.invoke('runIngestion', {});
  return res.data;
}

export async function recalculateScores() {
  const res = await localClient.functions.invoke('recalculateScores', {});
  return res.data;
}

export async function reclassifyRepos() {
  const res = await localClient.functions.invoke('reclassifyRepos', {});
  return res.data;
}