export type UserProfile = {
  id: string;
  name: string;
  email: string;
  githubUsername: string | null;
  targetRoles: string[];
};
