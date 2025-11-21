import { mockPosts } from "./posts";

export const mockScrapbooks = [
  {
    id: "s1",
    title: "Coastal Calm",
    description: "Sun-washed afternoons and breezy boardwalk strolls.",
    coverImage: mockPosts[0].image,
    postIds: ["p1", "p8", "p2"],
    postCount: 6,
  },
  {
    id: "s2",
    title: "City Glow",
    description: "Neon nights, ramen stops, and rooftops above the crowds.",
    coverImage: mockPosts[5].image,
    postIds: ["p6", "p7"],
    postCount: 4,
  },
  {
    id: "s3",
    title: "Mountain Air",
    description: "Hazy summits, pine trails, and sunrise coffee.",
    coverImage: mockPosts[2].image,
    postIds: ["p3", "p5"],
    postCount: 3,
  },
  {
    id: "s4",
    title: "Market Mornings",
    description: "Fresh florals, pastel pastries, and warm chatter.",
    coverImage: mockPosts[3].image,
    postIds: ["p4"],
    postCount: 2,
  },
];
