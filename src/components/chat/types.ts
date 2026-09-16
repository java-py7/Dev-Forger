export type ChatUser = {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  image: string | null;
  profile?: {
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    githubUrl?: string | null;
    linkedinUrl?: string | null;
    availability?: "AVAILABLE" | "BUSY" | "NOT_AVAILABLE" | string;
    roles?: {
      role: {
        id: string;
        name: string;
      };
    }[];
  } | null;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
};

export type ChatConversation = {
  id: string;
  type: "DIRECT" | "PROJECT" | "TEAM";
  name: string | null;
  projectId: string | null;
  project?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  updatedAt: string;
  createdAt: string;
  members: {
    id: string;
    userId: string;
    joinedAt: string;
    user: ChatUser;
  }[];
  lastMessage?: ChatMessage | null;
  unreadCount?: number;
};

export type FullDeveloperProfile = {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  image: string | null;
  profile: {
    bio: string | null;
    location: string | null;
    website: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    availability: string;
    workMode?: string | null;
    collaborationPreference: string | null;
    preferredProjectSize: string | null;
    roles: {
      role: {
        id: string;
        name: string;
        description: string | null;
      };
    }[];
    lookingFor: {
      lookingFor: {
        id: string;
        name: string;
      };
    }[];
    interests: {
      interest: {
        id: string;
        name: string;
        category: string | null;
      };
    }[];
  } | null;
  userSkills: {
    level: number;
    yearsOfExperience: number;
    skill: {
      name: string;
      category: string | null;
    };
  }[];
};
