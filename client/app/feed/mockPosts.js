export const mockPosts = [
  {
    id: "1",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600",
    caption: "Mountain views never get old 🏔️",
    location: "Aspen, Colorado",
    likes: ["user2", "user3", "user5"],
    commentCount: 2,
    createdAt: "2025-11-05T14:30:00Z",
    author: {
      id: "user1",
      username: "adventurer_alex",
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    comments: [
      {
        id: "c1",
        text: "Stunning shot!",
        author: { id: "user2", username: "nature_lover" },
      },
      {
        id: "c2",
        text: "I need to visit here!",
        author: { id: "user3", username: "travel_bug" },
      },
    ],
  },
  {
    id: "2",
    imageUrl: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600",
    caption: "Sunday brunch done right",
    location: "Brooklyn, NY",
    likes: ["user1", "user4", "user6", "user7"],
    commentCount: 12,
    createdAt: "2025-11-05T11:15:00Z",
    author: {
      id: "user4",
      username: "foodie_emma",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    comments: [
      {
        id: "c3",
        text: "Recipe please! 🙏",
        author: { id: "user1", username: "adventurer_alex" },
      },
    ],
  },
  {
    id: "3",
    imageUrl:
      "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600",
    caption: "Meet Luna, the newest member of the family 🐱",
    location: "San Francisco, CA",
    likes: ["user2", "user5", "user8"],
    commentCount: 15,
    createdAt: "2025-11-04T19:45:00Z",
    author: {
      id: "user5",
      username: "cat_dad_mike",
      avatar: "https://i.pravatar.cc/150?img=8",
    },
    comments: [
      {
        id: "c4",
        text: "So adorable!",
        author: { id: "user2", username: "nature_lover" },
      },
      {
        id: "c5",
        text: "Welcome home Luna!",
        author: { id: "user8", username: "pet_parent" },
      },
    ],
  },
  {
    id: "4",
    imageUrl:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600",
    caption: "Golden hour magic ✨",
    location: "Lake Tahoe, CA",
    likes: ["user1", "user3", "user4", "user6", "user9"],
    commentCount: 6,
    createdAt: "2025-11-04T16:20:00Z",
    author: {
      id: "user3",
      username: "travel_bug",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    comments: [],
  },
  {
    id: "5",
    imageUrl:
      "https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=600",
    caption: "Chasing waterfalls",
    location: "Portland, OR",
    likes: ["user2", "user7"],
    commentCount: 4,
    createdAt: "2025-11-03T13:00:00Z",
    author: {
      id: "user1",
      username: "adventurer_alex",
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    comments: [
      {
        id: "c6",
        text: "Which trail is this?",
        author: { id: "user7", username: "hiker_sam" },
      },
    ],
  },
];
