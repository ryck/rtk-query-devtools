export interface User {
  id: number;
  name: string;
  role: "admin" | "member";
}

const USERS: User[] = [
  { id: 1, name: "Ada Lovelace", role: "admin" },
  { id: 2, name: "Grace Hopper", role: "admin" },
  { id: 3, name: "Margaret Hamilton", role: "member" },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchUsers(): Promise<User[]> {
  await delay(300);
  return USERS;
}
