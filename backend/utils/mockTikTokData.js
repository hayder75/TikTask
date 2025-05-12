const mockUsers = [
  {
    username: 'marketer1',
    profile_url: 'https://tiktok.com/@marketer1',
    follower_count: 10000,
  },
  {
    username: 'marketer2',
    profile_url: 'https://tiktok.com/@marketer2',
    follower_count: 20000,
  },
  {
    username: 'marketer3',
    profile_url: 'https://tiktok.com/@marketer3',
    follower_count: 15000,
  },
];

const mockVideos = [
  {
    video_id: '123456789',
    username: 'marketer1',
    like_count: 500,
    view_count: 10000,
  },
  {
    video_id: '987654321',
    username: 'marketer2',
    like_count: 1000,
    view_count: 20000,
  },
  {
    video_id: '456789123',
    username: 'marketer3',
    like_count: 750,
    view_count: 15000,
  },
];

const mockTikTokSignup = (username) => {
  const user = mockUsers.find(u => u.username === username);
  if (!user) {
    return { success: false, message: 'User not found in mock data' };
  }
  return {
    success: true,
    username: user.username,
    profile_url: user.profile_url,
    follower_count: user.follower_count,
  };
};

const getMockVideoInfo = (videoId) => {
  return mockVideos.find(v => v.video_id === videoId) || {};
};

const assignMockTikTokData = (username) => {
  const user = mockUsers.find(u => u.username === username);
  if (!user) {
    return null;
  }
  return {
    tiktokUsername: user.username,
    tiktokProfile: user.profile_url,
    followerCount: user.follower_count,
  };
};

module.exports = { mockTikTokSignup, getMockVideoInfo, assignMockTikTokData };