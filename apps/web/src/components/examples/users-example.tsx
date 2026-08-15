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
          A completely separate <code className="font-mono text-paper">createApi</code> instance.
          The devtools panel's toolbar shows an API selector once it detects more than one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-1.5">
          {isLoading ? (
            <li className="font-mono text-sm text-mist">Loading…</li>
          ) : (
            users?.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between rounded-md border border-panel-line px-3 py-2 font-mono text-sm text-paper"
              >
                {user.name}
                <Badge
                  variant="secondary"
                  className={
                    user.role === "admin"
                      ? "bg-amber/15 text-[10px] tracking-wide text-amber uppercase"
                      : "bg-panel-line/60 text-[10px] tracking-wide text-mist uppercase"
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
