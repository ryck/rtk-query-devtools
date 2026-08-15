import { useListUsersQuery } from "@rtk-query-devtools/demo-api";
import { Card } from "@/components/ui/card";

export function UsersExample() {
  const { data: users, isLoading } = useListUsersQuery();

  return (
    <Card>
      <h3 className="text-sm font-semibold text-paper">Users (a second API)</h3>
      <p className="mt-1 text-sm text-mist">
        A completely separate <code className="font-mono text-paper">createApi</code> instance. The
        devtools panel's toolbar shows an API selector once it detects more than one.
      </p>
      <ul className="mt-4 flex flex-col gap-1.5">
        {isLoading ? (
          <li className="font-mono text-sm text-mist">Loading…</li>
        ) : (
          users?.map((user) => (
            <li
              key={user.id}
              className="flex items-center justify-between rounded-md border border-panel-line px-3 py-2 font-mono text-sm text-paper"
            >
              {user.name}
              <span
                className={
                  user.role === "admin"
                    ? "rounded-full bg-amber/15 px-2 py-0.5 text-[10px] tracking-wide text-amber uppercase"
                    : "rounded-full bg-panel-line/60 px-2 py-0.5 text-[10px] tracking-wide text-mist uppercase"
                }
              >
                {user.role}
              </span>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}
