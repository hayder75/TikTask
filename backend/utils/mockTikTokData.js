const mockUsers = {
  'marketer1': { username: 'marketer1', profile: 'https://tiktok.com/@marketer1', followerCount: 10000, like_count: 500, view_count: 5000, comment_count: 50 },
  'marketer2': { username: 'marketer2', profile: 'https://tiktok.com/@marketer2', followerCount: 15000, like_count: 700, view_count: 7000, comment_count: 70 },
};

const assignMockTikTokData = (name) => {
  const userData = mockUsers[name.toLowerCase()];
  return userData ? {
    tiktokUsername: userData.username,
    tiktokProfile: userData.profile,
    followerCount: userData.followerCount,
  } : null;
};

const getMockVideoInfo = (videoId) => {
  const user = Object.values(mockUsers).find(u => u.username === 'marketer1'); // Simplified mock
  return user ? {
    username: user.username,
    like_count: user.like_count,
    view_count: user.view_count,
    comment_count: user.comment_count,
  } : { username: '', like_count: 0, view_count: 0, comment_count: 0 };
};

module.exports = { assignMockTikTokData, getMockVideoInfo };