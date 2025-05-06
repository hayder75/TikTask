const mockUsers = [
    {
      open_id: 'user1_tiktok',
      username: 'marketer1',
      follower_count: 10000,
      profile_deep_link: 'https://tiktok.com/@marketer1',
    },
    {
      open_id: 'user2_tiktok',
      username: 'marketer2',
      follower_count: 50000,
      profile_deep_link: 'https://tiktok.com/@marketer2',
    },
  ];
  
  const mockVideos = [
    {
      id: '123456789',
      username: 'marketer1',
      like_count: 500,
      view_count: 10000,
    },
    {
      id: '987654321',
      username: 'marketer2',
      like_count: 2000,
      view_count: 50000,
    },
    {
      id: '111222333',
      username: 'other_user',
      like_count: 100,
      view_count: 2000,
    },
  ];
  
  const getMockUserInfo = (email) => {
    // Simulate fetching user info based on a mock TikTok signup
    const userIndex = Math.floor(Math.random() * mockUsers.length);
    return mockUsers[userIndex];
  };
  
  const getMockVideoInfo = (videoId) => {
    const video = mockVideos.find((v) => v.id === videoId);
    if (!video) {
      throw new Error('Video not found');
    }
    return video;
  };
  
  module.exports = { getMockUserInfo, getMockVideoInfo };