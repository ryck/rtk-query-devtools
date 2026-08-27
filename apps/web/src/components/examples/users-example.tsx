import { useListUsersQuery } from "@rtk-query-devtools/demo-api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function UsersExample() {
  const { data: users, isLoading } = useListUsersQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users (a second API)</CardTitle>
        <CardDescription>
          A completely separate <code className="font-mono text-foreground">createApi</code>{" "}
          instance. The devtools panel's toolbar shows an API selector once it detects more than
          one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-1.5">
          {isLoading ? (
            <li className="font-mono text-sm text-muted-foreground">Loading…</li>
          ) : (
            users?.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 font-mono text-sm text-foreground"
              >
                {user.name}
                <Badge
                  variant="secondary"
                  className={
                    user.role === "admin"
                      ? "bg-primary/15 text-[10px] tracking-wide text-primary uppercase"
                      : "bg-secondary text-[10px] tracking-wide text-muted-foreground uppercase"
                  }
                >
                  {user.role}
                </Badge>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
