import { useListUsersQuery } from "@rtk-query-devtools/demo-api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function UsersPanel() {
  const { data: users, isLoading } = useListUsersQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users (second API)</CardTitle>
        <CardDescription>
          A completely separate <code>createApi</code> instance with its own reducer path. The
          devtools panel's toolbar will show an API selector once it detects more than one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {users?.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between rounded-md border p-2.5 text-sm"
              >
                {user.name}
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
