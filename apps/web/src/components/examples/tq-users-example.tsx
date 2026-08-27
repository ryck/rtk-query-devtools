import { fetchUsers } from "@rtk-query-devtools/demo-api";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function TqUsersExample() {
  const { data: users, isLoading } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users (a different key)</CardTitle>
        <CardDescription>
          A separate <code className="font-mono text-foreground">["users"]</code> query key in the
          same client. See how TanStack Query lists every key in one flat cache.
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
