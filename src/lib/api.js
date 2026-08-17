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
  // Mock function to simulate backend YouTube video fetch in offline mode
  await new Promise(resolve => setTimeout(resolve, 800));
  return {
    videos: [
      {
        video_id: 'dQw4w9WgXcQ',
        title: `Understanding ${repoName} in 5 Minutes`,
        channel: 'Tech Explainer'
      },
      {
        video_id: 'jNQXAC9IVRw',
        title: `${repoName} Full Tutorial for Beginners`,
        channel: 'Dev Mastery'
      }
    ]
  };
}